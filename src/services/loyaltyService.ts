/**
 * Loyalty Program Service — DeltaBlue Club
 *
 * Manages tier progression, points earning/deducting, and loyalty status.
 */

import {
    collection,
    doc,
    getDoc,
    setDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase.config';
import type { LoyaltyDoc, LoyaltyTier, PointsHistoryEntry } from '../types/firestore';

// ─── Constants ─────────────────────────────────────────────

export const TIER_THRESHOLDS: { tier: LoyaltyTier; minPoints: number; label: string; color: string }[] = [
    { tier: 'blue', minPoints: 0, label: 'Blue', color: '#137FEC' },
    { tier: 'silver', minPoints: 5_000, label: 'Silver', color: '#94A3B8' },
    { tier: 'gold', minPoints: 15_000, label: 'Gold', color: '#F59E0B' },
    { tier: 'platinum', minPoints: 40_000, label: 'Platinum', color: '#A78BFA' },
];

export const CLASS_MULTIPLIERS: Record<string, number> = {
    economy: 1,
    business: 2,
    first: 3,
};

// ─── Tier Benefits ────────────────────────────────────────

export interface TierBenefit {
    label: string;
    blue: string | boolean;
    silver: string | boolean;
    gold: string | boolean;
    platinum: string | boolean;
}

export const TIER_BENEFITS: TierBenefit[] = [
    { label: 'Points earning multiplier',        blue: '1×', silver: '1.5×', gold: '2×', platinum: '3×' },
    { label: 'Free checked bags',                blue: '1 × 23 kg', silver: '2 × 23 kg', gold: '2 × 32 kg', platinum: '3 × 32 kg' },
    { label: 'Priority boarding',                blue: false, silver: true, gold: true, platinum: true },
    { label: 'Lounge access',                    blue: false, silver: false, gold: true, platinum: true },
    { label: 'Priority check-in',                blue: false, silver: true, gold: true, platinum: true },
    { label: 'Seat selection fee waiver',         blue: false, silver: false, gold: true, platinum: true },
    { label: 'Upgrade vouchers (per year)',       blue: '0', silver: '1', gold: '2', platinum: '4' },
    { label: 'Companion fare discount',           blue: false, silver: false, gold: '15%', platinum: '25%' },
    { label: 'Miles never expire',               blue: false, silver: false, gold: false, platinum: true },
    { label: 'Guaranteed economy seating',        blue: false, silver: false, gold: false, platinum: true },
    { label: 'Fast track security',              blue: false, silver: false, gold: true, platinum: true },
    { label: 'Dedicated phone line',             blue: false, silver: false, gold: false, platinum: true },
];

// ─── Distance-Based Miles ─────────────────────────────────

export const ROUTE_DISTANCES: Record<string, number> = {
    'BJL-DSS': 180, 'DSS-BJL': 180,
    'BJL-LHR': 3100, 'LHR-BJL': 3100,
    'BJL-JFK': 4800, 'JFK-BJL': 4800,
    'BJL-DXB': 5800, 'DXB-BJL': 5800,
    'BJL-ACC': 1100, 'ACC-BJL': 1100,
    'LHR-JFK': 3450, 'JFK-LHR': 3450,
    'LHR-DXB': 3400, 'DXB-LHR': 3400,
    'DSS-LHR': 2900, 'LHR-DSS': 2900,
    'DSS-ACC': 1200, 'ACC-DSS': 1200,
};

const TIER_EARN_MULTIPLIER: Record<LoyaltyTier, number> = {
    blue: 1, silver: 1.5, gold: 2, platinum: 3,
};

export function calculateMilesForFlight(
    origin: string, destination: string, fareClass: string, tier: LoyaltyTier,
): number {
    const key = `${origin}-${destination}`;
    const baseMiles = ROUTE_DISTANCES[key] || 1000;
    const classMultiplier = CLASS_MULTIPLIERS[fareClass.toLowerCase()] || 1;
    const tierMultiplier = TIER_EARN_MULTIPLIER[tier] || 1;
    return Math.round(baseMiles * classMultiplier * tierMultiplier);
}

// ─── Award Booking (Miles-for-Flights) ────────────────────

export const AWARD_PRICING: Record<string, Record<string, number>> = {
    short:   { economy: 8_000, business: 16_000, first: 30_000 },
    medium:  { economy: 15_000, business: 30_000, first: 55_000 },
    long:    { economy: 25_000, business: 50_000, first: 90_000 },
};

function getRouteCategory(origin: string, destination: string): 'short' | 'medium' | 'long' {
    const key = `${origin}-${destination}`;
    const dist = ROUTE_DISTANCES[key] || 3000;
    if (dist <= 1500) return 'short';
    if (dist <= 4000) return 'medium';
    return 'long';
}

export function getAwardMilesCost(origin: string, destination: string, fareClass: string): number {
    const cat = getRouteCategory(origin, destination);
    return AWARD_PRICING[cat][fareClass.toLowerCase()] || AWARD_PRICING[cat].economy;
}

// ─── Cloud Function callables ─────────────────────────────

const redeemPointsSecureFn = httpsCallable<
    { rewardId: string; rewardName: string; pointsCost: number },
    { success: boolean; message: string }
>(functions, 'redeemPointsSecure');

const createAwardBookingSecureFn = httpsCallable<
    { origin: string; destination: string; fareClass: string },
    { success: boolean; message: string; milesDeducted: number }
>(functions, 'createAwardBookingSecure');

export async function createAwardBooking(
    uid: string, origin: string, destination: string, fareClass: string,
): Promise<{ success: boolean; message: string; milesDeducted: number }> {
    const result = await createAwardBookingSecureFn({ origin, destination, fareClass });
    return result.data;
}

// ─── Miles + Cash Split ───────────────────────────────────

const MILES_TO_CASH_RATE = 0.01; // 1 mile = $0.01

export function calculateMilesCashSplit(
    totalPrice: number, milesAvailable: number, milesPercentage: number,
): { milesUsed: number; cashAmount: number; milesValue: number } {
    const fraction = Math.max(0, Math.min(100, milesPercentage)) / 100;
    const milesValue = totalPrice * fraction;
    const milesNeeded = Math.ceil(milesValue / MILES_TO_CASH_RATE);
    const milesUsed = Math.min(milesNeeded, milesAvailable);
    const actualMilesValue = milesUsed * MILES_TO_CASH_RATE;
    const cashAmount = parseFloat((totalPrice - actualMilesValue).toFixed(2));

    return { milesUsed, cashAmount, milesValue: actualMilesValue };
}

const loyaltyRef = collection(db, 'loyalty');

// ─── Helpers ──────────────────────────────────────────────

/**
 * Determine tier from lifetime points.
 */
export function calculateTier(lifetimePoints: number): LoyaltyTier {
    // Walk backwards through sorted thresholds to find highest qualifying tier
    for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
        if (lifetimePoints >= TIER_THRESHOLDS[i].minPoints) {
            return TIER_THRESHOLDS[i].tier;
        }
    }
    return 'blue';
}

/**
 * Get the next tier info (label + points needed).
 */
export function getNextTierInfo(currentTier: LoyaltyTier, lifetimePoints: number): { nextTier: string; pointsNeeded: number } | null {
    const idx = TIER_THRESHOLDS.findIndex(t => t.tier === currentTier);
    if (idx >= TIER_THRESHOLDS.length - 1) return null; // Already Platinum

    const next = TIER_THRESHOLDS[idx + 1];
    return {
        nextTier: next.label,
        pointsNeeded: next.minPoints - lifetimePoints,
    };
}

/**
 * Get tier display info.
 */
export function getTierInfo(tier: LoyaltyTier) {
    return TIER_THRESHOLDS.find(t => t.tier === tier) || TIER_THRESHOLDS[0];
}

// ─── Core Service ─────────────────────────────────────────

/**
 * Get or create loyalty status for a user.
 */
export async function getLoyaltyStatus(uid: string): Promise<LoyaltyDoc> {
    const ref = doc(loyaltyRef, uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as LoyaltyDoc;
    }

    // Create a new loyalty doc for first-time users
    const newDoc: Omit<LoyaltyDoc, 'id'> = {
        uid,
        tier: 'blue',
        totalPoints: 0,
        lifetimePoints: 0,
        pointsHistory: [],
        tierExpiryDate: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    await setDoc(ref, newDoc);
    return { id: uid, ...newDoc };
}

/**
 * Award points — now handled by server-side trigger (onBookingConfirmedLoyalty).
 * This function is kept for API compatibility but is a no-op on the client.
 * Points are automatically awarded when booking status changes to 'confirmed'.
 */
export async function awardPoints(
    uid: string,
    amountSpent: number,
    fareClass: string,
    bookingRef: string,
    description?: string,
): Promise<LoyaltyDoc> {
    // No-op: points are awarded server-side via Firestore trigger
    return getLoyaltyStatus(uid);
}

/**
 * Deduct points — now handled by server-side trigger (onBookingRefundedLoyalty).
 * This function is kept for API compatibility but is a no-op on the client.
 */
export async function deductPoints(
    uid: string,
    amount: number,
    bookingRef: string,
    description?: string,
): Promise<LoyaltyDoc> {
    // No-op: points are deducted server-side via Firestore trigger
    return getLoyaltyStatus(uid);
}

/**
 * Deduct points is kept but is a no-op — see above.
 */

/**
 * Get points history sorted by date (newest first).
 */
export function getPointsHistory(loyalty: LoyaltyDoc): PointsHistoryEntry[] {
    return [...loyalty.pointsHistory].sort(
        (a, b) => b.date.toDate().getTime() - a.date.toDate().getTime()
    );
}

// ─── Rewards & Redemption ────────────────────────────────

export interface LoyaltyReward {
    id: string;
    name: string;
    description: string;
    pointsCost: number;
    category: 'upgrade' | 'lounge' | 'baggage' | 'miles' | 'partner' | 'experience';
    partnerName?: string;
    imageUrl?: string;
    available: boolean;
}

export interface RedemptionRecord {
    id: string;
    uid: string;
    rewardId: string;
    rewardName: string;
    pointsSpent: number;
    status: 'completed' | 'pending' | 'cancelled';
    redeemedAt: Timestamp;
}

/**
 * Get available rewards catalog.
 */
export async function getRewardsCatalog(): Promise<LoyaltyReward[]> {
    const q = query(collection(db, 'loyalty_rewards'), where('available', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as LoyaltyReward));
}

/**
 * Redeem points for a reward.
 */
/**
 * Redeem points for a reward — now via Cloud Function.
 */
export async function redeemPoints(
    uid: string,
    reward: LoyaltyReward,
): Promise<{ success: boolean; message: string }> {
    const result = await redeemPointsSecureFn({
        rewardId: reward.id,
        rewardName: reward.name,
        pointsCost: reward.pointsCost,
    });
    return result.data;
}

/**
 * Get redemption history for a user.
 */
export async function getRedemptionHistory(uid: string): Promise<RedemptionRecord[]> {
    const q = query(
        collection(db, 'loyalty_redemptions'),
        where('uid', '==', uid),
        orderBy('redeemedAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as RedemptionRecord));
}
