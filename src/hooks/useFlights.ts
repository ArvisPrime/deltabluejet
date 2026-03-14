/**
 * useFlights — Real-time flight data hook.
 *
 * Subscribes to Firestore onSnapshot and pushes updates
 * into the flightsStore. Components re-render automatically when
 * any flight document changes in Firestore.
 */

import { useEffect, useCallback, useMemo } from 'react';
import { useFlightsStore } from '../stores/flightsStore';
import { subscribeToFlights, getFlightById as fetchFlightById, searchFlights } from '../services/firestore';
import type { FlightDoc } from '../types/firestore';

interface UseFlightsOptions {
    /** Maximum number of flights to subscribe to (default: 100) */
    maxResults?: number;
    /** Auto-subscribe to real-time updates (default: true) */
    realtime?: boolean;
}

export function useFlights(options: UseFlightsOptions = {}) {
    const { maxResults = 100, realtime = true } = options;
    const { flights, isLoading, error, lastUpdated, getFlightById, getFlightsByStatus, getFlightsByRoute } =
        useFlightsStore();

    // Subscribe to real-time updates
    useEffect(() => {
        if (!realtime) return;

        useFlightsStore.getState().setLoading(true);

        const unsubscribe = subscribeToFlights(
            (updatedFlights: FlightDoc[]) => {
                useFlightsStore.getState().setFlights(updatedFlights);
            },
            { maxResults },
        );

        return () => {
            unsubscribe();
        };
    }, [maxResults, realtime]);

    // One-off fetch for a single flight
    const fetchFlight = useCallback(async (flightId: string) => {
        return fetchFlightById(flightId);
    }, []);

    // Search flights by route and date
    const search = useCallback(
        async (origin: string, destination: string, date: Date) => {
            return searchFlights(origin, destination, date);
        },
        [],
    );

    // Derived stats
    const stats = useMemo(() => {
        const total = flights.length;
        const scheduled = flights.filter((f) => f.status === 'scheduled').length;
        const boarding = flights.filter((f) => f.status === 'boarding').length;
        const inAir = flights.filter((f) => f.status === 'in_air' || f.status === 'departed').length;
        const delayed = flights.filter((f) => f.status === 'delayed').length;
        const cancelled = flights.filter((f) => f.status === 'cancelled').length;
        const landed = flights.filter((f) => f.status === 'landed' || f.status === 'arrived').length;
        const onTimeRate = total > 0 ? Math.round(((total - delayed - cancelled) / total) * 100) : 100;

        return { total, scheduled, boarding, inAir, delayed, cancelled, landed, onTimeRate };
    }, [flights]);

    return {
        flights,
        isLoading,
        error,
        lastUpdated,
        stats,
        getFlightById,
        getFlightsByStatus,
        getFlightsByRoute,
        fetchFlight,
        search,
    };
}
