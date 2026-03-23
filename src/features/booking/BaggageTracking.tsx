import React, { useState } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';
import { useAuth } from '../../hooks/useAuth';
import {
    getUserClaims,
    createBaggageClaim,
    getDefaultAllowance,
    getAllAllowances,
    type BaggageAllowance,
} from '../../services/baggageService';
import type { BaggageClaimDoc } from '../../types/firestore';

type Tab = 'track' | 'allowance' | 'claim';

const BaggageTracking: React.FC = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState<Tab>('track');

    // Track tab
    const [trackInput, setTrackInput] = useState('');
    const [trackResult, setTrackResult] = useState<{ found: boolean; status: string; details: string } | null>(null);
    const [trackLoading, setTrackLoading] = useState(false);

    // Claims
    const [claims, setClaims] = useState<(BaggageClaimDoc & { id: string })[]>([]);
    const [claimsLoaded, setClaimsLoaded] = useState(false);

    // Claim form
    const [claimForm, setClaimForm] = useState({
        bookingId: '',
        pnr: '',
        tagNumber: '',
        type: 'delayed' as BaggageClaimDoc['type'],
        description: '',
        contactPhone: '',
        contactEmail: user?.email || '',
        deliveryAddress: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleTrack = () => {
        if (!trackInput.trim()) return;
        setTrackLoading(true);
        // Simulated tracking — in production this would query Firestore or a baggage system API
        setTimeout(() => {
            setTrackResult({
                found: true,
                status: 'In Transit',
                details: `Tag ${trackInput.toUpperCase()} was last scanned at departure gate. Expected at destination carousel within 30 minutes of landing.`,
            });
            setTrackLoading(false);
        }, 1200);
    };

    const loadClaims = async () => {
        if (!user || claimsLoaded) return;
        try {
            const c = await getUserClaims(user.uid);
            setClaims(c);
        } catch { /* ignore */ }
        setClaimsLoaded(true);
    };

    const handleClaimSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSubmitting(true);
        try {
            await createBaggageClaim(
                claimForm.bookingId, user.uid, claimForm.pnr, claimForm.type,
                claimForm.description, claimForm.contactPhone, claimForm.contactEmail,
                claimForm.tagNumber, claimForm.deliveryAddress || undefined,
            );
            setSubmitted(true);
        } catch { /* ignore */ }
        setSubmitting(false);
    };

    const allowances: BaggageAllowance[] = getAllAllowances();

    const STATUS_COLORS: Record<string, string> = {
        submitted: 'bg-blue-100 text-blue-700',
        investigating: 'bg-amber-100 text-amber-700',
        found: 'bg-emerald-100 text-emerald-700',
        resolved: 'bg-emerald-100 text-emerald-700',
        compensation_issued: 'bg-purple-100 text-purple-700',
        closed: 'bg-navy-100 text-navy-500',
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 font-display">
            <div>
                <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Baggage Services</h1>
                <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-1">Track, claim, or view your baggage allowance</p>
            </div>

            {/* Tab Bar */}
            <div className="flex gap-2">
                {([['track', 'search', 'Track Bag'], ['allowance', 'luggage', 'Allowances'], ['claim', 'report_problem', 'File Claim']] as const).map(([id, icon, label]) => (
                    <button
                        key={id}
                        onClick={() => { setTab(id); if (id === 'claim') loadClaims(); }}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === id ? 'bg-navy-950 text-white shadow-lg' : 'bg-navy-50 text-navy-400 hover:bg-navy-100'}`}
                    >
                        <span className="material-symbols-outlined text-sm">{icon}</span>{label}
                    </button>
                ))}
            </div>

            {/* ─── Track Tab ─── */}
            {tab === 'track' && (
                <div className="bg-white rounded-3xl border border-navy-100 shadow-sm overflow-hidden">
                    <div className="bg-navy-50/50 px-8 py-5 border-b border-navy-100 flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-xl">location_searching</span>
                        <h3 className="text-sm font-black text-navy-900 uppercase tracking-widest">Track Your Baggage</h3>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={trackInput}
                                onChange={e => setTrackInput(e.target.value)}
                                placeholder="Enter bag tag number (e.g. DB-123456) or PNR"
                                className="flex-1 h-14 px-5 bg-navy-50 rounded-xl text-sm font-bold text-navy-950 border-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-navy-300"
                                onKeyDown={e => e.key === 'Enter' && handleTrack()}
                            />
                            <button onClick={handleTrack} disabled={trackLoading} className="px-8 h-14 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-600 transition-all disabled:opacity-50 flex items-center gap-2">
                                {trackLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-sm">search</span>}
                                Track
                            </button>
                        </div>
                        {trackResult && (
                            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-emerald-500">flight_land</span>
                                    <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">{trackResult.status}</span>
                                </div>
                                <p className="text-sm font-bold text-navy-600">{trackResult.details}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── Allowance Tab ─── */}
            {tab === 'allowance' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {allowances.map(a => (
                        <div key={a.fareClass} className="bg-white rounded-3xl border border-navy-100 shadow-sm p-6 space-y-4">
                            <h4 className="text-sm font-black text-navy-900 uppercase tracking-widest">{a.displayName}</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm font-bold text-navy-600">
                                    <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg text-sm">backpack</span>
                                    Cabin: {a.cabin.count} × {a.cabin.maxWeightKg}kg
                                </div>
                                <div className="flex items-center gap-3 text-sm font-bold text-navy-600">
                                    <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg text-sm">luggage</span>
                                    Checked: {a.checked.count} × {a.checked.maxWeightKg}kg
                                </div>
                                <div className="flex items-center gap-3 text-sm font-bold text-navy-600">
                                    <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg text-sm">shopping_bag</span>
                                    Personal Item: {a.personalItem ? 'Yes' : 'No'}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="col-span-full bg-blue-50/50 rounded-2xl border border-blue-100 p-5 flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary text-sm p-2 bg-white rounded-xl shadow-sm">info</span>
                        <p className="text-[10px] font-bold text-navy-400 uppercase leading-relaxed">
                            Additional bags may be purchased during booking or from the Manage Booking page. Airport prices may be higher.
                        </p>
                    </div>
                </div>
            )}

            {/* ─── Claim Tab ─── */}
            {tab === 'claim' && (
                <div className="space-y-6">
                    {!submitted ? (
                        <form onSubmit={handleClaimSubmit} className="bg-white rounded-3xl border border-navy-100 shadow-sm overflow-hidden">
                            <div className="bg-navy-50/50 px-8 py-5 border-b border-navy-100 flex items-center gap-3">
                                <span className="material-symbols-outlined text-red-500 p-2 bg-red-50 rounded-xl">report_problem</span>
                                <h3 className="text-sm font-black text-navy-900 uppercase tracking-widest">File a Baggage Claim</h3>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">PNR / Reference Code *</label>
                                    <input type="text" required value={claimForm.pnr} onChange={e => setClaimForm({ ...claimForm, pnr: e.target.value })} className="w-full h-12 mt-1 px-4 bg-navy-50 rounded-xl text-sm font-bold text-navy-950 border-none focus:ring-2 focus:ring-primary/30" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Bag Tag Number *</label>
                                    <input type="text" required value={claimForm.tagNumber} onChange={e => setClaimForm({ ...claimForm, tagNumber: e.target.value })} placeholder="e.g. DB-123456" className="w-full h-12 mt-1 px-4 bg-navy-50 rounded-xl text-sm font-bold text-navy-950 border-none focus:ring-2 focus:ring-primary/30 placeholder:text-navy-300" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Claim Type *</label>
                                    <select value={claimForm.type} onChange={e => setClaimForm({ ...claimForm, type: e.target.value as BaggageClaimDoc['type'] })} className="w-full h-12 mt-1 px-4 bg-navy-50 rounded-xl text-sm font-bold text-navy-950 border-none focus:ring-2 focus:ring-primary/30">
                                        <option value="delayed">Delayed</option>
                                        <option value="lost">Lost</option>
                                        <option value="damaged">Damaged</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Contact Phone *</label>
                                    <input type="tel" required value={claimForm.contactPhone} onChange={e => setClaimForm({ ...claimForm, contactPhone: e.target.value })} className="w-full h-12 mt-1 px-4 bg-navy-50 rounded-xl text-sm font-bold text-navy-950 border-none focus:ring-2 focus:ring-primary/30" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Contact Email *</label>
                                    <input type="email" required value={claimForm.contactEmail} onChange={e => setClaimForm({ ...claimForm, contactEmail: e.target.value })} className="w-full h-12 mt-1 px-4 bg-navy-50 rounded-xl text-sm font-bold text-navy-950 border-none focus:ring-2 focus:ring-primary/30" />
                                </div>
                                {claimForm.type === 'delayed' && (
                                    <div>
                                        <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Delivery Address</label>
                                        <input type="text" value={claimForm.deliveryAddress} onChange={e => setClaimForm({ ...claimForm, deliveryAddress: e.target.value })} placeholder="For delayed bag delivery" className="w-full h-12 mt-1 px-4 bg-navy-50 rounded-xl text-sm font-bold text-navy-950 border-none focus:ring-2 focus:ring-primary/30 placeholder:text-navy-300" />
                                    </div>
                                )}
                                <div className="col-span-full">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Description *</label>
                                    <textarea required rows={3} value={claimForm.description} onChange={e => setClaimForm({ ...claimForm, description: e.target.value })} placeholder="Describe contents, color, brand, identifying features..." className="w-full mt-1 px-4 py-3 bg-navy-50 rounded-xl text-sm font-bold text-navy-950 border-none focus:ring-2 focus:ring-primary/30 placeholder:text-navy-300 resize-none" />
                                </div>
                                <div className="col-span-full flex justify-end pt-4">
                                    <button type="submit" disabled={submitting} className="px-10 h-12 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all disabled:opacity-50 flex items-center gap-2">
                                        {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-sm">send</span>}
                                        Submit Claim
                                    </button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="bg-emerald-50 rounded-3xl border border-emerald-100 p-8 text-center space-y-4 animate-in fade-in zoom-in-95">
                            <span className="material-symbols-outlined text-emerald-500 text-5xl">check_circle</span>
                            <h3 className="text-xl font-black text-navy-900 uppercase tracking-wider">Claim Submitted</h3>
                            <p className="text-sm text-navy-600 font-medium max-w-md mx-auto">Your baggage claim has been recorded. Our team will investigate and contact you within 24–48 hours.</p>
                            <button onClick={() => { setSubmitted(false); setClaimForm({ ...claimForm, description: '', tagNumber: '' }); }} className="px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-600 transition-all">
                                File Another Claim
                            </button>
                        </div>
                    )}

                    {/* Existing claims */}
                    {claims.length > 0 && (
                        <div className="bg-white rounded-3xl border border-navy-100 shadow-sm overflow-hidden">
                            <div className="bg-navy-50/50 px-8 py-5 border-b border-navy-100 flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-xl">history</span>
                                <h3 className="text-sm font-black text-navy-900 uppercase tracking-widest">Your Claims</h3>
                            </div>
                            <div className="divide-y divide-navy-50">
                                {claims.map(c => (
                                    <div key={c.id} className="px-8 py-5 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-black text-navy-900 uppercase tracking-wider">Tag: {c.tagNumber} — {c.type}</p>
                                            <p className="text-[10px] font-bold text-navy-400 mt-1">{c.description.slice(0, 80)}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${STATUS_COLORS[c.status] || 'bg-navy-100 text-navy-500'}`}>
                                            {c.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BaggageTracking;
