import React, { useState, useMemo, useCallback } from 'react';
import { useActiveFlight } from '../../hooks/useActiveFlight';
import ActiveFlightCard from '../../components/scheduling/ActiveFlightCard';
import BoardingProgressCard from '../../components/scheduling/BoardingProgressCard';
import DelayWarningCard from '../../components/scheduling/DelayWarningCard';
import FlightTrackingCard from '../../components/scheduling/FlightTrackingCard';
import { FLIGHT_STATUS_LABELS, FLIGHT_STATUS_CONFIG } from '../../types/firestore';
import type { FlightDoc, FlightStatus } from '../../types/firestore';
import { updateFlightStatus, deleteFlight, getFlightBookingCount } from '../../services/firestore';
import { useToastStore } from '../../stores/toastStore';

type Tab = 'today' | 'week' | 'all';

// All statuses available for manual override
const OVERRIDE_STATUSES: FlightStatus[] = [
  'scheduled', 'boarding', 'doors_closed', 'taxi_out',
  'departed', 'airborne', 'cruise', 'descent',
  'landed', 'taxi_in', 'arrived', 'delayed', 'cancelled',
];

/** Statuses that allow deletion */
const DELETABLE_STATUSES: FlightStatus[] = ['scheduled', 'cancelled'];

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
    weekFlights,
    allFlights,
    recentEvents,
    landedFlights,
    arrivedFlights,
    tick,
    loading,
  } = useActiveFlight();

  const addToast = useToastStore((s) => s.addToast);
  const [scheduleTab, setScheduleTab] = useState<Tab>('today');

  // Detail panel state
  const [selectedFlight, setSelectedFlight] = useState<FlightDoc | null>(null);

  // Status override state
  const [overrideStatus, setOverrideStatus] = useState<FlightStatus | ''>('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bookingCount, setBookingCount] = useState<number | null>(null);
  const [bookingCheckLoading, setBookingCheckLoading] = useState(false);

  // ─── Filter flights based on tab ───
  const displayFlights = useMemo(() => {
    switch (scheduleTab) {
      case 'today':
        return todayFlights;
      case 'week':
        return weekFlights;
      case 'all':
        return allFlights;
      default:
        return todayFlights;
    }
  }, [scheduleTab, todayFlights, weekFlights, allFlights]);

  // Next scheduled flight
  const nextFlight = useMemo(() => {
    return upcomingFlights.find(
      (f) =>
        f.id !== activeFlight?.id &&
        !boardingFlights.some((b) => b.id === f.id) &&
        !airborneFlights.some((a) => a.id === f.id),
    ) || null;
  }, [upcomingFlights, activeFlight, boardingFlights, airborneFlights]);

  // ─── Handlers ───
  const handleSelectFlight = useCallback((f: FlightDoc) => {
    setSelectedFlight(f);
    setOverrideStatus('');
    setDeleteConfirm(false);
    setBookingCount(null);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedFlight(null);
    setOverrideStatus('');
    setDeleteConfirm(false);
    setBookingCount(null);
  }, []);

  const handleOverride = useCallback(async () => {
    if (!selectedFlight || !overrideStatus) return;
    setOverrideLoading(true);
    try {
      await updateFlightStatus({
        flightId: selectedFlight.id,
        status: overrideStatus,
      });
      addToast(`${selectedFlight.flightNumber} → ${FLIGHT_STATUS_LABELS[overrideStatus as FlightStatus]}`, 'success');
      setOverrideStatus('');
    } catch (err) {
      console.error('Status override failed:', err);
      addToast('Failed to update status', 'error');
    } finally {
      setOverrideLoading(false);
    }
  }, [selectedFlight, overrideStatus, addToast]);

  const handleDeleteRequest = useCallback(async () => {
    if (!selectedFlight) return;
    setBookingCheckLoading(true);
    try {
      const count = await getFlightBookingCount(selectedFlight.id);
      setBookingCount(count);
      if (count === 0) {
        setDeleteConfirm(true);
      }
    } catch (err) {
      console.error('Booking check failed:', err);
      addToast('Failed to check bookings', 'error');
    } finally {
      setBookingCheckLoading(false);
    }
  }, [selectedFlight, addToast]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedFlight) return;
    setDeleteLoading(true);
    try {
      await deleteFlight(selectedFlight.id);
      addToast(`${selectedFlight.flightNumber} deleted`, 'success');
      handleClosePanel();
    } catch (err) {
      console.error('Delete flight failed:', err);
      addToast('Failed to delete flight', 'error');
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedFlight, addToast, handleClosePanel]);

  const formatTime = (ts: any) => {
    if (!ts?.toDate) return '--:--';
    return ts.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatFullDate = (ts: any) => {
    if (!ts?.toDate) return '—';
    return ts.toDate().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDuration = (dep: any, arr: any) => {
    if (!dep?.toMillis || !arr?.toMillis) return '—';
    const diff = arr.toMillis() - dep.toMillis();
    if (diff <= 0) return '—';
    const hrs = Math.floor(diff / 3_600_000);
    const mins = Math.floor((diff % 3_600_000) / 60_000);
    return `${hrs}h ${mins}m`;
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

  // ─── Determine if the detail panel should be open ───
  const isPanelOpen = selectedFlight !== null;
  const canDelete = selectedFlight && DELETABLE_STATUSES.includes(selectedFlight.status);

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

      {/* ─── Schedule Cards Grid + Detail Panel ─── */}
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

          {/* Flight count + Live indicator */}
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">
              {displayFlights.length} {displayFlights.length === 1 ? 'flight' : 'flights'}
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-navy-400">Live</span>
            </div>
          </div>
        </div>

        {/* Master-Detail Layout */}
        <div className={`flex gap-4 ${isPanelOpen ? '' : ''}`}>
          {/* ─── LEFT: Cards Grid ─── */}
          <div className={`transition-all duration-300 ${isPanelOpen ? 'w-2/3' : 'w-full'}`}>
            {displayFlights.length === 0 ? (
              <div className="bg-white rounded-3xl border border-navy-100 p-16 text-center">
                <span className="material-symbols-outlined text-5xl text-navy-200 block mb-3">event_busy</span>
                <p className="font-bold text-navy-400">No flights found</p>
                <p className="text-xs text-navy-300 mt-1">No flights scheduled for this time period.</p>
              </div>
            ) : (
              <div className={`grid gap-4 ${isPanelOpen ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                {displayFlights.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => handleSelectFlight(f)}
                    className={`cursor-pointer transition-all duration-200 rounded-2xl ${
                      selectedFlight?.id === f.id
                        ? 'ring-2 ring-primary ring-offset-2 scale-[1.02]'
                        : 'hover:scale-[1.01]'
                    }`}
                  >
                    <FlightTrackingCard flight={f} tick={tick} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── RIGHT: Detail Sidebar Panel ─── */}
          {isPanelOpen && selectedFlight && (
            <div className="w-1/3 min-w-[320px] transition-all duration-300">
              <div className="bg-white rounded-3xl border border-navy-100 shadow-xl sticky top-4 overflow-hidden">
                {/* Panel Header */}
                <div className="bg-gradient-to-r from-navy-950 to-navy-800 px-6 py-5 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-black tracking-tight">{selectedFlight.flightNumber}</h3>
                    <button
                      onClick={handleClosePanel}
                      className="size-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black">{selectedFlight.origin?.code}</span>
                    <div className="flex-1 flex items-center">
                      <span className="h-px flex-1 bg-white/30" />
                      <span className="material-symbols-outlined mx-2" style={{ fontSize: 18 }}>flight</span>
                      <span className="h-px flex-1 bg-white/30" />
                    </div>
                    <span className="text-xl font-black">{selectedFlight.destination?.code}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-white/60 font-bold">
                      {selectedFlight.origin?.city}
                    </span>
                    <span className="text-[10px] text-white/60 font-bold">
                      {selectedFlight.destination?.city}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="px-6 pt-4 pb-2">
                  {(() => {
                    const sc = FLIGHT_STATUS_CONFIG[selectedFlight.status] || FLIGHT_STATUS_CONFIG.scheduled;
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${sc.bg} ${sc.text}`}>
                        <span className={`w-2 h-2 rounded-full ${sc.dot} ${sc.pulse ? 'animate-pulse' : ''}`} />
                        {FLIGHT_STATUS_LABELS[selectedFlight.status]}
                      </span>
                    );
                  })()}
                </div>

                {/* Flight Info Sections */}
                <div className="px-6 py-4 space-y-4 max-h-[calc(100vh-380px)] overflow-y-auto">

                  {/* Times */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-navy-50/50 rounded-xl p-3 text-center">
                      <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest mb-1">Departure</p>
                      <p className="text-sm font-black text-navy-950">{formatTime(selectedFlight.departureTime)}</p>
                    </div>
                    <div className="bg-navy-50/50 rounded-xl p-3 text-center">
                      <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest mb-1">Duration</p>
                      <p className="text-sm font-black text-navy-950">{formatDuration(selectedFlight.departureTime, selectedFlight.arrivalTime)}</p>
                    </div>
                    <div className="bg-navy-50/50 rounded-xl p-3 text-center">
                      <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest mb-1">Arrival</p>
                      <p className="text-sm font-black text-navy-950">{formatTime(selectedFlight.arrivalTime)}</p>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-3 p-3 bg-navy-50/30 rounded-xl">
                    <span className="material-symbols-outlined text-navy-400" style={{ fontSize: 18 }}>calendar_today</span>
                    <div>
                      <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Date</p>
                      <p className="text-xs font-bold text-navy-800">{formatFullDate(selectedFlight.departureTime)}</p>
                    </div>
                  </div>

                  {/* Aircraft */}
                  <div className="flex items-center gap-3 p-3 bg-navy-50/30 rounded-xl">
                    <span className="material-symbols-outlined text-navy-400" style={{ fontSize: 18 }}>flight</span>
                    <div className="flex-1">
                      <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Aircraft</p>
                      <p className="text-xs font-bold text-navy-800">{selectedFlight.aircraft?.registration || '—'}</p>
                    </div>
                    <span className="text-[10px] font-bold text-navy-400">{selectedFlight.aircraft?.type}</span>
                  </div>

                  {/* Gate & Terminal */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 bg-navy-50/30 rounded-xl">
                      <span className="material-symbols-outlined text-navy-400" style={{ fontSize: 16 }}>door_front</span>
                      <div>
                        <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Gate</p>
                        <p className="text-xs font-bold text-navy-800">{selectedFlight.gate || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-navy-50/30 rounded-xl">
                      <span className="material-symbols-outlined text-navy-400" style={{ fontSize: 16 }}>apartment</span>
                      <div>
                        <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Terminal</p>
                        <p className="text-xs font-bold text-navy-800">{selectedFlight.terminal || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Seat Availability */}
                  {selectedFlight.seatsAvailable && (
                    <div>
                      <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest mb-2">Seat Availability</p>
                      <div className="space-y-1.5">
                        {Object.entries(selectedFlight.seatsAvailable).map(([cls, total]) => {
                          const taken = selectedFlight.seatsTaken?.[cls] || 0;
                          const available = (total as number) - taken;
                          const pct = (total as number) > 0 ? Math.round((taken / (total as number)) * 100) : 0;
                          return (
                            <div key={cls} className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-navy-600 capitalize w-16">{cls}</span>
                              <div className="flex-1 h-2 bg-navy-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${pct > 85 ? 'bg-red-400' : pct > 60 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-navy-500 w-14 text-right">{available}/{total as number}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Base Fares */}
                  {selectedFlight.baseFare && (
                    <div>
                      <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest mb-2">Base Fares</p>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(selectedFlight.baseFare).map(([cls, price]) => (
                          <div key={cls} className="bg-navy-50/50 rounded-lg p-2 text-center">
                            <p className="text-[8px] font-black text-navy-300 uppercase">{cls}</p>
                            <p className="text-xs font-black text-emerald-700">${(price as number).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Delay Info */}
                  {selectedFlight.status === 'delayed' && selectedFlight.delayMinutes > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                      <span className="material-symbols-outlined text-red-500" style={{ fontSize: 16 }}>warning</span>
                      <div>
                        <p className="text-[10px] font-bold text-red-700">
                          Delayed {selectedFlight.delayMinutes} minutes
                        </p>
                        {selectedFlight.delayReason && (
                          <p className="text-[9px] text-red-500 mt-0.5">{selectedFlight.delayReason}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ─── Status Override ─── */}
                  <div className="border-t border-navy-100 pt-4">
                    <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest mb-2">
                      Status Override
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {OVERRIDE_STATUSES.map((s) => {
                        const sConfig = FLIGHT_STATUS_CONFIG[s];
                        const sLabel = FLIGHT_STATUS_LABELS[s];
                        const isSelected = overrideStatus === s;
                        const isCurrent = selectedFlight.status === s;
                        return (
                          <button
                            key={s}
                            disabled={isCurrent}
                            onClick={() => setOverrideStatus(s)}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${
                              isSelected
                                ? `${sConfig.bg} ${sConfig.text} border-current shadow-md`
                                : isCurrent
                                  ? 'bg-navy-50 text-navy-300 border-navy-100 opacity-50 cursor-not-allowed'
                                  : 'bg-white text-navy-600 border-navy-100 hover:border-navy-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${sConfig.dot}`} />
                            {sLabel}
                          </button>
                        );
                      })}
                    </div>
                    {overrideStatus && (
                      <button
                        onClick={handleOverride}
                        disabled={overrideLoading}
                        className="w-full mt-3 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                      >
                        {overrideLoading ? 'Updating...' : `Apply: ${FLIGHT_STATUS_LABELS[overrideStatus as FlightStatus]}`}
                      </button>
                    )}
                  </div>

                  {/* ─── Delete Flight ─── */}
                  {canDelete && (
                    <div className="border-t border-navy-100 pt-4">
                      {!deleteConfirm && bookingCount === null && (
                        <button
                          onClick={handleDeleteRequest}
                          disabled={bookingCheckLoading}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all disabled:opacity-50"
                        >
                          {bookingCheckLoading ? (
                            <>
                              <div className="animate-spin size-3 border-2 border-red-300 border-t-red-600 rounded-full" />
                              Checking bookings...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
                              Delete Flight
                            </>
                          )}
                        </button>
                      )}

                      {/* Booking exists warning */}
                      {bookingCount !== null && bookingCount > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                          <span className="material-symbols-outlined text-amber-500" style={{ fontSize: 16 }}>warning</span>
                          <p className="text-[10px] font-bold text-amber-700">
                            Cannot delete — {bookingCount} booking(s) exist for this flight. Cancel bookings first.
                          </p>
                        </div>
                      )}

                      {/* Delete confirmation */}
                      {deleteConfirm && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
                            <span className="material-symbols-outlined text-red-500" style={{ fontSize: 16 }}>error</span>
                            <p className="text-[10px] font-bold text-red-700">
                              Are you sure? This will permanently delete {selectedFlight.flightNumber}.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setDeleteConfirm(false); setBookingCount(null); }}
                              className="flex-1 py-2.5 border border-navy-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-navy-500 hover:bg-navy-50 transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleConfirmDelete}
                              disabled={deleteLoading}
                              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50"
                            >
                              {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
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
    </div>
  );
};

export default LiveOpsView;
