
import React from 'react';
import { Page } from '../types';

interface FlightChangeSuccessProps {
  onNavigate: (page: Page) => void;
}

const FlightChangeSuccess: React.FC<FlightChangeSuccessProps> = ({ onNavigate }) => {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12 animate-in slide-in-from-bottom duration-700 font-display pb-32">
      <div className="text-center space-y-6 flex flex-col items-center py-10">
        <div className="relative group">
           <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-25"></div>
           <div className="relative size-28 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined !text-6xl font-black">check_circle</span>
           </div>
        </div>
        <div className="space-y-4">
          <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase">Success! You're all set.</h1>
          <p className="text-navy-400 font-bold text-lg max-w-2xl mx-auto italic uppercase tracking-wider leading-relaxed opacity-80 px-4">
             Flight sequence successfully shifted. A confirmation digest has been dispatched to your personnel terminal at <span className="text-navy-950 underline">marcus.chen@deltablue.com</span>. Your previous node has been fully decommissioned.
          </p>
        </div>
      </div>

      {/* Confirmation Block */}
      <div className="bg-white rounded-[4rem] border border-navy-100 shadow-2xl overflow-hidden group">
        <div className="p-12 bg-navy-50/50 flex flex-col md:flex-row gap-10 justify-between items-center border-b border-navy-50">
           <div className="space-y-2 text-center md:text-left">
             <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em]">Master Logic Reference</p>
             <div className="flex items-center gap-6">
                <span className="text-6xl font-black text-primary tracking-tighter uppercase">LGW882</span>
                <button className="text-navy-200 hover:text-primary p-2 bg-white rounded-xl shadow-sm border border-navy-50 transition-all"><span className="material-symbols-outlined text-2xl">content_copy</span></button>
             </div>
           </div>
           <div className="flex items-center gap-3 px-6 py-2.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 shadow-inner">
              <span className="material-symbols-outlined text-2xl font-black animate-pulse">verified</span>
              <span className="text-xs font-black uppercase tracking-widest">Node Validated</span>
           </div>
        </div>

        <div className="p-12 space-y-12">
           <div className="flex items-center justify-between border-b border-navy-50 pb-8">
              <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight flex items-center gap-4">
                 <span className="material-symbols-outlined text-primary p-2 bg-primary/5 rounded-2xl shadow-inner font-black">flight_takeoff</span>
                 Active Duty Sequence Hub
              </h3>
              <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Sequence ID: DJ-102</span>
           </div>

           <div className="flex flex-col md:flex-row gap-12 items-center bg-navy-50/30 p-12 rounded-[3.5rem] border border-navy-100 relative">
              <div className="flex flex-col items-center md:items-end min-w-[140px] text-center md:text-right space-y-2">
                 <span className="text-5xl font-black text-navy-950 leading-none">10:00</span>
                 <span className="text-2xl font-black text-primary uppercase tracking-tighter">LHR</span>
                 <span className="text-[10px] font-bold text-navy-300 uppercase tracking-widest">London Heathrow Hub</span>
              </div>
              <div className="flex-1 flex flex-col items-center px-10 relative">
                <span className="text-[9px] font-black text-navy-200 uppercase tracking-[0.3em] mb-4">7h 50m • Direct Sequence</span>
                <div className="w-full h-0.5 bg-navy-100 relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-r from-navy-50/0 via-primary/20 to-navy-50/0"></div>
                  <div className="bg-white p-3 rounded-full border border-navy-50 shadow-lg group-hover:scale-110 transition-transform">
                     <span className="material-symbols-outlined text-primary rotate-90 text-2xl font-black">flight</span>
                  </div>
                </div>
                <div className="mt-4 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                   <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> Real-time: On Schedule
                </div>
              </div>
              <div className="flex flex-col items-center md:items-start min-w-[140px] text-center md:text-left space-y-2">
                 <span className="text-5xl font-black text-navy-950 leading-none">12:50</span>
                 <span className="text-2xl font-black text-primary uppercase tracking-tighter">JFK</span>
                 <span className="text-[10px] font-bold text-navy-300 uppercase tracking-widest">New York Terminal 4</span>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pt-8 border-t border-navy-50">
              {[
                { lbl: 'Flight Sequence', val: 'DJ 117' },
                { lbl: 'Resource Tier', val: 'Economy Standard' },
                { lbl: 'Asset Assigned', val: 'Boeing 787-9' },
                { lbl: 'Allocation Node', val: 'Auto (--) Pool' }
              ].map((m, i) => (
                <div key={i} className="space-y-1">
                   <p className="text-[8px] font-black text-navy-300 uppercase tracking-[0.3em]">{m.lbl}</p>
                   <p className="text-xs font-black text-navy-900 uppercase tracking-tight">{m.val}</p>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-navy-950 p-10 flex flex-col md:flex-row items-center justify-between gap-10">
           <div className="flex items-center gap-6">
              <div className="p-4 bg-white/5 rounded-3xl text-primary border border-white/5 shadow-inner">
                 <span className="material-symbols-outlined text-3xl font-black">payments</span>
              </div>
              <div>
                 <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.25em] mb-1">Financial State</p>
                 <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Settled Balance</h4>
              </div>
           </div>
           <div className="text-center md:text-right">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Authorization Released</p>
              <p className="text-4xl font-black text-white tracking-tighter">$0.00 Exchange</p>
           </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8">
        <button className="px-10 py-4 bg-white border-2 border-navy-100 text-navy-700 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-navy-50 shadow-sm flex items-center gap-3 transition-all">
           <span className="material-symbols-outlined text-xl">download</span> Download Audit Record (PDF)
        </button>
        <button 
          onClick={() => onNavigate(Page.BOOKING_DETAIL)}
          className="px-12 py-4 bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
        >
           Manage Reservation Hub <span className="material-symbols-outlined text-xl">arrow_forward</span>
        </button>
      </div>

      <div className="flex justify-center pt-8">
         <button onClick={() => onNavigate(Page.DASHBOARD)} className="text-[10px] font-black text-navy-300 uppercase tracking-[0.3em] hover:text-primary transition-all flex items-center gap-2 group">
            <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">home</span>
            Exit to Operational Overview
         </button>
      </div>
    </div>
  );
};

export default FlightChangeSuccess;
