import { create } from 'zustand';

export interface SearchCriteria {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    tripType: 'one-way' | 'round-trip';
    passengers: {
        adults: number;
        children: number;
        infants: number;
    };
    fareClass: string;
}

export interface SelectedFlight {
    flightId: string;
    flightNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    price: number;
    fareClass: string;
    aircraft: string;
}

export interface PassengerInfo {
    title?: string;
    firstName: string;
    lastName: string;
    gender?: string;
    dateOfBirth: string;
    nationality: string;
    documentType: string;
    documentNumber: string;
    passportExpiry?: string;
    issuingCountry?: string;
    email?: string;
    phone?: string;
}

interface BookingState {
    // Search
    searchCriteria: SearchCriteria | null;
    setSearchCriteria: (criteria: SearchCriteria) => void;

    // Flight selection
    selectedFlight: SelectedFlight | null;
    setSelectedFlight: (flight: SelectedFlight) => void;

    // Passenger details
    passengers: PassengerInfo[];
    setPassengers: (passengers: PassengerInfo[]) => void;

    // Seat selection
    selectedSeats: Record<string, string>; // passengerId -> seatId
    setSelectedSeats: (seats: Record<string, string>) => void;

    // Booking confirmation
    bookingId: string | null;
    setBookingId: (bookingId: string) => void;
    pnr: string | null;
    setPnr: (pnr: string) => void;

    // Reset
    resetBooking: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
    searchCriteria: null,
    setSearchCriteria: (searchCriteria) => set({ searchCriteria }),

    selectedFlight: null,
    setSelectedFlight: (selectedFlight) => set({ selectedFlight }),

    passengers: [],
    setPassengers: (passengers) => set({ passengers }),

    selectedSeats: {},
    setSelectedSeats: (selectedSeats) => set({ selectedSeats }),

    bookingId: null,
    setBookingId: (bookingId) => set({ bookingId }),

    pnr: null,
    setPnr: (pnr) => set({ pnr }),

    resetBooking: () => set({
        searchCriteria: null,
        selectedFlight: null,
        passengers: [],
        selectedSeats: {},
        bookingId: null,
        pnr: null,
    }),
}));
