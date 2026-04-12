import React, { useState, useEffect } from 'react';
import ModalShell from './ModalShell';
import type { BookingDoc, PassengerDoc } from '../../../types/firestore';
import { useToastStore } from '../../../stores/toastStore';
import { db } from '../../../config/firebase.config';
import { doc, updateDoc } from 'firebase/firestore';

interface ChangeMealModalProps {
   open: boolean;
   onClose: () => void;
   booking: BookingDoc | null;
   passenger: PassengerDoc | null;
}

const MEAL_OPTIONS = [
   { id: 'standard', name: 'Standard Meal (Included)', icon: 'restaurant_menu', sub: 'Chef curated seasonal menu' },
   { id: 'vegetarian', name: 'Vegetarian (VGML)', icon: 'spa', sub: 'No meat, poultry or seafood' },
   { id: 'vegan', name: 'Vegan (VGML)', icon: 'eco', sub: 'Strictly plant-based' },
   { id: 'halal', name: 'Halal (MOML)', icon: 'mosque', sub: 'Prepared according to Islamic guidelines' },
   { id: 'kosher', name: 'Kosher (KSML)', icon: 'synagogue', sub: 'Prepared according to Jewish dietary law' },
   { id: 'gluten_free', name: 'Gluten Free (GFML)', icon: 'grain', sub: 'No wheat, rye, barley or oats' },
];

const ChangeMealModal: React.FC<ChangeMealModalProps> = ({ open, onClose, booking, passenger }) => {
   const [selectedMeal, setSelectedMeal] = useState('standard');
   const [isSaving, setIsSaving] = useState(false);
   const { addToast } = useToastStore();

   useEffect(() => {
      // Find existing meal from special requests if any
      if (passenger) {
         const mealRequest = passenger.specialRequests?.find(req => req.includes('ML')) || 'standard';
         const matchingMeal = MEAL_OPTIONS.find(m => m.name.includes(mealRequest) || m.id === 'standard');
         if (matchingMeal) setSelectedMeal(matchingMeal.id);
      }
   }, [passenger]);

   if (!passenger || !booking) return null;

   const handleSave = async () => {
      setIsSaving(true);
      try {
         const paxRef = doc(db, 'bookings', booking.id, 'passengers', passenger.id);
         const currentMeal = MEAL_OPTIONS.find(m => m.id === selectedMeal);
         
         // Remove existing meals, add new one if not standard
         const newSpecialRequests = passenger.specialRequests?.filter(req => !req.includes('ML')) || [];
         if (currentMeal && currentMeal.id !== 'standard') {
             // Extract code from parentheses like (VGML)
             const match = currentMeal.name.match(/\((.*?)\)/);
             if (match) {
                 newSpecialRequests.push(match[1]);
             }
         }

         await updateDoc(paxRef, {
            specialRequests: newSpecialRequests
         });
         addToast('Meal preferences updated successfully', 'success');
         onClose();
      } catch (err) {
         addToast('Failed to update meal preferences', 'error');
      } finally {
         setIsSaving(false);
      }
   };

   return (
      <ModalShell open={open} onClose={onClose} title="Select Meal" subtitle={`${passenger.firstName} ${passenger.lastName} • ${booking.flightNumber}`} icon="restaurant"
         footer={
            <div className="flex items-center justify-between">
               <p className="text-[9px] font-bold text-navy-300 uppercase tracking-widest italic">Meal choices must be made 24h prior</p>
               <div className="flex gap-3">
                  <button onClick={onClose} className="px-8 py-3 border-2 border-navy-100 text-navy-700 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-navy-50 transition-all">Cancel</button>
                  <button disabled={isSaving} onClick={handleSave} className="px-10 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100">
                     {isSaving ? 'Saving...' : 'Confirm Meal'}
                  </button>
               </div>
            </div>
         }
      >
         <div className="space-y-3">
            {MEAL_OPTIONS.map((meal) => (
               <button
                  key={meal.id}
                  onClick={() => setSelectedMeal(meal.id)}
                  className={`w-full p-4 rounded-3xl border-2 flex items-center justify-between group transition-all duration-300 ${
                     selectedMeal === meal.id
                        ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10'
                        : 'border-navy-100 bg-white hover:border-primary/30 hover:bg-navy-50/50'
                  }`}
               >
                  <div className="flex items-center gap-4 text-left">
                     <div className={`size-12 rounded-2xl flex items-center justify-center transition-colors ${
                        selectedMeal === meal.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-navy-50 text-navy-400 group-hover:bg-primary/10 group-hover:text-primary'
                     }`}>
                        <span className="material-symbols-outlined text-[20px]">{meal.icon}</span>
                     </div>
                     <div>
                        <p className={`font-black uppercase tracking-widest text-[11px] transition-colors ${selectedMeal === meal.id ? 'text-primary' : 'text-navy-950'}`}>
                           {meal.name}
                        </p>
                        <p className={`text-[10px] font-bold tracking-wide mt-0.5 ${selectedMeal === meal.id ? 'text-primary/70' : 'text-navy-400'}`}>
                           {meal.sub}
                        </p>
                     </div>
                  </div>
                  <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                     selectedMeal === meal.id ? 'border-primary bg-primary' : 'border-navy-200'
                  }`}>
                     {selectedMeal === meal.id && <span className="material-symbols-outlined text-[14px] text-white font-black">check</span>}
                  </div>
               </button>
            ))}
         </div>
      </ModalShell>
   );
};

export default ChangeMealModal;
