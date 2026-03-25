"use strict";
/**
 * Booking Cloud Function — Secure Server-Side Booking Creation
 *
 * Validates flight data, seat availability, and pricing server-side
 * before creating the booking atomically. This prevents client-side
 * manipulation of prices, fare classes, and seat counts.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelBookingSecure = exports.createBookingSecure = void 0;
const https_1 = require("firebase-functions/v2/https");
const rateLimit_1 = require("./rateLimit");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
// ─── PNR Generation (server-side, with collision detection) ─────
const PNR_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generatePNR() {
    return Array.from({ length: 6 }, () => PNR_CHARS[Math.floor(Math.random() * PNR_CHARS.length)]).join('');
}
async function generateUniquePNR() {
    for (let attempt = 0; attempt < 10; attempt++) {
        const pnr = generatePNR();
        const existing = await db.collection('bookings')
            .where('pnr', '==', pnr)
            .limit(1)
            .get();
        if (existing.empty)
            return pnr;
    }
    throw new https_1.HttpsError('internal', 'Failed to generate unique PNR after 10 attempts.');
}
// ─── Fare Class Multipliers (server-side source of truth) ───────
const FARE_CLASS_MULTIPLIERS = {
    economy: 1.0,
    premium_economy: 1.4,
    business: 2.5,
    first: 4.0,
};
// ─── E-Ticket Generation (server-side) ─────────────────────────
function generateETicketNumber() {
    const now = new Date();
    const datePart = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
    ].join('');
    const randomBytes = require('crypto').randomBytes(4);
    const randomPart = randomBytes.toString('hex').toUpperCase().slice(0, 6);
    return `DBJ-${datePart}-${randomPart}`;
}
exports.createBookingSecure = (0, https_1.onCall)(async (request) => {
    // ── Auth check ─────────────────────────────────────────
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in to create a booking.');
    }
    const uid = request.auth.uid;
    // ── Rate limiting: 20 bookings per hour per user ──────
    await (0, rateLimit_1.enforceRateLimit)(uid, 'createBooking', rateLimit_1.RATE_LIMITS.BOOKING_CREATE);
    // ── Validate input ────────────────────────────────────
    const data = request.data;
    if (!data.flightId || !data.fareClass || !data.passengers?.length || !data.contactEmail) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required booking fields.');
    }
    if (data.passengers.length > 9) {
        throw new https_1.HttpsError('invalid-argument', 'Maximum 9 passengers per booking.');
    }
    const fareClassKey = data.fareClass.toLowerCase();
    if (!FARE_CLASS_MULTIPLIERS[fareClassKey]) {
        throw new https_1.HttpsError('invalid-argument', `Invalid fare class: ${data.fareClass}`);
    }
    // ── Fetch flight and validate ─────────────────────────
    const flightRef = db.doc(`flights/${data.flightId}`);
    const flightSnap = await flightRef.get();
    if (!flightSnap.exists) {
        throw new https_1.HttpsError('not-found', 'Flight not found.');
    }
    const flight = flightSnap.data();
    // Check flight status
    const flightStatus = (flight.status || '').toLowerCase();
    if (['cancelled', 'departed', 'arrived'].includes(flightStatus)) {
        throw new https_1.HttpsError('failed-precondition', `Flight is ${flightStatus}. Cannot book.`);
    }
    // ── Validate seat availability ────────────────────────
    const availableSeats = flight.seatsAvailable || {};
    const seatsForClass = availableSeats[fareClassKey] ?? availableSeats[data.fareClass] ?? 0;
    if (seatsForClass < data.passengers.length) {
        throw new https_1.HttpsError('failed-precondition', `Not enough seats. Requested ${data.passengers.length}, available: ${seatsForClass}.`);
    }
    // ── Calculate price server-side ───────────────────────
    const baseFare = flight.baseFare ||
        flight.price ||
        flight.basePrice || 0;
    const multiplier = FARE_CLASS_MULTIPLIERS[fareClassKey];
    const perPassengerFare = Math.round(baseFare * multiplier);
    const totalAmount = perPassengerFare * data.passengers.length;
    // ── Generate PNR with collision detection ─────────────
    const pnr = await generateUniquePNR();
    // ── Atomic write: booking + passengers + seat update ──
    const batch = db.batch();
    const bookingRef = db.collection('bookings').doc();
    batch.set(bookingRef, {
        pnr,
        userId: uid,
        flightId: data.flightId,
        flightNumber: flight.flightNumber || '',
        status: 'pending',
        origin: flight.origin || null,
        destination: flight.destination || null,
        departureTime: flight.departureTime || null,
        arrivalTime: flight.arrivalTime || null,
        fareClass: data.fareClass,
        totalAmount,
        currency: flight.currency || 'USD',
        passengerCount: data.passengers.length,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || '',
        paymentIntentId: null,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    // Create passenger sub-documents
    for (let i = 0; i < data.passengers.length; i++) {
        const pax = data.passengers[i];
        const paxRef = db.collection(`bookings/${bookingRef.id}/passengers`).doc();
        batch.set(paxRef, {
            title: pax.title || null,
            firstName: pax.firstName,
            lastName: pax.lastName,
            gender: pax.gender || null,
            dateOfBirth: pax.dateOfBirth,
            nationality: pax.nationality,
            documentType: pax.documentType || 'passport',
            documentNumber: pax.documentNumber,
            passportExpiry: pax.passportExpiry || null,
            issuingCountry: pax.issuingCountry || null,
            seatNumber: data.selectedSeats?.[`pax-${i}`] || null,
            boardingPassUrl: null,
            checkedIn: false,
            specialRequests: [],
        });
    }
    // Update seat counts on the flight
    const seatFieldKey = fareClassKey;
    batch.update(flightRef, {
        [`seatsTaken.${seatFieldKey}`]: firestore_1.FieldValue.increment(data.passengers.length),
        [`seatsAvailable.${seatFieldKey}`]: firestore_1.FieldValue.increment(-data.passengers.length),
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    await batch.commit();
    // ── Audit log (non-blocking) ──────────────────────────
    db.collection('audit_logs').add({
        action: 'BOOKING_CREATED',
        entityType: 'booking',
        entityId: bookingRef.id,
        userId: uid,
        userEmail: request.auth.token.email || '',
        details: {
            pnr,
            flightId: data.flightId,
            flightNumber: flight.flightNumber || '',
            fareClass: data.fareClass,
            totalAmount,
            passengerCount: data.passengers.length,
        },
        timestamp: firestore_1.FieldValue.serverTimestamp(),
    }).catch(err => console.error('Audit log failed:', err));
    return {
        bookingId: bookingRef.id,
        pnr,
        totalAmount,
        currency: flight.currency || 'USD',
    };
});
/**
 * Cancel a booking securely.
 * Only the booking owner or ops staff can cancel.
 */
exports.cancelBookingSecure = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in.');
    }
    const uid = request.auth.uid;
    const callerRole = request.auth.token?.role;
    const { bookingId } = request.data;
    if (!bookingId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing bookingId.');
    }
    const bookingRef = db.doc(`bookings/${bookingId}`);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) {
        throw new https_1.HttpsError('not-found', 'Booking not found.');
    }
    const booking = bookingSnap.data();
    const isOwner = booking.userId === uid;
    const isStaff = callerRole && ['super_admin', 'ops_manager', 'cs_agent'].includes(callerRole);
    if (!isOwner && !isStaff) {
        throw new https_1.HttpsError('permission-denied', 'You cannot cancel this booking.');
    }
    if (booking.status === 'cancelled' || booking.status === 'refunded') {
        throw new https_1.HttpsError('failed-precondition', 'Booking is already cancelled.');
    }
    const batch = db.batch();
    // Cancel the booking
    batch.update(bookingRef, {
        status: 'cancelled',
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    // Release seats back to the flight
    const fareClass = booking.fareClass || 'economy';
    const paxCount = booking.passengerCount || 1;
    batch.update(db.doc(`flights/${booking.flightId}`), {
        [`seatsTaken.${fareClass}`]: firestore_1.FieldValue.increment(-paxCount),
        [`seatsAvailable.${fareClass}`]: firestore_1.FieldValue.increment(paxCount),
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    await batch.commit();
    // Audit log
    db.collection('audit_logs').add({
        action: 'BOOKING_CANCELLED',
        entityType: 'booking',
        entityId: bookingId,
        userId: uid,
        userEmail: request.auth.token.email || '',
        details: { pnr: booking.pnr, fareClass, passengerCount: paxCount },
        timestamp: firestore_1.FieldValue.serverTimestamp(),
    }).catch(err => console.error('Audit log failed:', err));
    return { success: true };
});
//# sourceMappingURL=bookings.js.map