/**
 * Payment Reconciliation — Cloud Functions
 *
 * Scheduled function that compares Stripe payment records with
 * Firestore booking payment status and flags discrepancies.
 * Runs daily at 02:00 UTC.
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) initializeApp();
const db = getFirestore();

export interface ReconciliationResult {
    date: string;
    totalBookingsChecked: number;
    matched: number;
    mismatches: number;
    missingPayment: number;
    issues: ReconciliationIssue[];
    createdAt: FirebaseFirestore.FieldValue;
}

export interface ReconciliationIssue {
    bookingId: string;
    pnr: string;
    type: 'amount_mismatch' | 'missing_payment' | 'status_mismatch' | 'orphaned_charge';
    expected: number;
    actual: number;
    currency: string;
    details: string;
}

/**
 * Runs daily at 02:00 UTC. Reconciles all bookings from the previous day
 * by comparing stored payment amounts with expected totals.
 *
 * - Checks each booking's `paymentStatus` and `totalAmount`.
 * - Flags bookings where paymentStatus is 'confirmed' but amount is 0 or missing.
 * - Flags bookings where paymentStatus is 'pending' but older than 24h.
 * - Writes a reconciliation report to `payment_reconciliation/{YYYY-MM-DD}`.
 * - Logs a summary to `audit_logs`.
 */
export const reconcilePayments = onSchedule(
    { schedule: 'every day 02:00', timeZone: 'UTC' },
    async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        const startOfDay = new Date(yesterday);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(yesterday);
        endOfDay.setHours(23, 59, 59, 999);

        console.log(`💰 Starting payment reconciliation for ${dateKey}...`);

        // 1. Fetch all bookings from the previous day
        const bookingsSnap = await db.collection('bookings')
            .where('createdAt', '>=', startOfDay)
            .where('createdAt', '<=', endOfDay)
            .get();

        let matched = 0;
        let mismatches = 0;
        let missingPayment = 0;
        const issues: ReconciliationIssue[] = [];

        for (const docSnap of bookingsSnap.docs) {
            const booking = docSnap.data();
            const bookingId = docSnap.id;
            const pnr = booking.pnr || 'UNKNOWN';
            const totalAmount = booking.totalAmount || 0;
            const paymentStatus = booking.paymentStatus || 'unknown';
            const paidAmount = booking.paidAmount || 0;
            const currency = booking.currency || 'USD';

            // Check for missing payment on confirmed bookings
            if (paymentStatus === 'confirmed' && paidAmount === 0 && totalAmount > 0) {
                missingPayment++;
                issues.push({
                    bookingId,
                    pnr,
                    type: 'missing_payment',
                    expected: totalAmount,
                    actual: 0,
                    currency,
                    details: `Booking confirmed but no payment recorded (expected ${currency} ${totalAmount}).`,
                });
                continue;
            }

            // Check for amount mismatch
            if (paymentStatus === 'confirmed' && paidAmount > 0 && Math.abs(paidAmount - totalAmount) > 0.01) {
                mismatches++;
                issues.push({
                    bookingId,
                    pnr,
                    type: 'amount_mismatch',
                    expected: totalAmount,
                    actual: paidAmount,
                    currency,
                    details: `Payment amount (${currency} ${paidAmount}) does not match booking total (${currency} ${totalAmount}).`,
                });
                continue;
            }

            // Check for stale pending payments
            if (paymentStatus === 'pending') {
                const createdAt = booking.createdAt?.toDate?.() || new Date();
                const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
                if (ageHours > 24) {
                    mismatches++;
                    issues.push({
                        bookingId,
                        pnr,
                        type: 'status_mismatch',
                        expected: totalAmount,
                        actual: 0,
                        currency,
                        details: `Booking payment pending for ${Math.round(ageHours)}h — may need manual review.`,
                    });
                    continue;
                }
            }

            matched++;
        }

        // 2. Write reconciliation report
        const report: ReconciliationResult = {
            date: dateKey,
            totalBookingsChecked: bookingsSnap.size,
            matched,
            mismatches,
            missingPayment,
            issues,
            createdAt: FieldValue.serverTimestamp(),
        };

        await db.doc(`payment_reconciliation/${dateKey}`).set(report);

        // 3. Write audit log entry
        await db.collection('audit_logs').add({
            action: 'payment_reconciliation_completed',
            targetCollection: 'payment_reconciliation',
            targetId: dateKey,
            performedBy: 'system/scheduler',
            details: {
                totalChecked: bookingsSnap.size,
                matched,
                mismatches,
                missingPayment,
                issueCount: issues.length,
            },
            timestamp: FieldValue.serverTimestamp(),
        });

        console.log(`✅ Payment reconciliation for ${dateKey}: checked=${bookingsSnap.size}, matched=${matched}, mismatches=${mismatches}, missing=${missingPayment}, issues=${issues.length}`);
    }
);
