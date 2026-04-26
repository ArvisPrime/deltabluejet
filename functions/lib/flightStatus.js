"use strict";
/**
 * Flight Status Auto-Transitions — Scheduled Cloud Function
 *
 * Runs every minute to automatically transition flight statuses through
 * a 10-phase lifecycle modeled after OOOI (Out-Off-On-In) flight tracking:
 *
 *   scheduled → boarding        (45 min before departure)
 *   boarding  → doors_closed    (10 min before departure)
 *   doors_closed → taxi_out     (5 min before departure / at departure time)
 *   taxi_out  → airborne        (departure + estimated taxi time ~10 min)
 *   airborne  → cruise          (airborne + 15 min climb)
 *   cruise    → descent         (30 min before ETA)
 *   descent   → landed          (at ETA)
 *   landed    → taxi_in         (ETA + 5 min)
 *   taxi_in   → arrived         (ETA + 10 min)
 *
 *   Flags "delayed" if departure time passed and still scheduled/boarding
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkFlightStatus = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
// ─── Configuration ────────────────────────────────────────
/** Configurable timing parameters (in minutes) */
const TIMING = {
    boardingBeforeDep: 45, // Start boarding 45 min before departure
    doorsCloseBeforeDep: 10, // Doors close 10 min before departure
    taxiStartBeforeDep: 5, // Taxi starts 5 min before departure
    taxiDuration: 10, // Average taxi time
    climbDuration: 15, // Time to reach cruise altitude
    descentBeforeArr: 30, // Begin descent 30 min before ETA
    taxiInAfterLand: 5, // Taxi to gate after landing
    arriveAfterLand: 10, // Gate arrival after landing
};
// Statuses that are "complete" and should never be auto-transitioned
const TERMINAL_STATUSES = ['arrived', 'cancelled', 'diverted'];
/**
 * Calculate estimated flight duration in milliseconds from route data.
 * Falls back to scheduled arrivalTime - departureTime if no route data available.
 */
function getFlightDurationMs(flight) {
    const depMs = flight.departureTime?.toMillis?.() || 0;
    const arrMs = flight.arrivalTime?.toMillis?.() || 0;
    if (arrMs > depMs)
        return arrMs - depMs;
    // Fallback: 2 hours default
    return 2 * 60 * 60 * 1000;
}
/**
 * Runs every minute. Checks today's flights and auto-transitions statuses
 * through the full OOOI-style lifecycle.
 */
exports.checkFlightStatus = (0, scheduler_1.onSchedule)({ schedule: 'every 1 minutes', timeoutSeconds: 120, memory: '256MiB' }, async () => {
    const now = firestore_1.Timestamp.now();
    const nowMs = now.toMillis();
    // Query flights departing today +/- 6 hours for arrived/in-progress flights
    const startWindow = new Date();
    startWindow.setHours(startWindow.getHours() - 6);
    const endWindow = new Date();
    endWindow.setHours(endWindow.getHours() + 18);
    const snap = await db.collection('flights')
        .where('departureTime', '>=', firestore_1.Timestamp.fromDate(startWindow))
        .where('departureTime', '<=', firestore_1.Timestamp.fromDate(endWindow))
        .get();
    if (snap.empty)
        return;
    const batch = db.batch();
    let batchCount = 0;
    const eventEntries = [];
    const logEvent = (docId, flightNumber, from, to, trigger, metadata) => {
        eventEntries.push({
            flightId: docId,
            flightNumber,
            fromStatus: from,
            toStatus: to,
            source: 'auto',
            triggeredBy: 'system',
            trigger,
            metadata: metadata || {},
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        });
    };
    for (const doc of snap.docs) {
        const flight = doc.data();
        const depMs = flight.departureTime?.toMillis?.() || 0;
        const arrMs = flight.arrivalTime?.toMillis?.() || 0;
        const status = flight.status;
        const flightNumber = flight.flightNumber || doc.id;
        const durationMs = getFlightDurationMs(flight);
        // Skip terminal statuses
        if (TERMINAL_STATUSES.includes(status))
            continue;
        // Calculate key milestones
        const minuteMs = 60 * 1000;
        const boardingStartMs = depMs - TIMING.boardingBeforeDep * minuteMs;
        const doorsCloseMs = depMs - TIMING.doorsCloseBeforeDep * minuteMs;
        const taxiStartMs = depMs - TIMING.taxiStartBeforeDep * minuteMs;
        const airborneMs = depMs + TIMING.taxiDuration * minuteMs;
        const cruiseMs = airborneMs + TIMING.climbDuration * minuteMs;
        const descentMs = arrMs - TIMING.descentBeforeArr * minuteMs;
        const landedMs = arrMs;
        const taxiInMs = arrMs + TIMING.taxiInAfterLand * minuteMs;
        const arrivedMs = arrMs + TIMING.arriveAfterLand * minuteMs;
        let newStatus = null;
        let trigger = '';
        // ───── Forward Transitions (highest phase first to prevent double-jumps) ─────
        // taxi_in → arrived
        if (status === 'taxi_in' && nowMs >= arrivedMs) {
            newStatus = 'arrived';
            trigger = 'gate_arrival_time_reached';
        }
        // landed → taxi_in
        else if (status === 'landed' && nowMs >= taxiInMs) {
            newStatus = 'taxi_in';
            trigger = 'taxi_in_time_reached';
        }
        // descent → landed
        else if (status === 'descent' && nowMs >= landedMs) {
            newStatus = 'landed';
            trigger = 'estimated_touchdown';
        }
        // cruise → descent
        else if (status === 'cruise' && nowMs >= descentMs) {
            newStatus = 'descent';
            trigger = 'descent_phase_started';
        }
        // airborne/in_air → cruise
        else if ((status === 'airborne' || status === 'in_air') && nowMs >= cruiseMs) {
            newStatus = 'cruise';
            trigger = 'cruising_altitude_reached';
        }
        // departed/taxi_out → airborne
        else if ((status === 'taxi_out' || status === 'departed') && nowMs >= airborneMs) {
            newStatus = 'airborne';
            trigger = 'estimated_takeoff';
        }
        // doors_closed → taxi_out
        else if (status === 'doors_closed' && nowMs >= taxiStartMs) {
            newStatus = 'taxi_out';
            trigger = 'taxi_pushback_started';
        }
        // boarding → doors_closed
        else if (status === 'boarding' && nowMs >= doorsCloseMs) {
            newStatus = 'doors_closed';
            trigger = 'doors_close_time_reached';
        }
        // scheduled → boarding
        else if (status === 'scheduled' && nowMs >= boardingStartMs && nowMs < depMs) {
            newStatus = 'boarding';
            trigger = 'boarding_window_reached';
        }
        // ───── Delay Detection ─────
        // If flight is still in pre-departure phase but past departure + 15 min grace
        if (!newStatus && (status === 'scheduled') && nowMs > depMs + 15 * minuteMs) {
            newStatus = 'delayed';
            trigger = 'departure_time_exceeded';
        }
        // ───── Apply Transition ─────
        if (newStatus && newStatus !== status) {
            const updateData = {
                status: newStatus,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            };
            // Track actual times for key milestones
            if (newStatus === 'taxi_out' || newStatus === 'departed') {
                updateData.actualDepartureTime = firestore_1.FieldValue.serverTimestamp();
            }
            if (newStatus === 'airborne') {
                updateData.actualTakeoffTime = firestore_1.FieldValue.serverTimestamp();
            }
            if (newStatus === 'landed') {
                updateData.actualLandingTime = firestore_1.FieldValue.serverTimestamp();
            }
            if (newStatus === 'arrived') {
                updateData.actualArrivalTime = firestore_1.FieldValue.serverTimestamp();
            }
            if (newStatus === 'delayed') {
                updateData.delayMinutes = Math.floor((nowMs - depMs) / minuteMs);
                updateData.delayReason = flight.delayReason || 'Departure time exceeded — auto-flagged';
            }
            batch.update(doc.ref, updateData);
            batchCount++;
            // Calculate remaining time for metadata
            const remainingMs = arrMs - nowMs;
            const remainingMin = Math.max(0, Math.round(remainingMs / minuteMs));
            logEvent(doc.id, flightNumber, status, newStatus, trigger, {
                depMs,
                arrMs,
                durationMs,
                remainingMinutes: remainingMin,
            });
        }
    }
    // Commit flight status changes
    if (batchCount > 0) {
        await batch.commit();
        console.log(`[checkFlightStatus] Transitioned ${batchCount} flight(s).`);
        // Write flight_events entries
        const eventBatch = db.batch();
        for (const entry of eventEntries) {
            eventBatch.set(db.collection('flight_events').doc(), entry);
        }
        await eventBatch.commit();
        // Also write audit_logs for backward compatibility
        const auditBatch = db.batch();
        for (const entry of eventEntries) {
            auditBatch.set(db.collection('audit_logs').doc(), {
                action: 'AUTO_STATUS_TRANSITION',
                entityType: 'flight',
                entityId: entry.flightId,
                userId: 'system',
                userEmail: 'auto-scheduler@deltablue.system',
                details: {
                    from: entry.fromStatus,
                    to: entry.toStatus,
                    trigger: entry.trigger,
                },
                timestamp: firestore_1.FieldValue.serverTimestamp(),
            });
        }
        await auditBatch.commit();
    }
});
//# sourceMappingURL=flightStatus.js.map