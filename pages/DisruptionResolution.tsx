
import React, { useState } from 'react';

const DisruptionResolution: React.FC = () => {
  const [activeConflict, setActiveConflict] = useState(1023);

  return (
    <div className="h-full flex overflow-hidden font-sans bg-navy-50/20">
      {/* Triage List */}
      <aside className="w-96 flex-shrink-0 bg-white border-r border-navy-100 flex flex-col h-full shadow-sm z-10">
         <div className="p-6 border-b border-navy-50 space-y-6">
            <h2 className="text-xl font-black text-navy-950 uppercase tracking-tight flex items-center justify-between">
               Conflict Triage
               <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-black tracking-widest animate-pulse">3 CRITICAL</span>
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
               {['All (8)', 'Critical (3)', 'Warning (5)'].map((f, i) => (
                 <button key={i} className={`flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                   i === 0 ? 'bg-navy-900 text-white shadow-lg shadow-navy-950/20' : 'bg-navy-50 text-navy-400 hover:bg-navy-100'
                 }`}>{f}</button>
               ))}
            </div>
         </div>
         <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-navy-50">
            {[
              { id: 1023, type: 'CRITICAL', title: 'Gate Overlap: Gate C12', impact: '10m to impact', f1: 'DJ-123', f2: 'DJ-456' },
              { id: 1024, type: 'WARNING', title: 'Crew Shortage: Cabin', impact: '45m to impact', f1: 'DJ-882', sub: 'Awaiting 2 crew members' },
              { id: 1025, type: 'WARNING', title: 'Maintenance Delay', impact: '1h 20m to impact', f1: 'DJ-990', sub: 'Tech Check Required' },
              { id: 1026, type: 'CRITICAL', title: 'Gate Overlap: Gate B04', impact: '5m to impact', f1: 'DJ-404', f2: 'DJ-902' },
            ].map((c) => (
              <div 
                key={c.id} 
                onClick={() => setActiveConflict(c.id)}
                className={`p-6 border-l-4 cursor-pointer transition-all ${
                  activeConflict === c.id 
                  ? 'bg-primary/5 border-primary shadow-inner' 
                  : 'border-transparent hover:bg-navy-50/50'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                    c.type === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}>{c.type}</span>
                  <span className="text-[10px] font-black text-navy-300 uppercase tracking-widest">{c.impact}</span>
                </div>
                <h3 className="text-sm font-black text-navy-950 uppercase tracking-tight mb-3">{c.title}</h3>
                <div className="flex items-center gap-2">
                   <span className="font-mono bg-white dark:bg-navy-900 px-2 py-1 rounded border border-navy-100 text-[10px] font-black text-navy-700">{c.f1}</span>
                   {c.f2 && (
                     <>
                        <span className="material-symbols-outlined text-[14px] text-red-500 font-black">close</span>
                        <span className="font-mono bg-white dark:bg-navy-900 px-2 py-1 rounded border border-navy-100 text-[10px] font-black text-navy-700">{c.f2}</span>
                     </>
                   )}
                   {c.sub && <span className="text-[10px] font-bold text-navy-400 uppercase italic tracking-widest"> • {c.sub}</span>}
                </div>
              </div>
            ))}
         </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar p-10 bg-navy-50/10">
         <div className="max-w-5xl mx-auto w-full space-y-10 animate-in fade-in slide-in-from-right duration-500">
            <div className="flex justify-between items-start">
               <div>
                  <div className="flex items-center gap-4 mb-2">
                     <h2 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Gate Overlap Conflict #{activeConflict}</h2>
                     <span className="px-4 py-1.5 rounded-full bg-red-600 text-white text-[10px] font-black tracking-[0.2em] shadow-lg shadow-red-500/30 uppercase">Immediate Action</span>
                  </div>
                  <p className="text-navy-500 font-medium italic text-lg">Gate C12 is double-booked. Incoming DJ-456 arrives before DJ-123 departure sequence.</p>
               </div>
               <div className="flex gap-4">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:bg-navy-50 transition-all shadow-sm">
                     <span className="material-symbols-outlined text-lg">history</span> History
                  </button>
                  <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                     <span className="material-symbols-outlined text-lg">chat</span> Crew Link
                  </button>
               </div>
            </div>

            {/* Timeline Visualizer */}
            <div className="bg-white rounded-[2.5rem] border border-navy-100 p-8 shadow-sm space-y-8 relative overflow-hidden group">
               <div className="flex items-center justify-between relative z-10">
                  <h3 className="text-[10px] font-black text-navy-900 uppercase tracking-[0.2em] flex items-center gap-3">
                     <span className="material-symbols-outlined text-primary">schedule</span> Timeline Visualization
                  </h3>
                  <span className="text-[10px] font-black text-navy-400 bg-navy-50 px-3 py-1 rounded-full uppercase tracking-widest">Gate C12 Log</span>
               </div>

               <div className="relative h-48 w-full pt-10 px-4">
                  {/* Grid */}
                  <div className="absolute inset-x-4 top-10 flex justify-between pointer-events-none text-[10px] font-black text-navy-200 uppercase tracking-widest border-t border-navy-50">
                     <span className="relative -top-6">14:00</span>
                     <span className="relative -top-6">14:15</span>
                     <span className="relative -top-6">14:30</span>
                     <span className="relative -top-6">14:45</span>
                     <span className="relative -top-6">15:00</span>
                     <span className="relative -top-6">15:15</span>
                     <span className="relative -top-6">15:30</span>
                  </div>
                  {[16.6, 33.3, 50, 66.6, 83.3].map((pos, idx) => (
                    <div key={idx} className="absolute top-10 bottom-0 w-px bg-navy-50" style={{ left: `${pos}%` }}></div>
                  ))}
                  
                  {/* Now Indicator */}
                  <div className="absolute top-4 bottom-0 w-0.5 bg-red-500 left-[20%] z-20 flex flex-col items-center shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                     <div className="bg-red-500 text-white text-[8px] px-2 py-0.5 rounded uppercase font-black absolute -top-5 tracking-widest shadow-lg">Now</div>
                  </div>

                  {/* Conflict Bars */}
                  <div className="absolute top-16 left-[10%] w-[45%] h-10 bg-blue-100 border-2 border-blue-300 rounded-2xl flex items-center px-4 gap-3 shadow-sm hover:scale-[1.02] transition-all cursor-pointer">
                     <span className="font-black text-[10px] text-blue-900 uppercase tracking-widest">DJ-123 (Dep: 14:45)</span>
                  </div>

                  {/* Overlap Highlight */}
                  <div className="absolute top-10 bottom-0 left-[40%] w-[15%] bg-red-500/5 border-x-2 border-red-500/20 z-0 flex items-center justify-center">
                     <span className="text-[10px] font-black text-red-500 -rotate-90 whitespace-nowrap uppercase tracking-[0.3em]">Overlap Event</span>
                  </div>

                  <div className="absolute top-30 left-[40%] w-[45%] h-10 bg-amber-100 border-2 border-amber-300 rounded-2xl flex items-center px-4 gap-3 mt-4 shadow-sm hover:scale-[1.02] transition-all cursor-pointer">
                     <span className="font-black text-[10px] text-amber-900 uppercase tracking-widest">DJ-456 (Arr: 14:30)</span>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] px-4">Suggested Resolutions</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Option A (Recommended) */}
                  <div className="p-8 rounded-[2.5rem] border-4 border-primary bg-white relative shadow-2xl shadow-primary/10 group hover:scale-[1.01] transition-all">
                    <div className="absolute -top-4 left-10 bg-primary text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg uppercase tracking-widest flex items-center gap-2">
                       <span className="material-symbols-outlined text-sm">auto_awesome</span> AI Recommended
                    </div>
                    <div className="flex justify-between items-start mb-6">
                       <div className="space-y-1">
                          <h4 className="font-black text-navy-950 text-xl uppercase tracking-tighter">Reassign DJ-123 to Gate C14</h4>
                          <p className="text-xs text-navy-500 font-bold uppercase tracking-widest opacity-60">Gate C14 is adjacent and vacant.</p>
                       </div>
                       <div className="bg-emerald-50 text-emerald-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Low Impact</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="bg-navy-50/50 p-4 rounded-2xl border border-navy-50">
                          <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest mb-1">Schedule Shift</p>
                          <p className="font-black text-navy-950 uppercase text-sm">None (0m)</p>
                       </div>
                       <div className="bg-navy-50/50 p-4 rounded-2xl border border-navy-50">
                          <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest mb-1">Pax Transit</p>
                          <p className="font-black text-navy-950 uppercase text-sm">+2 mins</p>
                       </div>
                    </div>
                    <button className="w-full py-5 rounded-2xl bg-primary hover:bg-primary-600 text-white font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-3">
                       <span className="material-symbols-outlined">check_circle</span> Apply & Notify Hub
                    </button>
                  </div>

                  {/* Option B */}
                  <div className="p-8 rounded-[2.5rem] border-2 border-navy-100 bg-white shadow-sm hover:border-navy-300 transition-all">
                    <div className="flex justify-between items-start mb-6">
                       <div className="space-y-1">
                          <h4 className="font-black text-navy-950 text-xl uppercase tracking-tighter">Delay DJ-456 Arrival</h4>
                          <p className="text-xs text-navy-500 font-bold uppercase tracking-widest opacity-60">Hold on tarmac for sequence clearance.</p>
                       </div>
                       <div className="bg-amber-50 text-amber-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">Med Impact</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="bg-navy-50/50 p-4 rounded-2xl border border-navy-50">
                          <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest mb-1">Estimated Delay</p>
                          <p className="font-black text-red-600 uppercase text-sm">+20 mins</p>
                       </div>
                       <div className="bg-navy-50/50 p-4 rounded-2xl border border-navy-50">
                          <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest mb-1">Connections</p>
                          <p className="font-black text-red-600 uppercase text-sm">5 AT RISK</p>
                       </div>
                    </div>
                    <button className="w-full py-5 rounded-2xl bg-white border-2 border-navy-100 text-navy-700 font-black uppercase text-xs tracking-[0.2em] hover:bg-navy-50 transition-all">Select Alternative</button>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
               <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-navy-100 p-8 shadow-sm space-y-8">
                  <div className="flex items-center gap-3">
                     <span className="material-symbols-outlined text-navy-300">tune</span>
                     <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight">Manual Control Override</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Active Target</label>
                        <select className="w-full h-14 px-6 bg-navy-50 border-none rounded-2xl text-xs font-black text-navy-950 uppercase focus:ring-2 focus:ring-primary/20 appearance-none">
                           <option>DJ-123 (Departing)</option>
                           <option>DJ-456 (Arriving)</option>
                        </select>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">New Allocation</label>
                        <select className="w-full h-14 px-6 bg-navy-50 border-none rounded-2xl text-xs font-black text-navy-950 uppercase focus:ring-2 focus:ring-primary/20 appearance-none">
                           <option>Gate C14 (Available)</option>
                           <option>Gate C16 (Available)</option>
                           <option>Gate B02 (Occupied +10m)</option>
                        </select>
                     </div>
                     <div className="md:col-span-2 space-y-3">
                        <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Audit Notes</label>
                        <textarea className="w-full text-xs font-bold p-6 rounded-2xl bg-navy-50 border-none placeholder-navy-200 text-navy-950 focus:ring-2 focus:ring-primary/20 resize-none uppercase" placeholder="Incident code and logic for override..." rows={2}></textarea>
                     </div>
                  </div>
                  <div className="flex justify-end pt-2">
                     <button className="px-10 py-4 bg-navy-900 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-navy-950 shadow-xl transition-all">Validate & Execute</button>
                  </div>
               </div>

               <div className="bg-white rounded-[2.5rem] border border-navy-100 p-8 shadow-sm flex flex-col space-y-8">
                  <div className="flex items-center gap-3">
                     <span className="material-symbols-outlined text-navy-300">group</span>
                     <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight">Impacted Resources</h3>
                  </div>
                  <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                     {[
                       { name: 'Catering Team Alpha', sub: 'Needs Gate Update', icon: 'warning', iconCol: 'text-amber-500', bg: 'bg-amber-50/50' },
                       { name: 'Fuel Truck #04', sub: 'En Route to C12', icon: 'check_circle', iconCol: 'text-emerald-500', bg: 'bg-emerald-50/50' },
                       { name: 'Special Assist', sub: '2 Pax on DJ-123', icon: 'info', iconCol: 'text-navy-300', bg: 'bg-navy-50/50' },
                     ].map((r, i) => (
                       <div key={i} className={`p-4 rounded-2xl border border-navy-50 flex items-center justify-between group hover:bg-white transition-all ${r.bg}`}>
                          <div className="flex items-center gap-3">
                             <div className="size-10 rounded-xl bg-white border border-navy-100 flex items-center justify-center font-black text-[10px] text-navy-400 uppercase shadow-sm">{r.name.charAt(0)}</div>
                             <div className="min-w-0">
                                <p className="text-[10px] font-black text-navy-900 uppercase tracking-tight truncate">{r.name}</p>
                                <p className="text-[8px] font-bold text-navy-400 uppercase tracking-widest">{r.sub}</p>
                             </div>
                          </div>
                          <span className={`material-symbols-outlined text-lg ${r.iconCol}`}>{r.icon}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </main>
    </div>
  );
};

export default DisruptionResolution;
