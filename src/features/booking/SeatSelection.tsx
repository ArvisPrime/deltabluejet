import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../../config/routes';
import { useToastStore } from '../../stores/toastStore';
import { useBookingStore } from '../../stores/bookingStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { useConfigStore } from '../../stores/configStore';
import { AircraftLayoutConfig, SeatZone } from '../../types/configTypes';

const SeatSelection: React.FC = () => {
   const navigate = useNavigate();
   const { selectedFlight, passengers, selectedSeats, setSelectedSeats } = useBookingStore();
   const { fetchAircraftLayout } = useConfigStore();
   const [activePassengerIndex, setActivePassengerIndex] = useState(0);
   const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [layout, setLayout] = useState<AircraftLayoutConfig | null>(null);

   // Prevent access if no flight/passengers are selected
   useEffect(() => {
      if (!selectedFlight || passengers.length === 0) {
         navigate(ROUTES.FLIGHT_SEARCH);
      }
   }, [selectedFlight, passengers, navigate]);

   // Fetch occupied seats and layout for the flight
   useEffect(() => {
      const fetchSeatData = async () => {
         if (!selectedFlight?.flightId) return;
         try {
            const flightRef = doc(db, 'flights', selectedFlight.flightId);
            const flightSnap = await getDoc(flightRef);
            if (flightSnap.exists()) {
               const data = flightSnap.data();
               const seats = data.occupiedSeats || [];
               setOccupiedSeats(seats);
            }

            // Fetch layout config
            const configLayout = await fetchAircraftLayout(selectedFlight.aircraft || 'DBJ-120');
            setLayout(configLayout);
         } catch (error) {
            console.error("Error fetching seat data:", error);
         } finally {
            setIsLoading(false);
         }
      };

      fetchSeatData();
   }, [selectedFlight?.flightId, selectedFlight?.aircraft, fetchAircraftLayout]);

   const onBack = () => navigate(ROUTES.PASSENGER_DETAILS);
   
   const onNext = () => {
      // Validate all passengers have seats
      const allSeated = passengers.every((_, index) => selectedSeats[index.toString()]);
      if (!allSeated) {
         useToastStore.getState().addToast('Please select a seat for all passengers.', 'error');
         return;
      }
      navigate(ROUTES.PAYMENT);
   };

   const rows = layout ? Array.from({ length: layout.totalRows }, (_, i) => i + 1) : [];

   const handleSeatClick = (seat: string) => {
      if (occupiedSeats.includes(seat)) {
         useToastStore.getState().addToast('This seat is already taken. Please choose another one.', 'error');
         return;
      }
      
      // Check if another passenger in our group has this seat
      const isTakenByOtherPassenger = Object.entries(selectedSeats).some(
         ([pIndex, s]) => s === seat && pIndex !== activePassengerIndex.toString()
      );
      if (isTakenByOtherPassenger) {
         useToastStore.getState().addToast('You already selected this seat for another passenger.', 'warning');
         return;
      }

      // Toggle seat off if clicking the currently selected seat for this passenger
      if (selectedSeats[activePassengerIndex.toString()] === seat) {
         const newSeats = { ...selectedSeats };
         delete newSeats[activePassengerIndex.toString()];
         setSelectedSeats(newSeats);
      } else {
         setSelectedSeats({
            ...selectedSeats,
            [activePassengerIndex.toString()]: seat
         });
         
         // Auto-advance to next passenger if possible
         if (activePassengerIndex < passengers.length - 1) {
            setActivePassengerIndex(activePassengerIndex + 1);
         }
      }
   };

   if (!selectedFlight || passengers.length === 0) return null;

   const activeSeat = selectedSeats[activePassengerIndex.toString()] || null;
   const activePassengerInfo = passengers[activePassengerIndex];

   // Find the active seat's zone to get its price
   let activeSeatZone: SeatZone | undefined;
   if (activeSeat && layout) {
      const rowNumber = parseInt(activeSeat.replace(/[^\d]/g, ''), 10);
      activeSeatZone = layout.zones.find(z => rowNumber >= z.rowStart && rowNumber <= z.rowEnd);
   }

   return (
      <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10 animate-in zoom-in duration-500 font-sans bg-navy-50/20 min-h-screen">
         {/* Header Navigation */}
         <div className="flex flex-col gap-4">
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
               <button onClick={onBack} className="hover:text-primary transition-colors">Passenger Info</button>
               <span className="material-symbols-outlined text-xs">chevron_right</span>
               <span className="text-primary">Seat Selection</span>
            </nav>
            <div className="flex justify-between items-end border-b border-navy-100 pb-8">
               <div>
                  <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Choose Your Seat</h1>
                  <p className="text-navy-500 font-medium italic mt-2 text-lg">Select a seat for your flight</p>
               </div>
               <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-navy-950 uppercase tracking-tight bg-navy-50 px-4 py-1.5 rounded-full border border-navy-100">Flight {selectedFlight.flightNumber}</span>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative">
            {/* Left: The Aircraft Map */}
            <div className="lg:col-span-8 flex flex-col items-center">

               {/* Legend */}
               <div className="flex flex-wrap gap-6 bg-white p-6 rounded-[2rem] border border-navy-100 shadow-sm mb-12 w-full max-w-2xl">
                  {[
                     { color: 'bg-white border-navy-200', label: 'Available' },
                     { color: 'bg-primary border-primary', label: 'Selected' },
                     { color: 'bg-emerald-50 border-emerald-400', label: 'Exit Row' },
                     { color: 'bg-navy-100 text-navy-300', label: 'Taken' },
                  ].map((item, i) => (
                     <div key={i} className="flex items-center gap-2">
                        <div className={`size-5 rounded-lg border-2 ${item.color}`}></div>
                        <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{item.label}</span>
                     </div>
                  ))}
               </div>

               {/* Aircraft Body Render */}
               <div className="relative w-full max-w-[500px] flex flex-col items-center select-none">
                  {isLoading && (
                     <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-[100px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                     </div>
                  )}
                  {/* Nose / Cockpit */}
                  <div className="w-[300px] h-44 bg-gradient-to-b from-navy-100 to-white rounded-t-[140px] border-x-4 border-t-4 border-navy-100 flex flex-col items-center justify-end pb-8 relative overflow-hidden">
                     <div className="absolute top-12 flex gap-4 opacity-40">
                        <div className="w-12 h-14 bg-navy-800 rounded-lg skew-x-[-15deg]"></div>
                        <div className="w-16 h-14 bg-navy-800 rounded-lg"></div>
                        <div className="w-12 h-14 bg-navy-800 rounded-lg skew-x-[15deg]"></div>
                     </div>
                     <p className="text-[9px] font-black text-navy-300 uppercase tracking-[0.4em] relative z-10">Cockpit</p>
                  </div>

                  {/* Main Fuselage */}
                  <div className="w-[300px] bg-white border-x-4 border-navy-100 flex flex-col pt-4 relative">

                     {/* Front Galley / Lav / Closet Area */}
                     <div className="px-8 mb-8">
                        <div className="grid grid-cols-[1fr_auto_2fr] gap-2 h-24">
                           {/* Left: Lavatory */}
                           <div className="bg-cyan-500 rounded-xl flex flex-col items-center justify-center text-white border-2 border-cyan-600 shadow-inner group transition-all hover:brightness-110">
                              <span className="material-symbols-outlined text-2xl font-black">wc</span>
                              <span className="text-[8px] font-black uppercase tracking-widest mt-1">Restroom</span>
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
                                 <span className="text-[7px] font-black uppercase tracking-widest">Kitchen</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Seating Grid (Dynamic Configuration) */}
                     <div className="flex flex-col gap-5 px-8 pb-10">
                        {layout && (
                           <>
                              <div className="flex w-full justify-between items-center px-2 text-[10px] font-black text-navy-200 uppercase tracking-widest mb-2 gap-2">
                                 {layout.columns.map((col, idx) => {
                                    if (col === 'KEY_AISLE') {
                                       return <div key={idx} className="flex-1 min-w-[20px]"></div>;
                                    }
                                    return <div key={idx} className="w-12 flex-shrink-0 text-center">{col}</div>;
                                 })}
                              </div>

                              {rows.map((row) => {
                                 const zone = layout.zones.find(z => row >= z.rowStart && row <= z.rowEnd);
                                 const isExitRow = zone?.name.toLowerCase().includes('exit row');
                                 
                                 return (
                                    <div key={row} className="relative flex w-full justify-between items-center group gap-2 px-2">
                                       {/* Exit Row Triangle Indicator */}
                                       {isExitRow && (
                                          <>
                                             <div className="absolute -left-10 top-1/2 -translate-y-1/2 text-amber-500 animate-pulse">
                                                <span className="material-symbols-outlined font-black text-3xl">change_history</span>
                                             </div>
                                             <div className="absolute -right-10 top-1/2 -translate-y-1/2 text-amber-500 animate-pulse">
                                                <span className="material-symbols-outlined font-black text-3xl">change_history</span>
                                             </div>
                                             <div className="absolute inset-x-[-24px] h-[120%] bg-emerald-50/30 border-y border-dashed border-emerald-300 -z-10 rounded-lg"></div>
                                          </>
                                       )}

                                       {layout.columns.map((col, colIdx) => {
                                          if (col === 'KEY_AISLE') {
                                             return (
                                                <div key={colIdx} className="flex-1 min-w-[20px] flex justify-center">
                                                   <span className="text-[9px] font-black text-navy-100 rotate-90 tracking-widest opacity-40 whitespace-nowrap">AISLE</span>
                                                </div>
                                             );
                                          }
                                          return (
                                             <div key={colIdx} className="w-12 flex-shrink-0">
                                                <SeatButton
                                                   seat={`${row}${col}`}
                                                   zone={zone}
                                                   isExitRow={!!isExitRow}
                                                   occupiedSeats={occupiedSeats}
                                                   selectedSeats={selectedSeats}
                                                   activePassengerIndex={activePassengerIndex}
                                                   handleSeatClick={handleSeatClick}
                                                />
                                             </div>
                                          );
                                       })}
                                    </div>
                                 );
                              })}
                           </>
                        )}
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
                  <div className="flex border-b border-navy-100 overflow-x-auto no-scrollbar">
                     {passengers.map((p, index) => (
                        <button
                           key={index}
                           onClick={() => setActivePassengerIndex(index)}
                           className={`flex-1 py-6 font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap px-4 ${activePassengerIndex === index ? 'text-primary border-b-4 border-primary bg-primary/5' : 'text-navy-400 hover:bg-navy-50'
                              }`}
                        >
                           Passenger {index + 1}
                           {selectedSeats[index.toString()] && <span className="ml-2 text-emerald-500 material-symbols-outlined text-[10px] align-middle">check_circle</span>}
                        </button>
                     ))}
                  </div>

                  <div className="p-10 space-y-10">
                     <div className="flex items-center gap-6">
                        <div className="size-16 rounded-[1.75rem] bg-navy-50 border-2 border-white shadow-xl flex items-center justify-center text-primary">
                           <span className="material-symbols-outlined text-3xl">person</span>
                        </div>
                        <div>
                           <h4 className="text-xl font-black text-navy-950 uppercase tracking-tight leading-none">{activePassengerInfo.firstName} {activePassengerInfo.lastName}</h4>
                           <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mt-2 opacity-60">Fare Class: {selectedFlight.fareClass}</p>
                        </div>
                     </div>

                     {/* Selected Seat Bubble */}
                     <div className={`bg-navy-950 p-8 rounded-[2.5rem] space-y-6 relative overflow-hidden shadow-2xl transition-all duration-700 ${activeSeat ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-50'}`}>
                        <div className="absolute top-0 left-0 w-2 h-full bg-primary shadow-[0_0_15px_rgba(19,127,236,0.8)]"></div>
                        <div className="flex justify-between items-center">
                           <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Your Seat</p>
                           <span className="material-symbols-outlined text-primary text-4xl animate-pulse">airline_seat_recline_extra</span>
                        </div>
                        <div className="text-7xl font-black text-white tracking-tighter">{activeSeat || '--'}</div>
                        <div className="flex flex-wrap gap-2 pt-2">
                           {activeSeat && (
                              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
                                 <span className="material-symbols-outlined text-xs">window</span> {activeSeat.includes('A') || activeSeat.includes('C') ? 'Window Seat' : 'Aisle Access'}
                              </span>
                           )}
                           {activeSeat?.startsWith('9') && (
                              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                 <span className="material-symbols-outlined text-xs">bolt</span> Extra Legroom
                              </span>
                           )}
                        </div>
                     </div>

                     <div className="space-y-6 pt-6 border-t border-navy-50">
                        <div className="flex justify-between items-center text-[10px] font-black text-navy-400 uppercase tracking-widest">
                           <span>Base Fare</span>
                           <span className="text-navy-950">${selectedFlight.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                           <span className="text-primary">Seat Selection {activeSeatZone?.name ? `(${activeSeatZone.name})` : 'Fee'}</span>
                           <span className={activeSeatZone && activeSeatZone.priceCents > 0 ? "text-emerald-600" : "text-navy-500"}>
                              {activeSeatZone && activeSeatZone.priceCents > 0 
                                 ? `+$${(activeSeatZone.priceCents / 100).toFixed(2)}` 
                                 : 'Free'}
                           </span>
                        </div>
                     </div>

                     {/* Navigation Buttons */}
                     <div className="flex flex-col gap-4">
                        <button
                           onClick={onNext}
                           className={`w-full py-6 rounded-[1.75rem] font-black uppercase tracking-[0.25em] text-sm transition-all shadow-2xl flex items-center justify-center gap-4 bg-primary text-white shadow-primary/30 hover:scale-105 active:scale-95`}
                        >
                           Proceed to Payment <span className="material-symbols-outlined text-xl">arrow_forward</span>
                        </button>
                        <button
                           onClick={onBack}
                           className="w-full py-4 rounded-[1.75rem] font-black uppercase tracking-[0.25em] text-[10px] transition-all border-2 border-navy-100 text-navy-500 hover:bg-navy-50 flex items-center justify-center gap-3"
                        >
                           <span className="material-symbols-outlined text-lg">arrow_back</span> Back to Passenger Details
                        </button>
                     </div>

                     <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex gap-4 items-start shadow-inner">
                        <span className="material-symbols-outlined text-amber-600 font-black">info</span>
                        <p className="text-[9px] font-bold text-amber-900 uppercase leading-relaxed tracking-widest italic">
                           Exit row seats (Row 9) have extra legroom. You must be able to assist in an emergency. Staff may check at the gate.
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

// Helper component for seats to reduce repetition
const SeatButton = ({ 
   seat,
   zone, 
   isExitRow, 
   occupiedSeats, 
   selectedSeats, 
   activePassengerIndex, 
   handleSeatClick 
}: { 
   seat: string,
   zone?: SeatZone,
   isExitRow: boolean, 
   occupiedSeats: string[], 
   selectedSeats: Record<string, string>, 
   activePassengerIndex: number, 
   handleSeatClick: (s: string) => void 
}) => {
   const isOccupied = occupiedSeats.includes(seat);
   
   // Check if any passenger in the current booking selected this seat
   const selectedByPassengerIndex = Object.entries(selectedSeats).find(([_, s]) => s === seat)?.[0];
   const isSelectedByActive = selectedByPassengerIndex === activePassengerIndex.toString();
   const isSelectedByGroup = selectedByPassengerIndex !== undefined;

   let btnClass = '';
   if (isSelectedByActive) {
      btnClass = 'bg-primary text-white border-primary scale-110 shadow-lg ring-4 ring-primary/20';
   } else if (isOccupied) {
      btnClass = 'bg-navy-100 border-navy-200 text-navy-300 cursor-not-allowed opacity-60';
   } else if (isSelectedByGroup) {
      btnClass = 'bg-blue-300 text-white border-blue-400 opacity-80 cursor-not-allowed';
   } else if (zone?.color) {
      // Use the zone's specific color if defined
      btnClass = `${zone.color} hover:brightness-95 hover:shadow-lg`;
   } else if (isExitRow) {
      btnClass = 'bg-emerald-400 text-white border-emerald-500 hover:bg-emerald-500 hover:shadow-lg';
   } else {
      btnClass = 'bg-white border-navy-200 text-navy-400 hover:border-primary hover:text-primary hover:shadow-lg';
   }

   return (
      <button
         onClick={() => handleSeatClick(seat)}
         disabled={isOccupied}
         className={`size-12 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border-2 shadow-sm ${btnClass}`}
         title={isSelectedByGroup && !isSelectedByActive ? `Selected by Passenger ${parseInt(selectedByPassengerIndex) + 1}` : ''}
      >
         {isOccupied ? <span className="material-symbols-outlined text-xs">close</span> : 
          isSelectedByGroup && !isSelectedByActive ? <span className="material-symbols-outlined text-xs">person</span> : seat}
      </button>
   );
};

export default SeatSelection;
