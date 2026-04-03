import React, { useMemo } from 'react';
import type { FlightDoc } from '../../types/firestore';

interface Props {
  flight: FlightDoc;
  tick: number;
}

/**
 * Individual flight schedule card — replaces table rows.
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

  // Status dot color
  const dotClasses = (() => {
    switch (flight.status) {
      case 'boarding': return 'bg-amber-500';
      case 'departed':
      case 'in_air': return 'bg-blue-500 animate-pulse';
      case 'landed':
      case 'arrived': return 'bg-emerald-500';
      case 'delayed': return 'bg-red-500 animate-pulse';
      case 'cancelled': return 'bg-gray-400';
      default: return 'bg-emerald-400';
    }
  })();

  // Left border accent
  const borderClasses = (() => {
    switch (flight.status) {
      case 'boarding': return 'border-l-amber-500';
      case 'departed':
      case 'in_air': return 'border-l-blue-500';
      case 'landed':
      case 'arrived': return 'border-l-emerald-500';
      case 'delayed': return 'border-l-red-500';
      case 'cancelled': return 'border-l-gray-400';
      default: return 'border-l-primary';
    }
  })();

  const statusText = (() => {
    switch (flight.status) {
      case 'boarding': return 'Boarding';
      case 'departed': return 'Departed';
      case 'in_air': return 'Airborne';
      case 'landed':
      case 'arrived': return 'Landed';
      case 'delayed': return 'Delayed';
      case 'cancelled': return 'Cancelled';
      default: return 'Scheduled';
    }
  })();

  // Mini progress for airborne flights
  const airborneProgress = useMemo(() => {
    if (flight.status !== 'departed' && flight.status !== 'in_air') return null;
    const total = arrMs - depMs;
    if (total <= 0) return null;
    const elapsed = tick - depMs;
    return Math.min(Math.max(Math.round((elapsed / total) * 100), 0), 100);
  }, [flight.status, tick, depMs, arrMs]);

  // Time-until for scheduled flights
  const timeUntil = useMemo(() => {
    if (flight.status !== 'scheduled') return null;
    const diff = depMs - tick;
    if (diff <= 0) return null;
    const hrs = Math.floor(diff / 3_600_000);
    const mins = Math.floor((diff % 3_600_000) / 60_000);
    if (hrs > 0) return `in ${hrs}h ${mins}m`;
    return `in ${mins}m`;
  }, [flight.status, depMs, tick]);

  return (
    <div className={`rounded-2xl bg-white border border-navy-100 border-l-4 ${borderClasses} p-4 hover:shadow-lg hover:border-navy-200 transition-all duration-200 cursor-pointer`}>
      {/* Top: flight # + status */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm font-black text-navy-950">{flight.flightNumber}</span>
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-navy-500">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotClasses}`} />
          {statusText}
        </span>
      </div>

      {/* Route line */}
      <div className="flex items-center justify-center gap-2 mb-2.5">
        <span className="text-xs font-black text-navy-700">{flight.origin?.code}</span>
        <span className="flex-1 flex items-center justify-center">
          <span className="h-px flex-1 bg-navy-200" />
          <span className="material-symbols-outlined text-primary mx-1" style={{ fontSize: 16, transform: 'rotate(90deg)' }}>flight</span>
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

      {/* Airborne mini progress bar */}
      {airborneProgress !== null && (
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 bg-navy-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-1000"
              style={{ width: `${airborneProgress}%` }}
            />
          </div>
          <span className="text-[9px] font-black text-blue-600 shrink-0">{airborneProgress}%</span>
        </div>
      )}

      {/* Time until for scheduled */}
      {timeUntil && (
        <p className="text-[10px] font-bold text-primary text-center mb-2">{timeUntil}</p>
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
