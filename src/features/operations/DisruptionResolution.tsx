
import React, { useState, useEffect, useCallback } from 'react';
import {
   getDisruptedFlights,
   cancelFlight,
   getAlternativeFlights,
   rebookPassengers,
   type AffectedBooking,
} from '../../services/disruptionService';
import type { FlightDoc } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';

const DisruptionResolution: React.FC = () => {
   const [flights, setFlights] = useState<FlightDoc[]>([]);
   const [selectedId, setSelectedId] = useState('');
   const [loading, setLoading] = useState(true);
   const [cancelReason, setCancelReason] = useState('');
   const [cancelling, setCancelling] = useState(false);
   const [affected, setAffected] = useState<AffectedBooking[]>([]);
   const [alternatives, setAlternatives] = useState<FlightDoc[]>([]);
   const [rebookTargetId, setRebookTargetId] = useState('');
   const [rebooking, setRebooking] = useState(false);
   const [successMsg, setSuccessMsg] = useState('');
   const [errorMsg, setErrorMsg] = useState('');

   const loadDisruptions = useCallback(async () => {
      setLoading(true);
      try {
         const data = await getDisruptedFlights();
         setFlights(data);
      } catch (err) { console.error(err); useToastStore.getState().addToast(err instanceof Error ? err.message : "An unexpected error occurred", "error"); }
      finally { setLoading(false); }
   }, []);

   useEffect(() => { loadDisruptions(); }, [loadDisruptions]);

   const selected = flights.find(f => f.id === selectedId);

   const handleCancel = async () => {
      if (!selectedId || !cancelReason) {
         setErrorMsg('Please enter a cancellation reason.');
         return;
      }
      setCancelling(true);
      setErrorMsg('');
      setSuccessMsg('');
      try {
         const bookings = await cancelFlight(selectedId, cancelReason);
         setAffected(bookings);
         setSuccessMsg(`Flight cancelled. ${bookings.length} booking(s) affected.`);

         if (selected) {
            const alts = await getAlternativeFlights(selected.origin.code, selected.destination.code);
            setAlternatives(alts.filter(f => f.id !== selectedId));
         }
         await loadDisruptions();
      } catch (err: any) {
         setErrorMsg(err.message || 'Failed to cancel flight');
      } finally { setCancelling(false); }
   };

   const handleRebook = async () => {
      if (!rebookTargetId || affected.length === 0) return;
      setRebooking(true);
      setErrorMsg('');
      try {
         const ids = affected.map(b => b.id);
         const result = await rebookPassengers(ids, rebookTargetId);
         setSuccessMsg(`${result.rebooked} passenger(s) rebooked successfully.`);
         setAffected([]);
         setAlternatives([]);
         setRebookTargetId('');
      } catch (err: any) {
         setErrorMsg(err.message || 'Rebooking failed');
      } finally { setRebooking(false); }
   };

   const fmtTime = (ts: any) => ts?.toDate ? ts.toDate().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--';

   return (
      <div className="h-full flex overflow-hidden font-sans bg-navy-50/20">
         {/* Triage List */}
         <aside className="w-96 flex-shrink-0 bg-white border-r border-navy-100 flex flex-col h-full shadow-sm z-10">
            <div className="p-6 border-b border-navy-50 space-y-4">
               <h2 className="text-xl font-black text-navy-950 uppercase tracking-tight flex items-center justify-between">
                  Disruption Triage
                  <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-black tracking-widest">
                     {flights.length} ACTIVE
                  </span>
               </h2>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-navy-50">
               {loading ? (
                  <div className="flex items-center justify-center py-12">
                     <div className="animate-spin size-6 border-2 border-navy-200 border-t-primary rounded-full" />
                  </div>
               ) : flights.length === 0 ? (
                  <p className="text-center text-xs font-black text-navy-300 uppercase tracking-widest py-12">No disruptions</p>
               ) : (
                  flights.map(f => (
                     <div
                        key={f.id}
                        onClick={() => { setSelectedId(f.id); setAffected([]); setAlternatives([]); setSuccessMsg(''); setErrorMsg(''); }}
                        className={`p-6 border-l-4 cursor-pointer transition-all ${selectedId === f.id
                           ? 'bg-primary/5 border-primary shadow-inner'
                           : 'border-transparent hover:bg-navy-50/50'
                           }`}
                     >
                        <div className="flex justify-between items-start mb-3">
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${f.status === 'cancelled' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                              }`}>{f.status}</span>
                           {f.delayMinutes > 0 && (
                              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">+{f.delayMinutes}m</span>
                           )}
                        </div>
                        <h3 className="text-sm font-black text-navy-950 uppercase tracking-tight mb-2">{f.flightNumber}</h3>
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">
                           {f.origin.code} → {f.destination.code} • {fmtTime(f.departureTime)}
                        </p>
                        {f.delayReason && (
                           <p className="text-[10px] font-bold text-navy-400 mt-2 uppercase tracking-widest italic">{f.delayReason}</p>
                        )}
                     </div>
                  ))
               )}
            </div>
         </aside>

         {/* Main Workspace */}
         <main className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar p-10 bg-navy-50/10">
            {!selected ? (
               <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-4">
                     <span className="material-symbols-outlined text-6xl text-navy-100">flight_land</span>
                     <p className="text-sm font-black text-navy-300 uppercase tracking-widest">Select a disrupted flight to manage</p>
                  </div>
               </div>
            ) : (
               <div className="max-w-5xl mx-auto w-full space-y-10 animate-in fade-in duration-300">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                     <div>
                        <div className="flex items-center gap-4 mb-2">
                           <h2 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">{selected.flightNumber}</h2>
                           <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] shadow-lg uppercase ${selected.status === 'cancelled' ? 'bg-red-600 text-white shadow-red-500/30' : 'bg-amber-500 text-white shadow-amber-500/30'
                              }`}>{selected.status}</span>
                        </div>
                        <p className="text-navy-500 font-medium italic text-lg">
                           {selected.origin.code} → {selected.destination.code} • {fmtTime(selected.departureTime)}
                        </p>
                     </div>
                  </div>

                  {/* Messages */}
                  {successMsg && (
                     <div className="flex items-center gap-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700">
                        <span className="material-symbols-outlined">check_circle</span>
                        <p className="text-sm font-black uppercase tracking-widest">{successMsg}</p>
                     </div>
                  )}
                  {errorMsg && (
                     <div className="flex items-center gap-4 p-5 bg-red-50 rounded-2xl border border-red-100 text-red-700">
                        <span className="material-symbols-outlined">error</span>
                        <p className="text-sm font-black uppercase tracking-widest">{errorMsg}</p>
                     </div>
                  )}

                  {/* Cancel Section — only for non-cancelled flights */}
                  {selected.status !== 'cancelled' && (
                     <div className="bg-white rounded-[2.5rem] border border-navy-100 p-8 shadow-sm space-y-8">
                        <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight flex items-center gap-3">
                           <span className="material-symbols-outlined text-red-500">cancel</span>
                           Flight Cancellation
                        </h3>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Cancellation Reason</label>
                           <textarea
                              value={cancelReason}
                              onChange={e => setCancelReason(e.target.value)}
                              className="w-full p-6 rounded-2xl bg-navy-50 border-none text-navy-950 font-bold text-sm focus:ring-4 focus:ring-primary/5 resize-none uppercase"
                              rows={3}
                              placeholder="Enter the reason for cancellation..."
                           />
                        </div>
                        <div className="flex justify-end">
                           <button onClick={handleCancel} disabled={cancelling || !cancelReason}
                              className="px-10 py-4 bg-red-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-red-500/20 hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-3">
                              <span className="material-symbols-outlined">block</span>
                              {cancelling ? 'Cancelling...' : 'Cancel Flight'}
                           </button>
                        </div>
                     </div>
                  )}

                  {/* Affected Bookings */}
                  {affected.length > 0 && (
                     <div className="bg-white rounded-[2.5rem] border border-navy-100 p-8 shadow-sm space-y-6">
                        <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight flex items-center gap-3">
                           <span className="material-symbols-outlined text-orange-500">group</span>
                           Affected Passengers ({affected.length} bookings)
                        </h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                           {affected.map(b => (
                              <div key={b.id} className="flex items-center justify-between p-4 bg-navy-50/50 rounded-2xl border border-navy-100">
                                 <div className="flex items-center gap-4">
                                    <span className="font-mono bg-white px-3 py-1.5 rounded-xl border border-navy-100 text-sm font-black text-navy-800">{b.pnr}</span>
                                    <span className="text-[10px] font-black text-navy-500 uppercase tracking-widest">{b.passengerCount} pax</span>
                                 </div>
                                 <span className="text-[10px] font-bold text-navy-400 truncate max-w-48">{b.contactEmail}</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* Rebooking Assistant */}
                  {alternatives.length > 0 && (
                     <div className="bg-white rounded-[2.5rem] border border-navy-100 p-8 shadow-sm space-y-6">
                        <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight flex items-center gap-3">
                           <span className="material-symbols-outlined text-primary">swap_horiz</span>
                           Rebooking Assistant
                        </h3>
                        <p className="text-xs font-bold text-navy-500 uppercase tracking-widest">
                           Alternative flights on {selected.origin.code} → {selected.destination.code}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {alternatives.map(alt => (
                              <div key={alt.id}
                                 onClick={() => setRebookTargetId(alt.id)}
                                 className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${rebookTargetId === alt.id ? 'border-primary bg-primary/5 shadow-lg' : 'border-navy-100 bg-white hover:border-navy-300'
                                    }`}>
                                 <div className="flex justify-between items-start mb-4">
                                    <span className="text-xl font-black text-navy-950 tracking-tighter uppercase">{alt.flightNumber}</span>
                                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                       {Object.values(alt.seatsAvailable).reduce((a, b) => a + b, 0)} seats left
                                    </span>
                                 </div>
                                 <p className="text-xs font-black text-navy-500 uppercase tracking-widest">{fmtTime(alt.departureTime)} → {fmtTime(alt.arrivalTime)}</p>
                                 <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mt-2">{alt.aircraft.type}</p>
                              </div>
                           ))}
                        </div>
                        {rebookTargetId && (
                           <div className="flex justify-end pt-4">
                              <button onClick={handleRebook} disabled={rebooking}
                                 className="px-10 py-4 bg-primary text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-3">
                                 <span className="material-symbols-outlined">check_circle</span>
                                 {rebooking ? 'Rebooking...' : `Rebook ${affected.length} Passengers`}
                              </button>
                           </div>
                        )}
                     </div>
                  )}
               </div>
            )}
         </main>
      </div>
   );
};

export default DisruptionResolution;
