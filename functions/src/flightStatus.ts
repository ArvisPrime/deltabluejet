/**
 * Flight Status Auto-Transitions — Scheduled Cloud Function
 *
 * Runs every minute to automatically transition flight statuses:
 *   scheduled → boarding   (45 min before departure)
 *   boarding  → departed   (at departure time, if not delayed)
 *   Flags "delayed" if departure time passed and still scheduled/boarding
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) initializeApp();
const db = getFirestore();

/**
 * Runs every minute. Checks today's flights and auto-transitions statuses.
 */
export const checkFlightStatus = onSchedule(
  { schedule: 'every 1 minutes', timeoutSeconds: 60, memory: '256MiB' },
  async () => {
    const now = Timestamp.now();
    const nowMs = now.toMillis();

    // Query flights departing today that still need transitions
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const snap = await db.collection('flights')
      .where('departureTime', '>=', Timestamp.fromDate(startOfDay))
      .where('departureTime', '<=', Timestamp.fromDate(endOfDay))
      .get();

    if (snap.empty) return;

    const batch = db.batch();
    let batchCount = 0;
    const auditEntries: Array<Record<string, unknown>> = [];

    for (const doc of snap.docs) {
      const flight = doc.data();
      const depMs = flight.departureTime?.toMillis?.() || 0;
      const status = flight.status as string;

      // Skip already-completed or cancelled flights
      if (['in_air', 'landed', 'arrived', 'cancelled', 'diverted'].includes(status)) {
        continue;
      }

      const boardingWindowMs = 45 * 60 * 1000; // 45 min before departure
      const boardingStartMs = depMs - boardingWindowMs;

      // Transition 1: scheduled → boarding (45 min before departure)
      if (status === 'scheduled' && nowMs >= boardingStartMs && nowMs < depMs) {
        batch.update(doc.ref, {
          status: 'boarding',
          updatedAt: FieldValue.serverTimestamp(),
        });
        batchCount++;
        auditEntries.push({
          action: 'AUTO_STATUS_TRANSITION',
          entityType: 'flight',
          entityId: doc.id,
          userId: 'system',
          userEmail: 'auto-scheduler@deltablue.system',
          details: { from: 'scheduled', to: 'boarding', trigger: 'boarding_window_reached' },
          timestamp: FieldValue.serverTimestamp(),
        });
      }

      // Transition 2: boarding → departed (at departure time)
      if (status === 'boarding' && nowMs >= depMs) {
        batch.update(doc.ref, {
          status: 'departed',
          actualDepartureTime: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        batchCount++;
        auditEntries.push({
          action: 'AUTO_STATUS_TRANSITION',
          entityType: 'flight',
          entityId: doc.id,
          userId: 'system',
          userEmail: 'auto-scheduler@deltablue.system',
          details: { from: 'boarding', to: 'departed', trigger: 'departure_time_reached' },
          timestamp: FieldValue.serverTimestamp(),
        });
      }

      // Flag 3: scheduled past departure = delayed
      if (status === 'scheduled' && nowMs > depMs) {
        batch.update(doc.ref, {
          status: 'delayed',
          delayMinutes: Math.floor((nowMs - depMs) / 60_000),
          delayReason: flight.delayReason || 'Departure time exceeded — auto-flagged',
          updatedAt: FieldValue.serverTimestamp(),
        });
        batchCount++;
        auditEntries.push({
          action: 'AUTO_DELAY_FLAG',
          entityType: 'flight',
          entityId: doc.id,
          userId: 'system',
          userEmail: 'auto-scheduler@deltablue.system',
          details: { from: 'scheduled', to: 'delayed', minutesPastDeparture: Math.floor((nowMs - depMs) / 60_000) },
          timestamp: FieldValue.serverTimestamp(),
        });
      }
    }

    // Commit flight status changes
    if (batchCount > 0) {
      await batch.commit();
      console.log(`[checkFlightStatus] Transitioned ${batchCount} flight(s).`);

      // Write audit entries
      const auditBatch = db.batch();
      for (const entry of auditEntries) {
        auditBatch.set(db.collection('audit_logs').doc(), entry);
      }
      await auditBatch.commit();
    }
  },
);
