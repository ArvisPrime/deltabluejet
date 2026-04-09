import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import type { FlightDoc, FlightEventDoc } from '../types/firestore';

/* ─────────────── Types ─────────────── */
export interface LiveFlightData {
  /** The single "hero" flight — next flight within 1 h before boarding or currently active */
  activeFlight: FlightDoc | null;
  /** Flights currently in boarding/doors_closed status */
  boardingFlights: FlightDoc[];
  /** Flights currently airborne (taxi_out, departed, airborne, in_air, cruise, descent) */
  airborneFlights: FlightDoc[];
  /** Flights grounded past scheduled departure — DELAY warnings */
  delayedFlights: FlightDoc[];
  /** Upcoming scheduled flights (within next 24 h) */
  upcomingFlights: FlightDoc[];
  /** All today's flights, unfiltered */
  todayFlights: FlightDoc[];
  /** Recent flight events for the event feed */
  recentEvents: FlightEventDoc[];
  /** Flights that have landed / taxi_in (for turnaround tracking) */
  landedFlights: FlightDoc[];
  /** Flights at gate (arrived) */
  arrivedFlights: FlightDoc[];
  /** ISO tick — changes every 60 s so components re-render */
  tick: number;
  loading: boolean;
}

/** Statuses considered "in the air" (between taxi_out and landed) */
const IN_FLIGHT_STATUSES = ['taxi_out', 'departed', 'airborne', 'in_air', 'cruise', 'descent'];

/** Statuses considered "pre-departure active" */
const PRE_FLIGHT_ACTIVE = ['boarding', 'doors_closed'];

/* ─────────────── Hook ─────────────── */
export function useActiveFlight(): LiveFlightData {
  const [flights, setFlights] = useState<FlightDoc[]>([]);
  const [recentEvents, setRecentEvents] = useState<FlightEventDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Subscribe to today's flights + tomorrow's first flights via onSnapshot
  useEffect(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfTomorrow = new Date(startOfDay.getTime() + 2 * 24 * 60 * 60 * 1000);

    const q = query(
      collection(db, 'flights'),
      where('departureTime', '>=', Timestamp.fromDate(startOfDay)),
      where('departureTime', '<=', Timestamp.fromDate(endOfTomorrow)),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FlightDoc);
        // Sort by departure ascending
        data.sort((a, b) => a.departureTime.toMillis() - b.departureTime.toMillis());
        setFlights(data);
        setLoading(false);
      },
      (err) => {
        console.error('[useActiveFlight] Snapshot error:', err);
        setLoading(false);
      },
    );

    return unsub;
  }, []);

  // Subscribe to recent flight events (last 20)
  useEffect(() => {
    const q = query(
      collection(db, 'flight_events'),
      orderBy('createdAt', 'desc'),
      limit(20),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FlightEventDoc);
        setRecentEvents(data);
      },
      (err) => {
        console.error('[useActiveFlight] Events snapshot error:', err);
      },
    );

    return unsub;
  }, []);

  // 60-second ticker to recalculate progress
  useEffect(() => {
    tickRef.current = setInterval(() => setTick(Date.now()), 60_000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const now = tick; // Use tick so derivations recalculate

  /* ─── Derived data ─────────────────────────── */
  const boardingFlights = flights.filter(
    (f) => PRE_FLIGHT_ACTIVE.includes(f.status),
  );

  const airborneFlights = flights.filter(
    (f) => IN_FLIGHT_STATUSES.includes(f.status),
  );

  const delayedFlights = flights.filter((f) => {
    if (f.status === 'delayed') return true;
    // Also flag flights that should have departed but haven't (still scheduled past dep time + 15 min)
    if (f.status === 'scheduled') {
      const depMs = f.departureTime?.toMillis?.() || 0;
      return depMs > 0 && now > depMs + 15 * 60_000;
    }
    return false;
  });

  const upcomingFlights = flights.filter((f) => {
    if (f.status !== 'scheduled') return false;
    const depMs = f.departureTime?.toMillis?.() || 0;
    return depMs > now && depMs <= now + 24 * 60 * 60 * 1000;
  });

  const todayFlights = flights.filter((f) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const depMs = f.departureTime?.toMillis?.() || 0;
    return depMs >= todayStart.getTime() && depMs < todayEnd.getTime();
  });

  const landedFlights = flights.filter(
    (f) => f.status === 'landed' || f.status === 'taxi_in',
  );

  const arrivedFlights = flights.filter((f) => f.status === 'arrived');

  // Active flight = airborne > boarding > next-within-1-hour
  const activeFlight: FlightDoc | null = (() => {
    // Priority 1: in-flight (cruise > airborne > descent > taxi_out)
    const cruising = airborneFlights.find((f) => f.status === 'cruise');
    if (cruising) return cruising;
    const airborne = airborneFlights.find((f) => f.status === 'airborne' || f.status === 'in_air');
    if (airborne) return airborne;
    const descending = airborneFlights.find((f) => f.status === 'descent');
    if (descending) return descending;
    if (airborneFlights.length > 0) return airborneFlights[0];

    // Priority 2: boarding/doors_closed flight
    if (boardingFlights.length > 0) return boardingFlights[0];

    // Priority 3: next flight within 1 hour
    const oneHourMs = 60 * 60 * 1000;
    const nextSoon = flights.find((f) => {
      if (f.status !== 'scheduled') return false;
      const depMs = f.departureTime?.toMillis?.() || 0;
      return depMs > now && depMs - now <= oneHourMs;
    });
    return nextSoon || null;
  })();

  return {
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
  };
}
