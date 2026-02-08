
import React, { useState } from 'react';

interface CheckinSeatsProps {
  onNext: () => void;
  onBack: () => void;
}

const CheckinSeats: React.FC<CheckinSeatsProps> = ({ onNext, onBack }) => {
  const [selectedSeat, setSelectedSeat] = useState<string | null>('12A'); // Pre-assigned seat

  const rows = Array.from({ length: 11 }, (_, i) => i + 1);
  const occupiedSeats = ['2A', '4B', '4C', '7A', '10C', '1B', '1C', '2B', '5A', '5B', '6C', '9A'];

  const handleSeatClick = (seat: string) => {
    if (!occupiedSeats.includes(seat)) {
      setSelectedSeat(seat);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10 animate-in zoom-in duration-500 font-sans min-h-screen">
      <div className="flex flex-col gap-4">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
          <button onClick={onBack} className="hover:text-primary transition-colors">Compliance</button>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary">Seat Audit</span>
        </nav>
        <div className="flex justify-between items-end border-b border-navy-100 pb-8">
           <div className="space-y-2">
              <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Sequence Allocation</h1>
              <p className="text-navy-500 font-medium italic text-lg opacity-80 uppercase tracking-widest">Review or modify your assigned seating pod for Flight DJ-102.</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-8 flex flex-col items-center">
          
          <div className="flex flex-wrap gap-6 bg-white p-6 rounded-[2rem] border border-navy-100 shadow-sm mb-12 w-full max-w-2xl justify-center">
            {[
              { color: 'bg-white border-navy-200', label: 'Standard' },
              { color: 'bg-primary border-primary', label: 'Assigned' },
              { color: 'bg-navy-100 text-navy-300', label: 'Occupied' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`size-5 rounded-lg border-2 ${item.color}`}></div>
                <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Aircraft Body Render (Partial) */}
          <div className="relative w-full max-w-[400px] flex flex-col items-center select-none scale-90">
             <div className="w-[280px] bg-white border-x-4 border-navy-100 flex flex-col pt-8 pb-12 rounded-t-[100px] relative">
                <div className="flex flex-col gap-5 px-8">
                   <div className="flex justify-between px-6 text-[10px] font-black text-navy-200 uppercase tracking-widest mb-4">
                      <div className="w-10 text-center">A</div>
                      <div className="flex gap-4 w-[80px] justify-center">
                         <span className="w-10 text-center">B</span>
                         <span className="w-10 text-center">C</span>
                      </div>
                   </div>

                   {rows.map((row) => (
                     <div key={row} className="relative flex justify-between items-center group">
                        <button 
                          onClick={() => handleSeatClick(`${row}A`)}
                          className={`size-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border-2 ${
                            selectedSeat === `${row}A` ? 'bg-primary text-white border-primary scale-110 shadow-lg' :
                            occupiedSeats.includes(`${row}A`) ? 'bg-navy-100 border-navy-200 text-navy-300 cursor-not-allowed' :
                            'bg-white border-navy-200 text-navy-400 hover:border-primary'
                          }`}
                        >
                           {`${row}A`}
                        </button>

                        <span className="text-[8px] font-black text-navy-100 rotate-90 opacity-40">{row}</span>

                        <div className="flex gap-4">
                           {['B', 'C'].map(col => (
                             <button 
                               key={col}
                               onClick={() => handleSeatClick(`${row}${col}`)}
                               className={`size-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border-2 ${
                                 selectedSeat === `${row}${col}` ? 'bg-primary text-white border-primary scale-110 shadow-lg' :
                                 occupiedSeats.includes(`${row}${col}`) ? 'bg-navy-100 border-navy-200 text-navy-300 cursor-not-allowed' :
                                 'bg-white border-navy-200 text-navy-400 hover:border-primary'
                               }`}
                             >
                                {`${row}${col}`}
                             </button>
                           ))}
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-[3rem] border border-navy-100 shadow-2xl p-10 space-y-10 sticky top-10">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest">Active Personnel</p>
                 <h2 className="text-3xl font-black text-navy-950 uppercase tracking-tighter">Chen, Marcus</h2>
              </div>

              <div className="bg-navy-950 p-8 rounded-[2.5rem] space-y-4 relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 left-0 w-2 h-full bg-primary shadow-[0_0_15px_rgba(19,127,236,0.8)]"></div>
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Validated Pod</p>
                 <div className="text-7xl font-black text-white tracking-tighter">{selectedSeat}</div>
                 <p className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] pt-4">Window Registry • Node Alpha</p>
              </div>

              <div className="p-6 bg-navy-50 rounded-3xl border border-navy-100 flex gap-4 items-start shadow-inner">
                 <span className="material-symbols-outlined text-primary font-black">tips_and_updates</span>
                 <p className="text-[9px] font-bold text-navy-500 uppercase leading-relaxed tracking-wider opacity-70">
                    Switching pods at check-in is complimentary for Executive Class personnel. Changes are held for 15 minutes before registry release.
                 </p>
              </div>

              <div className="space-y-4 pt-4">
                 <button onClick={onNext} className="w-full py-6 bg-primary text-white font-black uppercase tracking-[0.2em] text-xs rounded-3xl shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4">
                    Commit Sequence <span className="material-symbols-outlined">check_circle</span>
                 </button>
                 <button onClick={onBack} className="w-full py-4 text-[10px] font-black text-navy-400 uppercase tracking-widest hover:text-navy-950">Abort Selection</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CheckinSeats;
