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
    updateDoc,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
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
 * Award points on booking confirmation.
 * $1 spent = 1 point × class multiplier.
 */
export async function awardPoints(
    uid: string,
    amountSpent: number,
    fareClass: string,
    bookingRef: string,
    description?: string,
): Promise<LoyaltyDoc> {
    const loyalty = await getLoyaltyStatus(uid);
    const multiplier = CLASS_MULTIPLIERS[fareClass.toLowerCase()] || 1;
    const points = Math.round(amountSpent * multiplier);

    const entry: PointsHistoryEntry = {
        date: Timestamp.now(),
        amount: points,
        type: 'earn',
        bookingRef,
        description: description || `Earned ${points} pts on ${fareClass} booking`,
    };

    const newTotal = loyalty.totalPoints + points;
    const newLifetime = loyalty.lifetimePoints + points;
    const newTier = calculateTier(newLifetime);

    const ref = doc(loyaltyRef, uid);
    await updateDoc(ref, {
        totalPoints: newTotal,
        lifetimePoints: newLifetime,
        tier: newTier,
        pointsHistory: [...loyalty.pointsHistory, entry],
        updatedAt: Timestamp.now(),
    });

    return {
        ...loyalty,
        totalPoints: newTotal,
        lifetimePoints: newLifetime,
        tier: newTier,
        pointsHistory: [...loyalty.pointsHistory, entry],
    };
}

/**
 * Deduct points on refund/cancellation.
 */
export async function deductPoints(
    uid: string,
    amount: number,
    bookingRef: string,
    description?: string,
): Promise<LoyaltyDoc> {
    const loyalty = await getLoyaltyStatus(uid);
    const pointsToDeduct = Math.min(amount, loyalty.totalPoints); // Don't go negative

    const entry: PointsHistoryEntry = {
        date: Timestamp.now(),
        amount: pointsToDeduct,
        type: 'deduct',
        bookingRef,
        description: description || `Deducted ${pointsToDeduct} pts (refund)`,
    };

    const newTotal = loyalty.totalPoints - pointsToDeduct;

    const ref = doc(loyaltyRef, uid);
    await updateDoc(ref, {
        totalPoints: newTotal,
        pointsHistory: [...loyalty.pointsHistory, entry],
        updatedAt: Timestamp.now(),
    });

    return {
        ...loyalty,
        totalPoints: newTotal,
        pointsHistory: [...loyalty.pointsHistory, entry],
    };
}

/**
 * Get points history sorted by date (newest first).
 */
export function getPointsHistory(loyalty: LoyaltyDoc): PointsHistoryEntry[] {
    return [...loyalty.pointsHistory].sort(
        (a, b) => b.date.toDate().getTime() - a.date.toDate().getTime()
    );
}
