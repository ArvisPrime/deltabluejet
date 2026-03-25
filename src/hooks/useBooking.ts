/**
 * useBooking — Hook for the complete booking flow.
 *
 * Wraps the booking service and bookingStore to provide a single
 * interface for the booking journey: search → select → passengers → seats → pay → confirm.
 */

import { useCallback } from 'react';
import { APP_CONFIG } from '../config/app';
import { useBookingStore } from '../stores/bookingStore';
import { useAuthStore } from '../stores/authStore';
import {
    createBooking,
    confirmBooking,
    cancelBooking,
    modifyBooking,
    getBookingByPNR,
    getBookingWithPassengers,
    getUserBookings,
    createPaymentIntent,
    sendBookingConfirmation,
    type CreateBookingInput,
    type ModifyBookingInput,
} from '../services/booking';
import { searchFlights } from '../services/firestore';
import type { FlightDoc, BookingDoc, PassengerDoc } from '../types/firestore';
import { Timestamp } from 'firebase/firestore';

export function useBooking() {
    const store = useBookingStore();
    const user = useAuthStore((s) => s.user);

    // Step 1: Search flights
    const search = useCallback(
        async (origin: string, destination: string, date: Date): Promise<FlightDoc[]> => {
            const results = await searchFlights(origin, destination, date);
            return results;
        },
        [],
    );

    // Step 2: Complete the booking (after passenger + seat selection)
    const completeBooking = useCallback(async (): Promise<{
        bookingId: string;
        pnr: string;
    }> => {
        if (!store.selectedFlight) throw new Error('No flight selected');
        if (!store.passengers.length) throw new Error('No passengers added');
        if (!user) throw new Error('Must be logged in to book');

        const flight = store.selectedFlight;
        const input: CreateBookingInput = {
            flightId: flight.flightId,
            flightNumber: flight.flightNumber,
            userId: user.uid,
            origin: {
                code: flight.origin,
                name: flight.origin,
                city: flight.origin,
                country: '',
                timezone: '',
            },
            destination: {
                code: flight.destination,
                name: flight.destination,
                city: flight.destination,
                country: '',
                timezone: '',
            },
            departureTime: Timestamp.fromDate(new Date(flight.departureTime)),
            arrivalTime: Timestamp.fromDate(new Date(flight.arrivalTime)),
            fareClass: flight.fareClass,
            totalAmount: flight.price * store.passengers.length,
            currency: APP_CONFIG.defaultCurrency,
            passengers: store.passengers,
            contactEmail: store.passengers[0]?.email || user.email || '',
            contactPhone: store.passengers[0]?.phone || '',
            selectedSeats: store.selectedSeats,
        };

        const result = await createBooking(input);
        store.setPnr(result.pnr);
        return result;
    }, [store, user]);

    // Step 3: Process payment
    const processPayment = useCallback(
        async (bookingId: string, amount: number, currency = APP_CONFIG.defaultCurrency) => {
            const result = await createPaymentIntent({ bookingId, amount, currency });
            return result.data;
        },
        [],
    );

    // Step 4: Send confirmation email
    const sendConfirmation = useCallback(
        async (bookingId: string, email: string) => {
            const result = await sendBookingConfirmation({ bookingId, email });
            return result.data;
        },
        [],
    );

    // Retrieve booking by PNR
    const retrieveByPNR = useCallback(
        async (pnr: string): Promise<BookingDoc | null> => {
            return getBookingByPNR(pnr);
        },
        [],
    );

    // Get booking with passengers
    const getBookingDetails = useCallback(
        async (bookingId: string): Promise<{ booking: BookingDoc; passengers: PassengerDoc[] } | null> => {
            return getBookingWithPassengers(bookingId);
        },
        [],
    );

    // Get user's bookings
    const getMyBookings = useCallback(async (): Promise<BookingDoc[]> => {
        if (!user) return [];
        return getUserBookings(user.uid);
    }, [user]);

    // Cancel a booking
    const cancel = useCallback(async (bookingId: string) => {
        await cancelBooking(bookingId);
    }, []);

    // Modify a booking
    const modify = useCallback(async (input: ModifyBookingInput) => {
        await modifyBooking(input);
    }, []);

    return {
        // Store state
        ...store,

        // Actions
        search,
        completeBooking,
        processPayment,
        sendConfirmation,
        retrieveByPNR,
        getBookingDetails,
        getMyBookings,
        cancel,
        modify,
    };
}
