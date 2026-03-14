/**
 * Inventory Publication Pipeline — Cloud Functions
 *
 * publishSchedule: Generates FlightDocs from route + aircraft + schedules.
 * withdrawFlight: Server-side flight cancellation with rebooking support.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) initializeApp();
const db = getFirestore();

// ─── Types ────────────────────────────────────────────────────

interface ScheduleInput {
    routeId: string;
    aircraftId: string;
    scheduleId: string;
    startDate: string;  // YYYY-MM-DD
    endDate: string;    // YYYY-MM-DD
    daysOfWeek: number[];  // 0=Sun, 1=Mon, ..., 6=Sat
    departureTime: string; // HH:MM (local)
    arrivalTime: string;   // HH:MM (local)
    flightNumber: string;
}

// ─── Helpers ──────────────────────────────────────────────────

function generateDates(start: string, end: string, daysOfWeek: number[]): string[] {
    const dates: string[] = [];
    const current = new Date(start + 'T00:00:00Z');
    const endDate = new Date(end + 'T23:59:59Z');

    while (current <= endDate) {
        if (daysOfWeek.includes(current.getUTCDay())) {
            const y = current.getUTCFullYear();
            const m = String(current.getUTCMonth() + 1).padStart(2, '0');
            const d = String(current.getUTCDate()).padStart(2, '0');
            dates.push(`${y}-${m}-${d}`);
        }
        current.setUTCDate(current.getUTCDate() + 1);
    }
    return dates;
}

function parseDateTimeUTC(date: string, time: string): Date {
    return new Date(`${date}T${time}:00Z`);
}

/**
 * publishSchedule — Generates flight documents from schedule parameters.
 *
 * Creates one `flights/{doc}` per operating date within the range, populating:
 * - Route info (origin/destination with codes + city names)
 * - Aircraft info (type, registration, seat config)
 * - Seat inventory from aircraft seatConfig
 * - Departure/arrival timestamps
 * - Status: 'published'
 *
 * Callable by: super_admin, ops_manager
 */
export const publishSchedule = onCall(async (request) => {
    const callerRole = request.auth?.token?.role as string | undefined;
    if (!callerRole || !['super_admin', 'ops_manager'].includes(callerRole)) {
        throw new HttpsError('permission-denied', 'Only ops managers can publish schedules.');
    }

    const input = request.data as ScheduleInput;

    if (!input.routeId || !input.aircraftId || !input.startDate || !input.endDate || !input.flightNumber) {
        throw new HttpsError('invalid-argument', 'routeId, aircraftId, startDate, endDate, and flightNumber are required.');
    }

    // Fetch route
    const routeDoc = await db.doc(`routes/${input.routeId}`).get();
    if (!routeDoc.exists) throw new HttpsError('not-found', 'Route not found.');
    const route = routeDoc.data()!;

    // Fetch aircraft
    const aircraftDoc = await db.doc(`aircraft/${input.aircraftId}`).get();
    if (!aircraftDoc.exists) throw new HttpsError('not-found', 'Aircraft not found.');
    const aircraft = aircraftDoc.data()!;

    // Validate aircraft is active
    if (aircraft.status === 'retired' || aircraft.status === 'maintenance') {
        throw new HttpsError('failed-precondition', `Aircraft ${aircraft.registration} is ${aircraft.status} and cannot be scheduled.`);
    }

    // Generate operating dates
    const daysOfWeek = input.daysOfWeek || [1, 2, 3, 4, 5]; // default weekdays
    const operatingDates = generateDates(input.startDate, input.endDate, daysOfWeek);

    if (operatingDates.length === 0) {
        throw new HttpsError('invalid-argument', 'No valid operating dates found in the specified range.');
    }

    // Build seat inventory from aircraft seatConfig
    const seatConfig = aircraft.seatConfig || { economy: 150, business: 24, first: 8 };
    const seatsAvailable = { ...seatConfig };
    const seatsTaken: Record<string, number> = {};
    for (const cls of Object.keys(seatConfig)) {
        seatsTaken[cls] = 0;
    }

    // Check for conflicts (existing flights same aircraft + date)
    const existingFlightsSnap = await db.collection('flights')
        .where('aircraft.id', '==', input.aircraftId)
        .where('status', 'in', ['published', 'scheduled', 'boarding'])
        .get();

    const existingDates = new Set<string>();
    for (const doc of existingFlightsSnap.docs) {
        const d = doc.data();
        if (d.departureDate) existingDates.add(d.departureDate);
    }

    // Create flight documents (batch write for efficiency)
    const batch = db.batch();
    let createdCount = 0;
    const skippedDates: string[] = [];

    for (const dateStr of operatingDates) {
        // Skip if flight already exists on this date for this aircraft
        if (existingDates.has(dateStr)) {
            skippedDates.push(dateStr);
            continue;
        }

        const departureTimestamp = Timestamp.fromDate(parseDateTimeUTC(dateStr, input.departureTime));
        const arrivalTimestamp = Timestamp.fromDate(parseDateTimeUTC(dateStr, input.arrivalTime));

        const flightRef = db.collection('flights').doc();
        batch.set(flightRef, {
            flightNumber: input.flightNumber,
            routeId: input.routeId,
            origin: {
                code: route.originCode || route.origin,
                city: route.originCity || route.originName || '',
            },
            destination: {
                code: route.destinationCode || route.destination,
                city: route.destinationCity || route.destinationName || '',
            },
            aircraft: {
                id: input.aircraftId,
                type: aircraft.type,
                registration: aircraft.registration,
            },
            departureDate: dateStr,
            departureTime: departureTimestamp,
            arrivalTime: arrivalTimestamp,
            seatsAvailable,
            seatsTaken,
            totalCapacity: Object.values(seatConfig).reduce((sum: number, n: any) => sum + (n as number), 0),
            status: 'published',
            scheduleId: input.scheduleId || null,
            createdBy: request.auth!.uid,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        createdCount++;
    }

    if (createdCount > 0) {
        await batch.commit();
    }

    // Update schedule document if provided
    if (input.scheduleId) {
        await db.doc(`schedules/${input.scheduleId}`).update({
            publishStatus: 'published',
            publishedFlightsCount: createdCount,
            lastPublishedAt: FieldValue.serverTimestamp(),
        });
    }

    // Audit log
    await db.collection('audit_logs').add({
        action: 'PUBLISH_SCHEDULE',
        entityType: 'schedule',
        entityId: input.scheduleId || input.flightNumber,
        userId: request.auth!.uid,
        userEmail: request.auth!.token.email || '',
        details: {
            flightNumber: input.flightNumber,
            routeId: input.routeId,
            aircraftId: input.aircraftId,
            dateRange: `${input.startDate} — ${input.endDate}`,
            flightsCreated: createdCount,
            skippedDates: skippedDates.length,
        },
        timestamp: FieldValue.serverTimestamp(),
    });

    return {
        success: true,
        flightsCreated: createdCount,
        skippedDates,
        message: `Published ${createdCount} flight(s) for ${input.flightNumber}. ${skippedDates.length} date(s) skipped (conflicts).`,
    };
});

/**
 * withdrawFlight — Server-side flight cancellation.
 *
 * Cancels a published flight and optionally handles affected bookings
 * by marking them for rebooking or refund.
 *
 * Callable by: super_admin, ops_manager
 */
export const withdrawFlight = onCall(async (request) => {
    const callerRole = request.auth?.token?.role as string | undefined;
    if (!callerRole || !['super_admin', 'ops_manager'].includes(callerRole)) {
        throw new HttpsError('permission-denied', 'Only ops managers can withdraw flights.');
    }

    const { flightId, reason, rebookOption } = request.data;

    if (!flightId) {
        throw new HttpsError('invalid-argument', 'flightId is required.');
    }

    const flightDoc = await db.doc(`flights/${flightId}`).get();
    if (!flightDoc.exists) throw new HttpsError('not-found', 'Flight not found.');

    const flight = flightDoc.data()!;

    if (flight.status === 'cancelled' || flight.status === 'withdrawn') {
        throw new HttpsError('failed-precondition', 'Flight is already cancelled/withdrawn.');
    }

    // Cancel the flight
    await db.doc(`flights/${flightId}`).update({
        status: 'withdrawn',
        cancellationReason: reason || 'Operational decision',
        withdrawnBy: request.auth!.uid,
        withdrawnAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    // Find affected bookings
    const bookingsSnap = await db.collection('bookings')
        .where('flightId', '==', flightId)
        .where('status', 'in', ['confirmed', 'checked_in', 'pending'])
        .get();

    let affectedCount = 0;
    for (const bookingDoc of bookingsSnap.docs) {
        const newStatus = rebookOption === 'refund' ? 'refund_pending' : 'rebook_pending';
        await bookingDoc.ref.update({
            status: newStatus,
            originalFlightId: flightId,
            withdrawalReason: reason || 'Flight withdrawn',
            updatedAt: FieldValue.serverTimestamp(),
        });
        affectedCount++;
    }

    // Audit log
    await db.collection('audit_logs').add({
        action: 'WITHDRAW_FLIGHT',
        entityType: 'flight',
        entityId: flightId,
        userId: request.auth!.uid,
        userEmail: request.auth!.token.email || '',
        details: {
            flightNumber: flight.flightNumber,
            reason,
            affectedBookings: affectedCount,
            rebookOption: rebookOption || 'rebook',
        },
        timestamp: FieldValue.serverTimestamp(),
    });

    return {
        success: true,
        affectedBookings: affectedCount,
        message: `Flight ${flight.flightNumber} withdrawn. ${affectedCount} booking(s) marked for ${rebookOption || 'rebook'}.`,
    };
});
