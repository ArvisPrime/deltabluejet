
import React, { useState, useEffect } from 'react';
import {
    getPricingRules,
    updatePricingRules,
    DEFAULT_PRICING_RULES,
    type PricingRules,
} from '../../services/pricingService';
import { useToastStore } from '../../stores/toastStore';

const PricingRulesAdmin: React.FC = () => {
    const [rules, setRules] = useState<PricingRules>(DEFAULT_PRICING_RULES);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getPricingRules();
                setRules(data);
            } catch (err) { console.error(err); useToastStore.getState().addToast(err instanceof Error ? err.message : "An unexpected error occurred", "error"); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSuccess('');
        setError('');
        try {
            await updatePricingRules(rules);
            setSuccess('Pricing rules saved successfully.');
        } catch (err: any) {
            setError(err.message || 'Failed to save');
        } finally { setSaving(false); }
    };

    const handleReset = () => {
        setRules({ ...DEFAULT_PRICING_RULES });
    };

    const updateTimeMultiplier = (index: number, val: number) => {
        setRules(prev => ({
            ...prev,
            timeBuckets: prev.timeBuckets.map((b, i) => i === index ? { ...b, multiplier: val } : b),
        }));
    };

    const updateLoadMultiplier = (index: number, val: number) => {
        setRules(prev => ({
            ...prev,
            loadBuckets: prev.loadBuckets.map((b, i) => i === index ? { ...b, multiplier: val } : b),
        }));
    };

    const updateDayMultiplier = (index: number, val: number) => {
        setRules(prev => ({
            ...prev,
            dayModifiers: prev.dayModifiers.map((d, i) => i === index ? { ...d, multiplier: val } : d),
        }));
    };

    // Live preview: $350 economy base fare
    const exampleBase = 350;
    const exampleResults = rules.timeBuckets.map(tb => {
        const loadMid = rules.loadBuckets[1]?.multiplier ?? 1;
        const dayMid = rules.dayModifiers[1]?.multiplier ?? 1;
        return {
            label: tb.label,
            fare: Math.round(exampleBase * tb.multiplier * loadMid * dayMid),
            multiplier: tb.multiplier,
        };
    });

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-navy-50/30">
                <div className="animate-spin size-8 border-3 border-navy-200 border-t-primary rounded-full" />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto custom-scrollbar bg-navy-50/30">
            <div className="max-w-6xl mx-auto px-8 py-12 space-y-10 animate-in fade-in duration-500">
                {/* Header */}
                <div className="space-y-2">
                    <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">
                        <span>Admin</span>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                        <span className="text-primary">Dynamic Pricing</span>
                    </nav>
                    <div className="flex justify-between items-end border-b border-navy-100 pb-8">
                        <div>
                            <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase">Pricing Rules Engine</h1>
                            <p className="text-navy-500 font-medium italic text-lg mt-2">Configure dynamic fare adjustments</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleReset} className="px-6 py-3 bg-white border-2 border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-600 hover:bg-navy-50 transition-all shadow-sm">
                                Reset Defaults
                            </button>
                            <button onClick={handleSave} disabled={saving} className="px-8 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save Rules'}
                            </button>
                        </div>
                    </div>
                </div>

                {success && (
                    <div className="flex items-center gap-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700">
                        <span className="material-symbols-outlined">check_circle</span>
                        <p className="text-sm font-black uppercase tracking-widest">{success}</p>
                    </div>
                )}
                {error && (
                    <div className="flex items-center gap-4 p-5 bg-red-50 rounded-2xl border border-red-100 text-red-700">
                        <span className="material-symbols-outlined">error</span>
                        <p className="text-sm font-black uppercase tracking-widest">{error}</p>
                    </div>
                )}

                {/* Time-to-Departure */}
                <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm p-8 space-y-6">
                    <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary p-2 bg-primary/5 rounded-xl">schedule</span>
                        Time-to-Departure Multipliers
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {rules.timeBuckets.map((bucket, i) => (
                            <div key={i} className="p-5 bg-navy-50/50 rounded-2xl border border-navy-100 space-y-3">
                                <p className="text-[10px] font-black text-navy-500 uppercase tracking-widest">{bucket.label}</p>
                                <input
                                    type="number"
                                    step="0.05"
                                    min="0.1"
                                    max="3.0"
                                    value={bucket.multiplier}
                                    onChange={e => updateTimeMultiplier(i, parseFloat(e.target.value) || 1)}
                                    className="w-full p-3 bg-white rounded-xl border border-navy-100 text-center text-lg font-black text-navy-950 focus:ring-2 focus:ring-primary/20"
                                />
                                <p className={`text-[9px] font-black uppercase tracking-widest text-center ${bucket.multiplier < 1 ? 'text-emerald-500' : bucket.multiplier > 1 ? 'text-red-500' : 'text-navy-400'
                                    }`}>
                                    {bucket.multiplier < 1 ? `${((1 - bucket.multiplier) * 100).toFixed(0)}% discount` :
                                        bucket.multiplier > 1 ? `${((bucket.multiplier - 1) * 100).toFixed(0)}% surge` : 'Base rate'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Load Factor */}
                <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm p-8 space-y-6">
                    <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary p-2 bg-primary/5 rounded-xl">analytics</span>
                        Load Factor Multipliers
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {rules.loadBuckets.map((bucket, i) => (
                            <div key={i} className="p-5 bg-navy-50/50 rounded-2xl border border-navy-100 space-y-3">
                                <p className="text-[10px] font-black text-navy-500 uppercase tracking-widest">{bucket.label}</p>
                                <input
                                    type="number"
                                    step="0.05"
                                    min="0.1"
                                    max="3.0"
                                    value={bucket.multiplier}
                                    onChange={e => updateLoadMultiplier(i, parseFloat(e.target.value) || 1)}
                                    className="w-full p-3 bg-white rounded-xl border border-navy-100 text-center text-lg font-black text-navy-950 focus:ring-2 focus:ring-primary/20"
                                />
                                <div className="w-full bg-navy-100 rounded-full h-2 overflow-hidden">
                                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, bucket.multiplier * 50)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Day-of-Week */}
                <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm p-8 space-y-6">
                    <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary p-2 bg-primary/5 rounded-xl">calendar_today</span>
                        Day-of-Week Modifiers
                    </h3>
                    <div className="grid grid-cols-7 gap-3">
                        {rules.dayModifiers.map((dm, i) => (
                            <div key={i} className={`p-4 rounded-2xl border space-y-2 text-center ${dm.multiplier > 1 ? 'bg-red-50/50 border-red-100' :
                                dm.multiplier < 1 ? 'bg-emerald-50/50 border-emerald-100' :
                                    'bg-navy-50/50 border-navy-100'
                                }`}>
                                <p className="text-[10px] font-black text-navy-700 uppercase tracking-widest">{dm.label.slice(0, 3)}</p>
                                <input
                                    type="number"
                                    step="0.05"
                                    min="0.5"
                                    max="2.0"
                                    value={dm.multiplier}
                                    onChange={e => updateDayMultiplier(i, parseFloat(e.target.value) || 1)}
                                    className="w-full p-2 bg-white rounded-xl border border-navy-100 text-center text-sm font-black text-navy-950 focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Live Preview */}
                <div className="bg-navy-950 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary p-2 bg-primary/20 rounded-xl">preview</span>
                        Live Preview — $350 Economy Base Fare
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {exampleResults.map((r, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center space-y-2">
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{r.label}</p>
                                <p className="text-2xl font-black text-white tracking-tighter">${r.fare}</p>
                                <p className={`text-[9px] font-black uppercase tracking-widest ${r.multiplier < 1 ? 'text-emerald-400' : r.multiplier > 1 ? 'text-red-400' : 'text-white/40'
                                    }`}>
                                    {r.multiplier}x
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingRulesAdmin;
