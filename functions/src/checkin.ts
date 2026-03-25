/**
 * Check-in Cloud Function — Secure Server-Side Check-in
 *
 * Validates check-in eligibility, assigns seats with conflict prevention,
 * generates BCBP data, and creates check-in records atomically.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { enforceRateLimit } from './rateLimit';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) initializeApp();
const db = getFirestore();

// ─── BCBP Encoding (server-side) ──────────────────────────

function fareClassToCompartment(fareClass: string): string {
    const map: Record<string, string> = {
        first: 'F', business: 'C', premium_economy: 'W', economy: 'Y',
    };
    return map[fareClass.toLowerCase()] || 'Y';
}

function toDayOfYear(date: Date): string {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const day = Math.floor(diff / (1000 * 60 * 60 * 24));
    return String(day).padStart(3, '0');
}

function encodeBCBP(data: {
    passengerName: string; pnr: string; origin: string; destination: string;
    carrierCode: string; flightNumber: string; departureDate: Date;
    compartment: string; seatNumber: string; sequenceNumber: number;
}): string {
    const name = data.passengerName.toUpperCase().padEnd(20, ' ').slice(0, 20);
    const pnr = data.pnr.toUpperCase().padEnd(7, ' ').slice(0, 7);
    const origin = data.origin.toUpperCase().padEnd(3, ' ').slice(0, 3);
    const dest = data.destination.toUpperCase().padEnd(3, ' ').slice(0, 3);
    const carrier = data.carrierCode.toUpperCase().padEnd(3, ' ').slice(0, 3);
    const flightNum = data.flightNumber.replace(/\D/g, '').padStart(4, '0').slice(0, 4);
    const julianDate = toDayOfYear(data.departureDate);
    const compartment = data.compartment.slice(0, 1);
    const seat = data.seatNumber.toUpperCase().padStart(4, '0').slice(0, 4);
    const seq = String(data.sequenceNumber).padStart(4, '0').slice(0, 4);

    return `M1${name}${pnr}${origin}${dest}${carrier}${flightNum}${julianDate}${compartment}${seat}${seq}`;
}

function determineBoardingGroup(seatNumber: string): string {
    const row = parseInt(seatNumber.replace(/[A-Z]/g, ''), 10);
    if (row <= 3) return 'First Class';
    if (row <= 7) return 'Business Priority';
    if (row <= 15) return 'Group A';
    if (row <= 25) return 'Group B';
    return 'Group C';
}

// ─── Process Check-in (Secure) ────────────────────────────

export const processCheckinSecure = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }

    const uid = request.auth.uid;
    await enforceRateLimit(uid, 'processCheckin', { maxRequests: 30, windowMs: 60 * 60 * 1000 });

    const { bookingId, passengerId, seatNumber, pnr, flightId } = request.data as {
        bookingId: string; passengerId: string; seatNumber: string; pnr: string; flightId: string;
    };

    if (!bookingId || !passengerId || !seatNumber || !flightId) {
        throw new HttpsError('invalid-argument', 'Missing required check-in fields.');
    }

    // ─── Validate booking ownership ───────────────────────
    const bookingRef = db.doc(`bookings/${bookingId}`);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) {
        throw new HttpsError('not-found', 'Booking not found.');
    }

    const booking = bookingSnap.data()!;
    if (booking.userId !== uid) {
        throw new HttpsError('permission-denied', 'This booking does not belong to you.');
    }

    // ─── Validate booking status ──────────────────────────
    if (booking.status === 'cancelled' || booking.status === 'refunded') {
        throw new HttpsError('failed-precondition', 'This booking has been cancelled.');
    }
    if (booking.status !== 'confirmed' && booking.status !== 'checked_in') {
        throw new HttpsError('failed-precondition', 'Booking is not confirmed. Complete payment first.');
    }

    // ─── Validate flight and check-in window ──────────────
    const flightRef = db.doc(`flights/${flightId}`);
    const flightSnap = await flightRef.get();
    if (!flightSnap.exists) {
        throw new HttpsError('not-found', 'Flight not found.');
    }

    const flight = flightSnap.data()!;
    if (flight.status === 'cancelled') {
        throw new HttpsError('failed-precondition', 'Flight has been cancelled.');
    }

    const departureTime = flight.departureTime?.toDate?.() || new Date();
    const hoursUntilDeparture = (departureTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilDeparture > 48) {
        throw new HttpsError('failed-precondition',
            'Check-in is not yet open. It opens 48 hours before departure.');
    }
    if (hoursUntilDeparture < 1) {
        throw new HttpsError('failed-precondition', 'Check-in has closed for this flight.');
    }

    // ─── Check seat conflicts ─────────────────────────────
    const bookingsOnFlight = await db.collection('bookings')
        .where('flightId', '==', flightId)
        .where('status', 'in', ['confirmed', 'checked_in', 'boarded'])
        .get();

    for (const bDoc of bookingsOnFlight.docs) {
        const paxSnap = await db.collection(`bookings/${bDoc.id}/passengers`).get();
        for (const pDoc of paxSnap.docs) {
            if (bDoc.id === bookingId && pDoc.id === passengerId) continue;
            const existingPax = pDoc.data();
            if (existingPax.seatNumber === seatNumber) {
                throw new HttpsError('already-exists',
                    `Seat ${seatNumber} is already taken. Please choose another seat.`);
            }
        }
    }

    // ─── Validate passenger exists ────────────────────────
    const paxRef = db.doc(`bookings/${bookingId}/passengers/${passengerId}`);
    const paxSnap = await paxRef.get();
    if (!paxSnap.exists) {
        throw new HttpsError('not-found', 'Passenger not found.');
    }

    const paxData = paxSnap.data()!;
    const passengerName = [paxData.lastName || '', paxData.firstName || '']
        .filter(Boolean).join('/') || 'PASSENGER';

    // ─── Generate BCBP ────────────────────────────────────
    const sequenceNumber = Date.now() % 10000;
    let bcbpData: string | null = null;
    try {
        bcbpData = encodeBCBP({
            passengerName,
            pnr: pnr || booking.pnr || '------',
            origin: booking.origin?.code || booking.origin || '---',
            destination: booking.destination?.code || booking.destination || '---',
            carrierCode: 'DB',
            flightNumber: flight.flightNumber || '0000',
            departureDate: departureTime,
            compartment: fareClassToCompartment(booking.fareClass || 'economy'),
            seatNumber,
            sequenceNumber,
        });
    } catch (e) {
        console.error('[BCBP] Server-side encoding failed:', e);
    }

    // ─── Atomic write batch ───────────────────────────────
    const batch = db.batch();
    const checkinId = `ci-${Date.now()}-${passengerId}`;

    // Update passenger
    batch.update(paxRef, {
        seatNumber,
        checkedIn: true,
    });

    // Create checkin document
    const checkinRef = db.doc(`checkins/${checkinId}`);
    batch.set(checkinRef, {
        bookingId,
        pnr: pnr || booking.pnr,
        passengerId,
        userId: uid,
        seatNumber,
        boardingGroup: determineBoardingGroup(seatNumber),
        boardingPassUrl: null,
        bcbpData,
        checkedInAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    // ─── Check if all passengers are checked in ───────────
    const allPaxSnap = await db.collection(`bookings/${bookingId}/passengers`).get();
    const allCheckedIn = allPaxSnap.docs.every(d => {
        const data = d.data();
        return d.id === passengerId ? true : data.checkedIn === true;
    });

    if (allCheckedIn) {
        await bookingRef.update({
            status: 'checked_in',
            updatedAt: FieldValue.serverTimestamp(),
        });
    }

    // Audit log
    db.collection('audit_logs').add({
        action: 'CHECKIN_PROCESSED',
        entityType: 'checkin',
        entityId: checkinId,
        userId: uid,
        userEmail: request.auth.token.email || '',
        details: { bookingId, passengerId, seatNumber, flightId },
        timestamp: FieldValue.serverTimestamp(),
    }).catch(err => console.error('Audit log failed:', err));

    return {
        checkinId,
        seatNumber,
        boardingGroup: determineBoardingGroup(seatNumber),
        bcbpData,
    };
});
