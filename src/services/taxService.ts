/**
 * Tax & Surcharge Engine — Deltablue Jet Air
 *
 * Country/airport-specific taxes, fuel surcharges, and fees.
 * Returns an itemized breakdown for fare display.
 */

export interface TaxItem {
    code: string;       // e.g. "YQ", "GB", "NG"
    name: string;
    amountCents: number;
    perPassenger: boolean;
}

export interface TaxBreakdown {
    items: TaxItem[];
    totalCents: number;
    passengerCount: number;
}

// ─── Airport Departure Taxes ───────────────────────────────

const DEPARTURE_TAXES: Record<string, TaxItem> = {
    // Country code → tax
    GB: { code: 'GB', name: 'UK Air Passenger Duty', amountCents: 1300, perPassenger: true },
    US: { code: 'US', name: 'US Departure Tax', amountCents: 3770, perPassenger: true },
    NG: { code: 'NG', name: 'Nigeria Passenger Service Charge', amountCents: 5000, perPassenger: true },
    AE: { code: 'AE', name: 'UAE Departure Fee', amountCents: 3520, perPassenger: true },
    FR: { code: 'FR', name: 'French Civil Aviation Tax', amountCents: 740, perPassenger: true },
    DE: { code: 'DE', name: 'German Air Transport Tax', amountCents: 1253, perPassenger: true },
    SG: { code: 'SG', name: 'Singapore Passenger Service Charge', amountCents: 2870, perPassenger: true },
    ZA: { code: 'ZA', name: 'South Africa Airport Tax', amountCents: 1100, perPassenger: true },
    GM: { code: 'GM', name: 'Gambia Airport Service Charge', amountCents: 2000, perPassenger: true },
    GH: { code: 'GH', name: 'Ghana Airport Tax', amountCents: 1500, perPassenger: true },
    SN: { code: 'SN', name: 'Senegal Travel Tax', amountCents: 1800, perPassenger: true },
};

// ─── Fuel Surcharges ───────────────────────────────────────

interface FuelSurchargeRule {
    maxDistanceKm: number | null;
    amountCents: number;
}

const FUEL_SURCHARGE_TIERS: FuelSurchargeRule[] = [
    { maxDistanceKm: 2000, amountCents: 2500 },     // Short-haul
    { maxDistanceKm: 5000, amountCents: 5000 },      // Medium-haul
    { maxDistanceKm: 10000, amountCents: 8500 },     // Long-haul
    { maxDistanceKm: null, amountCents: 12000 },     // Ultra long-haul
];

function getFuelSurcharge(distanceKm: number): number {
    for (const tier of FUEL_SURCHARGE_TIERS) {
        if (tier.maxDistanceKm === null || distanceKm <= tier.maxDistanceKm) {
            return tier.amountCents;
        }
    }
    return FUEL_SURCHARGE_TIERS[FUEL_SURCHARGE_TIERS.length - 1].amountCents;
}

// ─── Security & Insurance Levies ───────────────────────────

const SECURITY_FEE: TaxItem = {
    code: 'YR',
    name: 'Security & Insurance Levy',
    amountCents: 800,
    perPassenger: true,
};

const BOOKING_FEE: TaxItem = {
    code: 'OB',
    name: 'Online Booking Fee',
    amountCents: 500,
    perPassenger: false, // Per booking, not per passenger
};

// ─── Main Calculator ───────────────────────────────────────

/**
 * Calculate all taxes and surcharges for a route.
 *
 * @param departureCountry  ISO 2-letter country code of departure
 * @param arrivalCountry    ISO 2-letter country code of arrival
 * @param distanceKm        Great-circle distance of the route
 * @param passengerCount    Number of passengers in the booking
 */
export function calculateTaxes(
    departureCountry: string,
    arrivalCountry: string,
    distanceKm: number,
    passengerCount: number = 1,
): TaxBreakdown {
    const items: TaxItem[] = [];

    // Departure tax
    const depUpper = departureCountry.toUpperCase();
    if (DEPARTURE_TAXES[depUpper]) {
        items.push(DEPARTURE_TAXES[depUpper]);
    }

    // Arrival tax (some countries charge on arrival too)
    const arrUpper = arrivalCountry.toUpperCase();
    if (arrUpper !== depUpper && DEPARTURE_TAXES[arrUpper]) {
        items.push({
            ...DEPARTURE_TAXES[arrUpper],
            name: DEPARTURE_TAXES[arrUpper].name.replace('Departure', 'Arrival').replace('departure', 'arrival'),
        });
    }

    // Fuel surcharge
    const fuelAmount = getFuelSurcharge(distanceKm);
    items.push({
        code: 'YQ',
        name: 'Fuel Surcharge',
        amountCents: fuelAmount,
        perPassenger: true,
    });

    // Security levy
    items.push(SECURITY_FEE);

    // Booking fee (flat per booking)
    items.push(BOOKING_FEE);

    // Calculate total
    let totalCents = 0;
    for (const item of items) {
        totalCents += item.perPassenger ? item.amountCents * passengerCount : item.amountCents;
    }

    return { items, totalCents, passengerCount };
}

/**
 * Get a human-readable tax summary for display.
 */
export function formatTaxBreakdown(breakdown: TaxBreakdown): string[] {
    return breakdown.items.map(item => {
        const amount = `$${(item.amountCents / 100).toFixed(2)}`;
        const suffix = item.perPassenger ? ` × ${breakdown.passengerCount} pax` : ' (per booking)';
        return `${item.name} (${item.code}): ${amount}${suffix}`;
    });
}
