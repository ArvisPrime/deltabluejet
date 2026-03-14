/**
 * Airport Service — Firestore-backed airport management with in-memory caching.
 *
 * Replaces the hardcoded AIRPORTS array with live Firestore data.
 * Cache is populated on first access and invalidated after admin mutations.
 */

import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    orderBy,
    query,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

/* ── Types ───────────────────────────────────────────────────── */

export interface Airport {
    code: string;        // IATA 3-letter
    name: string;
    city: string;
    country: string;
    timezone: string;
    lat: number;
    lng: number;
    isActive: boolean;
}

/* ── In-Memory Cache ─────────────────────────────────────────── */

let _cache: Airport[] | null = null;
let _mapCache: Record<string, Airport> = {};

export function invalidateAirportCache(): void {
    _cache = null;
    _mapCache = {};
}

/* ── Read Operations ─────────────────────────────────────────── */

/**
 * Fetch all airports from Firestore (cached after first call).
 * Only returns active airports unless `includeInactive` is true.
 */
export async function getAirports(includeInactive = false): Promise<Airport[]> {
    if (!_cache) {
        const snap = await getDocs(
            query(collection(db, 'airports'), orderBy('code', 'asc')),
        );
        _cache = snap.docs.map(d => ({ ...d.data(), code: d.id } as Airport));
        _mapCache = Object.fromEntries(_cache.map(a => [a.code, a]));
    }

    if (includeInactive) return _cache;
    return _cache.filter(a => a.isActive);
}

/**
 * Get a single airport by IATA code.
 */
export async function getAirportByCode(code: string): Promise<Airport | undefined> {
    if (!_cache) await getAirports(true);
    return _mapCache[code.toUpperCase()];
}

/* ── Distance / Duration (Haversine) ─────────────────────────── */

function toRad(deg: number): number {
    return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance between two airports using the Haversine formula.
 * Returns distance in kilometers.
 */
export function calculateDistance(a: Airport, b: Airport): number {
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/**
 * Calculate distance between two airports by their IATA codes.
 * Returns 0 if either code is not found.
 */
export async function calculateDistanceByCodes(originCode: string, destCode: string): Promise<number> {
    const a = await getAirportByCode(originCode);
    const b = await getAirportByCode(destCode);
    if (!a || !b) return 0;
    return calculateDistance(a, b);
}

/**
 * Estimate flight duration based on distance.
 * 800 km/h for jets (>1000 km), 450 km/h for turboprops (<1000 km).
 * Adds 30 min for taxi/climb/descent.
 */
export function estimateDuration(distanceKm: number): number {
    const speed = distanceKm < 1000 ? 450 : 800;
    return Math.round((distanceKm / speed) * 60 + 30);
}

/* ── AirportRef Converter ────────────────────────────────────── */

export function toAirportRef(airport: Airport) {
    return {
        code: airport.code,
        name: airport.name,
        city: airport.city,
        country: airport.country,
        timezone: airport.timezone,
    };
}

/* ── Admin CRUD ──────────────────────────────────────────────── */

export async function createAirport(airport: Omit<Airport, 'isActive'>): Promise<void> {
    const code = airport.code.toUpperCase();
    const existing = await getDoc(doc(db, 'airports', code));
    if (existing.exists()) throw new Error(`Airport ${code} already exists.`);

    await setDoc(doc(db, 'airports', code), {
        ...airport,
        code,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    invalidateAirportCache();
}

export async function updateAirport(code: string, updates: Partial<Airport>): Promise<void> {
    await updateDoc(doc(db, 'airports', code.toUpperCase()), {
        ...updates,
        updatedAt: serverTimestamp(),
    });
    invalidateAirportCache();
}

export async function deleteAirport(code: string): Promise<void> {
    await deleteDoc(doc(db, 'airports', code.toUpperCase()));
    invalidateAirportCache();
}

export async function toggleAirportActive(code: string, isActive: boolean): Promise<void> {
    await updateDoc(doc(db, 'airports', code.toUpperCase()), {
        isActive,
        updatedAt: serverTimestamp(),
    });
    invalidateAirportCache();
}

/* ── Seed Default Airports ───────────────────────────────────── */

const DEFAULT_AIRPORTS: Omit<Airport, 'isActive'>[] = [
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
 * Seeds the 10 default airports into Firestore if they don't already exist.
 * Safe to call multiple times — skips existing documents.
 */
export async function seedDefaultAirports(): Promise<number> {
    let seededCount = 0;
    for (const airport of DEFAULT_AIRPORTS) {
        const ref = doc(db, 'airports', airport.code);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
            await setDoc(ref, {
                ...airport,
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            seededCount++;
        }
    }
    invalidateAirportCache();
    return seededCount;
}
