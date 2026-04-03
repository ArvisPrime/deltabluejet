import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import type { FlightDoc } from '../types/firestore';

/* ─────────────── Types ─────────────── */
export interface LiveFlightData {
  /** The single "hero" flight — next flight within 1 h before boarding or currently active */
  activeFlight: FlightDoc | null;
  /** Flights currently in boarding status */
  boardingFlights: FlightDoc[];
  /** Flights currently airborne (departed / in_air) */
  airborneFlights: FlightDoc[];
  /** Flights grounded past scheduled departure — DELAY warnings */
  delayedFlights: FlightDoc[];
  /** Upcoming scheduled flights (within next 24 h) */
  upcomingFlights: FlightDoc[];
  /** All today's flights, unfiltered */
  todayFlights: FlightDoc[];
  /** ISO tick — changes every 60 s so components re-render */
  tick: number;
  loading: boolean;
}

/* ─────────────── Hook ─────────────── */
export function useActiveFlight(): LiveFlightData {
  const [flights, setFlights] = useState<FlightDoc[]>([]);
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

  // 60-second ticker to recalculate progress
  useEffect(() => {
    tickRef.current = setInterval(() => setTick(Date.now()), 60_000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const now = tick; // Use tick so derivations recalculate

  /* ─── Derived data ─────────────────────────── */
  const boardingFlights = flights.filter((f) => f.status === 'boarding');

  const airborneFlights = flights.filter(
    (f) => f.status === 'departed' || f.status === 'in_air',
  );

  const delayedFlights = flights.filter((f) => {
    if (f.status === 'delayed') return true;
    // Also flag flights that should have departed but haven't
    if (f.status === 'scheduled' || f.status === 'boarding') {
      const depMs = f.departureTime?.toMillis?.() || 0;
      return depMs > 0 && now > depMs;
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

  // Active flight = boarding flight OR next flight within 1 hour
  const activeFlight: FlightDoc | null = (() => {
    // Priority 1: airborne flight
    if (airborneFlights.length > 0) return airborneFlights[0];
    // Priority 2: boarding flight
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
    tick,
    loading,
  };
}
