import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import {
   getOrCreateCustomer,
   updateCustomer,
} from '../../services/customerService';
import type { CustomerDoc, DocumentType } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';

const ROLE_LABELS: Record<string, string> = {
   super_admin: 'Super Admin',
   ops_manager: 'Operations Manager',
   crew_sched: 'Crew Scheduler',
   cs_agent: 'Customer Service Agent',
   customer: 'Customer',
};

const AccountSettings: React.FC = () => {
   const authUser = useAuthStore((s) => s.user);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [successMsg, setSuccessMsg] = useState('');

   // Profile state
   const [customer, setCustomer] = useState<CustomerDoc | null>(null);
   const [phone, setPhone] = useState('');
   const [nationality, setNationality] = useState('');
   const [documentType, setDocumentType] = useState<DocumentType | ''>('');
   const [documentNumber, setDocumentNumber] = useState('');
   const [seatPref, setSeatPref] = useState<CustomerDoc['preferences']['seatPreference']>('none');
   const [mealPref, setMealPref] = useState<CustomerDoc['preferences']['mealPreference']>('standard');
   const [emailNotif, setEmailNotif] = useState(true);
   const [smsNotif, setSmsNotif] = useState(false);
   const [gdprConsent, setGdprConsent] = useState(false);
   const [marketingOptIn, setMarketingOptIn] = useState(false);

   const loadData = useCallback(async () => {
      if (!authUser) return;
      setLoading(true);
      try {
         const c = await getOrCreateCustomer(
            authUser.uid,
            authUser.email || '',
            authUser.displayName || 'Admin User',
         );
         setCustomer(c);
         setPhone(c.phone || '');
         setNationality(c.nationality || '');
         setDocumentType(c.documentType || '');
         setDocumentNumber(c.documentNumber || '');
         setSeatPref(c.preferences.seatPreference);
         setMealPref(c.preferences.mealPreference);
         setEmailNotif(c.preferences.emailNotifications);
         setSmsNotif(c.preferences.smsNotifications);
         setGdprConsent(c.gdprConsent ?? false);
         setMarketingOptIn(c.marketingOptIn ?? false);
      } catch (err) {
         console.error('Failed to load profile:', err);
         useToastStore.getState().addToast("Failed to load profile", "error");
      } finally {
         setLoading(false);
      }
   }, [authUser]);

   useEffect(() => { loadData(); }, [loadData]);

   const handleSaveProfile = async () => {
      if (!customer || !authUser) return;
      setSaving(true);
      setSuccessMsg('');
      try {
         await updateCustomer(authUser.uid, {
            phone: phone || null,
            nationality: nationality || null,
            documentType: (documentType as DocumentType) || null,
            documentNumber: documentNumber || null,
            preferences: {
               seatPreference: seatPref,
               mealPreference: mealPref,
               emailNotifications: emailNotif,
               smsNotifications: smsNotif,
            },
            gdprConsent,
            marketingOptIn,
         } as any);
         setSuccessMsg('Profile updated successfully!');
         setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
         console.error('Save failed:', err);
         useToastStore.getState().addToast("Save failed", "error");
      } finally {
         setSaving(false);
      }
   };

   const fmt = (ts: any) => {
      if (!ts) return '—';
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin size-8 border-3 border-navy-200 border-t-primary rounded-full" />
         </div>
      );
   }

   return (
      <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
         {/* Header */}
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-3xl font-black text-navy-950 tracking-tighter">My Account</h1>
               <p className="text-sm text-navy-400 font-medium mt-1">View and update your admin account details.</p>
            </div>
            <div className="flex items-center gap-3">
               <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  {authUser?.photoURL ? (
                     <img src={authUser.photoURL} alt="" className="size-12 rounded-2xl object-cover" />
                  ) : (
                     <span className="material-symbols-outlined text-primary text-2xl">account_circle</span>
                  )}
               </div>
               <div>
                  <p className="text-sm font-black text-navy-950">{authUser?.displayName || 'Admin'}</p>
                  <p className="text-[10px] text-navy-400 font-bold uppercase tracking-widest">
                     {ROLE_LABELS[authUser?.role || ''] || 'Admin'}
                  </p>
               </div>
            </div>
         </div>

         {/* Success Message */}
         {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
               <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
               <p className="text-xs font-bold text-emerald-700">{successMsg}</p>
            </div>
         )}

         {/* Account Info (read-only) */}
         <div className="bg-white rounded-3xl border border-navy-100 p-8 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Account Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Display Name</label>
                  <div className="w-full h-12 px-4 bg-navy-50 rounded-xl font-bold text-navy-900 flex items-center">
                     {authUser?.displayName || '—'}
                  </div>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Email Address</label>
                  <div className="w-full h-12 px-4 bg-navy-50 rounded-xl font-bold text-navy-900 flex items-center">
                     {authUser?.email || '—'}
                  </div>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Role</label>
                  <div className="w-full h-12 px-4 bg-navy-50 rounded-xl font-bold text-navy-900 flex items-center gap-2">
                     <span className="material-symbols-outlined text-primary text-base">admin_panel_settings</span>
                     {ROLE_LABELS[authUser?.role || ''] || 'Admin'}
                  </div>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Last Login</label>
                  <div className="w-full h-12 px-4 bg-navy-50 rounded-xl font-bold text-navy-900 flex items-center">
                     {fmt(customer?.updatedAt)}
                  </div>
               </div>
            </div>
         </div>

         {/* Personal Info (editable) */}
         <div className="bg-white rounded-3xl border border-navy-100 p-8 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Phone Number</label>
                  <input
                     className="w-full h-12 px-4 bg-navy-50 rounded-xl font-bold text-navy-900 outline-none focus:ring-2 focus:ring-primary/20"
                     placeholder="+220 123 4567"
                     value={phone}
                     onChange={(e) => setPhone(e.target.value)}
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Nationality</label>
                  <input
                     className="w-full h-12 px-4 bg-navy-50 rounded-xl font-bold text-navy-900 outline-none focus:ring-2 focus:ring-primary/20"
                     placeholder="e.g. Gambian"
                     value={nationality}
                     onChange={(e) => setNationality(e.target.value)}
                  />
               </div>
            </div>
         </div>

         {/* Travel Document */}
         <div className="bg-white rounded-3xl border border-navy-100 p-8 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Travel Document</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Document Type</label>
                  <select
                     className="w-full h-12 px-4 bg-navy-50 rounded-xl font-bold text-navy-900 outline-none focus:ring-2 focus:ring-primary/20"
                     value={documentType}
                     onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                  >
                     <option value="">Select...</option>
                     <option value="passport">Passport</option>
                     <option value="national_id">National ID</option>
                     <option value="drivers_license">Driver's License</option>
                  </select>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Document Number</label>
                  <input
                     className="w-full h-12 px-4 bg-navy-50 rounded-xl font-bold text-navy-900 outline-none focus:ring-2 focus:ring-primary/20"
                     placeholder="e.g. AB1234567"
                     value={documentNumber}
                     onChange={(e) => setDocumentNumber(e.target.value.toUpperCase())}
                  />
               </div>
            </div>
         </div>

         {/* Preferences */}
         <div className="bg-white rounded-3xl border border-navy-100 p-8 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Seat Preference</label>
                  <select
                     className="w-full h-12 px-4 bg-navy-50 rounded-xl font-bold text-navy-900 outline-none focus:ring-2 focus:ring-primary/20"
                     value={seatPref}
                     onChange={(e) => setSeatPref(e.target.value as CustomerDoc['preferences']['seatPreference'])}
                  >
                     <option value="none">No Preference</option>
                     <option value="window">Window</option>
                     <option value="aisle">Aisle</option>
                     <option value="middle">Middle</option>
                  </select>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Meal Preference</label>
                  <select
                     className="w-full h-12 px-4 bg-navy-50 rounded-xl font-bold text-navy-900 outline-none focus:ring-2 focus:ring-primary/20"
                     value={mealPref}
                     onChange={(e) => setMealPref(e.target.value as CustomerDoc['preferences']['mealPreference'])}
                  >
                     <option value="standard">Standard</option>
                     <option value="vegetarian">Vegetarian</option>
                     <option value="vegan">Vegan</option>
                     <option value="halal">Halal</option>
                     <option value="kosher">Kosher</option>
                     <option value="none">No Meal</option>
                  </select>
               </div>
            </div>
            <div className="flex gap-6 pt-2">
               <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} className="h-4 w-4 rounded text-primary" />
                  <span className="text-xs font-bold text-navy-700">Email Notifications</span>
               </label>
               <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={smsNotif} onChange={(e) => setSmsNotif(e.target.checked)} className="h-4 w-4 rounded text-primary" />
                  <span className="text-xs font-bold text-navy-700">SMS Notifications</span>
               </label>
            </div>
         </div>

         {/* Data & Privacy */}
         <div className="bg-white rounded-3xl border border-navy-100 p-8 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Data & Privacy</h3>
            <div className="space-y-4">
               <label className="flex items-center justify-between p-4 bg-navy-50/50 rounded-2xl cursor-pointer group hover:bg-navy-50 transition-all">
                  <div className="flex items-center gap-4">
                     <span className="material-symbols-outlined text-primary text-xl">campaign</span>
                     <div>
                        <p className="text-sm font-black text-navy-950">Marketing Communications</p>
                        <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest opacity-60">Receive promotions, offers, and news</p>
                     </div>
                  </div>
                  <button
                     onClick={() => setMarketingOptIn(!marketingOptIn)}
                     className="relative inline-flex items-center h-7 w-14 cursor-pointer"
                  >
                     <div className={`w-14 h-7 rounded-full transition-all ${marketingOptIn ? 'bg-primary' : 'bg-navy-200'}`}>
                        <div className={`absolute top-1 left-1 bg-white rounded-full h-5 w-5 transition-all shadow-md ${marketingOptIn ? 'translate-x-7' : ''}`} />
                     </div>
                  </button>
               </label>

               <label className="flex items-center justify-between p-4 bg-navy-50/50 rounded-2xl cursor-pointer group hover:bg-navy-50 transition-all">
                  <div className="flex items-center gap-4">
                     <span className="material-symbols-outlined text-emerald-600 text-xl">verified_user</span>
                     <div>
                        <p className="text-sm font-black text-navy-950">GDPR Data Consent</p>
                        <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest opacity-60">I consent to the processing of my personal data</p>
                     </div>
                  </div>
                  <button
                     onClick={() => setGdprConsent(!gdprConsent)}
                     className="relative inline-flex items-center h-7 w-14 cursor-pointer"
                  >
                     <div className={`w-14 h-7 rounded-full transition-all ${gdprConsent ? 'bg-emerald-500' : 'bg-navy-200'}`}>
                        <div className={`absolute top-1 left-1 bg-white rounded-full h-5 w-5 transition-all shadow-md ${gdprConsent ? 'translate-x-7' : ''}`} />
                     </div>
                  </button>
               </label>
            </div>

            <div className="flex gap-3 pt-2">
               <button
                  onClick={() => useToastStore.getState().addToast('Data export request submitted. You will receive an email shortly.', 'success')}
                  className="flex-1 py-3 border-2 border-navy-100 rounded-xl text-[10px] font-black text-navy-700 uppercase tracking-widest hover:bg-navy-50 transition-all flex items-center justify-center gap-2"
               >
                  <span className="material-symbols-outlined text-sm">download</span> Download My Data
               </button>
               <button
                  onClick={() => useToastStore.getState().addToast('Please contact support@deltabluejetair.com to delete your account.', 'info')}
                  className="flex-1 py-3 border-2 border-red-100 rounded-xl text-[10px] font-black text-red-600 uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
               >
                  <span className="material-symbols-outlined text-sm">delete_forever</span> Delete My Account
               </button>
            </div>
         </div>

         {/* Save Button */}
         <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full py-4 bg-primary text-white font-black uppercase tracking-[0.15em] rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
         >
            {saving ? (
               <><div className="animate-spin size-4 border-2 border-white/30 border-t-white rounded-full" /> Saving...</>
            ) : (
               <><span className="material-symbols-outlined text-sm">save</span> Save Changes</>
            )}
         </button>
      </div>
   );
};

export default AccountSettings;
