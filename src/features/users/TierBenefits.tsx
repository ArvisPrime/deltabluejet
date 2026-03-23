import React from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';
import {
    TIER_THRESHOLDS, TIER_BENEFITS, getTierInfo, getNextTierInfo,
} from '../../services/loyaltyService';
import type { LoyaltyTier } from '../../types/firestore';

interface Props {
    currentTier: LoyaltyTier;
    lifetimePoints: number;
    totalPoints: number;
}

const TierBenefits: React.FC<Props> = ({ currentTier, lifetimePoints, totalPoints }) => {
    const tierInfo = getTierInfo(currentTier);
    const nextInfo = getNextTierInfo(currentTier, lifetimePoints);
    const progress = nextInfo ? Math.min(100, ((lifetimePoints - (tierInfo?.minPoints || 0)) / ((nextInfo as any).pointsNeeded + lifetimePoints - (tierInfo?.minPoints || 0))) * 100) : 100;

    const renderCell = (val: string | boolean) => {
        if (val === true) return <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>;
        if (val === false) return <span className="material-symbols-outlined text-navy-200 text-sm">remove</span>;
        return <span className="text-xs font-black text-navy-700">{val}</span>;
    };

    return (
        <div className="space-y-6 font-display">
            {/* Current Status Card */}
            <div className="bg-gradient-to-br from-navy-900 to-navy-950 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Your DeltaBlue Club Tier</p>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: tierInfo?.color || '#137FEC' }}>
                            <span className="material-symbols-outlined text-white text-2xl">workspace_premium</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tighter">{tierInfo?.label}</h2>
                            <p className="text-xs text-white/60">{totalPoints.toLocaleString()} available miles</p>
                        </div>
                    </div>

                    {nextInfo && (
                        <div className="mt-4">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">
                                <span>Progress to {nextInfo.nextTier}</span>
                                <span>{nextInfo.pointsNeeded.toLocaleString()} miles to go</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Benefits Comparison Table */}
            <div className="bg-white rounded-2xl border border-navy-100 overflow-hidden">
                <div className="p-5 border-b border-navy-100">
                    <h3 className="text-xs font-black text-navy-900 uppercase tracking-widest">Tier Benefits Comparison</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-navy-100">
                                <th className="px-5 py-3 text-[10px] font-black text-navy-400 uppercase tracking-widest w-1/3">Benefit</th>
                                {TIER_THRESHOLDS.map(t => (
                                    <th key={t.tier} className={`px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest ${t.tier === currentTier ? 'text-primary bg-primary/5' : 'text-navy-400'}`}>
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="size-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: t.color + '20', color: t.color }}>
                                                <span className="material-symbols-outlined text-xs">workspace_premium</span>
                                            </div>
                                            {t.label}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {TIER_BENEFITS.map((b, i) => (
                                <tr key={i} className="border-b border-navy-50 last:border-0">
                                    <td className="px-5 py-3 text-xs font-bold text-navy-600">{b.label}</td>
                                    <td className={`px-4 py-3 text-center ${currentTier === 'blue' ? 'bg-primary/5' : ''}`}>{renderCell(b.blue)}</td>
                                    <td className={`px-4 py-3 text-center ${currentTier === 'silver' ? 'bg-primary/5' : ''}`}>{renderCell(b.silver)}</td>
                                    <td className={`px-4 py-3 text-center ${currentTier === 'gold' ? 'bg-primary/5' : ''}`}>{renderCell(b.gold)}</td>
                                    <td className={`px-4 py-3 text-center ${currentTier === 'platinum' ? 'bg-primary/5' : ''}`}>{renderCell(b.platinum)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CTA */}
            <div className="flex gap-3">
                <Link to={ROUTES.LOYALTY_REDEMPTION || '/loyalty/redeem'}
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest text-center shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
                    Redeem Miles
                </Link>
                <Link to={ROUTES.AWARD_BOOKING || '/book/award'}
                    className="flex-1 py-3 border-2 border-navy-100 rounded-xl font-black text-xs uppercase tracking-widest text-center text-navy-600 hover:bg-navy-50 transition-all">
                    Book with Miles
                </Link>
            </div>
        </div>
    );
};

export default TierBenefits;
