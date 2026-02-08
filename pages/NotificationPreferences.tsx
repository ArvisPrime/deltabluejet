
import React from 'react';

const NotificationPreferences: React.FC = () => {
  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-12 animate-in fade-in duration-500 font-display pb-32">
      {/* Header Section */}
      <div className="space-y-4 max-w-3xl">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-navy-300 px-1">
           <span>User Preferences</span>
           <span className="material-symbols-outlined text-xs">chevron_right</span>
           <span className="text-primary">Communication Hub</span>
        </nav>
        <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">Notification Logic</h1>
        <p className="text-navy-500 font-medium italic text-xl leading-relaxed uppercase tracking-wider opacity-80">Orchestrate how and when system nodes dispatch communications to your personnel terminal.</p>
      </div>

      {/* Global Contact Summary */}
      <div className="bg-white rounded-[3rem] border border-navy-100 p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 group hover:shadow-md transition-all">
         <div className="flex items-center gap-6">
            <div className="size-16 rounded-[1.5rem] bg-primary/5 flex items-center justify-center text-primary shadow-inner">
               <span className="material-symbols-outlined text-3xl font-black">contact_mail</span>
            </div>
            <div>
               <p className="text-[9px] font-black text-navy-300 uppercase tracking-[0.25em] mb-1">Primary Dispatch Identity</p>
               <p className="text-lg font-black text-navy-950 uppercase tracking-tight">marcus.chen@deltablue.com • +1 (555) 882-9012</p>
            </div>
         </div>
         <button className="px-8 py-3.5 bg-white border-2 border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:border-primary hover:text-primary transition-all shadow-sm">Modify Hub Endpoint</button>
      </div>

      {/* Master Pause Control */}
      <div className="bg-primary/5 rounded-[2.5rem] border border-primary/20 p-8 flex items-center justify-between shadow-sm relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-primary transition-transform group-hover:scale-110">
            <span className="material-symbols-outlined text-[120px] font-black">pause_circle</span>
         </div>
         <div className="flex items-center gap-6 relative z-10">
            <span className="material-symbols-outlined text-primary text-3xl font-black">timer_off</span>
            <div>
               <p className="text-sm font-black text-navy-950 uppercase tracking-tight">Temporary Dispatch Suspension</p>
               <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest opacity-60">Mute all non-critical logic segments for the next 24 hours.</p>
            </div>
         </div>
         <div className="relative inline-flex items-center h-8 rounded-full w-16 transition-all shadow-inner relative z-10">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-16 h-8 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-lg"></div>
         </div>
      </div>

      {/* Preferences Grid */}
      <div className="space-y-12">
         {/* Critical Section */}
         <div className="space-y-6">
            <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight flex items-center gap-4 px-4">
               <span className="material-symbols-outlined text-red-500 font-black">priority_high</span>
               Operational Critical Tier
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {[
                  { label: 'Flight Disruption Seq', desc: 'Real-time telemetry on delays, cancellations, and route changes.', icon: 'flight_takeoff', channels: ['E-Mail', 'SMS Dispatch', 'App Push'] },
                  { label: 'Asset Node Shifts', desc: 'Immediate notification when gate, terminal or aircraft profile logic shifts.', icon: 'sensor_door', channels: ['SMS Dispatch', 'App Push'] }
               ].map((pref, i) => (
                  <div key={i} className="bg-white p-10 rounded-[3rem] border border-navy-100 shadow-sm space-y-8 group hover:shadow-xl transition-all">
                     <div className="flex justify-between items-start">
                        <div className="flex items-start gap-5">
                           <div className="p-3 bg-navy-50 text-navy-700 rounded-2xl shadow-inner group-hover:bg-primary/5 group-hover:text-primary transition-all">
                              <span className="material-symbols-outlined text-2xl font-black">{pref.icon}</span>
                           </div>
                           <div className="space-y-1">
                              <h4 className="text-lg font-black text-navy-950 uppercase tracking-tight">{pref.label}</h4>
                              <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest opacity-60 leading-relaxed">{pref.desc}</p>
                           </div>
                        </div>
                        <div className="relative inline-flex items-center h-7 rounded-full w-14 transition-all shadow-inner">
                           <input checked readOnly type="checkbox" className="sr-only peer" />
                           <div className="w-14 h-7 bg-navy-100 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md"></div>
                        </div>
                     </div>
                     <div className="pt-8 border-t border-navy-50 space-y-4">
                        <p className="text-[8px] font-black text-navy-300 uppercase tracking-[0.3em]">Authorized Channels</p>
                        <div className="flex flex-wrap gap-4">
                           {['E-Mail', 'SMS Dispatch', 'App Push'].map(ch => (
                              <label key={ch} className="flex items-center gap-3 cursor-pointer group/ch">
                                 <div className="relative flex items-center">
                                    <input type="checkbox" defaultChecked={pref.channels.includes(ch)} className="peer h-5 w-5 appearance-none rounded-lg border-2 border-navy-100 checked:bg-primary checked:border-primary transition-all shadow-sm" />
                                    <span className="material-symbols-outlined text-white text-[12px] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 font-black">check</span>
                                 </div>
                                 <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest group-hover/ch:text-navy-950 transition-all">{ch}</span>
                              </label>
                           ))}
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Secondary Section */}
         <div className="space-y-6">
            <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight flex items-center gap-4 px-4">
               <span className="material-symbols-outlined text-navy-400 font-black">airplane_ticket</span>
               Personnel & Hub Sequence
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {[
                  { label: 'Registry Alerts', desc: 'Reminders for check-in opening, boarding pass generation and manifest sync.', icon: 'assignment_ind', channels: ['E-Mail', 'App Push'] },
                  { label: 'Personnel Offers', desc: 'Internal marketing segments, seasonal hub discounts and staff flash sales.', icon: 'campaign', channels: [], inactive: true }
               ].map((pref, i) => (
                  <div key={i} className={`bg-white p-10 rounded-[3rem] border border-navy-100 shadow-sm space-y-8 group hover:shadow-xl transition-all ${pref.inactive ? 'opacity-50 grayscale' : ''}`}>
                     <div className="flex justify-between items-start">
                        <div className="flex items-start gap-5">
                           <div className="p-3 bg-navy-50 text-navy-700 rounded-2xl shadow-inner group-hover:bg-primary/5 group-hover:text-primary transition-all">
                              <span className="material-symbols-outlined text-2xl font-black">{pref.icon}</span>
                           </div>
                           <div className="space-y-1">
                              <h4 className="text-lg font-black text-navy-950 uppercase tracking-tight">{pref.label}</h4>
                              <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest opacity-60 leading-relaxed">{pref.desc}</p>
                           </div>
                        </div>
                        <div className="relative inline-flex items-center h-7 rounded-full w-14 transition-all shadow-inner">
                           <input checked={!pref.inactive} readOnly type="checkbox" className="sr-only peer" />
                           <div className="w-14 h-7 bg-navy-100 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md"></div>
                        </div>
                     </div>
                     <div className="pt-8 border-t border-navy-50 space-y-4">
                        <p className="text-[8px] font-black text-navy-300 uppercase tracking-[0.3em]">Authorized Channels</p>
                        <div className="flex flex-wrap gap-4">
                           {['E-Mail', 'SMS Dispatch', 'App Push'].map(ch => (
                              <label key={ch} className={`flex items-center gap-3 ${pref.inactive ? 'cursor-not-allowed opacity-30' : 'cursor-pointer group/ch'}`}>
                                 <div className="relative flex items-center">
                                    <input disabled={pref.inactive} type="checkbox" defaultChecked={pref.channels.includes(ch)} className="peer h-5 w-5 appearance-none rounded-lg border-2 border-navy-100 checked:bg-primary checked:border-primary transition-all shadow-sm" />
                                    <span className="material-symbols-outlined text-white text-[12px] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 font-black">check</span>
                                 </div>
                                 <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest group-hover/ch:text-navy-950 transition-all">{ch}</span>
                              </label>
                           ))}
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* Floating Success Notification */}
      <div className="fixed bottom-12 right-12 z-50 animate-in slide-in-from-right duration-700">
         <div className="bg-navy-950 text-white p-6 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border border-white/5 flex items-center gap-6 group hover:scale-105 transition-all cursor-pointer">
            <div className="size-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner group-hover:bg-emerald-500 group-hover:text-white transition-all">
               <span className="material-symbols-outlined text-2xl font-black">check_circle</span>
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest">Logic Updated</p>
               <p className="text-white/60 text-[8px] font-bold uppercase tracking-[0.25em]">Preferences saved automatically.</p>
            </div>
            <button className="text-white/20 hover:text-white ml-2 transition-colors"><span className="material-symbols-outlined">close</span></button>
         </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
