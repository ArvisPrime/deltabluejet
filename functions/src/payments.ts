/**
 * Payment Processing — Cloud Functions
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) initializeApp();
const db = getFirestore();

/**
 * Create a payment intent for a booking.
 * In production, this would integrate with Stripe.
 * Currently returns a mock payment intent for development.
 */
export const createPaymentIntent = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in to make a payment.');
    }

    const { bookingId, amount, currency } = request.data;

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

    // --- Stripe Integration Point ---
    // In production, replace this mock with:
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({ ... });

    const mockPaymentIntentId = `pi_mock_${Date.now()}_${bookingId}`;

    await db.collection('payments').add({
        bookingId,
        stripePaymentIntentId: mockPaymentIntentId,
        amount,
        currency: currency || 'USD',
        status: 'succeeded',
        createdAt: FieldValue.serverTimestamp(),
    });

    await db.doc(`bookings/${bookingId}`).update({
        status: 'confirmed',
        paymentIntentId: mockPaymentIntentId,
        updatedAt: FieldValue.serverTimestamp(),
    });

    await db.collection('audit_logs').add({
        action: 'PAYMENT_PROCESSED',
        entityType: 'booking',
        entityId: bookingId,
        userId: request.auth.uid,
        userEmail: request.auth.token.email || '',
        details: { amount, currency, paymentIntentId: mockPaymentIntentId },
        timestamp: FieldValue.serverTimestamp(),
    });

    return { clientSecret: `cs_mock_${mockPaymentIntentId}`, paymentIntentId: mockPaymentIntentId };
});

/**
 * Process a refund for a booking.
 */
export const processRefund = onCall(async (request) => {
    const callerRole = request.auth?.token?.role as string | undefined;
    const refundRoles = ['super_admin', 'ops_manager', 'cs_agent'];
    if (!callerRole || !refundRoles.includes(callerRole)) {
        throw new HttpsError('permission-denied', 'Insufficient permissions to process refunds.');
    }

    const { bookingId, paymentIntentId, amount } = request.data;

    const bookingDoc = await db.doc(`bookings/${bookingId}`).get();
    if (!bookingDoc.exists) {
        throw new HttpsError('not-found', 'Booking not found.');
    }

    const booking = bookingDoc.data()!;

    // --- Stripe Refund Point ---
    // In production: const refund = await stripe.refunds.create({ ... });

    const mockRefundId = `re_mock_${Date.now()}`;

    await db.doc(`bookings/${bookingId}`).update({
        status: 'refunded',
        updatedAt: FieldValue.serverTimestamp(),
    });

    const fareClass = (booking.fareClass as string) || 'economy';
    const paxCount = (booking.passengerCount as number) || 1;
    await db.doc(`flights/${booking.flightId}`).update({
        [`seatsTaken.${fareClass}`]: FieldValue.increment(-paxCount),
        [`seatsAvailable.${fareClass}`]: FieldValue.increment(paxCount),
        updatedAt: FieldValue.serverTimestamp(),
    });

    await db.collection('audit_logs').add({
        action: 'REFUND_PROCESSED',
        entityType: 'booking',
        entityId: bookingId,
        userId: request.auth!.uid,
        userEmail: request.auth!.token.email || '',
        details: { refundId: mockRefundId, amount: amount || booking.totalAmount },
        timestamp: FieldValue.serverTimestamp(),
    });

    return { refundId: mockRefundId, status: 'succeeded' };
});

/**
 * Send a booking confirmation email.
 */
export const sendBookingConfirmation = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }

    const { bookingId, email } = request.data;

    const bookingDoc = await db.doc(`bookings/${bookingId}`).get();
    if (!bookingDoc.exists) {
        throw new HttpsError('not-found', 'Booking not found.');
    }

    const booking = bookingDoc.data()!;

    // --- SendGrid Integration Point ---
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({ ... });

    console.log(`📧 Booking confirmation email sent to ${email} for PNR ${booking.pnr}`);

    await db.collection('audit_logs').add({
        action: 'CONFIRMATION_EMAIL_SENT',
        entityType: 'booking',
        entityId: bookingId,
        userId: request.auth.uid,
        userEmail: request.auth.token.email || '',
        details: { recipientEmail: email, pnr: booking.pnr },
        timestamp: FieldValue.serverTimestamp(),
    });

    return { success: true };
});
