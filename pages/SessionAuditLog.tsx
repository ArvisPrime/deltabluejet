
import React from 'react';

const SessionAuditLog: React.FC = () => {
  const auditLogs = [
    { id: 1, ts: 'Oct 09', hour: '14:02:11', actor: 'Admin_JSmith', avatar: 'bg-gradient-to-tr from-blue-500 to-cyan-400', action: 'Termination', color: 'bg-red-50 text-red-700 border-red-100', icon: 'gavel', target: 'Session_882A', desc: 'Suspicious activity detected from unusual geolocation.', ip: '192.168.1.42' },
    { id: 2, ts: 'Oct 09', hour: '13:45:00', actor: 'SuperAdmin_K', avatar: 'bg-gradient-to-tr from-purple-500 to-pink-400', action: 'Policy Change', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'edit_document', target: 'Global_Timeout', desc: 'Modified inactivity timeout from 30m to 15m.', ip: '10.0.0.5' },
    { id: 3, ts: 'Oct 08', hour: '09:12:44', actor: 'Sys_AutoBot', avatar: 'bg-gradient-to-tr from-green-500 to-emerald-400', action: 'Timeout', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: 'timer_off', target: 'Session_91X2', desc: 'Session expired due to inactivity > 15m.', ip: '172.16.254.1' },
    { id: 4, ts: 'Oct 08', hour: '08:30:15', actor: 'Admin_JSmith', avatar: 'bg-gradient-to-tr from-blue-500 to-cyan-400', action: 'Access', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'vpn_key', target: 'Session_91X2', desc: 'Successful login via 2FA verification.', ip: '192.168.1.42' },
    { id: 5, ts: 'Oct 07', hour: '16:22:01', actor: 'Admin_M', avatar: 'bg-gradient-to-tr from-gray-500 to-slate-400', action: 'Failed Login', color: 'bg-red-50 text-red-700 border-red-200', icon: 'block', target: 'N/A', desc: 'Invalid credentials provided (Attempt 3).', ip: '203.0.113.8' },
  ];

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden font-display bg-navy-50/20">
      {/* Filters Sidebar */}
      <aside className="w-full lg:w-80 bg-white border-r border-navy-100 flex flex-col p-8 gap-10 shrink-0 shadow-sm z-10 overflow-y-auto custom-scrollbar">
        <div className="space-y-6">
           <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight">Logical Filters</h3>
           
           {/* Calendar Component Mockup */}
           <div className="bg-navy-50/50 rounded-[2.5rem] p-6 border border-navy-100 shadow-inner">
              <div className="flex items-center justify-between mb-4">
                 <button className="p-1 hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">chevron_left</span></button>
                 <p className="text-[10px] font-black text-navy-900 uppercase tracking-widest">October 2024</p>
                 <button className="p-1 hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">chevron_right</span></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                 {['S','M','T','W','T','F','S'].map(d => (
                    <span key={d} className="text-[8px] font-black text-navy-300 uppercase py-2">{d}</span>
                 ))}
                 {[...Array(31)].map((_, i) => (
                    <button key={i} className={`size-8 flex items-center justify-center text-[10px] font-black rounded-full transition-all ${
                      i+1 === 9 ? 'bg-primary text-white shadow-lg shadow-primary/30' : 
                      i+1 > 4 && i+1 < 10 ? 'bg-primary/10 text-primary' : 'hover:bg-navy-50 text-navy-400'
                    }`}>
                       {i+1}
                    </button>
                 ))}
              </div>
           </div>

           {/* Action Type */}
           <div className="space-y-4">
              <p className="text-[10px] font-black text-navy-300 uppercase tracking-[0.25em] px-1">Action Registry</p>
              <div className="space-y-3">
                 {[
                   { lbl: 'Force Termination', active: true },
                   { lbl: 'Policy Updates', active: true },
                   { lbl: 'System Timeouts', active: false },
                   { lbl: 'Access Granted', active: false }
                 ].map((t, i) => (
                    <label key={i} className="flex items-center gap-4 cursor-pointer group">
                       <div className="relative flex items-center group/check">
                          <input type="checkbox" defaultChecked={t.active} className="peer h-6 w-6 appearance-none rounded-lg border-2 border-navy-100 checked:bg-primary checked:border-primary transition-all shadow-sm" />
                          <span className="material-symbols-outlined text-white text-sm absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 peer-checked:opacity-100 font-black">check</span>
                       </div>
                       <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest group-hover:text-navy-950 transition-colors">{t.lbl}</span>
                    </label>
                 ))}
              </div>
           </div>

           {/* Admin Search */}
           <div className="space-y-4">
              <p className="text-[10px] font-black text-navy-300 uppercase tracking-[0.25em] px-1">Filter by Admin ID</p>
              <div className="relative group">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined text-lg group-focus-within:text-primary">person_search</span>
                 <input className="w-full h-12 pl-12 pr-4 bg-navy-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-900 focus:ring-4 focus:ring-primary/5 shadow-inner" placeholder="Enter ID..." />
              </div>
           </div>
        </div>

        <button className="mt-auto w-full py-4 bg-navy-950 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-[1.5rem] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
           <span className="material-symbols-outlined text-xl">restart_alt</span> Reset Hub Filters
        </button>
      </aside>

      {/* Main Registry View */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar p-10">
         <div className="max-w-[1400px] mx-auto w-full space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="space-y-6">
               <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300 px-1">
                  <span>Security Terminal</span>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span className="text-primary">Session Audit Log</span>
               </nav>
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-navy-100 pb-10">
                  <div className="max-w-2xl space-y-4">
                     <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">Session Security Audit Log</h1>
                     <p className="text-navy-500 font-medium italic text-xl leading-relaxed uppercase tracking-wider opacity-80">Chronological ledger of all administrative session activities, policy modifications, and forensic terminations.</p>
                  </div>
                  <button className="flex items-center gap-3 px-10 py-4 bg-primary text-white rounded-[1.75rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                     <span className="material-symbols-outlined text-xl">download</span> Export Audit Record
                  </button>
               </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
               {[
                 { label: 'Total Actions (24h)', val: '142', icon: 'history', color: 'text-primary', bg: 'bg-primary/5' },
                 { label: 'Force Terminations', val: '3', icon: 'gavel', color: 'text-red-600', bg: 'bg-red-50' },
                 { label: 'Policy Updates', val: '1', icon: 'policy', color: 'text-orange-600', bg: 'bg-orange-50' },
               ].map((s, i) => (
                 <div key={i} className="bg-white p-8 rounded-[3rem] border border-navy-100 shadow-sm flex flex-col group hover:shadow-xl transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-navy-950 group-hover:scale-110 transition-transform duration-700">
                       <span className="material-symbols-outlined text-[120px] font-black">{s.icon}</span>
                    </div>
                    <div className="flex items-center gap-6 mb-6">
                       <div className={`p-3 rounded-2xl ${s.bg} ${s.color} shadow-inner`}>
                          <span className="material-symbols-outlined text-2xl font-black">{s.icon}</span>
                       </div>
                       <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{s.label}</p>
                    </div>
                    <h3 className="text-5xl font-black text-navy-950 tracking-tighter uppercase relative z-10">{s.val}</h3>
                 </div>
               ))}
            </div>

            {/* Registry Search Hub */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white p-6 rounded-[2.5rem] border border-navy-100 shadow-sm">
               <div className="relative flex-1 w-full group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined group-focus-within:text-primary transition-colors">search</span>
                  <input className="w-full h-14 pl-16 pr-8 bg-navy-50 border-none rounded-[1.5rem] text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" placeholder="Search by Session ID, IP Protocol, or Logic Sequence..." />
               </div>
               <div className="flex items-center gap-8 px-6 border-l border-navy-50">
                  <span className="text-[10px] font-black text-navy-300 uppercase tracking-widest whitespace-nowrap">Sort Logic:</span>
                  <select className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-navy-950 focus:ring-0 cursor-pointer">
                     <option>Newest Cycle First</option>
                     <option>Oldest Entry First</option>
                     <option>Severity: High</option>
                  </select>
               </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-[4rem] border border-navy-100 shadow-2xl overflow-hidden flex flex-col relative group/table">
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                     <thead>
                        <tr className="bg-navy-50/50 text-[10px] font-black text-navy-300 uppercase tracking-[0.25em] border-b border-navy-100">
                           <th className="px-12 py-10 w-[240px]">Hub Timestamp (UTC)</th>
                           <th className="px-8 py-10 w-[260px]">Actor Identity Node</th>
                           <th className="px-8 py-10 w-[180px]">Action Protocol</th>
                           <th className="px-8 py-10 w-[240px]">Target Entity / Session</th>
                           <th className="px-8 py-10">Logical Change Description</th>
                           <th className="px-12 py-10 text-right w-[180px]">IP Protocol</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-navy-50">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="group hover:bg-primary/5 transition-all cursor-default">
                             <td className="px-12 py-12 font-mono text-xs font-black text-navy-400 tracking-widest tabular-nums uppercase leading-tight">
                                <span>{log.ts}</span>
                                <span className="block text-primary mt-1 opacity-70">{log.hour}</span>
                             </td>
                             <td className="px-8 py-12">
                                <div className="flex items-center gap-5">
                                   <div className={`size-12 rounded-[1.25rem] ${log.avatar} border-2 border-white shadow-lg overflow-hidden group-hover:scale-110 transition-transform duration-500`} />
                                   <span className="text-sm font-black text-navy-950 uppercase tracking-tight">{log.actor}</span>
                                </div>
                             </td>
                             <td className="px-8 py-12">
                                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${log.color}`}>
                                   <span className={`material-symbols-outlined text-sm font-black`}>{log.icon}</span>
                                   {log.action}
                                </span>
                             </td>
                             <td className="px-8 py-12 font-mono text-[11px] font-black text-primary tracking-tight uppercase">{log.target}</td>
                             <td className="px-8 py-12">
                                <p className="text-[11px] font-bold text-navy-500 uppercase italic leading-relaxed tracking-wider opacity-60 group-hover:opacity-100 transition-opacity truncate max-w-sm">
                                   {log.desc}
                                </p>
                             </td>
                             <td className="px-12 py-12 text-right font-mono text-xs font-black text-navy-300 uppercase tabular-nums">{log.ip}</td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
               
               {/* Pagination */}
               <div className="px-12 py-10 bg-navy-50/20 border-t border-navy-100 flex flex-col sm:flex-row items-center justify-between gap-10">
                  <div className="text-[10px] font-black text-navy-400 uppercase tracking-widest">
                     Registry Segment <span className="text-navy-950 font-black">1</span> to <span className="text-navy-950 font-black">5</span> of <span className="text-navy-950 font-black">142</span> Sequential Logs
                  </div>
                  <div className="flex items-center gap-3">
                     <button className="px-8 py-4 bg-white border-2 border-navy-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-300 cursor-not-allowed shadow-sm" disabled>Prev Cycle</button>
                     {[1, 2, 3].map(p => (
                       <button key={p} className={`size-12 flex items-center justify-center rounded-2xl text-xs font-black transition-all ${p === 1 ? 'bg-primary text-white shadow-lg shadow-primary/30 border-primary' : 'bg-white border-2 border-navy-100 text-navy-400 hover:border-navy-400 hover:text-navy-950'}`}>{p}</button>
                     ))}
                     <span className="px-3 text-navy-200 font-black uppercase tracking-[0.3em]">...</span>
                     <button className="size-12 flex items-center justify-center rounded-2xl bg-white border-2 border-navy-100 text-navy-400 hover:border-navy-400 font-black text-xs">15</button>
                     <button className="px-8 py-4 bg-white border-2 border-navy-100 text-navy-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 transition-all shadow-sm">Next Cycle</button>
                  </div>
               </div>
            </div>
         </div>
      </main>
    </div>
  );
};

export default SessionAuditLog;
