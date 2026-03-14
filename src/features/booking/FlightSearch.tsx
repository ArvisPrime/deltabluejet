
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../../config/routes';
import { useBookingStore, type SearchCriteria } from '../../stores/bookingStore';
import { getRoutes } from '../../services/firestore';
import type { RouteDoc } from '../../types/firestore';

interface AirportOption {
  code: string;
  name: string;
  city: string;
  country: string;
}

function useAirports() {
  const [airports, setAirports] = useState<AirportOption[]>([]);
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
  return airports;
}

/** Searchable airport dropdown */
const AirportPicker: React.FC<{
  label: string;
  icon: string;
  value: string;
  airports: AirportOption[];
  onChange: (code: string) => void;
}> = ({ label, icon, value, airports, onChange }) => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = airports.find(a => a.code === value);
  const displayText = selected ? `${selected.city} (${selected.code})` : '';

  const filtered = airports.filter(a => {
    const q = filter.toLowerCase();
    return a.city.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.country.toLowerCase().includes(q);
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative w-full group" ref={ref}>
      <label className="block text-xs font-black text-navy-400 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300">{icon}</span>
        <input
          className="w-full h-14 pl-12 pr-4 bg-navy-50 border border-navy-100 rounded-xl text-navy-900 font-bold focus:ring-2 focus:ring-primary/20 cursor-pointer"
          value={open ? filter : displayText}
          placeholder={`Select ${label.toLowerCase()}`}
          onFocus={() => { setOpen(true); setFilter(''); }}
          onChange={(e) => setFilter(e.target.value)}
          readOnly={false}
        />
        {open && (
          <div className="absolute z-50 top-full left-0 w-full mt-1 bg-white rounded-xl border border-navy-100 shadow-2xl max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-4 text-sm text-navy-400 text-center">No airports found</p>
            ) : (
              filtered.map(a => (
                <button
                  key={a.code}
                  type="button"
                  className={`w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors flex items-center gap-3 ${value === a.code ? 'bg-primary/10 text-primary' : 'text-navy-700'}`}
                  onClick={() => { onChange(a.code); setOpen(false); setFilter(''); }}
                >
                  <span className="text-xs font-black bg-navy-50 px-2 py-1 rounded-lg border border-navy-100 uppercase">{a.code}</span>
                  <div>
                    <p className="text-sm font-bold">{a.city}</p>
                    <p className="text-[10px] text-navy-400">{a.name}, {a.country}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const FlightSearch: React.FC = () => {
  const navigate = useNavigate();
  const setSearchCriteria = useBookingStore(s => s.setSearchCriteria);
  const airports = useAirports();

  // Form state
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [tripType, setTripType] = useState<'round-trip' | 'one-way'>('round-trip');

  // Default departure to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDep = tomorrow.toISOString().slice(0, 10);
  const weekLater = new Date(tomorrow);
  weekLater.setDate(weekLater.getDate() + 7);
  const defaultRet = weekLater.toISOString().slice(0, 10);

  const [departureDate, setDepartureDate] = useState(defaultDep);
  const [returnDate, setReturnDate] = useState(defaultRet);
  const [adults, setAdults] = useState(1);

  const canSearch = origin && destination && departureDate && origin !== destination;

  const onSearch = () => {
    if (!canSearch) return;
    const criteria: SearchCriteria = {
      origin,
      destination,
      departureDate,
      returnDate: tripType === 'round-trip' ? returnDate : undefined,
      tripType,
      passengers: { adults, children: 0, infants: 0 },
      fareClass: 'economy',
    };
    setSearchCriteria(criteria);
    navigate(ROUTES.FLIGHT_RESULTS);
  };

  const swapCities = () => {
    const tmp = origin;
    setOrigin(destination);
    setDestination(tmp);
  };

  return (
    <div className="min-h-full font-display">
      <section className="relative min-h-[600px] flex flex-col items-center justify-center px-4 py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 z-0 w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950/40 via-navy-900/20 to-navy-50 z-10"></div>
          <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBjJj-MwJ6AmcysuwwTNETCCfZSy9zMS8AlprYLY1D4ULiqqiuB7TTioQZXkSXdA2hcKFOnIOmlrj9bySRl367pajGaDw-s8Jm1H0KDq_Pm9DVWVlPcvb-pbUS5GWIUFT5omZRu8zTSZ8WUfC-c37MN5unsCptNWInZQ2eMOqBKy5cfvcCyaP6XgaKneSUg0p9IwN_4PBuagsueI_EpFYH0OKwUMzrLicErvV96JBwj4udVNTFk1kQwf-2-Q5xis1O2revus9n_7Nc')" }}></div>
        </div>

        <div className="relative z-20 w-full max-w-6xl flex flex-col gap-8">
          <div className="text-center text-white mb-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 drop-shadow-md">Where to next?</h1>
            <p className="text-lg md:text-xl font-medium text-navy-50 drop-shadow-sm max-w-2xl mx-auto">Discover your next adventure with our best price guarantee and flexible options.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-navy-100 backdrop-blur-sm">
            {/* Trip Type Selector */}
            <div className="flex flex-wrap gap-4 mb-6">
              {([
                { value: 'round-trip' as const, label: 'Round Trip', icon: 'sync_alt' },
                { value: 'one-way' as const, label: 'One Way', icon: 'arrow_right_alt' },
              ]).map(opt => (
                <label key={opt.value} className="group cursor-pointer">
                  <input
                    type="radio"
                    name="tripType"
                    checked={tripType === opt.value}
                    onChange={() => setTripType(opt.value)}
                    className="peer sr-only"
                  />
                  <div className="px-4 py-2 rounded-full border border-navy-200 text-navy-500 text-sm font-bold peer-checked:bg-primary/10 peer-checked:text-primary peer-checked:border-primary transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">{opt.icon}</span> {opt.label}
                  </div>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 items-end">
              {/* Origin / Destination */}
              <div className="md:col-span-12 lg:col-span-5 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-center relative">
                <AirportPicker label="From" icon="flight_takeoff" value={origin} airports={airports} onChange={setOrigin} />
                <button
                  type="button"
                  onClick={swapCities}
                  className="hidden sm:flex size-10 items-center justify-center rounded-full bg-white border border-navy-100 text-navy-400 hover:text-primary transition-all mt-6 z-10 -ml-3 -mr-3 shadow-sm border-2"
                >
                  <span className="material-symbols-outlined">swap_horiz</span>
                </button>
                <AirportPicker label="To" icon="flight_land" value={destination} airports={airports} onChange={setDestination} />
              </div>

              {/* Dates */}
              <div className="md:col-span-6 lg:col-span-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-black text-navy-400 mb-1.5 uppercase tracking-wider">Departure</label>
                  <input
                    type="date"
                    value={departureDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full h-14 px-4 bg-navy-50 border border-navy-100 rounded-xl font-bold text-sm"
                  />
                </div>
                {tripType === 'round-trip' && (
                  <div>
                    <label className="block text-xs font-black text-navy-400 mb-1.5 uppercase tracking-wider">Return</label>
                    <input
                      type="date"
                      value={returnDate}
                      min={departureDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full h-14 px-4 bg-navy-50 border border-navy-100 rounded-xl font-bold text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Travelers */}
              <div className="md:col-span-6 lg:col-span-2">
                <label className="block text-xs font-black text-navy-400 mb-1.5 uppercase tracking-wider">Travelers</label>
                <div className="w-full h-14 px-4 bg-navy-50 border border-navy-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))} className="size-7 rounded-lg bg-white border border-navy-100 flex items-center justify-center text-navy-500 hover:text-primary transition-colors font-black text-sm">−</button>
                    <span className="text-sm font-black text-navy-900 min-w-[60px] text-center">{adults} Adult{adults > 1 ? 's' : ''}</span>
                    <button type="button" onClick={() => setAdults(Math.min(9, adults + 1))} className="size-7 rounded-lg bg-white border border-navy-100 flex items-center justify-center text-navy-500 hover:text-primary transition-colors font-black text-sm">+</button>
                  </div>
                </div>
              </div>

              {/* Search Button */}
              <div className="md:col-span-12 lg:col-span-2">
                <button
                  onClick={onSearch}
                  disabled={!canSearch}
                  className="w-full h-14 bg-primary text-white rounded-xl font-black text-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <span className="material-symbols-outlined">search</span> Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-b border-navy-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: 'verified_user', title: 'Best Price Guarantee', desc: "Find a lower price? We'll match it." },
              { icon: 'support_agent', title: '24/7 Ops Support', desc: "Our team is here to assist worldwide." },
              { icon: 'cancel', title: 'Free Cancellation', desc: "Flexible options on select bookings." },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <div>
                  <h3 className="font-black text-navy-900">{item.title}</h3>
                  <p className="text-xs text-navy-400 font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FlightSearch;
