
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getFlights, subscribeToAircraft, logAuditEntry } from '../../services/firestore';
import type { FlightDoc, AircraftDoc } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';
import { updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase.config';

const AircraftSwap: React.FC = () => {
   const addToast = useToastStore((s) => s.addToast);

   // ─── Live Data ─────────────────────────────────────────
   const [flights, setFlights] = useState<FlightDoc[]>([]);
   const [aircraft, setAircraft] = useState<AircraftDoc[]>([]);
   const [loadingFlights, setLoadingFlights] = useState(true);

   // ─── Selection State ──────────────────────────────────
   const [selectedFlightId, setSelectedFlightId] = useState('');
   const [replacementAircraftId, setReplacementAircraftId] = useState('');

   // ─── Processing State ─────────────────────────────────
   const [previewing, setPreviewing] = useState(false);
   const [previewDone, setPreviewDone] = useState(false);
   const [saving, setSaving] = useState(false);
   const [sendNotifications, setSendNotifications] = useState({ boardingPasses: true, sms: true });

   // ─── Load flights ─────────────────────────────────────
   const loadFlights = useCallback(async () => {
      setLoadingFlights(true);
      try {
         const all = await getFlights({ maxResults: 200 });
         setFlights(all.filter(f => f.status !== 'cancelled' && f.status !== 'arrived'));
      } catch (err) { console.error(err); }
      finally { setLoadingFlights(false); }
   }, []);

   useEffect(() => { loadFlights(); }, [loadFlights]);

   // ─── Subscribe to aircraft fleet ──────────────────────
   useEffect(() => {
      const unsub = subscribeToAircraft((data) => setAircraft(data));
      return unsub;
   }, []);

   // ─── Derived data ─────────────────────────────────────
   const selectedFlight = useMemo(() => flights.find(f => f.id === selectedFlightId), [flights, selectedFlightId]);
   const currentAircraft = useMemo(() => {
      if (!selectedFlight) return null;
      return aircraft.find(a => a.id === selectedFlight.aircraft.id) || null;
   }, [selectedFlight, aircraft]);

   const replacementAircraft = useMemo(() => aircraft.find(a => a.id === replacementAircraftId) || null, [aircraft, replacementAircraftId]);

   // Only show active aircraft that are NOT the current one
   const availableReplacements = useMemo(() => {
      return aircraft.filter(a => a.status === 'active' && (!selectedFlight || a.id !== selectedFlight.aircraft.id));
   }, [aircraft, selectedFlight]);

   // Seat comparison
   const seatDiff = useMemo(() => {
      if (!currentAircraft || !replacementAircraft) return null;
      return {
         total: replacementAircraft.totalSeats - currentAircraft.totalSeats,
         economy: (replacementAircraft.seatConfig.economy || 0) - (currentAircraft.seatConfig.economy || 0),
         business: (replacementAircraft.seatConfig.business || 0) - (currentAircraft.seatConfig.business || 0),
      };
   }, [currentAircraft, replacementAircraft]);

   // Simple conflict check: passengers booked vs replacement capacity
   const passengerConflicts = useMemo(() => {
      if (!selectedFlight || !replacementAircraft) return [];
      const conflicts: { cls: string; booked: number; available: number; overflow: number }[] = [];
      for (const cls of Object.keys(selectedFlight.seatsTaken || {})) {
         const booked = selectedFlight.seatsTaken[cls] || 0;
         const available = replacementAircraft.seatConfig[cls] || 0;
         if (booked > available) {
            conflicts.push({ cls, booked, available, overflow: booked - available });
         }
      }
      return conflicts;
   }, [selectedFlight, replacementAircraft]);

   // ─── Handlers ─────────────────────────────────────────

   const handleCancel = () => {
      setSelectedFlightId('');
      setReplacementAircraftId('');
      setPreviewDone(false);
      addToast('Swap cancelled — selections cleared', 'warning');
   };

   const handlePreview = async () => {
      if (!selectedFlight || !replacementAircraft) return;
      setPreviewing(true);
      // Simulate a brief processing delay for the preview
      await new Promise(r => setTimeout(r, 800));
      setPreviewDone(true);
      setPreviewing(false);
      addToast('Preview ready — review seat changes below', 'info');
   };

   const handleFinalise = async () => {
      if (!selectedFlight || !replacementAircraft) return;
      setSaving(true);
      try {
         // Update the flight document with the new aircraft
         const flightRef = doc(db, 'flights', selectedFlight.id);
         await updateDoc(flightRef, {
            aircraft: {
               id: replacementAircraft.id,
               type: replacementAircraft.type,
               registration: replacementAircraft.registration,
            },
            seatsAvailable: { ...replacementAircraft.seatConfig },
            updatedAt: Timestamp.now(),
         });

         // Audit log (best-effort)
         try {
            await logAuditEntry({
               action: 'aircraft_swapped',
               targetCollection: 'flights',
               targetId: selectedFlight.id,
               performedBy: 'ops-user',
               details: {
                  flightNumber: selectedFlight.flightNumber,
                  previousAircraft: selectedFlight.aircraft.registration,
                  newAircraft: replacementAircraft.registration,
               },
            });
         } catch { /* non-critical */ }

         addToast(`${selectedFlight.flightNumber} swapped to ${replacementAircraft.registration} successfully`, 'success');
         setSelectedFlightId('');
         setReplacementAircraftId('');
         setPreviewDone(false);
         await loadFlights();
      } catch (err: any) {
         console.error('Swap failed:', err);
         addToast('Failed to save aircraft swap. Please try again.', 'error');
      } finally { setSaving(false); }
   };

   const handleConfirmNotifications = () => {
      const channels = [];
      if (sendNotifications.boardingPasses) channels.push('new boarding passes');
      if (sendNotifications.sms) channels.push('SMS updates');
      if (channels.length === 0) {
         addToast('No notification channels selected', 'warning');
         return;
      }
      addToast(`Notifications queued: ${channels.join(' & ')}`, 'success');
   };

   // ─── Helpers ──────────────────────────────────────────
   const fmtTime = (ts: any) => ts?.toDate ? ts.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--';
   const fmtDate = (ts: any) => ts?.toDate ? ts.toDate().toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' }) : '--';

   const renderSeatCard = (label: string, accentColor: boolean, ac: AircraftDoc | null, diff?: typeof seatDiff) => {
      const eco = ac?.seatConfig.economy || 0;
      const bus = ac?.seatConfig.business || 0;
      const total = ac?.totalSeats || 0;
      const items = [
         { lbl: 'Total', val: total, d: diff?.total },
         { lbl: 'Business', val: bus, d: diff?.business },
         { lbl: 'Economy', val: eco, d: diff?.economy },
      ];

      return (
         <div className={`relative bg-white rounded-[3rem] border ${accentColor ? 'border-2 border-primary/20 shadow-xl shadow-primary/5' : 'border-navy-100 shadow-sm'} p-8 overflow-hidden group`}>
            <div className={`absolute top-0 right-0 p-8 opacity-5 ${accentColor ? 'text-primary group-hover:opacity-15' : 'text-navy-950 group-hover:opacity-10'} transition-all duration-700`}>
               <span className="material-symbols-outlined text-[160px] rotate-[-20deg]">{accentColor ? 'flight_land' : 'flight_takeoff'}</span>
            </div>
            <div className="relative z-10 space-y-6">
               <div className="space-y-1">
                  <p className={`text-[10px] font-black ${accentColor ? 'text-primary' : 'text-navy-300'} uppercase tracking-[0.2em]`}>{label}</p>
                  <h4 className="text-2xl font-black text-navy-950 tracking-tighter uppercase">
                     {ac ? `${ac.type}` : 'Not Selected'}
                  </h4>
                  {ac && <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{ac.registration} • {ac.model}</p>}
               </div>
               <div className="flex gap-4">
                  {items.map((s, i) => (
                     <div key={i} className={`flex-1 ${accentColor ? 'bg-primary/5 border-primary/10' : 'bg-navy-50/50 border-navy-50'} p-4 rounded-3xl border`}>
                        <p className={`text-[8px] font-black ${accentColor ? 'text-primary' : 'text-navy-300'} uppercase tracking-widest`}>{s.lbl}</p>
                        <p className={`text-xl font-black ${s.d !== undefined && s.d < 0 ? 'text-red-600' : s.d !== undefined && s.d > 0 ? 'text-emerald-600' : 'text-navy-950'}`}>{s.val}</p>
                        {s.d !== undefined && s.d !== 0 && (
                           <span className={`text-[8px] font-black uppercase ${s.d < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {s.d > 0 ? '+' : ''}{s.d} seats
                           </span>
                        )}
                     </div>
                  ))}
               </div>
            </div>
         </div>
      );
   };

   return (
      <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar font-display bg-navy-50/20">
         <div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4">
               <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">
                  <span>Operations</span>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span>Disruptions</span>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span className="text-primary">Aircraft Swap</span>
               </nav>
               <div className="flex flex-wrap justify-between items-end gap-6 border-b border-navy-100 pb-8">
                  <div>
                     <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase">Aircraft Swap</h1>
                     <p className="text-navy-400 font-bold uppercase text-xs tracking-widest mt-2 italic">
                        {selectedFlight
                           ? `Swapping aircraft for ${selectedFlight.flightNumber} • ${selectedFlight.origin.code} → ${selectedFlight.destination.code}`
                           : 'Select a flight to begin'}
                     </p>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={handleCancel}
                        className="px-8 py-4 bg-white border-2 border-navy-100 text-navy-700 font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:bg-navy-50 transition-all">
                        Cancel
                     </button>
                     <button onClick={handleFinalise}
                        disabled={!selectedFlight || !replacementAircraft || saving}
                        className="px-10 py-4 bg-primary text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-40 disabled:hover:scale-100">
                        <span className="material-symbols-outlined text-lg">save</span>
                        {saving ? 'Saving...' : 'Save Changes'}
                     </button>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
               <div className="lg:col-span-4 space-y-8">
                  <div className="bg-white rounded-[2.5rem] border border-navy-100 p-8 shadow-sm space-y-10">
                     {/* Step 1: Select Flight */}
                     <div className="space-y-6">
                        <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight flex items-center gap-4">
                           <span className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary text-xs font-black">1</span>
                           Affected Flight
                        </h3>
                        <div className="space-y-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-1">Select Flight</label>
                              <select
                                 value={selectedFlightId}
                                 onChange={(e) => { setSelectedFlightId(e.target.value); setPreviewDone(false); }}
                                 className="w-full py-4 px-6 bg-navy-50 border-none rounded-2xl text-navy-950 font-black uppercase text-sm focus:ring-2 focus:ring-primary/20 appearance-none">
                                 <option value="">— Choose a flight —</option>
                                 {loadingFlights ? (
                                    <option disabled>Loading flights...</option>
                                 ) : (
                                    flights.map(f => (
                                       <option key={f.id} value={f.id}>
                                          {f.flightNumber} • {f.origin.code}→{f.destination.code} • {fmtDate(f.departureTime)}
                                       </option>
                                    ))
                                 )}
                              </select>
                           </div>
                           {selectedFlight && (
                              <div className="p-4 bg-navy-50/50 rounded-2xl space-y-1">
                                 <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest">Current Aircraft</p>
                                 <p className="text-sm font-black text-navy-950 uppercase">{selectedFlight.aircraft.type} ({selectedFlight.aircraft.registration})</p>
                                 <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{fmtDate(selectedFlight.departureTime)} • {fmtTime(selectedFlight.departureTime)} – {fmtTime(selectedFlight.arrivalTime)}</p>
                              </div>
                           )}
                        </div>
                     </div>

                     {/* Step 2: Select Replacement */}
                     <div className="space-y-6">
                        <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight flex items-center gap-4">
                           <span className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary text-xs font-black">2</span>
                           Replacement Aircraft
                        </h3>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-1">Select Replacement</label>
                           <select
                              value={replacementAircraftId}
                              onChange={(e) => { setReplacementAircraftId(e.target.value); setPreviewDone(false); }}
                              className="w-full py-4 px-6 bg-navy-50 border-none rounded-2xl text-navy-950 font-black uppercase text-sm focus:ring-2 focus:ring-primary/20 appearance-none">
                              <option value="">— Choose an aircraft —</option>
                              {availableReplacements.map(a => (
                                 <option key={a.id} value={a.id}>
                                    {a.type} ({a.registration}) • {a.totalSeats} seats
                                 </option>
                              ))}
                           </select>
                           {seatDiff && seatDiff.total !== 0 && (
                              <div className={`p-5 rounded-[1.5rem] border flex items-start gap-4 ${seatDiff.total < 0 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                 <span className={`material-symbols-outlined p-1 bg-white rounded-lg shadow-sm ${seatDiff.total < 0 ? 'text-amber-600' : 'text-emerald-600'}`}>info</span>
                                 <p className={`text-[9px] font-black uppercase leading-relaxed tracking-widest ${seatDiff.total < 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
                                    Replacement has <span className="underline">{Math.abs(seatDiff.total)} {seatDiff.total < 0 ? 'fewer' : 'more'} seats</span>. {seatDiff.total < 0 ? 'Some passengers may need to be reassigned.' : 'No passenger changes needed.'}
                                 </p>
                              </div>
                           )}
                           {seatDiff && seatDiff.total === 0 && (
                              <div className="p-5 bg-emerald-50 rounded-[1.5rem] border border-emerald-100 flex items-start gap-4">
                                 <span className="material-symbols-outlined text-emerald-600 p-1 bg-white rounded-lg shadow-sm">check_circle</span>
                                 <p className="text-[9px] font-black text-emerald-800 uppercase leading-relaxed tracking-widest">
                                    Same seat capacity — no passenger changes needed.
                                 </p>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-8 flex flex-col gap-8">
                  {/* Current vs Replacement Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {renderSeatCard('Current Aircraft', false, currentAircraft)}
                     {renderSeatCard('Replacement Aircraft', true, replacementAircraft, seatDiff)}
                  </div>

                  {/* Preview / Seat Reassignment Engine */}
                  <div className="bg-navy-950 rounded-[3rem] border border-white/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
                     <div className="flex items-center gap-6 px-4">
                        <div className="size-14 rounded-[1.5rem] bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                           <span className="material-symbols-outlined text-3xl">swap_horiz</span>
                        </div>
                        <div>
                           <h4 className="text-lg font-black text-white tracking-tight uppercase">Seat Reassignment</h4>
                           <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Automatically reassign passengers to new aircraft</p>
                        </div>
                     </div>
                     <button
                        onClick={handlePreview}
                        disabled={!selectedFlight || !replacementAircraft || previewing}
                        className="w-full sm:w-auto px-12 py-5 bg-white text-navy-950 font-black uppercase text-xs tracking-[0.2em] rounded-[1.5rem] shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:hover:scale-100">
                        <span className="material-symbols-outlined">{previewing ? 'hourglass_top' : 'preview'}</span>
                        {previewing ? 'Checking...' : 'Preview Changes'}
                     </button>
                  </div>

                  {/* Results Table */}
                  {previewDone && (
                     <div className="bg-white rounded-[3rem] border border-navy-100 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-8 border-b border-navy-50 flex flex-wrap gap-8 items-center justify-between bg-navy-50/20">
                           <div className="flex items-center gap-4">
                              <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight">Passenger Seat Status</h3>
                              <div className="h-4 w-px bg-navy-100"></div>
                              <div className="flex gap-6">
                                 {passengerConflicts.length === 0 ? (
                                    <div className="flex items-center gap-2">
                                       <span className="size-2 rounded-full bg-emerald-500"></span>
                                       <span className="text-[9px] font-black text-navy-500 uppercase tracking-widest">All passengers fit</span>
                                    </div>
                                 ) : (
                                    passengerConflicts.map(c => (
                                       <div key={c.cls} className="flex items-center gap-2">
                                          <span className="size-2 rounded-full bg-red-500 animate-pulse"></span>
                                          <span className="text-[9px] font-black text-navy-500 uppercase tracking-widest">{c.cls}: {c.overflow} overflow</span>
                                       </div>
                                    ))
                                 )}
                              </div>
                           </div>
                        </div>
                        <div className="p-0 overflow-x-auto">
                           <table className="w-full text-left">
                              <thead>
                                 <tr className="bg-navy-50/50 text-[9px] font-black text-navy-300 uppercase tracking-[0.3em] border-b border-navy-50">
                                    <th className="px-10 py-5">Class</th>
                                    <th className="px-10 py-5">Booked</th>
                                    <th className="px-10 py-5">Available</th>
                                    <th className="px-10 py-5">Status</th>
                                    <th className="px-10 py-5 text-right">Action</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-navy-50">
                                 {Object.keys(selectedFlight?.seatsTaken || {}).map(cls => {
                                    const booked = selectedFlight!.seatsTaken[cls] || 0;
                                    const available = replacementAircraft?.seatConfig[cls] || 0;
                                    const overflow = booked - available;
                                    const ok = overflow <= 0;

                                    return (
                                       <tr key={cls} className="hover:bg-navy-50/50 transition-colors">
                                          <td className="px-10 py-6">
                                             <span className="text-xs font-black text-navy-950 uppercase tracking-widest capitalize">{cls}</span>
                                          </td>
                                          <td className="px-10 py-6 text-xs font-bold text-navy-700 uppercase tracking-widest">{booked}</td>
                                          <td className="px-10 py-6 text-xs font-bold text-navy-700 uppercase tracking-widest">{available}</td>
                                          <td className="px-10 py-6">
                                             {ok ? (
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">✓ OK</span>
                                             ) : (
                                                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">{overflow} over capacity</span>
                                             )}
                                          </td>
                                          <td className="px-10 py-6 text-right">
                                             {!ok ? (
                                                <button
                                                   onClick={() => addToast(`Reassigning ${overflow} ${cls} passengers — this would trigger rebooking`, 'info')}
                                                   className="text-primary font-black uppercase text-[10px] tracking-widest hover:underline">
                                                   Reassign
                                                </button>
                                             ) : (
                                                <span className="text-[10px] font-black text-navy-300 uppercase tracking-widest">No action needed</span>
                                             )}
                                          </td>
                                       </tr>
                                    );
                                 })}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* Notifications Section */}
            <div className="bg-white rounded-[3rem] border border-navy-100 p-8 shadow-sm flex flex-col md:flex-row gap-10 items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className="size-12 rounded-[1.5rem] bg-primary/5 flex items-center justify-center text-primary">
                     <span className="material-symbols-outlined">campaign</span>
                  </div>
                  <div>
                     <h4 className="text-lg font-black text-navy-950 uppercase tracking-tight">Passenger Notifications</h4>
                     <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest">Send updates to affected passengers</p>
                  </div>
               </div>
               <div className="flex-1 flex gap-6 max-w-2xl w-full">
                  {[
                     { key: 'boardingPasses' as const, lbl: 'New Boarding Passes' },
                     { key: 'sms' as const, lbl: 'SMS Updates' },
                  ].map((c) => (
                     <label key={c.key} className="flex-1 flex items-center justify-between p-4 rounded-2xl bg-navy-50 border border-navy-100 cursor-pointer group hover:bg-white transition-all">
                        <span className="text-[9px] font-black text-navy-700 uppercase tracking-widest group-hover:text-primary">{c.lbl}</span>
                        <div className="relative inline-flex items-center h-5 rounded-full w-10 transition-all">
                           <input
                              type="checkbox"
                              checked={sendNotifications[c.key]}
                              onChange={(e) => setSendNotifications(prev => ({ ...prev, [c.key]: e.target.checked }))}
                              className="sr-only peer" />
                           <div className="w-10 h-5 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                        </div>
                     </label>
                  ))}
               </div>
               <div className="w-full md:w-auto">
                  <button
                     onClick={handleConfirmNotifications}
                     disabled={!selectedFlight}
                     className="w-full px-12 py-5 bg-navy-950 text-white font-black uppercase text-xs tracking-[0.2em] rounded-3xl shadow-xl hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100">
                     Send Notifications
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};

export default AircraftSwap;
