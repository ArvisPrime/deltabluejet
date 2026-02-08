
import React from 'react';

const SMSAuditLog: React.FC = () => {
  const logs = [
    { ts: 'Oct 24, 2023', hour: '14:32:00', actor: 'Sarah Jenkins', role: 'Admin', action: 'UPDATE', template: 'Flight_Delay_Notify_v2', summary: 'Updated body content to more formal language.', status: 'success', avatar: 'https://i.pravatar.cc/100?u=sarah' },
    { ts: 'Oct 24, 2023', hour: '12:15:45', actor: 'Mike Taylor', role: 'Editor', action: 'CREATE', template: 'Promo_Winter_2024', summary: 'Initial creation of seasonal promo template.', status: 'success', avatar: 'https://i.pravatar.cc/100?u=mike' },
    { ts: 'Oct 23, 2023', hour: '09:00:12', actor: 'System Process', role: 'Automated', action: 'PUBLISH', template: 'Gate_Change_Alert_v5', summary: 'Automated publish triggered by scheduler.', status: 'success', system: true },
    { ts: 'Oct 22, 2023', hour: '16:45:00', actor: 'Sarah Jenkins', role: 'Admin', action: 'DELETE', template: 'Summer_Sale_2022', summary: 'Permanently removed deprecated legacy template.', status: 'success', avatar: 'https://i.pravatar.cc/100?u=sarah' },
    { ts: 'Oct 22, 2023', hour: '10:10:05', actor: 'John Dalton', role: 'Moderator', action: 'UPDATE', template: 'Boarding_Reminder', summary: 'Attempted to remove required variable {GateNumber}. Validation failed.', status: 'failed', avatar: 'https://i.pravatar.cc/100?u=john' },
  ];

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
                <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">SMS Audit Registry</h1>
                <p className="text-navy-500 font-medium italic text-xl leading-relaxed uppercase tracking-wider opacity-80">Chronological ledger of all modifications, publishing events, and system updates for text-based communications.</p>
             </div>
             <div className="flex items-center gap-4">
                <button className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-navy-100 rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest text-navy-700 hover:text-primary transition-all shadow-sm group">
                   <span className="material-symbols-outlined text-xl text-navy-300 group-hover:text-primary">tune</span> Configure Registry
                </button>
                <button className="flex items-center gap-3 px-10 py-4 bg-primary text-white rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                   <span className="material-symbols-outlined text-xl">download</span> Export Audit CSV
                </button>
             </div>
           </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { label: 'Total Modifications (24h)', val: '142', icon: 'history', color: 'text-primary', trend: '+12% vs yesterday', trendCol: 'text-emerald-500' },
             { label: 'Most Active Personnel', val: 'Sarah J.', sub: '45 modifications today', icon: 'person', color: 'text-indigo-600', avatar: 'https://i.pravatar.cc/100?u=sarah' },
             { label: 'System Fault Alerts', val: '3', sub: 'Failed publish attempts', icon: 'error', color: 'text-red-500' },
           ].map((card, i) => (
             <div key={i} className="bg-white p-8 rounded-[3rem] border border-navy-100 shadow-sm flex flex-col group hover:shadow-xl transition-all relative overflow-hidden">
                <div className="flex justify-between items-start mb-6 relative z-10">
                   <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{card.label}</p>
                   <div className={`p-2.5 rounded-xl bg-navy-50 ${card.color} shadow-inner group-hover:scale-110 transition-transform`}>
                      <span className="material-symbols-outlined font-black">{card.icon}</span>
                   </div>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                   {card.avatar && <div className="size-11 rounded-2xl bg-cover bg-center border-2 border-white shadow-md" style={{ backgroundImage: `url(${card.avatar})` }} />}
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
              <button className="text-[10px] font-black text-primary uppercase underline">Reset Filter Hub</button>
           </div>
           
           <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-end">
              <div className="xl:col-span-4">
                 <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined text-lg group-focus-within:text-primary transition-all">search</span>
                    <input className="w-full h-14 pl-14 pr-6 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" placeholder="Search Template, Content, User..." />
                 </div>
              </div>
              <div className="xl:col-span-3">
                 <div className="relative group cursor-pointer">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined text-lg group-hover:text-primary transition-all">calendar_today</span>
                    <input className="w-full h-14 pl-14 pr-6 bg-navy-50 border-none rounded-3xl text-xs font-black text-navy-950 uppercase cursor-pointer shadow-inner" value="OCT 01, 2024 - OCT 31, 2024" readOnly />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined">expand_more</span>
                 </div>
              </div>
              <div className="xl:col-span-3">
                 <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined text-lg group-focus-within:text-primary transition-all">account_tree</span>
                    <select className="w-full h-14 pl-14 pr-10 bg-navy-50 border-none rounded-3xl text-xs font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all shadow-inner appearance-none">
                       <option>All Action Classes</option>
                       <option>Create Template</option>
                       <option>Update Logic</option>
                       <option>Publish Version</option>
                       <option>Delete Segment</option>
                    </select>
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined pointer-events-none">expand_more</span>
                 </div>
              </div>
              <div className="xl:col-span-2">
                 <button className="w-full h-14 bg-navy-950 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-3xl shadow-xl shadow-navy-950/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
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
                       <th className="px-10 py-8 w-[240px]">Hub Timestamp (UTC)</th>
                       <th className="px-8 py-8 w-[280px]">Actor Credentials</th>
                       <th className="px-8 py-8 w-[160px]">Logic Event</th>
                       <th className="px-8 py-8 w-[280px]">Template Entity</th>
                       <th className="px-8 py-8">Change Summary Log</th>
                       <th className="px-8 py-8 text-center w-[120px]">Integrity</th>
                       <th className="px-10 py-8 text-right w-[120px]">Inspect</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-navy-50">
                    {logs.map((log, i) => (
                      <tr key={i} className={`group hover:bg-primary/5 transition-all cursor-default ${log.status === 'failed' ? 'bg-red-50/20' : ''}`}>
                         <td className="px-10 py-10 font-mono text-xs font-black text-navy-400 tracking-widest tabular-nums uppercase">
                            {log.ts} <span className="text-primary font-black ml-2">{log.hour}</span>
                         </td>
                         <td className="px-8 py-10">
                            <div className="flex items-center gap-4">
                               {log.system ? (
                                 <div className="size-11 rounded-2xl bg-navy-900 flex items-center justify-center text-primary shadow-xl border border-white/5">
                                    <span className="material-symbols-outlined text-2xl">dns</span>
                                 </div>
                               ) : (
                                 <div className="size-11 rounded-2xl bg-navy-100 border-2 border-white shadow-md overflow-hidden shrink-0 group-hover:scale-110 transition-transform">
                                    <img src={log.avatar} alt="" className="w-full h-full object-cover" />
                                 </div>
                               )}
                               <div>
                                  <p className="text-sm font-black text-navy-950 uppercase tracking-tight">{log.actor}</p>
                                  <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest opacity-60">{log.role}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-10">
                            <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                              log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              log.action === 'UPDATE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              log.action === 'DELETE' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                               {log.action}
                            </span>
                         </td>
                         <td className="px-8 py-10 text-sm font-black text-navy-950 uppercase tracking-tighter truncate max-w-[240px]">{log.template}</td>
                         <td className="px-8 py-10">
                            <p className="text-[11px] font-bold text-navy-500 uppercase italic leading-relaxed tracking-wider opacity-60 group-hover:opacity-100 transition-opacity truncate max-w-sm">
                               {log.summary}
                            </p>
                         </td>
                         <td className="px-8 py-10 text-center">
                            <span className={`material-symbols-outlined text-2xl ${log.status === 'success' ? 'text-emerald-500' : 'text-red-500 animate-pulse'}`}>
                               {log.status === 'success' ? 'check_circle' : 'cancel'}
                            </span>
                         </td>
                         <td className="px-10 py-10 text-right">
                            <button className="p-3 bg-navy-50 text-navy-300 hover:text-primary hover:bg-white transition-all shadow-inner rounded-2xl border border-transparent hover:border-navy-100">
                               <span className="material-symbols-outlined text-xl">{log.status === 'failed' ? 'error' : 'visibility'}</span>
                            </button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           {/* Pagination Footer */}
           <div className="px-12 py-10 bg-navy-50/20 border-t border-navy-100 flex flex-col sm:flex-row items-center justify-between gap-10">
              <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em]">Registry Segment 1-5 of 243 Sequential Logs</p>
              <div className="flex gap-4">
                 <button className="px-10 py-4 bg-white border-2 border-navy-100 text-navy-300 rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest cursor-not-allowed shadow-sm" disabled>Prev Page</button>
                 <button className="px-10 py-4 bg-white border-2 border-navy-100 text-navy-950 rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 transition-all shadow-sm">Next Page</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SMSAuditLog;
