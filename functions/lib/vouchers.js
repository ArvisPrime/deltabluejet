"use strict";
/**
 * Voucher Cloud Functions — Secure Voucher Management
 *
 * Server-side voucher creation and redemption to prevent:
 * - Client-side voucher status manipulation
 * - Voucher value tampering
 * - Double redemption via race conditions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.redeemVoucherSecure = exports.createVoucherSecure = void 0;
const https_1 = require("firebase-functions/v2/https");
const rateLimit_1 = require("./rateLimit");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
// ─── Voucher Code Generation ──────────────────────────────
const VOUCHER_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateVoucherCode() {
    const crypto = require('crypto');
    const bytes = crypto.randomBytes(8);
    const chars = Array.from(bytes, (b) => VOUCHER_CHARS[b % VOUCHER_CHARS.length]).join('');
    return `DBJ-${chars.slice(0, 4)}-${chars.slice(4)}`;
}
// ─── Create Voucher (admin/system only) ───────────────────
exports.createVoucherSecure = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in.');
    }
    // Only admins/ops or system (via other CFs) should create vouchers
    const role = request.auth.token.role;
    if (!role || !['admin', 'super_admin', 'ops_manager'].includes(role)) {
        throw new https_1.HttpsError('permission-denied', 'Admin access required to create vouchers.');
    }
    const { userId, amount, currency, reason, sourceBookingId } = request.data;
    if (!userId || !amount || amount <= 0 || !currency || !reason) {
        throw new https_1.HttpsError('invalid-argument', 'Missing or invalid voucher data.');
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
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    // Audit
    db.collection('audit_logs').add({
        action: 'VOUCHER_CREATED',
        entityType: 'voucher',
        entityId: voucherRef.id,
        userId: request.auth.uid,
        details: { targetUserId: userId, amount, currency, code },
        timestamp: firestore_1.FieldValue.serverTimestamp(),
    }).catch(err => console.error('Audit log failed:', err));
    return { voucherId: voucherRef.id, code };
});
// ─── Redeem Voucher (secure) ──────────────────────────────
exports.redeemVoucherSecure = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in.');
    }
    const uid = request.auth.uid;
    await (0, rateLimit_1.enforceRateLimit)(uid, 'redeemVoucher', { maxRequests: 10, windowMs: 60 * 60 * 1000 });
    const { voucherCode, bookingId } = request.data;
    if (!voucherCode || !bookingId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing voucher code or booking ID.');
    }
    // Find voucher by code
    const voucherSnap = await db.collection('vouchers')
        .where('code', '==', voucherCode.toUpperCase())
        .limit(1)
        .get();
    if (voucherSnap.empty) {
        throw new https_1.HttpsError('not-found', 'Voucher not found. Please check the code.');
    }
    const voucherDoc = voucherSnap.docs[0];
    const voucher = voucherDoc.data();
    // Validate ownership
    if (voucher.userId !== uid) {
        throw new https_1.HttpsError('permission-denied', 'This voucher does not belong to you.');
    }
    // Validate status
    if (voucher.status !== 'active') {
        throw new https_1.HttpsError('failed-precondition', `Voucher is ${voucher.status} — cannot be redeemed.`);
    }
    // Validate expiry
    const expiresAt = voucher.expiresAt?.toDate?.() || voucher.expiresAt;
    if (expiresAt && new Date(expiresAt) < new Date()) {
        await voucherDoc.ref.update({
            status: 'expired',
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        throw new https_1.HttpsError('failed-precondition', 'Voucher has expired.');
    }
    // Validate booking exists and belongs to user
    const bookingDoc = await db.doc(`bookings/${bookingId}`).get();
    if (!bookingDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Booking not found.');
    }
    if (bookingDoc.data().userId !== uid) {
        throw new https_1.HttpsError('permission-denied', 'Booking does not belong to you.');
    }
    // Atomic redemption
    await voucherDoc.ref.update({
        status: 'redeemed',
        redeemedBookingId: bookingId,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    // Audit
    db.collection('audit_logs').add({
        action: 'VOUCHER_REDEEMED',
        entityType: 'voucher',
        entityId: voucherDoc.id,
        userId: uid,
        details: { bookingId, amount: voucher.amount, code: voucher.code },
        timestamp: firestore_1.FieldValue.serverTimestamp(),
    }).catch(err => console.error('Audit log failed:', err));
    return {
        success: true,
        amount: voucher.amount,
        currency: voucher.currency,
        message: `Voucher worth ${voucher.currency} ${voucher.amount} applied to your booking.`,
    };
});
//# sourceMappingURL=vouchers.js.map