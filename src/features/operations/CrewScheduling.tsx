import React, { useState, useEffect } from 'react';
import { useToastStore } from '../../stores/toastStore';
import {
    getAllCrew,
    getAssignments,
    createAssignment,
    deleteAssignment,
    ROLE_META,
    type CrewMember,
    type CrewAssignment,
    type CrewRole,
} from '../../services/crewService';

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

const CrewScheduling: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [crew, setCrew] = useState<CrewMember[]>([]);
    const [assignments, setAssignments] = useState<CrewAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [weekOffset, setWeekOffset] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        crewMemberId: '', flightNumber: '', date: '', dutyStart: '06:00', dutyEnd: '14:00',
    });

    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);
    const weekDates = getWeekDates(baseDate);

    const load = async () => {
        setLoading(true);
        try {
            const [c, a] = await Promise.all([getAllCrew(), getAssignments()]);
            setCrew(c.filter(m => m.status === 'active'));
            setAssignments(a);
        } catch { /* */ }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleAssign = async () => {
        if (!form.crewMemberId || !form.flightNumber || !form.date) {
            addToast('All fields required', 'warning'); return;
        }
        setSaving(true);
        try {
            const member = crew.find(c => c.id === form.crewMemberId);
            const result = await createAssignment({
                ...form,
                crewMemberName: member?.name || '',
                crewRole: member?.role || 'cabin_crew',
                status: 'scheduled',
            });
            if (!result.fatigueCheck.passed) {
                addToast(`⚠ Fatigue Warning: ${result.fatigueCheck.violations.join(', ')}`, 'warning');
            } else {
                addToast('Assignment created', 'success');
            }
            setShowForm(false);
            setForm({ crewMemberId: '', flightNumber: '', date: '', dutyStart: '06:00', dutyEnd: '14:00' });
            await load();
        } catch { addToast('Failed', 'error'); }
        finally { setSaving(false); }
    };

    const handleRemove = async (id: string) => {
        await deleteAssignment(id);
        addToast('Assignment removed', 'success');
        await load();
    };

    const getAssignmentsForCell = (crewId: string, date: string) =>
        assignments.filter(a => a.crewMemberId === crewId && a.date === date);

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
        </div>
    );

    return (
        <div className="p-8 max-w-full mx-auto space-y-8 animate-in fade-in font-display">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Crew Scheduling</h1>
                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-1">Weekly view • {weekDates[0]} to {weekDates[6]}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setWeekOffset(w => w - 1)} className="size-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-600 hover:bg-navy-100">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button onClick={() => setWeekOffset(0)} className="px-4 py-2 bg-navy-50 rounded-xl text-[10px] font-black text-navy-500 uppercase tracking-widest hover:bg-navy-100">Today</button>
                    <button onClick={() => setWeekOffset(w => w + 1)} className="size-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-600 hover:bg-navy-100">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="px-6 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">add</span> Assign
                    </button>
                </div>
            </div>

            {/* Assignment Form */}
            {showForm && (
                <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-lg p-8 space-y-5">
                    <h3 className="text-sm font-black text-navy-950 uppercase">New Assignment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <select value={form.crewMemberId} onChange={e => setForm({...form, crewMemberId: e.target.value})} className="h-12 px-5 bg-navy-50 rounded-xl font-bold text-sm text-navy-950 border-none">
                            <option value="">Select Crew Member</option>
                            {crew.map(c => <option key={c.id} value={c.id}>{c.name} ({ROLE_META[c.role].label})</option>)}
                        </select>
                        <input placeholder="Flight Number" value={form.flightNumber} onChange={e => setForm({...form, flightNumber: e.target.value.toUpperCase()})} className="h-12 px-5 bg-navy-50 rounded-xl font-bold text-sm text-navy-950 border-none" />
                        <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="h-12 px-5 bg-navy-50 rounded-xl font-bold text-sm text-navy-950 border-none" />
                        <input type="time" value={form.dutyStart} onChange={e => setForm({...form, dutyStart: e.target.value})} className="h-12 px-5 bg-navy-50 rounded-xl font-bold text-sm text-navy-950 border-none" />
                        <input type="time" value={form.dutyEnd} onChange={e => setForm({...form, dutyEnd: e.target.value})} className="h-12 px-5 bg-navy-50 rounded-xl font-bold text-sm text-navy-950 border-none" />
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-navy-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-navy-500">Cancel</button>
                        <button onClick={handleAssign} disabled={saving} className="px-8 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50">{saving ? 'Saving…' : 'Create Assignment'}</button>
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
                        {crew.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-16 text-sm font-bold text-navy-300">No active crew members</td>
                            </tr>
                        ) : crew.map(member => {
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
                                                    <div key={a.id} className="mb-1 px-2 py-1.5 bg-primary/10 rounded-lg group relative">
                                                        <p className="text-[9px] font-black text-primary">{a.flightNumber}</p>
                                                        <p className="text-[7px] font-bold text-navy-400">{a.dutyStart}–{a.dutyEnd}</p>
                                                        <button onClick={() => handleRemove(a.id)} className="absolute -top-1 -right-1 size-4 bg-red-500 text-white rounded-full text-[8px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">×</button>
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
        </div>
    );
};

export default CrewScheduling;
