
import React, { useState } from 'react';

interface ManageBookingRetrievalProps {
  onNext: () => void;
  onBack: () => void;
}

const ManageBookingRetrieval: React.FC<ManageBookingRetrievalProps> = ({ onNext, onBack }) => {
  const [pnr, setPnr] = useState('');
  const [lastName, setLastName] = useState('');

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 md:p-20 font-display animate-in fade-in duration-700 bg-white/10">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        
        <div className="space-y-10">
           <div className="space-y-6">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-navy-950 text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-xl">
                 <span className="material-symbols-outlined text-sm text-primary animate-pulse">settings</span>
                 Trip Control Terminal
              </div>
              <h1 className="text-6xl font-black text-navy-950 tracking-tighter uppercase leading-[0.9]">Manage <br/>Your Mission</h1>
              <p className="text-navy-500 font-medium italic text-xl leading-relaxed uppercase tracking-wider opacity-80">
                 Modify flight nodes, allocate seating pods, and oversee your personnel registry in one secure hub.
              </p>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { icon: 'edit_calendar', label: 'Shift Schedule', desc: 'Modify departure nodes' },
                { icon: 'airline_seat_recline_extra', label: 'Seat Pods', desc: 'Update allocation' },
                { icon: 'luggage', label: 'Ancillaries', desc: 'Manage baggage logic' },
                { icon: 'contact_support', label: 'Ops Help', desc: 'Direct station link' }
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-4 group">
                   <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                      <span className="material-symbols-outlined text-xl">{feat.icon}</span>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-navy-950 uppercase tracking-tight">{feat.label}</p>
                      <p className="text-[8px] font-bold text-navy-400 uppercase tracking-widest opacity-60">{feat.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-white rounded-[4rem] border border-navy-100 p-12 md:p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] relative group overflow-hidden ring-1 ring-navy-50">
           <div className="absolute top-0 left-0 w-full h-2 bg-navy-950"></div>
           <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-navy-950 pointer-events-none">
              <span className="material-symbols-outlined text-[140px] font-black">airplane_ticket</span>
           </div>
           
           <form className="space-y-12 relative z-10" onSubmit={(e) => { e.preventDefault(); onNext(); }}>
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-2">Master Logic Reference (PNR)</label>
                 <div className="relative group/input">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-navy-200 group-focus-within/input:text-primary transition-colors">qr_code</span>
                    <input 
                      required
                      placeholder="E.G. DJXJ799"
                      value={pnr}
                      onChange={(e) => setPnr(e.target.value.toUpperCase())}
                      className="w-full h-20 pl-16 pr-8 bg-navy-50 border-none rounded-[2rem] text-2xl font-black text-navy-950 uppercase tracking-[0.2em] focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" 
                    />
                 </div>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-2">Personnel Surname</label>
                 <div className="relative group/input">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-navy-200 group-focus-within/input:text-primary transition-colors">person</span>
                    <input 
                      required
                      placeholder="E.G. CHEN"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value.toUpperCase())}
                      className="w-full h-20 pl-16 pr-8 bg-navy-50 border-none rounded-[2rem] text-xl font-black text-navy-950 uppercase tracking-widest focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" 
                    />
                 </div>
              </div>

              <div className="pt-8 space-y-6">
                 <button className="w-full h-20 bg-primary text-white font-black uppercase tracking-[0.3em] text-xs rounded-[2rem] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-6 group/btn">
                    Access Registry <span className="material-symbols-outlined text-2xl group-hover/btn:translate-x-2 transition-transform">arrow_forward</span>
                 </button>
                 <button type="button" onClick={onBack} className="w-full text-[10px] font-black text-navy-300 uppercase tracking-[0.4em] hover:text-navy-950 transition-colors">Return to Landing Page</button>
              </div>
           </form>

           <div className="mt-12 pt-8 border-t border-navy-50 flex items-center gap-4 opacity-40">
              <span className="material-symbols-outlined text-navy-400">verified_user</span>
              <p className="text-[8px] font-bold text-navy-400 uppercase tracking-[0.2em] leading-relaxed">
                 Registry link secured by Deltablue AES-256 Protocol. Personnel data is strictly confidential.
              </p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ManageBookingRetrieval;
