/**
 * Reporting Service — Deltablue Jet Air
 *
 * Queries Firestore for revenue, load factor, OTP, passenger stats,
 * and financial reconciliation. Includes CSV export utility.
 */

import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase.config';

// ─── CSV Export ───────────────────────────────────────────

export function exportToCSV(headers: string[], rows: (string | number)[][], filename: string): void {
    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(c => `"${c}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

// ─── Revenue Queries ──────────────────────────────────────

export interface RevenueRow {
    route: string;
    fareClass: string;
    revenue: number;
    bookings: number;
    period: string;
}

export async function getRevenueData(startDate?: Date, endDate?: Date): Promise<RevenueRow[]> {
    const bookingsRef = collection(db, 'bookings');
    const snap = await getDocs(bookingsRef);
    const rows: RevenueRow[] = [];

    snap.docs.forEach(d => {
        const data = d.data();
        const created = data.createdAt?.toDate?.() || new Date();
        if (startDate && created < startDate) return;
        if (endDate && created > endDate) return;

        const route = `${data.origin || '?'}-${data.destination || '?'}`;
        const fareClass = data.fareClass || data.cabinClass || 'economy';
        const revenue = data.totalAmount || data.amount || 0;
        const period = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;

        rows.push({ route, fareClass, revenue, bookings: 1, period });
    });

    return rows;
}

// ─── Load Factor Queries ──────────────────────────────────

export interface LoadFactorRow {
    flightNumber: string;
    route: string;
    date: string;
    totalSeats: number;
    bookedSeats: number;
    loadFactor: number;
}

export async function getLoadFactorData(): Promise<LoadFactorRow[]> {
    const flightsRef = collection(db, 'flights');
    const snap = await getDocs(flightsRef);
    const rows: LoadFactorRow[] = [];

    snap.docs.forEach(d => {
        const data = d.data();
        const totalSeats = Object.values(data.seatsAvailable || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
        const taken = Object.values(data.seatsTaken || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
        const loadFactor = totalSeats > 0 ? Math.round((taken / totalSeats) * 100) : 0;
        const depTime = data.departureTime?.toDate?.();

        rows.push({
            flightNumber: data.flightNumber || d.id,
            route: `${data.origin?.code || '?'}-${data.destination?.code || '?'}`,
            date: depTime ? depTime.toISOString().split('T')[0] : 'N/A',
            totalSeats, bookedSeats: taken, loadFactor,
        });
    });

    return rows;
}

// ─── OTP Queries ──────────────────────────────────────────

export interface OTPRow {
    flightNumber: string;
    route: string;
    date: string;
    scheduledDep: string;
    actualDep: string;
    delayMinutes: number;
    onTime: boolean; // within 15 min
    status: string;
}

export async function getOTPData(): Promise<OTPRow[]> {
    const flightsRef = collection(db, 'flights');
    const snap = await getDocs(flightsRef);
    const rows: OTPRow[] = [];

    snap.docs.forEach(d => {
        const data = d.data();
        const delay = data.delayMinutes || 0;
        const depTime = data.departureTime?.toDate?.();
        const newDep = data.newDepartureTime?.toDate?.();

        rows.push({
            flightNumber: data.flightNumber || d.id,
            route: `${data.origin?.code || '?'}-${data.destination?.code || '?'}`,
            date: depTime ? depTime.toISOString().split('T')[0] : 'N/A',
            scheduledDep: depTime ? depTime.toLocaleTimeString() : 'N/A',
            actualDep: newDep ? newDep.toLocaleTimeString() : depTime ? depTime.toLocaleTimeString() : 'N/A',
            delayMinutes: delay,
            onTime: delay <= 15,
            status: data.status || 'scheduled',
        });
    });

    return rows;
}

// ─── Passenger Stats ──────────────────────────────────────

export interface PassengerStatsData {
    totalPassengers: number;
    uniquePassengers: number;
    topRoutes: { route: string; count: number }[];
    fareClassDistribution: Record<string, number>;
    monthlyTrend: { month: string; count: number }[];
}

export async function getPassengerStats(): Promise<PassengerStatsData> {
    const bookingsRef = collection(db, 'bookings');
    const snap = await getDocs(bookingsRef);

    const routeMap: Record<string, number> = {};
    const fareMap: Record<string, number> = {};
    const monthMap: Record<string, number> = {};
    const emailSet = new Set<string>();
    let total = 0;

    snap.docs.forEach(d => {
        const data = d.data();
        total += data.passengers?.length || 1;
        if (data.email) emailSet.add(data.email);

        const route = `${data.origin || '?'}-${data.destination || '?'}`;
        routeMap[route] = (routeMap[route] || 0) + 1;

        const fc = data.fareClass || data.cabinClass || 'economy';
        fareMap[fc] = (fareMap[fc] || 0) + 1;

        const created = data.createdAt?.toDate?.();
        if (created) {
            const month = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
            monthMap[month] = (monthMap[month] || 0) + 1;
        }
    });

    const topRoutes = Object.entries(routeMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([route, count]) => ({ route, count }));

    const monthlyTrend = Object.entries(monthMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, count]) => ({ month, count }));

    return { totalPassengers: total, uniquePassengers: emailSet.size, topRoutes, fareClassDistribution: fareMap, monthlyTrend };
}

// ─── Financial Reconciliation ─────────────────────────────

export interface ReconRow {
    bookingRef: string;
    passenger: string;
    route: string;
    totalCharged: number;
    paymentStatus: string;
    refunded: number;
    netRevenue: number;
    date: string;
}

export async function getReconciliationData(): Promise<ReconRow[]> {
    const bookingsRef = collection(db, 'bookings');
    const snap = await getDocs(bookingsRef);
    const rows: ReconRow[] = [];

    snap.docs.forEach(d => {
        const data = d.data();
        const total = data.totalAmount || data.amount || 0;
        const refunded = data.refundedAmount || 0;
        const created = data.createdAt?.toDate?.();

        rows.push({
            bookingRef: data.pnr || data.bookingRef || d.id,
            passenger: data.passengers?.[0]?.firstName ? `${data.passengers[0].firstName} ${data.passengers[0].lastName || ''}` : data.email || 'N/A',
            route: `${data.origin || '?'}-${data.destination || '?'}`,
            totalCharged: total,
            paymentStatus: data.paymentStatus || data.status || 'unknown',
            refunded,
            netRevenue: total - refunded,
            date: created ? created.toISOString().split('T')[0] : 'N/A',
        });
    });

    return rows;
}
