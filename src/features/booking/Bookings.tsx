
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../../config/routes';
import { useToastStore } from '../../stores/toastStore';
import {
    getAllBookings,
    searchBookings,
    exportBookingsCSV,
    type BookingPage,
} from '../../services/booking';
import type { BookingDoc } from '../../types/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

/* ── Status helpers ──────────────────────────────────────────── */
const STATUS_STYLE: Record<string, string> = {
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    cancelled: 'bg-red-50 text-red-700 border-red-100',
    checked_in: 'bg-blue-50 text-blue-700 border-blue-100',
    boarded: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    completed: 'bg-navy-50 text-navy-700 border-navy-100',
    refunded: 'bg-rose-50 text-rose-700 border-rose-100',
};

const FARE_LABELS: Record<string, string> = {
    economy: 'Economy', Y: 'Economy',
    premium_economy: 'Premium Econ', W: 'Premium Econ',
    business: 'Business', J: 'Business',
    first: 'First', F: 'First',
};

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'pending', label: 'Pending' },
    { key: 'cancelled', label: 'Cancelled' },
];

function formatDate(ts: any): string {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMoney(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

/* ══════════════════════════════════════════════════════════════
   Bookings Admin — Live Firestore Data
   ══════════════════════════════════════════════════════════════ */
const Bookings: React.FC = () => {
    const navigate = useNavigate();
    const addToast = useToastStore(s => s.addToast);

    /* ── State ──────────────────────────────────────────────── */
    const [bookings, setBookings] = useState<BookingDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const cursorRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

    /* ── Load bookings (initial + tab change) ───────────────── */
    const loadBookings = useCallback(async (status: string) => {
        setLoading(true);
        setSearchTerm('');
        setIsSearching(false);
        cursorRef.current = null;
        try {
            const page = await getAllBookings(status);
            setBookings(page.bookings);
            cursorRef.current = page.lastDoc;
            setHasMore(page.hasMore);
        } catch (err) {
            console.error('Failed to load bookings:', err);
            addToast('Failed to load bookings', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => { loadBookings(activeTab); }, [activeTab, loadBookings]);

    /* ── Load more (pagination) ─────────────────────────────── */
    const handleLoadMore = useCallback(async () => {
        if (!cursorRef.current || loadingMore) return;
        setLoadingMore(true);
        try {
            const page = await getAllBookings(activeTab, cursorRef.current);
            setBookings(prev => [...prev, ...page.bookings]);
            cursorRef.current = page.lastDoc;
            setHasMore(page.hasMore);
        } catch (err) {
            addToast('Failed to load more', 'error');
        } finally {
            setLoadingMore(false);
        }
    }, [activeTab, loadingMore, addToast]);

    /* ── Search ─────────────────────────────────────────────── */
    const handleSearch = useCallback(async () => {
        const term = searchTerm.trim();
        if (!term) {
            loadBookings(activeTab);
            return;
        }
        setIsSearching(true);
        setLoading(true);
        try {
            const results = await searchBookings(term);
            setBookings(results);
            setHasMore(false);
            cursorRef.current = null;
            if (results.length === 0) {
                addToast(`No bookings found for "${term}"`, 'warning');
            }
        } catch (err) {
            addToast('Search failed', 'error');
        } finally {
            setLoading(false);
        }
    }, [searchTerm, activeTab, loadBookings, addToast]);

    /* ── Export CSV ──────────────────────────────────────────── */
    const handleExport = useCallback(() => {
        if (bookings.length === 0) {
            addToast('No bookings to export', 'warning');
            return;
        }
        exportBookingsCSV(bookings);
        addToast(`Exported ${bookings.length} bookings`, 'success');
    }, [bookings, addToast]);

    /* ── Navigate to detail ─────────────────────────────────── */
    const openDetail = (id: string) => navigate(`/admin/bookings/${id}`);

    /* ── Tab change handler ─────────────────────────────────── */
    const handleTabChange = (key: string) => {
        setActiveTab(key);
    };

    /* ── Render ─────────────────────────────────────────────── */
    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">
                        <span>Admin</span>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                        <span className="text-primary">Bookings</span>
                    </nav>
                    <h1 className="text-3xl font-black text-navy-950 tracking-tight">Booking Management</h1>
                    <p className="text-navy-500 font-medium">View and manage all customer reservations.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="px-6 py-2.5 bg-white border border-navy-100 text-navy-700 font-bold rounded-xl shadow-sm hover:bg-navy-50 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">download</span>
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-3xl border border-navy-100 shadow-sm overflow-hidden flex flex-col">
                {/* Tabs */}
                <div className="border-b border-navy-100 px-8 flex items-center gap-8 overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className={`py-5 text-sm font-black tracking-tight transition-all relative whitespace-nowrap ${
                                activeTab === tab.key ? 'text-primary' : 'text-navy-400 hover:text-navy-600'
                            }`}
                        >
                            {tab.label} Bookings
                            {activeTab === tab.key && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="p-6 bg-navy-50/30 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-navy-100">
                    <div className="relative w-full max-w-lg group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 group-focus-within:text-primary transition-colors">
                            search
                        </span>
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 shadow-sm"
                            placeholder="Search by PNR or Email..."
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={handleSearch}
                            className="flex-1 md:flex-none px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-600 transition-all shadow-md"
                        >
                            <span className="material-symbols-outlined text-lg">search</span>
                            Search
                        </button>
                        {isSearching && (
                            <button
                                onClick={() => loadBookings(activeTab)}
                                className="flex-1 md:flex-none px-4 py-3 bg-white rounded-2xl border border-navy-100 text-xs font-black text-navy-600 flex items-center gap-2 hover:bg-navy-50 transition-all"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-24 space-y-4">
                        <span className="material-symbols-outlined text-6xl text-navy-200">confirmation_number</span>
                        <p className="text-sm font-black text-navy-300 uppercase tracking-widest">
                            {isSearching ? 'No matching bookings found' : 'No bookings yet'}
                        </p>
                        <p className="text-xs text-navy-400 max-w-sm mx-auto">
                            {isSearching
                                ? 'Try a different PNR or email address.'
                                : 'Bookings will appear here once passengers make reservations.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-navy-50/50 border-b border-navy-100 text-[10px] font-black text-navy-400 uppercase tracking-widest">
                                        <th className="px-8 py-4">PNR</th>
                                        <th className="px-8 py-4">Customer</th>
                                        <th className="px-8 py-4">Flight / Route</th>
                                        <th className="px-8 py-4">Date</th>
                                        <th className="px-8 py-4">Amount</th>
                                        <th className="px-8 py-4">Class</th>
                                        <th className="px-8 py-4">Status</th>
                                        <th className="px-8 py-4 text-right">PAX</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-navy-50">
                                    {bookings.map(b => (
                                        <tr
                                            key={b.id}
                                            onClick={() => openDetail(b.id)}
                                            className="group hover:bg-navy-50/50 transition-colors cursor-pointer"
                                        >
                                            <td className="px-8 py-5">
                                                <span className="font-black text-primary">{b.pnr}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs text-navy-400 font-medium truncate">{b.contactEmail}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-bold text-navy-700">{b.flightNumber}</span>
                                                    <span className="text-[10px] font-medium text-navy-400">
                                                        {b.origin?.code ?? '—'} → {b.destination?.code ?? '—'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-medium text-navy-500">{formatDate(b.departureTime)}</td>
                                            <td className="px-8 py-5">
                                                <span className="text-sm font-black text-navy-950">
                                                    {formatMoney(b.totalAmount, b.currency)}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-black uppercase border border-blue-100">
                                                    {FARE_LABELS[b.fareClass] ?? b.fareClass}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${STATUS_STYLE[b.status] ?? 'bg-navy-50 text-navy-500 border-navy-100'}`}>
                                                    {b.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="text-sm font-bold text-navy-700">{b.passengerCount}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer / Pagination */}
                        <div className="px-8 py-5 bg-navy-50/20 border-t border-navy-100 flex items-center justify-between">
                            <p className="text-xs font-bold text-navy-400 uppercase tracking-widest">
                                Showing {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
                                {isSearching && ' (search results)'}
                            </p>
                            {hasMore && !isSearching && (
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="px-6 py-2 bg-white border border-navy-100 rounded-xl text-xs font-black text-navy-700 hover:bg-navy-50 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loadingMore ? (
                                        <>
                                            <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                            Loading...
                                        </>
                                    ) : (
                                        <>Load More</>
                                    )}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Bookings;
