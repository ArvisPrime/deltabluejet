import React, { useState, useEffect } from 'react';
import { subscribeToLegalPages, updateLegalPage, seedLegalPages, type LegalPage, type LegalSection } from '../../services/legalPageService';
import { useToastStore } from '../../stores/toastStore';

const LegalCMS: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [pages, setPages] = useState<LegalPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);

    const [editPage, setEditPage] = useState<LegalPage | null>(null);
    const [editSection, setEditSection] = useState<{ pageId: string; section: LegalSection; idx: number } | null>(null);
    const [sectionForm, setSectionForm] = useState({ title: '', icon: '', contentText: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsub = subscribeToLegalPages(data => { setPages(data); setLoading(false); });
        return unsub;
    }, []);

    const handleSeed = async () => {
        setSeeding(true);
        try { const c = await seedLegalPages(); addToast(c > 0 ? `Seeded ${c} legal pages` : 'Already seeded', c > 0 ? 'success' : 'info'); }
        catch { addToast('Seed failed', 'error'); }
        setSeeding(false);
    };

    const openSection = (page: LegalPage, section: LegalSection, idx: number) => {
        setEditPage(page);
        setEditSection({ pageId: page.id, section, idx });
        setSectionForm({
            title: section.title,
            icon: section.icon,
            contentText: (section.content || []).join('\n\n'),
        });
    };

    const handleSaveSection = async () => {
        if (!editPage || !editSection) return;
        setSaving(true);
        try {
            const updatedSections = [...editPage.sections];
            updatedSections[editSection.idx] = {
                ...editSection.section,
                title: sectionForm.title,
                icon: sectionForm.icon,
                content: sectionForm.contentText.split('\n\n').filter(p => p.trim()),
            };
            await updateLegalPage(editPage.id, { sections: updatedSections } as any);
            addToast('Section updated', 'success');
            setEditSection(null);
        } catch { addToast('Save failed', 'error'); }
        setSaving(false);
    };

    const togglePageActive = async (page: LegalPage) => {
        try {
            await updateLegalPage(page.id, { active: !page.active } as any);
            addToast(`${page.title} ${page.active ? 'hidden' : 'published'}`, 'success');
        } catch { addToast('Toggle failed', 'error'); }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-pink-600 to-fuchsia-700 p-8 shadow-2xl">
                <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
                <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/90 backdrop-blur">
                            <span className="material-symbols-outlined text-sm">gavel</span>
                            Legal Content
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Legal Pages</h1>
                        <p className="mt-1 text-sm font-bold text-white/60 uppercase tracking-widest">Manage terms, privacy &amp; safety content</p>
                    </div>
                    {pages.length === 0 && (
                        <button onClick={handleSeed} disabled={seeding}
                            className="flex items-center gap-2 rounded-2xl bg-white/20 backdrop-blur px-5 py-3 font-black text-[11px] uppercase tracking-widest text-white border border-white/20 hover:bg-white/30 disabled:opacity-50">
                            <span className="material-symbols-outlined text-sm">database</span>{seeding ? 'Seeding…' : 'Seed Defaults'}
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                    { label: 'Pages', value: pages.length, icon: 'description', gradient: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/25' },
                    { label: 'Total Sections', value: pages.reduce((a, p) => a + p.sections.length, 0), icon: 'view_list', gradient: 'from-fuchsia-500 to-purple-600', shadow: 'shadow-fuchsia-500/25' },
                    { label: 'Published', value: pages.filter(p => p.active).length, icon: 'public', gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/25' },
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

            {loading ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-navy-100 bg-white p-16">
                    <div className="mb-4 size-10 animate-spin rounded-full border-[3px] border-rose-200 border-t-rose-600" />
                </div>
            ) : (
                <div className="space-y-6">
                    {pages.map(page => (
                        <div key={page.id} className="rounded-3xl border border-navy-100 bg-white shadow-sm overflow-hidden">
                            {/* Page Header */}
                            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-navy-50 to-slate-50 border-b border-navy-100">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary">{page.badgeIcon}</span>
                                    </div>
                                    <div>
                                        <h2 className="text-base font-black text-navy-950 tracking-tight">{page.title}</h2>
                                        <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">{page.sections.length} sections</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest ${page.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                        <span className={`size-1.5 rounded-full ${page.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                        {page.active ? 'Published' : 'Draft'}
                                    </span>
                                    <button onClick={() => togglePageActive(page)}
                                        className="flex size-8 items-center justify-center rounded-lg text-navy-400 hover:bg-navy-50 hover:text-navy-700" title="Toggle">
                                        <span className="material-symbols-outlined text-sm">{page.active ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                            </div>
                            {/* Sections */}
                            <div className="divide-y divide-navy-50">
                                {page.sections.map((section, idx) => (
                                    <div key={section.id} className="group flex items-center justify-between px-6 py-4 hover:bg-navy-50/30 transition-all">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-primary text-lg">{section.icon}</span>
                                            <span className="text-sm font-bold text-navy-800">{section.title}</span>
                                            <span className="text-[9px] font-bold text-navy-300">{(section.content || []).length} paragraphs</span>
                                        </div>
                                        <button onClick={() => openSection(page, section, idx)}
                                            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 text-[10px] font-black text-primary hover:underline transition-opacity">
                                            <span className="material-symbols-outlined text-sm">edit</span>Edit
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Section Editor Modal */}
            {editSection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 rounded-3xl border border-navy-100 bg-white p-8 shadow-2xl custom-scrollbar" style={{ animation: 'modalSlideUp 0.3s ease-out' }}>
                        <h3 className="text-xl font-black tracking-tight text-navy-950">Edit Section</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Title</label>
                                    <input type="text" value={sectionForm.title} onChange={e => setSectionForm(f => ({ ...f, title: e.target.value }))}
                                        className="w-full h-11 px-4 rounded-xl border border-navy-100 bg-navy-50 text-sm font-bold text-navy-800 focus:ring-2 focus:ring-rose-300 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Icon</label>
                                    <input type="text" value={sectionForm.icon} onChange={e => setSectionForm(f => ({ ...f, icon: e.target.value }))}
                                        className="w-full h-11 px-4 rounded-xl border border-navy-100 bg-navy-50 text-sm font-bold text-navy-800 focus:ring-2 focus:ring-rose-300 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Content (separate paragraphs with blank line)</label>
                                <textarea value={sectionForm.contentText} onChange={e => setSectionForm(f => ({ ...f, contentText: e.target.value }))} rows={12}
                                    className="w-full px-4 py-3 rounded-xl border border-navy-100 bg-navy-50 text-sm font-medium text-navy-800 outline-none resize-none leading-relaxed" />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setEditSection(null)} className="h-12 flex-1 rounded-xl border border-navy-200 bg-white font-black text-navy-700 hover:bg-navy-50">Cancel</button>
                            <button onClick={handleSaveSection} disabled={saving}
                                className="h-12 flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 font-black text-white shadow-lg shadow-rose-500/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving ? <><div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Saving…</> : 'Update Section'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LegalCMS;
