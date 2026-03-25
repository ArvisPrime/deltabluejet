/**
 * Payment Service — Deltablue Jet Air
 *
 * All payment writes are routed through the `createPaymentIntent`
 * Cloud Function. Firestore rules block direct client writes to the
 * `payments` collection, so the function handles creation, booking
 * confirmation, and audit logging server-side.
 *
 * Read operations (getPaymentForBooking, getAllPayments) remain
 * client-side since rules permit authenticated reads.
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase.config';
import type { PaymentDoc, PaymentStatus } from '../types/firestore';
import { logAuditEntry } from './firestore';
import { onBookingConfirmed } from './notificationTriggers';

const paymentsRef = collection(db, 'payments');

// Cloud Function callables
const createPaymentIntentFn = httpsCallable<
    { bookingId: string; amount: number; currency: string },
    { clientSecret: string; paymentIntentId: string }
>(functions, 'createPaymentIntent');

const processRefundFn = httpsCallable(functions, 'processRefund');

// ─── E-Ticket Generation ───────────────────────────────────

export function generateETicketNumber(): string {
    const now = new Date();
    const datePart = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
    ].join('');
    // Crypto-random suffix — unique across sessions without a DB counter
    const randomPart = crypto.getRandomValues(new Uint32Array(1))[0]
        .toString(36)
        .toUpperCase()
        .slice(0, 6)
        .padStart(6, '0');
    return `DBJ-${datePart}-${randomPart}`;
}

// ─── Refund Rules Engine ───────────────────────────────────

export interface RefundCalculation {
    eligible: boolean;
    percentage: number;      // 100, 50, or 0
    refundAmount: number;    // in cents
    reason: string;
}

/**
 * Calculate refund amount based on fare rules.
 * Delegates to fareRulesService for fare-class-aware policies.
 * Falls back to basic tiered refund if no fare class provided.
 */
export function calculateRefund(
    amountPaid: number,
    departureDate: Date,
    fareClass: string = 'economy',
): RefundCalculation {
    const now = new Date();
    const hoursUntilDeparture = (departureDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Use the fare rules engine for fare-class-aware calculation
    // Inline import to avoid circular deps at module level
    const { calculateCancellationFee } = require('./fareRulesService');
    const result = calculateCancellationFee(fareClass, amountPaid, hoursUntilDeparture);

    return {
        eligible: result.eligible,
        percentage: result.refundPercent,
        refundAmount: result.refundAmount,
        reason: `${result.fareDisplayName} fare — ${result.tierLabel}. ${result.refundPercent}% refund.`,
    };
}

// ─── Payment via Cloud Function ────────────────────────────

/**
 * Create and process a payment through the Cloud Function.
 * The function handles writing to Firestore, confirming the booking,
 * and audit logging — all server-side where security rules permit.
 */
export async function createAndProcessPayment(data: {
    bookingId: string;
    amount: number;
    currency?: string;
}): Promise<{ success: boolean; paymentIntentId: string; eTicketNumber: string }> {
    const result = await createPaymentIntentFn({
        bookingId: data.bookingId,
        amount: data.amount,
        currency: data.currency || 'USD',
    });

    const eTicketNumber = generateETicketNumber();

    return {
        success: true,
        paymentIntentId: result.data.paymentIntentId,
        eTicketNumber,
    };
}

/**
 * @deprecated Use `createAndProcessPayment` instead.
 * Kept for backwards compatibility — delegates to the Cloud Function.
 */
export async function createPayment(data: {
    bookingId: string;
    amount: number;
    currency?: string;
    cardLast4: string;
    cardBrand: string;
    metadata: PaymentDoc['metadata'];
}): Promise<string> {
    const result = await createAndProcessPayment({
        bookingId: data.bookingId,
        amount: data.amount,
        currency: data.currency,
    });
    return result.paymentIntentId;
}

/**
 * @deprecated Use `createAndProcessPayment` instead.
 * Kept for backwards compatibility — payment is now atomic in the Cloud Function.
 */
export async function processPayment(_paymentId: string): Promise<{ success: boolean; eTicketNumber?: string }> {
    // Payment is now processed atomically by the Cloud Function during creation.
    // This function is kept for API compatibility but is a no-op.
    const eTicketNumber = generateETicketNumber();
    return { success: true, eTicketNumber };
}

// ─── Cloud Function callable for secure payment confirmation ──

const confirmPaymentSecureFn = httpsCallable<
    { bookingId: string; paymentIntentId?: string },
    { success: boolean; eTicketNumber: string }
>(functions, 'confirmPaymentSecure');

/**
 * Confirm payment and update booking status (via Cloud Function).
 * E-ticket number is generated server-side.
 */
export async function confirmPaymentAndBooking(
    paymentId: string,
    bookingId: string,
    _eTicketNumber: string,
    _userId: string,
): Promise<void> {
    await confirmPaymentSecureFn({
        bookingId,
        paymentIntentId: paymentId,
    });
}

/**
 * Process a refund based on fare rules.
 * Eligibility is calculated client-side for instant UX feedback;
 * the actual Firestore mutation goes through the Cloud Function.
 */
export async function processRefund(
    paymentId: string,
    bookingId: string,
    departureDate: Date,
    userId: string,
    reason: string,
): Promise<RefundCalculation> {
    const paymentSnap = await getDoc(doc(db, 'payments', paymentId));
    if (!paymentSnap.exists()) throw new Error('Payment not found');
    const payment = { id: paymentSnap.id, ...paymentSnap.data() } as PaymentDoc;

    const refundCalc = calculateRefund(payment.amount, departureDate);

    if (refundCalc.eligible && refundCalc.refundAmount > 0) {
        // Route through Cloud Function — has admin SDK write access
        await processRefundFn({
            bookingId,
            paymentIntentId: payment.stripePaymentIntentId || paymentId,
            amount: refundCalc.refundAmount,
        });

        // Audit log (writes to audit_logs, which is permitted via rules)
        await logAuditEntry({
            action: 'refund_processed',
            targetCollection: 'payments',
            targetId: paymentId,
            performedBy: userId,
            details: {
                bookingId,
                refundAmount: refundCalc.refundAmount,
                refundPercentage: refundCalc.percentage,
                reason,
            },
        });
    }

    return refundCalc;
}

/**
 * Get payment document for a booking.
 */
export async function getPaymentForBooking(bookingId: string): Promise<PaymentDoc | null> {
    const snap = await getDocs(query(paymentsRef, where('bookingId', '==', bookingId)));
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as PaymentDoc;
}

/**
 * Get all payments (admin).
 */
export async function getAllPayments(maxResults = 50): Promise<PaymentDoc[]> {
    const snap = await getDocs(query(paymentsRef));
    return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as PaymentDoc)
        .slice(0, maxResults);
}
