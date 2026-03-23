/**
 * Voucher / Credit Service — Deltablue Jet Air
 *
 * Manages travel vouchers issued as refund alternatives.
 */

import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import type { VoucherDoc } from '../types/firestore';

const vouchersRef = collection(db, 'vouchers');

// ─── Voucher Code Generation ───────────────────────────────

const VOUCHER_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateVoucherCode(): string {
    const prefix = 'DBJ';
    const random = Array.from({ length: 8 }, () =>
        VOUCHER_CHARS[Math.floor(Math.random() * VOUCHER_CHARS.length)],
    ).join('');
    return `${prefix}-${random.slice(0, 4)}-${random.slice(4)}`;
}

// ─── Create Voucher ────────────────────────────────────────

export async function createVoucher(
    userId: string,
    amount: number,
    currency: string,
    reason: string,
    sourceBookingId?: string,
): Promise<{ voucherId: string; code: string }> {
    const code = generateVoucherCode();

    // Voucher expires in 12 months
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const voucherData: Omit<VoucherDoc, 'id'> = {
        userId,
        amount,
        currency,
        status: 'active',
        reason,
        bookingId: sourceBookingId || null,
        redeemedBookingId: null,
        code,
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(vouchersRef, voucherData);
    return { voucherId: docRef.id, code };
}

// ─── Redeem Voucher ────────────────────────────────────────

export async function redeemVoucher(
    voucherId: string,
    bookingId: string,
): Promise<VoucherDoc> {
    const snap = await getDoc(doc(db, 'vouchers', voucherId));
    if (!snap.exists()) throw new Error('Voucher not found');

    const voucher = { id: snap.id, ...snap.data() } as VoucherDoc;

    if (voucher.status !== 'active') {
        throw new Error(`Voucher is ${voucher.status} — cannot be redeemed`);
    }

    const now = new Date();
    if (voucher.expiresAt.toDate() < now) {
        await updateDoc(doc(db, 'vouchers', voucherId), {
            status: 'expired',
            updatedAt: serverTimestamp(),
        });
        throw new Error('Voucher has expired');
    }

    await updateDoc(doc(db, 'vouchers', voucherId), {
        status: 'redeemed',
        redeemedBookingId: bookingId,
        updatedAt: serverTimestamp(),
    });

    return { ...voucher, status: 'redeemed', redeemedBookingId: bookingId };
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
