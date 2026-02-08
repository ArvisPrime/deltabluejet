
import React from 'react';

const AlertAuditLog: React.FC = () => {
  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar font-sans bg-navy-50/20">
      <div className="max-w-[1600px] mx-auto w-full space-y-12 pb-24 animate-in fade-in slide-in-from-bottom duration-700">
        
        {/* Page Header */}
        <div className="space-y-6">
           <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300 px-2">
              <span>Security & Compliance</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-primary">System Activity Log</span>
           </nav>
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-navy-100 pb-10">
             <div className="max-w-2xl space-y-4">
                <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">System Activity Log</h1>
                <p className="text-navy-500 font-medium italic text-xl leading-relaxed uppercase tracking-wider">Monitor and audit system-wide events, user actions, and security alerts. Review chronological logs across the booking platform.</p>
             </div>
             <div className="flex gap-4">
               <button className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-navy-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:bg-navy-50 shadow-sm transition-all">
                  <span className="material-symbols-outlined text-xl">tune</span> Settings
               </button>
               <button className="flex items-center gap-3 px-10 py-4 bg-primary text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-xl">download</span> Export Report
               </button>
             </div>
           </div>
        </div>

        {/* High-Level Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'Total Events (24h)', val: '14,203', trend: '5.2%', icon: 'list_alt', color: 'text-primary', bg: 'bg-primary/5' },
            { label: 'Critical Errors', val: '12', trend: 'Last: 2m ago', icon: 'error', color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Active Admins', val: '45', trend: '+2', icon: 'group', color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Security Alerts', val: '3', trend: 'High', icon: 'security', color: 'text-orange-500', bg: 'bg-orange-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white p-8 rounded-[3rem] border border-navy-100 shadow-sm flex flex-col group hover:shadow-xl transition-all relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5 text-navy-950 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[100px] font-black">{s.icon}</span>
               </div>
               <div className="flex justify-between items-start mb-6">
                  <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{s.label}</p>
                  {s.label.includes('Events') && (
                    <span className="flex items-center text-emerald-500 text-xs font-black bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      <span className="material-symbols-outlined text-sm">trending_up</span> {s.trend}
                    </span>
                  )}
               </div>
               <h3 className="text-3xl font-black text-navy-950 tracking-tighter relative z-10">{s.val}</h3>
               {s.trend && !s.label.includes('Events') && (
                 <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${s.label.includes('Alerts') ? 'text-orange-500' : 'text-navy-300'}`}>{s.trend}</p>
               )}
            </div>
          ))}
        </div>

        {/* Filters Panel */}
        <div className="bg-white rounded-[3.5rem] border border-navy-100 p-10 shadow-sm space-y-10">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-1">Global Scan</label>
                 <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined group-focus-within:text-primary transition-all">search</span>
                    <input className="w-full h-14 pl-14 pr-6 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" placeholder="User ID, Action or IP..." />
                 </div>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-1">Logic Module</label>
                 <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined group-focus-within:text-primary transition-all">view_module</span>
                    <select className="w-full h-14 pl-14 pr-10 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all appearance-none shadow-inner">
                       <option>All System Modules</option>
                       <option>Bookings</option>
                       <option>Payments</option>
                       <option>Flight Ops</option>
                       <option>Auth Triage</option>
                    </select>
                 </div>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-1">Severity Tier</label>
                 <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined group-focus-within:text-primary transition-all">flaky</span>
                    <select className="w-full h-14 pl-14 pr-10 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all appearance-none shadow-inner">
                       <option>All Performance Levels</option>
                       <option>Success</option>
                       <option>Warning</option>
                       <option>Critical Error</option>
                    </select>
                 </div>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-1">Temporal Window</label>
                 <div className="relative group cursor-pointer">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined group-hover:text-primary transition-all">calendar_month</span>
                    <input className="w-full h-14 pl-14 pr-6 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 uppercase cursor-pointer shadow-inner" value="Oct 27, 2023 - Oct 28, 2023" readOnly />
                 </div>
              </div>
              <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                <button className="px-12 py-4 bg-primary text-white font-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                  <span className="material-symbols-outlined">filter_list</span> Apply Logical Filters
                </button>
              </div>
           </div>
        </div>

        {/* Registry Table */}
        <div className="bg-white rounded-[4rem] border border-navy-100 shadow-2xl overflow-hidden flex flex-col">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-navy-50/50 text-[10px] font-black text-navy-300 uppercase tracking-[0.3em] border-b border-navy-100">
                       <th className="px-10 py-10">Event Sequence (UTC)</th>
                       <th className="px-10 py-10">Triage Tier</th>
                       <th className="px-10 py-10">Actor Identity</th>
                       <th className="px-10 py-10">Module Link</th>
                       <th className="px-10 py-10">Action Signature</th>
                       <th className="px-10 py-10">Log Description</th>
                       <th className="px-10 py-10 text-right">Inspect</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-navy-50">
                    {[
                      { ts: '2023-10-27 14:30:22', name: 'J.Smith', status: 'Success', color: 'text-emerald-500 bg-emerald-50 border-emerald-100', module: 'Booking', action: 'Modify Reservation', desc: 'Changed seat 4A to 4C on BA123', initial: 'JS', actorCol: 'bg-blue-500/10 text-blue-600' },
                      { ts: '2023-10-27 14:28:15', name: 'System Bot', status: 'Warning', color: 'text-orange-600 bg-orange-50 border-orange-100', module: 'Payments', action: 'Gateway Timeout', desc: 'Retry attempt 2 for TXN_9982', initial: 'SB', actorCol: 'bg-purple-500/10 text-purple-600' },
                      { ts: '2023-10-27 14:15:00', name: 'Unknown IP', status: 'Error', color: 'text-red-600 bg-red-50 border-red-100', module: 'Auth', action: 'Failed Login', desc: 'Multiple failures from 192.168.x.x', initial: '?', actorCol: 'bg-gray-100 text-gray-400' },
                      { ts: '2023-10-27 13:45:10', name: 'A.Kovacs', status: 'Success', color: 'text-emerald-500 bg-emerald-50 border-emerald-100', module: 'Flights', action: 'Update Schedule', desc: 'Delayed FLT-202 by 15 mins', initial: 'AK', actorCol: 'bg-pink-500/10 text-pink-600' },
                      { ts: '2023-10-27 13:10:05', name: 'J.Smith', status: 'Success', color: 'text-emerald-500 bg-emerald-50 border-emerald-100', module: 'Admin', action: 'User Role Update', desc: 'Promoted user_452 to Manager', initial: 'JS', actorCol: 'bg-blue-500/10 text-blue-600' },
                    ].map((log, i) => (
                      <tr key={i} className="hover:bg-navy-50/50 transition-all group cursor-default">
                         <td className="px-10 py-10 font-mono text-xs font-black text-navy-400 uppercase tracking-widest tabular-nums">{log.ts}</td>
                         <td className="px-10 py-10">
                            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${log.color}`}>
                               <span className={`size-1.5 rounded-full ${log.status === 'Success' ? 'bg-emerald-500' : log.status === 'Warning' ? 'bg-orange-500' : 'bg-red-500'}`} />
                               {log.status}
                            </span>
                         </td>
                         <td className="px-10 py-10">
                            <div className="flex items-center gap-3">
                               <div className={`size-10 rounded-xl flex items-center justify-center font-black text-xs shadow-inner ${log.actorCol}`}>{log.initial}</div>
                               <span className="text-sm font-black text-navy-950 uppercase tracking-tighter">{log.name}</span>
                            </div>
                         </td>
                         <td className="px-10 py-10">
                            <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest opacity-60">{log.module}</span>
                         </td>
                         <td className="px-10 py-10">
                            <span className="text-sm font-black text-navy-950 uppercase tracking-tight leading-tight block max-w-[160px]">{log.action}</span>
                         </td>
                         <td className="px-10 py-10">
                            <p className="text-[10px] font-bold text-navy-500 uppercase leading-relaxed tracking-wider italic opacity-70 group-hover:opacity-100 transition-opacity">{log.desc}</p>
                         </td>
                         <td className="px-10 py-10 text-right">
                            <button className="p-3 bg-navy-50 rounded-2xl text-navy-300 hover:text-primary hover:bg-white transition-all shadow-inner hover:shadow-md"><span className="material-symbols-outlined text-lg">visibility</span></button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           
           {/* Pagination */}
           <div className="px-12 py-10 bg-navy-50/30 border-t border-navy-100 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-4">
                 <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest">Rows per sequence:</p>
                 <select className="h-10 px-6 bg-white border-2 border-navy-100 rounded-xl text-xs font-black text-navy-950 uppercase focus:ring-4 focus:ring-primary/5 transition-all shadow-sm">
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                 </select>
              </div>
              <div className="flex items-center gap-10">
                 <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em]">Registry Segment 1-5 of 14,203 Cycles</p>
                 <div className="flex gap-4">
                    <button className="size-12 bg-white border-2 border-navy-200 rounded-xl flex items-center justify-center text-navy-300 cursor-not-allowed shadow-sm transition-all" disabled>
                       <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button className="size-12 bg-white border-2 border-navy-100 rounded-xl flex items-center justify-center text-navy-950 hover:bg-navy-50 hover:border-navy-400 shadow-sm transition-all">
                       <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AlertAuditLog;
