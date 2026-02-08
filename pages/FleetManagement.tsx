
import React from 'react';

const FleetManagement: React.FC = () => {
  return (
    <div className="h-full flex flex-col p-8 overflow-hidden font-sans">
      <div className="flex flex-col gap-4 mb-8 shrink-0">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
           <span>Operations</span>
           <span className="material-symbols-outlined text-xs">chevron_right</span>
           <span>Fleet</span>
           <span className="material-symbols-outlined text-xs">chevron_right</span>
           <span className="text-primary">Aircraft Assignment</span>
        </nav>
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-navy-950 tracking-tighter uppercase">Aircraft Assignment</h1>
            <p className="text-navy-500 font-medium">Assign equipment to flights ensuring timezone alignment and capacity.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 h-11 px-6 rounded-xl border border-navy-100 bg-white text-navy-700 font-black uppercase text-xs tracking-widest hover:bg-navy-50 transition-all shadow-sm">
              <span className="material-symbols-outlined text-[20px]">calendar_view_week</span>
              Gantt View
            </button>
            <button className="flex items-center gap-2 h-11 px-8 rounded-xl bg-primary text-white font-black uppercase text-xs tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-primary/20">
              <span className="material-symbols-outlined text-[20px]">save</span>
              Save Assignments
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-navy-100 shadow-sm">
         <div className="flex flex-wrap gap-2">
            {[
              { label: 'Date', val: 'Oct 24, 2024' },
              { label: 'Origin', val: 'JFK (New York)' },
              { label: 'Type', val: 'All Models' }
            ].map((f, i) => (
              <button key={i} className="flex h-10 items-center gap-2 rounded-xl bg-navy-50 px-4 hover:bg-navy-100 transition-colors border border-navy-100/50">
                <span className="text-navy-400 text-[10px] font-black uppercase tracking-widest">{f.label}:</span>
                <span className="text-navy-950 text-xs font-bold">{f.val}</span>
                <span className="material-symbols-outlined text-[18px] text-navy-300">expand_more</span>
              </button>
            ))}
            <button className="flex h-10 items-center gap-2 rounded-xl bg-white border border-navy-100 px-4 text-navy-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              <span className="text-xs font-bold uppercase tracking-widest">More Filters</span>
            </button>
         </div>
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-orange-500 shadow-sm animate-pulse"></div>
              <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Unassigned:</span>
              <span className="text-sm font-black text-navy-950 tracking-tight">12 Flights</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-emerald-500 shadow-sm"></div>
              <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Available:</span>
              <span className="text-sm font-black text-navy-950 tracking-tight">45 Aircraft</span>
            </div>
         </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden min-h-0">
        {/* Left Column: Demand (Unassigned) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-navy-100 shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-5 bg-navy-50/50 border-b border-navy-100 flex items-center justify-between">
            <h3 className="font-black text-navy-900 uppercase text-xs tracking-[0.2em] flex items-center gap-3">
              <span className="material-symbols-outlined text-primary p-1.5 bg-primary/10 rounded-lg">pending_actions</span> 
              Unassigned Flights
            </h3>
            <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">12 Pending</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white">
            {[
              { id: 'DJ-1024', route: 'LHR → JFK', time: '14:00 EST', pax: 145, req: 'ATR/E-Jet', priority: true },
              { id: 'DJ-452', route: 'JFK → MIA', time: '09:30 AM', pax: 112, req: 'Narrowbody', priority: false },
              { id: 'DJ-881', route: 'LHR → DXB', time: '18:45 PM', pax: 160, req: 'Widebody', priority: false },
              { id: 'DJ-202', route: 'JFK → ORD', time: '20:15 EST', pax: 98, req: 'Waitlist', priority: false },
            ].map((f) => (
              <div key={f.id} className={`group p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${f.id === 'DJ-1024' ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10' : 'border-navy-50 hover:border-navy-200 bg-white'}`}>
                {f.id === 'DJ-1024' && (
                  <div className="absolute top-4 right-4 text-primary animate-pulse">
                    <span className="material-symbols-outlined">radio_button_checked</span>
                  </div>
                )}
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black text-navy-400 bg-navy-50 px-2 py-0.5 rounded tracking-[0.1em] uppercase">{f.id}</span>
                       {f.priority && <span className="text-[10px] font-black text-primary uppercase tracking-widest">High Priority</span>}
                    </div>
                    <h4 className="text-2xl font-black text-navy-950 tracking-tighter">{f.route}</h4>
                  </div>
                  {!f.id.includes('1024') && (
                    <button className="text-navy-300 group-hover:text-primary"><span className="material-symbols-outlined">drag_indicator</span></button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Departure</span>
                    <span className="text-sm font-bold text-navy-950 uppercase tracking-tight">{f.time}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Booked</span>
                    <span className="text-sm font-bold text-navy-950 flex items-center gap-1 uppercase tracking-tight">
                       <span className="material-symbols-outlined text-sm">groups</span> {f.pax} PAX
                    </span>
                  </div>
                </div>
                <div className="bg-white/60 dark:bg-navy-900/5 p-3 rounded-xl border border-navy-100/50">
                   <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-black text-navy-500 uppercase tracking-widest">Requirement</span>
                      <span className="text-[10px] font-black text-navy-950 uppercase">{f.req}</span>
                   </div>
                   <div className="h-1.5 w-full bg-navy-100 rounded-full overflow-hidden">
                      <div className="bg-primary h-full w-[85%] rounded-full"></div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Supply (Fleet) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-navy-100 shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-5 bg-navy-50/50 border-b border-navy-100 flex flex-wrap gap-4 items-center justify-between">
            <h3 className="font-black text-navy-900 uppercase text-xs tracking-[0.2em] flex items-center gap-3">
              <span className="material-symbols-outlined text-primary p-1.5 bg-primary/10 rounded-lg">airplane_ticket</span> 
              Available Fleet
            </h3>
            <div className="relative w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-navy-300 text-[18px]">search</span>
              <input className="w-full pl-10 pr-4 py-2 bg-white border border-navy-100 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none uppercase tracking-widest" placeholder="Tail # or Type" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-navy-50/10">
            <div className="bg-blue-50 border border-blue-100 rounded-[1.5rem] p-5 flex gap-4 items-start shadow-sm shadow-blue-200/20">
              <span className="material-symbols-outlined text-primary p-2 bg-white rounded-xl shadow-sm">auto_awesome</span>
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">AI Recommendation for DJ-1024</p>
                <p className="text-xs text-navy-500 font-bold uppercase tracking-widest italic opacity-80 leading-relaxed">Optimal for turboprop/E-jet regional profile. Matches 145 pax load with minimal fuel overhead.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { id: 'N-7205', type: 'ATR 72-600', cap: 72, loc: 'JFK', status: 'Ready', match: '98%', recommended: true },
                { id: 'N-1755', type: 'Embraer E175', cap: 76, loc: 'JFK', status: 'Ready', match: '85%', recommended: false },
                { id: 'N-4522', type: 'Boeing 737-800', cap: 162, loc: 'MIA', status: 'Transit', match: '42%', recommended: false, warning: 'Inefficient Equipment' },
                { id: 'N-9981', type: 'Airbus A320', cap: 150, loc: 'ORD', status: 'Maint.', match: 'Unavailable', recommended: false },
              ].map((a) => (
                <div key={a.id} className={`p-6 rounded-[2rem] border-2 transition-all relative overflow-hidden group ${
                  a.recommended ? 'border-emerald-400 bg-white shadow-xl shadow-emerald-500/10' : 
                  a.match === 'Unavailable' ? 'border-navy-50 bg-navy-50/30 opacity-60' : 'border-navy-50 bg-white hover:border-navy-200'
                }`}>
                  {a.recommended && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-4 py-1 rounded-bl-xl tracking-widest uppercase">{a.match} Match</div>}
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-navy-50 flex items-center justify-center text-navy-400 shadow-inner group-hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-2xl">flight</span>
                      </div>
                      <div>
                        <h5 className="text-lg font-black text-navy-950 tracking-tight">{a.id}</h5>
                        <p className="text-[10px] text-navy-400 font-black uppercase tracking-widest">{a.type}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      a.status === 'Ready' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                       <span className={`size-1.5 rounded-full ${a.status === 'Ready' ? 'bg-emerald-500 shadow-sm animate-pulse' : 'bg-amber-500'}`}></span>
                       {a.status}
                    </span>
                  </div>
                  
                  {a.warning && (
                    <div className="mb-4 p-2 bg-orange-50 border border-orange-100 rounded-xl flex items-center gap-2">
                       <span className="material-symbols-outlined text-orange-500 text-sm">info</span>
                       <span className="text-[9px] font-black text-orange-700 uppercase tracking-widest">{a.warning}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-navy-50/50 p-3 rounded-xl border border-navy-50">
                      <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest mb-1">Capacity</p>
                      <p className="text-sm font-black text-navy-700 tracking-tight flex items-center gap-1">
                        {a.cap} Seats {a.recommended && <span className="material-symbols-outlined text-emerald-500 text-xs font-black">check_circle</span>}
                      </p>
                    </div>
                    <div className="bg-navy-50/50 p-3 rounded-xl border border-navy-50 text-right">
                      <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest mb-1">Current Loc</p>
                      <p className="text-sm font-black text-navy-700 uppercase tracking-tight">{a.loc}</p>
                    </div>
                  </div>

                  <button 
                    disabled={a.match === 'Unavailable'}
                    className={`w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${
                      a.recommended 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02]' 
                      : a.match === 'Unavailable' 
                        ? 'bg-navy-100 text-navy-300 cursor-not-allowed'
                        : 'bg-white border-2 border-navy-100 text-navy-700 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {a.match === 'Unavailable' ? 'In Maintenance' : `Assign to DJ-1024`}
                    {a.recommended && <span className="material-symbols-outlined text-sm">bolt</span>}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FleetManagement;
