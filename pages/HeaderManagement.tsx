
import React, { useState } from 'react';

const HeaderManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Navigation');
  const [selectedItem, setSelectedItem] = useState('Book');

  const menuItems = [
    { label: 'Book', path: '/book', type: 'Mega Menu', id: 'nav_01' },
    { label: 'Check-in', path: '/check-in', type: 'Standard', id: 'nav_02' },
    { label: 'My Trips', path: '/manage-booking', type: 'Standard', id: 'nav_03' },
    { label: 'Flight Status', path: 'https://status.deltablue.to', type: 'External', id: 'nav_04' },
  ];

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
              <span className="text-primary">Master Header Hub</span>
           </nav>
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                 <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Header Management</h1>
                 <p className="text-navy-500 font-medium italic text-lg opacity-80 uppercase tracking-widest max-w-3xl">Customize the global navigation logic, branding elements, and primary utility nodes for the Deltablue ecosystem.</p>
              </div>
              <div className="flex gap-4">
                 <button className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-navy-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:text-primary transition-all shadow-sm group">
                    <span className="material-symbols-outlined text-xl text-navy-300 group-hover:text-primary">history</span> Audit Registry
                 </button>
                 <button className="px-10 py-4 bg-primary text-white rounded-[1.75rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
                    <span className="material-symbols-outlined text-xl">save</span> Commit Changes
                 </button>
              </div>
           </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-10 pb-32">
        <div className="max-w-[1600px] mx-auto w-full space-y-12">
          
          {/* Live Preview Section */}
          <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-sm overflow-hidden group transition-all hover:shadow-xl">
             <div className="p-8 px-10 flex items-center justify-between bg-navy-50/20 border-b border-navy-50 cursor-pointer">
                <div className="flex items-center gap-6">
                   <div className="size-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shadow-inner">
                      <span className="material-symbols-outlined text-2xl font-black">preview</span>
                   </div>
                   <div className="space-y-1">
                      <p className="text-lg font-black text-navy-950 uppercase tracking-tight">Active Station Preview</p>
                      <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">Simulating master node rendered at 1440px viewport</p>
                   </div>
                </div>
                <div className="flex bg-white rounded-2xl p-1.5 border border-navy-100 shadow-sm">
                   <button className="px-5 py-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 transition-all"><span className="material-symbols-outlined text-lg">desktop_windows</span></button>
                   <button className="px-5 py-2.5 text-navy-300 hover:text-primary transition-all"><span className="material-symbols-outlined text-lg">smartphone</span></button>
                </div>
             </div>

             {/* Browser Mock */}
             <div className="p-12 bg-navy-50/10">
                <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-navy-100 bg-white">
                   <div className="bg-navy-900 h-10 flex items-center gap-2.5 px-8 border-b border-white/5">
                      <div className="size-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                      <div className="size-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                      <div className="size-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                      <div className="ml-6 flex-1 h-5 bg-white/5 rounded-lg text-[8px] flex items-center px-4 font-black uppercase text-white/20 tracking-widest border border-white/5">deltablue.to/hub/preview-mode</div>
                   </div>
                   
                   {/* Rendered Header */}
                   <div className="px-10 py-6 flex items-center justify-between border-b-4 border-primary">
                      <div className="flex items-center gap-12">
                         <div className="flex items-center gap-3 font-black text-2xl tracking-tighter text-navy-950 uppercase">
                            <div className="size-9 bg-primary rounded-tr-xl rounded-bl-xl shadow-lg shadow-primary/20" />
                            Deltablue<span className="text-primary">Air</span>
                         </div>
                         <nav className="hidden xl:flex items-center gap-8">
                            {menuItems.map(item => (
                              <button key={item.label} className={`text-xs font-black uppercase tracking-widest transition-all pb-1 border-b-2 ${item.label === 'Book' ? 'text-primary border-primary' : 'text-navy-400 border-transparent hover:text-navy-900'}`}>{item.label}</button>
                            ))}
                         </nav>
                      </div>
                      <div className="flex items-center gap-6">
                         <div className="flex items-center gap-2 text-[10px] font-black text-navy-400 uppercase tracking-widest cursor-pointer hover:text-navy-950 transition-colors">
                            <span className="material-symbols-outlined text-lg">public</span>
                            EN / USD
                            <span className="material-symbols-outlined text-sm">expand_more</span>
                         </div>
                         <div className="h-6 w-px bg-navy-100" />
                         <button className="text-navy-400 hover:text-primary transition-all"><span className="material-symbols-outlined text-xl">search</span></button>
                         <button className="flex items-center gap-2 text-[10px] font-black text-navy-700 uppercase tracking-widest hover:text-primary transition-all">
                            <span className="material-symbols-outlined text-xl">account_circle</span>
                            Login
                         </button>
                         <button className="bg-primary text-white text-[9px] font-black px-6 py-3 rounded-full uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">Join Club</button>
                      </div>
                   </div>

                   {/* Dummy Content Area */}
                   <div className="h-96 bg-navy-50/20 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#137fec 2px, transparent 2px)', backgroundSize: '40px 40px' }}></div>
                      <div className="text-center space-y-4 relative z-10">
                         <h4 className="text-5xl font-black text-navy-950 uppercase tracking-tighter opacity-10">Operational Surface</h4>
                         <p className="text-xs font-bold text-navy-300 uppercase tracking-[0.4em]">Content Node Placeholder</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Configurator Section */}
          <div className="bg-white rounded-[4rem] border border-navy-100 shadow-sm overflow-hidden flex flex-col">
             <div className="border-b border-navy-50 px-10 bg-navy-50/10">
                <div className="flex gap-12 overflow-x-auto no-scrollbar">
                   {['Branding', 'Navigation', 'Utilities', 'CTA Button'].map(tab => (
                     <button 
                       key={tab} 
                       onClick={() => setActiveTab(tab)}
                       className={`py-8 text-[11px] font-black uppercase tracking-[0.25em] transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-primary' : 'text-navy-300 hover:text-navy-950'}`}
                     >
                        {tab}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary rounded-t-full shadow-[0_0_12px_rgba(19,127,236,0.6)]" />}
                     </button>
                   ))}
                </div>
             </div>

             <div className="flex flex-col lg:flex-row flex-1">
                {/* Left: Structure Tree */}
                <div className="flex-1 p-12 border-r border-navy-50 space-y-10">
                   <div className="flex justify-between items-center px-2">
                      <h3 className="text-sm font-black text-navy-950 uppercase tracking-[0.25em] flex items-center gap-3">
                         <span className="material-symbols-outlined text-primary">segment</span>
                         Sequence Logic Tree
                      </h3>
                      <button className="px-6 py-2.5 rounded-xl border-2 border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-all shadow-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">add</span> Add New Node
                      </button>
                   </div>

                   <div className="space-y-4">
                      {menuItems.map((item) => (
                        <div 
                          key={item.label} 
                          onClick={() => setSelectedItem(item.label)}
                          className={`flex items-center gap-6 p-6 rounded-[2rem] border-2 transition-all cursor-pointer relative overflow-hidden group ${
                            selectedItem === item.label ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5' : 'border-transparent bg-navy-50/30 hover:bg-navy-50'
                          }`}
                        >
                           {selectedItem === item.label && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />}
                           <span className={`material-symbols-outlined transition-colors ${selectedItem === item.label ? 'text-primary' : 'text-navy-100 group-hover:text-navy-300'} cursor-grab active:cursor-grabbing`}>drag_indicator</span>
                           <div className="flex-1 space-y-1">
                              <p className={`text-base font-black uppercase tracking-tight ${selectedItem === item.label ? 'text-primary' : 'text-navy-950'}`}>{item.label}</p>
                              <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest opacity-60 italic">{item.path} • {item.type}</p>
                           </div>
                           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button className="size-9 rounded-xl bg-white border border-navy-100 flex items-center justify-center text-navy-400 hover:text-primary transition-all shadow-sm"><span className="material-symbols-outlined text-lg">edit</span></button>
                              <button className="size-9 rounded-xl bg-white border border-navy-100 flex items-center justify-center text-navy-400 hover:text-red-500 transition-all shadow-sm"><span className="material-symbols-outlined text-lg">delete</span></button>
                           </div>
                        </div>
                      ))}
                   </div>

                   <div className="p-8 rounded-[2.5rem] border-2 border-dashed border-navy-100 flex flex-col items-center justify-center text-center gap-4 bg-navy-50/10 group cursor-pointer hover:border-primary/40 transition-all">
                      <span className="material-symbols-outlined text-4xl text-navy-100 group-hover:text-primary/30 transition-all">playlist_add</span>
                      <p className="text-[10px] font-black text-navy-300 uppercase tracking-[0.3em]">Drag nodes to reorder the master sequence.</p>
                   </div>
                </div>

                {/* Right: Item Editor */}
                <div className="w-full lg:w-[480px] bg-navy-50/40 p-12 space-y-10 flex flex-col shadow-inner">
                   <div className="flex items-center justify-between pb-8 border-b border-navy-100">
                      <div className="space-y-1">
                         <h4 className="text-xl font-black text-navy-950 uppercase tracking-tighter">Edit Node Schema</h4>
                         <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest italic opacity-60">ID Node: nav_01 • Protocol: SAML-v2</p>
                      </div>
                      <span className="px-3 py-1 rounded bg-white text-navy-300 font-mono text-[9px] font-bold uppercase border border-navy-50">#882-XJ</span>
                   </div>

                   <form className="space-y-10">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Navigation Label Node</label>
                         <input className="w-full h-14 px-8 bg-white border-none rounded-[1.5rem] text-sm font-black text-navy-950 uppercase tracking-widest focus:ring-8 focus:ring-primary/5 transition-all shadow-sm" defaultValue={selectedItem} />
                      </div>

                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Logical Link Protocol</label>
                         <div className="flex bg-navy-50 p-1.5 rounded-2xl shadow-inner border border-navy-100 w-fit">
                            {['Internal Hub', 'External Station'].map((t, i) => (
                              <button key={t} type="button" className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${i === 0 ? 'bg-white text-navy-950 shadow-md border border-navy-100' : 'text-navy-400 hover:text-navy-950'}`}>{t}</button>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Registry Destination Path</label>
                         <div className="relative group">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined font-black">link</span>
                            <input className="w-full h-14 pl-14 pr-6 bg-white border-none rounded-[1.5rem] text-sm font-black text-navy-900 focus:ring-8 focus:ring-primary/5 transition-all shadow-sm" defaultValue="/book" />
                         </div>
                         <p className="text-[9px] font-bold text-navy-300 uppercase italic ml-2">The relative endpoint for the operational page (e.g. /registry/about)</p>
                      </div>

                      <div className="space-y-6 pt-6 border-t border-navy-100">
                         <div className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-navy-50 shadow-sm group/toggle">
                            <div className="space-y-1">
                               <p className="text-sm font-black text-navy-950 uppercase tracking-tight leading-none transition-colors group-hover/toggle:text-primary">Enable Mega Hub Dropdown</p>
                               <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest italic opacity-60">Renders high-density category nodes.</p>
                            </div>
                            <div className="relative inline-flex items-center h-7 rounded-full w-14 transition-all shadow-inner">
                               <input checked readOnly type="checkbox" className="sr-only peer" />
                               <div className="w-14 h-7 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-lg"></div>
                            </div>
                         </div>
                         
                         <div className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-navy-50 shadow-sm group/toggle">
                            <div className="space-y-1">
                               <p className="text-sm font-black text-navy-950 uppercase tracking-tight leading-none transition-colors group-hover/toggle:text-primary">Spawn New Browser Instance</p>
                               <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest italic opacity-60">Opens target in target="_blank".</p>
                            </div>
                            <div className="relative inline-flex items-center h-7 rounded-full w-14 transition-all shadow-inner">
                               <input type="checkbox" className="sr-only peer" />
                               <div className="w-14 h-7 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-lg"></div>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Interface Badge (Optional)</label>
                         <input className="w-full h-14 px-8 bg-white border-none rounded-[1.5rem] text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all shadow-sm" placeholder="E.G. NEW, LIMITED, HOT" />
                      </div>
                   </form>

                   <div className="mt-auto pt-10 flex gap-4 border-t border-navy-100">
                      <button className="flex-1 py-4 text-[10px] font-black text-navy-400 uppercase tracking-[0.2em] hover:text-red-500 transition-colors">Abort Registry Edit</button>
                      <button className="flex-1 py-4 bg-navy-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-navy-950/20 hover:scale-105 active:scale-95 transition-all">Update Node Flow</button>
                   </div>
                </div>
             </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-amber-50/60 p-8 rounded-[3rem] border-2 border-amber-100 flex gap-6 items-start shadow-inner group">
             <span className="material-symbols-outlined text-amber-600 p-3 bg-white rounded-2xl shadow-md font-black group-hover:scale-110 transition-transform">tips_and_updates</span>
             <div className="space-y-2">
                <p className="text-sm font-black text-amber-950 uppercase tracking-tight">Personnel Sync Log</p>
                <p className="text-[10px] font-bold text-amber-900 uppercase leading-relaxed tracking-wider opacity-70 italic">Logic changes staged here are held in the local personnel buffer. Final commit to the global Deltablue registry requires 2FA personnel authorization sequence to publish to production.</p>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HeaderManagement;
