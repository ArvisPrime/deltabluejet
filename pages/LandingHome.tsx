
import React, { useState, useRef, useEffect } from 'react';
import { Page } from '../types';

interface LandingHomeProps {
  onBookingStart: () => void;
  onCheckinStart: () => void;
  onManageBookingStart: () => void;
  onFlightStatusStart: () => void;
  onDestinationsStart: () => void;
  onAdminAccess: () => void;
  onNavigate?: (page: Page) => void;
}

const LandingHome: React.FC<LandingHomeProps> = ({ 
  onBookingStart, 
  onCheckinStart, 
  onManageBookingStart, 
  onFlightStatusStart,
  onDestinationsStart,
  onAdminAccess,
  onNavigate
}) => {
  const [fromNode, setFromNode] = useState('New York (JFK)');
  const [toNode, setToNode] = useState('London (LHR)');
  const [tripType, setTripType] = useState<'round-trip' | 'one-way'>('round-trip');
  const [departureDate, setDepartureDate] = useState('2024-11-15');
  const [returnDate, setReturnDate] = useState('2024-11-22');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [cabinClass, setCabinClass] = useState('Economy');
  const [showPaxDropdown, setShowPaxDropdown] = useState(false);
  const paxRef = useRef<HTMLDivElement>(null);

  // Handle click outside for passenger dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (paxRef.current && !paxRef.current.contains(event.target as Node)) {
        setShowPaxDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwap = () => {
    setFromNode(toNode);
    setToNode(fromNode);
  };

  const totalPax = adults + children;

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-navy-950 overflow-x-hidden">
      {/* Public Navigation Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 px-6 py-4 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-3 font-black text-2xl tracking-tighter text-navy-950 uppercase cursor-pointer group">
              <div className="size-9 bg-primary rounded-tr-xl rounded-bl-xl shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform" />
              Deltablue<span className="text-primary font-black">Air</span>
            </div>
            <nav className="hidden lg:flex items-center gap-8">
              <button onClick={onDestinationsStart} className="text-[10px] font-black uppercase tracking-widest text-navy-400 hover:text-primary transition-colors">Destinations</button>
              <button onClick={onFlightStatusStart} className="text-[10px] font-black uppercase tracking-widest text-navy-400 hover:text-primary transition-colors">Flight Status</button>
              <button onClick={onCheckinStart} className="text-[10px] font-black uppercase tracking-widest text-navy-400 hover:text-primary transition-colors">Check-in</button>
              <button onClick={onManageBookingStart} className="text-[10px] font-black uppercase tracking-widest text-navy-400 hover:text-primary transition-colors">My Trips</button>
              <button className="text-[10px] font-black uppercase tracking-widest text-navy-400 hover:text-primary transition-colors">Deltablue Club</button>
            </nav>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => onNavigate?.(Page.ACCOUNT_SETTINGS)}
              className="bg-primary text-white text-[10px] font-black px-6 py-2.5 rounded-xl uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">account_circle</span>
              My Account
            </button>
          </div>
        </div>
      </header>

      {/* Cinematic Hero Section */}
      <section className="relative min-h-[95vh] flex flex-col items-center justify-center p-4 md:p-10 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950/70 via-navy-900/20 to-white z-10"></div>
          <div 
            className="w-full h-full bg-cover bg-center animate-slow-zoom scale-110" 
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&q=80')" }} 
          />
        </div>

        <div className="relative z-20 w-full max-w-7xl mx-auto mt-16">
          <div className="flex flex-col items-center text-center space-y-10 mb-16 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="inline-flex items-center gap-2 px-6 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl">
               <span className="material-symbols-outlined text-sm text-primary">auto_awesome</span>
               Redefining Global Transit
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white leading-[0.8] tracking-tighter uppercase drop-shadow-2xl">
              Unrivaled <br/><span className="text-primary">Horizons</span>
            </h1>
          </div>

          {/* Elevated Booking Card */}
          <div className="bg-white/95 backdrop-blur-3xl rounded-[3.5rem] shadow-[0_60px_100px_-20px_rgba(0,0,0,0.5)] p-8 md:p-10 border border-white relative group animate-in zoom-in duration-700 delay-300">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-primary shadow-[0_0_20px_rgba(19,127,236,0.8)]"></div>
            
            {/* Trip Type Selector */}
            <div className="flex gap-2 mb-8 bg-navy-50/50 w-fit p-1 rounded-2xl border border-navy-100 shadow-inner">
               <button 
                 onClick={() => setTripType('round-trip')}
                 className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tripType === 'round-trip' ? 'bg-white text-navy-950 shadow-md border border-navy-100' : 'text-navy-400 hover:text-navy-700'}`}
               >
                 Round Trip
               </button>
               <button 
                 onClick={() => setTripType('one-way')}
                 className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tripType === 'one-way' ? 'bg-white text-navy-950 shadow-md border border-navy-100' : 'text-navy-400 hover:text-navy-700'}`}
               >
                 One Way
               </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              {/* Locations */}
              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-center relative">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest ml-2">Origin Hub</label>
                  <div className="relative group/field">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-navy-300 group-focus-within/field:text-primary transition-colors">flight_takeoff</span>
                    <input className="w-full h-16 pl-14 pr-4 bg-navy-50 border-none rounded-2xl text-navy-950 font-black uppercase tracking-tighter focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" value={fromNode} onChange={(e) => setFromNode(e.target.value)} />
                  </div>
                </div>
                <button onClick={handleSwap} className="hidden sm:flex size-11 items-center justify-center rounded-full bg-white border-2 border-navy-50 text-navy-300 hover:text-primary transition-all shadow-md -ml-5 -mr-5 z-10 hover:scale-110 active:rotate-180 duration-500"><span className="material-symbols-outlined text-xl">swap_horiz</span></button>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest ml-2">Arrival Target</label>
                  <div className="relative group/field">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-navy-300 group-focus-within/field:text-primary transition-colors">flight_land</span>
                    <input className="w-full h-16 pl-14 pr-4 bg-navy-50 border-none rounded-2xl text-navy-950 font-black uppercase tracking-tighter focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" value={toNode} onChange={(e) => setToNode(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className={`lg:col-span-3 grid ${tripType === 'round-trip' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest ml-2">Departure</label>
                  <input 
                    type="date" 
                    className="w-full h-16 px-6 bg-navy-50 border-none rounded-2xl font-black text-navy-950 uppercase text-xs focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" 
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                  />
                </div>
                {tripType === 'round-trip' && (
                  <div className="space-y-3 animate-in slide-in-from-left-4 duration-500">
                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest ml-2">Return</label>
                    <input 
                      type="date" 
                      className="w-full h-16 px-6 bg-navy-50 border-none rounded-2xl font-black text-navy-950 uppercase text-xs focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" 
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Personnel Selector */}
              <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
                 <div className="space-y-3 relative" ref={paxRef}>
                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest ml-2">Personnel Profile</label>
                    <button 
                      onClick={() => setShowPaxDropdown(!showPaxDropdown)}
                      className="w-full h-16 px-8 bg-navy-50 rounded-2xl border-none text-left flex items-center justify-between group/sel hover:shadow-md transition-all shadow-inner"
                    >
                       <span className="text-sm font-black text-navy-950 uppercase tracking-tighter">{totalPax} {totalPax === 1 ? 'Adult' : 'Pax'}, {cabinClass}</span>
                       <span className={`material-symbols-outlined text-navy-300 group-hover/sel:text-primary transition-transform ${showPaxDropdown ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>

                    {showPaxDropdown && (
                      <div className="absolute bottom-full mb-4 left-0 w-full min-w-[300px] bg-white rounded-[2rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] border border-navy-100 p-8 z-50 animate-in slide-in-from-bottom-4 duration-300 backdrop-blur-xl">
                        <div className="space-y-8">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <p className="text-sm font-black text-navy-950 uppercase tracking-tight">Adults</p>
                              <p className="text-[8px] font-bold text-navy-300 uppercase tracking-widest">Age 12+</p>
                            </div>
                            <div className="flex items-center gap-4 bg-navy-50 p-1.5 rounded-xl border border-navy-100 shadow-inner">
                              <button onClick={() => setAdults(Math.max(1, adults - 1))} className="size-8 flex items-center justify-center rounded-lg bg-white shadow-sm text-navy-400 hover:text-primary transition-all active:scale-90"><span className="material-symbols-outlined text-sm font-black">remove</span></button>
                              <span className="w-6 text-center text-xs font-black text-navy-950">{adults}</span>
                              <button onClick={() => setAdults(Math.min(9, adults + 1))} className="size-8 flex items-center justify-center rounded-lg bg-white shadow-sm text-navy-400 hover:text-primary transition-all active:scale-90"><span className="material-symbols-outlined text-sm font-black">add</span></button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <p className="text-sm font-black text-navy-950 uppercase tracking-tight">Children</p>
                              <p className="text-[8px] font-bold text-navy-300 uppercase tracking-widest">Age 2-11</p>
                            </div>
                            <div className="flex items-center gap-4 bg-navy-50 p-1.5 rounded-xl border border-navy-100 shadow-inner">
                              <button onClick={() => setChildren(Math.max(0, children - 1))} className="size-8 flex items-center justify-center rounded-lg bg-white shadow-sm text-navy-400 hover:text-primary transition-all active:scale-90"><span className="material-symbols-outlined text-sm font-black">remove</span></button>
                              <span className="w-6 text-center text-xs font-black text-navy-950">{children}</span>
                              <button onClick={() => setChildren(Math.min(9, children + 1))} className="size-8 flex items-center justify-center rounded-lg bg-white shadow-sm text-navy-400 hover:text-primary transition-all active:scale-90"><span className="material-symbols-outlined text-sm font-black">add</span></button>
                            </div>
                          </div>
                          <hr className="border-navy-50" />
                          <div className="space-y-4">
                            <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest px-1">Service Protocol</p>
                            <div className="grid grid-cols-2 gap-2">
                               {['Economy', 'Premium', 'Business', 'Executive'].map(c => (
                                 <button 
                                   key={c}
                                   onClick={() => setCabinClass(c)}
                                   className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${cabinClass === c ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-navy-50 text-navy-400 hover:bg-navy-100'}`}
                                 >
                                   {c}
                                 </button>
                               ))}
                            </div>
                          </div>
                          <button onClick={() => setShowPaxDropdown(false)} className="w-full py-4 bg-navy-950 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-xl hover:bg-black transition-all">Apply Selection</button>
                        </div>
                      </div>
                    )}
                 </div>
                 <button onClick={onBookingStart} className="h-16 px-12 bg-primary text-white font-black uppercase tracking-[0.3em] text-xs rounded-2xl shadow-[0_20px_40px_-10px_rgba(19,127,236,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 group/btn">
                    Explore <span className="material-symbols-outlined group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                 </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Network Ticker */}
      <div className="bg-navy-950 py-6 overflow-hidden whitespace-nowrap relative border-y border-white/5 shadow-2xl">
         <div className="flex animate-scroll-text items-center gap-24">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-24">
                 <div className="flex items-center gap-4 text-white/40 text-[11px] font-black uppercase tracking-[0.5em]"><span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,1)] animate-pulse"></span>ACTIVE FLEET TELEMETRY: NORMAL</div>
                 <div className="flex items-center gap-4 text-white/40 text-[11px] font-black uppercase tracking-[0.5em]"><span className="material-symbols-outlined text-primary text-xl">hub</span>GLOBAL HUB NODES: 42 ONLINE</div>
                 <div className="flex items-center gap-4 text-white/40 text-[11px] font-black uppercase tracking-[0.5em]"><span className="material-symbols-outlined text-primary text-xl">public</span>NETWORK COVERAGE: 182 STATIONS</div>
                 <div className="flex items-center gap-4 text-white/40 text-[11px] font-black uppercase tracking-[0.5em]"><span className="material-symbols-outlined text-amber-500 text-xl">loyalty</span>MEMBER DISPATCH: 124K ACTIVE</div>
              </div>
            ))}
         </div>
      </div>

      {/* Featured Collections / Promotions */}
      <section className="py-32 px-6 md:px-12 bg-white">
         <div className="max-w-7xl mx-auto space-y-16">
            <div className="flex flex-col md:flex-row justify-between items-end gap-10">
               <div className="space-y-6">
                  <p className="text-primary font-black uppercase tracking-[0.4em] text-xs">Curated Collections</p>
                  <h2 className="text-4xl md:text-6xl font-black text-navy-950 tracking-tighter uppercase leading-[0.9]">Experience <br/><span className="text-navy-300">Absolute Luxury.</span></h2>
               </div>
               <button className="px-12 py-5 bg-navy-950 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-[1.5rem] shadow-2xl hover:bg-black transition-all">View All Offers</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               {/* Large Promo 1 */}
               <div className="group relative h-[600px] rounded-[4rem] overflow-hidden shadow-2xl transition-all duration-700 cursor-pointer" onClick={onBookingStart}>
                  <div className="absolute inset-0 bg-navy-950/20 group-hover:bg-navy-950/10 transition-colors z-10" />
                  <div className="w-full h-full bg-cover bg-center transition-transform duration-[10s] group-hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544321689-d499ec24467c?auto=format&fit=crop&q=80')" }} />
                  <div className="absolute bottom-0 left-0 w-full p-12 z-20 text-white space-y-6">
                     <span className="px-5 py-2 rounded-full bg-white/20 backdrop-blur-xl border border-white/20 text-[10px] font-black uppercase tracking-widest">Seasonal Feature</span>
                     <div className="space-y-2">
                        <h3 className="text-5xl font-black tracking-tighter uppercase leading-none">Winter in The Maldives</h3>
                        <p className="text-xl font-medium italic opacity-80 max-w-lg leading-relaxed uppercase tracking-wider">Escape the cold with our non-stop executive registry nodes.</p>
                     </div>
                     <button className="px-10 py-5 bg-white text-navy-950 font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-2xl transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">Initialise Booking</button>
                  </div>
               </div>
               
               {/* Grid of smaller promos */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { title: 'The London Hub', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80', tag: 'City Hub', price: '$450' },
                    { title: 'Tokyo Neons', img: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80', tag: 'Asia Corridor', price: '$820' },
                    { title: 'Dubai Luxury', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80', tag: 'Executive Station', price: '$610' },
                    { title: 'Parisian Spring', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80', tag: 'Europe Registry', price: '$490' }
                  ].map((p, i) => (
                    <div key={i} onClick={onBookingStart} className="group relative h-full min-h-[280px] rounded-[3rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all cursor-pointer">
                       <div className="absolute inset-0 bg-navy-950/40 group-hover:bg-navy-950/20 transition-colors z-10" />
                       <div className="w-full h-full bg-cover bg-center transition-transform duration-[6s] group-hover:scale-110" style={{ backgroundImage: `url('${p.img}')` }} />
                       <div className="absolute bottom-0 left-0 w-full p-8 z-20 text-white">
                          <p className="text-[8px] font-black text-primary uppercase tracking-[0.4em] mb-2">{p.tag}</p>
                          <h4 className="text-xl font-black uppercase tracking-tight mb-4">{p.title}</h4>
                          <div className="flex items-center justify-between border-t border-white/10 pt-4">
                             <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Fares from</span>
                             <span className="text-lg font-black tracking-tighter">{p.price}</span>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </section>

      {/* Immersive Destination Carousel Logic (Grid) */}
      <section className="py-32 px-6 md:px-12 bg-navy-50/50">
         <div className="max-w-7xl mx-auto space-y-20">
            <div className="text-center space-y-6">
               <p className="text-primary font-black uppercase tracking-[0.5em] text-xs">Global Network</p>
               <h2 className="text-5xl md:text-7xl font-black text-navy-950 tracking-tighter uppercase leading-none">New Stations <br/><span className="text-navy-300">Added Daily.</span></h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
               {[
                 { city: 'Accra', country: 'Ghana', airport: 'ACC', img: 'https://images.unsplash.com/photo-1591129841117-3adfd313e34f?auto=format&fit=crop&q=80', desc: 'Commercial nexus of West Africa.' },
                 { city: 'Banjul', country: 'The Gambia', airport: 'BJL', img: 'https://images.unsplash.com/photo-1544321689-d499ec24467c?auto=format&fit=crop&q=80', desc: 'Serene coastal eco-tourism hub.' },
                 { city: 'Dhaka', country: 'Bangladesh', airport: 'DAC', img: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80', desc: 'Strategic node for global trade.' },
                 { city: 'Lagos', country: 'Nigeria', airport: 'LOS', img: 'https://images.unsplash.com/photo-1618833162734-722649666014?auto=format&fit=crop&q=80', desc: 'The pulse of African industry.' }
               ].map((dest, i) => (
                 <div key={i} onClick={onDestinationsStart} className="bg-white rounded-[4rem] border border-navy-100 shadow-sm overflow-hidden group hover:shadow-2xl hover:border-primary/40 transition-all duration-700 cursor-pointer flex flex-col">
                    <div className="aspect-[4/5] relative overflow-hidden">
                       <div className="absolute inset-0 bg-navy-950/10 group-hover:bg-transparent transition-colors z-10" />
                       <div className="w-full h-full bg-cover bg-center transition-transform duration-[8s] group-hover:scale-110" style={{ backgroundImage: `url('${dest.img}')` }} />
                       <div className="absolute top-8 right-8 z-20">
                          <span className="px-4 py-1.5 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[9px] font-black uppercase tracking-widest shadow-2xl">
                             NODE: {dest.airport}
                          </span>
                       </div>
                    </div>
                    <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
                       <div className="space-y-2">
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{dest.country}</p>
                          <h3 className="text-3xl font-black text-navy-950 uppercase tracking-tighter leading-none">{dest.city}</h3>
                          <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mt-4 leading-relaxed italic opacity-70 group-hover:opacity-100 transition-opacity">
                             {dest.desc}
                          </p>
                       </div>
                       <button className="w-full py-4 border-2 border-navy-50 text-navy-950 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-primary hover:text-white hover:border-primary transition-all">Explore Station</button>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Club Membership Promo Section */}
      <section className="py-32 px-6 md:px-12 bg-navy-950 relative overflow-hidden group">
         <div className="absolute inset-0 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-[20s]" style={{ backgroundImage: "radial-gradient(#137fec 2px, transparent 2px)", backgroundSize: "60px 60px" }}></div>
         <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20 items-center relative z-10">
            <div className="lg:col-span-7 space-y-12 animate-in fade-in slide-in-from-left-10 duration-1000">
               <div className="space-y-6">
                  <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-[0.4em] shadow-xl">
                     <span className="material-symbols-outlined text-sm animate-pulse">loyalty</span>
                     Priority Personnel Access
                  </div>
                  <h2 className="text-6xl md:text-8xl font-black text-white leading-none tracking-tighter uppercase">The <span className="text-primary underline underline-offset-[20px] decoration-white/10">Club</span> <br/>Registry.</h2>
                  <p className="text-2xl text-navy-100 font-medium leading-relaxed italic uppercase tracking-widest opacity-60 max-w-2xl">
                     Join the elite circle of global explorers. Secure advanced seat node allocation, priority terminal dispatch, and exclusive operational benefits.
                  </p>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
                  {[
                    { lbl: 'Lounge Hubs', val: '42' },
                    { lbl: 'Priority Nodes', val: '98%' },
                    { lbl: 'Bonus Miles', val: '2.5X' }
                  ].map((m, i) => (
                    <div key={i} className="space-y-2 border-l-2 border-primary/30 pl-8">
                       <p className="text-4xl font-black text-white tracking-tighter uppercase">{m.val}</p>
                       <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{m.lbl}</p>
                    </div>
                  ))}
               </div>

               <div className="flex flex-col sm:flex-row gap-6 pt-6">
                  <button className="px-16 py-6 bg-primary text-white font-black uppercase tracking-[0.3em] text-xs rounded-2xl shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all">Initialise Membership</button>
                  <button className="px-12 py-6 bg-white/10 border border-white/20 text-white font-black uppercase tracking-[0.3em] text-xs rounded-2xl hover:bg-white/20 transition-all">View All Benefits</button>
               </div>
            </div>

            <div className="lg:col-span-5 relative group/card">
               <div className="absolute inset-0 bg-primary/20 blur-[100px] group-hover/card:bg-primary/40 transition-all animate-pulse"></div>
               <div className="relative bg-white rounded-[4rem] p-12 shadow-2xl border border-white flex flex-col gap-10 transform rotate-2 group-hover/card:rotate-0 transition-transform duration-700">
                  <div className="flex justify-between items-start">
                     <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-navy-950 text-primary flex items-center justify-center shadow-xl">
                           <span className="material-symbols-outlined text-3xl font-black">airlines</span>
                        </div>
                        <div>
                           <p className="text-navy-950 font-black text-xl uppercase tracking-tighter">Deltablue Club</p>
                           <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mt-1">Black Diamond Tier</p>
                        </div>
                     </div>
                     <span className="material-symbols-outlined text-navy-200 text-4xl">contactless</span>
                  </div>
                  <div className="py-8 space-y-4">
                     <p className="text-xs font-black text-navy-300 uppercase tracking-[0.4em]">Personnel Node</p>
                     <p className="text-4xl font-black text-navy-950 tracking-tighter uppercase">MARCUS CHEN</p>
                  </div>
                  <div className="flex justify-between items-end pt-8 border-t border-navy-50">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black text-navy-200 uppercase tracking-widest">Master Reference</p>
                        <p className="text-lg font-black text-navy-950 uppercase tracking-widest">8823 4421 9012</p>
                     </div>
                     <div className="text-right space-y-1">
                        <p className="text-[8px] font-black text-navy-200 uppercase tracking-widest">Registry Exp</p>
                        <p className="text-lg font-black text-navy-950 uppercase tracking-widest">12 / 28</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Global Brand Footer */}
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
              { title: 'Operations Hub', links: ['Book a Sequence', 'Fleet Telemetry', 'Trip Registry', 'Node Rewards'] },
              { title: 'Personnel Registry', links: ['Deltablue Club', 'My Identity Node', 'Career Stations', 'Master Policy'] },
              { title: 'Station Support', links: ['Dispatch Help', 'Baggage Logic', 'Accessible Transit', 'Data Governance'] }
            ].map((col, i) => (
              <div key={i} className="space-y-12">
                 <h4 className="text-xs font-black text-navy-950 uppercase tracking-[0.4em] border-b-2 border-primary/10 pb-6 w-fit">{col.title}</h4>
                 <ul className="space-y-5">
                    {col.links.map(link => (
                      <li key={link}>
                         <button onClick={() => {
                           if(link === 'Trip Registry') onManageBookingStart();
                           if(link === 'Book a Sequence') onBookingStart();
                         }} className="text-sm font-bold text-navy-400 uppercase tracking-widest hover:text-primary transition-colors italic group flex items-center gap-2">
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
               <button onClick={onAdminAccess} className="text-primary font-black">Staff Terminal Login</button>
            </div>
         </div>
      </footer>

      {/* Floating Network Status */}
      <div className="fixed bottom-10 right-10 z-50 animate-in slide-in-from-right duration-1000">
         <div className="bg-navy-950/90 backdrop-blur-xl border border-white/10 px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-6 group hover:scale-105 transition-all cursor-help">
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

export default LandingHome;
