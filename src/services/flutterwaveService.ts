/**
 * Flutterwave Service — Frontend
 *
 * Wraps the `createFlutterwavePayment` Cloud Function and handles
 * the redirect-based checkout flow used by Flutterwave Standard.
 *
 * Flow:
 *   1. Call `initiateFlutterwavePayment()` → Cloud Function returns a payment link
 *   2. Redirect the browser to the Flutterwave hosted checkout
 *   3. User completes payment on Flutterwave's page
 *   4. Flutterwave redirects back to our `/booking/payment-callback` page
 *   5. Webhook confirms payment server-side (async)
 */

import { httpsCallable } from 'firebase/functions';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { functions, db } from '../config/firebase.config';
import type { PaymentDoc } from '../types/firestore';

// ─── Cloud Function Callable ─────────────────────────────────

const createFlutterwavePaymentFn = httpsCallable<
    {
        bookingId: string;
        amount: number;
        currency: string;
        paymentMethod?: string;
        mobileMoneyProvider?: string;
        customerEmail: string;
        customerName: string;
        customerPhone?: string;
        redirectUrl?: string;
    },
    { tx_ref: string; paymentLink: string }
>(functions, 'createFlutterwavePayment');

// ─── Public API ──────────────────────────────────────────────

export interface FlutterwavePaymentRequest {
    bookingId: string;
    amount: number;
    currency?: string;
    paymentMethod?: 'card' | 'mobilemoney' | 'banktransfer';
    mobileMoneyProvider?: 'wave' | 'orange_money' | 'afrimoney' | 'qmoney';
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
}

/**
 * Initiate a Flutterwave payment.
 *
 * In live mode this redirects the browser to the Flutterwave hosted
 * checkout page. In mock mode (no Flutterwave key configured on the
 * backend), the Cloud Function auto-confirms the booking and returns
 * a mock payment link.
 *
 * @returns The tx_ref and paymentLink. The caller should redirect
 *          to `paymentLink` or, in mock mode, navigate directly to
 *          the confirmation page.
 */
export async function initiateFlutterwavePayment(
    data: FlutterwavePaymentRequest,
): Promise<{ tx_ref: string; paymentLink: string; isMock: boolean }> {
    const redirectUrl = `${window.location.origin}/booking/payment-callback`;

    const result = await createFlutterwavePaymentFn({
        bookingId: data.bookingId,
        amount: data.amount,
        currency: data.currency || 'GMD',
        paymentMethod: data.paymentMethod,
        mobileMoneyProvider: data.mobileMoneyProvider,
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        redirectUrl,
    });

    const { tx_ref, paymentLink } = result.data;
    const isMock = paymentLink.startsWith('mock://');

    return { tx_ref, paymentLink, isMock };
}

/**
 * Look up a payment by its Flutterwave tx_ref.
 * Used by the callback page to show payment status.
 */
export async function getPaymentByTxRef(txRef: string): Promise<PaymentDoc | null> {
    const snap = await getDocs(
        query(collection(db, 'payments'), where('flutterwaveTxRef', '==', txRef)),
    );
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as PaymentDoc;
}

export type MobileMoneyProviderId = string;
