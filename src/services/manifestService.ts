/**
 * Manifest Service — Passenger Manifest Generation & Export
 *
 * Generates APIS-format passenger manifests for regulatory compliance.
 */

import {
    collection,
    query,
    where,
    getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { getFlights } from './firestore';
import type { BookingDoc, PassengerDoc, FlightDoc } from '../types/firestore';

// ─── Types ─────────────────────────────────────────────────

export interface ManifestRecord {
    passengerName: string;       // LAST, FIRST
    nationality: string;
    documentType: string;
    documentNumber: string;
    dateOfBirth: string;
    pnr: string;
    seatNumber: string;
    fareClass: string;
    boardingStatus: string;      // Checked-In | Pending | No-Show
    apisCompliance: 'OK' | 'Pending' | 'Action Required';
}

export interface ManifestSummary {
    totalPassengers: number;
    checkedIn: number;
    docsVerified: number;
    docsPending: number;
    flight: FlightDoc | null;
    records: ManifestRecord[];
}

// ─── Core Functions ────────────────────────────────────────

/**
 * Generate a full passenger manifest for a flight.
 */
export async function generateManifest(flightId: string): Promise<ManifestSummary> {
    // Get the flight
    const flights = await getFlights({ maxResults: 500 });
    const flight = flights.find(f => f.id === flightId) || null;

    // Query bookings for this flight
    const bookingsQ = query(
        collection(db, 'bookings'),
        where('flightId', '==', flightId),
    );
    const bookingSnap = await getDocs(bookingsQ);
    const bookings = bookingSnap.docs.map(d => ({ id: d.id, ...d.data() } as BookingDoc));

    const records: ManifestRecord[] = [];
    let checkedIn = 0;
    let docsVerified = 0;
    let docsPending = 0;

    for (const booking of bookings) {
        // Query passengers sub-collection
        const paxSnap = await getDocs(collection(db, 'bookings', booking.id, 'passengers'));
        const passengers = paxSnap.docs.map(d => ({ id: d.id, ...d.data() } as PassengerDoc));

        if (passengers.length === 0) {
            // No sub-collection passengers — create a record from the booking itself
            const hasDoc = !!booking.contactEmail;
            if (hasDoc) docsVerified++;
            else docsPending++;

            records.push({
                passengerName: `PASSENGER, ${booking.pnr}`,
                nationality: '--',
                documentType: '--',
                documentNumber: '--',
                dateOfBirth: '--',
                pnr: booking.pnr,
                seatNumber: '--',
                fareClass: booking.fareClass,
                boardingStatus: booking.status === 'checked_in' || booking.status === 'boarded' ? 'Checked-In' : 'Pending',
                apisCompliance: hasDoc ? 'Pending' : 'Action Required',
            });

            if (booking.status === 'checked_in' || booking.status === 'boarded') checkedIn++;
            continue;
        }

        for (const pax of passengers) {
            const isCheckedIn = pax.checkedIn;
            const hasValidDoc = !!pax.documentNumber && pax.documentNumber !== '';
            const compliance: ManifestRecord['apisCompliance'] = hasValidDoc ? 'OK' : pax.documentType ? 'Pending' : 'Action Required';

            if (hasValidDoc) docsVerified++;
            else docsPending++;
            if (isCheckedIn) checkedIn++;

            records.push({
                passengerName: `${pax.lastName.toUpperCase()}, ${pax.firstName.toUpperCase()}`,
                nationality: pax.nationality || '--',
                documentType: pax.documentType === 'passport' ? 'P' : 'ID',
                documentNumber: pax.documentNumber || 'MISSING',
                dateOfBirth: pax.dateOfBirth || '--',
                pnr: booking.pnr,
                seatNumber: pax.seatNumber || '--',
                fareClass: booking.fareClass,
                boardingStatus: isCheckedIn ? 'Checked-In' : booking.status === 'cancelled' ? 'No-Show' : 'Pending',
                apisCompliance: compliance,
            });
        }
    }

    return {
        totalPassengers: records.length,
        checkedIn,
        docsVerified,
        docsPending,
        flight,
        records,
    };
}

/**
 * Export manifest records as CSV download.
 */
export function exportManifestCSV(records: ManifestRecord[], flightNumber: string): void {
    const headers = [
        'Passenger Name',
        'Nationality',
        'Doc Type',
        'Doc Number',
        'Date of Birth',
        'PNR',
        'Seat',
        'Class',
        'Boarding Status',
        'APIS Compliance',
    ];

    const rows = records.map(r => [
        r.passengerName,
        r.nationality,
        r.documentType,
        r.documentNumber,
        r.dateOfBirth,
        r.pnr,
        r.seatNumber,
        r.fareClass,
        r.boardingStatus,
        r.apisCompliance,
    ]);

    const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manifest_${flightNumber}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Get upcoming flights (for the flight selector on the manifest page).
 */
export async function getUpcomingFlights(): Promise<FlightDoc[]> {
    const flights = await getFlights({ maxResults: 200 });
    return flights.filter(f =>
        f.status !== 'cancelled' &&
        f.departureTime.toDate().getTime() > Date.now() - 24 * 60 * 60 * 1000 // Include flights from last 24h
    );
}
