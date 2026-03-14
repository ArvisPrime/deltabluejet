/**
 * Flights Store — Zustand store for real-time flight data.
 * Subscribers get automatic updates when Firestore documents change.
 */

import { create } from 'zustand';
import type { FlightDoc } from '../types/firestore';

interface FlightsState {
    flights: FlightDoc[];
    isLoading: boolean;
    error: string | null;
    lastUpdated: number | null;

    // Actions
    setFlights: (flights: FlightDoc[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // Selectors (computed helpers)
    getFlightById: (id: string) => FlightDoc | undefined;
    getFlightsByStatus: (status: string) => FlightDoc[];
    getFlightsByRoute: (origin: string, destination: string) => FlightDoc[];
}

export const useFlightsStore = create<FlightsState>((set, get) => ({
    flights: [],
    isLoading: true,
    error: null,
    lastUpdated: null,

    setFlights: (flights) =>
        set({ flights, isLoading: false, error: null, lastUpdated: Date.now() }),

    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error) => set({ error, isLoading: false }),

    getFlightById: (id) => get().flights.find((f) => f.id === id),

    getFlightsByStatus: (status) =>
        get().flights.filter((f) => f.status === status),

    getFlightsByRoute: (origin, destination) =>
        get().flights.filter(
            (f) => f.origin.code === origin && f.destination.code === destination,
        ),
}));
