
import React from 'react';
import { Page } from '../types';

interface BookingDetailProps {
  onNavigate: (page: Page) => void;
}

const BookingDetail: React.FC<BookingDetailProps> = ({ onNavigate }) => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 font-display pb-32 bg-white/10 min-h-screen">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">
        <button onClick={() => onNavigate(Page.HOME_LANDING)} className="hover:text-primary transition-all">Home Hub</button>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-primary">Trip Mission Summary</span>
      </nav>

      {/* Page Heading & Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
             <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">London Heathrow (LHR)</h1>
             <span className="px-5 py-1.5 rounded-full bg-navy-950 text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-lg">In Production</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-navy-400 font-bold text-xs uppercase tracking-widest">
            <p className="flex items-center gap-2">Reference: <span className="text-navy-950 font-black select-all">XYZ123</span> <span className="material-symbols-outlined text-navy-200 text-sm">content_copy</span></p>
            <span className="size-1.5 rounded-full bg-navy-100"></span>
            <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black">
              <span className="material-symbols-outlined text-sm">check_circle</span> Registry Confirmed
            </div>
          </div>
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
          <button className="flex-1 lg:flex-none h-14 px-10 rounded-[1.5rem] bg-white border-2 border-navy-100 text-navy-700 text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 transition-all shadow-sm flex items-center justify-center gap-3">
            <span className="material-symbols-outlined text-xl">share</span> Dispatch Link
          </button>
          <button 
            onClick={() => onNavigate(Page.CHECKIN_RETRIEVAL)}
            className="flex-1 lg:flex-none h-14 px-12 rounded-[1.5rem] bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 transition-all flex items-center justify-center gap-4"
          >
            <span className="material-symbols-outlined text-2xl font-black">hub</span> Online Check-in
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* Left Column: Itinerary and Passengers */}
        <div className="xl:col-span-8 space-y-12">
          
          {/* Flight Itinerary Card */}
          <div className="bg-white rounded-[4rem] border border-navy-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] overflow-hidden group relative">
            <div className="px-12 py-8 border-b border-navy-50 flex justify-between items-center bg-navy-50/20">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                <span className="material-symbols-outlined text-primary font-black">flight</span> Mission Protocol
              </h2>
              <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Departure Node: Oct 24, 2024</span>
            </div>
            <div className="p-16 space-y-16">
              <div className="flex flex-col md:flex-row gap-12 md:items-center">
                <div className="flex flex-col min-w-[160px]">
                  <span className="text-6xl font-black text-navy-950 tracking-tighter">18:00</span>
                  <span className="text-2xl font-black text-primary uppercase mt-2">JFK</span>
                  <span className="text-[11px] font-bold text-navy-400 uppercase tracking-widest mt-1">New York Hub</span>
                  <span className="text-[9px] font-black text-navy-200 uppercase tracking-[0.25em] mt-3">T-4 Departure Node</span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-6 relative min-h-[100px]">
                  <div className="w-full h-0.5 bg-navy-100 relative flex items-center justify-center">
                    <div className="absolute left-0 size-3 rounded-full bg-primary ring-8 ring-white shadow-lg"></div>
                    <div className="absolute right-0 size-3 rounded-full bg-primary ring-8 ring-white shadow-lg"></div>
                    <div className="absolute left-[42%] bg-navy-950 p-4 rounded-[2rem] text-primary z-10 shadow-2xl group-hover:scale-110 group-hover:rotate-45 transition-all duration-700 ring-4 ring-white">
                      <span className="material-symbols-outlined rotate-90 text-3xl block font-black">flight</span>
                    </div>
                  </div>
                  <div className="mt-12 flex flex-col items-center gap-2">
                     <span className="text-[10px] font-black text-navy-400 uppercase tracking-[0.4em]">DJ 402 • 6h 30m Sequence</span>
                     <span className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100">Live: On Schedule</span>
                  </div>
                </div>

                <div className="flex flex-col text-right min-w-[160px]">
                  <span className="text-6xl font-black text-navy-950 tracking-tighter">06:30<sup className="text-xl font-black text-primary ml-1">+1</sup></span>
                  <span className="text-2xl font-black text-primary uppercase mt-2">LHR</span>
                  <span className="text-[11px] font-bold text-navy-400 uppercase tracking-widest mt-1">London Terminal</span>
                  <span className="text-[9px] font-black text-navy-200 uppercase tracking-[0.25em] mt-3">Target Arrival Hub</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pt-12 border-t border-navy-50">
                 {[
                   { icon: 'airline_seat_recline_extra', lbl: 'Protocol Class', val: 'Executive Flex' },
                   { icon: 'luggage', lbl: 'Baggage Logic', val: '2x 23kg Active' },
                   { icon: 'lunch_dining', lbl: 'Culinary Tier', val: 'Full Selection' },
                   { icon: 'wifi', lbl: 'Network Link', val: 'Hub-1 HighSpeed' }
                 ].map((d, i) => (
                   <div key={i} className="space-y-1 group/item">
                      <div className="flex items-center gap-2 text-navy-300 group-hover/item:text-primary transition-colors">
                         <span className="material-symbols-outlined text-lg">{d.icon}</span>
                         <span className="text-[9px] font-black uppercase tracking-widest">{d.lbl}</span>
                      </div>
                      <p className="text-sm font-black text-navy-950 uppercase tracking-tight">{d.val}</p>
                   </div>
                 ))}
              </div>
            </div>
          </div>

          {/* Action Grid */}
          <div className="space-y-6">
             <h3 className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] px-6">Modify Operational Sequence</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                 { label: 'Shift Route', icon: 'edit_calendar', page: Page.MODIFY_BOOKING, desc: 'Change nodes' },
                 { label: 'Asset Upgrade', icon: 'auto_awesome', page: Page.REISSUE, desc: 'Elite cabins' },
                 { label: 'Seat Manager', icon: 'grid_view', page: Page.SEAT_MAP, desc: 'Update pod' },
                 { label: 'Cancel Trip', icon: 'block', color: 'text-red-500 hover:bg-red-50 hover:border-red-100', desc: 'Registry purge' },
               ].map((act, i) => (
                 <button 
                   key={i} 
                   onClick={() => act.page && onNavigate(act.page)}
                   className={`flex flex-col items-center justify-center gap-4 p-10 rounded-[3rem] bg-white border border-navy-100 shadow-sm transition-all group hover:border-primary hover:shadow-2xl hover:-translate-y-2 ${act.color || ''}`}
                 >
                   <div className={`size-16 rounded-[1.75rem] bg-navy-50 flex items-center justify-center text-navy-400 group-hover:bg-primary group-hover:text-white transition-all shadow-inner`}>
                     <span className="material-symbols-outlined text-3xl font-black">{act.icon}</span>
                   </div>
                   <div className="text-center">
                      <span className="text-[11px] font-black text-navy-950 uppercase tracking-[0.2em]">{act.label}</span>
                      <p className="text-[8px] font-bold text-navy-300 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{act.desc}</p>
                   </div>
                 </button>
               ))}
             </div>
          </div>

          {/* Personnel Registry */}
          <div className="bg-white rounded-[4rem] border border-navy-100 shadow-sm overflow-hidden">
            <div className="px-12 py-8 border-b border-navy-50 bg-navy-50/20">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                <span className="material-symbols-outlined text-primary font-black">group</span> Personnel Manifest
              </h2>
            </div>
            <div className="divide-y divide-navy-50">
               {[
                 { name: 'Chen, Marcus', seat: '4A', tier: 'Diamond Platinum', status: 'Validated', id: 'DB-88219' },
                 { name: 'Chen, Elena', seat: '4B', tier: 'Standard Executive', status: 'Validated', id: 'DB-88220' }
               ].map((p, i) => (
                 <div key={i} className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-10 group hover:bg-navy-50/30 transition-all">
                    <div className="flex items-center gap-8">
                       <div className="size-16 rounded-[2rem] bg-navy-950 text-primary flex items-center justify-center font-black text-xl shadow-xl group-hover:scale-110 transition-transform">{p.name.charAt(0)}</div>
                       <div className="space-y-1">
                          <h4 className="text-2xl font-black text-navy-950 uppercase tracking-tight">{p.name}</h4>
                          <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest italic opacity-70">
                             ID: {p.id} • Tier: <span className="text-primary">{p.tier}</span>
                          </p>
                       </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-16">
                       <div className="space-y-1 text-center">
                          <span className="text-[8px] font-black text-navy-300 uppercase tracking-[0.3em] block">Pod Node</span>
                          <span className="text-3xl font-black text-navy-950 tracking-tighter">{p.seat}</span>
                       </div>
                       <div className="space-y-2">
                          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                             <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span> {p.status}
                          </span>
                       </div>
                       <button className="px-8 py-3 rounded-2xl border-2 border-navy-100 text-navy-700 text-[10px] font-black uppercase tracking-widest hover:border-primary hover:text-primary transition-all">Edit Registry</button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Right Column: Financial & Ancillary */}
        <div className="xl:col-span-4 space-y-10">
           {/* Financial Summary */}
           <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-2xl overflow-hidden sticky top-10">
              <div className="px-10 py-6 border-b border-navy-50 bg-navy-50/20">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">Financial Settlement</h2>
              </div>
              <div className="p-12 space-y-10">
                 <div className="space-y-6">
                    <div className="flex justify-between text-[11px] font-black text-navy-400 uppercase tracking-widest">
                       <span>Registry Segment (x2)</span>
                       <span className="text-navy-950">$1,020.00</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-black text-navy-400 uppercase tracking-widest">
                       <span>Regulatory Logic Fees</span>
                       <span className="text-navy-950">$220.50</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-black text-emerald-600 uppercase tracking-widest">
                       <span>Loyalty Credit Applied</span>
                       <span className="font-black">-$45.00</span>
                    </div>
                 </div>
                 <div className="pt-10 border-t-2 border-dashed border-navy-100 flex justify-between items-end">
                    <div className="space-y-1">
                       <span className="text-[10px] font-black text-navy-300 uppercase tracking-[0.4em]">Verified Settled</span>
                       <p className="text-5xl font-black text-navy-950 tracking-tighter leading-none">$1,195.50</p>
                    </div>
                 </div>
                 
                 <div className="bg-navy-950 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-white transition-transform group-hover:scale-110">
                       <span className="material-symbols-outlined text-[100px] font-black">receipt</span>
                    </div>
                    <div className="flex items-center gap-5 relative z-10">
                       <div className="p-3 bg-white/10 rounded-2xl border border-white/10 text-primary shadow-xl">
                          <span className="material-symbols-outlined">description</span>
                       </div>
                       <div className="space-y-1">
                          <p className="text-xs font-black text-white uppercase tracking-tight">Invoice #DJ-99211</p>
                          <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Oct 24, 2024 Dispatch</p>
                       </div>
                    </div>
                    <button className="w-full py-4 bg-white text-navy-950 font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all relative z-10">Download Station Digest</button>
                 </div>
              </div>
           </div>

           {/* In-Flight Services */}
           <div className="bg-primary/5 rounded-[3.5rem] border border-primary/10 p-10 space-y-10 group hover:shadow-xl transition-all">
              <div className="flex items-center gap-6">
                 <div className="size-16 rounded-[2rem] bg-white text-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl font-black">restaurant</span>
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight leading-tight">Culinary Selection</h3>
                    <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mt-2 opacity-70">Pre-select your inflight protocol</p>
                 </div>
              </div>
              <div className="space-y-4">
                 <button className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-white border border-navy-100 hover:border-primary transition-all group/btn shadow-sm">
                    <span className="text-[11px] font-black text-navy-700 uppercase tracking-widest group-hover/btn:text-primary">Update Meal Node</span>
                    <span className="material-symbols-outlined text-navy-200 group-hover/btn:text-primary transition-colors">fastfood</span>
                 </button>
                 <button className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-white border border-navy-100 hover:border-primary transition-all group/btn shadow-sm">
                    <span className="text-[11px] font-black text-navy-700 uppercase tracking-widest group-hover/btn:text-primary">Special Assist Logic</span>
                    <span className="material-symbols-outlined text-navy-200 group-hover/btn:text-primary transition-colors">medical_services</span>
                 </button>
              </div>
           </div>

           {/* Security Hub Notice */}
           <div className="bg-navy-50/50 p-10 rounded-[3rem] border border-navy-100 shadow-inner group">
              <div className="flex gap-6 items-start">
                 <span className="material-symbols-outlined text-navy-300 font-black p-2 bg-white rounded-xl shadow-sm">security</span>
                 <div className="space-y-3">
                    <p className="text-[11px] font-black text-navy-950 uppercase tracking-widest">Protocol Registry Hub</p>
                    <p className="text-[9px] font-bold text-navy-400 uppercase leading-relaxed tracking-wider italic opacity-70">
                       Any modifications made to this trip sequence are permanent and will decommission all previous boarding nodes. Please re-generate passes after any logical shift.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;
