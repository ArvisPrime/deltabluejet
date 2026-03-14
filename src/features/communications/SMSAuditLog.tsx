
import React, { useState, useEffect } from 'react';
import { getNotificationLogs } from '../../services/notifications';
import type { NotificationLogDoc } from '../../types/firestore';
import { useAdminAction } from '../../hooks/useAdminAction';
import { useToastStore } from '../../stores/toastStore';

const SMSAuditLog: React.FC = () => {
   const action = useAdminAction();
   const [logs, setLogs] = useState<NotificationLogDoc[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const load = async () => {
         setLoading(true);
         try {
            const data = await getNotificationLogs({ channel: 'sms', maxResults: 50 });
            setLogs(data);
         } catch (err) {
            console.error('Failed to load SMS logs:', err);
            useToastStore.getState().addToast("Failed to load SMS logs", "error");
         } finally {
            setLoading(false);
         }
      };
      load();
   }, []);

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

   const totalSent = logs.filter(l => l.status === 'sent' || l.status === 'delivered').length;
   const totalFailed = logs.filter(l => l.status === 'failed' || l.status === 'bounced').length;

   return (
      <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar font-sans bg-navy-50/20">
         <div className="max-w-[1600px] mx-auto w-full space-y-10 animate-in fade-in duration-500 pb-20">

            {/* Header Section */}
            <div className="space-y-6">
               <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300 px-1">
                  <span>Home</span>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span>Communication</span>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span className="text-primary">SMS Audit Log</span>
               </nav>
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-navy-100 pb-10">
                  <div className="max-w-3xl space-y-3">
                     <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">SMS Audit Log</h1>
                     <p className="text-navy-500 font-medium italic text-xl leading-relaxed uppercase tracking-wider opacity-80">Chronological ledger of all SMS notifications sent through the system.</p>
                  </div>
                  <div className="flex items-center gap-4">
                     <button onClick={action('Exporting SMS audit log…', 'success')} className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-navy-100 rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest text-navy-700 hover:text-primary transition-all shadow-sm group">
                        <span className="material-symbols-outlined text-xl text-navy-300 group-hover:text-primary">tune</span> Configure Settings
                     </button>
                     <button onClick={action('Filters cleared', 'info')} className="flex items-center gap-3 px-10 py-4 bg-primary text-white rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-xl">download</span> Export Audit CSV
                     </button>
                  </div>
               </div>
            </div>

            {/* Metric Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                  { label: 'Total SMS Sent', val: String(totalSent), icon: 'sms', color: 'text-primary', trend: `${logs.length} total records`, trendCol: 'text-emerald-500' },
                  { label: 'Delivery Rate', val: logs.length > 0 ? `${Math.round((totalSent / logs.length) * 100)}%` : '0%', sub: 'Successful deliveries', icon: 'check_circle', color: 'text-emerald-600' },
                  { label: 'Failed Messages', val: String(totalFailed), sub: 'Failed or bounced messages', icon: 'error', color: 'text-red-500' },
               ].map((card, i) => (
                  <div key={i} className="bg-white p-8 rounded-[3rem] border border-navy-100 shadow-sm flex flex-col group hover:shadow-xl transition-all relative overflow-hidden">
                     <div className="flex justify-between items-start mb-6 relative z-10">
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{card.label}</p>
                        <div className={`p-2.5 rounded-xl bg-navy-50 ${card.color} shadow-inner group-hover:scale-110 transition-transform`}>
                           <span className="material-symbols-outlined font-black">{card.icon}</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 relative z-10">
                        <div>
                           <h3 className="text-3xl font-black text-navy-950 tracking-tighter uppercase leading-none">{card.val}</h3>
                           {card.trend ? (
                              <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${card.trendCol}`}>{card.trend}</p>
                           ) : card.sub ? (
                              <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest mt-2">{card.sub}</p>
                           ) : null}
                        </div>
                     </div>
                     <div className="absolute -bottom-10 -right-10 opacity-[0.03] text-navy-950">
                        <span className="material-symbols-outlined text-[200px] font-black">{card.icon}</span>
                     </div>
                  </div>
               ))}
            </div>

            {/* Filter Section Card */}
            <div className="bg-white rounded-[3.5rem] border border-navy-100 p-10 shadow-sm space-y-10">
               <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black text-navy-950 uppercase tracking-[0.25em] flex items-center gap-3">
                     <span className="material-symbols-outlined text-primary">filter_list</span>
                     Logical Query Segments
                  </h3>
                  <button onClick={action('Navigated to previous page', 'info')} className="text-[10px] font-black text-primary uppercase underline">Reset Filters</button>
               </div>

               <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-end">
                  <div className="xl:col-span-4">
                     <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined text-lg group-focus-within:text-primary transition-all">search</span>
                        <input className="w-full h-14 pl-14 pr-6 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" placeholder="Search Template, Recipient..." />
                     </div>
                  </div>
                  <div className="xl:col-span-3">
                     <div className="relative group cursor-pointer">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined text-lg group-hover:text-primary transition-all">calendar_today</span>
                        <input className="w-full h-14 pl-14 pr-6 bg-navy-50 border-none rounded-3xl text-xs font-black text-navy-950 uppercase cursor-pointer shadow-inner" value="ALL TIME" readOnly />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined">expand_more</span>
                     </div>
                  </div>
                  <div className="xl:col-span-3">
                     <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined text-lg group-focus-within:text-primary transition-all">account_tree</span>
                        <select className="w-full h-14 pl-14 pr-10 bg-navy-50 border-none rounded-3xl text-xs font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all shadow-inner appearance-none">
                           <option>All Statuses</option>
                           <option>Sent</option>
                           <option>Delivered</option>
                           <option>Failed</option>
                           <option>Queued</option>
                        </select>
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined pointer-events-none">expand_more</span>
                     </div>
                  </div>
                  <div className="xl:col-span-2">
                     <button onClick={action('Navigated to next page', 'info')} className="w-full h-14 bg-navy-950 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-3xl shadow-xl shadow-navy-950/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                        <span className="material-symbols-outlined text-lg">filter_alt</span> Scan
                     </button>
                  </div>
               </div>
            </div>

            {/* Audit Table Card */}
            <div className="bg-white rounded-[4rem] border border-navy-100 shadow-2xl overflow-hidden flex flex-col relative">
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                     <thead>
                        <tr className="bg-navy-50/50 text-[10px] font-black text-navy-300 uppercase tracking-[0.25em] border-b border-navy-100">
                           <th className="px-10 py-8 w-[240px]">Timestamp (UTC)</th>
                           <th className="px-8 py-8 w-[200px]">Template Entity</th>
                           <th className="px-8 py-8 w-[200px]">Recipient</th>
                           <th className="px-8 py-8 w-[160px]">Status</th>
                           <th className="px-8 py-8">Provider</th>
                           <th className="px-8 py-8 text-center w-[120px]">Integrity</th>
                           <th className="px-10 py-8 text-right w-[120px]">Inspect</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-navy-50">
                        {loading ? (
                           <tr>
                              <td colSpan={7} className="px-10 py-20 text-center">
                                 <div className="flex items-center justify-center gap-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    <span className="text-xs font-black text-navy-300 uppercase tracking-widest">Loading SMS logs...</span>
                                 </div>
                              </td>
                           </tr>
                        ) : logs.length === 0 ? (
                           <tr>
                              <td colSpan={7} className="px-10 py-20 text-center">
                                 <div className="space-y-4">
                                    <span className="material-symbols-outlined text-4xl text-navy-200">sms</span>
                                    <p className="text-xs font-black text-navy-300 uppercase tracking-widest">No SMS notifications found</p>
                                 </div>
                              </td>
                           </tr>
                        ) : (
                           logs.map((log) => (
                              <tr key={log.id} className={`group hover:bg-primary/5 transition-all cursor-default ${log.status === 'failed' ? 'bg-red-50/20' : ''}`}>
                                 <td className="px-10 py-10 font-mono text-xs font-black text-navy-400 tracking-widest tabular-nums uppercase">
                                    {formatDate(log.sentAt)} <span className="text-primary font-black ml-2">{formatTime(log.sentAt)}</span>
                                 </td>
                                 <td className="px-8 py-10 text-sm font-black text-navy-950 uppercase tracking-tighter truncate max-w-[200px]">{log.templateName}</td>
                                 <td className="px-8 py-10">
                                    <p className="text-xs font-black text-navy-950 truncate max-w-[180px]">{log.recipientPhone || '--'}</p>
                                    {log.bookingRef && <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest opacity-60">REF: {log.bookingRef}</p>}
                                 </td>
                                 <td className="px-8 py-10">
                                    <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${statusColor(log.status)}`}>
                                       {log.status}
                                    </span>
                                 </td>
                                 <td className="px-8 py-10 text-xs font-black text-navy-400 uppercase tracking-widest">{log.provider}</td>
                                 <td className="px-8 py-10 text-center">
                                    <span className={`material-symbols-outlined text-2xl ${log.status === 'sent' || log.status === 'delivered' ? 'text-emerald-500' : 'text-red-500 animate-pulse'}`}>
                                       {log.status === 'sent' || log.status === 'delivered' ? 'check_circle' : 'cancel'}
                                    </span>
                                 </td>
                                 <td className="px-10 py-10 text-right">
                                    <button onClick={action('Navigated to previous page', 'info')} className="p-3 bg-navy-50 text-navy-300 hover:text-primary hover:bg-white transition-all shadow-inner rounded-2xl border border-transparent hover:border-navy-100">
                                       <span className="material-symbols-outlined text-xl">{log.status === 'failed' ? 'error' : 'visibility'}</span>
                                    </button>
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>

               {/* Pagination Footer */}
               <div className="px-12 py-10 bg-navy-50/20 border-t border-navy-100 flex flex-col sm:flex-row items-center justify-between gap-10">
                  <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em]">Showing {logs.length} SMS notification logs</p>
                  <div className="flex gap-4">
                     <button onClick={action('Prev Page — action triggered', 'info')} className="px-10 py-4 bg-white border-2 border-navy-100 text-navy-300 rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest cursor-not-allowed shadow-sm" disabled>Prev Page</button>
                     <button onClick={action('Navigated to next page', 'info')} className="px-10 py-4 bg-white border-2 border-navy-100 text-navy-950 rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 transition-all shadow-sm">Next Page</button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default SMSAuditLog;
