import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ROUTES } from '../../config/routes';
import { useToastStore } from '../../stores/toastStore';
import { useBooking } from '../../hooks/useBooking';
import { generateInvoice } from '../../utils/invoiceGenerator';
import type { BookingDoc, PassengerDoc } from '../../types/firestore';

// Modals
import ChangeFlightModal from './modals/ChangeFlightModal';
import UpgradeClassModal from './modals/UpgradeClassModal';
import CancelBookingModal from './modals/CancelBookingModal';
import EditPassengerModal from './modals/EditPassengerModal';
import ChangeMealModal from './modals/ChangeMealModal';
import SpecialAssistanceModal from './modals/SpecialAssistanceModal';
import SelectSeatModal from './modals/SelectSeatModal';

const BookingDetail: React.FC = () => {
   const { pnr } = useParams<{ pnr: string }>();
   const navigate = useNavigate();
   const { retrieveByPNR, getBookingDetails } = useBooking();
   const addToast = useToastStore((s) => s.addToast);

   const [booking, setBooking] = useState<BookingDoc | null>(null);
   const [passengers, setPassengers] = useState<PassengerDoc[]>([]);
   const [loading, setLoading] = useState(true);

   // Modal Output State
   const [changeFlightOpen, setChangeFlightOpen] = useState(false);
   const [upgradeClassOpen, setUpgradeClassOpen] = useState(false);
   const [cancelBookingOpen, setCancelBookingOpen] = useState(false);
   const [editPassengerOpen, setEditPassengerOpen] = useState(false);
   const [editingPassenger, setEditingPassenger] = useState<PassengerDoc | null>(null);
   const [changeMealOpen, setChangeMealOpen] = useState(false);
   const [specialAssistOpen, setSpecialAssistOpen] = useState(false);
   const [selectSeatOpen, setSelectSeatOpen] = useState(false);
   const [selectingSeatPassenger, setSelectingSeatPassenger] = useState<PassengerDoc | null>(null);

   const fetchData = async () => {
      if (!pnr) {
         navigate(ROUTES.MANAGE_BOOKING);
         return;
      }
      setLoading(true);
      try {
         const bDoc = await retrieveByPNR(pnr);
         if (bDoc) {
            const details = await getBookingDetails(bDoc.id);
            if (details) {
               setBooking(details.booking);
               setPassengers(details.passengers);
            } else {
               addToast('Booking details not found', 'error');
            }
         } else {
            addToast('Booking not found', 'error');
            navigate(ROUTES.MANAGE_BOOKING);
         }
      } catch (error) {
         console.error('Error fetching booking details', error);
         addToast('Error fetching booking', 'error');
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [pnr]);

   const handleModalsClose = (setter: React.Dispatch<React.SetStateAction<boolean>>, clearData?: () => void) => {
      setter(false);
      if (clearData) clearData();
      fetchData(); // Refetch to show any updates
   };

   const handleInvoiceDownload = async () => {
      if (!booking) return;
      try {
         await generateInvoice(booking, passengers);
      } catch (error) {
         addToast('Error generating invoice', 'error');
      }
   };

   if (loading) {
       return (
           <div className="min-h-screen bg-navy-50 flex items-center justify-center">
               <div className="flex flex-col items-center gap-4">
                   <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
                   <p className="text-navy-500 font-bold tracking-widest text-sm uppercase">Loading booking details...</p>
               </div>
           </div>
       );
   }

   if (!booking) {
       return null;
   }

   return (
      <div className="min-h-screen bg-navy-50 pb-32">
         {/* Navigation Bar */}
         <nav className="bg-navy-950 px-10 py-6 sticky top-0 z-50 shadow-2xl">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
               <div className="flex items-center gap-8">
                  <div className="text-white font-black tracking-tighter text-2xl flex items-center gap-2">
                     <span className="material-symbols-outlined text-primary">flight_takeoff</span>
                     DELTABLUE
                  </div>
               </div>
               <button onClick={() => navigate(ROUTES.HOME)} className="size-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white hover:text-navy-950 transition-all hover:scale-110 active:scale-95">
                  <span className="material-symbols-outlined">close</span>
               </button>
            </div>
         </nav>

         <div className="max-w-7xl mx-auto px-10 mt-12 grid grid-cols-1 sm:grid-cols-12 gap-12">
            {/* Left Column: Flight Journey & Passengers */}
            <div className="sm:col-span-8 space-y-12">
               {/* Main Trip Card */}
               <div className="bg-white rounded-[3rem] shadow-xl shadow-navy-900/5 overflow-hidden">
                  <div className="px-10 py-8 bg-navy-950 text-white flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-primary text-3xl">flight_takeoff</span>
                        <div>
                           <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none">Status</p>
                           <h2 className="text-2xl font-black uppercase tracking-tighter mt-1">{booking.status}</h2>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-bold text-navy-300 uppercase tracking-widest leading-none">Booking Ref (PNR)</p>
                        <h2 className="text-2xl font-black text-primary uppercase tracking-widest mt-1">{booking.pnr}</h2>
                     </div>
                  </div>

                  <div className="p-10 border-b border-navy-100 flex items-center justify-between relative">
                     <div className="w-1/3">
                        <p className="text-5xl font-black text-navy-950 tracking-tighter">{booking.origin.code}</p>
                        <p className="text-xs font-bold text-navy-400 mt-2 tracking-wide">{booking.origin.city}</p>
                        <p className="text-lg font-black text-navy-950 mt-4 tracking-tight">{booking.departureTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">{booking.departureTime.toDate().toLocaleDateString()}</p>
                     </div>

                     <div className="w-1/3 flex flex-col items-center relative z-10">
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest bg-white px-4">Flight {booking.flightNumber}</p>
                        <div className="w-full h-0.5 bg-navy-100 relative my-4">
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-4 bg-white border-2 border-primary rounded-full ring-4 ring-white" />
                        </div>
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest bg-white px-4">Non-stop</p>
                     </div>

                     <div className="w-1/3 text-right">
                        <p className="text-5xl font-black text-navy-950 tracking-tighter">{booking.destination.code}</p>
                        <p className="text-xs font-bold text-navy-400 mt-2 tracking-wide">{booking.destination.city}</p>
                        <p className="text-lg font-black text-navy-950 mt-4 tracking-tight">{booking.arrivalTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">{booking.arrivalTime.toDate().toLocaleDateString()}</p>
                     </div>
                  </div>

                  {/* Flight Action Buttons */}
                  <div className="p-4 bg-navy-50/50 flex gap-4 overflow-x-auto custom-scrollbar">
                     <button onClick={() => setChangeFlightOpen(true)} className="flex-1 py-4 bg-white border border-navy-100 rounded-2xl flex items-center justify-center gap-3 hover:border-primary hover:text-primary transition-colors group shadow-sm text-navy-950">
                        <span className="material-symbols-outlined text-navy-300 group-hover:text-primary transition-colors">edit_calendar</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Change Flight</span>
                     </button>
                     <button onClick={() => setUpgradeClassOpen(true)} className="flex-1 py-4 bg-white border border-navy-100 rounded-2xl flex items-center justify-center gap-3 hover:border-primary hover:text-primary transition-colors group shadow-sm text-navy-950">
                        <span className="material-symbols-outlined text-navy-300 group-hover:text-primary transition-colors">airline_seat_recline_extra</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Upgrade Class</span>
                     </button>
                     <button onClick={() => setCancelBookingOpen(true)} className="flex-1 py-4 bg-white border border-navy-100 rounded-2xl flex items-center justify-center gap-3 hover:text-red-600 transition-colors group shadow-sm text-navy-950">
                        <span className="material-symbols-outlined text-navy-300 group-hover:text-red-500 transition-colors">event_busy</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Cancel Booking</span>
                     </button>
                  </div>
               </div>

               {/* Passengers Section */}
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <h3 className="text-2xl font-black text-navy-950 uppercase tracking-tighter">Passengers</h3>
                     <div className="px-4 py-2 bg-navy-100 rounded-full text-[10px] font-black text-navy-600 uppercase tracking-widest">
                        {passengers.length} Traveler{passengers.length !== 1 ? 's' : ''}
                     </div>
                  </div>

                  <div className="space-y-4">
                     {passengers.map((pax) => (
                        <div key={pax.id} className="bg-white rounded-[2rem] p-6 border border-navy-100 shadow-sm flex items-center justify-between group hover:border-primary/30 transition-colors">
                           <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-3">
                                 <span className="text-lg font-black text-navy-950 tracking-tight uppercase">{pax.firstName} {pax.lastName}</span>
                                 <button onClick={() => { setEditingPassenger(pax); setEditPassengerOpen(true); }} className="size-8 flex items-center justify-center rounded-xl hover:bg-navy-50 text-navy-300 hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                 </button>
                              </div>
                              <span className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">Ticket: {booking.fareClass} • {pax.nationality}</span>
                           </div>

                           <div className="flex gap-4">
                              <div className="flex flex-col items-end gap-1">
                                 <span className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Seat</span>
                                 <div className="px-4 py-2 bg-navy-50 rounded-xl text-xs font-black text-navy-950">
                                    {pax.seatNumber || 'Unassigned'}
                                 </div>
                              </div>
                              <button onClick={() => { setSelectingSeatPassenger(pax); setSelectSeatOpen(true); }} className="px-6 py-2 bg-white border border-navy-100 text-navy-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary hover:text-primary transition-colors shadow-sm self-end">
                                 {pax.seatNumber ? 'Change Seat' : 'Select Seat'}
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Right Column: Payment Details & Services */}
            <div className="sm:col-span-4 space-y-8">
               {/* Payment Summary */}
               <div className="bg-white rounded-[3.5rem] border border-navy-100 overflow-hidden shadow-xl shadow-navy-900/5">
                  <div className="px-10 py-8 bg-navy-50/50 border-b border-navy-100 text-center relative">
                     <span className="material-symbols-outlined text-4xl text-navy-300 absolute left-1/2 top-4 -translate-x-1/2 -translate-y-1/2 opacity-20">payments</span>
                     <h3 className="text-lg font-black text-navy-950 uppercase tracking-tighter relative z-10">Payment Summary</h3>
                     <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mt-1 text-green-600">Paid in Full</p>
                  </div>
                  
                  <div className="p-10 space-y-6">
                     <div className="space-y-4">
                        <div className="flex justify-between text-[11px] font-bold text-navy-600 uppercase tracking-widest">
                           <span>Flight Fare ({passengers.length}x)</span>
                           <span className="font-black">${booking.totalAmount.toFixed(2)}</span>
                        </div>
                     </div>
                     <div className="pt-10 border-t-2 border-dashed border-navy-100 flex justify-between items-end">
                        <div className="space-y-1">
                           <span className="text-[10px] font-black text-navy-300 uppercase tracking-[0.4em]">Total Paid</span>
                           <p className="text-5xl font-black text-navy-950 tracking-tighter leading-none">${booking.totalAmount.toFixed(2)}</p>
                        </div>
                     </div>

                     <div className="bg-navy-950 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group mt-6">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-white transition-transform group-hover:scale-110">
                           <span className="material-symbols-outlined text-[100px] font-black">receipt</span>
                        </div>
                        <div className="flex items-center gap-5 relative z-10">
                           <div className="p-3 bg-white/10 rounded-2xl border border-white/10 text-primary shadow-xl">
                              <span className="material-symbols-outlined">description</span>
                           </div>
                           <div className="space-y-1">
                              <p className="text-xs font-black text-white uppercase tracking-tight">Invoice #{booking.pnr}</p>
                              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{booking.createdAt.toDate().toLocaleDateString()} Issued</p>
                           </div>
                        </div>
                        <button onClick={handleInvoiceDownload} className="w-full py-4 bg-white text-navy-950 font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all relative z-10 flex items-center justify-center gap-3">
                           <span className="material-symbols-outlined text-lg">download</span> Download Invoice (PDF)
                        </button>
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
                        <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight leading-tight">Meal Service</h3>
                        <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mt-2 opacity-70">Pre-select your in-flight meal</p>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <button onClick={() => setChangeMealOpen(true)} className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-white border border-navy-100 hover:border-primary transition-all group/btn shadow-sm">
                        <span className="text-[11px] font-black text-navy-700 uppercase tracking-widest group-hover/btn:text-primary">Change Meal Selection</span>
                        <span className="material-symbols-outlined text-navy-200 group-hover/btn:text-primary transition-colors">fastfood</span>
                     </button>
                     <button onClick={() => setSpecialAssistOpen(true)} className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-white border border-navy-100 hover:border-primary transition-all group/btn shadow-sm">
                        <span className="text-[11px] font-black text-navy-700 uppercase tracking-widest group-hover/btn:text-primary">Special Assistance</span>
                        <span className="material-symbols-outlined text-navy-200 group-hover/btn:text-primary transition-colors">medical_services</span>
                     </button>
                  </div>
               </div>
            </div>
         </div>

         {/* Modals */}
         <ChangeFlightModal open={changeFlightOpen} onClose={() => handleModalsClose(setChangeFlightOpen)} booking={booking} />
         <UpgradeClassModal open={upgradeClassOpen} onClose={() => handleModalsClose(setUpgradeClassOpen)} booking={booking} />
         <CancelBookingModal open={cancelBookingOpen} onClose={() => handleModalsClose(setCancelBookingOpen)} booking={booking} />
         <EditPassengerModal 
            open={editPassengerOpen} 
            onClose={() => handleModalsClose(setEditPassengerOpen, () => setEditingPassenger(null))} 
            booking={booking} 
            passenger={editingPassenger} 
         />
         <ChangeMealModal open={changeMealOpen} onClose={() => handleModalsClose(setChangeMealOpen, () => setEditingPassenger(null))} booking={booking} passenger={editingPassenger} />
         <SpecialAssistanceModal open={specialAssistOpen} onClose={() => handleModalsClose(setSpecialAssistOpen, () => setEditingPassenger(null))} booking={booking} passenger={editingPassenger} />
         <SelectSeatModal 
            open={selectSeatOpen} 
            onClose={() => handleModalsClose(setSelectSeatOpen, () => setSelectingSeatPassenger(null))} 
            booking={booking} 
            passenger={selectingSeatPassenger} 
         />
      </div>
   );
};

export default BookingDetail;
