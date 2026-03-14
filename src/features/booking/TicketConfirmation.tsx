import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { BRAND } from '../../config/brand';
import { ROUTES } from '../../config/routes';
import { useBookingStore } from '../../stores/bookingStore';

interface ConfirmationState {
   paymentId?: string;
   eTicketNumber?: string;
   amount?: string;
   last4?: string;
   cardBrand?: string;
   pnr?: string;
   origin?: string;
   destination?: string;
   flightNumber?: string;
   fareClass?: string;
   bookingId?: string;
}

const TicketConfirmation: React.FC = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const state = (location.state as ConfirmationState) || {};

   // Read from navigation state (passed by PaymentProcessing) or fall back to booking store
   const storePnr = useBookingStore((s) => s.pnr);
   const storeFlight = useBookingStore((s) => s.selectedFlight);
   const resetBooking = useBookingStore((s) => s.resetBooking);

   const pnr = state.pnr || storePnr || '—';
   const eTicket = state.eTicketNumber || 'DBJ-PENDING';
   const amount = state.amount || '0.00';
   const last4 = state.last4 || '****';
   const cardBrand = state.cardBrand || 'card';
   const originCode = state.origin || storeFlight?.origin || '—';
   const destCode = state.destination || storeFlight?.destination || '—';
   const flightNum = state.flightNumber || storeFlight?.flightNumber || '—';
   const fareClass = state.fareClass || storeFlight?.fareClass || 'economy';

   // Friendly city names (can be enhanced with a lookup)
   const cityName = (code: string) => {
      const cities: Record<string, string> = {
         BJL: 'Banjul', DSS: 'Dakar', LHR: 'London', ACC: 'Accra',
         LOS: 'Lagos', FNA: 'Freetown', ABV: 'Abuja', DKR: 'Dakar',
         NBO: 'Nairobi', JNB: 'Johannesburg',
      };
      return cities[code] || code;
   };

   const onDone = () => {
      resetBooking(); // Clear the booking store after confirmation
      navigate(ROUTES.HOME);
   };

   return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white p-8">
         <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in duration-700">
            {/* Success Header */}
            <div className="text-center space-y-4">
               <div className="size-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto animate-in zoom-in duration-500">
                  <span className="material-symbols-outlined text-5xl text-emerald-500">check_circle</span>
               </div>
               <h1 className="text-3xl font-black text-navy-950 tracking-tighter">Booking Confirmed!</h1>
               <p className="text-sm text-navy-500 font-medium">
                  Your payment has been processed and your ticket is confirmed.
               </p>
            </div>

            {/* E-Ticket Card */}
            <div className="bg-white rounded-3xl border-2 border-emerald-100 shadow-xl overflow-hidden">
               {/* Ticket Header */}
               <div className="bg-navy-950 text-white p-8">
                  <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-2xl">flight</span>
                        <span className="text-lg font-black tracking-tight">{BRAND.name}</span>
                     </div>
                     <div className="text-right">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/40">E-Ticket</p>
                        <p className="text-sm font-black text-primary">{eTicket}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-6">
                     <div className="flex-1 text-center">
                        <p className="text-3xl font-black">{originCode}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mt-1">{cityName(originCode)}</p>
                     </div>
                     <div className="flex flex-col items-center gap-1">
                        <span className="material-symbols-outlined text-primary text-xl">flight</span>
                        <div className="w-24 h-px bg-white/20" />
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Direct</p>
                     </div>
                     <div className="flex-1 text-center">
                        <p className="text-3xl font-black">{destCode}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mt-1">{cityName(destCode)}</p>
                     </div>
                  </div>
               </div>

               {/* Ticket Details */}
               <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                     <div>
                        <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">PNR / Booking Ref</p>
                        <p className="text-lg font-black text-navy-950 tracking-tight mt-1">{pnr}</p>
                     </div>
                     <div>
                        <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Flight</p>
                        <p className="text-lg font-black text-navy-950 tracking-tight mt-1">{flightNum}</p>
                     </div>
                     <div>
                        <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Status</p>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-widest mt-1">
                           <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                           Confirmed
                        </span>
                     </div>
                     <div>
                        <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Class</p>
                        <p className="text-lg font-black text-navy-950 tracking-tight mt-1 capitalize">{fareClass}</p>
                     </div>
                  </div>

                  <hr className="border-navy-100 border-dashed" />

                  {/* Payment Details */}
                  <div className="space-y-3">
                     <h3 className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Payment Details</h3>
                     <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 bg-navy-50/30 rounded-xl text-center">
                           <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Amount Paid</p>
                           <p className="text-lg font-black text-navy-950 mt-1">${amount}</p>
                        </div>
                        <div className="p-3 bg-navy-50/30 rounded-xl text-center">
                           <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Card</p>
                           <p className="text-sm font-black text-navy-950 mt-1 capitalize">{cardBrand} •••• {last4}</p>
                        </div>
                        <div className="p-3 bg-navy-50/30 rounded-xl text-center">
                           <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Date</p>
                           <p className="text-sm font-black text-navy-950 mt-1">
                              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                           </p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Barcode-style divider */}
               <div className="px-8 pb-6">
                  <div className="h-12 bg-navy-50 rounded-xl flex items-center justify-center gap-0.5 overflow-hidden">
                     {Array.from({ length: 40 }, (_, i) => (
                        <div
                           key={i}
                           className="bg-navy-900"
                           style={{
                              width: ((i * 7 + 3) % 5) > 2 ? '2px' : '3px',
                              height: `${20 + ((i * 13 + 7) % 20)}px`,
                           }}
                        />
                     ))}
                  </div>
               </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
               <button
                  onClick={onDone}
                  className="flex-1 py-4 bg-primary text-white font-black uppercase tracking-[0.15em] rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
               >
                  <span className="material-symbols-outlined text-sm">home</span>
                  Return to Home
               </button>
               <button
                  className="flex-1 py-4 bg-white border-2 border-navy-100 text-navy-700 font-black uppercase tracking-[0.15em] rounded-2xl hover:border-navy-200 transition-all flex items-center justify-center gap-2"
               >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Download E-Ticket
               </button>
            </div>

            {/* Info Note */}
            <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
               <span className="material-symbols-outlined text-blue-500 mt-0.5">info</span>
               <div>
                  <p className="text-xs font-bold text-blue-700">A confirmation email has been sent to your registered email address.</p>
                  <p className="text-[10px] text-blue-500 font-medium mt-1">
                     Please present your e-ticket number ({eTicket}) or PNR ({pnr}) at the airport check-in counter.
                  </p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default TicketConfirmation;
