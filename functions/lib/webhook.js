"use strict";
/**
 * Stripe Webhook Handler — Cloud Function
 *
 * Receives Stripe webhook events and updates booking/payment status accordingly.
 * Endpoint: POST /handleStripeWebhook
 *
 * Configure via: firebase functions:config:set stripe.webhook_secret="whsec_..."
 * Or set STRIPE_WEBHOOK_SECRET environment variable.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStripeWebhook = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const stripe_1 = __importDefault(require("stripe"));
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
let stripe = null;
if (STRIPE_SECRET_KEY) {
    stripe = new stripe_1.default(STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' });
}
/**
 * Handle incoming Stripe webhook events.
 *
 * Supported events:
 * - payment_intent.succeeded → confirm booking
 * - payment_intent.payment_failed → mark booking as payment_failed
 */
exports.handleStripeWebhook = (0, https_1.onRequest)({ cors: false }, async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    if (!stripe) {
        console.warn('Stripe not configured — webhook ignored');
        res.status(200).send('Stripe not configured');
        return;
    }
    // Verify webhook signature
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    // Handle the event
    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const pi = event.data.object;
                const bookingId = pi.metadata?.bookingId;
                if (bookingId) {
                    await db.doc(`bookings/${bookingId}`).update({
                        status: 'confirmed',
                        paymentIntentId: pi.id,
                        updatedAt: firestore_1.FieldValue.serverTimestamp(),
                    });
                    // Update payment record
                    const paySnap = await db.collection('payments')
                        .where('stripePaymentIntentId', '==', pi.id)
                        .limit(1)
                        .get();
                    if (!paySnap.empty) {
                        await paySnap.docs[0].ref.update({
                            status: 'succeeded',
                            updatedAt: firestore_1.FieldValue.serverTimestamp(),
                        });
                    }
                    await db.collection('audit_logs').add({
                        action: 'PAYMENT_CONFIRMED_WEBHOOK',
                        entityType: 'booking',
                        entityId: bookingId,
                        userId: pi.metadata?.userId || 'stripe-webhook',
                        userEmail: 'stripe-webhook',
                        details: { paymentIntentId: pi.id, amount: pi.amount },
                        timestamp: firestore_1.FieldValue.serverTimestamp(),
                    });
                    console.log(`✅ Booking ${bookingId} confirmed via webhook`);
                }
                break;
            }
            case 'payment_intent.payment_failed': {
                const pi = event.data.object;
                const bookingId = pi.metadata?.bookingId;
                if (bookingId) {
                    await db.doc(`bookings/${bookingId}`).update({
                        status: 'payment_failed',
                        updatedAt: firestore_1.FieldValue.serverTimestamp(),
                    });
                    // Update payment record
                    const paySnap = await db.collection('payments')
                        .where('stripePaymentIntentId', '==', pi.id)
                        .limit(1)
                        .get();
                    if (!paySnap.empty) {
                        await paySnap.docs[0].ref.update({
                            status: 'failed',
                            errorMessage: pi.last_payment_error?.message || 'Payment failed',
                            updatedAt: firestore_1.FieldValue.serverTimestamp(),
                        });
                    }
                    await db.collection('audit_logs').add({
                        action: 'PAYMENT_FAILED_WEBHOOK',
                        entityType: 'booking',
                        entityId: bookingId,
                        userId: pi.metadata?.userId || 'stripe-webhook',
                        userEmail: 'stripe-webhook',
                        details: {
                            paymentIntentId: pi.id,
                            error: pi.last_payment_error?.message,
                        },
                        timestamp: firestore_1.FieldValue.serverTimestamp(),
                    });
                    console.log(`❌ Booking ${bookingId} payment failed via webhook`);
                }
                break;
            }
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        res.status(200).json({ received: true });
    }
    catch (err) {
        console.error('Error processing webhook event:', err);
        res.status(500).send('Internal Error');
    }
});
//# sourceMappingURL=webhook.js.map