import React, { useMemo, useEffect, useRef } from 'react';
import type { FlightDoc } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';

interface Props {
  flight: FlightDoc;
  tick: number;
}

/**
 * Boarding progress card with countdown timer and auto-toast notifications.
 */
const BoardingProgressCard: React.FC<Props> = ({ flight, tick }) => {
  const addToast = useToastStore((s) => s.addToast);
  const notifiedStartRef = useRef<string | null>(null);
  const notifiedCompleteRef = useRef<string | null>(null);

  const depMs = flight.departureTime?.toMillis?.() || 0;
  // Boarding window: 45 min before departure
  const boardingDurationMs = 45 * 60 * 1000;
  const boardingStartMs = depMs - boardingDurationMs;
  const boardingEndMs = depMs;

  const progress = useMemo(() => {
    if (boardingEndMs <= boardingStartMs) return 0;
    const elapsed = tick - boardingStartMs;
    if (elapsed <= 0) return 0;
    return Math.min(Math.round((elapsed / boardingDurationMs) * 100), 100);
  }, [tick, boardingStartMs, boardingDurationMs, boardingEndMs]);

  // Countdown: time remaining
  const remainingMs = Math.max(boardingEndMs - tick, 0);
  const remainMin = Math.floor(remainingMs / 60_000);
  const remainSec = Math.floor((remainingMs % 60_000) / 1000);

  // Notification: boarding started
  useEffect(() => {
    if (flight.status === 'boarding' && notifiedStartRef.current !== flight.id) {
      notifiedStartRef.current = flight.id;
      addToast(`🛫 Boarding in progress: ${flight.flightNumber} ${flight.origin?.code}→${flight.destination?.code}`, 'info');
    }
  }, [flight.status, flight.id, flight.flightNumber, flight.origin?.code, flight.destination?.code, addToast]);

  // Notification: boarding complete
  useEffect(() => {
    if (progress >= 100 && notifiedCompleteRef.current !== flight.id) {
      notifiedCompleteRef.current = flight.id;
      addToast(`✅ Boarding complete: ${flight.flightNumber} — ready for departure`, 'success');
    }
  }, [progress, flight.id, flight.flightNumber, addToast]);

  return (
    <div className="rounded-2xl bg-white border border-amber-200 p-5 shadow-md animate-boarding-glow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-[9px] font-black uppercase tracking-[0.2em] text-amber-700 border border-amber-200">
          Boarding
        </span>
        <span className="text-sm font-black text-navy-950">{flight.flightNumber}</span>
      </div>

      {/* Route */}
      <p className="text-xs font-bold text-navy-600 mb-4">
        {flight.origin?.code}{' '}
        <span className="material-symbols-outlined align-middle mx-1" style={{ fontSize: 14 }}>flight_takeoff</span>
        {' '}{flight.destination?.code}
      </p>

      {/* Progress bar */}
      <div className="relative h-2.5 bg-amber-100 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-amber-700">{progress}%</span>
        <span className="text-[10px] font-bold text-navy-400">
          {remainingMs > 0
            ? `${String(remainMin).padStart(2, '0')}:${String(remainSec).padStart(2, '0')} left`
            : '✓ Complete'}
        </span>
      </div>
    </div>
  );
};

export default BoardingProgressCard;
