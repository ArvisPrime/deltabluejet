import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToastStore } from '../../stores/toastStore';
import {
    getLoyaltyStatus,
    getRewardsCatalog,
    redeemPoints,
    getRedemptionHistory,
    getPointsHistory,
    getTierInfo,
    getNextTierInfo,
    TIER_THRESHOLDS,
    type LoyaltyReward,
    type RedemptionRecord,
} from '../../services/loyaltyService';
import type { LoyaltyDoc, PointsHistoryEntry } from '../../types/firestore';

const CATEGORY_ICONS: Record<string, string> = {
    upgrade: 'airline_seat_flat',
    lounge: 'weekend',
    baggage: 'luggage',
    miles: 'moving',
    partner: 'handshake',
    experience: 'local_activity',
};

const LoyaltyRedemption: React.FC = () => {
    const { user } = useAuth();
    const addToast = useToastStore(s => s.addToast);
    const [loyalty, setLoyalty] = useState<LoyaltyDoc | null>(null);
    const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
    const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
    const [history, setHistory] = useState<PointsHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [redeeming, setRedeeming] = useState<string | null>(null);
    const [tab, setTab] = useState<'rewards' | 'history'>('rewards');

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const [loy, rews, reds] = await Promise.all([
                    getLoyaltyStatus(user.uid),
                    getRewardsCatalog(),
                    getRedemptionHistory(user.uid),
                ]);
                setLoyalty(loy);
                setRewards(rews);
                setRedemptions(reds);
                setHistory(getPointsHistory(loy));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    const handleRedeem = async (reward: LoyaltyReward) => {
        if (!user || !loyalty) return;
        setRedeeming(reward.id);
        try {
            const result = await redeemPoints(user.uid, reward);
            if (result.success) {
                addToast(result.message, 'success');
                const [loy, reds] = await Promise.all([
                    getLoyaltyStatus(user.uid),
                    getRedemptionHistory(user.uid),
                ]);
                setLoyalty(loy);
                setRedemptions(reds);
                setHistory(getPointsHistory(loy));
            } else {
                addToast(result.message, 'warning');
            }
        } catch {
            addToast('Redemption failed', 'error');
        } finally {
            setRedeeming(null);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-4">
                <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
                <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Loading Rewards…</p>
            </div>
        </div>
    );

    const tierInfo = loyalty ? getTierInfo(loyalty.tier) : TIER_THRESHOLDS[0];
    const nextTier = loyalty ? getNextTierInfo(loyalty.tier, loyalty.lifetimePoints) : null;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 font-display pb-32">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase">Rewards Store</h1>
                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Redeem your DeltaBlue Club points for exclusive rewards</p>
                </div>
            </div>

            {/* Points Card */}
            <div className="bg-navy-950 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 opacity-5 p-8"><span className="material-symbols-outlined text-[180px]">loyalty</span></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                    <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Available Points</span>
                        <p className="text-5xl font-black tracking-tighter" style={{ color: tierInfo.color }}>{loyalty?.totalPoints?.toLocaleString() || 0}</p>
                    </div>
                    <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Current Tier</span>
                        <p className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <span className="size-4 rounded-full" style={{ backgroundColor: tierInfo.color }} />
                            {tierInfo.label}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Lifetime Points</span>
                        <p className="text-2xl font-black tracking-tight">{loyalty?.lifetimePoints?.toLocaleString() || 0}</p>
                    </div>
                    <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                            {nextTier ? `${nextTier.pointsNeeded.toLocaleString()} pts to ${nextTier.nextTier}` : 'Max Tier Reached'}
                        </span>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: nextTier ? `${Math.min(100, ((loyalty?.lifetimePoints || 0) / ((loyalty?.lifetimePoints || 0) + nextTier.pointsNeeded)) * 100)}%` : '100%' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-navy-50 p-1.5 rounded-2xl w-fit border border-navy-100">
                {(['rewards', 'history'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-white text-navy-950 shadow-md' : 'text-navy-400 hover:text-navy-700'}`}>
                        {t === 'rewards' ? 'Rewards Catalog' : 'Redemption History'}
                    </button>
                ))}
            </div>

            {tab === 'rewards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {rewards.length === 0 ? (
                        <div className="col-span-full text-center py-20 space-y-4">
                            <span className="material-symbols-outlined text-5xl text-navy-200">redeem</span>
                            <p className="text-sm font-black text-navy-300 uppercase tracking-widest">No rewards available yet</p>
                            <p className="text-xs text-navy-400">Check back soon for exciting rewards!</p>
                        </div>
                    ) : rewards.map(reward => (
                        <div key={reward.id} className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm overflow-hidden hover:shadow-xl transition-all group">
                            {reward.imageUrl && (
                                <div className="h-40 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${reward.imageUrl}')` }} />
                            )}
                            <div className="p-8 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-400">
                                            <span className="material-symbols-outlined">{CATEGORY_ICONS[reward.category] || 'redeem'}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-navy-950 uppercase tracking-tight">{reward.name}</h3>
                                            <p className="text-[8px] font-black text-primary uppercase tracking-widest">{reward.category}{reward.partnerName ? ` • ${reward.partnerName}` : ''}</p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-navy-400 leading-relaxed">{reward.description}</p>
                                <div className="flex items-center justify-between pt-4 border-t border-navy-50">
                                    <div>
                                        <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Cost</p>
                                        <p className="text-xl font-black text-navy-950 tracking-tighter">{reward.pointsCost.toLocaleString()} pts</p>
                                    </div>
                                    <button
                                        onClick={() => handleRedeem(reward)}
                                        disabled={redeeming === reward.id || (loyalty?.totalPoints || 0) < reward.pointsCost}
                                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            (loyalty?.totalPoints || 0) >= reward.pointsCost
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95'
                                                : 'bg-navy-100 text-navy-300 cursor-not-allowed'
                                        }`}
                                    >
                                        {redeeming === reward.id ? 'Redeeming…' : (loyalty?.totalPoints || 0) >= reward.pointsCost ? 'Redeem' : 'Not Enough'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'history' && (
                <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm overflow-hidden">
                    {redemptions.length === 0 && history.length === 0 ? (
                        <div className="text-center py-20 space-y-4">
                            <span className="material-symbols-outlined text-5xl text-navy-200">history</span>
                            <p className="text-sm font-black text-navy-300 uppercase tracking-widest">No activity yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-navy-50">
                            {history.map((entry, i) => (
                                <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-navy-50/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`size-10 rounded-xl flex items-center justify-center ${entry.type === 'earn' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                            <span className="material-symbols-outlined text-lg">{entry.type === 'earn' ? 'add_circle' : 'remove_circle'}</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-navy-950 uppercase tracking-tight">{entry.description}</p>
                                            <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest">
                                                {entry.date?.toDate?.()?.toLocaleDateString() || 'N/A'} • Ref: {entry.bookingRef}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-lg font-black ${entry.type === 'earn' ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {entry.type === 'earn' ? '+' : '-'}{entry.amount.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LoyaltyRedemption;
