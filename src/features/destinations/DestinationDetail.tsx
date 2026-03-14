
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { DestinationHub } from '../../types';
import { BRAND } from '../../config/brand';
import { ROUTES } from '../../config/routes';

/* Per-destination weather sourced from allmetsat.com METAR reports (fallback) */
const AIRPORT_WEATHER_FALLBACK: Record<string, { temp: string; visibility: string }> = {
   BJL: { temp: '17°C', visibility: '8 km' },
   DSS: { temp: '22°C', visibility: '10 km' },
   OXB: { temp: '23°C', visibility: '8 km' },
   CKY: { temp: '27°C', visibility: '4 km' },
   FNA: { temp: '27°C', visibility: '4 km' },
   ROB: { temp: '25°C', visibility: '7 km' },
   ACC: { temp: '29°C', visibility: 'Unlimited' },
   LOS: { temp: '27°C', visibility: '8 km' },
};

interface CmsOverrides {
   heroDescription?: string;
   loungeInfo?: string;
   securityInfo?: string;
   weatherTemp?: string;
   weatherVisibility?: string;
}

const DestinationDetail: React.FC = () => {
   const navigate = useNavigate();
   const { id } = useParams<{ id: string }>();

   // Lazy-load destination data (code-split)
   const [hubs, setHubs] = useState<DestinationHub[]>([]);
   const [cmsOverrides, setCmsOverrides] = useState<CmsOverrides>({});

   useEffect(() => {
      (async () => {
         // Load hubs — prefer CMS, fallback to hardcoded
         try {
            const { getDestinationsConfig } = await import('../../services/cms');
            const config = await getDestinationsConfig();
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

               // Also extract CMS-specific overrides for this destination
               const code = id?.toUpperCase() || '';
               const dest = config.destinations[code];
               if (dest) {
                  setCmsOverrides({
                     heroDescription: dest.heroDescription || '',
                     loungeInfo: dest.loungeInfo || '',
                     securityInfo: dest.securityInfo || '',
                     weatherTemp: dest.weatherTemp || '',
                     weatherVisibility: dest.weatherVisibility || '',
                  });
               }
               return;
            }
         } catch { /* fall through */ }
         const m = await import('../../data/destinationHubs');
         setHubs(m.DESTINATION_HUBS);
      })();
   }, [id]);

   const destination = hubs.find(
      (hub) => hub.airport.toLowerCase() === id?.toLowerCase()
   );
   const onBack = () => navigate(ROUTES.DESTINATIONS);
   const onBookNow = () => navigate(ROUTES.FLIGHT_SEARCH);

   // Resolve weather: CMS override → hardcoded fallback
   const weatherTemp = cmsOverrides.weatherTemp || AIRPORT_WEATHER_FALLBACK[destination?.airport || '']?.temp || '—';
   const weatherVisibility = cmsOverrides.weatherVisibility || AIRPORT_WEATHER_FALLBACK[destination?.airport || '']?.visibility || '—';

   if (!destination) {
      return (
         <div className="flex flex-col items-center justify-center min-h-screen bg-white font-sans text-navy-950 space-y-6">
            <span className="material-symbols-outlined text-6xl text-navy-300">flight_land</span>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Destination Not Found</h1>
            <p className="text-navy-500 uppercase tracking-wider text-xs">The requested destination code "{id}" is not currently available.</p>
            <button onClick={onBack} className="px-8 py-4 bg-primary text-white font-black uppercase tracking-[0.3em] text-xs rounded-2xl hover:scale-105 transition-all">
               Back to Destinations
            </button>
         </div>
      );
   }

   return (

      <div className="flex flex-col min-h-screen bg-white font-sans text-navy-950 animate-in fade-in duration-700 pb-20">
         {/* Hero Section */}
         <section className="relative h-[65vh] min-h-[500px] flex items-end p-8 md:p-16 overflow-hidden">
            <div className="absolute inset-0 z-0">
               <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-900/20 to-transparent z-10"></div>
               <div
                  className="w-full h-full bg-cover bg-center transition-transform duration-[15s] scale-110 animate-slow-zoom"
                  style={{ backgroundImage: `url('${destination.img}')` }}
               />
            </div>

            <div className="relative z-20 w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-10">
               <div className="space-y-6 max-w-3xl">
                  <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-white/60 mb-8">
                     <button onClick={onBack} className="hover:text-primary transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">arrow_back</span> All Destinations
                     </button>
                     <span className="material-symbols-outlined text-xs">chevron_right</span>
                     <span className="text-white">{destination.airport}</span>
                  </nav>
                  <div className="space-y-2">
                     <p className="text-primary font-black uppercase tracking-[0.5em] text-sm drop-shadow-xl">{destination.country}</p>
                     <h1 className="text-7xl md:text-9xl font-black text-white leading-none tracking-tighter uppercase">
                        {destination.city}
                     </h1>
                  </div>
               </div>

               <button
                  onClick={onBookNow}
                  className="px-12 py-6 bg-primary text-white font-black uppercase tracking-[0.3em] text-xs rounded-[2rem] shadow-[0_20px_50px_-10px_rgba(19,127,236,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group"
               >
                  Book a Flight <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
               </button>
            </div>
         </section>

         {/* Mission Briefing Workspace */}
         <main className="max-w-7xl mx-auto w-full p-8 md:p-16 grid grid-cols-1 lg:grid-cols-12 gap-16">

            {/* Left: Narrative & Description */}
            <div className="lg:col-span-8 space-y-12">
               <div className="space-y-6">
                  <h2 className="text-xs font-black text-primary uppercase tracking-[0.4em]">About This Route</h2>
                  <p className="text-3xl font-black text-navy-950 uppercase tracking-tighter leading-tight">
                     Gateway to {destination.city} — Connecting travellers via the {destination.country} corridor.
                  </p>
                  <div className="prose prose-navy max-w-none">
                     <p className="text-xl text-navy-500 font-medium italic leading-relaxed uppercase tracking-wider opacity-80">
                        {destination.profile} This destination serves as a key connection point for {BRAND.name}, offering seamless passenger connections and optimized transfers.
                     </p>
                     <p className="text-lg text-navy-700 leading-relaxed pt-6">
                        {cmsOverrides.heroDescription || `Our station at ${destination.city} has been recently modernized with advanced scheduling systems and a dedicated passenger lounge. Travellers can expect seamless connections and real-time flight updates throughout their journey.`}
                     </p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-navy-50/50 p-10 rounded-[3rem] border border-navy-100 shadow-inner space-y-6 group">
                     <div className="size-12 rounded-2xl bg-white text-primary flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-2xl font-black">verified_user</span>
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight">Security Information</h3>
                        <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest leading-relaxed">
                           {cmsOverrides.securityInfo || 'Full biometric clearance active. Check-in opens 3 hours before departure.'}
                        </p>
                     </div>
                  </div>
                  <div className="bg-navy-50/50 p-10 rounded-[3rem] border border-navy-100 shadow-inner space-y-6 group">
                     <div className="size-12 rounded-2xl bg-white text-primary flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-2xl font-black">hub</span>
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight">Lounge Access</h3>
                        <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest leading-relaxed">
                           {cmsOverrides.loungeInfo || `The ${BRAND.shortName} Alpha Wing is available for Executive Class passengers and Diamond Platinum members.`}
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right: Airport Info Sidebar */}
            <div className="lg:col-span-4 space-y-10">
               <div className="bg-navy-950 rounded-[4rem] p-10 text-white space-y-10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-[10s]" style={{ backgroundImage: "radial-gradient(#137fec 2px, transparent 2px)", backgroundSize: "40px 40px" }}></div>

                  <div className="relative z-10 space-y-8">
                     <div className="flex items-center justify-between border-b border-white/10 pb-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary">Airport Details</h3>
                        <span className="material-symbols-outlined text-primary text-xl animate-pulse">radar</span>
                     </div>

                     <div className="space-y-8">
                        {[
                           { label: 'Airport Code', val: destination.airport, icon: 'location_on' },
                           { label: 'Flight Frequency', val: destination.frequency, icon: 'schedule' },
                           { label: 'Primary Equipment', val: destination.equipment, icon: 'airlines' },
                           { label: 'Station Status', val: 'Operational', icon: 'check_circle', col: 'text-emerald-400' },
                        ].map((spec, i) => (
                           <div key={i} className="flex items-center justify-between group/spec">
                              <div className="flex items-center gap-4">
                                 <span className="material-symbols-outlined text-white/20 group-hover/spec:text-primary transition-colors">{spec.icon}</span>
                                 <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{spec.label}</span>
                              </div>
                              <span className={`text-sm font-black uppercase tracking-widest ${spec.col || 'text-white'}`}>{spec.val}</span>
                           </div>
                        ))}
                     </div>

                     <div className="pt-8 border-t border-white/10 space-y-6">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] text-center">Weather Conditions</p>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                              <p className="text-[8px] font-bold text-white/40 uppercase mb-1">Temperature</p>
                              <p className="text-lg font-black tracking-tighter">{weatherTemp}</p>
                           </div>
                           <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                              <p className="text-[8px] font-bold text-white/40 uppercase mb-1">Visibility</p>
                              <p className="text-lg font-black tracking-tighter">{weatherVisibility}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-[3.5rem] border border-navy-100 p-10 shadow-sm space-y-6 group hover:shadow-xl transition-all">
                  <div className="flex items-center gap-5">
                     <div className="size-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-3xl font-black">support_agent</span>
                     </div>
                     <div>
                        <h4 className="text-lg font-black text-navy-950 uppercase tracking-tight">Need Assistance?</h4>
                        <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest opacity-60">Direct station contact.</p>
                     </div>
                  </div>
                  <button className="w-full py-4 bg-navy-50 text-navy-950 font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl hover:bg-primary hover:text-white transition-all">Contact Us</button>
               </div>
            </div>
         </main>

         {/* Floating CTA for Mobile */}
         <div className="md:hidden fixed bottom-6 inset-x-6 z-50">
            <button
               onClick={onBookNow}
               className="w-full py-5 bg-primary text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-2xl flex items-center justify-center gap-4"
            >
               Book a Flight <span className="material-symbols-outlined">arrow_forward</span>
            </button>
         </div>
      </div>
   );
};

export default DestinationDetail;
