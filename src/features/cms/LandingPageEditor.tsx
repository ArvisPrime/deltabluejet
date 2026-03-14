
import React, { useState, useEffect } from 'react';
import { BRAND } from '../../config/brand';
import { getLandingPageConfig, updateLandingPageConfig } from '../../services/cms';
import { useToastStore } from '../../stores/toastStore';
import type {
    CmsLandingPageDoc,
    CmsLandingHeroSection,
    CmsLandingTickerItem,
    CmsLandingPromoSection,
    CmsLandingPromoCard,
    CmsLandingDestinationSection,
    CmsLandingDestinationCard,
    CmsLandingClubSection,
    CmsLandingClubStat,
    CmsLandingStatusWidget,
} from '../../types/firestore';

// ── YouTube URL Helper ──────────────────────────────────────
const getYouTubeId = (url: string): string | null => {
    const patterns = [
        /youtu\.be\/([\w-]+)/,
        /youtube\.com\/watch\?v=([\w-]+)/,
        /youtube\.com\/embed\/([\w-]+)/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
};
// ── Default data (mirrors current hardcoded values in LandingHome.tsx) ──

const DEFAULT_HERO: CmsLandingHeroSection = {
    badge: 'Redefining Global Transit',
    headingLine1: 'Flying',
    headingLine2: 'Angels..',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&q=80',
    backgroundType: 'image',
};

const DEFAULT_TICKER: CmsLandingTickerItem[] = [
    { icon: '', iconColor: 'bg-emerald-500', text: 'FLEET STATUS: NORMAL', showPulse: true },
    { icon: 'hub', iconColor: 'text-primary', text: 'GLOBAL DESTINATIONS: 42 ACTIVE' },
    { icon: 'public', iconColor: 'text-primary', text: 'NETWORK COVERAGE: 182 STATIONS' },
    { icon: 'loyalty', iconColor: 'text-amber-500', text: 'ACTIVE MEMBERS: 124K' },
];

const DEFAULT_PROMOTIONS: CmsLandingPromoSection = {
    sectionLabel: 'Curated Collections',
    sectionTitle: 'Experience',
    sectionTitleHighlight: 'Absolute Luxury.',
    ctaLabel: 'View All Offers',
    featuredPromo: {
        title: 'Winter in The Maldives',
        tag: 'Seasonal Feature',
        description: 'Escape the cold with our non-stop premium routes.',
        imageUrl: 'https://images.unsplash.com/photo-1544321689-d499ec24467c?auto=format&fit=crop&q=80',
        ctaLabel: 'Book Now',
    },
    gridPromos: [
        { title: 'The London Connection', imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80', tag: 'City Break', price: '$450' },
        { title: 'Tokyo Neons', imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80', tag: 'Asia Corridor', price: '$820' },
        { title: 'Dubai Luxury', imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80', tag: 'Executive Station', price: '$610' },
        { title: 'Parisian Spring', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80', tag: 'Europe', price: '$490' },
    ],
};

const DEFAULT_DESTINATIONS: CmsLandingDestinationSection = {
    sectionLabel: 'Global Network',
    sectionTitle: 'New Stations',
    sectionTitleHighlight: 'Added Daily.',
    destinations: [
        { city: 'Accra', country: 'Ghana', airport: 'ACC', imageUrl: 'https://images.unsplash.com/photo-1591129841117-3adfd313e34f?auto=format&fit=crop&q=80', description: 'Commercial nexus of West Africa.' },
        { city: 'Banjul', country: 'The Gambia', airport: 'BJL', imageUrl: 'https://images.unsplash.com/photo-1544321689-d499ec24467c?auto=format&fit=crop&q=80', description: 'Serene coastal eco-tourism hub.' },
        { city: 'Dakar', country: 'Senegal', airport: 'DSS', imageUrl: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&q=80', description: 'Premier hub for the Francophone corridor.' },
        { city: 'Lagos', country: 'Nigeria', airport: 'LOS', imageUrl: 'https://images.unsplash.com/photo-1618833162734-722649666014?auto=format&fit=crop&q=80', description: 'The pulse of African industry.' },
    ],
};

const DEFAULT_CLUB: CmsLandingClubSection = {
    badge: 'Priority Passenger Access',
    heading: 'The Club',
    headingHighlight: 'Lounge.',
    description: 'Join the elite circle of global explorers. Secure advanced seat selection, priority boarding, and exclusive travel benefits.',
    stats: [
        { label: 'Lounges', value: '42' },
        { label: 'Priority Boarding', value: '98%' },
        { label: 'Bonus Miles', value: '2.5X' },
    ],
    primaryCtaLabel: 'Join Now',
    secondaryCtaLabel: 'View All Benefits',
    cardTierName: 'Black Diamond Tier',
    cardMemberName: 'MARCUS CHEN',
    cardReference: '8823 4421 9012',
    cardValidThru: '12 / 28',
};

const DEFAULT_STATUS_WIDGET: CmsLandingStatusWidget = {
    title: 'Global Sync Status',
    subtitle: 'All Systems Operational',
    visible: true,
};

// ── Tab Configuration ──────────────────────────────────────

type TabKey = 'hero' | 'ticker' | 'promotions' | 'destinations' | 'club' | 'status';

const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'hero', label: 'Hero Section', icon: 'image' },
    { key: 'ticker', label: 'Network Ticker', icon: 'rss_feed' },
    { key: 'promotions', label: 'Promotions', icon: 'sell' },
    { key: 'destinations', label: 'Destinations', icon: 'flight' },
    { key: 'club', label: 'Club Membership', icon: 'loyalty' },
    { key: 'status', label: 'Status Widget', icon: 'info' },
];

// ── Reusable UI Helpers ────────────────────────────────────

const SectionCard: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => (
    <div className="bg-white rounded-3xl border border-navy-100 shadow-sm p-8 space-y-6">
        {title && <h3 className="text-sm font-black uppercase tracking-[0.2em] text-navy-600 flex items-center gap-2">{title}</h3>}
        {children}
    </div>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-navy-400 mb-2">{children}</label>
);

const TextInput: React.FC<{
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean;
}> = ({ label, value, onChange, placeholder, multiline }) => (
    <div>
        <FieldLabel>{label}</FieldLabel>
        {multiline ? (
            <textarea
                value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full px-4 py-3 bg-navy-50 border border-navy-100 rounded-xl text-sm text-navy-800 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-navy-300 resize-none h-24"
            />
        ) : (
            <input
                type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full px-4 py-3 bg-navy-50 border border-navy-100 rounded-xl text-sm text-navy-800 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-navy-300"
            />
        )}
    </div>
);

// ═══════════════════════════════════════════════════════════
//    Landing Page Editor
// ═══════════════════════════════════════════════════════════

const LandingPageEditor: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('hero');
    const [dirty, setDirty] = useState(false);

    // Section state
    const [hero, setHero] = useState<CmsLandingHeroSection>(DEFAULT_HERO);
    const [ticker, setTicker] = useState<CmsLandingTickerItem[]>(DEFAULT_TICKER);
    const [promotions, setPromotions] = useState<CmsLandingPromoSection>(DEFAULT_PROMOTIONS);
    const [destinations, setDestinations] = useState<CmsLandingDestinationSection>(DEFAULT_DESTINATIONS);
    const [club, setClub] = useState<CmsLandingClubSection>(DEFAULT_CLUB);
    const [statusWidget, setStatusWidget] = useState<CmsLandingStatusWidget>(DEFAULT_STATUS_WIDGET);

    // ── Load config from Firestore ─────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const cfg = await getLandingPageConfig();
                if (cfg) {
                    if (cfg.hero) setHero(cfg.hero);
                    if (cfg.ticker) setTicker(cfg.ticker);
                    if (cfg.promotions) setPromotions(cfg.promotions);
                    if (cfg.destinations) setDestinations(cfg.destinations);
                    if (cfg.club) setClub(cfg.club);
                    if (cfg.statusWidget) setStatusWidget(cfg.statusWidget);
                }
            } catch (err) {
                console.error('[LandingPageEditor] Load error:', err);
                addToast('Failed to load landing page config', 'error');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // ── Save handler ───────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        try {
            await updateLandingPageConfig({ hero, ticker, promotions, destinations, club, statusWidget });
            setDirty(false);
            addToast('Landing page updated successfully! Changes are now live.', 'success');
        } catch (err) {
            console.error('[LandingPageEditor] Save error:', err);
            addToast('Failed to save landing page config', 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── Mark dirty helper ──────────────────────────────────
    const touch = () => { if (!dirty) setDirty(true); };

    // ── Hero updaters ──────────────────────────────────────
    const updateHero = (field: keyof CmsLandingHeroSection, value: any) => {
        setHero(prev => ({ ...prev, [field]: value }));
        touch();
    };

    // ── Ticker updaters ────────────────────────────────────
    const updateTickerItem = (idx: number, field: keyof CmsLandingTickerItem, value: any) => {
        setTicker(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
        touch();
    };
    const addTickerItem = () => {
        setTicker(prev => [...prev, { icon: 'info', iconColor: 'text-primary', text: 'NEW ITEM' }]);
        touch();
    };
    const removeTickerItem = (idx: number) => {
        setTicker(prev => prev.filter((_, i) => i !== idx));
        touch();
    };

    // ── Promotions updaters ────────────────────────────────
    const updatePromoField = (field: keyof Omit<CmsLandingPromoSection, 'featuredPromo' | 'gridPromos'>, value: string) => {
        setPromotions(prev => ({ ...prev, [field]: value }));
        touch();
    };
    const updateFeaturedPromo = (field: string, value: string) => {
        setPromotions(prev => ({ ...prev, featuredPromo: { ...prev.featuredPromo, [field]: value } }));
        touch();
    };
    const updateGridPromo = (idx: number, field: keyof CmsLandingPromoCard, value: string) => {
        setPromotions(prev => ({
            ...prev,
            gridPromos: prev.gridPromos.map((p, i) => i === idx ? { ...p, [field]: value } : p),
        }));
        touch();
    };
    const addGridPromo = () => {
        setPromotions(prev => ({
            ...prev,
            gridPromos: [...prev.gridPromos, { title: 'New Destination', tag: 'New', price: '$0', imageUrl: '' }],
        }));
        touch();
    };
    const removeGridPromo = (idx: number) => {
        setPromotions(prev => ({ ...prev, gridPromos: prev.gridPromos.filter((_, i) => i !== idx) }));
        touch();
    };

    // ── Destination updaters ───────────────────────────────
    const updateDestField = (field: keyof Omit<CmsLandingDestinationSection, 'destinations'>, value: string) => {
        setDestinations(prev => ({ ...prev, [field]: value }));
        touch();
    };
    const updateDestCard = (idx: number, field: keyof CmsLandingDestinationCard, value: string) => {
        setDestinations(prev => ({
            ...prev,
            destinations: prev.destinations.map((d, i) => i === idx ? { ...d, [field]: value } : d),
        }));
        touch();
    };
    const addDestCard = () => {
        setDestinations(prev => ({
            ...prev,
            destinations: [...prev.destinations, { city: 'New City', country: 'Country', airport: 'XXX', imageUrl: '', description: 'Description here.' }],
        }));
        touch();
    };
    const removeDestCard = (idx: number) => {
        setDestinations(prev => ({ ...prev, destinations: prev.destinations.filter((_, i) => i !== idx) }));
        touch();
    };

    // ── Club updaters ──────────────────────────────────────
    const updateClubField = (field: keyof CmsLandingClubSection, value: any) => {
        setClub(prev => ({ ...prev, [field]: value }));
        touch();
    };
    const updateClubStat = (idx: number, field: keyof CmsLandingClubStat, value: string) => {
        setClub(prev => ({
            ...prev,
            stats: prev.stats.map((s, i) => i === idx ? { ...s, [field]: value } : s),
        }));
        touch();
    };
    const addClubStat = () => {
        setClub(prev => ({ ...prev, stats: [...prev.stats, { label: 'New Stat', value: '0' }] }));
        touch();
    };
    const removeClubStat = (idx: number) => {
        setClub(prev => ({ ...prev, stats: prev.stats.filter((_, i) => i !== idx) }));
        touch();
    };

    // ── Status updaters ────────────────────────────────────
    const updateStatusField = (field: keyof CmsLandingStatusWidget, value: any) => {
        setStatusWidget(prev => ({ ...prev, [field]: value }));
        touch();
    };

    // ── Loading State ──────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-navy-400 text-xs font-black uppercase tracking-[0.3em]">Loading Editor</p>
                </div>
            </div>
        );
    }

    // ── Render ─────────────────────────────────────────────
    return (
        <div className="p-6 md:p-10 space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-2xl">home</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tight text-navy-950">Landing Page Editor</h1>
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy-400">
                                {BRAND.shortName} — Home Page Content Management
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {dirty && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-2 animate-pulse">
                            <span className="material-symbols-outlined text-sm">edit</span>Unsaved Changes
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving || !dirty}
                        className="px-10 py-4 bg-primary text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-3"
                    >
                        <span className="material-symbols-outlined text-sm">{saving ? 'sync' : 'save'}</span>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-6 py-4 flex items-start gap-4">
                <span className="material-symbols-outlined text-blue-500 text-xl mt-0.5">info</span>
                <div className="space-y-1">
                    <p className="text-xs font-bold text-blue-700">Editing the public home page</p>
                    <p className="text-[10px] text-blue-500 leading-relaxed">
                        Changes here modify the live landing page content. The booking form and footer are managed separately and are not affected.
                    </p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all ${activeTab === tab.key
                            ? 'bg-navy-950 text-white shadow-xl'
                            : 'bg-white text-navy-400 border border-navy-100 hover:text-navy-700 hover:border-navy-200'
                            }`}
                    >
                        <span className="material-symbols-outlined text-base">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══ HERO TAB ═══ */}
            {activeTab === 'hero' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <SectionCard title="Hero Section">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TextInput label="Badge Text" value={hero.badge} onChange={v => updateHero('badge', v)} placeholder="e.g. Redefining Global Transit" />
                            <div>
                                <FieldLabel>Media Type</FieldLabel>
                                <div className="flex gap-2">
                                    {(['image', 'video'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => updateHero('backgroundType', type)}
                                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${(hero.backgroundType || 'image') === type
                                                ? 'bg-navy-950 text-white shadow-lg'
                                                : 'bg-navy-50 text-navy-400 border border-navy-100 hover:text-navy-700'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-sm">{type === 'image' ? 'image' : 'videocam'}</span>
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <TextInput
                                label={hero.backgroundType === 'video' ? 'Background Video URL' : 'Background Image URL'}
                                value={hero.backgroundImageUrl}
                                onChange={v => updateHero('backgroundImageUrl', v)}
                                placeholder={hero.backgroundType === 'video' ? 'https://youtu.be/xxxxx or .mp4 URL' : 'https://...image.jpg'}
                            />
                            <TextInput label="Heading Line 1" value={hero.headingLine1} onChange={v => updateHero('headingLine1', v)} placeholder="e.g. Flying" />
                            <TextInput label="Heading Line 2 (Highlighted)" value={hero.headingLine2} onChange={v => updateHero('headingLine2', v)} placeholder="e.g. Angels.." />
                        </div>
                        {hero.backgroundType === 'video' && (
                            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-3 mt-2">
                                <span className="material-symbols-outlined text-amber-500 text-base mt-0.5">info</span>
                                <p className="text-[10px] text-amber-600 font-bold leading-relaxed">Supports YouTube URLs (e.g. youtu.be/xxxxx), direct video files (MP4, WebM), or any embeddable video URL. YouTube videos autoplay muted with no controls.</p>
                            </div>
                        )}
                    </SectionCard>

                    {/* Live Preview */}
                    {hero.backgroundImageUrl && (
                        <SectionCard title="Preview">
                            <div className="relative h-64 rounded-2xl overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-navy-950/70 via-navy-900/20 to-white z-10" />
                                {(() => {
                                    const bgType = hero.backgroundType || 'image';
                                    if (bgType === 'video') {
                                        const ytId = getYouTubeId(hero.backgroundImageUrl);
                                        if (ytId) return <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&modestbranding=1&rel=0`} allow="autoplay; encrypted-media" allowFullScreen className="w-full h-full absolute inset-0 scale-[2] pointer-events-none" style={{ border: "none" }} />;
                                        return <video src={hero.backgroundImageUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />;
                                    }
                                    return <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${hero.backgroundImageUrl}')` }} />;
                                })()}
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center">
                                    <span className="px-4 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[8px] font-black uppercase tracking-[0.3em] mb-4">{hero.badge}</span>
                                    <h2 className="text-4xl font-black text-white uppercase leading-[0.85] tracking-tighter">
                                        {hero.headingLine1}<br /><span className="text-primary">{hero.headingLine2}</span>
                                    </h2>
                                </div>
                            </div>
                        </SectionCard>
                    )}
                </div>
            )}

            {/* ═══ TICKER TAB ═══ */}
            {activeTab === 'ticker' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <SectionCard title="Network Ticker Items">
                        <div className="space-y-4">
                            {ticker.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-4 bg-navy-50 rounded-2xl border border-navy-100">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <TextInput label="Icon (Material Symbol)" value={item.icon} onChange={v => updateTickerItem(idx, 'icon', v)} placeholder="e.g. hub" />
                                        <TextInput label="Icon Color Class" value={item.iconColor} onChange={v => updateTickerItem(idx, 'iconColor', v)} placeholder="e.g. text-primary" />
                                        <TextInput label="Text" value={item.text} onChange={v => updateTickerItem(idx, 'text', v)} placeholder="e.g. FLEET STATUS: NORMAL" />
                                    </div>
                                    <div className="flex flex-col items-center gap-2 pt-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={item.showPulse || false} onChange={e => updateTickerItem(idx, 'showPulse', e.target.checked)} className="rounded" />
                                            <span className="text-[9px] font-bold text-navy-400 uppercase">Pulse</span>
                                        </label>
                                        <button onClick={() => removeTickerItem(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={addTickerItem} className="flex items-center gap-2 px-6 py-3 bg-navy-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                            <span className="material-symbols-outlined text-sm">add</span> Add Ticker Item
                        </button>
                    </SectionCard>
                </div>
            )}

            {/* ═══ PROMOTIONS TAB ═══ */}
            {activeTab === 'promotions' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Section Header Fields */}
                    <SectionCard title="Section Header">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TextInput label="Section Label" value={promotions.sectionLabel} onChange={v => updatePromoField('sectionLabel', v)} />
                            <TextInput label="CTA Button Label" value={promotions.ctaLabel} onChange={v => updatePromoField('ctaLabel', v)} />
                            <TextInput label="Title" value={promotions.sectionTitle} onChange={v => updatePromoField('sectionTitle', v)} />
                            <TextInput label="Title Highlight" value={promotions.sectionTitleHighlight} onChange={v => updatePromoField('sectionTitleHighlight', v)} />
                        </div>
                    </SectionCard>

                    {/* Featured Promo */}
                    <SectionCard title="Featured Promotion (Large Card)">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TextInput label="Title" value={promotions.featuredPromo.title} onChange={v => updateFeaturedPromo('title', v)} />
                            <TextInput label="Tag" value={promotions.featuredPromo.tag} onChange={v => updateFeaturedPromo('tag', v)} />
                            <TextInput label="Image URL" value={promotions.featuredPromo.imageUrl} onChange={v => updateFeaturedPromo('imageUrl', v)} />
                            <TextInput label="CTA Label" value={promotions.featuredPromo.ctaLabel} onChange={v => updateFeaturedPromo('ctaLabel', v)} />
                        </div>
                        <TextInput label="Description" value={promotions.featuredPromo.description} onChange={v => updateFeaturedPromo('description', v)} multiline />
                    </SectionCard>

                    {/* Grid Promos */}
                    <SectionCard title="Promotion Grid Cards">
                        <div className="space-y-4">
                            {promotions.gridPromos.map((promo, idx) => (
                                <div key={idx} className="p-4 bg-navy-50 rounded-2xl border border-navy-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-navy-500">Card {idx + 1}</span>
                                        <button onClick={() => removeGridPromo(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <TextInput label="Title" value={promo.title} onChange={v => updateGridPromo(idx, 'title', v)} />
                                        <TextInput label="Tag" value={promo.tag} onChange={v => updateGridPromo(idx, 'tag', v)} />
                                        <TextInput label="Price" value={promo.price} onChange={v => updateGridPromo(idx, 'price', v)} />
                                        <TextInput label="Image URL" value={promo.imageUrl} onChange={v => updateGridPromo(idx, 'imageUrl', v)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={addGridPromo} className="flex items-center gap-2 px-6 py-3 bg-navy-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                            <span className="material-symbols-outlined text-sm">add</span> Add Promo Card
                        </button>
                    </SectionCard>
                </div>
            )}

            {/* ═══ DESTINATIONS TAB ═══ */}
            {activeTab === 'destinations' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <SectionCard title="Section Header">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <TextInput label="Section Label" value={destinations.sectionLabel} onChange={v => updateDestField('sectionLabel', v)} />
                            <TextInput label="Title" value={destinations.sectionTitle} onChange={v => updateDestField('sectionTitle', v)} />
                            <TextInput label="Title Highlight" value={destinations.sectionTitleHighlight} onChange={v => updateDestField('sectionTitleHighlight', v)} />
                        </div>
                    </SectionCard>

                    <SectionCard title="Destination Cards">
                        <div className="space-y-4">
                            {destinations.destinations.map((dest, idx) => (
                                <div key={idx} className="p-4 bg-navy-50 rounded-2xl border border-navy-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-navy-500">
                                            <span className="material-symbols-outlined text-sm align-middle mr-1">flight</span>
                                            {dest.city} ({dest.airport})
                                        </span>
                                        <button onClick={() => removeDestCard(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <TextInput label="City" value={dest.city} onChange={v => updateDestCard(idx, 'city', v)} />
                                        <TextInput label="Country" value={dest.country} onChange={v => updateDestCard(idx, 'country', v)} />
                                        <TextInput label="Airport Code" value={dest.airport} onChange={v => updateDestCard(idx, 'airport', v)} />
                                        <TextInput label="Image URL" value={dest.imageUrl} onChange={v => updateDestCard(idx, 'imageUrl', v)} />
                                        <div className="md:col-span-2">
                                            <TextInput label="Description" value={dest.description} onChange={v => updateDestCard(idx, 'description', v)} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={addDestCard} className="flex items-center gap-2 px-6 py-3 bg-navy-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                            <span className="material-symbols-outlined text-sm">add</span> Add Destination
                        </button>
                    </SectionCard>
                </div>
            )}

            {/* ═══ CLUB TAB ═══ */}
            {activeTab === 'club' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <SectionCard title="Section Content">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TextInput label="Badge" value={club.badge} onChange={v => updateClubField('badge', v)} />
                            <TextInput label="Heading" value={club.heading} onChange={v => updateClubField('heading', v)} />
                            <TextInput label="Heading Highlight" value={club.headingHighlight} onChange={v => updateClubField('headingHighlight', v)} />
                            <TextInput label="Primary CTA Label" value={club.primaryCtaLabel} onChange={v => updateClubField('primaryCtaLabel', v)} />
                            <TextInput label="Secondary CTA Label" value={club.secondaryCtaLabel} onChange={v => updateClubField('secondaryCtaLabel', v)} />
                        </div>
                        <TextInput label="Description" value={club.description} onChange={v => updateClubField('description', v)} multiline />
                    </SectionCard>

                    <SectionCard title="Stats">
                        <div className="space-y-4">
                            {club.stats.map((stat, idx) => (
                                <div key={idx} className="flex items-end gap-4 p-4 bg-navy-50 rounded-2xl border border-navy-100">
                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                        <TextInput label="Label" value={stat.label} onChange={v => updateClubStat(idx, 'label', v)} />
                                        <TextInput label="Value" value={stat.value} onChange={v => updateClubStat(idx, 'value', v)} />
                                    </div>
                                    <button onClick={() => removeClubStat(idx)} className="text-red-400 hover:text-red-600 transition-colors mb-1">
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button onClick={addClubStat} className="flex items-center gap-2 px-6 py-3 bg-navy-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                            <span className="material-symbols-outlined text-sm">add</span> Add Stat
                        </button>
                    </SectionCard>

                    <SectionCard title="Membership Card Preview">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TextInput label="Tier Name" value={club.cardTierName} onChange={v => updateClubField('cardTierName', v)} />
                            <TextInput label="Member Name" value={club.cardMemberName} onChange={v => updateClubField('cardMemberName', v)} />
                            <TextInput label="Reference Number" value={club.cardReference} onChange={v => updateClubField('cardReference', v)} />
                            <TextInput label="Valid Thru" value={club.cardValidThru} onChange={v => updateClubField('cardValidThru', v)} />
                        </div>
                    </SectionCard>
                </div>
            )}

            {/* ═══ STATUS WIDGET TAB ═══ */}
            {activeTab === 'status' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <SectionCard title="Floating Status Widget">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TextInput label="Title" value={statusWidget.title} onChange={v => updateStatusField('title', v)} />
                            <TextInput label="Subtitle" value={statusWidget.subtitle} onChange={v => updateStatusField('subtitle', v)} />
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer mt-2">
                            <div className={`relative w-12 h-6 rounded-full transition-colors ${statusWidget.visible ? 'bg-primary' : 'bg-navy-200'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${statusWidget.visible ? 'translate-x-6' : ''}`} />
                            </div>
                            <input type="checkbox" className="sr-only" checked={statusWidget.visible} onChange={e => updateStatusField('visible', e.target.checked)} />
                            <span className="text-xs font-bold text-navy-600">{statusWidget.visible ? 'Visible' : 'Hidden'} on home page</span>
                        </label>
                    </SectionCard>
                </div>
            )}
        </div>
    );
};

export default LandingPageEditor;
