
import React, { useState } from 'react';

interface CheckinDeclarationProps {
  onNext: () => void;
  onBack: () => void;
}

const CheckinDeclaration: React.FC<CheckinDeclarationProps> = ({ onNext, onBack }) => {
  const [accepted, setAccepted] = useState(false);

  const restrictedItems = [
    { icon: 'explosive', label: 'Explosives', desc: 'Fireworks, flares, ammunition' },
    { icon: 'gas_meter', label: 'Compressed Gases', desc: 'Camping gas, aerosol sprays' },
    { icon: 'local_fire_department', label: 'Flammable Fluids', desc: 'Fuel, paints, lighter refill' },
    { icon: 'science', label: 'Oxidizing Agents', desc: 'Bleach, chemical peroxide' },
    { icon: 'vaccines', label: 'Toxic Materials', desc: 'Poisons, infectious nodes' },
    { icon: 'radioactive', label: 'Radioactive Node', desc: 'Scientific instrumentation' },
    { icon: 'liquids', label: 'Corrosive Logic', desc: 'Mercury, battery acids' },
    { icon: 'battery_alert', label: 'Lithium Battery', desc: 'Damaged cells, high-cap packs' }
  ];

  return (
    <div className="p-8 md:p-20 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 font-display">
       <div className="text-center space-y-6 flex flex-col items-center py-6">
        <div className="relative group">
           <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-20"></div>
           <div className="relative size-24 rounded-full bg-red-50 text-red-600 flex items-center justify-center shadow-inner border border-red-100/50">
              <span className="material-symbols-outlined text-6xl font-black">warning</span>
           </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">Safety Compliance Registry</h1>
          <p className="text-navy-400 font-bold text-lg max-w-2xl mx-auto italic uppercase tracking-wider">
             Civil aviation regulation mandates the disclosure of all prohibited hazardous materials within your cargo sequence.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[4rem] border-2 border-navy-100 p-12 shadow-xl space-y-12 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-navy-950 pointer-events-none"><span className="material-symbols-outlined text-[180px] font-black">security</span></div>
         
         <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
            {restrictedItems.map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-4 p-6 rounded-3xl bg-navy-50/50 border border-navy-50 hover:bg-white hover:shadow-lg transition-all group/item">
                 <span className="material-symbols-outlined text-3xl text-red-500 font-black transition-transform group-hover/item:scale-110">{item.icon}</span>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-navy-950 uppercase tracking-widest">{item.label}</p>
                    <p className="text-[8px] font-bold text-navy-400 uppercase tracking-widest opacity-60 leading-tight">{item.desc}</p>
                 </div>
              </div>
            ))}
         </div>

         <div className="pt-12 border-t border-navy-50 space-y-8 relative z-10">
            <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 flex gap-6 items-start shadow-inner">
               <span className="material-symbols-outlined text-amber-600 font-black p-2 bg-white rounded-xl shadow-sm">info</span>
               <div className="space-y-2">
                  <p className="text-sm font-black text-amber-950 uppercase tracking-tight">Personnel Compliance Agreement</p>
                  <p className="text-[10px] font-bold text-amber-800 uppercase leading-relaxed tracking-wider opacity-80">
                     Failure to comply with safety protocols constitutes a breach of the Deltablue Jet Air Master Registry Agreement. I acknowledge that I am not transporting any items listed above in my checked or carry-on assets.
                  </p>
               </div>
            </div>

            <label className="flex items-center gap-6 p-8 rounded-[2.5rem] border-2 border-navy-100 hover:border-primary transition-all cursor-pointer group bg-navy-50/30">
               <div className="relative">
                  <input type="checkbox" checked={accepted} onChange={() => setAccepted(!accepted)} className="peer size-8 rounded-xl border-2 border-navy-200 text-primary focus:ring-primary transition-all" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 pointer-events-none">
                     <span className="material-symbols-outlined text-white text-xl font-black">check</span>
                  </div>
               </div>
               <span className="text-[11px] font-black text-navy-700 uppercase tracking-widest group-hover:text-navy-950">I solemnly certify that my baggage nodes comply with all global safety regulations.</span>
            </label>
         </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-10">
         <button onClick={onBack} className="text-[10px] font-black text-navy-300 uppercase tracking-widest hover:text-navy-900 transition-colors">Abort Registry Entry</button>
         <button 
           disabled={!accepted}
           onClick={onNext} 
           className={`px-16 py-6 font-black uppercase tracking-[0.25em] text-xs rounded-[2rem] shadow-2xl transition-all flex items-center gap-4 ${
             accepted ? 'bg-primary text-white shadow-primary/30 hover:scale-105 active:scale-95' : 'bg-navy-100 text-navy-300 cursor-not-allowed'
           }`}
         >
            Authorize Compliance <span className="material-symbols-outlined text-xl">verified</span>
         </button>
      </div>
    </div>
  );
};

export default CheckinDeclaration;
