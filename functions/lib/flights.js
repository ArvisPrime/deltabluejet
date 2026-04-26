"use strict";
/**
 * Flight Operations — Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.swapAircraft = exports.assignGate = exports.updateFlightStatus = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
/**
 * Update a flight's status (e.g. boarding, departed, delayed).
 * Callable by ops_manager, crew_sched, and super_admin.
 */
exports.updateFlightStatus = (0, https_1.onCall)(async (request) => {
    const callerRole = request.auth?.token?.role;
    const opsRoles = ['super_admin', 'ops_manager', 'crew_sched'];
    if (!callerRole || !opsRoles.includes(callerRole)) {
        throw new https_1.HttpsError('permission-denied', 'Insufficient permissions for flight operations.');
    }
    const { flightId, status, delayMinutes, cancellationReason } = request.data;
    const validStatuses = [
        'scheduled', 'boarding', 'doors_closed', 'taxi_out',
        'departed', 'airborne', 'in_air', 'cruise', 'descent',
        'landed', 'taxi_in', 'arrived', 'delayed', 'cancelled', 'diverted',
    ];
    if (!validStatuses.includes(status)) {
        throw new https_1.HttpsError('invalid-argument', `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    const updateData = {
        status,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    };
    if (status === 'delayed' && delayMinutes)
        updateData.delayMinutes = delayMinutes;
    if (status === 'cancelled' && cancellationReason)
        updateData.cancellationReason = cancellationReason;
    await db.doc(`flights/${flightId}`).update(updateData);
    await db.collection('audit_logs').add({
        action: 'UPDATE_FLIGHT_STATUS',
        entityType: 'flight',
        entityId: flightId,
        userId: request.auth.uid,
        userEmail: request.auth.token.email || '',
        details: { newStatus: status, delayMinutes, cancellationReason },
        timestamp: firestore_1.FieldValue.serverTimestamp(),
    });
    return { success: true, message: `Flight ${flightId} status updated to '${status}'` };
});
/**
 * Assign/change a gate for a flight.
 */
exports.assignGate = (0, https_1.onCall)(async (request) => {
    const callerRole = request.auth?.token?.role;
    if (!callerRole || !['super_admin', 'ops_manager'].includes(callerRole)) {
        throw new https_1.HttpsError('permission-denied', 'Only ops managers can assign gates.');
    }
    const { flightId, gate, terminal } = request.data;
    await db.doc(`flights/${flightId}`).update({
        gate,
        terminal: terminal || null,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    await db.collection('audit_logs').add({
        action: 'ASSIGN_GATE',
        entityType: 'flight',
        entityId: flightId,
        userId: request.auth.uid,
        userEmail: request.auth.token.email || '',
        details: { gate, terminal },
        timestamp: firestore_1.FieldValue.serverTimestamp(),
    });
    return { success: true, message: `Gate ${gate} assigned to flight ${flightId}` };
});
/**
 * Aircraft swap — reassign a different aircraft to a flight.
 */
exports.swapAircraft = (0, https_1.onCall)(async (request) => {
    const callerRole = request.auth?.token?.role;
    if (!callerRole || !['super_admin', 'ops_manager'].includes(callerRole)) {
        throw new https_1.HttpsError('permission-denied', 'Only ops managers can swap aircraft.');
    }
    const { flightId, newAircraftId } = request.data;
    const aircraftDoc = await db.doc(`aircraft/${newAircraftId}`).get();
    if (!aircraftDoc.exists) {
        throw new https_1.HttpsError('not-found', `Aircraft ${newAircraftId} not found.`);
    }
    const aircraft = aircraftDoc.data();
    await db.doc(`flights/${flightId}`).update({
        aircraft: {
            id: newAircraftId,
            type: aircraft.type,
            registration: aircraft.registration,
        },
        seatsAvailable: aircraft.seatConfig,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    await db.collection('audit_logs').add({
        action: 'SWAP_AIRCRAFT',
        entityType: 'flight',
        entityId: flightId,
        userId: request.auth.uid,
        userEmail: request.auth.token.email || '',
        details: { newAircraftId, type: aircraft.type },
        timestamp: firestore_1.FieldValue.serverTimestamp(),
    });
    return { success: true, message: `Aircraft swapped to ${aircraft.registration}` };
});
//# sourceMappingURL=flights.js.map