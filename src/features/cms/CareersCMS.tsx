import React, { useState, useEffect, useMemo } from 'react';
import { subscribeToJobs, createJob, updateJob, deleteJob, seedJobs, type JobListing } from '../../services/careerService';
import { useToastStore } from '../../stores/toastStore';

const DEPT_OPTIONS = ['Flight Operations', 'In-Flight Services', 'Engineering', 'Airport Services', 'Commercial', 'Customer Experience', 'Technology', 'Safety', 'Corporate'];
const TYPE_OPTIONS = ['Full-time', 'Part-time', 'Contract', 'Internship'];

const CareersCMS: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [jobs, setJobs] = useState<JobListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterDept, setFilterDept] = useState('All');
    const [search, setSearch] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<JobListing | null>(null);
    const [form, setForm] = useState({ title: '', department: 'Flight Operations', location: '', type: 'Full-time', icon: 'work', order: 0, active: true });
    const [saving, setSaving] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<JobListing | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [seeding, setSeeding] = useState(false);

    useEffect(() => {
        const unsub = subscribeToJobs(data => { setJobs(data); setLoading(false); });
        return unsub;
    }, []);

    const depts = useMemo(() => ['All', ...Array.from(new Set(jobs.map(j => j.department))).sort()], [jobs]);

    const filtered = useMemo(() => {
        let items = jobs;
        if (filterDept !== 'All') items = items.filter(j => j.department === filterDept);
        if (search.trim()) {
            const q = search.toLowerCase();
            items = items.filter(j => j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q));
        }
        return items;
    }, [jobs, filterDept, search]);

    const openAdd = () => { setEditItem(null); setForm({ title: '', department: 'Flight Operations', location: '', type: 'Full-time', icon: 'work', order: jobs.length + 1, active: true }); setShowModal(true); };
    const openEdit = (j: JobListing) => { setEditItem(j); setForm({ title: j.title, department: j.department, location: j.location, type: j.type, icon: j.icon, order: j.order, active: j.active }); setShowModal(true); };

    const handleSave = async () => {
        if (!form.title.trim() || !form.location.trim()) { addToast('Title & location required', 'error'); return; }
        setSaving(true);
        try {
            if (editItem) { await updateJob(editItem.id, form); addToast('Job updated', 'success'); }
            else { await createJob(form); addToast('Job created', 'success'); }
            setShowModal(false);
        } catch { addToast('Failed to save', 'error'); }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try { await deleteJob(deleteTarget.id); addToast('Job deleted', 'success'); }
        catch { addToast('Failed to delete', 'error'); }
        setDeleting(false); setDeleteTarget(null);
    };

    const handleSeed = async () => {
        setSeeding(true);
        try { const c = await seedJobs(); addToast(c > 0 ? `Seeded ${c} jobs` : 'Already seeded', c > 0 ? 'success' : 'info'); }
        catch { addToast('Seed failed', 'error'); }
        setSeeding(false);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 shadow-2xl">
                <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
                <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/90 backdrop-blur">
                            <span className="material-symbols-outlined text-sm">work</span>
                            Careers Management
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Job Listings</h1>
                        <p className="mt-1 text-sm font-bold text-white/60 uppercase tracking-widest">Manage open positions</p>
                    </div>
                    <div className="flex gap-3">
                        {jobs.length === 0 && (
                            <button onClick={handleSeed} disabled={seeding}
                                className="flex items-center gap-2 rounded-2xl bg-white/20 backdrop-blur px-5 py-3 font-black text-[11px] uppercase tracking-widest text-white border border-white/20 hover:bg-white/30 disabled:opacity-50">
                                <span className="material-symbols-outlined text-sm">database</span>
                                {seeding ? 'Seeding…' : 'Seed Defaults'}
                            </button>
                        )}
                        <button onClick={openAdd}
                            className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-black text-[11px] uppercase tracking-widest text-purple-700 shadow-xl hover:scale-105 active:scale-95 transition-all">
                            <span className="material-symbols-outlined text-sm">add_circle</span>Add Job
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                    { label: 'Total Jobs', value: jobs.length, icon: 'work', gradient: 'from-purple-500 to-violet-600', shadow: 'shadow-purple-500/25' },
                    { label: 'Active', value: jobs.filter(j => j.active).length, icon: 'check_circle', gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/25' },
                    { label: 'Departments', value: new Set(jobs.map(j => j.department)).size, icon: 'category', gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/25' },
                ].map(s => (
                    <div key={s.label} className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.gradient} p-5 shadow-lg ${s.shadow} hover:-translate-y-1 hover:shadow-xl transition-all`}>
                        <div className="relative flex items-center gap-4">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                                <span className="material-symbols-outlined text-2xl text-white">{s.icon}</span>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-white tracking-tight">{s.value}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/70">{s.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1 rounded-2xl bg-navy-50 p-1 overflow-x-auto">
                    {depts.map(d => (
                        <button key={d} onClick={() => setFilterDept(d)}
                            className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterDept === d ? 'bg-white text-navy-950 shadow-sm' : 'text-navy-400 hover:text-navy-700'}`}>
                            {d}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 min-w-[200px]">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 text-sm">search</span>
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs..."
                        className="h-11 w-full rounded-2xl border border-navy-100 bg-white pl-10 pr-4 text-sm font-medium text-navy-950 outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-navy-100 bg-white p-16">
                    <div className="mb-4 size-10 animate-spin rounded-full border-[3px] border-purple-200 border-t-purple-600" />
                    <p className="text-xs font-bold text-navy-400">Loading jobs...</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-3xl border border-navy-100 bg-white shadow-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-navy-50 to-slate-50 border-b border-navy-100">
                                {['Title', 'Department', 'Location', 'Type', 'Status', ''].map(h => (
                                    <th key={h} className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-widest text-navy-400">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(job => (
                                <tr key={job.id} className="group border-b border-navy-50 hover:bg-navy-50/50 transition-all">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-primary">{job.icon}</span>
                                            <span className="text-sm font-bold text-navy-900">{job.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4"><span className="text-[9px] font-black uppercase tracking-widest bg-purple-50 text-purple-700 px-3 py-1 rounded-full">{job.department}</span></td>
                                    <td className="px-5 py-4 text-xs text-navy-500">{job.location}</td>
                                    <td className="px-5 py-4 text-xs text-navy-500">{job.type}</td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest ${job.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                            <span className={`size-1.5 rounded-full ${job.active ? 'bg-emerald-500' : 'bg-red-500'}`} />{job.active ? 'Active' : 'Hidden'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-4">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEdit(job)} className="flex size-8 items-center justify-center rounded-lg text-navy-400 hover:bg-purple-50 hover:text-purple-600" title="Edit">
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                            <button onClick={() => setDeleteTarget(job)} className="flex size-8 items-center justify-center rounded-lg text-navy-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg space-y-6 rounded-3xl border border-navy-100 bg-white p-8 shadow-2xl" style={{ animation: 'modalSlideUp 0.3s ease-out' }}>
                        <h3 className="text-xl font-black tracking-tight text-navy-950">{editItem ? 'Edit Job' : 'New Job'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Title</label>
                                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Job title..."
                                    className="w-full h-11 px-4 rounded-xl border border-navy-100 bg-navy-50 text-sm font-bold text-navy-800 focus:ring-2 focus:ring-purple-300 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Department</label>
                                    <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                                        className="w-full h-11 px-4 rounded-xl border border-navy-100 bg-navy-50 text-sm font-bold text-navy-800 focus:ring-2 focus:ring-purple-300 outline-none">
                                        {DEPT_OPTIONS.map(d => <option key={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Type</label>
                                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                        className="w-full h-11 px-4 rounded-xl border border-navy-100 bg-navy-50 text-sm font-bold text-navy-800 focus:ring-2 focus:ring-purple-300 outline-none">
                                        {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Location</label>
                                    <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Remote / Banjul"
                                        className="w-full h-11 px-4 rounded-xl border border-navy-100 bg-navy-50 text-sm font-bold text-navy-800 focus:ring-2 focus:ring-purple-300 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Icon</label>
                                    <input type="text" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="Material icon name"
                                        className="w-full h-11 px-4 rounded-xl border border-navy-100 bg-navy-50 text-sm font-bold text-navy-800 focus:ring-2 focus:ring-purple-300 outline-none" />
                                </div>
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                                    className="size-5 rounded border-navy-200 text-purple-600 focus:ring-purple-300" />
                                <span className="text-sm font-bold text-navy-700">Active (visible on Careers page)</span>
                            </label>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowModal(false)} className="h-12 flex-1 rounded-xl border border-navy-200 bg-white font-black text-navy-700 hover:bg-navy-50">Cancel</button>
                            <button onClick={handleSave} disabled={saving}
                                className="h-12 flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 font-black text-white shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving ? <><div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Saving…</> : editItem ? 'Update Job' : 'Create Job'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md space-y-6 rounded-3xl border border-navy-100 bg-white p-8 shadow-2xl" style={{ animation: 'modalSlideUp 0.3s ease-out' }}>
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-rose-200">
                                <span className="material-symbols-outlined text-3xl text-red-500">delete_forever</span>
                            </div>
                            <div className="space-y-2 text-center">
                                <h3 className="text-xl font-black tracking-tight text-navy-950">Delete Job</h3>
                                <p className="text-sm text-navy-500">Delete <strong>"{deleteTarget.title}"</strong>? This cannot be undone.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="h-12 flex-1 rounded-xl border border-navy-200 bg-white font-black text-navy-700 hover:bg-navy-50">Cancel</button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="h-12 flex-1 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 font-black text-white shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                {deleting ? <><div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Deleting…</> : 'Delete Job'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CareersCMS;
