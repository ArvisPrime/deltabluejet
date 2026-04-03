import React, { useMemo } from 'react';
import type { FlightDoc } from '../../types/firestore';

interface Props {
  flight: FlightDoc;
  tick: number;
}

/**
 * Hero card — shows the currently active / airborne flight with
 * an animated airplane icon sliding along a progress track.
 */
const ActiveFlightCard: React.FC<Props> = ({ flight, tick }) => {
  const depMs = flight.departureTime?.toMillis?.() || 0;
  const arrMs = flight.arrivalTime?.toMillis?.() || 0;
  const totalDuration = arrMs - depMs;

  const progress = useMemo(() => {
    if (totalDuration <= 0) return 0;
    const elapsed = tick - depMs;
    if (elapsed <= 0) return 0;
    return Math.min(Math.round((elapsed / totalDuration) * 100), 100);
  }, [tick, depMs, totalDuration]);

  const statusLabel = (() => {
    switch (flight.status) {
      case 'boarding': return 'BOARDING';
      case 'departed': return 'DEPARTED';
      case 'in_air': return 'AIRBORNE';
      case 'landed':
      case 'arrived': return 'LANDED';
      case 'delayed': return 'DELAYED';
      default: return 'SCHEDULED';
    }
  })();

  const statusBadgeClasses = (() => {
    switch (flight.status) {
      case 'boarding': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'departed':
      case 'in_air': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'landed':
      case 'arrived': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'delayed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-navy-400/20 text-navy-300 border-navy-400/30';
    }
  })();

  const formatTime = (ts: any) => {
    if (!ts?.toDate) return '--:--';
    return ts.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-950 to-primary-900 p-6 md:p-8 border border-navy-700/50 shadow-2xl shadow-primary/10">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/10 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Header row */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <span className="text-xl md:text-2xl font-black text-white tracking-tight">{flight.flightNumber}</span>
          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border ${statusBadgeClasses}`}>
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-navy-400">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>flight</span>
          {flight.aircraft?.registration || '—'}
        </div>
      </div>

      {/* Flight path visualization */}
      <div className="flex items-center gap-4 md:gap-6 mb-6 relative z-10">
        {/* Origin */}
        <div className="text-center shrink-0">
          <p className="text-lg md:text-2xl font-black text-white">{flight.origin?.code}</p>
          <p className="text-[10px] font-bold text-primary-300 mt-0.5">{formatTime(flight.departureTime)}</p>
          <p className="text-[9px] text-navy-400 font-medium mt-0.5 max-w-[80px] truncate">{flight.origin?.city}</p>
        </div>

        {/* Track */}
        <div className="flex-1 relative px-2">
          {/* Dashed background line */}
          <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dashed border-navy-600 -translate-y-1/2" />
          {/* Filled progress track */}
          <div className="relative h-1.5 bg-navy-700/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-400 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Airplane icon riding the progress */}
          <div
            className="absolute -top-3 transition-all duration-1000 ease-out animate-flight-move"
            style={{ left: `calc(${Math.max(progress, 2)}% - 12px)` }}
          >
            <div className="text-primary-300 drop-shadow-lg">
              <span className="material-symbols-outlined" style={{ fontSize: 22, transform: 'rotate(90deg)', display: 'block' }}>flight</span>
            </div>
          </div>
          <p className="text-center text-[9px] font-bold text-navy-500 mt-3">{progress}% en route</p>
        </div>

        {/* Destination */}
        <div className="text-center shrink-0">
          <p className="text-lg md:text-2xl font-black text-white">{flight.destination?.code}</p>
          <p className="text-[10px] font-bold text-emerald-400 mt-0.5">ETA {formatTime(flight.arrivalTime)}</p>
          <p className="text-[9px] text-navy-400 font-medium mt-0.5 max-w-[80px] truncate">{flight.destination?.city}</p>
        </div>
      </div>

      {/* Meta pills */}
      <div className="flex flex-wrap gap-2 relative z-10">
        {flight.gate && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy-800/60 rounded-lg text-[10px] font-bold text-navy-300 border border-navy-700/50">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>door_front</span>
            Gate {flight.gate}
          </span>
        )}
        {flight.terminal && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy-800/60 rounded-lg text-[10px] font-bold text-navy-300 border border-navy-700/50">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>domain</span>
            Terminal {flight.terminal}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy-800/60 rounded-lg text-[10px] font-bold text-navy-300 border border-navy-700/50">
          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>airline_seat_recline_normal</span>
          {Object.values(flight.seatsAvailable || {}).reduce((s, v) => s + v, 0)} seats
        </span>
      </div>
    </div>
  );
};

export default ActiveFlightCard;
