
import React from 'react';

const AircraftSwap: React.FC = () => {
  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar font-display bg-navy-50/20">
      <div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-4">
           <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">
              <span>Operations</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span>Disruptions</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-primary">Aircraft Swap</span>
           </nav>
           <div className="flex flex-wrap justify-between items-end gap-6 border-b border-navy-100 pb-8">
              <div>
                <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase">Aircraft Swap & Re-seat</h1>
                <p className="text-navy-400 font-bold uppercase text-xs tracking-widest mt-2 italic">Managing UA452 Equipment Profile • Disruption Event</p>
              </div>
              <div className="flex gap-4">
                 <button className="px-8 py-4 bg-white border-2 border-navy-100 text-navy-700 font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:bg-navy-50 transition-all">Cancel Event</button>
                 <button className="px-10 py-4 bg-primary text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg">save</span>
                    Finalise Changes
                 </button>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
           <div className="lg:col-span-4 space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-navy-100 p-8 shadow-sm space-y-10">
                 <div className="space-y-6">
                    <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight flex items-center gap-4">
                       <span className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary text-xs font-black">1</span>
                       Flight Target
                    </h3>
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-1">Active Flight #</label>
                          <div className="relative group">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined">search</span>
                             <input className="w-full pl-12 pr-4 py-4 bg-navy-50 border-none rounded-2xl text-navy-950 font-black uppercase tracking-tighter text-xl focus:ring-2 focus:ring-primary/20" defaultValue="UA452" />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-1">Schedule Date</label>
                          <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined">calendar_today</span>
                             <input className="w-full pl-12 pr-4 py-4 bg-navy-50 border-none rounded-2xl text-navy-950 font-black uppercase text-sm focus:ring-2 focus:ring-primary/20" defaultValue="2024-10-24" disabled />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight flex items-center gap-4">
                       <span className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary text-xs font-black">2</span>
                       New Equipment
                    </h3>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-1">Replacement Asset</label>
                       <select className="w-full py-4 px-6 bg-navy-50 border-none rounded-2xl text-navy-950 font-black uppercase text-sm focus:ring-2 focus:ring-primary/20 appearance-none">
                          <option>Boeing 787-9 Dreamliner (N9823X)</option>
                          <option>Airbus A350-900 (N350AA)</option>
                       </select>
                       <div className="p-5 bg-blue-50 rounded-[1.5rem] border border-blue-100 flex items-start gap-4">
                          <span className="material-symbols-outlined text-primary p-1 bg-white rounded-lg shadow-sm">info</span>
                          <p className="text-[9px] font-black text-blue-800 uppercase leading-relaxed tracking-widest">
                             Selected tail has <span className="text-primary underline">42 fewer seats</span>. Automated re-seating will prioritize GS, 1K and family bookings.
                          </p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-8 flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Original Info */}
                 <div className="relative bg-white rounded-[3rem] border border-navy-100 p-8 shadow-sm overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 text-navy-950 group-hover:opacity-10 transition-all duration-700">
                       <span className="material-symbols-outlined text-[160px] rotate-[-20deg]">flight_takeoff</span>
                    </div>
                    <div className="relative z-10 space-y-6">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-navy-300 uppercase tracking-[0.2em]">Current Equipment</p>
                          <h4 className="text-2xl font-black text-navy-950 tracking-tighter uppercase">Boeing 777-300ER</h4>
                       </div>
                       <div className="flex gap-4">
                          {[
                            { lbl: 'Total', val: '350' },
                            { lbl: 'Bus', val: '60' },
                            { lbl: 'Eco', val: '290' },
                          ].map((s, i) => (
                            <div key={i} className="flex-1 bg-navy-50/50 p-4 rounded-3xl border border-navy-50">
                               <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">{s.lbl}</p>
                               <p className="text-xl font-black text-navy-950">{s.val}</p>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Replacement Info */}
                 <div className="relative bg-white rounded-[3rem] border-2 border-primary/20 p-8 shadow-xl shadow-primary/5 overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 text-primary group-hover:opacity-15 transition-all duration-700">
                       <span className="material-symbols-outlined text-[160px] rotate-[-20deg]">flight_land</span>
                    </div>
                    <div className="relative z-10 space-y-6">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">New Equipment Profile</p>
                          <h4 className="text-2xl font-black text-navy-950 tracking-tighter uppercase">Boeing 787-9</h4>
                       </div>
                       <div className="flex gap-4">
                          {[
                            { lbl: 'Total', val: '258', diff: '-92', color: 'text-red-600' },
                            { lbl: 'Bus', val: '48', diff: '-12', color: 'text-orange-600' },
                            { lbl: 'Eco', val: '210', diff: '-80', color: 'text-red-600' },
                          ].map((s, i) => (
                            <div key={i} className="flex-1 bg-primary/5 p-4 rounded-3xl border border-primary/10">
                               <p className="text-[8px] font-black text-primary uppercase tracking-widest">{s.lbl}</p>
                               <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                               <span className="text-[8px] font-black opacity-40 uppercase">{s.diff} Capacity</span>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-navy-950 rounded-[3rem] border border-white/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
                 <div className="flex items-center gap-6 px-4">
                    <div className="size-14 rounded-[1.5rem] bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                       <span className="material-symbols-outlined text-3xl">smart_toy</span>
                    </div>
                    <div>
                       <h4 className="text-lg font-black text-white tracking-tight uppercase">Re-seat Processor</h4>
                       <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Global algorithm for high-density swaps</p>
                    </div>
                 </div>
                 <button className="w-full sm:w-auto px-12 py-5 bg-white text-navy-950 font-black uppercase text-xs tracking-[0.2em] rounded-[1.5rem] shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined">play_arrow</span>
                    Execute Simulation
                 </button>
              </div>

              <div className="bg-white rounded-[3rem] border border-navy-100 shadow-sm flex flex-col overflow-hidden">
                 <div className="p-8 border-b border-navy-50 flex flex-wrap gap-8 items-center justify-between bg-navy-50/20">
                    <div className="flex items-center gap-4">
                       <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight">Resolution Overview</h3>
                       <div className="h-4 w-px bg-navy-100"></div>
                       <div className="flex gap-6">
                          <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500"></span><span className="text-[9px] font-black text-navy-500 uppercase tracking-widest">Success: 246</span></div>
                          <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-red-500 animate-pulse"></span><span className="text-[9px] font-black text-navy-500 uppercase tracking-widest">Unseated: 12</span></div>
                          <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-amber-500"></span><span className="text-[9px] font-black text-navy-500 uppercase tracking-widest">Downgraded: 8</span></div>
                       </div>
                    </div>
                    <button className="text-[9px] font-black text-primary uppercase tracking-widest underline">Detailed Log</button>
                 </div>
                 <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-navy-50/50 text-[9px] font-black text-navy-300 uppercase tracking-[0.3em] border-b border-navy-50">
                             <th className="px-10 py-5">Conflict Passenger</th>
                             <th className="px-10 py-5">Status Tier</th>
                             <th className="px-10 py-5">Orig. Seat</th>
                             <th className="px-10 py-5">System Exception</th>
                             <th className="px-10 py-5 text-right">Resolution</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-navy-50">
                          {[
                            { name: 'Doe, John', tier: 'GS', tCol: 'bg-amber-100 text-amber-800', seat: '4A (Biz)', issue: 'No Seat Available', iCol: 'text-red-600', action: 'Waitlist (Priority)' },
                            { name: 'Smith, Alice', tier: '1K', tCol: 'bg-navy-900 text-white', seat: '5B (Biz)', issue: 'Forced Downgrade', iCol: 'text-amber-600', action: 'Review Comp.' },
                            { name: 'Ross, Mike', tier: 'Blue', tCol: 'bg-navy-50 text-navy-400', seat: '22A (Eco)', issue: 'Group Split Party', iCol: 'text-navy-500', action: 'Find Adjacent' },
                          ].map((ex, i) => (
                            <tr key={i} className="hover:bg-navy-50/50 transition-colors group">
                               <td className="px-10 py-6">
                                  <div className="flex items-center gap-3">
                                     <div className="size-8 rounded-full bg-navy-50 flex items-center justify-center font-black text-[10px] text-navy-400 border border-navy-50">{ex.name.charAt(0)}</div>
                                     <span className="text-xs font-black text-navy-950 uppercase tracking-widest">{ex.name}</span>
                                  </div>
                               </td>
                               <td className="px-10 py-6"><span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${ex.tCol}`}>{ex.tier}</span></td>
                               <td className="px-10 py-6 text-xs font-bold text-navy-400 uppercase tracking-widest">{ex.seat}</td>
                               <td className="px-10 py-6"><span className={`text-[10px] font-black uppercase tracking-widest ${ex.iCol}`}>{ex.issue}</span></td>
                               <td className="px-10 py-6 text-right">
                                  <button className="text-primary font-black uppercase text-[10px] tracking-widest hover:underline">{ex.action}</button>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-navy-100 p-8 shadow-sm flex flex-col md:flex-row gap-10 items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="size-12 rounded-[1.5rem] bg-primary/5 flex items-center justify-center text-primary">
                 <span className="material-symbols-outlined">campaign</span>
              </div>
              <div>
                 <h4 className="text-lg font-black text-navy-950 uppercase tracking-tight">Broadcasting & Comms</h4>
                 <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest">Multi-channel passenger notification link</p>
              </div>
           </div>
           <div className="flex-1 flex gap-6 max-w-2xl w-full">
              {[
                { lbl: 'New Boarding Passes', active: true },
                { lbl: 'Compensation SMS', active: true }
              ].map((c, i) => (
                <label key={i} className="flex-1 flex items-center justify-between p-4 rounded-2xl bg-navy-50 border border-navy-100 cursor-pointer group hover:bg-white transition-all">
                   <span className="text-[9px] font-black text-navy-700 uppercase tracking-widest group-hover:text-primary">{c.lbl}</span>
                   <div className="relative inline-flex items-center h-5 rounded-full w-10 transition-all">
                      <input type="checkbox" defaultChecked={c.active} className="sr-only peer" />
                      <div className="w-10 h-5 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                   </div>
                </label>
              ))}
           </div>
           <div className="w-full md:w-auto">
              <button className="w-full px-12 py-5 bg-navy-950 text-white font-black uppercase text-xs tracking-[0.2em] rounded-3xl shadow-xl hover:scale-105 transition-all">Confirm Communications</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AircraftSwap;
