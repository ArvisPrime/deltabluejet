/**
 * AdminBookingWizard — Full multi-step booking wizard for customer service reps.
 *
 * Steps: Search → Results → Fare → Passenger → Seats → Review & Confirm
 * Reuses: bookingStore, searchFlights(), configStore, useBooking().completeBooking()
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useBookingStore, type PassengerInfo } from '../../stores/bookingStore';
import { useConfigStore } from '../../stores/configStore';
import { useAuth } from '../../hooks/useAuth';
import { useBooking } from '../../hooks/useBooking';
import { useToastStore } from '../../stores/toastStore';
import { searchFlights, getAllScheduledFlights, getRoutes } from '../../services/firestore';
import { useCurrency } from '../../hooks/useCurrency';
import { isValidEmail, isValidPhone, isValidDOB } from '../../utils/validators';
import { toLocalDateString } from '../../utils/localDate';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { APP_CONFIG } from '../../config/app';
import type { FlightDoc, RouteDoc } from '../../types/firestore';
import type { AircraftLayoutConfig, SeatZone } from '../../types/configTypes';

/* ─── Types ─────────────────────────────────────────────────── */
type WizardStep = 'search' | 'results' | 'fare' | 'passenger' | 'seats' | 'review';

const STEPS: { key: WizardStep; label: string; icon: string }[] = [
  { key: 'search', label: 'Search', icon: 'search' },
  { key: 'results', label: 'Flights', icon: 'flight' },
  { key: 'fare', label: 'Fare', icon: 'airline_seat_recline_extra' },
  { key: 'passenger', label: 'Passenger', icon: 'person' },
  { key: 'seats', label: 'Seats', icon: 'event_seat' },
  { key: 'review', label: 'Review', icon: 'check_circle' },
];

interface AirportOption {
  code: string;
  name: string;
  city: string;
  country: string;
}

/* ─── Helpers ───────────────────────────────────────────────── */
function formatTime(ts: unknown): string {
  if (!ts) return '--:--';
  if (typeof (ts as any)?.toDate === 'function') {
    return (ts as any).toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  if (ts instanceof Date) {
    return ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return '--:--';
}

function formatDuration(dep: unknown, arr: unknown): string {
  const parse = (t: unknown): Date | null => {
    if (!t) return null;
    if (typeof (t as any)?.toDate === 'function') return (t as any).toDate();
    if (t instanceof Date) return t;
    return null;
  };
  const d = parse(dep);
  const a = parse(arr);
  if (!d || !a) return '';
  let diff = (a.getTime() - d.getTime()) / 60000;
  if (diff < 0) diff += 1440;
  const h = Math.floor(diff / 60);
  const m = Math.round(diff % 60);
  return `${h}h ${m}m`;
}

function formatDate(ts: unknown): string {
  if (!ts) return '—';
  const d = typeof (ts as any)?.toDate === 'function' ? (ts as any).toDate() : ts instanceof Date ? ts : null;
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ═══════════════════════════════════════════════════════════════
   AdminBookingWizard
   ═══════════════════════════════════════════════════════════════ */
interface Props {
  onClose: () => void;
  onComplete: () => void;
}

const AdminBookingWizard: React.FC<Props> = ({ onClose, onComplete }) => {
  const addToast = useToastStore((s) => s.addToast);
  const { user } = useAuth();
  const { display } = useCurrency();
  const { completeBooking, resetBooking } = useBooking();
  const { setSearchCriteria, setSelectedFlight, setPassengers, setSelectedSeats, setPnr, setBookingId } = useBookingStore();
  const fares = useConfigStore((s) => s.fares);
  const { fetchAircraftLayout } = useConfigStore();

  // ─── Wizard state ──────────────────────────────────────────
  const [step, setStep] = useState<WizardStep>('search');
  const [loading, setLoading] = useState(false);

  // ─── Step 1: Search state ──────────────────────────────────
  const [airports, setAirports] = useState<AirportOption[]>([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState(toLocalDateString(new Date()));
  const [adultCount, setAdultCount] = useState(1);

  // ─── Step 2: Results state ─────────────────────────────────
  const [flights, setFlights] = useState<FlightDoc[]>([]);

  // ─── Step 3: Fare state ────────────────────────────────────
  // (handled inline using selectedFlight from store)

  // ─── Step 4: Passenger state ───────────────────────────────
  const [paxTitle, setPaxTitle] = useState('Mr.');
  const [paxFirstName, setPaxFirstName] = useState('');
  const [paxLastName, setPaxLastName] = useState('');
  const [paxDOB, setPaxDOB] = useState('');
  const [paxNationality, setPaxNationality] = useState('');
  const [paxDocType, setPaxDocType] = useState('passport');
  const [paxDocNumber, setPaxDocNumber] = useState('');
  const [paxDocExpiry, setPaxDocExpiry] = useState('');
  const [paxEmail, setPaxEmail] = useState('');
  const [paxPhone, setPaxPhone] = useState('');
  const [paxAttempted, setPaxAttempted] = useState(false);

  // ─── Step 5: Seats state ───────────────────────────────────
  const [layout, setLayout] = useState<AircraftLayoutConfig | null>(null);
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [selectedSeat, setSelectedSeat] = useState('');
  const [seatLoading, setSeatLoading] = useState(false);

  // ─── Step 6: Review state ──────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [completedPNR, setCompletedPNR] = useState<string | null>(null);

  // Read from store
  const selectedFlight = useBookingStore((s) => s.selectedFlight);
  const passengers = useBookingStore((s) => s.passengers);
  const selectedSeats = useBookingStore((s) => s.selectedSeats);

  // Countries from CMS
  const countriesConfig = useConfigStore((s) => s.countries);
  const countriesList = useMemo(() => {
    if (countriesConfig?.countries?.length) return countriesConfig.countries.map((c) => c.name).sort();
    return ['Canada', 'Gambia', 'Ghana', 'Guinea', 'Kenya', 'Liberia', 'Morocco', 'Nigeria', 'Senegal', 'Sierra Leone', 'South Africa', 'United Arab Emirates', 'United Kingdom', 'United States'];
  }, [countriesConfig]);

  // Load airports on mount
  useEffect(() => {
    getRoutes().then((routes: RouteDoc[]) => {
      const map = new Map<string, AirportOption>();
      for (const r of routes) {
        if (!map.has(r.origin.code)) map.set(r.origin.code, { code: r.origin.code, name: r.origin.name, city: r.origin.city, country: r.origin.country });
        if (!map.has(r.destination.code)) map.set(r.destination.code, { code: r.destination.code, name: r.destination.name, city: r.destination.city, country: r.destination.country });
      }
      setAirports(Array.from(map.values()).sort((a, b) => a.city.localeCompare(b.city)));
    });
  }, []);

  // Reset store on mount
  useEffect(() => {
    resetBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  // ─── Step Handlers ─────────────────────────────────────────

  // Step 1 → Search
  const handleSearch = useCallback(async () => {
    if (!origin || !destination || !departureDate) {
      addToast('Please fill in all search fields', 'warning');
      return;
    }
    setLoading(true);
    try {
      const date = new Date(departureDate + 'T00:00:00');
      let results = await searchFlights(origin, destination, date);
      if (results.length === 0) {
        const allFlights = await getAllScheduledFlights();
        results = allFlights.flights.filter(
          (f) => f.origin?.code === origin && f.destination?.code === destination,
        );
      }
      setFlights(results);
      setSearchCriteria({
        origin,
        destination,
        departureDate,
        tripType: 'one-way',
        passengers: { adults: adultCount, children: 0, infants: 0 },
        fareClass: 'economy',
      });
      setStep('results');
      if (results.length === 0) addToast('No flights found for this route/date', 'warning');
    } catch (err) {
      console.error('Search failed:', err);
      addToast('Flight search failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [origin, destination, departureDate, adultCount, addToast, setSearchCriteria]);

  // Step 2 → Select flight
  const handleSelectFlight = useCallback(
    (f: FlightDoc) => {
      const depDate = typeof (f.departureTime as any)?.toDate === 'function' ? (f.departureTime as any).toDate() : null;
      const arrDate = typeof (f.arrivalTime as any)?.toDate === 'function' ? (f.arrivalTime as any).toDate() : null;
      setSelectedFlight({
        flightId: f.id,
        flightNumber: f.flightNumber,
        origin: f.origin.code,
        destination: f.destination.code,
        departureTime: depDate ? depDate.toISOString() : '--:--',
        arrivalTime: arrDate ? arrDate.toISOString() : '--:--',
        price: f.baseFare?.economy || 0,
        basePrice: f.baseFare?.economy || 0,
        fareClass: 'economy',
        aircraft: f.aircraft?.type || 'Unknown',
      });
      setStep('fare');
    },
    [setSelectedFlight],
  );

  // Step 3 → Select fare
  const handleSelectFare = useCallback(
    (fareId: string, multiplier: number) => {
      if (!selectedFlight) return;
      setSelectedFlight({
        ...selectedFlight,
        fareClass: fareId,
        price: Math.round(selectedFlight.basePrice * multiplier),
      });
      setStep('passenger');
    },
    [selectedFlight, setSelectedFlight],
  );

  // Step 4 → Save passenger
  const handleSavePassenger = useCallback(() => {
    setPaxAttempted(true);
    if (!paxFirstName || !paxLastName || !paxDOB || !paxNationality || !paxDocNumber || !paxEmail) {
      addToast('Please fill all required fields', 'warning');
      return;
    }
    if (!isValidEmail(paxEmail)) {
      addToast('Invalid email address', 'warning');
      return;
    }
    const pax: PassengerInfo = {
      title: paxTitle,
      firstName: paxFirstName,
      lastName: paxLastName,
      gender: paxTitle === 'Mr.' ? 'Male' : 'Female',
      dateOfBirth: paxDOB,
      nationality: paxNationality,
      documentType: paxDocType,
      documentNumber: paxDocNumber,
      passportExpiry: paxDocExpiry || undefined,
      email: paxEmail,
      phone: paxPhone || undefined,
    };
    setPassengers([pax]);
    // Load seats
    loadSeatData();
    setStep('seats');
  }, [paxTitle, paxFirstName, paxLastName, paxDOB, paxNationality, paxDocType, paxDocNumber, paxDocExpiry, paxEmail, paxPhone, addToast, setPassengers]);

  // Load seat data for step 5
  const loadSeatData = useCallback(async () => {
    if (!selectedFlight?.flightId) return;
    setSeatLoading(true);
    try {
      const flightRef = doc(db, 'flights', selectedFlight.flightId);
      const flightSnap = await getDoc(flightRef);
      if (flightSnap.exists()) {
        const data = flightSnap.data();
        setOccupiedSeats(data.occupiedSeats || []);
      }
      const aircraftType = selectedFlight.aircraft || 'B737-800';
      const layoutData = await fetchAircraftLayout(aircraftType);
      setLayout(layoutData);
    } catch (err) {
      console.error('Seat load failed:', err);
    } finally {
      setSeatLoading(false);
    }
  }, [selectedFlight, fetchAircraftLayout]);

  // Step 5 → Confirm seat
  const handleConfirmSeat = useCallback(() => {
    if (!selectedSeat) {
      addToast('Please select a seat', 'warning');
      return;
    }
    setSelectedSeats({ '0': selectedSeat });
    setStep('review');
  }, [selectedSeat, setSelectedSeats, addToast]);

  // Step 6 → Complete booking
  const handleComplete = useCallback(async () => {
    setSubmitting(true);
    try {
      const result = await completeBooking();
      setCompletedPNR(result.pnr);
      setPnr(result.pnr);
      setBookingId(result.bookingId);
      addToast(`Booking created! PNR: ${result.pnr}`, 'success');
    } catch (err: any) {
      console.error('Booking failed:', err);
      addToast(err?.message || 'Booking failed', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [completeBooking, setPnr, setBookingId, addToast]);

  // ─── Close handler with confirmation ───────────────────────
  const handleClose = useCallback(() => {
    if (completedPNR) {
      resetBooking();
      onComplete();
      return;
    }
    if (step !== 'search' && !window.confirm('Discard this booking in progress?')) return;
    resetBooking();
    onClose();
  }, [step, completedPNR, resetBooking, onClose, onComplete]);

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 md:p-8 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-4 overflow-hidden border border-navy-100">
        {/* ─── Header ─── */}
        <div className="bg-gradient-to-r from-navy-950 to-navy-800 px-8 py-6 text-white">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl">flight_takeoff</span>
              <h2 className="text-xl font-black tracking-tight">
                {completedPNR ? 'Booking Complete' : 'Book a Flight'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="size-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
          </div>

          {/* Stepper */}
          {!completedPNR && (
            <div className="flex items-center justify-between">
              {STEPS.map((s, i) => (
                <React.Fragment key={s.key}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`size-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${
                        i <= stepIndex
                          ? 'bg-white border-white text-navy-950'
                          : 'bg-transparent border-white/30 text-white/40'
                      }`}
                    >
                      {i < stepIndex ? (
                        <span className="material-symbols-outlined text-sm">check</span>
                      ) : (
                        <span className="material-symbols-outlined text-sm">{s.icon}</span>
                      )}
                    </div>
                    <span
                      className={`text-[8px] font-black uppercase tracking-widest ${
                        i === stepIndex ? 'text-white' : 'text-white/40'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${i < stepIndex ? 'bg-white/60' : 'bg-white/10'}`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* ─── Content ─── */}
        <div className="p-8 max-h-[calc(100vh-250px)] overflow-y-auto">

          {/* ──────────── STEP 1: SEARCH ──────────── */}
          {step === 'search' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-navy-950 mb-1">Search Available Flights</h3>
                <p className="text-sm text-navy-400">Find a flight for the passenger you're booking for.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Origin */}
                <div>
                  <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">From</label>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full h-12 px-4 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold text-navy-900 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select departure city</option>
                    {airports.map((a) => (
                      <option key={a.code} value={a.code}>
                        {a.city} ({a.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">To</label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full h-12 px-4 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold text-navy-900 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select arrival city</option>
                    {airports.map((a) => (
                      <option key={a.code} value={a.code}>
                        {a.city} ({a.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Departure Date</label>
                  <input
                    type="date"
                    value={departureDate}
                    min={toLocalDateString(new Date())}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full h-12 px-4 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold text-navy-900 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Passengers */}
                <div>
                  <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Adults</label>
                  <select
                    value={adultCount}
                    onChange={(e) => setAdultCount(Number(e.target.value))}
                    className="w-full h-12 px-4 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold text-navy-900 focus:ring-2 focus:ring-primary/20"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full py-3.5 bg-primary text-white font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    Searching...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">search</span>
                    Search Flights
                  </>
                )}
              </button>
            </div>
          )}

          {/* ──────────── STEP 2: RESULTS ──────────── */}
          {step === 'results' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-navy-950 mb-1">Available Flights</h3>
                  <p className="text-sm text-navy-400">{flights.length} flight{flights.length !== 1 ? 's' : ''} found • {origin} → {destination}</p>
                </div>
                <button
                  onClick={() => setStep('search')}
                  className="px-4 py-2 text-xs font-black text-navy-500 border border-navy-100 rounded-xl hover:bg-navy-50 transition-all"
                >
                  ← Back
                </button>
              </div>

              {flights.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <span className="material-symbols-outlined text-5xl text-navy-200">flight_land</span>
                  <p className="font-bold text-navy-400">No flights available</p>
                  <p className="text-xs text-navy-300">Try a different date or route.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {flights.map((f) => {
                    const economy = f.baseFare?.economy || 0;
                    const business = f.baseFare?.business || 0;
                    const ecoAvail = (f.seatsAvailable?.economy || 0) - (f.seatsTaken?.economy || 0);
                    return (
                      <button
                        key={f.id}
                        onClick={() => handleSelectFlight(f)}
                        className="w-full bg-white border border-navy-100 rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition-all text-left group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div>
                              <p className="text-lg font-black text-navy-950">{formatTime(f.departureTime)}</p>
                              <p className="text-[10px] font-bold text-navy-400">{f.origin?.code}</p>
                            </div>
                            <div className="flex flex-col items-center">
                              <p className="text-[9px] font-bold text-navy-300">{formatDuration(f.departureTime, f.arrivalTime)}</p>
                              <div className="w-20 h-px bg-navy-200 relative">
                                <span className="material-symbols-outlined absolute -top-2.5 left-1/2 -translate-x-1/2 text-primary text-xs">flight</span>
                              </div>
                              <p className="text-[9px] font-bold text-navy-300">Direct</p>
                            </div>
                            <div>
                              <p className="text-lg font-black text-navy-950">{formatTime(f.arrivalTime)}</p>
                              <p className="text-[10px] font-bold text-navy-400">{f.destination?.code}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-navy-950">{f.flightNumber}</p>
                            <p className="text-lg font-black text-primary">${economy.toLocaleString()}</p>
                            <p className="text-[9px] text-navy-400">{ecoAvail} seats left</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ──────────── STEP 3: FARE ──────────── */}
          {step === 'fare' && selectedFlight && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-navy-950 mb-1">Select Fare Class</h3>
                  <p className="text-sm text-navy-400">{selectedFlight.flightNumber} • {selectedFlight.origin} → {selectedFlight.destination}</p>
                </div>
                <button onClick={() => setStep('results')} className="px-4 py-2 text-xs font-black text-navy-500 border border-navy-100 rounded-xl hover:bg-navy-50 transition-all">← Back</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(fares?.classes || [
                  { id: 'economy', name: 'Economy', description: 'Standard seating', multiplier: 1, features: [{ included: true, name: 'Carry-on bag' }, { included: true, name: 'In-flight entertainment' }, { included: false, name: 'Lounge access' }] },
                  { id: 'business', name: 'Business', description: 'Premium cabin', multiplier: 2.5, features: [{ included: true, name: 'Priority boarding' }, { included: true, name: 'Lounge access' }, { included: true, name: '2 checked bags' }], isPopular: true },
                  { id: 'first', name: 'First Class', description: 'Luxury experience', multiplier: 4, features: [{ included: true, name: 'Private suite' }, { included: true, name: 'Fine dining' }, { included: true, name: 'Chauffeur service' }] },
                ]).map((fare) => {
                  const price = Math.round(selectedFlight.basePrice * fare.multiplier);
                  return (
                    <button
                      key={fare.id}
                      onClick={() => handleSelectFare(fare.id, fare.multiplier)}
                      className={`relative bg-white border-2 rounded-2xl p-5 text-left transition-all hover:shadow-lg hover:border-primary/50 ${
                        fare.isPopular ? 'border-primary' : 'border-navy-100'
                      }`}
                    >
                      {fare.isPopular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-full">
                          Popular
                        </span>
                      )}
                      <h4 className="font-black text-navy-950 mb-1">{fare.name}</h4>
                      <p className="text-[10px] text-navy-400 mb-3">{fare.description}</p>
                      <p className="text-2xl font-black text-primary mb-4">${price.toLocaleString()}</p>
                      <div className="space-y-2">
                        {fare.features.map((feat, fi) => (
                          <div key={fi} className="flex items-center gap-2 text-xs">
                            <span className={`material-symbols-outlined text-sm ${feat.included ? 'text-emerald-500' : 'text-navy-200'}`}>
                              {feat.included ? 'check_circle' : 'cancel'}
                            </span>
                            <span className={feat.included ? 'text-navy-700' : 'text-navy-300'}>{feat.name}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ──────────── STEP 4: PASSENGER ──────────── */}
          {step === 'passenger' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-navy-950 mb-1">Passenger Details</h3>
                  <p className="text-sm text-navy-400">Enter the passenger's information as shown on their travel document.</p>
                </div>
                <button onClick={() => setStep('fare')} className="px-4 py-2 text-xs font-black text-navy-500 border border-navy-100 rounded-xl hover:bg-navy-50 transition-all">← Back</button>
              </div>

              {/* Name */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Title</label>
                  <select value={paxTitle} onChange={(e) => setPaxTitle(e.target.value)} className="w-full h-11 px-3 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold">
                    <option>Mr.</option>
                    <option>Mrs.</option>
                    <option>Ms.</option>
                    <option>Dr.</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-1.5">First Name *</label>
                  <input value={paxFirstName} onChange={(e) => setPaxFirstName(e.target.value)} className={`w-full h-11 px-3 bg-navy-50 border rounded-xl text-sm font-bold ${paxAttempted && !paxFirstName ? 'border-red-300' : 'border-navy-100'}`} placeholder="First name" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Last Name *</label>
                  <input value={paxLastName} onChange={(e) => setPaxLastName(e.target.value)} className={`w-full h-11 px-3 bg-navy-50 border rounded-xl text-sm font-bold ${paxAttempted && !paxLastName ? 'border-red-300' : 'border-navy-100'}`} placeholder="Last name" />
                </div>
              </div>

              {/* DOB & Nationality */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Date of Birth *</label>
                  <input type="date" value={paxDOB} onChange={(e) => setPaxDOB(e.target.value)} className={`w-full h-11 px-3 bg-navy-50 border rounded-xl text-sm font-bold ${paxAttempted && !paxDOB ? 'border-red-300' : 'border-navy-100'}`} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Nationality *</label>
                  <select value={paxNationality} onChange={(e) => setPaxNationality(e.target.value)} className={`w-full h-11 px-3 bg-navy-50 border rounded-xl text-sm font-bold ${paxAttempted && !paxNationality ? 'border-red-300' : 'border-navy-100'}`}>
                    <option value="">Select</option>
                    {countriesList.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Document */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Document Type</label>
                  <select value={paxDocType} onChange={(e) => setPaxDocType(e.target.value)} className="w-full h-11 px-3 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold">
                    <option value="passport">Passport</option>
                    <option value="national_id">National ID</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Document # *</label>
                  <input value={paxDocNumber} onChange={(e) => setPaxDocNumber(e.target.value)} className={`w-full h-11 px-3 bg-navy-50 border rounded-xl text-sm font-bold ${paxAttempted && !paxDocNumber ? 'border-red-300' : 'border-navy-100'}`} placeholder="Document number" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Expiry Date</label>
                  <input type="date" value={paxDocExpiry} onChange={(e) => setPaxDocExpiry(e.target.value)} className="w-full h-11 px-3 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold" />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Email *</label>
                  <input type="email" value={paxEmail} onChange={(e) => setPaxEmail(e.target.value)} className={`w-full h-11 px-3 bg-navy-50 border rounded-xl text-sm font-bold ${paxAttempted && !paxEmail ? 'border-red-300' : 'border-navy-100'}`} placeholder="passenger@email.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Phone</label>
                  <input type="tel" value={paxPhone} onChange={(e) => setPaxPhone(e.target.value)} className="w-full h-11 px-3 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold" placeholder="+1 234 567 890" />
                </div>
              </div>

              <button
                onClick={handleSavePassenger}
                className="w-full py-3.5 bg-primary text-white font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                Continue to Seat Selection
              </button>
            </div>
          )}

          {/* ──────────── STEP 5: SEATS ──────────── */}
          {step === 'seats' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-navy-950 mb-1">Select Seat</h3>
                  <p className="text-sm text-navy-400">Choose a seat for {passengers[0]?.firstName || 'the passenger'}.</p>
                </div>
                <button onClick={() => setStep('passenger')} className="px-4 py-2 text-xs font-black text-navy-500 border border-navy-100 rounded-xl hover:bg-navy-50 transition-all">← Back</button>
              </div>

              {seatLoading ? (
                <div className="flex items-center justify-center py-16">
                  <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                </div>
              ) : !layout ? (
                <div className="text-center py-12 space-y-3">
                  <span className="material-symbols-outlined text-4xl text-navy-200">event_seat</span>
                  <p className="text-sm font-bold text-navy-400">No seat map available for this aircraft</p>
                  <button
                    onClick={() => { setSelectedSeats({ '0': 'AUTO' }); setStep('review'); }}
                    className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest"
                  >
                    Skip — Auto Assign
                  </button>
                </div>
              ) : (
                <>
                  {/* Legend */}
                  <div className="flex items-center gap-4 text-[10px] font-bold">
                    <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300" /> Available</div>
                    <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-primary border border-primary" /> Selected</div>
                    <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-navy-200 border border-navy-300" /> Occupied</div>
                  </div>

                  {/* Seat Grid */}
                  <div className="bg-navy-50/50 rounded-2xl p-4 overflow-x-auto max-h-[350px] overflow-y-auto">
                    <div className="flex flex-col items-center gap-1 min-w-[280px]">
                      {Array.from({ length: layout.totalRows }, (_, rowIdx) => {
                        const rowNum = rowIdx + 1;
                        const zone = layout.zones.find(
                          (z) => rowNum >= z.rowStart && rowNum <= z.rowEnd,
                        );
                        return (
                          <div key={rowNum} className="flex items-center gap-0.5">
                            <span className="text-[9px] font-bold text-navy-300 w-5 text-right mr-1">{rowNum}</span>
                            {layout.columns.map((col, ci) => {
                              if (col === 'KEY_AISLE') {
                                return <div key={ci} className="w-4" />;
                              }
                              const seatId = `${rowNum}${col}`;
                              const isOccupied = occupiedSeats.includes(seatId);
                              const isSelected = selectedSeat === seatId;
                              return (
                                <button
                                  key={seatId}
                                  disabled={isOccupied}
                                  onClick={() => setSelectedSeat(seatId)}
                                  className={`w-7 h-6 rounded text-[8px] font-black transition-all ${
                                    isOccupied
                                      ? 'bg-navy-200 text-navy-400 cursor-not-allowed'
                                      : isSelected
                                        ? 'bg-primary text-white shadow-md scale-110'
                                        : zone
                                          ? `${zone.color} hover:opacity-80 cursor-pointer`
                                          : 'bg-emerald-100 border border-emerald-300 text-emerald-700 hover:bg-emerald-200 cursor-pointer'
                                  }`}
                                  title={`Seat ${seatId}${zone ? ` — ${zone.name}` : ''}`}
                                >
                                  {col}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {selectedSeat && (
                    <div className="flex items-center justify-between bg-primary-50 border border-primary-100 rounded-2xl px-5 py-3">
                      <span className="text-sm font-bold text-primary-700">Selected: Seat {selectedSeat}</span>
                      <button
                        onClick={handleConfirmSeat}
                        className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-600 transition-all"
                      >
                        Confirm Seat →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ──────────── STEP 6: REVIEW ──────────── */}
          {step === 'review' && !completedPNR && selectedFlight && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-navy-950 mb-1">Review & Confirm</h3>
                  <p className="text-sm text-navy-400">Verify all details before finalizing the booking.</p>
                </div>
                <button onClick={() => setStep('seats')} className="px-4 py-2 text-xs font-black text-navy-500 border border-navy-100 rounded-xl hover:bg-navy-50 transition-all">← Back</button>
              </div>

              {/* Flight Summary */}
              <div className="bg-navy-50/50 rounded-2xl p-5 border border-navy-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Flight</span>
                  <span className="text-sm font-black text-navy-950">{selectedFlight.flightNumber}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xl font-black text-navy-950">{selectedFlight.origin}</p>
                    <p className="text-[10px] text-navy-400">{selectedFlight.departureTime ? new Date(selectedFlight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}</p>
                  </div>
                  <div className="flex-1 flex items-center">
                    <div className="h-px flex-1 bg-navy-200" />
                    <span className="material-symbols-outlined mx-2 text-primary">flight</span>
                    <div className="h-px flex-1 bg-navy-200" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-navy-950">{selectedFlight.destination}</p>
                    <p className="text-[10px] text-navy-400">{selectedFlight.arrivalTime ? new Date(selectedFlight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}</p>
                  </div>
                </div>
              </div>

              {/* Passenger Summary */}
              {passengers[0] && (
                <div className="bg-navy-50/50 rounded-2xl p-5 border border-navy-100">
                  <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Passenger</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-navy-400 font-medium">Name: </span><span className="font-bold text-navy-950">{passengers[0].title} {passengers[0].firstName} {passengers[0].lastName}</span></div>
                    <div><span className="text-navy-400 font-medium">DOB: </span><span className="font-bold text-navy-950">{passengers[0].dateOfBirth}</span></div>
                    <div><span className="text-navy-400 font-medium">Nationality: </span><span className="font-bold text-navy-950">{passengers[0].nationality}</span></div>
                    <div><span className="text-navy-400 font-medium">{passengers[0].documentType}: </span><span className="font-bold text-navy-950">{passengers[0].documentNumber}</span></div>
                    <div><span className="text-navy-400 font-medium">Email: </span><span className="font-bold text-navy-950">{passengers[0].email}</span></div>
                    <div><span className="text-navy-400 font-medium">Seat: </span><span className="font-bold text-navy-950">{selectedSeats['0'] || 'Auto'}</span></div>
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div className="bg-navy-50/50 rounded-2xl p-5 border border-navy-100">
                <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mb-3">Pricing</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-navy-600">Fare ({selectedFlight.fareClass})</span>
                  <span className="text-sm font-bold text-navy-950">${selectedFlight.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-navy-600">Passengers</span>
                  <span className="text-sm font-bold text-navy-950">× {passengers.length}</span>
                </div>
                <div className="h-px bg-navy-200 my-3" />
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-navy-950">Total</span>
                  <span className="text-lg font-black text-primary">${(selectedFlight.price * passengers.length).toLocaleString()}</span>
                </div>
              </div>

              {/* Admin Note */}
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                <span className="material-symbols-outlined text-amber-500">info</span>
                <p className="text-xs font-bold text-amber-700">
                  This booking will be marked as <strong>Confirmed (Paid)</strong> and attributed to your admin account for audit trail.
                </p>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleComplete}
                disabled={submitting}
                className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    Processing Booking...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Confirm & Mark as Paid
                  </>
                )}
              </button>
            </div>
          )}

          {/* ──────────── SUCCESS ──────────── */}
          {completedPNR && (
            <div className="text-center py-8 space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-4xl text-emerald-600">check_circle</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-navy-950 mb-2">Booking Confirmed!</h3>
                <p className="text-navy-500">The booking has been successfully created and marked as paid.</p>
              </div>
              <div className="bg-navy-50/50 rounded-2xl p-6 inline-block border border-navy-100">
                <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Confirmation Code</p>
                <p className="text-3xl font-black text-primary tracking-wider">{completedPNR}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleClose}
                  className="px-8 py-3 bg-primary text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary/20"
                >
                  Done — Return to Bookings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBookingWizard;
