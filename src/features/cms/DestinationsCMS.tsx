import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../../config/routes';
import { getDestinationsConfig, updateDestinationConfig, updateDestinationsPageContent, uploadDestinationImage } from '../../services/cms';
import { DESTINATION_HUBS } from '../../data/destinationHubs';
import { BRAND } from '../../config/brand';
import type { CmsDestinationDoc, CmsDestinationsConfigDoc } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';

/* ── Default CMS data seeded from hardcoded hubs ────────────── */
const buildDefaults = (): Record<string, CmsDestinationDoc> => {
    const map: Record<string, CmsDestinationDoc> = {};
    for (const h of DESTINATION_HUBS) {
        map[h.airport] = {
            city: h.city,
            country: h.country,
            airport: h.airport,
            frequency: h.frequency,
            equipment: h.equipment,
            profile: h.profile,
            img: h.img,
            region: h.region || 'africa',
            heroDescription: `Our station at ${h.city} has been recently modernized with advanced scheduling systems and a dedicated passenger lounge. Travellers can expect seamless connections and real-time flight updates throughout their journey.`,
            loungeInfo: `The Alpha Wing is available for Executive Class passengers and Diamond Platinum members.`,
            securityInfo: 'Full biometric clearance active. Check-in opens 3 hours before departure.',
            weatherTemp: '',
            weatherVisibility: '',
            visible: true,
        };
    }
    return map;
};

const PAGE_DEFAULTS = {
    heroImage: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&q=80',
    heroTitle: 'Discover',
    heroHighlight: 'New Destinations.',
    heroSubtitle: '',
    routeNetworkTitle: 'Route Network',
    routeNetworkSubtitle: "Connecting travellers across Africa's most important aviation corridors.",
    reachTitle: 'Intercontinental',
    reachHighlight: 'Reach.',
    reachSubtitle: 'Our route network expands continuously, connecting global destinations with reliable service and real-time flight tracking.',
    stat1Value: '182',
    stat1Label: 'Active Destinations',
    stat2Value: '12.4M',
    stat2Label: 'Annual Pax Transits',
};

const AIRPORT_CODES = ['BJL', 'DSS', 'OXB', 'CKY', 'FNA', 'ROB', 'ACC', 'LOS'];
type EditorTab = 'page' | 'destinations';

const DestinationsCMS: React.FC = () => {
    const navigate = useNavigate();
    const addToast = useToastStore((s) => s.addToast);
    const imgRef = useRef<HTMLInputElement>(null);
    const heroImgRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState<EditorTab>('page');
    const [destinations, setDestinations] = useState<Record<string, CmsDestinationDoc>>({});
    const [selectedCode, setSelectedCode] = useState<string>('BJL');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dirty, setDirty] = useState(false);

    // Page-level content state
    const [pageContent, setPageContent] = useState({ ...PAGE_DEFAULTS });
    const [pageDirty, setPageDirty] = useState(false);
    const [pageSaving, setPageSaving] = useState(false);
    const [uploadingHero, setUploadingHero] = useState(false);

    // Load from Firestore or seed defaults
    useEffect(() => {
        (async () => {
            try {
                const config = await getDestinationsConfig();
                if (config?.destinations && Object.keys(config.destinations).length > 0) {
                    const defaults = buildDefaults();
                    setDestinations({ ...defaults, ...config.destinations });
                } else {
                    setDestinations(buildDefaults());
                }
                // Load page-level fields
                if (config) {
                    setPageContent({
                        heroImage: config.heroImage || PAGE_DEFAULTS.heroImage,
                        heroTitle: config.heroTitle || PAGE_DEFAULTS.heroTitle,
                        heroHighlight: config.heroHighlight || PAGE_DEFAULTS.heroHighlight,
                        heroSubtitle: config.heroSubtitle || (PAGE_DEFAULTS.heroSubtitle || `Explore the intercontinental ${BRAND.shortName} network, bridging the world with precision and excellence.`),
                        routeNetworkTitle: config.routeNetworkTitle || PAGE_DEFAULTS.routeNetworkTitle,
                        routeNetworkSubtitle: config.routeNetworkSubtitle || PAGE_DEFAULTS.routeNetworkSubtitle,
                        reachTitle: config.reachTitle || PAGE_DEFAULTS.reachTitle,
                        reachHighlight: config.reachHighlight || PAGE_DEFAULTS.reachHighlight,
                        reachSubtitle: config.reachSubtitle || PAGE_DEFAULTS.reachSubtitle,
                        stat1Value: config.stat1Value || PAGE_DEFAULTS.stat1Value,
                        stat1Label: config.stat1Label || PAGE_DEFAULTS.stat1Label,
                        stat2Value: config.stat2Value || PAGE_DEFAULTS.stat2Value,
                        stat2Label: config.stat2Label || PAGE_DEFAULTS.stat2Label,
                    });
                } else {
                    setPageContent({
                        ...PAGE_DEFAULTS,
                        heroSubtitle: `Explore the intercontinental ${BRAND.shortName} network, bridging the world with precision and excellence.`,
                    });
                }
            } catch {
                setDestinations(buildDefaults());
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const current = destinations[selectedCode];

    const updateField = (field: keyof CmsDestinationDoc, value: string | boolean) => {
        setDestinations((prev) => ({
            ...prev,
            [selectedCode]: { ...prev[selectedCode], [field]: value },
        }));
        setDirty(true);
    };

    const updatePageField = (field: string, value: string) => {
        setPageContent((prev) => ({ ...prev, [field]: value }));
        setPageDirty(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const url = await uploadDestinationImage(file, selectedCode);
            updateField('img', url);
            addToast('Image uploaded successfully', 'success');
        } catch {
            addToast('Failed to upload image', 'error');
        } finally {
            setUploading(false);
            if (imgRef.current) imgRef.current.value = '';
        }
    };

    const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingHero(true);
        try {
            const url = await uploadDestinationImage(file, 'hero-page');
            updatePageField('heroImage', url);
            addToast('Hero image uploaded successfully', 'success');
        } catch {
            addToast('Failed to upload hero image', 'error');
        } finally {
            setUploadingHero(false);
            if (heroImgRef.current) heroImgRef.current.value = '';
        }
    };

    const handleSaveDestination = async () => {
        if (!current) return;
        setSaving(true);
        try {
            await updateDestinationConfig(selectedCode, current);
            addToast(`${current.city} (${selectedCode}) saved successfully`, 'success');
            setDirty(false);
        } catch {
            addToast('Failed to save destination', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSavePageContent = async () => {
        setPageSaving(true);
        try {
            await updateDestinationsPageContent(pageContent);
            addToast('Page content saved successfully', 'success');
            setPageDirty(false);
        } catch {
            addToast('Failed to save page content', 'error');
        } finally {
            setPageSaving(false);
        }
    };

    const handleReset = () => {
        if (activeTab === 'page') {
            setPageContent({
                ...PAGE_DEFAULTS,
                heroSubtitle: `Explore the intercontinental ${BRAND.shortName} network, bridging the world with precision and excellence.`,
            });
            setPageDirty(true);
            addToast('Page content reset to defaults — save to apply', 'info');
        } else {
            const defaults = buildDefaults();
            if (defaults[selectedCode]) {
                setDestinations((prev) => ({
                    ...prev,
                    [selectedCode]: defaults[selectedCode],
                }));
                setDirty(true);
                addToast('Reset to defaults — save to apply', 'info');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
            </div>
        );
    }

    const isSaving = activeTab === 'page' ? pageSaving : saving;
    const isDirty = activeTab === 'page' ? pageDirty : dirty;
    const handleSave = activeTab === 'page' ? handleSavePageContent : handleSaveDestination;

    return (
        <div className="min-h-screen bg-navy-50/30 p-6 md:p-10 font-display">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
                <div className="space-y-2">
                    <nav className="flex items-center gap-2 text-[9px] font-black text-navy-400 uppercase tracking-widest">
                        <button onClick={() => navigate(ROUTES.DASHBOARD)} className="hover:text-primary transition-colors">Admin</button>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                        <span className="text-navy-600">Destinations Editor</span>
                    </nav>
                    <h1 className="text-3xl font-black text-navy-950 uppercase tracking-tighter">Destinations Editor</h1>
                    <p className="text-xs font-bold text-navy-400 uppercase tracking-widest">Manage page content and individual destination pages</p>
                </div>
                <div className="flex gap-3">
                    <a href="/destinations" target="_blank" rel="noopener noreferrer"
                        className="px-6 py-3 rounded-xl border-2 border-navy-200 text-navy-500 text-[10px] font-black uppercase tracking-widest hover:bg-navy-100 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">open_in_new</span> View Live
                    </a>
                    <button onClick={handleReset}
                        className="px-6 py-3 rounded-xl border-2 border-navy-200 text-navy-500 text-[10px] font-black uppercase tracking-widest hover:bg-navy-100 transition-all"
                    >Reset to Defaults</button>
                    <button onClick={handleSave} disabled={isSaving || !isDirty}
                        className="px-8 py-3 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">{isSaving ? 'progress_activity' : 'save'}</span>
                        {isSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-white p-1.5 rounded-2xl border border-navy-100 shadow-inner mb-8 w-fit">
                {([
                    { key: 'page' as EditorTab, label: 'Page Content', icon: 'web' },
                    { key: 'destinations' as EditorTab, label: 'Individual Destinations', icon: 'flight' },
                ] as const).map((t) => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === t.key ? 'bg-primary text-white shadow-md' : 'text-navy-400 hover:text-navy-950'}`}
                    >
                        <span className="material-symbols-outlined text-sm">{t.icon}</span> {t.label}
                    </button>
                ))}
            </div>

            {/* ═══════════════════════════════════════════════════════════
                 TAB 1: PAGE CONTENT EDITOR
               ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'page' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Edit Form */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Hero Section */}
                        <div className="bg-white rounded-[2rem] border border-navy-100 shadow-sm p-8 space-y-8">
                            <div className="border-b border-navy-100 pb-6">
                                <h2 className="text-lg font-black text-navy-950 uppercase tracking-tight flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary">image</span> Hero Section
                                </h2>
                                <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mt-1">The large banner at the top of the destinations page</p>
                            </div>

                            {/* Hero Image */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Hero Background Image</label>
                                <div className="flex items-center gap-6">
                                    <div className="w-60 h-32 rounded-2xl bg-navy-50 border-2 border-dashed border-navy-200 overflow-hidden flex items-center justify-center">
                                        {pageContent.heroImage ? (
                                            <img src={pageContent.heroImage} alt="Hero" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined text-3xl text-navy-200">image</span>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <input ref={heroImgRef} type="file" accept="image/*" className="hidden" onChange={handleHeroImageUpload} />
                                        <button onClick={() => heroImgRef.current?.click()} disabled={uploadingHero}
                                            className="px-6 py-3 rounded-xl border-2 border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <span className="material-symbols-outlined text-sm">{uploadingHero ? 'progress_activity' : 'upload'}</span>
                                            {uploadingHero ? 'Uploading…' : 'Upload Image'}
                                        </button>
                                        <p className="text-[9px] font-bold text-navy-300 uppercase italic">or paste a URL below</p>
                                    </div>
                                </div>
                                <input
                                    className="w-full h-12 px-6 bg-navy-50 border-none rounded-xl text-xs font-bold text-navy-700 focus:ring-4 focus:ring-primary/5 transition-all"
                                    value={pageContent.heroImage}
                                    onChange={(e) => updatePageField('heroImage', e.target.value)}
                                    placeholder="Hero image URL"
                                />
                            </div>

                            {/* Hero Text */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Hero Title (line 1)</label>
                                    <input className="w-full h-12 px-6 bg-navy-50 border-none rounded-xl text-sm font-black text-navy-950 uppercase tracking-tight focus:ring-4 focus:ring-primary/5 transition-all"
                                        value={pageContent.heroTitle} onChange={(e) => updatePageField('heroTitle', e.target.value)} placeholder="e.g. Discover" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Hero Highlight (line 2, colored)</label>
                                    <input className="w-full h-12 px-6 bg-navy-50 border-none rounded-xl text-sm font-black text-primary uppercase tracking-tight focus:ring-4 focus:ring-primary/5 transition-all"
                                        value={pageContent.heroHighlight} onChange={(e) => updatePageField('heroHighlight', e.target.value)} placeholder="e.g. New Destinations." />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Hero Subtitle</label>
                                <textarea className="w-full h-20 px-6 py-4 bg-navy-50 border-none rounded-xl text-sm font-bold text-navy-700 focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                                    value={pageContent.heroSubtitle} onChange={(e) => updatePageField('heroSubtitle', e.target.value)}
                                    placeholder="Subtitle text below the heading" />
                            </div>
                        </div>

                        {/* Route Network Section */}
                        <div className="bg-white rounded-[2rem] border border-navy-100 shadow-sm p-8 space-y-8">
                            <div className="border-b border-navy-100 pb-6">
                                <h2 className="text-lg font-black text-navy-950 uppercase tracking-tight flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary">hub</span> Route Network Section
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Section Title</label>
                                    <input className="w-full h-12 px-6 bg-navy-50 border-none rounded-xl text-sm font-black text-navy-950 uppercase tracking-tight focus:ring-4 focus:ring-primary/5 transition-all"
                                        value={pageContent.routeNetworkTitle} onChange={(e) => updatePageField('routeNetworkTitle', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Section Subtitle</label>
                                    <textarea className="w-full h-20 px-6 py-4 bg-navy-50 border-none rounded-xl text-sm font-bold text-navy-700 focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                                        value={pageContent.routeNetworkSubtitle} onChange={(e) => updatePageField('routeNetworkSubtitle', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Intercontinental Reach Section */}
                        <div className="bg-white rounded-[2rem] border border-navy-100 shadow-sm p-8 space-y-8">
                            <div className="border-b border-navy-100 pb-6">
                                <h2 className="text-lg font-black text-navy-950 uppercase tracking-tight flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary">public</span> Intercontinental Reach Section
                                </h2>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Title (line 1)</label>
                                    <input className="w-full h-12 px-6 bg-navy-50 border-none rounded-xl text-sm font-black text-navy-950 uppercase tracking-tight focus:ring-4 focus:ring-primary/5 transition-all"
                                        value={pageContent.reachTitle} onChange={(e) => updatePageField('reachTitle', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Highlight (line 2, colored)</label>
                                    <input className="w-full h-12 px-6 bg-navy-50 border-none rounded-xl text-sm font-black text-primary uppercase tracking-tight focus:ring-4 focus:ring-primary/5 transition-all"
                                        value={pageContent.reachHighlight} onChange={(e) => updatePageField('reachHighlight', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Description</label>
                                <textarea className="w-full h-20 px-6 py-4 bg-navy-50 border-none rounded-xl text-sm font-bold text-navy-700 focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                                    value={pageContent.reachSubtitle} onChange={(e) => updatePageField('reachSubtitle', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Stat 1 — Value</label>
                                    <input className="w-full h-12 px-6 bg-navy-50 border-none rounded-xl text-2xl font-black text-navy-950 tracking-tighter focus:ring-4 focus:ring-primary/5 transition-all"
                                        value={pageContent.stat1Value} onChange={(e) => updatePageField('stat1Value', e.target.value)} placeholder="e.g. 182" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Stat 1 — Label</label>
                                    <input className="w-full h-12 px-6 bg-navy-50 border-none rounded-xl text-sm font-black text-navy-950 uppercase tracking-tight focus:ring-4 focus:ring-primary/5 transition-all"
                                        value={pageContent.stat1Label} onChange={(e) => updatePageField('stat1Label', e.target.value)} placeholder="e.g. Active Destinations" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Stat 2 — Value</label>
                                    <input className="w-full h-12 px-6 bg-navy-50 border-none rounded-xl text-2xl font-black text-navy-950 tracking-tighter focus:ring-4 focus:ring-primary/5 transition-all"
                                        value={pageContent.stat2Value} onChange={(e) => updatePageField('stat2Value', e.target.value)} placeholder="e.g. 12.4M" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Stat 2 — Label</label>
                                    <input className="w-full h-12 px-6 bg-navy-50 border-none rounded-xl text-sm font-black text-navy-950 uppercase tracking-tight focus:ring-4 focus:ring-primary/5 transition-all"
                                        value={pageContent.stat2Label} onChange={(e) => updatePageField('stat2Label', e.target.value)} placeholder="e.g. Annual Pax Transits" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div className="lg:col-span-4 space-y-6">
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest px-2">Live Preview</p>
                        <div className="rounded-2xl overflow-hidden border-2 border-navy-100 shadow-lg bg-white">
                            <iframe
                                key={`page-${pageDirty ? 'dirty' : 'clean'}`}
                                src="/destinations"
                                title="Destinations page preview"
                                className="w-full h-[600px] border-0"
                                style={{ transform: 'scale(0.45)', transformOrigin: 'top left', width: '222%', height: '1333px' }}
                            />
                        </div>
                        <p className="text-[8px] font-bold text-navy-300 uppercase tracking-widest text-center italic">Save changes to see updates on the live page</p>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                 TAB 2: INDIVIDUAL DESTINATIONS
               ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'destinations' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Destination Selector */}
                    <div className="lg:col-span-3 space-y-3">
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest px-2 mb-4">Select Destination</p>
                        {AIRPORT_CODES.map((code) => {
                            const dest = destinations[code];
                            if (!dest) return null;
                            const isActive = code === selectedCode;
                            return (
                                <button key={code} onClick={() => { setSelectedCode(code); setDirty(false); }}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${isActive
                                        ? 'bg-white shadow-lg border-2 border-primary/20 ring-4 ring-primary/5'
                                        : 'bg-white/50 border border-navy-100 hover:bg-white hover:shadow-md'
                                        }`}
                                >
                                    <div className="size-12 rounded-xl bg-navy-950 overflow-hidden flex-shrink-0">
                                        {dest.img && <img src={dest.img} alt={dest.city} className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-black uppercase tracking-tight truncate ${isActive ? 'text-navy-950' : 'text-navy-600'}`}>{dest.city}</p>
                                        <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest">{code} · {dest.country}</p>
                                    </div>
                                    {!dest.visible && (
                                        <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[8px] font-black uppercase rounded-lg border border-amber-100">Hidden</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Edit Form */}
                    {current && (
                        <div className="lg:col-span-6 space-y-6">
                            <div className="bg-white rounded-[2rem] border border-navy-100 shadow-sm p-8 space-y-8">
                                <div className="flex items-center justify-between border-b border-navy-100 pb-6">
                                    <h2 className="text-lg font-black text-navy-950 uppercase tracking-tight">{current.city} ({selectedCode})</h2>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Visible</span>
                                        <button onClick={() => updateField('visible', !current.visible)}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${current.visible ? 'bg-emerald-500' : 'bg-navy-200'}`}
                                        >
                                            <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${current.visible ? 'left-[26px]' : 'left-0.5'}`} />
                                        </button>
                                    </label>
                                </div>

                                {/* Hero Image */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Hero Image</label>
                                    <div className="flex items-center gap-6">
                                        <div className="w-40 h-24 rounded-2xl bg-navy-50 border-2 border-dashed border-navy-200 overflow-hidden flex items-center justify-center">
                                            {current.img ? (
                                                <img src={current.img} alt={current.city} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-3xl text-navy-200">image</span>
                                            )}
                                        </div>
                                        <div className="space-y-3">
                                            <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                            <button onClick={() => imgRef.current?.click()} disabled={uploading}
                                                className="px-6 py-3 rounded-xl border-2 border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <span className="material-symbols-outlined text-sm">{uploading ? 'progress_activity' : 'upload'}</span>
                                                {uploading ? 'Uploading…' : 'Upload Image'}
                                            </button>
                                            <p className="text-[9px] font-bold text-navy-300 uppercase italic">or paste a URL below</p>
                                        </div>
                                    </div>
                                    <input className="w-full h-12 px-6 bg-navy-50 border-none rounded-xl text-xs font-bold text-navy-700 focus:ring-4 focus:ring-primary/5 transition-all"
                                        value={current.img} onChange={(e) => updateField('img', e.target.value)} placeholder="Image URL" />
                                </div>

                                {/* Core Fields */}
                                <div className="grid grid-cols-2 gap-6">
                                    {([
                                        { key: 'city', label: 'City Name', ph: 'e.g. Banjul' },
                                        { key: 'country', label: 'Country', ph: 'e.g. The Gambia' },
                                        { key: 'airport', label: 'Airport Code (IATA)', ph: 'e.g. BJL' },
                                        { key: 'frequency', label: 'Flight Frequency', ph: 'e.g. Daily' },
                                        { key: 'equipment', label: 'Primary Equipment', ph: 'e.g. ERJ-120' },
                                        { key: 'region', label: 'Region', ph: 'e.g. africa' },
                                    ] as { key: keyof CmsDestinationDoc; label: string; ph: string }[]).map((f) => (
                                        <div key={f.key} className="space-y-2">
                                            <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">{f.label}</label>
                                            <input className="w-full h-12 px-6 bg-navy-50 border-none rounded-xl text-sm font-black text-navy-950 uppercase tracking-tight focus:ring-4 focus:ring-primary/5 transition-all"
                                                value={current[f.key] as string} onChange={(e) => updateField(f.key, e.target.value)} placeholder={f.ph} />
                                        </div>
                                    ))}
                                </div>

                                {/* Profile / Tagline */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Profile Tagline</label>
                                    <textarea className="w-full h-24 px-6 py-4 bg-navy-50 border-none rounded-xl text-sm font-bold text-navy-700 focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                                        value={current.profile} onChange={(e) => updateField('profile', e.target.value)} placeholder="Short tagline displayed on destination cards" />
                                </div>

                                {/* Detail Page Content */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Detail Page Description</label>
                                    <textarea className="w-full h-32 px-6 py-4 bg-navy-50 border-none rounded-xl text-sm font-bold text-navy-700 focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                                        value={current.heroDescription} onChange={(e) => updateField('heroDescription', e.target.value)} placeholder="Long description shown on the destination detail page" />
                                </div>

                                {/* Info Cards */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Security Info</label>
                                        <textarea className="w-full h-24 px-6 py-4 bg-navy-50 border-none rounded-xl text-xs font-bold text-navy-700 focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                                            value={current.securityInfo} onChange={(e) => updateField('securityInfo', e.target.value)} placeholder="Security & check-in information" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Lounge Info</label>
                                        <textarea className="w-full h-24 px-6 py-4 bg-navy-50 border-none rounded-xl text-xs font-bold text-navy-700 focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                                            value={current.loungeInfo} onChange={(e) => updateField('loungeInfo', e.target.value)} placeholder="Lounge access details" />
                                    </div>
                                </div>

                                {/* Weather */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Weather — Temperature</label>
                                        <input className="w-full h-12 px-6 bg-navy-50 border-none rounded-xl text-sm font-black text-navy-950 focus:ring-4 focus:ring-primary/5 transition-all"
                                            value={current.weatherTemp} onChange={(e) => updateField('weatherTemp', e.target.value)} placeholder="e.g. 27°C" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Weather — Visibility</label>
                                        <input className="w-full h-12 px-6 bg-navy-50 border-none rounded-xl text-sm font-black text-navy-950 focus:ring-4 focus:ring-primary/5 transition-all"
                                            value={current.weatherVisibility} onChange={(e) => updateField('weatherVisibility', e.target.value)} placeholder="e.g. 8 km" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Live Preview */}
                    {current && (
                        <div className="lg:col-span-3 space-y-6">
                            <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest px-2">Card Preview</p>
                            <div className="relative rounded-[2rem] overflow-hidden bg-white shadow-xl border border-navy-100">
                                <div className="aspect-[3/4] relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/20 to-transparent z-10" />
                                    {current.img ? (
                                        <img src={current.img} alt={current.city} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-navy-200 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-6xl text-navy-300">image</span>
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 z-20">
                                        <span className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[10px] font-black uppercase tracking-widest">
                                            {current.airport}
                                        </span>
                                    </div>
                                    {!current.visible && (
                                        <div className="absolute top-4 left-4 z-20">
                                            <span className="px-3 py-1.5 rounded-lg bg-amber-500/90 text-white text-[8px] font-black uppercase tracking-widest">Hidden</span>
                                        </div>
                                    )}
                                </div>
                                <div className="absolute bottom-0 left-0 w-full p-6 z-20 text-white space-y-3">
                                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">{current.country}</p>
                                    <h3 className="text-2xl font-black tracking-tighter uppercase leading-none">{current.city}</h3>
                                    <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest italic line-clamp-2">{current.profile}</p>
                                    <div className="grid grid-cols-2 gap-3 py-4 border-y border-white/10">
                                        <div>
                                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Frequency</p>
                                            <p className="text-[10px] font-black uppercase tracking-tight">{current.frequency}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Equipment</p>
                                            <p className="text-[10px] font-black uppercase tracking-tight">{current.equipment}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Live Page Preview */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-2">
                                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Live Page</p>
                                    <a href={`/destinations/${selectedCode}`} target="_blank" rel="noopener noreferrer"
                                        className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
                                    >Open <span className="material-symbols-outlined text-xs">open_in_new</span></a>
                                </div>
                                <div className="rounded-2xl overflow-hidden border-2 border-navy-100 shadow-lg bg-white">
                                    <iframe key={`${selectedCode}-${dirty ? 'dirty' : 'clean'}`}
                                        src={`/destinations/${selectedCode}`}
                                        title={`${current.city} preview`}
                                        className="w-full h-[400px] border-0"
                                        style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '800px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DestinationsCMS;
