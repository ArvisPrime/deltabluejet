import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { collection, doc, getDoc, setDoc, updateDoc, arrayUnion, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { getLoyaltyStatus } from '../../services/loyaltyService';

interface FamilyMember {
    uid: string;
    name: string;
    email: string;
    role: 'owner' | 'member';
    joinedAt: string;
    pointsContributed: number;
}

interface FamilyAccount {
    id: string;
    ownerUid: string;
    name: string;
    members: FamilyMember[];
    pooledPoints: number;
    monthlyTransferCap: number;
    transfersThisMonth: number;
    createdAt: Timestamp;
}

const FamilyPooling: React.FC = () => {
    const user = useAuthStore(s => s.user);
    const addToast = useToastStore(s => s.addToast);
    const [familyAccount, setFamilyAccount] = useState<FamilyAccount | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);
    const [familyName, setFamilyName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [transferAmount, setTransferAmount] = useState(0);
    const [myPoints, setMyPoints] = useState(0);

    const MAX_MEMBERS = 6;
    const MONTHLY_CAP = 50_000;

    const loadData = useCallback(async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const ref = doc(db, 'family_pools', user.uid);
            const snap = await getDoc(ref);
            if (snap.exists()) setFamilyAccount({ id: snap.id, ...snap.data() } as FamilyAccount);
            const loyalty = await getLoyaltyStatus(user.uid);
            setMyPoints(loyalty.totalPoints);
        } catch { /* ignore */ }
        setLoading(false);
    }, [user?.uid]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleCreate = async () => {
        if (!user?.uid || !familyName.trim()) return;
        try {
            const ref = doc(db, 'family_pools', user.uid);
            const data: Omit<FamilyAccount, 'id'> = {
                ownerUid: user.uid,
                name: familyName.trim(),
                members: [{ uid: user.uid, name: user.displayName || 'You', email: user.email || '', role: 'owner', joinedAt: new Date().toISOString(), pointsContributed: 0 }],
                pooledPoints: 0,
                monthlyTransferCap: MONTHLY_CAP,
                transfersThisMonth: 0,
                createdAt: Timestamp.now(),
            };
            await setDoc(ref, data);
            setFamilyAccount({ id: user.uid, ...data });
            setShowCreate(false);
            addToast('Family account created!', 'success');
        } catch { addToast('Failed to create family account', 'error'); }
    };

    const handleInvite = async () => {
        if (!familyAccount || !inviteEmail.trim()) return;
        if ((familyAccount.members?.length || 0) >= MAX_MEMBERS) {
            addToast(`Maximum ${MAX_MEMBERS} members allowed`, 'error'); return;
        }
        try {
            const ref = doc(db, 'family_pools', familyAccount.id);
            await updateDoc(ref, {
                members: arrayUnion({ uid: `invite_${Date.now()}`, name: inviteEmail.split('@')[0], email: inviteEmail, role: 'member', joinedAt: new Date().toISOString(), pointsContributed: 0 }),
            } as any);
            addToast(`Invitation sent to ${inviteEmail}`, 'success');
            setInviteEmail('');
            setShowInvite(false);
            loadData();
        } catch { addToast('Failed to invite', 'error'); }
    };

    const handleTransfer = async () => {
        if (!familyAccount || transferAmount <= 0) return;
        if (transferAmount > myPoints) { addToast('Not enough personal points', 'error'); return; }
        const remaining = MONTHLY_CAP - (familyAccount.transfersThisMonth || 0);
        if (transferAmount > remaining) { addToast(`Monthly cap exceeded. ${remaining.toLocaleString()} left this month`, 'error'); return; }
        try {
            const ref = doc(db, 'family_pools', familyAccount.id);
            await updateDoc(ref, {
                pooledPoints: (familyAccount.pooledPoints || 0) + transferAmount,
                transfersThisMonth: (familyAccount.transfersThisMonth || 0) + transferAmount,
                updatedAt: serverTimestamp(),
            } as any);
            addToast(`${transferAmount.toLocaleString()} points transferred to family pool`, 'success');
            setTransferAmount(0);
            setShowTransfer(false);
            loadData();
        } catch { addToast('Transfer failed', 'error'); }
    };

    const inputClass = 'w-full px-4 py-3 rounded-xl bg-navy-50 border-none text-sm font-bold text-navy-800 placeholder:text-navy-300 focus:ring-2 focus:ring-primary/20';
    const labelClass = 'text-[10px] font-black text-navy-400 uppercase tracking-widest block mb-2';

    if (loading) {
        return <div className="h-full flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
    }

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto font-display custom-scrollbar">
            <div className="flex flex-col gap-4 mb-8">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
                    <Link to={ROUTES.HOME} className="hover:text-primary transition-colors">Home</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <Link to={ROUTES.LOYALTY || '/loyalty'} className="hover:text-primary transition-colors">Loyalty</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-primary">Family Pooling</span>
                </nav>
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Family Points Pool</h1>
                    <p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">
                        Pool miles with up to {MAX_MEMBERS} family members for faster rewards
                    </p>
                </div>
            </div>

            {!familyAccount ? (
                /* No Family Account */
                <div className="max-w-md">
                    {showCreate ? (
                        <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-4">
                            <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest">Create Family Account</h3>
                            <div><label className={labelClass}>Family Name</label><input type="text" placeholder="e.g. The Smiths" value={familyName} onChange={e => setFamilyName(e.target.value)} className={inputClass} /></div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowCreate(false)} className="flex-1 py-3 border-2 border-navy-100 rounded-xl text-xs font-black uppercase tracking-widest text-navy-500">Cancel</button>
                                <button onClick={handleCreate} disabled={!familyName.trim()} className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50">Create</button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <span className="material-symbols-outlined text-5xl text-navy-200 mb-4">family_restroom</span>
                            <h2 className="text-xl font-black text-navy-900 tracking-tighter mb-2">No Family Account Yet</h2>
                            <p className="text-sm text-navy-500 mb-6">Create a family pool to combine miles with up to {MAX_MEMBERS} members</p>
                            <button onClick={() => setShowCreate(true)} className="px-8 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
                                Create Family Account
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                /* Family Account Exists */
                <div className="space-y-6 max-w-2xl">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Pooled Points', value: (familyAccount.pooledPoints || 0).toLocaleString(), icon: 'savings', color: 'text-primary bg-primary/10' },
                            { label: 'Members', value: `${familyAccount.members?.length || 1} / ${MAX_MEMBERS}`, icon: 'group', color: 'text-emerald-600 bg-emerald-50' },
                            { label: 'Monthly Cap Left', value: `${(MONTHLY_CAP - (familyAccount.transfersThisMonth || 0)).toLocaleString()}`, icon: 'trending_up', color: 'text-amber-600 bg-amber-50' },
                        ].map(s => (
                            <div key={s.label} className="bg-white rounded-2xl border border-navy-100 p-5">
                                <div className={`size-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                                    <span className="material-symbols-outlined">{s.icon}</span>
                                </div>
                                <p className="text-2xl font-black text-navy-950 tracking-tighter">{s.value}</p>
                                <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Members List */}
                    <div className="bg-white rounded-2xl border border-navy-100 p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-black text-navy-900 uppercase tracking-widest">Members — {familyAccount.name}</h3>
                            <button onClick={() => setShowInvite(!showInvite)} disabled={(familyAccount.members?.length || 0) >= MAX_MEMBERS}
                                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline disabled:text-navy-300">
                                + Invite Member
                            </button>
                        </div>
                        {showInvite && (
                            <div className="flex gap-2 mb-4">
                                <input type="email" placeholder="member@email.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className={inputClass} />
                                <button onClick={handleInvite} className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase shadow-md shrink-0">Send</button>
                            </div>
                        )}
                        <div className="space-y-2">
                            {(familyAccount.members || []).map((m, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-navy-50/30 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                                            {m.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-navy-900">{m.name}</p>
                                            <p className="text-[10px] text-navy-400">{m.email}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${m.role === 'owner' ? 'bg-primary/10 text-primary' : 'bg-navy-100 text-navy-500'}`}>
                                        {m.role}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Transfer Points */}
                    <div className="bg-white rounded-2xl border border-navy-100 p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-black text-navy-900 uppercase tracking-widest">Transfer Points</h3>
                            <p className="text-xs text-navy-400">Your balance: <strong>{myPoints.toLocaleString()}</strong></p>
                        </div>
                        {showTransfer ? (
                            <div className="space-y-3">
                                <div><label className={labelClass}>Points to Transfer</label><input type="number" min={0} max={Math.min(myPoints, MONTHLY_CAP - (familyAccount.transfersThisMonth || 0))} value={transferAmount} onChange={e => setTransferAmount(Number(e.target.value))} className={inputClass} /></div>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowTransfer(false)} className="flex-1 py-3 border-2 border-navy-100 rounded-xl text-xs font-black uppercase tracking-widest text-navy-500">Cancel</button>
                                    <button onClick={handleTransfer} disabled={transferAmount <= 0} className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50">Transfer</button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => setShowTransfer(true)} className="w-full py-3 border-2 border-dashed border-navy-200 rounded-xl text-xs font-black text-navy-500 uppercase tracking-widest hover:bg-navy-50">
                                + Transfer Points to Pool
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FamilyPooling;
