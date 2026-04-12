import React, { useState, useEffect, useCallback } from 'react';

export interface ModalShellProps {
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

export default ModalShell;
