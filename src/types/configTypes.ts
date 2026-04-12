export interface AppConfig {
    id: string; // The type of config e.g., 'fare_classes', 'countries', 'baggage_rules'
}

export interface FareClassConfig extends AppConfig {
    id: 'fare_classes';
    classes: {
        id: string;
        name: string;
        description: string;
        multiplier: number;
        features: { included: boolean; name: string }[];
        isPopular?: boolean;
    }[];
}

export interface CountryConfig extends AppConfig {
    id: 'countries';
    countries: {
        code: string;
        name: string;
        dialCode: string;
        flag: string;
    }[];
}

export interface AircraftLayoutConfig {
    id: string;             // e.g., 'B737-800', 'B737-MAX', 'E190'
    name: string;           
    totalRows: number;
    columns: string[];      // e.g., ['A', 'KEY_AISLE', 'B', 'C']
    zones: SeatZone[];
}

export interface SeatZone {
    name: string;           // 'First Class', 'Front Cabin', 'Exit Row', 'Standard'
    rowStart: number;
    rowEnd: number;
    priceCents: number;
    color: string;          // e.g., 'bg-amber-100 border-amber-300 text-amber-700'
}

export interface AncillaryCatalogConfig extends AppConfig {
    id: 'ancillaries';
    meals: {
        id: string;
        name: string;
        dietaryType: string;
        description: string;
        priceCents: number;
        included: boolean;
        premiumOnly: boolean;  // e.g. Free for First/Business
    }[];
    lounges: {
        id: string;
        name: string;
        airportCode: string;
        terminal: string;
        priceCents: number;
        amenities: string[];
        openHours: string;
    }[];
    insurance: {
        id: string;
        name: string;
        coverageType: 'basic' | 'standard' | 'premium';
        premiumCents: number;
        coverageAmountCents: number;
        coverageDetails: string[];
    }[];
}

export interface BaggageRulesConfig extends AppConfig {
    id: 'baggage_rules';
    fareAllowances: Record<string, {
        cabin: { count: number; maxWeightKg: number };
        checked: { count: number; maxWeightKg: number };
        personalItem: boolean;
        displayName: string;
        extraBagFeeCents: number;
    }>;
    excessFeePerKgCents: number;
    specialItems: {
        id: string;
        name: string;
        description: string;
        feeCents: number;
        icon: string;
        requiresApproval: boolean;
    }[];
}

export interface PaymentProvidersConfig extends AppConfig {
    id: 'payment_providers';
    providers: {
        id: string;
        name: string;
        description: string;
        icon: string;
        color: string;
        active: boolean;
    }[];
}
