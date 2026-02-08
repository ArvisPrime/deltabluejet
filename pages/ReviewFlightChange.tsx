
import React from 'react';
import { Page } from '../types';

interface ReviewFlightChangeProps {
  onNavigate: (page: Page) => void;
}

const ReviewFlightChange: React.FC<ReviewFlightChangeProps> = ({ onNavigate }) => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 font-display pb-32">
      {/* Step Indicator */}
      <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full">
        <div className="flex justify-between items-end">
          <p className="text-navy-900 text-sm font-black uppercase tracking-widest">Step 2 of 4: Review Changes</p>
          <p className="text-navy-400 text-xs font-bold uppercase tracking-widest">Next: Payment Registry</p>
        </div>
        <div className="h-2 w-full bg-navy-100 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-primary w-1/2 rounded-full shadow-[0_0_8px_rgba(19,127,236,0.5)]"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Details */}
        <div className="lg:col-span-8 space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Review your flight changes</h1>
            <p className="text-navy-500 font-medium italic text-lg opacity-80">Verify the operational deltas. The original sequence will be decommissioned upon commit.</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 flex gap-4 items-start shadow-sm">
            <span className="material-symbols-outlined text-amber-600 font-black p-2 bg-white rounded-xl shadow-sm">info</span>
            <div>
              <p className="text-amber-900 font-black text-xs uppercase tracking-widest">Protocol Update</p>
              <p className="text-amber-800 text-sm mt-1 font-medium leading-relaxed uppercase tracking-wide">
                Your new sequence is non-refundable. Changes can be made up to 24 hours before departure for a standard re-triage fee.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            {/* Original Flight */}
            <div className="relative p-10 rounded-[3rem] border border-navy-100 bg-white shadow-sm opacity-60 hover:opacity-100 transition-all group overflow-hidden">
               <div className="absolute top-6 right-8 bg-navy-50 text-navy-400 text-[10px] font-black px-4 py-1.5 rounded-full border border-navy-100 uppercase tracking-widest">Original Node</div>
               <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-navy-200">flight_takeoff</span>
                  JFK (New York) to LHR (London)
               </h3>
               <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                  <div className="flex flex-col min-w-[140px]">
                    <span className="text-3xl font-black text-navy-950 tracking-tighter">10:00 AM</span>
                    <span className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mt-1">Oct 12, Sat</span>
                    <span className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Terminal 4</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center px-4 relative">
                    <span className="text-[10px] font-black text-navy-300 mb-3 uppercase tracking-widest">7h 05m</span>
                    <div className="w-full h-0.5 bg-navy-100 relative">
                       <span className="material-symbols-outlined text-navy-200 text-sm absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90">flight</span>
                    </div>
                    <span className="text-[8px] font-black text-navy-200 mt-3 uppercase tracking-widest">Non-stop</span>
                  </div>
                  <div className="flex flex-col text-right min-w-[140px]">
                    <span className="text-3xl font-black text-navy-950 tracking-tighter">10:05 PM</span>
                    <span className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mt-1">Oct 12, Sat</span>
                    <span className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Terminal 2</span>
                  </div>
               </div>
               <div className="mt-8 pt-6 border-t border-navy-50 flex items-center gap-4">
                  <div className="size-8 rounded-xl bg-navy-50 flex items-center justify-center text-navy-300 shadow-inner">
                    <span className="material-symbols-outlined text-xl">airlines</span>
                  </div>
                  <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Flight DJ-204 • Economy (L)</p>
               </div>
            </div>

            {/* Visual Indicator */}
            <div className="flex justify-center -my-6 relative z-10">
              <div className="bg-navy-50 p-3 rounded-full border-4 border-white shadow-xl">
                <span className="material-symbols-outlined text-primary text-3xl font-black animate-bounce">arrow_downward</span>
              </div>
            </div>

            {/* New Flight */}
            <div className="relative p-10 rounded-[3.5rem] border-4 border-primary bg-white shadow-2xl space-y-8 group overflow-hidden">
               <div className="absolute top-6 right-8 bg-primary/5 text-primary text-[10px] font-black px-6 py-2 rounded-full border border-primary/10 uppercase tracking-widest">New Operational Target</div>
               <h3 className="text-xl font-black text-primary uppercase tracking-tight flex items-center gap-4">
                  <span className="material-symbols-outlined font-black">flight_takeoff</span>
                  JFK (New York) to LHR (London)
               </h3>
               <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                  <div className="flex flex-col min-w-[140px]">
                    <span className="text-4xl font-black text-navy-950 tracking-tighter leading-none">06:00 PM</span>
                    <span className="text-sm font-black text-primary uppercase mt-2">Oct 14, Mon</span>
                    <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Terminal 4</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center px-4 relative">
                    <span className="text-[10px] font-black text-navy-300 mb-4 uppercase tracking-widest">6h 50m Flight</span>
                    <div className="w-full h-0.5 bg-primary/20 relative">
                       <span className="material-symbols-outlined text-primary text-xl absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 drop-shadow-[0_0_8px_rgba(19,127,236,0.4)]">flight</span>
                    </div>
                    <span className="text-[9px] font-black text-primary mt-4 uppercase tracking-widest bg-primary/5 px-4 py-1 rounded-full border border-primary/10">Optimization Path</span>
                  </div>
                  <div className="flex flex-col text-right min-w-[140px]">
                    <span className="text-4xl font-black text-navy-950 tracking-tighter leading-none">05:50 AM</span>
                    <span className="text-sm font-black text-primary uppercase mt-2">Oct 15, Tue</span>
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center justify-end gap-1"><span className="material-symbols-outlined text-xs">wb_sunny</span> +1 Day</span>
                  </div>
               </div>
               <div className="pt-8 border-t border-navy-100 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                       <span className="material-symbols-outlined font-black">airlines</span>
                    </div>
                    <div className="space-y-0.5">
                       <p className="text-sm font-black text-navy-950 uppercase tracking-tight">Deltablue Jet Air</p>
                       <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest opacity-60">Flight DJ-288 • Economy (K)</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                     {[
                       { icon: 'wifi', lbl: 'Network' },
                       { icon: 'power', lbl: 'Power' },
                       { icon: 'restaurant', lbl: 'Meal' }
                     ].map(feat => (
                       <span key={feat.icon} className="material-symbols-outlined text-navy-200 text-xl" title={feat.lbl}>{feat.icon}</span>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="lg:col-span-4 w-full">
           <div className="sticky top-8 space-y-6">
              <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-xl overflow-hidden flex flex-col">
                 <div className="p-8 border-b border-navy-50 bg-navy-50/20">
                    <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight">Price Summary Delta</h3>
                 </div>
                 <div className="p-10 space-y-6">
                    <div className="space-y-4">
                       <div className="flex justify-between text-[10px] font-black text-navy-400 uppercase tracking-widest">
                          <span>Fare Difference Delta</span>
                          <span className="text-navy-950 font-black">+$120.00</span>
                       </div>
                       <div className="flex justify-between text-[10px] font-black text-navy-400 uppercase tracking-widest">
                          <span>Operational Re-issue Fee</span>
                          <span className="text-navy-950 font-black">+$50.00</span>
                       </div>
                       <div className="flex justify-between text-[10px] font-black text-navy-400 uppercase tracking-widest">
                          <span>Regulatory Taxes & Logic</span>
                          <span className="text-navy-950 font-black">$0.00</span>
                       </div>
                    </div>
                    <div className="pt-8 border-t-2 border-dashed border-navy-50 flex justify-between items-end">
                       <span className="text-[11px] font-black text-navy-400 uppercase tracking-[0.2em] pb-1">Total Liability Due</span>
                       <span className="text-5xl font-black text-navy-950 tracking-tighter leading-none">$170.00</span>
                    </div>
                    <p className="text-[9px] font-bold text-navy-400 leading-relaxed uppercase tracking-widest italic opacity-60">
                       Includes all applicable system fees. Any refunded logical buckets will be processed to the original form of authorization.
                    </p>
                    <div className="flex flex-col gap-4 pt-4">
                       <button 
                         onClick={() => onNavigate(Page.FLIGHT_CHANGE_SUCCESS)}
                         className="w-full py-5 bg-primary text-white font-black uppercase tracking-[0.2em] text-sm rounded-3xl shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                       >
                          Confirm & Authorize <span className="material-symbols-outlined">check_circle</span>
                       </button>
                       <button 
                         onClick={() => onNavigate(Page.MODIFY_BOOKING)}
                         className="w-full py-5 bg-white border-2 border-navy-100 text-navy-700 font-black uppercase text-xs tracking-widest rounded-3xl hover:bg-navy-50 transition-all"
                       >
                          Back to alternatives
                       </button>
                    </div>
                 </div>
              </div>
              <div className="text-center">
                 <button onClick={() => onNavigate(Page.BOOKING_DETAIL)} className="text-[10px] font-black text-navy-300 uppercase tracking-widest hover:text-red-500 transition-colors underline decoration-2 underline-offset-4">Abort Modification Request</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewFlightChange;
