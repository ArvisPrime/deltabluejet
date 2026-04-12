import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { 
    FareClassConfig, 
    CountryConfig, 
    BaggageRulesConfig, 
    AncillaryCatalogConfig, 
    PaymentProvidersConfig,
    AircraftLayoutConfig 
} from '../types/configTypes';

/**
 * Run this to seed the Firestore database with the standard hardcoded configs.
 * It is idempotent (will overwrite existing with these defaults).
 */
export async function seedConfigurationCollections() {
    try {
        console.log('Seeding configuration collections...');

        // 1. Fares
        const fares: FareClassConfig = {
            id: 'fare_classes',
            classes: [
                {
                    id: 'economy',
                    name: 'Economy Standard',
                    description: 'Great value with essential comforts.',
                    multiplier: 1.0,
                    features: [
                        { included: true, name: '1x Cabin Bag (7kg)' },
                        { included: false, name: 'Checked Baggage' },
                        { included: false, name: 'Seat Selection' },
                        { included: false, name: 'Flight Changes' }
                    ]
                },
                {
                    id: 'premium',
                    name: 'Premium Economy',
                    description: 'Extra comfort and flexibility for a smoother journey.',
                    multiplier: 1.5,
                    isPopular: true,
                    features: [
                        { included: true, name: '1x Cabin Bag (7kg)' },
                        { included: true, name: '1x Checked Bag (23kg)' },
                        { included: true, name: 'Standard Seat Selection' },
                        { included: true, name: 'Flight Changes (Fee applies)' }
                    ]
                },
                {
                    id: 'business',
                    name: 'Business Class',
                    description: 'Premium experience with maximum flexibility and comfort.',
                    multiplier: 2.5,
                    features: [
                        { included: true, name: '2x Cabin Bags (14kg total)' },
                        { included: true, name: '2x Checked Bags (32kg each)' },
                        { included: true, name: 'Any Seat Selection' },
                        { included: true, name: 'Free Flight Changes' },
                        { included: true, name: 'Lounge Access' },
                        { included: true, name: 'Priority Boarding' }
                    ]
                }
            ]
        };

        // 1.5 Countries
        const countries: CountryConfig = {
            id: 'countries',
            countries: [
                { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
                { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
                { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
                { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
                { code: 'SL', name: 'Sierra Leone', dialCode: '+232', flag: '🇸🇱' },
                { code: 'GM', name: 'Gambia', dialCode: '+220', flag: '🇬🇲' },
                { code: 'SN', name: 'Senegal', dialCode: '+221', flag: '🇸🇳' },
                { code: 'GN', name: 'Guinea', dialCode: '+224', flag: '🇬🇳' },
                { code: 'LR', name: 'Liberia', dialCode: '+231', flag: '🇱🇷' },
                { code: 'MA', name: 'Morocco', dialCode: '+212', flag: '🇲🇦' },
                { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
                { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
                { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
                { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
            ]
        };

        // 2. Baggage
        const baggage: BaggageRulesConfig = {
            id: 'baggage_rules',
            excessFeePerKgCents: 1500, // $15 per kg
            fareAllowances: {
                economy: {
                    cabin: { count: 1, maxWeightKg: 7 },
                    checked: { count: 0, maxWeightKg: 0 },
                    personalItem: true,
                    displayName: 'Economy Light',
                    extraBagFeeCents: 5000
                },
                premium: {
                    cabin: { count: 1, maxWeightKg: 7 },
                    checked: { count: 1, maxWeightKg: 23 },
                    personalItem: true,
                    displayName: 'Premium Standard',
                    extraBagFeeCents: 4500
                },
                business: {
                    cabin: { count: 2, maxWeightKg: 7 },
                    checked: { count: 2, maxWeightKg: 32 },
                    personalItem: true,
                    displayName: 'Business Premium',
                    extraBagFeeCents: 3500
                },
                first: {
                    cabin: { count: 2, maxWeightKg: 7 },
                    checked: { count: 3, maxWeightKg: 32 },
                    personalItem: true,
                    displayName: 'First Class Royal',
                    extraBagFeeCents: 0
                }
            },
            specialItems: [
                {
                    id: 'sp-surf',
                    name: 'Surfboard / Windsurf',
                    description: 'Must be securely packed. Max length 2.5m.',
                    feeCents: 4500,
                    icon: 'surfing',
                    requiresApproval: false
                },
                {
                    id: 'sp-bike',
                    name: 'Bicycle',
                    description: 'Pedals removed, handlebars fixed sideways. Max 32kg.',
                    feeCents: 5000,
                    icon: 'pedal_bike',
                    requiresApproval: false
                },
                {
                    id: 'sp-golf',
                    name: 'Golf Equipment',
                    description: 'One golf bag containing clubs, balls, and one pair of shoes.',
                    feeCents: 3500,
                    icon: 'sports_golf',
                    requiresApproval: false
                },
                {
                    id: 'sp-pet-cabin',
                    name: 'Pet in Cabin (Dog/Cat)',
                    description: 'Small pet in a waterproof soft carrier under the seat. Max weight 8kg including carrier.',
                    feeCents: 7500,
                    icon: 'pets',
                    requiresApproval: true
                },
                {
                    id: 'sp-pet-hold',
                    name: 'Pet in Hold',
                    description: 'Carried in a rigid IATA-approved crate in the cargo hold.',
                    feeCents: 12000,
                    icon: 'cruelty_free',
                    requiresApproval: true
                },
                {
                    id: 'sp-music',
                    name: 'Musical Instrument (Large)',
                    description: 'e.g., Cello, Double Bass. Must be packed in a hard case or a separate seat booked.',
                    feeCents: 6000,
                    icon: 'music_note',
                    requiresApproval: true
                }
            ]
        };

        // 3. Ancillaries (Meals, Lounges, Insurance)
        const ancillaries: AncillaryCatalogConfig = {
            id: 'ancillaries',
            meals: [
                { id: 'std', name: 'Standard Meal', dietaryType: 'standard', description: 'Chef-curated main course with salad and dessert', priceCents: 0, included: true, premiumOnly: false },
                { id: 'veg', name: 'Vegetarian', dietaryType: 'vegetarian', description: 'Plant-based entrée with seasonal vegetables', priceCents: 0, included: true, premiumOnly: false },
                { id: 'vgn', name: 'Vegan', dietaryType: 'vegan', description: 'Fully plant-based meal, dairy and egg free', priceCents: 0, included: true, premiumOnly: false },
                { id: 'hal', name: 'Halal', dietaryType: 'halal', description: 'Halal-certified meal prepared according to Islamic dietary laws', priceCents: 0, included: true, premiumOnly: false },
                { id: 'kos', name: 'Kosher', dietaryType: 'kosher', description: 'Kosher-certified meal sealed by rabbinical authority', priceCents: 500, included: false, premiumOnly: false },
                { id: 'gfr', name: 'Gluten Free', dietaryType: 'gluten_free', description: 'Carefully prepared without wheat, barley, or rye', priceCents: 0, included: true, premiumOnly: false },
                { id: 'dia', name: 'Diabetic', dietaryType: 'diabetic', description: 'Low-sugar, balanced carbohydrate meal', priceCents: 0, included: true, premiumOnly: false },
                { id: 'chd', name: 'Child Meal', dietaryType: 'child', description: 'Kid-friendly portions with familiar favourites', priceCents: 0, included: true, premiumOnly: false },
                { id: 'prm', name: 'Premium Dining', dietaryType: 'standard', description: 'Multi-course gourmet experience with wine pairing', priceCents: 4500, included: false, premiumOnly: true },
            ],
            lounges: [
                { id: 'lng-jfk', name: 'DeltaBlue Sky Lounge', airportCode: 'JFK', terminal: 'T4', priceCents: 5500, amenities: ['Shower suites', 'Bar', 'Buffet dining', 'Business centre', 'Nap pods'], openHours: '05:00–23:00' },
                { id: 'lng-lhr', name: 'DeltaBlue Crown Lounge', airportCode: 'LHR', terminal: 'T5', priceCents: 4500, amenities: ['Spa treatments', 'À la carte dining', 'Runway views', 'Kids zone'], openHours: '06:00–22:00' },
                { id: 'lng-dxb', name: 'DeltaBlue Oasis Lounge', airportCode: 'DXB', terminal: 'T3', priceCents: 6000, amenities: ['Swimming pool', 'Fine dining', 'Cigar lounge', 'Prayer rooms', 'Business centre'], openHours: '24 hours' },
                { id: 'lng-sin', name: 'DeltaBlue Garden Lounge', airportCode: 'SIN', terminal: 'T1', priceCents: 5000, amenities: ['Rooftop garden', 'Spa', 'Local cuisine', 'Quiet zone'], openHours: '24 hours' },
                { id: 'lng-los', name: 'DeltaBlue Balmoral Lounge', airportCode: 'LOS', terminal: 'Int\'l', priceCents: 3500, amenities: ['Buffet meals', 'Wi-Fi', 'Shower facilities', 'Business desks'], openHours: '05:00–23:30' },
            ],
            insurance: [
                {
                    id: 'ins-basic', name: 'Basic Protection', coverageType: 'basic',
                    premiumCents: 1200, coverageAmountCents: 500000,
                    coverageDetails: ['Trip cancellation up to $5,000', 'Lost baggage up to $1,000', '24/7 emergency hotline'],
                },
                {
                    id: 'ins-standard', name: 'Standard Protection', coverageType: 'standard',
                    premiumCents: 2500, coverageAmountCents: 2500000,
                    coverageDetails: ['Trip cancellation up to $25,000', 'Lost baggage up to $3,000', 'Medical expenses up to $50,000', 'Trip delay coverage ($200/day)', '24/7 emergency hotline'],
                },
                {
                    id: 'ins-premium', name: 'Premium Protection', coverageType: 'premium',
                    premiumCents: 4900, coverageAmountCents: 10000000,
                    coverageDetails: ['Trip cancellation up to $100,000', 'Lost baggage up to $5,000', 'Medical expenses up to $500,000', 'Trip delay coverage ($500/day)', 'Emergency evacuation & repatriation', 'Rental car damage coverage', '24/7 concierge service'],
                },
            ]
        };

        // 4. Payment Gateways
        const paymentProviders: PaymentProvidersConfig = {
            id: 'payment_providers',
            providers: [
                {
                    id: 'wave',
                    name: 'Wave',
                    description: 'Pay instantly with your Wave app',
                    icon: 'water_drop',
                    color: '#00B1FF',
                    active: true
                },
                {
                    id: 'orange',
                    name: 'Orange Money',
                    description: 'Fast deposits from your Orange account',
                    icon: 'phone_iphone',
                    color: '#FF6600',
                    active: true
                },
                {
                    id: 'afrimoney',
                    name: 'AfriMoney',
                    description: 'Secure Africell payment gateway',
                    icon: 'send_money',
                    color: '#E3000F',
                    active: true
                },
                {
                    id: 'qmoney',
                    name: 'QMoney',
                    description: 'QCell mobile money platform',
                    icon: 'account_balance_wallet',
                    color: '#00539F',
                    active: true
                }
            ]
        };

        // 5. Default Aircraft Layouts (DBJ-120 represents the current 11-row 1-2 configuration)
        const layout: AircraftLayoutConfig = {
            id: 'DBJ-120',
            name: 'DeltaBlue Jet 120 (Standard Prop)',
            totalRows: 11,
            columns: ['A', 'KEY_AISLE', 'B', 'C'],
            zones: [
                { name: 'First Class', rowStart: 1, rowEnd: 4, priceCents: 15000, color: 'bg-amber-100 border-amber-300 text-amber-700' },
                { name: 'Front Cabin', rowStart: 5, rowEnd: 8, priceCents: 8500, color: 'bg-primary/20 border-primary/40 text-primary-800' },
                { name: 'Exit Row', rowStart: 9, rowEnd: 9, priceCents: 4500, color: 'bg-emerald-100 border-emerald-300 text-emerald-700' },
                { name: 'Standard', rowStart: 10, rowEnd: 11, priceCents: 1500, color: 'bg-white border-navy-200 text-navy-600' }
            ]
        };

        // Complete write overrides
        await setDoc(doc(db, 'system_configs', 'fare_classes'), fares);
        await setDoc(doc(db, 'system_configs', 'countries'), countries);
        await setDoc(doc(db, 'system_configs', 'baggage_rules'), baggage);
        await setDoc(doc(db, 'system_configs', 'ancillaries'), ancillaries);
        await setDoc(doc(db, 'system_configs', 'payment_providers'), paymentProviders);
        
        // Write layout
        await setDoc(doc(db, 'aircraft_layouts', layout.id), layout);

        console.log('Seeding completed successfully!');
        return true;
    } catch (err) {
        console.error('Error seeding configurations:', err);
        throw err;
    }
}
