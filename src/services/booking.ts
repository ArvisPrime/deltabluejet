/**
 * Booking Service — end-to-end booking flow with Firestore.
 *
 * Handles: create booking, modify, cancel, retrieve by PNR,
 * seat assignment, and payment intent creation.
 */

import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    serverTimestamp,
    writeBatch,
    increment,
    Timestamp,
    type QueryDocumentSnapshot,
    type DocumentData,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase.config';
import type { BookingDoc, PassengerDoc, FlightDoc } from '../types/firestore';
import type { PassengerInfo } from '../stores/bookingStore';
import { awardPoints, deductPoints } from './loyaltyService';

// ─── PNR Generation ────────────────────────────────────────

const PNR_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generatePNR(): string {
    return Array.from({ length: 6 }, () =>
        PNR_CHARS[Math.floor(Math.random() * PNR_CHARS.length)],
    ).join('');
}

// ─── Create Booking ────────────────────────────────────────

export interface CreateBookingInput {
    flightId: string;
    flightNumber: string;
    userId: string;
    origin: { code: string; name: string; city: string; country: string; timezone: string };
    destination: { code: string; name: string; city: string; country: string; timezone: string };
    departureTime: Timestamp;
    arrivalTime: Timestamp;
    fareClass: string;
    totalAmount: number;
    currency: string;
    passengers: PassengerInfo[];
    contactEmail: string;
    contactPhone: string;
    selectedSeats: Record<string, string>;
}

export async function createBooking(input: CreateBookingInput): Promise<{
    bookingId: string;
    pnr: string;
}> {
    const pnr = generatePNR();
    const batch = writeBatch(db);

    // 1. Create the booking document
    const bookingRef = doc(collection(db, 'bookings'));
    const bookingData: Omit<BookingDoc, 'id'> = {
        pnr,
        userId: input.userId,
        flightId: input.flightId,
        flightNumber: input.flightNumber,
        status: 'pending',
        origin: input.origin,
        destination: input.destination,
        departureTime: input.departureTime,
        arrivalTime: input.arrivalTime,
        fareClass: input.fareClass,
        totalAmount: input.totalAmount,
        currency: input.currency,
        passengerCount: input.passengers.length,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        paymentIntentId: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };
    batch.set(bookingRef, bookingData);

    // 2. Create passenger sub-documents
    for (let i = 0; i < input.passengers.length; i++) {
        const pax = input.passengers[i];
        const paxRef = doc(collection(db, 'bookings', bookingRef.id, 'passengers'));
        const paxData: Omit<PassengerDoc, 'id'> = {
            firstName: pax.firstName,
            lastName: pax.lastName,
            dateOfBirth: pax.dateOfBirth,
            nationality: pax.nationality,
            documentType: (pax.documentType as 'passport' | 'national_id') || 'passport',
            documentNumber: pax.documentNumber,
            seatNumber: input.selectedSeats[`pax-${i}`] || null,
            boardingPassUrl: null,
            checkedIn: false,
            specialRequests: [],
        };
        batch.set(paxRef, paxData);
    }

    // 3. Update seat counts on the flight
    const seatUpdates: Record<string, any> = {};
    seatUpdates[`seatsTaken.${input.fareClass}`] = increment(input.passengers.length);
    seatUpdates[`seatsAvailable.${input.fareClass}`] = increment(-input.passengers.length);
    seatUpdates['updatedAt'] = serverTimestamp();
    batch.update(doc(db, 'flights', input.flightId), seatUpdates);

    await batch.commit();

    return { bookingId: bookingRef.id, pnr };
}

// ─── Confirm Booking (after payment) ──────────────────────

export async function confirmBooking(
    bookingId: string,
    paymentIntentId: string,
): Promise<void> {
    const bookingSnap = await getDoc(doc(db, 'bookings', bookingId));
    if (!bookingSnap.exists()) throw new Error('Booking not found');

    const booking = bookingSnap.data() as BookingDoc;

    await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'confirmed',
        paymentIntentId,
        updatedAt: serverTimestamp(),
    });

    // Award loyalty points after booking confirmation
    if (booking.userId && booking.totalAmount) {
        try {
            await awardPoints(
                booking.userId,
                booking.totalAmount,
                booking.fareClass || 'economy',
                booking.pnr || bookingId,
                `Flight ${booking.flightNumber || ''} booking confirmed`,
            );
        } catch (err) {
            console.error('Failed to award loyalty points:', err);
        }
    }
}

// ─── Cancel Booking ────────────────────────────────────────

export async function cancelBooking(bookingId: string): Promise<void> {
    const bookingSnap = await getDoc(doc(db, 'bookings', bookingId));
    if (!bookingSnap.exists()) throw new Error('Booking not found');

    const booking = bookingSnap.data() as BookingDoc;

    const batch = writeBatch(db);

    // Cancel the booking
    batch.update(doc(db, 'bookings', bookingId), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
    });

    // Release the seats back to the flight
    const seatUpdates: Record<string, any> = {};
    seatUpdates[`seatsTaken.${booking.fareClass}`] = increment(-booking.passengerCount);
    seatUpdates[`seatsAvailable.${booking.fareClass}`] = increment(booking.passengerCount);
    seatUpdates['updatedAt'] = serverTimestamp();
    batch.update(doc(db, 'flights', booking.flightId), seatUpdates);

    await batch.commit();

    // Deduct loyalty points on cancellation
    if (booking.userId && booking.totalAmount) {
        try {
            await deductPoints(
                booking.userId,
                booking.totalAmount,
                booking.pnr || bookingId,
                `Cancellation of booking ${booking.pnr || bookingId}`,
            );
        } catch (err) {
            console.error('Failed to deduct loyalty points:', err);
        }
    }
}

// ─── Modify Booking ────────────────────────────────────────

export interface ModifyBookingInput {
    bookingId: string;
    newFlightId?: string;
    newFlightNumber?: string;
    newDepartureTime?: Timestamp;
    newArrivalTime?: Timestamp;
    newFareClass?: string;
    newTotalAmount?: number;
    newSeats?: Record<string, string>;
}

export async function modifyBooking(input: ModifyBookingInput): Promise<void> {
    const bookingSnap = await getDoc(doc(db, 'bookings', input.bookingId));
    if (!bookingSnap.exists()) throw new Error('Booking not found');

    const booking = bookingSnap.data() as BookingDoc;
    const batch = writeBatch(db);

    const updates: Record<string, any> = { updatedAt: serverTimestamp() };

    // If changing flights, release old seats and reserve new ones
    if (input.newFlightId && input.newFlightId !== booking.flightId) {
        // Release old flight seats
        const oldFareClass = booking.fareClass;
        batch.update(doc(db, 'flights', booking.flightId), {
            [`seatsTaken.${oldFareClass}`]: increment(-booking.passengerCount),
            [`seatsAvailable.${oldFareClass}`]: increment(booking.passengerCount),
            updatedAt: serverTimestamp(),
        });

        // Reserve new flight seats
        const newFareClass = input.newFareClass || oldFareClass;
        batch.update(doc(db, 'flights', input.newFlightId), {
            [`seatsTaken.${newFareClass}`]: increment(booking.passengerCount),
            [`seatsAvailable.${newFareClass}`]: increment(-booking.passengerCount),
            updatedAt: serverTimestamp(),
        });

        updates.flightId = input.newFlightId;
        if (input.newFlightNumber) updates.flightNumber = input.newFlightNumber;
        if (input.newDepartureTime) updates.departureTime = input.newDepartureTime;
        if (input.newArrivalTime) updates.arrivalTime = input.newArrivalTime;
    }

    if (input.newFareClass) updates.fareClass = input.newFareClass;
    if (input.newTotalAmount) updates.totalAmount = input.newTotalAmount;

    batch.update(doc(db, 'bookings', input.bookingId), updates);
    await batch.commit();
}

// ─── Retrieve Booking ──────────────────────────────────────

export async function getBookingByPNR(pnr: string): Promise<BookingDoc | null> {
    const snap = await getDocs(
        query(collection(db, 'bookings'), where('pnr', '==', pnr.toUpperCase()), limit(1)),
    );
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as BookingDoc;
}

export async function getBookingWithPassengers(bookingId: string): Promise<{
    booking: BookingDoc;
    passengers: PassengerDoc[];
} | null> {
    const bookingSnap = await getDoc(doc(db, 'bookings', bookingId));
    if (!bookingSnap.exists()) return null;

    const paxSnap = await getDocs(collection(db, 'bookings', bookingId, 'passengers'));
    const passengers = paxSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as PassengerDoc);

    return {
        booking: { id: bookingSnap.id, ...bookingSnap.data() } as BookingDoc,
        passengers,
    };
}

export async function getUserBookings(userId: string): Promise<BookingDoc[]> {
    const snap = await getDocs(
        query(
            collection(db, 'bookings'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(50),
        ),
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BookingDoc);
}

// ─── Payment Cloud Function Callables ──────────────────────

export const createPaymentIntent = httpsCallable<
    { bookingId: string; amount: number; currency: string },
    { clientSecret: string; paymentIntentId: string }
>(functions, 'createPaymentIntent');

export const processRefund = httpsCallable<
    { bookingId: string; paymentIntentId: string; amount?: number },
    { refundId: string; status: string }
>(functions, 'processRefund');

export const sendBookingConfirmation = httpsCallable<
    { bookingId: string; email: string },
    { success: boolean }
>(functions, 'sendBookingConfirmation');

// ─── Admin: Paginated Booking List ─────────────────────────

const ADMIN_PAGE_SIZE = 20;

export interface BookingPage {
    bookings: BookingDoc[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    hasMore: boolean;
}

export async function getAllBookings(
    statusFilter?: string,
    cursor?: QueryDocumentSnapshot<DocumentData> | null,
): Promise<BookingPage> {
    const constraints: any[] = [orderBy('createdAt', 'desc'), limit(ADMIN_PAGE_SIZE + 1)];

    if (statusFilter && statusFilter !== 'all') {
        constraints.unshift(where('status', '==', statusFilter));
    }
    if (cursor) {
        constraints.push(startAfter(cursor));
    }

    const q = query(collection(db, 'bookings'), ...constraints);
    const snap = await getDocs(q);
    const docs = snap.docs;
    const hasMore = docs.length > ADMIN_PAGE_SIZE;
    const trimmed = hasMore ? docs.slice(0, ADMIN_PAGE_SIZE) : docs;

    return {
        bookings: trimmed.map(d => ({ id: d.id, ...d.data() }) as BookingDoc),
        lastDoc: trimmed.length > 0 ? trimmed[trimmed.length - 1] : null,
        hasMore,
    };
}

// ─── Admin: Search Bookings ────────────────────────────────

export async function searchBookings(term: string): Promise<BookingDoc[]> {
    const clean = term.trim();
    if (!clean) return [];

    // Try PNR exact match first
    const pnrSnap = await getDocs(
        query(collection(db, 'bookings'), where('pnr', '==', clean.toUpperCase()), limit(10)),
    );
    if (!pnrSnap.empty) {
        return pnrSnap.docs.map(d => ({ id: d.id, ...d.data() }) as BookingDoc);
    }

    // Fallback: search by contact email
    const emailSnap = await getDocs(
        query(collection(db, 'bookings'), where('contactEmail', '==', clean.toLowerCase()), limit(20)),
    );
    return emailSnap.docs.map(d => ({ id: d.id, ...d.data() }) as BookingDoc);
}

// ─── Admin: Export CSV ─────────────────────────────────────

export function exportBookingsCSV(bookings: BookingDoc[]): void {
    const headers = ['PNR', 'Flight', 'Route', 'Date', 'Passengers', 'Amount', 'Currency', 'Status', 'Email'];
    const rows = bookings.map(b => {
        const dep = b.departureTime?.toDate?.() ?? new Date();
        return [
            b.pnr,
            b.flightNumber,
            `${b.origin?.code ?? ''}-${b.destination?.code ?? ''}`,
            dep.toISOString().slice(0, 10),
            String(b.passengerCount),
            b.totalAmount.toFixed(2),
            b.currency,
            b.status,
            b.contactEmail,
        ];
    });

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
