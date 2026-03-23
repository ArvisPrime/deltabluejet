import React, { useState } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { useToastStore } from '../../stores/toastStore';

const TOPICS = [
    'Booking Issue', 'Baggage Concern', 'Refund Request', 'Flight Disruption',
    'Loyalty Program', 'Special Assistance', 'Payment Issue', 'General Inquiry',
];

const TIME_SLOTS = [
    '09:00 - 11:00', '11:00 - 13:00', '13:00 - 15:00',
    '15:00 - 17:00', '17:00 - 19:00',
];

const CallbackRequest: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: '', phone: '', email: '', topic: 'General Inquiry',
        preferredDate: '', preferredTime: '09:00 - 11:00', notes: '',
    });

    const handleSubmit = async () => {
        if (!form.name || !form.phone) {
            addToast('Name and phone number are required', 'error');
            return;
        }
        setSubmitting(true);
        try {
            await addDoc(collection(db, 'callback_requests'), {
                ...form,
                status: 'pending',
                createdAt: Timestamp.now(),
            });
            setSubmitted(true);
            addToast('Callback request submitted', 'success');
        } catch {
            addToast('Failed to submit — please try again', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = 'w-full px-4 py-3 rounded-xl bg-navy-50 border-none text-sm font-bold text-navy-800 placeholder:text-navy-300 focus:ring-2 focus:ring-primary/20';
    const labelClass = 'text-[10px] font-black text-navy-400 uppercase tracking-widest block mb-2';

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto font-display custom-scrollbar">
            <div className="flex flex-col gap-4 mb-8">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
                    <Link to={ROUTES.HOME} className="hover:text-primary transition-colors">Home</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <Link to={ROUTES.HELP_CENTER || '#'} className="hover:text-primary transition-colors">Help</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-primary" aria-current="page">Callback</span>
                </nav>
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Request a Callback</h1>
                    <p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">
                        We'll call you at your preferred time — no waiting on hold
                    </p>
                </div>
            </div>

            {submitted ? (
                <div className="max-w-lg mx-auto text-center py-16">
                    <div className="size-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-4xl text-emerald-600">call</span>
                    </div>
                    <h2 className="text-2xl font-black text-navy-950 tracking-tighter mb-2">Callback Scheduled!</h2>
                    <p className="text-sm text-navy-500 mb-2">
                        We'll call you at <span className="font-bold text-navy-800">{form.phone}</span>
                    </p>
                    {form.preferredDate && (
                        <p className="text-sm text-navy-500">
                            Preferred: {form.preferredDate} • {form.preferredTime}
                        </p>
                    )}
                    <Link to={ROUTES.HOME}
                        className="mt-8 inline-block px-8 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-600 transition-colors shadow-lg shadow-primary/20">
                        Back to Home
                    </Link>
                </div>
            ) : (
                <div className="max-w-lg space-y-6">
                    <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-4">
                        <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest">Your Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Full Name *</label>
                                <input type="text" placeholder="John Doe" value={form.name}
                                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Phone Number *</label>
                                <input type="tel" placeholder="+220 123 4567" value={form.phone}
                                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputClass} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Email (optional)</label>
                            <input type="email" placeholder="john@example.com" value={form.email}
                                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputClass} />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-4">
                        <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest">Callback Preferences</h3>
                        <div>
                            <label className={labelClass}>Topic</label>
                            <select value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} className={inputClass}>
                                {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Preferred Date</label>
                                <input type="date" value={form.preferredDate}
                                    onChange={e => setForm(p => ({ ...p, preferredDate: e.target.value }))} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Preferred Time</label>
                                <select value={form.preferredTime} onChange={e => setForm(p => ({ ...p, preferredTime: e.target.value }))} className={inputClass}>
                                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Additional Notes</label>
                            <textarea rows={3} placeholder="Brief description of your inquiry..."
                                value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className={inputClass} />
                        </div>
                    </div>

                    <button onClick={handleSubmit} disabled={submitting}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50">
                        {submitting ? 'Submitting...' : 'Request Callback'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default CallbackRequest;
