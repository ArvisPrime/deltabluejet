
import React from 'react';

const GateAssignment: React.FC = () => {
  return (
    <div className="h-full flex flex-col p-8 overflow-hidden font-display">
      <div className="flex flex-col gap-4 mb-8 shrink-0">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
           <span>Operations</span>
           <span className="material-symbols-outlined text-xs">chevron_right</span>
           <span>Terminal 1</span>
           <span className="material-symbols-outlined text-xs">chevron_right</span>
           <span className="text-primary">Gate Assignment</span>
        </nav>
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Gate Assignment Control</h1>
            <div className="flex items-center gap-3 text-navy-400 font-bold text-[10px] uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">schedule</span> 14:00 Local</span>
              <span className="size-1 rounded-full bg-navy-100"></span>
              <span>18:00 UTC</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-navy-100 bg-white text-navy-700 font-black uppercase text-[10px] tracking-widest hover:bg-navy-50 transition-all">
              <span className="material-symbols-outlined text-lg">filter_list</span>
              Filters
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-primary/20">
              <span className="material-symbols-outlined text-lg">auto_fix_high</span>
              Auto-Assign All
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        {[
          { label: 'Flights Pending', val: '12', sub: '+2 (1h)', icon: 'pending_actions', color: 'text-orange-500' },
          { label: 'Gates Available', val: '4', sub: 'Total: 22', icon: 'meeting_room', color: 'text-emerald-500' },
          { label: 'Occupied Gates', val: '18', sub: '82% Util', icon: 'airplane_ticket', color: 'text-primary' },
          { label: 'Critical Conflicts', val: '1', sub: 'Needs Action', icon: 'warning', color: 'text-red-500' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-navy-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
             <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{s.label}</p>
                <span className={`material-symbols-outlined ${s.color} transition-transform group-hover:scale-110`}>{s.icon}</span>
             </div>
             <div className="flex items-end gap-2">
                <p className="text-3xl font-black text-navy-950 tracking-tighter leading-none">{s.val}</p>
                <p className={`${s.color} text-[10px] font-black uppercase tracking-widest mb-0.5`}>{s.sub}</p>
             </div>
             {s.label.includes('Conflicts') && <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/5 rounded-bl-3xl -mr-4 -mt-4"></div>}
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
        {/* Queue Column */}
        <div className="lg:w-[400px] flex flex-col bg-white rounded-3xl border border-navy-100 shadow-sm overflow-hidden shrink-0">
           <div className="p-5 border-b border-navy-100 flex items-center justify-between bg-navy-50/30">
             <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest">Unassigned Queue</h3>
             <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">12 Queue</span>
           </div>
           <div className="p-3 border-b border-navy-100 bg-white">
             <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-navy-300 text-lg">search</span>
                <input className="w-full pl-10 pr-3 py-2 bg-navy-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 placeholder:text-navy-300 uppercase tracking-widest" placeholder="Search flight..." />
             </div>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
             {[
               { id: 'AA1298', route: 'MIA → JFK', time: '13:55', type: 'B737 (Narrow)', urgent: true },
               { id: 'BA249', route: 'LHR → JFK', time: '14:15', type: 'A380 (Super)', urgent: false, intl: true },
               { id: 'DL405', route: 'ATL → JFK', time: '14:30', type: 'A320 (Narrow)', urgent: false },
               { id: 'JB112', route: 'BOS → JFK', time: '14:45', type: 'E190 (Regional)', urgent: false },
             ].map((f, i) => (
               <div key={i} className={`group flex flex-col p-5 bg-white border-2 rounded-2xl cursor-grab active:cursor-grabbing transition-all hover:shadow-lg ${f.urgent ? 'border-red-100 border-l-red-500' : f.intl ? 'border-blue-100 border-l-blue-500' : 'border-navy-50 hover:border-navy-100'}`}>
                 <div className="flex justify-between items-start mb-3">
                   <div className="space-y-1">
                     <div className="flex items-center gap-2">
                        <span className="font-black text-lg text-navy-950 tracking-tighter uppercase">{f.id}</span>
                        {f.urgent && <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.15em] bg-red-100 text-red-700">Urgent</span>}
                        {f.intl && <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.15em] bg-blue-100 text-blue-700">Intl</span>}
                     </div>
                     <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.2em] flex items-center gap-1.5"><span className="material-symbols-outlined text-xs">flight_land</span> {f.route}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">ETA</p>
                     <p className="text-sm font-black text-navy-950 uppercase tracking-tight">{f.time}</p>
                   </div>
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-navy-500 bg-navy-50 px-2 py-1 rounded-lg w-fit">{f.type}</span>
               </div>
             ))}
           </div>
        </div>

        {/* Map Visualization Column */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-navy-100 shadow-sm overflow-hidden">
           <div className="p-5 border-b border-navy-100 flex flex-wrap gap-6 items-center justify-between bg-navy-50/30">
              <div className="flex items-center gap-6">
                <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest">Terminal Map & Gates</h3>
                <div className="flex bg-white rounded-xl p-1 border border-navy-100 shadow-sm">
                   {['Concourse A', 'Concourse B', 'Concourse C'].map((c, i) => (
                     <button key={i} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${i === 0 ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-navy-400 hover:bg-navy-50'}`}>{c}</button>
                   ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">View Mode</span>
                 <div className="flex border border-navy-100 rounded-xl overflow-hidden shadow-sm">
                   <button className="p-2 bg-primary text-white"><span className="material-symbols-outlined text-[20px]">grid_view</span></button>
                   <button className="p-2 bg-white text-navy-400 hover:bg-navy-50"><span className="material-symbols-outlined text-[20px]">calendar_view_day</span></button>
                 </div>
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6 bg-navy-50/10 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {/* Gate Card: Available */}
                 <div className="bg-white border-2 border-dashed border-emerald-200 rounded-3xl p-6 flex flex-col gap-4 min-h-[220px] hover:border-emerald-500 hover:bg-emerald-50/20 transition-all group shadow-sm">
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-3">
                          <div className="size-10 rounded-[1rem] bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm border border-emerald-100 shadow-inner">A1</div>
                          <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">International</span>
                       </div>
                       <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest border border-emerald-100">Available</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 border-2 border-transparent group-hover:border-primary/20 rounded-2xl border-dashed transition-all">
                       <span className="material-symbols-outlined text-navy-100 text-5xl transition-transform group-hover:scale-110 group-hover:text-primary/30">drag_indicator</span>
                       <p className="text-[10px] font-black text-navy-300 uppercase tracking-[0.2em]">Drag Flight Here</p>
                    </div>
                    <div className="pt-3 border-t border-navy-50 flex justify-between items-center">
                       <span className="text-[8px] font-black text-navy-400 uppercase tracking-widest">Max Load: Heavy (A380)</span>
                    </div>
                 </div>

                 {/* Gate Card: Occupied */}
                 <div className="bg-white border-2 border-navy-50 rounded-3xl p-6 flex flex-col gap-4 min-h-[220px] relative overflow-hidden shadow-sm shadow-navy-100/50">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-3">
                          <div className="size-10 rounded-[1rem] bg-primary/5 text-primary flex items-center justify-center font-black text-sm border border-primary/10 shadow-inner">A2</div>
                          <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Domestic</span>
                       </div>
                       <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-1 rounded-full uppercase tracking-widest">Occupied</span>
                    </div>
                    <div className="bg-navy-50/50 p-4 rounded-2xl space-y-3 border border-navy-100/50 shadow-inner">
                       <div className="flex justify-between items-center">
                          <span className="text-sm font-black text-navy-950 uppercase tracking-tighter">UA442</span>
                          <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest animate-pulse">Boarding</span>
                       </div>
                       <div className="w-full bg-navy-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-orange-500 h-full w-[75%] rounded-full shadow-lg"></div>
                       </div>
                       <div className="flex justify-between text-[8px] font-black text-navy-400 uppercase tracking-widest">
                          <span>Departs in 15m</span>
                          <span>75% Loaded</span>
                       </div>
                    </div>
                    <div className="pt-3 border-t border-navy-50 flex justify-between items-center">
                       <span className="text-[8px] font-black text-navy-400 uppercase tracking-widest">Max: Narrowbody</span>
                       <button className="text-[8px] font-black text-primary uppercase tracking-widest hover:underline">View Details</button>
                    </div>
                 </div>

                 {/* Gate Card: Conflict */}
                 <div className="bg-white border-2 border-red-100 rounded-3xl p-6 flex flex-col gap-4 min-h-[220px] relative shadow-lg shadow-red-500/5">
                    <div className="absolute top-3 right-3 animate-bounce text-red-500">
                       <span className="material-symbols-outlined">warning</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-3">
                          <div className="size-10 rounded-[1rem] bg-red-50 text-red-700 flex items-center justify-center font-black text-sm border border-red-100 shadow-inner">A3</div>
                          <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">International</span>
                       </div>
                       <span className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-full uppercase tracking-widest border border-red-100">Conflict</span>
                    </div>
                    <div className="bg-red-50/50 p-4 rounded-2xl flex flex-col gap-2 border border-red-100 shadow-inner">
                       <div className="flex justify-between items-center">
                          <span className="text-sm font-black text-red-800 uppercase tracking-tighter">AF110</span>
                          <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Overlap</span>
                       </div>
                       <p className="text-[9px] font-black text-red-700/70 leading-relaxed uppercase tracking-widest">
                          Arrival overlaps with DL90 by 10 mins. Immediate rescheduling required.
                       </p>
                       <button className="mt-2 py-2 w-full bg-red-600 text-white text-[9px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-105 transition-all">Resolve Conflict</button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GateAssignment;
