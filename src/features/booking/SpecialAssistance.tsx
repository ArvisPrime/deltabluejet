import React, { useState } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { useToastStore } from '../../stores/toastStore';

// ─── Types ─────────────────────────────────────────────────

type AssistanceType = 'wheelchair' | 'unaccompanied_minor' | 'medical' | 'service_animal' | 'visual' | 'hearing';

interface AssistanceOption {
    type: AssistanceType;
    label: string;
    icon: string;
    description: string;
    subOptions?: string[];
}

const ASSISTANCE_OPTIONS: AssistanceOption[] = [
    {
        type: 'wheelchair',
        label: 'Wheelchair Assistance',
        icon: 'accessible',
        description: 'Wheelchair service from check-in to your seat and at arrival.',
        subOptions: ['Wheelchair to/from gate (WCHR)', 'Wheelchair to/from aircraft (WCHS)', 'Wheelchair — immobile (WCHP)', 'Aisle wheelchair onboard'],
    },
    {
        type: 'unaccompanied_minor',
        label: 'Unaccompanied Minor',
        icon: 'child_care',
        description: 'For children aged 5–14 travelling alone. Supervised throughout the journey.',
        subOptions: ['Age 5–7 (mandatory UMNR)', 'Age 8–11 (mandatory UMNR)', 'Age 12–14 (optional UMNR)'],
    },
    {
        type: 'medical',
        label: 'Medical Assistance',
        icon: 'medical_services',
        description: 'Medical equipment, oxygen supply, or specific medical needs.',
        subOptions: ['Portable oxygen concentrator (POC)', 'Stretcher required', 'Medical equipment in cabin', 'Medication requiring refrigeration'],
    },
    {
        type: 'service_animal',
        label: 'Service Animal',
        icon: 'pets',
        description: 'Travel with your certified service or emotional support animal.',
        subOptions: ['Trained service dog', 'Psychiatric service animal', 'Emotional support animal (advance notice required)'],
    },
    {
        type: 'visual',
        label: 'Visual Impairment',
        icon: 'visibility_off',
        description: 'Meet-and-assist service, braille information, and priority boarding.',
        subOptions: ['Meet and assist at airport', 'Guide dog accommodation', 'Priority boarding'],
    },
    {
        type: 'hearing',
        label: 'Hearing Impairment',
        icon: 'hearing_disabled',
        description: 'Visual alerts, written communication, and priority boarding.',
        subOptions: ['Visual flight announcements', 'Written communication preference', 'Priority boarding'],
    },
];

// ─── Component ─────────────────────────────────────────────

const SpecialAssistance: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState<Set<AssistanceType>>(new Set());
    const [selectedSubOptions, setSelectedSubOptions] = useState<Record<AssistanceType, string[]>>({} as any);
    const [form, setForm] = useState({
        bookingRef: '',
        passengerName: '',
        contactPhone: '',
        contactEmail: '',
        additionalNotes: '',
    });

    const toggleType = (type: AssistanceType) => {
        const next = new Set(selectedTypes);
        if (next.has(type)) {
            next.delete(type);
            const subs = { ...selectedSubOptions };
            delete subs[type];
            setSelectedSubOptions(subs);
        } else {
            next.add(type);
        }
        setSelectedTypes(next);
    };

    const toggleSubOption = (type: AssistanceType, option: string) => {
        const current = selectedSubOptions[type] || [];
        const updated = current.includes(option)
            ? current.filter(o => o !== option)
            : [...current, option];
        setSelectedSubOptions({ ...selectedSubOptions, [type]: updated });
    };

    const handleSubmit = async () => {
        if (!form.bookingRef || !form.passengerName || !form.contactPhone) {
            addToast('Booking reference, passenger name, and phone are required', 'error');
            return;
        }
        if (selectedTypes.size === 0) {
            addToast('Please select at least one assistance type', 'error');
            return;
        }
        setSubmitting(true);
        try {
            await addDoc(collection(db, 'special_assistance_requests'), {
                ...form,
                assistanceTypes: Array.from(selectedTypes),
                subOptions: selectedSubOptions,
                status: 'pending',
                createdAt: Timestamp.now(),
            });
            setSubmitted(true);
            addToast('Special assistance request submitted', 'success');
        } catch {
            addToast('Failed to submit — please try again', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = 'w-full px-4 py-3 rounded-xl bg-navy-50 border-none text-sm font-bold text-navy-800 placeholder:text-navy-300 focus:ring-2 focus:ring-primary/20';
    const labelClass = 'text-[10px] font-black text-navy-400 uppercase tracking-widest block mb-2';

    if (submitted) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 font-display">
                <div className="size-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-emerald-600">check_circle</span>
                </div>
                <h2 className="text-2xl font-black text-navy-950 tracking-tighter mb-2">Request Submitted</h2>
                <p className="text-sm text-navy-500 mb-1">Your special assistance request has been received.</p>
                <p className="text-sm text-navy-500 mb-8">Our team will contact you within 24 hours to confirm arrangements.</p>
                <Link to={ROUTES.HOME}
                    className="px-8 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-600 shadow-lg shadow-primary/20">
                    Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto font-display custom-scrollbar">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-8">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
                    <Link to={ROUTES.HOME} className="hover:text-primary transition-colors">Home</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-primary" aria-current="page">Special Assistance</span>
                </nav>
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Special Assistance</h1>
                    <p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">
                        Request assistance for passengers with reduced mobility or special needs
                    </p>
                </div>
            </div>

            {/* Step Indicator */}
            <div className="flex gap-2 mb-8 max-w-md">
                {[1, 2].map(s => (
                    <div key={s} className="flex-1">
                        <div className={`h-1.5 rounded-full transition-all ${step >= s ? 'bg-primary' : 'bg-navy-100'}`} />
                        <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${step >= s ? 'text-primary' : 'text-navy-300'}`}>
                            {s === 1 ? 'Select Assistance' : 'Your Details'}
                        </p>
                    </div>
                ))}
            </div>

            {/* Step 1: Select Assistance Types */}
            {step === 1 && (
                <div className="space-y-4 max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ASSISTANCE_OPTIONS.map(opt => {
                            const isSelected = selectedTypes.has(opt.type);
                            return (
                                <div key={opt.type} className={`rounded-2xl border-2 transition-all ${
                                    isSelected ? 'border-primary bg-primary/5 shadow-lg' : 'border-navy-100 bg-white hover:border-navy-200'
                                }`}>
                                    <button onClick={() => toggleType(opt.type)} className="w-full p-5 text-left">
                                        <div className="flex items-start gap-3">
                                            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                isSelected ? 'bg-primary text-white' : 'bg-navy-50 text-navy-400'
                                            }`}>
                                                <span className="material-symbols-outlined">{opt.icon}</span>
                                            </div>
                                            <div>
                                                <p className="font-black text-sm text-navy-950 tracking-tighter">{opt.label}</p>
                                                <p className="text-[10px] text-navy-400 mt-0.5">{opt.description}</p>
                                            </div>
                                        </div>
                                    </button>
                                    {isSelected && opt.subOptions && (
                                        <div className="px-5 pb-4 space-y-1">
                                            {opt.subOptions.map(sub => {
                                                const checked = (selectedSubOptions[opt.type] || []).includes(sub);
                                                return (
                                                    <label key={sub} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-navy-50/50">
                                                        <input type="checkbox" checked={checked} onChange={() => toggleSubOption(opt.type, sub)}
                                                            className="rounded border-navy-200 text-primary focus:ring-primary/20" />
                                                        <span className="text-xs font-bold text-navy-700">{sub}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <button onClick={() => setStep(2)} disabled={selectedTypes.size === 0}
                        className="w-full max-w-2xl py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50">
                        Continue — Enter Details →
                    </button>
                </div>
            )}

            {/* Step 2: Passenger Details */}
            {step === 2 && (
                <div className="space-y-6 max-w-lg">
                    <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-4">
                        <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest">Booking & Passenger</h3>
                        <div>
                            <label className={labelClass}>Booking Reference *</label>
                            <input type="text" placeholder="e.g. DB-ABC123" value={form.bookingRef}
                                onChange={e => setForm(p => ({ ...p, bookingRef: e.target.value }))} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Passenger Name *</label>
                            <input type="text" placeholder="Full name as on ticket" value={form.passengerName}
                                onChange={e => setForm(p => ({ ...p, passengerName: e.target.value }))} className={inputClass} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Phone *</label>
                                <input type="tel" placeholder="+220 123 4567" value={form.contactPhone}
                                    onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Email</label>
                                <input type="email" placeholder="email@example.com" value={form.contactEmail}
                                    onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))} className={inputClass} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Additional Notes</label>
                            <textarea rows={3} placeholder="Any additional information about your needs..."
                                value={form.additionalNotes} onChange={e => setForm(p => ({ ...p, additionalNotes: e.target.value }))} className={inputClass} />
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-navy-50/30 rounded-2xl border border-navy-100 p-5">
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Selected Assistance</p>
                        <div className="flex flex-wrap gap-2">
                            {Array.from(selectedTypes).map(t => {
                                const opt = ASSISTANCE_OPTIONS.find(o => o.type === t);
                                return (
                                    <span key={t} className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">
                                        {opt?.label}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setStep(1)}
                            className="flex-1 py-4 border-2 border-navy-100 rounded-2xl font-black text-xs uppercase tracking-widest text-navy-500 hover:bg-navy-50">
                            ← Back
                        </button>
                        <button onClick={handleSubmit} disabled={submitting}
                            className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50">
                            {submitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpecialAssistance;
