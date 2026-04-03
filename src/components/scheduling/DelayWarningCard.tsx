import React, { useMemo } from 'react';
import type { FlightDoc } from '../../types/firestore';

interface Props {
  flight: FlightDoc;
  tick: number;
}

/**
 * Red pulsing delay-warning card with urgency escalation.
 */
const DelayWarningCard: React.FC<Props> = ({ flight, tick }) => {
  const depMs = flight.departureTime?.toMillis?.() || 0;
  const overdueMs = Math.max(tick - depMs, 0);
  const overdueMin = Math.floor(overdueMs / 60_000);

  const urgency = useMemo<'warning' | 'critical' | 'severe'>(() => {
    if (overdueMin >= 30) return 'severe';
    if (overdueMin >= 15) return 'critical';
    return 'warning';
  }, [overdueMin]);

  const urgencyLabel = (() => {
    switch (urgency) {
      case 'severe': return 'CRITICAL DELAY';
      case 'critical': return 'GROUND HOLD WARNING';
      default: return 'DEPARTURE DELAYED';
    }
  })();

  const borderColor = (() => {
    switch (urgency) {
      case 'severe': return 'border-red-500 bg-red-50';
      case 'critical': return 'border-red-400 bg-red-50/80';
      default: return 'border-red-300 bg-red-50/60';
    }
  })();

  const formatTime = (ts: any) => {
    if (!ts?.toDate) return '--:--';
    return ts.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className={`rounded-2xl border-2 p-5 shadow-md animate-pulse-slow ${borderColor}`}>
      {/* Header with warning icon */}
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-red-500" style={{ fontSize: 20 }}>warning</span>
        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${urgency === 'severe' ? 'text-red-700' : 'text-red-600'}`}>
          {urgencyLabel}
        </span>
      </div>

      {/* Flight number */}
      <p className="text-sm font-black text-navy-950 mb-1">{flight.flightNumber}</p>

      {/* Route */}
      <p className="text-xs font-bold text-navy-500 mb-3">
        {flight.origin?.code} → {flight.destination?.code}
      </p>

      {/* Stats row */}
      <div className="flex gap-4 mb-3">
        <div>
          <p className="text-[9px] font-bold text-navy-400 uppercase tracking-wider">Scheduled</p>
          <p className="text-xs font-black text-navy-700">{formatTime(flight.departureTime)}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-navy-400 uppercase tracking-wider">Overdue</p>
          <p className="text-xs font-black text-red-600">+{overdueMin} min</p>
        </div>
      </div>

      {/* Delay reason if available */}
      {(flight.delayReason || flight.cancellationReason) && (
        <p className="text-[10px] font-medium text-red-600/80 flex items-center gap-1 mb-3">
          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>info</span>
          {flight.delayReason || flight.cancellationReason}
        </p>
      )}

      {/* Action button */}
      <button className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>bolt</span>
        Act Now
      </button>
    </div>
  );
};

export default DelayWarningCard;
