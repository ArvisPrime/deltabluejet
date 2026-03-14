/**
 * Sales & BI Service — aggregates booking data for dashboard analytics.
 *
 * Provides: daily revenue, bookings by class, route performance, CSV export.
 */

import {
    collection,
    query,
    orderBy,
    getDocs,
    where,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import type { BookingDoc, FlightDoc } from '../types/firestore';

// ─── Types ─────────────────────────────────────────────────

export interface DailySalesPoint {
    date: string;           // YYYY-MM-DD
    revenue: number;
    bookings: number;
    cancellations: number;
}

export interface ClassBreakdown {
    fareClass: string;
    revenue: number;
    bookings: number;
    percentage: number;
}

export interface RoutePerformance {
    route: string;          // "BJL → DKR"
    origin: string;
    destination: string;
    revenue: number;
    bookings: number;
    avgFare: number;
    loadFactor: number;     // 0-100
    trend: number;          // positive = up
}

export interface SalesSummary {
    todayRevenue: number;
    todayBookings: number;
    totalRevenue: number;
    totalBookings: number;
    activeFlights: number;
    avgFare: number;
}

// ─── Helpers ───────────────────────────────────────────────

function dateKey(ts: Timestamp): string {
    const d = ts.toDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Data Fetching ─────────────────────────────────────────

async function fetchBookings(days: number): Promise<BookingDoc[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceTs = Timestamp.fromDate(since);

    const q = query(
        collection(db, 'bookings'),
        where('createdAt', '>=', sinceTs),
        orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BookingDoc);
}

async function fetchFlights(): Promise<FlightDoc[]> {
    const q = query(
        collection(db, 'flights'),
        orderBy('departureTime', 'asc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FlightDoc);
}

// ─── Aggregations ──────────────────────────────────────────

/**
 * Get daily revenue + booking counts for the last N days.
 */
export async function getDailySalesData(days = 30): Promise<DailySalesPoint[]> {
    const bookings = await fetchBookings(days);
    const map = new Map<string, DailySalesPoint>();

    // Pre-fill all days
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        map.set(key, { date: key, revenue: 0, bookings: 0, cancellations: 0 });
    }

    for (const b of bookings) {
        if (!b.createdAt) continue;
        const key = dateKey(b.createdAt);
        const entry = map.get(key);
        if (!entry) continue;

        if (b.status === 'cancelled') {
            entry.cancellations++;
        } else {
            entry.revenue += b.totalAmount || 0;
            entry.bookings++;
        }
    }

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Revenue breakdown by fare class.
 */
export async function getRevenueByClass(days = 30): Promise<ClassBreakdown[]> {
    const bookings = await fetchBookings(days);
    const classMap = new Map<string, { revenue: number; bookings: number }>();

    for (const b of bookings) {
        if (b.status === 'cancelled') continue;
        const cls = b.fareClass || 'economy';
        const entry = classMap.get(cls) || { revenue: 0, bookings: 0 };
        entry.revenue += b.totalAmount || 0;
        entry.bookings++;
        classMap.set(cls, entry);
    }

    const totalRevenue = Array.from(classMap.values()).reduce((s, e) => s + e.revenue, 0);

    return Array.from(classMap.entries()).map(([fareClass, data]) => ({
        fareClass,
        revenue: data.revenue,
        bookings: data.bookings,
        percentage: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0,
    }));
}

/**
 * Route-level performance metrics.
 */
export async function getRoutePerformance(days = 30): Promise<RoutePerformance[]> {
    const [bookings, flights] = await Promise.all([
        fetchBookings(days),
        fetchFlights(),
    ]);

    // Build capacity map from flights
    const routeCapacity = new Map<string, number>();
    for (const f of flights) {
        const key = `${f.origin.code} → ${f.destination.code}`;
        const total = Object.values(f.seatsAvailable).reduce((s, n) => s + n, 0);
        routeCapacity.set(key, (routeCapacity.get(key) || 0) + total);
    }

    // Aggregate booking data by route
    const routeMap = new Map<string, { revenue: number; bookings: number; origin: string; destination: string }>();

    for (const b of bookings) {
        if (b.status === 'cancelled') continue;
        const key = `${b.origin.code} → ${b.destination.code}`;
        const entry = routeMap.get(key) || { revenue: 0, bookings: 0, origin: b.origin.code, destination: b.destination.code };
        entry.revenue += b.totalAmount || 0;
        entry.bookings++;
        routeMap.set(key, entry);
    }

    return Array.from(routeMap.entries())
        .map(([route, data]) => {
            const capacity = routeCapacity.get(route) || 1;
            return {
                route,
                origin: data.origin,
                destination: data.destination,
                revenue: data.revenue,
                bookings: data.bookings,
                avgFare: data.bookings > 0 ? Math.round(data.revenue / data.bookings) : 0,
                loadFactor: Math.min(100, Math.round((data.bookings / capacity) * 100)),
                trend: Math.round(Math.random() * 20 - 10), // placeholder until historical comparison
            };
        })
        .sort((a, b) => b.revenue - a.revenue);
}

/**
 * Summary KPIs for the dashboard header.
 */
export async function getSalesSummary(): Promise<SalesSummary> {
    const [bookings, flights] = await Promise.all([
        fetchBookings(30),
        fetchFlights(),
    ]);

    const today = todayKey();
    let todayRevenue = 0;
    let todayBookings = 0;
    let totalRevenue = 0;
    let totalBookings = 0;

    for (const b of bookings) {
        if (b.status === 'cancelled') continue;
        totalRevenue += b.totalAmount || 0;
        totalBookings++;
        if (b.createdAt && dateKey(b.createdAt) === today) {
            todayRevenue += b.totalAmount || 0;
            todayBookings++;
        }
    }

    const activeFlights = flights.filter(f =>
        ['scheduled', 'boarding', 'departed', 'in_air'].includes(f.status)
    ).length;

    return {
        todayRevenue,
        todayBookings,
        totalRevenue,
        totalBookings,
        activeFlights,
        avgFare: totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0,
    };
}

// ─── CSV Export ────────────────────────────────────────────

/**
 * Generate and download a CSV of daily sales data.
 */
export async function exportSalesCSV(days = 30): Promise<void> {
    const data = await getDailySalesData(days);

    const header = 'Date,Revenue,Bookings,Cancellations\n';
    const rows = data.map(d => `${d.date},${d.revenue},${d.bookings},${d.cancellations}`).join('\n');
    const csv = header + rows;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${days}d_${todayKey()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
