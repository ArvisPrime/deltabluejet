"use strict";
/**
 * Flutterwave Payment Processing — Cloud Functions
 *
 * Creates Flutterwave Standard checkout sessions for card and
 * mobile-money payments (Wave, Orange Money, AfriMoney, QMoney).
 * Falls back to mock mode if FLUTTERWAVE_SECRET_KEY is not configured.
 *
 * Works alongside the existing Stripe integration — the frontend
 * selects the gateway and calls the matching Cloud Function.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFlutterwavePayment = void 0;
exports.flwGet = flwGet;
exports.verifyFlutterwaveTransaction = verifyFlutterwaveTransaction;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const rateLimit_1 = require("./rateLimit");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
// ─── Flutterwave Initialization ─────────────────────────────
// Stored via:  firebase functions:secrets:set FLUTTERWAVE_SECRET_KEY
//              firebase functions:secrets:set FLUTTERWAVE_PUBLIC_KEY
const flwSecretKey = (0, params_1.defineSecret)('FLUTTERWAVE_SECRET_KEY');
const flwPublicKey = (0, params_1.defineSecret)('FLUTTERWAVE_PUBLIC_KEY');
const flwEncryptionKey = (0, params_1.defineSecret)('FLUTTERWAVE_ENCRYPTION_KEY');
// Base URL for the Flutterwave v3 REST API
const FLW_API_BASE = 'https://api.flutterwave.com/v3';
// ─── Helpers ────────────────────────────────────────────────
/** POST to Flutterwave v3 API */
async function flwPost(path, body) {
    const res = await fetch(`${FLW_API_BASE}${path}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${flwSecretKey.value()}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Flutterwave API error ${res.status}: ${text}`);
    }
    return res.json();
}
/** GET from Flutterwave v3 API */
async function flwGet(path) {
    const res = await fetch(`${FLW_API_BASE}${path}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${flwSecretKey.value()}` },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Flutterwave API error ${res.status}: ${text}`);
    }
    return res.json();
}
/**
 * Create a Flutterwave Standard checkout session.
 *
 * Returns a payment link that the frontend redirects the customer to.
 * Uses real Flutterwave when configured, otherwise falls back to mock.
 */
exports.createFlutterwavePayment = (0, https_1.onCall)({ secrets: [flwSecretKey, flwPublicKey, flwEncryptionKey] }, async (request) => {
    const IS_FLW_LIVE = !!flwSecretKey.value();
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in to make a payment.');
    }
    // Rate limiting — shares the same PAYMENT_CREATE limit as Stripe
    await (0, rateLimit_1.enforceRateLimit)(request.auth.uid, 'createPaymentIntent', rateLimit_1.RATE_LIMITS.PAYMENT_CREATE);
    const { bookingId, amount, currency, paymentMethod, mobileMoneyProvider, customerEmail, customerName, customerPhone, redirectUrl, } = request.data;
    // ── Validate booking ─────────────────────────────────────
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
    const txRef = `DBJ-${bookingId}-${Date.now()}`;
    const cur = (currency || 'GMD').toUpperCase();
    let paymentLink;
    let flwTransactionId = null;
    if (IS_FLW_LIVE) {
        // ─── Real Flutterwave Standard Checkout ────────────
        const payload = {
            tx_ref: txRef,
            amount,
            currency: cur,
            redirect_url: redirectUrl || `${request.rawRequest?.headers?.origin || 'https://deltabluejetair.com'}/booking/payment-callback`,
            customer: {
                email: customerEmail,
                name: customerName,
                phonenumber: customerPhone || '',
            },
            customizations: {
                title: 'Deltablue Jet Air',
                description: `Flight booking ${booking.pnr || bookingId}`,
                logo: 'https://deltabluejetair.com/logo.png',
            },
            meta: {
                bookingId,
                userId: request.auth.uid,
                pnr: booking.pnr || '',
                flightNumber: booking.flightNumber || '',
            },
        };
        // Restrict to specific payment options if specified
        if (paymentMethod === 'mobilemoney') {
            payload.payment_options = 'mobilemoneygm';
        }
        else if (paymentMethod === 'card') {
            payload.payment_options = 'card';
        }
        else if (paymentMethod === 'banktransfer') {
            payload.payment_options = 'banktransfer';
        }
        const result = await flwPost('/payments', payload);
        paymentLink = result.data.link;
    }
    else {
        // ─── Mock Mode (no Flutterwave key configured) ─────
        paymentLink = `mock://flutterwave/checkout?tx_ref=${txRef}`;
        // Auto-confirm in mock mode
        await db.doc(`bookings/${bookingId}`).update({
            status: 'confirmed',
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
    }
    // ── Record payment in Firestore ──────────────────────────
    await db.collection('payments').add({
        bookingId,
        gateway: 'flutterwave',
        paymentMethod: paymentMethod || 'card',
        flutterwaveTxRef: txRef,
        flutterwaveTransactionId: flwTransactionId,
        mobileMoneyProvider: mobileMoneyProvider || null,
        amount,
        currency: cur,
        status: IS_FLW_LIVE ? 'pending' : 'succeeded',
        mode: IS_FLW_LIVE ? 'live' : 'mock',
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
    // ── Audit log ────────────────────────────────────────────
    await db.collection('audit_logs').add({
        action: 'PAYMENT_INITIATED',
        entityType: 'booking',
        entityId: bookingId,
        userId: request.auth.uid,
        userEmail: request.auth.token.email || '',
        details: {
            gateway: 'flutterwave',
            tx_ref: txRef,
            amount,
            currency: cur,
            paymentMethod: paymentMethod || 'card',
            mobileMoneyProvider: mobileMoneyProvider || null,
            mode: IS_FLW_LIVE ? 'live' : 'mock',
        },
        timestamp: firestore_1.FieldValue.serverTimestamp(),
    });
    return { tx_ref: txRef, paymentLink };
});
// ─── Verify Flutterwave Transaction ─────────────────────────
/**
 * Server-side transaction verification.
 * Called by the webhook handler and can also be invoked manually.
 */
async function verifyFlutterwaveTransaction(transactionId) {
    const result = await flwGet(`/transactions/${transactionId}/verify`);
    return result.data;
}
//# sourceMappingURL=flutterwave.js.map