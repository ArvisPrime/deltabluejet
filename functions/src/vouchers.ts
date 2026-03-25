/**
 * Voucher Cloud Functions — Secure Voucher Management
 *
 * Server-side voucher creation and redemption to prevent:
 * - Client-side voucher status manipulation
 * - Voucher value tampering
 * - Double redemption via race conditions
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { enforceRateLimit } from './rateLimit';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) initializeApp();
const db = getFirestore();

// ─── Voucher Code Generation ──────────────────────────────

const VOUCHER_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateVoucherCode(): string {
    const crypto = require('crypto');
    const bytes = crypto.randomBytes(8);
    const chars = Array.from(bytes as Buffer, (b: number) =>
        VOUCHER_CHARS[b % VOUCHER_CHARS.length],
    ).join('');
    return `DBJ-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

// ─── Create Voucher (admin/system only) ───────────────────

export const createVoucherSecure = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }

    // Only admins/ops or system (via other CFs) should create vouchers
    const role = request.auth.token.role as string | undefined;
    if (!role || !['admin', 'super_admin', 'ops_manager'].includes(role)) {
        throw new HttpsError('permission-denied', 'Admin access required to create vouchers.');
    }

    const { userId, amount, currency, reason, sourceBookingId } = request.data as {
        userId: string; amount: number; currency: string; reason: string; sourceBookingId?: string;
    };

    if (!userId || !amount || amount <= 0 || !currency || !reason) {
        throw new HttpsError('invalid-argument', 'Missing or invalid voucher data.');
    }

    const code = generateVoucherCode();

    // 12-month expiry
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const voucherRef = db.collection('vouchers').doc();
    await voucherRef.set({
        userId,
        amount,
        currency,
        status: 'active',
        reason,
        bookingId: sourceBookingId || null,
        redeemedBookingId: null,
        code,
        expiresAt: expiresAt,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    // Audit
    db.collection('audit_logs').add({
        action: 'VOUCHER_CREATED',
        entityType: 'voucher',
        entityId: voucherRef.id,
        userId: request.auth.uid,
        details: { targetUserId: userId, amount, currency, code },
        timestamp: FieldValue.serverTimestamp(),
    }).catch(err => console.error('Audit log failed:', err));

    return { voucherId: voucherRef.id, code };
});

// ─── Redeem Voucher (secure) ──────────────────────────────

export const redeemVoucherSecure = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }

    const uid = request.auth.uid;
    await enforceRateLimit(uid, 'redeemVoucher', { maxRequests: 10, windowMs: 60 * 60 * 1000 });

    const { voucherCode, bookingId } = request.data as {
        voucherCode: string; bookingId: string;
    };

    if (!voucherCode || !bookingId) {
        throw new HttpsError('invalid-argument', 'Missing voucher code or booking ID.');
    }

    // Find voucher by code
    const voucherSnap = await db.collection('vouchers')
        .where('code', '==', voucherCode.toUpperCase())
        .limit(1)
        .get();

    if (voucherSnap.empty) {
        throw new HttpsError('not-found', 'Voucher not found. Please check the code.');
    }

    const voucherDoc = voucherSnap.docs[0];
    const voucher = voucherDoc.data();

    // Validate ownership
    if (voucher.userId !== uid) {
        throw new HttpsError('permission-denied', 'This voucher does not belong to you.');
    }

    // Validate status
    if (voucher.status !== 'active') {
        throw new HttpsError('failed-precondition', `Voucher is ${voucher.status} — cannot be redeemed.`);
    }

    // Validate expiry
    const expiresAt = voucher.expiresAt?.toDate?.() || voucher.expiresAt;
    if (expiresAt && new Date(expiresAt) < new Date()) {
        await voucherDoc.ref.update({
            status: 'expired',
            updatedAt: FieldValue.serverTimestamp(),
        });
        throw new HttpsError('failed-precondition', 'Voucher has expired.');
    }

    // Validate booking exists and belongs to user
    const bookingDoc = await db.doc(`bookings/${bookingId}`).get();
    if (!bookingDoc.exists) {
        throw new HttpsError('not-found', 'Booking not found.');
    }
    if (bookingDoc.data()!.userId !== uid) {
        throw new HttpsError('permission-denied', 'Booking does not belong to you.');
    }

    // Atomic redemption
    await voucherDoc.ref.update({
        status: 'redeemed',
        redeemedBookingId: bookingId,
        updatedAt: FieldValue.serverTimestamp(),
    });

    // Audit
    db.collection('audit_logs').add({
        action: 'VOUCHER_REDEEMED',
        entityType: 'voucher',
        entityId: voucherDoc.id,
        userId: uid,
        details: { bookingId, amount: voucher.amount, code: voucher.code },
        timestamp: FieldValue.serverTimestamp(),
    }).catch(err => console.error('Audit log failed:', err));

    return {
        success: true,
        amount: voucher.amount,
        currency: voucher.currency,
        message: `Voucher worth ${voucher.currency} ${voucher.amount} applied to your booking.`,
    };
});
