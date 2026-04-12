import React, { useState, useEffect } from 'react';
import ModalShell from './ModalShell';
import type { BookingDoc, PassengerDoc } from '../../../types/firestore';
import { useToastStore } from '../../../stores/toastStore';
import { db } from '../../../config/firebase.config';
import { doc, updateDoc } from 'firebase/firestore';

interface EditPassengerModalProps {
   open: boolean;
   onClose: () => void;
   booking: BookingDoc | null;
   passenger: PassengerDoc | null;
}

const EditPassengerModal: React.FC<EditPassengerModalProps> = ({ open, onClose, booking, passenger }) => {
   const [formData, setFormData] = useState({
      firstName: '', lastName: '', dateOfBirth: '', documentNumber: '', nationality: ''
   });
   const [isSaving, setIsSaving] = useState(false);
   const { addToast } = useToastStore();

   useEffect(() => {
      if (passenger) {
         setFormData({
            firstName: passenger.firstName || '',
            lastName: passenger.lastName || '',
            dateOfBirth: passenger.dateOfBirth || '',
            documentNumber: passenger.documentNumber || '',
            nationality: passenger.nationality || ''
         });
      }
   }, [passenger]);

   if (!passenger || !booking) return null;

   const fields = [
      { key: 'firstName', label: 'First Name', icon: 'person', type: 'text' },
      { key: 'lastName', label: 'Last Name', icon: 'person', type: 'text' },
      { key: 'dateOfBirth', label: 'Date of Birth (YYYY-MM-DD)', icon: 'calendar_today', type: 'text' },
      { key: 'documentNumber', label: 'Document Number', icon: 'badge', type: 'text' },
      { key: 'nationality', label: 'Nationality', icon: 'flag', type: 'text' },
   ] as const;

   const handleSave = async () => {
      setIsSaving(true);
      try {
         const paxRef = doc(db, 'bookings', booking.id, 'passengers', passenger.id);
         await updateDoc(paxRef, {
            firstName: formData.firstName,
            lastName: formData.lastName,
            dateOfBirth: formData.dateOfBirth,
            documentNumber: formData.documentNumber,
            nationality: formData.nationality
         });
         addToast('Passenger details updated successfully', 'success');
         onClose();
      } catch (err) {
         addToast('Failed to update passenger details', 'error');
      } finally {
         setIsSaving(false);
      }
   };

   return (
      <ModalShell open={open} onClose={onClose} title="Edit Passenger" subtitle={`${passenger.firstName} ${passenger.lastName} • ${booking.pnr}`} icon="person_edit"
         footer={
            <div className="flex items-center justify-between">
               <p className="text-[9px] font-bold text-navy-300 uppercase tracking-widest italic">Changes apply to this booking only</p>
               <div className="flex gap-3">
                  <button onClick={onClose} className="px-8 py-3 border-2 border-navy-100 text-navy-700 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-navy-50 transition-all">Cancel</button>
                  <button disabled={isSaving} onClick={handleSave} className="px-10 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100">
                     {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
               </div>
            </div>
         }
      >
         <div className="space-y-8">
            <div className="flex items-center gap-5 p-6 rounded-3xl bg-navy-50/30 border border-navy-100">
               <div className="size-14 rounded-[1.5rem] bg-navy-950 text-primary flex items-center justify-center font-black text-xl shadow-xl">{passenger.firstName.charAt(0)}</div>
               <div>
                  <p className="text-lg font-black text-navy-950 uppercase tracking-tight">{passenger.firstName} {passenger.lastName}</p>
                  <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest">Seat {passenger.seatNumber || 'Unassigned'}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
               {fields.map((f) => (
                  <div key={f.key} className="space-y-2">
                     <label className="text-[9px] font-black text-navy-400 uppercase tracking-[0.25em] flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">{f.icon}</span> {f.label}
                     </label>
                     <input
                        type={f.type}
                        value={formData[f.key as keyof typeof formData]}
                        onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                        className="w-full h-12 px-5 bg-white border-2 border-navy-100 rounded-2xl text-sm font-bold text-navy-950 focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none tracking-wide transition-all"
                     />
                  </div>
               ))}
            </div>
         </div>
      </ModalShell>
   );
};

export default EditPassengerModal;
