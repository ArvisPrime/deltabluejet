/**
 * Loyalty Program — Cloud Functions
 *
 * Server-side tier updates triggered by booking lifecycle events.
 * Auto-creates loyalty docs on user registration and recalculates
 * tiers after points changes.
 */

import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) initializeApp();
const db = getFirestore();

// ─── Tier Configuration (mirrors frontend loyaltyService) ─────

type LoyaltyTier = 'blue' | 'silver' | 'gold' | 'platinum';

const TIER_THRESHOLDS: { tier: LoyaltyTier; minPoints: number }[] = [
    { tier: 'blue', minPoints: 0 },
    { tier: 'silver', minPoints: 5_000 },
    { tier: 'gold', minPoints: 15_000 },
    { tier: 'platinum', minPoints: 40_000 },
];

const CLASS_MULTIPLIERS: Record<string, number> = {
    economy: 1,
    business: 2,
    first: 3,
};

function calculateTier(lifetimePoints: number): LoyaltyTier {
    for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
        if (lifetimePoints >= TIER_THRESHOLDS[i].minPoints) {
            return TIER_THRESHOLDS[i].tier;
        }
    }
    return 'blue';
}

/**
 * Auto-create loyalty document when a new user document is created.
 * Triggered by: users/{userId} created
 */
export const onUserCreatedLoyalty = onDocumentCreated(
    'users/{userId}',
    async (event) => {
        const snap = event.data;
        if (!snap) return;

        const userId = event.params.userId;
        const userData = snap.data();

        // Check if loyalty doc already exists (idempotent)
        const loyaltyDoc = await db.doc(`loyalty/${userId}`).get();
        if (loyaltyDoc.exists) return;

        await db.doc(`loyalty/${userId}`).set({
            userId,
            displayName: userData.displayName || '',
            email: userData.email || '',
            tier: 'blue',
            currentPoints: 0,
            lifetimePoints: 0,
            lifetimeFlights: 0,
            lifetimeSpend: 0,
            tierUpdatedAt: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(`🎫 Loyalty doc created for user ${userId} — Blue tier`);
    }
);

/**
 * Award points and recalculate tier when a booking is confirmed.
 * Triggered by: bookings/{bookingId} updated → status becomes 'confirmed'
 *
 * Points formula: baseFare × classMultiplier
 * (e.g., $500 Economy = 500 pts, $500 Business = 1000 pts)
 */
export const onBookingConfirmedLoyalty = onDocumentUpdated(
    'bookings/{bookingId}',
    async (event) => {
        const before = event.data?.before?.data();
        const after = event.data?.after?.data();

        if (!before || !after) return;
        if (before.status === after.status) return;
        if (after.status !== 'confirmed') return;

        // Don't double-award: check if already processed
        if (after.loyaltyPointsAwarded) return;

        const userId = after.userId as string;
        if (!userId) return;

        const totalAmount = (after.totalAmount as number) || 0;
        const fareClass = (after.fareClass as string) || 'economy';
        const multiplier = CLASS_MULTIPLIERS[fareClass] || 1;
        const points = Math.round(totalAmount * multiplier);

        if (points <= 0) return;

        // Update loyalty document
        const loyaltyRef = db.doc(`loyalty/${userId}`);
        const loyaltyDoc = await loyaltyRef.get();

        if (!loyaltyDoc.exists) {
            // Auto-create if missing
            await loyaltyRef.set({
                userId,
                tier: 'blue',
                currentPoints: points,
                lifetimePoints: points,
                lifetimeFlights: 1,
                lifetimeSpend: totalAmount,
                tierUpdatedAt: FieldValue.serverTimestamp(),
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });
        } else {
            const data = loyaltyDoc.data()!;
            const newLifetimePoints = (data.lifetimePoints || 0) + points;
            const newTier = calculateTier(newLifetimePoints);
            const tierChanged = newTier !== data.tier;

            const updates: Record<string, any> = {
                currentPoints: FieldValue.increment(points),
                lifetimePoints: FieldValue.increment(points),
                lifetimeFlights: FieldValue.increment(1),
                lifetimeSpend: FieldValue.increment(totalAmount),
                updatedAt: FieldValue.serverTimestamp(),
            };

            if (tierChanged) {
                updates.tier = newTier;
                updates.previousTier = data.tier;
                updates.tierUpdatedAt = FieldValue.serverTimestamp();
            }

            await loyaltyRef.update(updates);

            if (tierChanged) {
                console.log(`🏆 User ${userId} upgraded: ${data.tier} → ${newTier}`);
            }
        }

        // Add points history entry
        await db.collection(`loyalty/${userId}/points_history`).add({
            type: 'earn',
            points,
            reason: `Flight booking — ${fareClass}`,
            bookingId: event.params.bookingId,
            flightNumber: after.flightNumber || '',
            balanceAfter: (loyaltyDoc.exists ? (loyaltyDoc.data()!.currentPoints || 0) : 0) + points,
            createdAt: FieldValue.serverTimestamp(),
        });

        // Mark booking as processed
        await db.doc(`bookings/${event.params.bookingId}`).update({
            loyaltyPointsAwarded: points,
        });

        console.log(`✅ Awarded ${points} pts to user ${userId} for booking ${event.params.bookingId}`);
    }
);

/**
 * Deduct points and recalculate tier when a booking is refunded.
 * Triggered by: bookings/{bookingId} updated → status becomes 'refunded'
 */
export const onBookingRefundedLoyalty = onDocumentUpdated(
    'bookings/{bookingId}',
    async (event) => {
        const before = event.data?.before?.data();
        const after = event.data?.after?.data();

        if (!before || !after) return;
        if (before.status === after.status) return;
        if (after.status !== 'refunded') return;

        const userId = after.userId as string;
        if (!userId) return;

        const pointsAwarded = (after.loyaltyPointsAwarded as number) || 0;
        if (pointsAwarded <= 0) return;

        // Deduct points
        const loyaltyRef = db.doc(`loyalty/${userId}`);
        const loyaltyDoc = await loyaltyRef.get();

        if (!loyaltyDoc.exists) return;

        const data = loyaltyDoc.data()!;
        const newCurrentPoints = Math.max(0, (data.currentPoints || 0) - pointsAwarded);

        await loyaltyRef.update({
            currentPoints: newCurrentPoints,
            lifetimeFlights: FieldValue.increment(-1),
            lifetimeSpend: FieldValue.increment(-(after.totalAmount || 0)),
            updatedAt: FieldValue.serverTimestamp(),
        });

        // Add deduction history
        await db.collection(`loyalty/${userId}/points_history`).add({
            type: 'deduct',
            points: -pointsAwarded,
            reason: 'Booking refunded',
            bookingId: event.params.bookingId,
            balanceAfter: newCurrentPoints,
            createdAt: FieldValue.serverTimestamp(),
        });

        console.log(`↩️ Deducted ${pointsAwarded} pts from user ${userId} (booking ${event.params.bookingId} refunded)`);
    }
);
