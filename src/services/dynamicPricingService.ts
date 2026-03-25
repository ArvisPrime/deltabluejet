/**
 * Dynamic Pricing Service — Deltablue Jet Air
 *
 * Frontend facade that calls the server-side pricing Cloud Function.
 * The pricing algorithm, multipliers, and fare class buckets are
 * now HIDDEN on the server — only final prices are returned.
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase.config';

// ─── Types (display-only) ─────────────────────────────────

export type FareClass = 'Y' | 'B' | 'M' | 'H' | 'Q' | 'V' | 'L';

export interface PricingResult {
    baseFare: number;
    adjustedFare: number;
    fareClass: FareClass;
    fareClassName: string;
    restrictions?: string;
    breakdown: PricingBreakdownItem[];
    // Multipliers removed — no longer exposed to frontend
    loadFactorMultiplier?: number;
    bookingCurveMultiplier?: number;
    dayOfWeekMultiplier?: number;
    seasonalMultiplier?: number;
}

export interface PricingBreakdownItem {
    label: string;
    description: string;
    factor?: number;
}

export interface PricingInput {
    baseFareCents: number;
    totalSeats: number;
    bookedSeats: number;
    departureDate: Date;
    bookingDate?: Date;
}

// ─── Cloud Function Callables ─────────────────────────────

const calculateDynamicPriceSecureFn = httpsCallable<
    { flightId: string },
    { adjustedFare: number; fareClass: FareClass; fareClassName: string; restrictions: string; breakdown: PricingBreakdownItem[] }
>(functions, 'calculateDynamicPriceSecure');

const forecastRevenueSecureFn = httpsCallable<
    { flightId: string },
    { currentRevenue: number; projectedRevenue: number; optimalLoadFactor: number; recommendedFareAdjustment: number }
>(functions, 'forecastRevenueSecure');

/**
 * Calculate dynamic price for a flight (via Cloud Function).
 * Returns only the final price and fare class — algorithm is hidden server-side.
 */
export function calculateDynamicPrice(input: PricingInput & { flightId?: string }): PricingResult {
    // For backwards compatibility — return a placeholder until async resolves.
    // Use calculateDynamicPriceAsync for the real server-side call.
    return {
        baseFare: input.baseFareCents,
        adjustedFare: input.baseFareCents,
        fareClass: 'M',
        fareClassName: 'Economy Standard',
        breakdown: [{ label: 'Loading...', description: 'Fetching server price' }],
    };
}

/**
 * Async version — calls the Cloud Function for real pricing.
 * This is the preferred method for all new code.
 */
export async function calculateDynamicPriceAsync(flightId: string): Promise<PricingResult> {
    const result = await calculateDynamicPriceSecureFn({ flightId });
    return {
        baseFare: 0, // Not exposed by server
        adjustedFare: result.data.adjustedFare,
        fareClass: result.data.fareClass,
        fareClassName: result.data.fareClassName,
        restrictions: result.data.restrictions,
        breakdown: result.data.breakdown,
    };
}

// ─── Revenue Forecast ──────────────────────────────────────

export interface RevenueForecast {
    currentRevenue: number;
    projectedRevenue: number;
    optimalLoadFactor: number;
    recommendedFareAdjustment: number;
}

/**
 * Forecast revenue (admin-only, via Cloud Function).
 */
export async function forecastRevenue(flightId: string): Promise<RevenueForecast> {
    const result = await forecastRevenueSecureFn({ flightId });
    return result.data;
}

// ─── Fare Class Display Data (non-sensitive) ──────────────

export interface FareClassBucket {
    code: FareClass;
    name: string;
    restrictions: string;
}

/** Display-only fare class info (no multipliers or seat allocations) */
export const FARE_CLASSES: FareClassBucket[] = [
    { code: 'Y', name: 'Full Economy',     restrictions: 'Fully flexible, refundable' },
    { code: 'B', name: 'Economy Flex',      restrictions: 'Changeable, partially refundable' },
    { code: 'M', name: 'Economy Standard',  restrictions: 'Changeable with fee, non-refundable' },
    { code: 'H', name: 'Economy Saver',     restrictions: 'Limited changes, non-refundable' },
    { code: 'Q', name: 'Economy Promo',     restrictions: 'No changes, non-refundable' },
    { code: 'V', name: 'Deep Discount',     restrictions: 'No changes, no baggage, non-refundable' },
    { code: 'L', name: 'Last-Minute',       restrictions: 'Fully flexible, premium pricing' },
];
