
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ROUTES } from '../../config/routes';
import { useToastStore } from '../../stores/toastStore';
import {
    getBookingWithPassengers,
    cancelBooking,
    sendBookingConfirmation,
} from '../../services/booking';
import type { BookingDoc, PassengerDoc } from '../../types/firestore';

/* ── Helpers ─────────────────────────────────────────────────── */
const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
    confirmed: { label: 'Confirmed', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
    checked_in: { label: 'Checked In', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
    boarded: { label: 'Boarded', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
    completed: { label: 'Completed', color: 'text-navy-700', bg: 'bg-navy-50 border-navy-100' },
    cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50 border-red-100' },
    refunded: { label: 'Refunded', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-100' },
};

const FARE_LABELS: Record<string, string> = {
    economy: 'Economy', Y: 'Economy',
    premium_economy: 'Premium Economy', W: 'Premium Economy',
    business: 'Business', J: 'Business',
    first: 'First Class', F: 'First Class',
};

function formatDate(ts: any): string {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(ts: any): string {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatMoney(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

/* ══════════════════════════════════════════════════════════════
   Booking Detail — Admin View
   ══════════════════════════════════════════════════════════════ */
const BookingDetailAdmin: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const addToast = useToastStore(s => s.addToast);

    const [booking, setBooking] = useState<BookingDoc | null>(null);
    const [passengers, setPassengers] = useState<PassengerDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [resending, setResending] = useState(false);

    /* ── Load booking data ──────────────────────────────────── */
    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const result = await getBookingWithPassengers(id);
            if (!result) {
                addToast('Booking not found', 'error');
                navigate(ROUTES.BOOKINGS);
                return;
            }
            setBooking(result.booking);
            setPassengers(result.passengers);
        } catch (err) {
            console.error('Failed to load booking:', err);
            addToast('Failed to load booking', 'error');
        } finally {
            setLoading(false);
        }
    }, [id, navigate, addToast]);

    useEffect(() => { load(); }, [load]);

    /* ── Cancel Booking ─────────────────────────────────────── */
    const handleCancel = useCallback(async () => {
        if (!booking || !window.confirm(`Cancel booking ${booking.pnr}? This will release the reserved seats.`)) return;
        setCancelling(true);
        try {
            await cancelBooking(booking.id);
            addToast(`Booking ${booking.pnr} cancelled`, 'success');
            await load();
        } catch (err: any) {
            addToast(err.message || 'Failed to cancel', 'error');
        } finally {
            setCancelling(false);
        }
    }, [booking, addToast, load]);

    /* ── Resend Confirmation Email ──────────────────────────── */
    const handleResendEmail = useCallback(async () => {
        if (!booking) return;
        setResending(true);
        try {
            await sendBookingConfirmation({ bookingId: booking.id, email: booking.contactEmail });
            addToast(`Confirmation sent to ${booking.contactEmail}`, 'success');
        } catch (err: any) {
            addToast('Failed to send confirmation email', 'error');
        } finally {
            setResending(false);
        }
    }, [booking, addToast]);

    /* ── Loading State ──────────────────────────────────────── */
    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
            </div>
        );
    }

    if (!booking) return null;

    const st = STATUS_STYLE[booking.status] ?? { label: booking.status, color: 'text-navy-600', bg: 'bg-navy-50 border-navy-100' };
    const isCancellable = ['pending', 'confirmed'].includes(booking.status);

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Back + Header */}
            <div>
                <button
                    onClick={() => navigate(ROUTES.BOOKINGS)}
                    className="flex items-center gap-1 text-xs font-black text-navy-400 uppercase tracking-widest hover:text-primary transition-colors mb-4"
                >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Back to Bookings
                </button>
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-navy-950 tracking-tighter">
                            {booking.pnr}
                        </h1>
                        <p className="text-navy-500 font-medium">
                            Booking #{booking.id.slice(0, 8)} · Created {formatDate(booking.createdAt)}
                        </p>
                    </div>
                    <span className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border ${st.bg} ${st.color}`}>
                        {st.label}
                    </span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Flight', value: booking.flightNumber, icon: 'flight' },
                    { label: 'Route', value: `${booking.origin?.code ?? '—'} → ${booking.destination?.code ?? '—'}`, icon: 'route' },
                    { label: 'Total', value: formatMoney(booking.totalAmount, booking.currency), icon: 'payments' },
                    { label: 'Passengers', value: String(booking.passengerCount), icon: 'group' },
                ].map(card => (
                    <div key={card.label} className="bg-white rounded-[2rem] border border-navy-100 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-primary text-lg">{card.icon}</span>
                            <span className="text-[9px] font-black text-navy-400 uppercase tracking-widest">{card.label}</span>
                        </div>
                        <p className="text-xl font-black text-navy-950 tracking-tight">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Flight + Passengers */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Flight Details */}
                    <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-4 bg-navy-50/50 border-b border-navy-100">
                            <h3 className="font-black text-navy-900 uppercase text-xs tracking-wider flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">connecting_airports</span>
                                Flight Details
                            </h3>
                        </div>
                        <div className="p-8">
                            <div className="flex items-center justify-between">
                                <div className="text-center space-y-1">
                                    <p className="text-3xl font-black text-navy-950 tracking-tighter">{booking.origin?.code ?? '—'}</p>
                                    <p className="text-xs font-bold text-navy-400">{booking.origin?.city ?? ''}</p>
                                    <p className="text-sm font-black text-navy-700">{formatTime(booking.departureTime)}</p>
                                </div>
                                <div className="flex-1 px-8 flex flex-col items-center gap-2">
                                    <div className="w-full h-px bg-navy-200 relative">
                                        <span className="material-symbols-outlined absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary bg-white px-2">
                                            flight
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{booking.flightNumber}</p>
                                    <p className="text-[9px] font-bold text-navy-300">{formatDate(booking.departureTime)}</p>
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-3xl font-black text-navy-950 tracking-tighter">{booking.destination?.code ?? '—'}</p>
                                    <p className="text-xs font-bold text-navy-400">{booking.destination?.city ?? ''}</p>
                                    <p className="text-sm font-black text-navy-700">{formatTime(booking.arrivalTime)}</p>
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-navy-100 grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Class</p>
                                    <p className="text-sm font-bold text-navy-900">{FARE_LABELS[booking.fareClass] ?? booking.fareClass}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Trip Type</p>
                                    <p className="text-sm font-bold text-navy-900">{booking.tripType?.replace('-', ' ') ?? 'One-way'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Currency</p>
                                    <p className="text-sm font-bold text-navy-900">{booking.currency}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Multi-city Segments */}
                    {booking.segments && booking.segments.length > 0 && (
                        <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-4 bg-navy-50/50 border-b border-navy-100">
                                <h3 className="font-black text-navy-900 uppercase text-xs tracking-wider flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">airline_stops</span>
                                    Multi-City Segments ({booking.segments.length})
                                </h3>
                            </div>
                            <div className="divide-y divide-navy-50">
                                {booking.segments.map((seg, idx) => (
                                    <div key={idx} className="px-8 py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className="size-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-black">{idx + 1}</span>
                                            <div>
                                                <p className="text-sm font-bold text-navy-900">{seg.flightNumber}</p>
                                                <p className="text-[10px] text-navy-400">{seg.origin?.code} → {seg.destination?.code} · {formatDate(seg.departureTime)}</p>
                                            </div>
                                        </div>
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold border border-blue-100">
                                            {FARE_LABELS[seg.fareClass] ?? seg.fareClass}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Passengers */}
                    <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-4 bg-navy-50/50 border-b border-navy-100">
                            <h3 className="font-black text-navy-900 uppercase text-xs tracking-wider flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">group</span>
                                Passengers ({passengers.length})
                            </h3>
                        </div>
                        {passengers.length === 0 ? (
                            <div className="p-8 text-center text-sm text-navy-300 font-bold">No passenger records found</div>
                        ) : (
                            <div className="divide-y divide-navy-50">
                                {passengers.map((pax, idx) => (
                                    <div key={pax.id} className="px-8 py-5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className="size-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black">
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <p className="text-sm font-black text-navy-900">{pax.firstName} {pax.lastName}</p>
                                                <p className="text-[10px] font-bold text-navy-400 tracking-widest">
                                                    {pax.documentType === 'passport' ? 'Passport' : 'National ID'}: {pax.documentNumber}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {pax.seatNumber && (
                                                <span className="px-3 py-1 bg-navy-50 text-navy-700 rounded-lg text-xs font-bold border border-navy-100">
                                                    Seat {pax.seatNumber}
                                                </span>
                                            )}
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${pax.checkedIn
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-navy-50 text-navy-400 border-navy-100'
                                                }`}>
                                                {pax.checkedIn ? 'Checked In' : 'Not Checked In'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Contact + Actions */}
                <div className="space-y-6">
                    {/* Contact Info */}
                    <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm p-8 space-y-5">
                        <h3 className="font-black text-navy-900 uppercase text-xs tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">contact_mail</span>
                            Contact
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Email</p>
                                <p className="text-sm font-bold text-navy-900 break-all">{booking.contactEmail}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Phone</p>
                                <p className="text-sm font-bold text-navy-900">{booking.contactPhone || '—'}</p>
                            </div>
                            {booking.paymentIntentId && (
                                <div>
                                    <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Stripe Payment</p>
                                    <p className="text-xs font-mono text-navy-600 break-all">{booking.paymentIntentId}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm p-8 space-y-5">
                        <h3 className="font-black text-navy-900 uppercase text-xs tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">timeline</span>
                            Timeline
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="size-2 bg-emerald-500 rounded-full" />
                                <span className="text-xs text-navy-400">Created</span>
                                <span className="text-xs font-bold text-navy-700 ml-auto">{formatDate(booking.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="size-2 bg-blue-500 rounded-full" />
                                <span className="text-xs text-navy-400">Last Updated</span>
                                <span className="text-xs font-bold text-navy-700 ml-auto">{formatDate(booking.updatedAt)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="size-2 bg-primary rounded-full" />
                                <span className="text-xs text-navy-400">Departure</span>
                                <span className="text-xs font-bold text-navy-700 ml-auto">{formatDate(booking.departureTime)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm p-8 space-y-4">
                        <h3 className="font-black text-navy-900 uppercase text-xs tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">settings</span>
                            Actions
                        </h3>
                        <button
                            onClick={handleResendEmail}
                            disabled={resending}
                            className="w-full px-6 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-base">email</span>
                            {resending ? 'Sending...' : 'Resend Confirmation'}
                        </button>
                        <button
                            onClick={() => navigate(ROUTES.TICKET_REISSUE)}
                            className="w-full px-6 py-3 bg-white border-2 border-navy-100 text-navy-700 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-navy-50 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base">receipt_long</span>
                            Ticket Reissue
                        </button>
                        {isCancellable && (
                            <button
                                onClick={handleCancel}
                                disabled={cancelling}
                                className="w-full px-6 py-3 bg-red-50 border-2 border-red-100 text-red-700 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-base">cancel</span>
                                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingDetailAdmin;
