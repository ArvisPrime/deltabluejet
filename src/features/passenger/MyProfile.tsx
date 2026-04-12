
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { BRAND } from '../../config/brand';
import { getOrCreateCustomer, updateCustomer } from '../../services/customerService';
import type { CustomerDoc } from '../../types/firestore';
import { Timestamp } from 'firebase/firestore';
import { useToastStore } from '../../stores/toastStore';
import { toLocalDateString } from '../../utils/localDate';

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

    const [displayName, setDisplayName] = useState('');
    const [phone, setPhone] = useState('');
    const [nationality, setNationality] = useState('');
    const [documentType, setDocumentType] = useState<'passport' | 'national_id' | 'drivers_license'>('passport');
    const [documentNumber, setDocumentNumber] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [passportExpiry, setPassportExpiry] = useState('');
    const [seatPref, setSeatPref] = useState<'window' | 'aisle' | 'middle' | 'none'>('none');
    const [mealPref, setMealPref] = useState<'standard' | 'vegetarian' | 'vegan' | 'halal' | 'kosher' | 'none'>('standard');
    const [emailNotif, setEmailNotif] = useState(true);
    const [smsNotif, setSmsNotif] = useState(false);

    // Emergency Contact
    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyRelation, setEmergencyRelation] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');

    // Profile avatar
    const [avatarUrl, setAvatarUrl] = useState('');

    // Saved passengers (frequent companions)
    type SavedPax = { name: string; dob: string; passport: string };
    const [savedPassengers, setSavedPassengers] = useState<SavedPax[]>([]);
    const [showAddPax, setShowAddPax] = useState(false);
    const [newPaxName, setNewPaxName] = useState('');
    const [newPaxDob, setNewPaxDob] = useState('');
    const [newPaxPassport, setNewPaxPassport] = useState('');

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
                    setDateOfBirth(toLocalDateString(cust.dateOfBirth.toDate()));
                }
                if (cust.preferences) {
                    setSeatPref(cust.preferences.seatPreference || 'none');
                    setMealPref(cust.preferences.mealPreference || 'standard');
                    setEmailNotif(cust.preferences.emailNotifications ?? true);
                    setSmsNotif(cust.preferences.smsNotifications ?? false);
                }
                if ((cust as any).passportExpiry?.toDate) {
                    setPassportExpiry(toLocalDateString((cust as any).passportExpiry.toDate()));
                }
                if ((cust as any).emergencyContact) {
                    setEmergencyName((cust as any).emergencyContact.name || '');
                    setEmergencyRelation((cust as any).emergencyContact.relationship || '');
                    setEmergencyPhone((cust as any).emergencyContact.phone || '');
                }
                setAvatarUrl((cust as any).avatarUrl || '');
                setSavedPassengers((cust as any).savedPassengers || []);
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
                dateOfBirth: dateOfBirth ? Timestamp.fromDate(new Date(dateOfBirth)) : null,
                passportExpiry: passportExpiry ? Timestamp.fromDate(new Date(passportExpiry)) : null,
                avatarUrl: avatarUrl || null,
                emergencyContact: (emergencyName || emergencyPhone) ? {
                    name: emergencyName,
                    relationship: emergencyRelation,
                    phone: emergencyPhone,
                } : null,
                savedPassengers,
                preferences: {
                    seatPreference: seatPref,
                    mealPreference: mealPref,
                    emailNotifications: emailNotif,
                    smsNotifications: smsNotif,
                },
            } as any);
            addToast('Profile updated successfully', 'success');
        } catch (err) {
            console.error('[MyProfile] Save failed:', err);
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

                {/* ═══ Profile Avatar & Personal Information ═════════════════════ */}
                <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-lg">person</span>
                        <p className="text-xs font-black text-navy-700 uppercase tracking-[0.2em]">Personal Information</p>
                    </div>

                    {/* Avatar */}
                    <div className="flex items-center gap-5 pb-2">
                        <div className="relative group">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Profile" className="size-20 rounded-2xl object-cover border-2 border-navy-100" />
                            ) : (
                                <div className="size-20 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-2xl font-black text-white uppercase">
                                    {(displayName || user?.email || '?').charAt(0)}
                                </div>
                            )}
                            <label className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                <span className="material-symbols-outlined text-white text-lg">photo_camera</span>
                                <input type="file" accept="image/*" className="hidden" onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => setAvatarUrl(reader.result as string);
                                        reader.readAsDataURL(file);
                                    }
                                }} />
                            </label>
                        </div>
                        <div>
                            <p className="text-sm font-black text-navy-950">{displayName || 'Set your name'}</p>
                            <p className="text-[10px] text-navy-400 mt-0.5">Click the photo to upload a profile picture</p>
                        </div>
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
                        <div>
                            <label className={labelCls}>Document Number</label>
                            <input className={inputCls} value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} placeholder="e.g. A12345678" />
                        </div>
                        <div>
                            <label className={labelCls}>Passport Expiry Date</label>
                            <input className={inputCls} type="date" value={passportExpiry} onChange={e => setPassportExpiry(e.target.value)} />
                            {passportExpiry && (() => {
                                const exp = new Date(passportExpiry);
                                const sixMonths = new Date();
                                sixMonths.setMonth(sixMonths.getMonth() + 6);
                                if (exp < new Date()) {
                                    return <p className="text-[9px] font-black text-red-500 mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">error</span> Your passport has expired. Please renew before travel.</p>;
                                }
                                if (exp < sixMonths) {
                                    return <p className="text-[9px] font-black text-amber-500 mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">warning</span> Passport expires within 6 months. Some countries require 6+ months validity.</p>;
                                }
                                return null;
                            })()}
                        </div>
                    </div>
                </div>

                {/* ═══ Emergency Contact (ICAO Requirement) ═══════════════ */}
                <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-red-500 text-lg">emergency</span>
                        <div>
                            <p className="text-xs font-black text-navy-700 uppercase tracking-[0.2em]">Emergency Contact</p>
                            <p className="text-[9px] text-navy-400 font-bold mt-0.5">Required for international travel (ICAO standard)</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                            <label className={labelCls}>Contact Name</label>
                            <input className={inputCls} value={emergencyName} onChange={e => setEmergencyName(e.target.value)} placeholder="e.g. Jane Doe" />
                        </div>
                        <div>
                            <label className={labelCls}>Relationship</label>
                            <select className={selectCls} value={emergencyRelation} onChange={e => setEmergencyRelation(e.target.value)}>
                                <option value="">Select...</option>
                                <option value="spouse">Spouse</option>
                                <option value="parent">Parent</option>
                                <option value="sibling">Sibling</option>
                                <option value="child">Child</option>
                                <option value="friend">Friend</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Phone Number</label>
                            <input className={inputCls} type="tel" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} placeholder="+220 123 4567" />
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

                {/* ═══ Saved Passengers (Frequent Companions) ═══════ */}
                <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-lg">group</span>
                            <div>
                                <p className="text-xs font-black text-navy-700 uppercase tracking-[0.2em]">Saved Passengers</p>
                                <p className="text-[9px] text-navy-400 font-bold mt-0.5">Add frequent travel companions for faster booking</p>
                            </div>
                        </div>
                        <button type="button" onClick={() => setShowAddPax(!showAddPax)} className="h-8 px-3 rounded-lg bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-primary/20 transition-colors">
                            <span className="material-symbols-outlined text-sm">{showAddPax ? 'close' : 'person_add'}</span>
                            {showAddPax ? 'Cancel' : 'Add'}
                        </button>
                    </div>

                    {/* Add Passenger Form */}
                    {showAddPax && (
                        <div className="bg-navy-50/50 rounded-xl p-4 space-y-3 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <input className={inputCls} value={newPaxName} onChange={e => setNewPaxName(e.target.value)} placeholder="Full Name" />
                                <input className={inputCls} type="date" value={newPaxDob} onChange={e => setNewPaxDob(e.target.value)} />
                                <input className={inputCls} value={newPaxPassport} onChange={e => setNewPaxPassport(e.target.value)} placeholder="Passport Number" />
                            </div>
                            <button type="button" onClick={() => {
                                if (!newPaxName.trim()) return;
                                setSavedPassengers(prev => [...prev, { name: newPaxName, dob: newPaxDob, passport: newPaxPassport }]);
                                setNewPaxName(''); setNewPaxDob(''); setNewPaxPassport('');
                                setShowAddPax(false);
                            }} className="h-9 px-5 rounded-lg bg-primary text-white text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity">
                                Add Passenger
                            </button>
                        </div>
                    )}

                    {/* Passenger List */}
                    {savedPassengers.length > 0 ? (
                        <div className="divide-y divide-navy-50">
                            {savedPassengers.map((pax, i) => (
                                <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="size-9 rounded-xl bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center">
                                            <span className="text-xs font-black text-primary uppercase">{pax.name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-navy-900">{pax.name}</p>
                                            <p className="text-[9px] font-bold text-navy-400">
                                                {pax.passport && <span>Passport: {pax.passport}</span>}
                                                {pax.dob && <span className="ml-2">DOB: {pax.dob}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setSavedPassengers(prev => prev.filter((_, idx) => idx !== i))} className="size-8 rounded-lg bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors">
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : !showAddPax && (
                        <div className="text-center py-6">
                            <span className="material-symbols-outlined text-3xl text-navy-200">group_add</span>
                            <p className="text-[10px] font-bold text-navy-400 mt-2">No saved passengers yet</p>
                        </div>
                    )}
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
