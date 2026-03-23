import React, { useState, useEffect, useCallback } from 'react';
import { useToastStore } from '../../stores/toastStore';
import {
    getPartnerAirlines, savePartnerAirline, deletePartnerAirline,
    getCodeshareRoutes, saveCodeshareRoute, deleteCodeshareRoute,
    getInterlineBaggageRules, saveInterlineBaggageRule,
} from '../../services/codeshareService';
import type { PartnerAirline, CodeshareRoute, InterlineBaggageRule } from '../../services/codeshareService';

type Tab = 'partners' | 'routes' | 'baggage';

const InterlineAdmin: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [tab, setTab] = useState<Tab>('partners');
    const [partners, setPartners] = useState<PartnerAirline[]>([]);
    const [routes, setRoutes] = useState<CodeshareRoute[]>([]);
    const [baggageRules, setBaggageRules] = useState<InterlineBaggageRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Partner form state
    const [pForm, setPForm] = useState({ code: '', name: '', agreementType: 'codeshare' as any, agreementStart: '', agreementEnd: '', active: true, throughCheckin: false, baggageTransfer: false, loyaltyAccrual: false, loyaltyRedemption: false, contactEmail: '', notes: '' });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [p, r, b] = await Promise.all([getPartnerAirlines(), getCodeshareRoutes(), getInterlineBaggageRules()]);
            setPartners(p); setRoutes(r); setBaggageRules(b);
        } catch { addToast('Failed to load data', 'error'); }
        setLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSavePartner = async () => {
        if (!pForm.code || !pForm.name) { addToast('Code and name required', 'error'); return; }
        try {
            await savePartnerAirline(pForm, editId || undefined);
            addToast(editId ? 'Partner updated' : 'Partner added', 'success');
            setShowForm(false); setEditId(null);
            setPForm({ code: '', name: '', agreementType: 'codeshare', agreementStart: '', agreementEnd: '', active: true, throughCheckin: false, baggageTransfer: false, loyaltyAccrual: false, loyaltyRedemption: false, contactEmail: '', notes: '' });
            loadData();
        } catch { addToast('Save failed', 'error'); }
    };

    const handleDeletePartner = async (id: string) => {
        try { await deletePartnerAirline(id); addToast('Deleted', 'success'); loadData(); } catch { addToast('Delete failed', 'error'); }
    };

    const editPartner = (p: PartnerAirline) => {
        setEditId(p.id);
        setPForm({ code: p.code, name: p.name, agreementType: p.agreementType, agreementStart: p.agreementStart, agreementEnd: p.agreementEnd, active: p.active, throughCheckin: p.throughCheckin, baggageTransfer: p.baggageTransfer, loyaltyAccrual: p.loyaltyAccrual, loyaltyRedemption: p.loyaltyRedemption, contactEmail: p.contactEmail, notes: p.notes });
        setShowForm(true);
    };

    const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-navy-50 border-none text-sm font-bold text-navy-800 placeholder:text-navy-300 focus:ring-2 focus:ring-primary/20';
    const labelClass = 'text-[10px] font-black text-navy-400 uppercase tracking-widest block mb-1';

    if (loading) return <div className="h-full flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto font-display custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-black text-navy-950 tracking-tighter uppercase">Interline Management</h1>
                    <p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">Partner agreements, codeshare routes, and baggage rules</p>
                </div>
                <button onClick={() => { setShowForm(true); setEditId(null); }}
                    className="px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
                    + Add Partner
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-navy-50 p-1 rounded-xl mb-6 w-fit">
                {(['partners', 'routes', 'baggage'] as Tab[]).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-white text-primary shadow-sm' : 'text-navy-400 hover:text-navy-600'}`}>
                        {t === 'partners' ? `Partners (${partners.length})` : t === 'routes' ? `Routes (${routes.length})` : `Baggage (${baggageRules.length})`}
                    </button>
                ))}
            </div>

            {/* Partner Form Modal */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-navy-100 p-6 mb-6 max-w-2xl space-y-4">
                    <h3 className="text-xs font-black text-navy-900 uppercase tracking-widest">{editId ? 'Edit' : 'Add'} Partner Airline</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelClass}>IATA Code *</label><input type="text" maxLength={2} value={pForm.code} onChange={e => setPForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} className={inputClass} placeholder="BA" /></div>
                        <div><label className={labelClass}>Airline Name *</label><input type="text" value={pForm.name} onChange={e => setPForm(p => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="British Airways" /></div>
                        <div><label className={labelClass}>Agreement Type</label>
                            <select value={pForm.agreementType} onChange={e => setPForm(p => ({ ...p, agreementType: e.target.value as any }))} className={inputClass}>
                                <option value="codeshare">Codeshare</option><option value="interline">Interline</option><option value="both">Both</option>
                            </select>
                        </div>
                        <div><label className={labelClass}>Contact Email</label><input type="email" value={pForm.contactEmail} onChange={e => setPForm(p => ({ ...p, contactEmail: e.target.value }))} className={inputClass} /></div>
                        <div><label className={labelClass}>Start Date</label><input type="date" value={pForm.agreementStart} onChange={e => setPForm(p => ({ ...p, agreementStart: e.target.value }))} className={inputClass} /></div>
                        <div><label className={labelClass}>End Date</label><input type="date" value={pForm.agreementEnd} onChange={e => setPForm(p => ({ ...p, agreementEnd: e.target.value }))} className={inputClass} /></div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs font-bold text-navy-600">
                        {[
                            { key: 'active', label: 'Active' }, { key: 'throughCheckin', label: 'Through Check-in' },
                            { key: 'baggageTransfer', label: 'Baggage Transfer' }, { key: 'loyaltyAccrual', label: 'Loyalty Earn' },
                            { key: 'loyaltyRedemption', label: 'Loyalty Redeem' },
                        ].map(opt => (
                            <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={(pForm as any)[opt.key]} onChange={e => setPForm(p => ({ ...p, [opt.key]: e.target.checked }))}
                                    className="rounded border-navy-200 text-primary focus:ring-primary/20" />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { setShowForm(false); setEditId(null); }} className="flex-1 py-2.5 border-2 border-navy-100 rounded-xl text-xs font-black uppercase tracking-widest text-navy-500">Cancel</button>
                        <button onClick={handleSavePartner} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md">Save</button>
                    </div>
                </div>
            )}

            {/* Partner List */}
            {tab === 'partners' && (
                <div className="space-y-2">
                    {partners.length === 0 ? (
                        <div className="text-center py-16"><span className="material-symbols-outlined text-5xl text-navy-200">airlines</span><p className="text-xs font-black text-navy-300 uppercase tracking-widest mt-3">No partners yet</p></div>
                    ) : partners.map(p => (
                        <div key={p.id} className="bg-white rounded-xl border border-navy-100 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-sm">{p.code}</div>
                                <div>
                                    <p className="text-sm font-black text-navy-900">{p.name}</p>
                                    <div className="flex gap-2 mt-0.5">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${p.active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{p.active ? 'Active' : 'Inactive'}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-navy-50 text-navy-500">{p.agreementType}</span>
                                        {p.throughCheckin && <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Through CI</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => editPartner(p)} className="p-2 rounded-lg hover:bg-navy-50"><span className="material-symbols-outlined text-sm text-navy-400">edit</span></button>
                                <button onClick={() => handleDeletePartner(p.id)} className="p-2 rounded-lg hover:bg-red-50"><span className="material-symbols-outlined text-sm text-red-400">delete</span></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Codeshare Routes Tab */}
            {tab === 'routes' && (
                <div className="space-y-2">
                    {routes.length === 0 ? (
                        <div className="text-center py-16"><span className="material-symbols-outlined text-5xl text-navy-200">route</span><p className="text-xs font-black text-navy-300 uppercase tracking-widest mt-3">No codeshare routes</p></div>
                    ) : routes.map(r => (
                        <div key={r.id} className="bg-white rounded-xl border border-navy-100 p-4 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="text-center"><p className="text-lg font-black text-navy-950">{r.origin}</p></div>
                                <span className="material-symbols-outlined text-primary text-sm">flight</span>
                                <div className="text-center"><p className="text-lg font-black text-navy-950">{r.destination}</p></div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-navy-900">{r.marketingFlightNumber}</p>
                                <p className="text-[10px] text-navy-400">Op: {r.operatingFlightNumber}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Baggage Rules Tab */}
            {tab === 'baggage' && (
                <div className="space-y-2">
                    {baggageRules.length === 0 ? (
                        <div className="text-center py-16"><span className="material-symbols-outlined text-5xl text-navy-200">luggage</span><p className="text-xs font-black text-navy-300 uppercase tracking-widest mt-3">No baggage rules</p></div>
                    ) : baggageRules.map(b => (
                        <div key={b.id} className="bg-white rounded-xl border border-navy-100 p-4 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-black text-navy-900">{b.partnerCode} — {b.routeType}</p>
                                <p className="text-[10px] text-navy-400">{b.maxPieces} pcs, {b.maxWeightKg}kg max{b.throughTag ? ' • Through-tagged' : ''}</p>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${b.throughTag ? 'bg-emerald-50 text-emerald-600' : 'bg-navy-50 text-navy-500'}`}>
                                {b.throughTag ? 'Through Tag' : 'Re-check'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InterlineAdmin;
