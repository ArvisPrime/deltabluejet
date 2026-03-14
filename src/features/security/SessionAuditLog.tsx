
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { useToastStore } from '../../stores/toastStore';

/* ── Types ───────────────────────────────────────────────── */
interface AuditEntry {
   id: string;
   ts: string;
   hour: string;
   actor: string;
   avatar: string;
   action: string;
   color: string;
   icon: string;
   target: string;
   desc: string;
   ip: string;
   timestamp?: Timestamp;
}

type ActionFilter = 'Termination' | 'Policy Change' | 'Timeout' | 'Access' | 'Failed Login';

const ACTION_FILTERS: { key: ActionFilter; label: string }[] = [
   { key: 'Termination', label: 'Force Logout' },
   { key: 'Policy Change', label: 'Settings Changed' },
   { key: 'Timeout', label: 'Session Expired' },
   { key: 'Access', label: 'Login Successful' },
   { key: 'Failed Login', label: 'Failed Login' },
];




const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/* ════════════════════════════════════════════════════════════
   Session Audit Log Component
   ════════════════════════════════════════════════════════════ */
const SessionAuditLog: React.FC = () => {
   const addToast = useToastStore(s => s.addToast);

   /* ── State ──────────────────────────────────────────── */
   const [logs, setLogs] = useState<AuditEntry[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState('');
   const [adminFilter, setAdminFilter] = useState('');
   const [activeFilters, setActiveFilters] = useState<Set<ActionFilter>>(new Set(['Termination', 'Policy Change', 'Timeout', 'Access', 'Failed Login']));
   const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
   const [page, setPage] = useState(0);
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const PAGE_SIZE = 10;

   // Calendar state
   const now = new Date();
   const [calYear, setCalYear] = useState(now.getFullYear());
   const [calMonth, setCalMonth] = useState(now.getMonth());
   const [selectedDay, setSelectedDay] = useState<number | null>(null);

   /* ── Load data ────────────────────────────────────── */
   const loadData = useCallback(async () => {
      setLoading(true);
      try {
         const snap = await getDocs(query(collection(db, 'session_audit_log'), orderBy('timestamp', 'desc'), limit(200)));
         setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }) as AuditEntry));
      } catch (err) {
         console.error('[AuditLog] Load error:', err);
         addToast('Failed to load audit logs', 'error');
      } finally {
         setLoading(false);
      }
   }, [addToast]);

   useEffect(() => { loadData(); }, [loadData]);

   /* ── Calendar helpers ─────────────────────────────── */
   const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
   const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();

   const prevMonth = () => {
      if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
      else setCalMonth(m => m - 1);
      setSelectedDay(null);
   };

   const nextMonth = () => {
      if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
      else setCalMonth(m => m + 1);
      setSelectedDay(null);
   };

   const handleDayClick = (day: number) => {
      setSelectedDay(prev => prev === day ? null : day);
      setPage(0);
   };

   /* ── Filter toggles ───────────────────────────────── */
   const toggleFilter = (key: ActionFilter) => {
      setActiveFilters(prev => {
         const next = new Set(prev);
         if (next.has(key)) next.delete(key); else next.add(key);
         return next;
      });
      setPage(0);
   };

   const resetFilters = () => {
      setSearchQuery('');
      setAdminFilter('');
      setActiveFilters(new Set(['Termination', 'Policy Change', 'Timeout', 'Access', 'Failed Login']));
      setSelectedDay(null);
      setSortOrder('newest');
      setPage(0);
      addToast('All filters reset', 'info');
   };

   /* ── Filtering + Sorting ──────────────────────────── */
   const filteredLogs = useMemo(() => {
      let result = logs;

      // Action type filter
      result = result.filter(l => activeFilters.has(l.action as ActionFilter));

      // Date filter
      if (selectedDay !== null) {
         const dayStr = `${MONTH_NAMES[calMonth].slice(0, 3)} ${String(selectedDay).padStart(2, '0')}`;
         result = result.filter(l => l.ts === dayStr);
      }

      // Admin name filter
      if (adminFilter.trim()) {
         const q = adminFilter.toLowerCase();
         result = result.filter(l => l.actor.toLowerCase().includes(q));
      }

      // General search
      if (searchQuery.trim()) {
         const q = searchQuery.toLowerCase();
         result = result.filter(l =>
            l.actor.toLowerCase().includes(q) ||
            l.target.toLowerCase().includes(q) ||
            l.ip.includes(q) ||
            l.desc.toLowerCase().includes(q) ||
            l.action.toLowerCase().includes(q)
         );
      }

      // Sort
      if (sortOrder === 'oldest') {
         result = [...result].reverse();
      }

      return result;
   }, [logs, activeFilters, selectedDay, calMonth, adminFilter, searchQuery, sortOrder]);

   const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
   const pagedLogs = filteredLogs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

   /* ── Computed stats ───────────────────────────────── */
   const stats = useMemo(() => ({
      total: logs.length,
      terminations: logs.filter(l => l.action === 'Termination').length,
      policyChanges: logs.filter(l => l.action === 'Policy Change').length,
   }), [logs]);

   /* ── CSV Export ────────────────────────────────────── */
   const handleExport = () => {
      const header = 'Date,Time,Admin,Action,Affected Session,Description,IP Address';
      const rows = filteredLogs.map(l =>
         `"${l.ts}","${l.hour}","${l.actor}","${l.action}","${l.target}","${l.desc}","${l.ip}"`
      );
      const csv = [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Audit log exported as CSV', 'success');
   };

   if (loading) {
      return (
         <div className="h-full flex items-center justify-center font-display">
            <div className="text-center space-y-4">
               <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
               <p className="text-xs font-black text-navy-400 uppercase tracking-widest">Loading Audit Log…</p>
            </div>
         </div>
      );
   }

   /* ── Sidebar content (shared between desktop + mobile) ── */
   const sidebarContent = (
      <div className="space-y-6">
         <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight">Filters</h3>

         {/* Calendar */}
         <div className="bg-navy-50/50 rounded-[2.5rem] p-6 border border-navy-100 shadow-inner">
            <div className="flex items-center justify-between mb-4">
               <button onClick={prevMonth} className="p-1 hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">chevron_left</span></button>
               <p className="text-[10px] font-black text-navy-900 uppercase tracking-widest">{MONTH_NAMES[calMonth]} {calYear}</p>
               <button onClick={nextMonth} className="p-1 hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">chevron_right</span></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
               {DAYS.map((d, i) => (
                  <span key={i} className="text-[8px] font-black text-navy-300 uppercase py-2">{d}</span>
               ))}
               {/* Empty cells for offset */}
               {[...Array(firstDayOfWeek)].map((_, i) => (
                  <span key={`empty-${i}`} />
               ))}
               {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const isSelected = selectedDay === day;
                  return (
                     <button
                        key={day}
                        onClick={() => handleDayClick(day)}
                        className={`size-8 flex items-center justify-center text-[10px] font-black rounded-full transition-all ${isSelected
                              ? 'bg-primary text-white shadow-lg shadow-primary/30'
                              : 'hover:bg-navy-50 text-navy-400'
                           }`}
                     >
                        {day}
                     </button>
                  );
               })}
            </div>
            {selectedDay && (
               <button onClick={() => setSelectedDay(null)} className="w-full mt-3 text-[9px] font-black text-primary uppercase tracking-widest hover:underline">
                  Clear Date
               </button>
            )}
         </div>

         {/* Action Type */}
         <div className="space-y-4">
            <p className="text-[10px] font-black text-navy-300 uppercase tracking-[0.25em] px-1">Action Type</p>
            <div className="space-y-3">
               {ACTION_FILTERS.map(f => (
                  <label key={f.key} className="flex items-center gap-4 cursor-pointer group" onClick={() => toggleFilter(f.key)}>
                     <div className="relative flex items-center">
                        <input type="checkbox" checked={activeFilters.has(f.key)} readOnly className="peer h-6 w-6 appearance-none rounded-lg border-2 border-navy-100 checked:bg-primary checked:border-primary transition-all shadow-sm" />
                        <span className="material-symbols-outlined text-white text-sm absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 peer-checked:opacity-100 font-black">check</span>
                     </div>
                     <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest group-hover:text-navy-950 transition-colors">{f.label}</span>
                  </label>
               ))}
            </div>
         </div>

         {/* Admin Search */}
         <div className="space-y-4">
            <p className="text-[10px] font-black text-navy-300 uppercase tracking-[0.25em] px-1">Filter by Admin</p>
            <div className="relative group">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined text-lg group-focus-within:text-primary">person_search</span>
               <input
                  className="w-full h-12 pl-12 pr-4 bg-navy-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-900 focus:ring-4 focus:ring-primary/5 shadow-inner"
                  placeholder="Enter name..."
                  value={adminFilter}
                  onChange={e => { setAdminFilter(e.target.value); setPage(0); }}
               />
            </div>
         </div>

         <button onClick={resetFilters} className="w-full py-4 bg-navy-950 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-[1.5rem] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
            <span className="material-symbols-outlined text-xl">restart_alt</span> Reset Filters
         </button>
      </div>
   );

   return (
      <div className="h-full flex flex-col lg:flex-row overflow-hidden font-display bg-navy-50/20">

         {/* Mobile Sidebar Toggle */}
         <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden fixed bottom-6 left-6 z-50 p-4 bg-primary text-white rounded-2xl shadow-2xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all"
         >
            <span className="material-symbols-outlined text-2xl">{sidebarOpen ? 'close' : 'filter_list'}</span>
         </button>

         {/* Mobile Sidebar Overlay */}
         {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-40 bg-navy-950/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSidebarOpen(false)}>
               <aside className="w-80 h-full bg-white p-8 overflow-y-auto custom-scrollbar shadow-2xl animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
                  {sidebarContent}
               </aside>
            </div>
         )}

         {/* Desktop Sidebar */}
         <aside className="hidden lg:flex w-80 bg-white border-r border-navy-100 flex-col p-8 gap-10 shrink-0 shadow-sm z-10 overflow-y-auto custom-scrollbar">
            {sidebarContent}
         </aside>

         {/* Main Content */}
         <main className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar p-4 md:p-10">
            <div className="max-w-[1400px] mx-auto w-full space-y-10 animate-in fade-in duration-700">

               {/* Header */}
               <div className="space-y-6">
                  <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300 px-1">
                     <span>Security</span>
                     <span className="material-symbols-outlined text-xs">chevron_right</span>
                     <span className="text-primary">Audit Log</span>
                  </nav>
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-navy-100 pb-10">
                     <div className="max-w-2xl space-y-4">
                        <h1 className="text-3xl md:text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">Session Audit Log</h1>
                        <p className="text-navy-500 font-medium italic text-sm md:text-xl leading-relaxed uppercase tracking-wider opacity-80">Record of all admin session activity, setting changes, and security actions.</p>
                     </div>
                     <button onClick={handleExport} className="flex items-center gap-3 px-8 md:px-10 py-4 bg-primary text-white rounded-[1.75rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all shrink-0">
                        <span className="material-symbols-outlined text-xl">download</span> Export Log
                     </button>
                  </div>
               </div>

               {/* Stats */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8">
                  {[
                     { label: 'Total Events', val: String(stats.total), icon: 'history', color: 'text-primary', bg: 'bg-primary/5' },
                     { label: 'Force Logouts', val: String(stats.terminations), icon: 'gavel', color: 'text-red-600', bg: 'bg-red-50' },
                     { label: 'Settings Changed', val: String(stats.policyChanges), icon: 'policy', color: 'text-orange-600', bg: 'bg-orange-50' },
                  ].map((s, i) => (
                     <div key={i} className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-navy-100 shadow-sm flex flex-col group hover:shadow-xl transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-navy-950 group-hover:scale-110 transition-transform duration-700 hidden md:block">
                           <span className="material-symbols-outlined text-[120px] font-black">{s.icon}</span>
                        </div>
                        <div className="flex items-center gap-4 md:gap-6 mb-4 md:mb-6">
                           <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl ${s.bg} ${s.color} shadow-inner`}>
                              <span className="material-symbols-outlined text-xl md:text-2xl font-black">{s.icon}</span>
                           </div>
                           <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{s.label}</p>
                        </div>
                        <h3 className="text-3xl md:text-5xl font-black text-navy-950 tracking-tighter uppercase relative z-10">{s.val}</h3>
                     </div>
                  ))}
               </div>

               {/* Search + Sort Bar */}
               <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-navy-100 shadow-sm">
                  <div className="relative flex-1 w-full group">
                     <span className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined group-focus-within:text-primary transition-colors">search</span>
                     <input
                        className="w-full h-12 md:h-14 pl-14 md:pl-16 pr-6 md:pr-8 bg-navy-50 border-none rounded-[1.25rem] md:rounded-[1.5rem] text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
                        placeholder="Search by session, IP, or action..."
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
                     />
                  </div>
                  <div className="flex items-center gap-4 md:gap-8 px-2 md:px-6 md:border-l border-navy-50">
                     <span className="text-[10px] font-black text-navy-300 uppercase tracking-widest whitespace-nowrap">Sort By:</span>
                     <select
                        value={sortOrder}
                        onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')}
                        className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-navy-950 focus:ring-0 cursor-pointer"
                     >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                     </select>
                  </div>
               </div>

               {/* Desktop Table */}
               <div className="hidden md:block bg-white rounded-[3rem] md:rounded-[4rem] border border-navy-100 shadow-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                           <tr className="bg-navy-50/50 text-[10px] font-black text-navy-300 uppercase tracking-[0.25em] border-b border-navy-100">
                              <th className="px-12 py-10 w-[200px]">Date & Time</th>
                              <th className="px-8 py-10 w-[220px]">Admin</th>
                              <th className="px-8 py-10 w-[160px]">Action Type</th>
                              <th className="px-8 py-10 w-[180px]">Affected Session</th>
                              <th className="px-8 py-10">Description</th>
                              <th className="px-12 py-10 text-right w-[160px]">IP Address</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-50">
                           {pagedLogs.length === 0 ? (
                              <tr>
                                 <td colSpan={6} className="px-12 py-16 text-center">
                                    <span className="material-symbols-outlined text-4xl text-navy-200 block mb-3">search_off</span>
                                    <p className="text-sm font-bold text-navy-400">No audit entries match your filters</p>
                                    <button onClick={resetFilters} className="mt-3 text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Reset Filters</button>
                                 </td>
                              </tr>
                           ) : pagedLogs.map(log => (
                              <tr key={log.id} className="group hover:bg-primary/5 transition-all cursor-default">
                                 <td className="px-12 py-10 font-mono text-xs font-black text-navy-400 tracking-widest tabular-nums uppercase leading-tight">
                                    <span>{log.ts}</span>
                                    <span className="block text-primary mt-1 opacity-70">{log.hour}</span>
                                 </td>
                                 <td className="px-8 py-10">
                                    <div className="flex items-center gap-5">
                                       <div className={`size-10 rounded-[1rem] ${log.avatar} border-2 border-white shadow-lg overflow-hidden group-hover:scale-110 transition-transform duration-500`} />
                                       <span className="text-sm font-black text-navy-950 uppercase tracking-tight">{log.actor}</span>
                                    </div>
                                 </td>
                                 <td className="px-8 py-10">
                                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${log.color}`}>
                                       <span className="material-symbols-outlined text-sm font-black">{log.icon}</span>
                                       {log.action}
                                    </span>
                                 </td>
                                 <td className="px-8 py-10 font-mono text-[11px] font-black text-primary tracking-tight uppercase">{log.target}</td>
                                 <td className="px-8 py-10">
                                    <p className="text-[11px] font-bold text-navy-500 uppercase italic leading-relaxed tracking-wider opacity-60 group-hover:opacity-100 transition-opacity truncate max-w-sm">{log.desc}</p>
                                 </td>
                                 <td className="px-12 py-10 text-right font-mono text-xs font-black text-navy-300 uppercase tabular-nums">{log.ip}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>

                  {/* Pagination */}
                  <div className="px-12 py-10 bg-navy-50/20 border-t border-navy-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                     <div className="text-[10px] font-black text-navy-400 uppercase tracking-widest">
                        Showing <span className="text-navy-950">{filteredLogs.length === 0 ? 0 : page * PAGE_SIZE + 1}</span> to <span className="text-navy-950">{Math.min((page + 1) * PAGE_SIZE, filteredLogs.length)}</span> of <span className="text-navy-950">{filteredLogs.length}</span> entries
                     </div>
                     <div className="flex items-center gap-3">
                        <button
                           onClick={() => setPage(p => Math.max(0, p - 1))}
                           disabled={page === 0}
                           className={`px-6 py-3 bg-white border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all ${page === 0 ? 'border-navy-200 text-navy-300 cursor-not-allowed' : 'border-navy-100 text-navy-950 hover:bg-navy-50'}`}
                        >Previous</button>
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                           let pageNum: number;
                           if (totalPages <= 5) pageNum = i;
                           else if (page < 3) pageNum = i;
                           else if (page > totalPages - 4) pageNum = totalPages - 5 + i;
                           else pageNum = page - 2 + i;
                           return (
                              <button
                                 key={pageNum}
                                 onClick={() => setPage(pageNum)}
                                 className={`size-10 flex items-center justify-center rounded-xl text-xs font-black transition-all ${pageNum === page
                                       ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                       : 'bg-white border-2 border-navy-100 text-navy-400 hover:border-navy-400 hover:text-navy-950'
                                    }`}
                              >{pageNum + 1}</button>
                           );
                        })}
                        <button
                           onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                           disabled={page >= totalPages - 1}
                           className={`px-6 py-3 bg-white border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all ${page >= totalPages - 1 ? 'border-navy-200 text-navy-300 cursor-not-allowed' : 'border-navy-100 text-navy-950 hover:bg-navy-50'}`}
                        >Next</button>
                     </div>
                  </div>
               </div>

               {/* Mobile Card Layout */}
               <div className="md:hidden space-y-4">
                  {pagedLogs.length === 0 ? (
                     <div className="bg-white rounded-2xl border border-navy-100 p-8 text-center">
                        <span className="material-symbols-outlined text-3xl text-navy-200 block mb-2">search_off</span>
                        <p className="text-sm font-bold text-navy-400">No entries match your filters</p>
                        <button onClick={resetFilters} className="mt-2 text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Reset</button>
                     </div>
                  ) : pagedLogs.map(log => (
                     <div key={log.id} className="bg-white rounded-2xl border border-navy-100 p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className={`size-10 rounded-xl ${log.avatar} border-2 border-white shadow-md`} />
                              <div>
                                 <p className="text-xs font-black text-navy-950 uppercase tracking-tight">{log.actor}</p>
                                 <p className="text-[9px] font-mono text-navy-300">{log.ts} · {log.hour}</p>
                              </div>
                           </div>
                           <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border shadow-sm ${log.color}`}>
                              <span className="material-symbols-outlined text-xs">{log.icon}</span>
                              {log.action}
                           </span>
                        </div>
                        <p className="text-[10px] font-bold text-navy-500 italic leading-relaxed">{log.desc}</p>
                        <div className="flex justify-between text-[9px] font-mono font-bold text-navy-300 uppercase tracking-widest pt-2 border-t border-navy-50">
                           <span>Session: {log.target}</span>
                           <span>IP: {log.ip}</span>
                        </div>
                     </div>
                  ))}

                  {/* Mobile Pagination */}
                  <div className="flex items-center justify-between gap-4 pt-4">
                     <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className={`px-6 py-3 bg-white border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${page === 0 ? 'text-navy-300 cursor-not-allowed border-navy-200' : 'text-navy-950 border-navy-100'}`}
                     >Previous</button>
                     <span className="text-[10px] font-black text-navy-400 uppercase">{page + 1} / {totalPages}</span>
                     <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className={`px-6 py-3 bg-white border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${page >= totalPages - 1 ? 'text-navy-300 cursor-not-allowed border-navy-200' : 'text-navy-950 border-navy-100'}`}
                     >Next</button>
                  </div>
               </div>

            </div>
         </main>
      </div>
   );
};

export default SessionAuditLog;
