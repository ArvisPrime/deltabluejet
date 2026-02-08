
import React from 'react';

interface CheckinPassengersProps {
  onNext: () => void;
  onBack: () => void;
}

const CheckinPassengers: React.FC<CheckinPassengersProps> = ({ onNext, onBack }) => {
  return (
    <div className="p-8 md:p-20 max-w-5xl mx-auto space-y-12 animate-in slide-in-from-right duration-700 font-display">
      <div className="space-y-4">
         <div className="flex justify-between items-end border-b border-navy-100 pb-8">
            <div className="space-y-2">
               <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Personnel Verification</h1>
               <p className="text-navy-500 font-medium italic text-lg opacity-80 uppercase tracking-widest">Select the travelers associated with Node DJXJ799.</p>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest mb-1">Flight Sequence</p>
               <p className="text-xl font-black text-primary uppercase">DJ-102 • JFK → LHR</p>
            </div>
         </div>
      </div>

      <div className="space-y-6">
         {[
           { name: 'Chen, Marcus', id: 'P1-8821', status: 'Ready', primary: true },
           { name: 'Chen, Elena', id: 'P2-8822', status: 'Ready' }
         ].map((p, i) => (
           <label key={i} className="flex items-center justify-between p-8 rounded-[3rem] bg-white border-2 border-navy-100 hover:border-primary hover:shadow-xl transition-all cursor-pointer group">
              <div className="flex items-center gap-8">
                 <div className="relative">
                    <input defaultChecked type="checkbox" className="peer size-8 rounded-xl border-2 border-navy-100 text-primary focus:ring-primary transition-all" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 pointer-events-none">
                       <span className="material-symbols-outlined text-white text-xl font-black">check</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="size-14 rounded-[1.5rem] bg-navy-50 text-navy-400 flex items-center justify-center font-black text-lg shadow-inner group-hover:bg-primary group-hover:text-white transition-all">{p.name.charAt(0)}</div>
                    <div>
                       <h3 className="text-2xl font-black text-navy-950 uppercase tracking-tight">{p.name}</h3>
                       <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest italic opacity-60">Personnel ID: {p.id}</p>
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-6">
                 {p.primary && <span className="bg-primary/10 text-primary text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-primary/20">Lead Node</span>}
                 <span className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest"><span className="size-1.5 rounded-full bg-emerald-500 shadow-sm animate-pulse"></span> {p.status}</span>
              </div>
           </label>
         ))}
      </div>

      <div className="pt-10 flex flex-col md:flex-row items-center justify-between gap-8 border-t border-navy-50">
         <button onClick={onBack} className="text-[10px] font-black text-navy-400 uppercase tracking-widest hover:text-navy-950 transition-colors flex items-center gap-3">
            <span className="material-symbols-outlined text-xl">arrow_back</span> Return to Search
         </button>
         <button onClick={onNext} className="px-14 py-6 bg-primary text-white font-black uppercase tracking-[0.25em] text-xs rounded-[2rem] shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
            Verify Personnel <span className="material-symbols-outlined text-xl">verified_user</span>
         </button>
      </div>
    </div>
  );
};

export default CheckinPassengers;
