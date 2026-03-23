/**
 * Dynamic Pricing Service — Deltablue Jet Air
 *
 * Demand-based pricing engine using load factor, booking curve,
 * day-of-week and seasonal multipliers, and fare class buckets.
 */

// ─── Types ─────────────────────────────────────────────────

export type FareClass = 'Y' | 'B' | 'M' | 'H' | 'Q' | 'V' | 'L';

export interface FareClassBucket {
    code: FareClass;
    name: string;
    multiplier: number;       // Relative to base fare
    seatsAllocated: number;   // Default allocation count
    restrictions: string;
}

export interface PricingResult {
    baseFare: number;
    adjustedFare: number;
    loadFactorMultiplier: number;
    bookingCurveMultiplier: number;
    dayOfWeekMultiplier: number;
    seasonalMultiplier: number;
    fareClass: FareClass;
    fareClassName: string;
    breakdown: PricingBreakdownItem[];
}

export interface PricingBreakdownItem {
    label: string;
    factor: number;
    description: string;
}

// ─── Fare Class Buckets ────────────────────────────────────

export const FARE_CLASSES: FareClassBucket[] = [
    { code: 'Y', name: 'Full Economy',     multiplier: 1.0,  seatsAllocated: 20,  restrictions: 'Fully flexible, refundable' },
    { code: 'B', name: 'Economy Flex',      multiplier: 0.85, seatsAllocated: 30,  restrictions: 'Changeable, partially refundable' },
    { code: 'M', name: 'Economy Standard',  multiplier: 0.70, seatsAllocated: 40,  restrictions: 'Changeable with fee, non-refundable' },
    { code: 'H', name: 'Economy Saver',     multiplier: 0.55, seatsAllocated: 30,  restrictions: 'Limited changes, non-refundable' },
    { code: 'Q', name: 'Economy Promo',     multiplier: 0.45, seatsAllocated: 20,  restrictions: 'No changes, non-refundable' },
    { code: 'V', name: 'Deep Discount',     multiplier: 0.35, seatsAllocated: 20,  restrictions: 'No changes, no baggage, non-refundable' },
    { code: 'L', name: 'Last-Minute',       multiplier: 1.20, seatsAllocated: 10,  restrictions: 'Fully flexible, premium pricing' },
];

// ─── Load Factor Pricing ───────────────────────────────────

/**
 * Higher load factor = higher price.
 * Starts at 0.80 when empty, rises to 1.60 when nearly full.
 */
function getLoadFactorMultiplier(loadFactor: number): number {
    // loadFactor is 0.0 (empty) to 1.0 (full)
    const clamped = Math.max(0, Math.min(1, loadFactor));

    if (clamped < 0.3) return 0.80;
    if (clamped < 0.5) return 0.90;
    if (clamped < 0.65) return 1.00;
    if (clamped < 0.80) return 1.15;
    if (clamped < 0.90) return 1.35;
    return 1.60;  // >90% full
}

// ─── Booking Curve ─────────────────────────────────────────

/**
 * Price increases as departure date approaches.
 * Days before departure → multiplier.
 */
function getBookingCurveMultiplier(daysBeforeDeparture: number): number {
    if (daysBeforeDeparture >= 90) return 0.75;
    if (daysBeforeDeparture >= 60) return 0.85;
    if (daysBeforeDeparture >= 30) return 0.95;
    if (daysBeforeDeparture >= 14) return 1.05;
    if (daysBeforeDeparture >= 7)  return 1.20;
    if (daysBeforeDeparture >= 3)  return 1.40;
    if (daysBeforeDeparture >= 1)  return 1.55;
    return 1.70;  // Day-of booking
}

// ─── Day-of-Week Pricing ───────────────────────────────────

/**
 * Business travel days are more expensive.
 * 0 = Sunday, 1 = Monday, etc.
 */
const DAY_MULTIPLIERS: Record<number, number> = {
    0: 0.90, // Sunday
    1: 1.10, // Monday (business)
    2: 1.05, // Tuesday
    3: 1.00, // Wednesday
    4: 1.05, // Thursday
    5: 1.15, // Friday (weekend start)
    6: 0.95, // Saturday
};

function getDayOfWeekMultiplier(dayOfWeek: number): number {
    return DAY_MULTIPLIERS[dayOfWeek] ?? 1.0;
}

// ─── Seasonal Pricing ──────────────────────────────────────

/**
 * Peak travel seasons command premium pricing.
 * Month 0 = January.
 */
const SEASONAL_MULTIPLIERS: Record<number, number> = {
    0: 0.85,  // Jan — low
    1: 0.90,  // Feb
    2: 1.00,  // Mar — spring break
    3: 1.05,  // Apr
    4: 1.00,  // May
    5: 1.15,  // Jun — summer start
    6: 1.25,  // Jul — peak summer
    7: 1.25,  // Aug — peak summer
    8: 1.00,  // Sep
    9: 0.90,  // Oct
    10: 0.95, // Nov — Thanksgiving
    11: 1.20, // Dec — holidays
};

function getSeasonalMultiplier(month: number): number {
    return SEASONAL_MULTIPLIERS[month] ?? 1.0;
}

// ─── Fare Class Determination ──────────────────────────────

/**
 * Determine the appropriate fare class based on load factor and booking timing.
 */
function determineFareClass(loadFactor: number, daysBeforeDeparture: number): FareClassBucket {
    // Last-minute booking on high-load flight
    if (daysBeforeDeparture <= 1 && loadFactor > 0.8) {
        return FARE_CLASSES.find(f => f.code === 'L')!;
    }

    // Map load factor to fare class progression
    if (loadFactor >= 0.90) return FARE_CLASSES.find(f => f.code === 'Y')!;
    if (loadFactor >= 0.80) return FARE_CLASSES.find(f => f.code === 'B')!;
    if (loadFactor >= 0.65) return FARE_CLASSES.find(f => f.code === 'M')!;
    if (loadFactor >= 0.50) return FARE_CLASSES.find(f => f.code === 'H')!;
    if (loadFactor >= 0.30) return FARE_CLASSES.find(f => f.code === 'Q')!;
    return FARE_CLASSES.find(f => f.code === 'V')!;
}

// ─── Main Pricing Engine ──────────────────────────────────

export interface PricingInput {
    baseFareCents: number;       // Route base fare in cents
    totalSeats: number;          // Aircraft capacity
    bookedSeats: number;         // Currently booked
    departureDate: Date;         // Departure date
    bookingDate?: Date;          // When customer is booking (defaults to now)
}

/**
 * Calculate dynamic price for a flight.
 */
export function calculateDynamicPrice(input: PricingInput): PricingResult {
    const { baseFareCents, totalSeats, bookedSeats, departureDate, bookingDate } = input;
    const now = bookingDate || new Date();

    const loadFactor = totalSeats > 0 ? bookedSeats / totalSeats : 0;
    const daysBeforeDeparture = Math.max(0, Math.floor((departureDate.getTime() - now.getTime()) / (86400000)));
    const dayOfWeek = departureDate.getDay();
    const month = departureDate.getMonth();

    const lfMult = getLoadFactorMultiplier(loadFactor);
    const bcMult = getBookingCurveMultiplier(daysBeforeDeparture);
    const dowMult = getDayOfWeekMultiplier(dayOfWeek);
    const sMult = getSeasonalMultiplier(month);

    const fareClass = determineFareClass(loadFactor, daysBeforeDeparture);
    const totalMultiplier = lfMult * bcMult * dowMult * sMult * fareClass.multiplier;
    const adjustedFare = Math.round(baseFareCents * totalMultiplier);

    const breakdown: PricingBreakdownItem[] = [
        { label: 'Base Fare',       factor: 1.0,    description: `Route base: $${(baseFareCents / 100).toFixed(2)}` },
        { label: 'Load Factor',     factor: lfMult,  description: `${Math.round(loadFactor * 100)}% occupancy → ×${lfMult}` },
        { label: 'Booking Curve',   factor: bcMult,  description: `${daysBeforeDeparture} days out → ×${bcMult}` },
        { label: 'Day of Week',     factor: dowMult, description: `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek]} → ×${dowMult}` },
        { label: 'Season',          factor: sMult,   description: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month]} → ×${sMult}` },
        { label: 'Fare Class',      factor: fareClass.multiplier, description: `${fareClass.name} (${fareClass.code}) → ×${fareClass.multiplier}` },
    ];

    return {
        baseFare: baseFareCents,
        adjustedFare,
        loadFactorMultiplier: lfMult,
        bookingCurveMultiplier: bcMult,
        dayOfWeekMultiplier: dowMult,
        seasonalMultiplier: sMult,
        fareClass: fareClass.code,
        fareClassName: fareClass.name,
        breakdown,
    };
}

// ─── Revenue Forecast ──────────────────────────────────────

export interface RevenueForecast {
    currentRevenue: number;
    projectedRevenue: number;
    optimalLoadFactor: number;
    recommendedFareAdjustment: number; // percentage
}

/**
 * Forecast revenue based on current bookings and pricing trend.
 */
export function forecastRevenue(
    baseFareCents: number,
    totalSeats: number,
    currentBookings: number,
    departureDate: Date,
): RevenueForecast {
    const currentLoadFactor = currentBookings / totalSeats;
    const currentPrice = calculateDynamicPrice({
        baseFareCents, totalSeats, bookedSeats: currentBookings, departureDate,
    });

    const currentRevenue = currentBookings * currentPrice.adjustedFare;

    // Project to target 85% load
    const targetBookings = Math.round(totalSeats * 0.85);
    const additionalBookings = Math.max(0, targetBookings - currentBookings);
    const avgFuturePrice = calculateDynamicPrice({
        baseFareCents, totalSeats, bookedSeats: Math.round((currentBookings + targetBookings) / 2), departureDate,
    });
    const projectedRevenue = currentRevenue + (additionalBookings * avgFuturePrice.adjustedFare);

    // Recommend fare adjustment
    let recommendedAdj = 0;
    if (currentLoadFactor < 0.5) recommendedAdj = -10; // Lower prices to stimulate demand
    else if (currentLoadFactor > 0.9) recommendedAdj = 15; // Raise prices — high demand

    return {
        currentRevenue,
        projectedRevenue,
        optimalLoadFactor: 0.85,
        recommendedFareAdjustment: recommendedAdj,
    };
}
