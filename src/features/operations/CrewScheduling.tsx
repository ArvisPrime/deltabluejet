import React, { useState, useEffect, useMemo } from 'react';
import { useToastStore } from '../../stores/toastStore';
import {
    subscribeToCrew,
    subscribeToAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    ROLE_META,
    type CrewMember,
    type CrewAssignment,
} from '../../services/crewService';
import { getAllScheduledFlights } from '../../services/firestore';
import type { FlightDoc } from '../../types/firestore';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDates(baseDate: Date): string[] {
    const d = new Date(baseDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
        const dt = new Date(monday);
        dt.setDate(monday.getDate() + i);
        return dt.toISOString().slice(0, 10);
    });
}

const EMPTY_FORM = {
    crewMemberId: '', flightId: '', flightNumber: '', routeInfo: '', date: '', dutyStart: '06:00', dutyEnd: '14:00',
};

const CrewScheduling: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [crew, setCrew] = useState<CrewMember[]>([]);
    const [assignments, setAssignments] = useState<CrewAssignment[]>([]);
    const [flights, setFlights] = useState<FlightDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [weekOffset, setWeekOffset] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [editAssignment, setEditAssignment] = useState<CrewAssignment | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<CrewAssignment | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });

    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);
    const weekDates = getWeekDates(baseDate);

    // Active (schedulable) crew only
    const activeCrew = useMemo(() => crew.filter(m => m.status === 'active'), [crew]);

    // Real-time subscriptions
    useEffect(() => {
        let ready = 0;
        const checkReady = () => { if (++ready >= 2) setLoading(false); };

        const unsubCrew = subscribeToCrew(data => { setCrew(data); checkReady(); });
        const unsubAssign = subscribeToAssignments(data => { setAssignments(data); checkReady(); });

        // One-shot flight load
        getAllScheduledFlights().then(f => setFlights(f)).catch(err => console.error('Flight load error:', err));

        return () => { unsubCrew(); unsubAssign(); };
    }, []);

    // Filtered flights for selected date
    const flightsForDate = useMemo(() => {
        if (!form.date) return flights;
        const selectedDate = new Date(form.date);
        const dayOfWeek = selectedDate.getDay(); // 0=Sun, 1=Mon, etc.
        return flights.filter(f => {
            // Match by day-of-week if daysOfWeek exists
            if (f.daysOfWeek?.length) {
                return f.daysOfWeek.includes(dayOfWeek);
            }
            return true;
        });
    }, [flights, form.date]);

    const handleFlightSelect = (flightId: string) => {
        const flight = flights.find(f => f.id === flightId);
        if (flight) {
            setForm(prev => ({
                ...prev,
                flightId: flight.id,
                flightNumber: flight.flightNumber,
                routeInfo: `${flight.origin.code} → ${flight.destination.code}`,
            }));
        } else {
            setForm(prev => ({ ...prev, flightId: '', flightNumber: '', routeInfo: '' }));
        }
    };

    const openEditAssignment = (a: CrewAssignment) => {
        setEditAssignment(a);
        setForm({
            crewMemberId: a.crewMemberId,
            flightId: a.flightId || '',
            flightNumber: a.flightNumber,
            routeInfo: a.routeInfo || '',
            date: a.date,
            dutyStart: a.dutyStart,
            dutyEnd: a.dutyEnd,
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setEditAssignment(null);
        setForm({ ...EMPTY_FORM });
        setShowForm(false);
    };

    const handleSave = async () => {
        if (!form.crewMemberId || !form.flightNumber || !form.date) {
            addToast('Crew member, flight, and date required', 'warning'); return;
        }
        setSaving(true);
        try {
            const member = activeCrew.find(c => c.id === form.crewMemberId);
            const payload = {
                crewMemberId: form.crewMemberId,
                crewMemberName: member?.name || '',
                crewRole: member?.role || 'cabin_crew' as const,
                flightNumber: form.flightNumber,
                flightId: form.flightId || undefined,
                routeInfo: form.routeInfo || undefined,
                date: form.date,
                dutyStart: form.dutyStart,
                dutyEnd: form.dutyEnd,
                status: 'scheduled' as const,
            };

            if (editAssignment) {
                await updateAssignment(editAssignment.id, payload);
                addToast('Assignment updated', 'success');
            } else {
                const result = await createAssignment(payload);
                if (!result.fatigueCheck.passed) {
                    addToast(`⚠ Fatigue Warning: ${result.fatigueCheck.violations.join(', ')}`, 'warning');
                } else {
                    addToast('Assignment created', 'success');
                }
            }
            resetForm();
        } catch (err) {
            console.error('Assignment save error:', err);
            addToast('Failed to save assignment', 'error');
        } finally { setSaving(false); }
    };

    const handleRemoveConfirm = async () => {
        if (!confirmDelete) return;
        setDeleting(true);
        try {
            await deleteAssignment(confirmDelete.id);
            addToast('Assignment removed', 'success');
        } catch (err) {
            console.error('Delete assignment error:', err);
            addToast('Failed to remove assignment', 'error');
        } finally {
            setDeleting(false);
            setConfirmDelete(null);
        }
    };

    const getAssignmentsForCell = (crewId: string, date: string) =>
        assignments.filter(a => a.crewMemberId === crewId && a.date === date);

    // Stats
    const weekAssignmentCount = useMemo(() => {
        const weekSet = new Set(weekDates);
        return assignments.filter(a => weekSet.has(a.date)).length;
    }, [assignments, weekDates]);

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
        </div>
    );

    return (
        <div className="p-8 max-w-full mx-auto space-y-8 animate-in fade-in font-display">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Crew Scheduling</h1>
                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-1">
                        {weekDates[0]} to {weekDates[6]} • {weekAssignmentCount} assignments this week • {activeCrew.length} active crew
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setWeekOffset(w => w - 1)} className="size-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-600 hover:bg-navy-100 transition-all">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button onClick={() => setWeekOffset(0)} className="px-4 py-2 bg-navy-50 rounded-xl text-[10px] font-black text-navy-500 uppercase tracking-widest hover:bg-navy-100 transition-all">Today</button>
                    <button onClick={() => setWeekOffset(w => w + 1)} className="size-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-600 hover:bg-navy-100 transition-all">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                    <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="px-6 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">add</span> Assign
                    </button>
                </div>
            </div>

            {/* Assignment Form */}
            {showForm && (
                <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-lg p-8 space-y-5 animate-in slide-in-from-top duration-300">
                    <h3 className="text-sm font-black text-navy-950 uppercase">{editAssignment ? 'Edit Assignment' : 'New Assignment'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {/* Crew member */}
                        <div className="space-y-1 md:col-span-1 lg:col-span-2">
                            <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest px-1">Crew Member</label>
                            <select
                                value={form.crewMemberId}
                                onChange={e => setForm({...form, crewMemberId: e.target.value})}
                                className="w-full h-12 px-5 bg-navy-50 rounded-xl font-bold text-sm text-navy-950 border-none"
                            >
                                <option value="">Select Crew Member</option>
                                {activeCrew.map(c => <option key={c.id} value={c.id}>{c.name} ({ROLE_META[c.role].label})</option>)}
                            </select>
                        </div>
                        {/* Date — placed before flight so flight dropdown can filter */}
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest px-1">Date</label>
                            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full h-12 px-5 bg-navy-50 rounded-xl font-bold text-sm text-navy-950 border-none" />
                        </div>
                        {/* Flight dropdown */}
                        <div className="space-y-1 md:col-span-1 lg:col-span-1">
                            <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest px-1">Flight</label>
                            <select
                                value={form.flightId}
                                onChange={e => handleFlightSelect(e.target.value)}
                                className="w-full h-12 px-5 bg-navy-50 rounded-xl font-bold text-sm text-navy-950 border-none"
                            >
                                <option value="">Select Flight</option>
                                {flightsForDate.map(f => (
                                    <option key={f.id} value={f.id}>
                                        {f.flightNumber} — {f.origin.code} → {f.destination.code}
                                    </option>
                                ))}
                            </select>
                            {!form.flightId && (
                                <input
                                    placeholder="Or type flight number"
                                    value={form.flightNumber}
                                    onChange={e => setForm({...form, flightNumber: e.target.value.toUpperCase(), flightId: ''})}
                                    className="w-full h-10 px-5 bg-navy-50/50 rounded-xl font-bold text-xs text-navy-950 border-none mt-1"
                                />
                            )}
                        </div>
                        {/* Duty times */}
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest px-1">Duty Start</label>
                            <input type="time" value={form.dutyStart} onChange={e => setForm({...form, dutyStart: e.target.value})} className="w-full h-12 px-5 bg-navy-50 rounded-xl font-bold text-sm text-navy-950 border-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest px-1">Duty End</label>
                            <input type="time" value={form.dutyEnd} onChange={e => setForm({...form, dutyEnd: e.target.value})} className="w-full h-12 px-5 bg-navy-50 rounded-xl font-bold text-sm text-navy-950 border-none" />
                        </div>
                    </div>
                    {form.routeInfo && (
                        <p className="text-[10px] font-bold text-primary px-1"><span className="material-symbols-outlined text-xs align-middle">flight</span> Route: {form.routeInfo}</p>
                    )}
                    <div className="flex gap-3 justify-end">
                        <button onClick={resetForm} className="px-6 py-2.5 border border-navy-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-navy-500 hover:bg-navy-50 transition-all">Cancel</button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-8 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (<><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</>) : (editAssignment ? 'Save Changes' : 'Create Assignment')}
                        </button>
                    </div>
                </div>
            )}

            {/* Schedule Grid */}
            <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm overflow-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-10 bg-navy-50 px-6 py-4 text-left text-[10px] font-black text-navy-500 uppercase tracking-widest border-b border-navy-100 w-48 min-w-48">Crew Member</th>
                            {weekDates.map((date, i) => {
                                const isToday = date === new Date().toISOString().slice(0, 10);
                                return (
                                    <th key={date} className={`px-4 py-4 text-center text-[10px] font-black uppercase tracking-widest border-b border-l border-navy-100 min-w-32 ${isToday ? 'bg-primary/5 text-primary' : 'bg-navy-50 text-navy-500'}`}>
                                        {DAYS[i]}<br /><span className="text-[8px] text-navy-400">{date.slice(5)}</span>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {activeCrew.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-16 text-sm font-bold text-navy-300">No active crew members</td>
                            </tr>
                        ) : activeCrew.map(member => {
                            const meta = ROLE_META[member.role];
                            return (
                                <tr key={member.id} className="hover:bg-navy-50/20">
                                    <td className="sticky left-0 z-10 bg-white px-6 py-4 border-b border-navy-50">
                                        <div className="flex items-center gap-3">
                                            <div className={`size-8 rounded-lg flex items-center justify-center text-xs ${meta.color}`}>
                                                <span className="material-symbols-outlined text-sm">{meta.icon}</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-navy-950 tracking-tight truncate max-w-28">{member.name}</p>
                                                <p className="text-[8px] font-bold text-navy-400">{meta.label}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {weekDates.map(date => {
                                        const dayAssignments = getAssignmentsForCell(member.id, date);
                                        const isToday = date === new Date().toISOString().slice(0, 10);
                                        return (
                                            <td key={date} className={`px-2 py-2 border-b border-l border-navy-50 align-top ${isToday ? 'bg-primary/[0.02]' : ''}`}>
                                                {dayAssignments.map(a => (
                                                    <div key={a.id} className="mb-1 px-2 py-1.5 bg-primary/10 rounded-lg group relative cursor-pointer hover:bg-primary/20 transition-all" onClick={() => openEditAssignment(a)}>
                                                        <p className="text-[9px] font-black text-primary">{a.flightNumber}</p>
                                                        {a.routeInfo && <p className="text-[7px] font-bold text-primary/60">{a.routeInfo}</p>}
                                                        <p className="text-[7px] font-bold text-navy-400">{a.dutyStart}–{a.dutyEnd}</p>
                                                        <button
                                                            onClick={e => { e.stopPropagation(); setConfirmDelete(a); }}
                                                            className="absolute -top-1 -right-1 size-4 bg-red-500 text-white rounded-full text-[8px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                        >×</button>
                                                    </div>
                                                ))}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-navy-100 shadow-2xl w-full max-w-md p-8 space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center gap-4">
                            <div className="size-16 rounded-full bg-red-50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl text-red-500">event_busy</span>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-black text-navy-950 tracking-tight">Remove Assignment</h3>
                                <p className="text-sm text-navy-500">
                                    Remove <strong>{confirmDelete.crewMemberName}</strong>'s assignment for
                                    flight <strong>{confirmDelete.flightNumber}</strong> on <strong>{confirmDelete.date}</strong>?
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDelete(null)} className="flex-1 h-12 bg-white border border-navy-200 text-navy-700 font-black rounded-xl hover:bg-navy-50 transition-all">Cancel</button>
                            <button
                                onClick={handleRemoveConfirm}
                                disabled={deleting}
                                className="flex-1 h-12 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleting ? (<><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Removing…</>) : 'Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CrewScheduling;
