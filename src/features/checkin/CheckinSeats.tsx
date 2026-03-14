import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ROUTES } from '../../config/routes';
import { getFlightSeatMap, processCheckin } from '../../services/checkin';
import type { BookingDoc, FlightDoc, PassengerDoc, SeatMapDoc } from '../../types/firestore';

const CheckinSeats: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routerState = location.state as {
    pnr: string;
    booking: BookingDoc;
    passengers: PassengerDoc[];
    flight: FlightDoc;
    selectedPassengers: string[];
  } | null;

  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [occupiedSeats, setOccupiedSeats] = useState<Set<string>>(new Set());
  const [seatMap, setSeatMap] = useState<SeatMapDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const booking = routerState?.booking;
  const flight = routerState?.flight;
  const pnr = routerState?.pnr || '';

  // Load real seat map
  const loadMap = useCallback(async () => {
    if (!flight) return;
    setLoading(true);
    try {
      const result = await getFlightSeatMap(flight.id);
      setSeatMap(result.seatMap);
      setOccupiedSeats(result.occupiedSeats);
    } catch (err: any) {
      setError(err.message || 'Failed to load seat map');
    } finally {
      setLoading(false);
    }
  }, [flight]);

  useEffect(() => { loadMap(); }, [loadMap]);

  // Fallback layout if no real seat map
  const rows = seatMap ? Array.from({ length: seatMap.rows || 11 }, (_, i) => i + 1) : Array.from({ length: 11 }, (_, i) => i + 1);
  const columns = seatMap?.columns || ['A', 'B', 'C'];

  const handleSeatClick = (seat: string) => {
    if (!occupiedSeats.has(seat)) {
      setSelectedSeat(seat);
      setError(null);
    }
  };

  const handleConfirm = async () => {
    if (!selectedSeat || !booking || !flight) return;
    setProcessing(true);
    setError(null);

    try {
      // Check in the first selected passenger
      const passengerId = routerState?.selectedPassengers?.[0] || 'pax-1';

      const checkinRecord = await processCheckin({
        bookingId: booking.id,
        passengerId,
        seatNumber: selectedSeat,
        pnr,
        flightId: flight.id,
      });

      navigate(ROUTES.CHECKIN_SUCCESS, {
        state: {
          pnr,
          booking,
          flight,
          checkinRecord,
          seatNumber: selectedSeat,
          boardingGroup: checkinRecord.boardingGroup,
        },
      });
    } catch (err: any) {
      if (err.message?.includes('already taken')) {
        // Seat conflict — reload map
        await loadMap();
        setError('That seat was just taken! Please select another.');
      } else {
        setError(err.message || 'Check-in failed');
      }
    } finally {
      setProcessing(false);
    }
  };

  if (!routerState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-navy-400 font-bold">No booking data. Please start from check-in.</p>
        <button onClick={() => navigate(ROUTES.CHECKIN)} className="px-6 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase">Go to Check-in</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10 animate-in zoom-in duration-500 font-sans min-h-screen">
      <div className="flex flex-col gap-4">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
          <button onClick={() => navigate(ROUTES.CHECKIN)} className="hover:text-primary transition-colors">Check-in</button>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary">Seat Selection</span>
        </nav>
        <div className="flex justify-between items-end border-b border-navy-100 pb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Seat Selection</h1>
            <p className="text-navy-500 font-medium italic text-lg opacity-80 uppercase tracking-widest">
              Select your seat for {flight?.flightNumber || 'Flight'} — {booking?.origin?.code} → {booking?.destination?.code}
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
          <span className="material-symbols-outlined text-red-500">error</span>
          <p className="text-xs font-bold text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin size-8 border-3 border-navy-200 border-t-primary rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-8 flex flex-col items-center">
            {/* Legend */}
            <div className="flex flex-wrap gap-6 bg-white p-6 rounded-[2rem] border border-navy-100 shadow-sm mb-12 w-full max-w-2xl justify-center">
              {[
                { color: 'bg-white border-navy-200', label: 'Available' },
                { color: 'bg-primary border-primary', label: 'Selected' },
                { color: 'bg-navy-100 text-navy-300', label: 'Occupied' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`size-5 rounded-lg border-2 ${item.color}`}></div>
                  <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Seat map */}
            <div className="relative w-full max-w-[400px] flex flex-col items-center select-none scale-90">
              <div className="w-[280px] bg-white border-x-4 border-navy-100 flex flex-col pt-8 pb-12 rounded-t-[100px] relative">
                <div className="flex flex-col gap-5 px-8">
                  {/* Column headers */}
                  <div className="flex justify-between px-6 text-[10px] font-black text-navy-200 uppercase tracking-widest mb-4">
                    <div className="w-10 text-center">{columns[0]}</div>
                    <div className="flex gap-4">
                      {columns.slice(1).map((col) => (
                        <span key={col} className="w-10 text-center">{col}</span>
                      ))}
                    </div>
                  </div>

                  {rows.map((row) => (
                    <div key={row} className="relative flex justify-between items-center group">
                      <button
                        onClick={() => handleSeatClick(`${row}${columns[0]}`)}
                        className={`size-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border-2 ${selectedSeat === `${row}${columns[0]}` ? 'bg-primary text-white border-primary scale-110 shadow-lg' :
                            occupiedSeats.has(`${row}${columns[0]}`) ? 'bg-navy-100 border-navy-200 text-navy-300 cursor-not-allowed' :
                              'bg-white border-navy-200 text-navy-400 hover:border-primary'
                          }`}
                      >
                        {`${row}${columns[0]}`}
                      </button>

                      <span className="text-[8px] font-black text-navy-100 rotate-90 opacity-40">{row}</span>

                      <div className="flex gap-4">
                        {columns.slice(1).map((col) => (
                          <button
                            key={col}
                            onClick={() => handleSeatClick(`${row}${col}`)}
                            className={`size-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border-2 ${selectedSeat === `${row}${col}` ? 'bg-primary text-white border-primary scale-110 shadow-lg' :
                                occupiedSeats.has(`${row}${col}`) ? 'bg-navy-100 border-navy-200 text-navy-300 cursor-not-allowed' :
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

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[3rem] border border-navy-100 shadow-2xl p-10 space-y-10 sticky top-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest">PNR: {pnr}</p>
                <h2 className="text-3xl font-black text-navy-950 uppercase tracking-tighter">
                  {flight?.flightNumber || '—'}
                </h2>
                <p className="text-xs font-bold text-navy-400">{booking?.origin?.code} → {booking?.destination?.code}</p>
              </div>

              <div className="bg-navy-950 p-8 rounded-[2.5rem] space-y-4 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary shadow-[0_0_15px_rgba(19,127,236,0.8)]"></div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Selected Seat</p>
                <div className="text-7xl font-black text-white tracking-tighter">{selectedSeat || '—'}</div>
                {selectedSeat && (
                  <p className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] pt-4">
                    {selectedSeat.endsWith('A') ? 'Window' : selectedSeat.endsWith('C') ? 'Window' : 'Aisle'} Seat
                  </p>
                )}
              </div>

              <div className="space-y-4 pt-4">
                <button
                  onClick={handleConfirm}
                  disabled={!selectedSeat || processing}
                  className="w-full py-6 bg-primary text-white font-black uppercase tracking-[0.2em] text-xs rounded-3xl shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  {processing ? (
                    <><div className="animate-spin size-4 border-2 border-white/30 border-t-white rounded-full" /> Processing...</>
                  ) : (
                    <>Confirm & Check In <span className="material-symbols-outlined">check_circle</span></>
                  )}
                </button>
                <button onClick={() => navigate(ROUTES.CHECKIN)} className="w-full py-4 text-[10px] font-black text-navy-400 uppercase tracking-widest hover:text-navy-950">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckinSeats;
