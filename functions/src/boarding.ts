/**
 * Boarding Pass Generation — Cloud Functions
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) initializeApp();
const db = getFirestore();

/**
 * Generate a boarding pass for a checked-in passenger.
 * In production, this would generate a PDF and store it in Cloud Storage.
 * Currently returns a structured boarding pass data object.
 */
export const generateBoardingPass = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }

    const { checkinId, bookingId, passengerId } = request.data;

    const checkinDoc = await db.doc(`checkins/${checkinId}`).get();
    if (!checkinDoc.exists) {
        throw new HttpsError('not-found', 'Check-in record not found.');
    }

    const bookingDoc = await db.doc(`bookings/${bookingId}`).get();
    if (!bookingDoc.exists) {
        throw new HttpsError('not-found', 'Booking not found.');
    }
    const booking = bookingDoc.data()!;

    const paxDoc = await db.doc(`bookings/${bookingId}/passengers/${passengerId}`).get();
    if (!paxDoc.exists) {
        throw new HttpsError('not-found', 'Passenger not found.');
    }
    const passenger = paxDoc.data()!;

    const flightDoc = await db.doc(`flights/${booking.flightId}`).get();
    const flight = flightDoc.exists ? flightDoc.data()! : {} as Record<string, unknown>;

    const checkin = checkinDoc.data()!;

    const boardingPassData = {
        airline: 'DELTABLUE JET AIR',
        flightNumber: booking.flightNumber,
        passengerName: `${passenger.lastName}/${passenger.firstName}`.toUpperCase(),
        from: booking.origin?.code || 'BJL',
        to: booking.destination?.code || 'N/A',
        date: booking.departureTime?.toDate?.()
            ? booking.departureTime.toDate().toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
        gate: flight.gate || 'TBD',
        terminal: flight.terminal || '-',
        boardingTime: flight.departureTime?.toDate?.()
            ? new Date(flight.departureTime.toDate().getTime() - 45 * 60 * 1000)
                .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : 'TBD',
        seat: checkin.seatNumber,
        boardingGroup: checkin.boardingGroup,
        fareClass: booking.fareClass || 'economy',
        pnr: booking.pnr,
        sequence: Math.floor(Math.random() * 200) + 1,
        barcode: `DB${booking.pnr}${checkin.seatNumber}${Date.now()}`,
    };

    const boardingPassUrl = `data:application/json;base64,${Buffer.from(JSON.stringify(boardingPassData)).toString('base64')}`;

    await db.doc(`checkins/${checkinId}`).update({ boardingPassUrl });
    await db.doc(`bookings/${bookingId}/passengers/${passengerId}`).update({ boardingPassUrl });

    await db.collection('audit_logs').add({
        action: 'BOARDING_PASS_GENERATED',
        entityType: 'checkin',
        entityId: checkinId,
        userId: request.auth.uid,
        userEmail: request.auth.token.email || '',
        details: {
            pnr: booking.pnr,
            seat: checkin.seatNumber,
            boardingGroup: checkin.boardingGroup,
            flightNumber: booking.flightNumber,
        },
        timestamp: FieldValue.serverTimestamp(),
    });

    return { boardingPassUrl, boardingGroup: checkin.boardingGroup, boardingPass: boardingPassData };
});
