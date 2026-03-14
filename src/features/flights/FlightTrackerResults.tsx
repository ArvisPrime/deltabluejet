
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { BRAND } from '../../config/brand';
import { ROUTES } from '../../config/routes';
import { useAdminAction } from '../../hooks/useAdminAction';

/* ─── Fleet Spec Modal ──────────────────────────────────────────────── */
const SPEC_TABS = ['Technical', 'Cabin', 'Amenities', 'Performance'] as const;
type SpecTab = typeof SPEC_TABS[number];

const techSpecs = [
   { lbl: 'Manufacturer', val: 'Embraer S.A.' },
   { lbl: 'Model Variant', val: 'ERJ-120' },
   { lbl: 'Wingspan', val: '60.1 m / 197 ft' },
   { lbl: 'Overall Length', val: '62.8 m / 206 ft' },
   { lbl: 'Max Range', val: '14,140 km / 7,635 NM' },
   { lbl: 'Cruise Speed', val: 'Mach 0.85 (903 km/h)' },
   { lbl: 'Service Ceiling', val: '43,100 ft / 13,100 m' },
   { lbl: 'MTOW', val: '254,011 kg / 560,000 lb' },
   { lbl: 'Engines', val: 'GEnx-1B × 2 (Rolls-Royce Trent 1000 alt.)' },
   { lbl: 'Fuel Capacity', val: '126,917 L / 33,528 US gal' },
];

const cabinSpecs = [
   { cls: 'Executive Class', seats: 30, pitch: '78"', width: '22"', icon: 'airline_seat_flat', color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100' },
   { cls: 'Premium Economy', seats: 21, pitch: '38"', width: '19"', icon: 'airline_seat_recline_extra', color: 'text-indigo-500', bg: 'bg-indigo-50 border-indigo-100' },
   { cls: 'Economy', seats: 215, pitch: '32"', width: '17.5"', icon: 'airline_seat_recline_normal', color: 'text-primary', bg: 'bg-blue-50 border-blue-100' },
];

const amenitySpecs = [
   { lbl: 'Wi-Fi', val: 'Viasat Ka-band High Speed', icon: 'wifi' },
   { lbl: 'Entertainment', val: '12" HD Touchscreen IFE', icon: 'live_tv' },
   { lbl: 'Power', val: 'AC Outlet + USB‑C at every seat', icon: 'electrical_services' },
   { lbl: 'Lighting', val: 'LED Mood Lighting (16.7M colors)', icon: 'light_mode' },
   { lbl: 'Windows', val: 'Electrochromic Dimmable', icon: 'window' },
   { lbl: 'Air Quality', val: 'HEPA + Gaseous Filtration', icon: 'air_purifier' },
   { lbl: 'Humidity', val: 'Higher cabin humidity (composite fuselage)', icon: 'humidity_high' },
   { lbl: 'Noise Level', val: '60% quieter than prior-gen widebody', icon: 'volume_down' },
];

const perfSpecs = [
   { lbl: 'Fuel Burn', val: '5.77 L / 100 pax-km', trend: 'down', note: '20% more efficient than 767' },
   { lbl: 'CO₂ / Passenger', val: '115 g / pax-km', trend: 'down', note: 'Best-in-class widebody' },
   { lbl: 'Noise Footprint', val: 'ICAO Ch. 14 Compliant', trend: 'down', note: '60% smaller noise contour' },
   { lbl: 'Dispatch Reliability', val: '99.3%', trend: 'up', note: 'Fleet average 12-month rolling' },
   { lbl: 'Fleet Entry Date', val: 'March 2019', trend: 'neutral', note: `${BRAND.shortName} fleet` },
   { lbl: 'Cycles to Date', val: '4,821', trend: 'neutral', note: 'As of current month' },
];

interface FleetSpecModalProps {
   open: boolean;
   onClose: () => void;
}

const FleetSpecModal: React.FC<FleetSpecModalProps> = ({ open, onClose }) => {
   const action = useAdminAction();
   const [activeTab, setActiveTab] = useState<SpecTab>('Technical');
   const [visible, setVisible] = useState(false);

   useEffect(() => {
      if (open) {
         requestAnimationFrame(() => setVisible(true));
      } else {
         setVisible(false);
      }
   }, [open]);

   const handleClose = useCallback(() => {
      setVisible(false);
      setTimeout(onClose, 300);
   }, [onClose]);

   useEffect(() => {
      if (!open) return;
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
   }, [open, handleClose]);

   if (!open) return null;

   return (
      <div
         className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center transition-all duration-300 ${visible ? 'bg-navy-950/60 backdrop-blur-sm' : 'bg-transparent'}`}
         onClick={handleClose}
      >
         <div
            className={`relative w-full max-w-3xl max-h-[92vh] bg-white rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl shadow-navy-950/30 overflow-hidden flex flex-col transition-all duration-500 ease-out ${visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'
               }`}
            onClick={(e) => e.stopPropagation()}
         >
            {/* Header */}
            <div className="relative bg-navy-950 px-8 pt-10 pb-8 text-white overflow-hidden shrink-0">
               <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "radial-gradient(#137fec 1.5px, transparent 1.5px)", backgroundSize: "28px 28px" }}></div>
               <div className="absolute top-0 right-0 p-6 opacity-[0.03]"><span className="material-symbols-outlined text-[160px] font-black">flight</span></div>

               <button onClick={handleClose} className="absolute top-6 right-6 z-10 size-10 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all hover:scale-110 active:scale-95">
                  <span className="material-symbols-outlined text-white/60 text-xl">close</span>
               </button>

               <div className="relative z-10 flex items-center gap-6">
                  <div className="size-16 rounded-[1.5rem] bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                     <span className="material-symbols-outlined text-3xl text-primary font-black">flight</span>
                  </div>
                  <div>
                     <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Embraer ERJ-120</h2>
                     <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mt-2">N-120-DB • {BRAND.shortName} ERJ-120 Fleet</p>
                  </div>
               </div>

               <div className="relative z-10 flex items-center gap-3 mt-6">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active • In Service</span>
               </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-navy-100 px-8 pt-2 shrink-0 bg-navy-50/30">
               {SPEC_TABS.map((tab) => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(tab)}
                     className={`px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab
                        ? 'text-primary'
                        : 'text-navy-300 hover:text-navy-700'
                        }`}
                  >
                     {tab}
                     {activeTab === tab && (
                        <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-full" />
                     )}
                  </button>
               ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               {activeTab === 'Technical' && (
                  <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                     {techSpecs.map((s, i) => (
                        <div key={i} className="flex justify-between items-center py-4 border-b border-navy-50 last:border-0 group hover:bg-navy-50/30 px-3 rounded-xl transition-colors">
                           <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{s.lbl}</span>
                           <span className="text-sm font-black text-navy-950 uppercase tracking-tight">{s.val}</span>
                        </div>
                     ))}
                  </div>
               )}

               {activeTab === 'Cabin' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                     <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em]">3-Class Configuration</p>
                        <p className="text-sm font-black text-navy-950">266 Total Seats</p>
                     </div>
                     {cabinSpecs.map((c, i) => (
                        <div key={i} className={`p-6 rounded-3xl border ${c.bg} group hover:shadow-lg transition-all`}>
                           <div className="flex items-center justify-between mb-5">
                              <div className="flex items-center gap-4">
                                 <span className={`material-symbols-outlined text-2xl ${c.color}`}>{c.icon}</span>
                                 <div>
                                    <h4 className="text-sm font-black text-navy-950 uppercase tracking-tight">{c.cls}</h4>
                                    <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest mt-0.5">{c.seats} Seats</p>
                                 </div>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white/60 p-3 rounded-xl border border-white/80">
                                 <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest mb-1">Seat Pitch</p>
                                 <p className="text-lg font-black text-navy-950 tracking-tight">{c.pitch}</p>
                              </div>
                              <div className="bg-white/60 p-3 rounded-xl border border-white/80">
                                 <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest mb-1">Seat Width</p>
                                 <p className="text-lg font-black text-navy-950 tracking-tight">{c.width}</p>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               )}

               {activeTab === 'Amenities' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                     {amenitySpecs.map((a, i) => (
                        <div key={i} className="p-5 rounded-2xl border border-navy-50 bg-navy-50/20 hover:bg-white hover:shadow-md hover:border-navy-100 transition-all group">
                           <div className="flex items-start gap-4">
                              <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                                 <span className="material-symbols-outlined text-primary text-lg">{a.icon}</span>
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mb-1">{a.lbl}</p>
                                 <p className="text-xs font-bold text-navy-950 leading-relaxed">{a.val}</p>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               )}

               {activeTab === 'Performance' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                     {perfSpecs.map((p, i) => (
                        <div key={i} className="p-5 rounded-2xl border border-navy-50 hover:shadow-md transition-all group bg-white">
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{p.lbl}</span>
                              <div className="flex items-center gap-2">
                                 {p.trend === 'down' && <span className="material-symbols-outlined text-emerald-500 text-sm">trending_down</span>}
                                 {p.trend === 'up' && <span className="material-symbols-outlined text-emerald-500 text-sm">trending_up</span>}
                                 {p.trend === 'neutral' && <span className="material-symbols-outlined text-navy-300 text-sm">horizontal_rule</span>}
                                 <span className="text-sm font-black text-navy-950 tracking-tight">{p.val}</span>
                              </div>
                           </div>
                           <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest opacity-60 italic">{p.note}</p>
                        </div>
                     ))}
                  </div>
               )}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-8 py-5 border-t border-navy-100 bg-navy-50/20 flex items-center justify-between">
               <p className="text-[9px] font-bold text-navy-300 uppercase tracking-widest italic">Data current as of {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
               <button onClick={handleClose} className="px-8 py-3 bg-navy-950 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-primary transition-colors shadow-lg hover:shadow-primary/20 active:scale-95">
                  Close
               </button>
            </div>
         </div>
      </div>
   );
};

/* ─── Main Component ────────────────────────────────────────────────── */
const FlightTrackerResults: React.FC = () => {
   const navigate = useNavigate();
   const action = useAdminAction();
   const onBack = () => navigate(ROUTES.FLIGHT_TRACKER);
   const [specModalOpen, setSpecModalOpen] = useState(false);

   return (
      <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 font-display pb-32">
         {/* Top Breadcrumb & Status Indicator */}
         <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
               <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">
                  <button onClick={onBack} className="hover:text-primary transition-all">Flight Search</button>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span className="text-primary font-black">Live Flight Tracking</span>
               </nav>
               <div className="flex items-center gap-4 px-6 py-2 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm animate-in zoom-in duration-700">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Transponder Signal DJ-102: Active
               </div>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 border-b border-navy-100 pb-10">
               <div className="space-y-2">
                  <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">Flight DJ-102</h1>
                  <p className="text-navy-400 font-bold text-lg italic uppercase tracking-wider">New York (JFK) <span className="text-primary mx-2">→</span> London (LHR Terminal)</p>
               </div>
               <div className="flex gap-4">
                  <div className="text-right">
                     <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest mb-1">Operational State</p>
                     <p className="text-xl font-black text-navy-950 uppercase">In Flight</p>
                  </div>
                  <div className="h-12 w-px bg-navy-100 hidden sm:block mx-4" />
                  <div className="text-right">
                     <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest mb-1">Equipment Profile</p>
                     <p className="text-xl font-black text-primary uppercase">Embraer ERJ-120</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Progress Visualization */}
         <div className="bg-navy-950 rounded-[4rem] p-12 lg:p-20 text-white relative overflow-hidden shadow-2xl shadow-navy-950/20 group">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-[10s]" style={{ backgroundImage: "radial-gradient(#137fec 2px, transparent 2px)", backgroundSize: "40px 40px" }}></div>

            <div className="relative z-10 space-y-20">
               <div className="flex justify-between items-center relative">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/5 overflow-hidden rounded-full">
                     <div className="absolute left-0 h-full bg-primary shadow-[0_0_15px_rgba(19,127,236,0.8)]" style={{ width: '64%' }}></div>
                     <div className="absolute left-[64%] h-full w-20 bg-gradient-to-r from-primary to-transparent animate-progress-fast"></div>
                  </div>

                  <div className="relative flex flex-col items-center gap-4 group/node">
                     <div className="size-16 rounded-[2rem] bg-navy-900 border-2 border-primary/20 flex items-center justify-center shadow-xl group-hover/node:scale-110 transition-transform group-hover/node:border-primary">
                        <span className="material-symbols-outlined text-3xl text-primary font-black">flight_takeoff</span>
                     </div>
                     <div className="text-center">
                        <span className="text-3xl font-black tracking-tighter">JFK</span>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1">Terminal 4</p>
                     </div>
                  </div>

                  <div className="absolute left-[64%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                     <div className="size-14 rounded-full bg-primary flex items-center justify-center shadow-[0_0_40px_rgba(19,127,236,0.6)] border-4 border-navy-950 animate-pulse">
                        <span className="material-symbols-outlined text-2xl font-black rotate-90">flight</span>
                     </div>
                     <div className="mt-4 px-4 py-1.5 rounded-xl bg-navy-900/80 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest shadow-2xl">
                        ALT: 38,000 FT
                     </div>
                  </div>

                  <div className="relative flex flex-col items-center gap-4 group/node">
                     <div className="size-16 rounded-[2rem] bg-navy-900 border-2 border-white/5 flex items-center justify-center shadow-xl group-hover/node:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-3xl text-white/20 font-black">flight_land</span>
                     </div>
                     <div className="text-center">
                        <span className="text-3xl font-black tracking-tighter text-white/30">LHR</span>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1">Terminal 2</p>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-12 pt-10 border-t border-white/5">
                  {[
                     { lbl: 'Ground Velocity', val: '542 KTS', icon: 'speed' },
                     { lbl: 'Range to Target', val: '1,420 NM', icon: 'alt_route' },
                     { lbl: 'Est. Block Time', val: '06:45 AM', icon: 'schedule', color: 'text-primary' },
                     { lbl: 'Punctuality', val: 'On Time', icon: 'verified', color: 'text-emerald-400' }
                  ].map((m, i) => (
                     <div key={i} className="space-y-4 group/item">
                        <div className="flex items-center gap-3 opacity-40 group-hover/item:opacity-100 transition-opacity">
                           <span className="material-symbols-outlined text-xl">{m.icon}</span>
                           <span className="text-[10px] font-black uppercase tracking-widest">{m.lbl}</span>
                        </div>
                        <p className={`text-2xl font-black tracking-tight ${m.color || ''}`}>{m.val}</p>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            <div className="xl:col-span-8 space-y-10">
               <div className="bg-white rounded-[3.5rem] border border-navy-100 p-10 shadow-sm space-y-12">
                  <div className="flex items-center justify-between border-b border-navy-50 pb-8">
                     <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight flex items-center gap-4">
                        <span className="material-symbols-outlined text-primary p-2 bg-primary/5 rounded-2xl shadow-inner font-black">terminal</span>
                        Airport Activity
                     </h3>
                     <span className="text-[10px] font-black text-navy-300 uppercase tracking-widest">Live Tracking Feed</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16 px-4">
                     <div className="space-y-8">
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] flex items-center gap-3">
                           <span className="size-2 rounded-full bg-navy-200"></span>
                           Departure Manifest
                        </p>
                        <div className="space-y-6">
                           <div className="flex justify-between items-end border-b border-navy-50 pb-4">
                              <span className="text-xs font-black text-navy-950 uppercase">Gate</span>
                              <span className="text-2xl font-black text-primary tracking-tighter">B42</span>
                           </div>
                           <div className="flex justify-between items-end border-b border-navy-50 pb-4">
                              <span className="text-xs font-black text-navy-950 uppercase">Off-Block Actual</span>
                              <span className="text-lg font-black text-navy-900 uppercase">18:30 (Verified)</span>
                           </div>
                           <div className="flex justify-between items-end border-b border-navy-50 pb-4">
                              <span className="text-xs font-black text-navy-950 uppercase">Terminal</span>
                              <span className="text-lg font-black text-navy-900 uppercase">JFK-T4</span>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-8">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-3">
                           <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                           Arrival Analytics
                        </p>
                        <div className="space-y-6">
                           <div className="flex justify-between items-end border-b border-navy-50 pb-4">
                              <span className="text-xs font-black text-navy-950 uppercase">Assigned Gate</span>
                              <span className="text-2xl font-black text-primary tracking-tighter">C12</span>
                           </div>
                           <div className="flex justify-between items-end border-b border-navy-50 pb-4">
                              <span className="text-xs font-black text-navy-950 uppercase">Baggage Carousel</span>
                              <span className="text-lg font-black text-navy-900 uppercase">Gate 04</span>
                           </div>
                           <div className="flex justify-between items-end border-b border-navy-50 pb-4">
                              <span className="text-xs font-black text-navy-950 uppercase">Passport Congestion</span>
                              <span className="text-sm font-black text-emerald-600 uppercase">Nominal Flow</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-[3.5rem] border border-navy-100 p-10 shadow-sm group hover:shadow-xl transition-all">
                  <div className="flex items-center gap-6 mb-10">
                     <div className="size-16 rounded-[1.75rem] bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-3xl font-black">wb_cloudy</span>
                     </div>
                     <div>
                        <h4 className="text-xl font-black text-navy-950 uppercase tracking-tight leading-none">Destination Weather</h4>
                        <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mt-2 opacity-60 italic">Live feed from London Heathrow Weather Station</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                     {[
                        { lbl: 'Temperature', val: '12°C', icon: 'thermostat' },
                        { lbl: 'Wind Vector', val: '14 KTS NW', icon: 'air' },
                        { lbl: 'Visibility', val: '10+ NM', icon: 'visibility' },
                        { lbl: 'Cloud Cover', val: 'Overcast', icon: 'cloud' }
                     ].map((w, i) => (
                        <div key={i} className="p-6 bg-navy-50/50 rounded-3xl border border-navy-50 flex flex-col gap-3 group/w hover:bg-white hover:shadow-md transition-all">
                           <span className="material-symbols-outlined text-navy-300 group-hover/w:text-primary transition-colors">{w.icon}</span>
                           <div>
                              <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest">{w.lbl}</p>
                              <p className="text-lg font-black text-navy-950 uppercase tracking-tight">{w.val}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="xl:col-span-4 space-y-10">
               <div className="bg-navy-950 rounded-[3rem] p-10 text-white space-y-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5"><span className="material-symbols-outlined text-[120px] font-black">campaign</span></div>
                  <div className="space-y-4 relative z-10">
                     <h3 className="text-xl font-black uppercase tracking-[0.25em] text-primary">Flight Alerts</h3>
                     <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">Authorize real-time SMS alerts for gate changes and schedule updates.</p>
                  </div>

                  <div className="space-y-6 relative z-10">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest block px-1">Authorized Contact</label>
                        <input className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-sm font-black text-white focus:ring-4 focus:ring-primary/20 outline-none" placeholder="EMAIL@EXAMPLE.COM" />
                     </div>
                     <button onClick={action('Enable Live Tracking — action triggered', 'info')} className="w-full py-5 bg-primary text-white font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl shadow-xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all">Enable Live Tracking</button>
                  </div>
               </div>

               <div className="bg-white rounded-[3rem] border border-navy-100 p-8 shadow-sm space-y-8 group hover:shadow-xl transition-all">
                  <div className="flex items-center gap-6">
                     <div className="size-14 rounded-2xl bg-navy-50 flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-2xl font-black">hub</span>
                     </div>
                     <div className="space-y-1">
                        <p className="text-sm font-black text-navy-950 uppercase tracking-tight">Fleet Asset Profile</p>
                        <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest opacity-60">N-789-DB • {BRAND.shortName} Fleet</p>
                     </div>
                  </div>
                  <div className="space-y-4">
                     {[
                        { lbl: 'Cabin Config', val: '3-Class Layout' },
                        { lbl: 'Engines', val: 'GEnx-1B x2' },
                        { lbl: 'Wi-Fi', val: 'High-Speed Active' }
                     ].map((f, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest py-3 border-b border-navy-50 last:border-0">
                           <span className="text-navy-300">{f.lbl}</span>
                           <span className="text-navy-950">{f.val}</span>
                        </div>
                     ))}
                  </div>
                  <button
                     onClick={() => setSpecModalOpen(true)}
                     className="w-full py-4 bg-navy-50 text-navy-700 font-black uppercase text-[9px] tracking-[0.25em] rounded-2xl border border-navy-100 hover:text-primary hover:border-primary transition-all hover:shadow-lg active:scale-[0.98]"
                  >
                     View Full Specifications
                  </button>
               </div>
            </div>
         </div>

         {/* Fleet Specification Modal */}
         <FleetSpecModal open={specModalOpen} onClose={() => setSpecModalOpen(false)} />
      </div>
   );
};

export default FlightTrackerResults;
