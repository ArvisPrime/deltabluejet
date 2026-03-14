"use strict";
/**
 * Payment Processing — Cloud Functions
 *
 * Uses Stripe for real payment intent creation and refund processing.
 * Falls back to mock mode if STRIPE_SECRET_KEY is not configured.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBookingConfirmation = exports.processRefund = exports.createPaymentIntent = void 0;
const https_1 = require("firebase-functions/v2/https");
const rateLimit_1 = require("./rateLimit");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const stripe_1 = __importDefault(require("stripe"));
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
// ─── Stripe Initialization ────────────────────────────────
// Set via: firebase functions:config:set stripe.secret_key="sk_..."
// Or set STRIPE_SECRET_KEY environment variable in Cloud Functions.
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const IS_STRIPE_LIVE = !!STRIPE_SECRET_KEY;
let stripe = null;
if (IS_STRIPE_LIVE) {
    stripe = new stripe_1.default(STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' });
}
/**
 * Create a payment intent for a booking.
 * Uses real Stripe when configured, otherwise falls back to mock for dev.
 */
exports.createPaymentIntent = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in to make a payment.');
    }
    // Rate limiting: max 10 payment intents per hour per user
    await (0, rateLimit_1.enforceRateLimit)(request.auth.uid, 'createPaymentIntent', rateLimit_1.RATE_LIMITS.PAYMENT_CREATE);
    const { bookingId, amount, currency } = request.data;
    const bookingDoc = await db.doc(`bookings/${bookingId}`).get();
    if (!bookingDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Booking not found.');
    }
    const booking = bookingDoc.data();
    if (booking.userId !== request.auth.uid) {
        throw new https_1.HttpsError('permission-denied', 'This booking does not belong to you.');
    }
    if (booking.status !== 'pending') {
        throw new https_1.HttpsError('failed-precondition', `Booking is already ${booking.status}.`);
    }
    let paymentIntentId;
    let clientSecret;
    if (stripe) {
        // ─── Real Stripe Integration ───────────────────────
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), // amount in smallest currency unit (cents)
            currency: (currency || 'USD').toLowerCase(),
            metadata: {
                bookingId,
                userId: request.auth.uid,
                pnr: booking.pnr || '',
                flightNumber: booking.flightNumber || '',
            },
            automatic_payment_methods: { enabled: true },
        });
        paymentIntentId = paymentIntent.id;
        clientSecret = paymentIntent.client_secret || '';
    }
    else {
        // ─── Mock Mode (no Stripe key configured) ──────────
        paymentIntentId = `pi_mock_${Date.now()}_${bookingId}`;
        clientSecret = `cs_mock_${paymentIntentId}`;
        // In mock mode, auto-confirm the booking
        await db.doc(`bookings/${bookingId}`).update({
            status: 'confirmed',
            paymentIntentId,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
    }
    // Record the payment
    await db.collection('payments').add({
        bookingId,
        stripePaymentIntentId: paymentIntentId,
        amount,
        currency: currency || 'USD',
        status: stripe ? 'requires_confirmation' : 'succeeded',
        mode: stripe ? 'live' : 'mock',
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
    // Audit log
    await db.collection('audit_logs').add({
        action: 'PAYMENT_CREATED',
        entityType: 'booking',
        entityId: bookingId,
        userId: request.auth.uid,
        userEmail: request.auth.token.email || '',
        details: { amount, currency, paymentIntentId, mode: stripe ? 'live' : 'mock' },
        timestamp: firestore_1.FieldValue.serverTimestamp(),
    });
    return { clientSecret, paymentIntentId };
});
/**
 * Process a refund for a booking.
 * Uses real Stripe when configured, otherwise mock.
 */
exports.processRefund = (0, https_1.onCall)(async (request) => {
    const callerRole = request.auth?.token?.role;
    const refundRoles = ['super_admin', 'ops_manager', 'cs_agent'];
    if (!callerRole || !refundRoles.includes(callerRole)) {
        throw new https_1.HttpsError('permission-denied', 'Insufficient permissions to process refunds.');
    }
    // Rate limiting: max 5 refunds per hour per user
    await (0, rateLimit_1.enforceRateLimit)(request.auth.uid, 'processRefund', rateLimit_1.RATE_LIMITS.REFUND_PROCESS);
    const { bookingId, paymentIntentId, amount } = request.data;
    const bookingDoc = await db.doc(`bookings/${bookingId}`).get();
    if (!bookingDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Booking not found.');
    }
    const booking = bookingDoc.data();
    let refundId;
    if (stripe && paymentIntentId && !paymentIntentId.startsWith('pi_mock_')) {
        // ─── Real Stripe Refund ────────────────────────────
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: amount ? Math.round(amount) : undefined, // partial or full
        });
        refundId = refund.id;
    }
    else {
        // ─── Mock Refund ───────────────────────────────────
        refundId = `re_mock_${Date.now()}`;
    }
    // Update booking status
    await db.doc(`bookings/${bookingId}`).update({
        status: 'refunded',
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    // Release seats back to the flight
    const fareClass = booking.fareClass || 'economy';
    const paxCount = booking.passengerCount || 1;
    await db.doc(`flights/${booking.flightId}`).update({
        [`seatsTaken.${fareClass}`]: firestore_1.FieldValue.increment(-paxCount),
        [`seatsAvailable.${fareClass}`]: firestore_1.FieldValue.increment(paxCount),
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    // Audit log
    await db.collection('audit_logs').add({
        action: 'REFUND_PROCESSED',
        entityType: 'booking',
        entityId: bookingId,
        userId: request.auth.uid,
        userEmail: request.auth.token.email || '',
        details: { refundId, amount: amount || booking.totalAmount, mode: stripe ? 'live' : 'mock' },
        timestamp: firestore_1.FieldValue.serverTimestamp(),
    });
    return { refundId, status: 'succeeded' };
});
/**
 * Send a booking confirmation email.
 * TODO (Phase 2): Integrate with SendGrid for real email delivery.
 */
exports.sendBookingConfirmation = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in.');
    }
    const { bookingId, email } = request.data;
    const bookingDoc = await db.doc(`bookings/${bookingId}`).get();
    if (!bookingDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Booking not found.');
    }
    const booking = bookingDoc.data();
    // TODO (Phase 2): Replace with SendGrid integration
    console.log(`📧 Booking confirmation email sent to ${email} for PNR ${booking.pnr}`);
    await db.collection('audit_logs').add({
        action: 'CONFIRMATION_EMAIL_SENT',
        entityType: 'booking',
        entityId: bookingId,
        userId: request.auth.uid,
        userEmail: request.auth.token.email || '',
        details: { recipientEmail: email, pnr: booking.pnr },
        timestamp: firestore_1.FieldValue.serverTimestamp(),
    });
    return { success: true };
});
//# sourceMappingURL=payments.js.map