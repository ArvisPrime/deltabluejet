import React, { useState, useEffect, useMemo } from 'react';
import { useToastStore } from '../../stores/toastStore';
import {
    subscribeToCrew, subscribeToDutyLogs,
    createDutyLog, updateDutyLog, deleteDutyLog,
    ROLE_META, type CrewMember, type DutyLogEntry, type FlightLegEntry,
} from '../../services/crewService';
import {
    calculateFtlCounters, getFtlAlerts, getOverallSeverity, getMaxFDP,
    calcBlockMinutes, calcDutyMinutes, formatMinutesAsHM, formatHours,
    getSeverityColor, FTL_LIMITS,
    type FtlAlert, type AlertSeverity,
} from '../../utils/ftlEngine';
import { todayString } from '../../utils/localDate';

// ─── Empty form templates ───────────────────────────────────

const EMPTY_LEG: FlightLegEntry = {
    flightNumber: '', departure: '', arrival: '',
    blockOff: '06:00', blockOn: '08:00', blockMinutes: 120, position: 'operating',
};

const EMPTY_LOG = {
    date: todayString(),
    reportTime: '05:00', releaseTime: '09:00',
    totalDutyMinutes: 240, totalFlightMinutes: 120, totalLegs: 1,
    restBeforeMinutes: 720, status: 'completed' as DutyLogEntry['status'], notes: '',
    legs: [{ ...EMPTY_LEG }],
};

// ═══════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════

const CrewFTL: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);

    // ── Data State ──────────────────────────────────────────
    const [crew, setCrew] = useState<CrewMember[]>([]);
    const [dutyLogs, setDutyLogs] = useState<DutyLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCrewId, setSelectedCrewId] = useState('');

    // ── Form State ──────────────────────────────────────────
    const [showLogForm, setShowLogForm] = useState(false);
    const [editLogId, setEditLogId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_LOG });
    const [confirmDelete, setConfirmDelete] = useState<DutyLogEntry | null>(null);

    // ── FDP Calculator State ────────────────────────────────
    const [fdpReportHour, setFdpReportHour] = useState(6);
    const [fdpSectors, setFdpSectors] = useState(1);

    // ── Subscriptions ───────────────────────────────────────
    useEffect(() => {
        const unsub = subscribeToCrew(data => {
            setCrew(data.filter(c => c.status === 'active'));
            setLoading(false);
        });
        return unsub;
    }, []);

    useEffect(() => {
        if (!selectedCrewId) { setDutyLogs([]); return; }
        const unsub = subscribeToDutyLogs(selectedCrewId, logs => setDutyLogs(logs));
        return unsub;
    }, [selectedCrewId]);

    // ── Computed FTL Data ───────────────────────────────────
    const counters = useMemo(() => calculateFtlCounters(dutyLogs), [dutyLogs]);
    const alerts = useMemo(() => getFtlAlerts(counters), [counters]);
    const overallSeverity = useMemo(() => getOverallSeverity(alerts), [alerts]);
    const activeAlerts = alerts.filter(a => a.severity !== 'ok');

    const selectedMember = crew.find(c => c.id === selectedCrewId);

    // ── FDP Calculator ──────────────────────────────────────
    const maxFdp = getMaxFDP(fdpReportHour, fdpSectors);

    // ── Form Helpers ────────────────────────────────────────
    const recalcTotals = (reportTime: string, releaseTime: string, legs: FlightLegEntry[]) => {
        const dutyMin = calcDutyMinutes(reportTime, releaseTime);
        const flightMin = legs.reduce((sum, l) => sum + calcBlockMinutes(l.blockOff, l.blockOn), 0);
        return { totalDutyMinutes: dutyMin, totalFlightMinutes: flightMin, totalLegs: legs.length };
    };

    const updateLeg = (idx: number, field: keyof FlightLegEntry, value: string) => {
        const newLegs = [...form.legs];
        (newLegs[idx] as any)[field] = value;
        if (field === 'blockOff' || field === 'blockOn') {
            newLegs[idx].blockMinutes = calcBlockMinutes(newLegs[idx].blockOff, newLegs[idx].blockOn);
        }
        const totals = recalcTotals(form.reportTime, form.releaseTime, newLegs);
        setForm(prev => ({ ...prev, legs: newLegs, ...totals }));
    };

    const addLeg = () => {
        const newLegs = [...form.legs, { ...EMPTY_LEG }];
        const totals = recalcTotals(form.reportTime, form.releaseTime, newLegs);
        setForm(prev => ({ ...prev, legs: newLegs, ...totals }));
    };

    const removeLeg = (idx: number) => {
        const newLegs = form.legs.filter((_, i) => i !== idx);
        const totals = recalcTotals(form.reportTime, form.releaseTime, newLegs.length > 0 ? newLegs : [{ ...EMPTY_LEG }]);
        setForm(prev => ({ ...prev, legs: newLegs.length > 0 ? newLegs : [{ ...EMPTY_LEG }], ...totals }));
    };

    const updateTime = (field: 'reportTime' | 'releaseTime', value: string) => {
        const newForm = { ...form, [field]: value };
        const totals = recalcTotals(
            field === 'reportTime' ? value : form.reportTime,
            field === 'releaseTime' ? value : form.releaseTime,
            form.legs,
        );
        setForm({ ...newForm, ...totals });
    };

    const resetForm = () => { setEditLogId(null); setForm({ ...EMPTY_LOG, legs: [{ ...EMPTY_LEG }] }); setShowLogForm(false); };

    const openEdit = (log: DutyLogEntry) => {
        setEditLogId(log.id);
        setForm({
            date: log.date, reportTime: log.reportTime, releaseTime: log.releaseTime,
            totalDutyMinutes: log.totalDutyMinutes, totalFlightMinutes: log.totalFlightMinutes,
            totalLegs: log.totalLegs, restBeforeMinutes: log.restBeforeMinutes,
            status: log.status, notes: log.notes || '',
            legs: log.legs?.length ? log.legs : [{ ...EMPTY_LEG }],
        });
        setShowLogForm(true);
    };

    // ── Save & Delete ───────────────────────────────────────
    const handleSave = async () => {
        if (!selectedCrewId) { addToast('Select a crew member', 'warning'); return; }
        if (!form.date) { addToast('Date required', 'warning'); return; }
        setSaving(true);
        try {
            const payload = {
                crewId: selectedCrewId, ...form,
                legs: form.legs.map(l => ({ ...l, blockMinutes: calcBlockMinutes(l.blockOff, l.blockOn) })),
            };
            if (editLogId) {
                await updateDutyLog(editLogId, payload);
                addToast('Duty log updated', 'success');
            } else {
                await createDutyLog(payload);
                addToast('Duty log recorded', 'success');
            }
            resetForm();
        } catch (err) {
            console.error('Save duty log error:', err);
            addToast('Failed to save duty log', 'error');
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            await deleteDutyLog(confirmDelete.id);
            addToast('Duty log removed', 'success');
        } catch (err) {
            addToast('Failed to delete', 'error');
        } finally { setConfirmDelete(null); }
    };

    // ── Render ───────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in font-display">
            {/* ── Header ─────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">FTL Tracker</h1>
                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-1">
                        Flight Time Limitations & Duty Compliance
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Crew Selector */}
                    <select
                        value={selectedCrewId}
                        onChange={e => setSelectedCrewId(e.target.value)}
                        className="h-12 px-5 bg-white border border-navy-100 rounded-2xl font-bold text-sm text-navy-950 min-w-[240px]"
                    >
                        <option value="">Select Crew Member</option>
                        {crew.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({ROLE_META[c.role].label})</option>
                        ))}
                    </select>
                    {selectedCrewId && (
                        <button
                            onClick={() => { resetForm(); setShowLogForm(!showLogForm); }}
                            className="px-6 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Log Duty
                        </button>
                    )}
                </div>
            </div>

            {/* ── No crew selected ───────────────────────── */}
            {!selectedCrewId && (
                <div className="bg-white rounded-[2.5rem] border border-navy-100 p-16 text-center space-y-3">
                    <span className="material-symbols-outlined text-6xl text-navy-200">speed</span>
                    <p className="text-sm font-black text-navy-400 uppercase tracking-widest">Select a crew member to view FTL status</p>
                    <p className="text-xs text-navy-300">Track duty hours, flight time, legs, and rest compliance</p>
                </div>
            )}

            {selectedCrewId && (
                <>
                    {/* ── Alert Banner ────────────────────────── */}
                    {activeAlerts.length > 0 && (
                        <div className={`rounded-2xl border p-4 space-y-2 ${overallSeverity === 'blocked' ? 'bg-red-50 border-red-200' : overallSeverity === 'critical' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-200'}`}>
                            <div className="flex items-center gap-2">
                                <span className={`material-symbols-outlined text-lg ${overallSeverity === 'blocked' || overallSeverity === 'critical' ? 'text-red-500' : 'text-amber-500'}`}>
                                    {overallSeverity === 'blocked' ? 'block' : 'warning'}
                                </span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${overallSeverity === 'blocked' || overallSeverity === 'critical' ? 'text-red-700' : 'text-amber-700'}`}>
                                    {overallSeverity === 'blocked' ? 'FTL LIMIT REACHED' : activeAlerts.length + ' FTL Alert(s)'}
                                </span>
                            </div>
                            {activeAlerts.map((a, i) => (
                                <p key={i} className={`text-xs font-bold ${a.severity === 'blocked' || a.severity === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>{a.message}</p>
                            ))}
                        </div>
                    )}

                    {/* ── FTL Counters ────────────────────────── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {[
                            { label: '7-Day Duty', current: counters.rolling7d.dutyHours, limit: FTL_LIMITS.ROLLING_7D_DUTY_HOURS, unit: 'h', icon: 'calendar_view_week', alert: alerts[0] },
                            { label: '14-Day Duty', current: counters.rolling14d.dutyHours, limit: FTL_LIMITS.ROLLING_14D_DUTY_HOURS, unit: 'h', icon: 'date_range', alert: alerts[1] },
                            { label: '28-Day Duty', current: counters.rolling28d.dutyHours, limit: FTL_LIMITS.ROLLING_28D_DUTY_HOURS, unit: 'h', icon: 'calendar_month', alert: alerts[2] },
                            { label: '28-Day Flight', current: counters.rolling28d.flightHours, limit: FTL_LIMITS.ROLLING_28D_FLIGHT_HOURS, unit: 'h', icon: 'flight', alert: alerts[3] },
                            { label: '365-Day Flight', current: counters.rolling365d.flightHours, limit: FTL_LIMITS.ROLLING_365D_FLIGHT_HOURS, unit: 'h', icon: 'event_repeat', alert: alerts[4] },
                        ].map(card => {
                            const pct = card.limit > 0 ? Math.min((card.current / card.limit) * 100, 100) : 0;
                            const colors = getSeverityColor(card.alert?.severity || 'ok');
                            return (
                                <div key={card.label} className={`p-5 rounded-[2rem] border transition-all ${colors.border} ${colors.bg}`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`material-symbols-outlined text-lg ${colors.text}`}>{card.icon}</span>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${colors.text}`}>{card.label}</span>
                                    </div>
                                    <p className={`text-2xl font-black tracking-tighter ${colors.text}`}>
                                        {formatHours(card.current)}<span className="text-sm opacity-60">/{card.limit}{card.unit}</span>
                                    </p>
                                    {/* Progress bar */}
                                    <div className="mt-3 h-2 bg-black/5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-700 ${colors.bar}`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <p className={`text-[8px] font-bold mt-1 ${colors.text} opacity-70`}>{Math.round(pct)}% utilized</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── FDP Calculator ──────────────────────── */}
                    <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm p-6 md:p-8">
                        <h2 className="text-sm font-black text-navy-950 uppercase tracking-widest mb-5 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">calculate</span>
                            FDP Calculator
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Report Time (Hour)</label>
                                <select
                                    value={fdpReportHour}
                                    onChange={e => setFdpReportHour(Number(e.target.value))}
                                    className="w-full h-12 px-5 bg-navy-50 rounded-xl font-bold text-sm text-navy-950 border-none"
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Sectors (Legs)</label>
                                <select
                                    value={fdpSectors}
                                    onChange={e => setFdpSectors(Number(e.target.value))}
                                    className="w-full h-12 px-5 bg-navy-50 rounded-xl font-bold text-sm text-navy-950 border-none"
                                >
                                    {[1, 2, 3, 4, 5, 6, 7].map(n => (
                                        <option key={n} value={n}>{n} sector{n > 1 ? 's' : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="sm:col-span-2 bg-primary/5 rounded-2xl p-5 flex items-center gap-6">
                                <div>
                                    <p className="text-[9px] font-black text-primary uppercase tracking-widest">Max FDP</p>
                                    <p className="text-3xl font-black text-primary tracking-tighter">{maxFdp}<span className="text-sm opacity-60">h</span></p>
                                </div>
                                <div className="w-px h-10 bg-primary/20" />
                                <div>
                                    <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Latest Release</p>
                                    <p className="text-lg font-black text-navy-800 tracking-tight">
                                        {(() => {
                                            const h = fdpReportHour + Math.floor(maxFdp);
                                            const m = Math.round((maxFdp % 1) * 60);
                                            return `${String(h % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                                        })()}
                                    </p>
                                </div>
                                <div className="w-px h-10 bg-primary/20" />
                                <div>
                                    <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Min Rest After</p>
                                    <p className="text-lg font-black text-navy-800 tracking-tight">{FTL_LIMITS.MIN_REST_HOURS}h</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Quick Stats Row ─────────────────────── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Logs', value: dutyLogs.length, icon: 'description', color: 'text-navy-600 bg-navy-50' },
                            { label: '7-Day Legs', value: counters.rolling7d.legs, icon: 'flight_takeoff', color: 'text-blue-600 bg-blue-50' },
                            { label: '7-Day Flight', value: formatHours(counters.rolling7d.flightHours) + 'h', icon: 'schedule', color: 'text-purple-600 bg-purple-50' },
                            { label: 'Status', value: overallSeverity === 'ok' ? 'COMPLIANT' : overallSeverity.toUpperCase(), icon: overallSeverity === 'ok' ? 'check_circle' : 'warning', color: overallSeverity === 'ok' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50' },
                        ].map(stat => (
                            <div key={stat.label} className="p-5 bg-white rounded-[2rem] border border-navy-100 flex items-center gap-4">
                                <div className={`size-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                                    <span className="material-symbols-outlined">{stat.icon}</span>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-lg font-black text-navy-950 tracking-tighter">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Duty Log Form ───────────────────────── */}
                    {showLogForm && (
                        <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-lg p-8 space-y-5 animate-in slide-in-from-top duration-300">
                            <h3 className="text-sm font-black text-navy-950 uppercase flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">edit_note</span>
                                {editLogId ? 'Edit Duty Log' : 'New Duty Log'}
                            </h3>

                            {/* Date & Times */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Date</label>
                                    <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full h-12 px-5 bg-navy-50 rounded-xl font-bold text-sm text-navy-950 border-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Report Time</label>
                                    <input type="time" value={form.reportTime} onChange={e => updateTime('reportTime', e.target.value)} className="w-full h-12 px-5 bg-navy-50 rounded-xl font-bold text-sm text-navy-950 border-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Release Time</label>
                                    <input type="time" value={form.releaseTime} onChange={e => updateTime('releaseTime', e.target.value)} className="w-full h-12 px-5 bg-navy-50 rounded-xl font-bold text-sm text-navy-950 border-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Rest Before (min)</label>
                                    <input type="number" value={form.restBeforeMinutes} onChange={e => setForm({ ...form, restBeforeMinutes: Number(e.target.value) })} className="w-full h-12 px-5 bg-navy-50 rounded-xl font-bold text-sm text-navy-950 border-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Status</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="w-full h-12 px-5 bg-navy-50 rounded-xl font-bold text-sm text-navy-950 border-none">
                                        <option value="planned">Planned</option>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>

                            {/* Computed totals */}
                            <div className="flex items-center gap-6 text-xs font-bold text-navy-500 bg-navy-50/50 rounded-xl px-5 py-3">
                                <span>Duty: <span className="text-navy-900">{formatMinutesAsHM(form.totalDutyMinutes)}</span></span>
                                <span>Flight: <span className="text-navy-900">{formatMinutesAsHM(form.totalFlightMinutes)}</span></span>
                                <span>Legs: <span className="text-navy-900">{form.totalLegs}</span></span>
                            </div>

                            {/* Flight Legs */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Flight Legs ({form.legs.length})</h4>
                                    <button onClick={addLeg} className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">add</span> Add Leg
                                    </button>
                                </div>
                                {form.legs.map((leg, idx) => (
                                    <div key={idx} className="grid grid-cols-2 md:grid-cols-7 gap-3 items-end p-4 bg-navy-50/30 rounded-2xl border border-navy-50 relative">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-navy-400 uppercase">Flight #</label>
                                            <input value={leg.flightNumber} onChange={e => updateLeg(idx, 'flightNumber', e.target.value.toUpperCase())} placeholder="DB100" className="w-full h-10 px-3 bg-white rounded-lg font-bold text-xs text-navy-950 border border-navy-100" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-navy-400 uppercase">From</label>
                                            <input value={leg.departure} onChange={e => updateLeg(idx, 'departure', e.target.value.toUpperCase())} placeholder="BJL" maxLength={3} className="w-full h-10 px-3 bg-white rounded-lg font-bold text-xs text-navy-950 border border-navy-100" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-navy-400 uppercase">To</label>
                                            <input value={leg.arrival} onChange={e => updateLeg(idx, 'arrival', e.target.value.toUpperCase())} placeholder="LOS" maxLength={3} className="w-full h-10 px-3 bg-white rounded-lg font-bold text-xs text-navy-950 border border-navy-100" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-navy-400 uppercase">Block Off</label>
                                            <input type="time" value={leg.blockOff} onChange={e => updateLeg(idx, 'blockOff', e.target.value)} className="w-full h-10 px-3 bg-white rounded-lg font-bold text-xs text-navy-950 border border-navy-100" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-navy-400 uppercase">Block On</label>
                                            <input type="time" value={leg.blockOn} onChange={e => updateLeg(idx, 'blockOn', e.target.value)} className="w-full h-10 px-3 bg-white rounded-lg font-bold text-xs text-navy-950 border border-navy-100" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-navy-400 uppercase">Position</label>
                                            <select value={leg.position} onChange={e => updateLeg(idx, 'position', e.target.value)} className="w-full h-10 px-3 bg-white rounded-lg font-bold text-xs text-navy-950 border border-navy-100">
                                                <option value="operating">Operating</option>
                                                <option value="deadhead">Deadhead</option>
                                            </select>
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <p className="text-xs font-black text-primary">{formatMinutesAsHM(calcBlockMinutes(leg.blockOff, leg.blockOn))}</p>
                                            {form.legs.length > 1 && (
                                                <button onClick={() => removeLeg(idx)} className="p-1.5 hover:bg-red-50 text-navy-300 hover:text-red-500 rounded-lg transition-all" title="Remove leg">
                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Notes */}
                            <input
                                value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })}
                                placeholder="Notes (optional)"
                                className="w-full h-12 px-5 bg-navy-50 rounded-xl font-bold text-sm text-navy-950 border-none"
                            />

                            {/* Actions */}
                            <div className="flex gap-3 justify-end">
                                <button onClick={resetForm} className="px-6 py-2.5 border border-navy-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-navy-500 hover:bg-navy-50 transition-all">Cancel</button>
                                <button onClick={handleSave} disabled={saving} className="px-8 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50 flex items-center gap-2">
                                    {saving ? (<><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</>) : (editLogId ? 'Save Changes' : 'Record Duty')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Duty Log Table ──────────────────────── */}
                    <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-5 border-b border-navy-50 flex items-center justify-between">
                            <h2 className="text-sm font-black text-navy-950 uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">history</span>
                                Duty Log History
                            </h2>
                            <span className="text-[9px] font-black text-navy-400 uppercase tracking-widest">{dutyLogs.length} records</span>
                        </div>

                        {dutyLogs.length === 0 ? (
                            <div className="text-center py-16 space-y-3">
                                <span className="material-symbols-outlined text-5xl text-navy-200">description</span>
                                <p className="text-sm font-black text-navy-300 uppercase tracking-widest">No duty logs recorded</p>
                                <p className="text-xs text-navy-300">Click "Log Duty" to record a duty period</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-navy-50">
                                {dutyLogs.slice(0, 20).map(log => {
                                    const dutyH = log.totalDutyMinutes / 60;
                                    const flightH = log.totalFlightMinutes / 60;
                                    return (
                                        <div key={log.id} className="px-8 py-4 flex items-center justify-between hover:bg-navy-50/30 transition-all group">
                                            <div className="flex items-center gap-5 flex-1 min-w-0">
                                                {/* Date */}
                                                <div className="text-center shrink-0 w-14">
                                                    <p className="text-[8px] font-black text-navy-400 uppercase">{new Date(log.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' })}</p>
                                                    <p className="text-lg font-black text-navy-950 tracking-tighter">{log.date.slice(8)}</p>
                                                    <p className="text-[8px] font-bold text-navy-300">{log.date.slice(5, 7)}/{log.date.slice(0, 4)}</p>
                                                </div>
                                                {/* Times */}
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-black text-navy-950">
                                                        {log.reportTime} <span className="text-navy-300">→</span> {log.releaseTime}
                                                    </p>
                                                    <div className="flex items-center gap-3 text-[9px] font-bold text-navy-400">
                                                        <span>Duty: {formatMinutesAsHM(log.totalDutyMinutes)}</span>
                                                        <span>Flight: {formatMinutesAsHM(log.totalFlightMinutes)}</span>
                                                        <span>Legs: {log.totalLegs}</span>
                                                    </div>
                                                    {log.legs?.length > 0 && (
                                                        <p className="text-[8px] font-bold text-primary/60">
                                                            {log.legs.map(l => `${l.flightNumber} ${l.departure}→${l.arrival}`).join(' • ')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Status & Actions */}
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                                    log.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    log.status === 'active' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    'bg-navy-50 text-navy-500 border-navy-100'
                                                }`}>{log.status}</span>
                                                <button onClick={() => openEdit(log)} className="p-2 hover:bg-blue-50 rounded-xl text-navy-300 hover:text-blue-600 transition-all" title="Edit">
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                                <button onClick={() => setConfirmDelete(log)} className="p-2 hover:bg-red-50 rounded-xl text-navy-300 hover:text-red-500 transition-all" title="Delete">
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ── Delete Confirmation Modal ───────────────── */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-navy-100 shadow-2xl w-full max-w-md p-8 space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center gap-4">
                            <div className="size-16 rounded-full bg-red-50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl text-red-500">delete_forever</span>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-black text-navy-950 tracking-tight">Delete Duty Log</h3>
                                <p className="text-sm text-navy-500">
                                    Remove the duty log for <strong>{confirmDelete.date}</strong> ({confirmDelete.reportTime} — {confirmDelete.releaseTime})?
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDelete(null)} className="flex-1 h-12 bg-white border border-navy-200 text-navy-700 font-black rounded-xl hover:bg-navy-50 transition-all">Cancel</button>
                            <button onClick={handleDelete} className="flex-1 h-12 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CrewFTL;
