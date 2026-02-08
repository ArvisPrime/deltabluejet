
import React from 'react';

const PasswordPolicy: React.FC = () => {
  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar font-sans bg-navy-50/20">
      <div className="max-w-[1400px] mx-auto w-full space-y-10 pb-24 animate-in fade-in slide-in-from-bottom duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-navy-100 pb-10">
          <div className="max-w-2xl space-y-6">
             <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-navy-300 px-1">
                <span>Security Administration</span>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-primary">Password Policy</span>
             </nav>
             <div className="space-y-4">
                <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">Password Policy</h1>
                <p className="text-navy-500 font-medium italic text-xl leading-relaxed uppercase tracking-wider">Define and enforce security requirements for user accounts across the airline booking ecosystem.</p>
             </div>
          </div>
          <div className="flex items-center gap-3 bg-white p-4 rounded-full border border-navy-100 shadow-sm">
             <span className="material-symbols-outlined text-emerald-500 font-black">check_circle</span>
             <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Last Updated: 2 days ago by System</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Controls */}
          <div className="lg:col-span-8 space-y-10">
            <div className="bg-white rounded-[3.5rem] border border-navy-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="p-10 border-b border-navy-50 bg-navy-50/20 flex items-center gap-6">
                 <div className="p-4 rounded-2xl bg-blue-50 text-primary shadow-inner">
                    <span className="material-symbols-outlined text-2xl font-black">password</span>
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight leading-none">Complexity Rules</h3>
                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-2 opacity-60">Requirements for valid passwords</p>
                 </div>
              </div>
              <div className="divide-y divide-navy-50 px-4">
                 {[
                   { label: 'Minimum Length', desc: 'Minimum number of characters required', type: 'number', val: 12 },
                   { label: 'Require Uppercase', desc: 'Must contain at least one uppercase letter (A-Z)', type: 'toggle', active: true },
                   { label: 'Require Lowercase', desc: 'Must contain at least one lowercase letter (a-z)', type: 'toggle', active: true },
                   { label: 'Require Numbers', desc: 'Must contain at least one numeric digit (0-9)', type: 'toggle', active: true },
                   { label: 'Require Special Characters', desc: 'Must contain at least one symbol (!@#$%)', type: 'toggle', active: false },
                 ].map((rule, idx) => (
                   <div key={idx} className="p-8 px-10 flex items-center justify-between gap-10 hover:bg-navy-50/30 transition-all group">
                      <div className="max-w-md space-y-1">
                         <p className="text-base font-black text-navy-950 uppercase tracking-tight group-hover:text-primary transition-colors">{rule.label}</p>
                         <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest opacity-60 leading-relaxed">{rule.desc}</p>
                      </div>
                      {rule.type === 'number' ? (
                        <div className="flex items-center gap-4 bg-navy-50 p-1.5 rounded-2xl border border-navy-100 shadow-inner">
                           <button className="size-10 rounded-xl bg-white flex items-center justify-center text-navy-400 hover:text-primary shadow-md transition-all active:scale-90"><span className="material-symbols-outlined text-sm font-black">remove</span></button>
                           <input type="number" readOnly className="w-12 bg-transparent border-none text-center font-black text-navy-950" value={rule.val} />
                           <button className="size-10 rounded-xl bg-white flex items-center justify-center text-navy-400 hover:text-primary shadow-md transition-all active:scale-90"><span className="material-symbols-outlined text-sm font-black">add</span></button>
                        </div>
                      ) : (
                        <div className="relative inline-flex items-center h-7 rounded-full w-14 transition-all shadow-inner">
                           <input checked={rule.active} readOnly type="checkbox" className="sr-only peer" />
                           <div className="w-14 h-7 bg-navy-100 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md"></div>
                        </div>
                      )}
                   </div>
                 ))}
              </div>
            </div>

            <div className="bg-white rounded-[3.5rem] border border-navy-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="p-10 border-b border-navy-50 bg-navy-50/20 flex items-center gap-6">
                 <div className="p-4 rounded-2xl bg-orange-50 text-orange-600 shadow-inner">
                    <span className="material-symbols-outlined text-2xl font-black">history</span>
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight leading-none">Rotation & History</h3>
                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-2 opacity-60">Expiration and reuse policies</p>
                 </div>
              </div>
              <div className="divide-y divide-navy-50 px-4">
                 {[
                   { label: 'Password Expiration', desc: 'Days before a password reset is forced', val: 90, unit: 'Days' },
                   { label: 'Enforce History', desc: 'Number of previous passwords to prevent reusing', val: 5, unit: 'Versions' },
                 ].map((rule, idx) => (
                    <div key={idx} className="p-8 px-10 flex items-center justify-between gap-10 hover:bg-navy-50/30 transition-all group">
                       <div className="max-w-md space-y-1">
                          <p className="text-base font-black text-navy-950 uppercase tracking-tight group-hover:text-primary transition-colors">{rule.label}</p>
                          <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest opacity-60 leading-relaxed">{rule.desc}</p>
                       </div>
                       <div className="flex items-center gap-4 bg-navy-50 p-1.5 rounded-2xl border border-navy-100 shadow-inner">
                          <button className="size-10 rounded-xl bg-white flex items-center justify-center text-navy-400 hover:text-primary shadow-md transition-all active:scale-90"><span className="material-symbols-outlined text-sm font-black">remove</span></button>
                          <input type="number" readOnly className="w-12 bg-transparent border-none text-center font-black text-navy-950" value={rule.val} />
                          <button className="size-10 rounded-xl bg-white flex items-center justify-center text-navy-400 hover:text-primary shadow-md transition-all active:scale-90"><span className="material-symbols-outlined text-sm font-black">add</span></button>
                       </div>
                    </div>
                 ))}
              </div>
            </div>
          </div>

          {/* Side Panels */}
          <div className="lg:col-span-4 space-y-10">
            <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-sm overflow-hidden flex flex-col">
               <div className="p-8 border-b border-navy-50 bg-navy-50/20 flex items-center gap-6">
                  <div className="p-3 rounded-[1.5rem] bg-red-50 text-red-600 shadow-inner">
                     <span className="material-symbols-outlined text-xl font-black">lock_clock</span>
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight leading-none">Lockout Policy</h3>
                     <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest mt-1 opacity-60">Failed login protection</p>
                  </div>
               </div>
               <div className="p-10 space-y-8">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Max Failed Attempts</label>
                     <div className="relative group">
                        <input type="number" defaultValue="3" className="w-full h-14 pl-6 pr-24 bg-navy-50 border-none rounded-[1.5rem] font-black text-navy-950 focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-navy-300 uppercase tracking-widest pointer-events-none">attempts</span>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Lockout Duration</label>
                     <div className="relative group">
                        <input type="number" defaultValue="30" className="w-full h-14 pl-6 pr-24 bg-navy-50 border-none rounded-[1.5rem] font-black text-navy-950 focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-navy-300 uppercase tracking-widest pointer-events-none">minutes</span>
                     </div>
                  </div>
                  <div className="p-6 bg-red-50 rounded-3xl border border-red-100 flex gap-4 items-start shadow-sm">
                     <span className="material-symbols-outlined text-red-500 font-black">warning</span>
                     <p className="text-[10px] font-bold text-red-700 uppercase italic leading-relaxed tracking-wider">Changes to lockout policies affect all users immediately. Helpdesk sync required.</p>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-sm overflow-hidden flex flex-col">
               <div className="p-8 border-b border-navy-50 bg-navy-50/20">
                  <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight leading-none">Policy Scope</h3>
               </div>
               <div className="p-10 space-y-4">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Apply Policy To</label>
                  <select className="w-full h-14 px-8 bg-navy-50 border-none rounded-[1.5rem] font-black text-navy-950 uppercase text-xs focus:ring-8 focus:ring-primary/5 appearance-none shadow-inner">
                     <option>Global (All Users)</option>
                     <option>Administrators Only</option>
                     <option>Ground Crew</option>
                  </select>
               </div>
            </div>

            <div className="bg-navy-950 rounded-[4rem] text-white p-10 relative overflow-hidden shadow-2xl group">
               <div className="absolute top-0 right-0 p-8 opacity-10 transition-transform group-hover:scale-110 duration-1000">
                  <span className="material-symbols-outlined text-[140px] font-black">verified_user</span>
               </div>
               <div className="relative z-10 space-y-8">
                  <h3 className="text-xl font-black uppercase tracking-[0.25em] flex items-center gap-4">
                     <span className="material-symbols-outlined text-primary">analytics</span> Policy Strength
                  </h3>
                  <div className="space-y-4">
                     <div className="flex justify-between text-[8px] font-black text-white/40 uppercase tracking-widest px-1">
                        <span>Weak</span>
                        <span>Strong</span>
                        <span className="text-emerald-400">Extreme</span>
                     </div>
                     <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex ring-4 ring-white/5">
                        <div className="h-full bg-red-500 w-1/3 border-r-2 border-navy-950 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                        <div className="h-full bg-amber-500 w-1/3 border-r-2 border-navy-950"></div>
                        <div className="h-full bg-emerald-500 w-1/4 rounded-r-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                     </div>
                  </div>
                  <p className="text-[10px] font-bold text-white/60 uppercase leading-relaxed tracking-[0.1em]">
                     Current configuration provides <span className="text-emerald-400 font-black">Strong</span> protection against standard brute-force vectors and common dictionary attacks.
                  </p>
               </div>
            </div>
          </div>
        </div>

        {/* Floating Global Action Bar */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl px-8 z-40">
           <div className="bg-white/80 backdrop-blur-3xl border border-navy-100 p-6 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] flex flex-col sm:flex-row items-center justify-between gap-8 animate-in slide-in-from-bottom duration-1000">
              <div className="text-[10px] font-black text-navy-400 uppercase tracking-widest flex items-center gap-3">
                 <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                 Unsaved changes to global policy logic
              </div>
              <div className="flex items-center gap-6 w-full sm:w-auto">
                 <button className="flex-1 sm:flex-none px-10 py-4 bg-white border-2 border-navy-200 text-navy-700 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-navy-50 transition-all shadow-sm">Discard Changes</button>
                 <button className="flex-1 sm:flex-none px-12 py-4 bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
                    <span className="material-symbols-outlined text-lg">save</span> Commit Policy Hub
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordPolicy;
