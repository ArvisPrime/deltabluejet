/**
 * Airport Reference Data — DeltaBlue Jet Air
 *
 * Complete dataset for all serviced airports with IATA codes,
 * coordinates, and distance calculation utilities.
 */

export interface Airport {
    code: string;         // IATA 3-letter
    name: string;
    city: string;
    country: string;
    timezone: string;
    lat: number;
    lng: number;
}

/**
 * All airports in the DeltaBlue Jet Air network.
 */
export const AIRPORTS: Airport[] = [
    { code: 'BJL', name: 'Banjul Intl Airport', city: 'Banjul', country: 'The Gambia', timezone: 'Africa/Banjul', lat: 13.338, lng: -16.652 },
    { code: 'DSS', name: 'Blaise Diagne Intl Airport', city: 'Dakar', country: 'Senegal', timezone: 'Africa/Dakar', lat: 14.670, lng: -17.073 },
    { code: 'ACC', name: 'Kotoka Intl Airport', city: 'Accra', country: 'Ghana', timezone: 'Africa/Accra', lat: 5.605, lng: -0.167 },
    { code: 'FNA', name: 'Lungi Intl Airport', city: 'Freetown', country: 'Sierra Leone', timezone: 'Africa/Freetown', lat: 8.616, lng: -13.196 },
    { code: 'CKY', name: 'Conakry Intl Airport', city: 'Conakry', country: 'Guinea', timezone: 'Africa/Conakry', lat: 9.577, lng: -13.612 },
    { code: 'DAC', name: 'Hazrat Shahjalal Intl Airport', city: 'Dhaka', country: 'Bangladesh', timezone: 'Asia/Dhaka', lat: 23.843, lng: 90.398 },
    { code: 'ROB', name: 'Roberts Intl Airport', city: 'Monrovia', country: 'Liberia', timezone: 'Africa/Monrovia', lat: 6.234, lng: -10.362 },
    { code: 'OXB', name: 'Osvaldo Vieira Intl Airport', city: 'Bissau', country: 'Guinea-Bissau', timezone: 'Africa/Bissau', lat: 11.895, lng: -15.654 },
    { code: 'ABJ', name: 'Félix-Houphouët-Boigny Intl Airport', city: 'Abidjan', country: 'Ivory Coast', timezone: 'Africa/Abidjan', lat: 5.261, lng: -3.926 },
    { code: 'LOS', name: 'Murtala Muhammed Intl Airport', city: 'Lagos', country: 'Nigeria', timezone: 'Africa/Lagos', lat: 6.577, lng: 3.321 },
];

/**
 * Lookup map for O(1) access by IATA code.
 */
export const AIRPORT_MAP: Record<string, Airport> = Object.fromEntries(
    AIRPORTS.map((a) => [a.code, a])
);

/**
 * Get an airport by IATA code.
 */
export function getAirportByCode(code: string): Airport | undefined {
    return AIRPORT_MAP[code.toUpperCase()];
}

/**
 * Calculate great-circle distance between two airports using the Haversine formula.
 * Returns distance in kilometers.
 */
export function calculateDistance(originCode: string, destCode: string): number {
    const a = AIRPORT_MAP[originCode];
    const b = AIRPORT_MAP[destCode];
    if (!a || !b) return 0;

    const R = 6371; // Earth's radius in km
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

function toRad(deg: number): number {
    return (deg * Math.PI) / 180;
}

/**
 * Estimate flight duration based on distance.
 * Uses average cruise speed of 800 km/h for jets, 450 km/h for turboprops (< 1000 km).
 * Adds 30 min for taxi/climb/descent.
 */
export function estimateDuration(distanceKm: number): number {
    const speed = distanceKm < 1000 ? 450 : 800;
    return Math.round((distanceKm / speed) * 60 + 30);
}

/**
 * Convert Airport to the AirportRef shape used in Firestore documents.
 */
export function toAirportRef(airport: Airport) {
    return {
        code: airport.code,
        name: airport.name,
        city: airport.city,
        country: airport.country,
        timezone: airport.timezone,
    };
}
