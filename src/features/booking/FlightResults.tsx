
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { BRAND } from '../../config/brand';
import { ROUTES } from '../../config/routes';
import { useBookingStore } from '../../stores/bookingStore';
import { searchFlights, getAllScheduledFlights } from '../../services/firestore';
import type { FlightDoc } from '../../types/firestore';

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

/** Format a Firestore Timestamp or Date into HH:MM */
function formatTime(ts: unknown): string {
   if (!ts) return '--:--';
   let d: Date;
   if (typeof (ts as { toDate?: () => Date }).toDate === 'function') {
      d = (ts as { toDate: () => Date }).toDate();
   } else if (ts instanceof Date) {
      d = ts;
   } else {
      return '--:--';
   }
   return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** Format duration between two timestamps */
function formatDuration(dep: unknown, arr: unknown): string {
   const parse = (ts: unknown): Date | null => {
      if (!ts) return null;
      if (typeof (ts as { toDate?: () => Date }).toDate === 'function') return (ts as { toDate: () => Date }).toDate();
      if (ts instanceof Date) return ts;
      return null;
   };
   const d = parse(dep);
   const a = parse(arr);
   if (!d || !a) return '';
   let diff = (a.getTime() - d.getTime()) / 60000;
   if (diff < 0) diff += 1440; // overnight
   const h = Math.floor(diff / 60);
   const m = Math.round(diff % 60);
   return `${h}h ${m}m`;
}

/** Check if arrival is the next day */
function isNextDay(dep: unknown, arr: unknown): boolean {
   const parse = (ts: unknown): Date | null => {
      if (!ts) return null;
      if (typeof (ts as { toDate?: () => Date }).toDate === 'function') return (ts as { toDate: () => Date }).toDate();
      if (ts instanceof Date) return ts;
      return null;
   };
   const d = parse(dep);
   const a = parse(arr);
   if (!d || !a) return false;
   return a.getDate() !== d.getDate();
}

const FlightResults: React.FC = () => {
   const navigate = useNavigate();
   const searchCriteria = useBookingStore((s) => s.searchCriteria);
   const setSelectedFlight = useBookingStore((s) => s.setSelectedFlight);

   const onBack = () => navigate(ROUTES.FLIGHT_SEARCH);
   const [activeFilter, setActiveFilter] = useState('Recommended');

   const [flights, setFlights] = useState<FlightDoc[]>([]);
   const [allFlights, setAllFlights] = useState<FlightDoc[]>([]);
   const [showingAll, setShowingAll] = useState(false);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');

   // Redirect if no search criteria
   useEffect(() => {
      if (!searchCriteria) {
         navigate(ROUTES.FLIGHT_SEARCH, { replace: true });
      }
   }, [searchCriteria, navigate]);

   // Fetch flights from Firestore — if no match, fall back to all scheduled flights
   useEffect(() => {
      if (!searchCriteria) return;
      setLoading(true);
      setError('');
      setShowingAll(false);

      searchFlights(
         searchCriteria.origin,
         searchCriteria.destination,
         new Date(searchCriteria.departureDate),
      )
         .then(async (results) => {
            // Only show scheduled/boarding flights (not cancelled)
            const bookable = results.filter(
               (f) => f.status === 'scheduled' || f.status === 'boarding',
            );
            if (bookable.length > 0) {
               setFlights(bookable);
            } else {
               // Fallback: load ALL scheduled flights so passengers can still browse
               await loadAllFlightsFallback();
            }
         })
         .catch(async (err) => {
            console.error('Flight search failed:', err);
            // Fallback: try loading all flights instead of showing error
            try {
               await loadAllFlightsFallback();
            } catch (fallbackErr) {
               console.error('Fallback also failed:', fallbackErr);
               setError('Unable to search flights. Please try again.');
            }
         })
         .finally(() => setLoading(false));

      async function loadAllFlightsFallback() {
         const all = await getAllScheduledFlights();
         setAllFlights(all);
         setShowingAll(true);
         setFlights([]);
      }
   }, [searchCriteria]);

   // Sort flights based on filter
   const sortedFlights = [...flights].sort((a, b) => {
      if (activeFilter === 'Cheapest') {
         return (a.baseFare?.economy || 0) - (b.baseFare?.economy || 0);
      }
      if (activeFilter === 'Fastest') {
         const durA = (a.arrivalTime as unknown as { toDate: () => Date }).toDate().getTime() - (a.departureTime as unknown as { toDate: () => Date }).toDate().getTime();
         const durB = (b.arrivalTime as unknown as { toDate: () => Date }).toDate().getTime() - (b.departureTime as unknown as { toDate: () => Date }).toDate().getTime();
         return durA - durB;
      }
      // Recommended = cheapest first as default
      return (a.baseFare?.economy || 0) - (b.baseFare?.economy || 0);
   });

   const selectFlight = (f: FlightDoc) => {
      setSelectedFlight({
         flightId: f.id,
         flightNumber: f.flightNumber,
         origin: f.origin.code,
         destination: f.destination.code,
         departureTime: formatTime(f.departureTime),
         arrivalTime: formatTime(f.arrivalTime),
         price: f.baseFare?.economy || 0,
         fareClass: 'economy',
         aircraft: f.aircraft?.type || 'Unknown',
      });
      navigate(ROUTES.FARE_SELECTION);
   };

   if (!searchCriteria) return null;

   const depDate = new Date(searchCriteria.departureDate);
   const dateDisplay = depDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
   const paxCount = searchCriteria.passengers.adults + searchCriteria.passengers.children + searchCriteria.passengers.infants;

   return (
      <div className="min-h-screen bg-navy-50/20 font-sans p-4 md:p-10 pb-32">
         <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-700">
            <BookingStepper current={1} />

            <div className="flex flex-col lg:flex-row gap-12 items-start">
               {/* Left Column: Filters */}
               <aside className="w-full lg:w-72 space-y-8 shrink-0">
                  <div className="bg-white rounded-[2.5rem] border border-navy-100 p-8 shadow-sm space-y-8">
                     <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black text-navy-950 uppercase tracking-tighter">Refine</h3>
                        <button onClick={onBack} className="text-[10px] font-black text-primary uppercase underline">Edit Search</button>
                     </div>

                     <div className="space-y-6">
                        <div>
                           <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest mb-4">Stops</p>
                           <div className="space-y-3">
                              {['Non-stop', '1 Stop', '2+ Stops'].map(opt => (
                                 <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                                    <input type="checkbox" defaultChecked={opt === 'Non-stop'} className="size-5 rounded border-2 border-navy-100 text-primary focus:ring-primary transition-all" />
                                    <span className="text-xs font-bold text-navy-600 group-hover:text-navy-950 uppercase tracking-wide">{opt}</span>
                                 </label>
                              ))}
                           </div>
                        </div>

                        <div>
                           <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest mb-4">Departure Time</p>
                           <div className="h-1.5 w-full bg-navy-50 rounded-full relative shadow-inner">
                              <div className="absolute left-[20%] right-[10%] h-full bg-primary rounded-full"></div>
                              <div className="absolute left-[20%] top-1/2 -translate-y-1/2 size-4 bg-white border-2 border-primary rounded-full shadow-lg cursor-pointer"></div>
                              <div className="absolute right-[10%] top-1/2 -translate-y-1/2 size-4 bg-white border-2 border-primary rounded-full shadow-lg cursor-pointer"></div>
                           </div>
                           <div className="flex justify-between mt-3 text-[9px] font-black text-navy-400 uppercase">
                              <span>06:00 AM</span>
                              <span>11:59 PM</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-navy-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 transition-transform group-hover:scale-110">
                        <span className="material-symbols-outlined text-[100px] font-black">loyalty</span>
                     </div>
                     <div className="relative z-10 space-y-4">
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{BRAND.shortName} Club</p>
                        <h4 className="text-lg font-black uppercase tracking-tight leading-tight">Unlock personnel discounts</h4>
                        <button className="bg-white/10 border border-white/10 hover:bg-white/20 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Join Loyalty Program</button>
                     </div>
                  </div>
               </aside>

               {/* Main Content: Results */}
               <div className="flex-1 space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                     <div className="space-y-1">
                        <h2 className="text-3xl font-black text-navy-950 tracking-tighter uppercase leading-none">
                           {searchCriteria.origin} <span className="text-primary">→</span> {searchCriteria.destination}
                        </h2>
                        <p className="text-[10px] font-bold text-navy-400 uppercase tracking-[0.3em]">
                           {dateDisplay} • {paxCount} Passenger{paxCount > 1 ? 's' : ''} • {searchCriteria.fareClass || 'Economy'} Class
                        </p>
                     </div>
                     <div className="flex bg-white rounded-2xl p-1.5 border border-navy-100 shadow-sm w-fit">
                        {['Recommended', 'Cheapest', 'Fastest'].map(f => (
                           <button
                              key={f}
                              onClick={() => setActiveFilter(f)}
                              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === f ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-navy-400 hover:bg-navy-50'
                                 }`}
                           >
                              {f}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Loading State */}
                  {loading && (
                     <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="animate-spin size-10 border-4 border-navy-100 border-t-primary rounded-full"></div>
                        <p className="text-sm font-bold text-navy-400 uppercase tracking-widest">Searching available flights…</p>
                     </div>
                  )}

                  {/* Error State */}
                  {!loading && error && (
                     <div className="p-8 bg-red-50 border border-red-100 rounded-3xl text-center">
                        <span className="material-symbols-outlined text-3xl text-red-400 mb-2">error</span>
                        <p className="text-sm font-bold text-red-600">{error}</p>
                        <button onClick={onBack} className="mt-4 px-6 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase">Try Again</button>
                     </div>
                  )}

                  {/* Empty State — show all available flights as fallback */}
                  {!loading && !error && sortedFlights.length === 0 && (
                     <div className="space-y-8">
                        <div className="p-8 bg-amber-50 border border-amber-200 rounded-3xl flex items-start gap-4">
                           <span className="material-symbols-outlined text-2xl text-amber-600 mt-0.5">info</span>
                           <div>
                              <h3 className="text-sm font-black text-amber-800 uppercase tracking-wide mb-1">No exact match found</h3>
                              <p className="text-xs text-amber-700 font-medium">
                                 There are no flights from <strong>{searchCriteria.origin}</strong> to <strong>{searchCriteria.destination}</strong> on <strong>{dateDisplay}</strong>.
                              </p>
                              <button onClick={onBack} className="mt-3 px-6 py-2 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-700 transition-colors">
                                 Modify Search
                              </button>
                           </div>
                        </div>

                        {showingAll && allFlights.length > 0 && (
                           <>
                              <div className="flex items-center gap-4">
                                 <div className="h-px flex-1 bg-navy-100"></div>
                                 <span className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em]">All Available Flights</span>
                                 <div className="h-px flex-1 bg-navy-100"></div>
                              </div>
                              <p className="text-xs text-navy-400 font-medium text-center -mt-4">
                                 Browse all {allFlights.length} scheduled flights below and pick one that works for you.
                              </p>
                              <div className="space-y-6">
                                 {allFlights.map((f, i) => {
                                    const economyPrice = f.baseFare?.economy || 0;
                                    const nextDay = isNextDay(f.departureTime, f.arrivalTime);
                                    const depDateStr = (() => {
                                       try {
                                          const d = typeof (f.departureTime as any).toDate === 'function' ? (f.departureTime as any).toDate() : f.departureTime;
                                          return (d as Date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                       } catch { return ''; }
                                    })();

                                    return (
                                       <div
                                          key={f.id}
                                          onClick={() => selectFlight(f)}
                                          className="bg-white rounded-[3.5rem] border border-navy-100 p-10 flex flex-col xl:flex-row gap-12 items-stretch hover:shadow-2xl hover:border-primary/40 transition-all group cursor-pointer relative overflow-hidden"
                                       >
                                          {i === 0 && (
                                             <div className="absolute top-0 right-0 bg-primary text-white text-[8px] font-black px-10 py-2 rounded-bl-[2rem] shadow-lg uppercase tracking-[0.3em]">Soonest</div>
                                          )}

                                          <div className="flex flex-col justify-center min-w-[200px] border-b xl:border-b-0 xl:border-r border-navy-50 pb-8 xl:pb-0 xl:pr-12">
                                             <div className="flex items-center gap-5 mb-6">
                                                <div className="size-11 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                                                   <span className="material-symbols-outlined text-2xl font-black">airlines</span>
                                                </div>
                                                <div>
                                                   <p className="text-sm font-black text-navy-950 uppercase tracking-tight">{BRAND.shortName} {BRAND.tagSuffix}</p>
                                                   <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest opacity-60">Flight {f.flightNumber}</p>
                                                </div>
                                             </div>
                                             <div className="flex flex-col gap-2">
                                                <span className="text-[10px] font-black text-navy-700 bg-navy-50 px-3 py-1 rounded-lg w-fit border border-navy-100 uppercase tracking-widest">{f.aircraft?.type || 'N/A'}</span>
                                                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                                   <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                   {f.status === 'scheduled' ? 'Scheduled (On Time)' : f.status === 'boarding' ? 'Boarding' : f.status}
                                                </span>
                                                {depDateStr && <span className="text-[9px] font-bold text-primary uppercase tracking-widest ml-1">{depDateStr}</span>}
                                             </div>
                                          </div>

                                          <div className="flex-1 flex flex-col md:flex-row items-center gap-10">
                                             <div className="text-center md:text-left min-w-[120px]">
                                                <span className="text-4xl font-black text-navy-950 tracking-tighter leading-none">{formatTime(f.departureTime)}</span>
                                                <p className="text-xl font-black text-primary uppercase mt-1">{f.origin.code}</p>
                                                <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">{f.origin.city}</p>
                                             </div>

                                             <div className="flex-1 flex flex-col items-center px-4 relative min-w-[200px]">
                                                <span className="text-[10px] font-black text-navy-300 uppercase tracking-widest mb-4">{formatDuration(f.departureTime, f.arrivalTime)} Duration</span>
                                                <div className="w-full h-0.5 bg-navy-100 relative flex items-center justify-center">
                                                   <div className="absolute inset-0 bg-gradient-to-r from-navy-50/0 via-primary/10 to-navy-50/0"></div>
                                                   <div className="absolute left-0 size-2.5 rounded-full bg-navy-200 group-hover:bg-primary transition-colors"></div>
                                                   <div className="absolute right-0 size-2.5 rounded-full bg-navy-200 group-hover:bg-primary transition-colors"></div>
                                                   <div className="bg-white p-2.5 rounded-2xl border border-navy-50 text-primary z-10 shadow-sm group-hover:scale-125 group-hover:rotate-45 transition-all">
                                                      <span className="material-symbols-outlined rotate-90 text-xl font-black">flight</span>
                                                   </div>
                                                </div>
                                                <div className="mt-4 flex gap-4">
                                                   <span className="text-[9px] font-black text-navy-950 bg-navy-50 px-3 py-1 rounded-full border border-navy-100 uppercase tracking-widest">Non-stop</span>
                                                </div>
                                             </div>

                                             <div className="text-center md:text-right min-w-[120px]">
                                                <span className="text-4xl font-black text-navy-950 tracking-tighter leading-none">
                                                   {formatTime(f.arrivalTime)}
                                                   {nextDay && <sup className="text-xs text-primary font-black ml-1">+1</sup>}
                                                </span>
                                                <p className="text-xl font-black text-primary uppercase mt-1">{f.destination.code}</p>
                                                <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">{f.destination.city}</p>
                                             </div>
                                          </div>

                                          <div className="flex flex-row xl:flex-col justify-between items-center xl:items-end gap-10 min-w-[200px] border-t xl:border-t-0 xl:border-l border-navy-50 pt-8 xl:pt-0 xl:pl-12">
                                             <div className="text-right">
                                                <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest mb-1">Starting Price</p>
                                                <div className="flex items-baseline justify-end gap-1">
                                                   <span className="text-xs font-black text-navy-400">USD</span>
                                                   <span className="text-4xl font-black text-navy-950 tracking-tighter">${economyPrice}</span>
                                                </div>
                                             </div>
                                             <button className="px-12 py-5 bg-navy-950 text-white font-black uppercase text-[11px] tracking-[0.25em] rounded-[1.5rem] shadow-2xl shadow-navy-950/20 group-hover:bg-primary group-hover:shadow-primary/30 transition-all hover:scale-105 active:scale-95">Select Flight</button>
                                          </div>
                                       </div>
                                    );
                                 })}
                              </div>
                           </>
                        )}

                        {showingAll && allFlights.length === 0 && (
                           <div className="p-16 text-center border-2 border-dashed border-navy-100 rounded-[4rem]">
                              <span className="material-symbols-outlined text-5xl text-navy-200 mb-4">flight_takeoff</span>
                              <h3 className="text-lg font-black text-navy-400 uppercase tracking-wide mb-2">No flights available</h3>
                              <p className="text-xs text-navy-300 font-medium max-w-md mx-auto">There are currently no scheduled flights. Please check back later.</p>
                           </div>
                        )}
                     </div>
                  )}

                  {/* Flight Cards */}
                  {!loading && !error && sortedFlights.length > 0 && (
                     <div className="space-y-6">
                        {sortedFlights.map((f, i) => {
                           const economyPrice = f.baseFare?.economy || 0;
                           const nextDay = isNextDay(f.departureTime, f.arrivalTime);
                           const badge = i === 0 ? 'Recommended' : economyPrice === Math.min(...sortedFlights.map(fl => fl.baseFare?.economy || 0)) ? 'Best Value' : undefined;

                           return (
                              <div
                                 key={f.id}
                                 onClick={() => selectFlight(f)}
                                 className="bg-white rounded-[3.5rem] border border-navy-100 p-10 flex flex-col xl:flex-row gap-12 items-stretch hover:shadow-2xl hover:border-primary/40 transition-all group cursor-pointer relative overflow-hidden"
                              >
                                 {badge && (
                                    <div className="absolute top-0 right-0 bg-primary text-white text-[8px] font-black px-10 py-2 rounded-bl-[2rem] shadow-lg uppercase tracking-[0.3em]">
                                       {badge}
                                    </div>
                                 )}

                                 <div className="flex flex-col justify-center min-w-[200px] border-b xl:border-b-0 xl:border-r border-navy-50 pb-8 xl:pb-0 xl:pr-12">
                                    <div className="flex items-center gap-5 mb-6">
                                       <div className="size-11 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                                          <span className="material-symbols-outlined text-2xl font-black">airlines</span>
                                       </div>
                                       <div>
                                          <p className="text-sm font-black text-navy-950 uppercase tracking-tight">{BRAND.shortName} {BRAND.tagSuffix}</p>
                                          <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest opacity-60">Flight {f.flightNumber}</p>
                                       </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                       <span className="text-[10px] font-black text-navy-700 bg-navy-50 px-3 py-1 rounded-lg w-fit border border-navy-100 uppercase tracking-widest">{f.aircraft?.type || 'N/A'}</span>
                                       <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                          {f.status === 'scheduled' ? 'Scheduled (On Time)' : f.status === 'boarding' ? 'Boarding' : f.status}
                                       </span>
                                    </div>
                                 </div>

                                 <div className="flex-1 flex flex-col md:flex-row items-center gap-10">
                                    <div className="text-center md:text-left min-w-[120px]">
                                       <span className="text-4xl font-black text-navy-950 tracking-tighter leading-none">{formatTime(f.departureTime)}</span>
                                       <p className="text-xl font-black text-primary uppercase mt-1">{f.origin.code}</p>
                                       <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">{f.origin.city}</p>
                                    </div>

                                    <div className="flex-1 flex flex-col items-center px-4 relative min-w-[200px]">
                                       <span className="text-[10px] font-black text-navy-300 uppercase tracking-widest mb-4">{formatDuration(f.departureTime, f.arrivalTime)} Duration</span>
                                       <div className="w-full h-0.5 bg-navy-100 relative flex items-center justify-center">
                                          <div className="absolute inset-0 bg-gradient-to-r from-navy-50/0 via-primary/10 to-navy-50/0"></div>
                                          <div className="absolute left-0 size-2.5 rounded-full bg-navy-200 group-hover:bg-primary transition-colors"></div>
                                          <div className="absolute right-0 size-2.5 rounded-full bg-navy-200 group-hover:bg-primary transition-colors"></div>
                                          <div className="bg-white p-2.5 rounded-2xl border border-navy-50 text-primary z-10 shadow-sm group-hover:scale-125 group-hover:rotate-45 transition-all">
                                             <span className="material-symbols-outlined rotate-90 text-xl font-black">flight</span>
                                          </div>
                                       </div>
                                       <div className="mt-4 flex gap-4">
                                          <span className="text-[9px] font-black text-navy-950 bg-navy-50 px-3 py-1 rounded-full border border-navy-100 uppercase tracking-widest">Non-stop</span>
                                       </div>
                                    </div>

                                    <div className="text-center md:text-right min-w-[120px]">
                                       <span className="text-4xl font-black text-navy-950 tracking-tighter leading-none">
                                          {formatTime(f.arrivalTime)}
                                          {nextDay && <sup className="text-xs text-primary font-black ml-1">+1</sup>}
                                       </span>
                                       <p className="text-xl font-black text-primary uppercase mt-1">{f.destination.code}</p>
                                       <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">{f.destination.city}</p>
                                    </div>
                                 </div>

                                 <div className="flex flex-row xl:flex-col justify-between items-center xl:items-end gap-10 min-w-[200px] border-t xl:border-t-0 xl:border-l border-navy-50 pt-8 xl:pt-0 xl:pl-12">
                                    <div className="text-right">
                                       <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest mb-1">Starting Price</p>
                                       <div className="flex items-baseline justify-end gap-1">
                                          <span className="text-xs font-black text-navy-400">USD</span>
                                          <span className="text-4xl font-black text-navy-950 tracking-tighter">${economyPrice}</span>
                                       </div>
                                    </div>
                                    <button className="px-12 py-5 bg-navy-950 text-white font-black uppercase text-[11px] tracking-[0.25em] rounded-[1.5rem] shadow-2xl shadow-navy-950/20 group-hover:bg-primary group-hover:shadow-primary/30 transition-all hover:scale-105 active:scale-95">Select Flight</button>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  )}

                  {!loading && sortedFlights.length > 0 && (
                     <div className="p-12 text-center border-2 border-dashed border-navy-100 rounded-[4rem] group hover:border-primary transition-all cursor-pointer">
                        <p className="text-[11px] font-black text-navy-300 uppercase tracking-[0.4em] group-hover:text-primary transition-colors">You've reached the end of available flights.</p>
                        <p className="text-[9px] font-bold text-navy-200 uppercase tracking-widest mt-2 italic">{BRAND.shortName} AI suggests looking at alternate dates for higher density capacity options.</p>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* Dynamic Summary Bubble */}
         <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-20 duration-1000 delay-500">
            <div className="bg-white/80 backdrop-blur-3xl border border-navy-100 p-6 rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)] flex items-center gap-10 border-t border-white">
               <div className="flex items-center gap-5 pr-10 border-r border-navy-50">
                  <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                     <span className="material-symbols-outlined font-black">travel_explore</span>
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Filter Results</p>
                     <p className="text-xs font-black text-navy-950 uppercase tracking-tight">Non-stop • {searchCriteria.origin} <span className="text-primary mx-1">→</span> {searchCriteria.destination}</p>
                  </div>
               </div>
               <div className="text-[9px] font-black text-navy-400 uppercase tracking-[0.3em] flex items-center gap-3">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {sortedFlights.length > 0
                     ? `${sortedFlights.length} Flight${sortedFlights.length !== 1 ? 's' : ''} Found`
                     : showingAll
                        ? `${allFlights.length} Available Flight${allFlights.length !== 1 ? 's' : ''}`
                        : 'No Flights Found'
                  }
               </div>
            </div>
         </div>
      </div>
   );
};

export default FlightResults;
