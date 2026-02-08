
import React from 'react';

interface TicketConfirmationProps {
  onDone: () => void;
}

const TicketConfirmation: React.FC<TicketConfirmationProps> = ({ onDone }) => {
  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700 font-sans pb-32">
      
      {/* Success Hero Header */}
      <div className="text-center space-y-6 flex flex-col items-center py-6">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20"></div>
          <div className="relative size-24 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner border border-emerald-100/50">
            <span className="material-symbols-outlined text-6xl font-black">check_circle</span>
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">Sequence Confirmed</h1>
          <p className="text-navy-400 font-bold text-lg max-w-xl mx-auto italic uppercase tracking-wider">
            Your mission to <span className="text-navy-950 underline decoration-primary decoration-2 underline-offset-4">London (LHR)</span> is fully validated and ticketed.
          </p>
        </div>
      </div>

      {/* Master Reference & Global Actions */}
      <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-xl overflow-hidden group">
        <div className="p-10 bg-navy-50/50 flex flex-col md:flex-row gap-10 justify-between items-center border-b border-navy-100">
           <div className="space-y-2 text-center md:text-left">
             <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em]">Master PNR Reference</p>
             <div className="flex items-center gap-6">
                <span className="text-6xl font-black text-primary tracking-tighter uppercase select-all">DJXJ799</span>
                <button className="text-navy-200 hover:text-primary p-2 bg-white rounded-xl shadow-sm border border-navy-100 transition-all active:scale-90 group/copy">
                  <span className="material-symbols-outlined text-2xl group-hover/copy:scale-110 transition-transform">content_copy</span>
                </button>
             </div>
           </div>
           <div className="flex flex-wrap justify-center gap-4">
             <button className="px-8 py-4 bg-white border-2 border-navy-100 text-navy-700 font-black rounded-[1.5rem] flex items-center gap-3 text-xs uppercase tracking-widest hover:bg-navy-50 shadow-sm transition-all">
               <span className="material-symbols-outlined">calendar_add_on</span> Add to Calendar
             </button>
             <button className="px-10 py-4 bg-primary text-white font-black rounded-[1.5rem] shadow-xl shadow-primary/20 flex items-center gap-3 text-xs uppercase tracking-widest hover:scale-105 transition-all">
               <span className="material-symbols-outlined">download</span> Download Boarding Nodes (PDF)
             </button>
           </div>
        </div>

        <div className="p-10 md:p-16 space-y-16">
           
           {/* High Fidelity Itinerary Node */}
           <div className="relative">
              <div className="flex flex-col md:flex-row items-stretch bg-white border-2 border-navy-100 rounded-[3rem] overflow-hidden shadow-2xl">
                 {/* Left Stub: Origin */}
                 <div className="p-10 flex flex-col justify-between border-r-2 border-dashed border-navy-100 relative min-w-[220px] bg-navy-50/20">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest">Departure Node</p>
                       <h4 className="text-5xl font-black text-navy-950 tracking-tighter">10:00</h4>
                       <p className="text-xl font-black text-primary uppercase mt-1 tracking-widest">JFK</p>
                       <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">New York Terminal 4</p>
                    </div>
                    <div className="pt-10 space-y-2">
                       <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Registry Date</p>
                       <p className="text-sm font-black text-navy-950 uppercase tracking-tight">Thu, 24 Oct 2024</p>
                    </div>
                    {/* Ticket Punch Circles */}
                    <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 size-8 bg-navy-50 border-2 border-navy-100 rounded-full"></div>
                 </div>

                 {/* Middle: Path Telemetry */}
                 <div className="flex-1 p-10 flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(#137fec 2px, transparent 2px)", backgroundSize: "30px 30px" }}></div>
                    <div className="w-full flex items-center gap-4 relative z-10 px-6">
                       <div className="size-2.5 rounded-full bg-navy-200"></div>
                       <div className="h-0.5 flex-1 bg-navy-100 relative flex items-center justify-center">
                          <div className="absolute inset-0 bg-gradient-to-r from-navy-50/0 via-primary/30 to-navy-50/0"></div>
                          <span className="material-symbols-outlined text-primary rotate-90 bg-white px-4 py-1 rounded-full border-2 border-navy-50 text-xl shadow-lg">flight</span>
                       </div>
                       <div className="size-2.5 rounded-full bg-navy-200"></div>
                    </div>
                    <div className="text-center space-y-1 relative z-10">
                       <p className="text-xs font-black text-navy-950 uppercase tracking-[0.4em]">Flight DJ-117</p>
                       <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest italic opacity-60">7h 50m Non-stop Protocol</p>
                    </div>
                    <div className="flex gap-4 relative z-10">
                       <span className="px-4 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Telemetry: Active
                       </span>
                       <span className="px-4 py-1.5 rounded-xl bg-navy-50 text-navy-400 text-[9px] font-black uppercase tracking-widest border border-navy-100">Regional Master ERJ-120</span>
                    </div>
                 </div>

                 {/* Right Stub: Destination */}
                 <div className="p-10 flex flex-col justify-between items-end border-l-2 border-dashed border-navy-100 relative min-w-[220px] bg-navy-50/20 text-right">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest">Arrival Target</p>
                       <h4 className="text-5xl font-black text-navy-950 tracking-tighter">12:50<sup className="text-sm font-black text-primary ml-1">+1</sup></h4>
                       <p className="text-xl font-black text-primary uppercase mt-1 tracking-widest">LHR</p>
                       <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">London Heathrow Hub</p>
                    </div>
                    <div className="pt-10 space-y-2">
                       <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Local Sequence Time</p>
                       <p className="text-sm font-black text-navy-950 uppercase tracking-tight">Fri, 25 Oct 2024</p>
                    </div>
                    {/* Ticket Punch Circles */}
                    <div className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 size-8 bg-navy-50 border-2 border-navy-100 rounded-full"></div>
                 </div>
              </div>
           </div>

           {/* Secondary Info Registry: Passengers & Cabin */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8 border-t border-navy-50">
              {/* Passenger Registry */}
              <div className="lg:col-span-2 space-y-8">
                 <h3 className="text-xs font-black text-navy-400 uppercase tracking-[0.4em] flex items-center gap-3">
                   <span className="material-symbols-outlined text-primary">group</span> Personnel Log
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { name: 'Marcus Chen', seat: '4A', tier: 'Diamond Platinum', icon: 'verified', initial: 'MC', status: 'Ticketed: 012-98472911' },
                      { name: 'Elena Chen', seat: '4B', tier: 'Standard Registry', icon: 'person', initial: 'EC', status: 'Ticketed: 012-98472912' }
                    ].map((p, i) => (
                      <div key={i} className="bg-navy-50/50 p-6 rounded-[2.5rem] border border-navy-50 flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all">
                         <div className="flex items-center gap-5">
                            <div className="size-12 rounded-2xl bg-white border border-navy-100 flex items-center justify-center font-black text-sm text-primary shadow-sm group-hover:scale-105 transition-transform">{p.initial}</div>
                            <div className="space-y-1">
                               <p className="text-sm font-black text-navy-950 uppercase tracking-tight">{p.name}</p>
                               <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest italic opacity-70">Seat {p.seat} • {p.tier}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <span className="material-symbols-outlined text-primary text-xl">{p.icon}</span>
                            <p className="text-[7px] font-black text-navy-300 uppercase mt-1 tracking-tighter">{p.status}</p>
                         </div>
                      </div>
                    ))}
                 </div>

                 {/* Baggage Logic */}
                 <div className="bg-white rounded-[2.5rem] border-2 border-navy-50 p-8 space-y-8 shadow-sm">
                    <div className="flex justify-between items-center px-2">
                       <h4 className="text-[10px] font-black text-navy-950 uppercase tracking-[0.25em] flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary text-lg">luggage</span> Baggage Allowance Node
                       </h4>
                       <button className="text-[9px] font-black text-primary uppercase underline">Purchase Excess Capacity</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                       {[
                         { lbl: 'Carry-On Unit', val: '1 x 8kg', desc: '56 x 36 x 23cm', icon: 'bagops' },
                         { lbl: 'Checked Asset', val: '2 x 23kg', desc: 'Priority Handling', icon: 'deployed_code_history' },
                         { lbl: 'Personal Item', val: '1 x 3kg', desc: 'Fits under node', icon: 'handbag' }
                       ].map((b, i) => (
                         <div key={i} className="bg-navy-50/30 p-5 rounded-3xl border border-navy-50 space-y-3">
                            <div className="flex items-center gap-3">
                               <span className="material-symbols-outlined text-navy-300 text-lg">{i === 0 ? 'luggage' : i === 1 ? 'deployed_code' : 'work_outline'}</span>
                               <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest">{b.lbl}</p>
                            </div>
                            <div>
                               <p className="text-lg font-black text-navy-950 tracking-tighter">{b.val}</p>
                               <p className="text-[8px] font-bold text-navy-300 uppercase tracking-widest">{b.desc}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Transit Protocol & Summary */}
              <div className="space-y-8">
                 <h3 className="text-xs font-black text-navy-400 uppercase tracking-[0.4em] flex items-center gap-3">
                   <span className="material-symbols-outlined text-primary">analytics</span> Sequence Protocol
                 </h3>
                 
                 {/* Protocol Timeline */}
                 <div className="bg-navy-950 rounded-[3rem] p-10 text-white space-y-10 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                       <span className="material-symbols-outlined text-[140px] font-black">pending_actions</span>
                    </div>
                    <div className="space-y-8 relative z-10">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Station Timeline</h4>
                       <div className="space-y-8 relative pl-6 border-l border-white/10">
                          {[
                            { time: '07:30 AM', label: 'Check-in Hub Opens', desc: 'T-150m Sequence' },
                            { time: '09:20 AM', label: 'Gate Closing Sequence', desc: 'Final Personnel Call' },
                            { time: '10:00 AM', label: 'Terminal Departure', desc: 'DJ-117 Sequence Start' }
                          ].map((step, i) => (
                            <div key={i} className="relative group">
                               <div className="absolute -left-[31px] top-1 size-2 rounded-full bg-primary ring-4 ring-navy-950 group-hover:scale-125 transition-transform"></div>
                               <div className="space-y-1">
                                  <p className="text-xl font-black tracking-tighter leading-none">{step.time}</p>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{step.label}</p>
                                  <p className="text-[8px] font-bold uppercase tracking-widest text-white/30">{step.desc}</p>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Revenue Summary Mini */}
                 <div className="bg-white rounded-[2.5rem] border border-navy-100 p-8 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                       <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Loyalty Points Accrued</p>
                       <span className="text-[10px] font-black text-emerald-600 uppercase">+1,420 Club Miles</span>
                    </div>
                    <div className="pt-4 border-t border-navy-50 flex justify-between items-end">
                       <div>
                          <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest mb-1">Total Liability Settled</p>
                          <p className="text-3xl font-black text-navy-950 tracking-tighter">$1,385.50</p>
                       </div>
                       <div className="flex items-center gap-2 text-navy-200">
                          <span className="material-symbols-outlined text-lg">verified_user</span>
                          <span className="text-[8px] font-black uppercase tracking-widest">Visa 4242</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* In-Flight Amenity Node */}
           <div className="bg-blue-50/50 rounded-[3rem] p-10 border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-10 shadow-inner group">
              <div className="flex items-center gap-8">
                 <div className="p-4 bg-white rounded-3xl shadow-md text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl font-black">airplanemode_active</span>
                 </div>
                 <div>
                    <h4 className="text-xl font-black text-navy-950 uppercase tracking-tight">On-Board Personnel Protocol</h4>
                    <p className="text-[10px] font-bold text-navy-50 uppercase tracking-widest opacity-70 leading-relaxed mt-1">Available logic nodes for Flight DJ-117 (ERJ-120)</p>
                 </div>
              </div>
              <div className="flex flex-wrap gap-8">
                 {[
                   { icon: 'wifi', lbl: 'High-Speed Hub' },
                   { icon: 'restaurant', lbl: 'Culinary Selection' },
                   { icon: 'power', lbl: 'Universal AC' },
                   { icon: 'tv_gen', lbl: 'Deltablue Cast' }
                 ].map(feat => (
                   <div key={feat.icon} className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-navy-400 group-hover:text-primary transition-colors">{feat.icon}</span>
                      <span className="text-[8px] font-black text-navy-300 uppercase tracking-widest">{feat.lbl}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Tertiary Actions & Help */}
      <div className="flex flex-col items-center gap-10 py-10">
         <div className="flex flex-col sm:flex-row items-center gap-12 text-[10px] font-black text-navy-300 uppercase tracking-[0.3em]">
            <button onClick={onDone} className="text-primary hover:text-blue-700 underline decoration-2 underline-offset-8 transition-colors">Return to Home Hub</button>
            <span className="hidden sm:block size-1 rounded-full bg-navy-100"></span>
            <button className="hover:text-navy-950 transition-colors">Modify Registry Node</button>
            <span className="hidden sm:block size-1 rounded-full bg-navy-100"></span>
            <button className="hover:text-navy-950 transition-colors">Contact Station Dispatch</button>
         </div>
         
         <div className="max-w-xl text-center space-y-4 opacity-40">
            <p className="text-[9px] font-bold text-navy-300 uppercase leading-relaxed tracking-widest italic">
               Legal Notice: Use of this digital itinerary indicates compliance with the Deltablue Jet Air Master Registry Agreement. Check-in nodes open 24 hours prior to departure. Verify local station security protocols before transit.
            </p>
            <p className="text-[8px] font-black text-navy-200 uppercase tracking-[0.4em]">© 2024 DELTABLUE JET AIR OPERATIONS • GLOBAL-STATION-NYC-01</p>
         </div>
      </div>
    </div>
  );
};

export default TicketConfirmation;
