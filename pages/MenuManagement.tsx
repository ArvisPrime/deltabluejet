
import React, { useState } from 'react';

const MenuManagement: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState('Book a Flight');

  const menuItems = [
    { label: 'Home Hub', path: '/', status: 'Active', depth: 0 },
    { label: 'Book a Flight', path: '/book', status: 'Active', depth: 0, active: true },
    { label: 'Personnel Trips', path: '/my-trips', status: 'Active', depth: 0 },
    { label: 'Operational Info', type: 'Dropdown Hub', status: 'Active', depth: 0 },
    { label: 'Logistics Matrix', path: '/info/baggage', status: 'Hidden', depth: 1 },
    { label: 'Station Check-in', path: '/check-in', status: 'Active', depth: 1 },
  ];

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar font-display bg-navy-50/30">
      <div className="max-w-[1600px] mx-auto w-full space-y-10 animate-in fade-in duration-500 pb-24">
        
        {/* Header */}
        <div className="space-y-6">
           <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300 px-1">
              <span>Ops Control Hub</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span>Identity Management</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-primary">Master Menu Flow</span>
           </nav>
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-navy-100 pb-8">
             <div className="max-w-2xl space-y-3">
                <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Global Navigation Hub</h1>
                <p className="text-navy-500 font-medium italic text-lg leading-relaxed uppercase tracking-wider opacity-80">Orchestrate the logical hierarchy and authorization tiers of the primary Deltablue Jet Air terminals.</p>
             </div>
             <div className="flex gap-4">
                <button className="px-10 py-4 bg-white border-2 border-navy-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:bg-navy-50 transition-all shadow-sm">Reset Cache</button>
                <button className="px-12 py-4 bg-primary text-white rounded-[1.75rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">Finalise Sequence Commit</button>
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
           
           {/* Left Column: Tree Visualizer */}
           <div className="lg:col-span-5 space-y-8">
              <div className="flex items-center justify-between px-4">
                 <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight">Active Node Registry</h3>
                 <button className="text-[10px] font-black text-primary uppercase underline tracking-widest decoration-2 underline-offset-4">Expand All Logic Layers</button>
              </div>

              <div className="bg-white rounded-[3.5rem] border border-navy-100 p-6 shadow-sm flex flex-col space-y-2 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-navy-950 group-hover:scale-110 transition-transform duration-[10s]"><span className="material-symbols-outlined text-[140px] font-black">account_tree</span></div>
                 
                 {menuItems.map((item, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedItem(item.label)}
                      className={`flex items-center gap-5 p-5 rounded-[2rem] border-2 transition-all cursor-pointer group relative ${
                        selectedItem === item.label ? 'bg-primary/5 border-primary shadow-xl shadow-primary/5' : 'bg-white border-transparent hover:bg-navy-50'
                      } ${item.depth > 0 ? 'ml-12' : ''}`}
                    >
                       {item.depth > 0 && (
                          <div className="absolute -left-10 top-1/2 w-10 h-0.5 bg-navy-100 group-hover:bg-primary transition-colors"></div>
                       )}
                       <span className={`material-symbols-outlined transition-colors ${selectedItem === item.label ? 'text-primary' : 'text-navy-100 group-hover:text-navy-400'}`}>drag_indicator</span>
                       <div className="flex-1 space-y-1">
                          <p className={`text-sm font-black uppercase tracking-tight ${selectedItem === item.label ? 'text-primary' : 'text-navy-950'}`}>{item.label}</p>
                          <p className="text-[9px] font-bold text-navy-300 uppercase tracking-widest opacity-60 italic">{item.type || 'Internal Route'}: <span className="font-mono text-navy-200">{item.path || 'Hub Registry'}</span></p>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm ${
                            item.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-navy-50 text-navy-400 border-navy-100'
                          }`}>{item.status}</span>
                          <span className={`material-symbols-outlined text-sm ${selectedItem === item.label ? 'text-primary' : 'text-navy-200 opacity-0 group-hover:opacity-100'}`}>edit</span>
                       </div>
                    </div>
                 ))}

                 <button className="mt-8 w-full py-5 border-2 border-dashed border-navy-100 rounded-[2.5rem] text-navy-300 font-black uppercase text-[10px] tracking-widest hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined">add_circle</span>
                    Initialize New Navigation Node
                 </button>
              </div>
           </div>

           {/* Right Column: Item Editor */}
           <div className="lg:col-span-7">
              <div className="sticky top-10 space-y-8">
                 <div className="bg-white rounded-[4rem] border border-navy-100 shadow-2xl overflow-hidden flex flex-col group">
                    <div className="p-10 border-b border-navy-50 bg-navy-50/30 flex justify-between items-center px-12">
                       <div className="space-y-1">
                          <h3 className="text-2xl font-black text-navy-950 uppercase tracking-tighter">Modify Node Protocol</h3>
                          <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest italic opacity-60 leading-none">Personnel Terminal Link: "{selectedItem}"</p>
                       </div>
                       <span className="px-5 py-2 rounded-xl bg-primary text-white text-[9px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">Executive Tier</span>
                    </div>

                    <div className="p-12 px-14 space-y-12">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-2">Interface Label Node</label>
                          <input className="w-full h-16 px-8 bg-navy-50 border-none rounded-[1.75rem] text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" defaultValue={selectedItem} />
                          <p className="text-[9px] font-bold text-navy-300 uppercase italic ml-4 leading-relaxed">Public-facing descriptor rendered in the master station navigation system.</p>
                       </div>

                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-2">Link Handshake Logic</label>
                          <div className="flex bg-navy-50 p-1.5 rounded-[1.75rem] shadow-inner border border-navy-100 w-fit">
                             {['Internal Hub', 'External Station', 'Protocol Group'].map((t, i) => (
                                <button key={i} className={`px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${i === 0 ? 'bg-white text-navy-950 shadow-md border border-navy-100' : 'text-navy-400 hover:text-navy-700'}`}>{t}</button>
                             ))}
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-2">Registry Route Path</label>
                             <div className="relative group">
                                <select className="w-full h-16 px-8 bg-navy-50 border-none rounded-[1.75rem] text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 appearance-none shadow-inner transition-all">
                                   <option>/book (Registry Hub)</option>
                                   <option>/checkin (Personnel Manifest)</option>
                                   <option>/status (Real-time Telemetry)</option>
                                   <option>/deals (Fleet Promos)</option>
                                </select>
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-navy-200 material-symbols-outlined font-black pointer-events-none group-focus-within:text-primary transition-colors">expand_more</span>
                             </div>
                          </div>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-2">Visual Protocol Node (Icon)</label>
                             <div className="relative group">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined font-black transition-transform group-focus-within:scale-110">flight_takeoff</span>
                                <input className="w-full h-16 pl-16 pr-6 bg-navy-50 border-none rounded-[1.75rem] text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 shadow-inner transition-all" defaultValue="flight_takeoff" />
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-navy-50 pt-10">
                          <div className="flex items-center justify-between p-8 bg-navy-50/50 rounded-[2.5rem] border border-navy-50 shadow-inner group/toggle">
                             <div className="space-y-1">
                                <p className="text-[10px] font-black text-navy-950 uppercase tracking-tight leading-none">Logical Visibility</p>
                                <p className="text-[8px] font-bold text-navy-300 uppercase tracking-widest mt-2 leading-relaxed italic">Render this node in the primary terminal UI.</p>
                             </div>
                             <div className="relative inline-flex items-center h-8 rounded-full w-16 transition-all shadow-md">
                                <input checked readOnly type="checkbox" className="sr-only peer" />
                                <div className="w-16 h-8 bg-navy-200 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-lg"></div>
                             </div>
                          </div>
                          <div className="flex items-center justify-between p-8 bg-navy-50/50 rounded-[2.5rem] border border-navy-100 shadow-inner group/toggle">
                             <div className="space-y-1">
                                <p className="text-[10px] font-black text-navy-950 uppercase tracking-tight leading-none">New Window Spawn</p>
                                <p className="text-[8px] font-bold text-navy-300 uppercase tracking-widest mt-2 leading-relaxed italic">Force a separate personnel instance.</p>
                             </div>
                             <div className="relative inline-flex items-center h-8 rounded-full w-16 transition-all shadow-md">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-16 h-8 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-lg"></div>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-8 pt-4">
                          <h4 className="text-[10px] font-black text-navy-300 uppercase tracking-[0.3em] px-4 border-l-2 border-navy-50">Clearance Authorization (RBAC)</h4>
                          <div className="flex flex-wrap gap-10 px-4">
                             {['Public Everybody', 'Personnel Sync Only', 'Executive Tier (GS+)'].map((lbl, i) => (
                                <label key={i} className="flex items-center gap-5 cursor-pointer group/ch">
                                   <div className="relative flex items-center">
                                      <input type="checkbox" defaultChecked={i === 0} className="peer h-7 w-7 appearance-none rounded-xl border-2 border-navy-100 checked:bg-primary checked:border-primary transition-all shadow-sm" />
                                      <span className="material-symbols-outlined text-white text-sm absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-all font-black">check</span>
                                   </div>
                                   <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest group-hover/ch:text-navy-950 transition-all">{lbl}</span>
                                </label>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="p-10 border-t border-navy-50 bg-navy-50/10 flex flex-col sm:flex-row items-center justify-between px-16 gap-8">
                       <button className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-red-50 px-8 py-4 rounded-2xl transition-all shadow-sm">
                          <span className="material-symbols-outlined text-xl">delete_forever</span>
                          Purge Logical Node
                       </button>
                       <button className="px-14 py-5 bg-navy-950 text-white text-[10px] font-black uppercase tracking-[0.25em] rounded-[1.5rem] shadow-[0_20px_40px_-10px_rgba(16,25,34,0.4)] hover:scale-105 active:scale-95 transition-all">Finalise Logical Changes</button>
                    </div>
                 </div>

                 <div className="bg-primary/5 rounded-[3.5rem] p-10 border border-primary/20 flex gap-8 items-start shadow-inner relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                       <span className="material-symbols-outlined text-[100px] font-black">tips_and_updates</span>
                    </div>
                    <span className="material-symbols-outlined text-primary p-4 bg-white rounded-2xl shadow-md font-black group-hover:rotate-12 transition-transform">info</span>
                    <div className="space-y-3 relative z-10">
                       <p className="text-sm font-black text-navy-950 uppercase tracking-tight leading-none">Security Registry Notice</p>
                       <p className="text-[10px] font-bold text-navy-500 uppercase tracking-widest opacity-70 leading-relaxed italic">Changes applied to individual nodes are held in the local personnel session buffer. You must commit to the global registry hub to publish front-end updates to the DeltaBlue ecosystem.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MenuManagement;
