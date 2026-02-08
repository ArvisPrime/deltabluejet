
import React from 'react';
import { Page } from '../types';

interface ModifyBookingSearchProps {
  onNavigate: (page: Page) => void;
}

const ModifyBookingSearch: React.FC<ModifyBookingSearchProps> = ({ onNavigate }) => {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10 animate-in slide-in-from-left duration-500 font-display pb-32">
      {/* Header */}
      <div className="space-y-6">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">
           <button onClick={() => onNavigate(Page.BOOKING_DETAIL)} className="hover:text-primary transition-all">Trip Detail</button>
           <span className="material-symbols-outlined text-xs">chevron_right</span>
           <span className="text-primary">Search Alternatives</span>
        </nav>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-navy-100 pb-8">
           <div className="space-y-1">
              <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Modify Reservation</h1>
              <p className="text-navy-500 font-medium italic mt-2 text-lg">Re-routing sequence for PNR: XYZ123</p>
           </div>
           <div className="bg-primary/5 px-6 py-3 rounded-[1.5rem] border border-primary/20 shadow-inner flex items-center gap-4">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Operational Credit Hub</span>
              <span className="text-2xl font-black text-navy-950 tracking-tighter">$0.00</span>
           </div>
        </div>
      </div>

      {/* Current Itinerary Section */}
      <section className="space-y-6">
         <h3 className="text-[10px] font-black text-navy-400 uppercase tracking-[0.25em] px-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary font-black">flight_takeoff</span> 
            Current Flight Sequence to be Released
         </h3>
         <div className="bg-white rounded-[3rem] border border-navy-100 shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-navy-200 group-hover:bg-primary transition-colors"></div>
            <div className="p-10 flex flex-col md:flex-row gap-10">
               <div className="flex-1 space-y-8">
                  <div className="flex items-center gap-4">
                     <span className="px-4 py-1.5 rounded-xl bg-navy-50 text-navy-400 text-[10px] font-black uppercase tracking-widest border border-navy-100 shadow-inner">Outbound Segment</span>
                     <span className="text-xs font-black text-navy-950 uppercase tracking-widest opacity-60">Sat, Oct 12 • Delta Airlines</span>
                  </div>
                  <div className="flex items-center gap-10">
                     <div>
                        <span className="text-4xl font-black text-navy-950 tracking-tighter">10:00 AM</span>
                        <p className="text-xl font-black text-primary uppercase">JFK</p>
                     </div>
                     <div className="flex-1 flex flex-col items-center px-4 relative">
                        <span className="text-[10px] font-black text-navy-300 uppercase tracking-widest mb-3">7h 30m Duration</span>
                        <div className="w-full h-0.5 bg-navy-50 relative flex items-center justify-center">
                           <div className="absolute left-0 size-2 rounded-full bg-navy-200"></div>
                           <div className="absolute right-0 size-2 rounded-full bg-navy-200"></div>
                        </div>
                        <span className="text-[8px] font-black text-navy-200 uppercase tracking-[0.3em] mt-3">Non-stop Logic</span>
                     </div>
                     <div className="text-right">
                        <span className="text-4xl font-black text-navy-950 tracking-tighter">17:30 PM</span>
                        <p className="text-xl font-black text-primary uppercase">LHR</p>
                     </div>
                  </div>
               </div>
               <div className="hidden md:block w-56 h-40 rounded-[2rem] bg-cover bg-center relative overflow-hidden shadow-inner border border-navy-50" style={{backgroundImage: "url('https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80')"}}>
                  <div className="absolute inset-0 bg-navy-950/20"></div>
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-navy-100">
                     <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest text-center">Hub Destination: London</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Alternative Search Engine */}
      <section className="bg-white rounded-[3.5rem] border border-navy-100 p-10 shadow-2xl space-y-10 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-12 opacity-5 text-navy-950 pointer-events-none">
            <span className="material-symbols-outlined text-[120px] font-black">manage_search</span>
         </div>
         <div className="flex items-center justify-between px-2 relative z-10">
            <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight">Re-route Search Terminal</h3>
            <button className="text-[10px] font-black text-primary uppercase underline tracking-widest decoration-2 underline-offset-4">Advanced Filters</button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            <div className="space-y-3">
               <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-1">Origin Node</label>
               <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined font-black group-focus-within:text-primary transition-all">flight_takeoff</span>
                  <input className="w-full h-16 pl-14 pr-6 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 shadow-inner" defaultValue="New York (JFK)" />
               </div>
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-1">Destination Target</label>
               <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined font-black group-focus-within:text-primary transition-all">flight_land</span>
                  <input className="w-full h-16 pl-14 pr-6 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 shadow-inner" defaultValue="London (LHR)" />
               </div>
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-1">Target Sequence Date</label>
               <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined font-black group-focus-within:text-primary transition-all">calendar_today</span>
                  <input className="w-full h-16 pl-14 pr-6 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 shadow-inner" defaultValue="Oct 14, 2024" />
               </div>
            </div>
         </div>
         <div className="flex justify-end relative z-10 pt-4">
            <button className="px-12 py-5 bg-primary text-white font-black uppercase text-xs tracking-[0.3em] rounded-3xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
               <span className="material-symbols-outlined text-xl">refresh</span> Re-calculate Alternatives
            </button>
         </div>
      </section>

      {/* Results Section */}
      <section className="space-y-8">
         <div className="flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
               <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight">3 Alternative Sequences Located</h3>
               <span className="px-3 py-1 rounded-full bg-navy-50 text-navy-400 text-[9px] font-black uppercase tracking-widest border border-navy-100 shadow-inner">Hub Logic: Validated</span>
            </div>
            <span className="text-[10px] font-bold text-navy-400 uppercase tracking-widest italic opacity-60">Fare deltas calculated against original revenue bucket</span>
         </div>

         <div className="space-y-6">
            {[
               { al: 'Delta', code: 'DJ 402', dep: '06:00 AM', arr: '13:45 PM', dur: '7h 45m', diff: '-$45.00', type: 'Refund Credit', col: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
               { al: 'Virgin', code: 'VS 026', dep: '08:15 AM', arr: '20:00 PM', dur: '6h 45m', diff: '+$12.50', type: 'Add. Collect', col: 'text-amber-600 bg-amber-50 border-amber-100' },
               { al: 'British Airways', code: 'BA 112', dep: '18:30 PM', arr: '06:15 AM', dur: '6h 45m', diff: '+$245.00', type: 'Add. Collect', col: 'text-red-600 bg-red-50 border-red-100', fastest: true, nextDay: true }
            ].map((opt, i) => (
               <div key={i} className="bg-white rounded-[3rem] border border-navy-100 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all p-10 group relative overflow-hidden">
                  {opt.fastest && <div className="absolute top-0 right-0 bg-primary text-white text-[8px] font-black px-6 py-2 rounded-bl-2xl tracking-[0.3em] uppercase shadow-lg">Efficiency Peak</div>}
                  <div className="flex flex-col xl:flex-row gap-12 items-stretch">
                     <div className="flex flex-col justify-center min-w-[180px] space-y-4">
                        <div className="flex items-center gap-4">
                           <div className="size-10 rounded-2xl bg-navy-50 border-2 border-white shadow-md flex items-center justify-center font-black text-navy-400">DJ</div>
                           <div>
                              <p className="text-sm font-black text-navy-950 uppercase tracking-tight">{opt.al}</p>
                              <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest opacity-60">Flight {opt.code}</p>
                           </div>
                        </div>
                     </div>

                     <div className="flex-1 flex items-center gap-10">
                        <div className="text-center md:text-left">
                           <span className="text-3xl font-black text-navy-950 tracking-tighter leading-none">{opt.dep}</span>
                           <p className="text-[10px] font-black text-primary uppercase mt-1">JFK Hub</p>
                        </div>
                        <div className="flex-1 flex flex-col items-center px-4 relative">
                           <span className="text-[9px] font-black text-navy-300 uppercase tracking-widest mb-3">{opt.dur} Duration</span>
                           <div className="w-full h-0.5 bg-navy-50 relative">
                              <span className="material-symbols-outlined text-navy-100 text-sm absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90">flight</span>
                           </div>
                        </div>
                        <div className="text-center md:text-right">
                           <span className="text-3xl font-black text-navy-950 tracking-tighter leading-none">{opt.arr}{opt.nextDay && <sup className="text-xs text-primary">+1</sup>}</span>
                           <p className="text-[10px] font-black text-primary uppercase mt-1">LHR Terminal</p>
                        </div>
                     </div>

                     <div className="flex flex-row xl:flex-col justify-between items-center xl:items-end gap-10 min-w-[220px] border-t xl:border-t-0 xl:border-l border-navy-50 pt-8 xl:pt-0 xl:pl-10">
                        <div className="text-right">
                           <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1">Revenue Delta</p>
                           <p className={`text-2xl font-black tracking-tight ${opt.diff.startsWith('-') ? 'text-emerald-600' : 'text-navy-950'}`}>{opt.diff}</p>
                           <p className={`text-[8px] font-black uppercase tracking-widest mt-1 opacity-60`}>{opt.type}</p>
                        </div>
                        <button onClick={() => onNavigate(Page.REVIEW_FLIGHT_CHANGE)} className="px-10 py-3.5 bg-navy-950 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary shadow-xl shadow-navy-950/20 group-hover:scale-105 transition-all">Select Profile</button>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* Sticky Global Action Logic */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl px-8 z-40">
         <div className="bg-white/80 backdrop-blur-3xl border border-navy-100 p-8 rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] flex items-center justify-between gap-12 animate-in slide-in-from-bottom duration-1000">
            <div className="hidden md:flex items-center gap-6 border-r border-navy-50 pr-10">
               <div className="p-3 bg-primary/5 rounded-2xl text-primary"><span className="material-symbols-outlined font-black">verified_user</span></div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-navy-950 uppercase tracking-tight leading-none">Security Sequence</p>
                  <p className="text-[8px] font-bold text-navy-400 uppercase tracking-widest leading-none">1 Passenger Identity Node</p>
               </div>
            </div>
            <div className="flex-1 text-right">
               <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest mb-1">Est. Operational Liability</p>
               <p className="text-3xl font-black text-navy-950 tracking-tighter leading-none">--</p>
            </div>
            <button className="px-12 py-5 bg-navy-100 text-navy-300 font-black uppercase text-[10px] tracking-[0.2em] rounded-3xl cursor-not-allowed border border-navy-200">Re-route Complete</button>
         </div>
      </div>
    </div>
  );
};

export default ModifyBookingSearch;
