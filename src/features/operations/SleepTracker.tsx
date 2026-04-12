import React, { useState, useEffect, useMemo } from 'react';
import { useToastStore } from '../../stores/toastStore';
import {
    subscribeToCrew, createSleepLog, deleteSleepLog,
    subscribeToAllSleepLogs,
    ROLE_META, type CrewMember, type SleepLogEntry,
} from '../../services/crewService';
import { calcAvgSleep, calcSleepDebt } from '../../utils/fatigueEngine';
import type { SleepEntry } from '../../utils/fatigueEngine';
import { todayString } from '../../utils/localDate';

// ─── Helpers ────────────────────────────────────────────

const QUALITY_META: Record<SleepLogEntry['quality'], { label: string; icon: string; color: string }> = {
    poor:      { label: 'Poor',      icon: 'sentiment_very_dissatisfied', color: 'text-red-600 bg-red-50' },
    fair:      { label: 'Fair',      icon: 'sentiment_dissatisfied',      color: 'text-amber-600 bg-amber-50' },
    good:      { label: 'Good',      icon: 'sentiment_satisfied',         color: 'text-emerald-600 bg-emerald-50' },
    excellent: { label: 'Excellent', icon: 'sentiment_very_satisfied',    color: 'text-blue-600 bg-blue-50' },
};

function toSleepEntry(e: SleepLogEntry): SleepEntry {
    return { id: e.id, crewId: e.crewId, date: e.date, hoursSlept: e.hoursSlept, quality: e.quality, notes: e.notes };
}

const EMPTY_FORM = {
    crewId: '',
    date: todayString(),
    hoursSlept: 7,
    quality: 'good' as SleepLogEntry['quality'],
    notes: '',
};

// ═══════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════

const SleepTracker: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [crew, setCrew] = useState<CrewMember[]>([]);
    const [sleepLogs, setSleepLogs] = useState<SleepLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [filterCrew, setFilterCrew] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<SleepLogEntry | null>(null);

    useEffect(() => {
        let ready = 0;
        const check = () => { if (++ready >= 2) setLoading(false); };
        const unsubCrew = subscribeToCrew(data => { setCrew(data.filter(c => c.status === 'active')); check(); });
        const unsubSleep = subscribeToAllSleepLogs(data => { setSleepLogs(data); check(); });
        return () => { unsubCrew(); unsubSleep(); };
    }, []);

    const handleSave = async () => {
        if (!form.crewId) { addToast('Select a crew member', 'warning'); return; }
        setSaving(true);
        try {
            await createSleepLog(form);
            setForm({ ...EMPTY_FORM });
            setShowForm(false);
            addToast('Sleep entry logged', 'success');
        } catch (err) {
            console.error('Sleep log error:', err);
            addToast('Failed to save sleep entry', 'error');
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            await deleteSleepLog(confirmDelete.id);
            addToast('Entry removed', 'success');
        } catch { addToast('Failed to delete', 'error'); }
        setConfirmDelete(null);
    };

    // Filtered logs
    const filteredLogs = useMemo(() => {
        if (!filterCrew) return sleepLogs.slice(0, 50);
        return sleepLogs.filter(l => l.crewId === filterCrew).slice(0, 50);
    }, [sleepLogs, filterCrew]);

    // Fleet sleep summary
    const fleetSummary = useMemo(() => {
        const crewIds = [...new Set(sleepLogs.map(l => l.crewId))];
        return crewIds.map(id => {
            const memberLogs = sleepLogs.filter(l => l.crewId === id).map(toSleepEntry);
            const member = crew.find(c => c.id === id);
            return {
                crewId: id,
                crewName: member?.name || id,
                role: member ? ROLE_META[member.role].label : '',
                avg7d: calcAvgSleep(memberLogs, 7),
                debt7d: calcSleepDebt(memberLogs, 7),
                debt28d: calcSleepDebt(memberLogs, 28),
                entries: memberLogs.length,
            };
        }).sort((a, b) => b.debt7d - a.debt7d);
    }, [sleepLogs, crew]);

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
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Sleep Tracker</h1>
                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-1">
                        Crew-Reported Sleep • Debt Calculator • FRMS Integration
                    </p>
                </div>
                <button onClick={() => setShowForm(true)} className="h-12 px-6 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">bedtime</span> Log Sleep
                </button>
            </div>

            {/* ── Fleet Sleep Summary ──────────────────── */}
            <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-navy-50">
                    <h2 className="text-sm font-black text-navy-950 uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">hotel</span>
                        Fleet Sleep Summary
                    </h2>
                </div>

                {fleetSummary.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                        <span className="material-symbols-outlined text-5xl text-navy-200">bedtime_off</span>
                        <p className="text-sm text-navy-400">No sleep data logged yet</p>
                        <p className="text-xs text-navy-300">Start by logging sleep entries for crew members</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[8px] font-black text-navy-400 uppercase tracking-widest border-b border-navy-50">
                                    <th className="px-8 py-3">Crew Member</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3 text-center">7d Avg Sleep</th>
                                    <th className="px-4 py-3 text-center">7d Sleep Debt</th>
                                    <th className="px-4 py-3 text-center">28d Sleep Debt</th>
                                    <th className="px-4 py-3 text-center">Entries</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-navy-50">
                                {fleetSummary.map(row => (
                                    <tr key={row.crewId} className="hover:bg-navy-50/30 transition-all">
                                        <td className="px-8 py-3 text-sm font-black text-navy-950">{row.crewName}</td>
                                        <td className="px-4 py-3 text-[9px] font-bold text-navy-500">{row.role}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black ${
                                                row.avg7d >= 7 ? 'bg-emerald-50 text-emerald-700' : row.avg7d >= 6 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                            }`}>{row.avg7d}h</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black ${
                                                row.debt7d <= 3 ? 'bg-emerald-50 text-emerald-700' : row.debt7d <= 8 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                            }`}>{row.debt7d}h</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black ${
                                                row.debt28d <= 10 ? 'bg-emerald-50 text-emerald-700' : row.debt28d <= 24 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                            }`}>{row.debt28d}h</span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm font-bold text-navy-600">{row.entries}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Sleep History ────────────────────────── */}
            <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-navy-50 flex items-center justify-between flex-wrap gap-3">
                    <h2 className="text-sm font-black text-navy-950 uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">history</span>
                        Sleep History
                    </h2>
                    <select
                        value={filterCrew}
                        onChange={e => setFilterCrew(e.target.value)}
                        className="h-9 px-3 bg-navy-50 rounded-xl text-xs font-bold text-navy-950 border-none"
                    >
                        <option value="">All Crew</option>
                        {crew.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div className="divide-y divide-navy-50 max-h-[500px] overflow-y-auto">
                    {filteredLogs.length === 0 ? (
                        <div className="text-center py-12 text-sm text-navy-400">No entries found</div>
                    ) : filteredLogs.map(log => {
                        const member = crew.find(c => c.id === log.crewId);
                        const qMeta = QUALITY_META[log.quality];
                        return (
                            <div key={log.id} className="px-8 py-4 flex items-center justify-between hover:bg-navy-50/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`size-10 rounded-xl flex items-center justify-center ${qMeta.color}`}>
                                        <span className="material-symbols-outlined text-lg">{qMeta.icon}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-navy-950">{member?.name || log.crewId}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[8px] font-bold text-navy-400 bg-navy-50 px-2 py-0.5 rounded">{log.date}</span>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded ${qMeta.color}`}>{qMeta.label}</span>
                                            <span className="text-[9px] font-black text-navy-600">{log.hoursSlept}h sleep</span>
                                        </div>
                                        {log.notes && <p className="text-[8px] text-navy-400 mt-0.5 truncate max-w-md">{log.notes}</p>}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setConfirmDelete(log)}
                                    className="p-2 hover:bg-red-50 rounded-xl text-navy-300 hover:text-red-500 transition-all"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Log Sleep Modal ──────────────────────── */}
            {showForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-navy-100 shadow-2xl w-full max-w-lg p-8 space-y-5 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-navy-950 tracking-tight">Log Sleep Entry</h3>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-navy-50 rounded-xl text-navy-400">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1">
                                <label className="text-[8px] font-black text-navy-400 uppercase">Crew Member</label>
                                <select value={form.crewId} onChange={e => setForm({ ...form, crewId: e.target.value })} className="w-full h-10 px-3 bg-navy-50/30 rounded-lg font-bold text-sm text-navy-950 border border-navy-50">
                                    <option value="">Select crew member</option>
                                    {crew.map(c => <option key={c.id} value={c.id}>{c.name} — {ROLE_META[c.role].label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-navy-400 uppercase">Date</label>
                                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full h-10 px-3 bg-navy-50/30 rounded-lg font-bold text-sm text-navy-950 border border-navy-50" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-navy-400 uppercase">Quality</label>
                                <select value={form.quality} onChange={e => setForm({ ...form, quality: e.target.value as SleepLogEntry['quality'] })} className="w-full h-10 px-3 bg-navy-50/30 rounded-lg font-bold text-sm text-navy-950 border border-navy-50">
                                    {Object.entries(QUALITY_META).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Hours Slider */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[8px] font-black text-navy-400 uppercase">Hours Slept</label>
                                <span className="text-lg font-black text-navy-950">{form.hoursSlept}h</span>
                            </div>
                            <input
                                type="range"
                                min={0} max={16} step={0.5}
                                value={form.hoursSlept}
                                onChange={e => setForm({ ...form, hoursSlept: parseFloat(e.target.value) })}
                                className="w-full accent-primary"
                            />
                            <div className="flex justify-between text-[7px] font-bold text-navy-300">
                                <span>0h</span><span>4h</span><span>8h</span><span>12h</span><span>16h</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-navy-400 uppercase">Notes (optional)</label>
                            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any factors affecting sleep…" className="w-full px-3 py-2 bg-navy-50/30 rounded-lg font-bold text-xs text-navy-950 border border-navy-50 resize-none" />
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            <button onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-navy-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-navy-500 hover:bg-navy-50 transition-all">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="px-8 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 disabled:opacity-50">
                                {saving ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-sm">save</span>}
                                Save Entry
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm ───────────────────────── */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-navy-100 shadow-2xl w-full max-w-sm p-8 space-y-5 animate-in zoom-in-95 duration-300 text-center">
                        <span className="material-symbols-outlined text-5xl text-red-400">delete_forever</span>
                        <p className="text-sm font-black text-navy-950">Delete this sleep entry?</p>
                        <p className="text-xs text-navy-400">{confirmDelete.date} — {confirmDelete.hoursSlept}h sleep</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setConfirmDelete(null)} className="px-6 py-2.5 border border-navy-100 rounded-xl text-[10px] font-black uppercase text-navy-500">Cancel</button>
                            <button onClick={handleDelete} className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SleepTracker;
