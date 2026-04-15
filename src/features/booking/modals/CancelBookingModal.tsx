import React, { useState, useEffect } from 'react';
import ModalShell from './ModalShell';
import type { BookingDoc } from '../../../types/firestore';
import { useBooking } from '../../../hooks/useBooking';
import { useToastStore } from '../../../stores/toastStore';

interface CancelBookingModalProps {
   open: boolean;
   onClose: () => void;
   booking: BookingDoc | null;
}

const CancelBookingModal: React.FC<CancelBookingModalProps> = ({ open, onClose, booking }) => {
   const [confirmed, setConfirmed] = useState(false);
   const [isCancelling, setIsCancelling] = useState(false);

   // Reset state when modal opens
   useEffect(() => {
      if (open) {
         setConfirmed(false);
         setIsCancelling(false);
      }
   }, [open]);
   const { cancel } = useBooking();
   const { addToast } = useToastStore();

   if (!booking) return null;

   const handleCancel = async () => {
      if (!booking) return;
      setIsCancelling(true);
      try {
         await cancel(booking.id);
         addToast('Booking cancelled successfully', 'success');
         onClose();
      } catch (err) {
         addToast('Failed to cancel booking', 'error');
      } finally {
         setIsCancelling(false);
      }
   };

   // Estimate refund (simplified)
   const refundAmount = booking.totalAmount * 0.8; 

   return (
      <ModalShell open={open} onClose={onClose} title="Cancel Booking" subtitle="This action cannot be undone" icon="block" iconColor="text-red-500"
         footer={
            <div className="flex items-center justify-between">
               <button onClick={onClose} className="px-8 py-3 border-2 border-navy-100 text-navy-700 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-navy-50 transition-all">Keep Booking</button>
               <button disabled={!confirmed || isCancelling} onClick={handleCancel} className={`px-10 py-3 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-lg transition-all ${confirmed ? 'bg-red-600 text-white shadow-red-600/20 hover:scale-[1.02] active:scale-95' : 'bg-navy-100 text-navy-300 cursor-not-allowed'} disabled:opacity-50 disabled:active:scale-100`}>
                  {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
               </button>
            </div>
         }
      >
         <div className="space-y-8">
            <div className="p-6 rounded-3xl bg-red-50 border border-red-100 flex items-start gap-4">
               <span className="material-symbols-outlined text-red-500 p-2 bg-white rounded-xl shadow-sm shrink-0 font-black">warning</span>
               <div className="space-y-2">
                  <p className="text-sm font-black text-red-900 uppercase tracking-tight">Cancellation Warning</p>
                  <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest leading-relaxed">Cancelling this booking will void all associated boarding passes and seat assignments. This action is permanent and cannot be reversed.</p>
               </div>
            </div>

            <div className="space-y-4">
               <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em]">Booking Summary</p>
               <div className="p-6 rounded-2xl border border-navy-50 bg-navy-50/20 space-y-4">
                  {[
                     { lbl: 'Booking Reference', val: booking.pnr },
                     { lbl: 'Flight', val: `${booking.flightNumber} • ${booking.origin.code} → ${booking.destination.code}` },
                     { lbl: 'Date', val: booking.departureTime.toDate().toLocaleDateString('en-US') },
                     { lbl: 'Total Paid', val: `$${booking.totalAmount.toFixed(2)}` },
                  ].map((d, i) => (
                     <div key={i} className="flex justify-between items-center py-2 border-b border-navy-50 last:border-0">
                        <span className="text-[9px] font-black text-navy-400 uppercase tracking-widest">{d.lbl}</span>
                        <span className="text-xs font-black text-navy-950 uppercase tracking-tight">{d.val}</span>
                     </div>
                  ))}
               </div>
            </div>

            <div className="space-y-4">
               <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em]">Refund Estimate</p>
               <div className="p-6 rounded-2xl border-2 border-dashed border-navy-100 bg-white">
                  <div className="flex justify-between items-end">
                     <div>
                        <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest mb-1">Estimated refund to original payment method</p>
                        <p className="text-3xl font-black text-navy-950 tracking-tighter">${refundAmount.toFixed(2)}</p>
                     </div>
                     <p className="text-[8px] font-bold text-navy-300 uppercase tracking-widest">Taxes & fees non-refundable</p>
                  </div>
               </div>
            </div>

            <label className="flex items-center gap-4 p-6 rounded-2xl border-2 border-navy-100 hover:border-red-300 transition-all cursor-pointer group bg-navy-50/20">
               <input type="checkbox" checked={confirmed} onChange={() => setConfirmed(!confirmed)} className="size-6 rounded-lg border-2 border-navy-200 text-red-600 focus:ring-red-500 transition-all" />
               <span className="text-[10px] font-black text-navy-700 uppercase tracking-widest group-hover:text-navy-950">I understand this cancellation is permanent and I agree to the refund terms.</span>
            </label>
         </div>
      </ModalShell>
   );
};

export default CancelBookingModal;
