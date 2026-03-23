import React, { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { calculateMilesCashSplit, getLoyaltyStatus } from '../../services/loyaltyService';

interface Props {
    totalPrice: number;
    currency?: string;
    onPaymentSplit?: (milesUsed: number, cashAmount: number) => void;
}

const MilesCashPayment: React.FC<Props> = ({ totalPrice, currency = 'USD', onPaymentSplit }) => {
    const user = useAuthStore(s => s.user);
    const addToast = useToastStore(s => s.addToast);
    const [milesPercentage, setMilesPercentage] = useState(50);
    const [milesAvailable, setMilesAvailable] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) return;
        setLoading(true);
        getLoyaltyStatus(user.uid)
            .then(l => setMilesAvailable(l.totalPoints))
            .catch(() => addToast('Could not load miles balance', 'error'))
            .finally(() => setLoading(false));
    }, [user?.uid]);

    const split = useMemo(
        () => calculateMilesCashSplit(totalPrice, milesAvailable, milesPercentage),
        [totalPrice, milesAvailable, milesPercentage],
    );

    useEffect(() => {
        onPaymentSplit?.(split.milesUsed, split.cashAmount);
    }, [split.milesUsed, split.cashAmount]);

    const maxMilesPercent = useMemo(() => {
        if (milesAvailable === 0) return 0;
        const maxValue = milesAvailable * 0.01;
        return Math.min(100, Math.ceil((maxValue / totalPrice) * 100));
    }, [milesAvailable, totalPrice]);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-navy-100 p-6 font-display animate-pulse">
                <div className="h-4 bg-navy-100 rounded w-1/3 mb-4" />
                <div className="h-8 bg-navy-100 rounded mb-4" />
                <div className="h-4 bg-navy-100 rounded w-1/2" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-navy-100 p-6 font-display space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-navy-900 uppercase tracking-widest">Miles + Cash Payment</h3>
                <div className="text-right">
                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Available Miles</p>
                    <p className="text-lg font-black text-navy-950">{milesAvailable.toLocaleString()}</p>
                </div>
            </div>

            {/* Slider */}
            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-navy-400">
                    <span>100% Cash</span>
                    <span>{milesPercentage}% Miles</span>
                    <span>100% Miles</span>
                </div>
                <input
                    type="range" min={0} max={maxMilesPercent} value={milesPercentage}
                    onChange={e => setMilesPercentage(Number(e.target.value))}
                    className="w-full h-2 bg-navy-100 rounded-full appearance-none cursor-pointer accent-primary"
                    aria-label="Miles percentage slider"
                />
                <div className="flex">
                    <div className="h-2 bg-primary/20 rounded-l-full" style={{ width: `${milesPercentage}%` }} />
                    <div className="h-2 bg-emerald-100 rounded-r-full" style={{ width: `${100 - milesPercentage}%` }} />
                </div>
            </div>

            {/* Split Display */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-center">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Miles</p>
                    <p className="text-2xl font-black text-navy-950 tracking-tighter">{split.milesUsed.toLocaleString()}</p>
                    <p className="text-[10px] text-navy-400">= ${split.milesValue.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Cash</p>
                    <p className="text-2xl font-black text-navy-950 tracking-tighter">${split.cashAmount.toFixed(2)}</p>
                    <p className="text-[10px] text-navy-400">{currency}</p>
                </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center p-4 bg-navy-950 text-white rounded-xl">
                <span className="text-xs font-black uppercase tracking-widest">Total Fare</span>
                <span className="text-xl font-black tracking-tighter">${totalPrice.toFixed(2)}</span>
            </div>

            {/* Quick Presets */}
            <div className="flex gap-2">
                {[0, 25, 50, 75, 100].map(pct => {
                    const capped = Math.min(pct, maxMilesPercent);
                    return (
                        <button key={pct} onClick={() => setMilesPercentage(capped)}
                            disabled={pct > maxMilesPercent}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                milesPercentage === capped && pct <= maxMilesPercent
                                    ? 'bg-primary text-white shadow-md'
                                    : pct > maxMilesPercent
                                    ? 'bg-navy-50 text-navy-200 cursor-not-allowed'
                                    : 'bg-navy-50 text-navy-500 hover:bg-navy-100'
                            }`}>
                            {pct}%
                        </button>
                    );
                })}
            </div>

            {milesAvailable === 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                    You have no miles available. The full amount will be charged as cash.
                </p>
            )}
        </div>
    );
};

export default MilesCashPayment;
