/**
 * Dynamic Pricing Service
 *
 * Adjusts fares based on time-to-departure, load factor, and day-of-week.
 * Rules are configurable via Firestore.
 */

import {
    doc,
    getDoc,
    setDoc,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import type { FlightDoc } from '../types/firestore';

// ─── Types ─────────────────────────────────────────────────

export interface TimeBucket {
    label: string;
    minDays: number;   // inclusive
    maxDays: number;   // exclusive (Infinity for open-ended)
    multiplier: number;
}

export interface LoadBucket {
    label: string;
    minPct: number;    // inclusive
    maxPct: number;    // exclusive
    multiplier: number;
}

export interface DayModifier {
    day: number;       // 0=Sun, 1=Mon, ..., 6=Sat
    label: string;
    multiplier: number;
}

export interface PricingRules {
    timeBuckets: TimeBucket[];
    loadBuckets: LoadBucket[];
    dayModifiers: DayModifier[];
    updatedAt?: Timestamp;
}

export type PriceIndicator = 'great-value' | 'average' | 'high-demand' | 'peak';

// ─── Default Rules ────────────────────────────────────────

export const DEFAULT_PRICING_RULES: PricingRules = {
    timeBuckets: [
        { label: '30+ days out', minDays: 30, maxDays: Infinity, multiplier: 0.85 },
        { label: '14–30 days', minDays: 14, maxDays: 30, multiplier: 1.0 },
        { label: '7–14 days', minDays: 7, maxDays: 14, multiplier: 1.15 },
        { label: '2–7 days', minDays: 2, maxDays: 7, multiplier: 1.3 },
        { label: 'Under 48h', minDays: 0, maxDays: 2, multiplier: 1.5 },
    ],
    loadBuckets: [
        { label: 'Low (<30%)', minPct: 0, maxPct: 30, multiplier: 0.85 },
        { label: 'Normal (30–60%)', minPct: 30, maxPct: 60, multiplier: 1.0 },
        { label: 'High (60–80%)', minPct: 60, maxPct: 80, multiplier: 1.2 },
        { label: 'Very High (>80%)', minPct: 80, maxPct: 101, multiplier: 1.4 },
    ],
    dayModifiers: [
        { day: 0, label: 'Sunday', multiplier: 1.1 },
        { day: 1, label: 'Monday', multiplier: 1.0 },
        { day: 2, label: 'Tuesday', multiplier: 1.0 },
        { day: 3, label: 'Wednesday', multiplier: 1.0 },
        { day: 4, label: 'Thursday', multiplier: 1.0 },
        { day: 5, label: 'Friday', multiplier: 1.1 },
        { day: 6, label: 'Saturday', multiplier: 0.9 },
    ],
};

const RULES_DOC_PATH = 'config/pricing';

// ─── Rules CRUD ───────────────────────────────────────────

/**
 * Get pricing rules from Firestore, falling back to defaults.
 */
export async function getPricingRules(): Promise<PricingRules> {
    try {
        const ref = doc(db, RULES_DOC_PATH);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            return snap.data() as PricingRules;
        }
    } catch (err) {
        console.warn('Failed to load pricing rules, using defaults:', err);
    }
    return { ...DEFAULT_PRICING_RULES };
}

/**
 * Save pricing rules to Firestore.
 */
export async function updatePricingRules(rules: PricingRules): Promise<void> {
    const ref = doc(db, RULES_DOC_PATH);
    await setDoc(ref, { ...rules, updatedAt: Timestamp.now() });
}

// ─── Fare Calculation ─────────────────────────────────────

/**
 * Calculate load factor for a flight (0–100).
 */
export function getLoadFactor(flight: FlightDoc): number {
    const totalSeats = Object.values(flight.seatsAvailable).reduce((a, b) => a + b, 0)
        + Object.values(flight.seatsTaken).reduce((a, b) => a + b, 0);
    if (totalSeats === 0) return 0;
    const taken = Object.values(flight.seatsTaken).reduce((a, b) => a + b, 0);
    return (taken / totalSeats) * 100;
}

/**
 * Get days until departure.
 */
export function getDaysToDeparture(flight: FlightDoc): number {
    const depMs = flight.departureTime.toDate().getTime();
    const nowMs = Date.now();
    return Math.max(0, (depMs - nowMs) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate dynamically adjusted fare.
 */
export function calculateDynamicFare(
    baseFare: number,
    flight: FlightDoc,
    rules: PricingRules,
): { adjustedFare: number; timeMultiplier: number; loadMultiplier: number; dayMultiplier: number; totalMultiplier: number } {
    const daysToDep = getDaysToDeparture(flight);
    const loadPct = getLoadFactor(flight);
    const depDay = flight.departureTime.toDate().getDay();

    // Time-to-departure multiplier
    const timeBucket = rules.timeBuckets.find(b => daysToDep >= b.minDays && daysToDep < b.maxDays);
    const timeMultiplier = timeBucket?.multiplier ?? 1.0;

    // Load factor multiplier
    const loadBucket = rules.loadBuckets.find(b => loadPct >= b.minPct && loadPct < b.maxPct);
    const loadMultiplier = loadBucket?.multiplier ?? 1.0;

    // Day-of-week multiplier
    const dayMod = rules.dayModifiers.find(d => d.day === depDay);
    const dayMultiplier = dayMod?.multiplier ?? 1.0;

    const totalMultiplier = timeMultiplier * loadMultiplier * dayMultiplier;
    const adjustedFare = Math.round(baseFare * totalMultiplier);

    return { adjustedFare, timeMultiplier, loadMultiplier, dayMultiplier, totalMultiplier };
}

/**
 * Get a price indicator label.
 */
export function getFarePriceIndicator(adjustedFare: number, baseFare: number): { indicator: PriceIndicator; label: string; color: string } {
    const ratio = adjustedFare / baseFare;
    if (ratio <= 0.9) return { indicator: 'great-value', label: 'Great Value', color: '#10B981' };
    if (ratio <= 1.1) return { indicator: 'average', label: 'Average Price', color: '#6B7280' };
    if (ratio <= 1.35) return { indicator: 'high-demand', label: 'High Demand', color: '#F59E0B' };
    return { indicator: 'peak', label: 'Peak Pricing', color: '#EF4444' };
}
