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

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { enforceRateLimit, RATE_LIMITS } from './rateLimit';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) initializeApp();
const db = getFirestore();

// ─── Flutterwave Initialization ─────────────────────────────
// Set via:  firebase functions:secrets:set FLUTTERWAVE_SECRET_KEY
//           firebase functions:secrets:set FLUTTERWAVE_PUBLIC_KEY

const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || '';
const FLW_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY || '';
const IS_FLW_LIVE = !!FLW_SECRET_KEY;

// Base URL for the Flutterwave v3 REST API
const FLW_API_BASE = 'https://api.flutterwave.com/v3';

// ─── Helpers ────────────────────────────────────────────────

/** POST to Flutterwave v3 API */
async function flwPost<T = any>(path: string, body: Record<string, any>): Promise<T> {
    const res = await fetch(`${FLW_API_BASE}${path}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${FLW_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Flutterwave API error ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
}

/** GET from Flutterwave v3 API */
export async function flwGet<T = any>(path: string): Promise<T> {
    const res = await fetch(`${FLW_API_BASE}${path}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${FLW_SECRET_KEY}` },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Flutterwave API error ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
}

// ─── Create Flutterwave Payment ─────────────────────────────

interface CreateFLWPaymentData {
    bookingId: string;
    amount: number;
    currency?: string;
    paymentMethod?: string;       // 'card' | 'mobilemoney' | 'banktransfer'
    mobileMoneyProvider?: string; // 'wave' | 'orange_money' | 'afrimoney' | 'qmoney'
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    redirectUrl?: string;
}

/**
 * Create a Flutterwave Standard checkout session.
 *
 * Returns a payment link that the frontend redirects the customer to.
 * Uses real Flutterwave when configured, otherwise falls back to mock.
 */
export const createFlutterwavePayment = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in to make a payment.');
    }

    // Rate limiting — shares the same PAYMENT_CREATE limit as Stripe
    await enforceRateLimit(request.auth.uid, 'createPaymentIntent', RATE_LIMITS.PAYMENT_CREATE);

    const {
        bookingId,
        amount,
        currency,
        paymentMethod,
        mobileMoneyProvider,
        customerEmail,
        customerName,
        customerPhone,
        redirectUrl,
    } = request.data as CreateFLWPaymentData;

    // ── Validate booking ─────────────────────────────────────
    const bookingDoc = await db.doc(`bookings/${bookingId}`).get();
    if (!bookingDoc.exists) {
        throw new HttpsError('not-found', 'Booking not found.');
    }

    const booking = bookingDoc.data()!;
    if (booking.userId !== request.auth.uid) {
        throw new HttpsError('permission-denied', 'This booking does not belong to you.');
    }
    if (booking.status !== 'pending') {
        throw new HttpsError('failed-precondition', `Booking is already ${booking.status}.`);
    }

    const txRef = `DBJ-${bookingId}-${Date.now()}`;
    const cur = (currency || 'GMD').toUpperCase();

    let paymentLink: string;
    let flwTransactionId: string | null = null;

    if (IS_FLW_LIVE) {
        // ─── Real Flutterwave Standard Checkout ────────────
        const payload: Record<string, any> = {
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
        } else if (paymentMethod === 'card') {
            payload.payment_options = 'card';
        } else if (paymentMethod === 'banktransfer') {
            payload.payment_options = 'banktransfer';
        }

        const result = await flwPost<{
            status: string;
            message: string;
            data: { link: string };
        }>('/payments', payload);

        paymentLink = result.data.link;
    } else {
        // ─── Mock Mode (no Flutterwave key configured) ─────
        paymentLink = `mock://flutterwave/checkout?tx_ref=${txRef}`;

        // Auto-confirm in mock mode
        await db.doc(`bookings/${bookingId}`).update({
            status: 'confirmed',
            updatedAt: FieldValue.serverTimestamp(),
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
        createdAt: FieldValue.serverTimestamp(),
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
        timestamp: FieldValue.serverTimestamp(),
    });

    return { tx_ref: txRef, paymentLink };
});

// ─── Verify Flutterwave Transaction ─────────────────────────

/**
 * Server-side transaction verification.
 * Called by the webhook handler and can also be invoked manually.
 */
export async function verifyFlutterwaveTransaction(transactionId: string): Promise<{
    status: string;
    amount: number;
    currency: string;
    tx_ref: string;
}> {
    const result = await flwGet<{
        status: string;
        data: {
            status: string;
            amount: number;
            currency: string;
            tx_ref: string;
        };
    }>(`/transactions/${transactionId}/verify`);

    return result.data;
}
