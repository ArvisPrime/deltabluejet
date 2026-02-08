
import React, { useState } from 'react';

interface FlightResultsProps {
  onBack: () => void;
  onNext: () => void;
}

const BookingStepper: React.FC<{ current: number }> = ({ current }) => {
  const steps = ['Search', 'Flights', 'Fare', 'Personnel', 'Seats', 'Secure'];
  return (
    <div className="flex items-center justify-between max-w-2xl mx-auto w-full mb-12">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center gap-2 group cursor-default">
            <div className={`size-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${
              i <= current ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white border-navy-100 text-navy-300'
            }`}>
              {i < current ? <span className="material-symbols-outlined text-sm">check</span> : i + 1}
            </div>
            <span className={`text-[8px] font-black uppercase tracking-widest transition-all ${i === current ? 'text-navy-950' : 'text-navy-300'}`}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-4 ${i < current ? 'bg-primary' : 'bg-navy-50'}`}></div>}
        </React.Fragment>
      ))}
    </div>
  );
};

const FlightResults: React.FC<FlightResultsProps> = ({ onBack, onNext }) => {
  const [activeFilter, setActiveFilter] = useState('Recommended');

  const flights = [
    { id: 'DJ102', dep: '08:00', arr: '11:30', from: 'JFK', to: 'LHR', dur: '7h 30m', price: '450', stops: 'Non-stop', equipment: 'Boeing 787-9', badge: 'Recommended' },
    { id: 'DJ440', dep: '14:15', arr: '17:45', from: 'JFK', to: 'LHR', dur: '7h 30m', price: '520', stops: 'Non-stop', equipment: 'Airbus A350', badge: 'Fastest' },
    { id: 'DJ209', dep: '21:00', arr: '06:30', from: 'JFK', to: 'LHR', dur: '7h 30m', price: '380', stops: 'Non-stop', equipment: 'Boeing 787-8', badge: 'Best Value', nextDay: true },
  ];

  return (
    <div className="min-h-screen bg-navy-50/20 font-sans p-4 md:p-10 pb-32">
      <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-700">
        <BookingStepper current={1} />

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Left Column: Filters */}
          <aside className="w-full lg:w-72 space-y-8 shrink-0">
            <div className="bg-white rounded-[2.5rem] border border-navy-100 p-8 shadow-sm space-y-8">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black text-navy-950 uppercase tracking-tighter">Refine</h3>
                 <button onClick={onBack} className="text-[10px] font-black text-primary uppercase underline">Edit Search</button>
              </div>
              
              <div className="space-y-6">
                 <div>
                   <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest mb-4">Stops</p>
                   <div className="space-y-3">
                      {['Non-stop', '1 Stop', '2+ Stops'].map(opt => (
                        <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                           <input type="checkbox" defaultChecked={opt === 'Non-stop'} className="size-5 rounded border-2 border-navy-100 text-primary focus:ring-primary transition-all" />
                           <span className="text-xs font-bold text-navy-600 group-hover:text-navy-950 uppercase tracking-wide">{opt}</span>
                        </label>
                      ))}
                   </div>
                 </div>

                 <div>
                   <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest mb-4">Departure Time</p>
                   <div className="h-1.5 w-full bg-navy-50 rounded-full relative shadow-inner">
                      <div className="absolute left-[20%] right-[10%] h-full bg-primary rounded-full"></div>
                      <div className="absolute left-[20%] top-1/2 -translate-y-1/2 size-4 bg-white border-2 border-primary rounded-full shadow-lg cursor-pointer"></div>
                      <div className="absolute right-[10%] top-1/2 -translate-y-1/2 size-4 bg-white border-2 border-primary rounded-full shadow-lg cursor-pointer"></div>
                   </div>
                   <div className="flex justify-between mt-3 text-[9px] font-black text-navy-400 uppercase">
                      <span>06:00 AM</span>
                      <span>11:59 PM</span>
                   </div>
                 </div>
              </div>
            </div>

            <div className="bg-navy-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[100px] font-black">loyalty</span>
               </div>
               <div className="relative z-10 space-y-4">
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Deltablue Club</p>
                  <h4 className="text-lg font-black uppercase tracking-tight leading-tight">Unlock personnel discounts</h4>
                  <button className="bg-white/10 border border-white/10 hover:bg-white/20 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Join Registry</button>
               </div>
            </div>
          </aside>

          {/* Main Content: Results */}
          <div className="flex-1 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
               <div className="space-y-1">
                  <h2 className="text-3xl font-black text-navy-950 tracking-tighter uppercase leading-none">New York (JFK) <span className="text-primary">→</span> London (LHR)</h2>
                  <p className="text-[10px] font-bold text-navy-400 uppercase tracking-[0.3em]">Sat, Oct 12 • 1 Passenger • Economy Class</p>
               </div>
               <div className="flex bg-white rounded-2xl p-1.5 border border-navy-100 shadow-sm w-fit">
                  {['Recommended', 'Cheapest', 'Fastest'].map(f => (
                    <button 
                      key={f} 
                      onClick={() => setActiveFilter(f)}
                      className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeFilter === f ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-navy-400 hover:bg-navy-50'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
               </div>
            </div>

            {/* Flight Grid */}
            <div className="space-y-6">
              {flights.map((f, i) => (
                <div 
                  key={i} 
                  onClick={onNext}
                  className="bg-white rounded-[3.5rem] border border-navy-100 p-10 flex flex-col xl:flex-row gap-12 items-stretch hover:shadow-2xl hover:border-primary/40 transition-all group cursor-pointer relative overflow-hidden"
                >
                   {f.badge && (
                      <div className="absolute top-0 right-0 bg-primary text-white text-[8px] font-black px-10 py-2 rounded-bl-[2rem] shadow-lg uppercase tracking-[0.3em]">
                        {f.badge}
                      </div>
                   )}
                   
                   <div className="flex flex-col justify-center min-w-[200px] border-b xl:border-b-0 xl:border-r border-navy-50 pb-8 xl:pb-0 xl:pr-12">
                      <div className="flex items-center gap-5 mb-6">
                        <div className="size-11 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                           <span className="material-symbols-outlined text-2xl font-black">airlines</span>
                        </div>
                        <div>
                           <p className="text-sm font-black text-navy-950 uppercase tracking-tight">Deltablue Air</p>
                           <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest opacity-60">Sequence {f.id}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                         <span className="text-[10px] font-black text-navy-700 bg-navy-50 px-3 py-1 rounded-lg w-fit border border-navy-100 uppercase tracking-widest">{f.equipment}</span>
                         <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Scheduled (On Time)
                         </span>
                      </div>
                   </div>

                   <div className="flex-1 flex flex-col md:flex-row items-center gap-10">
                      <div className="text-center md:text-left min-w-[120px]">
                         <span className="text-4xl font-black text-navy-950 tracking-tighter leading-none">{f.dep}</span>
                         <p className="text-xl font-black text-primary uppercase mt-1">{f.from}</p>
                         <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">JFK Hub</p>
                      </div>

                      <div className="flex-1 flex flex-col items-center px-4 relative min-w-[200px]">
                         <span className="text-[10px] font-black text-navy-300 uppercase tracking-widest mb-4">{f.dur} Duration</span>
                         <div className="w-full h-0.5 bg-navy-100 relative flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-r from-navy-50/0 via-primary/10 to-navy-50/0"></div>
                            <div className="absolute left-0 size-2.5 rounded-full bg-navy-200 group-hover:bg-primary transition-colors"></div>
                            <div className="absolute right-0 size-2.5 rounded-full bg-navy-200 group-hover:bg-primary transition-colors"></div>
                            <div className="bg-white p-2.5 rounded-2xl border border-navy-50 text-primary z-10 shadow-sm group-hover:scale-125 group-hover:rotate-45 transition-all">
                               <span className="material-symbols-outlined rotate-90 text-xl font-black">flight</span>
                            </div>
                         </div>
                         <div className="mt-4 flex gap-4">
                            <span className="text-[9px] font-black text-navy-950 bg-navy-50 px-3 py-1 rounded-full border border-navy-100 uppercase tracking-widest">{f.stops}</span>
                         </div>
                      </div>

                      <div className="text-center md:text-right min-w-[120px]">
                         <span className="text-4xl font-black text-navy-950 tracking-tighter leading-none">
                            {f.arr}
                            {f.nextDay && <sup className="text-xs text-primary font-black ml-1">+1</sup>}
                         </span>
                         <p className="text-xl font-black text-primary uppercase mt-1">{f.to}</p>
                         <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">LHR Terminal</p>
                      </div>
                   </div>

                   <div className="flex flex-row xl:flex-col justify-between items-center xl:items-end gap-10 min-w-[200px] border-t xl:border-t-0 xl:border-l border-navy-50 pt-8 xl:pt-0 xl:pl-12">
                      <div className="text-right">
                         <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest mb-1">Node Entry Price</p>
                         <div className="flex items-baseline justify-end gap-1">
                            <span className="text-xs font-black text-navy-400">USD</span>
                            <span className="text-4xl font-black text-navy-950 tracking-tighter">${f.price}</span>
                         </div>
                      </div>
                      <button className="px-12 py-5 bg-navy-950 text-white font-black uppercase text-[11px] tracking-[0.25em] rounded-[1.5rem] shadow-2xl shadow-navy-950/20 group-hover:bg-primary group-hover:shadow-primary/30 transition-all hover:scale-105 active:scale-95">Select Sequence</button>
                   </div>
                </div>
              ))}
            </div>

            <div className="p-12 text-center border-2 border-dashed border-navy-100 rounded-[4rem] group hover:border-primary transition-all cursor-pointer">
               <p className="text-[11px] font-black text-navy-300 uppercase tracking-[0.4em] group-hover:text-primary transition-colors">You've reached the end of the registry node.</p>
               <p className="text-[9px] font-bold text-navy-200 uppercase tracking-widest mt-2 italic">Deltablue AI suggests looking at alternate dates for higher density capacity options.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dynamic Summary Bubble */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-20 duration-1000 delay-500">
         <div className="bg-white/80 backdrop-blur-3xl border border-navy-100 p-6 rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)] flex items-center gap-10 border-t border-white">
            <div className="flex items-center gap-5 pr-10 border-r border-navy-50">
               <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <span className="material-symbols-outlined font-black">travel_explore</span>
               </div>
               <div>
                  <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Active Sequence Filter</p>
                  <p className="text-xs font-black text-navy-950 uppercase tracking-tight">Non-stop • JFK HUB <span className="text-primary mx-1">→</span> LHR</p>
               </div>
            </div>
            <div className="text-[9px] font-black text-navy-400 uppercase tracking-[0.3em] flex items-center gap-3">
               <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
               Real-time Telemetry Linked
            </div>
         </div>
      </div>
    </div>
  );
};

export default FlightResults;
