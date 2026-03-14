/**
 * Flight Generation Engine
 *
 * Takes a schedule configuration + route + aircraft and generates
 * an array of FlightDoc objects ready for batch-writing to Firestore.
 */

import {
    collection,
    writeBatch,
    doc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import type { FlightDoc, RouteDoc, AircraftDoc, ScheduleDoc } from '../types/firestore';
import { logAuditEntry, updateSchedule } from './firestore';

export interface GeneratedFlight {
    flightNumber: string;
    routeId: string;
    origin: RouteDoc['origin'];
    destination: RouteDoc['destination'];
    aircraft: { id: string; type: string; registration: string };
    departureTime: Date;
    arrivalTime: Date;
    seatsAvailable: Record<string, number>;
    seatsTaken: Record<string, number>;
    baseFare: Record<string, number>;
    daysOfWeek: number[];
    status: 'scheduled';
}

/**
 * Generate flight objects for every date in the schedule range
 * that matches the configured days of week.
 */
export function generateFlights(
    schedule: {
        flightNumberPrefix: string;
        daysOfWeek: number[];
        departureTime: string;  // "HH:MM"
        arrivalTime: string;    // "HH:MM"
        effectiveFrom: Date;
        effectiveTo: Date;
    },
    route: RouteDoc,
    aircraft: AircraftDoc,
): GeneratedFlight[] {
    const flights: GeneratedFlight[] = [];
    const current = new Date(schedule.effectiveFrom);
    current.setHours(0, 0, 0, 0);
    const end = new Date(schedule.effectiveTo);
    end.setHours(23, 59, 59, 999);

    const [depH, depM] = schedule.departureTime.split(':').map(Number);
    const [arrH, arrM] = schedule.arrivalTime.split(':').map(Number);

    let sequenceNum = 1;

    while (current <= end) {
        // JS getDay(): 0=Sun, 1=Mon...6=Sat → our format: 1=Mon...7=Sun
        const jsDay = current.getDay();
        const isoDay = jsDay === 0 ? 7 : jsDay;

        if (schedule.daysOfWeek.includes(isoDay)) {
            const depDate = new Date(current);
            depDate.setHours(depH, depM, 0, 0);

            const arrDate = new Date(current);
            arrDate.setHours(arrH, arrM, 0, 0);
            // Handle overnight flights
            if (arrDate <= depDate) {
                arrDate.setDate(arrDate.getDate() + 1);
            }

            const flightNumber = `${schedule.flightNumberPrefix}${String(sequenceNum).padStart(2, '0')}`;
            sequenceNum++;

            // Copy seat inventory from aircraft
            const seatsAvailable: Record<string, number> = {};
            const seatsTaken: Record<string, number> = {};
            for (const [cls, count] of Object.entries(aircraft.seatConfig)) {
                seatsAvailable[cls] = count;
                seatsTaken[cls] = 0;
            }

            flights.push({
                flightNumber,
                routeId: route.id,
                origin: route.origin,
                destination: route.destination,
                aircraft: {
                    id: aircraft.id,
                    type: aircraft.type,
                    registration: aircraft.registration,
                },
                departureTime: depDate,
                arrivalTime: arrDate,
                seatsAvailable,
                seatsTaken,
                baseFare: { ...route.baseFares },
                daysOfWeek: schedule.daysOfWeek,
                status: 'scheduled',
            });
        }

        current.setDate(current.getDate() + 1);
    }

    return flights;
}

/**
 * Batch-write generated flights to Firestore.
 * Writes in batches of 500 (Firestore limit).
 */
export async function publishFlights(
    flights: GeneratedFlight[],
    scheduleId: string,
    userId: string,
): Promise<number> {
    const BATCH_SIZE = 500;
    let written = 0;

    for (let i = 0; i < flights.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = flights.slice(i, i + BATCH_SIZE);

        for (const flight of chunk) {
            const docRef = doc(collection(db, 'flights'));
            batch.set(docRef, {
                ...flight,
                departureTime: Timestamp.fromDate(flight.departureTime),
                arrivalTime: Timestamp.fromDate(flight.arrivalTime),
                airline: 'Deltablue Jet Air',
                gate: null,
                terminal: null,
                delayMinutes: 0,
                cancellationReason: null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        }

        await batch.commit();
        written += chunk.length;
    }

    // Update the schedule with published count + status
    await updateSchedule(scheduleId, {
        status: 'published',
        publishedFlightCount: written,
    });

    // Audit log (best-effort — don't crash publish if logging fails)
    try {
        await logAuditEntry({
            action: 'flights_published',
            targetCollection: 'schedules',
            targetId: scheduleId,
            performedBy: userId,
            details: { flightCount: written },
        });
    } catch (auditErr) {
        console.warn('Audit log write failed (non-critical):', auditErr);
    }

    return written;
}
