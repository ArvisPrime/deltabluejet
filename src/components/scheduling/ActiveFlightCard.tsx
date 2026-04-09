import React, { useMemo } from 'react';
import type { FlightDoc } from '../../types/firestore';
import { FLIGHT_STATUS_CONFIG, FLIGHT_STATUS_LABELS, FLIGHT_PHASES } from '../../types/firestore';

interface Props {
  flight: FlightDoc;
  tick: number;
}

/**
 * Hero card — shows the currently active / airborne flight with
 * an animated airplane icon sliding along a progress track and
 * a multi-phase status indicator.
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

  const config = FLIGHT_STATUS_CONFIG[flight.status] || FLIGHT_STATUS_CONFIG.scheduled;
  const statusLabel = FLIGHT_STATUS_LABELS[flight.status] || 'UNKNOWN';

  // Phase index for the phase indicator
  const phaseIdx = FLIGHT_PHASES.indexOf(flight.status as typeof FLIGHT_PHASES[number]);

  const statusBadgeClasses = (() => {
    switch (flight.status) {
      case 'boarding':
      case 'doors_closed': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'taxi_out': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'departed':
      case 'airborne':
      case 'in_air': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'cruise': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'descent': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'landed':
      case 'taxi_in':
      case 'arrived': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'delayed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-navy-400/20 text-navy-300 border-navy-400/30';
    }
  })();

  // ETA countdown
  const etaText = useMemo(() => {
    const inFlightStatuses = ['taxi_out', 'departed', 'airborne', 'in_air', 'cruise', 'descent'];
    if (!inFlightStatuses.includes(flight.status)) return null;
    const remaining = arrMs - tick;
    if (remaining <= 0) return 'Arriving Now';
    const hrs = Math.floor(remaining / 3_600_000);
    const mins = Math.floor((remaining % 3_600_000) / 60_000);
    if (hrs > 0) return `${hrs}h ${mins}m remaining`;
    return `${mins}m remaining`;
  }, [flight.status, arrMs, tick]);

  const formatTime = (ts: any) => {
    if (!ts?.toDate) return '--:--';
    return ts.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Status-specific icon for airplane on the track
  const trackIcon = useMemo(() => {
    switch (flight.status) {
      case 'boarding':
      case 'doors_closed': return 'door_front';
      case 'taxi_out': return 'directions_car';
      case 'landed':
      case 'taxi_in': return 'flight_land';
      case 'arrived': return 'check_circle';
      default: return 'flight';
    }
  }, [flight.status]);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-950 to-primary-900 p-6 md:p-8 border border-navy-700/50 shadow-2xl shadow-primary/10">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/10 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Header row */}
      <div className="flex items-center justify-between mb-5 relative z-10">
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

      {/* Phase indicator strip */}
      <div className="flex items-center gap-1 mb-5 relative z-10">
        {FLIGHT_PHASES.map((phase, i) => {
          const isComplete = phaseIdx >= 0 && i < phaseIdx;
          const isCurrent = phaseIdx === i;
          const phaseLabel = FLIGHT_STATUS_LABELS[phase as keyof typeof FLIGHT_STATUS_LABELS] || phase;
          return (
            <div key={phase} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`h-1 w-full rounded-full transition-all duration-500 ${
                  isCurrent
                    ? 'bg-primary-400 shadow-sm shadow-primary/30'
                    : isComplete
                      ? 'bg-emerald-500/70'
                      : 'bg-navy-700/50'
                }`}
              />
              {(isCurrent || i === 0 || i === FLIGHT_PHASES.length - 1) && (
                <span className={`text-[7px] font-bold uppercase tracking-wider truncate max-w-[60px] ${
                  isCurrent ? 'text-primary-300' : 'text-navy-600'
                }`}>
                  {phaseLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Flight path visualization */}
      <div className="flex items-center gap-4 md:gap-6 mb-5 relative z-10">
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
            className="absolute -top-3 transition-all duration-1000 ease-out"
            style={{ left: `calc(${Math.max(progress, 2)}% - 12px)` }}
          >
            <div className="text-primary-300 drop-shadow-lg">
              <span className="material-symbols-outlined" style={{ fontSize: 22, transform: 'rotate(90deg)', display: 'block' }}>
                {trackIcon}
              </span>
            </div>
          </div>
          {/* Progress text */}
          <div className="flex items-center justify-center mt-3 gap-2">
            <span className="text-[9px] font-bold text-navy-500">{progress}% en route</span>
            {etaText && (
              <>
                <span className="text-[8px] text-navy-700">•</span>
                <span className="text-[9px] font-bold text-emerald-400">{etaText}</span>
              </>
            )}
          </div>
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
        {flight.status === 'delayed' && flight.delayMinutes > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 rounded-lg text-[10px] font-bold text-red-400 border border-red-500/30">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>warning</span>
            +{flight.delayMinutes} min delay
          </span>
        )}
      </div>
    </div>
  );
};

export default ActiveFlightCard;
