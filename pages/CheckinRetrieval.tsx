
import React, { useState } from 'react';

interface CheckinRetrievalProps {
  onNext: () => void;
  onBack: () => void;
}

const CheckinRetrieval: React.FC<CheckinRetrievalProps> = ({ onNext, onBack }) => {
  const [pnr, setPnr] = useState('');
  const [lastName, setLastName] = useState('');

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 md:p-20 font-display animate-in fade-in duration-700">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        <div className="space-y-8">
           <div className="space-y-4">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
                 <span className="material-symbols-outlined text-sm">hub</span>
                 Online Node Dispatch
              </div>
              <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-tight">Initialise <br/>Check-in Sequence</h1>
              <p className="text-navy-500 font-medium italic text-lg leading-relaxed uppercase tracking-wider opacity-70">
                 Access your flight registry 24 hours prior to departure. Prepare for transit through the Deltablue network.
              </p>
           </div>

           <div className="bg-navy-50/50 p-8 rounded-[2.5rem] border border-navy-100 shadow-inner group">
              <div className="flex items-start gap-6">
                 <div className="size-14 rounded-2xl bg-white text-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl font-black">info</span>
                 </div>
                 <div className="space-y-1">
                    <p className="text-xs font-black text-navy-950 uppercase tracking-tight">Requirement Protocol</p>
                    <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest leading-relaxed opacity-60">
                       You will need your master record locator (PNR) and the legal surname of the primary personnel node.
                    </p>
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-[4rem] border border-navy-100 p-10 md:p-14 shadow-2xl relative group overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
           
           <form className="space-y-10 relative z-10" onSubmit={(e) => { e.preventDefault(); onNext(); }}>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-2">Record Locator (PNR)</label>
                 <div className="relative group/input">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-navy-200 group-focus-within/input:text-primary transition-colors">confirmation_number</span>
                    <input 
                      required
                      placeholder="E.G. DJXJ799"
                      value={pnr}
                      onChange={(e) => setPnr(e.target.value.toUpperCase())}
                      className="w-full h-16 pl-16 pr-6 bg-navy-50 border-none rounded-3xl text-lg font-black text-navy-950 uppercase tracking-widest focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" 
                    />
                 </div>
              </div>

              <div className="space-y-3">
                 <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-2">Personnel Last Name</label>
                 <div className="relative group/input">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-navy-200 group-focus-within/input:text-primary transition-colors">person</span>
                    <input 
                      required
                      placeholder="E.G. CHEN"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value.toUpperCase())}
                      className="w-full h-16 pl-16 pr-6 bg-navy-50 border-none rounded-3xl text-lg font-black text-navy-950 uppercase tracking-widest focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" 
                    />
                 </div>
              </div>

              <div className="pt-6">
                 <button className="w-full h-16 bg-primary text-white font-black uppercase tracking-[0.25em] text-xs rounded-[1.75rem] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group/btn">
                    Initialise Search <span className="material-symbols-outlined text-xl group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                 </button>
                 <button type="button" onClick={onBack} className="w-full mt-6 text-[9px] font-black text-navy-300 uppercase tracking-widest hover:text-navy-900 transition-colors">Abort Sequence</button>
              </div>
           </form>
        </div>

      </div>
    </div>
  );
};

export default CheckinRetrieval;
