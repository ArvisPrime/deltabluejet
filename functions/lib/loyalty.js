"use strict";
/**
 * Loyalty Program — Cloud Functions
 *
 * Server-side tier updates triggered by booking lifecycle events.
 * Auto-creates loyalty docs on user registration and recalculates
 * tiers after points changes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onBookingRefundedLoyalty = exports.onBookingConfirmedLoyalty = exports.onUserCreatedLoyalty = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
const db = (0, firestore_2.getFirestore)();
const TIER_THRESHOLDS = [
    { tier: 'blue', minPoints: 0 },
    { tier: 'silver', minPoints: 5_000 },
    { tier: 'gold', minPoints: 15_000 },
    { tier: 'platinum', minPoints: 40_000 },
];
const CLASS_MULTIPLIERS = {
    economy: 1,
    business: 2,
    first: 3,
};
function calculateTier(lifetimePoints) {
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
exports.onUserCreatedLoyalty = (0, firestore_1.onDocumentCreated)('users/{userId}', async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const userId = event.params.userId;
    const userData = snap.data();
    // Check if loyalty doc already exists (idempotent)
    const loyaltyDoc = await db.doc(`loyalty/${userId}`).get();
    if (loyaltyDoc.exists)
        return;
    await db.doc(`loyalty/${userId}`).set({
        userId,
        displayName: userData.displayName || '',
        email: userData.email || '',
        tier: 'blue',
        currentPoints: 0,
        lifetimePoints: 0,
        lifetimeFlights: 0,
        lifetimeSpend: 0,
        tierUpdatedAt: firestore_2.FieldValue.serverTimestamp(),
        createdAt: firestore_2.FieldValue.serverTimestamp(),
        updatedAt: firestore_2.FieldValue.serverTimestamp(),
    });
    console.log(`🎫 Loyalty doc created for user ${userId} — Blue tier`);
});
/**
 * Award points and recalculate tier when a booking is confirmed.
 * Triggered by: bookings/{bookingId} updated → status becomes 'confirmed'
 *
 * Points formula: baseFare × classMultiplier
 * (e.g., $500 Economy = 500 pts, $500 Business = 1000 pts)
 */
exports.onBookingConfirmedLoyalty = (0, firestore_1.onDocumentUpdated)('bookings/{bookingId}', async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after)
        return;
    if (before.status === after.status)
        return;
    if (after.status !== 'confirmed')
        return;
    // Don't double-award: check if already processed
    if (after.loyaltyPointsAwarded)
        return;
    const userId = after.userId;
    if (!userId)
        return;
    const totalAmount = after.totalAmount || 0;
    const fareClass = after.fareClass || 'economy';
    const multiplier = CLASS_MULTIPLIERS[fareClass] || 1;
    const points = Math.round(totalAmount * multiplier);
    if (points <= 0)
        return;
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
            tierUpdatedAt: firestore_2.FieldValue.serverTimestamp(),
            createdAt: firestore_2.FieldValue.serverTimestamp(),
            updatedAt: firestore_2.FieldValue.serverTimestamp(),
        });
    }
    else {
        const data = loyaltyDoc.data();
        const newLifetimePoints = (data.lifetimePoints || 0) + points;
        const newTier = calculateTier(newLifetimePoints);
        const tierChanged = newTier !== data.tier;
        const updates = {
            currentPoints: firestore_2.FieldValue.increment(points),
            lifetimePoints: firestore_2.FieldValue.increment(points),
            lifetimeFlights: firestore_2.FieldValue.increment(1),
            lifetimeSpend: firestore_2.FieldValue.increment(totalAmount),
            updatedAt: firestore_2.FieldValue.serverTimestamp(),
        };
        if (tierChanged) {
            updates.tier = newTier;
            updates.previousTier = data.tier;
            updates.tierUpdatedAt = firestore_2.FieldValue.serverTimestamp();
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
        balanceAfter: (loyaltyDoc.exists ? (loyaltyDoc.data().currentPoints || 0) : 0) + points,
        createdAt: firestore_2.FieldValue.serverTimestamp(),
    });
    // Mark booking as processed
    await db.doc(`bookings/${event.params.bookingId}`).update({
        loyaltyPointsAwarded: points,
    });
    console.log(`✅ Awarded ${points} pts to user ${userId} for booking ${event.params.bookingId}`);
});
/**
 * Deduct points and recalculate tier when a booking is refunded.
 * Triggered by: bookings/{bookingId} updated → status becomes 'refunded'
 */
exports.onBookingRefundedLoyalty = (0, firestore_1.onDocumentUpdated)('bookings/{bookingId}', async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after)
        return;
    if (before.status === after.status)
        return;
    if (after.status !== 'refunded')
        return;
    const userId = after.userId;
    if (!userId)
        return;
    const pointsAwarded = after.loyaltyPointsAwarded || 0;
    if (pointsAwarded <= 0)
        return;
    // Deduct points
    const loyaltyRef = db.doc(`loyalty/${userId}`);
    const loyaltyDoc = await loyaltyRef.get();
    if (!loyaltyDoc.exists)
        return;
    const data = loyaltyDoc.data();
    const newCurrentPoints = Math.max(0, (data.currentPoints || 0) - pointsAwarded);
    await loyaltyRef.update({
        currentPoints: newCurrentPoints,
        lifetimeFlights: firestore_2.FieldValue.increment(-1),
        lifetimeSpend: firestore_2.FieldValue.increment(-(after.totalAmount || 0)),
        updatedAt: firestore_2.FieldValue.serverTimestamp(),
    });
    // Add deduction history
    await db.collection(`loyalty/${userId}/points_history`).add({
        type: 'deduct',
        points: -pointsAwarded,
        reason: 'Booking refunded',
        bookingId: event.params.bookingId,
        balanceAfter: newCurrentPoints,
        createdAt: firestore_2.FieldValue.serverTimestamp(),
    });
    console.log(`↩️ Deducted ${pointsAwarded} pts from user ${userId} (booking ${event.params.bookingId} refunded)`);
});
//# sourceMappingURL=loyalty.js.map