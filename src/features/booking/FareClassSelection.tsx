import React, { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { BRAND } from '../../config/brand';
import { ROUTES } from '../../config/routes';
import { useBookingStore } from '../../stores/bookingStore';
import { useConfigStore } from '../../stores/configStore';
import { useCurrency } from '../../hooks/useCurrency';

/** Format an ISO string or time string for display */
function displayTime(t: string): string {
  if (!t) return '--:--';
  const d = new Date(t);
  if (!isNaN(d.getTime())) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  return t; // fallback: already formatted
}

const BookingStepper: React.FC<{ current: number }> = ({ current }) => {
  const steps = ['Search', 'Flights', 'Fare', 'Passengers', 'Seats', 'Secure'];
  return (
    <div className="flex items-center justify-between max-w-2xl mx-auto w-full mb-12">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center gap-2 group cursor-default">
            <div className={`size-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${i <= current ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white border-navy-100 text-navy-300'
              }`}>
              {i < current ? <span className="material-symbols-outlined text-sm">check</span> : i + 1}
            </div>
            <span className={`text-[8px] font-black uppercase tracking-widest transition-all ${i === current ? 'text-navy-950' : 'text-navy-300'}`}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-4 ${i < current ? 'bg-primary' : 'bg-navy-50'}`}></div>}
        </React.Fragment>
      ))}
    </div>
  );
};

const FareClassSelection: React.FC = () => {
  const navigate = useNavigate();
  const { currency, display } = useCurrency();
  const searchCriteria = useBookingStore(s => s.searchCriteria);
  const selectedFlight = useBookingStore(s => s.selectedFlight);
  const setSelectedFlight = useBookingStore(s => s.setSelectedFlight);
  const faresConfig = useConfigStore(s => s.fares);

  const onBack = () => navigate(ROUTES.FLIGHT_RESULTS);
  
  // Calculate specific flight durations and displays
  const flightDisplay = useMemo(() => {
    if (!searchCriteria || !selectedFlight) return null;
    const depDate = new Date(searchCriteria.departureDate);
    const dateStr = depDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    // Attempt duration calc if format matched (e.g. "08:00")
    // departureTime is stored as ISO string in bookingStore
    // so we just display it.
    return { dateStr };
  }, [searchCriteria, selectedFlight]);

  if (!searchCriteria || !selectedFlight || !faresConfig) {
    navigate(ROUTES.FLIGHT_SEARCH);
    return null;
  }

  const handleSelectFare = (fareId: string, multiplier: number) => {
    // Update the flight details according to the multiplier
    if (selectedFlight) {
        setSelectedFlight({
            ...selectedFlight,
            fareClass: fareId,
            price: Math.round(selectedFlight.basePrice * multiplier)
        });
        navigate(ROUTES.PASSENGER_DETAILS);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 font-sans bg-white/20 min-h-screen">
      <BookingStepper current={2} />

      <div className="space-y-4">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-navy-300">
          <button onClick={onBack} className="hover:text-primary transition-colors">Flights</button>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary">Fare Optimization</span>
        </nav>
        <div className="flex justify-between items-end border-b border-navy-50 pb-8">
          <div>
            <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Choose your service tier</h1>
            <p className="text-navy-500 font-medium italic mt-2 text-lg">Select the amenity protocol that fits your mission profile.</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-navy-300 uppercase tracking-widest mb-1">Route</span>
            <span className="text-xs font-black text-navy-950 uppercase tracking-tight bg-navy-50 px-4 py-1.5 rounded-full border border-navy-100">{selectedFlight.flightNumber} • {selectedFlight.aircraft}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-sm p-10 flex flex-col md:flex-row items-center gap-10 group overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="w-full md:w-64 h-44 rounded-3xl bg-cover bg-center shrink-0 shadow-2xl relative overflow-hidden group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&q=80')" }}>
          <div className="absolute inset-0 bg-navy-950/20 group-hover:bg-transparent transition-colors"></div>
        </div>
        <div className="flex-1 space-y-6 relative z-10">
          <div className="flex items-center gap-4">
            <span className="px-4 py-1.5 rounded-xl bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20 shadow-inner">Outbound Flight</span>
            <span className="text-xs font-black text-navy-950 uppercase tracking-widest opacity-60">{flightDisplay?.dateStr} • Direct Flight</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-3xl font-black text-navy-950 uppercase tracking-tighter leading-none">{selectedFlight.origin} <span className="text-navy-300 mx-2">→</span> {selectedFlight.destination}</h3>
              <p className="text-[10px] font-bold text-navy-400 uppercase mt-4 tracking-widest flex items-center gap-3">
                <span className="material-symbols-outlined text-sm">schedule</span> {displayTime(selectedFlight.departureTime)} - {displayTime(selectedFlight.arrivalTime)}
                <span className="size-1 rounded-full bg-navy-200"></span>
                <span className="material-symbols-outlined text-sm">airlines</span> {BRAND.shortName} Core Fleet
              </p>
            </div>
            <button onClick={onBack} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-navy-50 text-navy-700 text-[10px] font-black uppercase tracking-widest hover:text-primary hover:bg-white transition-all shadow-sm border border-transparent hover:border-navy-100">
              Modify Segment <span className="material-symbols-outlined text-lg">edit_note</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {faresConfig.classes.map((fareClass) => {
          const calculatedPrice = selectedFlight.basePrice * fareClass.multiplier;
          
          return (
          <div key={fareClass.id} className={`relative flex flex-col gap-10 rounded-[3.5rem] p-12 border-4 transition-all group ${fareClass.isPopular ? 'border-primary bg-white shadow-2xl shadow-primary/10 -translate-y-4' : 'border-navy-50 bg-white hover:border-navy-100 shadow-sm'
            }`}>
            {fareClass.isPopular && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-8 py-2 rounded-full shadow-xl tracking-widest uppercase animate-in zoom-in duration-1000">
                Recommended Choice
              </div>
            )}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-navy-50 text-navy-400 border border-navy-100">{fareClass.id}</span>
                {fareClass.isPopular && <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">Popular</span>}
              </div>
              <h3 className="text-3xl font-black text-navy-950 uppercase tracking-tighter leading-tight">{fareClass.name}</h3>
              <p className="text-[10px] font-bold text-navy-300 uppercase tracking-widest italic opacity-70">{fareClass.description}</p>
            </div>

            <div className="py-8 border-y border-navy-50">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-navy-400 uppercase tracking-widest">Starting at</span>
                <div className="flex items-baseline justify-end gap-1">
                    <span className="text-xs font-black text-navy-400">{currency}</span>
                    <span className="text-5xl font-black text-navy-950 tracking-tighter">{display(calculatedPrice)}</span>
                </div>
                <span className="text-xs font-bold text-navy-400 uppercase">/ Pax</span>
              </div>
            </div>

            <ul className="space-y-6 flex-1 pt-4">
              {fareClass.features.map((f, i) => (
                <li key={i} className={`flex items-center gap-4 text-xs font-bold uppercase tracking-wide ${f.included ? 'text-navy-700' : 'text-navy-300'}`}>
                  <span className={`material-symbols-outlined text-2xl font-black ${f.included ? 'text-primary' : 'text-navy-100'}`}>
                    {f.included ? 'verified' : 'radio_button_unchecked'}
                  </span>
                  <span>{f.name}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectFare(fareClass.id, fareClass.multiplier)}
              className={`w-full py-6 rounded-3xl font-black uppercase tracking-[0.25em] text-xs transition-all ${fareClass.isPopular
                ? 'bg-primary text-white shadow-2xl shadow-primary/30 hover:scale-[1.05] active:scale-95'
                : 'bg-white border-2 border-navy-100 text-navy-700 hover:border-primary hover:text-primary hover:bg-primary/5'
                }`}
            >
              Choose {fareClass.name.split(' ')[0]}
            </button>
          </div>
        )
      })}
      </div>

      <div className="max-w-4xl mx-auto bg-navy-950 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl text-white relative overflow-hidden group">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-[10s]" style={{ backgroundImage: "radial-gradient(#137fec 2px, transparent 2px)", backgroundSize: "40px 40px" }}></div>
        <div className="flex items-center gap-8 relative z-10">
          <div className="size-16 rounded-[1.5rem] bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-inner">
            <span className="material-symbols-outlined text-4xl font-black">support_agent</span>
          </div>
          <div>
            <h4 className="text-xl font-black uppercase tracking-tight">Need additional assistance?</h4>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 leading-relaxed mt-1">Our travel consultants are standing by for group and corporate bookings.</p>
          </div>
        </div>
        <button onClick={() => navigate(ROUTES.HELP_CENTER)} className="px-12 py-4 bg-white text-navy-950 font-black uppercase text-[10px] tracking-[0.25em] rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all relative z-10">Live Support Chat</button>
      </div>
    </div>
  );
};

export default FareClassSelection;
