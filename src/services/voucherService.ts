/**
 * Voucher / Credit Service — Deltablue Jet Air
 *
 * Manages travel vouchers issued as refund alternatives.
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase.config';
import type { VoucherDoc } from '../types/firestore';

const vouchersRef = collection(db, 'vouchers');

// ─── Cloud Function Callables ──────────────────────────

const createVoucherSecureFn = httpsCallable<
    { userId: string; amount: number; currency: string; reason: string; sourceBookingId?: string },
    { voucherId: string; code: string }
>(functions, 'createVoucherSecure');

const redeemVoucherSecureFn = httpsCallable<
    { voucherCode: string; bookingId: string },
    { success: boolean; amount: number; currency: string; message: string }
>(functions, 'redeemVoucherSecure');

// ─── Create Voucher (via Cloud Function) ────────────────

export async function createVoucher(
    userId: string,
    amount: number,
    currency: string,
    reason: string,
    sourceBookingId?: string,
): Promise<{ voucherId: string; code: string }> {
    const result = await createVoucherSecureFn({
        userId, amount, currency, reason, sourceBookingId,
    });
    return result.data;
}

// ─── Redeem Voucher (via Cloud Function) ────────────────

export async function redeemVoucher(
    voucherCode: string,
    bookingId: string,
): Promise<{ success: boolean; amount: number; message: string }> {
    const result = await redeemVoucherSecureFn({ voucherCode, bookingId });
    return result.data;
}

// ─── Get User Vouchers ─────────────────────────────────────

export async function getUserVouchers(userId: string): Promise<VoucherDoc[]> {
    const snap = await getDocs(
        query(vouchersRef, where('userId', '==', userId)),
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as VoucherDoc);
}

// ─── Get Voucher by Code ───────────────────────────────────

export async function getVoucherByCode(code: string): Promise<VoucherDoc | null> {
    const snap = await getDocs(
        query(vouchersRef, where('code', '==', code.toUpperCase())),
    );
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as VoucherDoc;
}
