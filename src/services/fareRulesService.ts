/**
 * Fare Rules Engine — Deltablue Jet Air
 *
 * Tiered cancellation and change fee policies by fare class.
 * Replaces the basic 48h/24h calculator in paymentService.ts.
 */

// ─── Fare Class Rules ──────────────────────────────────────

export interface CancellationTier {
    minHoursBefore: number;
    maxHoursBefore: number | null;  // null = unlimited
    refundPercent: number;
    label: string;
}

export interface FareClassRules {
    fareClass: string;
    displayName: string;
    cancellation: CancellationTier[];
    changeFee: number;             // flat fee in USD
    changeAllowed: boolean;
    description: string;
}

const FARE_RULES: Record<string, FareClassRules> = {
    economy: {
        fareClass: 'economy',
        displayName: 'Economy',
        cancellation: [
            { minHoursBefore: 72, maxHoursBefore: null, refundPercent: 75, label: 'More than 72 hours before departure' },
            { minHoursBefore: 24, maxHoursBefore: 72, refundPercent: 50, label: '24 – 72 hours before departure' },
            { minHoursBefore: 0, maxHoursBefore: 24, refundPercent: 0, label: 'Less than 24 hours before departure' },
        ],
        changeFee: 75,
        changeAllowed: true,
        description: 'Standard economy fare with tiered refund policy.',
    },
    business: {
        fareClass: 'business',
        displayName: 'Business',
        cancellation: [
            { minHoursBefore: 72, maxHoursBefore: null, refundPercent: 90, label: 'More than 72 hours before departure' },
            { minHoursBefore: 24, maxHoursBefore: 72, refundPercent: 75, label: '24 – 72 hours before departure' },
            { minHoursBefore: 0, maxHoursBefore: 24, refundPercent: 25, label: 'Less than 24 hours before departure' },
        ],
        changeFee: 0,
        changeAllowed: true,
        description: 'Premium business fare with generous refund and free changes.',
    },
    first: {
        fareClass: 'first',
        displayName: 'First Class',
        cancellation: [
            { minHoursBefore: 0, maxHoursBefore: null, refundPercent: 100, label: 'Anytime before departure' },
        ],
        changeFee: 0,
        changeAllowed: true,
        description: 'Fully flexible first class fare. 100% refundable minus $25 administrative fee.',
    },
};

const FIRST_CLASS_ADMIN_FEE = 2500; // $25.00 in cents

// ─── Core API ──────────────────────────────────────────────

export function getFareRules(fareClass: string): FareClassRules {
    const normalized = fareClass.toLowerCase().replace(/[^a-z]/g, '');
    return FARE_RULES[normalized] || FARE_RULES.economy;
}

export function getAllFareRules(): FareClassRules[] {
    return Object.values(FARE_RULES);
}

// ─── Cancellation Fee Calculation ──────────────────────────

export interface CancellationResult {
    eligible: boolean;
    refundPercent: number;
    refundAmount: number;          // in cents
    cancellationFee: number;       // in cents
    adminFee: number;              // in cents (first class only)
    tierLabel: string;
    fareClass: string;
    fareDisplayName: string;
    policyDescription: string;
}

/**
 * Calculate cancellation refund based on fare class and hours before departure.
 */
export function calculateCancellationFee(
    fareClass: string,
    totalAmountCents: number,
    hoursBeforeDeparture: number,
): CancellationResult {
    const rules = getFareRules(fareClass);

    // Find matching tier (sorted by most generous first)
    let matchedTier: CancellationTier | null = null;
    for (const tier of rules.cancellation) {
        const meetsMin = hoursBeforeDeparture >= tier.minHoursBefore;
        const meetsMax = tier.maxHoursBefore === null || hoursBeforeDeparture < tier.maxHoursBefore;
        if (meetsMin && meetsMax) {
            matchedTier = tier;
            break;
        }
    }

    if (!matchedTier) {
        return {
            eligible: false,
            refundPercent: 0,
            refundAmount: 0,
            cancellationFee: totalAmountCents,
            adminFee: 0,
            tierLabel: 'No applicable refund tier',
            fareClass: rules.fareClass,
            fareDisplayName: rules.displayName,
            policyDescription: rules.description,
        };
    }

    const adminFee = rules.fareClass === 'first' ? FIRST_CLASS_ADMIN_FEE : 0;
    const baseRefund = Math.round((totalAmountCents * matchedTier.refundPercent) / 100);
    const refundAmount = Math.max(0, baseRefund - adminFee);
    const cancellationFee = totalAmountCents - refundAmount;

    return {
        eligible: matchedTier.refundPercent > 0,
        refundPercent: matchedTier.refundPercent,
        refundAmount,
        cancellationFee,
        adminFee,
        tierLabel: matchedTier.label,
        fareClass: rules.fareClass,
        fareDisplayName: rules.displayName,
        policyDescription: rules.description,
    };
}

// ─── EU261 / DOT Compensation Calculator ───────────────────

export type CompensationType = 'EU261' | 'DOT';

export interface CompensationResult {
    type: CompensationType;
    eligible: boolean;
    amount: number;            // in EUR (EU261) or USD (DOT)
    currency: string;
    reason: string;
}

/**
 * Calculate EU261 compensation based on delay duration and route distance.
 * Regulation (EC) No 261/2004.
 */
export function calculateEU261(
    delayHours: number,
    routeDistanceKm: number,
): CompensationResult {
    if (delayHours < 3) {
        return { type: 'EU261', eligible: false, amount: 0, currency: 'EUR', reason: 'Delay under 3 hours — no compensation applicable.' };
    }

    // EU261 tiers:
    // ≤ 1500 km: €250
    // 1500–3500 km: €400
    // > 3500 km: €600
    let amount = 250;
    if (routeDistanceKm > 3500) {
        amount = 600;
    } else if (routeDistanceKm > 1500) {
        amount = 400;
    }

    // 50% reduction for delays between 3–4 hours on long-haul
    if (delayHours < 4 && routeDistanceKm > 3500) {
        amount = Math.round(amount / 2);
    }

    return {
        type: 'EU261',
        eligible: true,
        amount,
        currency: 'EUR',
        reason: `${delayHours}h delay on ${routeDistanceKm.toLocaleString()}km route — €${amount} compensation per EU Regulation 261/2004.`,
    };
}

/**
 * Calculate DOT (US Department of Transportation) compensation for tarmac delays.
 * Based on DOT guidelines for significant delays.
 */
export function calculateDOTCompensation(
    delayHours: number,
    isDomestic: boolean,
): CompensationResult {
    const threshold = isDomestic ? 3 : 4;

    if (delayHours < threshold) {
        return {
            type: 'DOT',
            eligible: false,
            amount: 0,
            currency: 'USD',
            reason: `Delay under ${threshold} hours — below DOT tarmac delay threshold for ${isDomestic ? 'domestic' : 'international'} flights.`,
        };
    }

    // DOT doesn't mandate specific compensation amounts like EU261,
    // but airlines must offer re-booking or refund. We calculate
    // a goodwill amount based on delay severity.
    let amount = 200;
    if (delayHours >= 6) amount = 400;
    if (delayHours >= 8) amount = 600;

    return {
        type: 'DOT',
        eligible: true,
        amount,
        currency: 'USD',
        reason: `${delayHours}h tarmac delay on ${isDomestic ? 'domestic' : 'international'} flight — $${amount} goodwill compensation.`,
    };
}
