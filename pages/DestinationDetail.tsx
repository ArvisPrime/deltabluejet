
import React from 'react';
import { DestinationHub } from '../types';

interface DestinationDetailProps {
  destination: DestinationHub;
  onBack: () => void;
  onBookNow: () => void;
}

const DestinationDetail: React.FC<DestinationDetailProps> = ({ destination, onBack, onBookNow }) => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-navy-950 animate-in fade-in duration-700 pb-20">
      {/* Hero Section */}
      <section className="relative h-[65vh] min-h-[500px] flex items-end p-8 md:p-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-900/20 to-transparent z-10"></div>
          <div 
            className="w-full h-full bg-cover bg-center transition-transform duration-[15s] scale-110 animate-slow-zoom" 
            style={{ backgroundImage: `url('${destination.img}')` }} 
          />
        </div>

        <div className="relative z-20 w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-10">
          <div className="space-y-6 max-w-3xl">
             <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-white/60 mb-8">
                <button onClick={onBack} className="hover:text-primary transition-all flex items-center gap-2">
                   <span className="material-symbols-outlined text-sm">arrow_back</span> Hub Registry
                </button>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-white">Node: {destination.airport}</span>
             </nav>
             <div className="space-y-2">
                <p className="text-primary font-black uppercase tracking-[0.5em] text-sm drop-shadow-xl">{destination.country}</p>
                <h1 className="text-7xl md:text-9xl font-black text-white leading-none tracking-tighter uppercase">
                   {destination.city}
                </h1>
             </div>
          </div>
          
          <button 
            onClick={onBookNow}
            className="px-12 py-6 bg-primary text-white font-black uppercase tracking-[0.3em] text-xs rounded-[2rem] shadow-[0_20px_50px_-10px_rgba(19,127,236,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group"
          >
             Initialise Sequence <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* Mission Briefing Workspace */}
      <main className="max-w-7xl mx-auto w-full p-8 md:p-16 grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* Left: Narrative & Description */}
        <div className="lg:col-span-8 space-y-12">
           <div className="space-y-6">
              <h2 className="text-xs font-black text-primary uppercase tracking-[0.4em]">Operational Mission Profile</h2>
              <p className="text-3xl font-black text-navy-950 uppercase tracking-tighter leading-tight">
                 Strategic Gateway {destination.airport} – Enhancing global commerce connectivity via the {destination.country} corridor.
              </p>
              <div className="prose prose-navy max-w-none">
                 <p className="text-xl text-navy-500 font-medium italic leading-relaxed uppercase tracking-wider opacity-80">
                    {destination.profile} This hub serves as a critical junction for Deltablue Jet Air, offering high-fidelity logistics synchronization and optimized personnel transit sequences.
                 </p>
                 <p className="text-lg text-navy-700 leading-relaxed pt-6">
                    Our station at {destination.city} has been recently modernized with AI-driven dispatch logic and a dedicated personnel lounge hub. Travelers can expect seamless node-to-node connectivity and real-time telemetry updates throughout their transit.
                 </p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-navy-50/50 p-10 rounded-[3rem] border border-navy-100 shadow-inner space-y-6 group">
                 <div className="size-12 rounded-2xl bg-white text-primary flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl font-black">verified_user</span>
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight">Security Protocol</h3>
                    <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest leading-relaxed">
                       Full biometric clearance active. Registry sync required 3 hours prior to sequence launch.
                    </p>
                 </div>
              </div>
              <div className="bg-navy-50/50 p-10 rounded-[3rem] border border-navy-100 shadow-inner space-y-6 group">
                 <div className="size-12 rounded-2xl bg-white text-primary flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl font-black">hub</span>
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight">Lounge Access</h3>
                    <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest leading-relaxed">
                       The Deltablue Alpha Wing is available for Executive Class personnel and Diamond Platinum members.
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Right: Technical Telemetry Sidebar */}
        <div className="lg:col-span-4 space-y-10">
           <div className="bg-navy-950 rounded-[4rem] p-10 text-white space-y-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-[10s]" style={{ backgroundImage: "radial-gradient(#137fec 2px, transparent 2px)", backgroundSize: "40px 40px" }}></div>
              
              <div className="relative z-10 space-y-8">
                 <div className="flex items-center justify-between border-b border-white/10 pb-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary">Node Registry Specs</h3>
                    <span className="material-symbols-outlined text-primary text-xl animate-pulse">radar</span>
                 </div>

                 <div className="space-y-8">
                    {[
                      { label: 'Airport Node ID', val: destination.airport, icon: 'location_on' },
                      { label: 'Sequence Freq.', val: destination.frequency, icon: 'schedule' },
                      { label: 'Primary Equipment', val: destination.equipment, icon: 'airlines' },
                      { label: 'Station Status', val: 'Operational', icon: 'check_circle', col: 'text-emerald-400' },
                    ].map((spec, i) => (
                      <div key={i} className="flex items-center justify-between group/spec">
                         <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-white/20 group-hover/spec:text-primary transition-colors">{spec.icon}</span>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{spec.label}</span>
                         </div>
                         <span className={`text-sm font-black uppercase tracking-widest ${spec.col || 'text-white'}`}>{spec.val}</span>
                      </div>
                    ))}
                 </div>

                 <div className="pt-8 border-t border-white/10 space-y-6">
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] text-center">Atmospheric Telemetry</p>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                          <p className="text-[8px] font-bold text-white/40 uppercase mb-1">Temperature</p>
                          <p className="text-lg font-black tracking-tighter">28°C</p>
                       </div>
                       <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                          <p className="text-[8px] font-bold text-white/40 uppercase mb-1">Visibility</p>
                          <p className="text-lg font-black tracking-tighter">Unlimited</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[3.5rem] border border-navy-100 p-10 shadow-sm space-y-6 group hover:shadow-xl transition-all">
              <div className="flex items-center gap-5">
                 <div className="size-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl font-black">support_agent</span>
                 </div>
                 <div>
                    <h4 className="text-lg font-black text-navy-950 uppercase tracking-tight">Need Assistance?</h4>
                    <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest opacity-60">Direct station dispatch link.</p>
                 </div>
              </div>
              <button className="w-full py-4 bg-navy-50 text-navy-950 font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl hover:bg-primary hover:text-white transition-all">Open Registry Inquiry</button>
           </div>
        </div>
      </main>

      {/* Floating CTA for Mobile */}
      <div className="md:hidden fixed bottom-6 inset-x-6 z-50">
         <button 
           onClick={onBookNow}
           className="w-full py-5 bg-primary text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-2xl flex items-center justify-center gap-4"
         >
            Initialise Sequence <span className="material-symbols-outlined">arrow_forward</span>
         </button>
      </div>
    </div>
  );
};

export default DestinationDetail;
