
import React from 'react';

const SeatMapCMS: React.FC = () => {
  return (
    <div className="h-full flex overflow-hidden bg-navy-50/30 font-display">
      <aside className="w-80 bg-white border-r border-navy-100 flex flex-col shrink-0 shadow-sm z-10">
        <div className="p-6 border-b border-navy-50 space-y-4">
           <label className="block space-y-2">
             <span className="text-[10px] font-black text-navy-300 uppercase tracking-widest">Active Configuration</span>
             <div className="relative group">
                <select className="w-full h-12 pl-10 pr-4 bg-navy-50 border-none rounded-2xl text-sm font-black text-navy-950 focus:ring-2 focus:ring-primary/20 appearance-none">
                   <option>ERJ 145 (Standard Layout)</option>
                   <option>Boeing 787-9 Config A</option>
                </select>
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined">flight</span>
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined">expand_more</span>
             </div>
           </label>
           <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-navy-400 px-1">
             <span>Cap: 50 Pax</span>
             <span className="text-primary">Regional Config</span>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
           <div className="space-y-4">
              <h3 className="text-[10px] font-black text-navy-300 uppercase tracking-widest">Status Legend</h3>
              <div className="space-y-2">
                 {[
                   { label: 'Standard Available', count: 28, color: 'bg-white border-navy-200' },
                   { label: 'Locked / Pending', count: 4, color: 'bg-amber-50 border-amber-400 border-dashed', icon: 'timer', iconCol: 'text-amber-500' },
                   { label: 'Occupied', count: 18, color: 'bg-navy-100 border-navy-200 opacity-60', icon: 'person', iconCol: 'text-navy-400' },
                   { label: 'Blocked / Crew', count: 1, color: 'bg-red-50 border-red-200', icon: 'block', iconCol: 'text-red-400' },
                 ].map((l, i) => (
                   <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-navy-50/50 border border-navy-50 shadow-inner group transition-all hover:bg-white">
                      <div className="flex items-center gap-3">
                         <div className={`size-8 rounded-lg border-2 flex items-center justify-center ${l.color}`}>
                            {l.icon && <span className={`material-symbols-outlined text-xs ${l.iconCol}`}>{l.icon}</span>}
                         </div>
                         <span className="text-[10px] font-black text-navy-600 uppercase tracking-widest">{l.label}</span>
                      </div>
                      <span className="text-xs font-black text-navy-950">{l.count}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="text-[10px] font-black text-navy-300 uppercase tracking-widest">Bulk Operations</h3>
              <div className="grid grid-cols-1 gap-2">
                 {[
                   { label: 'Bulk Seat Lock', sub: 'Manual reservation', icon: 'lock', color: 'bg-amber-50 text-amber-600' },
                   { label: 'Release Expired', sub: 'Flush cached locks', icon: 'history', color: 'bg-blue-50 text-blue-600' },
                   { label: 'Crew Auto-Block', sub: 'Apply duty presets', icon: 'shield_person', color: 'bg-navy-100 text-navy-700' },
                 ].map((t, i) => (
                   <button key={i} className="flex items-center gap-4 p-4 rounded-2xl border-2 border-transparent hover:border-navy-50 hover:bg-white transition-all text-left group shadow-sm">
                      <div className={`size-10 rounded-xl flex items-center justify-center shadow-inner ${t.color}`}>
                         <span className="material-symbols-outlined text-xl">{t.icon}</span>
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-navy-900 uppercase tracking-widest group-hover:text-primary transition-colors">{t.label}</p>
                         <p className="text-[8px] font-bold text-navy-400 uppercase tracking-widest">{t.sub}</p>
                      </div>
                   </button>
                 ))}
              </div>
           </div>
        </div>

        <div className="p-6 bg-navy-950 text-white rounded-t-[2rem]">
           <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Load Assessment</span>
              <span className="text-xl font-black text-primary">38%</span>
           </div>
           <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex">
              <div className="bg-primary w-[38%] h-full"></div>
              <div className="bg-amber-500 w-[8%] h-full opacity-60"></div>
           </div>
           <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-30 mt-4 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Real-time CMS Link Active
           </p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="bg-white border-b border-navy-100 px-10 py-6 flex flex-wrap justify-between items-center shrink-0 shadow-sm z-10">
           <div className="space-y-1">
              <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Visual Layout CMS</h1>
              <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-primary text-white text-[8px]">Live</span>
                ERJ 145 Registry • N14502 • Regional 1-2 Config
              </p>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex bg-navy-50 p-1.5 rounded-2xl border border-navy-100">
                 <button className="px-5 py-2.5 rounded-xl bg-white text-navy-950 font-black text-[10px] uppercase tracking-widest shadow-md">Visual Edit</button>
                 <button className="px-5 py-2.5 rounded-xl text-navy-400 font-black text-[10px] uppercase tracking-widest hover:bg-navy-100">Matrix View</button>
              </div>
              <button className="px-8 py-3.5 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                 <span className="material-symbols-outlined text-lg">save</span>
                 Push Configuration
              </button>
           </div>
        </header>

        <div className="absolute top-32 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/80 backdrop-blur-md px-6 py-2 rounded-full border border-navy-100 shadow-2xl z-20">
           <div className="flex gap-2">
              <button className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20"><span className="material-symbols-outlined text-xl">arrow_selector_tool</span></button>
              <button className="p-2 text-navy-400 hover:bg-navy-50 rounded-xl"><span className="material-symbols-outlined text-xl">brush</span></button>
              <button className="p-2 text-navy-400 hover:bg-navy-50 rounded-xl"><span className="material-symbols-outlined text-xl">lock</span></button>
              <button className="p-2 text-navy-400 hover:bg-navy-50 rounded-xl"><span className="material-symbols-outlined text-xl">block</span></button>
           </div>
           <div className="w-px h-8 bg-navy-100 mx-2"></div>
           <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-navy-400 tracking-widest">ZOOM</span>
              <button className="text-navy-300"><span className="material-symbols-outlined">remove</span></button>
              <span className="text-xs font-black text-navy-950">100%</span>
              <button className="text-navy-300"><span className="material-symbols-outlined">add</span></button>
           </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar flex items-start justify-center p-24 pt-32 bg-navy-50/20">
           <div className="relative bg-white rounded-[130px] border-[6px] border-white ring-4 ring-navy-100/50 shadow-2xl w-[320px] min-h-[1100px] flex flex-col items-center py-24 select-none">
              <div className="absolute top-0 w-full h-32 rounded-t-[125px] border-b-2 border-dashed border-navy-50 flex flex-col items-center justify-center bg-navy-50/10">
                 <span className="text-[9px] font-black text-navy-300 uppercase tracking-[0.3em] mt-8">Flight Deck</span>
                 <div className="mt-2 w-12 h-1 bg-navy-50 rounded-full"></div>
              </div>

              <div className="flex flex-col gap-6 w-full px-8 mt-12">
                 <div className="flex justify-between items-center px-4 mb-6 opacity-30">
                    <div className="flex flex-col items-center gap-1"><span className="material-symbols-outlined">coffee_maker</span><span className="text-[8px] font-black">GALLEY</span></div>
                    <div className="flex flex-col items-center gap-1"><span className="material-symbols-outlined">meeting_room</span><span className="text-[8px] font-black">ENTRY</span></div>
                 </div>

                 <div className="text-center py-2"><span className="bg-indigo-50 text-indigo-500 text-[8px] font-black px-4 py-1 rounded-full uppercase tracking-widest border border-indigo-100">Business / Zone 1</span></div>

                 {[1,2,3].map(row => (
                   <div key={row} className="flex justify-between items-center group relative">
                      <div className={`size-12 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border-2 border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm cursor-pointer hover:border-primary hover:shadow-lg`}>{row}A</div>
                      <span className="text-[8px] font-black text-navy-100 rotate-90 tracking-widest">AISLE</span>
                      <div className="flex gap-2">
                         <div className={`size-12 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border-2 border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm cursor-pointer hover:border-primary`}>{row}B</div>
                         <div className={`size-12 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border-2 border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm cursor-pointer hover:border-primary`}>{row}C</div>
                      </div>
                   </div>
                 ))}

                 <div className="w-full h-px bg-navy-50 my-4 relative">
                   <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3"><span className="text-[8px] font-black text-navy-200 uppercase tracking-widest">Economy Cabin</span></div>
                 </div>

                 {[4,5,6,7,8,9,10,11].map(row => (
                   <div key={row} className="flex justify-between items-center group relative">
                      <div className={`size-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border-2 ${row === 5 ? 'border-dashed border-red-400 bg-red-50 text-red-700' : 'border-navy-50 bg-white text-navy-600'} hover:border-primary`}>{row === 5 ? '!' : `${row}A`}</div>
                      <span className="text-[8px] font-black text-navy-50 opacity-0 group-hover:opacity-100 transition-all uppercase">{row}</span>
                      <div className="flex gap-2">
                         <div className={`size-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border-2 border-navy-50 bg-white text-navy-600 hover:border-primary`}>{row}B</div>
                         <div className={`size-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border-2 border-navy-50 bg-white text-navy-600 hover:border-primary`}>{row}C</div>
                      </div>
                   </div>
                 ))}

                 <div className="relative w-full py-4 px-2">
                    <div className="absolute inset-x-0 top-0 bottom-0 bg-emerald-50/40 border-y border-dashed border-emerald-200 -mx-8 px-8 flex items-center justify-between pointer-events-none">
                       <span className="text-[7px] font-black text-emerald-500 uppercase tracking-[0.3em] rotate-[-90deg]">Emergency Exit Row</span>
                       <span className="text-[7px] font-black text-emerald-500 uppercase tracking-[0.3em] rotate-[90deg]">Emergency Exit Row</span>
                    </div>
                    <div className="flex justify-between items-center relative z-10">
                       <div className="size-11 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border-2 border-emerald-400 bg-emerald-50 text-emerald-700 shadow-md transform scale-110 shadow-emerald-500/10 cursor-pointer">12A</div>
                       <div className="flex gap-2">
                          <div className="size-11 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border-2 border-emerald-400 bg-emerald-50 text-emerald-700 shadow-md transform scale-110 shadow-emerald-500/10 cursor-pointer">12B</div>
                          <div className="size-11 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border-2 border-emerald-400 bg-emerald-50 text-emerald-700 shadow-md transform scale-110 shadow-emerald-500/10 cursor-pointer">12C</div>
                       </div>
                    </div>
                 </div>

                 <div className="w-full flex justify-center py-4 opacity-20"><span className="material-symbols-outlined">more_vert</span></div>
              </div>
           </div>
        </div>
      </div>

      <aside className="w-80 bg-white border-l border-navy-100 flex flex-col shrink-0 shadow-sm z-10">
         <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between">
               <h2 className="text-xl font-black text-navy-950 uppercase tracking-tight">Seat Details</h2>
               <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-indigo-600/20">SEAT 12A</span>
            </div>

            <div className="bg-navy-50/50 p-6 rounded-[2rem] border border-navy-100 space-y-6">
               <h3 className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Configuration Status</h3>
               <div className="grid grid-cols-2 gap-3">
                  {[
                    { lbl: 'Available', icon: 'check_circle', active: true, color: 'text-emerald-600 border-emerald-200 bg-emerald-50' },
                    { lbl: 'Locked', icon: 'lock', color: 'text-navy-400 bg-white' },
                    { lbl: 'Blocked', icon: 'block', color: 'text-navy-400 bg-white' },
                    { lbl: 'Occupied', icon: 'person', color: 'text-navy-400 bg-white' },
                  ].map((s, i) => (
                    <button key={i} className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${s.active ? s.color + ' shadow-md' : 'border-navy-100 ' + s.color + ' hover:bg-white'}`}>
                       <span className="material-symbols-outlined mb-2 text-xl">{s.icon}</span>
                       <span className="text-[9px] font-black uppercase tracking-widest">{s.lbl}</span>
                    </button>
                  ))}
               </div>
            </div>

            <div className="space-y-6">
               <div className="space-y-3">
                  <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Service Tier & Policy</span>
                  <select className="w-full h-14 px-6 bg-navy-50 border-none rounded-2xl text-xs font-black text-navy-950 uppercase focus:ring-2 focus:ring-primary/20 appearance-none">
                     <option>Economy Plus (Exit)</option>
                     <option>Main Cabin</option>
                  </select>
               </div>
               <div className="space-y-3">
                  <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Pricing Override</span>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-navy-300">$</span>
                    <input className="w-full h-14 pl-10 pr-6 bg-navy-50 border-none rounded-2xl text-sm font-black text-navy-950 focus:ring-2 focus:ring-primary/20" defaultValue="315.00" />
                  </div>
               </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-navy-50">
               <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Attributes & Hardware</span>
               <div className="space-y-3">
                  {[
                    { lbl: 'Emergency Exit Row', active: true },
                    { lbl: 'Bassinet Compatible', active: false },
                    { lbl: 'Accessible Seat', active: false },
                  ].map((a, i) => (
                    <label key={i} className="flex items-center justify-between p-4 rounded-2xl bg-navy-50/30 border border-navy-50 transition-all hover:bg-white cursor-pointer group">
                       <span className="text-[10px] font-black text-navy-700 uppercase tracking-widest group-hover:text-primary">{a.lbl}</span>
                       <div className="relative inline-flex items-center h-6 rounded-full w-12 transition-all">
                          <input type="checkbox" defaultChecked={a.active} className="sr-only peer" />
                          <div className="w-12 h-6 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                       </div>
                    </label>
                  ))}
               </div>
            </div>

            <button className="w-full py-5 rounded-2xl bg-red-50 text-red-600 font-black uppercase text-[10px] tracking-[0.2em] border-2 border-dashed border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-2">
               <span className="material-symbols-outlined text-lg">delete_forever</span>
               Purge Seat from Layout
            </button>
         </div>
      </aside>
    </div>
  );
};

export default SeatMapCMS;
