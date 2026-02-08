
import React from 'react';

interface FlightTrackerResultsProps {
  onBack: () => void;
}

const FlightTrackerResults: React.FC<FlightTrackerResultsProps> = ({ onBack }) => {
  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 font-display pb-32">
      {/* Top Breadcrumb & Status Indicator */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">
            <button onClick={onBack} className="hover:text-primary transition-all">Telemetry Search</button>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary font-black">Live Flight Telemetry</span>
          </nav>
          <div className="flex items-center gap-4 px-6 py-2 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm animate-in zoom-in duration-700">
             <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
             Transponder Signal DJ-102: Active
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 border-b border-navy-100 pb-10">
           <div className="space-y-2">
              <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">Flight DJ-102</h1>
              <p className="text-navy-400 font-bold text-lg italic uppercase tracking-wider">New York (JFK Hub) <span className="text-primary mx-2">→</span> London (LHR Terminal)</p>
           </div>
           <div className="flex gap-4">
              <div className="text-right">
                 <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest mb-1">Operational State</p>
                 <p className="text-xl font-black text-navy-950 uppercase">En-Route Sequence</p>
              </div>
              <div className="h-12 w-px bg-navy-100 hidden sm:block mx-4" />
              <div className="text-right">
                 <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest mb-1">Equipment Profile</p>
                 <p className="text-xl font-black text-primary uppercase">Boeing 787-9</p>
              </div>
           </div>
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="bg-navy-950 rounded-[4rem] p-12 lg:p-20 text-white relative overflow-hidden shadow-2xl shadow-navy-950/20 group">
         <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-[10s]" style={{ backgroundImage: "radial-gradient(#137fec 2px, transparent 2px)", backgroundSize: "40px 40px" }}></div>
         
         <div className="relative z-10 space-y-20">
            <div className="flex justify-between items-center relative">
               <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/5 overflow-hidden rounded-full">
                  <div className="absolute left-0 h-full bg-primary shadow-[0_0_15px_rgba(19,127,236,0.8)]" style={{ width: '64%' }}></div>
                  <div className="absolute left-[64%] h-full w-20 bg-gradient-to-r from-primary to-transparent animate-progress-fast"></div>
               </div>

               <div className="relative flex flex-col items-center gap-4 group/node">
                  <div className="size-16 rounded-[2rem] bg-navy-900 border-2 border-primary/20 flex items-center justify-center shadow-xl group-hover/node:scale-110 transition-transform group-hover/node:border-primary">
                     <span className="material-symbols-outlined text-3xl text-primary font-black">flight_takeoff</span>
                  </div>
                  <div className="text-center">
                     <span className="text-3xl font-black tracking-tighter">JFK</span>
                     <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1">Terminal 4 Node</p>
                  </div>
               </div>

               <div className="absolute left-[64%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                  <div className="size-14 rounded-full bg-primary flex items-center justify-center shadow-[0_0_40px_rgba(19,127,236,0.6)] border-4 border-navy-950 animate-pulse">
                     <span className="material-symbols-outlined text-2xl font-black rotate-90">flight</span>
                  </div>
                  <div className="mt-4 px-4 py-1.5 rounded-xl bg-navy-900/80 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest shadow-2xl">
                     ALT: 38,000 FT
                  </div>
               </div>

               <div className="relative flex flex-col items-center gap-4 group/node">
                  <div className="size-16 rounded-[2rem] bg-navy-900 border-2 border-white/5 flex items-center justify-center shadow-xl group-hover/node:scale-110 transition-transform">
                     <span className="material-symbols-outlined text-3xl text-white/20 font-black">flight_land</span>
                  </div>
                  <div className="text-center">
                     <span className="text-3xl font-black tracking-tighter text-white/30">LHR</span>
                     <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1">Terminal 2 Node</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 pt-10 border-t border-white/5">
               {[
                 { lbl: 'Ground Velocity', val: '542 KTS', icon: 'speed' },
                 { lbl: 'Range to Target', val: '1,420 NM', icon: 'alt_route' },
                 { lbl: 'Est. Block Time', val: '06:45 AM', icon: 'schedule', color: 'text-primary' },
                 { lbl: 'Node Accuracy', val: 'On Time', icon: 'verified', color: 'text-emerald-400' }
               ].map((m, i) => (
                 <div key={i} className="space-y-4 group/item">
                    <div className="flex items-center gap-3 opacity-40 group-hover/item:opacity-100 transition-opacity">
                       <span className="material-symbols-outlined text-xl">{m.icon}</span>
                       <span className="text-[10px] font-black uppercase tracking-widest">{m.lbl}</span>
                    </div>
                    <p className={`text-2xl font-black tracking-tight ${m.color || ''}`}>{m.val}</p>
                 </div>
               ))}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
         <div className="xl:col-span-8 space-y-10">
            <div className="bg-white rounded-[3.5rem] border border-navy-100 p-10 shadow-sm space-y-12">
               <div className="flex items-center justify-between border-b border-navy-50 pb-8">
                  <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight flex items-center gap-4">
                     <span className="material-symbols-outlined text-primary p-2 bg-primary/5 rounded-2xl shadow-inner font-black">terminal</span>
                     Station Registry Log
                  </h3>
                  <span className="text-[10px] font-black text-navy-300 uppercase tracking-widest">Master Telemetry Link</span>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-16 px-4">
                  <div className="space-y-8">
                     <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="size-2 rounded-full bg-navy-200"></span>
                        Departure Manifest
                     </p>
                     <div className="space-y-6">
                        <div className="flex justify-between items-end border-b border-navy-50 pb-4">
                           <span className="text-xs font-black text-navy-950 uppercase">Gate Node</span>
                           <span className="text-2xl font-black text-primary tracking-tighter">B42</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-navy-50 pb-4">
                           <span className="text-xs font-black text-navy-950 uppercase">Off-Block Actual</span>
                           <span className="text-lg font-black text-navy-900 uppercase">18:30 (Verified)</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-navy-50 pb-4">
                           <span className="text-xs font-black text-navy-950 uppercase">Station Hub</span>
                           <span className="text-lg font-black text-navy-900 uppercase">JFK-T4</span>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-8">
                     <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                        Arrival Analytics
                     </p>
                     <div className="space-y-6">
                        <div className="flex justify-between items-end border-b border-navy-50 pb-4">
                           <span className="text-xs font-black text-navy-950 uppercase">Assigned Gate</span>
                           <span className="text-2xl font-black text-primary tracking-tighter">C12</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-navy-50 pb-4">
                           <span className="text-xs font-black text-navy-950 uppercase">Baggage Carousel</span>
                           <span className="text-lg font-black text-navy-900 uppercase">Node 04</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-navy-50 pb-4">
                           <span className="text-xs font-black text-navy-950 uppercase">Passport Congestion</span>
                           <span className="text-sm font-black text-emerald-600 uppercase">Nominal Flow</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-[3.5rem] border border-navy-100 p-10 shadow-sm group hover:shadow-xl transition-all">
               <div className="flex items-center gap-6 mb-10">
                  <div className="size-16 rounded-[1.75rem] bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner group-hover:scale-110 transition-transform">
                     <span className="material-symbols-outlined text-3xl font-black">wb_cloudy</span>
                  </div>
                  <div>
                     <h4 className="text-xl font-black text-navy-950 uppercase tracking-tight leading-none">Destination Atmospheric Telemetry</h4>
                     <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mt-2 opacity-60 italic">Live feed from London Heathrow Meteorological Hub</p>
                  </div>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {[
                    { lbl: 'Temperature', val: '12°C', icon: 'thermostat' },
                    { lbl: 'Wind Vector', val: '14 KTS NW', icon: 'air' },
                    { lbl: 'Vis. Registry', val: '10+ NM', icon: 'visibility' },
                    { lbl: 'Cloud Protocol', val: 'Overcast', icon: 'cloud' }
                  ].map((w, i) => (
                    <div key={i} className="p-6 bg-navy-50/50 rounded-3xl border border-navy-50 flex flex-col gap-3 group/w hover:bg-white hover:shadow-md transition-all">
                       <span className="material-symbols-outlined text-navy-300 group-hover/w:text-primary transition-colors">{w.icon}</span>
                       <div>
                          <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest">{w.lbl}</p>
                          <p className="text-lg font-black text-navy-950 uppercase tracking-tight">{w.val}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="xl:col-span-4 space-y-10">
            <div className="bg-navy-950 rounded-[3rem] p-10 text-white space-y-10 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5"><span className="material-symbols-outlined text-[120px] font-black">campaign</span></div>
               <div className="space-y-4 relative z-10">
                  <h3 className="text-xl font-black uppercase tracking-[0.25em] text-primary">Notification Dispatch</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">Authorize real-time SMS alerts for gate changes and sequence shifts.</p>
               </div>

               <div className="space-y-6 relative z-10">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-white/20 uppercase tracking-widest block px-1">Authorized Contact</label>
                     <input className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-sm font-black text-white focus:ring-4 focus:ring-primary/20 outline-none" placeholder="PERSONNEL@DOMAIN.COM" />
                  </div>
                  <button className="w-full py-5 bg-primary text-white font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl shadow-xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all">Enable Telemetry Link</button>
               </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-navy-100 p-8 shadow-sm space-y-8 group hover:shadow-xl transition-all">
               <div className="flex items-center gap-6">
                  <div className="size-14 rounded-2xl bg-navy-50 flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform">
                     <span className="material-symbols-outlined text-2xl font-black">hub</span>
                  </div>
                  <div className="space-y-1">
                     <p className="text-sm font-black text-navy-950 uppercase tracking-tight">Fleet Asset Profile</p>
                     <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest opacity-60">N-789-DB • Deltablue Core Registry</p>
                  </div>
               </div>
               <div className="space-y-4">
                  {[
                    { lbl: 'Cabin Config', val: '3-Class Registry' },
                    { lbl: 'Engine Protocol', val: 'GEnx-1B x2' },
                    { lbl: 'Wi-Fi Hub', val: 'High-Speed Active' }
                  ].map((f, i) => (
                    <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest py-3 border-b border-navy-50 last:border-0">
                       <span className="text-navy-300">{f.lbl}</span>
                       <span className="text-navy-950">{f.val}</span>
                    </div>
                  ))}
               </div>
               <button className="w-full py-4 bg-navy-50 text-navy-700 font-black uppercase text-[9px] tracking-[0.25em] rounded-2xl border border-navy-100 hover:text-primary hover:border-primary transition-all">View Full Specifications</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default FlightTrackerResults;
