/**
 * useCheckin — Hook for the complete check-in flow.
 *
 * Wraps the check-in service to provide a single interface for the
 * check-in journey: PNR lookup → eligibility → seat selection → check-in → boarding pass.
 */

import { useState, useCallback } from 'react';
import {
    checkEligibility,
    getFlightSeatMap,
    processCheckin,
    completeBookingCheckin,
    generateBoardingPass,
    type CheckinEligibility,
    type CheckinInput,
} from '../services/checkin';
import type { CheckinDoc, SeatMapDoc } from '../types/firestore';

interface BoardingPassData {
    airline: string;
    flightNumber: string;
    passengerName: string;
    from: string;
    to: string;
    date: string;
    gate: string;
    terminal: string;
    boardingTime: string;
    seat: string;
    boardingGroup: string;
    fareClass: string;
    pnr: string;
    sequence: number;
    barcode: string;
}

interface CheckinState {
    step: 'retrieve' | 'passengers' | 'seats' | 'declaration' | 'complete';
    eligibility: CheckinEligibility | null;
    seatMap: SeatMapDoc | null;
    occupiedSeats: Set<string>;
    checkinRecords: CheckinDoc[];
    boardingPasses: BoardingPassData[];
    isLoading: boolean;
    error: string | null;
}

export function useCheckin() {
    const [state, setState] = useState<CheckinState>({
        step: 'retrieve',
        eligibility: null,
        seatMap: null,
        occupiedSeats: new Set(),
        checkinRecords: [],
        boardingPasses: [],
        isLoading: false,
        error: null,
    });

    // Step 1: Look up booking by PNR and check eligibility
    const lookupPNR = useCallback(async (pnr: string) => {
        setState((s) => ({ ...s, isLoading: true, error: null }));
        try {
            const eligibility = await checkEligibility(pnr);
            setState((s) => ({
                ...s,
                eligibility,
                isLoading: false,
                step: eligibility.eligible ? 'passengers' : 'retrieve',
                error: eligibility.eligible ? null : eligibility.reason || 'Not eligible',
            }));
            return eligibility;
        } catch (err: any) {
            setState((s) => ({
                ...s,
                isLoading: false,
                error: err.message || 'Failed to look up booking',
            }));
            return null;
        }
    }, []);

    // Step 2: Load seat map for seat selection
    const loadSeatMap = useCallback(async (flightId: string) => {
        setState((s) => ({ ...s, isLoading: true, error: null }));
        try {
            const { seatMap, occupiedSeats } = await getFlightSeatMap(flightId);
            setState((s) => ({
                ...s,
                seatMap,
                occupiedSeats,
                isLoading: false,
                step: 'seats',
            }));
            return { seatMap, occupiedSeats };
        } catch (err: any) {
            setState((s) => ({
                ...s,
                isLoading: false,
                error: err.message || 'Failed to load seat map',
            }));
            return null;
        }
    }, []);

    // Step 3: Process check-in for a passenger
    const checkinPassenger = useCallback(
        async (input: CheckinInput) => {
            setState((s) => ({ ...s, isLoading: true, error: null }));
            try {
                const checkinRecord = await processCheckin(input);

                // Add to occupied seats
                setState((s) => {
                    const newOccupied = new Set(s.occupiedSeats);
                    newOccupied.add(input.seatNumber);
                    return {
                        ...s,
                        checkinRecords: [...s.checkinRecords, checkinRecord],
                        occupiedSeats: newOccupied,
                        isLoading: false,
                    };
                });

                return checkinRecord;
            } catch (err: any) {
                setState((s) => ({
                    ...s,
                    isLoading: false,
                    error: err.message || 'Check-in failed',
                }));
                return null;
            }
        },
        [],
    );

    // Step 4: Generate boarding passes for all checked-in passengers
    const generateBoardingPasses = useCallback(async () => {
        setState((s) => ({ ...s, isLoading: true, error: null }));
        try {
            const passes: BoardingPassData[] = [];

            for (const record of state.checkinRecords) {
                const result = await generateBoardingPass({
                    checkinId: record.id,
                    bookingId: record.bookingId,
                    passengerId: record.passengerId,
                });
                if (result.data.boardingPassUrl) {
                    passes.push(result.data.boardingPassUrl as unknown as BoardingPassData);
                }
            }

            // Complete the booking check-in
            if (state.eligibility?.booking) {
                await completeBookingCheckin(state.eligibility.booking.id);
            }

            setState((s) => ({
                ...s,
                boardingPasses: passes,
                isLoading: false,
                step: 'complete',
            }));

            return passes;
        } catch (err: any) {
            setState((s) => ({
                ...s,
                isLoading: false,
                error: err.message || 'Failed to generate boarding passes',
            }));
            return [];
        }
    }, [state.checkinRecords, state.eligibility]);

    // Navigation helpers
    const goToStep = useCallback(
        (step: CheckinState['step']) => setState((s) => ({ ...s, step, error: null })),
        [],
    );

    const reset = useCallback(() => {
        setState({
            step: 'retrieve',
            eligibility: null,
            seatMap: null,
            occupiedSeats: new Set(),
            checkinRecords: [],
            boardingPasses: [],
            isLoading: false,
            error: null,
        });
    }, []);

    return {
        ...state,
        lookupPNR,
        loadSeatMap,
        checkinPassenger,
        generateBoardingPasses,
        goToStep,
        reset,
    };
}
