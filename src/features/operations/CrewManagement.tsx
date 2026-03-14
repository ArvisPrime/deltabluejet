import React, { useState, useEffect } from 'react';
import { useToastStore } from '../../stores/toastStore';
import {
    getAllCrew, createCrewMember, updateCrewMember, deleteCrewMember,
    ROLE_META, type CrewMember, type CrewRole, type CrewStatus,
} from '../../services/crewService';
import { Timestamp } from 'firebase/firestore';

const ROLES: CrewRole[] = ['captain', 'first_officer', 'purser', 'cabin_crew', 'engineer'];
const STATUSES: CrewStatus[] = ['active', 'on_leave', 'training', 'inactive'];

const STATUS_COLORS: Record<CrewStatus, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    on_leave: 'bg-amber-50 text-amber-700 border-amber-100',
    training: 'bg-blue-50 text-blue-700 border-blue-100',
    inactive: 'bg-navy-50 text-navy-400 border-navy-100',
};

const CrewManagement: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [crew, setCrew] = useState<CrewMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState<CrewRole | 'all'>('all');
    const [form, setForm] = useState({
        employeeId: '', name: '', role: 'cabin_crew' as CrewRole,
        status: 'active' as CrewStatus, qualifications: '',
        baseAirport: '', email: '', phone: '', totalFlightHours: 0,
    });

    const load = async () => {
        setLoading(true);
        try { setCrew(await getAllCrew()); } catch { /* */ }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async () => {
        if (!form.name || !form.employeeId) { addToast('Name and Employee ID required', 'warning'); return; }
        setSaving(true);
        try {
            await createCrewMember({
                ...form,
                qualifications: form.qualifications.split(',').map(s => s.trim()).filter(Boolean),
                hireDate: Timestamp.now(),
            } as any);
            addToast('Crew member added', 'success');
            setShowForm(false);
            setForm({ employeeId: '', name: '', role: 'cabin_crew', status: 'active', qualifications: '', baseAirport: '', email: '', phone: '', totalFlightHours: 0 });
            await load();
        } catch { addToast('Failed', 'error'); }
        finally { setSaving(false); }
    };

    const handleStatusChange = async (member: CrewMember, status: CrewStatus) => {
        await updateCrewMember(member.id, { status });
        addToast(`${member.name} set to ${status}`, 'success');
        await load();
    };

    const handleDelete = async (m: CrewMember) => {
        if (!confirm(`Remove "${m.name}"?`)) return;
        await deleteCrewMember(m.id);
        addToast('Crew member removed', 'success');
        await load();
    };

    const filtered = filter === 'all' ? crew : crew.filter(c => c.role === filter);
    const activeCrew = crew.filter(c => c.status === 'active').length;

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in font-display">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Crew Management</h1>
                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-1">{activeCrew} active of {crew.length} total crew</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="px-6 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">person_add</span> Add Crew
                </button>
            </div>

            {/* Role Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {ROLES.map(role => {
                    const meta = ROLE_META[role];
                    const count = crew.filter(c => c.role === role).length;
                    return (
                        <button key={role} onClick={() => setFilter(filter === role ? 'all' : role)} className={`p-5 rounded-[2rem] border transition-all text-left ${filter === role ? 'border-primary bg-primary/5 shadow-lg' : 'border-navy-100 bg-white hover:shadow-md'}`}>
                            <div className={`size-10 rounded-xl flex items-center justify-center ${meta.color} mb-3`}>
                                <span className="material-symbols-outlined">{meta.icon}</span>
                            </div>
                            <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest">{meta.label}</p>
                            <p className="text-2xl font-black text-navy-950 tracking-tighter">{count}</p>
                        </button>
                    );
                })}
            </div>

            {/* New Crew Form */}
            {showForm && (
                <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-lg p-8 space-y-6">
                    <h3 className="text-sm font-black text-navy-950 uppercase">New Crew Member</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <input placeholder="Employee ID" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} className="h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950" />
                        <input placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950" />
                        <select value={form.role} onChange={e => setForm({...form, role: e.target.value as CrewRole})} className="h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950">
                            {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
                        </select>
                        <input placeholder="Base Airport (IATA)" value={form.baseAirport} onChange={e => setForm({...form, baseAirport: e.target.value.toUpperCase()})} maxLength={3} className="h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950" />
                        <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950" />
                        <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950" />
                    </div>
                    <input placeholder="Qualifications (comma-separated)" value={form.qualifications} onChange={e => setForm({...form, qualifications: e.target.value})} className="w-full h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950" />
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-navy-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-navy-500">Cancel</button>
                        <button onClick={handleCreate} disabled={saving} className="px-8 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50">{saving ? 'Saving…' : 'Add Crew Member'}</button>
                    </div>
                </div>
            )}

            {/* Crew List */}
            <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="text-center py-20 space-y-3">
                        <span className="material-symbols-outlined text-5xl text-navy-200">group</span>
                        <p className="text-sm font-black text-navy-300 uppercase tracking-widest">No crew members {filter !== 'all' ? `with ${ROLE_META[filter].label} role` : 'yet'}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-navy-50">
                        {filtered.map(m => {
                            const meta = ROLE_META[m.role];
                            return (
                                <div key={m.id} className="px-8 py-5 flex items-center justify-between hover:bg-navy-50/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`size-12 rounded-2xl flex items-center justify-center ${meta.color}`}>
                                            <span className="material-symbols-outlined text-xl">{meta.icon}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-black text-navy-950 tracking-tight">{m.name}</p>
                                                <span className="text-[8px] font-bold text-navy-400 bg-navy-50 px-2 py-0.5 rounded-full">{m.employeeId}</span>
                                            </div>
                                            <p className="text-[9px] font-bold text-navy-400 tracking-widest">{meta.label} • {m.baseAirport} • {m.totalFlightHours?.toLocaleString() || 0}h total</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <select value={m.status} onChange={e => handleStatusChange(m, e.target.value as CrewStatus)} className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border cursor-pointer ${STATUS_COLORS[m.status]}`}>
                                            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                                        </select>
                                        <button onClick={() => handleDelete(m)} className="p-2 hover:bg-red-50 rounded-xl text-navy-300 hover:text-red-500 transition-all">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CrewManagement;
