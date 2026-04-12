import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../../config/routes';
import { useBookingStore } from '../../stores/bookingStore';
import { useCurrency } from '../../hooks/useCurrency';
import { useConfigStore } from '../../stores/configStore';

const BaggageSelection: React.FC = () => {
    const navigate = useNavigate();
    const selectedFlight = useBookingStore(s => s.selectedFlight);
    const fareClass = selectedFlight?.fareClass || 'economy';
    const { display } = useCurrency();
    const baggageConfig = useConfigStore(s => s.baggage);

    // Fallback allowance if config isn't loaded yet
    const defaultAllowance = {
        cabin: { count: 1, maxWeightKg: 7 },
        checked: { count: 0, maxWeightKg: 0 },
        personalItem: true,
        displayName: 'Light',
        extraBagFeeCents: 5000,
    };

    const allowance = baggageConfig?.fareAllowances?.[fareClass] || defaultAllowance;
    const excessFeePerKgCents = baggageConfig?.excessFeePerKgCents || 1500;
    const specialItemsList = baggageConfig?.specialItems || [];

    // ── State ────────────────────────────────────────────
    const [checkedBags, setCheckedBags] = useState(allowance.checked.count);
    const [totalWeightKg, setTotalWeightKg] = useState(allowance.checked.maxWeightKg * Math.max(1, allowance.checked.count));
    const [selectedSpecials, setSelectedSpecials] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (checkedBags === allowance.checked.count && totalWeightKg < allowance.checked.maxWeightKg * allowance.checked.count) {
             setTotalWeightKg(allowance.checked.maxWeightKg * allowance.checked.count);
        }
    }, [checkedBags, allowance, totalWeightKg]);

    // ── Calculations ─────────────────────────────────────
    const excessResult = useMemo(() => {
        const breakdown: string[] = [];
        const MAX_TOTAL_BAGS = 5;

        // Extra bags fee
        const extraBags = Math.max(0, Math.min(checkedBags, MAX_TOTAL_BAGS) - allowance.checked.count);
        const perBagFee = allowance.extraBagFeeCents ?? 5000;
        const extraBagFee = extraBags * perBagFee;

        if (extraBags > 0) {
            breakdown.push(`${extraBags} extra bag${extraBags > 1 ? 's' : ''} × ${display(perBagFee / 100)} = ${display(extraBagFee / 100)}`);
        }

        // Overweight fee
        const allowedWeight = allowance.checked.maxWeightKg * Math.max(checkedBags, allowance.checked.count);
        const overweightKg = Math.max(0, totalWeightKg - allowedWeight);
        const overweightFee = overweightKg * excessFeePerKgCents;

        if (overweightKg > 0) {
            breakdown.push(`${overweightKg}kg overweight × ${display(excessFeePerKgCents / 100)}/kg = ${display(overweightFee / 100)}`);
        }

        if (breakdown.length === 0) {
            breakdown.push('Within your free baggage allowance');
        }

        return {
            extraBags,
            extraBagFee,
            overweightFee,
            totalFee: extraBagFee + overweightFee,
            breakdown,
        };
    }, [checkedBags, totalWeightKg, allowance, excessFeePerKgCents, display]);

    const specialItemsFee = useMemo(() => {
        return Array.from(selectedSpecials).reduce((sum, id) => {
            const item = specialItemsList.find((i: any) => i.id === id);
            return sum + (item?.feeCents || 0);
        }, 0);
    }, [selectedSpecials, specialItemsList]);

    const grandTotal = excessResult.totalFee + specialItemsFee;

    const toggleSpecial = (id: string) => {
        setSelectedSpecials(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in slide-in-from-right duration-500 font-display">
            <div className="lg:col-span-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-end">
                        <h2 className="text-3xl font-black tracking-tighter text-navy-950">Baggage</h2>
                        <span className="text-xs font-black text-navy-400 uppercase tracking-widest">Optional</span>
                    </div>
                    <p className="text-navy-500 font-medium italic">Choose your checked baggage and any special items you'd like to bring.</p>
                </div>

                {/* Free Allowance Card */}
                <div className="bg-emerald-50/50 rounded-3xl border border-emerald-100 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-emerald-500 p-2 bg-white rounded-xl shadow-sm">check_circle</span>
                        <h3 className="text-sm font-black text-navy-900 uppercase tracking-widest">Your Free Allowance — {allowance.displayName}</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl p-4 border border-emerald-100 text-center">
                            <span className="material-symbols-outlined text-emerald-500 text-2xl mb-2">backpack</span>
                            <p className="text-xs font-black text-navy-900 uppercase tracking-wider">Cabin</p>
                            <p className="text-[10px] font-bold text-navy-400 mt-1">{allowance.cabin.count} bag × {allowance.cabin.maxWeightKg}kg</p>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border border-emerald-100 text-center">
                            <span className="material-symbols-outlined text-emerald-500 text-2xl mb-2">luggage</span>
                            <p className="text-xs font-black text-navy-900 uppercase tracking-wider">Checked</p>
                            <p className="text-[10px] font-bold text-navy-400 mt-1">{allowance.checked.count} bag{allowance.checked.count > 1 ? 's' : ''} × {allowance.checked.maxWeightKg}kg</p>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border border-emerald-100 text-center">
                            <span className="material-symbols-outlined text-emerald-500 text-2xl mb-2">shopping_bag</span>
                            <p className="text-xs font-black text-navy-900 uppercase tracking-wider">Personal</p>
                            <p className="text-[10px] font-bold text-navy-400 mt-1">{allowance.personalItem ? '1 small item' : 'Not included'}</p>
                        </div>
                    </div>
                </div>

                {/* Extra Checked Bags */}
                <div className="bg-white rounded-3xl border border-navy-100 shadow-sm overflow-hidden">
                    <div className="bg-navy-50/50 px-8 py-5 border-b border-navy-100 flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-xl">luggage</span>
                        <h3 className="text-sm font-black text-navy-900 uppercase tracking-widest">Checked Baggage</h3>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Number of Checked Bags</label>
                                <p className="text-[10px] text-navy-500 font-bold mt-1">Max 5 bags per passenger</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setCheckedBags(Math.max(0, checkedBags - 1))}
                                    className="w-10 h-10 rounded-xl bg-navy-50 border border-navy-100 flex items-center justify-center hover:bg-navy-100 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-navy-600">remove</span>
                                </button>
                                <span className="w-10 text-center text-xl font-black text-navy-900">{checkedBags}</span>
                                <button
                                    onClick={() => setCheckedBags(Math.min(5, checkedBags + 1))}
                                    className="w-10 h-10 rounded-xl bg-navy-50 border border-navy-100 flex items-center justify-center hover:bg-navy-100 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-navy-600">add</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Estimated Total Weight (kg)</label>
                            <input
                                type="range"
                                min={0}
                                max={150}
                                value={totalWeightKg}
                                onChange={e => setTotalWeightKg(Number(e.target.value))}
                                className="w-full mt-3 accent-primary"
                            />
                            <div className="flex justify-between text-[10px] font-bold text-navy-400 mt-1">
                                <span>0 kg</span>
                                <span className="text-navy-900 text-sm font-black">{totalWeightKg} kg</span>
                                <span>150 kg</span>
                            </div>
                        </div>

                        {/* Excess Breakdown */}
                        <div className={`rounded-2xl p-5 space-y-2 ${excessResult.totalFee > 0 ? 'bg-amber-50 border border-amber-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                            {excessResult.breakdown.map((line, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm font-bold text-navy-600">
                                    <span className={`material-symbols-outlined text-sm ${excessResult.totalFee > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                        {excessResult.totalFee > 0 ? 'paid' : 'check_circle'}
                                    </span>
                                    {line}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Special Items */}
                <div className="bg-white rounded-3xl border border-navy-100 shadow-sm overflow-hidden">
                    <div className="bg-navy-50/50 px-8 py-5 border-b border-navy-100 flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-xl">category</span>
                        <h3 className="text-sm font-black text-navy-900 uppercase tracking-widest">Special Items</h3>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {specialItemsList.map((item: any) => {
                            const isSelected = selectedSpecials.has(item.id);
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => toggleSpecial(item.id)}
                                    className={`text-left p-5 rounded-2xl border-2 transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-navy-100 hover:border-navy-200'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className={`material-symbols-outlined p-2 rounded-xl ${isSelected ? 'bg-primary text-white' : 'bg-navy-50 text-navy-400'}`}>{item.icon}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-black text-navy-900 uppercase tracking-wider">{item.name}</h4>
                                                {item.requiresApproval && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase tracking-widest rounded-full">Approval Req.</span>}
                                            </div>
                                            <p className="text-[10px] font-bold text-navy-400 mt-1 leading-relaxed">{item.description}</p>
                                            <p className="text-sm font-black text-navy-900 mt-2">
                                                {item.feeCents === 0 ? <span className="text-emerald-600">Free</span> : display(item.feeCents / 100)}
                                            </p>
                                        </div>
                                        {isSelected && <span className="material-symbols-outlined text-primary">check_circle</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex flex-col-reverse sm:flex-row justify-between gap-4">
                    <button onClick={() => navigate(ROUTES.SEAT_SELECTION)} className="flex items-center justify-center gap-2 h-14 px-8 rounded-2xl border-2 border-navy-100 text-navy-700 font-black hover:bg-navy-50 transition-all uppercase text-xs tracking-widest">
                        <span className="material-symbols-outlined">arrow_back</span> Back
                    </button>
                    <button
                        onClick={() => navigate(ROUTES.PAYMENT)}
                        className="flex items-center justify-center gap-2 h-14 px-10 rounded-2xl bg-primary text-white font-black shadow-xl shadow-primary/20 hover:bg-primary-600 transition-all uppercase text-xs tracking-widest"
                    >
                        Continue to Payment <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                </div>
            </div>

            {/* ═══ Right Sidebar: Summary ═══ */}
            <div className="lg:col-span-4 space-y-6 relative">
                <div className="sticky top-8 space-y-6">
                    <div className="bg-white rounded-3xl border border-navy-100 shadow-sm p-6 space-y-5">
                        <h3 className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Baggage Summary</h3>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between font-bold">
                                <span className="text-navy-500">Cabin Bags</span>
                                <span className="text-navy-900">{allowance.cabin.count} × {allowance.cabin.maxWeightKg}kg</span>
                            </div>
                            <div className="flex justify-between font-bold">
                                <span className="text-navy-500">Checked Bags</span>
                                <span className="text-navy-900">{checkedBags} total</span>
                            </div>
                            <div className="flex justify-between font-bold">
                                <span className="text-navy-500">Total Weight</span>
                                <span className="text-navy-900">{totalWeightKg} kg</span>
                            </div>

                            {excessResult.totalFee > 0 && (
                                <>
                                    <hr className="border-dashed border-navy-100" />
                                    <div className="flex justify-between font-bold">
                                        <span className="text-amber-600">Excess Baggage Fee</span>
                                        <span className="text-amber-600">{display(excessResult.totalFee / 100)}</span>
                                    </div>
                                </>
                            )}

                            {selectedSpecials.size > 0 && (
                                <>
                                    <hr className="border-dashed border-navy-100" />
                                    {Array.from(selectedSpecials).map(id => {
                                        const item = specialItemsList.find((i: any) => i.id === id);
                                        return item ? (
                                            <div key={id} className="flex justify-between font-bold text-xs">
                                                <span className="text-navy-500">{item.name}</span>
                                                <span className="text-navy-900">{item.feeCents === 0 ? 'Free' : display(item.feeCents / 100)}</span>
                                            </div>
                                        ) : null;
                                    })}
                                </>
                            )}

                            <hr className="border-navy-100" />
                            <div className="flex justify-between items-end pt-2">
                                <span className="text-xs font-black text-navy-400 uppercase tracking-widest">Additional Cost</span>
                                <span className={`text-2xl font-black ${grandTotal > 0 ? 'text-primary' : 'text-emerald-600'}`}>
                                    {grandTotal === 0 ? 'Free' : display(grandTotal / 100)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100 flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary p-2 bg-white rounded-xl shadow-sm text-sm">info</span>
                        <p className="text-[10px] text-navy-400 font-bold leading-relaxed uppercase">
                            Baggage fees can also be added after booking from the Manage Booking page. Prices may vary at the airport.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BaggageSelection;
