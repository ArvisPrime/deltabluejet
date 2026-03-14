
import React, { useState, useEffect } from 'react';
import { BRAND } from '../../config/brand';
import { getAboutPageConfig, updateAboutPageConfig } from '../../services/cms';
import type { CmsAboutValueItem, CmsAboutStatItem, CmsAboutMilestoneItem, CmsAboutLeaderItem } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';

/* ── Icon Options ─────────────────────────────────────────── */
const ICON_OPTIONS = [
    'shield', 'eco', 'diversity_3', 'lightbulb', 'flight', 'public',
    'favorite', 'handshake', 'volunteer_activism', 'psychology', 'diamond',
    'speed', 'verified', 'workspace_premium', 'star', 'auto_awesome',
    'person', 'groups', 'schedule', 'flag', 'science',
];

const STAT_ICON_OPTIONS = ['public', 'flight', 'groups', 'schedule', 'trending_up', 'speed', 'star', 'verified'];

/* ── Defaults (from current frontend) ─────────────────────── */
const DEFAULT_VALUES: CmsAboutValueItem[] = [
    { icon: 'shield', title: 'Safety Without Compromise', body: 'Our foundation is built on rigorous international safety standards. We believe that peace of mind is the ultimate luxury in air travel.' },
    { icon: 'eco', title: 'Authentic Hospitality', body: "We don't just transport passengers; we host them. We bring the spirit of The Gambia to the skies, ensuring every guest feels the warmth of our culture from takeoff to landing." },
    { icon: 'diversity_3', title: 'Operational Agility', body: 'In a fast-moving world, we stay ahead through efficiency and innovation, ensuring our schedules are dependable and our services are accessible to all.' },
    { icon: 'lightbulb', title: 'Innovation', body: 'We leverage AI-driven scheduling, real-time disruption management, and a fully digital booking experience to keep you moving seamlessly.' },
];

const DEFAULT_STATS: CmsAboutStatItem[] = [
    { value: '120+', label: 'Destinations', icon: 'public' },
    { value: '85', label: 'Aircraft', icon: 'flight' },
    { value: '14M', label: 'Passengers/Year', icon: 'groups' },
    { value: '99.2%', label: 'On-time Rate', icon: 'schedule' },
];

const DEFAULT_MILESTONES: CmsAboutMilestoneItem[] = [
    { year: '2012', event: 'Founded in New York with 3 leased aircraft serving 8 domestic routes.' },
    { year: '2015', event: 'Expanded to transatlantic service — London, Paris, and Frankfurt added.' },
    { year: '2018', event: 'Fleet grows to 50 aircraft. Deltablue Club loyalty program launched.' },
    { year: '2021', event: 'Full digital transformation — app-based booking, AI disruption engine, and biometric check-in.' },
    { year: '2024', event: '120+ destinations across 6 continents. Named "Best Mid-Size Carrier" by Skyline Awards.' },
];

const DEFAULT_LEADERS: CmsAboutLeaderItem[] = [
    { name: 'Amara Okafor', role: 'Chief Executive Officer', icon: 'person' },
    { name: 'James Whitfield', role: 'Chief Operations Officer', icon: 'person' },
    { name: 'Lina Chen', role: 'Chief Technology Officer', icon: 'person' },
    { name: 'Marcus Rivera', role: 'VP of Customer Experience', icon: 'person' },
];

/* ═══════════════════════════════════════════════════════════════
   About Page Editor
   ═══════════════════════════════════════════════════════════════ */
const AboutValuesManagement: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeSection, setActiveSection] = useState<'hero' | 'stats' | 'mission' | 'values' | 'milestones' | 'leadership' | 'cta'>('hero');

    /* ── Hero ──────────────────────────────────────────────────── */
    const [heroBadge, setHeroBadge] = useState('Our Story');
    const [heroHeading, setHeroHeading] = useState(`About ${BRAND.shortName}`);
    const [heroSubtitle, setHeroSubtitle] = useState('Redefining aviation with precision, sustainability, and an unwavering commitment to every passenger who trusts us with their journey.');

    /* ── Stats ─────────────────────────────────────────────────── */
    const [stats, setStats] = useState<CmsAboutStatItem[]>(DEFAULT_STATS);

    /* ── Mission ───────────────────────────────────────────────── */
    const [missionBadge, setMissionBadge] = useState('Our Mission');
    const [missionHeading, setMissionHeading] = useState('Connecting People, Bridging Worlds');
    const [missionParagraph1, setMissionParagraph1] = useState(`${BRAND.name} to provide safe, affordable, and exceptional air travel that showcases the warmth of The Gambia. We are dedicated to bridging the gap between West Africa and the global community by investing in a modern fleet, empowering our local workforce, and delivering a travel experience rooted in reliability and 'Smiling Coast' hospitality.`);
    const [missionParagraph2, setMissionParagraph2] = useState("We don't just move passengers — we connect communities with precision, safety, and care at every step.");

    /* ── Values ─────────────────────────────────────────────────── */
    const [sectionLabel, setSectionLabel] = useState('What Drives Us');
    const [sectionTitle, setSectionTitle] = useState('Our Values');
    const [values, setValues] = useState<CmsAboutValueItem[]>(DEFAULT_VALUES);
    const [editIdx, setEditIdx] = useState<number | null>(null);

    /* ── Milestones ─────────────────────────────────────────────── */
    const [milestones, setMilestones] = useState<CmsAboutMilestoneItem[]>(DEFAULT_MILESTONES);

    /* ── Leadership ─────────────────────────────────────────────── */
    const [leadersBadge, setLeadersBadge] = useState('The Team');
    const [leadersTitle, setLeadersTitle] = useState('Leadership');
    const [leaders, setLeaders] = useState<CmsAboutLeaderItem[]>(DEFAULT_LEADERS);

    /* ── CTA ────────────────────────────────────────────────────── */
    const [ctaHeading, setCtaHeading] = useState('Ready to Fly With Us?');
    const [ctaDescription, setCtaDescription] = useState(`Join millions of travellers who trust ${BRAND.name} for seamless, sustainable, and inspired journeys across the globe.`);
    const [ctaButtonText, setCtaButtonText] = useState('Book Your Journey');
    const [ctaButtonLink, setCtaButtonLink] = useState('/book');

    /* ── Load from Firestore ───────────────────────────────────── */
    useEffect(() => {
        (async () => {
            try {
                const config = await getAboutPageConfig();
                if (config) {
                    if (config.heroBadge) setHeroBadge(config.heroBadge);
                    if (config.heroHeading) setHeroHeading(config.heroHeading);
                    if (config.heroSubtitle) setHeroSubtitle(config.heroSubtitle);
                    if (config.stats?.length) setStats(config.stats);
                    if (config.missionBadge) setMissionBadge(config.missionBadge);
                    if (config.missionHeading) setMissionHeading(config.missionHeading);
                    if (config.missionParagraph1) setMissionParagraph1(config.missionParagraph1);
                    if (config.missionParagraph2) setMissionParagraph2(config.missionParagraph2);
                    if (config.sectionLabel) setSectionLabel(config.sectionLabel);
                    if (config.sectionTitle) setSectionTitle(config.sectionTitle);
                    if (config.values?.length) setValues(config.values);
                    if (config.milestones?.length) setMilestones(config.milestones);
                    if (config.leadersBadge) setLeadersBadge(config.leadersBadge);
                    if (config.leadersTitle) setLeadersTitle(config.leadersTitle);
                    if (config.leaders?.length) setLeaders(config.leaders);
                    if (config.ctaHeading) setCtaHeading(config.ctaHeading);
                    if (config.ctaDescription) setCtaDescription(config.ctaDescription);
                    if (config.ctaButtonText) setCtaButtonText(config.ctaButtonText);
                    if (config.ctaButtonLink) setCtaButtonLink(config.ctaButtonLink);
                }
            } catch (err) {
                console.error('Failed to load about page config:', err);
                useToastStore.getState().addToast("Failed to load about page config", "error");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* ── Save all sections ─────────────────────────────────────── */
    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            await updateAboutPageConfig({
                heroBadge, heroHeading, heroSubtitle,
                stats,
                missionBadge, missionHeading, missionParagraph1, missionParagraph2,
                sectionLabel, sectionTitle, values,
                milestones,
                leadersBadge, leadersTitle, leaders,
                ctaHeading, ctaDescription, ctaButtonText, ctaButtonLink,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save about page:', err);
            useToastStore.getState().addToast("Failed to save about page", "error");
        } finally {
            setSaving(false);
        }
    };

    /* ── Helpers ────────────────────────────────────────────────── */
    const updateValue = (idx: number, field: keyof CmsAboutValueItem, val: string) => {
        setValues(prev => prev.map((v, i) => i === idx ? { ...v, [field]: val } : v));
    };
    const addValue = () => { setValues(prev => [...prev, { icon: 'star', title: '', body: '' }]); setEditIdx(values.length); };
    const removeValue = (idx: number) => { setValues(prev => prev.filter((_, i) => i !== idx)); setEditIdx(null); };
    const moveValue = (idx: number, dir: -1 | 1) => {
        const target = idx + dir;
        if (target < 0 || target >= values.length) return;
        setValues(prev => { const next = [...prev];[next[idx], next[target]] = [next[target], next[idx]]; return next; });
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

    if (loading) {
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
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-primary text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined text-sm">{saving ? 'hourglass_top' : saved ? 'check_circle' : 'save'}</span>
                    {saving ? 'Saving…' : saved ? 'Saved!' : 'Save All Sections'}
                </button>
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
                            <input value={heroBadge} onChange={e => setHeroBadge(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="Our Story" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Page Heading</label>
                            <input value={heroHeading} onChange={e => setHeroHeading(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="About Deltablue" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Subtitle</label>
                            <textarea value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm text-navy-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none" placeholder="Describe what makes you special…" />
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Stats Section ═══════════════════════════════════════ */}
            {activeSection === 'stats' && (
                <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-5 shadow-sm animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-navy-100 pb-3">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-navy-400">Stats Band ({stats.length} items)</h2>
                        <button onClick={() => setStats(prev => [...prev, { value: '', label: '', icon: 'star' }])} className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors">
                            <span className="material-symbols-outlined text-sm">add_circle</span> Add Stat
                        </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {stats.map((s, i) => (
                            <div key={i} className="bg-navy-50/50 rounded-xl p-4 space-y-3 border border-navy-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Stat #{i + 1}</span>
                                    <button onClick={() => setStats(prev => prev.filter((_, j) => j !== i))} className="p-1 rounded hover:bg-red-50 transition-colors"><span className="material-symbols-outlined text-sm text-red-400">delete</span></button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-navy-400">Value</label>
                                        <input value={s.value} onChange={e => setStats(prev => prev.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 outline-none" placeholder="120+" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-navy-400">Label</label>
                                        <input value={s.label} onChange={e => setStats(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 outline-none" placeholder="Destinations" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-navy-400">Icon</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {STAT_ICON_OPTIONS.map(icon => (
                                            <button key={icon} onClick={() => setStats(prev => prev.map((x, j) => j === i ? { ...x, icon } : x))} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${s.icon === icon ? 'bg-primary text-white shadow-md' : 'bg-white text-navy-400 hover:bg-navy-100 border border-navy-100'}`}>
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
                                <input value={missionBadge} onChange={e => setMissionBadge(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="Our Mission" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Section Heading</label>
                                <input value={missionHeading} onChange={e => setMissionHeading(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="Connecting People, Bridging Worlds" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Paragraph 1</label>
                            <textarea value={missionParagraph1} onChange={e => setMissionParagraph1(e.target.value)} rows={4} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm text-navy-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none" placeholder="Describe your mission…" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Paragraph 2</label>
                            <textarea value={missionParagraph2} onChange={e => setMissionParagraph2(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm text-navy-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none" placeholder="Additional mission details…" />
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
                                <input value={sectionLabel} onChange={e => setSectionLabel(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="What Drives Us" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Section Title</label>
                                <input value={sectionTitle} onChange={e => setSectionTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="Our Values" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-navy-400">Value Cards ({values.length})</h2>
                            <button onClick={addValue} className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors">
                                <span className="material-symbols-outlined text-sm">add_circle</span> Add Value
                            </button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            {values.map((v, i) => (
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
                                            <button onClick={e => { e.stopPropagation(); moveValue(i, 1); }} disabled={i === values.length - 1} className="p-1 rounded hover:bg-navy-50 disabled:opacity-20 transition-colors"><span className="material-symbols-outlined text-sm text-navy-400">arrow_downward</span></button>
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
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-navy-400">Timeline ({milestones.length} entries)</h2>
                        <button onClick={() => setMilestones(prev => [...prev, { year: '', event: '' }])} className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors">
                            <span className="material-symbols-outlined text-sm">add_circle</span> Add Entry
                        </button>
                    </div>
                    <div className="space-y-3">
                        {milestones.map((m, i) => (
                            <div key={i} className="bg-navy-50/50 rounded-xl p-4 border border-navy-100 flex gap-4 items-start">
                                <div className="shrink-0 space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-navy-400">Year</label>
                                    <input value={m.year} onChange={e => setMilestones(prev => prev.map((x, j) => j === i ? { ...x, year: e.target.value } : x))} className="w-20 px-3 py-2 rounded-lg border border-navy-200 text-sm font-bold text-navy-950 text-center focus:ring-2 focus:ring-primary/30 outline-none" placeholder="2024" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-navy-400">Event Description</label>
                                    <textarea value={m.event} onChange={e => setMilestones(prev => prev.map((x, j) => j === i ? { ...x, event: e.target.value } : x))} rows={2} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm text-navy-700 focus:ring-2 focus:ring-primary/30 outline-none resize-none" placeholder="Describe what happened…" />
                                </div>
                                <button onClick={() => setMilestones(prev => prev.filter((_, j) => j !== i))} className="shrink-0 p-1.5 rounded hover:bg-red-50 transition-colors mt-5"><span className="material-symbols-outlined text-sm text-red-400">delete</span></button>
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
                            <input value={leadersBadge} onChange={e => setLeadersBadge(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="The Team" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Section Title</label>
                            <input value={leadersTitle} onChange={e => setLeadersTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="Leadership" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-navy-400">Team Members ({leaders.length})</h3>
                        <button onClick={() => setLeaders(prev => [...prev, { name: '', role: '', icon: 'person' }])} className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors">
                            <span className="material-symbols-outlined text-sm">add_circle</span> Add Member
                        </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {leaders.map((l, i) => (
                            <div key={i} className="bg-navy-50/50 rounded-xl p-4 space-y-3 border border-navy-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Member #{i + 1}</span>
                                    <button onClick={() => setLeaders(prev => prev.filter((_, j) => j !== i))} className="p-1 rounded hover:bg-red-50 transition-colors"><span className="material-symbols-outlined text-sm text-red-400">delete</span></button>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-navy-400">Name</label>
                                    <input value={l.name} onChange={e => setLeaders(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 outline-none" placeholder="Full name" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-navy-400">Role / Title</label>
                                    <input value={l.role} onChange={e => setLeaders(prev => prev.map((x, j) => j === i ? { ...x, role: e.target.value } : x))} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 outline-none" placeholder="Chief Executive Officer" />
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
                            <input value={ctaHeading} onChange={e => setCtaHeading(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="Ready to Fly With Us?" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Description</label>
                            <textarea value={ctaDescription} onChange={e => setCtaDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm text-navy-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none" placeholder="Encourage visitors to book…" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Button Text</label>
                                <input value={ctaButtonText} onChange={e => setCtaButtonText(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="Book Your Journey" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-navy-500">Button Link</label>
                                <input value={ctaButtonLink} onChange={e => setCtaButtonLink(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" placeholder="/book" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Live Preview Footer */}
            <div className="bg-navy-50 rounded-2xl border border-navy-100 p-6">
                <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest text-center">
                    <span className="material-symbols-outlined text-sm align-middle mr-1">visibility</span>
                    Preview changes on the public <a href="/about" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">About page</a> after saving.
                </p>
            </div>
        </div>
    );
};

export default AboutValuesManagement;
