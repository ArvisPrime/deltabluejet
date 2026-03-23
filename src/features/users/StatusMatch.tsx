import React, { useState } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase.config';

type MatchType = 'status_match' | 'status_challenge';

interface ChallengeTracker {
    segmentsRequired: number;
    segmentsFlown: number;
    deadlineDays: number;
    targetTier: string;
}

const COMPETITOR_AIRLINES = [
    'Emirates', 'Air France', 'British Airways', 'Lufthansa', 'KLM',
    'Turkish Airlines', 'Qatar Airways', 'Ethiopian Airlines', 'Kenya Airways',
    'Royal Air Maroc', 'ASKY Airlines', 'South African Airways',
];

const StatusMatch: React.FC = () => {
    const user = useAuthStore(s => s.user);
    const addToast = useToastStore(s => s.addToast);
    const [matchType, setMatchType] = useState<MatchType>('status_match');
    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        airline: '',
        currentTier: '',
        membershipNumber: '',
        fullName: '',
        cardImageBase64: '',
    });

    const challengeOptions: ChallengeTracker[] = [
        { segmentsRequired: 4, segmentsFlown: 0, deadlineDays: 90, targetTier: 'Silver' },
        { segmentsRequired: 8, segmentsFlown: 0, deadlineDays: 90, targetTier: 'Gold' },
        { segmentsRequired: 14, segmentsFlown: 0, deadlineDays: 120, targetTier: 'Platinum' },
    ];

    const [selectedChallenge, setSelectedChallenge] = useState<number>(0);

    const handleSubmit = async () => {
        if (!user?.uid || !form.airline || !form.currentTier || !form.membershipNumber || !form.fullName) {
            addToast('Please fill all required fields', 'error'); return;
        }
        setSubmitting(true);
        try {
            await addDoc(collection(db, 'status_match_requests'), {
                uid: user.uid,
                type: matchType,
                ...form,
                challenge: matchType === 'status_challenge' ? challengeOptions[selectedChallenge] : null,
                status: 'pending_review',
                createdAt: Timestamp.now(),
            });
            setSubmitted(true);
            addToast('Application submitted!', 'success');
        } catch { addToast('Submission failed', 'error'); }
        setSubmitting(false);
    };

    const inputClass = 'w-full px-4 py-3 rounded-xl bg-navy-50 border-none text-sm font-bold text-navy-800 placeholder:text-navy-300 focus:ring-2 focus:ring-primary/20';
    const labelClass = 'text-[10px] font-black text-navy-400 uppercase tracking-widest block mb-2';

    if (submitted) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 font-display">
                <div className="size-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-emerald-600">verified</span>
                </div>
                <h2 className="text-2xl font-black text-navy-950 tracking-tighter mb-2">Application Submitted</h2>
                <p className="text-sm text-navy-500 mb-1">Your {matchType === 'status_match' ? 'status match' : 'status challenge'} application is under review.</p>
                <p className="text-sm text-navy-500 mb-8">We will respond within 5 business days.</p>
                {matchType === 'status_challenge' && (
                    <div className="bg-primary/5 rounded-2xl p-6 mb-6 max-w-sm w-full text-center border border-primary/10">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Your Challenge</p>
                        <p className="text-lg font-black text-navy-950">Fly {challengeOptions[selectedChallenge].segmentsRequired} segments in {challengeOptions[selectedChallenge].deadlineDays} days</p>
                        <p className="text-xs text-navy-500 mt-1">Target: {challengeOptions[selectedChallenge].targetTier} tier</p>
                    </div>
                )}
                <Link to={ROUTES.LOYALTY || '/loyalty'} className="px-8 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                    Back to Loyalty
                </Link>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto font-display custom-scrollbar">
            <div className="flex flex-col gap-4 mb-8">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
                    <Link to={ROUTES.HOME} className="hover:text-primary transition-colors">Home</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <Link to={ROUTES.LOYALTY || '/loyalty'} className="hover:text-primary transition-colors">Loyalty</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-primary">Status Match</span>
                </nav>
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Status Match / Challenge</h1>
                    <p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">
                        Match your existing airline tier or earn it through a flight challenge
                    </p>
                </div>
            </div>

            {/* Type Selector */}
            <div className="flex gap-3 mb-8 max-w-lg">
                {[
                    { type: 'status_match' as MatchType, label: 'Status Match', desc: 'Instant tier match from your existing airline status', icon: 'swap_horiz' },
                    { type: 'status_challenge' as MatchType, label: 'Status Challenge', desc: 'Earn a tier by flying a set number of segments', icon: 'emoji_events' },
                ].map(opt => (
                    <button key={opt.type} onClick={() => setMatchType(opt.type)}
                        className={`flex-1 p-5 rounded-2xl border-2 text-left transition-all ${
                            matchType === opt.type ? 'border-primary bg-primary/5 shadow-lg' : 'border-navy-100 bg-white hover:border-navy-200'
                        }`}>
                        <span className={`material-symbols-outlined mb-2 ${matchType === opt.type ? 'text-primary' : 'text-navy-400'}`}>{opt.icon}</span>
                        <p className="text-sm font-black text-navy-900 tracking-tighter">{opt.label}</p>
                        <p className="text-[10px] text-navy-400 mt-1">{opt.desc}</p>
                    </button>
                ))}
            </div>

            {/* Challenge Options */}
            {matchType === 'status_challenge' && (
                <div className="mb-6 max-w-lg">
                    <p className={labelClass}>Choose Your Challenge</p>
                    <div className="space-y-2">
                        {challengeOptions.map((c, i) => (
                            <button key={i} onClick={() => setSelectedChallenge(i)}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center ${
                                    selectedChallenge === i ? 'border-primary bg-primary/5' : 'border-navy-100 bg-white'
                                }`}>
                                <div>
                                    <p className="text-sm font-black text-navy-900">{c.targetTier} Tier</p>
                                    <p className="text-[10px] text-navy-400">{c.segmentsRequired} segments in {c.deadlineDays} days</p>
                                </div>
                                <span className="material-symbols-outlined text-primary">{selectedChallenge === i ? 'radio_button_checked' : 'radio_button_unchecked'}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Application Form */}
            <div className="space-y-6 max-w-lg">
                <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-4">
                    <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest">
                        {matchType === 'status_match' ? 'Your Current Status' : 'Verification Details'}
                    </h3>
                    <div><label className={labelClass}>Full Name *</label><input type="text" placeholder="As on your membership card" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} className={inputClass} /></div>
                    <div>
                        <label className={labelClass}>Competitor Airline *</label>
                        <select value={form.airline} onChange={e => setForm(p => ({ ...p, airline: e.target.value }))} className={inputClass}>
                            <option value="">Select airline</option>
                            {COMPETITOR_AIRLINES.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Current Tier *</label>
                        <select value={form.currentTier} onChange={e => setForm(p => ({ ...p, currentTier: e.target.value }))} className={inputClass}>
                            <option value="">Select tier</option>
                            <option value="silver">Silver / Premium</option>
                            <option value="gold">Gold / Executive</option>
                            <option value="platinum">Platinum / First</option>
                        </select>
                    </div>
                    <div><label className={labelClass}>Membership Number *</label><input type="text" placeholder="e.g. EK-12345678" value={form.membershipNumber} onChange={e => setForm(p => ({ ...p, membershipNumber: e.target.value }))} className={inputClass} /></div>
                </div>

                <button onClick={handleSubmit} disabled={submitting}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
            </div>
        </div>
    );
};

export default StatusMatch;
