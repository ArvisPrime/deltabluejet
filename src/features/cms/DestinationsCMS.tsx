import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../../config/routes';
import { getDestinationsConfig, updateDestinationConfig, uploadDestinationImage } from '../../services/cms';
import { DESTINATION_HUBS } from '../../data/destinationHubs';
import type { CmsDestinationDoc } from '../../types/firestore';
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

const AIRPORT_CODES = ['BJL', 'DSS', 'OXB', 'CKY', 'FNA', 'ROB', 'ACC', 'LOS'];

const DestinationsCMS: React.FC = () => {
    const navigate = useNavigate();
    const addToast = useToastStore((s) => s.addToast);
    const imgRef = useRef<HTMLInputElement>(null);

    const [destinations, setDestinations] = useState<Record<string, CmsDestinationDoc>>({});
    const [selectedCode, setSelectedCode] = useState<string>('BJL');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dirty, setDirty] = useState(false);

    // Load from Firestore or seed defaults
    useEffect(() => {
        (async () => {
            try {
                const config = await getDestinationsConfig();
                if (config?.destinations && Object.keys(config.destinations).length > 0) {
                    // Merge with defaults for any missing codes
                    const defaults = buildDefaults();
                    setDestinations({ ...defaults, ...config.destinations });
                } else {
                    setDestinations(buildDefaults());
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

    const handleSave = async () => {
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

    const handleReset = () => {
        const defaults = buildDefaults();
        if (defaults[selectedCode]) {
            setDestinations((prev) => ({
                ...prev,
                [selectedCode]: defaults[selectedCode],
            }));
            setDirty(true);
            addToast('Reset to defaults — save to apply', 'info');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
            </div>
        );
    }

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
                    <p className="text-xs font-bold text-navy-400 uppercase tracking-widest">Manage content for all destination pages</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleReset}
                        className="px-6 py-3 rounded-xl border-2 border-navy-200 text-navy-500 text-[10px] font-black uppercase tracking-widest hover:bg-navy-100 transition-all"
                    >
                        Reset to Defaults
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !dirty}
                        className="px-8 py-3 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">{saving ? 'progress_activity' : 'save'}</span>
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Destination Selector */}
                <div className="lg:col-span-3 space-y-3">
                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest px-2 mb-4">Select Destination</p>
                    {AIRPORT_CODES.map((code) => {
                        const dest = destinations[code];
                        if (!dest) return null;
                        const isActive = code === selectedCode;
                        return (
                            <button
                                key={code}
                                onClick={() => { setSelectedCode(code); setDirty(false); }}
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
                                    <button
                                        onClick={() => updateField('visible', !current.visible)}
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
                                        <button
                                            onClick={() => imgRef.current?.click()}
                                            disabled={uploading}
                                            className="px-6 py-3 rounded-xl border-2 border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <span className="material-symbols-outlined text-sm">{uploading ? 'progress_activity' : 'upload'}</span>
                                            {uploading ? 'Uploading…' : 'Upload Image'}
                                        </button>
                                        <p className="text-[9px] font-bold text-navy-300 uppercase italic">or paste a URL below</p>
                                    </div>
                                </div>
                                <input
                                    className="w-full h-12 px-6 bg-navy-50 border-none rounded-xl text-xs font-bold text-navy-700 focus:ring-4 focus:ring-primary/5 transition-all"
                                    value={current.img}
                                    onChange={(e) => updateField('img', e.target.value)}
                                    placeholder="Image URL"
                                />
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
                                        <input
                                            className="w-full h-12 px-6 bg-navy-50 border-none rounded-xl text-sm font-black text-navy-950 uppercase tracking-tight focus:ring-4 focus:ring-primary/5 transition-all"
                                            value={current[f.key] as string}
                                            onChange={(e) => updateField(f.key, e.target.value)}
                                            placeholder={f.ph}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Profile / Tagline */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Profile Tagline</label>
                                <textarea
                                    className="w-full h-24 px-6 py-4 bg-navy-50 border-none rounded-xl text-sm font-bold text-navy-700 focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                                    value={current.profile}
                                    onChange={(e) => updateField('profile', e.target.value)}
                                    placeholder="Short tagline displayed on destination cards"
                                />
                            </div>

                            {/* Detail Page Content */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Detail Page Description</label>
                                <textarea
                                    className="w-full h-32 px-6 py-4 bg-navy-50 border-none rounded-xl text-sm font-bold text-navy-700 focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                                    value={current.heroDescription}
                                    onChange={(e) => updateField('heroDescription', e.target.value)}
                                    placeholder="Long description shown on the destination detail page"
                                />
                            </div>

                            {/* Info Cards */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Security Info</label>
                                    <textarea
                                        className="w-full h-24 px-6 py-4 bg-navy-50 border-none rounded-xl text-xs font-bold text-navy-700 focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                                        value={current.securityInfo}
                                        onChange={(e) => updateField('securityInfo', e.target.value)}
                                        placeholder="Security & check-in information"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Lounge Info</label>
                                    <textarea
                                        className="w-full h-24 px-6 py-4 bg-navy-50 border-none rounded-xl text-xs font-bold text-navy-700 focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                                        value={current.loungeInfo}
                                        onChange={(e) => updateField('loungeInfo', e.target.value)}
                                        placeholder="Lounge access details"
                                    />
                                </div>
                            </div>

                            {/* Weather */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Weather — Temperature</label>
                                    <input
                                        className="w-full h-12 px-6 bg-navy-50 border-none rounded-xl text-sm font-black text-navy-950 focus:ring-4 focus:ring-primary/5 transition-all"
                                        value={current.weatherTemp}
                                        onChange={(e) => updateField('weatherTemp', e.target.value)}
                                        placeholder="e.g. 27°C"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block">Weather — Visibility</label>
                                    <input
                                        className="w-full h-12 px-6 bg-navy-50 border-none rounded-xl text-sm font-black text-navy-950 focus:ring-4 focus:ring-primary/5 transition-all"
                                        value={current.weatherVisibility}
                                        onChange={(e) => updateField('weatherVisibility', e.target.value)}
                                        placeholder="e.g. 8 km"
                                    />
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

                        {/* Weather Preview */}
                        {(current.weatherTemp || current.weatherVisibility) && (
                            <div className="bg-navy-950 rounded-2xl p-6 text-white space-y-4">
                                <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Weather Preview</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                        <p className="text-[8px] font-bold text-white/40 uppercase mb-1">Temperature</p>
                                        <p className="text-lg font-black tracking-tighter">{current.weatherTemp || '—'}</p>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                        <p className="text-[8px] font-bold text-white/40 uppercase mb-1">Visibility</p>
                                        <p className="text-lg font-black tracking-tighter">{current.weatherVisibility || '—'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DestinationsCMS;
