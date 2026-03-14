/**
 * Multi-City Booking Service
 *
 * Search, price, and book multi-segment trips with a single PNR.
 */

import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import type { FlightDoc, BookingSegment, AirportRef } from '../types/firestore';

// ─── Types ─────────────────────────────────────────────────

export interface SearchLeg {
    origin: string;       // airport code
    destination: string;  // airport code
    date: string;         // YYYY-MM-DD
}

export interface LegResult {
    legIndex: number;
    leg: SearchLeg;
    flights: FlightDoc[];
}

export interface SegmentSelection {
    legIndex: number;
    flight: FlightDoc;
    fareClass: string;
    fareAmount: number;
}

export interface FareSummary {
    segments: { legIndex: number; flightNumber: string; from: string; to: string; fare: number }[];
    subtotal: number;
    discount: number;
    discountPct: number;
    total: number;
}

// ─── Constants ────────────────────────────────────────────

const MULTI_CITY_DISCOUNT_THRESHOLD = 3; // 3+ legs get discount
const MULTI_CITY_DISCOUNT_PCT = 0.05;    // 5% discount

// ─── Search ───────────────────────────────────────────────

/**
 * Search flights for each leg of a multi-city trip.
 */
export async function searchMultiCityFlights(legs: SearchLeg[]): Promise<LegResult[]> {
    const results: LegResult[] = [];

    for (let i = 0; i < legs.length; i++) {
        const leg = legs[i];
        const startOfDay = new Date(leg.date + 'T00:00:00');
        const endOfDay = new Date(leg.date + 'T23:59:59');

        const q = query(
            collection(db, 'flights'),
            where('origin.code', '==', leg.origin.toUpperCase()),
            where('destination.code', '==', leg.destination.toUpperCase()),
            where('departureTime', '>=', Timestamp.fromDate(startOfDay)),
            where('departureTime', '<=', Timestamp.fromDate(endOfDay)),
        );

        const snap = await getDocs(q);
        const flights = snap.docs
            .map(d => ({ id: d.id, ...d.data() } as FlightDoc))
            .filter(f => f.status !== 'cancelled');

        results.push({ legIndex: i, leg, flights });
    }

    return results;
}

// ─── Pricing ──────────────────────────────────────────────

/**
 * Calculate combined fare for selected segments.
 */
export function calculateCombinedFare(selections: SegmentSelection[]): FareSummary {
    const segments = selections.map(s => ({
        legIndex: s.legIndex,
        flightNumber: s.flight.flightNumber,
        from: s.flight.origin.code,
        to: s.flight.destination.code,
        fare: s.fareAmount,
    }));

    const subtotal = segments.reduce((sum, s) => sum + s.fare, 0);

    const applyDiscount = selections.length >= MULTI_CITY_DISCOUNT_THRESHOLD;
    const discountPct = applyDiscount ? MULTI_CITY_DISCOUNT_PCT : 0;
    const discount = Math.round(subtotal * discountPct);
    const total = subtotal - discount;

    return { segments, subtotal, discount, discountPct, total };
}

// ─── Booking ──────────────────────────────────────────────

function generatePNR(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pnr = '';
    for (let i = 0; i < 6; i++) pnr += chars[Math.floor(Math.random() * chars.length)];
    return pnr;
}

/**
 * Create a multi-city booking with a single PNR spanning multiple segments.
 */
export async function createMultiCityBooking(params: {
    userId: string;
    selections: SegmentSelection[];
    passengerCount: number;
    contactEmail: string;
    contactPhone: string;
    currency: string;
}): Promise<{ pnr: string; bookingId: string }> {
    const { userId, selections, passengerCount, contactEmail, contactPhone, currency } = params;
    const fareSummary = calculateCombinedFare(selections);
    const pnr = generatePNR();

    // First segment defines the "primary" flight
    const primary = selections[0];
    const lastSeg = selections[selections.length - 1];

    const segments: BookingSegment[] = selections.map(s => ({
        legIndex: s.legIndex,
        flightId: s.flight.id,
        flightNumber: s.flight.flightNumber,
        origin: s.flight.origin as AirportRef,
        destination: s.flight.destination as AirportRef,
        departureTime: s.flight.departureTime,
        arrivalTime: s.flight.arrivalTime,
        fareClass: s.fareClass,
        fareAmount: s.fareAmount,
        seatNumber: null,
    }));

    const bookingData = {
        pnr,
        userId,
        flightId: primary.flight.id,
        flightNumber: primary.flight.flightNumber,
        status: 'pending',
        origin: primary.flight.origin,
        destination: lastSeg.flight.destination,
        departureTime: primary.flight.departureTime,
        arrivalTime: lastSeg.flight.arrivalTime,
        fareClass: primary.fareClass,
        totalAmount: fareSummary.total,
        currency,
        passengerCount,
        contactEmail,
        contactPhone,
        paymentIntentId: null,
        tripType: 'multi-city' as const,
        segments,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'bookings'), bookingData);
    return { pnr, bookingId: docRef.id };
}
