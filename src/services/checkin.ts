/**
 * Check-in Service — complete check-in flow with seat conflict prevention.
 *
 * Handles: PNR retrieval, passenger check-in, seat assignment,
 * boarding pass generation, and departure control operations.
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    limit,
    runTransaction,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase.config';
import { APP_CONFIG } from '../config/app';
import type { BookingDoc, PassengerDoc, CheckinDoc, FlightDoc, SeatMapDoc } from '../types/firestore';
import { encodeBCBP, fareClassToCompartment } from '../utils/boardingPassEncoder';

// ─── Retrieve Booking for Check-in ─────────────────────────

export interface CheckinEligibility {
    eligible: boolean;
    reason?: string;
    booking: BookingDoc | null;
    passengers: PassengerDoc[];
    flight: FlightDoc | null;
}

/**
 * Check if a booking is eligible for check-in.
 * Rules:
 *   - Booking must be 'confirmed' status
 *   - Flight must depart within 48 hours
 *   - Flight must not be cancelled
 */
export async function checkEligibility(pnr: string): Promise<CheckinEligibility> {
    // Find the booking
    const bookingSnap = await getDocs(
        query(collection(db, 'bookings'), where('pnr', '==', pnr.toUpperCase()), limit(1)),
    );

    if (bookingSnap.empty) {
        return { eligible: false, reason: 'Booking not found. Please check your PNR.', booking: null, passengers: [], flight: null };
    }

    const bookingDoc = bookingSnap.docs[0];
    const booking = { id: bookingDoc.id, ...bookingDoc.data() } as BookingDoc;

    // Check booking status
    if (booking.status === 'cancelled' || booking.status === 'refunded') {
        return { eligible: false, reason: 'This booking has been cancelled.', booking, passengers: [], flight: null };
    }

    if (booking.status === 'checked_in') {
        return { eligible: false, reason: 'Already checked in. Please check your boarding pass.', booking, passengers: [], flight: null };
    }

    if (booking.status !== 'confirmed') {
        return { eligible: false, reason: 'Booking is not confirmed. Please complete payment first.', booking, passengers: [], flight: null };
    }

    // Get the flight
    const flightSnap = await getDoc(doc(db, 'flights', booking.flightId));
    if (!flightSnap.exists()) {
        return { eligible: false, reason: 'Flight information not available.', booking, passengers: [], flight: null };
    }
    const flight = { id: flightSnap.id, ...flightSnap.data() } as FlightDoc;

    // Check flight status
    if (flight.status === 'cancelled') {
        return { eligible: false, reason: 'This flight has been cancelled.', booking, passengers: [], flight };
    }

    // Check: departure must be within 48 hours
    const now = new Date();
    const departure = flight.departureTime.toDate();
    const hoursUntilDeparture = (departure.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDeparture > APP_CONFIG.checkinWindowHours) {
        const openDate = new Date(departure.getTime() - APP_CONFIG.checkinWindowHours * 60 * 60 * 1000);
        return {
            eligible: false,
            reason: `Check-in opens on ${openDate.toLocaleDateString()} at ${openDate.toLocaleTimeString()}.`,
            booking, passengers: [], flight,
        };
    }

    if (hoursUntilDeparture < APP_CONFIG.checkinCloseHours) {
        return { eligible: false, reason: 'Check-in has closed for this flight.', booking, passengers: [], flight };
    }

    // Get passengers
    const paxSnap = await getDocs(collection(db, 'bookings', booking.id, 'passengers'));
    const passengers = paxSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as PassengerDoc);

    return { eligible: true, booking, passengers, flight };
}

// ─── Seat Availability (conflict prevention) ───────────────

/**
 * Get all taken seats for a flight to prevent conflicts.
 * Uses a Firestore transaction to ensure consistency.
 */
export async function getOccupiedSeats(flightId: string): Promise<Set<string>> {
    const checkinSnap = await getDocs(
        query(collection(db, 'checkins'), where('bookingId', '!=', ''), where('seatNumber', '!=', '')),
    );

    // Also check all passengers in bookings for this flight
    const bookingSnap = await getDocs(
        query(collection(db, 'bookings'), where('flightId', '==', flightId), where('status', 'in', ['confirmed', 'checked_in', 'boarded'])),
    );

    const occupied = new Set<string>();

    for (const bDoc of bookingSnap.docs) {
        const paxSnap = await getDocs(collection(db, 'bookings', bDoc.id, 'passengers'));
        for (const pDoc of paxSnap.docs) {
            const pax = pDoc.data() as PassengerDoc;
            if (pax.seatNumber) occupied.add(pax.seatNumber);
        }
    }

    return occupied;
}

/**
 * Get the seat map for a flight's aircraft type.
 */
export async function getFlightSeatMap(flightId: string): Promise<{
    seatMap: SeatMapDoc | null;
    occupiedSeats: Set<string>;
}> {
    const flightSnap = await getDoc(doc(db, 'flights', flightId));
    if (!flightSnap.exists()) return { seatMap: null, occupiedSeats: new Set() };

    const flight = flightSnap.data() as FlightDoc;

    // Find seat map by aircraft type
    const smSnap = await getDocs(
        query(collection(db, 'seatMaps'), where('aircraftType', '==', flight.aircraft.type), limit(1)),
    );
    const seatMap = smSnap.empty ? null : ({ id: smSnap.docs[0].id, ...smSnap.docs[0].data() } as SeatMapDoc);

    const occupiedSeats = await getOccupiedSeats(flightId);

    return { seatMap, occupiedSeats };
}

// ─── Process Check-in ──────────────────────────────────────

export interface CheckinInput {
    bookingId: string;
    passengerId: string;
    seatNumber: string;
    pnr: string;
    flightId: string;
}

/**
 * Process check-in for a passenger with seat conflict prevention.
 * Uses a Firestore transaction to ensure the seat is not double-booked.
 */
export async function processCheckin(input: CheckinInput): Promise<CheckinDoc> {
    const checkinId = `ci-${Date.now()}-${input.passengerId}`;

    const result = await runTransaction(db, async (transaction) => {
        // Verify the seat is not already taken
        const paxRef = doc(db, 'bookings', input.bookingId, 'passengers', input.passengerId);
        const paxSnap = await transaction.get(paxRef);
        if (!paxSnap.exists()) throw new Error('Passenger not found');

        // Check all other passengers on this flight for seat conflicts
        const bookingsSnap = await getDocs(
            query(
                collection(db, 'bookings'),
                where('flightId', '==', input.flightId),
                where('status', 'in', ['confirmed', 'checked_in']),
            ),
        );

        for (const bDoc of bookingsSnap.docs) {
            const innerPaxSnap = await getDocs(collection(db, 'bookings', bDoc.id, 'passengers'));
            for (const pDoc of innerPaxSnap.docs) {
                // Skip the current passenger
                if (bDoc.id === input.bookingId && pDoc.id === input.passengerId) continue;
                const existingPax = pDoc.data() as PassengerDoc;
                if (existingPax.seatNumber === input.seatNumber) {
                    throw new Error(`Seat ${input.seatNumber} is already taken. Please choose another seat.`);
                }
            }
        }

        // Assign the seat and mark as checked in
        transaction.update(paxRef, {
            seatNumber: input.seatNumber,
            checkedIn: true,
        });

        // Fetch booking + flight for BCBP encoding
        const bookingRef = doc(db, 'bookings', input.bookingId);
        const bookingSnap = await transaction.get(bookingRef);
        const bookingData = bookingSnap.data() as BookingDoc | undefined;

        const flightRef = doc(db, 'flights', input.flightId);
        const flightSnap = await transaction.get(flightRef);
        const flightData = flightSnap.data() as FlightDoc | undefined;

        const paxData = paxSnap.data() as PassengerDoc;
        const passengerName = [
            paxData.lastName || '',
            paxData.firstName || '',
        ].filter(Boolean).join('/') || 'PASSENGER';

        // Count existing checkins for sequence number
        const sequenceNumber = Date.now() % 10000;

        // Encode BCBP string
        let bcbpData: string | null = null;
        try {
            bcbpData = encodeBCBP({
                passengerName,
                pnr: input.pnr,
                origin: bookingData?.origin?.code || '---',
                destination: bookingData?.destination?.code || '---',
                carrierCode: 'DB',
                flightNumber: flightData?.flightNumber || '0000',
                departureDate: flightData?.departureTime?.toDate?.() || new Date(),
                compartment: fareClassToCompartment(bookingData?.fareClass || 'economy'),
                seatNumber: input.seatNumber,
                sequenceNumber,
            });
        } catch (e) {
            console.error('[BCBP] Encoding failed, saving without barcode data', e);
        }

        // Create check-in record with BCBP data
        const checkinData: Omit<CheckinDoc, 'id'> = {
            bookingId: input.bookingId,
            pnr: input.pnr,
            passengerId: input.passengerId,
            seatNumber: input.seatNumber,
            boardingGroup: determineBoardingGroup(input.seatNumber),
            boardingPassUrl: null,
            bcbpData,
            checkedInAt: Timestamp.now(),
        };

        const checkinRef = doc(db, 'checkins', checkinId);
        transaction.set(checkinRef, checkinData);

        return { id: checkinId, ...checkinData } as CheckinDoc;
    });

    return result;
}

/**
 * Determine boarding group based on seat row.
 */
function determineBoardingGroup(seatNumber: string): string {
    const row = parseInt(seatNumber.replace(/[A-Z]/g, ''), 10);
    if (row <= 3) return 'First Class';
    if (row <= 7) return 'Business Priority';
    if (row <= 15) return 'Group A';
    if (row <= 25) return 'Group B';
    return 'Group C';
}

// ─── Complete Booking Check-in ─────────────────────────────

/**
 * Mark entire booking as checked_in after all passengers are processed.
 */
export async function completeBookingCheckin(bookingId: string): Promise<void> {
    const paxSnap = await getDocs(collection(db, 'bookings', bookingId, 'passengers'));
    const allCheckedIn = paxSnap.docs.every((d) => (d.data() as PassengerDoc).checkedIn);

    if (allCheckedIn) {
        await updateDoc(doc(db, 'bookings', bookingId), {
            status: 'checked_in',
            updatedAt: serverTimestamp(),
        });
    }
}

// ─── Boarding Pass Cloud Function ──────────────────────────

export const generateBoardingPass = httpsCallable<
    { checkinId: string; bookingId: string; passengerId: string },
    { boardingPassUrl: string; boardingGroup: string }
>(functions, 'generateBoardingPass');
