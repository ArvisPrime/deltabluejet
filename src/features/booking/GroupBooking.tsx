import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ROUTES } from '../../config/routes';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { useToastStore } from '../../stores/toastStore';

// ─── Types ─────────────────────────────────────────────────

interface GroupBookingForm {
    groupName: string;
    coordinatorName: string;
    coordinatorEmail: string;
    coordinatorPhone: string;
    passengerCount: number;
    departureRoute: string;
    preferredDate: string;
    returnDate: string;
    isRoundTrip: boolean;
    specialRequests: string;
    fareClass: string;
}

const TIER_DISCOUNTS = [
    { min: 10, max: 19, discount: 5, label: '10-19 passengers' },
    { min: 20, max: 49, discount: 10, label: '20-49 passengers' },
    { min: 50, max: 99, discount: 15, label: '50-99 passengers' },
    { min: 100, max: 999, discount: 20, label: '100+ passengers' },
];

function getDiscount(count: number): number {
    const tier = TIER_DISCOUNTS.find(t => count >= t.min && count <= t.max);
    return tier?.discount || 0;
}

const GroupBooking: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [form, setForm] = useState<GroupBookingForm>({
        groupName: '',
        coordinatorName: '',
        coordinatorEmail: '',
        coordinatorPhone: '',
        passengerCount: 10,
        departureRoute: '',
        preferredDate: '',
        returnDate: '',
        isRoundTrip: false,
        specialRequests: '',
        fareClass: 'economy',
    });

    const update = (field: keyof GroupBookingForm, value: string | number | boolean) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const discount = getDiscount(form.passengerCount);

    const handleSubmit = async () => {
        if (!form.groupName || !form.coordinatorEmail || !form.departureRoute || !form.preferredDate) {
            addToast('Please fill in all required fields', 'error');
            return;
        }
        setSubmitting(true);
        try {
            await addDoc(collection(db, 'group_bookings'), {
                ...form,
                discountPercent: discount,
                status: 'pending_review',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });
            addToast('Group booking request submitted successfully!', 'success');
            setStep(3);
        } catch (err) {
            addToast('Failed to submit — please try again', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = 'w-full px-4 py-3 rounded-xl bg-navy-50 border-none text-sm font-bold text-navy-800 placeholder:text-navy-300 focus:ring-2 focus:ring-primary/20';
    const labelClass = 'text-[10px] font-black text-navy-400 uppercase tracking-widest block mb-2';

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto font-display custom-scrollbar">
            <div className="flex flex-col gap-4 mb-8 shrink-0">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
                    <Link to={ROUTES.HOME} className="hover:text-primary transition-colors">Home</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-primary" aria-current="page">Group Booking</span>
                </nav>
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Group Booking</h1>
                    <p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">
                        10+ passengers • Special group rates • Dedicated coordinator
                    </p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-3 mb-8 shrink-0">
                {[
                    { n: 1, label: 'Group Details' },
                    { n: 2, label: 'Review & Submit' },
                    { n: 3, label: 'Confirmed' },
                ].map((s, i) => (
                    <React.Fragment key={s.n}>
                        <div className="flex items-center gap-2">
                            <div className={`size-8 rounded-full flex items-center justify-center text-xs font-black ${
                                step >= s.n ? 'bg-primary text-white' : 'bg-navy-100 text-navy-400'
                            }`}>{s.n}</div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${step >= s.n ? 'text-primary' : 'text-navy-300'}`}>{s.label}</span>
                        </div>
                        {i < 2 && <div className={`flex-1 h-0.5 ${step > s.n ? 'bg-primary' : 'bg-navy-100'}`} />}
                    </React.Fragment>
                ))}
            </div>

            {/* Discount Banner */}
            {discount > 0 && step < 3 && (
                <div className="mb-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-600">sell</span>
                    <p className="text-sm font-black text-emerald-700">
                        {form.passengerCount} passengers qualify for <span className="text-emerald-900">{discount}% group discount</span>
                    </p>
                </div>
            )}

            {/* Step 1: Form */}
            {step === 1 && (
                <div className="max-w-2xl space-y-6">
                    <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-4">
                        <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest">Group Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Group Name *</label>
                                <input type="text" placeholder="e.g. ABC Corp Travel" value={form.groupName}
                                    onChange={e => update('groupName', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Number of Passengers *</label>
                                <input type="number" min={10} max={500} value={form.passengerCount}
                                    onChange={e => update('passengerCount', parseInt(e.target.value) || 10)} className={inputClass} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-4">
                        <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest">Coordinator</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>Full Name *</label>
                                <input type="text" placeholder="John Doe" value={form.coordinatorName}
                                    onChange={e => update('coordinatorName', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Email *</label>
                                <input type="email" placeholder="john@example.com" value={form.coordinatorEmail}
                                    onChange={e => update('coordinatorEmail', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Phone</label>
                                <input type="tel" placeholder="+220 ..." value={form.coordinatorPhone}
                                    onChange={e => update('coordinatorPhone', e.target.value)} className={inputClass} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-4">
                        <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest">Flight Preferences</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Route *</label>
                                <input type="text" placeholder="BJL → DAK" value={form.departureRoute}
                                    onChange={e => update('departureRoute', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Fare Class</label>
                                <select value={form.fareClass} onChange={e => update('fareClass', e.target.value)} className={inputClass}>
                                    <option value="economy">Economy</option>
                                    <option value="premium_economy">Premium Economy</option>
                                    <option value="business">Business</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Preferred Departure Date *</label>
                                <input type="date" value={form.preferredDate}
                                    onChange={e => update('preferredDate', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Return Date</label>
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" checked={form.isRoundTrip}
                                        onChange={e => update('isRoundTrip', e.target.checked)}
                                        className="size-4 rounded border-navy-300 text-primary focus:ring-primary" />
                                    <span className="text-[10px] font-bold text-navy-400">Round Trip</span>
                                </div>
                                {form.isRoundTrip && (
                                    <input type="date" value={form.returnDate}
                                        onChange={e => update('returnDate', e.target.value)} className={`${inputClass} mt-2`} />
                                )}
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Special Requests</label>
                            <textarea rows={3} placeholder="Wheelchair assistance, dietary needs, seating preferences..."
                                value={form.specialRequests} onChange={e => update('specialRequests', e.target.value)}
                                className={inputClass} />
                        </div>
                    </div>

                    {/* Discount Tiers */}
                    <div className="bg-white rounded-2xl border border-navy-100 p-6">
                        <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest mb-4">Group Discount Tiers</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {TIER_DISCOUNTS.map(t => (
                                <div key={t.min} className={`p-4 rounded-xl border-2 text-center ${
                                    form.passengerCount >= t.min && form.passengerCount <= t.max
                                        ? 'border-primary bg-primary/5' : 'border-navy-50'
                                }`}>
                                    <p className="text-2xl font-black text-navy-950">{t.discount}%</p>
                                    <p className="text-[10px] font-bold text-navy-400 mt-1">{t.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={() => setStep(2)}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                        Review Booking →
                    </button>
                </div>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
                <div className="max-w-2xl space-y-6">
                    <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-4">
                        <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest">Booking Summary</h3>
                        <div className="space-y-3">
                            {[
                                ['Group', form.groupName],
                                ['Passengers', `${form.passengerCount} (${discount}% discount)`],
                                ['Coordinator', `${form.coordinatorName} — ${form.coordinatorEmail}`],
                                ['Route', `${form.departureRoute} ${form.isRoundTrip ? '(Round Trip)' : '(One Way)'}`],
                                ['Date', `${form.preferredDate}${form.isRoundTrip ? ` → ${form.returnDate}` : ''}`],
                                ['Fare Class', form.fareClass.replace('_', ' ').toUpperCase()],
                            ].map(([label, val]) => (
                                <div key={label} className="flex justify-between items-center py-2 border-b border-navy-50">
                                    <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{label}</span>
                                    <span className="text-sm font-bold text-navy-900">{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setStep(1)}
                            className="flex-1 py-4 border-2 border-navy-100 text-navy-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-navy-50 transition-colors">
                            ← Edit Details
                        </button>
                        <button onClick={handleSubmit} disabled={submitting}
                            className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50">
                            {submitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
                <div className="max-w-lg mx-auto text-center py-12">
                    <div className="size-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-4xl text-emerald-600">check_circle</span>
                    </div>
                    <h2 className="text-2xl font-black text-navy-950 tracking-tighter mb-2">Request Submitted!</h2>
                    <p className="text-sm text-navy-500 mb-8">
                        Our group bookings team will review your request and contact you within 24 hours with a personalized quote.
                    </p>
                    <button onClick={() => navigate(ROUTES.HOME)}
                        className="px-8 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-600 transition-colors shadow-lg shadow-primary/20">
                        Back to Home
                    </button>
                </div>
            )}
        </div>
    );
};

export default GroupBooking;
