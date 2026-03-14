
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../config/routes';
import { BRAND } from '../../config/brand';
import { getOrCreateCustomer, getBookingHistory } from '../../services/customerService';
import { getLoyaltyStatus, getTierInfo, getNextTierInfo, TIER_THRESHOLDS } from '../../services/loyaltyService';
import type { CustomerDoc, BookingDoc, LoyaltyDoc } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';

/**
 * MyDashboard — Passenger home after login/registration.
 * Shows welcome hero, profile completion, quick actions,
 * upcoming trip, and loyalty widget.
 */
const MyDashboard: React.FC = () => {
    const { user } = useAuth();
    const addToast = useToastStore(s => s.addToast);

    const [customer, setCustomer] = useState<CustomerDoc | null>(null);
    const [bookings, setBookings] = useState<BookingDoc[]>([]);
    const [loyalty, setLoyalty] = useState<LoyaltyDoc | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const [cust, bkgs] = await Promise.all([
                    getOrCreateCustomer(user.uid, user.email || '', user.displayName || ''),
                    getBookingHistory(user.uid, 5),
                ]);
                setCustomer(cust);
                setBookings(bkgs);

                try {
                    const loy = await getLoyaltyStatus(user.uid);
                    setLoyalty(loy);
                } catch { /* no loyalty record yet */ }
            } catch {
                addToast('Failed to load dashboard data', 'error');
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    // ── Profile completion ─────────────────────────────────
    const profileFields = useMemo(() => {
        if (!customer) return { completed: 0, total: 1 };
        const checks = [
            !!customer.displayName,
            !!customer.email,
            !!customer.phone,
            !!customer.dateOfBirth,
            !!customer.nationality,
            !!customer.documentNumber,
        ];
        return { completed: checks.filter(Boolean).length, total: checks.length };
    }, [customer]);
    const profilePct = Math.round((profileFields.completed / profileFields.total) * 100);

    // ── Upcoming trip ──────────────────────────────────────
    const upcomingTrip = useMemo(() => {
        const now = new Date();
        return bookings.find(b => {
            try {
                const dep = b.departureTime?.toDate ? b.departureTime.toDate() : new Date(b.departureTime as any);
                return dep > now && b.status !== 'cancelled';
            } catch { return false; }
        });
    }, [bookings]);

    // ── Loyalty helpers ────────────────────────────────────
    const currentTier = loyalty?.tier || 'blue';
    const tier = getTierInfo(currentTier);
    const nextTierResult = loyalty ? getNextTierInfo(currentTier, loyalty.lifetimePoints) : getNextTierInfo('blue', 0);
    const pointsBalance = loyalty?.totalPoints || 0;
    const tierProgress = useMemo(() => {
        if (!loyalty || !nextTierResult) return 0;
        const currentThreshold = TIER_THRESHOLDS.find(t => t.tier === currentTier)?.minPoints || 0;
        const nextThreshold = TIER_THRESHOLDS.find(t => t.tier === nextTierResult.nextTier.toLowerCase())?.minPoints;
        if (!nextThreshold) return 100;
        const range = nextThreshold - currentThreshold;
        return range > 0 ? Math.min(100, Math.round(((loyalty.lifetimePoints - currentThreshold) / range) * 100)) : 100;
    }, [loyalty, currentTier, nextTierResult]);

    const firstName = user?.displayName?.split(' ')[0] || 'Traveler';

    // ── Quick Actions ──────────────────────────────────────
    const quickActions = [
        { label: 'Book a Flight', icon: 'flight_takeoff', route: ROUTES.FLIGHT_SEARCH, color: 'bg-primary' },
        { label: 'Manage Booking', icon: 'confirmation_number', route: ROUTES.MANAGE_BOOKING, color: 'bg-emerald-500' },
        { label: 'Online Check-in', icon: 'check_circle', route: ROUTES.CHECKIN, color: 'bg-amber-500' },
        { label: 'Flight Status', icon: 'radar', route: ROUTES.FLIGHT_TRACKER, color: 'bg-violet-500' },
    ];

    // ── Helper to format Timestamp ─────────────────────────
    const formatDate = (ts: any, opts?: Intl.DateTimeFormatOptions) => {
        try {
            const d = ts?.toDate ? ts.toDate() : new Date(ts);
            return d.toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric' });
        } catch { return '—'; }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-navy-400 text-xs font-black uppercase tracking-[0.3em]">Loading Dashboard</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* ═══ Welcome Hero ═══════════════════════════════════ */}
            <div className="bg-gradient-to-br from-primary via-primary to-blue-700 rounded-3xl p-8 lg:p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-white/60 text-3xl">waving_hand</span>
                        <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.3em]">Welcome Back</p>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-none mb-3">{firstName}</h1>
                    <p className="text-white/70 text-sm font-bold max-w-lg leading-relaxed">
                        Your {BRAND.loyaltyProgram} portal — manage trips, track points, and explore new destinations.
                    </p>
                    <div className="flex items-center gap-4 mt-6 flex-wrap">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest">
                            <span className="material-symbols-outlined text-sm">stars</span>
                            {tier.label} Member
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest">
                            <span className="material-symbols-outlined text-sm">toll</span>
                            {pointsBalance.toLocaleString()} Points
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ Profile Completion Banner ══════════════════════ */}
            {profilePct < 100 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative size-14 shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#fde68a" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f59e0b" strokeWidth="3"
                                strokeDasharray={`${profilePct} ${100 - profilePct}`} strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-amber-700">{profilePct}%</span>
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                        <p className="text-xs font-black text-amber-900 uppercase tracking-wider">Complete Your Profile</p>
                        <p className="text-[10px] font-bold text-amber-600 mt-0.5">Add travel documents and preferences to speed up future bookings.</p>
                    </div>
                    <Link to={ROUTES.MY_PROFILE} className="shrink-0 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-colors no-underline">
                        Complete Profile
                    </Link>
                </div>
            )}

            {/* ═══ Quick Actions Grid ═══════════════════════════ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map(action => (
                    <Link
                        key={action.label}
                        to={action.route}
                        className="group bg-white rounded-2xl border border-navy-100 p-5 flex flex-col items-center gap-3 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all no-underline"
                    >
                        <div className={`size-12 rounded-2xl ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                            <span className="material-symbols-outlined text-white text-xl font-black">{action.icon}</span>
                        </div>
                        <span className="text-[10px] font-black text-navy-700 uppercase tracking-widest text-center">{action.label}</span>
                    </Link>
                ))}
            </div>

            {/* ═══ Two-Column: Upcoming Trip + Loyalty ═══════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── Upcoming Trip ──────────────────────────── */}
                <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-navy-500 uppercase tracking-[0.25em] flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-primary">flight</span>
                            Upcoming Trip
                        </p>
                        <Link to={ROUTES.MY_TRIPS} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline no-underline">View All</Link>
                    </div>

                    {upcomingTrip ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <p className="text-3xl font-black text-navy-950 tracking-tighter">{upcomingTrip.origin?.code || '—'}</p>
                                    <p className="text-[9px] font-bold text-navy-400 uppercase tracking-wider">{upcomingTrip.origin?.city || 'Origin'}</p>
                                </div>
                                <div className="flex-1 flex items-center gap-2">
                                    <div className="h-px flex-1 bg-navy-100" />
                                    <span className="material-symbols-outlined text-primary text-lg rotate-90 sm:rotate-0">flight</span>
                                    <div className="h-px flex-1 bg-navy-100" />
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-black text-navy-950 tracking-tighter">{upcomingTrip.destination?.code || '—'}</p>
                                    <p className="text-[9px] font-bold text-navy-400 uppercase tracking-wider">{upcomingTrip.destination?.city || 'Destination'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 bg-navy-50/50 rounded-xl p-4">
                                <div>
                                    <p className="text-[9px] font-black text-navy-400 uppercase tracking-wider">PNR</p>
                                    <p className="text-sm font-black text-navy-950 font-mono">{upcomingTrip.pnr || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-navy-400 uppercase tracking-wider">Date</p>
                                    <p className="text-sm font-black text-navy-950">{formatDate(upcomingTrip.departureTime)}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-navy-400 uppercase tracking-wider">Status</p>
                                    <p className="text-sm font-black text-emerald-600 uppercase">{upcomingTrip.status || 'Confirmed'}</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Link to={ROUTES.MANAGE_BOOKING} className="flex-1 h-10 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-opacity no-underline">
                                    Manage
                                </Link>
                                <Link to={ROUTES.CHECKIN} className="flex-1 h-10 rounded-xl border-2 border-primary text-primary text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors no-underline">
                                    Check In
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 space-y-4">
                            <div className="size-16 rounded-2xl bg-navy-50 flex items-center justify-center mx-auto">
                                <span className="material-symbols-outlined text-navy-200 text-3xl">flight_takeoff</span>
                            </div>
                            <div>
                                <p className="text-sm font-black text-navy-400 uppercase tracking-wider">No Upcoming Trips</p>
                                <p className="text-[10px] font-bold text-navy-300 mt-1">Ready to explore? Book your next adventure.</p>
                            </div>
                            <Link to={ROUTES.FLIGHT_SEARCH} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity no-underline">
                                <span className="material-symbols-outlined text-sm">search</span>
                                Search Flights
                            </Link>
                        </div>
                    )}
                </div>

                {/* ── Loyalty Widget ─────────────────────────── */}
                <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-navy-500 uppercase tracking-[0.25em] flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-primary">stars</span>
                            {BRAND.loyaltyProgram}
                        </p>
                        <Link to={ROUTES.LOYALTY} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline no-underline">Details</Link>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="size-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shadow-inner">
                            <span className="material-symbols-outlined text-primary text-3xl font-black">workspace_premium</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-navy-950 tracking-tight capitalize">{tier.label}</p>
                            <p className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">Current Tier</p>
                        </div>
                    </div>

                    <div className="bg-navy-50/50 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-navy-400 uppercase tracking-wider">Available Points</p>
                            <p className="text-3xl font-black text-navy-950 tracking-tight">{pointsBalance.toLocaleString()}</p>
                        </div>
                        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-xl">toll</span>
                        </div>
                    </div>

                    {nextTierResult && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-[9px] font-black text-navy-400 uppercase tracking-wider">Progress to {nextTierResult.nextTier}</p>
                                <p className="text-[9px] font-black text-primary tracking-wider">{tierProgress}%</p>
                            </div>
                            <div className="h-2 rounded-full bg-navy-100 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-1000"
                                    style={{ width: `${tierProgress}%` }}
                                />
                            </div>
                            <p className="text-[9px] font-bold text-navy-300">{nextTierResult.pointsNeeded.toLocaleString()} points to {nextTierResult.nextTier}</p>
                        </div>
                    )}

                    <Link to={ROUTES.LOYALTY} className="w-full h-10 rounded-xl border-2 border-navy-100 text-navy-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-all no-underline">
                        View Points History
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                </div>
            </div>

            {/* ═══ Recent Activity ═══════════════════════════════ */}
            {bookings.length > 0 && (
                <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-4">
                    <p className="text-[10px] font-black text-navy-500 uppercase tracking-[0.25em] flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-primary">history</span>
                        Recent Activity
                    </p>
                    <div className="divide-y divide-navy-50">
                        {bookings.slice(0, 5).map((b, i) => (
                            <div key={b.id || i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                <div className="flex items-center gap-4">
                                    <div className="size-9 rounded-xl bg-navy-50 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-navy-400 text-sm">flight</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-navy-900">{b.origin?.code || '—'} → {b.destination?.code || '—'}</p>
                                        <p className="text-[9px] font-bold text-navy-400">{formatDate(b.departureTime, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider
                                    ${b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                                        b.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                                            b.status === 'checked_in' ? 'bg-blue-50 text-blue-700' :
                                                b.status === 'completed' ? 'bg-navy-50 text-navy-600' :
                                                    'bg-navy-50 text-navy-500'}`}>
                                    {b.status || 'pending'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyDashboard;
