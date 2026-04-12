import React, { useState } from 'react';
import ModalShell from './ModalShell';
import type { BookingDoc } from '../../../types/firestore';
import { useBooking } from '../../../hooks/useBooking';
import { useToastStore } from '../../../stores/toastStore';

interface ChangeFlightModalProps {
   open: boolean;
   onClose: () => void;
   booking: BookingDoc | null;
}

const ChangeFlightModal: React.FC<ChangeFlightModalProps> = ({ open, onClose, booking }) => {
   const [selectedDate, setSelectedDate] = useState('');
   const [isSearching, setIsSearching] = useState(false);
   const [flights, setFlights] = useState<any[]>([]);
   const { search, modify } = useBooking();
   const { addToast } = useToastStore();

   if (!booking) return null;

   const handleSearch = async () => {
      if (!selectedDate) {
         addToast('Please select a date', 'error');
         return;
      }
      setIsSearching(true);
      try {
         const results = await search(booking.origin.code, booking.destination.code, new Date(selectedDate));
         setFlights(results);
         if (results.length === 0) {
            addToast('No flights available on this date.', 'error');
         }
      } catch (err) {
         addToast('Failed to search flights.', 'error');
      } finally {
         setIsSearching(false);
      }
   };

   const handleChangeFlight = async (newFlightId: string) => {
      try {
         await modify({ bookingId: booking.id, newFlightId });
         addToast('Flight changed successfully.', 'success');
         onClose();
      } catch (err) {
         addToast('Failed to change flight.', 'error');
      }
   };

   const currentDeparture = booking.departureTime.toDate();
   const dateStr = currentDeparture.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

   return (
      <ModalShell open={open} onClose={onClose} title="Change Flight" subtitle={`${booking.flightNumber} • ${booking.origin.code} → ${booking.destination.code} • Currently ${dateStr}`} icon="edit_calendar"
         footer={
            <div className="flex items-center justify-between">
               <p className="text-[9px] font-bold text-navy-300 uppercase tracking-widest italic">Fare difference may apply</p>
               <div className="flex gap-3">
                  <button onClick={onClose} className="px-8 py-3 border-2 border-navy-100 text-navy-700 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-navy-50 transition-all">Cancel</button>
                  <button disabled={isSearching} onClick={handleSearch} className="px-10 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100">{isSearching ? 'Searching...' : 'Search Available Flights'}</button>
               </div>
            </div>
         }
      >
         <div className="space-y-8">
            <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100 flex items-start gap-4">
               <span className="material-symbols-outlined text-primary p-2 bg-white rounded-xl shadow-sm shrink-0">info</span>
               <p className="text-[10px] font-bold text-navy-600 uppercase tracking-widest leading-relaxed">You can change your flight date or route. Any fare difference will be shown before you confirm the change.</p>
            </div>

            <div className="space-y-4">
               <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em]">Select New Date</p>
               <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full h-14 px-6 bg-white border-2 border-navy-100 rounded-2xl text-sm font-black text-navy-950 focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none uppercase tracking-widest"
               />
            </div>

            <div className="space-y-4">
               <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em]">Route</p>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl border-2 border-primary bg-primary/5">
                     <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest mb-1">From</p>
                     <p className="text-lg font-black text-navy-950 tracking-tight">{booking.origin.code} — {booking.origin.city}</p>
                  </div>
                  <div className="p-5 rounded-2xl border-2 border-primary bg-primary/5">
                     <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest mb-1">To</p>
                     <p className="text-lg font-black text-navy-950 tracking-tight">{booking.destination.code} — {booking.destination.city}</p>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em]">Current Booking</p>
               <div className="p-6 rounded-2xl border border-navy-50 bg-navy-50/20">
                  <div className="grid grid-cols-3 gap-4">
                     {[
                        { lbl: 'Flight', val: booking.flightNumber },
                        { lbl: 'Date', val: dateStr },
                        { lbl: 'Class', val: booking.fareClass }
                     ].map((d, i) => (
                        <div key={i}>
                           <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest mb-1">{d.lbl}</p>
                           <p className="text-sm font-black text-navy-950 uppercase tracking-tight">{d.val}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {flights.length > 0 && (
               <div className="space-y-4 pt-6 mt-6 border-t border-navy-100">
                  <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em]">Available Flights</p>
                  <div className="space-y-3">
                     {flights.map((f, i) => {
                        const dep = f.departureTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const arr = f.arrivalTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                           <div key={i} className="p-5 border border-navy-100 rounded-2xl flex justify-between items-center hover:border-primary transition-all">
                              <div>
                                 <p className="font-bold text-navy-950">{f.flightNumber} • {dep} - {arr}</p>
                                 <p className="text-xs text-navy-500">${f.price} base fare</p>
                              </div>
                              <button onClick={() => handleChangeFlight(f.id)} className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90">Select</button>
                           </div>
                        );
                     })}
                  </div>
               </div>
            )}
         </div>
      </ModalShell>
   );
};

export default ChangeFlightModal;
