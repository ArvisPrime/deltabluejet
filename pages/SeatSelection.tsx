
import React, { useState } from 'react';

interface SeatSelectionProps {
  onBack: () => void;
  onNext: () => void;
}

const SeatSelection: React.FC<SeatSelectionProps> = ({ onBack, onNext }) => {
  const [activePassenger, setActivePassenger] = useState(1);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

  const rows = Array.from({ length: 11 }, (_, i) => i + 1);
  const occupiedSeats = ['2A', '4B', '4C', '7A', '10C'];

  const handleSeatClick = (seat: string) => {
    if (!occupiedSeats.includes(seat)) {
      setSelectedSeat(seat);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10 animate-in zoom-in duration-500 font-sans bg-navy-50/20 min-h-screen">
      {/* Header Navigation */}
      <div className="flex flex-col gap-4">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
          <button onClick={onBack} className="hover:text-primary transition-colors">Passenger Info</button>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary">Seat Registry</span>
        </nav>
        <div className="flex justify-between items-end border-b border-navy-100 pb-8">
           <div>
              <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Select Seating Pod</h1>
              <p className="text-navy-500 font-medium italic mt-2 text-lg">Configuring Embraer ERJ 120 (Regional Node: 1-2 Layout)</p>
           </div>
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-navy-300 uppercase tracking-widest mb-1">Fleet Profile</span>
              <span className="text-xs font-black text-navy-950 uppercase tracking-tight bg-navy-50 px-4 py-1.5 rounded-full border border-navy-100">DJ-120 • Turboprop Master</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative">
        {/* Left: The Aircraft Map */}
        <div className="lg:col-span-8 flex flex-col items-center">
          
          {/* Legend */}
          <div className="flex flex-wrap gap-6 bg-white p-6 rounded-[2rem] border border-navy-100 shadow-sm mb-12 w-full max-w-2xl">
            {[
              { color: 'bg-white border-navy-200', label: 'Standard' },
              { color: 'bg-primary border-primary', label: 'Selected' },
              { color: 'bg-emerald-50 border-emerald-400', label: 'Exit Row' },
              { color: 'bg-navy-100 text-navy-300', label: 'Occupied' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`size-5 rounded-lg border-2 ${item.color}`}></div>
                <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Aircraft Body Render */}
          <div className="relative w-full max-w-[500px] flex flex-col items-center select-none">
             
             {/* Nose / Flight Deck */}
             <div className="w-[300px] h-44 bg-gradient-to-b from-navy-100 to-white rounded-t-[140px] border-x-4 border-t-4 border-navy-100 flex flex-col items-center justify-end pb-8 relative overflow-hidden">
                <div className="absolute top-12 flex gap-4 opacity-40">
                   <div className="w-12 h-14 bg-navy-800 rounded-lg skew-x-[-15deg]"></div>
                   <div className="w-16 h-14 bg-navy-800 rounded-lg"></div>
                   <div className="w-12 h-14 bg-navy-800 rounded-lg skew-x-[15deg]"></div>
                </div>
                <p className="text-[9px] font-black text-navy-300 uppercase tracking-[0.4em] relative z-10">Flight Deck</p>
             </div>

             {/* Main Fuselage */}
             <div className="w-[300px] bg-white border-x-4 border-navy-100 flex flex-col pt-4 relative">
                
                {/* Front Galley / Lav / Closet Area */}
                <div className="px-8 mb-8">
                   <div className="grid grid-cols-[1fr_auto_2fr] gap-2 h-24">
                      {/* Left: Lavatory */}
                      <div className="bg-cyan-500 rounded-xl flex flex-col items-center justify-center text-white border-2 border-cyan-600 shadow-inner group transition-all hover:brightness-110">
                         <span className="material-symbols-outlined text-2xl font-black">wc</span>
                         <span className="text-[8px] font-black uppercase tracking-widest mt-1">Lavatory</span>
                      </div>
                      <div className="w-px h-full bg-navy-100/50"></div>
                      {/* Mid: Closet / Galley */}
                      <div className="grid grid-rows-2 gap-2">
                         <div className="bg-navy-400 rounded-xl flex flex-col items-center justify-center text-white shadow-inner">
                            <span className="material-symbols-outlined text-lg">checkroom</span>
                            <span className="text-[7px] font-black uppercase tracking-widest">Closet</span>
                         </div>
                         <div className="bg-blue-400 rounded-xl flex flex-col items-center justify-center text-white shadow-inner">
                            <span className="material-symbols-outlined text-lg">coffee</span>
                            <span className="text-[7px] font-black uppercase tracking-widest">Galley</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Seating Grid (1-2 Configuration) */}
                <div className="flex flex-col gap-5 px-8">
                   <div className="flex justify-between px-6 text-[10px] font-black text-navy-200 uppercase tracking-widest mb-2">
                      <div className="w-12 text-center">A</div>
                      <div className="w-4"></div>
                      <div className="flex gap-4 w-[100px] justify-center">
                         <span className="w-12 text-center">B</span>
                         <span className="w-12 text-center">C</span>
                      </div>
                   </div>

                   {rows.map((row) => {
                     const isExitRow = row === 9;
                     return (
                       <div key={row} className="relative flex justify-between items-center group">
                          {/* Exit Row Triangle Indicator */}
                          {isExitRow && (
                            <>
                               <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-amber-500 animate-pulse">
                                  <span className="material-symbols-outlined font-black text-3xl">change_history</span>
                               </div>
                               <div className="absolute -right-12 top-1/2 -translate-y-1/2 text-amber-500 animate-pulse">
                                  <span className="material-symbols-outlined font-black text-3xl">change_history</span>
                               </div>
                               <div className="absolute inset-x-[-32px] h-full bg-emerald-50/20 border-y border-dashed border-emerald-300 -z-10 rounded-lg"></div>
                            </>
                          )}

                          {/* Left Seat: A */}
                          <button 
                            onClick={() => handleSeatClick(`${row}A`)}
                            className={`size-12 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border-2 shadow-sm ${
                              selectedSeat === `${row}A` ? 'bg-primary text-white border-primary scale-110 shadow-lg ring-4 ring-primary/20' :
                              occupiedSeats.includes(`${row}A`) ? 'bg-navy-100 border-navy-200 text-navy-300 cursor-not-allowed' :
                              isExitRow ? 'bg-emerald-400 text-white border-emerald-500 hover:bg-emerald-500' :
                              'bg-white border-navy-200 text-navy-400 hover:border-primary hover:text-primary'
                            }`}
                          >
                             {occupiedSeats.includes(`${row}A`) ? <span className="material-symbols-outlined text-xs">close</span> : `${row}A`}
                          </button>

                          {/* Aisle */}
                          <span className="text-[9px] font-black text-navy-100 rotate-90 tracking-widest opacity-40">AISLE</span>

                          {/* Right Seats: B & C */}
                          <div className="flex gap-4">
                             {['B', 'C'].map(col => (
                               <button 
                                 key={col}
                                 onClick={() => handleSeatClick(`${row}${col}`)}
                                 className={`size-12 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border-2 shadow-sm ${
                                   selectedSeat === `${row}${col}` ? 'bg-primary text-white border-primary scale-110 shadow-lg ring-4 ring-primary/20' :
                                   occupiedSeats.includes(`${row}${col}`) ? 'bg-navy-100 border-navy-200 text-navy-300 cursor-not-allowed' :
                                   isExitRow ? 'bg-emerald-400 text-white border-emerald-500 hover:bg-emerald-500' :
                                   'bg-white border-navy-200 text-navy-400 hover:border-primary hover:text-primary'
                                 }`}
                               >
                                  {occupiedSeats.includes(`${row}${col}`) ? <span className="material-symbols-outlined text-xs">close</span> : `${row}${col}`}
                               </button>
                             ))}
                          </div>
                       </div>
                     );
                   })}
                </div>

                {/* Wings Overlay (Simplified) */}
                <div className="absolute top-[48%] -left-[160px] w-[160px] h-64 bg-gradient-to-l from-navy-100 to-transparent -z-10 skew-y-[15deg] rounded-l-full border-l-2 border-navy-200"></div>
                <div className="absolute top-[48%] -right-[160px] w-[160px] h-64 bg-gradient-to-r from-navy-100 to-transparent -z-10 -skew-y-[15deg] rounded-r-full border-r-2 border-navy-200"></div>
             </div>

             {/* Tail Section */}
             <div className="w-[300px] h-[300px] bg-white border-x-4 border-b-4 border-navy-100 rounded-b-[120px] relative overflow-hidden">
                {/* Yellow Livery Block */}
                <div className="absolute inset-x-0 bottom-0 h-64 bg-amber-400 flex flex-col items-center">
                   {/* Blue/Cyan Stripes */}
                   <div className="absolute top-0 w-full h-8 bg-blue-500 skew-y-6 -translate-y-4"></div>
                   <div className="absolute top-8 w-full h-4 bg-cyan-400 skew-y-6"></div>
                   
                   {/* Black Fin Root */}
                   <div className="w-10 h-full bg-navy-950 mt-12 shadow-2xl relative">
                      <div className="absolute -top-12 inset-x-0 h-12 bg-navy-950 rounded-t-full"></div>
                   </div>
                </div>
                <div className="absolute top-10 w-full flex flex-col items-center gap-4 opacity-20">
                   <div className="w-px h-24 bg-navy-100"></div>
                   <span className="material-symbols-outlined text-5xl">airlines</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Sidebar: Passenger Detail & Summary */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-[3rem] border border-navy-100 shadow-2xl overflow-hidden sticky top-8">
              <div className="flex border-b border-navy-100">
                 <button 
                   onClick={() => setActivePassenger(1)}
                   className={`flex-1 py-6 font-black text-[10px] uppercase tracking-widest transition-all ${
                     activePassenger === 1 ? 'text-primary border-b-4 border-primary bg-primary/5' : 'text-navy-400 hover:bg-navy-50'
                   }`}
                 >
                    Active Traveler
                 </button>
              </div>

              <div className="p-10 space-y-10">
                 <div className="flex items-center gap-6">
                    <div className="size-16 rounded-[1.75rem] bg-navy-50 border-2 border-white shadow-xl flex items-center justify-center text-primary">
                       <span className="material-symbols-outlined text-3xl">person</span>
                    </div>
                    <div>
                       <h4 className="text-xl font-black text-navy-950 uppercase tracking-tight leading-none">John Doe</h4>
                       <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mt-2 opacity-60">Adult • Registry #882-XJ</p>
                    </div>
                 </div>

                 {/* Selected Seat Bubble */}
                 <div className={`bg-navy-950 p-8 rounded-[2.5rem] space-y-6 relative overflow-hidden shadow-2xl transition-all duration-700 ${selectedSeat ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-50'}`}>
                    <div className="absolute top-0 left-0 w-2 h-full bg-primary shadow-[0_0_15px_rgba(19,127,236,0.8)]"></div>
                    <div className="flex justify-between items-center">
                       <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Selected Pod</p>
                       <span className="material-symbols-outlined text-primary text-4xl animate-pulse">airline_seat_recline_extra</span>
                    </div>
                    <div className="text-7xl font-black text-white tracking-tighter">{selectedSeat || '--'}</div>
                    <div className="flex flex-wrap gap-2 pt-2">
                       <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
                          <span className="material-symbols-outlined text-xs">window</span> {selectedSeat?.includes('A') || selectedSeat?.includes('C') ? 'Window Node' : 'Aisle Access'}
                       </span>
                       {selectedSeat?.startsWith('9') && (
                          <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                             <span className="material-symbols-outlined text-xs">bolt</span> Extra Legroom
                          </span>
                       )}
                    </div>
                 </div>

                 <div className="space-y-6 pt-6 border-t border-navy-50">
                    <div className="flex justify-between items-center text-[10px] font-black text-navy-400 uppercase tracking-widest">
                       <span>Registry Segment Fare</span>
                       <span className="text-navy-950">$520.00</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className="text-primary">Node Allocation Fee</span>
                       <span className="text-emerald-600">{selectedSeat?.startsWith('9') ? '+$45.00' : 'COMPLIMENTARY'}</span>
                    </div>
                    <div className="pt-8 border-t-2 border-dashed border-navy-50 flex justify-between items-end">
                       <div className="space-y-1">
                          <span className="text-[10px] font-black text-navy-300 uppercase tracking-widest">Estimated Total Liability</span>
                          <p className="text-5xl font-black text-navy-950 tracking-tighter">${selectedSeat?.startsWith('9') ? '565.00' : '520.00'}</p>
                       </div>
                    </div>
                 </div>

                 <button 
                   disabled={!selectedSeat}
                   onClick={onNext}
                   className={`w-full py-6 rounded-[1.75rem] font-black uppercase tracking-[0.25em] text-sm transition-all shadow-2xl flex items-center justify-center gap-4 ${
                     selectedSeat 
                     ? 'bg-primary text-white shadow-primary/30 hover:scale-105 active:scale-95' 
                     : 'bg-navy-100 text-navy-300 cursor-not-allowed shadow-none'
                   }`}
                 >
                    Proceed to Verification <span className="material-symbols-outlined text-xl">arrow_forward</span>
                 </button>

                 <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex gap-4 items-start shadow-inner">
                    <span className="material-symbols-outlined text-amber-600 font-black">info</span>
                    <p className="text-[9px] font-bold text-amber-900 uppercase leading-relaxed tracking-widest italic">
                       Seating pods near emergency exit rows (Row 9) require physical compliance validation at the hub station gate.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;
