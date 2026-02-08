
import React from 'react';
import { Page } from '../types';

interface ExperimentsAuditLogProps {
  onNavigate: (page: Page) => void;
}

const auditLogs = [
  { id: 1, ts: 'Oct 24, 2023', hour: '10:42 AM', actor: 'Sarah Jenkins', role: 'Product Lead', avatar: 'https://i.pravatar.cc/100?u=sarah', test: 'Homepage Hero Banner', testId: 'AB-2023-894', action: 'Status Change', detail: 'Changed status from Draft to Running.', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
  { id: 2, ts: 'Oct 24, 2023', hour: '09:15 AM', actor: 'Mike Thompson', role: 'CRO Specialist', avatar: 'https://i.pravatar.cc/100?u=mike', test: 'Checkout Flow Button Color', testId: 'AB-2023-892', action: 'Traffic Allocation', detail: 'Variant B traffic allocation increased from 20% to 50%.', color: 'bg-purple-50 text-purple-700 border-purple-100', dot: 'bg-purple-500' },
  { id: 3, ts: 'Oct 23, 2023', hour: '04:00 PM', actor: 'System Logic', role: 'Automated Hub', icon: 'smart_toy', test: 'Mobile Menu Order', testId: 'AB-2023-880', action: 'Auto-Stop', detail: 'Test ended automatically due to statistical significance.', color: 'bg-orange-50 text-orange-700 border-orange-100', dot: 'bg-orange-500' },
  { id: 4, ts: 'Oct 23, 2023', hour: '01:30 PM', actor: 'Sarah Jenkins', role: 'Product Lead', avatar: 'https://i.pravatar.cc/100?u=sarah', test: 'Search Results Filtering', testId: 'AB-2023-888', action: 'Configuration', detail: 'Modified JSON config for Variant C filter layout.', color: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500' },
  { id: 5, ts: 'Oct 22, 2023', hour: '11:15 AM', actor: 'Alex Chen', role: 'DevOps Node', avatar: 'https://i.pravatar.cc/100?u=alex', test: 'Flight Detail Page Pricing', testId: 'AB-2023-875', action: 'Terminated', detail: 'Emergency stop triggered. Negative impact on conversion > 5%.', color: 'bg-red-50 text-red-700 border-red-100', dot: 'bg-red-500' },
];

const ExperimentsAuditLog: React.FC<ExperimentsAuditLogProps> = ({ onNavigate }) => {
  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-700 font-display pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-2">
          <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">
            <span>Optimization Terminal</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary">A/B Test Audit Log</span>
          </nav>
          <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">A/B Test Audit Log</h1>
          <p className="text-navy-500 font-medium italic text-lg opacity-80 uppercase tracking-widest">Track, filter, and audit all modifications to A/B tests, traffic clusters, and system configurations.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:bg-navy-50 transition-all shadow-sm group">
            <span className="material-symbols-outlined text-xl text-navy-300 group-hover:text-primary">tune</span> Configure
          </button>
          <button className="flex items-center gap-3 px-8 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-xl">download</span> Export Log
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Total Actions Today', val: '45', sub: '+12%', icon: 'history', color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'Tests Modified', val: '3', sub: 'Active sessions', icon: 'edit_note', color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Traffic Shifts', val: '12', sub: '+5%', icon: 'alt_route', color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'System Alerts', val: '0', sub: 'Baseline Normal', icon: 'notifications', color: 'text-navy-300', bg: 'bg-navy-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[3rem] border border-navy-100 shadow-sm flex flex-col group hover:shadow-xl transition-all relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-navy-950 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[120px] font-black">{s.icon}</span>
             </div>
             <div className="flex justify-between items-start mb-6">
                <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{s.label}</p>
                <div className={`p-2.5 rounded-xl bg-navy-50 ${s.color} shadow-inner group-hover:scale-110 transition-transform`}>
                   <span className="material-symbols-outlined font-black">{s.icon}</span>
                </div>
             </div>
             <div className="flex items-baseline gap-4 relative z-10">
                <h3 className="text-3xl font-black text-navy-950 tracking-tighter uppercase leading-none">{s.val}</h3>
                {s.sub && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border shadow-sm ${
                    s.sub.startsWith('+') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-navy-50 text-navy-400 border-navy-100'
                  }`}>
                    {s.sub}
                  </span>
                )}
             </div>
          </div>
        ))}
      </div>

      {/* Registry Filter Interface */}
      <div className="bg-white rounded-[3.5rem] border border-navy-100 p-10 shadow-sm space-y-10">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
            <div className="space-y-3">
               <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-1">Registry Search</label>
               <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined group-focus-within:text-primary transition-all">search</span>
                  <input className="w-full h-14 pl-14 pr-6 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" placeholder="Search ID, Test Name..." />
               </div>
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-1">Date Range</label>
               <div className="relative group cursor-pointer">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined group-hover:text-primary transition-all">calendar_today</span>
                  <input className="w-full h-14 pl-14 pr-6 bg-navy-50 border-none rounded-3xl text-xs font-black text-navy-950 uppercase cursor-pointer shadow-inner" value="Select dates..." readOnly />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined">expand_more</span>
               </div>
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-1">Admin User</label>
               <div className="relative group">
                  <select className="w-full h-14 px-8 bg-navy-50 border-none rounded-3xl text-[10px] font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all appearance-none shadow-inner">
                     <option>All System Actors</option>
                     <option>Sarah Jenkins</option>
                     <option>Mike Thompson</option>
                     <option>System (Automated)</option>
                  </select>
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined pointer-events-none group-focus-within:text-primary">expand_more</span>
               </div>
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-1">Action Type</label>
               <div className="relative group">
                  <select className="w-full h-14 px-8 bg-navy-50 border-none rounded-3xl text-[10px] font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all appearance-none shadow-inner">
                     <option>All Logic Actions</option>
                     <option>Test Creation</option>
                     <option>Traffic Allocation</option>
                     <option>Status Change</option>
                     <option>Config Update</option>
                  </select>
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined pointer-events-none group-focus-within:text-primary">expand_more</span>
               </div>
            </div>
         </div>
      </div>

      {/* Main Registry Table */}
      <div className="bg-white rounded-[4rem] border border-navy-100 shadow-2xl overflow-hidden flex flex-col group/table">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
               <thead>
                  <tr className="bg-navy-50/50 text-[10px] font-black text-navy-300 uppercase tracking-[0.25em] border-b border-navy-100">
                     <th className="px-12 py-8 w-[240px]">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-all">
                           Hub Timestamp (UTC)
                           <span className="material-symbols-outlined text-sm font-black">arrow_downward</span>
                        </div>
                     </th>
                     <th className="px-8 py-8 w-[280px]">User / Actor</th>
                     <th className="px-8 py-8 w-[280px]">Test Name & ID</th>
                     <th className="px-8 py-8 w-[180px]">Action Protocol</th>
                     <th className="px-8 py-8">Change Details Log</th>
                     <th className="px-12 py-8 text-right w-[100px]">Inspect</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-navy-50">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="group hover:bg-primary/5 transition-all cursor-default">
                       <td className="px-12 py-10">
                          <div className="flex flex-col gap-1 font-mono text-[11px] font-black text-navy-400 tracking-widest tabular-nums uppercase leading-none">
                             <span className="mb-1">{log.ts}</span>
                             <span className="text-primary">{log.hour}</span>
                          </div>
                       </td>
                       <td className="px-8 py-10">
                          <div className="flex items-center gap-4">
                             {log.icon ? (
                               <div className="size-11 rounded-2xl bg-navy-900 flex items-center justify-center text-primary shadow-xl border border-white/5">
                                  <span className="material-symbols-outlined text-xl">{log.icon}</span>
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
                          <div className="space-y-1">
                             <p className="text-sm font-black text-primary uppercase tracking-tighter truncate max-w-[240px] leading-tight">{log.test}</p>
                             <p className="text-[9px] font-black font-mono text-navy-200 uppercase tracking-widest opacity-60 leading-none">SEQ: {log.testId}</p>
                          </div>
                       </td>
                       <td className="px-8 py-10">
                          <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${log.color}`}>
                             <span className={`size-1.5 rounded-full ${log.dot}`} />
                             {log.action}
                          </span>
                       </td>
                       <td className="px-8 py-10">
                          <p className="text-[11px] font-bold text-navy-500 uppercase italic leading-relaxed tracking-wider opacity-60 group-hover:opacity-100 transition-opacity truncate max-w-sm">
                             {log.detail}
                          </p>
                       </td>
                       <td className="px-12 py-10 text-right">
                          <button className="p-3 bg-navy-50 rounded-2xl text-navy-200 border border-navy-50 hover:text-primary hover:bg-white hover:border-navy-100 transition-all shadow-inner hover:shadow-md active:scale-90"><span className="material-symbols-outlined text-lg">visibility</span></button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
         
         {/* Table Pagination Controller */}
         <div className="px-12 py-10 bg-navy-50/30 border-t border-navy-100 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="text-[10px] font-black text-navy-400 uppercase tracking-widest">
               Displaying <span className="text-navy-950 font-black">1</span> to <span className="text-navy-950 font-black">5</span> of <span className="text-navy-950 font-black">45</span> sequential logs
            </div>
            <div className="flex items-center gap-3">
               <button className="px-6 py-3 bg-white border-2 border-navy-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-300 cursor-not-allowed shadow-sm transition-all" disabled>Prev Cycle</button>
               {[1, 2, 3].map(p => (
                 <button key={p} className={`size-11 flex items-center justify-center rounded-2xl text-xs font-black transition-all ${p === 1 ? 'bg-primary text-white shadow-lg shadow-primary/30 border-primary' : 'bg-white border-2 border-navy-100 text-navy-400 hover:border-navy-400 hover:text-navy-950'}`}>{p}</button>
               ))}
               <span className="px-3 text-navy-200 font-black uppercase tracking-[0.3em]">...</span>
               <button className="size-11 flex items-center justify-center rounded-2xl bg-white border-2 border-navy-100 text-navy-400 hover:border-navy-400 font-black text-xs">9</button>
               <button className="px-6 py-3 bg-white border-2 border-navy-100 text-navy-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 shadow-sm transition-all">Next Cycle</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ExperimentsAuditLog;
