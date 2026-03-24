
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../config/routes';
import { getBookingHistory } from '../../services/customerService';
import type { BookingDoc } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';

/**
 * MyTrips — Shows upcoming and past bookings for the passenger.
 */
const MyTrips: React.FC = () => {
    const { user } = useAuth();
    const addToast = useToastStore(s => s.addToast);

    const [bookings, setBookings] = useState<BookingDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const bkgs = await getBookingHistory(user.uid, 50);
                setBookings(bkgs);
            } catch {
                addToast('Failed to load trips', 'error');
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    const now = new Date();

    const { upcoming, past } = useMemo(() => {
        const upcoming: BookingDoc[] = [];
        const past: BookingDoc[] = [];

        bookings.forEach(b => {
            try {
                const dep = b.departureTime?.toDate ? b.departureTime.toDate() : new Date(b.departureTime as any);
                if (dep > now && b.status !== 'cancelled' && b.status !== 'refunded') {
                    upcoming.push(b);
                } else {
                    past.push(b);
                }
            } catch {
                past.push(b);
            }
        });

        return { upcoming, past };
    }, [bookings]);

    const displayList = tab === 'upcoming' ? upcoming : past;

    const formatDate = (ts: any, opts?: Intl.DateTimeFormatOptions) => {
        try {
            const d = ts?.toDate ? ts.toDate() : new Date(ts);
            return d.toLocaleDateString('en-US', opts || { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        } catch { return '—'; }
    };

    const formatTime = (ts: any) => {
        try {
            const d = ts?.toDate ? ts.toDate() : new Date(ts);
            return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch { return '—'; }
    };

    const statusBadge = (status: string) => {
        const styles: Record<string, string> = {
            confirmed: 'bg-emerald-50 text-emerald-700',
            checked_in: 'bg-blue-50 text-blue-700',
            boarded: 'bg-indigo-50 text-indigo-700',
            completed: 'bg-navy-50 text-navy-600',
            cancelled: 'bg-red-50 text-red-600',
            refunded: 'bg-orange-50 text-orange-600',
            pending: 'bg-amber-50 text-amber-700',
        };
        return styles[status] || 'bg-navy-50 text-navy-500';
    };

    const downloadETicket = (b: BookingDoc) => {
        const depDate = formatDate(b.departureTime, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        const depTime = formatTime(b.departureTime);
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>E-Ticket ${b.pnr || ''}</title>
<style>body{font-family:Arial,sans-serif;max-width:650px;margin:40px auto;padding:20px;color:#1a1a2e}
.header{text-align:center;border-bottom:3px solid #0066ff;padding-bottom:20px;margin-bottom:30px}
.header h1{font-size:24px;color:#0066ff;margin:0 0 5px}
.route{text-align:center;font-size:28px;font-weight:800;letter-spacing:2px;margin:20px 0}
table{width:100%;border-collapse:collapse;margin:20px 0}td,th{padding:10px 14px;text-align:left;border-bottom:1px solid #eee;font-size:13px}
th{font-size:9px;text-transform:uppercase;color:#999;letter-spacing:1px}
.footer{text-align:center;margin-top:40px;font-size:11px;color:#999}
</style></head><body>
<div class="header"><h1>DeltaBlue Jet Air</h1><p style="font-size:12px;color:#666">Electronic Ticket / Itinerary Receipt</p></div>
<p class="route">${b.origin?.code || '—'} → ${b.destination?.code || '—'}</p>
<table><tr><th>Detail</th><th>Value</th></tr>
<tr><td>PNR / Reference</td><td><strong>${b.pnr || '—'}</strong></td></tr>
<tr><td>Flight</td><td>${b.flightNumber || '—'}</td></tr>
<tr><td>Route</td><td>${b.origin?.city || '—'} → ${b.destination?.city || '—'}</td></tr>
<tr><td>Date</td><td>${depDate}</td></tr>
<tr><td>Departure</td><td>${depTime}</td></tr>
<tr><td>Class</td><td>${(b as any).cabinClass || 'Economy'}</td></tr>
<tr><td>Status</td><td>${(b.status || 'pending').replace('_', ' ').toUpperCase()}</td></tr>
</table>
<div class="footer"><p>This is an electronic ticket. Please present this at check-in along with valid photo identification.</p><p>© ${new Date().getFullYear()} DeltaBlue Jet Air. All rights reserved.</p></div>
</body></html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ETicket-${b.pnr || 'booking'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-navy-400 text-xs font-black uppercase tracking-[0.3em]">Loading Trips</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-navy-950 tracking-tight uppercase">My Trips</h1>
                    <p className="text-sm font-bold text-navy-400 mt-1">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
                </div>
                <Link to={ROUTES.FLIGHT_SEARCH} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity no-underline shrink-0">
                    <span className="material-symbols-outlined text-sm">add</span>
                    Book New Flight
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-navy-50 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setTab('upcoming')}
                    className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                        ${tab === 'upcoming' ? 'bg-white text-primary shadow-sm' : 'text-navy-400 hover:text-navy-700'}`}
                >
                    Upcoming ({upcoming.length})
                </button>
                <button
                    onClick={() => setTab('past')}
                    className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                        ${tab === 'past' ? 'bg-white text-primary shadow-sm' : 'text-navy-400 hover:text-navy-700'}`}
                >
                    Past ({past.length})
                </button>
            </div>

            {/* Trip Cards */}
            {displayList.length === 0 ? (
                <div className="bg-white rounded-2xl border border-navy-100 p-12 text-center space-y-4">
                    <div className="size-16 rounded-2xl bg-navy-50 flex items-center justify-center mx-auto">
                        <span className="material-symbols-outlined text-navy-200 text-3xl">
                            {tab === 'upcoming' ? 'flight_takeoff' : 'history'}
                        </span>
                    </div>
                    <p className="text-sm font-black text-navy-400 uppercase tracking-wider">
                        {tab === 'upcoming' ? 'No Upcoming Trips' : 'No Past Trips'}
                    </p>
                    <p className="text-[10px] font-bold text-navy-300">
                        {tab === 'upcoming'
                            ? 'Ready to explore? Search for flights and book your next adventure.'
                            : 'Your completed trips will appear here.'}
                    </p>
                    {tab === 'upcoming' && (
                        <Link to={ROUTES.FLIGHT_SEARCH} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity no-underline">
                            Search Flights
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {displayList.map((b, i) => (
                        <div key={b.id || i} className="bg-white rounded-2xl border border-navy-100 p-6 hover:border-primary/20 hover:shadow-md transition-all">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-6">

                                {/* Route */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="text-center shrink-0">
                                        <p className="text-2xl font-black text-navy-950 tracking-tighter">{b.origin?.code || '—'}</p>
                                        <p className="text-[9px] font-bold text-navy-400 uppercase tracking-wider truncate max-w-[80px]">{b.origin?.city || ''}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="h-px flex-1 bg-navy-100" />
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="material-symbols-outlined text-primary text-sm">flight</span>
                                            <span className="text-[9px] font-black text-navy-300">{b.flightNumber || ''}</span>
                                        </div>
                                        <div className="h-px flex-1 bg-navy-100" />
                                    </div>
                                    <div className="text-center shrink-0">
                                        <p className="text-2xl font-black text-navy-950 tracking-tighter">{b.destination?.code || '—'}</p>
                                        <p className="text-[9px] font-bold text-navy-400 uppercase tracking-wider truncate max-w-[80px]">{b.destination?.city || ''}</p>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="flex items-center gap-6 shrink-0">
                                    <div className="hidden sm:block">
                                        <p className="text-[9px] font-black text-navy-400 uppercase tracking-wider">Date</p>
                                        <p className="text-xs font-black text-navy-900">{formatDate(b.departureTime)}</p>
                                    </div>
                                    <div className="hidden sm:block">
                                        <p className="text-[9px] font-black text-navy-400 uppercase tracking-wider">Departs</p>
                                        <p className="text-xs font-black text-navy-900">{formatTime(b.departureTime)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-navy-400 uppercase tracking-wider">PNR</p>
                                        <p className="text-sm font-black text-navy-950 font-mono">{b.pnr || '—'}</p>
                                    </div>
                                    <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${statusBadge(b.status)}`}>
                                        {b.status?.replace('_', ' ') || 'pending'}
                                    </span>
                                </div>

                                {/* Actions */}
                                {tab === 'upcoming' && (
                                    <div className="flex gap-2 shrink-0">
                                        <Link to={b.pnr ? `/manage-booking/${b.pnr}` : ROUTES.MANAGE_BOOKING} className="h-9 px-4 rounded-lg bg-primary text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:opacity-90 transition-opacity no-underline">
                                            Manage
                                        </Link>
                                        <Link to={ROUTES.CHECKIN} className="h-9 px-4 rounded-lg border-2 border-primary text-primary text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-primary/5 transition-colors no-underline">
                                            Check In
                                        </Link>
                                        <button onClick={() => downloadETicket(b)} className="h-9 px-3 rounded-lg border-2 border-navy-100 text-navy-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:border-primary hover:text-primary transition-all" title="Download E-Ticket">
                                            <span className="material-symbols-outlined text-sm">download</span>
                                        </button>
                                    </div>
                                )}
                                {tab === 'past' && (
                                    <div className="flex gap-2 shrink-0">
                                        <Link to={ROUTES.FLIGHT_SEARCH} className="h-9 px-4 rounded-lg border-2 border-navy-100 text-navy-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:border-primary hover:text-primary transition-all no-underline">
                                            Rebook
                                        </Link>
                                        <button onClick={() => downloadETicket(b)} className="h-9 px-3 rounded-lg border-2 border-navy-100 text-navy-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:border-primary hover:text-primary transition-all" title="Download Receipt">
                                            <span className="material-symbols-outlined text-sm">receipt_long</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyTrips;
