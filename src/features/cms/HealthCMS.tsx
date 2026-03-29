import React, { useState, useEffect, useMemo } from 'react';
import { subscribeToHealthReqs, createHealthReq, updateHealthReq, deleteHealthReq, seedHealthReqs, type HealthRequirement, type Vaccination } from '../../services/healthService';
import { useToastStore } from '../../stores/toastStore';

const REGION_OPTIONS = ['West Africa', 'Europe', 'North America', 'Middle East', 'Asia', 'Southern Africa', 'East Africa'];
const ADVISORY_OPTIONS: HealthRequirement['travelAdvisory'][] = ['none', 'caution', 'restricted'];

const emptyVax: Vaccination = { name: '', required: false, notes: '' };

const HealthCMS: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [data, setData] = useState<HealthRequirement[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<HealthRequirement | null>(null);
    const [form, setForm] = useState({
        destination: '', country: '', region: 'West Africa',
        vaccinations: [{ ...emptyVax }] as Vaccination[],
        covidPolicy: '', malariaRisk: false, malariaInfo: '',
        travelAdvisory: 'none' as HealthRequirement['travelAdvisory'],
        additionalNotes: '', active: true,
    });
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<HealthRequirement | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [seeding, setSeeding] = useState(false);

    useEffect(() => {
        const unsub = subscribeToHealthReqs(reqs => { setData(reqs); setLoading(false); });
        return unsub;
    }, []);

    const filtered = useMemo(() => {
        if (!search.trim()) return data;
        const q = search.toLowerCase();
        return data.filter(h => h.destination.toLowerCase().includes(q) || h.country.toLowerCase().includes(q));
    }, [data, search]);

    const openAdd = () => {
        setEditItem(null);
        setForm({ destination: '', country: '', region: 'West Africa', vaccinations: [{ ...emptyVax }], covidPolicy: '', malariaRisk: false, malariaInfo: '', travelAdvisory: 'none', additionalNotes: '', active: true });
        setShowModal(true);
    };
    const openEdit = (h: HealthRequirement) => {
        setEditItem(h);
        setForm({
            destination: h.destination, country: h.country, region: h.region,
            vaccinations: h.vaccinations.length ? [...h.vaccinations] : [{ ...emptyVax }],
            covidPolicy: h.covidPolicy, malariaRisk: h.malariaRisk, malariaInfo: h.malariaInfo,
            travelAdvisory: h.travelAdvisory, additionalNotes: h.additionalNotes, active: h.active,
        });
        setShowModal(true);
    };

    const addVax = () => setForm(f => ({ ...f, vaccinations: [...f.vaccinations, { ...emptyVax }] }));
    const updateVax = (idx: number, field: keyof Vaccination, value: string | boolean) => {
        setForm(f => {
            const v = [...f.vaccinations];
            (v[idx] as any)[field] = value;
            return { ...f, vaccinations: v };
        });
    };
    const removeVax = (idx: number) => setForm(f => ({ ...f, vaccinations: f.vaccinations.filter((_, i) => i !== idx) }));

    const handleSave = async () => {
        if (!form.destination.trim() || !form.country.trim()) { addToast('Destination code & country required', 'error'); return; }
        const cleanVax = form.vaccinations.filter(v => v.name.trim());
        setSaving(true);
        try {
            const payload = { ...form, vaccinations: cleanVax };
            if (editItem) { await updateHealthReq(editItem.id, payload); addToast('Updated', 'success'); }
            else { await createHealthReq(payload); addToast('Created', 'success'); }
            setShowModal(false);
        } catch { addToast('Save failed', 'error'); }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try { await deleteHealthReq(deleteTarget.id); addToast('Deleted', 'success'); }
        catch { addToast('Delete failed', 'error'); }
        setDeleting(false); setDeleteTarget(null);
    };

    const handleSeed = async () => {
        setSeeding(true);
        try { const c = await seedHealthReqs(); addToast(c > 0 ? `Seeded ${c} records` : 'Already seeded', c > 0 ? 'success' : 'info'); }
        catch { addToast('Seed failed', 'error'); }
        setSeeding(false);
    };

    const advColor = (a: string) => a === 'restricted' ? 'bg-red-50 text-red-700' : a === 'caution' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700';

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-emerald-600 to-green-700 p-8 shadow-2xl">
                <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
                <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/90 backdrop-blur">
                            <span className="material-symbols-outlined text-sm">health_and_safety</span>
                            Travel Health
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Health Requirements</h1>
                        <p className="mt-1 text-sm font-bold text-white/60 uppercase tracking-widest">Vaccination &amp; health data by destination</p>
                    </div>
                    <div className="flex gap-3">
                        {data.length === 0 && (
                            <button onClick={handleSeed} disabled={seeding}
                                className="flex items-center gap-2 rounded-2xl bg-white/20 backdrop-blur px-5 py-3 font-black text-[11px] uppercase tracking-widest text-white border border-white/20 hover:bg-white/30 disabled:opacity-50">
                                <span className="material-symbols-outlined text-sm">database</span>{seeding ? 'Seeding…' : 'Seed Defaults'}
                            </button>
                        )}
                        <button onClick={openAdd}
                            className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-black text-[11px] uppercase tracking-widest text-emerald-700 shadow-xl hover:scale-105 active:scale-95 transition-all">
                            <span className="material-symbols-outlined text-sm">add_circle</span>Add Destination
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                    { label: 'Destinations', value: data.length, icon: 'flight_takeoff', gradient: 'from-teal-500 to-emerald-600', shadow: 'shadow-teal-500/25' },
                    { label: 'Malaria Zones', value: data.filter(d => d.malariaRisk).length, icon: 'warning', gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/25' },
                    { label: 'Regions', value: new Set(data.map(d => d.region)).size, icon: 'public', gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
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

            {/* Search */}
            <div className="relative max-w-md">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 text-sm">search</span>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search destinations..."
                    className="h-11 w-full rounded-2xl border border-navy-100 bg-white pl-10 pr-4 text-sm font-medium text-navy-950 outline-none focus:ring-2 focus:ring-emerald-300" />
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-navy-100 bg-white p-16">
                    <div className="mb-4 size-10 animate-spin rounded-full border-[3px] border-emerald-200 border-t-emerald-600" />
                </div>
            ) : (
                <div className="overflow-hidden rounded-3xl border border-navy-100 bg-white shadow-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-navy-50 to-slate-50 border-b border-navy-100">
                                {['Code', 'Country', 'Region', 'Vaccines', 'Malaria', 'Advisory', ''].map(h => (
                                    <th key={h} className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-widest text-navy-400">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(h => (
                                <tr key={h.id} className="group border-b border-navy-50 hover:bg-navy-50/50 transition-all">
                                    <td className="px-5 py-4 text-sm font-black text-navy-900">{h.destination}</td>
                                    <td className="px-5 py-4 text-sm text-navy-700">{h.country}</td>
                                    <td className="px-5 py-4 text-xs text-navy-500">{h.region}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {h.vaccinations.filter(v => v.required).map(v => (
                                                <span key={v.name} className="text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{v.name}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        {h.malariaRisk ? <span className="text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">Yes</span>
                                            : <span className="text-[9px] font-black text-navy-300">No</span>}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${advColor(h.travelAdvisory)}`}>
                                            {h.travelAdvisory === 'none' ? 'Clear' : h.travelAdvisory}
                                        </span>
                                    </td>
                                    <td className="px-3 py-4">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEdit(h)} className="flex size-8 items-center justify-center rounded-lg text-navy-400 hover:bg-emerald-50 hover:text-emerald-600" title="Edit">
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                            <button onClick={() => setDeleteTarget(h)} className="flex size-8 items-center justify-center rounded-lg text-navy-400 hover:bg-red-50 hover:text-red-600" title="Delete">
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
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 rounded-3xl border border-navy-100 bg-white p-8 shadow-2xl custom-scrollbar" style={{ animation: 'modalSlideUp 0.3s ease-out' }}>
                        <h3 className="text-xl font-black tracking-tight text-navy-950">{editItem ? 'Edit Destination' : 'New Destination'}</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">IATA Code</label>
                                    <input type="text" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value.toUpperCase() }))} maxLength={3} placeholder="BJL"
                                        className="w-full h-11 px-4 rounded-xl border border-navy-100 bg-navy-50 text-sm font-bold text-navy-800 focus:ring-2 focus:ring-emerald-300 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Country</label>
                                    <input type="text" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="The Gambia"
                                        className="w-full h-11 px-4 rounded-xl border border-navy-100 bg-navy-50 text-sm font-bold text-navy-800 focus:ring-2 focus:ring-emerald-300 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Region</label>
                                    <select value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                                        className="w-full h-11 px-4 rounded-xl border border-navy-100 bg-navy-50 text-sm font-bold text-navy-800 focus:ring-2 focus:ring-emerald-300 outline-none">
                                        {REGION_OPTIONS.map(r => <option key={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Vaccinations */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Vaccinations</label>
                                    <button onClick={addVax} className="text-[10px] font-black text-emerald-600 hover:underline">+ Add Vaccine</button>
                                </div>
                                <div className="space-y-2">
                                    {form.vaccinations.map((v, i) => (
                                        <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-navy-50/50">
                                            <input type="text" value={v.name} onChange={e => updateVax(i, 'name', e.target.value)} placeholder="Vaccine name"
                                                className="flex-1 h-9 px-3 rounded-lg border border-navy-100 bg-white text-sm font-medium outline-none" />
                                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-navy-500 cursor-pointer whitespace-nowrap">
                                                <input type="checkbox" checked={v.required} onChange={e => updateVax(i, 'required', e.target.checked)}
                                                    className="size-4 rounded border-navy-200 text-red-500" />
                                                Required
                                            </label>
                                            <input type="text" value={v.notes} onChange={e => updateVax(i, 'notes', e.target.value)} placeholder="Notes"
                                                className="flex-1 h-9 px-3 rounded-lg border border-navy-100 bg-white text-sm font-medium outline-none" />
                                            <button onClick={() => removeVax(i)} className="text-navy-300 hover:text-red-500"><span className="material-symbols-outlined text-sm">close</span></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">COVID-19 Policy</label>
                                <textarea value={form.covidPolicy} onChange={e => setForm(f => ({ ...f, covidPolicy: e.target.value }))} rows={2}
                                    className="w-full px-4 py-3 rounded-xl border border-navy-100 bg-navy-50 text-sm font-medium text-navy-800 outline-none resize-none" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={form.malariaRisk} onChange={e => setForm(f => ({ ...f, malariaRisk: e.target.checked }))}
                                        className="size-5 rounded border-navy-200 text-amber-500" />
                                    <span className="text-sm font-bold text-navy-700">Malaria Risk Zone</span>
                                </label>
                                <div>
                                    <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Advisory</label>
                                    <select value={form.travelAdvisory} onChange={e => setForm(f => ({ ...f, travelAdvisory: e.target.value as any }))}
                                        className="w-full h-11 px-4 rounded-xl border border-navy-100 bg-navy-50 text-sm font-bold text-navy-800 outline-none">
                                        {ADVISORY_OPTIONS.map(a => <option key={a} value={a}>{a === 'none' ? 'None' : a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
                                    </select>
                                </div>
                            </div>

                            {form.malariaRisk && (
                                <div>
                                    <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Malaria Info</label>
                                    <textarea value={form.malariaInfo} onChange={e => setForm(f => ({ ...f, malariaInfo: e.target.value }))} rows={2}
                                        className="w-full px-4 py-3 rounded-xl border border-navy-100 bg-navy-50 text-sm font-medium text-navy-800 outline-none resize-none" />
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Additional Notes</label>
                                <textarea value={form.additionalNotes} onChange={e => setForm(f => ({ ...f, additionalNotes: e.target.value }))} rows={2}
                                    className="w-full px-4 py-3 rounded-xl border border-navy-100 bg-navy-50 text-sm font-medium text-navy-800 outline-none resize-none" />
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                                    className="size-5 rounded border-navy-200 text-emerald-600" />
                                <span className="text-sm font-bold text-navy-700">Active (visible on Health page)</span>
                            </label>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowModal(false)} className="h-12 flex-1 rounded-xl border border-navy-200 bg-white font-black text-navy-700 hover:bg-navy-50">Cancel</button>
                            <button onClick={handleSave} disabled={saving}
                                className="h-12 flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 font-black text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving ? <><div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Saving…</> : editItem ? 'Update' : 'Create'}
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
                                <h3 className="text-xl font-black tracking-tight text-navy-950">Delete Health Record</h3>
                                <p className="text-sm text-navy-500">Delete <strong>{deleteTarget.destination} — {deleteTarget.country}</strong>?</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="h-12 flex-1 rounded-xl border border-navy-200 bg-white font-black text-navy-700 hover:bg-navy-50">Cancel</button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="h-12 flex-1 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 font-black text-white shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                {deleting ? <><div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Deleting…</> : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HealthCMS;
