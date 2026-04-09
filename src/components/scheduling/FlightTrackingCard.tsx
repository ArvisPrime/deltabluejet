import React, { useMemo } from 'react';
import type { FlightDoc } from '../../types/firestore';
import { FLIGHT_STATUS_CONFIG, FLIGHT_STATUS_LABELS, FLIGHT_PHASES } from '../../types/firestore';

interface Props {
  flight: FlightDoc;
  tick: number;
}

/**
 * Individual flight schedule card — with multi-phase progress indicator
 * and OOOI-style status tracking.
 */
const FlightTrackingCard: React.FC<Props> = ({ flight, tick }) => {
  const depMs = flight.departureTime?.toMillis?.() || 0;
  const arrMs = flight.arrivalTime?.toMillis?.() || 0;

  const formatTime = (ts: any) => {
    if (!ts?.toDate) return '--:--';
    return ts.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (ts: any) => {
    if (!ts?.toDate) return '';
    return ts.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  // Status config from centralized definitions
  const config = FLIGHT_STATUS_CONFIG[flight.status] || FLIGHT_STATUS_CONFIG.scheduled;
  const label = FLIGHT_STATUS_LABELS[flight.status] || 'Unknown';

  // Calculate phase progress (0-100) based on where status is in the OOOI phases
  const phaseProgress = useMemo(() => {
    const idx = FLIGHT_PHASES.indexOf(flight.status as typeof FLIGHT_PHASES[number]);
    if (idx < 0) return null; // delayed/cancelled/diverted are not on the progress line
    return Math.round((idx / (FLIGHT_PHASES.length - 1)) * 100);
  }, [flight.status]);

  // More granular progress within current phase (time-based interpolation)
  const granularProgress = useMemo(() => {
    if (phaseProgress === null) return null;
    const total = arrMs - depMs;
    if (total <= 0) return phaseProgress;

    // Base progress from phase index
    const base = phaseProgress;

    // If in-flight, add time-based interpolation within the enroute phases
    const inFlightStatuses = ['taxi_out', 'departed', 'airborne', 'cruise', 'descent'];
    if (inFlightStatuses.includes(flight.status)) {
      const elapsed = tick - depMs;
      const timeProgress = Math.min(Math.max(elapsed / total, 0), 1);
      // Map time progress to the enroute phase range (30%-90% of total phases)
      const enrouteRange = 60; // percentage range for enroute phases
      return Math.min(Math.round(30 + timeProgress * enrouteRange), 95);
    }

    return base;
  }, [phaseProgress, flight.status, tick, depMs, arrMs]);

  // Time-until for scheduled flights / ETA for in-flight
  const countdownText = useMemo(() => {
    const inFlightStatuses = ['taxi_out', 'departed', 'airborne', 'in_air', 'cruise', 'descent'];
    if (inFlightStatuses.includes(flight.status)) {
      const remaining = arrMs - tick;
      if (remaining <= 0) return 'Arriving';
      const hrs = Math.floor(remaining / 3_600_000);
      const mins = Math.floor((remaining % 3_600_000) / 60_000);
      if (hrs > 0) return `ETA ${hrs}h ${mins}m`;
      return `ETA ${mins}m`;
    }
    if (flight.status === 'scheduled' || flight.status === 'boarding' || flight.status === 'doors_closed') {
      const diff = depMs - tick;
      if (diff <= 0) return null;
      const hrs = Math.floor(diff / 3_600_000);
      const mins = Math.floor((diff % 3_600_000) / 60_000);
      if (hrs > 0) return `in ${hrs}h ${mins}m`;
      return `in ${mins}m`;
    }
    return null;
  }, [flight.status, depMs, arrMs, tick]);

  // Progress bar gradient per phase
  const progressGradient = useMemo(() => {
    switch (flight.status) {
      case 'boarding':
      case 'doors_closed':
        return 'from-amber-400 to-orange-500';
      case 'taxi_out':
      case 'departed':
        return 'from-orange-400 to-blue-500';
      case 'airborne':
      case 'in_air':
      case 'cruise':
        return 'from-blue-400 to-emerald-500';
      case 'descent':
        return 'from-purple-400 to-emerald-500';
      case 'landed':
      case 'taxi_in':
      case 'arrived':
        return 'from-emerald-400 to-green-600';
      default:
        return 'from-slate-300 to-slate-400';
    }
  }, [flight.status]);

  return (
    <div className={`rounded-2xl bg-white border border-navy-100 border-l-4 ${config.border} p-4 hover:shadow-lg hover:border-navy-200 transition-all duration-200 group`}>
      {/* Top: flight # + status badge */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm font-black text-navy-950">{flight.flightNumber}</span>
        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold ${config.bg} ${config.text}`}>
          <span className={`w-2 h-2 rounded-full shrink-0 ${config.dot} ${config.pulse ? 'animate-pulse' : ''}`} />
          {label}
        </span>
      </div>

      {/* Route line */}
      <div className="flex items-center justify-center gap-2 mb-2.5">
        <span className="text-xs font-black text-navy-700">{flight.origin?.code}</span>
        <span className="flex-1 flex items-center justify-center">
          <span className="h-px flex-1 bg-navy-200" />
          <span className="material-symbols-outlined text-primary mx-1" style={{ fontSize: 16, transform: 'rotate(90deg)' }}>
            {config.icon}
          </span>
          <span className="h-px flex-1 bg-navy-200" />
        </span>
        <span className="text-xs font-black text-navy-700">{flight.destination?.code}</span>
      </div>

      {/* Times */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-navy-500">{formatTime(flight.departureTime)}</span>
        <span className="text-[9px] font-bold text-navy-300">{formatDate(flight.departureTime)}</span>
        <span className="text-[10px] font-bold text-navy-500">{formatTime(flight.arrivalTime)}</span>
      </div>

      {/* Multi-phase progress bar */}
      {granularProgress !== null && (
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-navy-100 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${progressGradient} rounded-full transition-all duration-1000`}
                style={{ width: `${granularProgress}%` }}
              />
            </div>
            <span className={`text-[9px] font-black shrink-0 ${config.text}`}>
              {granularProgress}%
            </span>
          </div>
          {/* Phase dots */}
          <div className="flex justify-between mt-1 px-0.5">
            {['⬜', '🟡', '🟠', '🟠', '🟢', '🔵', '🟣', '✅', '🟡', '✅'].map((_, i) => {
              const phaseIdx = FLIGHT_PHASES.indexOf(flight.status as typeof FLIGHT_PHASES[number]);
              const isComplete = phaseIdx >= 0 && i <= phaseIdx;
              const isCurrent = phaseIdx === i;
              return (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    isCurrent
                      ? `${config.dot} scale-150 ring-2 ring-offset-1 ring-current`
                      : isComplete
                        ? 'bg-emerald-400'
                        : 'bg-navy-200'
                  }`}
                  title={FLIGHT_PHASES[i]}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Countdown / ETA */}
      {countdownText && (
        <p className={`text-[10px] font-bold text-center mb-2 ${config.text}`}>{countdownText}</p>
      )}

      {/* Delay info */}
      {flight.status === 'delayed' && flight.delayMinutes > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 rounded-lg mb-2">
          <span className="material-symbols-outlined text-red-500" style={{ fontSize: 14 }}>warning</span>
          <span className="text-[10px] font-bold text-red-700">
            Delayed {flight.delayMinutes} min{flight.delayReason ? ` — ${flight.delayReason}` : ''}
          </span>
        </div>
      )}

      {/* Footer: aircraft + gate */}
      <div className="flex items-center justify-between border-t border-navy-50 pt-2.5">
        <span className="flex items-center gap-1 text-[10px] font-bold text-navy-400">
          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>flight</span>
          {flight.aircraft?.registration || '—'}
        </span>
        {flight.gate && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-navy-400">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>door_front</span>
            Gate {flight.gate}
          </span>
        )}
      </div>
    </div>
  );
};

export default FlightTrackingCard;
