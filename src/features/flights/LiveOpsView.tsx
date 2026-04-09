import React, { useState, useMemo, useCallback } from 'react';
import { useActiveFlight } from '../../hooks/useActiveFlight';
import ActiveFlightCard from '../../components/scheduling/ActiveFlightCard';
import BoardingProgressCard from '../../components/scheduling/BoardingProgressCard';
import DelayWarningCard from '../../components/scheduling/DelayWarningCard';
import FlightTrackingCard from '../../components/scheduling/FlightTrackingCard';
import { FLIGHT_STATUS_LABELS, FLIGHT_STATUS_CONFIG } from '../../types/firestore';
import type { FlightDoc, FlightStatus } from '../../types/firestore';
import { updateFlightStatus } from '../../services/firestore';
import { useToastStore } from '../../stores/toastStore';

type Tab = 'today' | 'week' | 'all';

// All statuses available for manual override
const OVERRIDE_STATUSES: FlightStatus[] = [
  'scheduled', 'boarding', 'doors_closed', 'taxi_out',
  'departed', 'airborne', 'cruise', 'descent',
  'landed', 'taxi_in', 'arrived', 'delayed', 'cancelled',
];

/**
 * Live Ops Control Center — replaces the old table-based schedule list.
 * Shows real-time flight data with card-based UI, event feed, and manual status override.
 */
const LiveOpsView: React.FC = () => {
  const {
    activeFlight,
    boardingFlights,
    airborneFlights,
    delayedFlights,
    upcomingFlights,
    todayFlights,
    recentEvents,
    landedFlights,
    arrivedFlights,
    tick,
    loading,
  } = useActiveFlight();

  const addToast = useToastStore((s) => s.addToast);
  const [scheduleTab, setScheduleTab] = useState<Tab>('today');
  const [overrideFlight, setOverrideFlight] = useState<FlightDoc | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<FlightStatus | ''>('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  // Filter flights based on tab
  const displayFlights = useMemo(() => {
    switch (scheduleTab) {
      case 'today':
        return todayFlights;
      case 'week':
      case 'all':
      default:
        return todayFlights;
    }
  }, [scheduleTab, todayFlights]);

  // Next scheduled flight
  const nextFlight = useMemo(() => {
    return upcomingFlights.find(
      (f) =>
        f.id !== activeFlight?.id &&
        !boardingFlights.some((b) => b.id === f.id) &&
        !airborneFlights.some((a) => a.id === f.id),
    ) || null;
  }, [upcomingFlights, activeFlight, boardingFlights, airborneFlights]);

  const handleOverride = useCallback(async () => {
    if (!overrideFlight || !overrideStatus) return;
    setOverrideLoading(true);
    try {
      await updateFlightStatus({
        flightId: overrideFlight.id,
        status: overrideStatus,
      });
      addToast(`${overrideFlight.flightNumber} → ${FLIGHT_STATUS_LABELS[overrideStatus as FlightStatus]}`, 'success');
      setOverrideFlight(null);
      setOverrideStatus('');
    } catch (err) {
      console.error('Status override failed:', err);
      addToast('Failed to update status', 'error');
    } finally {
      setOverrideLoading(false);
    }
  }, [overrideFlight, overrideStatus, addToast]);

  const formatTime = (ts: any) => {
    if (!ts?.toDate) return '--:--';
    return ts.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatEventTime = (ts: any) => {
    if (!ts?.toDate) return '';
    const d = ts.toDate();
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 rounded-full border-[3px] border-navy-100 border-t-primary animate-spin" />
        <p className="text-sm font-bold text-navy-400">Loading flight operations…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Active Flight Hero ─── */}
      {activeFlight && (
        <ActiveFlightCard flight={activeFlight} tick={tick} />
      )}

      {/* ─── Status Cards Row ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Boarding card(s) */}
        {boardingFlights.length > 0 ? (
          boardingFlights.map((f) => (
            <BoardingProgressCard key={f.id} flight={f} tick={tick} />
          ))
        ) : (
          <div className="rounded-2xl bg-white border border-navy-100 p-5 flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-2xl text-navy-200">flight_takeoff</span>
            <p className="text-[10px] font-black uppercase tracking-widest text-navy-300">No Active Boarding</p>
          </div>
        )}

        {/* Next Up card */}
        {nextFlight ? (
          <div className="rounded-2xl bg-white border border-navy-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-primary-50 text-[9px] font-black uppercase tracking-[0.2em] text-primary-700 border border-primary-100">
                Next Up
              </span>
              <span className="text-sm font-black text-navy-950">{nextFlight.flightNumber}</span>
            </div>
            <p className="text-xs font-bold text-navy-600 mb-2">
              {nextFlight.origin?.code}{' '}
              <span className="material-symbols-outlined align-middle mx-1" style={{ fontSize: 14 }}>flight</span>
              {' '}{nextFlight.destination?.code}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-navy-400">
                Dep {formatTime(nextFlight.departureTime)}
              </span>
              {(() => {
                const depMs = nextFlight.departureTime?.toMillis?.() || 0;
                const diff = depMs - tick;
                if (diff <= 0) return null;
                const mins = Math.floor(diff / 60_000);
                const hrs = Math.floor(mins / 60);
                const rem = mins % 60;
                return (
                  <span className="text-[10px] font-black text-primary">
                    {hrs > 0 ? `in ${hrs}h ${rem}m` : `in ${rem}m`}
                  </span>
                );
              })()}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-navy-100 p-5 flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-2xl text-navy-200">schedule</span>
            <p className="text-[10px] font-black uppercase tracking-widest text-navy-300">No Upcoming</p>
          </div>
        )}

        {/* Delay Warning card(s) */}
        {delayedFlights.length > 0 ? (
          <DelayWarningCard flight={delayedFlights[0]} tick={tick} />
        ) : (
          <div className="rounded-2xl bg-white border border-emerald-100 p-5 flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-2xl text-emerald-300">check_circle</span>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">All On Time</p>
          </div>
        )}
      </div>

      {/* Additional delay warnings */}
      {delayedFlights.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {delayedFlights.slice(1).map((f) => (
            <DelayWarningCard key={f.id} flight={f} tick={tick} />
          ))}
        </div>
      )}

      {/* ─── Flight Event Feed ─── */}
      {recentEvents.length > 0 && (
        <div className="bg-white rounded-2xl border border-navy-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>notifications_active</span>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-navy-600">Live Event Feed</h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-auto" />
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentEvents.slice(0, 10).map((evt) => {
              const toConfig = FLIGHT_STATUS_CONFIG[evt.toStatus] || FLIGHT_STATUS_CONFIG.scheduled;
              const toLabel = FLIGHT_STATUS_LABELS[evt.toStatus] || evt.toStatus;
              return (
                <div key={evt.id} className="flex items-center gap-3 py-1.5 border-b border-navy-50 last:border-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${toConfig.dot}`} />
                  <span className="text-xs font-bold text-navy-800 min-w-[70px]">{evt.flightNumber}</span>
                  <span className="text-[10px] text-navy-400">→</span>
                  <span className={`text-[10px] font-bold ${toConfig.text}`}>{toLabel}</span>
                  <span className="text-[9px] text-navy-300 ml-auto">{formatEventTime(evt.createdAt)}</span>
                  <span className="text-[8px] text-navy-300 bg-navy-50 px-1.5 py-0.5 rounded">
                    {evt.source}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Schedule Cards Grid ─── */}
      <div>
        {/* Tabs */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {(['today', 'week', 'all'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setScheduleTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  scheduleTab === tab
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-white text-navy-400 border-navy-100 hover:border-primary/30'
                }`}
              >
                {tab === 'today' ? 'Today' : tab === 'week' ? 'This Week' : 'All Schedules'}
              </button>
            ))}
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-navy-400">Live</span>
          </div>
        </div>

        {/* Cards */}
        {displayFlights.length === 0 ? (
          <div className="bg-white rounded-3xl border border-navy-100 p-16 text-center">
            <span className="material-symbols-outlined text-5xl text-navy-200 block mb-3">event_busy</span>
            <p className="font-bold text-navy-400">No flights found</p>
            <p className="text-xs text-navy-300 mt-1">No flights scheduled for this time period.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayFlights.map((f) => (
              <div key={f.id} onClick={() => { setOverrideFlight(f); setOverrideStatus(''); }}>
                <FlightTrackingCard flight={f} tick={tick} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Summary Stats (Enhanced) ─── */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl border border-navy-100 p-4 text-center">
          <p className="text-2xl font-black text-navy-950">{todayFlights.length}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-navy-400 mt-1">Today</p>
        </div>
        <div className="bg-white rounded-2xl border border-navy-100 p-4 text-center">
          <p className="text-2xl font-black text-amber-600">{boardingFlights.length}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-navy-400 mt-1">Boarding</p>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-100 p-4 text-center">
          <p className="text-2xl font-black text-emerald-600">{airborneFlights.length}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-navy-400 mt-1">In Flight</p>
        </div>
        <div className="bg-white rounded-2xl border border-navy-100 p-4 text-center">
          <p className="text-2xl font-black text-blue-600">{landedFlights.length}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-navy-400 mt-1">Landed</p>
        </div>
        <div className="bg-white rounded-2xl border border-navy-100 p-4 text-center">
          <p className="text-2xl font-black text-green-700">{arrivedFlights.length}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-navy-400 mt-1">At Gate</p>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 p-4 text-center">
          <p className="text-2xl font-black text-red-600">{delayedFlights.length}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-navy-400 mt-1">Delayed</p>
        </div>
      </div>

      {/* ─── Manual Status Override Modal ─── */}
      {overrideFlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setOverrideFlight(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-navy-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black text-navy-950">Manual Status Override</h3>
              <button onClick={() => setOverrideFlight(null)} className="text-navy-400 hover:text-navy-600">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            {/* Flight info */}
            <div className="p-4 bg-navy-50/50 rounded-2xl mb-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-navy-950">{overrideFlight.flightNumber}</span>
                <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold ${FLIGHT_STATUS_CONFIG[overrideFlight.status]?.bg} ${FLIGHT_STATUS_CONFIG[overrideFlight.status]?.text}`}>
                  <span className={`w-2 h-2 rounded-full ${FLIGHT_STATUS_CONFIG[overrideFlight.status]?.dot}`} />
                  {FLIGHT_STATUS_LABELS[overrideFlight.status]}
                </span>
              </div>
              <p className="text-xs text-navy-500 mt-1">
                {overrideFlight.origin?.code} → {overrideFlight.destination?.code}
              </p>
            </div>

            {/* Status selector */}
            <label className="block text-[9px] font-black text-navy-400 uppercase tracking-widest mb-2">
              Set New Status
            </label>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {OVERRIDE_STATUSES.map((s) => {
                const sConfig = FLIGHT_STATUS_CONFIG[s];
                const sLabel = FLIGHT_STATUS_LABELS[s];
                const isSelected = overrideStatus === s;
                const isCurrent = overrideFlight.status === s;
                return (
                  <button
                    key={s}
                    disabled={isCurrent}
                    onClick={() => setOverrideStatus(s)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                      isSelected
                        ? `${sConfig.bg} ${sConfig.text} border-current shadow-md`
                        : isCurrent
                          ? 'bg-navy-50 text-navy-300 border-navy-100 opacity-50 cursor-not-allowed'
                          : 'bg-white text-navy-600 border-navy-100 hover:border-navy-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${sConfig.dot}`} />
                    {sLabel}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setOverrideFlight(null)}
                className="flex-1 py-3 border border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-500 hover:bg-navy-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                disabled={!overrideStatus || overrideLoading}
                className="flex-1 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {overrideLoading ? 'Updating...' : 'Apply Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveOpsView;
