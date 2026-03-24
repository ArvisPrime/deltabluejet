import React, { useState, useEffect, useMemo } from 'react';
import { useToastStore } from '../../stores/toastStore';
import {
    subscribeToCrew, createCrewMember, updateCrewMember, deleteCrewMember,
    ROLE_META, type CrewMember, type CrewRole, type CrewStatus,
} from '../../services/crewService';
import { Timestamp } from 'firebase/firestore';
import { downloadCSV, printTable } from '../../utils/tableExport';

const ROLES: CrewRole[] = ['captain', 'first_officer', 'purser', 'cabin_crew', 'engineer'];
const STATUSES: CrewStatus[] = ['active', 'on_leave', 'training', 'inactive'];

const STATUS_COLORS: Record<CrewStatus, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    on_leave: 'bg-amber-50 text-amber-700 border-amber-100',
    training: 'bg-blue-50 text-blue-700 border-blue-100',
    inactive: 'bg-navy-50 text-navy-400 border-navy-100',
};

const EMPTY_FORM = {
    employeeId: '', name: '', role: 'cabin_crew' as CrewRole,
    status: 'active' as CrewStatus, qualifications: '',
    baseAirport: '', email: '', phone: '', totalFlightHours: 0,
};

const CrewManagement: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [crew, setCrew] = useState<CrewMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [filter, setFilter] = useState<CrewRole | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<CrewMember | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });

    // Real-time subscription
    useEffect(() => {
        const unsub = subscribeToCrew((data) => {
            setCrew(data);
            setLoading(false);
        });
        return unsub;
    }, []);

    // Filtered + searched crew
    const filtered = useMemo(() => {
        let result = crew;
        if (filter !== 'all') result = result.filter(c => c.role === filter);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.employeeId.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q) ||
                c.baseAirport?.toLowerCase().includes(q)
            );
        }
        return result;
    }, [crew, filter, searchQuery]);

    const activeCrew = crew.filter(c => c.status === 'active').length;

    // ── Export Handlers ─────────────────────────────────────
    const handleExportCSV = () => {
        const rows = filtered.map(m => ({
            'Employee ID': m.employeeId,
            'Name': m.name,
            'Role': ROLE_META[m.role].label,
            'Status': m.status.replace('_', ' '),
            'Base Airport': m.baseAirport || '',
            'Flight Hours': m.totalFlightHours || 0,
            'Email': m.email || '',
            'Phone': m.phone || '',
        }));
        downloadCSV(rows, 'crew_roster');
        addToast(`Exported ${rows.length} crew members`, 'success');
    };

    const handlePrint = () => {
        const tableRows = filtered.map(m =>
            `<tr>
                <td>${m.employeeId}</td>
                <td><strong>${m.name}</strong></td>
                <td>${ROLE_META[m.role].label}</td>
                <td><span class="badge badge-${m.status}">${m.status.replace('_', ' ')}</span></td>
                <td>${m.baseAirport || '—'}</td>
                <td>${(m.totalFlightHours || 0).toLocaleString()}h</td>
                <td>${m.email || '—'}</td>
                <td>${m.phone || '—'}</td>
            </tr>`
        ).join('');

        printTable('Crew Roster', `
            <table>
                <thead><tr>
                    <th>ID</th><th>Name</th><th>Role</th><th>Status</th>
                    <th>Base</th><th>Hours</th><th>Email</th><th>Phone</th>
                </tr></thead>
                <tbody>${tableRows}</tbody>
            </table>
            <div style="margin-top:12px;font-size:10px;color:#6b7280;">
                Total: ${filtered.length} crew members • ${activeCrew} active
            </div>
        `);
    };

    const openEditForm = (m: CrewMember) => {
        setEditId(m.id);
        setForm({
            employeeId: m.employeeId,
            name: m.name,
            role: m.role,
            status: m.status,
            qualifications: m.qualifications?.join(', ') || '',
            baseAirport: m.baseAirport || '',
            email: m.email || '',
            phone: m.phone || '',
            totalFlightHours: m.totalFlightHours || 0,
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setEditId(null);
        setForm({ ...EMPTY_FORM });
        setShowForm(false);
    };

    const handleSave = async () => {
        if (!form.name || !form.employeeId) { addToast('Name and Employee ID required', 'warning'); return; }
        setSaving(true);
        try {
            const payload = {
                ...form,
                qualifications: form.qualifications.split(',').map(s => s.trim()).filter(Boolean),
            };
            if (editId) {
                await updateCrewMember(editId, payload as any);
                addToast('Crew member updated', 'success');
            } else {
                await createCrewMember({ ...payload, hireDate: Timestamp.now() } as any);
                addToast('Crew member added', 'success');
            }
            resetForm();
        } catch (err) {
            console.error('Save crew error:', err);
            addToast('Failed to save crew member', 'error');
        } finally { setSaving(false); }
    };

    const handleStatusChange = async (member: CrewMember, status: CrewStatus) => {
        try {
            await updateCrewMember(member.id, { status });
            addToast(`${member.name} set to ${status.replace('_', ' ')}`, 'success');
        } catch (err) {
            console.error('Status change error:', err);
            addToast('Failed to change status', 'error');
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setDeleting(true);
        try {
            await deleteCrewMember(confirmDelete.id);
            addToast('Crew member removed', 'success');
        } catch (err) {
            console.error('Delete crew error:', err);
            addToast('Failed to delete crew member', 'error');
        } finally {
            setDeleting(false);
            setConfirmDelete(null);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in font-display">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Crew Management</h1>
                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-1">{activeCrew} active of {crew.length} total crew</p>
                </div>
            <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrint}
                        className="px-4 py-3 bg-navy-50 text-navy-600 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-navy-100 transition-all flex items-center gap-2"
                        title="Print to PDF"
                    >
                        <span className="material-symbols-outlined text-lg">print</span> Print
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-3 bg-navy-50 text-navy-600 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-navy-100 transition-all flex items-center gap-2"
                        title="Download CSV"
                    >
                        <span className="material-symbols-outlined text-lg">download</span> CSV
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowForm(!showForm); }}
                        className="px-6 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">person_add</span> Add Crew
                    </button>
                </div>
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

            {/* Search */}
            <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 text-sm">search</span>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name, ID, email, or base airport..."
                    className="w-full h-12 pl-11 pr-4 bg-white border border-navy-100 rounded-2xl text-sm font-medium text-navy-950 focus:ring-2 focus:ring-primary/20 outline-none"
                />
            </div>

            {/* Crew Form (Create / Edit) */}
            {showForm && (
                <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-lg p-8 space-y-6 animate-in slide-in-from-top duration-300">
                    <h3 className="text-sm font-black text-navy-950 uppercase">{editId ? 'Edit Crew Member' : 'New Crew Member'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <input placeholder="Employee ID" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} className="h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950" />
                        <input placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950" />
                        <select value={form.role} onChange={e => setForm({...form, role: e.target.value as CrewRole})} className="h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950">
                            {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
                        </select>
                        <select value={form.status} onChange={e => setForm({...form, status: e.target.value as CrewStatus})} className="h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950">
                            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                        </select>
                        <input placeholder="Base Airport (IATA)" value={form.baseAirport} onChange={e => setForm({...form, baseAirport: e.target.value.toUpperCase()})} maxLength={3} className="h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950" />
                        <input type="number" placeholder="Flight Hours" value={form.totalFlightHours || ''} onChange={e => setForm({...form, totalFlightHours: Number(e.target.value)})} className="h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950" />
                        <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950" />
                        <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950" />
                    </div>
                    <input placeholder="Qualifications (comma-separated)" value={form.qualifications} onChange={e => setForm({...form, qualifications: e.target.value})} className="w-full h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950" />
                    <div className="flex gap-3 justify-end">
                        <button onClick={resetForm} className="px-6 py-2.5 border border-navy-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-navy-500 hover:bg-navy-50 transition-all">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="px-8 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50 flex items-center gap-2">
                            {saving ? (<><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</>) : (editId ? 'Save Changes' : 'Add Crew Member')}
                        </button>
                    </div>
                </div>
            )}

            {/* Crew List */}
            <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="text-center py-20 space-y-3">
                        <span className="material-symbols-outlined text-5xl text-navy-200">group</span>
                        <p className="text-sm font-black text-navy-300 uppercase tracking-widest">No crew members {filter !== 'all' ? `with ${ROLE_META[filter].label} role` : (searchQuery ? 'matching search' : 'yet')}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-navy-50">
                        {filtered.map(m => {
                            const meta = ROLE_META[m.role];
                            return (
                                <div key={m.id} className="px-8 py-5 flex items-center justify-between hover:bg-navy-50/30 transition-all group">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${meta.color}`}>
                                            <span className="material-symbols-outlined text-xl">{meta.icon}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-black text-navy-950 tracking-tight truncate">{m.name}</p>
                                                <span className="text-[8px] font-bold text-navy-400 bg-navy-50 px-2 py-0.5 rounded-full shrink-0">{m.employeeId}</span>
                                            </div>
                                            <p className="text-[9px] font-bold text-navy-400 tracking-widest truncate">{meta.label} • {m.baseAirport || '—'} • {m.totalFlightHours?.toLocaleString() || 0}h total</p>
                                            {m.email && <p className="text-[8px] text-navy-300 truncate">{m.email}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <select
                                            value={m.status}
                                            onChange={e => handleStatusChange(m, e.target.value as CrewStatus)}
                                            className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border cursor-pointer ${STATUS_COLORS[m.status]}`}
                                        >
                                            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                                        </select>
                                        <button onClick={() => openEditForm(m)} className="p-2 hover:bg-blue-50 rounded-xl text-navy-300 hover:text-blue-600 transition-all" title="Edit">
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                        <button onClick={() => setConfirmDelete(m)} className="p-2 hover:bg-red-50 rounded-xl text-navy-300 hover:text-red-500 transition-all" title="Delete">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-navy-100 shadow-2xl w-full max-w-md p-8 space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center gap-4">
                            <div className="size-16 rounded-full bg-red-50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl text-red-500">person_remove</span>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-black text-navy-950 tracking-tight">Remove Crew Member</h3>
                                <p className="text-sm text-navy-500">
                                    Permanently remove <strong>{confirmDelete.name}</strong> ({confirmDelete.employeeId})?
                                    This will delete all their records.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDelete(null)} className="flex-1 h-12 bg-white border border-navy-200 text-navy-700 font-black rounded-xl hover:bg-navy-50 transition-all">Cancel</button>
                            <button
                                onClick={handleDelete}
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

export default CrewManagement;
