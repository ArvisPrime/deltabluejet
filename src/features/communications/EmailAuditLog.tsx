
import React, { useState, useEffect } from 'react';
import { getNotificationLogs } from '../../services/notifications';
import type { NotificationLogDoc } from '../../types/firestore';
import { useAdminAction } from '../../hooks/useAdminAction';
import { useToastStore } from '../../stores/toastStore';

const EmailAuditLog: React.FC = () => {
  const action = useAdminAction();
   const [logs, setLogs] = useState<NotificationLogDoc[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedLog, setSelectedLog] = useState<string | null>(null);

   useEffect(() => {
      const load = async () => {
         setLoading(true);
         try {
            const data = await getNotificationLogs({ channel: 'email', maxResults: 50 });
            setLogs(data);
         } catch (err) {
            console.error('Failed to load email logs:', err);
            useToastStore.getState().addToast("Failed to load email logs", "error");
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

   return (
      <div className="h-full flex flex-col p-8 overflow-hidden font-sans bg-navy-50/20">
         <div className="max-w-[1600px] mx-auto w-full h-full flex flex-col space-y-10 animate-in fade-in duration-500">

            {/* Header */}
            <div className="shrink-0 space-y-6">
               <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300 px-1">
                  <span>Home</span>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span>Communication</span>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span className="text-primary">Audit Log</span>
               </nav>
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-navy-100 pb-10">
                  <div className="max-w-3xl space-y-3">
                     <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">Email Template Audit Log</h1>
                     <p className="text-navy-500 font-medium italic text-xl leading-relaxed uppercase tracking-wider opacity-80">Track, filter, and audit all email notifications sent across the airline system.</p>
                  </div>
                  <div className="flex items-center gap-4">
                     <button onClick={action('Exporting email audit log…', 'success')} className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-navy-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:text-primary transition-all shadow-sm group">
                        <span className="material-symbols-outlined text-xl text-navy-300 group-hover:text-primary">settings</span> Log Settings
                     </button>
                     <button onClick={action('Email cache cleared', 'success')} className="flex items-center gap-3 px-10 py-4 bg-primary text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-xl">download</span> Export Report
                     </button>
                  </div>
               </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-[3rem] border border-navy-100 p-8 shadow-sm space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-navy-950 uppercase tracking-[0.25em] flex items-center gap-3">
                     <span className="material-symbols-outlined text-primary">filter_list</span>
                     Filters & Logic Segments
                  </h3>
                  <button onClick={action('Email cache cleared', 'success')} className="text-[10px] font-black text-primary uppercase underline">Clear System Cache</button>
               </div>
               <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-end">
                  <div className="xl:col-span-6 flex flex-wrap gap-3">
                     {['All', 'Sent', 'Delivered', 'Failed', 'Queued'].map((f, i) => (
                        <button onClick={action('Action triggered', 'info')} key={i} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${i === 0 ? 'bg-primary/5 text-primary border-primary/20 shadow-lg shadow-primary/5' : 'bg-white text-navy-400 border-navy-50 hover:border-navy-200'
                           }`}>{f}</button>
                     ))}
                  </div>
                  <div className="xl:col-span-3">
                     <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined text-lg group-focus-within:text-primary transition-all">search</span>
                        <input className="w-full h-14 pl-12 pr-6 bg-navy-50 border-none rounded-2xl text-xs font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" placeholder="Search Template Name..." />
                     </div>
                  </div>
                  <div className="xl:col-span-3">
                     <div className="relative group cursor-pointer">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined text-lg group-hover:text-primary transition-all">calendar_today</span>
                        <input className="w-full h-14 pl-12 pr-6 bg-navy-50 border-none rounded-2xl text-xs font-black text-navy-950 uppercase cursor-pointer shadow-inner" value="ALL TIME" readOnly />
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
                           <th className="px-8 py-8 w-[200px]">Template</th>
                           <th className="px-8 py-8 w-[200px]">Recipient</th>
                           <th className="px-8 py-8 w-[160px]">Status</th>
                           <th className="px-8 py-8">Subject</th>
                           <th className="px-8 py-8 w-[120px]">Provider</th>
                           <th className="px-10 py-8 text-right w-[120px]">Inspect</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-navy-50">
                        {loading ? (
                           <tr>
                              <td colSpan={7} className="px-10 py-20 text-center">
                                 <div className="flex items-center justify-center gap-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    <span className="text-xs font-black text-navy-300 uppercase tracking-widest">Loading notification logs...</span>
                                 </div>
                              </td>
                           </tr>
                        ) : logs.length === 0 ? (
                           <tr>
                              <td colSpan={7} className="px-10 py-20 text-center">
                                 <div className="space-y-4">
                                    <span className="material-symbols-outlined text-4xl text-navy-200">mail</span>
                                    <p className="text-xs font-black text-navy-300 uppercase tracking-widest">No email notifications found</p>
                                 </div>
                              </td>
                           </tr>
                        ) : (
                           logs.map((log) => (
                              <tr key={log.id} className="group hover:bg-primary/5 transition-all cursor-default">
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
                                          {log.bookingRef && <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest opacity-60">PNR: {log.bookingRef}</p>}
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
                                       onClick={() => setSelectedLog(selectedLog === log.id ? null : log.id)}
                                       className="p-3 bg-navy-50 text-navy-300 hover:text-primary hover:bg-white transition-all shadow-inner rounded-2xl border border-transparent hover:border-navy-100"
                                    >
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
                  <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em]">Showing {logs.length} notification logs</p>
                  <div className="flex gap-4">
                     <button onClick={action('Prev Page — action triggered', 'info')} className="px-10 py-4 bg-white border-2 border-navy-100 text-navy-300 rounded-3xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed shadow-sm" disabled>Prev Page</button>
                     <button onClick={action('Navigated to next page', 'info')} className="px-10 py-4 bg-white border-2 border-navy-100 text-navy-950 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 transition-all shadow-sm">Next Page</button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default EmailAuditLog;
