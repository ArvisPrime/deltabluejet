/**
 * IROP (Irregular Operations) Service — Deltablue Jet Air
 *
 * Automated rebooking engine for cancelled/delayed flights,
 * hotel & meal voucher auto-issuance, and disruption management.
 */

import {
    collection, query, where, getDocs, addDoc, updateDoc,
    doc, Timestamp, serverTimestamp, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import type { FlightDoc, BookingDoc } from '../types/firestore';

// ─── Types ─────────────────────────────────────────────────

export type DisruptionType = 'cancellation' | 'delay' | 'diversion' | 'gate_change';
export type RebookingStatus = 'pending' | 'auto_rebooked' | 'manual_required' | 'confirmed' | 'refused';

export interface RebookingRecord {
    id?: string;
    originalFlightId: string;
    originalFlightNumber: string;
    bookingId: string;
    passengerId: string;
    passengerName: string;
    disruptionType: DisruptionType;
    newFlightId?: string;
    newFlightNumber?: string;
    status: RebookingStatus;
    voucherIssued: boolean;
    hotelArranged: boolean;
    compensationCents: number;
    notes: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface AlternativeFlight {
    flight: FlightDoc;
    seatAvailable: boolean;
    sameCabin: boolean;
    timeDiffMinutes: number;
    score: number;  // Higher = better match
}

export interface VoucherRecord {
    id?: string;
    bookingId: string;
    passengerId: string;
    type: 'hotel' | 'meal' | 'transport';
    amountCents: number;
    description: string;
    validUntil: Timestamp;
    redeemed: boolean;
    createdAt: Timestamp;
}

// ─── Constants ─────────────────────────────────────────────

const MEAL_VOUCHER_CENTS = 2500;      // $25 per meal
const HOTEL_VOUCHER_CENTS = 15000;    // $150 per night
const TRANSPORT_VOUCHER_CENTS = 5000; // $50 transport to/from hotel
const OVERNIGHT_THRESHOLD_HOURS = 4;  // Delay > 4h after 10pm → hotel
const LONG_DELAY_MEAL_HOURS = 2;      // Delay > 2h → meal voucher

// EU261 compensation tiers (in cents)
const EU261_COMPENSATION: Record<string, number> = {
    short_haul: 25000,   // ≤1500km → €250
    medium_haul: 40000,  // 1500-3500km → €400
    long_haul: 60000,    // >3500km → €600
};

// ─── Find Alternative Flights ──────────────────────────────

/**
 * Find alternative flights for a disrupted flight on the same route.
 */
export async function findAlternativeFlights(
    originalFlight: FlightDoc,
    maxResults: number = 5,
): Promise<AlternativeFlight[]> {
    const flightsRef = collection(db, 'flights');

    // Search for same-route flights departing within next 48 hours
    const now = Timestamp.now();
    const in48h = Timestamp.fromMillis(now.toMillis() + 48 * 60 * 60 * 1000);

    const q = query(
        flightsRef,
        where('origin.code', '==', originalFlight.origin.code),
        where('destination.code', '==', originalFlight.destination.code),
        where('departureTime', '>=', now),
        where('departureTime', '<=', in48h),
        orderBy('departureTime'),
        limit(20),
    );

    const snap = await getDocs(q);
    const candidates: AlternativeFlight[] = [];

    snap.docs.forEach(d => {
        const flight = { id: d.id, ...d.data() } as FlightDoc;
        if (flight.id === originalFlight.id) return;
        if (flight.status === 'cancelled') return;

        const origDep = originalFlight.departureTime.toMillis();
        const newDep = flight.departureTime.toMillis();
        const timeDiffMinutes = Math.abs(newDep - origDep) / 60000;

        const totalSeats = flight.aircraft?.capacity || 180;
        const booked = flight.bookedSeats || 0;
        const seatAvailable = booked < totalSeats;

        // Score: lower time diff + seat availability = better
        let score = 100 - (timeDiffMinutes / 60); // Lose 1pt per hour of diff
        if (seatAvailable) score += 50;
        if (score < 0) score = 0;

        candidates.push({
            flight,
            seatAvailable,
            sameCabin: true, // Simplified — would check cabin availability
            timeDiffMinutes,
            score,
        });
    });

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, maxResults);
}

// ─── Auto-Rebook Passenger ─────────────────────────────────

/**
 * Automatically rebook a passenger to the best alternative flight.
 */
export async function autoRebookPassenger(
    booking: BookingDoc & { id: string },
    originalFlight: FlightDoc,
    passengerName: string,
    alternatives: AlternativeFlight[],
): Promise<RebookingRecord> {
    const rebookingsRef = collection(db, 'rebookings');
    const bestOption = alternatives.find(a => a.seatAvailable);

    const record: Omit<RebookingRecord, 'id'> = {
        originalFlightId: originalFlight.id,
        originalFlightNumber: originalFlight.flightNumber,
        bookingId: booking.id,
        passengerId: booking.userId || '',
        passengerName,
        disruptionType: originalFlight.status === 'cancelled' ? 'cancellation' : 'delay',
        newFlightId: bestOption?.flight.id,
        newFlightNumber: bestOption?.flight.flightNumber,
        status: bestOption ? 'auto_rebooked' : 'manual_required',
        voucherIssued: false,
        hotelArranged: false,
        compensationCents: 0,
        notes: bestOption
            ? `Auto-rebooked to ${bestOption.flight.flightNumber} (${Math.round(bestOption.timeDiffMinutes)}min diff)`
            : 'No suitable alternative found — manual rebooking required',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(rebookingsRef, record);
    return { ...record, id: docRef.id };
}

// ─── Voucher Issuance ──────────────────────────────────────

/**
 * Determine and issue appropriate vouchers based on delay duration and time of day.
 */
export async function issueIROPVouchers(
    bookingId: string,
    passengerId: string,
    delayMinutes: number,
    localHour: number = new Date().getHours(),
): Promise<VoucherRecord[]> {
    const vouchersRef = collection(db, 'irop_vouchers');
    const vouchers: VoucherRecord[] = [];
    const validUntil = Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Meal voucher for delays > 2 hours
    if (delayMinutes >= LONG_DELAY_MEAL_HOURS * 60) {
        const mealVoucher: Omit<VoucherRecord, 'id'> = {
            bookingId,
            passengerId,
            type: 'meal',
            amountCents: MEAL_VOUCHER_CENTS,
            description: 'Complimentary meal voucher due to flight delay',
            validUntil,
            redeemed: false,
            createdAt: Timestamp.now(),
        };
        const ref = await addDoc(vouchersRef, mealVoucher);
        vouchers.push({ ...mealVoucher, id: ref.id });
    }

    // Hotel + transport for overnight delays (>4h after 10pm or before 6am)
    const isOvernightTime = localHour >= 22 || localHour < 6;
    if (delayMinutes >= OVERNIGHT_THRESHOLD_HOURS * 60 && isOvernightTime) {
        const hotelVoucher: Omit<VoucherRecord, 'id'> = {
            bookingId,
            passengerId,
            type: 'hotel',
            amountCents: HOTEL_VOUCHER_CENTS,
            description: 'Complimentary hotel accommodation due to overnight delay',
            validUntil,
            redeemed: false,
            createdAt: Timestamp.now(),
        };
        const ref1 = await addDoc(vouchersRef, hotelVoucher);
        vouchers.push({ ...hotelVoucher, id: ref1.id });

        const transportVoucher: Omit<VoucherRecord, 'id'> = {
            bookingId,
            passengerId,
            type: 'transport',
            amountCents: TRANSPORT_VOUCHER_CENTS,
            description: 'Transport to/from hotel accommodation',
            validUntil,
            redeemed: false,
            createdAt: Timestamp.now(),
        };
        const ref2 = await addDoc(vouchersRef, transportVoucher);
        vouchers.push({ ...transportVoucher, id: ref2.id });
    }

    return vouchers;
}

// ─── Compensation Calculator ───────────────────────────────

/**
 * Calculate EU261-style compensation based on distance and delay.
 */
export function calculateCompensation(distanceKm: number, delayHours: number): number {
    if (delayHours < 3) return 0;

    if (distanceKm <= 1500) return EU261_COMPENSATION.short_haul;
    if (distanceKm <= 3500) return EU261_COMPENSATION.medium_haul;
    return EU261_COMPENSATION.long_haul;
}

// ─── Get Affected Bookings ─────────────────────────────────

/**
 * Find all bookings on a given flight, including their passengers.
 */
export async function getAffectedBookings(flightId: string): Promise<(BookingDoc & { id: string, passengers: any[] })[]> {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('flightId', '==', flightId));
    const snap = await getDocs(q);
    
    const bookings = await Promise.all(snap.docs.map(async (d) => {
        const bookingData = { id: d.id, ...d.data() } as BookingDoc & { id: string };
        const paxSnap = await getDocs(collection(db, 'bookings', d.id, 'passengers'));
        const passengers = paxSnap.docs.map(p => ({ id: p.id, ...p.data() }));
        return { ...bookingData, passengers };
    }));
    return bookings;
}

// ─── Rebooking Records ────────────────────────────────────

/**
 * Get rebooking records for a cancelled flight.
 */
export async function getRebookingsByFlight(flightId: string): Promise<RebookingRecord[]> {
    const q = query(
        collection(db, 'rebookings'),
        where('originalFlightId', '==', flightId),
        orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as RebookingRecord));
}

/**
 * Update a rebooking record status.
 */
export async function updateRebookingStatus(
    rebookingId: string,
    status: RebookingStatus,
    newFlightId?: string,
    newFlightNumber?: string,
): Promise<void> {
    const ref = doc(db, 'rebookings', rebookingId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = {
        status,
        updatedAt: serverTimestamp(),
    };
    if (newFlightId) updates.newFlightId = newFlightId;
    if (newFlightNumber) updates.newFlightNumber = newFlightNumber;

    await updateDoc(ref, updates);
}
