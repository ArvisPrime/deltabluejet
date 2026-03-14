import { describe, it, expect, beforeEach } from 'vitest';
import { useFlightsStore } from '../../src/stores/flightsStore';
import type { FlightDoc } from '../../src/types/firestore';
import { Timestamp } from 'firebase/firestore';

const now = Timestamp.now();

const mockFlights: FlightDoc[] = [
    {
        id: 'fl-101', flightNumber: 'DB-101', airline: 'Deltablue Jet Air',
        origin: { code: 'BJL', name: 'Banjul Intl', city: 'Banjul', country: 'The Gambia', timezone: 'Africa/Banjul' },
        destination: { code: 'ACC', name: 'Kotoka Intl', city: 'Accra', country: 'Ghana', timezone: 'Africa/Accra' },
        departureTime: now, arrivalTime: now, status: 'scheduled',
        aircraft: { id: 'ac-001', type: 'Boeing 737-800', registration: 'DB-7380' },
        gate: null, terminal: null,
        seatsAvailable: { economy: 162, business: 24, first: 3 },
        seatsTaken: { economy: 0, business: 0, first: 0 },
        baseFare: { economy: 350, business: 1200, first: 3500 },
        routeId: 'bjl-acc', daysOfWeek: [1, 3, 5], delayMinutes: 0,
        cancellationReason: null, createdAt: now, updatedAt: now,
    },
    {
        id: 'fl-102', flightNumber: 'DB-102', airline: 'Deltablue Jet Air',
        origin: { code: 'BJL', name: 'Banjul Intl', city: 'Banjul', country: 'The Gambia', timezone: 'Africa/Banjul' },
        destination: { code: 'LHR', name: 'Heathrow', city: 'London', country: 'UK', timezone: 'Europe/London' },
        departureTime: now, arrivalTime: now, status: 'delayed',
        aircraft: { id: 'ac-003', type: 'Boeing 787-9', registration: 'DB-7890' },
        gate: null, terminal: null,
        seatsAvailable: { economy: 232, business: 48, first: 16 },
        seatsTaken: { economy: 10, business: 2, first: 0 },
        baseFare: { economy: 450, business: 1500, first: 4000 },
        routeId: 'bjl-lhr', daysOfWeek: [2, 4, 6], delayMinutes: 45,
        cancellationReason: null, createdAt: now, updatedAt: now,
    },
    {
        id: 'fl-103', flightNumber: 'DB-103', airline: 'Deltablue Jet Air',
        origin: { code: 'ACC', name: 'Kotoka Intl', city: 'Accra', country: 'Ghana', timezone: 'Africa/Accra' },
        destination: { code: 'LHR', name: 'Heathrow', city: 'London', country: 'UK', timezone: 'Europe/London' },
        departureTime: now, arrivalTime: now, status: 'boarding',
        aircraft: { id: 'ac-002', type: 'Airbus A320neo', registration: 'DB-320N' },
        gate: 'G5', terminal: 'T2',
        seatsAvailable: { economy: 150, business: 24, first: 6 },
        seatsTaken: { economy: 120, business: 20, first: 5 },
        baseFare: { economy: 500, business: 1800, first: 4500 },
        routeId: 'acc-lhr', daysOfWeek: [1, 2, 3, 4, 5, 6, 7], delayMinutes: 0,
        cancellationReason: null, createdAt: now, updatedAt: now,
    },
];

describe('flightsStore — real-time flight data', () => {
    beforeEach(() => {
        useFlightsStore.setState({ flights: [], isLoading: true, error: null, lastUpdated: null });
    });

    it('should set flights and update loading state', () => {
        useFlightsStore.getState().setFlights(mockFlights);
        const state = useFlightsStore.getState();
        expect(state.flights).toHaveLength(3);
        expect(state.isLoading).toBe(false);
        expect(state.lastUpdated).not.toBeNull();
    });

    it('should find a flight by ID', () => {
        useFlightsStore.getState().setFlights(mockFlights);
        const flight = useFlightsStore.getState().getFlightById('fl-102');
        expect(flight?.flightNumber).toBe('DB-102');
        expect(flight?.status).toBe('delayed');
    });

    it('should filter flights by status', () => {
        useFlightsStore.getState().setFlights(mockFlights);
        const delayed = useFlightsStore.getState().getFlightsByStatus('delayed');
        expect(delayed).toHaveLength(1);
        expect(delayed[0].flightNumber).toBe('DB-102');
    });

    it('should filter flights by route', () => {
        useFlightsStore.getState().setFlights(mockFlights);
        const bjlFlights = useFlightsStore.getState().getFlightsByRoute('BJL', 'ACC');
        expect(bjlFlights).toHaveLength(1);
        expect(bjlFlights[0].flightNumber).toBe('DB-101');
    });

    it('should return undefined for non-existent flight ID', () => {
        useFlightsStore.getState().setFlights(mockFlights);
        const flight = useFlightsStore.getState().getFlightById('fl-999');
        expect(flight).toBeUndefined();
    });

    it('should track errors', () => {
        useFlightsStore.getState().setError('Connection failed');
        const state = useFlightsStore.getState();
        expect(state.error).toBe('Connection failed');
        expect(state.isLoading).toBe(false);
    });
});
