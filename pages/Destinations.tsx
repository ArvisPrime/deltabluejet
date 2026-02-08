
import React, { useState } from 'react';
import { DestinationHub } from '../types';

interface DestinationsProps {
  onBack: () => void;
  onBookStart: () => void;
  onSelectDestination: (dest: DestinationHub) => void;
}

const Destinations: React.FC<DestinationsProps> = ({ onBack, onBookStart, onSelectDestination }) => {
  const [fromNode, setFromNode] = useState('New York (JFK)');
  const [toNode, setToNode] = useState('Explore Destinations');

  const hubs: DestinationHub[] = [
    { city: 'Banjul', country: 'The Gambia', airport: 'BJL', frequency: 'Daily', equipment: 'B787-9', profile: 'Regional West-Africa Hub. Precision logistics node for eco-tourism.', img: 'https://images.unsplash.com/photo-1544321689-d499ec24467c?auto=format&fit=crop&q=80' },
    { city: 'Dhaka', country: 'Bangladesh', airport: 'DAC', frequency: '3x Weekly', equipment: 'A350-900', profile: 'Strategic Asian Corridor. Key node for international commerce.', img: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80' },
    { city: 'Guinea Bissau', country: 'West Africa', airport: 'OXB', frequency: 'Daily', equipment: 'E190-E2', profile: 'Coastal Transit Hub. High-efficiency regional sequence terminal.', img: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&q=80' },
    { city: 'Guinea Conakry', country: 'West Africa', airport: 'CKY', frequency: 'Daily', equipment: 'B737-MAX', profile: 'Port-Access Node. Primary terminal for resource-sector personnel.', img: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&q=80' },
    { city: 'Freetown', country: 'Sierra Leone', airport: 'FNA', frequency: 'Daily', equipment: 'A330neo', detail: 'Lungi-Town Terminal', profile: 'Gateway to the Atlantic. Modernized aerospace node with live ferry sync.', img: 'https://images.unsplash.com/photo-1489440543286-a69330151c0b?auto=format&fit=crop&q=80' },
    { city: 'Liberia', country: 'Monrovia', airport: 'ROB', frequency: 'Daily', equipment: 'B787-8', profile: 'Roberts Intl Protocol. Direct link to Monrovia economic zone.', img: 'https://images.unsplash.com/photo-1551882547-ff43c63ebe5e?auto=format&fit=crop&q=80' },
    { city: 'Accra', country: 'Ghana', airport: 'ACC', frequency: '2x Daily', equipment: 'B777-300ER', profile: 'Executive Commerce Hub. High-density terminal for West-African finance.', img: 'https://images.unsplash.com/photo-1591129841117-3adfd313e34f?auto=format&fit=crop&q=80' },
    { city: 'Lagos', country: 'Nigeria', airport: 'LOS', frequency: '3x Daily', equipment: 'A350-1000', profile: 'The Delta Peak. Highest density node in the intercontinental network.', img: 'https://images.unsplash.com/photo-1618833162734-722649666014?auto=format&fit=crop&q=80' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-navy-950 overflow-x-hidden">
      
      {/* Immersive Hero & Search Hub */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950/80 via-navy-900/40 to-white z-10"></div>
          <div 
            className="w-full h-full bg-cover bg-center animate-slow-zoom scale-110" 
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1464037192391-455e2b97ecd8?auto=format&fit=crop&q=80')" }} 
          />
        </div>

        <div className="relative z-20 w-full max-w-7xl mx-auto space-y-12">
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-10 duration-1000">
             <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-white/60 mb-6">
                <button onClick={onBack} className="hover:text-primary transition-all flex items-center gap-2">
                   <span className="material-symbols-outlined text-sm">home</span> Home Hub
                </button>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-white">Global Registry</span>
             </nav>
             <h1 className="text-6xl md:text-8xl font-black text-white leading-none tracking-tighter uppercase mb-6">
                Discover <br/><span className="text-primary">New Nodes.</span>
             </h1>
             <p className="text-xl text-navy-50 font-medium italic uppercase tracking-wider opacity-90 max-w-xl">
                Explore the intercontinental Deltablue network, bridging the world with precision aviation logic.
             </p>
          </div>

          {/* Integrated Search Module */}
          <div className="bg-white/10 backdrop-blur-3xl rounded-[3rem] p-1 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/20 animate-in zoom-in duration-700 delay-300">
             <div className="bg-white rounded-[2.8rem] p-8 md:p-10 shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                   <div className="md:col-span-5 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-center">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest ml-1">Departure Hub</label>
                         <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-navy-300 group-focus-within:text-primary transition-colors">flight_takeoff</span>
                            <input 
                               className="w-full h-16 pl-12 pr-4 bg-navy-50 border-none rounded-2xl text-navy-950 font-black uppercase tracking-tighter focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" 
                               value={fromNode} 
                               onChange={(e) => setFromNode(e.target.value)} 
                            />
                         </div>
                      </div>
                      <div className="flex justify-center -ml-4 -mr-4 z-10">
                         <button className="size-10 flex items-center justify-center rounded-full bg-white border border-navy-100 shadow-md text-navy-400 hover:text-primary transition-all">
                            <span className="material-symbols-outlined text-lg">swap_horiz</span>
                         </button>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest ml-1">Arrival Target</label>
                         <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-navy-300 group-focus-within:text-primary transition-colors">flight_land</span>
                            <input 
                               className="w-full h-16 pl-12 pr-4 bg-navy-50 border-none rounded-2xl text-navy-950 font-black uppercase tracking-tighter focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" 
                               value={toNode} 
                               onChange={(e) => setToNode(e.target.value)}
                            />
                         </div>
                      </div>
                   </div>

                   <div className="md:col-span-3">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest ml-1">Sequence Window</label>
                         <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-navy-300 group-focus-within:text-primary transition-colors">calendar_today</span>
                            <input type="text" className="w-full h-16 pl-12 pr-4 bg-navy-50 border-none rounded-2xl font-black text-navy-950 uppercase text-xs focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" defaultValue="Oct 24 - Oct 31" />
                         </div>
                      </div>
                   </div>

                   <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest ml-1">Personnel</label>
                         <button className="w-full h-16 px-6 bg-navy-50 rounded-2xl border-none text-left flex items-center justify-between group">
                            <span className="text-sm font-black text-navy-950 uppercase tracking-tighter">1 Adult</span>
                            <span className="material-symbols-outlined text-navy-300 group-hover:text-primary transition-colors">group</span>
                         </button>
                      </div>
                      <button onClick={onBookStart} className="h-16 px-12 bg-primary text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                         Search <span className="material-symbols-outlined">arrow_forward</span>
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Directory Content */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full space-y-16">
         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 border-b border-navy-100 pb-12">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <h2 className="text-4xl md:text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">Global Hub Registry</h2>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-black uppercase rounded-lg tracking-widest">Active Network</span>
               </div>
               <p className="text-navy-500 font-medium text-xl italic uppercase tracking-wider opacity-80">
                  Orchestrating high-fidelity transit across specialized Africa and Asia-Pacific corridors.
               </p>
            </div>
            <div className="flex bg-navy-50 p-1.5 rounded-2xl border border-navy-100 shadow-inner">
               {['All Nodes', 'Africa Hubs', 'Asia Pacific'].map((f, i) => (
                  <button key={f} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${i === 0 ? 'bg-white text-navy-950 shadow-md border border-navy-100' : 'text-navy-400 hover:text-navy-950'}`}>
                     {f}
                  </button>
               ))}
            </div>
         </div>

         {/* Destinations Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
            {hubs.map((hub, i) => (
               <div key={i} 
                 onClick={() => onSelectDestination(hub)}
                 className="group relative rounded-[4rem] overflow-hidden bg-white shadow-lg hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] transition-all duration-700 border border-navy-100 cursor-pointer"
               >
                  {/* Visual Node */}
                  <div className="aspect-[4/5] relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/20 to-transparent z-10"></div>
                     <div 
                        className="w-full h-full bg-cover bg-center transition-transform duration-[8s] group-hover:scale-110" 
                        style={{ backgroundImage: `url('${hub.img}')` }} 
                     />
                     <div className="absolute top-8 right-8 z-20">
                        <div className="px-5 py-2.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[10px] font-black uppercase tracking-widest shadow-2xl">
                           Node: {hub.airport}
                        </div>
                     </div>
                  </div>

                  {/* Operational Content */}
                  <div className="absolute bottom-0 left-0 w-full p-10 z-20 text-white flex flex-col gap-6">
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] drop-shadow-lg">{hub.country}</p>
                        <h3 className="text-4xl font-black tracking-tighter uppercase leading-none group-hover:text-primary transition-colors">{hub.city}</h3>
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-4 leading-relaxed italic line-clamp-2">
                           {hub.profile}
                        </p>
                     </div>

                     <div className="grid grid-cols-2 gap-4 py-8 border-y border-white/10">
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Sequence Freq.</p>
                           <p className="text-xs font-black uppercase tracking-tight">{hub.frequency}</p>
                        </div>
                        <div className="space-y-1 text-right">
                           <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Primary Equipment</p>
                           <p className="text-xs font-black uppercase tracking-tight">{hub.equipment}</p>
                        </div>
                     </div>

                     <button 
                        className="w-full py-5 bg-white text-navy-950 font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl shadow-xl hover:bg-primary hover:text-white transition-all transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                     >
                        View Node Profile
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* Network Integrity Dashboard */}
      <section className="py-24 px-6 md:px-12 bg-navy-50/50">
         <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
               <div className="space-y-6">
                  <h2 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-tight">Intercontinental <br/><span className="text-primary underline decoration-primary/20 underline-offset-8">Precision.</span></h2>
                  <p className="text-navy-500 font-medium italic text-xl leading-relaxed uppercase tracking-wider opacity-80">
                     Our fleet registry expands continuously, linking global commerce centers with high-fidelity aviation protocols and real-time telemetry tracking.
                  </p>
               </div>
               <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-2">
                     <p className="text-6xl font-black text-navy-950 tracking-tighter">182</p>
                     <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Active Hub Stations</p>
                  </div>
                  <div className="space-y-2">
                     <p className="text-6xl font-black text-navy-950 tracking-tighter">12.4M</p>
                     <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Annual Pax Transits</p>
                  </div>
               </div>
            </div>
            
            <div className="bg-navy-950 rounded-[4rem] p-12 text-white relative overflow-hidden shadow-2xl group">
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-[10s]" style={{ backgroundImage: "radial-gradient(#137fec 2px, transparent 2px)", backgroundSize: "40px 40px" }}></div>
               <div className="relative z-10 space-y-10">
                  <div className="flex items-center justify-between border-b border-white/10 pb-8">
                     <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary">Fleet Analytics Registry</h3>
                     <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Live Feed: NYC-01</span>
                  </div>
                  <div className="space-y-8">
                     {[
                       { label: 'Avg Block Time Delta', val: '-12m', col: 'text-emerald-400' },
                       { label: 'Dispatch Accuracy', val: '99.8%', col: 'text-white' },
                       { label: 'Fuel Flow Optimization', val: 'Active', col: 'text-primary' }
                     ].map((stat, i) => (
                       <div key={i} className="flex justify-between items-center group/stat">
                          <span className="text-[11px] font-black text-white/40 uppercase tracking-widest group-hover/stat:text-white transition-colors">{stat.label}</span>
                          <span className={`text-sm font-black uppercase tracking-widest ${stat.col}`}>{stat.val}</span>
                       </div>
                     ))}
                  </div>
                  <button className="w-full py-5 bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl hover:bg-primary hover:border-primary transition-all shadow-xl">View Operational Roadmap</button>
               </div>
            </div>
         </div>
      </section>

      {/* Global Brand Footer Overlay */}
      <footer className="bg-white border-t border-navy-100 py-32 px-6 md:px-12">
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-20">
            <div className="col-span-1 space-y-10">
               <div className="flex items-center gap-4 font-black text-3xl tracking-tighter text-navy-950 uppercase">
                  <div className="size-12 bg-primary rounded-tr-2xl rounded-bl-2xl shadow-lg shadow-primary/20" />
                  Deltablue<span className="text-primary font-black">Air</span>
               </div>
               <p className="text-sm text-navy-400 font-bold uppercase tracking-widest italic opacity-70 leading-loose">
                  Orchestrating precision aviation protocols for the modern explorer. Global station operations centered in NYC-HUB-01.
               </p>
            </div>

            {[
              { title: 'Operations', links: ['Book a Sequence', 'Fleet Telemetry', 'Trip Registry', 'Node Rewards'] },
              { title: 'Personnel', links: ['Club Tiers', 'Admin Portal', 'Career Stations', 'Master Policy'] },
              { title: 'Support Hub', links: ['Dispatch Help', 'Baggage Logic', 'Accessible Transit', 'Data Integrity'] }
            ].map((col, i) => (
              <div key={i} className="space-y-12">
                 <h4 className="text-xs font-black text-navy-950 uppercase tracking-[0.4em] border-b-2 border-primary/10 pb-6 w-fit">{col.title}</h4>
                 <ul className="space-y-5">
                    {col.links.map(link => (
                      <li key={link}>
                         <button className="text-sm font-bold text-navy-400 uppercase tracking-widest hover:text-primary transition-colors italic group flex items-center gap-2">
                            <span className="h-0.5 w-0 bg-primary group-hover:w-4 transition-all"></span>
                            {link}
                         </button>
                      </li>
                    ))}
                 </ul>
              </div>
            ))}
         </div>

         <div className="max-w-7xl mx-auto mt-32 pt-12 border-t border-navy-50 flex flex-col md:flex-row items-center justify-between gap-8 opacity-40">
            <p className="text-[10px] font-black text-navy-300 uppercase tracking-[0.5em]">© 2024 DELTABLUE JET AIR OPERATIONS. ENCRYPTED-NODE-NYC-01</p>
            <div className="flex gap-12 text-[10px] font-black text-navy-300 uppercase tracking-widest">
               <button className="hover:text-primary transition-colors">Privacy Registry</button>
               <button className="hover:text-primary transition-colors">Service Protocols</button>
            </div>
         </div>
      </footer>

      {/* Floating Network Status */}
      <div className="fixed bottom-10 right-10 z-50 animate-in slide-in-from-right duration-1000">
         <div className="bg-navy-950/90 backdrop-blur-xl border border-white/10 px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-6 group hover:scale-105 transition-all">
            <div className="size-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
            <div className="space-y-0.5">
               <p className="text-white font-black uppercase text-[10px] tracking-widest leading-none">Global Sync Status</p>
               <p className="text-primary font-black text-[8px] uppercase tracking-[0.2em] leading-none">All Hubs Operational</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Destinations;
