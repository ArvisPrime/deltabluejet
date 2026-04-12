import React, { useState, useEffect } from 'react';
import ModalShell from './ModalShell';
import type { BookingDoc, PassengerDoc } from '../../../types/firestore';
import { useToastStore } from '../../../stores/toastStore';
import { db } from '../../../config/firebase.config';
import { doc, updateDoc } from 'firebase/firestore';

interface SelectSeatModalProps {
   open: boolean;
   onClose: () => void;
   booking: BookingDoc | null;
   passenger: PassengerDoc | null;
}

const SelectSeatModal: React.FC<SelectSeatModalProps> = ({ open, onClose, booking, passenger }) => {
   const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
   const [isSaving, setIsSaving] = useState(false);
   const { addToast } = useToastStore();

   // Fake seat availability map for demonstration. In a real app we'd fetch actual FlightDoc seat maps.
   const rows = [
      { row: 1, seats: ['1A', '1B', null, '1C', '1D'], status: ['taken', 'taken', null, 'available', 'taken'] },
      { row: 2, seats: ['2A', '2B', null, '2C', '2D'], status: ['available', 'taken', null, 'available', 'available'] },
      { row: 3, seats: ['3A', '3B', null, '3C', '3D'], status: ['available', 'available', null, 'taken', 'available'] },
      { row: 4, seats: ['4A', '4B', null, '4C', '4D'], status: ['current', 'available', null, 'available', 'taken'] },
      { row: 5, seats: ['5A', '5B', null, '5C', '5D'], status: ['available', 'available', null, 'available', 'available'] },
      { row: 6, seats: ['6A', '6B', null, '6C', '6D'], status: ['taken', 'available', null, 'taken', 'available'] },
   ];

   useEffect(() => {
      if (passenger && passenger.seatNumber) {
         setSelectedSeat(passenger.seatNumber);
      }
   }, [passenger]);

   if (!passenger || !booking) return null;

   const handleSave = async () => {
      if (!selectedSeat) {
          addToast('Please select a seat', 'error');
          return;
      }
      setIsSaving(true);
      try {
         const paxRef = doc(db, 'bookings', booking.id, 'passengers', passenger.id);
         await updateDoc(paxRef, {
            seatNumber: selectedSeat
         });
         addToast(`Seat ${selectedSeat} confirmed successfully`, 'success');
         onClose();
      } catch (err) {
         addToast('Failed to update seat selection', 'error');
      } finally {
         setIsSaving(false);
      }
   };

   return (
      <ModalShell open={open} onClose={onClose} title="Select Seat" subtitle={`${booking.fareClass || 'Economy'} Class • ${booking.flightNumber} • Rows 1–6`} icon="grid_view"
         footer={
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-6">
                  {[
                     { color: 'bg-primary', label: 'Your Seat' },
                     { color: 'bg-emerald-500', label: 'Available' },
                     { color: 'bg-navy-200', label: 'Taken' },
                  ].map((l, i) => (
                     <div key={i} className="flex items-center gap-2">
                        <span className={`size-3 rounded ${l.color}`}></span>
                        <span className="text-[8px] font-black text-navy-400 uppercase tracking-widest">{l.label}</span>
                     </div>
                  ))}
               </div>
               <div className="flex gap-3">
                  <button onClick={onClose} className="px-8 py-3 border-2 border-navy-100 text-navy-700 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-navy-50 transition-all">Cancel</button>
                  <button disabled={isSaving || !selectedSeat} onClick={handleSave} className="px-10 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100">
                     {isSaving ? 'Saving...' : `Confirm Seat ${selectedSeat || ''}`}
                  </button>
               </div>
            </div>
         }
      >
         <div className="space-y-6">
            <div className="flex justify-center">
               <div className="bg-navy-950 rounded-t-[4rem] px-12 pt-4 pb-2 text-center">
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em]">Front of Aircraft</span>
               </div>
            </div>

            <div className="bg-navy-50/30 rounded-3xl border border-navy-100 p-8 space-y-3">
               <div className="flex justify-center gap-2 mb-4">
                  <span className="text-[8px] font-black text-navy-300 uppercase tracking-widest w-10 text-center">A</span>
                  <span className="text-[8px] font-black text-navy-300 uppercase tracking-widest w-10 text-center">B</span>
                  <span className="w-8"></span>
                  <span className="text-[8px] font-black text-navy-300 uppercase tracking-widest w-10 text-center">C</span>
                  <span className="text-[8px] font-black text-navy-300 uppercase tracking-widest w-10 text-center">D</span>
               </div>
               {rows.map((row) => (
                  <div key={row.row} className="flex justify-center items-center gap-2">
                     {row.seats.map((seat, si) => {
                        if (seat === null) return <div key={si} className="w-8 flex items-center justify-center"><span className="text-[9px] font-black text-navy-300">{row.row}</span></div>;
                        const st = row.status[si];
                        const isSelected = seat === selectedSeat;
                        const isCurrent = seat === passenger.seatNumber;
                        const isTaken = st === 'taken' && !isCurrent;
                        return (
                           <button
                              key={si}
                              disabled={isTaken}
                              onClick={() => setSelectedSeat(seat)}
                              className={`size-10 rounded-xl text-[9px] font-black uppercase transition-all ${
                                 isSelected ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' :
                                 isCurrent ? 'bg-primary/20 text-primary border-2 border-primary/30' :
                                 isTaken ? 'bg-navy-100 text-navy-300 cursor-not-allowed' :
                                 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:scale-105'
                              }`}
                           >
                              {seat}
                           </button>
                        );
                     })}
                  </div>
               ))}
            </div>

            {selectedSeat && (
               <div className="p-5 rounded-2xl border border-navy-50 bg-white flex items-center justify-between">
                  <div>
                     <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest">Selected Seat</p>
                     <p className="text-2xl font-black text-navy-950 tracking-tighter">{selectedSeat}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest">Position</p>
                     <p className="text-sm font-black text-navy-950 uppercase tracking-tight">{selectedSeat.endsWith('A') || selectedSeat.endsWith('D') ? 'Window' : 'Aisle'}</p>
                  </div>
               </div>
            )}
         </div>
      </ModalShell>
   );
};

export default SelectSeatModal;
