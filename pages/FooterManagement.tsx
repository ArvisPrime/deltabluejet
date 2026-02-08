
import React from 'react';

const FooterManagement: React.FC = () => {
  return (
    <div className="h-full flex flex-col font-display bg-navy-50/20 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-navy-100 p-8 shrink-0 z-10 shadow-sm">
        <div className="max-w-[1600px] mx-auto w-full space-y-6">
           <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300 px-1">
              <span>Admin Terminal</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span>Content Orchestration</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-primary">Global Footer Engine</span>
           </nav>
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                 <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Global Footer Hub</h1>
                 <p className="text-navy-500 font-medium italic text-lg opacity-80 uppercase tracking-widest">Customize the navigation logic, social trusts, and regulatory footers for the Deltablue ecosystem.</p>
              </div>
              <div className="flex gap-4">
                 <button className="px-10 py-4 bg-white border-2 border-navy-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:bg-navy-50 transition-all shadow-sm">Cache Draft</button>
                 <button className="px-12 py-4 bg-primary text-white rounded-[1.75rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
                    <span className="material-symbols-outlined text-xl">publish</span> Commit to Global Production
                 </button>
              </div>
           </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-10 pb-32">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 max-w-[1600px] mx-auto items-start">
          
          {/* Editor Column */}
          <div className="xl:col-span-7 space-y-10">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight">Logical Configuration</h3>
              <span className="text-[10px] font-black text-navy-300 uppercase tracking-widest">Master Integrity: 100% Sync</span>
            </div>

            <div className="space-y-6">
              {/* Column 1 */}
              <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-sm overflow-hidden group transition-all hover:shadow-xl">
                 <div className="p-8 px-10 flex items-center justify-between bg-navy-50/20 border-b border-navy-50 cursor-pointer">
                    <div className="flex items-center gap-6">
                       <div className="size-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shadow-inner">
                          <span className="material-symbols-outlined text-2xl font-black">view_column</span>
                       </div>
                       <div className="space-y-1">
                          <p className="text-lg font-black text-navy-950 uppercase tracking-tight">Logical Column 1: Core Identity</p>
                          <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">About, Careers, Press, and Sustainability nodes</p>
                       </div>
                    </div>
                    <span className="material-symbols-outlined text-navy-200 group-hover:text-primary transition-all">expand_more</span>
                 </div>
                 <div className="p-10 px-12 space-y-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest px-2 block">Protocol Heading</label>
                       <input className="w-full h-14 px-8 bg-navy-50 border-none rounded-2xl text-sm font-black text-navy-950 uppercase tracking-widest focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" defaultValue="Company Hub" />
                    </div>
                    
                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest px-2 mb-4">Node Hierarchy</p>
                       {[
                         { label: 'Personnel Registry', url: '/about-us' },
                         { label: 'Ops Careers', url: '/careers' }
                       ].map((link, i) => (
                         <div key={i} className="flex gap-4 items-center p-5 rounded-[2rem] bg-navy-50/30 border-2 border-transparent hover:border-navy-100 transition-all group/item shadow-inner">
                            <button className="cursor-grab text-navy-100 hover:text-primary transition-colors"><span className="material-symbols-outlined font-black">drag_indicator</span></button>
                            <div className="flex-1 grid grid-cols-2 gap-6 px-2">
                               <input className="bg-transparent border-none p-0 text-sm font-black text-navy-950 uppercase tracking-tight focus:ring-0" defaultValue={link.label} />
                               <input className="bg-transparent border-none p-0 text-[11px] font-mono font-bold text-navy-300 focus:ring-0" defaultValue={link.url} />
                            </div>
                            <button className="p-2 text-navy-100 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button>
                         </div>
                       ))}
                       <button className="w-full py-5 border-2 border-dashed border-navy-100 rounded-[2rem] text-navy-300 font-black uppercase text-[10px] tracking-widest hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-3">
                          <span className="material-symbols-outlined">add_circle</span>
                          Initialize New Hub Link
                       </button>
                    </div>
                 </div>
              </div>

              {/* Social Media */}
              <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-sm overflow-hidden group transition-all hover:shadow-xl">
                 <div className="p-8 px-10 flex items-center justify-between bg-navy-50/20 border-b border-navy-50 cursor-pointer">
                    <div className="flex items-center gap-6">
                       <div className="size-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                          <span className="material-symbols-outlined text-2xl font-black">share</span>
                       </div>
                       <div className="space-y-1">
                          <p className="text-lg font-black text-navy-950 uppercase tracking-tight">Social Trust Cluster</p>
                          <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">Global social profiles and icon protocol</p>
                       </div>
                    </div>
                    <span className="material-symbols-outlined text-navy-200 group-hover:text-primary transition-all">expand_more</span>
                 </div>
                 <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-10">
                    {['FACEBOOK', 'TWITTER / X', 'INSTAGRAM', 'LINKEDIN'].map((p, i) => (
                      <div key={i} className="space-y-3">
                         <label className="text-[9px] font-black text-navy-300 uppercase tracking-[0.3em] block px-2">{p} PROTOCOL</label>
                         <div className="flex bg-navy-50 rounded-2xl border-none shadow-inner group-focus-within:ring-8 group-focus-within:ring-primary/5 transition-all overflow-hidden h-14">
                            <span className="flex items-center px-5 bg-navy-100/50 text-navy-400"><span className="material-symbols-outlined text-xl">link</span></span>
                            <input className="flex-1 bg-transparent border-none text-[11px] font-mono font-bold text-navy-900 focus:ring-0 placeholder:text-navy-100" placeholder={`${p.toLowerCase()}.com/deltablue`} />
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Legal */}
              <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-sm overflow-hidden group transition-all hover:shadow-xl">
                 <div className="p-8 px-10 flex items-center justify-between bg-navy-50/20 border-b border-navy-50 cursor-pointer">
                    <div className="flex items-center gap-6">
                       <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                          <span className="material-symbols-outlined text-2xl font-black">gavel</span>
                       </div>
                       <div className="space-y-1">
                          <p className="text-lg font-black text-navy-950 uppercase tracking-tight">Regulatory & Copyright Node</p>
                          <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">Legal disclaimers, PII policies, and payment icons</p>
                       </div>
                    </div>
                    <span className="material-symbols-outlined text-navy-200 group-hover:text-primary transition-all">expand_more</span>
                 </div>
                 <div className="p-12 space-y-10">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-2">Global Copyright Ledger</label>
                       <textarea className="w-full min-h-[120px] p-8 bg-navy-50 border-none rounded-[2.5rem] text-xs font-bold text-navy-700 leading-relaxed uppercase tracking-wider shadow-inner focus:ring-8 focus:ring-primary/5 transition-all resize-none" defaultValue="© 2024 Deltablue Jet Air. All rights reserved. Use of this station indicates compliance with our Privacy Policy and Master Terms of Carriage." />
                    </div>
                    <div className="flex items-center justify-between p-8 bg-navy-50/50 rounded-[2.5rem] border-2 border-navy-50 shadow-inner">
                       <div className="space-y-1">
                          <p className="text-sm font-black text-navy-950 uppercase tracking-tight leading-none">Authorization Icons</p>
                          <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest italic opacity-60">Display Visa, Mastercard, AMEX nodes in footer baseline.</p>
                       </div>
                       <div className="relative inline-flex items-center h-8 rounded-full w-16 transition-all shadow-md">
                          <input checked readOnly type="checkbox" className="sr-only peer" />
                          <div className="w-16 h-8 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-lg"></div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white rounded-[3rem] border border-navy-100 p-8 shadow-sm group hover:shadow-xl transition-all flex flex-col gap-8">
                  <div className="flex items-center gap-6">
                     <div className="size-12 rounded-[1.25rem] bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-2xl font-black">history</span>
                     </div>
                     <div>
                        <h4 className="text-sm font-black text-navy-950 uppercase tracking-widest">Global Audit Log</h4>
                        <p className="text-[9px] font-bold text-navy-300 uppercase tracking-widest mt-1 opacity-60 italic">Review chronological modifications.</p>
                     </div>
                  </div>
                  <button className="mt-auto w-full py-4 bg-navy-50 text-navy-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-navy-950 hover:text-white transition-all shadow-sm">Access Master Audit Registry</button>
               </div>
               
               <div className="bg-indigo-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden group cursor-pointer">
                  <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-[10s]">
                     <span className="material-symbols-outlined text-[160px] font-black">preview</span>
                  </div>
                  <div className="relative z-10 space-y-6">
                     <div className="size-12 rounded-[1.25rem] bg-white/10 flex items-center justify-center text-white shadow-xl border border-white/5">
                        <span className="material-symbols-outlined text-2xl font-black">devices</span>
                     </div>
                     <div>
                        <h4 className="text-xl font-black uppercase tracking-tight">Full Responsive Triage</h4>
                        <p className="text-[10px] font-bold text-indigo-200/60 uppercase tracking-widest mt-2 leading-relaxed">Simulate the footer layout across 14 master breakpoints before publishing.</p>
                     </div>
                     <button className="w-full py-4 bg-white text-indigo-900 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">Initialise Triage Mode</button>
                  </div>
               </div>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="xl:col-span-5 space-y-8 sticky top-10">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight">Station Preview</h3>
               <div className="flex bg-white rounded-2xl p-1.5 border border-navy-100 shadow-sm">
                  <button className="px-5 py-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 transition-all"><span className="material-symbols-outlined text-lg">desktop_windows</span></button>
                  <button className="px-5 py-2.5 text-navy-300 hover:text-primary transition-all"><span className="material-symbols-outlined text-lg">smartphone</span></button>
               </div>
            </div>

            <div className="w-full rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] border-4 border-white bg-navy-950 ring-1 ring-navy-100">
               {/* Browser UI */}
               <div className="bg-navy-900 h-10 flex items-center gap-2.5 px-8 border-b border-white/5">
                  <div className="size-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                  <div className="size-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                  <div className="size-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                  <div className="ml-6 flex-1 h-5 bg-white/5 rounded-lg text-[8px] flex items-center px-4 font-black uppercase text-white/20 tracking-widest border border-white/5">deltablue.to/hub/preview-v2</div>
               </div>

               {/* Rendered Footer */}
               <div className="p-16 flex flex-col justify-end min-h-[500px] relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "radial-gradient(#137fec 2px, transparent 2px)", backgroundSize: "40px 40px" }}></div>
                  
                  <div className="grid grid-cols-2 gap-16 relative z-10 mb-20">
                     <div className="space-y-6">
                        <h4 className="text-xs font-black text-white uppercase tracking-[0.25em] border-b border-white/10 pb-4">Company Hub</h4>
                        <ul className="space-y-3">
                           {['Personnel Registry', 'Ops Careers', 'Hub Press', 'Sustainability Matrix'].map(l => (
                             <li key={l} className="text-xs font-bold text-white/40 uppercase tracking-widest hover:text-primary transition-colors cursor-pointer">{l}</li>
                           ))}
                        </ul>
                     </div>
                     <div className="space-y-6">
                        <h4 className="text-xs font-black text-white uppercase tracking-[0.25em] border-b border-white/10 pb-4">Support Ops</h4>
                        <ul className="space-y-3">
                           {['Dispatch Hub', 'Logistics Link', 'Baggage Telemetry', 'Accessible Nodes'].map(l => (
                             <li key={l} className="text-xs font-bold text-white/40 uppercase tracking-widest hover:text-primary transition-colors cursor-pointer">{l}</li>
                           ))}
                        </ul>
                     </div>
                  </div>

                  <div className="h-px w-full bg-white/5 relative z-10 mb-10"></div>

                  <div className="flex flex-col gap-10 relative z-10">
                     <div className="flex items-center gap-6">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="size-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:bg-primary hover:text-white hover:border-primary transition-all cursor-pointer">
                             <span className="material-symbols-outlined text-lg">public</span>
                          </div>
                        ))}
                     </div>
                     <div className="space-y-6">
                        <p className="text-[10px] font-bold text-white/20 leading-relaxed uppercase tracking-widest">© 2024 Deltablue Jet Air. All rights reserved. Use of this station indicates compliance with our Privacy Policy and Master Terms of Carriage.</p>
                        <div className="flex flex-wrap gap-8">
                           {['Privacy Registry', 'Service Protocols', 'Audit Control'].map(l => (
                             <span key={l} className="text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors cursor-pointer">{l}</span>
                           ))}
                        </div>
                     </div>
                     <div className="flex gap-4 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700">
                        <div className="h-7 w-12 bg-white/10 rounded-xl border border-white/10"></div>
                        <div className="h-7 w-12 bg-white/10 rounded-xl border border-white/10"></div>
                        <div className="h-7 w-12 bg-white/10 rounded-xl border border-white/10"></div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-blue-50/60 p-8 rounded-[3rem] border-2 border-blue-100 flex gap-6 items-start shadow-inner group">
               <span className="material-symbols-outlined text-primary p-3 bg-white rounded-2xl shadow-md font-black group-hover:scale-110 transition-transform">tips_and_updates</span>
               <div className="space-y-2">
                  <p className="text-sm font-black text-navy-950 uppercase tracking-tight">Personnel Log Sync</p>
                  <p className="text-[10px] font-bold text-blue-900 uppercase leading-relaxed tracking-wider opacity-70 italic">Logic changes staged here are held in the local buffer. Final commit to global production requires 2FA personnel authorization sequence.</p>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FooterManagement;
