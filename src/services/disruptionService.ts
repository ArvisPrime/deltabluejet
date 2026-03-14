/**
 * Disruption Management Service
 *
 * Handles flight delays, gate assignments, cancellations, and passenger rebooking.
 */

import {
    collection,
    doc,
    query,
    where,
    orderBy,
    getDocs,
    updateDoc,
    Timestamp,
    writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { getFlights } from './firestore';
import type { FlightDoc, BookingDoc } from '../types/firestore';

// ─── Types ─────────────────────────────────────────────────

export type DelayReason = 'weather' | 'technical' | 'atc' | 'crew' | 'late_inbound' | 'other';

export const DELAY_REASONS: { value: DelayReason; label: string }[] = [
    { value: 'weather', label: 'Weather Disruption' },
    { value: 'technical', label: 'Mechanical / Technical' },
    { value: 'atc', label: 'Air Traffic Control' },
    { value: 'crew', label: 'Crew Scheduling' },
    { value: 'late_inbound', label: 'Late Inbound Aircraft' },
    { value: 'other', label: 'Other' },
];

export interface GateConflict {
    flightId: string;
    flightNumber: string;
    gate: string;
    terminal: string;
    departureTime: Timestamp;
    arrivalTime: Timestamp;
}

export interface AffectedBooking {
    id: string;
    pnr: string;
    passengerCount: number;
    contactEmail: string;
    status: string;
}

// ─── Delay Management ─────────────────────────────────────

/**
 * Record a flight delay — updates FlightDoc and sets status to 'delayed'.
 */
export async function recordDelay(
    flightId: string,
    delayMinutes: number,
    reason: DelayReason,
    newDepartureTime: Date,
): Promise<void> {
    const ref = doc(db, 'flights', flightId);
    await updateDoc(ref, {
        status: 'delayed',
        delayMinutes,
        delayReason: reason,
        newDepartureTime: Timestamp.fromDate(newDepartureTime),
        updatedAt: Timestamp.now(),
    });
}

/**
 * Clear a delay — resets flight back to scheduled.
 */
export async function clearDelay(flightId: string): Promise<void> {
    const ref = doc(db, 'flights', flightId);
    await updateDoc(ref, {
        status: 'scheduled',
        delayMinutes: 0,
        delayReason: null,
        newDepartureTime: null,
        updatedAt: Timestamp.now(),
    });
}

// ─── Gate Assignment ──────────────────────────────────────

/**
 * Check for gate conflicts before assigning.
 * Returns conflicting flights or empty array if clear.
 */
export async function checkGateConflicts(
    gate: string,
    terminal: string,
    departureTime: Timestamp,
    arrivalTime: Timestamp,
    excludeFlightId?: string,
): Promise<GateConflict[]> {
    const flights = await getFlights({ maxResults: 500 });

    return flights
        .filter(f => {
            if (f.id === excludeFlightId) return false;
            if (f.gate !== gate || f.terminal !== terminal) return false;
            if (f.status === 'cancelled') return false;

            // Check time overlap
            const fDep = f.departureTime.toDate().getTime();
            const fArr = f.arrivalTime.toDate().getTime();
            const dep = departureTime.toDate().getTime();
            const arr = arrivalTime.toDate().getTime();

            // Overlap: flight A overlaps flight B if A starts before B ends AND A ends after B starts
            return fDep < arr && fArr > dep;
        })
        .map(f => ({
            flightId: f.id,
            flightNumber: f.flightNumber,
            gate: f.gate || '',
            terminal: f.terminal || '',
            departureTime: f.departureTime,
            arrivalTime: f.arrivalTime,
        }));
}

/**
 * Assign a gate to a flight, with conflict detection.
 * Returns conflicts if any, otherwise performs the assignment.
 */
export async function assignGate(
    flightId: string,
    gate: string,
    terminal: string,
    flight: FlightDoc,
): Promise<{ success: boolean; conflicts: GateConflict[] }> {
    const conflicts = await checkGateConflicts(
        gate,
        terminal,
        flight.departureTime,
        flight.arrivalTime,
        flightId,
    );

    if (conflicts.length > 0) {
        return { success: false, conflicts };
    }

    const ref = doc(db, 'flights', flightId);
    await updateDoc(ref, {
        gate,
        terminal,
        updatedAt: Timestamp.now(),
    });

    return { success: true, conflicts: [] };
}

// ─── Flight Cancellation ──────────────────────────────────

/**
 * Cancel a flight and return affected bookings.
 */
export async function cancelFlight(
    flightId: string,
    reason: string,
): Promise<AffectedBooking[]> {
    // Update flight status
    const flightRef = doc(db, 'flights', flightId);
    await updateDoc(flightRef, {
        status: 'cancelled',
        cancellationReason: reason,
        updatedAt: Timestamp.now(),
    });

    // Find affected bookings
    const bookingsQ = query(
        collection(db, 'bookings'),
        where('flightId', '==', flightId),
        where('status', '==', 'confirmed'),
    );
    const snap = await getDocs(bookingsQ);

    return snap.docs.map(d => {
        const data = d.data() as BookingDoc;
        return {
            id: d.id,
            pnr: data.pnr,
            passengerCount: data.passengerCount || 1,
            contactEmail: data.contactEmail || '',
            status: data.status,
        };
    });
}

// ─── Rebooking ────────────────────────────────────────────

/**
 * Find alternative flights on the same route after a given date.
 */
export async function getAlternativeFlights(
    originCode: string,
    destinationCode: string,
): Promise<FlightDoc[]> {
    const flights = await getFlights({
        origin: originCode,
        destination: destinationCode,
        maxResults: 20,
    });

    return flights.filter(f =>
        f.status === 'scheduled' &&
        f.departureTime.toDate().getTime() > Date.now()
    );
}

/**
 * Mass-rebook passengers from cancelled flight to a new flight.
 */
export async function rebookPassengers(
    bookingIds: string[],
    newFlightId: string,
): Promise<{ rebooked: number; failed: number }> {
    let rebooked = 0;
    let failed = 0;

    // Process in batches of 500 (Firestore limit)
    const batchSize = 500;
    for (let i = 0; i < bookingIds.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = bookingIds.slice(i, i + batchSize);

        for (const id of chunk) {
            try {
                const ref = doc(db, 'bookings', id);
                batch.update(ref, {
                    flightId: newFlightId,
                    status: 'confirmed',
                    updatedAt: Timestamp.now(),
                });
                rebooked++;
            } catch {
                failed++;
            }
        }

        await batch.commit();
    }

    return { rebooked, failed };
}

/**
 * Get flights with active disruptions (delayed or cancelled).
 */
export async function getDisruptedFlights(): Promise<FlightDoc[]> {
    const flights = await getFlights({ maxResults: 200 });
    return flights.filter(f => f.status === 'delayed' || f.status === 'cancelled');
}

/**
 * Get flights needing gate assignment (gate is null).
 */
export async function getUnassignedFlights(): Promise<FlightDoc[]> {
    const flights = await getFlights({ maxResults: 200 });
    return flights.filter(f =>
        !f.gate &&
        f.status !== 'cancelled' &&
        f.departureTime.toDate().getTime() > Date.now()
    );
}
