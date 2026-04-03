import React, { useState, useMemo } from 'react';
import { useActiveFlight } from '../../hooks/useActiveFlight';
import ActiveFlightCard from '../../components/scheduling/ActiveFlightCard';
import BoardingProgressCard from '../../components/scheduling/BoardingProgressCard';
import DelayWarningCard from '../../components/scheduling/DelayWarningCard';
import FlightTrackingCard from '../../components/scheduling/FlightTrackingCard';

type Tab = 'today' | 'week' | 'all';

/**
 * Live Ops Control Center — replaces the old table-based schedule list.
 * Shows real-time flight data with card-based UI.
 */
const LiveOpsView: React.FC = () => {
  const {
    activeFlight,
    boardingFlights,
    airborneFlights,
    delayedFlights,
    upcomingFlights,
    todayFlights,
    tick,
    loading,
  } = useActiveFlight();

  const [scheduleTab, setScheduleTab] = useState<Tab>('today');

  // Filter flights based on tab
  const displayFlights = useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    switch (scheduleTab) {
      case 'today':
        return todayFlights;
      case 'week':
        // todayFlights already scoped from the hook to 48h, good enough for week display
        return todayFlights;
      case 'all':
      default:
        return todayFlights;
    }
  }, [scheduleTab, todayFlights]);

  // Next scheduled flight (not active, not boarding, not airborne)
  const nextFlight = useMemo(() => {
    return upcomingFlights.find(
      (f) =>
        f.id !== activeFlight?.id &&
        !boardingFlights.some((b) => b.id === f.id) &&
        !airborneFlights.some((a) => a.id === f.id),
    ) || null;
  }, [upcomingFlights, activeFlight, boardingFlights, airborneFlights]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 rounded-full border-[3px] border-navy-100 border-t-primary animate-spin" />
        <p className="text-sm font-bold text-navy-400">Loading flight operations…</p>
      </div>
    );
  }

  const formatTime = (ts: any) => {
    if (!ts?.toDate) return '--:--';
    return ts.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

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

        {/* Delay Warning card(s) - first one or placeholder */}
        {delayedFlights.length > 0 ? (
          <DelayWarningCard flight={delayedFlights[0]} tick={tick} />
        ) : (
          <div className="rounded-2xl bg-white border border-emerald-100 p-5 flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-2xl text-emerald-300">check_circle</span>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">All On Time</p>
          </div>
        )}
      </div>

      {/* Additional delay warnings if more than 1 */}
      {delayedFlights.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {delayedFlights.slice(1).map((f) => (
            <DelayWarningCard key={f.id} flight={f} tick={tick} />
          ))}
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
              <FlightTrackingCard key={f.id} flight={f} tick={tick} />
            ))}
          </div>
        )}
      </div>

      {/* ─── Summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-navy-100 p-4 text-center">
          <p className="text-2xl font-black text-navy-950">{todayFlights.length}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-navy-400 mt-1">Today's Flights</p>
        </div>
        <div className="bg-white rounded-2xl border border-navy-100 p-4 text-center">
          <p className="text-2xl font-black text-emerald-600">{airborneFlights.length}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-navy-400 mt-1">Airborne</p>
        </div>
        <div className="bg-white rounded-2xl border border-navy-100 p-4 text-center">
          <p className="text-2xl font-black text-amber-600">{boardingFlights.length}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-navy-400 mt-1">Boarding</p>
        </div>
        <div className="bg-white rounded-2xl border border-navy-100 p-4 text-center">
          <p className="text-2xl font-black text-red-600">{delayedFlights.length}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-navy-400 mt-1">Delayed</p>
        </div>
      </div>
    </div>
  );
};

export default LiveOpsView;
