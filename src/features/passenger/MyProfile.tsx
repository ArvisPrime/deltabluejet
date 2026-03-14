
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { BRAND } from '../../config/brand';
import { getOrCreateCustomer, updateCustomer } from '../../services/customerService';
import type { CustomerDoc } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';

/**
 * MyProfile — Passenger profile management page.
 * Sections: Personal info, contact, travel documents, preferences.
 */
const MyProfile: React.FC = () => {
    const { user } = useAuth();
    const addToast = useToastStore(s => s.addToast);

    const [customer, setCustomer] = useState<CustomerDoc | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [displayName, setDisplayName] = useState('');
    const [phone, setPhone] = useState('');
    const [nationality, setNationality] = useState('');
    const [documentType, setDocumentType] = useState<'passport' | 'national_id' | 'drivers_license'>('passport');
    const [documentNumber, setDocumentNumber] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [seatPref, setSeatPref] = useState<'window' | 'aisle' | 'middle' | 'none'>('none');
    const [mealPref, setMealPref] = useState<'standard' | 'vegetarian' | 'vegan' | 'halal' | 'kosher' | 'none'>('standard');
    const [emailNotif, setEmailNotif] = useState(true);
    const [smsNotif, setSmsNotif] = useState(false);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const cust = await getOrCreateCustomer(user.uid, user.email || '', user.displayName || '');
                setCustomer(cust);
                setDisplayName(cust.displayName || '');
                setPhone(cust.phone || '');
                setNationality(cust.nationality || '');
                setDocumentType(cust.documentType || 'passport');
                setDocumentNumber(cust.documentNumber || '');
                if (cust.dateOfBirth?.toDate) {
                    setDateOfBirth(cust.dateOfBirth.toDate().toISOString().split('T')[0]);
                }
                if (cust.preferences) {
                    setSeatPref(cust.preferences.seatPreference || 'none');
                    setMealPref(cust.preferences.mealPreference || 'standard');
                    setEmailNotif(cust.preferences.emailNotifications ?? true);
                    setSmsNotif(cust.preferences.smsNotifications ?? false);
                }
            } catch {
                addToast('Failed to load profile', 'error');
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        try {
            await updateCustomer(user.uid, {
                displayName,
                phone: phone || null,
                nationality: nationality || null,
                documentType,
                documentNumber: documentNumber || null,
                preferences: {
                    seatPreference: seatPref,
                    mealPreference: mealPref,
                    emailNotifications: emailNotif,
                    smsNotifications: smsNotif,
                },
            });
            addToast('Profile updated successfully', 'success');
        } catch {
            addToast('Failed to save profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-navy-400 text-xs font-black uppercase tracking-[0.3em]">Loading Profile</p>
                </div>
            </div>
        );
    }

    const inputCls = "w-full h-12 px-4 bg-navy-50 border-none rounded-xl text-sm font-bold text-navy-950 focus:ring-4 focus:ring-primary/10 transition-all";
    const labelCls = "text-[10px] font-black text-navy-400 uppercase tracking-widest block mb-1.5";
    const selectCls = "w-full h-12 px-4 bg-navy-50 border-none rounded-xl text-sm font-bold text-navy-950 focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer";

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl">

            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-black text-navy-950 tracking-tight uppercase">My Profile</h1>
                <p className="text-sm font-bold text-navy-400 mt-1">Manage your personal information, travel documents, and preferences.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">

                {/* ═══ Personal Information ═════════════════════ */}
                <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-lg">person</span>
                        <p className="text-xs font-black text-navy-700 uppercase tracking-[0.2em]">Personal Information</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className={labelCls}>Full Name</label>
                            <input className={inputCls} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="John Doe" />
                        </div>
                        <div>
                            <label className={labelCls}>Date of Birth</label>
                            <input className={inputCls} type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* ═══ Contact Details ═══════════════════════════ */}
                <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-lg">contact_mail</span>
                        <p className="text-xs font-black text-navy-700 uppercase tracking-[0.2em]">Contact Details</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className={labelCls}>Email Address</label>
                            <input className={`${inputCls} bg-navy-50/50 text-navy-400 cursor-not-allowed`} value={user?.email || ''} disabled />
                            <p className="text-[9px] text-navy-300 mt-1 font-bold">Email is linked to your account and cannot be changed here.</p>
                        </div>
                        <div>
                            <label className={labelCls}>Phone Number</label>
                            <input className={inputCls} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+220 123 4567" />
                        </div>
                    </div>
                </div>

                {/* ═══ Travel Documents ══════════════════════════ */}
                <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-lg">badge</span>
                        <p className="text-xs font-black text-navy-700 uppercase tracking-[0.2em]">Travel Documents</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className={labelCls}>Nationality</label>
                            <input className={inputCls} value={nationality} onChange={e => setNationality(e.target.value)} placeholder="e.g. Gambian" />
                        </div>
                        <div>
                            <label className={labelCls}>Document Type</label>
                            <select className={selectCls} value={documentType} onChange={e => setDocumentType(e.target.value as any)}>
                                <option value="passport">Passport</option>
                                <option value="national_id">National ID</option>
                                <option value="drivers_license">Driver's License</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelCls}>Document Number</label>
                            <input className={inputCls} value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} placeholder="e.g. A12345678" />
                        </div>
                    </div>
                </div>

                {/* ═══ Travel Preferences ═══════════════════════ */}
                <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-lg">tune</span>
                        <p className="text-xs font-black text-navy-700 uppercase tracking-[0.2em]">Travel Preferences</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className={labelCls}>Seat Preference</label>
                            <select className={selectCls} value={seatPref} onChange={e => setSeatPref(e.target.value as any)}>
                                <option value="none">No Preference</option>
                                <option value="window">Window</option>
                                <option value="aisle">Aisle</option>
                                <option value="middle">Middle</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Meal Preference</label>
                            <select className={selectCls} value={mealPref} onChange={e => setMealPref(e.target.value as any)}>
                                <option value="standard">Standard</option>
                                <option value="vegetarian">Vegetarian</option>
                                <option value="vegan">Vegan</option>
                                <option value="halal">Halal</option>
                                <option value="kosher">Kosher</option>
                                <option value="none">None</option>
                            </select>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="space-y-3 pt-2">
                        <p className={labelCls}>Communication Preferences</p>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" checked={emailNotif} onChange={e => setEmailNotif(e.target.checked)}
                                className="size-5 rounded-lg border-2 border-navy-200 text-primary focus:ring-primary transition" />
                            <span className="text-xs font-bold text-navy-700 group-hover:text-navy-950 transition">Email notifications for bookings, deals, and flight updates</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" checked={smsNotif} onChange={e => setSmsNotif(e.target.checked)}
                                className="size-5 rounded-lg border-2 border-navy-200 text-primary focus:ring-primary transition" />
                            <span className="text-xs font-bold text-navy-700 group-hover:text-navy-950 transition">SMS alerts for check-in reminders and flight changes</span>
                        </label>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="h-12 px-10 bg-primary text-white font-black uppercase tracking-[0.2em] text-xs rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-lg">save</span>
                                Save Profile
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MyProfile;
