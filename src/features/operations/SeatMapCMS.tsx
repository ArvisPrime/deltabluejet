
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { logAuditEntry } from '../../services/firestore';
import { useToastStore } from '../../stores/toastStore';

// ─── Types ────────────────────────────────────────────────

type SeatStatus = 'available' | 'locked' | 'blocked' | 'occupied';
type ToolMode = 'select' | 'paint' | 'lock' | 'block';
type ViewMode = 'visual' | 'matrix';

interface SeatDef {
   id: string;          // e.g. "1A"
   row: number;
   col: string;
   zone: 'business' | 'economy' | 'exit';
   status: SeatStatus;
   seatClass: string;
   price: number;
   isExitRow: boolean;
   isBassinet: boolean;
   isAccessible: boolean;
}

// ─── Default seat layout for ERJ-120 ─────────────────────

function buildDefaultSeats(): SeatDef[] {
   const seats: SeatDef[] = [];
   const cols = ['A', 'B', 'C'];

   // Business: rows 1-3
   for (let r = 1; r <= 3; r++) {
      for (const c of cols) {
         seats.push({
            id: `${r}${c}`, row: r, col: c, zone: 'business',
            status: 'available', seatClass: 'Business', price: 450,
            isExitRow: false, isBassinet: false, isAccessible: false,
         });
      }
   }
   // Economy: rows 4-11
   for (let r = 4; r <= 11; r++) {
      for (const c of cols) {
         seats.push({
            id: `${r}${c}`, row: r, col: c, zone: 'economy',
            status: 'available', seatClass: 'Economy', price: 180,
            isExitRow: false, isBassinet: false, isAccessible: false,
         });
      }
   }
   // Exit row: row 12
   for (const c of cols) {
      seats.push({
         id: `12${c}`, row: 12, col: c, zone: 'exit',
         status: 'available', seatClass: 'Economy Plus (Exit)', price: 315,
         isExitRow: true, isBassinet: false, isAccessible: false,
      });
   }
   return seats;
}

const STATUS_STYLES: Record<SeatStatus, { border: string; bg: string; text: string }> = {
   available: { border: 'border-navy-50', bg: 'bg-white', text: 'text-navy-600' },
   locked: { border: 'border-dashed border-amber-400', bg: 'bg-amber-50', text: 'text-amber-700' },
   blocked: { border: 'border-red-400', bg: 'bg-red-50', text: 'text-red-700' },
   occupied: { border: 'border-navy-200', bg: 'bg-navy-100', text: 'text-navy-400' },
};

const BIZ_STYLES = { border: 'border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-700' };
const EXIT_STYLES = { border: 'border-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700' };

// ─── Component ────────────────────────────────────────────

const SeatMapCMS: React.FC = () => {
   const addToast = useToastStore((s) => s.addToast);

   // Core state
   const [seats, setSeats] = useState<SeatDef[]>(buildDefaultSeats);
   const [selectedSeatId, setSelectedSeatId] = useState<string | null>('12A');
   const [activeTool, setActiveTool] = useState<ToolMode>('select');
   const [viewMode, setViewMode] = useState<ViewMode>('visual');
   const [zoom, setZoom] = useState(100);
   const [saving, setSaving] = useState(false);
   const [loaded, setLoaded] = useState(false);

   // Load from Firestore on mount
   useEffect(() => {
      (async () => {
         try {
            const snap = await getDoc(doc(db, 'cms_config', 'seat_maps'));
            if (snap.exists()) {
               const data = snap.data();
               if (data?.seats?.length) {
                  setSeats(data.seats);
               }
            }
         } catch (err) {
            console.error('Failed to load seat map:', err);
         } finally {
            setLoaded(true);
         }
      })();
   }, []);

   const selectedSeat = useMemo(() => seats.find(s => s.id === selectedSeatId) || null, [seats, selectedSeatId]);

   // Seat counts by status
   const counts = useMemo(() => {
      const c = { available: 0, locked: 0, occupied: 0, blocked: 0 };
      seats.forEach(s => { c[s.status]++; });
      return c;
   }, [seats]);

   const occupancyPct = useMemo(() => Math.round((counts.occupied / seats.length) * 100), [counts, seats]);

   // ─── Handlers ─────────────────────────────────────

   const handleSeatClick = useCallback((seatId: string) => {
      if (activeTool === 'select') {
         setSelectedSeatId(seatId);
      } else {
         // Apply tool action to the seat
         const statusMap: Record<ToolMode, SeatStatus> = {
            select: 'available',
            paint: 'available',
            lock: 'locked',
            block: 'blocked',
         };
         setSeats(prev => prev.map(s => s.id === seatId ? { ...s, status: statusMap[activeTool] } : s));
         setSelectedSeatId(seatId);
      }
   }, [activeTool]);

   const handleStatusChange = useCallback((status: SeatStatus) => {
      if (!selectedSeatId) return;
      setSeats(prev => prev.map(s => s.id === selectedSeatId ? { ...s, status } : s));
   }, [selectedSeatId]);

   const handleSeatAttrChange = useCallback((field: keyof SeatDef, value: any) => {
      if (!selectedSeatId) return;
      setSeats(prev => prev.map(s => s.id === selectedSeatId ? { ...s, [field]: value } : s));
   }, [selectedSeatId]);

   const handleBulkLock = () => {
      const avail = seats.filter(s => s.status === 'available');
      if (avail.length === 0) { addToast('No available seats to lock', 'warning'); return; }
      setSeats(prev => prev.map(s => s.status === 'available' ? { ...s, status: 'locked' } : s));
      addToast(`${avail.length} available seats locked`, 'success');
   };

   const handleReleaseHolds = () => {
      const locked = seats.filter(s => s.status === 'locked');
      if (locked.length === 0) { addToast('No locked seats to release', 'info'); return; }
      setSeats(prev => prev.map(s => s.status === 'locked' ? { ...s, status: 'available' } : s));
      addToast(`${locked.length} seat holds released`, 'success');
   };

   const handleCrewBlock = () => {
      // Block last row as crew seats
      const crewRow = Math.max(...seats.map(s => s.row));
      setSeats(prev => prev.map(s => s.row === crewRow ? { ...s, status: 'blocked' } : s));
      addToast(`Row ${crewRow} blocked for crew`, 'success');
   };

   const handleRemoveSeat = () => {
      if (!selectedSeatId) return;
      if (!window.confirm(`Remove seat ${selectedSeatId} from the layout? This cannot be undone.`)) return;
      setSeats(prev => prev.filter(s => s.id !== selectedSeatId));
      setSelectedSeatId(null);
      addToast(`Seat ${selectedSeatId} removed from layout`, 'warning');
   };

   const handleSave = async () => {
      setSaving(true);
      try {
         await setDoc(doc(db, 'cms_config', 'seat_maps'), {
            aircraftType: 'ERJ-120',
            seats,
            totalSeats: seats.length,
            updatedAt: Timestamp.now(),
         }, { merge: true });

         try {
            await logAuditEntry({
               action: 'seat_map_saved',
               module: 'seat_map_cms',
               detail: `Saved seat map layout: ${seats.length} seats`,
               performedBy: 'admin',
            });
         } catch { /* non-critical */ }

         addToast('Seat map layout saved', 'success');
      } catch (err: any) {
         console.error('Failed to save seat map:', err);
         addToast('Failed to save. Please try again.', 'error');
      } finally {
         setSaving(false);
      }
   };

   // ─── Seat rendering helper ───────────────────────

   const getSeatStyle = (seat: SeatDef, isSelected: boolean) => {
      let style = STATUS_STYLES[seat.status];
      if (seat.zone === 'business' && seat.status === 'available') style = BIZ_STYLES;
      if (seat.zone === 'exit' && seat.status === 'available') style = EXIT_STYLES;

      return `${seat.zone === 'business' ? 'size-12' : seat.zone === 'exit' ? 'size-11' : 'size-10'} rounded-xl flex items-center justify-center text-[10px] font-black transition-all border-2 ${style.border} ${style.bg} ${style.text} cursor-pointer hover:border-primary hover:shadow-lg ${isSelected ? 'ring-4 ring-primary/30 scale-110 shadow-xl' : ''} ${seat.status === 'occupied' ? 'opacity-60' : ''}`;
   };

   // Group seats by row
   const rows = useMemo(() => {
      const map = new Map<number, SeatDef[]>();
      seats.forEach(s => {
         if (!map.has(s.row)) map.set(s.row, []);
         map.get(s.row)!.push(s);
      });
      return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
   }, [seats]);

   const businessRows = rows.filter(([_, s]) => s[0]?.zone === 'business');
   const economyRows = rows.filter(([_, s]) => s[0]?.zone === 'economy');
   const exitRows = rows.filter(([_, s]) => s[0]?.zone === 'exit');

   // ─── Render ───────────────────────────────────────

   return (
      <div className="h-full flex overflow-hidden bg-navy-50/30 font-display">
         {/* Left Sidebar */}
         <aside className="w-80 bg-white border-r border-navy-100 flex flex-col shrink-0 shadow-sm z-10">
            <div className="p-6 border-b border-navy-50 space-y-4">
               <label className="block space-y-2">
                  <span className="text-[10px] font-black text-navy-300 uppercase tracking-widest">Aircraft Layout</span>
                  <div className="relative group">
                     <select className="w-full h-12 pl-10 pr-4 bg-navy-50 border-none rounded-2xl text-sm font-black text-navy-950 focus:ring-2 focus:ring-primary/20 appearance-none">
                        <option>ERJ-120 (Standard Layout)</option>
                        <option>ERJ-120 Config A</option>
                     </select>
                     <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined">flight</span>
                     <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined">expand_more</span>
                  </div>
               </label>
               <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-navy-400 px-1">
                  <span>Total: {seats.length} Seats</span>
                  <span className="text-primary">Layout Type</span>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
               <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-navy-300 uppercase tracking-widest">Status Legend</h3>
                  <div className="space-y-2">
                     {[
                        { label: 'Available', count: counts.available, color: 'bg-white border-navy-200' },
                        { label: 'Locked / Pending', count: counts.locked, color: 'bg-amber-50 border-amber-400 border-dashed', icon: 'timer', iconCol: 'text-amber-500' },
                        { label: 'Occupied', count: counts.occupied, color: 'bg-navy-100 border-navy-200 opacity-60', icon: 'person', iconCol: 'text-navy-400' },
                        { label: 'Blocked / Crew', count: counts.blocked, color: 'bg-red-50 border-red-200', icon: 'block', iconCol: 'text-red-400' },
                     ].map((l, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-navy-50/50 border border-navy-50 shadow-inner group transition-all hover:bg-white">
                           <div className="flex items-center gap-3">
                              <div className={`size-8 rounded-lg border-2 flex items-center justify-center ${l.color}`}>
                                 {l.icon && <span className={`material-symbols-outlined text-xs ${l.iconCol}`}>{l.icon}</span>}
                              </div>
                              <span className="text-[10px] font-black text-navy-600 uppercase tracking-widest">{l.label}</span>
                           </div>
                           <span className="text-xs font-black text-navy-950">{l.count}</span>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-navy-300 uppercase tracking-widest">Bulk Actions</h3>
                  <div className="grid grid-cols-1 gap-2">
                     {[
                        { label: 'Lock Seats', sub: 'Reserve seats manually', icon: 'lock', color: 'bg-amber-50 text-amber-600', fn: handleBulkLock },
                        { label: 'Release Holds', sub: 'Clear expired seat holds', icon: 'history', color: 'bg-blue-50 text-blue-600', fn: handleReleaseHolds },
                        { label: 'Block Crew Seats', sub: 'Auto-assign crew seats', icon: 'shield_person', color: 'bg-navy-100 text-navy-700', fn: handleCrewBlock },
                     ].map((t, i) => (
                        <button onClick={t.fn} key={i} className="flex items-center gap-4 p-4 rounded-2xl border-2 border-transparent hover:border-navy-50 hover:bg-white transition-all text-left group shadow-sm">
                           <div className={`size-10 rounded-xl flex items-center justify-center shadow-inner ${t.color}`}>
                              <span className="material-symbols-outlined text-xl">{t.icon}</span>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-navy-900 uppercase tracking-widest group-hover:text-primary transition-colors">{t.label}</p>
                              <p className="text-[8px] font-bold text-navy-400 uppercase tracking-widest">{t.sub}</p>
                           </div>
                        </button>
                     ))}
                  </div>
               </div>
            </div>

            <div className="p-6 bg-navy-950 text-white rounded-t-[2rem]">
               <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Seat Occupancy</span>
                  <span className="text-xl font-black text-primary">{occupancyPct}%</span>
               </div>
               <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex">
                  <div className="bg-primary h-full transition-all" style={{ width: `${occupancyPct}%` }}></div>
                  <div className="bg-amber-500 h-full opacity-60 transition-all" style={{ width: `${Math.round((counts.locked / seats.length) * 100)}%` }}></div>
               </div>
               <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-30 mt-4 flex items-center gap-2">
                  <span className={`size-1.5 rounded-full ${loaded ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></span>
                  {loaded ? 'Live — Auto-saves' : 'Loading…'}
               </p>
            </div>
         </aside>

         {/* Main Content */}
         <div className="flex-1 flex flex-col min-w-0 relative">
            <header className="bg-white border-b border-navy-100 px-10 py-6 flex flex-wrap justify-between items-center shrink-0 shadow-sm z-10">
               <div className="space-y-1">
                  <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Seat Map Editor</h1>
                  <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest flex items-center gap-2">
                     <span className="px-2 py-0.5 rounded bg-primary text-white text-[8px]">Live</span>
                     ERJ-120 • N120DB • {seats.length} Seats
                  </p>
               </div>
               <div className="flex items-center gap-4">
                  <div className="flex bg-navy-50 p-1.5 rounded-2xl border border-navy-100">
                     <button onClick={() => setViewMode('visual')} className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === 'visual' ? 'bg-white text-navy-950 shadow-md' : 'text-navy-400 hover:bg-navy-100'}`}>Visual Edit</button>
                     <button onClick={() => setViewMode('matrix')} className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === 'matrix' ? 'bg-white text-navy-950 shadow-md' : 'text-navy-400 hover:bg-navy-100'}`}>Matrix View</button>
                  </div>
                  <button onClick={handleSave} disabled={saving} className="px-8 py-3.5 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50">
                     <span className="material-symbols-outlined text-lg">{saving ? 'progress_activity' : 'save'}</span>
                     {saving ? 'Saving…' : 'Save Layout'}
                  </button>
               </div>
            </header>

            {/* Toolbar */}
            <div className="absolute top-32 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/80 backdrop-blur-md px-6 py-2 rounded-full border border-navy-100 shadow-2xl z-20">
               <div className="flex gap-2">
                  {([
                     { mode: 'select' as ToolMode, icon: 'arrow_selector_tool', tip: 'Select' },
                     { mode: 'paint' as ToolMode, icon: 'brush', tip: 'Set Available' },
                     { mode: 'lock' as ToolMode, icon: 'lock', tip: 'Lock Seat' },
                     { mode: 'block' as ToolMode, icon: 'block', tip: 'Block Seat' },
                  ]).map(t => (
                     <button
                        key={t.mode}
                        onClick={() => setActiveTool(t.mode)}
                        title={t.tip}
                        className={`p-2 rounded-xl transition-all ${activeTool === t.mode ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-navy-400 hover:bg-navy-50'}`}
                     >
                        <span className="material-symbols-outlined text-xl">{t.icon}</span>
                     </button>
                  ))}
               </div>
               <div className="w-px h-8 bg-navy-100 mx-2"></div>
               <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-navy-400 tracking-widest">ZOOM</span>
                  <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="text-navy-300 hover:text-navy-600"><span className="material-symbols-outlined">remove</span></button>
                  <span className="text-xs font-black text-navy-950 w-10 text-center">{zoom}%</span>
                  <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="text-navy-300 hover:text-navy-600"><span className="material-symbols-outlined">add</span></button>
               </div>
            </div>

            {/* Visual View */}
            {viewMode === 'visual' && (
               <div className="flex-1 overflow-auto custom-scrollbar flex items-start justify-center p-24 pt-32 bg-navy-50/20">
                  <div
                     className="relative bg-white rounded-[130px] border-[6px] border-white ring-4 ring-navy-100/50 shadow-2xl w-[320px] min-h-[1100px] flex flex-col items-center py-24 select-none transition-transform"
                     style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                  >
                     {/* Cockpit */}
                     <div className="absolute top-0 w-full h-32 rounded-t-[125px] border-b-2 border-dashed border-navy-50 flex flex-col items-center justify-center bg-navy-50/10">
                        <span className="text-[9px] font-black text-navy-300 uppercase tracking-[0.3em] mt-8">Flight Deck</span>
                        <div className="mt-2 w-12 h-1 bg-navy-50 rounded-full"></div>
                     </div>

                     <div className="flex flex-col gap-6 w-full px-8 mt-12">
                        {/* Galley / Entry */}
                        <div className="flex justify-between items-center px-4 mb-6 opacity-30">
                           <div className="flex flex-col items-center gap-1"><span className="material-symbols-outlined">coffee_maker</span><span className="text-[8px] font-black">GALLEY</span></div>
                           <div className="flex flex-col items-center gap-1"><span className="material-symbols-outlined">meeting_room</span><span className="text-[8px] font-black">ENTRY</span></div>
                        </div>

                        {/* Business Zone */}
                        <div className="text-center py-2"><span className="bg-indigo-50 text-indigo-500 text-[8px] font-black px-4 py-1 rounded-full uppercase tracking-widest border border-indigo-100">Business / Zone 1</span></div>
                        {businessRows.map(([rowNum, rowSeats]) => (
                           <div key={rowNum} className="flex justify-between items-center group relative">
                              {rowSeats.filter(s => s.col === 'A').map(s => (
                                 <div key={s.id} onClick={() => handleSeatClick(s.id)} className={getSeatStyle(s, s.id === selectedSeatId)}>{s.id}</div>
                              ))}
                              <span className="text-[8px] font-black text-navy-100 rotate-90 tracking-widest">AISLE</span>
                              <div className="flex gap-2">
                                 {rowSeats.filter(s => s.col !== 'A').map(s => (
                                    <div key={s.id} onClick={() => handleSeatClick(s.id)} className={getSeatStyle(s, s.id === selectedSeatId)}>{s.id}</div>
                                 ))}
                              </div>
                           </div>
                        ))}

                        {/* Economy Divider */}
                        <div className="w-full h-px bg-navy-50 my-4 relative">
                           <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3"><span className="text-[8px] font-black text-navy-200 uppercase tracking-widest">Economy Cabin</span></div>
                        </div>

                        {/* Economy Rows */}
                        {economyRows.map(([rowNum, rowSeats]) => (
                           <div key={rowNum} className="flex justify-between items-center group relative">
                              {rowSeats.filter(s => s.col === 'A').map(s => (
                                 <div key={s.id} onClick={() => handleSeatClick(s.id)} className={getSeatStyle(s, s.id === selectedSeatId)}>
                                    {s.status === 'blocked' ? <span className="material-symbols-outlined text-xs">block</span> : s.id}
                                 </div>
                              ))}
                              <span className="text-[8px] font-black text-navy-50 opacity-0 group-hover:opacity-100 transition-all uppercase">{rowNum}</span>
                              <div className="flex gap-2">
                                 {rowSeats.filter(s => s.col !== 'A').map(s => (
                                    <div key={s.id} onClick={() => handleSeatClick(s.id)} className={getSeatStyle(s, s.id === selectedSeatId)}>
                                       {s.status === 'blocked' ? <span className="material-symbols-outlined text-xs">block</span> : s.id}
                                    </div>
                                 ))}
                              </div>
                           </div>
                        ))}

                        {/* Exit Rows */}
                        {exitRows.length > 0 && (
                           <div className="relative w-full py-4 px-2">
                              <div className="absolute inset-x-0 top-0 bottom-0 bg-emerald-50/40 border-y border-dashed border-emerald-200 -mx-8 px-8 flex items-center justify-between pointer-events-none">
                                 <span className="text-[7px] font-black text-emerald-500 uppercase tracking-[0.3em] rotate-[-90deg]">Emergency Exit Row</span>
                                 <span className="text-[7px] font-black text-emerald-500 uppercase tracking-[0.3em] rotate-[90deg]">Emergency Exit Row</span>
                              </div>
                              {exitRows.map(([rowNum, rowSeats]) => (
                                 <div key={rowNum} className="flex justify-between items-center relative z-10">
                                    {rowSeats.filter(s => s.col === 'A').map(s => (
                                       <div key={s.id} onClick={() => handleSeatClick(s.id)} className={getSeatStyle(s, s.id === selectedSeatId)}>{s.id}</div>
                                    ))}
                                    <div className="flex gap-2">
                                       {rowSeats.filter(s => s.col !== 'A').map(s => (
                                          <div key={s.id} onClick={() => handleSeatClick(s.id)} className={getSeatStyle(s, s.id === selectedSeatId)}>{s.id}</div>
                                       ))}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}

                        <div className="w-full flex justify-center py-4 opacity-20"><span className="material-symbols-outlined">more_vert</span></div>
                     </div>
                  </div>
               </div>
            )}

            {/* Matrix View */}
            {viewMode === 'matrix' && (
               <div className="flex-1 overflow-auto custom-scrollbar p-10 pt-28">
                  <div className="bg-white rounded-3xl border border-navy-100 overflow-hidden shadow-sm">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="border-b border-navy-100 bg-navy-50/30">
                              <th className="px-6 py-4 text-[10px] font-black text-navy-400 uppercase tracking-widest">Seat</th>
                              <th className="px-6 py-4 text-[10px] font-black text-navy-400 uppercase tracking-widest">Zone</th>
                              <th className="px-6 py-4 text-[10px] font-black text-navy-400 uppercase tracking-widest">Class</th>
                              <th className="px-6 py-4 text-[10px] font-black text-navy-400 uppercase tracking-widest">Status</th>
                              <th className="px-6 py-4 text-[10px] font-black text-navy-400 uppercase tracking-widest">Price</th>
                              <th className="px-6 py-4 text-[10px] font-black text-navy-400 uppercase tracking-widest">Features</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-50">
                           {seats.map(s => (
                              <tr
                                 key={s.id}
                                 onClick={() => { setSelectedSeatId(s.id); }}
                                 className={`cursor-pointer transition-all ${s.id === selectedSeatId ? 'bg-primary/5' : 'hover:bg-navy-50/50'}`}
                              >
                                 <td className="px-6 py-3 text-sm font-black text-navy-950">{s.id}</td>
                                 <td className="px-6 py-3 text-xs font-bold text-navy-500 uppercase">{s.zone}</td>
                                 <td className="px-6 py-3 text-xs font-bold text-navy-500">{s.seatClass}</td>
                                 <td className="px-6 py-3">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${s.status === 'available' ? 'bg-emerald-50 text-emerald-700' :
                                          s.status === 'locked' ? 'bg-amber-50 text-amber-700' :
                                             s.status === 'blocked' ? 'bg-red-50 text-red-700' :
                                                'bg-navy-100 text-navy-500'
                                       }`}>{s.status}</span>
                                 </td>
                                 <td className="px-6 py-3 text-sm font-black text-navy-700">${s.price}</td>
                                 <td className="px-6 py-3 text-xs text-navy-400">
                                    {[s.isExitRow && 'Exit', s.isBassinet && 'Bassinet', s.isAccessible && 'Accessible'].filter(Boolean).join(', ') || '—'}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}
         </div>

         {/* Right Sidebar — Seat Details */}
         <aside className="w-80 bg-white border-l border-navy-100 flex flex-col shrink-0 shadow-sm z-10">
            <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar">
               <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-navy-950 uppercase tracking-tight">Seat Details</h2>
                  {selectedSeat ? (
                     <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-indigo-600/20">SEAT {selectedSeat.id}</span>
                  ) : (
                     <span className="px-3 py-1 bg-navy-100 text-navy-400 text-[10px] font-black uppercase rounded-lg">No Seat Selected</span>
                  )}
               </div>

               {selectedSeat ? (
                  <>
                     <div className="bg-navy-50/50 p-6 rounded-[2rem] border border-navy-100 space-y-6">
                        <h3 className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Seat Status</h3>
                        <div className="grid grid-cols-2 gap-3">
                           {([
                              { status: 'available' as SeatStatus, lbl: 'Available', icon: 'check_circle', activeColor: 'text-emerald-600 border-emerald-200 bg-emerald-50' },
                              { status: 'locked' as SeatStatus, lbl: 'Locked', icon: 'lock', activeColor: 'text-amber-600 border-amber-200 bg-amber-50' },
                              { status: 'blocked' as SeatStatus, lbl: 'Blocked', icon: 'block', activeColor: 'text-red-600 border-red-200 bg-red-50' },
                              { status: 'occupied' as SeatStatus, lbl: 'Occupied', icon: 'person', activeColor: 'text-navy-600 border-navy-200 bg-navy-100' },
                           ]).map((s) => (
                              <button
                                 key={s.status}
                                 onClick={() => handleStatusChange(s.status)}
                                 className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${selectedSeat.status === s.status ? s.activeColor + ' shadow-md border-2' : 'border-navy-100 text-navy-400 bg-white hover:bg-navy-50'}`}
                              >
                                 <span className="material-symbols-outlined mb-2 text-xl">{s.icon}</span>
                                 <span className="text-[9px] font-black uppercase tracking-widest">{s.lbl}</span>
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="space-y-3">
                           <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Seat Class</span>
                           <select
                              value={selectedSeat.seatClass}
                              onChange={e => handleSeatAttrChange('seatClass', e.target.value)}
                              className="w-full h-14 px-6 bg-navy-50 border-none rounded-2xl text-xs font-black text-navy-950 uppercase focus:ring-2 focus:ring-primary/20 appearance-none"
                           >
                              <option>Business</option>
                              <option>Economy</option>
                              <option>Economy Plus (Exit)</option>
                           </select>
                        </div>
                        <div className="space-y-3">
                           <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Price Per Seat</span>
                           <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-navy-300">$</span>
                              <input
                                 type="number"
                                 value={selectedSeat.price}
                                 onChange={e => handleSeatAttrChange('price', parseFloat(e.target.value) || 0)}
                                 className="w-full h-14 pl-10 pr-6 bg-navy-50 border-none rounded-2xl text-sm font-black text-navy-950 focus:ring-2 focus:ring-primary/20"
                              />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6 pt-6 border-t border-navy-50">
                        <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Seat Features</span>
                        <div className="space-y-3">
                           {([
                              { key: 'isExitRow' as keyof SeatDef, lbl: 'Emergency Exit Row' },
                              { key: 'isBassinet' as keyof SeatDef, lbl: 'Bassinet Compatible' },
                              { key: 'isAccessible' as keyof SeatDef, lbl: 'Accessible Seat' },
                           ]).map((a) => (
                              <label key={a.key} className="flex items-center justify-between p-4 rounded-2xl bg-navy-50/30 border border-navy-50 transition-all hover:bg-white cursor-pointer group">
                                 <span className="text-[10px] font-black text-navy-700 uppercase tracking-widest group-hover:text-primary">{a.lbl}</span>
                                 <div className="relative inline-flex items-center h-6 rounded-full w-12 transition-all" onClick={() => handleSeatAttrChange(a.key, !selectedSeat[a.key])}>
                                    <input type="checkbox" checked={!!selectedSeat[a.key]} readOnly className="sr-only peer" />
                                    <div className="w-12 h-6 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                 </div>
                              </label>
                           ))}
                        </div>
                     </div>

                     <button onClick={handleRemoveSeat} className="w-full py-5 rounded-2xl bg-red-50 text-red-600 font-black uppercase text-[10px] tracking-[0.2em] border-2 border-dashed border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-lg">delete_forever</span>
                        Remove Seat
                     </button>
                  </>
               ) : (
                  <div className="text-center py-20 space-y-4">
                     <span className="material-symbols-outlined text-5xl text-navy-200">airline_seat_recline_normal</span>
                     <p className="text-sm font-black text-navy-300 uppercase tracking-widest">Click a seat to view details</p>
                  </div>
               )}
            </div>
         </aside>
      </div>
   );
};

export default SeatMapCMS;
