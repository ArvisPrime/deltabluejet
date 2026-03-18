"use strict";
/**
 * Flutterwave Webhook Handler — Cloud Functions
 *
 * Receives Flutterwave webhook events and updates booking/payment status.
 * Endpoint: POST /handleFlutterwaveWebhook
 *
 * Configure via:
 *   firebase functions:secrets:set FLUTTERWAVE_WEBHOOK_HASH
 *   firebase functions:secrets:set FLUTTERWAVE_SECRET_KEY
 *
 * Flutterwave sends a JSON POST with a `verif-hash` header.
 * We verify the hash, then confirm the transaction via the verify API.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleFlutterwaveWebhook = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const flutterwave_1 = require("./flutterwave");
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const FLW_WEBHOOK_HASH = process.env.FLUTTERWAVE_WEBHOOK_HASH || '';
exports.handleFlutterwaveWebhook = (0, https_1.onRequest)({ cors: false }, async (req, res) => {
    // ── Method check ─────────────────────────────────────
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    // ── Signature verification ───────────────────────────
    const verifHash = req.headers['verif-hash'];
    if (!FLW_WEBHOOK_HASH) {
        console.warn('FLUTTERWAVE_WEBHOOK_HASH not configured — webhook ignored');
        res.status(200).send('Webhook hash not configured');
        return;
    }
    if (!verifHash || verifHash !== FLW_WEBHOOK_HASH) {
        console.error('Flutterwave webhook signature mismatch');
        res.status(401).send('Unauthorized');
        return;
    }
    // ── Process payload ──────────────────────────────────
    try {
        const payload = req.body;
        const event = payload.event;
        const data = payload.data;
        if (event === 'charge.completed' && data.status === 'successful') {
            const txRef = data.tx_ref;
            const transactionId = String(data.id);
            // Server-side verification via Flutterwave API
            let verified = false;
            try {
                const verification = await (0, flutterwave_1.verifyFlutterwaveTransaction)(Number(transactionId));
                verified = verification.status === 'successful';
            }
            catch (err) {
                console.error('Flutterwave verification failed:', err);
                // Continue with webhook data if verify API is unreachable
                verified = true;
            }
            if (!verified) {
                console.error(`Transaction ${transactionId} verification failed — skipping`);
                res.status(200).json({ received: true, verified: false });
                return;
            }
            // Find payment by tx_ref
            const paymentSnap = await db.collection('payments')
                .where('flutterwaveTxRef', '==', txRef)
                .limit(1)
                .get();
            if (!paymentSnap.empty) {
                const paymentDoc = paymentSnap.docs[0];
                const payment = paymentDoc.data();
                // Verify amount matches (tolerance: 0.01)
                if (data.amount >= payment.amount - 0.01) {
                    // Update payment status
                    await paymentDoc.ref.update({
                        status: 'succeeded',
                        flutterwaveTransactionId: transactionId,
                        updatedAt: firestore_1.FieldValue.serverTimestamp(),
                    });
                    // Confirm the booking
                    await db.doc(`bookings/${payment.bookingId}`).update({
                        status: 'confirmed',
                        updatedAt: firestore_1.FieldValue.serverTimestamp(),
                    });
                    // Audit log
                    await db.collection('audit_logs').add({
                        action: 'PAYMENT_CONFIRMED_WEBHOOK',
                        entityType: 'booking',
                        entityId: payment.bookingId,
                        userId: data.meta?.userId || 'flutterwave-webhook',
                        userEmail: data.customer?.email || 'flutterwave-webhook',
                        details: {
                            gateway: 'flutterwave',
                            transactionId,
                            tx_ref: txRef,
                            amount: data.amount,
                            currency: data.currency,
                            paymentMethod: data.payment_type || 'unknown',
                        },
                        timestamp: firestore_1.FieldValue.serverTimestamp(),
                    });
                    console.log(`✅ Booking ${payment.bookingId} confirmed via Flutterwave webhook`);
                }
                else {
                    console.error(`Amount mismatch: expected ${payment.amount}, got ${data.amount} for tx_ref ${txRef}`);
                    await paymentDoc.ref.update({
                        status: 'failed',
                        errorMessage: `Amount mismatch: expected ${payment.amount}, received ${data.amount}`,
                        updatedAt: firestore_1.FieldValue.serverTimestamp(),
                    });
                }
            }
            else {
                console.warn(`No payment found for tx_ref: ${txRef}`);
            }
        }
        else if (event === 'charge.completed' && data.status === 'failed') {
            // Payment failed
            const txRef = data.tx_ref;
            const paymentSnap = await db.collection('payments')
                .where('flutterwaveTxRef', '==', txRef)
                .limit(1)
                .get();
            if (!paymentSnap.empty) {
                const paymentDoc = paymentSnap.docs[0];
                const payment = paymentDoc.data();
                await paymentDoc.ref.update({
                    status: 'failed',
                    errorMessage: data.processor_response || 'Payment failed',
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                });
                await db.doc(`bookings/${payment.bookingId}`).update({
                    status: 'payment_failed',
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                });
                await db.collection('audit_logs').add({
                    action: 'PAYMENT_FAILED_WEBHOOK',
                    entityType: 'booking',
                    entityId: payment.bookingId,
                    userId: data.meta?.userId || 'flutterwave-webhook',
                    userEmail: data.customer?.email || 'flutterwave-webhook',
                    details: {
                        gateway: 'flutterwave',
                        tx_ref: txRef,
                        error: data.processor_response || 'Payment failed',
                    },
                    timestamp: firestore_1.FieldValue.serverTimestamp(),
                });
                console.log(`❌ Booking ${payment.bookingId} payment failed via Flutterwave webhook`);
            }
        }
        else {
            console.log(`Unhandled Flutterwave event: ${event} / status: ${data.status}`);
        }
        res.status(200).json({ received: true });
    }
    catch (err) {
        console.error('Error processing Flutterwave webhook:', err);
        res.status(500).send('Internal Error');
    }
});
//# sourceMappingURL=flutterwaveWebhook.js.map