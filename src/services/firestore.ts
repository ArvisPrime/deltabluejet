import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    Timestamp,
    serverTimestamp,
    type QueryConstraint,
    type DocumentData,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase.config';
import type {
    FlightDoc,
    AircraftDoc,
    RouteDoc,
    ScheduleDoc,
    BookingDoc,
    DestinationDoc,
    SeatMapDoc,
    AuditLogDoc,
} from '../types/firestore';

// ─── Flights ───────────────────────────────────────────────

const flightsRef = collection(db, 'flights');

/**
 * Get all flights for today and upcoming days, ordered by departure.
 */
export async function getFlights(options?: {
    status?: string;
    origin?: string;
    destination?: string;
    maxResults?: number;
}): Promise<FlightDoc[]> {
    const constraints: QueryConstraint[] = [
        orderBy('departureTime', 'asc'),
    ];

    if (options?.status) {
        constraints.unshift(where('status', '==', options.status));
    }
    if (options?.origin) {
        constraints.unshift(where('origin.code', '==', options.origin));
    }
    if (options?.destination) {
        constraints.unshift(where('destination.code', '==', options.destination));
    }
    if (options?.maxResults) {
        constraints.push(limit(options.maxResults));
    }

    const snap = await getDocs(query(flightsRef, ...constraints));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FlightDoc);
}

/**
 * Subscribe to real-time flight updates.
 */
export function subscribeToFlights(
    callback: (flights: FlightDoc[]) => void,
    options?: { maxResults?: number },
): () => void {
    const constraints: QueryConstraint[] = [
        orderBy('departureTime', 'asc'),
    ];
    if (options?.maxResults) constraints.push(limit(options.maxResults));

    return onSnapshot(query(flightsRef, ...constraints), (snap) => {
        const flights = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FlightDoc);
        callback(flights);
    });
}

/**
 * Get a single flight by ID.
 */
export async function getFlightById(flightId: string): Promise<FlightDoc | null> {
    const snap = await getDoc(doc(db, 'flights', flightId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as FlightDoc) : null;
}

/**
 * Search flights by route and date range.
 */
export async function searchFlights(
    originCode: string,
    destinationCode: string,
    departureDate: Date,
): Promise<FlightDoc[]> {
    const dayStart = new Date(departureDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(departureDate);
    dayEnd.setHours(23, 59, 59, 999);

    const snap = await getDocs(query(
        flightsRef,
        where('origin.code', '==', originCode),
        where('destination.code', '==', destinationCode),
        where('departureTime', '>=', Timestamp.fromDate(dayStart)),
        where('departureTime', '<=', Timestamp.fromDate(dayEnd)),
        orderBy('departureTime', 'asc'),
    ));

    // Client-side filter: only return bookable flights (avoids composite index)
    return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as FlightDoc)
        .filter((f) => f.status === 'scheduled' || f.status === 'boarding');
}

/**
 * Get all scheduled/boarding flights (bookable), ordered by departure.
 * Uses simple orderBy query + client-side status filter to avoid composite index.
 */
export async function getAllScheduledFlights(): Promise<FlightDoc[]> {
    const snap = await getDocs(query(
        flightsRef,
        orderBy('departureTime', 'asc'),
    ));
    return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as FlightDoc)
        .filter((f) => f.status === 'scheduled' || f.status === 'boarding');
}

// ─── Aircraft ──────────────────────────────────────────────

const aircraftRef = collection(db, 'aircraft');

export async function getAircraft(): Promise<AircraftDoc[]> {
    const snap = await getDocs(query(aircraftRef, orderBy('registration')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AircraftDoc);
}

export async function getAircraftById(aircraftId: string): Promise<AircraftDoc | null> {
    const snap = await getDoc(doc(db, 'aircraft', aircraftId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as AircraftDoc) : null;
}

/**
 * Get aircraft filtered by status.
 */
export async function getAircraftByStatus(status: AircraftDoc['status']): Promise<AircraftDoc[]> {
    const snap = await getDocs(query(aircraftRef, where('status', '==', status), orderBy('registration')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AircraftDoc);
}

/**
 * Subscribe to real-time aircraft updates.
 */
export function subscribeToAircraft(callback: (aircraft: AircraftDoc[]) => void): () => void {
    return onSnapshot(query(aircraftRef, orderBy('registration')), (snap) => {
        const aircraft = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AircraftDoc);
        callback(aircraft);
    });
}

/**
 * Create a new aircraft document.
 */
export async function createAircraft(data: Omit<AircraftDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(aircraftRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

/**
 * Update an existing aircraft document (partial update).
 */
export async function updateAircraft(aircraftId: string, data: Partial<Omit<AircraftDoc, 'id' | 'createdAt'>>): Promise<void> {
    await updateDoc(doc(db, 'aircraft', aircraftId), {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Soft-delete an aircraft (set status to 'retired').
 */
export async function deleteAircraft(aircraftId: string): Promise<void> {
    await updateDoc(doc(db, 'aircraft', aircraftId), {
        status: 'retired',
        updatedAt: serverTimestamp(),
    });
}

// ─── Routes ────────────────────────────────────────────────

const routesRef = collection(db, 'routes');

export async function getRoutes(): Promise<RouteDoc[]> {
    const snap = await getDocs(query(routesRef, where('isActive', '==', true)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RouteDoc);
}

/**
 * Get ALL routes (active + inactive).
 */
export async function getAllRoutes(): Promise<RouteDoc[]> {
    const snap = await getDocs(query(routesRef, orderBy('origin.code')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RouteDoc);
}

/**
 * Subscribe to real-time route updates.
 */
export function subscribeToRoutes(callback: (routes: RouteDoc[]) => void): () => void {
    return onSnapshot(query(routesRef, orderBy('origin.code')), (snap) => {
        const routes = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RouteDoc);
        callback(routes);
    });
}

/**
 * Create a new route document.
 */
export async function createRoute(data: Omit<RouteDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(routesRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

/**
 * Update an existing route document (partial update).
 */
export async function updateRoute(routeId: string, data: Partial<Omit<RouteDoc, 'id' | 'createdAt'>>): Promise<void> {
    await updateDoc(doc(db, 'routes', routeId), {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Soft-delete a route (set isActive to false).
 */
export async function deleteRoute(routeId: string): Promise<void> {
    await updateDoc(doc(db, 'routes', routeId), {
        isActive: false,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Get routes that an aircraft can serve based on range.
 */
export async function getRoutesForAircraft(rangeKm: number): Promise<RouteDoc[]> {
    const snap = await getDocs(query(routesRef, where('isActive', '==', true)));
    return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as RouteDoc)
        .filter((r) => r.distance_km <= rangeKm);
}

// ─── Bookings ──────────────────────────────────────────────

const bookingsRef = collection(db, 'bookings');

export async function getBookingsByUser(userId: string): Promise<BookingDoc[]> {
    const snap = await getDocs(query(
        bookingsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
    ));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BookingDoc);
}

export async function getBookingByPNR(pnr: string): Promise<BookingDoc | null> {
    const snap = await getDocs(query(bookingsRef, where('pnr', '==', pnr), limit(1)));
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as BookingDoc;
}

export async function getBookingById(bookingId: string): Promise<BookingDoc | null> {
    const snap = await getDoc(doc(db, 'bookings', bookingId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as BookingDoc) : null;
}

export async function getAllBookings(maxResults = 50): Promise<BookingDoc[]> {
    const snap = await getDocs(query(bookingsRef, orderBy('createdAt', 'desc'), limit(maxResults)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BookingDoc);
}

// ─── Destinations ──────────────────────────────────────────

const destinationsRef = collection(db, 'destinations');

export async function getDestinations(): Promise<DestinationDoc[]> {
    const snap = await getDocs(destinationsRef);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DestinationDoc);
}

export async function getPromotedDestinations(): Promise<DestinationDoc[]> {
    const snap = await getDocs(query(destinationsRef, where('isPromoted', '==', true)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DestinationDoc);
}

export async function getDestinationById(destId: string): Promise<DestinationDoc | null> {
    const snap = await getDoc(doc(db, 'destinations', destId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as DestinationDoc) : null;
}

// ─── Seat Maps ─────────────────────────────────────────────

export async function getSeatMap(aircraftType: string): Promise<SeatMapDoc | null> {
    const snap = await getDocs(query(
        collection(db, 'seatMaps'),
        where('aircraftType', '==', aircraftType),
        limit(1),
    ));
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as SeatMapDoc;
}

// ─── Schedules ─────────────────────────────────────────────

const schedulesRef = collection(db, 'schedules');

/**
 * Subscribe to real-time schedule updates.
 */
export function subscribeToSchedules(callback: (schedules: ScheduleDoc[]) => void): () => void {
    return onSnapshot(query(schedulesRef, orderBy('createdAt', 'desc')), (snap) => {
        const schedules = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ScheduleDoc);
        callback(schedules);
    });
}

/**
 * Create a new schedule document.
 */
export async function createSchedule(data: Omit<ScheduleDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(schedulesRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

/**
 * Update a schedule document.
 */
export async function updateSchedule(scheduleId: string, data: Partial<Omit<ScheduleDoc, 'id' | 'createdAt'>>): Promise<void> {
    await updateDoc(doc(db, 'schedules', scheduleId), {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Get schedules for a specific route.
 */
export async function getSchedulesForRoute(routeId: string): Promise<ScheduleDoc[]> {
    const snap = await getDocs(query(schedulesRef, where('routeId', '==', routeId)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ScheduleDoc);
}

/**
 * Get schedules for a specific aircraft.
 */
export async function getSchedulesForAircraft(aircraftId: string): Promise<ScheduleDoc[]> {
    const snap = await getDocs(query(schedulesRef, where('aircraftId', '==', aircraftId)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ScheduleDoc);
}

/**
 * Check if an aircraft has a conflicting schedule (overlapping date range).
 * Returns the conflicting schedule or null.
 */
export async function checkAircraftConflict(
    aircraftId: string,
    effectiveFrom: Date,
    effectiveTo: Date,
    excludeScheduleId?: string,
): Promise<ScheduleDoc | null> {
    const schedules = await getSchedulesForAircraft(aircraftId);
    const active = schedules.filter((s) => s.status === 'draft' || s.status === 'published');
    for (const s of active) {
        if (excludeScheduleId && s.id === excludeScheduleId) continue;
        const sFrom = s.effectiveFrom.toDate();
        const sTo = s.effectiveTo.toDate();
        // Overlap: A starts before B ends AND A ends after B starts
        if (effectiveFrom < sTo && effectiveTo > sFrom) {
            return s;
        }
    }
    return null;
}

// ─── Flight Lifecycle ──────────────────────────────────────

/**
 * Update flight status with audit trail.
 */
export async function changeFlightStatus(
    flightId: string,
    newStatus: FlightDoc['status'],
    userId: string,
    reason?: string,
): Promise<void> {
    await updateDoc(doc(db, 'flights', flightId), {
        status: newStatus,
        ...(newStatus === 'cancelled' ? { cancellationReason: reason || 'Withdrawn by ops' } : {}),
        updatedAt: serverTimestamp(),
    });
    await logAuditEntry({
        action: newStatus === 'cancelled' ? 'flight_withdrawn' : 'flight_status_changed',
        targetCollection: 'flights',
        targetId: flightId,
        performedBy: userId,
        details: { newStatus, reason },
    });
}

/**
 * Withdraw (cancel) a published flight.
 */
export async function withdrawFlight(flightId: string, userId: string, reason: string): Promise<void> {
    await changeFlightStatus(flightId, 'cancelled', userId, reason);
}

// ─── Audit Logs ────────────────────────────────────────────

export async function getAuditLogs(maxResults = 100): Promise<AuditLogDoc[]> {
    const snap = await getDocs(query(
        collection(db, 'audit_logs'),
        orderBy('timestamp', 'desc'),
        limit(maxResults),
    ));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLogDoc);
}

/**
 * Write an audit log entry for any mutation.
 */
export async function logAuditEntry(entry: {
    action: string;
    targetCollection: string;
    targetId: string;
    performedBy: string;
    details?: Record<string, unknown>;
}): Promise<void> {
    await addDoc(collection(db, 'audit_logs'), {
        ...entry,
        timestamp: serverTimestamp(),
    });
}

// ─── Cloud Functions Callables ─────────────────────────────

export const setUserRole = httpsCallable(functions, 'setUserRole');
export const updateFlightStatus = httpsCallable(functions, 'updateFlightStatus');
export const assignGate = httpsCallable(functions, 'assignGate');
export const swapAircraft = httpsCallable(functions, 'swapAircraft');
export const getDashboardStats = httpsCallable(functions, 'getDashboardStats');
