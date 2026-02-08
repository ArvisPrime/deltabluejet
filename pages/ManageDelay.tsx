
import React from 'react';

const ManageDelay: React.FC = () => {
  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar font-sans bg-navy-50/30">
      <div className="max-w-[1600px] mx-auto w-full space-y-10 animate-in fade-in duration-500 pb-12">
        {/* Breadcrumbs and Title */}
        <div className="space-y-6">
           <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">
              <span>Operations</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-red-500">Delay Management</span>
           </nav>
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-navy-100 pb-8">
             <div>
               <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase">Manage Route Delay</h1>
               <p className="text-navy-500 font-medium italic mt-2 text-lg">Disruption control & passenger notifications for Flight DJ-2091</p>
             </div>
             <div className="flex items-center gap-4 px-6 py-3 rounded-[1.5rem] bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                Currently tracked: On Time
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Panel: Context */}
          <div className="lg:col-span-4 flex flex-col gap-8">
             <div className="bg-white p-8 rounded-[2.5rem] border border-navy-100 shadow-sm space-y-6 group hover:shadow-md transition-all">
                <label className="text-[10px] font-black text-navy-300 uppercase tracking-[0.25em] block px-1">Active Disruption Target</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined font-black">flight</span>
                  <input className="w-full pl-12 pr-10 py-5 bg-navy-50 border-none rounded-3xl text-navy-950 font-black uppercase tracking-tighter text-xl focus:ring-4 focus:ring-primary/5 transition-all" defaultValue="DJ-2091 • JFK → LHR" />
                  <button className="absolute right-5 top-1/2 -translate-y-1/2 text-navy-300 group-hover:text-primary transition-colors"><span className="material-symbols-outlined">expand_more</span></button>
                </div>
             </div>

             <div className="bg-navy-950 rounded-[3rem] shadow-2xl overflow-hidden text-white group relative border border-white/5">
                <div className="relative h-48 bg-navy-900 overflow-hidden">
                   <div className="absolute inset-0 opacity-40 bg-cover bg-center transition-transform duration-[2s] group-hover:scale-110" style={{backgroundImage: "url('https://images.unsplash.com/photo-1473862170180-84427c485aca?auto=format&fit=crop&q=80')"}}></div>
                   <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/50 to-transparent"></div>
                   <div className="absolute bottom-8 left-10 right-10 flex justify-between items-end">
                      <div>
                         <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Primary Equipment</p>
                         <p className="text-2xl font-black tracking-tight uppercase">Boeing 787-9 Dreamliner</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Operations</p>
                         <p className="text-xs font-black bg-white/10 px-4 py-2 rounded-xl uppercase tracking-widest backdrop-blur-md border border-white/10">Boarding T-45</p>
                      </div>
                   </div>
                </div>
                <div className="p-10 space-y-12">
                   <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                         <span className="text-5xl font-black tracking-tighter">JFK</span>
                         <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mt-2">New York</span>
                         <span className="mt-4 text-[10px] font-black bg-white/10 px-4 py-1.5 rounded-full w-fit tracking-widest border border-white/5">18:30 PM</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center px-8 relative">
                         <div className="w-full flex items-center gap-4">
                            <div className="h-0.5 flex-1 bg-white/10 border-t border-dashed border-white/20"></div>
                            <span className="material-symbols-outlined text-primary rotate-90 text-3xl drop-shadow-[0_0_12px_rgba(19,127,236,0.6)]">flight</span>
                            <div className="h-0.5 flex-1 bg-white/10 border-t border-dashed border-white/20"></div>
                         </div>
                         <span className="text-[10px] font-black opacity-30 mt-4 uppercase tracking-[0.3em] whitespace-nowrap">7h 15m Block Time</span>
                      </div>
                      <div className="flex flex-col items-end">
                         <span className="text-5xl font-black tracking-tighter text-right">LHR</span>
                         <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mt-2 text-right">London Heathrow</span>
                         <span className="mt-4 text-[10px] font-black bg-white/10 px-4 py-1.5 rounded-full w-fit tracking-widest border border-white/5">06:45 AM</span>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6 pt-10 border-t border-white/5">
                      <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5 shadow-inner">
                         <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em] block mb-3">Revenue PAX</span>
                         <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-2xl">groups</span>
                            <span className="text-2xl font-black tracking-tighter">245 / 258</span>
                         </div>
                      </div>
                      <div className="bg-orange-500/10 p-5 rounded-[2rem] border border-orange-500/20 shadow-inner">
                         <span className="text-[9px] font-black text-orange-400/50 uppercase tracking-[0.25em] block mb-3">Connections</span>
                         <div className="flex items-center gap-3 text-orange-400">
                            <span className="material-symbols-outlined text-2xl">transfer_within_a_station</span>
                            <span className="text-2xl font-black tracking-tighter">42 AT RISK</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-orange-50/60 p-8 rounded-[2.5rem] border border-orange-100 flex gap-6 items-start shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 transition-transform group-hover:rotate-45">
                   <span className="material-symbols-outlined text-[100px] text-orange-950 font-black">warning</span>
                </div>
                <span className="material-symbols-outlined text-orange-600 p-3 bg-white rounded-2xl shadow-md border border-orange-50 relative z-10">warning</span>
                <div className="relative z-10">
                   <h4 className="text-sm font-black text-orange-950 uppercase tracking-widest">Inbound Conflict Alert</h4>
                   <p className="text-xs font-bold text-orange-800/70 leading-relaxed mt-3 uppercase tracking-wide">Replacement asset N9823X has flagged telemetry issues. Reviewing maintenance logs. ETA sequence likely compromised.</p>
                </div>
             </div>
          </div>

          {/* Right Panel: Actions */}
          <div className="lg:col-span-8 flex flex-col gap-10">
             <div className="bg-white rounded-[3.5rem] border border-navy-100 p-12 shadow-sm space-y-12 transition-all hover:shadow-lg">
                <div className="flex items-center justify-between border-b border-navy-50 pb-8">
                   <h2 className="text-2xl font-black text-navy-950 uppercase tracking-tighter flex items-center gap-4">
                      <span className="material-symbols-outlined text-primary p-2.5 bg-primary/5 rounded-2xl shadow-inner">schedule</span>
                      Sequence Rescheduling
                   </h2>
                   <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-navy-400 uppercase tracking-[0.2em] mb-1">Local Sequence Hub</span>
                      <span className="text-xs font-black text-navy-950 uppercase tracking-widest bg-navy-50 px-4 py-1.5 rounded-full">JFK (GMT-4)</span>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                   <div className="space-y-10">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-1">ETD - Proposed Departure</label>
                         <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1 group">
                               <input type="date" className="w-full pl-12 pr-4 py-5 rounded-3xl border-none bg-navy-50 font-black text-navy-950 uppercase text-sm focus:ring-4 focus:ring-primary/5 transition-all shadow-inner" defaultValue="2024-10-24" />
                               <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 group-focus-within:text-primary">calendar_today</span>
                            </div>
                            <div className="relative w-full sm:w-44 group">
                               <input type="time" className="w-full pl-12 pr-4 py-5 rounded-3xl border-none bg-navy-50 font-black text-navy-950 text-sm focus:ring-4 focus:ring-primary/5 transition-all shadow-inner" defaultValue="20:45" />
                               <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 group-focus-within:text-primary">access_time</span>
                            </div>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-1">Standard Delay Reason</label>
                         <div className="relative group">
                            <select className="w-full py-5 px-8 rounded-3xl border-none bg-navy-50 font-black text-navy-950 uppercase text-sm focus:ring-4 focus:ring-primary/5 appearance-none shadow-inner transition-all">
                               <option>Late Arrival of Inbound Flight</option>
                               <option>Mechanical Failure / AOG</option>
                               <option>Weather Disruption - Origin</option>
                               <option>Crew Scheduling Adjustment</option>
                            </select>
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined pointer-events-none group-focus-within:text-primary">expand_more</span>
                         </div>
                      </div>
                   </div>
                   
                   <div className="bg-navy-50/50 rounded-[3rem] p-10 border border-navy-100 flex flex-col justify-center space-y-10 relative overflow-hidden group/card shadow-inner">
                      <div className="absolute top-0 right-0 p-6 opacity-[0.03] rotate-[-15deg] transition-all duration-1000 group-hover/card:rotate-0 group-hover/card:scale-110">
                         <span className="material-symbols-outlined text-[200px] text-navy-950 font-black">assessment</span>
                      </div>
                      <div className="relative z-10">
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] mb-8 border-b border-navy-100 pb-4">Real-time Impact Assessment</p>
                        <div className="flex items-center justify-between mb-6">
                           <span className="text-[11px] font-black text-navy-600 uppercase tracking-widest">Total Sequence Shift</span>
                           <span className="text-4xl font-black text-red-600 tracking-tighter shadow-sm">+ 2h 15m</span>
                        </div>
                        <div className="w-full bg-navy-100 rounded-full h-3 overflow-hidden shadow-inner ring-4 ring-white">
                           <div className="bg-red-500 h-full rounded-full shadow-[0_0_12px_rgba(239,68,68,0.4)] transition-all duration-1000" style={{ width: '55%' }}></div>
                        </div>
                        <div className="mt-10 flex gap-5 p-6 bg-white rounded-[2rem] border border-navy-100 shadow-md transform group-hover/card:-translate-y-1 transition-all">
                           <span className="material-symbols-outlined text-primary font-black text-2xl">insights</span>
                           <p className="text-[10px] font-bold text-navy-500 uppercase leading-relaxed tracking-wider">
                              Sequence shift is below 3-hour EU261 mandatory compensation threshold. Duty of care limited to standard meal/comms vouchers. Automated gate re-assignment required at LHR.
                           </p>
                        </div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-[3.5rem] border border-navy-100 p-12 shadow-sm space-y-10 transition-all hover:shadow-lg">
                <div className="flex justify-between items-center border-b border-navy-50 pb-8">
                   <h2 className="text-2xl font-black text-navy-950 uppercase tracking-tighter flex items-center gap-4">
                      <span className="material-symbols-outlined text-primary p-2.5 bg-primary/5 rounded-2xl shadow-inner">campaign</span>
                      Notification Broadcast Hub
                   </h2>
                   <button className="text-[10px] font-black text-primary uppercase tracking-[0.3em] underline decoration-2 underline-offset-4 hover:text-primary-600 transition-colors">Preview Multi-Channel</button>
                </div>
                
                <div className="flex flex-wrap gap-10 py-6 px-10 bg-navy-50/40 rounded-[2rem] border border-navy-50 shadow-inner">
                   {[
                      { label: 'E-Mail Blast', active: true },
                      { label: 'SMS Dispatch', active: true },
                      { label: 'App Push (Real-time)', active: false }
                   ].map((ch, i) => (
                      <label key={i} className="flex items-center gap-5 cursor-pointer group">
                        <div className="relative inline-flex items-center h-7 rounded-full w-14 transition-all">
                           <input type="checkbox" defaultChecked={ch.active} className="sr-only peer" />
                           <div className="w-14 h-7 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-md group-hover:scale-105 transition-transform"></div>
                        </div>
                        <span className="text-[10px] font-black text-navy-700 uppercase tracking-widest group-hover:text-primary transition-colors">{ch.label}</span>
                      </label>
                   ))}
                </div>

                <div className="space-y-6">
                   <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-1">Broadcast Sequence Template</label>
                   <div className="relative group">
                      <textarea 
                        className="w-full min-h-[200px] p-10 rounded-[3rem] border-none bg-navy-50 text-navy-950 font-bold text-lg leading-relaxed focus:ring-8 focus:ring-primary/5 resize-none shadow-inner transition-all"
                        defaultValue="We regret to inform you that flight DJ-2091 to London Heathrow has been rescheduled due to technical requirements. The new estimated departure time is 20:45. We sincerely apologize for this disruption."
                      />
                      <button className="absolute bottom-6 right-10 flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:underline transition-all">
                         <span className="material-symbols-outlined text-sm">history</span> Reset to default
                      </button>
                   </div>
                </div>
             </div>

             {/* Footer Actions */}
             <div className="flex flex-wrap justify-end gap-6 pt-4 pb-12">
                <button className="px-12 py-5 bg-white border-2 border-navy-200 text-navy-700 font-black uppercase text-xs tracking-[0.3em] rounded-3xl hover:bg-navy-50 hover:border-navy-400 transition-all shadow-sm">Discard Local Changes</button>
                <button className="px-14 py-5 bg-red-600 text-white font-black uppercase text-xs tracking-[0.3em] rounded-3xl shadow-2xl shadow-red-500/30 hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-4">
                   <span className="material-symbols-outlined text-xl">block</span> Cancel Route Sequence
                </button>
                <button className="px-14 py-5 bg-primary text-white font-black uppercase text-xs tracking-[0.3em] rounded-3xl shadow-2xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-4">
                   <span className="material-symbols-outlined text-xl">send</span> Commit & Finalise Hub Update
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageDelay;
