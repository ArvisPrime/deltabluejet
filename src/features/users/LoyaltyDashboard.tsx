
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
    getLoyaltyStatus,
    getPointsHistory,
    getTierInfo,
    getNextTierInfo,
    TIER_THRESHOLDS,
} from '../../services/loyaltyService';
import type { LoyaltyDoc, PointsHistoryEntry } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';

const LoyaltyDashboard: React.FC = () => {
    const { user } = useAuth();
    const [loyalty, setLoyalty] = useState<LoyaltyDoc | null>(null);
    const [history, setHistory] = useState<PointsHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) return;
        const load = async () => {
            try {
                const status = await getLoyaltyStatus(user.uid);
                setLoyalty(status);
                setHistory(getPointsHistory(status));
            } catch (err) { console.error(err); useToastStore.getState().addToast(err instanceof Error ? err.message : "An unexpected error occurred", "error"); }
            finally { setLoading(false); }
        };
        load();
    }, [user?.uid]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-navy-50/30">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin size-8 border-3 border-navy-200 border-t-primary rounded-full" />
                    <p className="text-xs font-black text-navy-400 uppercase tracking-widest">Loading loyalty status...</p>
                </div>
            </div>
        );
    }

    if (!loyalty) return null;

    const tierInfo = getTierInfo(loyalty.tier);
    const nextTier = getNextTierInfo(loyalty.tier, loyalty.lifetimePoints);
    const currentIdx = TIER_THRESHOLDS.findIndex(t => t.tier === loyalty.tier);
    const progressPercent = nextTier
        ? ((loyalty.lifetimePoints - TIER_THRESHOLDS[currentIdx].minPoints) /
            (TIER_THRESHOLDS[currentIdx + 1].minPoints - TIER_THRESHOLDS[currentIdx].minPoints)) * 100
        : 100;

    const fmtDate = (ts: any) => ts?.toDate ? ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--';

    return (
        <div className="h-full overflow-y-auto custom-scrollbar bg-navy-50/30">
            <div className="max-w-5xl mx-auto px-8 py-12 space-y-10 animate-in fade-in duration-500">
                {/* Header */}
                <div className="space-y-2">
                    <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">
                        <span>My Account</span>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                        <span className="text-primary">DeltaBlue Club</span>
                    </nav>
                    <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase">DeltaBlue Club</h1>
                    <p className="text-navy-500 font-medium italic text-lg">Your loyalty rewards and tier status</p>
                </div>

                {/* Tier Card */}
                <div className="relative rounded-[3rem] overflow-hidden shadow-2xl" style={{ background: `linear-gradient(135deg, ${tierInfo.color}22, ${tierInfo.color}44)` }}>
                    <div className="absolute inset-0 bg-navy-950/80" />
                    <div className="relative p-12 text-white space-y-8">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-3">Current Tier</p>
                                <div className="flex items-center gap-4">
                                    <div className="size-16 rounded-2xl flex items-center justify-center text-3xl font-black border-2 border-white/20 shadow-inner" style={{ backgroundColor: `${tierInfo.color}33`, color: tierInfo.color }}>
                                        {tierInfo.label.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tighter uppercase" style={{ color: tierInfo.color }}>{tierInfo.label}</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">DeltaBlue Club Member</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-2">Points Balance</p>
                                <p className="text-5xl font-black tracking-tighter">{loyalty.totalPoints.toLocaleString()}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">Available Points</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {nextTier && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50">
                                        Progress to {nextTier.nextTier}
                                    </p>
                                    <p className="text-xs font-black uppercase tracking-widest opacity-60">
                                        {nextTier.pointsNeeded.toLocaleString()} pts needed
                                    </p>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden ring-4 ring-white/5">
                                    <div
                                        className="h-full rounded-full transition-all duration-1000 ease-out shadow-lg"
                                        style={{ width: `${Math.min(100, progressPercent)}%`, backgroundColor: tierInfo.color, boxShadow: `0 0 20px ${tierInfo.color}66` }}
                                    />
                                </div>
                                {/* Tier Markers */}
                                <div className="flex justify-between px-1">
                                    {TIER_THRESHOLDS.map((t, i) => (
                                        <div key={t.tier} className={`flex flex-col items-center ${i <= currentIdx ? 'opacity-100' : 'opacity-30'}`}>
                                            <div className="size-3 rounded-full border-2 border-white/30 mb-1" style={{ backgroundColor: i <= currentIdx ? t.color : 'transparent' }} />
                                            <span className="text-[8px] font-black uppercase tracking-widest">{t.label}</span>
                                            <span className="text-[8px] font-bold opacity-40">{t.minPoints > 0 ? `${(t.minPoints / 1000).toFixed(0)}k` : '0'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {!nextTier && (
                            <div className="flex items-center gap-4 p-5 bg-white/10 rounded-2xl border border-white/10">
                                <span className="material-symbols-outlined text-2xl" style={{ color: tierInfo.color }}>workspace_premium</span>
                                <p className="text-sm font-black uppercase tracking-widest">You've reached the highest tier! Enjoy all Platinum benefits.</p>
                            </div>
                        )}

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10">
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                <p className="text-[9px] font-black uppercase tracking-[0.25em] opacity-40 mb-2">Lifetime Points</p>
                                <p className="text-2xl font-black tracking-tighter">{loyalty.lifetimePoints.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                <p className="text-[9px] font-black uppercase tracking-[0.25em] opacity-40 mb-2">Transactions</p>
                                <p className="text-2xl font-black tracking-tighter">{loyalty.pointsHistory.length}</p>
                            </div>
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                <p className="text-[9px] font-black uppercase tracking-[0.25em] opacity-40 mb-2">Member Since</p>
                                <p className="text-sm font-black tracking-tight">{fmtDate(loyalty.createdAt)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Points History */}
                <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-navy-100">
                        <h3 className="text-xl font-black text-navy-950 uppercase tracking-tighter flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary p-2 bg-primary/5 rounded-xl">history</span>
                            Points History
                        </h3>
                    </div>
                    <div className="divide-y divide-navy-50">
                        {history.length === 0 ? (
                            <div className="p-12 text-center">
                                <span className="material-symbols-outlined text-5xl text-navy-100 mb-4 block">stars</span>
                                <p className="text-sm font-black text-navy-300 uppercase tracking-widest">No points activity yet</p>
                                <p className="text-xs font-bold text-navy-400 mt-2">Book a flight to start earning DeltaBlue Club points!</p>
                            </div>
                        ) : (
                            history.map((entry, i) => (
                                <div key={i} className="flex items-center justify-between px-8 py-5 hover:bg-navy-50/30 transition-all group">
                                    <div className="flex items-center gap-5">
                                        <div className={`size-10 rounded-xl flex items-center justify-center ${entry.type === 'earn' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                            }`}>
                                            <span className="material-symbols-outlined text-lg">
                                                {entry.type === 'earn' ? 'add_circle' : 'remove_circle'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-navy-950 uppercase tracking-tight">{entry.description}</p>
                                            <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mt-1">
                                                {fmtDate(entry.date)}
                                                {entry.bookingRef && ` • Ref: ${entry.bookingRef}`}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-lg font-black tracking-tighter ${entry.type === 'earn' ? 'text-emerald-600' : 'text-red-600'
                                        }`}>
                                        {entry.type === 'earn' ? '+' : '-'}{entry.amount.toLocaleString()} pts
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Benefits Grid */}
                <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm p-8 space-y-8">
                    <h3 className="text-xl font-black text-navy-950 uppercase tracking-tighter flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary p-2 bg-primary/5 rounded-xl">card_giftcard</span>
                        Tier Benefits
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {TIER_THRESHOLDS.map((t) => (
                            <div key={t.tier}
                                className={`p-6 rounded-2xl border-2 transition-all ${t.tier === loyalty.tier
                                        ? 'border-current shadow-lg scale-[1.02]'
                                        : 'border-navy-100 opacity-60'
                                    }`}
                                style={t.tier === loyalty.tier ? { borderColor: t.color } : undefined}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="size-8 rounded-lg flex items-center justify-center font-black text-sm" style={{ backgroundColor: `${t.color}22`, color: t.color }}>
                                        {t.label.charAt(0)}
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-tight" style={{ color: t.color }}>{t.label}</span>
                                </div>
                                <ul className="space-y-2 text-[10px] font-bold text-navy-600 uppercase tracking-widest">
                                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-xs text-emerald-500">check</span> Priority Check-in</li>
                                    {(t.tier === 'silver' || t.tier === 'gold' || t.tier === 'platinum') && (
                                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-xs text-emerald-500">check</span> Extra Baggage</li>
                                    )}
                                    {(t.tier === 'gold' || t.tier === 'platinum') && (
                                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-xs text-emerald-500">check</span> Lounge Access</li>
                                    )}
                                    {t.tier === 'platinum' && (
                                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-xs text-emerald-500">check</span> Free Upgrades</li>
                                    )}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoyaltyDashboard;
