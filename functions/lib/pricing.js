"use strict";
/**
 * Dynamic Pricing Cloud Function — Revenue Management Engine
 *
 * Server-side pricing calculation to prevent:
 * - Competitors reverse-engineering pricing strategy
 * - Client-side price manipulation
 *
 * Returns only the final price and fare class — never the multipliers or algorithm.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.forecastRevenueSecure = exports.calculateDynamicPriceSecure = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const FARE_CLASSES = [
    { code: 'Y', name: 'Full Economy', multiplier: 1.0, seatsAllocated: 20, restrictions: 'Fully flexible, refundable' },
    { code: 'B', name: 'Economy Flex', multiplier: 0.85, seatsAllocated: 30, restrictions: 'Changeable, partially refundable' },
    { code: 'M', name: 'Economy Standard', multiplier: 0.70, seatsAllocated: 40, restrictions: 'Changeable with fee, non-refundable' },
    { code: 'H', name: 'Economy Saver', multiplier: 0.55, seatsAllocated: 30, restrictions: 'Limited changes, non-refundable' },
    { code: 'Q', name: 'Economy Promo', multiplier: 0.45, seatsAllocated: 20, restrictions: 'No changes, non-refundable' },
    { code: 'V', name: 'Deep Discount', multiplier: 0.35, seatsAllocated: 20, restrictions: 'No changes, no baggage, non-refundable' },
    { code: 'L', name: 'Last-Minute', multiplier: 1.20, seatsAllocated: 10, restrictions: 'Fully flexible, premium pricing' },
];
// ─── Pricing Multipliers (HIDDEN from frontend) ─────────────
function getLoadFactorMultiplier(loadFactor) {
    const clamped = Math.max(0, Math.min(1, loadFactor));
    if (clamped < 0.3)
        return 0.80;
    if (clamped < 0.5)
        return 0.90;
    if (clamped < 0.65)
        return 1.00;
    if (clamped < 0.80)
        return 1.15;
    if (clamped < 0.90)
        return 1.35;
    return 1.60;
}
function getBookingCurveMultiplier(daysBeforeDeparture) {
    if (daysBeforeDeparture >= 90)
        return 0.75;
    if (daysBeforeDeparture >= 60)
        return 0.85;
    if (daysBeforeDeparture >= 30)
        return 0.95;
    if (daysBeforeDeparture >= 14)
        return 1.05;
    if (daysBeforeDeparture >= 7)
        return 1.20;
    if (daysBeforeDeparture >= 3)
        return 1.40;
    if (daysBeforeDeparture >= 1)
        return 1.55;
    return 1.70;
}
const DAY_MULTIPLIERS = {
    0: 0.90, 1: 1.10, 2: 1.05, 3: 1.00, 4: 1.05, 5: 1.15, 6: 0.95,
};
function getDayOfWeekMultiplier(dayOfWeek) {
    return DAY_MULTIPLIERS[dayOfWeek] ?? 1.0;
}
const SEASONAL_MULTIPLIERS = {
    0: 0.85, 1: 0.90, 2: 1.00, 3: 1.05, 4: 1.00, 5: 1.15,
    6: 1.25, 7: 1.25, 8: 1.00, 9: 0.90, 10: 0.95, 11: 1.20,
};
function getSeasonalMultiplier(month) {
    return SEASONAL_MULTIPLIERS[month] ?? 1.0;
}
function determineFareClass(loadFactor, daysBeforeDeparture) {
    if (daysBeforeDeparture <= 1 && loadFactor > 0.8) {
        return FARE_CLASSES.find(f => f.code === 'L');
    }
    if (loadFactor >= 0.90)
        return FARE_CLASSES.find(f => f.code === 'Y');
    if (loadFactor >= 0.80)
        return FARE_CLASSES.find(f => f.code === 'B');
    if (loadFactor >= 0.65)
        return FARE_CLASSES.find(f => f.code === 'M');
    if (loadFactor >= 0.50)
        return FARE_CLASSES.find(f => f.code === 'H');
    if (loadFactor >= 0.30)
        return FARE_CLASSES.find(f => f.code === 'Q');
    return FARE_CLASSES.find(f => f.code === 'V');
}
// ─── Cloud Function ──────────────────────────────────────────
exports.calculateDynamicPriceSecure = (0, https_1.onCall)(async (request) => {
    // No auth required — pricing should be visible to guests for search results
    const { flightId } = request.data;
    if (!flightId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing flightId.');
    }
    // Fetch flight data server-side (never trust client input for pricing)
    const flightDoc = await db.doc(`flights/${flightId}`).get();
    if (!flightDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Flight not found.');
    }
    const flight = flightDoc.data();
    const totalSeats = flight.totalSeats || flight.aircraft?.totalSeats || 180;
    const bookedSeats = flight.bookedSeats || 0;
    const baseFareCents = flight.baseFare || flight.price || 30000; // default $300
    const departureTime = flight.departureTime?.toDate?.();
    if (!departureTime) {
        throw new https_1.HttpsError('failed-precondition', 'Flight has no departure time.');
    }
    const now = new Date();
    const loadFactor = totalSeats > 0 ? bookedSeats / totalSeats : 0;
    const daysBeforeDeparture = Math.max(0, Math.floor((departureTime.getTime() - now.getTime()) / 86400000));
    const dayOfWeek = departureTime.getDay();
    const month = departureTime.getMonth();
    const lfMult = getLoadFactorMultiplier(loadFactor);
    const bcMult = getBookingCurveMultiplier(daysBeforeDeparture);
    const dowMult = getDayOfWeekMultiplier(dayOfWeek);
    const sMult = getSeasonalMultiplier(month);
    const fareClass = determineFareClass(loadFactor, daysBeforeDeparture);
    const totalMultiplier = lfMult * bcMult * dowMult * sMult * fareClass.multiplier;
    const adjustedFare = Math.round(baseFareCents * totalMultiplier);
    // Return ONLY the final price — never expose multipliers or algorithm
    return {
        adjustedFare,
        fareClass: fareClass.code,
        fareClassName: fareClass.name,
        restrictions: fareClass.restrictions,
        // Simplified breakdown for display (no multiplier values exposed)
        breakdown: [
            { label: 'Base Fare', description: `$${(baseFareCents / 100).toFixed(2)}` },
            { label: 'Demand Adjustment', description: loadFactor > 0.7 ? 'High demand' : loadFactor > 0.4 ? 'Moderate demand' : 'Low demand' },
            { label: 'Fare Class', description: fareClass.name },
        ],
    };
});
// ─── Revenue Forecast (admin-only) ────────────────────────────
exports.forecastRevenueSecure = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in.');
    }
    // Check for admin/ops role
    const role = request.auth.token.role;
    if (!role || !['admin', 'super_admin', 'ops_manager'].includes(role)) {
        throw new https_1.HttpsError('permission-denied', 'Admin access required.');
    }
    const { flightId } = request.data;
    if (!flightId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing flightId.');
    }
    const flightDoc = await db.doc(`flights/${flightId}`).get();
    if (!flightDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Flight not found.');
    }
    const flight = flightDoc.data();
    const totalSeats = flight.totalSeats || flight.aircraft?.totalSeats || 180;
    const currentBookings = flight.bookedSeats || 0;
    const baseFareCents = flight.baseFare || flight.price || 30000;
    const departureTime = flight.departureTime?.toDate?.() || new Date();
    const currentLoadFactor = currentBookings / totalSeats;
    // Calculate current and projected revenue server-side
    const now = new Date();
    const daysOut = Math.max(0, Math.floor((departureTime.getTime() - now.getTime()) / 86400000));
    const lfMult = getLoadFactorMultiplier(currentLoadFactor);
    const bcMult = getBookingCurveMultiplier(daysOut);
    const dowMult = getDayOfWeekMultiplier(departureTime.getDay());
    const sMult = getSeasonalMultiplier(departureTime.getMonth());
    const fareClass = determineFareClass(currentLoadFactor, daysOut);
    const currentPrice = Math.round(baseFareCents * lfMult * bcMult * dowMult * sMult * fareClass.multiplier);
    const currentRevenue = currentBookings * currentPrice;
    const targetBookings = Math.round(totalSeats * 0.85);
    const additionalBookings = Math.max(0, targetBookings - currentBookings);
    const midLoadFactor = (currentBookings + targetBookings) / (2 * totalSeats);
    const midLfMult = getLoadFactorMultiplier(midLoadFactor);
    const midFareClass = determineFareClass(midLoadFactor, daysOut);
    const avgFuturePrice = Math.round(baseFareCents * midLfMult * bcMult * dowMult * sMult * midFareClass.multiplier);
    const projectedRevenue = currentRevenue + (additionalBookings * avgFuturePrice);
    let recommendedAdj = 0;
    if (currentLoadFactor < 0.5)
        recommendedAdj = -10;
    else if (currentLoadFactor > 0.9)
        recommendedAdj = 15;
    return {
        currentRevenue,
        projectedRevenue,
        optimalLoadFactor: 0.85,
        recommendedFareAdjustment: recommendedAdj,
    };
});
//# sourceMappingURL=pricing.js.map