import React, { useState, useEffect } from 'react';
import { useToastStore } from '../../stores/toastStore';
import {
    getAllRewards,
    createReward,
    updateReward,
    deleteReward,
    getAllPartners,
    createPartner,
    deletePartner,
    type LoyaltyPartner,
} from '../../services/loyaltyAdminService';
import type { LoyaltyReward } from '../../services/loyaltyService';

const EMPTY_REWARD: Omit<LoyaltyReward, 'id'> = {
    name: '', description: '', pointsCost: 0,
    category: 'upgrade', partnerName: '', imageUrl: '', available: true,
};

const LoyaltyAdmin: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
    const [partners, setPartners] = useState<LoyaltyPartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'rewards' | 'partners'>('rewards');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_REWARD);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const [r, p] = await Promise.all([getAllRewards(), getAllPartners()]);
            setRewards(r);
            setPartners(p);
        } catch { /* ignore */ } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleSaveReward = async () => {
        if (!form.name || form.pointsCost <= 0) { addToast('Name and points required', 'warning'); return; }
        setSaving(true);
        try {
            await createReward(form);
            addToast('Reward created', 'success');
            setShowForm(false);
            setForm(EMPTY_REWARD);
            await load();
        } catch { addToast('Failed to create reward', 'error'); }
        finally { setSaving(false); }
    };

    const handleToggle = async (r: LoyaltyReward) => {
        await updateReward(r.id, { available: !r.available });
        addToast(`${r.name} ${r.available ? 'disabled' : 'enabled'}`, 'success');
        await load();
    };

    const handleDelete = async (r: LoyaltyReward) => {
        if (!window.confirm(`Delete "${r.name}"?`)) return;
        await deleteReward(r.id);
        addToast('Reward deleted', 'success');
        await load();
    };

    const handleAddPartner = async () => {
        const name = window.prompt('Partner name:');
        if (!name) return;
        await createPartner({ name, category: 'general', conversionRate: 1, active: true });
        addToast('Partner added', 'success');
        await load();
    };

    const handleDeletePartner = async (p: LoyaltyPartner) => {
        if (!window.confirm(`Remove partner "${p.name}"?`)) return;
        await deletePartner(p.id);
        addToast('Partner removed', 'success');
        await load();
    };

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in font-display">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Loyalty Program Admin</h1>
                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-1">Manage rewards and partners</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-navy-50 p-1.5 rounded-2xl w-fit border border-navy-100">
                {(['rewards', 'partners'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-white text-navy-950 shadow-md' : 'text-navy-400'}`}>
                        {t === 'rewards' ? `Rewards (${rewards.length})` : `Partners (${partners.length})`}
                    </button>
                ))}
            </div>

            {tab === 'rewards' && (
                <>
                    <div className="flex justify-end">
                        <button onClick={() => setShowForm(!showForm)} className="px-6 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">add</span> Add Reward
                        </button>
                    </div>

                    {showForm && (
                        <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-lg p-8 space-y-6">
                            <h3 className="text-sm font-black text-navy-950 uppercase tracking-tight">New Reward</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <input placeholder="Reward Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950 focus:ring-2 focus:ring-primary/20" />
                                <input placeholder="Points Cost" type="number" value={form.pointsCost || ''} onChange={e => setForm({...form, pointsCost: parseInt(e.target.value) || 0})} className="h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950 focus:ring-2 focus:ring-primary/20" />
                                <select value={form.category} onChange={e => setForm({...form, category: e.target.value as any})} className="h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950">
                                    {['upgrade', 'lounge', 'baggage', 'miles', 'partner', 'experience'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <input placeholder="Partner Name (optional)" value={form.partnerName} onChange={e => setForm({...form, partnerName: e.target.value})} className="h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950 focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full px-5 py-3 bg-navy-50 rounded-xl border-none font-bold text-sm text-navy-950 resize-none focus:ring-2 focus:ring-primary/20" />
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => { setShowForm(false); setForm(EMPTY_REWARD); }} className="px-6 py-2.5 border border-navy-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-navy-500 hover:bg-navy-50">Cancel</button>
                                <button onClick={handleSaveReward} disabled={saving} className="px-8 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50">{saving ? 'Saving…' : 'Create'}</button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm overflow-hidden">
                        {rewards.length === 0 ? (
                            <div className="text-center py-20 space-y-3">
                                <span className="material-symbols-outlined text-5xl text-navy-200">redeem</span>
                                <p className="text-sm font-black text-navy-300 uppercase tracking-widest">No rewards created yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-navy-50">
                                {rewards.map(r => (
                                    <div key={r.id} className="px-8 py-5 flex items-center justify-between hover:bg-navy-50/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`size-10 rounded-xl flex items-center justify-center ${r.available ? 'bg-emerald-50 text-emerald-600' : 'bg-navy-100 text-navy-400'}`}>
                                                <span className="material-symbols-outlined">redeem</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-navy-950 uppercase tracking-tight">{r.name}</p>
                                                <p className="text-[9px] font-bold text-navy-400 tracking-widest">{r.category} • {r.pointsCost.toLocaleString()} pts</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => handleToggle(r)} className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${r.available ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-navy-50 text-navy-400 border-navy-100'}`}>
                                                {r.available ? 'Active' : 'Disabled'}
                                            </button>
                                            <button onClick={() => handleDelete(r)} className="p-2 hover:bg-red-50 rounded-xl text-navy-300 hover:text-red-500 transition-all">
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {tab === 'partners' && (
                <>
                    <div className="flex justify-end">
                        <button onClick={handleAddPartner} className="px-6 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">add</span> Add Partner
                        </button>
                    </div>
                    <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm overflow-hidden">
                        {partners.length === 0 ? (
                            <div className="text-center py-20 space-y-3">
                                <span className="material-symbols-outlined text-5xl text-navy-200">handshake</span>
                                <p className="text-sm font-black text-navy-300 uppercase tracking-widest">No partners yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-navy-50">
                                {partners.map(p => (
                                    <div key={p.id} className="px-8 py-5 flex items-center justify-between hover:bg-navy-50/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined">handshake</span></div>
                                            <div>
                                                <p className="text-xs font-black text-navy-950 uppercase tracking-tight">{p.name}</p>
                                                <p className="text-[9px] font-bold text-navy-400 tracking-widest">{p.category} • {p.conversionRate}x rate</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeletePartner(p)} className="p-2 hover:bg-red-50 rounded-xl text-navy-300 hover:text-red-500 transition-all">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default LoyaltyAdmin;
