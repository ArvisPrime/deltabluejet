import React, { useState, useEffect } from 'react';
import ModalShell from './ModalShell';
import type { BookingDoc, PassengerDoc } from '../../../types/firestore';
import { useToastStore } from '../../../stores/toastStore';
import { db } from '../../../config/firebase.config';
import { doc, updateDoc } from 'firebase/firestore';

interface SpecialAssistanceModalProps {
   open: boolean;
   onClose: () => void;
   booking: BookingDoc | null;
   passenger: PassengerDoc | null;
}

const SERVICES = [
   { id: 'wheelchair', name: 'Wheelchair Assistance', desc: 'Support through the airport and to your seat', icon: 'accessible' },
   { id: 'visual', name: 'Visual Impairment', desc: 'Guided assistance and audio announcements', icon: 'visibility_off' },
   { id: 'hearing', name: 'Hearing Impairment', desc: 'Visual notifications and written assistance', icon: 'hearing_disabled' },
   { id: 'medical', name: 'Medical Equipment', desc: 'Oxygen, CPAP devices, or other medical needs', icon: 'medical_services' },
   { id: 'elderly', name: 'Elderly Assistance', desc: 'Priority boarding and additional cabin support', icon: 'elderly' },
   { id: 'minor', name: 'Unaccompanied Minor', desc: 'Supervised care for children travelling alone', icon: 'child_care' },
];

const SpecialAssistanceModal: React.FC<SpecialAssistanceModalProps> = ({ open, onClose, booking, passenger }) => {
   const [selected, setSelected] = useState<string[]>([]);
   const [notes, setNotes] = useState('');
   const [isSaving, setIsSaving] = useState(false);
   const { addToast } = useToastStore();

   const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

   useEffect(() => {
      if (!open) return;
      // Find existing assistance from special requests
      if (passenger) {
         const existingServices = passenger.specialRequests?.filter(req => SERVICES.some(s => s.id === req)) || [];
         setSelected(existingServices);
         
         const notesReq = passenger.specialRequests?.find(req => req.startsWith('NOTES:'));
         if (notesReq) {
             setNotes(notesReq.substring(6)); // strip "NOTES:" prefix
         } else {
             setNotes('');
         }
      } else {
         setSelected([]);
         setNotes('');
      }
      setIsSaving(false);
   }, [open, passenger]);

   if (!passenger || !booking) return null;

   const handleSave = async () => {
      setIsSaving(true);
      try {
         const paxRef = doc(db, 'bookings', booking.id, 'passengers', passenger.id);
         
         // Keep non-assistance requests like meals (e.g. ones with 'ML')
         const newSpecialRequests = passenger.specialRequests?.filter(req => !SERVICES.some(s => s.id === req) && !req.startsWith('NOTES:')) || [];
         
         selected.forEach(s => newSpecialRequests.push(s));
         if (notes.trim()) {
             newSpecialRequests.push(`NOTES:${notes.trim()}`);
         }

         await updateDoc(paxRef, {
            specialRequests: newSpecialRequests
         });
         
         addToast('Special assistance requests updated successfully', 'success');
         onClose();
      } catch (err) {
         addToast('Failed to update special assistance', 'error');
      } finally {
         setIsSaving(false);
      }
   };

   return (
      <ModalShell open={open} onClose={onClose} title="Special Assistance" subtitle={`${passenger.firstName} ${passenger.lastName} • ${booking.flightNumber}`} icon="accessibility_new"
         footer={
            <div className="flex items-center justify-between">
               <p className="text-[9px] font-bold text-navy-300 uppercase tracking-widest italic">{selected.length} service{selected.length !== 1 ? 's' : ''} selected</p>
               <div className="flex gap-3">
                  <button onClick={onClose} className="px-8 py-3 border-2 border-navy-100 text-navy-700 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-navy-50 transition-all">Cancel</button>
                  <button disabled={isSaving} onClick={handleSave} className="px-10 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100">
                     {isSaving ? 'Saving...' : 'Submit Request'}
                  </button>
               </div>
            </div>
         }
      >
         <div className="space-y-8">
            <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100 flex items-start gap-4">
               <span className="material-symbols-outlined text-primary p-2 bg-white rounded-xl shadow-sm shrink-0">info</span>
               <p className="text-[10px] font-bold text-navy-600 uppercase tracking-widest leading-relaxed">Our crew will be notified and prepared to provide the assistance you require. Please submit your request at least 48 hours before departure.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {SERVICES.map((svc) => {
                  const isActive = selected.includes(svc.id);
                  return (
                     <button
                        key={svc.id}
                        onClick={() => toggle(svc.id)}
                        className={`text-left p-5 rounded-3xl border-2 transition-all group ${isActive ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-navy-100 bg-white hover:border-navy-200 hover:shadow-md'}`}
                     >
                        <div className="flex items-start gap-4">
                           <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${isActive ? 'bg-primary text-white' : 'bg-navy-50 text-navy-400 group-hover:bg-navy-100'}`}>
                              <span className="material-symbols-outlined text-lg font-black">{svc.icon}</span>
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                 <h4 className="text-[10px] font-black text-navy-950 uppercase tracking-widest">{svc.name}</h4>
                                 {isActive && <span className="material-symbols-outlined text-primary text-sm">check_circle</span>}
                              </div>
                              <p className="text-[8px] font-bold text-navy-400 uppercase tracking-widest mt-1 leading-relaxed">{svc.desc}</p>
                           </div>
                        </div>
                     </button>
                  );
               })}
            </div>

            <div className="space-y-3">
               <label className="text-[9px] font-black text-navy-400 uppercase tracking-[0.25em] flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">notes</span> Additional Notes
               </label>
               <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional details about your assistance needs..."
                  rows={3}
                  className="w-full px-5 py-4 bg-white border-2 border-navy-100 rounded-2xl text-sm font-bold text-navy-950 focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none tracking-wide resize-none transition-all placeholder:text-navy-200 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
               />
            </div>
         </div>
      </ModalShell>
   );
};

export default SpecialAssistanceModal;
