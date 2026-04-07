import React, { useState, useEffect, useMemo } from 'react';
import { useToastStore } from '../../stores/toastStore';
import {
    subscribeToCrew, isQualifiedForAircraft, hasValidMedical, hasLandingRecency,
    getExpiryStatus, ROLE_META,
    type CrewMember,
} from '../../services/crewService';
import { calculateFtlCounters, getFtlAlerts, type DutyLogEntry } from '../../utils/ftlEngine';
import { getDutyLogs } from '../../services/crewService';

// ─── Types ──────────────────────────────────────────────

type DisruptionReason = 'illness' | 'ftl_exceedance' | 'delay' | 'cancellation' | 'mechanical' | 'other';

interface Disruption {
    id: string;
    flightNumber: string;
    route: string;
    scheduledTime: string;
    aircraftType: string;
    affectedCrewId: string;
    affectedCrewName: string;
    affectedRole: string;
    reason: DisruptionReason;
    notes: string;
    status: 'open' | 'resolved';
    resolvedCrewId?: string;
    resolvedCrewName?: string;
    resolvedAt?: string;
}

const REASON_META: Record<DisruptionReason, { label: string; icon: string; color: string }> = {
    illness:         { label: 'Illness',         icon: 'sick',            color: 'text-red-600 bg-red-50' },
    ftl_exceedance:  { label: 'FTL Limit',       icon: 'timer_off',      color: 'text-orange-600 bg-orange-50' },
    delay:           { label: 'Flight Delay',    icon: 'schedule',       color: 'text-amber-600 bg-amber-50' },
    cancellation:    { label: 'Cancellation',    icon: 'cancel',         color: 'text-navy-600 bg-navy-50' },
    mechanical:      { label: 'Mechanical',      icon: 'engineering',    color: 'text-purple-600 bg-purple-50' },
    other:           { label: 'Other',           icon: 'help',           color: 'text-blue-600 bg-blue-50' },
};

const EMPTY_DISRUPTION: Omit<Disruption, 'id'> = {
    flightNumber: '', route: '', scheduledTime: '', aircraftType: '',
    affectedCrewId: '', affectedCrewName: '', affectedRole: '',
    reason: 'illness', notes: '', status: 'open',
};

const DisruptionManager: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [crew, setCrew] = useState<CrewMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [disruptions, setDisruptions] = useState<Disruption[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_DISRUPTION });
    const [showFinder, setShowFinder] = useState<Disruption | null>(null);
    const [crewFtlData, setCrewFtlData] = useState<Record<string, DutyLogEntry[]>>({});
    const [loadingFtl, setLoadingFtl] = useState(false);

    useEffect(() => {
        const unsub = subscribeToCrew(data => {
            setCrew(data.filter(c => c.status === 'active'));
            setLoading(false);
        });
        return unsub;
    }, []);

    // Simulated disruption management (in production, this would be Firestore-backed)
    const addDisruption = () => {
        if (!form.flightNumber || !form.affectedCrewId) {
            addToast('Flight number and affected crew required', 'warning');
            return;
        }
        const member = crew.find(c => c.id === form.affectedCrewId);
        const newDisruption: Disruption = {
            ...form,
            id: `DIS-${Date.now()}`,
            affectedCrewName: member?.name || form.affectedCrewId,
            affectedRole: member ? ROLE_META[member.role].label : '',
        };
        setDisruptions(prev => [newDisruption, ...prev]);
        setForm({ ...EMPTY_DISRUPTION });
        setShowForm(false);
        addToast('Disruption logged', 'success');
    };

    const openCrewFinder = async (disruption: Disruption) => {
        setShowFinder(disruption);
        setLoadingFtl(true);
        // Load FTL data for eligible crew
        const eligible = crew.filter(c =>
            c.id !== disruption.affectedCrewId &&
            (c.role === 'captain' || c.role === 'first_officer')
        );
        const ftlMap: Record<string, DutyLogEntry[]> = {};
        for (const c of eligible.slice(0, 10)) {
            try {
                ftlMap[c.id] = await getDutyLogs(c.id);
            } catch { ftlMap[c.id] = []; }
        }
        setCrewFtlData(ftlMap);
        setLoadingFtl(false);
    };

    const assignReplacement = (disruption: Disruption, replacement: CrewMember) => {
        setDisruptions(prev => prev.map(d =>
            d.id === disruption.id
                ? { ...d, status: 'resolved' as const, resolvedCrewId: replacement.id, resolvedCrewName: replacement.name, resolvedAt: new Date().toISOString() }
                : d
        ));
        setShowFinder(null);
        addToast(`${replacement.name} assigned as replacement`, 'success');
    };

    // Available crew for a disruption — filtered by qualification, medical, recency
    const getAvailableCrew = (disruption: Disruption) => {
        return crew.filter(c => {
            if (c.id === disruption.affectedCrewId) return false;
            if (c.role !== 'captain' && c.role !== 'first_officer') return false;
            if (disruption.aircraftType && !isQualifiedForAircraft(c, disruption.aircraftType)) return false;
            if (!hasValidMedical(c)) return false;
            return true;
        }).map(c => {
            const logs = crewFtlData[c.id] || [];
            const counters = calculateFtlCounters(logs, new Date());
            const alerts = getFtlAlerts(counters);
            const hasBlockingAlert = alerts.some((a: { severity: string }) => a.severity === 'blocked');
            return { member: c, counters, alerts, hasBlockingAlert, blocked: hasBlockingAlert || !hasLandingRecency(c) };
        }).sort((a: { blocked: boolean; counters: any }, b: { blocked: boolean; counters: any }) => {
            if (a.blocked !== b.blocked) return a.blocked ? 1 : -1;
            return (a.counters?.rolling7d.dutyHours || 0) - (b.counters?.rolling7d.dutyHours || 0);
        });
    };

    const openDisruptions = disruptions.filter(d => d.status === 'open');
    const resolvedDisruptions = disruptions.filter(d => d.status === 'resolved');

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in font-display">
            {/* ── Header ─────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Disruption Manager</h1>
                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-1">
                        IROPS Crew Reassignment • FTL-Checked • Qualification-Verified
                    </p>
                </div>
                <button onClick={() => setShowForm(true)} className="h-12 px-6 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">add_alert</span> Log Disruption
                </button>
            </div>

            {/* ── Stats Cards ────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Open Disruptions', count: openDisruptions.length, icon: 'warning', color: openDisruptions.length > 0 ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50' },
                    { label: 'Resolved Today', count: resolvedDisruptions.length, icon: 'check_circle', color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Available Crew', count: crew.filter(c => c.status === 'active' && (c.role === 'captain' || c.role === 'first_officer')).length, icon: 'group', color: 'text-blue-600 bg-blue-50' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-2xl border border-navy-100 p-5 flex items-center gap-4">
                        <div className={`size-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                            <span className="material-symbols-outlined text-xl">{stat.icon}</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-navy-950">{stat.count}</p>
                            <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Open Disruptions ────────────────────── */}
            <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-navy-50 flex items-center justify-between">
                    <h2 className="text-sm font-black text-navy-950 uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-500">error</span>
                        Active Disruptions
                    </h2>
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">{openDisruptions.length} open</span>
                </div>

                {openDisruptions.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                        <span className="material-symbols-outlined text-5xl text-emerald-200">verified</span>
                        <p className="text-sm font-black text-emerald-600 uppercase tracking-widest">All Clear — No Active Disruptions</p>
                        <p className="text-xs text-navy-400">All crew assignments are on track</p>
                    </div>
                ) : (
                    <div className="divide-y divide-navy-50">
                        {openDisruptions.map(d => {
                            const reasonMeta = REASON_META[d.reason];
                            return (
                                <div key={d.id} className="px-8 py-5 flex items-center justify-between hover:bg-red-50/20 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`size-12 rounded-xl flex items-center justify-center ${reasonMeta.color}`}>
                                            <span className="material-symbols-outlined text-xl">{reasonMeta.icon}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-navy-950">{d.flightNumber} — {d.route || 'TBD'}</p>
                                            <p className="text-[9px] font-bold text-navy-400 flex items-center gap-2 mt-0.5">
                                                <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 text-[8px] font-black uppercase">{reasonMeta.label}</span>
                                                <span>•</span>
                                                <span>{d.affectedCrewName} ({d.affectedRole})</span>
                                                {d.aircraftType && <><span>•</span><span>{d.aircraftType}</span></>}
                                            </p>
                                            {d.notes && <p className="text-[9px] text-navy-400 mt-1 truncate max-w-lg">{d.notes}</p>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => openCrewFinder(d)}
                                        className="h-10 px-5 bg-primary text-white font-black uppercase text-[9px] tracking-widest rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm">person_search</span> Find Replacement
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Resolved ───────────────────────────── */}
            {resolvedDisruptions.length > 0 && (
                <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-5 border-b border-navy-50">
                        <h2 className="text-sm font-black text-navy-950 uppercase tracking-widest flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500">history</span>
                            Resolved — Audit Trail
                        </h2>
                    </div>
                    <div className="divide-y divide-navy-50">
                        {resolvedDisruptions.map(d => (
                            <div key={d.id} className="px-8 py-4 flex items-center justify-between opacity-70">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                                    <div>
                                        <p className="text-xs font-black text-navy-950">{d.flightNumber} — {d.route || 'TBD'}</p>
                                        <p className="text-[8px] font-bold text-navy-400">
                                            {d.affectedCrewName} → {d.resolvedCrewName}
                                            <span className="mx-2">•</span>
                                            {REASON_META[d.reason].label}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[8px] font-black text-navy-300 uppercase">{d.resolvedAt ? new Date(d.resolvedAt).toLocaleString() : ''}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Log Disruption Modal ────────────────── */}
            {showForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-navy-100 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 space-y-5 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-navy-950 tracking-tight">Log Disruption</h3>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-navy-50 rounded-xl text-navy-400">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-navy-400 uppercase">Flight Number</label>
                                <input type="text" value={form.flightNumber} onChange={e => setForm({ ...form, flightNumber: e.target.value })} placeholder="DBA 101" className="w-full h-10 px-3 bg-navy-50/30 rounded-lg font-bold text-sm text-navy-950 border border-navy-50" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-navy-400 uppercase">Route</label>
                                <input type="text" value={form.route} onChange={e => setForm({ ...form, route: e.target.value })} placeholder="BJL → LOS" className="w-full h-10 px-3 bg-navy-50/30 rounded-lg font-bold text-sm text-navy-950 border border-navy-50" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-navy-400 uppercase">Aircraft Type</label>
                                <input type="text" value={form.aircraftType} onChange={e => setForm({ ...form, aircraftType: e.target.value })} placeholder="B737" className="w-full h-10 px-3 bg-navy-50/30 rounded-lg font-bold text-sm text-navy-950 border border-navy-50" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-navy-400 uppercase">Scheduled Time</label>
                                <input type="datetime-local" value={form.scheduledTime} onChange={e => setForm({ ...form, scheduledTime: e.target.value })} className="w-full h-10 px-3 bg-navy-50/30 rounded-lg font-bold text-xs text-navy-950 border border-navy-50" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-navy-400 uppercase">Affected Crew</label>
                                <select value={form.affectedCrewId} onChange={e => setForm({ ...form, affectedCrewId: e.target.value })} className="w-full h-10 px-3 bg-navy-50/30 rounded-lg font-bold text-xs text-navy-950 border border-navy-50">
                                    <option value="">Select crew member</option>
                                    {crew.map(c => <option key={c.id} value={c.id}>{c.name} — {ROLE_META[c.role].label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-navy-400 uppercase">Reason</label>
                                <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value as DisruptionReason })} className="w-full h-10 px-3 bg-navy-50/30 rounded-lg font-bold text-xs text-navy-950 border border-navy-50">
                                    {Object.entries(REASON_META).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-navy-400 uppercase">Notes</label>
                            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Additional details…" className="w-full px-3 py-2 bg-navy-50/30 rounded-lg font-bold text-xs text-navy-950 border border-navy-50 resize-none" />
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            <button onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-navy-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-navy-500 hover:bg-navy-50 transition-all">Cancel</button>
                            <button onClick={addDisruption} className="px-8 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">add_alert</span> Log Disruption
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Crew Finder Modal ───────────────────── */}
            {showFinder && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-navy-100 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 space-y-5 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-navy-950 tracking-tight">Find Replacement Crew</h3>
                                <p className="text-[9px] font-bold text-navy-400 mt-0.5">
                                    {showFinder.flightNumber} • {showFinder.route} • {showFinder.aircraftType || 'Any aircraft'}
                                </p>
                            </div>
                            <button onClick={() => setShowFinder(null)} className="p-2 hover:bg-navy-50 rounded-xl text-navy-400">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {loadingFtl ? (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                                <p className="text-xs text-navy-400 mt-3">Loading FTL data…</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {getAvailableCrew(showFinder).length === 0 ? (
                                    <div className="text-center py-12 space-y-3">
                                        <span className="material-symbols-outlined text-5xl text-red-200">person_off</span>
                                        <p className="text-sm font-black text-red-600 uppercase tracking-widest">No Qualified Crew Available</p>
                                        <p className="text-xs text-navy-400">No crew members match the required qualifications</p>
                                    </div>
                                ) : getAvailableCrew(showFinder).map(({ member, counters, alerts, blocked }) => (
                                    <div key={member.id} className={`flex items-center justify-between px-5 py-4 rounded-2xl border transition-all ${blocked ? 'bg-red-50/30 border-red-100 opacity-60' : 'bg-white border-navy-100 hover:border-primary/30 hover:shadow-md'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`size-10 rounded-xl flex items-center justify-center ${ROLE_META[member.role].color}`}>
                                                <span className="material-symbols-outlined text-lg">{ROLE_META[member.role].icon}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-navy-950">{member.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[8px] font-black text-navy-400">{ROLE_META[member.role].label}</span>
                                                    <span className="text-navy-200">•</span>
                                                    <span className="text-[8px] font-bold text-navy-400">{member.baseAirport || '—'}</span>
                                                    <span className="text-navy-200">•</span>
                                                    <span className="text-[8px] font-bold text-navy-400">{member.totalFlightHours?.toLocaleString() || 0}h total</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {/* FTL badges */}
                                            {counters && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase ${
                                                        (counters.rolling7d.dutyHours / 60) < 48 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                    }`}>7d: {Math.round(counters.rolling7d.dutyHours / 60)}h</span>
                                                    <span className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase ${
                                                        (counters.rolling28d.flightHours / 60) < 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                    }`}>28d: {Math.round(counters.rolling28d.flightHours / 60)}h</span>
                                                </div>
                                            )}
                                            {blocked ? (
                                                <span className="px-3 py-1.5 bg-red-100 text-red-600 rounded-xl text-[8px] font-black uppercase">Blocked</span>
                                            ) : (
                                                <button
                                                    onClick={() => assignReplacement(showFinder, member)}
                                                    className="h-9 px-4 bg-emerald-600 text-white font-black uppercase text-[8px] tracking-widest rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-1.5"
                                                >
                                                    <span className="material-symbols-outlined text-sm">check</span> Assign
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DisruptionManager;
