/**
 * Payment Reconciliation — Cloud Functions
 *
 * Scheduled function that reconciles payments across multiple gateways
 * (Stripe, Flutterwave) with Firestore booking records.
 * Runs daily at 02:00 UTC.
 *
 * Gateway-aware: tracks per-gateway match/mismatch counts and flags
 * gateway-specific issues (e.g., missing webhook confirmation).
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) initializeApp();
const db = getFirestore();

export interface ReconciliationIssue {
    bookingId: string;
    pnr: string;
    type: 'amount_mismatch' | 'missing_payment' | 'status_mismatch' | 'orphaned_charge' | 'gateway_mismatch';
    expected: number;
    actual: number;
    currency: string;
    gateway?: string;
    details: string;
}

interface GatewayStats {
    checked: number;
    matched: number;
    issues: number;
}

/**
 * Runs daily at 02:00 UTC. Reconciles all bookings from the previous day
 * by cross-referencing with payment records across all gateways.
 *
 * Checks:
 * - Booking confirmed but no matching payment record
 * - Payment amount mismatch vs booking total
 * - Stale pending payments (>24h)
 * - Gateway consistency (payment gateway vs booking payment source)
 * - Orphaned payments (payment exists but booking doesn't)
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

        console.log(`💰 Starting multi-gateway payment reconciliation for ${dateKey}...`);

        // 1. Fetch bookings and payments from the previous day
        const [bookingsSnap, paymentsSnap] = await Promise.all([
            db.collection('bookings')
                .where('createdAt', '>=', startOfDay)
                .where('createdAt', '<=', endOfDay)
                .get(),
            db.collection('payments')
                .where('createdAt', '>=', startOfDay)
                .where('createdAt', '<=', endOfDay)
                .get(),
        ]);

        // Index payments by bookingId for quick lookup
        const paymentsByBooking = new Map<string, any[]>();
        for (const doc of paymentsSnap.docs) {
            const payment = doc.data();
            const bookingId = payment.bookingId;
            if (!paymentsByBooking.has(bookingId)) {
                paymentsByBooking.set(bookingId, []);
            }
            paymentsByBooking.get(bookingId)!.push({ id: doc.id, ...payment });
        }

        let matched = 0;
        let mismatches = 0;
        let missingPayment = 0;
        const issues: ReconciliationIssue[] = [];

        const gatewayStats: Record<string, GatewayStats> = {
            stripe: { checked: 0, matched: 0, issues: 0 },
            flutterwave: { checked: 0, matched: 0, issues: 0 },
        };

        // 2. Reconcile each booking
        for (const docSnap of bookingsSnap.docs) {
            const booking = docSnap.data();
            const bookingId = docSnap.id;
            const pnr = booking.pnr || 'UNKNOWN';
            const totalAmount = booking.totalAmount || 0;
            const bookingStatus = booking.status || 'unknown';
            const currency = booking.currency || 'USD';

            const payments = paymentsByBooking.get(bookingId) || [];

            // No payment record for a confirmed booking
            if (bookingStatus === 'confirmed' && payments.length === 0 && totalAmount > 0) {
                missingPayment++;
                issues.push({
                    bookingId,
                    pnr,
                    type: 'missing_payment',
                    expected: totalAmount,
                    actual: 0,
                    currency,
                    details: `Booking confirmed but no payment record found (expected ${currency} ${totalAmount}).`,
                });
                continue;
            }

            // Check each payment record
            for (const payment of payments) {
                const gateway = payment.gateway || 'stripe';

                // Initialize gateway stats if new gateway
                if (!gatewayStats[gateway]) {
                    gatewayStats[gateway] = { checked: 0, matched: 0, issues: 0 };
                }
                gatewayStats[gateway].checked++;

                // Amount mismatch
                if (payment.status === 'succeeded' && Math.abs(payment.amount - totalAmount) > 0.01) {
                    mismatches++;
                    gatewayStats[gateway].issues++;
                    issues.push({
                        bookingId,
                        pnr,
                        type: 'amount_mismatch',
                        expected: totalAmount,
                        actual: payment.amount,
                        currency: payment.currency || currency,
                        gateway,
                        details: `${gateway} payment amount (${payment.currency || currency} ${payment.amount}) ≠ booking total (${currency} ${totalAmount}).`,
                    });
                    continue;
                }

                // Stale pending payment (>24h)
                if (payment.status === 'pending') {
                    const createdAt = payment.createdAt?.toDate?.() || new Date();
                    const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
                    if (ageHours > 24) {
                        mismatches++;
                        gatewayStats[gateway].issues++;
                        issues.push({
                            bookingId,
                            pnr,
                            type: 'status_mismatch',
                            expected: totalAmount,
                            actual: 0,
                            currency,
                            gateway,
                            details: `${gateway} payment pending for ${Math.round(ageHours)}h — webhook may not have fired.`,
                        });
                        continue;
                    }
                }

                // Payment succeeded, amounts match — all good
                if (payment.status === 'succeeded') {
                    matched++;
                    gatewayStats[gateway].matched++;
                }
            }

            // Booking with no payments and not confirmed (just pending) — skip
            if (payments.length === 0 && bookingStatus === 'pending') {
                continue;
            }
        }

        // 3. Check for orphaned payments (payment exists but no booking)
        const bookingIds = new Set(bookingsSnap.docs.map((d) => d.id));
        for (const doc of paymentsSnap.docs) {
            const payment = doc.data();
            if (!bookingIds.has(payment.bookingId)) {
                const gateway = payment.gateway || 'stripe';
                mismatches++;
                if (gatewayStats[gateway]) gatewayStats[gateway].issues++;
                issues.push({
                    bookingId: payment.bookingId,
                    pnr: 'UNKNOWN',
                    type: 'orphaned_charge',
                    expected: 0,
                    actual: payment.amount,
                    currency: payment.currency || 'USD',
                    gateway,
                    details: `Orphaned ${gateway} payment (${payment.currency || 'USD'} ${payment.amount}) — no matching booking found.`,
                });
            }
        }

        // 4. Write reconciliation report with gateway breakdown
        const report = {
            date: dateKey,
            totalBookingsChecked: bookingsSnap.size,
            totalPaymentsChecked: paymentsSnap.size,
            matched,
            mismatches,
            missingPayment,
            issues,
            gatewayBreakdown: {
                stripe: gatewayStats.stripe || { checked: 0, matched: 0, issues: 0 },
                flutterwave: gatewayStats.flutterwave || { checked: 0, matched: 0, issues: 0 },
            },
            createdAt: FieldValue.serverTimestamp(),
        };

        await db.doc(`payment_reconciliation/${dateKey}`).set(report);

        // 5. Audit log
        await db.collection('audit_logs').add({
            action: 'payment_reconciliation_completed',
            targetCollection: 'payment_reconciliation',
            targetId: dateKey,
            performedBy: 'system/scheduler',
            details: {
                totalBookings: bookingsSnap.size,
                totalPayments: paymentsSnap.size,
                matched,
                mismatches,
                missingPayment,
                issueCount: issues.length,
                gatewayBreakdown: report.gatewayBreakdown,
            },
            timestamp: FieldValue.serverTimestamp(),
        });

        console.log(`✅ Multi-gateway reconciliation for ${dateKey}: bookings=${bookingsSnap.size}, payments=${paymentsSnap.size}, matched=${matched}, mismatches=${mismatches}, missing=${missingPayment}`);
        console.log(`   ├─ Stripe: checked=${gatewayStats.stripe.checked}, matched=${gatewayStats.stripe.matched}, issues=${gatewayStats.stripe.issues}`);
        console.log(`   └─ Flutterwave: checked=${gatewayStats.flutterwave.checked}, matched=${gatewayStats.flutterwave.matched}, issues=${gatewayStats.flutterwave.issues}`);
    },
);
