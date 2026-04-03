"use strict";
/**
 * Payment Processing — Cloud Functions
 *
 * Uses Stripe for real payment intent creation and refund processing.
 * Falls back to mock mode if STRIPE_SECRET_KEY is not configured.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmPaymentSecure = exports.sendBookingConfirmation = exports.processRefund = exports.createPaymentIntent = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const rateLimit_1 = require("./rateLimit");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const stripe_1 = __importDefault(require("stripe"));
/* ── Secrets ───────────────────────────────────────────────── */
const SENDGRID_API_KEY = (0, params_1.defineSecret)('SENDGRID_API_KEY');
/* ── Template Rendering Helper ─────────────────────────────── */
function renderTemplate(text, variables) {
    let rendered = text;
    for (const [key, value] of Object.entries(variables)) {
        rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return rendered;
}
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
 * Send a booking confirmation email via SendGrid.
 * Uses the SENDGRID_API_KEY secret; falls back to console.log mock if absent.
 */
exports.sendBookingConfirmation = (0, https_1.onCall)({ secrets: [SENDGRID_API_KEY] }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in.');
    }
    const { bookingId, email } = request.data;
    const bookingDoc = await db.doc(`bookings/${bookingId}`).get();
    if (!bookingDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Booking not found.');
    }
    const booking = bookingDoc.data();
    // Try to find a live "Booking Confirmation" email template
    const templatesSnap = await db.collection('email_templates')
        .where('name', '==', 'Booking Confirmation')
        .where('status', '==', 'live')
        .limit(1)
        .get();
    let subject = `Booking Confirmed — ${booking.pnr || 'DeltaBlue Jet Air'}`;
    let htmlBody = `<p>Dear Passenger,</p><p>Your booking <strong>${booking.pnr}</strong> for flight <strong>${booking.flightNumber || 'N/A'}</strong> has been confirmed.</p><p>Thank you for choosing DeltaBlue Jet Air.</p>`;
    if (!templatesSnap.empty) {
        const template = templatesSnap.docs[0].data();
        const variables = {
            passengerName: email,
            pnr: booking.pnr || 'N/A',
            flightNumber: booking.flightNumber || 'N/A',
            origin: booking.origin?.city || booking.origin?.code || '',
            destination: booking.destination?.city || booking.destination?.code || '',
            departureDate: booking.departureTime?.toDate?.()
                ? booking.departureTime.toDate().toISOString().split('T')[0]
                : 'TBD',
            totalAmount: `${booking.currency || 'USD'} ${booking.totalAmount || 0}`,
        };
        subject = renderTemplate(template.subject || subject, variables);
        htmlBody = renderTemplate(template.htmlBody || htmlBody, variables);
    }
    // Send via SendGrid or mock fallback
    const apiKey = SENDGRID_API_KEY.value();
    let provider = 'mock';
    let success = true;
    let errorMessage = null;
    if (apiKey) {
        try {
            const sgMail = await Promise.resolve().then(() => __importStar(require('@sendgrid/mail')));
            sgMail.default.setApiKey(apiKey);
            await sgMail.default.send({
                to: email,
                from: 'noreply@deltabluejetair.com',
                subject,
                html: htmlBody,
            });
            provider = 'sendgrid';
            console.log(`📧 [SendGrid] Booking confirmation sent to ${email} for PNR ${booking.pnr}`);
        }
        catch (err) {
            provider = 'sendgrid';
            success = false;
            errorMessage = err.message;
            console.error(`❌ [SendGrid] Failed to send confirmation to ${email}:`, err.message);
        }
    }
    else {
        console.log(`📧 [Mock] Booking confirmation email to ${email} for PNR ${booking.pnr}`);
    }
    // Log to notification_logs
    await db.collection('notification_logs').add({
        channel: 'email',
        templateId: templatesSnap.empty ? null : templatesSnap.docs[0].id,
        templateName: 'Booking Confirmation',
        recipientEmail: email,
        recipientPhone: null,
        bookingRef: booking.pnr || bookingId,
        subject,
        status: success ? 'sent' : 'failed',
        provider,
        errorMessage,
        sentBy: request.auth.token.email || 'system',
        sentAt: firestore_1.FieldValue.serverTimestamp(),
    });
    await db.collection('audit_logs').add({
        action: 'CONFIRMATION_EMAIL_SENT',
        entityType: 'booking',
        entityId: bookingId,
        userId: request.auth.uid,
        userEmail: request.auth.token.email || '',
        details: { recipientEmail: email, pnr: booking.pnr, provider, success },
        timestamp: firestore_1.FieldValue.serverTimestamp(),
    });
    return { success };
});
/**
 * Confirm payment and update booking status (server-side only).
 * Generates e-ticket number server-side and marks booking as confirmed.
 */
exports.confirmPaymentSecure = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in.');
    }
    const uid = request.auth.uid;
    const { bookingId, paymentIntentId } = request.data;
    if (!bookingId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing bookingId.');
    }
    const bookingRef = db.doc(`bookings/${bookingId}`);
    const bookingDoc = await bookingRef.get();
    if (!bookingDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Booking not found.');
    }
    const booking = bookingDoc.data();
    if (booking.userId !== uid) {
        throw new https_1.HttpsError('permission-denied', 'This booking does not belong to you.');
    }
    if (booking.status !== 'pending') {
        throw new https_1.HttpsError('failed-precondition', `Booking is already ${booking.status}.`);
    }
    // Generate e-ticket number server-side
    const crypto = require('crypto');
    const now = new Date();
    const datePart = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
    ].join('');
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
    const eTicketNumber = `DBJ-${datePart}-${randomPart}`;
    await bookingRef.update({
        status: 'confirmed',
        eTicketNumber,
        paymentIntentId: paymentIntentId || booking.paymentIntentId || null,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    // Audit log
    await db.collection('audit_logs').add({
        action: 'PAYMENT_CONFIRMED',
        entityType: 'booking',
        entityId: bookingId,
        userId: uid,
        userEmail: request.auth.token.email || '',
        details: { eTicketNumber, paymentIntentId },
        timestamp: firestore_1.FieldValue.serverTimestamp(),
    });
    return { success: true, eTicketNumber };
});
//# sourceMappingURL=payments.js.map