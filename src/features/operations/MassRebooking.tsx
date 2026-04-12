import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';
import { getFlights } from '../../services/firestore';
import {
    findAlternativeFlights, getAffectedBookings, autoRebookPassenger,
    getRebookingsByFlight, issueIROPVouchers, calculateCompensation,
    type AlternativeFlight, type RebookingRecord,
} from '../../services/iropService';
import { sendBatchIROPNotification, type BatchRecipient } from '../../services/iropNotificationService';
import type { FlightDoc, BookingDoc } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';

const MassRebooking: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [cancelledFlights, setCancelledFlights] = useState<FlightDoc[]>([]);
    const [selectedFlight, setSelectedFlight] = useState<FlightDoc | null>(null);
    const [affectedBookings, setAffectedBookings] = useState<(BookingDoc & { id: string, passengers?: any[] })[]>([]);
    const [alternatives, setAlternatives] = useState<AlternativeFlight[]>([]);
    const [rebookings, setRebookings] = useState<RebookingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState<'select' | 'rebook' | 'status'>('select');
    const [searchQuery, setSearchQuery] = useState('');

    // Load cancelled/severely-delayed flights
    const loadFlights = useCallback(async () => {
        setLoading(true);
        try {
            const flights = await getFlights({ maxResults: 200 });
            const disrupted = flights.filter(f =>
                f.status === 'cancelled' || f.status === 'diverted' ||
                (f.delayMinutes && f.delayMinutes > 120)
            );
            setCancelledFlights(disrupted);
        } catch (err) {
            addToast('Failed to load flights', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => { loadFlights(); }, [loadFlights]);

    // When a flight is selected, load its bookings and alternatives
    const handleSelectFlight = async (flight: FlightDoc) => {
        setSelectedFlight(flight);
        setActiveTab('rebook');
        setProcessing(true);
        try {
            const [bookings, alts, existing] = await Promise.all([
                getAffectedBookings(flight.id),
                findAlternativeFlights(flight),
                getRebookingsByFlight(flight.id),
            ]);
            setAffectedBookings(bookings);
            setAlternatives(alts);
            setRebookings(existing);
        } catch (err) {
            addToast('Failed to load flight details', 'error');
        } finally {
            setProcessing(false);
        }
    };

    // Auto-rebook all passengers
    const handleMassRebook = async () => {
        if (!selectedFlight || alternatives.length === 0) return;
        setProcessing(true);
        try {
            const newRebookings: RebookingRecord[] = [];
            for (const booking of affectedBookings) {
                // Skip already rebooked
                if (rebookings.some(r => r.bookingId === booking.id)) continue;

                const record = await autoRebookPassenger(
                    booking,
                    selectedFlight,
                    booking.passengers?.[0]?.firstName
                        ? `${booking.passengers[0].firstName} ${booking.passengers[0].lastName}`
                        : 'Passenger',
                    alternatives,
                );
                newRebookings.push(record);
            }

            // Issue vouchers for long delays
            if (selectedFlight.delayMinutes && selectedFlight.delayMinutes >= 120) {
                for (const booking of affectedBookings) {
                    await issueIROPVouchers(
                        booking.id,
                        booking.userId || '',
                        selectedFlight.delayMinutes || 0,
                    );
                }
            }

            // Send batch notifications
            const recipients: BatchRecipient[] = affectedBookings.map(b => ({
                email: b.contactEmail || b.passengers?.[0]?.email || '',
                name: b.passengers?.[0]?.firstName || 'Passenger',
            })).filter(r => r.email);

            if (recipients.length > 0) {
                const bestAlt = alternatives.find(a => a.seatAvailable);
                await sendBatchIROPNotification(
                    selectedFlight.status === 'cancelled' ? 'cancellation' : 'delay',
                    selectedFlight.flightNumber,
                    recipients,
                    {
                        rebookingInfo: bestAlt
                            ? `You have been rebooked on flight ${bestAlt.flight.flightNumber}.`
                            : 'Our team is working to find you an alternative. We will contact you shortly.',
                        originalDate: selectedFlight.departureTime?.toDate?.()?.toLocaleDateString() || '',
                    },
                );
            }

            setRebookings([...rebookings, ...newRebookings]);
            addToast(`Successfully processed ${newRebookings.length} rebookings`, 'success');
            setActiveTab('status');
        } catch (err) {
            addToast('Rebooking failed — please try again', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const fmtTime = (ts: any) => ts?.toDate?.()?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) ?? '--';
    const fmtDate = (ts: any) => ts?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? '--';

    const filteredFlights = cancelledFlights.filter(f => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return f.flightNumber.toLowerCase().includes(q) ||
            f.origin.code.toLowerCase().includes(q) ||
            f.destination.code.toLowerCase().includes(q);
    });

    const statusColor = (s: string) => {
        const colors: Record<string, string> = {
            auto_rebooked: 'text-emerald-600 bg-emerald-50',
            manual_required: 'text-amber-600 bg-amber-50',
            confirmed: 'text-primary bg-primary/10',
            pending: 'text-navy-500 bg-navy-50',
            refused: 'text-red-600 bg-red-50',
        };
        return colors[s] || 'text-navy-500 bg-navy-50';
    };

    return (
        <div className="h-full flex flex-col p-8 overflow-hidden font-display">
            <div className="flex flex-col gap-4 mb-8 shrink-0">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
                    <Link to={ROUTES.DASHBOARD} className="hover:text-primary transition-colors">Operations</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-primary" aria-current="page">Mass Rebooking</span>
                </nav>
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Mass Rebooking</h1>
                        <p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">
                            IROP — Automated passenger rebooking for disrupted flights
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 mb-6 bg-navy-50/50 p-1 rounded-2xl w-fit">
                {(['select', 'rebook', 'status'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === tab ? 'bg-white text-primary shadow-md' : 'text-navy-400 hover:text-navy-600'
                        }`}>
                        {tab === 'select' ? '1. Select Flight' : tab === 'rebook' ? '2. Rebooking' : '3. Status'}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Tab: Select Disrupted Flight */}
                {activeTab === 'select' && (
                    <div className="space-y-4">
                        <input type="text" placeholder="Search flight number or route..."
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="w-full max-w-md px-4 py-3 rounded-xl bg-white border border-navy-100 text-xs font-bold text-navy-800 placeholder:text-navy-300 focus:ring-2 focus:ring-primary/20" />

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin size-6 border-2 border-navy-200 border-t-primary rounded-full" />
                            </div>
                        ) : filteredFlights.length === 0 ? (
                            <div className="text-center py-20">
                                <span className="material-symbols-outlined text-4xl text-navy-200 mb-2">check_circle</span>
                                <p className="text-xs font-black text-navy-300 uppercase tracking-widest">No disrupted flights found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredFlights.map(f => (
                                    <button key={f.id} onClick={() => handleSelectFlight(f)}
                                        className={`text-left p-5 rounded-2xl border-2 transition-all hover:shadow-lg ${
                                            selectedFlight?.id === f.id ? 'border-primary bg-primary/5' : 'border-navy-50 bg-white hover:border-navy-100'
                                        }`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="font-black text-lg text-navy-950 tracking-tighter uppercase">{f.flightNumber}</span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                                                f.status === 'cancelled' ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'
                                            }`}>{f.status}</span>
                                        </div>
                                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.2em] mb-1">
                                            {f.origin.code} → {f.destination.code}
                                        </p>
                                        <p className="text-[10px] font-bold text-navy-300">{fmtDate(f.departureTime)} • {fmtTime(f.departureTime)}</p>
                                        {f.delayMinutes && f.delayMinutes > 0 && (
                                            <p className="text-[10px] font-black text-red-500 mt-1">Delayed {Math.round(f.delayMinutes / 60)}h {f.delayMinutes % 60}m</p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Rebooking */}
                {activeTab === 'rebook' && selectedFlight && (
                    <div className="space-y-6">
                        {/* Summary */}
                        <div className="bg-white rounded-2xl border border-navy-100 p-6 flex flex-wrap gap-6 items-center justify-between">
                            <div>
                                <p className="text-xs font-black text-navy-400 uppercase tracking-widest mb-1">Disrupted Flight</p>
                                <p className="text-2xl font-black text-navy-950 tracking-tighter">{selectedFlight.flightNumber}</p>
                                <p className="text-[10px] font-bold text-navy-300">
                                    {selectedFlight.origin.code} → {selectedFlight.destination.code} • {fmtDate(selectedFlight.departureTime)}
                                </p>
                            </div>
                            <div className="flex gap-6">
                                <div className="text-center">
                                    <p className="text-2xl font-black text-navy-950">{affectedBookings.length}</p>
                                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Affected Bookings</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-emerald-600">{alternatives.filter(a => a.seatAvailable).length}</p>
                                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Alt. Available</p>
                                </div>
                            </div>
                        </div>

                        {/* Alternatives */}
                        <div className="bg-white rounded-2xl border border-navy-100 overflow-hidden">
                            <div className="p-5 bg-navy-50/30 border-b border-navy-100">
                                <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest">Alternative Flights</h3>
                            </div>
                            <div className="p-4 space-y-3">
                                {processing ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin size-5 border-2 border-navy-200 border-t-primary rounded-full" />
                                    </div>
                                ) : alternatives.length === 0 ? (
                                    <p className="text-xs font-black text-navy-300 uppercase tracking-widest py-8 text-center">No alternative flights found in the next 48 hours</p>
                                ) : (
                                    alternatives.map((alt, i) => (
                                        <div key={alt.flight.id} className="flex items-center justify-between p-4 rounded-xl bg-navy-50/30 border border-navy-100">
                                            <div className="flex items-center gap-4">
                                                <span className={`size-8 rounded-lg flex items-center justify-center text-xs font-black ${
                                                    i === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-navy-50 text-navy-400'
                                                }`}>{i + 1}</span>
                                                <div>
                                                    <p className="font-black text-navy-950 tracking-tighter">{alt.flight.flightNumber}</p>
                                                    <p className="text-[10px] font-bold text-navy-400">{fmtDate(alt.flight.departureTime)} • {fmtTime(alt.flight.departureTime)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                                                    alt.seatAvailable ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
                                                }`}>{alt.seatAvailable ? 'Seats Available' : 'Full'}</span>
                                                <span className="text-[10px] font-bold text-navy-300">+{Math.round(alt.timeDiffMinutes / 60)}h</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Action */}
                        <button onClick={handleMassRebook} disabled={processing || alternatives.filter(a => a.seatAvailable).length === 0}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50">
                            {processing ? 'Processing Rebookings...' : `Auto-Rebook ${affectedBookings.length} Passengers →`}
                        </button>
                    </div>
                )}

                {/* Tab: Status */}
                {activeTab === 'status' && (
                    <div className="bg-white rounded-2xl border border-navy-100 overflow-hidden">
                        <div className="p-5 bg-navy-50/30 border-b border-navy-100 flex items-center justify-between">
                            <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest">Rebooking Status</h3>
                            <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{rebookings.length} Records</span>
                        </div>
                        {rebookings.length === 0 ? (
                            <div className="p-12 text-center">
                                <span className="material-symbols-outlined text-4xl text-navy-200 mb-2">assignment</span>
                                <p className="text-xs font-black text-navy-300 uppercase tracking-widest">No rebookings yet — select a flight and proceed</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-navy-100">
                                        {['Passenger', 'Original', 'Rebooked To', 'Status', 'Voucher'].map(h => (
                                            <th key={h} className="text-left px-5 py-3 text-[10px] font-black text-navy-400 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rebookings.map(r => (
                                        <tr key={r.id} className="border-b border-navy-50 hover:bg-navy-50/20 transition-colors">
                                            <td className="px-5 py-3 text-xs font-bold text-navy-800">{r.passengerName}</td>
                                            <td className="px-5 py-3 text-xs font-black text-navy-950 tracking-tighter">{r.originalFlightNumber}</td>
                                            <td className="px-5 py-3 text-xs font-black text-primary tracking-tighter">{r.newFlightNumber || '—'}</td>
                                            <td className="px-5 py-3">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${statusColor(r.status)}`}>
                                                    {r.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                {r.voucherIssued
                                                    ? <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                                                    : <span className="material-symbols-outlined text-navy-200 text-sm">remove</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MassRebooking;
