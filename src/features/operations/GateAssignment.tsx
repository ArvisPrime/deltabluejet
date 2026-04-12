
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';
import { getFlights } from '../../services/firestore';
import { assignGate, getUnassignedFlights, type GateConflict } from '../../services/disruptionService';
import type { FlightDoc } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';
import { toLocalDateString } from '../../utils/localDate';

const GATES = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4'];
const TERMINALS = ['Terminal 1', 'Terminal 2', 'Terminal 3'];

const GateAssignment: React.FC = () => {
   const [allFlights, setAllFlights] = useState<FlightDoc[]>([]);
   const [unassigned, setUnassigned] = useState<FlightDoc[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedFlightId, setSelectedFlightId] = useState('');
   const [selectedGate, setSelectedGate] = useState('');
   const [selectedTerminal, setSelectedTerminal] = useState(TERMINALS[0]);
   const [assigning, setAssigning] = useState(false);
   const [conflicts, setConflicts] = useState<GateConflict[]>([]);
   const [successMsg, setSuccessMsg] = useState('');
   const [sortBy, setSortBy] = useState<'time-asc' | 'time-desc' | 'flight'>('time-asc');
   const [filterDate, setFilterDate] = useState('');
   const [searchQuery, setSearchQuery] = useState('');

   const loadData = useCallback(async () => {
      setLoading(true);
      try {
         const [all, pending] = await Promise.all([
            getFlights({ maxResults: 200 }),
            getUnassignedFlights(),
         ]);
         setAllFlights(all.filter(f => f.status !== 'cancelled'));
         setUnassigned(pending);
      } catch (err) { console.error(err); useToastStore.getState().addToast(err instanceof Error ? err.message : "An unexpected error occurred", "error"); }
      finally { setLoading(false); }
   }, []);

   useEffect(() => { loadData(); }, [loadData]);

   const occupiedGates = allFlights.filter(f => f.gate && f.status !== 'cancelled');
   const usedGateSet = new Set(occupiedGates.map(f => `${f.gate}-${f.terminal}`));
   const availableGates = GATES.filter(g => !usedGateSet.has(`${g}-${selectedTerminal}`));

   const selectedFlight = allFlights.find(f => f.id === selectedFlightId);

   const handleAssign = async () => {
      if (!selectedFlightId || !selectedGate) return;
      const flight = allFlights.find(f => f.id === selectedFlightId);
      if (!flight) return;

      setAssigning(true);
      setConflicts([]);
      setSuccessMsg('');
      try {
         const result = await assignGate(selectedFlightId, selectedGate, selectedTerminal, flight);
         if (!result.success) {
            setConflicts(result.conflicts);
         } else {
            setSuccessMsg(`${flight.flightNumber} assigned to Gate ${selectedGate}, ${selectedTerminal}`);
            setSelectedFlightId('');
            setSelectedGate('');
            await loadData();
         }
      } catch (err: any) {
         setConflicts([]);
         setSuccessMsg('');
         useToastStore.getState().addToast(err.message || 'Failed to assign gate', 'error');
      } finally { setAssigning(false); }
   };

   const fmtTime = (ts: any) => ts?.toDate ? ts.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--';
   const fmtDate = (ts: any) => ts?.toDate ? ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--';

   const filteredUnassigned = useMemo(() => {
      let list = [...unassigned];
      if (searchQuery) {
         const q = searchQuery.toLowerCase();
         list = list.filter(f =>
            f.flightNumber.toLowerCase().includes(q) ||
            f.origin.code.toLowerCase().includes(q) ||
            f.destination.code.toLowerCase().includes(q)
         );
      }
      if (filterDate) {
         list = list.filter(f => {
            const dep = f.departureTime.toDate();
            return toLocalDateString(dep) === filterDate;
         });
      }
      list.sort((a, b) => {
         if (sortBy === 'time-asc') return a.departureTime.toDate().getTime() - b.departureTime.toDate().getTime();
         if (sortBy === 'time-desc') return b.departureTime.toDate().getTime() - a.departureTime.toDate().getTime();
         return a.flightNumber.localeCompare(b.flightNumber);
      });
      return list;
   }, [unassigned, sortBy, filterDate, searchQuery]);

   return (
      <div className="h-full flex flex-col p-8 overflow-hidden font-display">
         <div className="flex flex-col gap-4 mb-8 shrink-0">
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
               <Link to={ROUTES.DASHBOARD} className="hover:text-primary transition-colors">Operations</Link>
               <span className="material-symbols-outlined text-xs">chevron_right</span>
               <span className="text-primary" aria-current="page">Gate Assignment</span>
            </nav>
            <div className="flex justify-between items-end">
               <div className="space-y-1">
                  <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Gate Assignment</h1>
                  <p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">
                     {loading ? 'Loading...' : `${unassigned.length} unassigned • ${occupiedGates.length} occupied • ${availableGates.length} available`}
                  </p>
               </div>
            </div>
         </div>

         {/* Metrics */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
            {[
               { label: 'Awaiting Gate', val: String(unassigned.length), icon: 'pending_actions', color: 'text-orange-500' },
               { label: 'Available', val: String(availableGates.length), icon: 'meeting_room', color: 'text-emerald-500' },
               { label: 'Occupied', val: String(occupiedGates.length), icon: 'airplane_ticket', color: 'text-primary' },
               { label: 'Total Gates', val: String(GATES.length), icon: 'door_front', color: 'text-navy-400' },
            ].map((s, i) => (
               <div key={i} className="bg-white p-5 rounded-2xl border border-navy-100 shadow-sm group hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                     <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{s.label}</p>
                     <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
                  </div>
                  <p className="text-3xl font-black text-navy-950 tracking-tighter leading-none">{s.val}</p>
               </div>
            ))}
         </div>

         {/* Success / Conflict Messages */}
         {successMsg && (
            <div className="mb-6 flex items-center gap-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700">
               <span className="material-symbols-outlined">check_circle</span>
               <p className="text-sm font-black uppercase tracking-widest">{successMsg}</p>
            </div>
         )}
         {conflicts.length > 0 && (
            <div className="mb-6 p-5 bg-red-50 rounded-2xl border border-red-100 text-red-700 space-y-2">
               <p className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined">warning</span> Gate Conflict Detected
               </p>
               {conflicts.map(c => (
                  <p key={c.flightId} className="text-xs font-bold uppercase tracking-widest">
                     {c.flightNumber} occupies Gate {c.gate} ({fmtTime(c.departureTime)} – {fmtTime(c.arrivalTime)})
                  </p>
               ))}
            </div>
         )}

         <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
            {/* Unassigned Queue */}
            <div className="lg:w-[400px] flex flex-col bg-white rounded-3xl border border-navy-100 shadow-sm overflow-hidden shrink-0 max-h-[50vh] lg:max-h-none">
               <div className="p-5 border-b border-navy-100 flex items-center justify-between bg-navy-50/30">
                  <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest">Unassigned Queue</h3>
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{filteredUnassigned.length} Flights</span>
               </div>
               <div className="px-4 py-3 border-b border-navy-100 space-y-2 shrink-0 bg-white">
                  <input type="text" placeholder="Search flight or route..."
                     value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                     className="w-full px-4 py-2.5 rounded-xl bg-navy-50 border-none text-xs font-bold text-navy-800 placeholder:text-navy-300 focus:ring-2 focus:ring-primary/20" />
                  <div className="flex gap-2">
                     <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-navy-50 border-none text-[10px] font-bold text-navy-700 focus:ring-2 focus:ring-primary/20" />
                     <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                        className="flex-1 px-3 py-2 rounded-xl bg-navy-50 border-none text-[10px] font-bold text-navy-700 appearance-none focus:ring-2 focus:ring-primary/20">
                        <option value="time-asc">Soonest First</option>
                        <option value="time-desc">Latest First</option>
                        <option value="flight">Flight Number</option>
                     </select>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {loading ? (
                     <div className="flex items-center justify-center py-12">
                        <div className="animate-spin size-6 border-2 border-navy-200 border-t-primary rounded-full" />
                     </div>
                  ) : filteredUnassigned.length === 0 ? (
                     <p className="text-center text-xs font-black text-navy-300 uppercase tracking-widest py-12">{unassigned.length === 0 ? 'All flights assigned' : 'No flights match your filters'}</p>
                  ) : (
                     filteredUnassigned.map(f => (
                        <div key={f.id}
                           onClick={() => setSelectedFlightId(f.id)}
                           className={`flex flex-col p-5 border-2 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${selectedFlightId === f.id ? 'border-primary bg-primary/5' : 'bg-white border-navy-50 hover:border-navy-100'
                              }`}>
                           <div className="flex justify-between items-start mb-3">
                              <div className="space-y-1">
                                 <span className="font-black text-lg text-navy-950 tracking-tighter uppercase">{f.flightNumber}</span>
                                 <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-xs">flight</span>
                                    {f.origin.code} → {f.destination.code}
                                 </p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Departure</p>
                                 <p className="text-sm font-black text-navy-950 uppercase tracking-tight">{fmtDate(f.departureTime)}</p>
                                 <p className="text-[10px] font-bold text-navy-400">{fmtTime(f.departureTime)}</p>
                              </div>
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-navy-500 bg-navy-50 px-2 py-1 rounded-lg w-fit">{f.aircraft.type}</span>
                        </div>
                     ))
                  )}
               </div>
            </div>

            {/* Gate Grid */}
            <div className="flex-1 flex flex-col bg-white rounded-3xl border border-navy-100 shadow-sm overflow-hidden">
               <div className="p-5 border-b border-navy-100 flex flex-wrap gap-6 items-center justify-between bg-navy-50/30">
                  <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest">Gate Map</h3>
                  <div className="flex bg-white rounded-xl p-1 border border-navy-100 shadow-sm">
                     {TERMINALS.map((t) => (
                        <button key={t} onClick={() => setSelectedTerminal(t)}
                           className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedTerminal === t ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-navy-400 hover:bg-navy-50'
                              }`}>{t}</button>
                     ))}
                  </div>
               </div>

               {/* Confirm Assignment — positioned at TOP of Gate Map for immediate access */}
               {selectedFlightId && selectedGate && (
                  <div className="px-5 py-4 border-b border-navy-100 bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between gap-4 shrink-0">
                     <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-xl">flight_takeoff</span>
                        <p className="text-xs font-black text-navy-700 uppercase tracking-widest">
                           Assign <span className="text-primary">{selectedFlight?.flightNumber}</span> → Gate <span className="text-primary">{selectedGate}</span>, {selectedTerminal}
                        </p>
                     </div>
                     <button onClick={handleAssign} disabled={assigning}
                        className="px-8 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50 shrink-0">
                        {assigning ? 'Assigning...' : 'Assign Gate'}
                     </button>
                  </div>
               )}

               <div className="flex-1 overflow-y-auto p-6 bg-navy-50/10 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                     {GATES.map(gate => {
                        const occupant = occupiedGates.find(f => f.gate === gate && f.terminal === selectedTerminal);
                        const isAvailable = !occupant;

                        if (isAvailable) {
                           return (
                              <div key={gate}
                                 onClick={() => setSelectedGate(gate)}
                                 className={`border-2 border-dashed rounded-3xl p-6 flex flex-col gap-4 min-h-[180px] transition-all cursor-pointer shadow-sm ${selectedGate === gate ? 'border-primary bg-primary/5' : 'border-emerald-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/20'
                                    }`}>
                                 <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                       <div className="size-10 rounded-[1rem] bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm border border-emerald-100 shadow-inner">{gate}</div>
                                    </div>
                                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest border border-emerald-100">Available</span>
                                 </div>
                                 <div className="flex-1 flex flex-col items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-navy-100 text-4xl">{selectedGate === gate ? 'check_circle' : 'drag_indicator'}</span>
                                    <p className="text-[10px] font-black text-navy-300 uppercase tracking-[0.2em]">
                                       {selectedGate === gate ? 'Selected' : 'Click to Select'}
                                    </p>
                                 </div>
                              </div>
                           );
                        }

                        return (
                           <div key={gate} className="bg-white border-2 border-navy-50 rounded-3xl p-6 flex flex-col gap-4 min-h-[180px] relative overflow-hidden shadow-sm">
                              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
                              <div className="flex justify-between items-center">
                                 <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-[1rem] bg-primary/5 text-primary flex items-center justify-center font-black text-sm border border-primary/10 shadow-inner">{gate}</div>
                                 </div>
                                 <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-1 rounded-full uppercase tracking-widest">Occupied</span>
                              </div>
                              <div className="bg-navy-50/50 p-4 rounded-2xl space-y-2 border border-navy-100/50 shadow-inner">
                                 <div className="flex justify-between items-center">
                                    <span className="text-sm font-black text-navy-950 uppercase tracking-tighter">{occupant.flightNumber}</span>
                                    <span className="text-[10px] font-black text-navy-500 uppercase tracking-widest">{occupant.status}</span>
                                 </div>
                                 <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">
                                    {occupant.origin.code} → {occupant.destination.code} • {fmtTime(occupant.departureTime)}
                                 </p>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default GateAssignment;
