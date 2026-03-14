
import React, { useState, useEffect, useCallback } from 'react';
import {
   searchAuditLogs,
   getAuditStats,
   exportAuditCSV,
   type AuditSearchFilters,
} from '../../services/auditService';
import type { AuditLogDoc, AuditSeverity } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';

const MODULES = ['all', 'bookings', 'payments', 'flights', 'auth', 'admin', 'fleet', 'routes', 'cms'];
const SEVERITIES: Array<AuditSeverity | 'all'> = ['all', 'info', 'warning', 'error', 'critical'];

const AlertAuditLog: React.FC = () => {
   const [logs, setLogs] = useState<AuditLogDoc[]>([]);
   const [loading, setLoading] = useState(true);
   const [stats, setStats] = useState({ totalEvents: 0, criticalErrors: 0, warnings: 0, uniqueUsers: 0 });
   const [filters, setFilters] = useState<AuditSearchFilters>({ maxResults: 50 });
   const [searchInput, setSearchInput] = useState('');

   const loadData = useCallback(async () => {
      setLoading(true);
      try {
         const [logData, statsData] = await Promise.all([
            searchAuditLogs(filters),
            getAuditStats(),
         ]);
         setLogs(logData);
         setStats(statsData);
      } catch (err: any) {
         console.error('Audit log load error:', err);
         const msg = err?.message || 'Failed to load audit logs';
         // Check for Firestore index error and show a cleaner message
         if (msg.includes('index') || msg.includes('requires an index')) {
            useToastStore.getState().addToast('Firestore index is building. Please refresh in a minute.', 'warning');
         } else {
            useToastStore.getState().addToast(msg, 'error');
         }
      }
      finally { setLoading(false); }
   }, [filters]);

   useEffect(() => { loadData(); }, [loadData]);

   const handleSearch = () => {
      setFilters(prev => ({ ...prev, searchTerm: searchInput || undefined }));
   };

   const handleModuleChange = (module: string) => {
      setFilters(prev => ({ ...prev, module: module === 'all' ? undefined : module }));
   };

   const handleSeverityChange = (severity: string) => {
      setFilters(prev => ({
         ...prev,
         severity: severity === 'all' ? undefined : severity as AuditSeverity,
      }));
   };

   const fmtTime = (ts: any) => ts?.toDate ? ts.toDate().toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
   }) : '--';

   const severityStyle = (s: AuditSeverity) => {
      switch (s) {
         case 'info': return 'text-blue-500 bg-blue-50 border-blue-100';
         case 'warning': return 'text-orange-600 bg-orange-50 border-orange-100';
         case 'error': return 'text-red-600 bg-red-50 border-red-100';
         case 'critical': return 'text-red-700 bg-red-100 border-red-200';
         default: return 'text-navy-400 bg-navy-50 border-navy-100';
      }
   };

   const severityDot = (s: AuditSeverity) => {
      switch (s) {
         case 'info': return 'bg-blue-500';
         case 'warning': return 'bg-orange-500';
         case 'error': return 'bg-red-500';
         case 'critical': return 'bg-red-700';
         default: return 'bg-navy-300';
      }
   };

   return (
      <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar font-sans bg-navy-50/20">
         <div className="max-w-[1600px] mx-auto w-full space-y-12 pb-24 animate-in fade-in slide-in-from-bottom duration-700">
            {/* Header */}
            <div className="space-y-6">
               <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300 px-2">
                  <span>Security & Compliance</span>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span className="text-primary">System Activity Log</span>
               </nav>
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-navy-100 pb-10">
                  <div className="max-w-2xl space-y-4">
                     <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">System Activity Log</h1>
                     <p className="text-navy-500 font-medium italic text-xl leading-relaxed uppercase tracking-wider">
                        Monitor and audit system-wide events, user actions, and security alerts.
                     </p>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={loadData} className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-navy-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:bg-navy-50 shadow-sm transition-all">
                        <span className="material-symbols-outlined text-xl">refresh</span> Refresh
                     </button>
                     <button onClick={() => exportAuditCSV(logs)} disabled={logs.length === 0} className="flex items-center gap-3 px-10 py-4 bg-primary text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                        <span className="material-symbols-outlined text-xl">download</span> Export Report
                     </button>
                  </div>
               </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {[
                  { label: 'Total Events (24h)', val: stats.totalEvents.toLocaleString(), icon: 'list_alt', color: 'text-primary', bg: 'bg-primary/5' },
                  { label: 'Critical / Errors', val: String(stats.criticalErrors), icon: 'error', color: 'text-red-500', bg: 'bg-red-50' },
                  { label: 'Warnings', val: String(stats.warnings), icon: 'warning', color: 'text-orange-500', bg: 'bg-orange-50' },
                  { label: 'Unique Users', val: String(stats.uniqueUsers), icon: 'group', color: 'text-indigo-600', bg: 'bg-indigo-50' },
               ].map((s, i) => (
                  <div key={i} className="bg-white p-8 rounded-[3rem] border border-navy-100 shadow-sm flex flex-col group hover:shadow-xl transition-all relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-5 text-navy-950 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[100px] font-black">{s.icon}</span>
                     </div>
                     <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mb-6">{s.label}</p>
                     <h3 className="text-3xl font-black text-navy-950 tracking-tighter relative z-10">{s.val}</h3>
                  </div>
               ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-[3.5rem] border border-navy-100 p-10 shadow-sm space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-1">Search</label>
                     <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined group-focus-within:text-primary transition-all">search</span>
                        <input
                           value={searchInput}
                           onChange={e => setSearchInput(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && handleSearch()}
                           className="w-full h-14 pl-14 pr-6 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
                           placeholder="User, Action or ID..."
                        />
                     </div>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-1">Module</label>
                     <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined group-focus-within:text-primary transition-all">view_module</span>
                        <select
                           onChange={e => handleModuleChange(e.target.value)}
                           className="w-full h-14 pl-14 pr-10 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all appearance-none shadow-inner"
                        >
                           {MODULES.map(m => <option key={m} value={m}>{m === 'all' ? 'All Modules' : m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                        </select>
                     </div>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-1">Severity</label>
                     <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined group-focus-within:text-primary transition-all">flaky</span>
                        <select
                           onChange={e => handleSeverityChange(e.target.value)}
                           className="w-full h-14 pl-14 pr-10 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all appearance-none shadow-inner"
                        >
                           {SEVERITIES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Severity' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                     </div>
                  </div>
                  <div className="flex justify-end">
                     <button onClick={handleSearch} className="px-12 py-4 bg-primary text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                        <span className="material-symbols-outlined">filter_list</span> Apply Filters
                     </button>
                  </div>
               </div>
            </div>

            {/* Log Table */}
            <div className="bg-white rounded-[4rem] border border-navy-100 shadow-2xl overflow-hidden flex flex-col">
               {loading ? (
                  <div className="flex items-center justify-center py-24">
                     <div className="animate-spin size-8 border-3 border-navy-200 border-t-primary rounded-full" />
                  </div>
               ) : (
                  <>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="bg-navy-50/50 text-[10px] font-black text-navy-300 uppercase tracking-[0.3em] border-b border-navy-100">
                                 <th className="px-10 py-10">Timestamp</th>
                                 <th className="px-10 py-10">Severity</th>
                                 <th className="px-10 py-10">User</th>
                                 <th className="px-10 py-10">Module</th>
                                 <th className="px-10 py-10">Action</th>
                                 <th className="px-10 py-10">Description</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-navy-50">
                              {logs.length === 0 ? (
                                 <tr>
                                    <td colSpan={6} className="px-10 py-16 text-center">
                                       <span className="material-symbols-outlined text-5xl text-navy-100 block mb-4">receipt_long</span>
                                       <p className="text-sm font-black text-navy-300 uppercase tracking-widest">No audit logs found</p>
                                    </td>
                                 </tr>
                              ) : (
                                 logs.map((log, i) => (
                                    <tr key={i} className="hover:bg-navy-50/50 transition-all group cursor-default">
                                       <td className="px-10 py-10 font-mono text-xs font-black text-navy-400 uppercase tracking-widest tabular-nums whitespace-nowrap">{fmtTime(log.timestamp)}</td>
                                       <td className="px-10 py-10">
                                          <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${severityStyle(log.severity)}`}>
                                             <span className={`size-1.5 rounded-full ${severityDot(log.severity)}`} />
                                             {log.severity}
                                          </span>
                                       </td>
                                       <td className="px-10 py-10">
                                          <div className="flex items-center gap-3">
                                             <div className="size-10 rounded-xl flex items-center justify-center font-black text-xs bg-primary/5 text-primary shadow-inner">
                                                {log.userEmail?.charAt(0)?.toUpperCase() || '?'}
                                             </div>
                                             <span className="text-sm font-black text-navy-950 uppercase tracking-tighter truncate max-w-40">{log.userEmail || log.userId}</span>
                                          </div>
                                       </td>
                                       <td className="px-10 py-10">
                                          <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest opacity-60">{log.module}</span>
                                       </td>
                                       <td className="px-10 py-10">
                                          <span className="text-sm font-black text-navy-950 uppercase tracking-tight leading-tight block max-w-[160px]">{log.action}</span>
                                       </td>
                                       <td className="px-10 py-10">
                                          <p className="text-[10px] font-bold text-navy-500 uppercase leading-relaxed tracking-wider italic opacity-70 group-hover:opacity-100 transition-opacity max-w-xs truncate">{log.description}</p>
                                       </td>
                                    </tr>
                                 ))
                              )}
                           </tbody>
                        </table>
                     </div>

                     {/* Footer */}
                     <div className="px-12 py-10 bg-navy-50/30 border-t border-navy-100 flex items-center justify-between">
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em]">
                           Showing {logs.length} records
                        </p>
                     </div>
                  </>
               )}
            </div>
         </div>
      </div>
   );
};

export default AlertAuditLog;
