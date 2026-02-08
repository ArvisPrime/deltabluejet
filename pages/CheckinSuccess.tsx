
import React from 'react';

interface CheckinSuccessProps {
  onDone: () => void;
}

const CheckinSuccess: React.FC<CheckinSuccessProps> = ({ onDone }) => {
  return (
    <div className="p-8 md:p-20 max-w-4xl mx-auto space-y-16 animate-in slide-in-from-bottom duration-700 font-display pb-32">
      <div className="text-center space-y-6 flex flex-col items-center">
        <div className="relative group">
           <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-25"></div>
           <div className="relative size-24 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner border border-emerald-100/50">
              <span className="material-symbols-outlined !text-6xl font-black">check_circle</span>
           </div>
        </div>
        <div className="space-y-4">
          <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase">Checked In</h1>
          <p className="text-navy-400 font-bold text-lg max-w-xl mx-auto italic uppercase tracking-wider leading-relaxed opacity-80 px-4">
             Your flight sequence to London is verified. Please present your digital node at the station gate.
          </p>
        </div>
      </div>

      {/* High Fidelity Boarding Pass */}
      <div className="bg-white rounded-[4rem] border border-navy-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden group">
         <div className="p-10 bg-navy-950 flex flex-col md:flex-row justify-between items-center border-b border-white/5 relative">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(#137fec 2px, transparent 2px)", backgroundSize: "30px 30px" }}></div>
            <div className="flex items-center gap-5 relative z-10">
               <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20">
                  <span className="material-symbols-outlined text-2xl font-black">airlines</span>
               </div>
               <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Deltablue Jet Air</h3>
                  <p className="text-primary font-black text-[9px] uppercase tracking-widest leading-none mt-1">Registry Node: NYC-01</p>
               </div>
            </div>
            <div className="text-center md:text-right relative z-10 mt-6 md:mt-0">
               <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Sequence #</p>
               <p className="text-3xl font-black text-white tracking-tighter">DJ-102</p>
            </div>
         </div>

         <div className="p-12 space-y-12">
            <div className="flex justify-between items-center border-b border-navy-50 pb-10">
               <div className="space-y-1">
                  <span className="text-5xl font-black text-navy-950 tracking-tighter">JFK</span>
                  <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">New York City</p>
               </div>
               <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-primary text-3xl font-black animate-pulse">flight_takeoff</span>
                  <div className="w-16 h-0.5 bg-navy-100 my-2"></div>
                  <span className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Direct</span>
               </div>
               <div className="text-right space-y-1">
                  <span className="text-5xl font-black text-navy-950 tracking-tighter">LHR</span>
                  <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">London Hub</p>
               </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
               {[
                 { lbl: 'Passenger', val: 'Chen, Marcus' },
                 { lbl: 'Departure', val: '18:00 PM' },
                 { lbl: 'Pod / Seat', val: '12A' },
                 { lbl: 'Gate Status', val: 'TBA', col: 'text-primary animate-pulse' }
               ].map((m, i) => (
                 <div key={i} className="space-y-1">
                    <p className="text-[9px] font-black text-navy-300 uppercase tracking-[0.3em]">{m.lbl}</p>
                    <p className={`text-lg font-black text-navy-900 uppercase tracking-tight leading-tight ${m.col || ''}`}>{m.val}</p>
                 </div>
               ))}
            </div>

            {/* QR Node Container */}
            <div className="flex flex-col items-center pt-8 border-t border-navy-50 gap-8">
               <div className="relative group/qr">
                  <div className="absolute inset-0 bg-primary/10 rounded-[3rem] blur-2xl group-hover:bg-primary/20 transition-all"></div>
                  <div className="relative p-10 bg-white rounded-[3.5rem] border-4 border-navy-950 shadow-2xl overflow-hidden">
                     <div className="size-48 bg-navy-950 rounded-2xl flex items-center justify-center p-4 relative overflow-hidden group-hover:scale-105 transition-transform duration-700">
                        {/* Simulated QR Logic */}
                        <div className="grid grid-cols-8 gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                           {[...Array(64)].map((_, i) => (
                             <div key={i} className={`size-3 rounded-sm ${Math.random() > 0.5 ? 'bg-primary shadow-[0_0_5px_rgba(19,127,236,0.6)]' : 'bg-transparent'}`} />
                           ))}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <div className="size-16 rounded-2xl bg-white p-3 flex items-center justify-center shadow-2xl border-4 border-navy-950">
                              <span className="material-symbols-outlined text-navy-950 text-2xl font-black">airlines</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
               <p className="text-[10px] font-black text-navy-300 uppercase tracking-[0.4em] animate-pulse">Awaiting Personnel Verification Scan</p>
            </div>
         </div>

         <div className="bg-navy-50/50 p-8 flex flex-col md:flex-row items-center justify-between gap-8 border-t border-navy-100">
            <div className="flex gap-4">
               <button className="px-8 py-4 bg-white border-2 border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:border-primary hover:text-primary transition-all shadow-sm flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">print</span> Print Node
               </button>
               <button className="px-8 py-4 bg-white border-2 border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:border-primary hover:text-primary transition-all shadow-sm flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">smartphone</span> Save to Wallet
               </button>
            </div>
            <button 
              onClick={onDone}
              className="px-12 py-4 bg-navy-950 text-white font-black uppercase text-[10px] tracking-[0.25em] rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
            >
               Return to Home Hub <span className="material-symbols-outlined text-lg">home</span>
            </button>
         </div>
      </div>

      <div className="text-center opacity-40">
         <p className="text-[9px] font-bold text-navy-400 uppercase leading-relaxed tracking-widest italic">
            This digital node is valid for Flight DJ-102 departing JFK. Subject to security registry verification at Hub station entrance.
         </p>
      </div>
    </div>
  );
};

export default CheckinSuccess;
