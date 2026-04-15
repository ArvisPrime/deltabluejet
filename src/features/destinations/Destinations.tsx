
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { DestinationHub } from '../../types';
import { BRAND } from '../../config/brand';
import { ROUTES } from '../../config/routes';

type RegionFilter = 'all' | 'africa';
const FILTERS: { label: string; value: RegionFilter }[] = [
   { label: 'All Destinations', value: 'all' },
   { label: 'Africa', value: 'africa' },
];

const HERO_BG_DEFAULT = 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&q=80';

interface PageCms {
   heroImage: string;
   heroTitle: string;
   heroHighlight: string;
   heroSubtitle: string;
   routeNetworkTitle: string;
   routeNetworkSubtitle: string;
   reachTitle: string;
   reachHighlight: string;
   reachSubtitle: string;
   stat1Value: string;
   stat1Label: string;
   stat2Value: string;
   stat2Label: string;
}

const Destinations: React.FC = () => {
   const navigate = useNavigate();
   const onBack = () => navigate(ROUTES.HOME);
   const onBookStart = () => navigate(ROUTES.FLIGHT_SEARCH);
   const onSelectDestination = (dest: DestinationHub) => navigate(`/destinations/${dest.airport}`);

   // ── Search bar state ──
   const [fromNode, setFromNode] = useState('BANJUL (BJL)');
   const [toNode, setToNode] = useState('ROUTE');
   const [departDate, setDepartDate] = useState('');
   const [passengers, setPassengers] = useState(1);
   const [showPaxDropdown, setShowPaxDropdown] = useState(false);
   const paxRef = useRef<HTMLDivElement>(null);

   // ── Region filter ──
   const [activeFilter, setActiveFilter] = useState<RegionFilter>('all');

   // ── Lazy-load destination data (Firestore CMS → fallback to hardcoded) ──
   const [hubs, setHubs] = useState<DestinationHub[]>([]);
   const [pageCms, setPageCms] = useState<PageCms>({
      heroImage: HERO_BG_DEFAULT,
      heroTitle: 'Discover',
      heroHighlight: 'New Destinations.',
      heroSubtitle: `Explore the intercontinental ${BRAND.shortName} network, bridging the world with precision and excellence.`,
      routeNetworkTitle: 'Route Network',
      routeNetworkSubtitle: "Connecting travellers across Africa's most important aviation corridors.",
      reachTitle: 'Intercontinental',
      reachHighlight: 'Reach.',
      reachSubtitle: 'Our route network expands continuously, connecting global destinations with reliable service and real-time flight tracking.',
      stat1Value: '182',
      stat1Label: 'Active Destinations',
      stat2Value: '12.4M',
      stat2Label: 'Annual Pax Transits',
   });
   useEffect(() => {
      (async () => {
         try {
            const { getDestinationsConfig } = await import('../../services/cms');
            const config = await getDestinationsConfig();
            if (config) {
               // Load page-level CMS content
               setPageCms((prev) => ({
                  heroImage: config.heroImage || prev.heroImage,
                  heroTitle: config.heroTitle || prev.heroTitle,
                  heroHighlight: config.heroHighlight || prev.heroHighlight,
                  heroSubtitle: config.heroSubtitle || prev.heroSubtitle,
                  routeNetworkTitle: config.routeNetworkTitle || prev.routeNetworkTitle,
                  routeNetworkSubtitle: config.routeNetworkSubtitle || prev.routeNetworkSubtitle,
                  reachTitle: config.reachTitle || prev.reachTitle,
                  reachHighlight: config.reachHighlight || prev.reachHighlight,
                  reachSubtitle: config.reachSubtitle || prev.reachSubtitle,
                  stat1Value: config.stat1Value || prev.stat1Value,
                  stat1Label: config.stat1Label || prev.stat1Label,
                  stat2Value: config.stat2Value || prev.stat2Value,
                  stat2Label: config.stat2Label || prev.stat2Label,
               }));
            }
            if (config?.destinations && Object.keys(config.destinations).length > 0) {
               const merged = Object.values(config.destinations)
                  .filter((d: any) => d.visible !== false)
                  .map((d: any) => ({
                     city: d.city,
                     country: d.country,
                     airport: d.airport,
                     frequency: d.frequency,
                     equipment: d.equipment,
                     profile: d.profile,
                     img: d.img,
                     region: d.region || 'africa',
                  } as DestinationHub));
               setHubs(merged);
               return;
            }
         } catch { /* fall through to hardcoded */ }
         const m = await import('../../data/destinationHubs');
         setHubs(m.DESTINATION_HUBS);
      })();
   }, []);

   const filteredHubs = useMemo(() => {
      if (activeFilter === 'all') return hubs;
      return hubs.filter((h) => h.region === activeFilter);
   }, [hubs, activeFilter]);

   // ── Swap handler ──
   const handleSwap = () => {
      setFromNode((prev) => {
         setToNode(fromNode);
         return toNode;
      });
   };

   // ── Close passenger dropdown on outside click ──
   useEffect(() => {
      const handler = (e: MouseEvent) => {
         if (paxRef.current && !paxRef.current.contains(e.target as Node)) {
            setShowPaxDropdown(false);
         }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
   }, []);


   return (
      <div className="flex flex-col min-h-screen bg-white font-sans text-navy-950 overflow-x-hidden">

         {/* Immersive Hero & Search Section */}
         <section className="relative min-h-[70vh] flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden">
            <div className="absolute inset-0 z-0">
               <div className="absolute inset-0 bg-gradient-to-b from-navy-950/80 via-navy-900/40 to-white z-10"></div>
               <div
                  className="w-full h-full bg-cover bg-center animate-slow-zoom scale-110"
                  style={{ backgroundImage: `url('${pageCms.heroImage}')` }}
               />
            </div>

            <div className="relative z-20 w-full max-w-7xl mx-auto space-y-12">
               <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-10 duration-1000">
                  <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-white/60 mb-6">
                     <button onClick={onBack} className="hover:text-primary transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">home</span> Home
                     </button>
                     <span className="material-symbols-outlined text-xs">chevron_right</span>
                     <span className="text-white">Destinations</span>
                  </nav>
                  <h1 className="text-6xl md:text-8xl font-black text-white leading-none tracking-tighter uppercase mb-6">
                     {pageCms.heroTitle} <br /><span className="text-primary">{pageCms.heroHighlight}</span>
                  </h1>
                  <p className="text-xl text-navy-50 font-medium italic uppercase tracking-wider opacity-90 max-w-xl">
                     {pageCms.heroSubtitle}
                  </p>
               </div>

               {/* Integrated Search Module */}
               <div className="bg-white/10 backdrop-blur-3xl rounded-[3rem] p-1 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/20 animate-in zoom-in duration-700 delay-300">
                  <div className="bg-white rounded-[2.8rem] p-8 md:p-10 shadow-inner">
                     <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                        <div className="md:col-span-5 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-center">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest ml-1">From</label>
                              <div className="relative group">
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-navy-300 group-focus-within:text-primary transition-colors">flight_takeoff</span>
                                 <input
                                    className="w-full h-16 pl-12 pr-4 bg-navy-50 border-none rounded-2xl text-navy-950 font-black uppercase tracking-tighter focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
                                    value={fromNode}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromNode(e.target.value)}
                                 />
                              </div>
                           </div>
                           <div className="flex justify-center -ml-4 -mr-4 z-10">
                              {/* FIX 1: Swap button now swaps from/to values */}
                              <button
                                 onClick={handleSwap}
                                 className="size-10 flex items-center justify-center rounded-full bg-white border border-navy-100 shadow-md text-navy-400 hover:text-primary hover:rotate-180 transition-all duration-300"
                              >
                                 <span className="material-symbols-outlined text-lg">swap_horiz</span>
                              </button>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest ml-1">To</label>
                              <div className="relative group">
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-navy-300 group-focus-within:text-primary transition-colors">flight_land</span>
                                 <input
                                    className="w-full h-16 pl-12 pr-4 bg-navy-50 border-none rounded-2xl text-navy-950 font-black uppercase tracking-tighter focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
                                    value={toNode}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToNode(e.target.value)}
                                 />
                              </div>
                           </div>
                        </div>

                        {/* FIX 2: Date picker uses native date input */}
                        <div className="md:col-span-3">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest ml-1">Travel Date</label>
                              <div className="relative group">
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-navy-300 group-focus-within:text-primary transition-colors">calendar_today</span>
                                 <input
                                    type="date"
                                    className="w-full h-16 pl-12 pr-4 bg-navy-50 border-none rounded-2xl font-black text-navy-950 uppercase text-xs focus:ring-8 focus:ring-primary/5 transition-all shadow-inner cursor-pointer"
                                    value={departDate}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepartDate(e.target.value)}
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
                           {/* FIX 3: Passenger selector with dropdown */}
                           <div className="space-y-2 relative" ref={paxRef}>
                              <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest ml-1">Passengers</label>
                              <button
                                 onClick={() => setShowPaxDropdown(!showPaxDropdown)}
                                 className="w-full h-16 px-6 bg-navy-50 rounded-2xl border-none text-left flex items-center justify-between group"
                              >
                                 <span className="text-sm font-black text-navy-950 uppercase tracking-tighter">{passengers} Adult{passengers > 1 ? 's' : ''}</span>
                                 <span className={`material-symbols-outlined text-navy-300 group-hover:text-primary transition-all ${showPaxDropdown ? 'rotate-180' : ''}`}>expand_more</span>
                              </button>

                              {showPaxDropdown && (
                                 <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-navy-100 shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center justify-between">
                                       <span className="text-xs font-black text-navy-600 uppercase tracking-widest">Adults</span>
                                       <div className="flex items-center gap-3">
                                          <button
                                             onClick={() => setPassengers(Math.max(1, passengers - 1))}
                                             className="size-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-400 hover:text-primary hover:bg-primary/5 transition-all font-black text-lg disabled:opacity-30"
                                             disabled={passengers <= 1}
                                          >−</button>
                                          <span className="text-lg font-black text-navy-950 w-8 text-center">{passengers}</span>
                                          <button
                                             onClick={() => setPassengers(Math.min(9, passengers + 1))}
                                             className="size-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-400 hover:text-primary hover:bg-primary/5 transition-all font-black text-lg disabled:opacity-30"
                                             disabled={passengers >= 9}
                                          >+</button>
                                       </div>
                                    </div>
                                    <button
                                       onClick={() => setShowPaxDropdown(false)}
                                       className="w-full mt-4 py-3 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all"
                                    >Done</button>
                                 </div>
                              )}
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
                     <h2 className="text-4xl md:text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">{pageCms.routeNetworkTitle}</h2>
                     <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-black uppercase rounded-lg tracking-widest">Active Network</span>
                  </div>
                  <p className="text-navy-500 font-medium text-xl italic uppercase tracking-wider opacity-80">
                     {pageCms.routeNetworkSubtitle}
                  </p>
               </div>
               {/* FIX 4: Filter tabs now have active state + filtering logic */}
               <div className="flex bg-navy-50 p-1.5 rounded-2xl border border-navy-100 shadow-inner">
                  {FILTERS.map((f) => (
                     <button
                        key={f.value}
                        onClick={() => setActiveFilter(f.value)}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === f.value ? 'bg-white text-navy-950 shadow-md border border-navy-100' : 'text-navy-400 hover:text-navy-950'}`}
                     >
                        {f.label}
                     </button>
                  ))}
               </div>
            </div>

            {/* Destinations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
               {filteredHubs.length === 0 ? (
                  <div className="col-span-full text-center py-20 space-y-4">
                     <span className="material-symbols-outlined text-6xl text-navy-200">flight</span>
                     <p className="text-lg font-black text-navy-300 uppercase tracking-widest">No destinations in this region yet</p>
                     <p className="text-xs text-navy-400 font-bold uppercase tracking-wider">Routes are being configured. Check back soon.</p>
                  </div>
               ) : filteredHubs.map((hub, i) => (
                  <div key={i}
                     onClick={() => onSelectDestination(hub)}
                     className="group relative rounded-[4rem] overflow-hidden bg-white shadow-lg hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] transition-all duration-700 border border-navy-100 cursor-pointer"
                  >
                     {/* Destination Image */}
                     <div className="aspect-[4/5] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/20 to-transparent z-10"></div>
                        <div
                           className="w-full h-full bg-cover bg-center transition-transform duration-[8s] group-hover:scale-110"
                           style={{ backgroundImage: `url('${hub.img}')` }}
                        />
                        <div className="absolute top-8 right-8 z-20">
                           <div className="px-5 py-2.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[10px] font-black uppercase tracking-widest shadow-2xl">
                              {hub.airport}
                           </div>
                        </div>
                     </div>

                     {/* Destination Info */}
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
                              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Flight Frequency</p>
                              <p className="text-xs font-black uppercase tracking-tight">{hub.frequency}</p>
                           </div>
                           <div className="space-y-1 text-right">
                              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Primary Equipment</p>
                              <p className="text-xs font-black uppercase tracking-tight">{hub.equipment}</p>
                           </div>
                        </div>

                        <button
                           onClick={(e) => { e.stopPropagation(); onSelectDestination(hub); }}
                           className="w-full py-5 bg-white text-navy-950 font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl shadow-xl hover:bg-primary hover:text-white transition-all transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                        >
                           View Destination
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
                     <h2 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-tight">{pageCms.reachTitle} <br /><span className="text-primary underline decoration-primary/20 underline-offset-8">{pageCms.reachHighlight}</span></h2>
                     <p className="text-navy-500 font-medium italic text-xl leading-relaxed uppercase tracking-wider opacity-80">
                        {pageCms.reachSubtitle}
                     </p>
                  </div>
                  <div className="grid grid-cols-2 gap-10">
                     <div className="space-y-2">
                        <p className="text-6xl font-black text-navy-950 tracking-tighter">{pageCms.stat1Value}</p>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">{pageCms.stat1Label}</p>
                     </div>
                     <div className="space-y-2">
                        <p className="text-6xl font-black text-navy-950 tracking-tighter">{pageCms.stat2Value}</p>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">{pageCms.stat2Label}</p>
                     </div>
                  </div>
               </div>

               <div className="bg-navy-950 rounded-[4rem] p-12 text-white relative overflow-hidden shadow-2xl group">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-[10s]" style={{ backgroundImage: "radial-gradient(#137fec 2px, transparent 2px)", backgroundSize: "40px 40px" }}></div>
                  <div className="relative z-10 space-y-10">
                     <div className="flex items-center justify-between border-b border-white/10 pb-8">
                        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary">Fleet Performance</h3>
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Live Feed: NYC-01</span>
                     </div>
                     <div className="space-y-8">
                        {[
                           { label: 'Avg Block Time Delta', val: '-12m', col: 'text-emerald-400' },
                           { label: 'On-Time Performance', val: '99.8%', col: 'text-white' },
                           { label: 'Fuel Flow Optimization', val: 'Active', col: 'text-primary' }
                        ].map((stat, i) => (
                           <div key={i} className="flex justify-between items-center group/stat">
                              <span className="text-[11px] font-black text-white/40 uppercase tracking-widest group-hover/stat:text-white transition-colors">{stat.label}</span>
                              <span className={`text-sm font-black uppercase tracking-widest ${stat.col}`}>{stat.val}</span>
                           </div>
                        ))}
                     </div>
                     {/* FIX 5: "Learn About Us" navigates to About page */}
                     <button
                        onClick={() => navigate(ROUTES.ABOUT)}
                        className="w-full py-5 bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl hover:bg-primary hover:border-primary transition-all shadow-xl"
                     >
                        Learn About Us
                     </button>
                  </div>
               </div>
            </div>
         </section>


         {/* Floating Network Status */}
         <div className="fixed bottom-10 right-10 z-50 animate-in slide-in-from-right duration-1000">
            <div className="bg-navy-950/90 backdrop-blur-xl border border-white/10 px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-6 group hover:scale-105 transition-all">
               <div className="size-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
               <div className="space-y-0.5">
                  <p className="text-white font-black uppercase text-[10px] tracking-widest leading-none">Global Network Status</p>
                  <p className="text-primary font-black text-[8px] uppercase tracking-[0.2em] leading-none">All Systems Operational</p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Destinations;
