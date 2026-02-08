
import React, { useState } from 'react';

const EmailAuditLog: React.FC = () => {
  const [selectedLog, setSelectedLog] = useState<number | null>(null);

  const logs = [
    { id: 1, ts: 'Oct 24, 2023', hour: '14:32', actor: 'Sarah Jenkins', role: 'Admin', avatar: 'https://i.pravatar.cc/100?u=sarah', template: 'Flight_Confirmation_V2', action: 'Published', color: 'bg-blue-100 text-blue-700 border-blue-200', desc: 'Updated subject line and footer links for holiday promo.' },
    { id: 2, ts: 'Oct 24, 2023', hour: '11:15', actor: 'Marcus Chen', role: 'Editor', avatar: 'https://i.pravatar.cc/100?u=marcus', template: 'Baggage_Delay_Alert', action: 'Edited', color: 'bg-amber-100 text-amber-700 border-amber-200', desc: 'Modified paragraph 2 regarding compensation policy terms.' },
    { id: 3, ts: 'Oct 23, 2023', hour: '09:45', actor: 'Elena Rodriguez', role: 'Manager', avatar: 'https://i.pravatar.cc/100?u=elena', template: 'Promo_Winter_Sale', action: 'Created', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', desc: 'Initial creation of winter seasonal promotion template.' },
    { id: 4, ts: 'Oct 22, 2023', hour: '16:20', actor: 'David Kim', role: 'Admin', avatar: 'https://i.pravatar.cc/100?u=david', template: 'Checkin_Reminder_Legacy', action: 'Deleted', color: 'bg-red-100 text-red-700 border-red-200', desc: 'Removed deprecated template after migration to V3 system.' },
    { id: 5, ts: 'Oct 22, 2023', hour: '10:05', actor: 'Sarah Jenkins', role: 'Admin', avatar: 'https://i.pravatar.cc/100?u=sarah', template: 'Gate_Change_Notif', action: 'Edited', color: 'bg-amber-100 text-amber-700 border-amber-200', desc: 'Corrected typo in header image alt text variable.' },
  ];

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
                <p className="text-navy-500 font-medium italic text-xl leading-relaxed uppercase tracking-wider opacity-80">Track, filter, and audit all modifications made to email communication templates across the airline system.</p>
             </div>
             <div className="flex items-center gap-4">
                <button className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-navy-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:text-primary transition-all shadow-sm group">
                   <span className="material-symbols-outlined text-xl text-navy-300 group-hover:text-primary">settings</span> Log Settings
                </button>
                <button className="flex items-center gap-3 px-10 py-4 bg-primary text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
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
              <button className="text-[10px] font-black text-primary uppercase underline">Clear System Cache</button>
           </div>
           <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-end">
              <div className="xl:col-span-6 flex flex-wrap gap-3">
                 {['All Actions', 'Create', 'Edit', 'Publish', 'Delete'].map((f, i) => (
                    <button key={i} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                      i === 0 ? 'bg-primary/5 text-primary border-primary/20 shadow-lg shadow-primary/5' : 'bg-white text-navy-400 border-navy-50 hover:border-navy-200'
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
                    <input className="w-full h-14 pl-12 pr-6 bg-navy-50 border-none rounded-2xl text-xs font-black text-navy-950 uppercase cursor-pointer shadow-inner" value="OCT 01 - OCT 31, 2024" readOnly />
                 </div>
              </div>
           </div>
        </div>

        {/* Data Registry Table */}
        <div className="flex-1 bg-white rounded-[4rem] border border-navy-100 shadow-sm overflow-hidden flex flex-col relative">
           <div className="overflow-x-auto h-full flex flex-col">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                 <thead>
                    <tr className="bg-navy-50/50 text-[10px] font-black text-navy-300 uppercase tracking-[0.25em] border-b border-navy-100">
                       <th className="px-12 py-8 w-[240px]">Timestamp Hub (UTC)</th>
                       <th className="px-8 py-8 w-[280px]">Actor Credentials</th>
                       <th className="px-8 py-8 w-[280px]">Template Entity</th>
                       <th className="px-8 py-8 w-[160px]">Logic Signature</th>
                       <th className="px-8 py-8">Change Description Log</th>
                       <th className="px-12 py-8 text-right w-[120px]">Inspect</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-navy-50">
                    {logs.map((log) => (
                      <tr key={log.id} className={`group hover:bg-primary/5 transition-all cursor-default ${selectedLog === log.id ? 'bg-primary/5' : ''}`}>
                         <td className="px-12 py-10 font-mono text-xs font-black text-navy-400 tracking-widest tabular-nums uppercase">
                            {log.ts} <span className="text-primary font-black ml-2">{log.hour}</span>
                         </td>
                         <td className="px-8 py-10">
                            <div className="flex items-center gap-4">
                               <div className="size-11 rounded-2xl bg-navy-100 border-2 border-white shadow-md overflow-hidden shrink-0 group-hover:scale-110 transition-transform">
                                  <img src={log.avatar} alt="" className="w-full h-full object-cover" />
                               </div>
                               <div>
                                  <p className="text-sm font-black text-navy-950 uppercase tracking-tight">{log.actor}</p>
                                  <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest opacity-60">{log.role}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-10 text-sm font-black text-navy-950 uppercase tracking-tighter truncate max-w-[280px]">{log.template}</td>
                         <td className="px-8 py-10">
                            <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${log.color}`}>
                               {log.action}
                            </span>
                         </td>
                         <td className="px-8 py-10">
                            <p className="text-[11px] font-bold text-navy-500 uppercase italic leading-relaxed tracking-wider opacity-60 group-hover:opacity-100 transition-opacity truncate max-w-sm">
                               {log.desc}
                            </p>
                         </td>
                         <td className="px-12 py-10 text-right">
                            <button 
                              onClick={() => setSelectedLog(selectedLog === log.id ? null : log.id)}
                              className={`p-3 rounded-2xl shadow-sm border transition-all ${
                                selectedLog === log.id ? 'bg-primary text-white border-primary shadow-primary/20' : 'bg-navy-50 text-navy-200 border-navy-50 hover:text-primary hover:bg-white hover:border-navy-100'
                              }`}
                            >
                               <span className="material-symbols-outlined text-xl">{selectedLog === log.id ? 'close' : 'visibility'}</span>
                            </button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           {/* Pagination */}
           <div className="mt-auto px-12 py-8 bg-navy-50/20 border-t border-navy-50 flex items-center justify-between">
              <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em]">Scanned 5 of 128 Master Logs in Registry</p>
              <div className="flex gap-4">
                 <button className="px-8 py-3.5 bg-white border-2 border-navy-100 text-navy-300 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed shadow-sm" disabled>Prev Cycle</button>
                 <button className="px-8 py-3.5 bg-white border-2 border-navy-100 text-navy-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 transition-all shadow-sm">Next Segment</button>
              </div>
           </div>

           {/* Change Inspector Drawer */}
           <div className={`absolute top-0 right-0 h-full w-[480px] bg-white shadow-[-30px_0_60px_-15px_rgba(0,0,0,0.1)] border-l border-navy-100 z-30 transition-transform duration-500 flex flex-col ${selectedLog ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="p-8 border-b border-navy-50 bg-navy-50/30 flex items-center justify-between">
                 <div>
                    <h3 className="text-xl font-black text-navy-950 uppercase tracking-tighter">Change Inspector</h3>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">LOG ID: #LOG-88234-XJ</p>
                 </div>
                 <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-navy-100 rounded-xl transition-all text-navy-300 hover:text-navy-950"><span className="material-symbols-outlined text-2xl">close</span></button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12">
                 {/* Meta */}
                 <div className="grid grid-cols-2 gap-6 p-8 bg-navy-50 rounded-[2.5rem] border border-navy-100 shadow-inner">
                    <div className="space-y-1">
                       <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Performed By</p>
                       <div className="flex items-center gap-3">
                          <div className="size-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-[9px] text-primary">SJ</div>
                          <span className="text-sm font-black text-navy-950 uppercase tracking-tight">Sarah J.</span>
                       </div>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Registry Time</p>
                       <span className="text-sm font-black text-navy-950 uppercase tracking-tight">Oct 24, 14:32</span>
                    </div>
                    <div className="col-span-2 space-y-1 pt-4 border-t border-navy-100/50">
                       <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Template Source</p>
                       <span className="text-sm font-black text-primary uppercase tracking-tighter flex items-center gap-2">
                          Flight_Confirmation_V2 
                          <span className="material-symbols-outlined text-lg">open_in_new</span>
                       </span>
                    </div>
                 </div>

                 {/* Logic Diff */}
                 <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-navy-300 uppercase tracking-[0.25em] px-2 flex items-center gap-3">
                       <span className="size-1.5 rounded-full bg-primary"></span>
                       Subject Logic Shift
                    </h4>
                    <div className="bg-white rounded-3xl border border-navy-100 overflow-hidden shadow-xl">
                       <div className="p-5 bg-red-50 text-red-600 border-b border-red-100 flex items-start gap-4">
                          <span className="font-black text-red-200 select-none">-</span>
                          <p className="text-xs font-bold line-through opacity-60 uppercase tracking-wider">Booking Confirmed</p>
                       </div>
                       <div className="p-5 bg-emerald-50 text-emerald-700 flex items-start gap-4">
                          <span className="font-black text-emerald-300 select-none">+</span>
                          <p className="text-xs font-black uppercase tracking-wider">Your Flight to {'{{destination}}'} is Confirmed</p>
                       </div>
                    </div>
                 </div>

                 {/* Block Edit */}
                 <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-navy-300 uppercase tracking-[0.25em] px-2 flex items-center gap-3">
                       <span className="size-1.5 rounded-full bg-emerald-500"></span>
                       Content Block Patch
                    </h4>
                    <div className="p-8 bg-white rounded-3xl border border-navy-100 shadow-xl space-y-6">
                       <div className="flex items-center gap-3">
                          <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Added Block</span>
                          <p className="text-xs font-bold text-navy-950 uppercase tracking-widest">New baggage policy footer link.</p>
                       </div>
                       <div className="p-5 bg-navy-900 rounded-2xl shadow-inner group">
                          <code className="text-[10px] font-mono font-bold text-primary break-all leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                             &lt;a href="/policy/baggage-v2" class="btn-ops"&gt;<br/>
                             &nbsp;&nbsp;Read updated baggage terms<br/>
                             &lt;/a&gt;
                          </code>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-8 border-t border-navy-50 bg-navy-50/20">
                 <button className="w-full py-5 rounded-2xl bg-white border-2 border-navy-100 text-navy-900 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined">history</span>
                    Access Version Rollback
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default EmailAuditLog;
