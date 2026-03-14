import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { BRAND } from '../../config/brand';
import { ROUTES } from '../../config/routes';
import type { BookingDoc, FlightDoc, CheckinDoc } from '../../types/firestore';

const CheckinSuccess: React.FC = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const routerState = location.state as {
      pnr: string;
      booking: BookingDoc;
      flight: FlightDoc;
      checkinRecord: CheckinDoc;
      seatNumber: string;
      boardingGroup: string;
   } | null;

   const pnr = routerState?.pnr || '—';
   const booking = routerState?.booking;
   const flight = routerState?.flight;
   const seat = routerState?.seatNumber || '—';
   const boardingGroup = routerState?.boardingGroup || 'A';

   const handlePrint = () => window.print();

   return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-20 font-display animate-in zoom-in duration-500">
         <div className="w-full max-w-3xl space-y-12 text-center">

            {/* Success Header */}
            <div className="space-y-4">
               <div className="size-24 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-emerald-500 text-5xl">check_circle</span>
               </div>
               <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase">Check-in Complete</h1>
               <p className="text-navy-400 font-medium italic text-lg uppercase tracking-widest">
                  You are cleared for boarding on the {BRAND.shortName} network.
               </p>
            </div>

            {/* Boarding Pass Card */}
            <div className="bg-white rounded-[3rem] border border-navy-100 shadow-2xl overflow-hidden text-left">
               {/* Top band */}
               <div className="bg-navy-950 px-10 py-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="size-10 rounded-xl bg-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-xl">flight</span>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{BRAND.name}</p>
                        <p className="text-lg font-black text-white tracking-tight">{flight?.flightNumber || '—'}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Boarding Pass</p>
                     <p className="text-sm font-black text-primary uppercase tracking-widest">Group {boardingGroup}</p>
                  </div>
               </div>

               {/* Flight details grid */}
               <div className="px-10 py-8 grid grid-cols-3 gap-6">
                  <div>
                     <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">From</p>
                     <p className="text-3xl font-black text-navy-950 tracking-tighter">{booking?.origin?.code || '—'}</p>
                     <p className="text-[10px] font-bold text-navy-400">{booking?.origin?.city || ''}</p>
                  </div>
                  <div className="flex items-center justify-center">
                     <span className="material-symbols-outlined text-3xl text-primary">flight</span>
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">To</p>
                     <p className="text-3xl font-black text-navy-950 tracking-tighter">{booking?.destination?.code || '—'}</p>
                     <p className="text-[10px] font-bold text-navy-400">{booking?.destination?.city || ''}</p>
                  </div>
               </div>

               {/* Divider */}
               <div className="px-6">
                  <div className="border-t-2 border-dashed border-navy-100"></div>
               </div>

               {/* Info grid */}
               <div className="px-10 py-8 grid grid-cols-4 gap-6">
                  <div>
                     <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">PNR</p>
                     <p className="text-lg font-black text-navy-950 tracking-widest">{pnr}</p>
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Seat</p>
                     <p className="text-lg font-black text-primary">{seat}</p>
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Class</p>
                     <p className="text-lg font-black text-navy-950 uppercase">{booking?.fareClass || '—'}</p>
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Group</p>
                     <p className="text-lg font-black text-navy-950">{boardingGroup}</p>
                  </div>
               </div>

               {/* Barcode area */}
               <div className="px-10 pb-10">
                  <div className="bg-navy-50 rounded-2xl p-6 flex items-center justify-center gap-1">
                     {Array.from({ length: 40 }, (_, i) => (
                        <div
                           key={i}
                           className="bg-navy-900"
                           style={{ width: Math.random() > 0.5 ? 3 : 2, height: 48 }}
                        />
                     ))}
                  </div>
               </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
               <button
                  onClick={handlePrint}
                  className="px-10 py-4 bg-navy-950 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-navy-800 transition-all flex items-center gap-3"
               >
                  <span className="material-symbols-outlined text-sm">print</span> Print Boarding Pass
               </button>
               <button
                  onClick={() => navigate(ROUTES.HOME)}
                  className="px-10 py-4 bg-primary text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-3"
               >
                  <span className="material-symbols-outlined text-sm">home</span> Return Home
               </button>
            </div>
         </div>
      </div>
   );
};

export default CheckinSuccess;
