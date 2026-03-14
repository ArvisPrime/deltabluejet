import { describe, it, expect, beforeEach } from 'vitest';
import { useBookingStore } from '../../src/stores/bookingStore';

describe('bookingStore', () => {
    beforeEach(() => {
        useBookingStore.getState().resetBooking();
    });

    it('should start with empty booking state', () => {
        const state = useBookingStore.getState();
        expect(state.searchCriteria).toBeNull();
        expect(state.selectedFlight).toBeNull();
        expect(state.passengers).toEqual([]);
        expect(state.selectedSeats).toEqual({});
        expect(state.pnr).toBeNull();
    });

    it('should set search criteria', () => {
        const criteria = {
            origin: 'BJL',
            destination: 'LHR',
            departureDate: '2026-03-15',
            tripType: 'one-way' as const,
            passengers: { adults: 1, children: 0, infants: 0 },
            fareClass: 'economy',
        };

        useBookingStore.getState().setSearchCriteria(criteria);
        expect(useBookingStore.getState().searchCriteria).toEqual(criteria);
    });

    it('should set selected flight', () => {
        const flight = {
            flightId: 'FL001',
            flightNumber: 'DB-101',
            origin: 'BJL',
            destination: 'LHR',
            departureTime: '2026-03-15T08:00:00Z',
            arrivalTime: '2026-03-15T14:00:00Z',
            price: 450,
            fareClass: 'economy',
            aircraft: 'B737-800',
        };

        useBookingStore.getState().setSelectedFlight(flight);
        expect(useBookingStore.getState().selectedFlight).toEqual(flight);
    });

    it('should set PNR', () => {
        useBookingStore.getState().setPnr('DJXK42');
        expect(useBookingStore.getState().pnr).toBe('DJXK42');
    });

    it('should reset all booking state', () => {
        // Populate state
        useBookingStore.getState().setPnr('ABC123');
        useBookingStore.getState().setPassengers([{
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01',
            nationality: 'GB',
            documentType: 'passport',
            documentNumber: 'X12345',
        }]);

        // Reset
        useBookingStore.getState().resetBooking();

        const state = useBookingStore.getState();
        expect(state.pnr).toBeNull();
        expect(state.passengers).toEqual([]);
        expect(state.selectedFlight).toBeNull();
        expect(state.searchCriteria).toBeNull();
    });
});
