
import React, { useState, useEffect } from 'react';
import { BRAND } from '../../config/brand';
import { useCmsAboutStore } from '../../stores/cmsAboutStore';
import type { CmsAboutValueItem } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';

/* ── Icon Options ─────────────────────────────────────────── */
const ICON_OPTIONS = [
    'shield', 'eco', 'diversity_3', 'lightbulb', 'flight', 'public',
    'favorite', 'handshake', 'volunteer_activism', 'psychology', 'diamond',
    'speed', 'verified', 'workspace_premium', 'star', 'auto_awesome',
    'person', 'groups', 'schedule', 'flag', 'science',
];

const STAT_ICON_OPTIONS = ['public', 'flight', 'groups', 'schedule', 'trending_up', 'speed', 'star', 'verified'];

/* ═══════════════════════════════════════════════════════════════
   About Page Editor
   ═══════════════════════════════════════════════════════════════ */
const AboutValuesManagement: React.FC = () => {
    const store = useCmsAboutStore();
    const patch = useCmsAboutStore(s => s.patch);
    const subscribeStore = useCmsAboutStore(s => s.subscribe);
    const saveStore = useCmsAboutStore(s => s.save);
    const loaded = useCmsAboutStore(s => s.loaded);
    const dirty = useCmsAboutStore(s => s.dirty);

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeSection, setActiveSection] = useState<'hero' | 'stats' | 'mission' | 'values' | 'milestones' | 'leadership' | 'cta'>('hero');
    const [editIdx, setEditIdx] = useState<number | null>(null);

    /* ── Subscribe to real-time Firestore updates ──────────────── */
    useEffect(() => {
        const unsubscribe = subscribeStore();
        return unsubscribe;
    }, [subscribeStore]);

    /* ── Save all sections (persists store → Firestore) ────────── */
    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        const ok = await saveStore();
        if (ok) {
            setSaved(true);
            useToastStore.getState().addToast("About page saved successfully", "success");
            setTimeout(() => setSaved(false), 3000);
        } else {
            useToastStore.getState().addToast("Failed to save about page", "error");
        }
        setSaving(false);
    };

    /* ── Helpers (all write to the shared store) ───────────────── */
    const updateValue = (idx: number, field: keyof CmsAboutValueItem, val: string) => {
        patch({ values: store.values.map((v, i) => i === idx ? { ...v, [field]: val } : v) });
    };
    const addValue = () => {
        patch({ values: [...store.values, { icon: 'star', title: '', body: '' }] });
        setEditIdx(store.values.length);
    };
    const removeValue = (idx: number) => {
        patch({ values: store.values.filter((_, i) => i !== idx) });
        setEditIdx(null);
    };
    const moveValue = (idx: number, dir: -1 | 1) => {
        const target = idx + dir;
        if (target < 0 || target >= store.values.length) return;
        const next = [...store.values];
        [next[idx], next[target]] = [next[target], next[idx]];
        patch({ values: next });
        setEditIdx(target);
    };

    const SECTIONS = [
        { key: 'hero' as const, label: 'Hero', icon: 'image' },
        { key: 'stats' as const, label: 'Stats', icon: 'bar_chart' },
        { key: 'mission' as const, label: 'Mission', icon: 'flag' },
        { key: 'values' as const, label: 'Values', icon: 'favorite' },
        { key: 'milestones' as const, label: 'Timeline', icon: 'timeline' },
        { key: 'leadership' as const, label: 'Team', icon: 'groups' },
        { key: 'cta' as const, label: 'CTA', icon: 'ads_click' },
    ];

    if (!loaded) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-navy-950">About Page Editor</h1>
                    <p className="text-sm text-navy-500 mt-1">Edit all sections of the public About page.</p>
                </div>
                <div className="flex items-center gap-3">
                    {dirty && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 animate-in fade-in duration-200">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            Unsaved Changes
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 bg-primary text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-sm">{saving ? 'hourglass_top' : saved ? 'check_circle' : 'save'}</span>
                        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save All Sections'}
                    </button>
                </div>
            </div>

            {/* Section Tabs */}
            <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl border border-navy-100 shadow-sm">
                {SECTIONS.map(s => (
                    <button
                        key={s.key}
                        onClick={() => setActiveSection(s.key)}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === s.key ? 'bg-primary text-white shadow-md' : 'text-navy-400 hover:bg-navy-50'}`}
                    >
                        <span className="material-symbols-outlined text-sm">{s.icon}</span>
                        {s.label}
                    </button>
                ))}
            </div>

            {/* ═══ Hero Section ════════════════════════════════════════ */}
            {activeSection === 'hero' && (
                <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-5 shadow-sm animate-in fade-in duration-300">
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-navy-400 border-b border-navy-100 pb-3">Hero Section</h2>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Badge Text</label>
                            <input value={store.heroBadge} onChange={e => patch({ heroBadge: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="Our Story" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Page Heading</label>
                            <input value={store.heroHeading} onChange={e => patch({ heroHeading: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="About Deltablue" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Subtitle</label>
                            <textarea value={store.heroSubtitle} onChange={e => patch({ heroSubtitle: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm text-navy-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none" placeholder="Describe what makes you special…" />
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Stats Section ═══════════════════════════════════════ */}
            {activeSection === 'stats' && (
                <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-5 shadow-sm animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-navy-100 pb-3">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-navy-400">Stats Band ({store.stats.length} items)</h2>
                        <button onClick={() => patch({ stats: [...store.stats, { value: '', label: '', icon: 'star' }] })} className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors">
                            <span className="material-symbols-outlined text-sm">add_circle</span> Add Stat
                        </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {store.stats.map((s, i) => (
                            <div key={i} className="bg-navy-50/50 rounded-xl p-4 space-y-3 border border-navy-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Stat #{i + 1}</span>
                                    <button onClick={() => patch({ stats: store.stats.filter((_, j) => j !== i) })} className="p-1 rounded hover:bg-red-50 transition-colors"><span className="material-symbols-outlined text-sm text-red-400">delete</span></button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-navy-400">Value</label>
                                        <input value={s.value} onChange={e => patch({ stats: store.stats.map((x, j) => j === i ? { ...x, value: e.target.value } : x) })} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 outline-none" placeholder="120+" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-navy-400">Label</label>
                                        <input value={s.label} onChange={e => patch({ stats: store.stats.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 outline-none" placeholder="Destinations" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-navy-400">Icon</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {STAT_ICON_OPTIONS.map(icon => (
                                            <button key={icon} onClick={() => patch({ stats: store.stats.map((x, j) => j === i ? { ...x, icon } : x) })} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${s.icon === icon ? 'bg-primary text-white shadow-md' : 'bg-white text-navy-400 hover:bg-navy-100 border border-navy-100'}`}>
                                                <span className="material-symbols-outlined text-base">{icon}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ Mission Section ══════════════════════════════════════ */}
            {activeSection === 'mission' && (
                <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-5 shadow-sm animate-in fade-in duration-300">
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-navy-400 border-b border-navy-100 pb-3">Mission Section</h2>
                    <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Badge Text</label>
                                <input value={store.missionBadge} onChange={e => patch({ missionBadge: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="Our Mission" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Section Heading</label>
                                <input value={store.missionHeading} onChange={e => patch({ missionHeading: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="Connecting People, Bridging Worlds" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Paragraph 1</label>
                            <textarea value={store.missionParagraph1} onChange={e => patch({ missionParagraph1: e.target.value })} rows={4} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm text-navy-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none" placeholder="Describe your mission…" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Paragraph 2</label>
                            <textarea value={store.missionParagraph2} onChange={e => patch({ missionParagraph2: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm text-navy-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none" placeholder="Additional mission details…" />
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Values Section ═══════════════════════════════════════ */}
            {activeSection === 'values' && (
                <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-4 shadow-sm">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-navy-400 border-b border-navy-100 pb-3">Values Section Settings</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Section Label</label>
                                <input value={store.sectionLabel} onChange={e => patch({ sectionLabel: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="What Drives Us" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Section Title</label>
                                <input value={store.sectionTitle} onChange={e => patch({ sectionTitle: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="Our Values" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-navy-400">Value Cards ({store.values.length})</h2>
                            <button onClick={addValue} className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors">
                                <span className="material-symbols-outlined text-sm">add_circle</span> Add Value
                            </button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            {store.values.map((v, i) => (
                                <div key={i} className={`bg-white rounded-2xl border p-5 space-y-4 shadow-sm transition-all cursor-pointer ${editIdx === i ? 'border-primary ring-2 ring-primary/20' : 'border-navy-100 hover:border-navy-200'}`} onClick={() => setEditIdx(editIdx === i ? null : i)}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-xl text-primary">{v.icon}</span>
                                            </div>
                                            <div>
                                                <p className="font-black text-sm uppercase tracking-tight text-navy-950">{v.title || '(untitled)'}</p>
                                                <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">Card #{i + 1}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={e => { e.stopPropagation(); moveValue(i, -1); }} disabled={i === 0} className="p-1 rounded hover:bg-navy-50 disabled:opacity-20 transition-colors"><span className="material-symbols-outlined text-sm text-navy-400">arrow_upward</span></button>
                                            <button onClick={e => { e.stopPropagation(); moveValue(i, 1); }} disabled={i === store.values.length - 1} className="p-1 rounded hover:bg-navy-50 disabled:opacity-20 transition-colors"><span className="material-symbols-outlined text-sm text-navy-400">arrow_downward</span></button>
                                            <button onClick={e => { e.stopPropagation(); removeValue(i); }} className="p-1 rounded hover:bg-red-50 transition-colors"><span className="material-symbols-outlined text-sm text-red-400">delete</span></button>
                                        </div>
                                    </div>
                                    {editIdx === i && (
                                        <div className="space-y-4 pt-2 border-t border-navy-100" onClick={e => e.stopPropagation()}>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Icon</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {ICON_OPTIONS.map(icon => (
                                                        <button key={icon} onClick={() => updateValue(i, 'icon', icon)} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${v.icon === icon ? 'bg-primary text-white shadow-md' : 'bg-navy-50 text-navy-400 hover:bg-navy-100'}`}>
                                                            <span className="material-symbols-outlined text-lg">{icon}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Title</label>
                                                <input value={v.title} onChange={e => updateValue(i, 'title', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="Value title" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Description</label>
                                                <textarea value={v.body} onChange={e => updateValue(i, 'body', e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm text-navy-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none" placeholder="Describe this value…" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Milestones Section ═══════════════════════════════════ */}
            {activeSection === 'milestones' && (
                <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-5 shadow-sm animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-navy-100 pb-3">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-navy-400">Timeline ({store.milestones.length} entries)</h2>
                        <button onClick={() => patch({ milestones: [...store.milestones, { year: '', event: '' }] })} className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors">
                            <span className="material-symbols-outlined text-sm">add_circle</span> Add Entry
                        </button>
                    </div>
                    <div className="space-y-3">
                        {store.milestones.map((m, i) => (
                            <div key={i} className="bg-navy-50/50 rounded-xl p-4 border border-navy-100 flex gap-4 items-start">
                                <div className="shrink-0 space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-navy-400">Year</label>
                                    <input value={m.year} onChange={e => patch({ milestones: store.milestones.map((x, j) => j === i ? { ...x, year: e.target.value } : x) })} className="w-20 px-3 py-2 rounded-lg border border-navy-200 text-sm font-bold text-navy-950 text-center focus:ring-2 focus:ring-primary/30 outline-none" placeholder="2024" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-navy-400">Event Description</label>
                                    <textarea value={m.event} onChange={e => patch({ milestones: store.milestones.map((x, j) => j === i ? { ...x, event: e.target.value } : x) })} rows={2} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm text-navy-700 focus:ring-2 focus:ring-primary/30 outline-none resize-none" placeholder="Describe what happened…" />
                                </div>
                                <button onClick={() => patch({ milestones: store.milestones.filter((_, j) => j !== i) })} className="shrink-0 p-1.5 rounded hover:bg-red-50 transition-colors mt-5"><span className="material-symbols-outlined text-sm text-red-400">delete</span></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ Leadership Section ═══════════════════════════════════ */}
            {activeSection === 'leadership' && (
                <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-5 shadow-sm animate-in fade-in duration-300">
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-navy-400 border-b border-navy-100 pb-3">Leadership Section</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Badge Text</label>
                            <input value={store.leadersBadge} onChange={e => patch({ leadersBadge: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="The Team" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Section Title</label>
                            <input value={store.leadersTitle} onChange={e => patch({ leadersTitle: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="Leadership" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-navy-400">Team Members ({store.leaders.length})</h3>
                        <button onClick={() => patch({ leaders: [...store.leaders, { name: '', role: '', icon: 'person' }] })} className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors">
                            <span className="material-symbols-outlined text-sm">add_circle</span> Add Member
                        </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {store.leaders.map((l, i) => (
                            <div key={i} className="bg-navy-50/50 rounded-xl p-4 space-y-3 border border-navy-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Member #{i + 1}</span>
                                    <button onClick={() => patch({ leaders: store.leaders.filter((_, j) => j !== i) })} className="p-1 rounded hover:bg-red-50 transition-colors"><span className="material-symbols-outlined text-sm text-red-400">delete</span></button>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-navy-400">Name</label>
                                    <input value={l.name} onChange={e => patch({ leaders: store.leaders.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 outline-none" placeholder="Full name" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-navy-400">Role / Title</label>
                                    <input value={l.role} onChange={e => patch({ leaders: store.leaders.map((x, j) => j === i ? { ...x, role: e.target.value } : x) })} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 outline-none" placeholder="Chief Executive Officer" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ CTA Section ═════════════════════════════════════════ */}
            {activeSection === 'cta' && (
                <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-5 shadow-sm animate-in fade-in duration-300">
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-navy-400 border-b border-navy-100 pb-3">Call to Action Section</h2>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Heading</label>
                            <input value={store.ctaHeading} onChange={e => patch({ ctaHeading: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="Ready to Fly With Us?" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Description</label>
                            <textarea value={store.ctaDescription} onChange={e => patch({ ctaDescription: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm text-navy-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none" placeholder="Encourage visitors to book…" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Button Text</label>
                                <input value={store.ctaButtonText} onChange={e => patch({ ctaButtonText: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="Book Your Journey" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Button Link</label>
                                <input value={store.ctaButtonLink} onChange={e => patch({ ctaButtonLink: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="/book" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Live Preview Footer */}
            <div className="bg-navy-50 rounded-2xl border border-navy-100 p-6">
                <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest text-center">
                    <span className="material-symbols-outlined text-sm align-middle mr-1">visibility</span>
                    Changes are reflected <span className="text-primary">instantly</span> on the public <a href="/about" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">About page</a>. Click <strong>Save</strong> to persist to the database.
                </p>
            </div>
        </div>
    );
};

export default AboutValuesManagement;
