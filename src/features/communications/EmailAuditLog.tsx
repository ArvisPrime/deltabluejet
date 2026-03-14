
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../../config/routes';
import { getNotificationLogs } from '../../services/notifications';
import type { NotificationLogDoc, NotificationStatus } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';

type StatusFilter = 'all' | NotificationStatus;
const PAGE_SIZE = 10;

const EmailAuditLog: React.FC = () => {
   const navigate = useNavigate();
   const addToast = useToastStore((s) => s.addToast);

   const [logs, setLogs] = useState<NotificationLogDoc[]>([]);
   const [loading, setLoading] = useState(true);
   const [expandedId, setExpandedId] = useState<string | null>(null);

   // Filters
   const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
   const [searchQuery, setSearchQuery] = useState('');
   const [page, setPage] = useState(1);

   // Settings modal
   const [showSettings, setShowSettings] = useState(false);
   const [autoRefresh, setAutoRefresh] = useState(false);

   // ── Load logs ──
   const loadLogs = useCallback(async () => {
      setLoading(true);
      try {
         const data = await getNotificationLogs({ channel: 'email', maxResults: 200 });
         setLogs(data);
      } catch (err) {
         console.error('Failed to load email logs:', err);
         addToast('Failed to load email history', 'error');
      } finally {
         setLoading(false);
      }
   }, [addToast]);

   useEffect(() => { loadLogs(); }, [loadLogs]);

   // Auto-refresh (every 30s when enabled)
   useEffect(() => {
      if (!autoRefresh) return;
      const interval = setInterval(loadLogs, 30_000);
      return () => clearInterval(interval);
   }, [autoRefresh, loadLogs]);

   // ── Helpers ──
   const formatDate = (ts: any) => {
      if (!ts?.toDate) return '--';
      const d = ts.toDate();
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
   };
   const formatTime = (ts: any) => {
      if (!ts?.toDate) return '--';
      return ts.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
   };
   const statusColor = (status: string) => {
      switch (status) {
         case 'sent': case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
         case 'failed': case 'bounced': return 'bg-red-100 text-red-700 border-red-200';
         case 'queued': return 'bg-amber-100 text-amber-700 border-amber-200';
         default: return 'bg-blue-100 text-blue-700 border-blue-200';
      }
   };

   // ── Filter & search ──
   const filteredLogs = useMemo(() => {
      let result = logs;
      if (activeFilter !== 'all') {
         result = result.filter((l) => l.status === activeFilter);
      }
      if (searchQuery.trim()) {
         const q = searchQuery.toLowerCase();
         result = result.filter(
            (l) =>
               l.templateName?.toLowerCase().includes(q) ||
               l.recipientEmail?.toLowerCase().includes(q) ||
               l.subject?.toLowerCase().includes(q) ||
               l.bookingRef?.toLowerCase().includes(q)
         );
      }
      return result;
   }, [logs, activeFilter, searchQuery]);

   // ── Pagination ──
   const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
   const pagedLogs = useMemo(
      () => filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      [filteredLogs, page]
   );

   // Reset page when filters change
   useEffect(() => { setPage(1); }, [activeFilter, searchQuery]);

   // ── Export CSV ──
   const handleExport = () => {
      if (filteredLogs.length === 0) {
         addToast('No email records to export', 'info');
         return;
      }
      const headers = ['Date', 'Time', 'Email Type', 'Recipient', 'Status', 'Subject', 'Sent Via', 'Booking Ref', 'Sent By'];
      const rows = filteredLogs.map((l) => [
         formatDate(l.sentAt),
         formatTime(l.sentAt),
         l.templateName || '',
         l.recipientEmail || '',
         l.status,
         (l.subject || '').replace(/,/g, ' '),
         l.provider || '',
         l.bookingRef || '',
         l.sentBy || '',
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email-audit-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast(`Exported ${filteredLogs.length} records to CSV`, 'success');
   };

   // ── Refresh (clear cache) ──
   const handleRefresh = async () => {
      addToast('Refreshing email history…', 'info');
      await loadLogs();
      addToast('Email history refreshed', 'success');
   };

   return (
      <div className="h-full flex flex-col p-8 overflow-hidden font-sans bg-navy-50/20">
         <div className="max-w-[1600px] mx-auto w-full h-full flex flex-col space-y-10 animate-in fade-in duration-500">

            {/* Header */}
            <div className="shrink-0 space-y-6">
               <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300 px-1">
                  <button onClick={() => navigate(ROUTES.DASHBOARD)} className="hover:text-primary transition-colors">Home</button>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <button onClick={() => navigate(ROUTES.EMAIL_TEMPLATES)} className="hover:text-primary transition-colors">Communication</button>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span className="text-primary">Email History</span>
               </nav>
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-navy-100 pb-10">
                  <div className="max-w-3xl space-y-3">
                     <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">Email History</h1>
                     <p className="text-navy-500 font-medium italic text-xl leading-relaxed uppercase tracking-wider opacity-80">Track, filter, and review all emails sent across the system.</p>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="relative">
                        <button onClick={() => setShowSettings(!showSettings)} className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-navy-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:text-primary transition-all shadow-sm group">
                           <span className="material-symbols-outlined text-xl text-navy-300 group-hover:text-primary">settings</span> Log Settings
                        </button>
                        {/* Settings Dropdown */}
                        {showSettings && (
                           <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-3xl border border-navy-100 shadow-2xl p-6 z-50 space-y-6 animate-in slide-in-from-top-2 duration-200">
                              <h4 className="text-[10px] font-black text-navy-950 uppercase tracking-widest">Log Settings</h4>
                              <label className="flex items-center justify-between cursor-pointer">
                                 <span className="text-xs font-bold text-navy-600">Auto-Refresh (30s)</span>
                                 <button
                                    onClick={() => { setAutoRefresh(!autoRefresh); addToast(autoRefresh ? 'Auto-refresh disabled' : 'Auto-refresh enabled (30s)', 'info'); }}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${autoRefresh ? 'bg-emerald-500' : 'bg-navy-200'}`}
                                 >
                                    <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${autoRefresh ? 'left-[26px]' : 'left-0.5'}`} />
                                 </button>
                              </label>
                              <div className="space-y-2">
                                 <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Records per page</p>
                                 <p className="text-sm font-black text-navy-950">{PAGE_SIZE} records</p>
                              </div>
                              <div className="space-y-2">
                                 <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Total records loaded</p>
                                 <p className="text-sm font-black text-navy-950">{logs.length}</p>
                              </div>
                              <button onClick={() => setShowSettings(false)} className="w-full py-3 bg-navy-50 text-[10px] font-black text-navy-500 uppercase tracking-widest rounded-xl hover:bg-navy-100 transition-colors">Close</button>
                           </div>
                        )}
                     </div>
                     <button onClick={handleExport} className="flex items-center gap-3 px-10 py-4 bg-primary text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-xl">download</span> Export Report
                     </button>
                  </div>
               </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-[3rem] border border-navy-100 p-8 shadow-sm space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-navy-950 uppercase tracking-[0.25em] flex items-center gap-3">
                     <span className="material-symbols-outlined text-primary">filter_list</span>
                     Filters & Search
                  </h3>
                  <button onClick={handleRefresh} className="text-[10px] font-black text-primary uppercase underline hover:no-underline transition-all">Refresh Data</button>
               </div>
               <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-end">
                  <div className="xl:col-span-6 flex flex-wrap gap-3">
                     {([
                        { key: 'all' as StatusFilter, label: 'All' },
                        { key: 'sent' as StatusFilter, label: 'Sent' },
                        { key: 'delivered' as StatusFilter, label: 'Delivered' },
                        { key: 'failed' as StatusFilter, label: 'Failed' },
                        { key: 'queued' as StatusFilter, label: 'Queued' },
                     ]).map((f) => (
                        <button
                           key={f.key}
                           onClick={() => setActiveFilter(f.key)}
                           className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${activeFilter === f.key
                              ? 'bg-primary/5 text-primary border-primary/20 shadow-lg shadow-primary/5'
                              : 'bg-white text-navy-400 border-navy-50 hover:border-navy-200'
                              }`}
                        >{f.label}</button>
                     ))}
                  </div>
                  <div className="xl:col-span-6">
                     <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined text-lg group-focus-within:text-primary transition-all">search</span>
                        <input
                           className="w-full h-14 pl-12 pr-6 bg-navy-50 border-none rounded-2xl text-xs font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
                           placeholder="Search by email type, recipient, subject, or booking ref..."
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                           <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-300 hover:text-primary transition-colors">
                              <span className="material-symbols-outlined text-lg">close</span>
                           </button>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* Email Log Table */}
            <div className="flex-1 bg-white rounded-[4rem] border border-navy-100 shadow-sm overflow-hidden flex flex-col relative">
               <div className="overflow-x-auto h-full flex flex-col">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                     <thead>
                        <tr className="bg-navy-50/50 text-[10px] font-black text-navy-300 uppercase tracking-[0.25em] border-b border-navy-100">
                           <th className="px-10 py-8 w-[200px]">Timestamp</th>
                           <th className="px-8 py-8 w-[200px]">Email Type</th>
                           <th className="px-8 py-8 w-[200px]">Recipient</th>
                           <th className="px-8 py-8 w-[160px]">Status</th>
                           <th className="px-8 py-8">Subject</th>
                           <th className="px-8 py-8 w-[120px]">Sent Via</th>
                           <th className="px-10 py-8 text-right w-[120px]">Details</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-navy-50">
                        {loading ? (
                           <tr>
                              <td colSpan={7} className="px-10 py-20 text-center">
                                 <div className="flex items-center justify-center gap-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    <span className="text-xs font-black text-navy-300 uppercase tracking-widest">Loading email history…</span>
                                 </div>
                              </td>
                           </tr>
                        ) : pagedLogs.length === 0 ? (
                           <tr>
                              <td colSpan={7} className="px-10 py-20 text-center">
                                 <div className="space-y-4">
                                    <span className="material-symbols-outlined text-4xl text-navy-200">mail</span>
                                    <p className="text-xs font-black text-navy-300 uppercase tracking-widest">
                                       {filteredLogs.length === 0 && logs.length > 0
                                          ? 'No emails match your filters'
                                          : 'No emails found'}
                                    </p>
                                    {searchQuery && (
                                       <button onClick={() => { setSearchQuery(''); setActiveFilter('all'); }} className="text-[10px] font-black text-primary uppercase underline">Clear Filters</button>
                                    )}
                                 </div>
                              </td>
                           </tr>
                        ) : (
                           pagedLogs.map((log) => (
                              <React.Fragment key={log.id}>
                                 <tr className="group hover:bg-primary/5 transition-all cursor-default">
                                    <td className="px-10 py-10 font-mono text-xs font-black text-navy-400 tracking-widest tabular-nums uppercase">
                                       {formatDate(log.sentAt)} <span className="text-primary font-black ml-2">{formatTime(log.sentAt)}</span>
                                    </td>
                                    <td className="px-8 py-10 text-sm font-black text-navy-950 uppercase tracking-tighter truncate max-w-[200px]">{log.templateName}</td>
                                    <td className="px-8 py-10">
                                       <div className="flex items-center gap-3">
                                          <div className="size-9 rounded-xl bg-navy-50 flex items-center justify-center text-navy-300 border border-navy-100">
                                             <span className="material-symbols-outlined text-lg">person</span>
                                          </div>
                                          <div>
                                             <p className="text-xs font-black text-navy-950 truncate max-w-[140px]">{log.recipientEmail || '--'}</p>
                                             {log.bookingRef && <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest opacity-60">Ref: {log.bookingRef}</p>}
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-8 py-10">
                                       <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${statusColor(log.status)}`}>
                                          {log.status}
                                       </span>
                                    </td>
                                    <td className="px-8 py-10">
                                       <p className="text-[11px] font-bold text-navy-500 uppercase italic leading-relaxed tracking-wider opacity-60 group-hover:opacity-100 transition-opacity truncate max-w-sm">
                                          {log.subject || '--'}
                                       </p>
                                    </td>
                                    <td className="px-8 py-10 text-xs font-black text-navy-400 uppercase tracking-widest">{log.provider}</td>
                                    <td className="px-10 py-10 text-right">
                                       <button
                                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                          className={`p-3 transition-all shadow-inner rounded-2xl border ${expandedId === log.id
                                             ? 'bg-primary/10 text-primary border-primary/20'
                                             : 'bg-navy-50 text-navy-300 hover:text-primary hover:bg-white border-transparent hover:border-navy-100'}`}
                                       >
                                          <span className="material-symbols-outlined text-xl">{log.status === 'failed' ? 'error' : expandedId === log.id ? 'expand_less' : 'expand_more'}</span>
                                       </button>
                                    </td>
                                 </tr>
                                 {/* Expanded Detail Panel */}
                                 {expandedId === log.id && (
                                    <tr className="bg-navy-50/30 animate-in slide-in-from-top-1 duration-200">
                                       <td colSpan={7} className="px-10 py-8">
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
                                             {/* Email Details */}
                                             <div className="space-y-4">
                                                <p className="text-[9px] font-black text-navy-300 uppercase tracking-[0.3em]">Email Details</p>
                                                <div className="space-y-3">
                                                   <div>
                                                      <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest mb-1">Full Subject</p>
                                                      <p className="text-xs font-bold text-navy-700">{log.subject || 'No subject'}</p>
                                                   </div>
                                                   <div>
                                                      <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest mb-1">Recipient</p>
                                                      <p className="text-xs font-bold text-navy-700">{log.recipientEmail || '--'}</p>
                                                   </div>
                                                   <div>
                                                      <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest mb-1">Email Type</p>
                                                      <p className="text-xs font-bold text-navy-700">{log.templateName}</p>
                                                   </div>
                                                </div>
                                             </div>
                                             {/* Delivery Info */}
                                             <div className="space-y-4">
                                                <p className="text-[9px] font-black text-navy-300 uppercase tracking-[0.3em]">Delivery Info</p>
                                                <div className="space-y-3">
                                                   <div>
                                                      <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest mb-1">Status</p>
                                                      <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${statusColor(log.status)}`}>
                                                         {log.status}
                                                      </span>
                                                   </div>
                                                   <div>
                                                      <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest mb-1">Sent Via</p>
                                                      <p className="text-xs font-bold text-navy-700">{log.provider}</p>
                                                   </div>
                                                   <div>
                                                      <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest mb-1">Sent By</p>
                                                      <p className="text-xs font-bold text-navy-700">{log.sentBy || 'System'}</p>
                                                   </div>
                                                </div>
                                             </div>
                                             {/* Error / Booking Info */}
                                             <div className="space-y-4">
                                                <p className="text-[9px] font-black text-navy-300 uppercase tracking-[0.3em]">Additional Info</p>
                                                <div className="space-y-3">
                                                   {log.bookingRef && (
                                                      <div>
                                                         <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest mb-1">Booking Reference</p>
                                                         <p className="text-xs font-black text-primary">{log.bookingRef}</p>
                                                      </div>
                                                   )}
                                                   {log.errorMessage && (
                                                      <div>
                                                         <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-1">Error Message</p>
                                                         <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{log.errorMessage}</p>
                                                      </div>
                                                   )}
                                                   {!log.bookingRef && !log.errorMessage && (
                                                      <p className="text-xs font-bold text-navy-300 italic">No additional information</p>
                                                   )}
                                                </div>
                                             </div>
                                          </div>
                                       </td>
                                    </tr>
                                 )}
                              </React.Fragment>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>

               {/* Pagination Footer */}
               <div className="px-12 py-10 bg-navy-50/20 border-t border-navy-100 flex flex-col sm:flex-row items-center justify-between gap-10">
                  <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em]">
                     Showing {pagedLogs.length} of {filteredLogs.length} records
                     {activeFilter !== 'all' && <span className="text-primary ml-2">· filtered by {activeFilter}</span>}
                     {searchQuery && <span className="text-primary ml-2">· "{searchQuery}"</span>}
                  </p>
                  <div className="flex items-center gap-4">
                     <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="px-10 py-4 bg-white border-2 border-navy-100 text-navy-950 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 transition-all shadow-sm disabled:text-navy-200 disabled:cursor-not-allowed"
                     >Prev Page</button>
                     <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">
                        {page} / {totalPages}
                     </span>
                     <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="px-10 py-4 bg-white border-2 border-navy-100 text-navy-950 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 transition-all shadow-sm disabled:text-navy-200 disabled:cursor-not-allowed"
                     >Next Page</button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default EmailAuditLog;
