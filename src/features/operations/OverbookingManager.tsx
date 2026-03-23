import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';
import { getFlights } from '../../services/firestore';
import type { FlightDoc } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';

// ─── No-Show Model ─────────────────────────────────────────

interface OverbookingStats {
    routeKey: string;
    historicalNoShowRate: number;
    recommendedOverbookSeats: number;
    riskLevel: 'low' | 'medium' | 'high';
}

/** Simplified statistical no-show model per route */
function calculateOverbookingStats(flight: FlightDoc): OverbookingStats {
    const routeKey = `${flight.origin.code}-${flight.destination.code}`;
    const capacity = flight.aircraft?.capacity || 180;

    // Base no-show rates by route type (simplified)
    const isRegional = capacity <= 100;
    const baseRate = isRegional ? 0.03 : 0.06; // 3% regional, 6% long-haul

    // Adjust for fare class mix (business = lower no-show)
    const adjusted = baseRate * 0.95; // simplified

    const recommended = Math.round(capacity * adjusted);
    const maxOverbook = Math.round(capacity * 0.08); // never exceed 8% overbooking
    const overbookSeats = Math.min(recommended, maxOverbook);

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (adjusted > 0.06) riskLevel = 'high';
    else if (adjusted > 0.04) riskLevel = 'medium';

    return { routeKey, historicalNoShowRate: adjusted, recommendedOverbookSeats: overbookSeats, riskLevel };
}

// ─── Denied Boarding Types ─────────────────────────────────

type DeniedBoardingType = 'voluntary' | 'involuntary';
interface DeniedBoardingRecord {
    flightId: string;
    flightNumber: string;
    passengerName: string;
    type: DeniedBoardingType;
    compensationOffered: number;
    alternativeFlight: string;
    status: 'pending' | 'accepted' | 'rejected';
}

// ─── Component ─────────────────────────────────────────────

const OverbookingManager: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [flights, setFlights] = useState<FlightDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFlightId, setSelectedFlightId] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'dashboard' | 'denied_boarding'>('dashboard');
    const [dbRecords, setDbRecords] = useState<DeniedBoardingRecord[]>([]);
    const [voluntaryComp, setVoluntaryComp] = useState(300);
    const [searchQuery, setSearchQuery] = useState('');

    const loadFlights = useCallback(async () => {
        setLoading(true);
        try {
            const all = await getFlights({ maxResults: 200 });
            const upcoming = all.filter(f =>
                f.status !== 'cancelled' && f.status !== 'landed' && f.status !== 'arrived'
            );
            setFlights(upcoming);
        } catch (err) {
            addToast('Failed to load flights', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => { loadFlights(); }, [loadFlights]);

    const enrichedFlights = useMemo(() => {
        return flights.map(f => ({
            flight: f,
            stats: calculateOverbookingStats(f),
            loadFactor: f.aircraft?.capacity ? (f.bookedSeats || 0) / f.aircraft.capacity : 0,
            isOverbooked: f.aircraft?.capacity ? (f.bookedSeats || 0) > f.aircraft.capacity : false,
        }));
    }, [flights]);

    const filteredFlights = useMemo(() => {
        if (!searchQuery) return enrichedFlights;
        const q = searchQuery.toLowerCase();
        return enrichedFlights.filter(e =>
            e.flight.flightNumber.toLowerCase().includes(q) ||
            e.flight.origin.code.toLowerCase().includes(q) ||
            e.flight.destination.code.toLowerCase().includes(q)
        );
    }, [enrichedFlights, searchQuery]);

    const selectedData = enrichedFlights.find(e => e.flight.id === selectedFlightId);
    const overbooked = enrichedFlights.filter(e => e.isOverbooked);
    const atRisk = enrichedFlights.filter(e => e.loadFactor > 0.9 && !e.isOverbooked);

    const fmtTime = (ts: any) => ts?.toDate?.()?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) ?? '--';
    const fmtDate = (ts: any) => ts?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? '--';

    const handleVoluntarySOL = () => {
        if (!selectedData) return;
        const record: DeniedBoardingRecord = {
            flightId: selectedData.flight.id,
            flightNumber: selectedData.flight.flightNumber,
            passengerName: '(Volunteer sought)',
            type: 'voluntary',
            compensationOffered: voluntaryComp,
            alternativeFlight: 'Next available',
            status: 'pending',
        };
        setDbRecords([...dbRecords, record]);
        addToast(`Voluntary denied boarding initiated — $${voluntaryComp} offered`, 'info');
    };

    const riskColor = (r: string) => {
        if (r === 'high') return 'text-red-600 bg-red-50';
        if (r === 'medium') return 'text-amber-600 bg-amber-50';
        return 'text-emerald-600 bg-emerald-50';
    };

    return (
        <div className="h-full flex flex-col p-8 overflow-hidden font-display">
            <div className="flex flex-col gap-4 mb-8 shrink-0">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
                    <Link to={ROUTES.DASHBOARD} className="hover:text-primary transition-colors">Operations</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-primary" aria-current="page">Overbooking</span>
                </nav>
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Overbooking Manager</h1>
                        <p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">
                            Statistical no-show model & denied boarding workflow
                        </p>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
                {[
                    { label: 'Active Flights', val: String(flights.length), icon: 'flight', color: 'text-primary' },
                    { label: 'Overbooked', val: String(overbooked.length), icon: 'warning', color: 'text-red-500' },
                    { label: 'At Risk (>90%)', val: String(atRisk.length), icon: 'trending_up', color: 'text-amber-500' },
                    { label: 'DB Records', val: String(dbRecords.length), icon: 'assignment', color: 'text-navy-400' },
                ].map((s, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-navy-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{s.label}</p>
                            <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
                        </div>
                        <p className="text-3xl font-black text-navy-950 tracking-tighter leading-none">{s.val}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-navy-50/50 p-1 rounded-2xl w-fit shrink-0">
                {(['dashboard', 'denied_boarding'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === tab ? 'bg-white text-primary shadow-md' : 'text-navy-400 hover:text-navy-600'
                        }`}>
                        {tab === 'dashboard' ? 'Overbooking Dashboard' : 'Denied Boarding'}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === 'dashboard' && (
                    <div className="flex gap-6">
                        {/* Flight List */}
                        <div className="w-[380px] shrink-0 bg-white rounded-2xl border border-navy-100 overflow-hidden flex flex-col max-h-[60vh]">
                            <div className="p-4 border-b border-navy-100 bg-navy-50/30 shrink-0">
                                <input type="text" placeholder="Search flights..." value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-navy-100 text-xs font-bold text-navy-800 placeholder:text-navy-300 focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin size-5 border-2 border-navy-200 border-t-primary rounded-full" />
                                    </div>
                                ) : filteredFlights.map(({ flight, stats, loadFactor }) => (
                                    <button key={flight.id} onClick={() => setSelectedFlightId(flight.id)}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                            selectedFlightId === flight.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-navy-50/30'
                                        }`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-black text-navy-950 tracking-tighter">{flight.flightNumber}</span>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${riskColor(stats.riskLevel)}`}>
                                                {stats.riskLevel}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-navy-400">{flight.origin.code} → {flight.destination.code} • {fmtDate(flight.departureTime)}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-navy-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${loadFactor > 0.9 ? 'bg-red-500' : loadFactor > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${Math.min(100, loadFactor * 100)}%` }} />
                                            </div>
                                            <span className="text-[10px] font-black text-navy-500">{Math.round(loadFactor * 100)}%</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Detail Panel */}
                        <div className="flex-1">
                            {selectedData ? (
                                <div className="space-y-4">
                                    <div className="bg-white rounded-2xl border border-navy-100 p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-2xl font-black text-navy-950 tracking-tighter">{selectedData.flight.flightNumber}</p>
                                                <p className="text-[10px] font-bold text-navy-400">
                                                    {selectedData.flight.origin.code} → {selectedData.flight.destination.code} • {fmtDate(selectedData.flight.departureTime)} {fmtTime(selectedData.flight.departureTime)}
                                                </p>
                                            </div>
                                            <span className={`text-xs font-black uppercase px-3 py-1.5 rounded-full ${riskColor(selectedData.stats.riskLevel)}`}>
                                                {selectedData.stats.riskLevel} Risk
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            {[
                                                { label: 'Capacity', val: String(selectedData.flight.aircraft?.capacity || '--') },
                                                { label: 'Booked', val: String(selectedData.flight.bookedSeats || 0) },
                                                { label: 'Load Factor', val: `${Math.round(selectedData.loadFactor * 100)}%` },
                                                { label: 'No-Show Rate', val: `${(selectedData.stats.historicalNoShowRate * 100).toFixed(1)}%` },
                                            ].map(s => (
                                                <div key={s.label} className="bg-navy-50/50 p-4 rounded-xl">
                                                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mb-1">{s.label}</p>
                                                    <p className="text-xl font-black text-navy-950">{s.val}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-navy-100 p-6">
                                        <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest mb-4">Overbooking Recommendation</h3>
                                        <div className="flex items-center gap-6 p-4 bg-navy-50/30 rounded-xl">
                                            <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                <span className="text-2xl font-black">{selectedData.stats.recommendedOverbookSeats}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-navy-950">Recommended overbook: {selectedData.stats.recommendedOverbookSeats} seats</p>
                                                <p className="text-[10px] font-bold text-navy-400 mt-1">
                                                    Based on {(selectedData.stats.historicalNoShowRate * 100).toFixed(1)}% historical no-show rate for route {selectedData.stats.routeKey}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Voluntary DB action */}
                                    <div className="bg-white rounded-2xl border border-navy-100 p-6">
                                        <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest mb-4">Voluntary Denied Boarding</h3>
                                        <div className="flex items-end gap-4">
                                            <div className="flex-1">
                                                <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block mb-2">Compensation Offer ($)</label>
                                                <input type="number" value={voluntaryComp} onChange={e => setVoluntaryComp(Number(e.target.value))}
                                                    className="w-full px-4 py-3 rounded-xl bg-navy-50 border-none text-sm font-bold text-navy-800 focus:ring-2 focus:ring-primary/20" />
                                            </div>
                                            <button onClick={handleVoluntarySOL}
                                                className="px-8 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-colors shadow-lg shadow-primary/20">
                                                Seek Volunteers
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <span className="material-symbols-outlined text-5xl text-navy-200 mb-3">analytics</span>
                                        <p className="text-xs font-black text-navy-300 uppercase tracking-widest">Select a flight to view overbooking analysis</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'denied_boarding' && (
                    <div className="bg-white rounded-2xl border border-navy-100 overflow-hidden">
                        <div className="p-5 bg-navy-50/30 border-b border-navy-100 flex items-center justify-between">
                            <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest">Denied Boarding Records</h3>
                            <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{dbRecords.length} Records</span>
                        </div>
                        {dbRecords.length === 0 ? (
                            <div className="p-12 text-center">
                                <span className="material-symbols-outlined text-4xl text-navy-200 mb-2">assignment</span>
                                <p className="text-xs font-black text-navy-300 uppercase tracking-widest">No denied boarding records</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-navy-100">
                                        {['Flight', 'Passenger', 'Type', 'Compensation', 'Alternative', 'Status'].map(h => (
                                            <th key={h} className="text-left px-5 py-3 text-[10px] font-black text-navy-400 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {dbRecords.map((r, i) => (
                                        <tr key={i} className="border-b border-navy-50 hover:bg-navy-50/20 transition-colors">
                                            <td className="px-5 py-3 text-xs font-black text-navy-950 tracking-tighter">{r.flightNumber}</td>
                                            <td className="px-5 py-3 text-xs font-bold text-navy-800">{r.passengerName}</td>
                                            <td className="px-5 py-3">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                                                    r.type === 'voluntary' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
                                                }`}>{r.type}</span>
                                            </td>
                                            <td className="px-5 py-3 text-xs font-black text-navy-950">${r.compensationOffered}</td>
                                            <td className="px-5 py-3 text-xs font-bold text-navy-400">{r.alternativeFlight}</td>
                                            <td className="px-5 py-3">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{r.status}</span>
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

export default OverbookingManager;
