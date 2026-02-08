
import React, { useState } from 'react';

const sessions = [
  { id: 1, avatar: 'https://i.pravatar.cc/100?u=jane', name: 'jane_doe_super', adminId: '#8921', location: 'Kyiv, UA', ip: '192.168.44.12', activity: 'Accessing Payment Gateway', duration: '04h 12m', risk: 'High (Unusual IP)', riskCol: 'bg-red-50 text-red-700 border-red-100', dot: 'bg-red-500' },
  { id: 2, avatar: 'https://i.pravatar.cc/100?u=mike', name: 'm_korver_admin', adminId: '#4402', location: 'London, UK', ip: '82.14.11.201', activity: 'Editing Flight #BA249', duration: '00h 45m', risk: 'Medium (Multiple Logins)', riskCol: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
  { id: 3, avatar: 'https://i.pravatar.cc/100?u=smith', name: 'a_smith_ops', adminId: '#1120', location: 'New York, USA', ip: '104.22.18.5', activity: 'Reviewing Passenger Manifest', duration: '01h 10m', risk: 'Safe', riskCol: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
  { id: 4, avatar: 'https://i.pravatar.cc/100?u=turner', name: 'r_turner_support', adminId: '#3321', location: 'Berlin, DE', ip: '92.16.88.11', activity: 'Ticket Refund Processing', duration: '02h 05m', risk: 'Safe', riskCol: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
];

const SessionMonitor: React.FC = () => {
  return (
    <div className="h-full flex overflow-hidden font-display bg-navy-50/20">
      {/* Main Content Scroll Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-10 pb-32">
        <div className="max-w-[1200px] mx-auto w-full space-y-10 animate-in fade-in duration-700">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Session Monitor</h1>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                </span>
              </div>
              <p className="text-navy-500 font-medium italic text-lg opacity-80 uppercase tracking-widest">Live Operations | Enhanced Alerts</p>
              <p className="text-navy-400 text-xs font-bold uppercase tracking-widest mt-2 max-w-2xl leading-relaxed">
                Real-time monitoring of active administrator sessions and security access controls across the booking network.
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: 'Active Admins', val: '42', trend: '+2%', icon: 'admin_panel_settings', color: 'text-primary', bg: 'bg-primary/5' },
              { label: 'High Risk Sessions', val: '2', sub: 'CRITICAL', icon: 'warning', color: 'text-red-600', bg: 'bg-red-50', alert: true },
              { label: 'Avg Session Time', val: '12m', sub: 'Global Avg: 15m', icon: 'schedule', color: 'text-primary', bg: 'bg-primary/5' },
            ].map((s, i) => (
              <div key={i} className={`bg-white p-8 rounded-[3rem] border shadow-sm flex flex-col group hover:shadow-xl transition-all relative overflow-hidden ${s.alert ? 'border-red-100 ring-2 ring-red-50' : 'border-navy-100'}`}>
                 <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-navy-950 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[100px] font-black">{s.icon}</span>
                 </div>
                 <div className="flex justify-between items-start mb-6">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${s.alert ? 'text-red-500' : 'text-navy-400'}`}>{s.label}</p>
                    <div className={`p-2.5 rounded-xl bg-navy-50 ${s.color} shadow-inner group-hover:scale-110 transition-transform`}>
                       <span className="material-symbols-outlined font-black">{s.icon}</span>
                    </div>
                 </div>
                 <div className="flex items-baseline gap-4 relative z-10">
                    <h3 className={`text-4xl font-black tracking-tighter uppercase leading-none ${s.alert ? 'text-red-600' : 'text-navy-950'}`}>{s.val}</h3>
                    {s.trend ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <span className="material-symbols-outlined text-xs">trending_up</span> {s.trend}
                      </span>
                    ) : (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border shadow-sm ${s.alert ? 'bg-red-50 text-red-600 border-red-200' : 'bg-navy-50 text-navy-400 border-navy-100'}`}>
                        {s.sub}
                      </span>
                    )}
                 </div>
              </div>
            ))}
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-[3rem] border border-navy-100 p-8 shadow-sm space-y-8">
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-5">
                   <div className="relative group">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined text-lg group-focus-within:text-primary transition-all">search</span>
                      <input className="w-full h-14 pl-14 pr-6 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" placeholder="Search by IP, Admin ID, or Location..." />
                   </div>
                </div>
                <div className="lg:col-span-7 flex flex-wrap gap-3 justify-end">
                   <button className="px-8 py-3.5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">All Sessions</button>
                   <button className="flex items-center gap-2 px-8 py-3.5 bg-navy-50 border border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-500 hover:text-navy-950 transition-all">
                      <span className="size-2 rounded-full bg-red-500"></span>
                      High Risk
                   </button>
                   <button className="flex items-center gap-2 px-8 py-3.5 bg-navy-50 border border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-500 hover:text-navy-950 transition-all">
                      <span className="material-symbols-outlined text-lg">public</span>
                      Unusual IP
                   </button>
                   <button className="px-6 py-3.5 bg-white border-2 border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-400 hover:border-primary transition-all"><span className="material-symbols-outlined">filter_list</span></button>
                </div>
             </div>
          </div>

          {/* Active Sessions Table */}
          <div className="bg-white rounded-[4rem] border border-navy-100 shadow-2xl overflow-hidden flex flex-col relative group/table">
             <div className="p-8 border-b border-navy-50 bg-navy-50/20 flex items-center justify-between px-12">
                <h3 className="text-xl font-black text-navy-950 uppercase tracking-tighter">Active Sessions Registry</h3>
                <button className="text-[10px] font-black text-primary uppercase underline tracking-widest flex items-center gap-2">
                   <span className="material-symbols-outlined text-lg">download</span> Export Master Log
                </button>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                   <thead>
                      <tr className="bg-navy-50/50 text-[10px] font-black text-navy-300 uppercase tracking-[0.25em] border-b border-navy-100">
                         <th className="px-12 py-8 w-[320px]">Admin Identity</th>
                         <th className="px-8 py-8 w-[240px]">Location / IP Protocol</th>
                         <th className="px-8 py-8">Current Activity Node</th>
                         <th className="px-8 py-8 w-[160px]">Duration</th>
                         <th className="px-8 py-8 w-[220px]">Risk Signature</th>
                         <th className="px-12 py-8 text-right w-[120px]">Inspect</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-navy-50">
                      {sessions.map((session) => (
                        <tr key={session.id} className="group hover:bg-primary/5 transition-all cursor-default">
                           <td className="px-12 py-10">
                              <div className="flex items-center gap-5">
                                 <div className="size-12 rounded-[1.5rem] bg-navy-100 border-2 border-white shadow-md overflow-hidden shrink-0 group-hover:scale-110 transition-transform">
                                    <img src={session.avatar} alt="" className="w-full h-full object-cover" />
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-sm font-black text-navy-950 uppercase tracking-tight">{session.name}</p>
                                    <p className="text-[9px] font-black font-mono text-navy-200 uppercase tracking-widest opacity-60">ID: {session.adminId}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-10">
                              <div className="flex flex-col gap-1.5 text-navy-950">
                                 <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-navy-200 text-sm">flag</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{session.location}</span>
                                 </div>
                                 <span className="text-[10px] font-mono font-bold text-navy-300 tracking-tight">{session.ip}</span>
                              </div>
                           </td>
                           <td className="px-8 py-10">
                              <p className="text-[11px] font-bold text-navy-500 uppercase italic leading-relaxed tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
                                 {session.activity}
                              </p>
                           </td>
                           <td className="px-8 py-10">
                              <span className="font-mono text-xs font-black text-navy-300 uppercase tracking-widest tabular-nums">{session.duration}</span>
                           </td>
                           <td className="px-8 py-10">
                              <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${session.riskCol}`}>
                                 <span className={`size-1.5 rounded-full ${session.dot} ${session.risk.includes('High') ? 'animate-pulse' : ''}`} />
                                 {session.risk}
                              </span>
                           </td>
                           <td className="px-12 py-10 text-right">
                              <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                 <button className="p-3 bg-navy-50 text-navy-200 border border-navy-50 hover:text-primary hover:bg-white transition-all shadow-inner rounded-2xl"><span className="material-symbols-outlined text-lg">visibility</span></button>
                                 <button className="p-3 bg-red-50 text-red-400 border border-red-50 hover:bg-red-600 hover:text-white transition-all shadow-inner rounded-2xl"><span className="material-symbols-outlined text-lg">logout</span></button>
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             
             {/* Table Pagination */}
             <div className="px-12 py-10 bg-navy-50/20 border-t border-navy-100 flex flex-col sm:flex-row items-center justify-between gap-8">
                <div className="text-[10px] font-black text-navy-400 uppercase tracking-widest">
                   Displaying <span className="text-navy-950 font-black">1</span> to <span className="text-navy-950 font-black">4</span> of <span className="text-navy-950 font-black">42</span> Active Personnel
                </div>
                <div className="flex items-center gap-4">
                   <button className="px-8 py-3 bg-white border-2 border-navy-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-300 cursor-not-allowed shadow-sm transition-all" disabled>Prev Cycle</button>
                   <button className="px-8 py-3 bg-white border-2 border-navy-100 text-navy-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 shadow-sm transition-all">Next Cycle</button>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar: Policy Configuration */}
      <aside className="w-[440px] bg-white border-l border-navy-100 flex flex-col shrink-0 overflow-y-auto custom-scrollbar z-10 shadow-[-30px_0_60px_-15px_rgba(0,0,0,0.05)]">
         <div className="p-10 border-b border-navy-50 bg-navy-50/30 space-y-1">
            <h3 className="font-black text-2xl text-navy-950 uppercase tracking-tight">Security Alert Policies</h3>
            <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest opacity-60">Configure automated system detection rules</p>
         </div>

         <div className="p-10 space-y-12">
            {/* Login Anomalies */}
            <div className="space-y-8">
               <h4 className="text-[10px] font-black text-navy-300 uppercase tracking-[0.3em] px-1 border-l-2 border-primary">Login Anomalies</h4>
               
               <div className="space-y-6">
                  {/* Rule: Unrecognized IP */}
                  <div className="bg-navy-50/50 p-8 rounded-[3rem] border border-navy-50 shadow-inner space-y-8">
                     <div className="flex items-center justify-between">
                        <label className="text-sm font-black text-navy-950 uppercase tracking-tight">Unrecognized IP Address</label>
                        <div className="relative inline-flex items-center h-8 rounded-full w-14 transition-all">
                           <input defaultChecked type="checkbox" className="sr-only peer" />
                           <div className="w-14 h-8 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all shadow-md"></div>
                        </div>
                     </div>
                     <div className="space-y-6 pt-4 border-t border-navy-100/50">
                        <div className="flex justify-between items-center text-[10px] font-black text-navy-400 uppercase tracking-widest px-1">
                           <span>Condition Protocol</span>
                           <span className="text-navy-900">Non-Whitelisted IP</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black text-navy-400 uppercase tracking-widest px-1">
                           <span>Auto-Action Sequence</span>
                           <select className="bg-white border border-navy-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-navy-950 focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer">
                              <option>Force Hub Logout</option>
                              <option>Restrict Access</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  {/* Rule: Concurrent Logins */}
                  <div className="bg-navy-50/50 p-8 rounded-[3rem] border border-navy-50 shadow-inner space-y-8">
                     <div className="flex items-center justify-between">
                        <label className="text-sm font-black text-navy-950 uppercase tracking-tight">Concurrent Logins</label>
                        <div className="relative inline-flex items-center h-8 rounded-full w-14 transition-all">
                           <input defaultChecked type="checkbox" className="sr-only peer" />
                           <div className="w-14 h-8 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all shadow-md"></div>
                        </div>
                     </div>
                     <div className="pt-4 border-t border-navy-100/50 flex justify-between items-center px-1">
                        <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Max Active Hub Sessions</span>
                        <input type="number" defaultValue="1" className="w-16 h-10 text-center bg-white border border-navy-100 rounded-xl text-xs font-black text-navy-950 focus:ring-4 focus:ring-primary/5 shadow-sm" />
                     </div>
                  </div>

                  {/* Rule: Excessive Failed Logins */}
                  <div className="bg-navy-50/50 p-8 rounded-[3rem] border border-navy-100 shadow-inner space-y-8 ring-2 ring-red-500/10">
                     <div className="flex items-center justify-between">
                        <label className="text-sm font-black text-navy-950 uppercase tracking-tight">Excessive Failed Logins</label>
                        <div className="relative inline-flex items-center h-8 rounded-full w-14 transition-all">
                           <input defaultChecked type="checkbox" className="sr-only peer" />
                           <div className="w-14 h-8 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all shadow-md"></div>
                        </div>
                     </div>
                     <div className="space-y-6 pt-4 border-t border-navy-100/50">
                        <div className="flex justify-between items-center px-1">
                           <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Threshold (per minute)</span>
                           <input type="number" defaultValue="5" className="w-16 h-10 text-center bg-white border border-navy-100 rounded-xl text-xs font-black text-navy-950 focus:ring-4 focus:ring-primary/5 shadow-sm" />
                        </div>
                        <label className="flex items-center gap-4 cursor-pointer group px-1">
                           <div className="relative flex items-center group/check">
                              <input type="checkbox" defaultChecked className="peer h-6 w-6 appearance-none rounded-lg border-2 border-navy-200 checked:bg-red-500 checked:border-red-500 transition-all shadow-sm" />
                              <span className="material-symbols-outlined text-white text-sm absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 peer-checked:opacity-100 font-black">check</span>
                           </div>
                           <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest group-hover:text-red-600 transition-colors">Temporary Hub Lock (15m)</span>
                        </label>
                     </div>
                  </div>
               </div>
            </div>

            {/* Behavioral Monitoring */}
            <div className="space-y-8">
               <h4 className="text-[10px] font-black text-navy-300 uppercase tracking-[0.3em] px-1 border-l-2 border-primary">Behavioral Monitoring</h4>
               
               <div className="space-y-6">
                  {/* Unusual Hours */}
                  <div className="bg-navy-50/50 p-8 rounded-[3rem] border border-navy-50 shadow-inner space-y-8">
                     <div className="flex items-center justify-between">
                        <label className="text-sm font-black text-navy-950 uppercase tracking-tight">Unusual Hours Activity</label>
                        <div className="relative inline-flex items-center h-8 rounded-full w-14 transition-all">
                           <input defaultChecked type="checkbox" className="sr-only peer" />
                           <div className="w-14 h-7 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all shadow-md"></div>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-6 pt-4 border-t border-navy-100/50">
                        <div className="space-y-2">
                           <span className="text-[9px] font-black text-navy-300 uppercase tracking-widest ml-2">Registry Start</span>
                           <input type="time" defaultValue="22:00" className="w-full h-12 px-5 bg-white border border-navy-100 rounded-2xl text-xs font-black text-navy-950 uppercase focus:ring-4 focus:ring-primary/5 shadow-inner appearance-none" />
                        </div>
                        <div className="space-y-2">
                           <span className="text-[9px] font-black text-navy-300 uppercase tracking-widest ml-2">Registry End</span>
                           <input type="time" defaultValue="06:00" className="w-full h-12 px-5 bg-white border border-navy-100 rounded-2xl text-xs font-black text-navy-950 uppercase focus:ring-4 focus:ring-primary/5 shadow-inner appearance-none" />
                        </div>
                     </div>
                  </div>

                  {/* Sensitive Module */}
                  <div className="bg-navy-50/50 p-8 rounded-[3rem] border border-navy-50 shadow-inner space-y-8">
                     <div className="flex items-center justify-between">
                        <label className="text-sm font-black text-navy-950 uppercase tracking-tight">Sensitive Module Access</label>
                        <div className="relative inline-flex items-center h-8 rounded-full w-14 transition-all">
                           <input defaultChecked type="checkbox" className="sr-only peer" />
                           <div className="w-14 h-7 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all shadow-md"></div>
                        </div>
                     </div>
                     <div className="space-y-4 pt-4 border-t border-navy-100/50">
                        <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest mb-2 ml-1">Trigger Alert on Access:</p>
                        {['Personnel Financial Config', 'Master Role Registry', 'Global System Logs'].map((lbl, i) => (
                           <label key={i} className="flex items-center gap-4 cursor-pointer group">
                              <div className="relative flex items-center group/check">
                                 <input type="checkbox" defaultChecked={i < 2} className="peer h-6 w-6 appearance-none rounded-lg border-2 border-navy-200 checked:bg-primary checked:border-primary transition-all shadow-sm" />
                                 <span className="material-symbols-outlined text-white text-sm absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 peer-checked:opacity-100 font-black">check</span>
                              </div>
                              <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest group-hover:text-navy-900 transition-colors">{lbl}</span>
                           </label>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* Notification Channels */}
            <div className="space-y-8 pt-4">
               <h4 className="text-[10px] font-black text-navy-300 uppercase tracking-[0.3em] px-1 border-l-2 border-primary">Dispatch Channels</h4>
               <div className="space-y-3">
                  {[
                    { lbl: 'Security Team Dispatch', icon: 'mail', color: 'bg-blue-50 text-blue-600', active: true },
                    { lbl: 'Logical Hub: #sec-ops', icon: 'tag', color: 'bg-purple-50 text-purple-600', active: true },
                    { lbl: 'SMS Emergency Protocol', icon: 'sms', color: 'bg-orange-50 text-orange-600', active: false },
                  ].map((ch, i) => (
                    <label key={i} className="flex items-center justify-between p-5 rounded-[2rem] bg-navy-50 border border-navy-100 hover:bg-white transition-all cursor-pointer group shadow-sm">
                       <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl ${ch.color} shadow-inner group-hover:scale-110 transition-transform`}>
                             <span className="material-symbols-outlined text-lg">{ch.icon}</span>
                          </div>
                          <span className="text-[10px] font-black text-navy-700 uppercase tracking-widest">{ch.lbl}</span>
                       </div>
                       <div className="relative flex items-center group/check">
                          <input type="checkbox" defaultChecked={ch.active} className="peer h-6 w-6 appearance-none rounded-lg border-2 border-navy-200 checked:bg-emerald-500 checked:border-emerald-500 transition-all shadow-sm" />
                          <span className="material-symbols-outlined text-white text-sm absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 peer-checked:opacity-100 font-black">check</span>
                       </div>
                    </label>
                  ))}
               </div>
            </div>
         </div>

         {/* Sticky Footer */}
         <div className="p-10 border-t border-navy-50 bg-navy-50/10 sticky bottom-0 z-10 backdrop-blur-md">
            <button className="w-full py-5 bg-primary text-white font-black uppercase text-xs tracking-[0.2em] rounded-[1.75rem] shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
               <span className="material-symbols-outlined text-xl">save</span> Save Registry Logic
            </button>
         </div>
      </aside>
    </div>
  );
};

export default SessionMonitor;
