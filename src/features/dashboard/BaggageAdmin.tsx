import React, { useState, useEffect } from 'react';
import {
    getAllAllowances,
    getAllClaims,
    updateClaimStatus,
    SPECIAL_ITEMS,
    type BaggageAllowance,
} from '../../services/baggageService';
import type { BaggageClaimDoc } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';
import { useCurrency } from '../../hooks/useCurrency';

type Tab = 'policies' | 'claims' | 'specials';

const BaggageAdmin: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const { display } = useCurrency();
    const [tab, setTab] = useState<Tab>('policies');
    const [claims, setClaims] = useState<(BaggageClaimDoc & { id: string })[]>([]);
    const [loading, setLoading] = useState(false);

    const allowances = getAllAllowances();

    useEffect(() => {
        if (tab === 'claims') {
            setLoading(true);
            getAllClaims().then(setClaims).catch(console.error).finally(() => setLoading(false));
        }
    }, [tab]);

    const handleClaimAction = async (claimId: string, status: BaggageClaimDoc['status'], resolution?: string) => {
        try {
            await updateClaimStatus(claimId, status, resolution);
            setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status } : c));
            addToast(`Claim updated to ${status.replace(/_/g, ' ')}`, 'success');
        } catch {
            addToast('Failed to update claim', 'error');
        }
    };

    const STATUS_COLORS: Record<string, string> = {
        submitted: 'bg-blue-100 text-blue-700',
        investigating: 'bg-amber-100 text-amber-700',
        found: 'bg-emerald-100 text-emerald-700',
        resolved: 'bg-emerald-100 text-emerald-700',
        compensation_issued: 'bg-purple-100 text-purple-700',
        closed: 'bg-navy-100 text-navy-500',
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto font-display animate-in fade-in">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Baggage Management</h1>
                <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Policies, claims, and special items configuration</p>
            </div>

            {/* Tab Bar */}
            <div className="flex gap-2">
                {([['policies', 'rule', 'Baggage Policies'], ['claims', 'support_agent', 'Claims Queue'], ['specials', 'category', 'Special Items']] as const).map(([id, icon, label]) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === id ? 'bg-navy-950 text-white shadow-lg' : 'bg-navy-50 text-navy-400 hover:bg-navy-100'}`}
                    >
                        <span className="material-symbols-outlined text-sm">{icon}</span>{label}
                    </button>
                ))}
            </div>

            {/* ─── Policies Tab ─── */}
            {tab === 'policies' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {allowances.map(a => (
                            <div key={a.fareClass} className="bg-white rounded-3xl border border-navy-100 shadow-sm p-6 space-y-4 relative group">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-black text-navy-900 uppercase tracking-widest">{a.displayName}</h4>
                                    <span className="material-symbols-outlined text-navy-200 group-hover:text-navy-400 transition-colors cursor-pointer">edit</span>
                                </div>
                                <table className="w-full text-xs">
                                    <tbody>
                                        <tr className="border-b border-navy-50">
                                            <td className="py-2 font-bold text-navy-400">Cabin Bags</td>
                                            <td className="py-2 font-black text-navy-900 text-right">{a.cabin.count} × {a.cabin.maxWeightKg}kg</td>
                                        </tr>
                                        <tr className="border-b border-navy-50">
                                            <td className="py-2 font-bold text-navy-400">Checked Bags</td>
                                            <td className="py-2 font-black text-navy-900 text-right">{a.checked.count} × {a.checked.maxWeightKg}kg</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2 font-bold text-navy-400">Personal Item</td>
                                            <td className="py-2 font-black text-navy-900 text-right">{a.personalItem ? 'Yes' : 'No'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-3xl border border-navy-100 shadow-sm p-6">
                        <h4 className="text-xs font-black text-navy-400 uppercase tracking-widest mb-4">Excess Baggage Pricing</h4>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-navy-100">
                                    <th className="text-left py-2 text-[10px] font-black text-navy-400 uppercase tracking-widest">Fare Class</th>
                                    <th className="text-right py-2 text-[10px] font-black text-navy-400 uppercase tracking-widest">Extra Bag Fee</th>
                                    <th className="text-right py-2 text-[10px] font-black text-navy-400 uppercase tracking-widest">Overweight (per kg)</th>
                                    <th className="text-right py-2 text-[10px] font-black text-navy-400 uppercase tracking-widest">Max Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-navy-50">
                                    <td className="py-3 font-bold text-navy-700">Economy</td>
                                    <td className="py-3 font-black text-navy-900 text-right">$50.00</td>
                                    <td className="py-3 font-black text-navy-900 text-right">$15.00</td>
                                    <td className="py-3 font-black text-navy-900 text-right">5 bags</td>
                                </tr>
                                <tr className="border-b border-navy-50">
                                    <td className="py-3 font-bold text-navy-700">Business</td>
                                    <td className="py-3 font-black text-navy-900 text-right">$35.00</td>
                                    <td className="py-3 font-black text-navy-900 text-right">$15.00</td>
                                    <td className="py-3 font-black text-navy-900 text-right">5 bags</td>
                                </tr>
                                <tr>
                                    <td className="py-3 font-bold text-navy-700">First Class</td>
                                    <td className="py-3 font-black text-emerald-600 text-right">Free</td>
                                    <td className="py-3 font-black text-navy-900 text-right">$15.00</td>
                                    <td className="py-3 font-black text-navy-900 text-right">5 bags</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ─── Claims Tab ─── */}
            {tab === 'claims' && (
                <div className="bg-white rounded-3xl border border-navy-100 shadow-sm overflow-hidden">
                    <div className="bg-navy-50/50 px-8 py-5 border-b border-navy-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-xl">support_agent</span>
                            <h3 className="text-sm font-black text-navy-900 uppercase tracking-widest">Baggage Claims</h3>
                        </div>
                        <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{claims.length} total</span>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : claims.length === 0 ? (
                        <div className="py-20 text-center">
                            <span className="material-symbols-outlined text-5xl text-navy-200 mb-3">inventory_2</span>
                            <p className="text-sm font-black text-navy-300 uppercase tracking-widest">No claims filed</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-navy-50">
                            {claims.map(c => (
                                <div key={c.id} className="px-8 py-5 flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-xs font-black text-navy-900 uppercase tracking-wider">
                                                {c.type} — Tag: {c.tagNumber}
                                            </span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${STATUS_COLORS[c.status]}`}>
                                                {c.status.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-navy-400">PNR: {c.pnr} • {c.contactEmail}</p>
                                        <p className="text-xs font-medium text-navy-500 mt-1">{c.description}</p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        {c.status === 'submitted' && (
                                            <button onClick={() => handleClaimAction(c.id, 'investigating')} className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-amber-200 transition-colors">
                                                Investigate
                                            </button>
                                        )}
                                        {c.status === 'investigating' && (
                                            <>
                                                <button onClick={() => handleClaimAction(c.id, 'found', 'Bag located')} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-emerald-200 transition-colors">
                                                    Found
                                                </button>
                                                <button onClick={() => handleClaimAction(c.id, 'compensation_issued', 'Compensation processed')} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-purple-200 transition-colors">
                                                    Compensate
                                                </button>
                                            </>
                                        )}
                                        {(c.status === 'found' || c.status === 'compensation_issued') && (
                                            <button onClick={() => handleClaimAction(c.id, 'closed', 'Claim closed')} className="px-4 py-2 bg-navy-100 text-navy-500 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-navy-200 transition-colors">
                                                Close
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ─── Special Items Tab ─── */}
            {tab === 'specials' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {SPECIAL_ITEMS.map(item => (
                        <div key={item.id} className="bg-white rounded-3xl border border-navy-100 shadow-sm p-6 flex items-start gap-4">
                            <span className="material-symbols-outlined text-primary p-3 bg-primary/10 rounded-xl text-2xl">{item.icon}</span>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-xs font-black text-navy-900 uppercase tracking-wider">{item.name}</h4>
                                    {item.requiresApproval && (
                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase tracking-widest rounded-full">Approval Req.</span>
                                    )}
                                </div>
                                <p className="text-[10px] font-bold text-navy-400 leading-relaxed">{item.description}</p>
                                <p className="text-sm font-black text-navy-900 mt-2">
                                    {item.feeCents === 0 ? <span className="text-emerald-600">Complimentary</span> : display(item.feeCents / 100)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BaggageAdmin;
