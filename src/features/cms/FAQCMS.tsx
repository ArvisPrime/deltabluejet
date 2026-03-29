import React, { useState, useEffect, useMemo } from 'react';
import { subscribeToFAQs, createFAQ, updateFAQ, deleteFAQ, seedFAQs, type FAQItem } from '../../services/faqService';
import { useToastStore } from '../../stores/toastStore';

const CATEGORY_OPTIONS = ['Booking', 'Baggage', 'Check-in', 'Loyalty', 'Payments', 'Disruptions', 'Special Services'];

const FAQCMS: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [faqs, setFaqs] = useState<FAQItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCat, setFilterCat] = useState('All');
    const [search, setSearch] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<FAQItem | null>(null);
    const [form, setForm] = useState({ question: '', answer: '', category: 'Booking', order: 0, active: true });
    const [saving, setSaving] = useState(false);

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState<FAQItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Seed state
    const [seeding, setSeeding] = useState(false);

    useEffect(() => {
        const unsub = subscribeToFAQs((data) => {
            setFaqs(data);
            setLoading(false);
        });
        return unsub;
    }, []);

    const categories = useMemo(() => {
        const cats = Array.from(new Set(faqs.map(f => f.category)));
        return ['All', ...cats.sort()];
    }, [faqs]);

    const filtered = useMemo(() => {
        let items = faqs;
        if (filterCat !== 'All') items = items.filter(f => f.category === filterCat);
        if (search.trim()) {
            const q = search.toLowerCase();
            items = items.filter(f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
        }
        return items;
    }, [faqs, filterCat, search]);

    const stats = useMemo(() => ({
        total: faqs.length,
        active: faqs.filter(f => f.active).length,
        categories: new Set(faqs.map(f => f.category)).size,
    }), [faqs]);

    const openAdd = () => {
        setEditItem(null);
        setForm({ question: '', answer: '', category: 'Booking', order: faqs.length + 1, active: true });
        setShowModal(true);
    };

    const openEdit = (faq: FAQItem) => {
        setEditItem(faq);
        setForm({ question: faq.question, answer: faq.answer, category: faq.category, order: faq.order, active: faq.active });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.question.trim() || !form.answer.trim()) {
            addToast('Question and answer are required', 'error');
            return;
        }
        setSaving(true);
        try {
            if (editItem) {
                await updateFAQ(editItem.id, form);
                addToast('FAQ updated', 'success');
            } else {
                await createFAQ(form);
                addToast('FAQ created', 'success');
            }
            setShowModal(false);
        } catch (err) {
            console.error('Save FAQ error:', err);
            addToast('Failed to save FAQ', 'error');
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteFAQ(deleteTarget.id);
            addToast('FAQ deleted', 'success');
        } catch {
            addToast('Failed to delete FAQ', 'error');
        }
        setDeleting(false);
        setDeleteTarget(null);
    };

    const handleSeed = async () => {
        setSeeding(true);
        try {
            const count = await seedFAQs();
            if (count > 0) {
                addToast(`Seeded ${count} FAQs`, 'success');
            } else {
                addToast('FAQs already seeded', 'info');
            }
        } catch {
            addToast('Failed to seed FAQs', 'error');
        }
        setSeeding(false);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-8 shadow-2xl">
                <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
                <div className="pointer-events-none absolute -left-16 bottom-0 size-56 rounded-full bg-sky-400/20 blur-2xl" />
                <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/90 backdrop-blur">
                            <span className="material-symbols-outlined text-sm">quiz</span>
                            Content Management
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-lg sm:text-5xl">FAQ Manager</h1>
                        <p className="mt-1 text-sm font-bold text-white/60 uppercase tracking-widest">
                            Help Center Questions &amp; Answers
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {faqs.length === 0 && (
                            <button
                                onClick={handleSeed}
                                disabled={seeding}
                                className="flex items-center gap-2 rounded-2xl bg-white/20 backdrop-blur px-5 py-3 font-black text-[11px] uppercase tracking-widest text-white border border-white/20 transition-all hover:bg-white/30 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-sm">database</span>
                                {seeding ? 'Seeding…' : 'Seed Default FAQs'}
                            </button>
                        )}
                        <button
                            onClick={openAdd}
                            className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-black text-[11px] uppercase tracking-widest text-blue-700 shadow-xl shadow-blue-900/30 transition-all hover:scale-105 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-sm">add_circle</span>
                            Add FAQ
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                    { label: 'Total FAQs', value: stats.total, icon: 'quiz', gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
                    { label: 'Active', value: stats.active, icon: 'check_circle', gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/25' },
                    { label: 'Categories', value: stats.categories, icon: 'category', gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25' },
                ].map(stat => (
                    <div key={stat.label} className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.gradient} p-5 shadow-lg ${stat.shadow} transition-all hover:-translate-y-1 hover:shadow-xl`}>
                        <div className="pointer-events-none absolute -right-4 -top-4 size-24 rounded-full bg-white/10 blur-xl transition-all group-hover:scale-150" />
                        <div className="relative flex items-center gap-4">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-inner">
                                <span className="material-symbols-outlined text-2xl text-white">{stat.icon}</span>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-white tracking-tight">{stat.value}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/70">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1 rounded-2xl bg-navy-50 p-1">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCat(cat)}
                            className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                                filterCat === cat
                                    ? 'bg-white text-navy-950 shadow-sm'
                                    : 'text-navy-400 hover:text-navy-700'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 min-w-[200px]">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 text-sm">search</span>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search FAQs..."
                        className="h-11 w-full rounded-2xl border border-navy-100 bg-white pl-10 pr-4 text-sm font-medium text-navy-950 outline-none focus:ring-2 focus:ring-blue-300"
                    />
                </div>
            </div>

            {/* FAQ Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-navy-100 bg-white p-16">
                    <div className="mb-4 size-10 animate-spin rounded-full border-[3px] border-blue-200 border-t-blue-600" />
                    <p className="text-xs font-bold text-navy-400">Loading FAQs...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-navy-100 bg-white p-16 text-center">
                    <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
                        <span className="material-symbols-outlined text-4xl text-blue-400">quiz</span>
                    </div>
                    <p className="text-sm font-bold text-navy-500">No FAQs found</p>
                    <p className="mt-1 text-xs text-navy-300">
                        {search ? 'Try a different search' : 'Add FAQs or seed defaults to get started'}
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-3xl border border-navy-100 bg-white shadow-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-navy-50 to-slate-50 border-b border-navy-100">
                                {['#', 'Question', 'Category', 'Status', ''].map(h => (
                                    <th key={h} className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-widest text-navy-400">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((faq) => (
                                <tr key={faq.id} className="group border-b border-navy-50 hover:bg-navy-50/50 transition-all">
                                    <td className="px-5 py-4 text-xs font-bold text-navy-400">{faq.order}</td>
                                    <td className="px-5 py-4">
                                        <p className="text-sm font-bold text-navy-900 truncate max-w-md">{faq.question}</p>
                                        <p className="text-[11px] text-navy-400 truncate max-w-md mt-0.5">{faq.answer}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-flex items-center rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-700">
                                            {faq.category}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest ${
                                            faq.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                        }`}>
                                            <span className={`size-1.5 rounded-full ${faq.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            {faq.active ? 'Active' : 'Hidden'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-4">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEdit(faq)}
                                                className="flex size-8 items-center justify-center rounded-lg text-navy-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                title="Edit"
                                            >
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(faq)}
                                                className="flex size-8 items-center justify-center rounded-lg text-navy-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                title="Delete"
                                            >
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

            {/* ─── Add/Edit Modal ────────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg space-y-6 rounded-3xl border border-navy-100 bg-white p-8 shadow-2xl" style={{ animation: 'modalSlideUp 0.3s ease-out' }}>
                        <h3 className="text-xl font-black tracking-tight text-navy-950">
                            {editItem ? 'Edit FAQ' : 'New FAQ'}
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Category</label>
                                    <select
                                        value={form.category}
                                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                        className="w-full h-11 px-4 rounded-xl border border-navy-100 bg-navy-50 text-sm font-bold text-navy-800 focus:ring-2 focus:ring-blue-300 outline-none"
                                    >
                                        {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Order</label>
                                    <input
                                        type="number"
                                        value={form.order}
                                        onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                                        className="w-full h-11 px-4 rounded-xl border border-navy-100 bg-navy-50 text-sm font-bold text-navy-800 focus:ring-2 focus:ring-blue-300 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Question</label>
                                <input
                                    type="text"
                                    value={form.question}
                                    onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                                    placeholder="Enter question..."
                                    className="w-full h-11 px-4 rounded-xl border border-navy-100 bg-navy-50 text-sm font-bold text-navy-800 focus:ring-2 focus:ring-blue-300 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Answer</label>
                                <textarea
                                    value={form.answer}
                                    onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                                    placeholder="Enter answer..."
                                    rows={5}
                                    className="w-full px-4 py-3 rounded-xl border border-navy-100 bg-navy-50 text-sm font-medium text-navy-800 focus:ring-2 focus:ring-blue-300 outline-none resize-none"
                                />
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.active}
                                    onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                                    className="size-5 rounded border-navy-200 text-blue-600 focus:ring-blue-300"
                                />
                                <span className="text-sm font-bold text-navy-700">Active (visible on Help Center)</span>
                            </label>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="h-12 flex-1 rounded-xl border border-navy-200 bg-white font-black text-navy-700 transition-all hover:bg-navy-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="h-12 flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 font-black text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <><div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Saving…</>
                                ) : (
                                    editItem ? 'Update FAQ' : 'Create FAQ'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Delete Confirmation ──────────────────────────── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md space-y-6 rounded-3xl border border-navy-100 bg-white p-8 shadow-2xl" style={{ animation: 'modalSlideUp 0.3s ease-out' }}>
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-rose-200">
                                <span className="material-symbols-outlined text-3xl text-red-500">delete_forever</span>
                            </div>
                            <div className="space-y-2 text-center">
                                <h3 className="text-xl font-black tracking-tight text-navy-950">Delete FAQ</h3>
                                <p className="text-sm text-navy-500">
                                    Delete <strong>"{deleteTarget.question}"</strong>? This cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="h-12 flex-1 rounded-xl border border-navy-200 bg-white font-black text-navy-700 transition-all hover:bg-navy-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="h-12 flex-1 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 font-black text-white shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <><div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Deleting…</>
                                ) : (
                                    'Delete FAQ'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FAQCMS;
