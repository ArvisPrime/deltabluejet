import React, { useState, useEffect } from 'react';
import ModalShell from './ModalShell';
import type { BookingDoc } from '../../../types/firestore';
import { useBooking } from '../../../hooks/useBooking';
import { useToastStore } from '../../../stores/toastStore';

interface UpgradeClassModalProps {
   open: boolean;
   onClose: () => void;
   booking: BookingDoc | null;
}

const UpgradeClassModal: React.FC<UpgradeClassModalProps> = ({ open, onClose, booking }) => {
   const [selectedClass, setSelectedClass] = useState<string | null>(null);

   // Reset state when modal opens
   useEffect(() => {
      if (open) setSelectedClass(null);
   }, [open]);
   const [isUpgrading, setIsUpgrading] = useState(false);
   const { modify } = useBooking();
   const { addToast } = useToastStore();

   if (!booking) return null;

   const classes = [
      { id: 'business', name: 'Business Class', price: '+$680', seat: '42" pitch • 21" wide', perks: ['Priority Boarding', 'Extra Legroom', 'Premium Meal', 'Lounge Access'], icon: 'airline_seat_recline_extra', color: 'border-indigo-200 bg-indigo-50/30', badge: 'bg-indigo-100 text-indigo-700', recommended: false },
      { id: 'first', name: 'First Class', price: '+$1,860', seat: '78" lie-flat • 22" wide', perks: ['Lounge Access', 'Lie-Flat Seat', 'Premium Dining', 'Priority Baggage'], icon: 'airline_seat_flat', color: 'border-amber-200 bg-amber-50/30', badge: 'bg-amber-100 text-amber-700', recommended: true },
   ].filter(c => c.id !== booking.fareClass);

   const handleUpgrade = async () => {
      if (!selectedClass) return;
      setIsUpgrading(true);
      try {
         await modify({ bookingId: booking.id, newFareClass: selectedClass });
         addToast('Class upgraded successfully', 'success');
         onClose();
      } catch (err) {
         addToast('Failed to upgrade class', 'error');
      } finally {
         setIsUpgrading(false);
      }
   };

   return (
      <ModalShell open={open} onClose={onClose} title="Upgrade Class" subtitle={`Current: ${booking.fareClass} • ${booking.flightNumber} ${booking.origin.code} → ${booking.destination.code}`} icon="auto_awesome"
         footer={
            <div className="flex items-center justify-between">
               <p className="text-[9px] font-bold text-navy-300 uppercase tracking-widest italic">{selectedClass ? 'Upgrade price shown per passenger' : 'Select a class to continue'}</p>
               <div className="flex gap-3">
                  <button onClick={onClose} className="px-8 py-3 border-2 border-navy-100 text-navy-700 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-navy-50 transition-all">Cancel</button>
                  <button disabled={!selectedClass || isUpgrading} onClick={handleUpgrade} className={`px-10 py-3 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-lg transition-all ${selectedClass ? 'bg-primary text-white shadow-primary/20 hover:scale-[1.02] active:scale-95' : 'bg-navy-100 text-navy-300 cursor-not-allowed'} disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100`}>
                     {isUpgrading ? 'Upgrading...' : 'Confirm Upgrade'}
                  </button>
               </div>
            </div>
         }
      >
         <div className="space-y-6">
            {classes.length === 0 ? (
               <div className="p-8 text-center text-navy-400">You are already in the highest class available!</div>
            ) : (
               classes.map((cls) => (
                  <button
                     key={cls.id}
                     onClick={() => setSelectedClass(cls.id)}
                     className={`w-full text-left p-8 rounded-3xl border-2 transition-all relative overflow-hidden group ${selectedClass === cls.id ? 'border-primary shadow-xl shadow-primary/10 bg-primary/5' : cls.color + ' hover:shadow-lg'}`}
                  >
                     {cls.recommended && (
                        <div className="absolute top-0 right-0 bg-primary text-white text-[8px] font-black px-4 py-1 rounded-bl-xl tracking-widest uppercase">Recommended</div>
                     )}
                     <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                           <span className="material-symbols-outlined text-2xl text-navy-400 group-hover:text-primary transition-colors">{cls.icon}</span>
                           <div>
                              <h4 className="text-lg font-black text-navy-950 uppercase tracking-tight">{cls.name}</h4>
                              <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest mt-1">{cls.seat}</p>
                           </div>
                        </div>
                        <span className={`text-xl font-black ${selectedClass === cls.id ? 'text-primary' : 'text-navy-950'} tracking-tight`}>{cls.price}</span>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {cls.perks.map((perk, i) => (
                           <span key={i} className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${selectedClass === cls.id ? 'bg-primary/10 text-primary' : cls.badge}`}>{perk}</span>
                        ))}
                     </div>
                     {selectedClass === cls.id && (
                        <div className="absolute top-6 left-6">
                           <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                        </div>
                     )}
                  </button>
               ))
            )}
         </div>
      </ModalShell>
   );
};

export default UpgradeClassModal;
