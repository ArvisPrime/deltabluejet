
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { BRAND } from '../../config/brand';
import { ROUTES } from '../../config/routes';

/* ─── Shared Modal Shell ────────────────────────────────────────────── */
interface ModalShellProps {
   open: boolean;
   onClose: () => void;
   title: string;
   subtitle?: string;
   icon: string;
   iconColor?: string;
   children: React.ReactNode;
   footer?: React.ReactNode;
   maxWidth?: string;
}

const ModalShell: React.FC<ModalShellProps> = ({ open, onClose, title, subtitle, icon, iconColor = 'text-primary', children, footer, maxWidth = 'max-w-2xl' }) => {
   const [visible, setVisible] = useState(false);

   useEffect(() => {
      if (open) requestAnimationFrame(() => setVisible(true));
      else setVisible(false);
   }, [open]);

   const handleClose = useCallback(() => {
      setVisible(false);
      setTimeout(onClose, 300);
   }, [onClose]);

   useEffect(() => {
      if (!open) return;
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
   }, [open, handleClose]);

   if (!open) return null;

   return (
      <div className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center transition-all duration-300 ${visible ? 'bg-navy-950/60 backdrop-blur-sm' : 'bg-transparent'}`} onClick={handleClose}>
         <div
            className={`relative w-full ${maxWidth} max-h-[90vh] bg-white rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl shadow-navy-950/30 overflow-hidden flex flex-col transition-all duration-500 ease-out ${visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'}`}
            onClick={(e) => e.stopPropagation()}
         >
            {/* Header */}
            <div className="px-10 pt-10 pb-8 border-b border-navy-100 shrink-0 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-[0.03]"><span className="material-symbols-outlined text-[120px] font-black">{icon}</span></div>
               <button onClick={handleClose} className="absolute top-6 right-6 z-10 size-10 rounded-2xl bg-navy-50 hover:bg-navy-100 flex items-center justify-center transition-all hover:scale-110 active:scale-95">
                  <span className="material-symbols-outlined text-navy-400 text-xl">close</span>
               </button>
               <div className="flex items-center gap-5 relative z-10">
                  <div className={`size-14 rounded-[1.5rem] bg-navy-50 flex items-center justify-center shadow-inner ${iconColor}`}>
                     <span className="material-symbols-outlined text-2xl font-black">{icon}</span>
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-navy-950 tracking-tighter uppercase leading-none">{title}</h2>
                     {subtitle && <p className="text-[9px] font-bold text-navy-400 uppercase tracking-[0.2em] mt-2">{subtitle}</p>}
                  </div>
               </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">{children}</div>

            {/* Footer */}
            {footer && <div className="shrink-0 px-10 py-6 border-t border-navy-100 bg-navy-50/20">{footer}</div>}
         </div>
      </div>
   );
};

/* ─── Change Flight Modal ───────────────────────────────────────────── */
const ChangeFlightModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
   const [selectedDate, setSelectedDate] = useState('2024-10-28');
   return (
      <ModalShell open={open} onClose={onClose} title="Change Flight" subtitle="DJ 402 • JFK → LHR • Currently Oct 24" icon="edit_calendar"
         footer={
            <div className="flex items-center justify-between">
               <p className="text-[9px] font-bold text-navy-300 uppercase tracking-widest italic">Fare difference may apply</p>
               <div className="flex gap-3">
                  <button onClick={onClose} className="px-8 py-3 border-2 border-navy-100 text-navy-700 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-navy-50 transition-all">Cancel</button>
                  <button onClick={onClose} className="px-10 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Search Available Flights</button>
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
                     <p className="text-lg font-black text-navy-950 tracking-tight">JFK — New York</p>
                  </div>
                  <div className="p-5 rounded-2xl border-2 border-primary bg-primary/5">
                     <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest mb-1">To</p>
                     <p className="text-lg font-black text-navy-950 tracking-tight">LHR — London</p>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em]">Current Booking</p>
               <div className="p-6 rounded-2xl border border-navy-50 bg-navy-50/20">
                  <div className="grid grid-cols-3 gap-4">
                     {[
                        { lbl: 'Flight', val: 'DJ 402' },
                        { lbl: 'Date', val: 'Oct 24, 2024' },
                        { lbl: 'Class', val: 'Executive' }
                     ].map((d, i) => (
                        <div key={i}>
                           <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest mb-1">{d.lbl}</p>
                           <p className="text-sm font-black text-navy-950 uppercase tracking-tight">{d.val}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </ModalShell>
   );
};

/* ─── Upgrade Class Modal ───────────────────────────────────────────── */
const UpgradeClassModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
   const [selectedClass, setSelectedClass] = useState<string | null>(null);
   const classes = [
      { id: 'premium', name: 'Premium Economy', price: '+$280', seat: '38" pitch • 19" wide', perks: ['Priority Boarding', 'Extra Legroom', 'Premium Meal'], icon: 'airline_seat_recline_extra', color: 'border-indigo-200 bg-indigo-50/30', badge: 'bg-indigo-100 text-indigo-700' },
      { id: 'executive', name: 'Executive Class', price: '+$860', seat: '78" lie-flat • 22" wide', perks: ['Lounge Access', 'Lie-Flat Seat', 'Premium Dining', 'Priority Baggage'], icon: 'airline_seat_flat', color: 'border-amber-200 bg-amber-50/30', badge: 'bg-amber-100 text-amber-700', recommended: true },
   ];

   return (
      <ModalShell open={open} onClose={onClose} title="Upgrade Class" subtitle="Current: Economy • DJ 402 JFK → LHR" icon="auto_awesome"
         footer={
            <div className="flex items-center justify-between">
               <p className="text-[9px] font-bold text-navy-300 uppercase tracking-widest italic">{selectedClass ? 'Upgrade price shown per passenger' : 'Select a class to continue'}</p>
               <div className="flex gap-3">
                  <button onClick={onClose} className="px-8 py-3 border-2 border-navy-100 text-navy-700 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-navy-50 transition-all">Cancel</button>
                  <button disabled={!selectedClass} onClick={onClose} className={`px-10 py-3 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-lg transition-all ${selectedClass ? 'bg-primary text-white shadow-primary/20 hover:scale-[1.02] active:scale-95' : 'bg-navy-100 text-navy-300 cursor-not-allowed'}`}>Confirm Upgrade</button>
               </div>
            </div>
         }
      >
         <div className="space-y-6">
            {classes.map((cls) => (
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
            ))}
         </div>
      </ModalShell>
   );
};

/* ─── Select Seat Modal ─────────────────────────────────────────────── */
const SelectSeatModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
   const [selectedSeat, setSelectedSeat] = useState('4A');
   const rows = [
      { row: 1, seats: ['1A', '1B', null, '1C', '1D'], status: ['taken', 'taken', null, 'available', 'taken'] },
      { row: 2, seats: ['2A', '2B', null, '2C', '2D'], status: ['available', 'taken', null, 'available', 'available'] },
      { row: 3, seats: ['3A', '3B', null, '3C', '3D'], status: ['available', 'available', null, 'taken', 'available'] },
      { row: 4, seats: ['4A', '4B', null, '4C', '4D'], status: ['current', 'current', null, 'available', 'taken'] },
      { row: 5, seats: ['5A', '5B', null, '5C', '5D'], status: ['available', 'available', null, 'available', 'available'] },
      { row: 6, seats: ['6A', '6B', null, '6C', '6D'], status: ['taken', 'available', null, 'taken', 'available'] },
   ];

   return (
      <ModalShell open={open} onClose={onClose} title="Select Seat" subtitle="Executive Class • DJ 402 • Rows 1–6" icon="grid_view"
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
                  <button onClick={onClose} className="px-10 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Confirm Seat {selectedSeat}</button>
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
                        const isCurrent = st === 'current';
                        const isTaken = st === 'taken';
                        return (
                           <button
                              key={si}
                              disabled={isTaken}
                              onClick={() => setSelectedSeat(seat)}
                              className={`size-10 rounded-xl text-[9px] font-black uppercase transition-all ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' :
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
         </div>
      </ModalShell>
   );
};

/* ─── Cancel Booking Modal ──────────────────────────────────────────── */
const CancelBookingModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
   const [confirmed, setConfirmed] = useState(false);
   return (
      <ModalShell open={open} onClose={onClose} title="Cancel Booking" subtitle="This action cannot be undone" icon="block" iconColor="text-red-500"
         footer={
            <div className="flex items-center justify-between">
               <button onClick={onClose} className="px-8 py-3 border-2 border-navy-100 text-navy-700 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-navy-50 transition-all">Keep Booking</button>
               <button disabled={!confirmed} onClick={onClose} className={`px-10 py-3 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-lg transition-all ${confirmed ? 'bg-red-600 text-white shadow-red-600/20 hover:scale-[1.02] active:scale-95' : 'bg-navy-100 text-navy-300 cursor-not-allowed'}`}>Cancel Booking</button>
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
                     { lbl: 'Booking Reference', val: 'XYZ123' },
                     { lbl: 'Flight', val: 'DJ 402 • JFK → LHR' },
                     { lbl: 'Date', val: 'Oct 24, 2024' },
                     { lbl: 'Passengers', val: '2 (Marcus Chen, Elena Chen)' },
                     { lbl: 'Total Paid', val: '$1,195.50' },
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
                        <p className="text-3xl font-black text-navy-950 tracking-tighter">$975.00</p>
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

/* ─── Edit Passenger Details Modal ──────────────────────────────────── */
const EditPassengerModal: React.FC<{ open: boolean; onClose: () => void; passenger: { name: string; id: string; seat: string; tier: string } | null }> = ({ open, onClose, passenger }) => {
   const [formData, setFormData] = useState({
      firstName: '', lastName: '', email: '', phone: '', passport: '', nationality: ''
   });

   useEffect(() => {
      if (passenger) {
         const [last, first] = passenger.name.split(', ');
         setFormData({
            firstName: first || '', lastName: last || '',
            email: `${(first || '').toLowerCase()}.${(last || '').toLowerCase()}@email.com`,
            phone: '+1 (555) 012-3456', passport: 'US98712345', nationality: 'United States'
         });
      }
   }, [passenger]);

   if (!passenger) return null;

   const fields = [
      { key: 'firstName', label: 'First Name', icon: 'person', type: 'text' },
      { key: 'lastName', label: 'Last Name', icon: 'person', type: 'text' },
      { key: 'email', label: 'Email Address', icon: 'email', type: 'email' },
      { key: 'phone', label: 'Phone Number', icon: 'phone', type: 'tel' },
      { key: 'passport', label: 'Passport Number', icon: 'badge', type: 'text' },
      { key: 'nationality', label: 'Nationality', icon: 'flag', type: 'text' },
   ] as const;

   return (
      <ModalShell open={open} onClose={onClose} title="Edit Passenger" subtitle={`${passenger.name} • ${passenger.id}`} icon="person_edit"
         footer={
            <div className="flex items-center justify-between">
               <p className="text-[9px] font-bold text-navy-300 uppercase tracking-widest italic">Changes apply to this booking only</p>
               <div className="flex gap-3">
                  <button onClick={onClose} className="px-8 py-3 border-2 border-navy-100 text-navy-700 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-navy-50 transition-all">Cancel</button>
                  <button onClick={onClose} className="px-10 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Save Changes</button>
               </div>
            </div>
         }
      >
         <div className="space-y-8">
            <div className="flex items-center gap-5 p-6 rounded-3xl bg-navy-50/30 border border-navy-100">
               <div className="size-14 rounded-[1.5rem] bg-navy-950 text-primary flex items-center justify-center font-black text-xl shadow-xl">{passenger.name.charAt(0)}</div>
               <div>
                  <p className="text-lg font-black text-navy-950 uppercase tracking-tight">{passenger.name}</p>
                  <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest">Seat {passenger.seat} • {passenger.tier}</p>
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
                        value={formData[f.key]}
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

/* ─── Change Meal Selection Modal ───────────────────────────────────── */
const ChangeMealModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
   const [selectedMeal, setSelectedMeal] = useState('standard');
   const meals = [
      { id: 'standard', name: 'Standard Meal', desc: 'Chef\'s choice entrée with seasonal sides', icon: 'restaurant', tags: [] },
      { id: 'vegetarian', name: 'Vegetarian', desc: 'Plant-based entrée with fresh vegetables', icon: 'eco', tags: ['Vegetarian'] },
      { id: 'vegan', name: 'Vegan', desc: 'Fully plant-based with no animal products', icon: 'spa', tags: ['Vegan', 'Dairy-Free'] },
      { id: 'halal', name: 'Halal', desc: 'Halal-certified meat with traditional sides', icon: 'dining', tags: ['Halal'] },
      { id: 'kosher', name: 'Kosher', desc: 'Kosher-certified meal prepared to dietary law', icon: 'star_of_david', tags: ['Kosher'] },
      { id: 'glutenfree', name: 'Gluten-Free', desc: 'Entrée prepared without gluten ingredients', icon: 'grain', tags: ['Gluten-Free'] },
   ];

   return (
      <ModalShell open={open} onClose={onClose} title="Meal Selection" subtitle="DJ 402 • JFK → LHR • Executive Class" icon="restaurant"
         footer={
            <div className="flex items-center justify-between">
               <p className="text-[9px] font-bold text-navy-300 uppercase tracking-widest italic">Meal applies to all passengers</p>
               <div className="flex gap-3">
                  <button onClick={onClose} className="px-8 py-3 border-2 border-navy-100 text-navy-700 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-navy-50 transition-all">Cancel</button>
                  <button onClick={onClose} className="px-10 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Confirm Meal</button>
               </div>
            </div>
         }
      >
         <div className="space-y-4">
            {meals.map((meal) => (
               <button
                  key={meal.id}
                  onClick={() => setSelectedMeal(meal.id)}
                  className={`w-full text-left p-6 rounded-3xl border-2 transition-all flex items-center gap-5 group ${selectedMeal === meal.id ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-navy-100 bg-white hover:border-navy-200 hover:shadow-md'}`}
               >
                  <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${selectedMeal === meal.id ? 'bg-primary text-white' : 'bg-navy-50 text-navy-400 group-hover:bg-navy-100'}`}>
                     <span className="material-symbols-outlined text-xl font-black">{meal.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-3">
                        <h4 className="text-sm font-black text-navy-950 uppercase tracking-tight">{meal.name}</h4>
                        {meal.tags.map((tag, ti) => (
                           <span key={ti} className="text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">{tag}</span>
                        ))}
                     </div>
                     <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest mt-1">{meal.desc}</p>
                  </div>
                  {selectedMeal === meal.id && <span className="material-symbols-outlined text-primary text-xl shrink-0">check_circle</span>}
               </button>
            ))}
         </div>
      </ModalShell>
   );
};

/* ─── Special Assistance Modal ──────────────────────────────────────── */
const SpecialAssistanceModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
   const [selected, setSelected] = useState<string[]>([]);
   const [notes, setNotes] = useState('');
   const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

   const services = [
      { id: 'wheelchair', name: 'Wheelchair Assistance', desc: 'Support through the airport and to your seat', icon: 'accessible' },
      { id: 'visual', name: 'Visual Impairment', desc: 'Guided assistance and audio announcements', icon: 'visibility_off' },
      { id: 'hearing', name: 'Hearing Impairment', desc: 'Visual notifications and written assistance', icon: 'hearing_disabled' },
      { id: 'medical', name: 'Medical Equipment', desc: 'Oxygen, CPAP devices, or other medical needs', icon: 'medical_services' },
      { id: 'elderly', name: 'Elderly Assistance', desc: 'Priority boarding and additional cabin support', icon: 'elderly' },
      { id: 'minor', name: 'Unaccompanied Minor', desc: 'Supervised care for children travelling alone', icon: 'child_care' },
   ];

   return (
      <ModalShell open={open} onClose={onClose} title="Special Assistance" subtitle="We're here to help make your journey comfortable" icon="accessibility_new"
         footer={
            <div className="flex items-center justify-between">
               <p className="text-[9px] font-bold text-navy-300 uppercase tracking-widest italic">{selected.length} service{selected.length !== 1 ? 's' : ''} selected</p>
               <div className="flex gap-3">
                  <button onClick={onClose} className="px-8 py-3 border-2 border-navy-100 text-navy-700 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-navy-50 transition-all">Cancel</button>
                  <button onClick={onClose} className="px-10 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Submit Request</button>
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
               {services.map((svc) => {
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

/* ─── Invoice Download Helper ───────────────────────────────────────── */
const handleInvoiceDownload = () => {
   const invoiceHTML = `
<!DOCTYPE html><html><head><title>Invoice DJ-99211</title>
<style>
   body{font-family:Arial,Helvetica,sans-serif;max-width:700px;margin:40px auto;padding:20px;color:#1a1a2e}
   h1{font-size:28px;margin:0 0 4px}h2{font-size:14px;color:#666;text-transform:uppercase;letter-spacing:2px;margin:0 0 30px}
   .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #eee;padding-bottom:20px;margin-bottom:30px}
   .brand{font-size:22px;font-weight:900;letter-spacing:-1px}
   table{width:100%;border-collapse:collapse;margin:20px 0}td,th{padding:10px 12px;text-align:left;border-bottom:1px solid #eee;font-size:13px}
   th{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;font-weight:700}
   .total-row td{font-weight:900;font-size:18px;border-top:2px solid #1a1a2e;border-bottom:none}
   .footer{margin-top:40px;font-size:10px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:16px}
</style></head><body>
<div class="header"><div><div class="brand">${BRAND.shortName}</div><h2>Booking Invoice</h2></div><div style="text-align:right;font-size:12px"><strong>Invoice #DJ-99211</strong><br>Date: Oct 24, 2024<br>PNR: XYZ123</div></div>
<p style="font-size:12px;margin-bottom:20px"><strong>Passenger:</strong> Marcus Chen, Elena Chen<br><strong>Flight:</strong> DJ 402 • JFK → LHR &bull; Oct 24, 2024<br><strong>Class:</strong> Executive</p>
<table><tr><th>Description</th><th style="text-align:right">Amount</th></tr>
<tr><td>Executive Class Fare (×2 passengers)</td><td style="text-align:right">$1,020.00</td></tr>
<tr><td>Taxes & Fees</td><td style="text-align:right">$220.50</td></tr>
<tr><td style="color:green">Loyalty Credit Applied</td><td style="text-align:right;color:green">-$45.00</td></tr>
<tr class="total-row"><td>Total Paid</td><td style="text-align:right">$1,195.50</td></tr></table>
<p style="font-size:11px;color:#666;margin-top:24px"><strong>Payment:</strong> Visa ending •••• 4821 &bull; Charged Oct 22, 2024</p>
<div class="footer">${BRAND.name} &bull; Invoice generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
</body></html>`;

   const blob = new Blob([invoiceHTML], { type: 'text/html' });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = 'Invoice-DJ-99211-XYZ123.html';
   document.body.appendChild(a);
   a.click();
   document.body.removeChild(a);
   URL.revokeObjectURL(url);
};

/* ─── Main Component ────────────────────────────────────────────────── */
const BookingDetail: React.FC = () => {
   const navigate = useNavigate();
   const [changeFlightOpen, setChangeFlightOpen] = useState(false);
   const [upgradeClassOpen, setUpgradeClassOpen] = useState(false);
   const [selectSeatOpen, setSelectSeatOpen] = useState(false);
   const [cancelBookingOpen, setCancelBookingOpen] = useState(false);
   const [editPassengerOpen, setEditPassengerOpen] = useState(false);
   const [editingPassenger, setEditingPassenger] = useState<{ name: string; id: string; seat: string; tier: string } | null>(null);
   const [changeMealOpen, setChangeMealOpen] = useState(false);
   const [specialAssistOpen, setSpecialAssistOpen] = useState(false);

   return (
      <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 font-display pb-32 bg-white/10 min-h-screen">
         {/* Breadcrumbs */}
         <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">
            <button onClick={() => navigate(ROUTES.HOME)} className="hover:text-primary transition-all">Home</button>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary">Booking Summary</span>
         </nav>

         {/* Page Heading & Actions */}
         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
            <div className="space-y-3">
               <div className="flex items-center gap-4">
                  <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">London Heathrow (LHR)</h1>
                  <span className="px-5 py-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-lg">Confirmed</span>
               </div>
               <div className="flex flex-wrap items-center gap-6 text-navy-400 font-bold text-xs uppercase tracking-widest">
                  <p className="flex items-center gap-2">Reference: <span className="text-navy-950 font-black select-all">XYZ123</span> <button onClick={() => { navigator.clipboard.writeText('XYZ123'); useToastStore.getState().addToast('Reference code copied to clipboard', 'success'); }} className="hover:text-primary transition-all cursor-pointer"><span className="material-symbols-outlined text-navy-200 hover:text-primary text-sm">content_copy</span></button></p>
                  <span className="size-1.5 rounded-full bg-navy-100"></span>
                  <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black">
                     <span className="material-symbols-outlined text-sm">check_circle</span> Booking Confirmed
                  </div>
               </div>
            </div>
            <div className="flex gap-4 w-full lg:w-auto">
               <button onClick={() => { if (navigator.share) { navigator.share({ title: 'Booking XYZ123', text: 'Flight DJ 402 — JFK to LHR', url: window.location.href }).catch(() => {}); } else { navigator.clipboard.writeText(window.location.href); useToastStore.getState().addToast('Booking link copied to clipboard', 'success'); } }} className="flex-1 lg:flex-none h-14 px-10 rounded-[1.5rem] bg-white border-2 border-navy-100 text-navy-700 text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 transition-all shadow-sm flex items-center justify-center gap-3">
                  <span className="material-symbols-outlined text-xl">share</span> Share Booking
               </button>
               <button
                  onClick={() => navigate(ROUTES.CHECKIN, { state: { pnr: 'XYZ123', fromBookingDetail: true } })}
                  className="flex-1 lg:flex-none h-14 px-12 rounded-[1.5rem] bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 transition-all flex items-center justify-center gap-4"
               >
                  <span className="material-symbols-outlined text-2xl font-black">check_circle</span> Online Check-in
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
            {/* Left Column: Itinerary and Passengers */}
            <div className="xl:col-span-8 space-y-12">

               {/* Flight Itinerary Card */}
               <div className="bg-white rounded-[4rem] border border-navy-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] overflow-hidden group relative">
                  <div className="px-12 py-8 border-b border-navy-50 flex justify-between items-center bg-navy-50/20">
                     <h2 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary font-black">flight</span> Flight Itinerary
                     </h2>
                     <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Departure: Oct 24, 2024</span>
                  </div>
                  <div className="p-16 space-y-16">
                     <div className="flex flex-col md:flex-row gap-12 md:items-center">
                        <div className="flex flex-col min-w-[160px]">
                           <span className="text-6xl font-black text-navy-950 tracking-tighter">18:00</span>
                           <span className="text-2xl font-black text-primary uppercase mt-2">JFK</span>
                           <span className="text-[11px] font-bold text-navy-400 uppercase tracking-widest mt-1">New York (JFK)</span>
                           <span className="text-[9px] font-black text-navy-200 uppercase tracking-[0.25em] mt-3">Terminal 4</span>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center px-6 relative min-h-[100px]">
                           <div className="w-full h-0.5 bg-navy-100 relative flex items-center justify-center">
                              <div className="absolute left-0 size-3 rounded-full bg-primary ring-8 ring-white shadow-lg"></div>
                              <div className="absolute right-0 size-3 rounded-full bg-primary ring-8 ring-white shadow-lg"></div>
                              <div className="absolute left-[42%] bg-navy-950 p-4 rounded-[2rem] text-primary z-10 shadow-2xl group-hover:scale-110 group-hover:rotate-45 transition-all duration-700 ring-4 ring-white">
                                 <span className="material-symbols-outlined rotate-90 text-3xl block font-black">flight</span>
                              </div>
                           </div>
                           <div className="mt-12 flex flex-col items-center gap-2">
                              <span className="text-[10px] font-black text-navy-400 uppercase tracking-[0.4em]">DJ 402 • 6h 30m Direct</span>
                              <span className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100">Live: On Schedule</span>
                           </div>
                        </div>

                        <div className="flex flex-col text-right min-w-[160px]">
                           <span className="text-6xl font-black text-navy-950 tracking-tighter">06:30<sup className="text-xl font-black text-primary ml-1">+1</sup></span>
                           <span className="text-2xl font-black text-primary uppercase mt-2">LHR</span>
                           <span className="text-[11px] font-bold text-navy-400 uppercase tracking-widest mt-1">London Heathrow</span>
                           <span className="text-[9px] font-black text-navy-200 uppercase tracking-[0.25em] mt-3">Terminal 2</span>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pt-12 border-t border-navy-50">
                        {[
                           { icon: 'airline_seat_recline_extra', lbl: 'Class', val: 'Executive Flex' },
                           { icon: 'luggage', lbl: 'Baggage', val: '2× 23 kg Included' },
                           { icon: 'lunch_dining', lbl: 'Meal Service', val: 'Full Selection' },
                           { icon: 'wifi', lbl: 'Wi-Fi', val: 'High-Speed' }
                        ].map((d, i) => (
                           <div key={i} className="space-y-1 group/item">
                              <div className="flex items-center gap-2 text-navy-300 group-hover/item:text-primary transition-colors">
                                 <span className="material-symbols-outlined text-lg">{d.icon}</span>
                                 <span className="text-[9px] font-black uppercase tracking-widest">{d.lbl}</span>
                              </div>
                              <p className="text-sm font-black text-navy-950 uppercase tracking-tight">{d.val}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Action Grid */}
               <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] px-6">Manage Booking</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                     {[
                        { label: 'Change Flight', icon: 'edit_calendar', desc: 'Change date or route', onClick: () => setChangeFlightOpen(true) },
                        { label: 'Upgrade Class', icon: 'auto_awesome', desc: 'Premium cabins', onClick: () => setUpgradeClassOpen(true) },
                        { label: 'Select Seat', icon: 'grid_view', desc: 'Change seat', onClick: () => setSelectSeatOpen(true) },
                        { label: 'Cancel Booking', icon: 'block', color: 'text-red-500 hover:bg-red-50 hover:border-red-100', desc: 'Cancel & refund', onClick: () => setCancelBookingOpen(true) },
                     ].map((act, i) => (
                        <button
                           key={i}
                           onClick={act.onClick}
                           className={`flex flex-col items-center justify-center gap-4 p-10 rounded-[3rem] bg-white border border-navy-100 shadow-sm transition-all group hover:border-primary hover:shadow-2xl hover:-translate-y-2 ${act.color || ''}`}
                        >
                           <div className={`size-16 rounded-[1.75rem] bg-navy-50 flex items-center justify-center text-navy-400 group-hover:bg-primary group-hover:text-white transition-all shadow-inner`}>
                              <span className="material-symbols-outlined text-3xl font-black">{act.icon}</span>
                           </div>
                           <div className="text-center">
                              <span className="text-[11px] font-black text-navy-950 uppercase tracking-[0.2em]">{act.label}</span>
                              <p className="text-[8px] font-bold text-navy-300 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{act.desc}</p>
                           </div>
                        </button>
                     ))}
                  </div>
               </div>

               {/* Passenger Details */}
               <div className="bg-white rounded-[4rem] border border-navy-100 shadow-sm overflow-hidden">
                  <div className="px-12 py-8 border-b border-navy-50 bg-navy-50/20">
                     <h2 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary font-black">group</span> Passenger List
                     </h2>
                  </div>
                  <div className="divide-y divide-navy-50">
                     {[
                        { name: 'Chen, Marcus', seat: '4A', tier: 'Diamond Platinum', status: 'Confirmed', id: 'DB-88219' },
                        { name: 'Chen, Elena', seat: '4B', tier: 'Standard Executive', status: 'Confirmed', id: 'DB-88220' }
                     ].map((p, i) => (
                        <div key={i} className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-10 group hover:bg-navy-50/30 transition-all">
                           <div className="flex items-center gap-8">
                              <div className="size-16 rounded-[2rem] bg-navy-950 text-primary flex items-center justify-center font-black text-xl shadow-xl group-hover:scale-110 transition-transform">{p.name.charAt(0)}</div>
                              <div className="space-y-1">
                                 <h4 className="text-2xl font-black text-navy-950 uppercase tracking-tight">{p.name}</h4>
                                 <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest italic opacity-70">
                                    ID: {p.id} • Loyalty Tier: <span className="text-primary">{p.tier}</span>
                                 </p>
                              </div>
                           </div>
                           <div className="flex flex-wrap items-center gap-16">
                              <div className="space-y-1 text-center">
                                 <span className="text-[8px] font-black text-navy-300 uppercase tracking-[0.3em] block">Seat</span>
                                 <span className="text-3xl font-black text-navy-950 tracking-tighter">{p.seat}</span>
                              </div>
                              <div className="space-y-2">
                                 <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span> {p.status}
                                 </span>
                              </div>
                              <button onClick={() => { setEditingPassenger(p); setEditPassengerOpen(true); }} className="px-8 py-3 rounded-2xl border-2 border-navy-100 text-navy-700 text-[10px] font-black uppercase tracking-widest hover:border-primary hover:text-primary transition-all">Edit Details</button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Right Column: Financial & Services */}
            <div className="xl:col-span-4 space-y-10">
               {/* Payment Summary */}
               <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-2xl overflow-hidden sticky top-10">
                  <div className="px-10 py-6 border-b border-navy-50 bg-navy-50/20">
                     <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">Payment Summary</h2>
                  </div>
                  <div className="p-12 space-y-10">
                     <div className="space-y-6">
                        <div className="flex justify-between text-[11px] font-black text-navy-400 uppercase tracking-widest">
                           <span>Fare (×2)</span>
                           <span className="text-navy-950">$1,020.00</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-black text-navy-400 uppercase tracking-widest">
                           <span>Taxes & Fees</span>
                           <span className="text-navy-950">$220.50</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-black text-emerald-600 uppercase tracking-widest">
                           <span>Loyalty Credit Applied</span>
                           <span className="font-black">-$45.00</span>
                        </div>
                     </div>
                     <div className="pt-10 border-t-2 border-dashed border-navy-100 flex justify-between items-end">
                        <div className="space-y-1">
                           <span className="text-[10px] font-black text-navy-300 uppercase tracking-[0.4em]">Total Paid</span>
                           <p className="text-5xl font-black text-navy-950 tracking-tighter leading-none">$1,195.50</p>
                        </div>
                     </div>

                     <div className="bg-navy-950 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-white transition-transform group-hover:scale-110">
                           <span className="material-symbols-outlined text-[100px] font-black">receipt</span>
                        </div>
                        <div className="flex items-center gap-5 relative z-10">
                           <div className="p-3 bg-white/10 rounded-2xl border border-white/10 text-primary shadow-xl">
                              <span className="material-symbols-outlined">description</span>
                           </div>
                           <div className="space-y-1">
                              <p className="text-xs font-black text-white uppercase tracking-tight">Invoice #DJ-99211</p>
                              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Oct 24, 2024 Issued</p>
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

               {/* Support Notice */}
               <div className="bg-navy-50/50 p-10 rounded-[3rem] border border-navy-100 shadow-inner group">
                  <div className="flex gap-6 items-start">
                     <span className="material-symbols-outlined text-navy-300 font-black p-2 bg-white rounded-xl shadow-sm">support_agent</span>
                     <div className="space-y-3">
                        <p className="text-[11px] font-black text-navy-950 uppercase tracking-widest">Need Help?</p>
                        <p className="text-[9px] font-bold text-navy-400 uppercase leading-relaxed tracking-wider italic opacity-70">
                           Any changes made to this booking are final and will void all existing boarding passes. Please download new boarding passes after making any changes.
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Modals */}
         <ChangeFlightModal open={changeFlightOpen} onClose={() => setChangeFlightOpen(false)} />
         <UpgradeClassModal open={upgradeClassOpen} onClose={() => setUpgradeClassOpen(false)} />
         <SelectSeatModal open={selectSeatOpen} onClose={() => setSelectSeatOpen(false)} />
         <CancelBookingModal open={cancelBookingOpen} onClose={() => setCancelBookingOpen(false)} />
         <EditPassengerModal open={editPassengerOpen} onClose={() => { setEditPassengerOpen(false); setEditingPassenger(null); }} passenger={editingPassenger} />
         <ChangeMealModal open={changeMealOpen} onClose={() => setChangeMealOpen(false)} />
         <SpecialAssistanceModal open={specialAssistOpen} onClose={() => setSpecialAssistOpen(false)} />
      </div>
   );
};

export default BookingDetail;
