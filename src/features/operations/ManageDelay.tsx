
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';
import { getFlights } from '../../services/firestore';
import { recordDelay, DELAY_REASONS, type DelayReason } from '../../services/disruptionService';
import type { FlightDoc } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';

const HOURS_48 = 48 * 60 * 60 * 1000;

const ManageDelay: React.FC = () => {
   const [flights, setFlights] = useState<FlightDoc[]>([]);
   const [selectedFlightId, setSelectedFlightId] = useState('');
   const [delayMinutes, setDelayMinutes] = useState(0);
   const [reason, setReason] = useState<DelayReason>('weather');
   const [newDate, setNewDate] = useState('');
   const [newTime, setNewTime] = useState('');
   const [loading, setLoading] = useState(true);
   const [submitting, setSubmitting] = useState(false);
   const [success, setSuccess] = useState('');
   const [error, setError] = useState('');

   /** Filter flights to only those departing within the next 48 hours */
   const filterWithin48hrs = (data: FlightDoc[]) => {
      const now = Date.now();
      const cutoff = now + HOURS_48;
      return data.filter(f =>
         f.status !== 'cancelled' &&
         f.departureTime.toDate().getTime() > now &&
         f.departureTime.toDate().getTime() <= cutoff
      );
   };

   useEffect(() => {
      const load = async () => {
         try {
            const data = await getFlights({ maxResults: 100 });
            setFlights(filterWithin48hrs(data));
         } catch (err) { console.error(err); useToastStore.getState().addToast(err instanceof Error ? err.message : "An unexpected error occurred", "error"); }
         finally { setLoading(false); }
      };
      load();
   }, []);

   const selectedFlight = flights.find(f => f.id === selectedFlightId);

   const handleSubmit = async () => {
      if (!selectedFlightId || !newDate || !newTime) {
         setError('Please select a flight and enter the new departure time.');
         return;
      }
      setSubmitting(true);
      setError('');
      setSuccess('');
      try {
         const newDep = new Date(`${newDate}T${newTime}`);
         await recordDelay(selectedFlightId, delayMinutes, reason, newDep);
         setSuccess(`Delay recorded for ${selectedFlight?.flightNumber || selectedFlightId}. Passengers will be notified.`);
         // Refresh flights
         const data = await getFlights({ maxResults: 100 });
         setFlights(filterWithin48hrs(data));
      } catch (err: any) {
         setError(err.message || 'Failed to record delay');
      } finally { setSubmitting(false); }
   };

   const fmtTime = (ts: any) => ts?.toDate ? ts.toDate().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--';

   return (
      <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar font-sans bg-navy-50/30">
         <div className="max-w-[1600px] mx-auto w-full space-y-10 animate-in fade-in duration-500 pb-12">
            {/* Breadcrumbs and Title */}
            <div className="space-y-6">
               <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">
                  <Link to={ROUTES.DASHBOARD} className="hover:text-primary transition-colors">Operations</Link>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span className="text-red-500" aria-current="page">Delay Management</span>
               </nav>
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-navy-100 pb-8">
                  <div>
                     <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase">Manage Flight Delay</h1>
                     <p className="text-navy-500 font-medium italic mt-2 text-lg">
                        {loading ? 'Loading flights...' : `${flights.length} flights departing in the next 48 hours`}
                     </p>
                  </div>
                  {selectedFlight && (
                     <Link to={ROUTES.DISRUPTION_RESOLUTION} className={`flex items-center gap-4 px-6 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest border shadow-sm hover:shadow-md transition-shadow ${selectedFlight.status === 'delayed'
                        ? 'bg-red-50 text-red-700 border-red-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                        <span className={`size-2.5 rounded-full animate-pulse ${selectedFlight.status === 'delayed' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                        Status: {selectedFlight.status.toUpperCase()}
                        {selectedFlight.delayMinutes > 0 && ` (+${selectedFlight.delayMinutes}m)`}
                     </Link>
                  )}
               </div>
            </div>

            {/* Success / Error */}
            {success && (
               <div className="flex items-center gap-4 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700">
                  <span className="material-symbols-outlined">check_circle</span>
                  <p className="text-sm font-black uppercase tracking-widest">{success}</p>
               </div>
            )}
            {error && (
               <div className="flex items-center gap-4 p-6 bg-red-50 rounded-2xl border border-red-100 text-red-700">
                  <span className="material-symbols-outlined">error</span>
                  <p className="text-sm font-black uppercase tracking-widest">{error}</p>
               </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
               {/* Left Panel: Flight Selector */}
               <div className="lg:col-span-4 flex flex-col gap-8">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-navy-100 shadow-sm space-y-6">
                     <label className="text-[10px] font-black text-navy-300 uppercase tracking-[0.25em] block px-1">Select Flight</label>
                     <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined font-black">flight</span>
                        <select
                           className="w-full pl-12 pr-10 py-5 bg-navy-50 border-none rounded-3xl text-navy-950 font-black uppercase tracking-tighter text-sm focus:ring-4 focus:ring-primary/5 appearance-none"
                           value={selectedFlightId}
                           onChange={e => setSelectedFlightId(e.target.value)}
                        >
                           <option value="">Choose a flight...</option>
                           {flights.map(f => (
                              <option key={f.id} value={f.id}>
                                 {f.flightNumber} • {f.origin.code} → {f.destination.code} • {fmtTime(f.departureTime)}
                              </option>
                           ))}
                        </select>
                     </div>
                  </div>

                  {selectedFlight && (
                     <div className="bg-navy-950 rounded-[3rem] shadow-2xl overflow-hidden text-white border border-white/5">
                        <div className="p-10 space-y-8">
                           <div className="flex items-center justify-between">
                              <div className="flex flex-col">
                                 <span className="text-4xl font-black tracking-tighter">{selectedFlight.origin.code}</span>
                                 <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mt-2">{selectedFlight.origin.city}</span>
                                 <span className="mt-3 text-[10px] font-black bg-white/10 px-4 py-1.5 rounded-full w-fit tracking-widest border border-white/5">
                                    {fmtTime(selectedFlight.departureTime)}
                                 </span>
                              </div>
                              <div className="flex-1 flex flex-col items-center px-6">
                                 <div className="w-full flex items-center gap-3">
                                    <div className="h-0.5 flex-1 bg-white/10 border-t border-dashed border-white/20"></div>
                                    <span className="material-symbols-outlined text-primary rotate-90 text-2xl drop-shadow-[0_0_12px_rgba(19,127,236,0.6)]">flight</span>
                                    <div className="h-0.5 flex-1 bg-white/10 border-t border-dashed border-white/20"></div>
                                 </div>
                                 <span className="text-[10px] font-black opacity-30 mt-3 uppercase tracking-[0.3em]">{selectedFlight.flightNumber}</span>
                              </div>
                              <div className="flex flex-col items-end">
                                 <span className="text-4xl font-black tracking-tighter">{selectedFlight.destination.code}</span>
                                 <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mt-2 text-right">{selectedFlight.destination.city}</span>
                                 <span className="mt-3 text-[10px] font-black bg-white/10 px-4 py-1.5 rounded-full w-fit tracking-widest border border-white/5">
                                    {fmtTime(selectedFlight.arrivalTime)}
                                 </span>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                 <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em] block mb-2">Aircraft</span>
                                 <span className="text-sm font-black tracking-tight">{selectedFlight.aircraft.type}</span>
                              </div>
                              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                 <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em] block mb-2">Gate</span>
                                 <span className="text-sm font-black tracking-tight">{selectedFlight.gate || 'Unassigned'}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}
               </div>

               {/* Right Panel: Delay Form */}
               <div className="lg:col-span-8 flex flex-col gap-10">
                  <div className="bg-white rounded-[3.5rem] border border-navy-100 p-12 shadow-sm space-y-12">
                     <div className="flex items-center justify-between border-b border-navy-50 pb-8">
                        <h2 className="text-2xl font-black text-navy-950 uppercase tracking-tighter flex items-center gap-4">
                           <span className="material-symbols-outlined text-primary p-2.5 bg-primary/5 rounded-2xl shadow-inner">schedule</span>
                           Record Flight Delay
                        </h2>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-1">New Departure Time</label>
                              <div className="flex flex-col sm:flex-row gap-4">
                                 <div className="relative flex-1">
                                    <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                                       className="w-full pl-12 pr-4 py-5 rounded-3xl border-none bg-navy-50 font-black text-navy-950 uppercase text-sm focus:ring-4 focus:ring-primary/5 shadow-inner" />
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300">calendar_today</span>
                                 </div>
                                 <div className="relative w-full sm:w-44">
                                    <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
                                       className="w-full pl-12 pr-4 py-5 rounded-3xl border-none bg-navy-50 font-black text-navy-950 text-sm focus:ring-4 focus:ring-primary/5 shadow-inner" />
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300">access_time</span>
                                 </div>
                              </div>
                           </div>
                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-1">Delay Duration (minutes)</label>
                              <input type="number" min={0} value={delayMinutes} onChange={e => setDelayMinutes(Number(e.target.value))}
                                 className="w-full py-5 px-8 rounded-3xl border-none bg-navy-50 font-black text-navy-950 uppercase text-sm focus:ring-4 focus:ring-primary/5 shadow-inner" />
                           </div>
                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-1">Delay Reason</label>
                              <div className="relative">
                                 <select value={reason} onChange={e => setReason(e.target.value as DelayReason)}
                                    className="w-full py-5 px-8 rounded-3xl border-none bg-navy-50 font-black text-navy-950 uppercase text-sm focus:ring-4 focus:ring-primary/5 appearance-none shadow-inner">
                                    {DELAY_REASONS.map(r => (
                                       <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                 </select>
                                 <span className="absolute right-6 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined pointer-events-none">expand_more</span>
                              </div>
                           </div>
                        </div>

                        {/* Impact Assessment */}
                        <div className="bg-navy-50/50 rounded-[3rem] p-10 border border-navy-100 flex flex-col justify-center space-y-8 shadow-inner">
                           <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] border-b border-navy-100 pb-4">Delay Summary</p>
                           <div className="flex items-center justify-between mb-4">
                              <span className="text-[11px] font-black text-navy-600 uppercase tracking-widest">Total Delay</span>
                              <span className={`text-3xl font-black tracking-tighter ${delayMinutes > 120 ? 'text-red-600' : delayMinutes > 60 ? 'text-orange-500' : 'text-navy-950'}`}>
                                 + {Math.floor(delayMinutes / 60)}h {delayMinutes % 60}m
                              </span>
                           </div>
                           <div className="w-full bg-navy-100 rounded-full h-3 overflow-hidden shadow-inner ring-4 ring-white">
                              <div className={`h-full rounded-full transition-all duration-500 ${delayMinutes > 180 ? 'bg-red-500' : delayMinutes > 60 ? 'bg-orange-500' : 'bg-emerald-500'
                                 }`} style={{ width: `${Math.min(100, (delayMinutes / 360) * 100)}%` }}></div>
                           </div>
                           {delayMinutes >= 180 && (
                              <div className="flex gap-4 p-5 bg-white rounded-2xl border border-red-100 shadow-md">
                                 <span className="material-symbols-outlined text-red-500 font-black text-xl">warning</span>
                                 <p className="text-[10px] font-bold text-red-700 uppercase leading-relaxed tracking-wider">
                                    Delay is over 3 hours. Passengers may need to be compensated under flight delay rules.
                                 </p>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex flex-wrap justify-end gap-6 pt-4 pb-12">
                     <button
                        onClick={() => { setSelectedFlightId(''); setDelayMinutes(0); setNewDate(''); setNewTime(''); setSuccess(''); setError(''); }}
                        className="px-12 py-5 bg-white border-2 border-navy-200 text-navy-700 font-black uppercase text-xs tracking-[0.3em] rounded-3xl hover:bg-navy-50 transition-all shadow-sm"
                     >Clear Form</button>
                     <button
                        onClick={handleSubmit}
                        disabled={submitting || !selectedFlightId}
                        className="px-14 py-5 bg-primary text-white font-black uppercase text-xs tracking-[0.3em] rounded-3xl shadow-2xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50"
                     >
                        <span className="material-symbols-outlined text-xl">send</span>
                        {submitting ? 'Saving...' : 'Submit Delay Update'}
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default ManageDelay;
