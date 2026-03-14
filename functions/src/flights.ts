/**
 * Flight Operations — Cloud Functions
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) initializeApp();
const db = getFirestore();

/**
 * Update a flight's status (e.g. boarding, departed, delayed).
 * Callable by ops_manager, crew_sched, and super_admin.
 */
export const updateFlightStatus = onCall(async (request) => {
    const callerRole = request.auth?.token?.role as string | undefined;
    const opsRoles = ['super_admin', 'ops_manager', 'crew_sched'];
    if (!callerRole || !opsRoles.includes(callerRole)) {
        throw new HttpsError('permission-denied', 'Insufficient permissions for flight operations.');
    }

    const { flightId, status, delayMinutes, cancellationReason } = request.data;
    const validStatuses = ['scheduled', 'boarding', 'departed', 'in_air', 'landed', 'arrived', 'delayed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        throw new HttpsError('invalid-argument', `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updateData: Record<string, unknown> = {
        status,
        updatedAt: FieldValue.serverTimestamp(),
    };
    if (status === 'delayed' && delayMinutes) updateData.delayMinutes = delayMinutes;
    if (status === 'cancelled' && cancellationReason) updateData.cancellationReason = cancellationReason;

    await db.doc(`flights/${flightId}`).update(updateData);

    await db.collection('audit_logs').add({
        action: 'UPDATE_FLIGHT_STATUS',
        entityType: 'flight',
        entityId: flightId,
        userId: request.auth!.uid,
        userEmail: request.auth!.token.email || '',
        details: { newStatus: status, delayMinutes, cancellationReason },
        timestamp: FieldValue.serverTimestamp(),
    });

    return { success: true, message: `Flight ${flightId} status updated to '${status}'` };
});

/**
 * Assign/change a gate for a flight.
 */
export const assignGate = onCall(async (request) => {
    const callerRole = request.auth?.token?.role as string | undefined;
    if (!callerRole || !['super_admin', 'ops_manager'].includes(callerRole)) {
        throw new HttpsError('permission-denied', 'Only ops managers can assign gates.');
    }

    const { flightId, gate, terminal } = request.data;

    await db.doc(`flights/${flightId}`).update({
        gate,
        terminal: terminal || null,
        updatedAt: FieldValue.serverTimestamp(),
    });

    await db.collection('audit_logs').add({
        action: 'ASSIGN_GATE',
        entityType: 'flight',
        entityId: flightId,
        userId: request.auth!.uid,
        userEmail: request.auth!.token.email || '',
        details: { gate, terminal },
        timestamp: FieldValue.serverTimestamp(),
    });

    return { success: true, message: `Gate ${gate} assigned to flight ${flightId}` };
});

/**
 * Aircraft swap — reassign a different aircraft to a flight.
 */
export const swapAircraft = onCall(async (request) => {
    const callerRole = request.auth?.token?.role as string | undefined;
    if (!callerRole || !['super_admin', 'ops_manager'].includes(callerRole)) {
        throw new HttpsError('permission-denied', 'Only ops managers can swap aircraft.');
    }

    const { flightId, newAircraftId } = request.data;

    const aircraftDoc = await db.doc(`aircraft/${newAircraftId}`).get();
    if (!aircraftDoc.exists) {
        throw new HttpsError('not-found', `Aircraft ${newAircraftId} not found.`);
    }

    const aircraft = aircraftDoc.data()!;
    await db.doc(`flights/${flightId}`).update({
        aircraft: {
            id: newAircraftId,
            type: aircraft.type,
            registration: aircraft.registration,
        },
        seatsAvailable: aircraft.seatConfig,
        updatedAt: FieldValue.serverTimestamp(),
    });

    await db.collection('audit_logs').add({
        action: 'SWAP_AIRCRAFT',
        entityType: 'flight',
        entityId: flightId,
        userId: request.auth!.uid,
        userEmail: request.auth!.token.email || '',
        details: { newAircraftId, type: aircraft.type },
        timestamp: FieldValue.serverTimestamp(),
    });

    return { success: true, message: `Aircraft swapped to ${aircraft.registration}` };
});
