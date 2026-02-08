
import React, { useState } from 'react';

const FaviconSEOAuditLog: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Assets' | 'SEO' | 'Technical'>('Assets');

  const auditLogs = [
    { id: 1, ts: 'Oct 24, 2023', hour: '10:00 AM', actor: 'Sarah Jenkins', role: 'Lead Designer', type: 'Favicon', detail: 'Uploaded new 32x32 favicon', asset: 'v2.4', status: 'Success' },
    { id: 2, ts: 'Oct 23, 2023', hour: '04:15 PM', actor: 'System Core', role: 'Automated Hub', type: 'SEO API', detail: 'Token Refresh (GSC)', asset: '****-AB89', status: 'Success' },
    { id: 3, ts: 'Oct 23, 2023', hour: '02:00 PM', actor: 'Mike Thompson', role: 'SEO Specialist', type: 'Sitemap', detail: 'Manual Resubmission', asset: 'XML Valid', status: 'Failed' },
  ];

  return (
    <div className="h-full flex flex-col font-display bg-navy-50/20 overflow-hidden">
      {/* Dynamic Header */}
      <header className="bg-white border-b border-navy-100 p-6 md:p-8 shrink-0 z-10 shadow-sm">
        <div className="max-w-[1600px] mx-auto w-full space-y-6">
          <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">
            <span>Home</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span>Admin Hub</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary">Branding & SEO Hub</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Branding & SEO Hub</h1>
              <p className="text-navy-500 font-medium italic text-sm md:text-lg opacity-80 uppercase tracking-widest">Master identity registry and search engine optimization orchestrator.</p>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-3 bg-white border-2 border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:bg-navy-50 transition-all shadow-sm">Discard Draft</button>
              <button className="px-8 py-3 bg-primary text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                <span className="material-symbols-outlined text-xl">publish</span> Commit to Production
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-10 pb-32">
        <div className="max-w-[1600px] mx-auto w-full grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
          
          {/* Main Configuration Surface */}
          <div className="xl:col-span-8 space-y-10">
            {/* Control Tabs */}
            <div className="flex bg-white p-1.5 rounded-[2rem] border border-navy-100 shadow-sm w-fit">
              {['Assets', 'SEO', 'Technical'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-10 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-navy-400 hover:bg-navy-50'
                  }`}
                >
                  {tab} Config
                </button>
              ))}
            </div>

            {activeTab === 'Assets' && (
              <div className="space-y-10 animate-in fade-in duration-500">
                {/* Branding Section */}
                <div className="bg-white rounded-[3.5rem] border border-navy-100 p-8 md:p-12 shadow-sm space-y-12">
                  <div className="flex items-center gap-4 border-b border-navy-50 pb-8">
                    <div className="size-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shadow-inner">
                      <span className="material-symbols-outlined text-2xl font-black">palette</span>
                    </div>
                    <h2 className="text-2xl font-black text-navy-950 uppercase tracking-tighter">Identity Assets</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-1">Global Favicon Registry</label>
                      <div className="p-10 bg-navy-50 border-4 border-dashed border-navy-100 rounded-[3rem] flex flex-col items-center justify-center text-center gap-6 hover:border-primary transition-all group cursor-pointer shadow-inner">
                        <div className="size-20 rounded-[1.5rem] bg-white text-primary flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-black text-navy-950 uppercase tracking-tight">Drop New Master Icon</p>
                          <p className="text-[10px] font-bold text-navy-300 uppercase tracking-widest leading-relaxed italic">System will auto-generate 16x, 32x, and 180x layers.</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-8">
                       <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-1">Active Visual Protocol</p>
                       <div className="bg-navy-950 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden">
                          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{backgroundImage: 'radial-gradient(#137fec 2px, transparent 2px)', backgroundSize: '30px 30px'}}></div>
                          <div className="flex items-center gap-6 relative z-10">
                             <div className="size-16 rounded-2xl bg-white p-3 flex items-center justify-center shadow-2xl">
                                <span className="material-symbols-outlined text-primary text-4xl font-black">airlines</span>
                             </div>
                             <div>
                                <p className="text-white font-black text-lg tracking-tight uppercase leading-none">Deltablue_Icon_v4</p>
                                <p className="text-primary font-black text-[9px] uppercase tracking-widest mt-2">Verified Production SHA-256</p>
                             </div>
                          </div>
                          <div className="flex gap-4 relative z-10">
                             <button className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Replace</button>
                             <button className="flex-1 py-3 bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">Download</button>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'SEO' && (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div className="bg-white rounded-[3.5rem] border border-navy-100 p-8 md:p-12 shadow-sm space-y-12">
                  <div className="flex items-center gap-4 border-b border-navy-50 pb-8">
                    <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                      <span className="material-symbols-outlined text-2xl font-black">travel_explore</span>
                    </div>
                    <h2 className="text-2xl font-black text-navy-950 uppercase tracking-tighter">Search Engine Logic</h2>
                  </div>

                  <div className="space-y-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-1">Master Meta Title Template</label>
                      <input className="w-full h-16 px-8 bg-navy-50 border-none rounded-[1.75rem] text-sm font-black text-navy-950 uppercase tracking-widest focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" defaultValue="{{page_title}} | Deltablue Jet Air Operations" />
                      <p className="text-[9px] font-bold text-navy-300 uppercase tracking-widest italic ml-4">Use {'{{page_title}}'} to dynamically inject the registry node's label.</p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-1">Global Meta Description</label>
                      <textarea className="w-full min-h-[120px] p-8 bg-navy-50 border-none rounded-[2.5rem] text-xs font-bold text-navy-700 leading-relaxed uppercase tracking-wider shadow-inner focus:ring-8 focus:ring-primary/5 transition-all resize-none" defaultValue="Book your global transit with Deltablue Jet Air. Precision aviation protocols, real-time fleet telemetry, and premium personnel services." />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[3.5rem] border border-navy-100 p-8 md:p-12 shadow-sm space-y-12">
                   <div className="flex items-center justify-between border-b border-navy-50 pb-8">
                      <h3 className="text-xl font-black text-navy-950 uppercase tracking-tighter">Social Graph Simulation</h3>
                      <span className="px-4 py-1 rounded-full bg-blue-50 text-primary text-[9px] font-black uppercase tracking-widest border border-blue-100">Live Preview</span>
                   </div>
                   <div className="flex flex-col lg:flex-row gap-12 items-center">
                      <div className="w-full lg:w-96 rounded-[2.5rem] border border-navy-100 overflow-hidden shadow-2xl group cursor-pointer hover:-translate-y-2 transition-all">
                         <div className="h-48 bg-navy-100 bg-cover bg-center transition-transform duration-[5s] group-hover:scale-110" style={{backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80')"}}></div>
                         <div className="p-6 space-y-3 bg-white">
                            <p className="text-[8px] font-black text-navy-300 uppercase tracking-[0.25em]">www.deltablue.to</p>
                            <h4 className="text-lg font-black text-navy-950 uppercase tracking-tight">Deltablue Jet Air | Precision In Flight</h4>
                            <p className="text-[10px] text-navy-500 font-bold leading-relaxed opacity-70">Experience the next generation of aviation management and booking flows.</p>
                         </div>
                      </div>
                      <div className="flex-1 space-y-8">
                         <div className="p-8 bg-navy-50 rounded-[2.5rem] border border-navy-100 shadow-inner space-y-6">
                            <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">OpenGraph Protocol Tags</p>
                            <div className="space-y-4">
                               {['og:title', 'og:description', 'og:image'].map(tag => (
                                 <div key={tag} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-1">
                                    <span className="text-navy-300 font-mono">{tag}</span>
                                    <span className="text-emerald-500 flex items-center gap-1"><span className="material-symbols-outlined text-sm">check_circle</span> ACTIVE</span>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'Technical' && (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="bg-white rounded-[3.5rem] border border-navy-100 p-10 shadow-sm space-y-8">
                      <h3 className="text-lg font-black text-navy-950 uppercase tracking-tighter border-b border-navy-50 pb-4">Robots.txt Protocol</h3>
                      <div className="p-6 bg-navy-950 rounded-[2rem] shadow-inner font-mono text-[10px] text-emerald-400 leading-relaxed group relative">
                         <code className="block whitespace-pre">
                            User-agent: *<br/>
                            Allow: /<br/>
                            Disallow: /admin/<br/>
                            Disallow: /api-hub/<br/><br/>
                            Sitemap: https://deltablue.to/sitemap.xml
                         </code>
                         <button className="absolute top-4 right-4 p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white transition-all"><span className="material-symbols-outlined text-sm">content_copy</span></button>
                      </div>
                      <button className="w-full py-4 bg-navy-50 border-2 border-navy-100 text-navy-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-primary hover:text-primary transition-all">Modify Robot Logic</button>
                   </div>
                   <div className="bg-white rounded-[3.5rem] border border-navy-100 p-10 shadow-sm space-y-8">
                      <h3 className="text-lg font-black text-navy-950 uppercase tracking-tighter border-b border-navy-50 pb-4">Search Console API</h3>
                      <div className="space-y-6">
                         {[
                           { name: 'Google Hub', status: 'Live Sync', col: 'text-emerald-600' },
                           { name: 'Bing Terminal', status: 'Syncing...', col: 'text-amber-600' },
                           { name: 'Baidu Node', status: 'Disconnected', col: 'text-red-500' }
                         ].map(node => (
                           <div key={node.name} className="flex items-center justify-between p-5 bg-navy-50/50 rounded-2xl border border-navy-50 shadow-inner group hover:bg-white transition-all">
                              <span className="text-xs font-black text-navy-900 uppercase tracking-widest">{node.name}</span>
                              <span className={`text-[9px] font-black uppercase tracking-widest ${node.col}`}>{node.status}</span>
                           </div>
                         ))}
                      </div>
                      <button className="w-full py-4 bg-primary/5 border border-primary/10 text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all">Initialise Master Sync</button>
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Quick Summary & Audit Log */}
          <div className="xl:col-span-4 space-y-10">
            {/* Real-time Status Card */}
            <div className="bg-navy-950 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-navy-950/20 group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-110 transition-transform duration-[10s]">
                <span className="material-symbols-outlined text-[160px] font-black">hub</span>
              </div>
              <div className="relative z-10 space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-primary/20 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                       <span className="material-symbols-outlined text-2xl font-black">sync</span>
                    </div>
                    <div>
                       <h4 className="text-xl font-black uppercase tracking-tight">Active Indexing</h4>
                       <p className="text-primary font-black text-[9px] uppercase tracking-widest mt-1">Registry is current</p>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between text-[9px] font-black text-white/40 uppercase tracking-widest">
                       <span>Logical Health</span>
                       <span className="text-emerald-400">98% OPTIMIZED</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex ring-4 ring-white/5">
                       <div className="h-full bg-primary w-[98%] shadow-[0_0_15px_rgba(19,127,236,0.5)]"></div>
                    </div>
                 </div>
                 <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Impressions (30d)</p>
                       <p className="text-2xl font-black tracking-tighter">1.2M</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Index Depth</p>
                       <p className="text-2xl font-black tracking-tighter">14,2k</p>
                    </div>
                 </div>
              </div>
            </div>

            {/* Compressed Audit Log */}
            <div className="bg-white rounded-[3rem] border border-navy-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-8 border-b border-navy-50 bg-navy-50/20 flex items-center justify-between">
                <h3 className="text-sm font-black text-navy-950 uppercase tracking-widest">Hub Activity Log</h3>
                <span className="text-[9px] font-black text-primary uppercase underline">Full Registry</span>
              </div>
              <div className="divide-y divide-navy-50">
                 {auditLogs.map(log => (
                    <div key={log.id} className="p-6 hover:bg-navy-50/30 transition-all cursor-default group">
                       <div className="flex justify-between items-start mb-2">
                          <span className="text-[9px] font-black text-navy-400 uppercase tracking-widest">{log.ts} • {log.hour}</span>
                          <span className={`size-1.5 rounded-full ${log.status === 'Success' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
                       </div>
                       <p className="text-[10px] font-black text-navy-900 uppercase tracking-tight group-hover:text-primary transition-colors">{log.detail}</p>
                       <div className="flex items-center gap-3 mt-3">
                          <div className="size-6 rounded-lg bg-navy-50 border border-navy-100 flex items-center justify-center font-black text-[8px] text-navy-300 uppercase shadow-inner">SJ</div>
                          <span className="text-[8px] font-bold text-navy-300 uppercase tracking-widest">{log.actor}</span>
                       </div>
                    </div>
                 ))}
              </div>
              <div className="p-6 bg-navy-50/30 border-t border-navy-50">
                 <button className="w-full py-3 bg-white border border-navy-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-navy-400 hover:text-navy-900 shadow-sm transition-all">Access Historical Master Logs</button>
              </div>
            </div>

            {/* Technical Notice */}
            <div className="bg-blue-50/60 p-8 rounded-[2.5rem] border-2 border-blue-100 flex gap-6 items-start shadow-inner group">
               <span className="material-symbols-outlined text-primary p-3 bg-white rounded-2xl shadow-md font-black group-hover:scale-110 transition-transform">info</span>
               <div className="space-y-2">
                  <p className="text-sm font-black text-navy-950 uppercase tracking-tight leading-none">Registry Notice</p>
                  <p className="text-[10px] font-bold text-blue-900 uppercase leading-relaxed tracking-wider opacity-70 italic">SEO changes affect global index logic. Expect 24-48 hours for node propagation across search terminals.</p>
               </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default FaviconSEOAuditLog;
