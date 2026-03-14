
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../../config/routes';
import { useToastStore } from '../../stores/toastStore';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase.config';

// ── Types ──────────────────────────────────────────────────
interface MfaMethod {
   id: number;
   icon: string;
   label: string;
   desc: string;
   active: boolean;
}

interface MfaUser {
   name: string;
   id: string;
   role: string;
   status: 'Enforced' | 'Optional' | 'Not Setup';
   method: string;
   avatar: string;
   time: string;
   alert?: boolean;
}

// ── Default Data ───────────────────────────────────────────
const DEFAULT_METHODS: MfaMethod[] = [
   { id: 1, icon: 'smartphone', label: 'Authenticator App', desc: 'Use an app like Google Authenticator or Microsoft Authenticator.', active: true },
   { id: 2, icon: 'sms', label: 'SMS Verification', desc: 'One-time codes sent via text message.', active: true },
   { id: 3, icon: 'mail', label: 'Email Code', desc: 'Codes sent to your registered email address.', active: false },
   { id: 4, icon: 'security_key', label: 'Security Key', desc: 'Physical security keys or fingerprint / face login.', active: true },
];

const AVAILABLE_ROLES = ['Super Admin', 'Ops Manager', 'Dispatcher', 'Captain', 'Ground Ops', 'Admin', 'Agent', 'Crew'];

const DEFAULT_MANDATORY_ROLES = ['Super Admin', 'Ops Manager', 'Dispatcher'];

const DEFAULT_USERS: MfaUser[] = [];


// ════════════════════════════════════════════════════════════
//    MFA Settings Component
// ════════════════════════════════════════════════════════════

const MFASettings: React.FC = () => {
   const navigate = useNavigate();
   const addToast = useToastStore(s => s.addToast);

   // ── State ────────────────────────────────────────────────
   const [dirty, setDirty] = useState(false);
   const [saving, setSaving] = useState(false);
   const [globalEnforce, setGlobalEnforce] = useState(true);
   const [methods, setMethods] = useState<MfaMethod[]>(DEFAULT_METHODS);
   const [mandatoryRoles, setMandatoryRoles] = useState<string[]>(DEFAULT_MANDATORY_ROLES);
   const [gracePeriod, setGracePeriod] = useState(7);
   const [trustFrequency, setTrustFrequency] = useState('30 Days');
   const [rememberDevices, setRememberDevices] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');
   const [showRoleDropdown, setShowRoleDropdown] = useState(false);
   const [showFilterDropdown, setShowFilterDropdown] = useState(false);
   const [statusFilter, setStatusFilter] = useState<string>('All');
   const [openMenuIdx, setOpenMenuIdx] = useState<number | null>(null);

   const touch = () => { if (!dirty) setDirty(true); };

   // Load saved config from Firestore
   useEffect(() => {
      const load = async () => {
         try {
            const snap = await getDoc(doc(db, 'admin_config', 'mfa_settings'));
            if (snap.exists()) {
               const d = snap.data();
               if (d.globalEnforce !== undefined) setGlobalEnforce(d.globalEnforce);
               if (d.methods) setMethods(d.methods);
               if (d.mandatoryRoles) setMandatoryRoles(d.mandatoryRoles);
               if (d.gracePeriod !== undefined) setGracePeriod(d.gracePeriod);
               if (d.trustFrequency) setTrustFrequency(d.trustFrequency);
               if (d.rememberDevices !== undefined) setRememberDevices(d.rememberDevices);
            }
         } catch (err) { console.error('Failed to load MFA config:', err); }
      };
      load();
   }, []);

   // ── Handlers ─────────────────────────────────────────────
   const handleSave = async () => {
      setSaving(true);
      try {
         await setDoc(doc(db, 'admin_config', 'mfa_settings'), {
            globalEnforce,
            methods,
            mandatoryRoles,
            gracePeriod,
            trustFrequency,
            rememberDevices,
            updatedAt: Timestamp.now(),
         }, { merge: true });
         addToast('Two-step verification settings saved successfully.', 'success');
         setDirty(false);
      } catch (err) {
         console.error('Failed to save MFA settings:', err);
         addToast('Failed to save settings. Please try again.', 'error');
      } finally { setSaving(false); }
   };

   const toggleGlobalEnforce = () => {
      setGlobalEnforce(!globalEnforce);
      touch();
   };

   const toggleMethod = (id: number) => {
      setMethods(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m));
      touch();
   };

   const addRole = (role: string) => {
      if (!mandatoryRoles.includes(role)) {
         setMandatoryRoles(prev => [...prev, role]);
         touch();
         addToast(`"${role}" added to required roles.`, 'success');
      }
      setShowRoleDropdown(false);
   };

   const removeRole = (role: string) => {
      setMandatoryRoles(prev => prev.filter(r => r !== role));
      touch();
      addToast(`"${role}" removed from required roles.`, 'info');
   };

   const handleForceEnroll = (user: MfaUser) => {
      addToast(`Enrollment email sent to ${user.name}. They must set up two-step verification on next login.`, 'warning');
   };

   const handleResetMfa = (user: MfaUser) => {
      addToast(`Two-step verification reset for ${user.name}. They will need to set it up again.`, 'info');
      setOpenMenuIdx(null);
   };

   const handleDisableMfa = (user: MfaUser) => {
      addToast(`Two-step verification disabled for ${user.name}.`, 'warning');
      setOpenMenuIdx(null);
   };

   const handleViewHistory = (user: MfaUser) => {
      addToast(`Viewing login history for ${user.name}…`, 'info');
      setOpenMenuIdx(null);
      navigate(ROUTES.SESSION_AUDIT_LOG);
   };

   // ── Filtered Users ───────────────────────────────────────
   const filteredUsers = useMemo(() => {
      return DEFAULT_USERS.filter(u => {
         const matchesSearch = searchQuery === '' ||
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.id.includes(searchQuery) ||
            u.role.toLowerCase().includes(searchQuery.toLowerCase());
         const matchesFilter = statusFilter === 'All' || u.status === statusFilter;
         return matchesSearch && matchesFilter;
      });
   }, [searchQuery, statusFilter]);

   // ── Available roles not yet mandatory ────────────────────
   const availableRolesToAdd = AVAILABLE_ROLES.filter(r => !mandatoryRoles.includes(r));

   // ── Render ───────────────────────────────────────────────
   return (
      <div className="p-8 space-y-10 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-24">
         {/* Page Header */}
         <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 border-b border-navy-100 pb-10">
            <div className="space-y-4 max-w-3xl">
               <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-navy-300">
                  <span>Security</span>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span className="text-primary">Two-Step Verification</span>
               </nav>
               <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">Two-Step Verification</h1>
               <p className="text-navy-500 font-medium italic text-xl leading-relaxed uppercase tracking-wider">Set up login security, choose how users verify their identity, and track who has it enabled.</p>
            </div>
            <div className="flex gap-4">
               <button onClick={() => navigate(ROUTES.SESSION_AUDIT_LOG)} className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-navy-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:bg-navy-50 shadow-sm transition-all">
                  <span className="material-symbols-outlined text-xl">history</span> View Audit Logs
               </button>
               <button onClick={handleSave} disabled={!dirty} className="flex items-center gap-3 px-10 py-4 bg-primary text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100">
                  <span className="material-symbols-outlined text-xl">save</span> Save Changes
                  {dirty && <span className="size-2 bg-white rounded-full animate-pulse" />}
               </button>
            </div>
         </div>

         {/* Global Status Banner */}
         <div className="bg-white rounded-[3rem] border border-navy-100 p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10 group hover:shadow-md transition-all">
            <div className="flex items-start gap-8">
               <div className={`p-6 rounded-[2rem] shadow-inner ${globalEnforce ? 'bg-emerald-50 text-emerald-600' : 'bg-navy-50 text-navy-300'}`}>
                  <span className="material-symbols-outlined text-4xl font-black">verified_user</span>
               </div>
               <div className="space-y-2">
                  <h2 className="text-2xl font-black text-navy-950 uppercase tracking-tighter">
                     Two-Step Verification is {globalEnforce ? 'Enabled' : 'Disabled'}
                  </h2>
                  <p className="text-sm text-navy-500 font-bold uppercase tracking-widest opacity-70">
                     {globalEnforce ? 'Active for 85% of users. Turn on for all admin accounts to improve security.' : 'Two-step verification is currently not required for any users.'}
                  </p>
               </div>
            </div>
            <div className="flex items-center gap-8 bg-navy-50 p-6 rounded-[2.5rem] shadow-inner border border-navy-100">
               <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Require for All</span>
               <button onClick={toggleGlobalEnforce} className="relative inline-flex items-center h-8 rounded-full w-16 transition-all shadow-md cursor-pointer" aria-label="Toggle global enforcement">
                  <div className={`w-16 h-8 rounded-full transition-colors ${globalEnforce ? 'bg-emerald-500' : 'bg-navy-200'}`}>
                     <div className={`absolute top-1 left-1 bg-white rounded-full h-6 w-6 transition-all shadow-lg ${globalEnforce ? 'translate-x-8' : ''}`} />
                  </div>
               </button>
            </div>
         </div>

         {/* Allowed Methods Grid */}
         <div className="space-y-8">
            <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight flex items-center gap-4">
               <span className="material-symbols-outlined text-primary p-2 bg-primary/5 rounded-2xl shadow-inner font-black">lock_open</span>
               Verification Methods
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {methods.map((m) => (
                  <div key={m.id} className={`bg-white rounded-[3rem] border-2 p-10 space-y-8 transition-all hover:shadow-2xl relative overflow-hidden group ${m.active ? 'border-primary shadow-sm' : 'border-navy-50'}`}>
                     <div className="flex justify-between items-start">
                        <div className={`p-4 rounded-2xl ${m.active ? 'bg-primary/5 text-primary' : 'bg-navy-50 text-navy-300'} shadow-inner group-hover:scale-110 transition-transform`}>
                           <span className="material-symbols-outlined text-3xl font-black">{m.icon}</span>
                        </div>
                        <button onClick={() => toggleMethod(m.id)} className="relative inline-flex items-center h-6 rounded-full w-12 transition-all cursor-pointer" aria-label={`Toggle ${m.label}`}>
                           <div className={`w-12 h-6 rounded-full transition-colors ${m.active ? 'bg-primary' : 'bg-navy-100'}`}>
                              <div className={`absolute top-0.5 left-0.5 bg-white rounded-full h-5 w-5 transition-all ${m.active ? 'translate-x-6' : ''}`} />
                           </div>
                        </button>
                     </div>
                     <div className="space-y-2">
                        <h4 className="text-xl font-black text-navy-950 uppercase tracking-tighter leading-tight">{m.label}</h4>
                        <p className="text-xs text-navy-400 font-bold uppercase tracking-widest opacity-60 leading-relaxed">{m.desc}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
            {/* Enforcement Policies */}
            <div className="xl:col-span-2 bg-white rounded-[4rem] border border-navy-100 shadow-sm overflow-hidden flex flex-col">
               <div className="p-10 border-b border-navy-50 bg-navy-50/20 flex items-center justify-between">
                  <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight flex items-center gap-4">
                     <span className="material-symbols-outlined text-indigo-600 p-2.5 bg-indigo-50 rounded-[1.5rem] shadow-inner font-black">policy</span>
                     Security Rules
                  </h3>
               </div>
               <div className="p-12 space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                     <div className="space-y-8">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Required Roles</label>
                           <div className="flex flex-wrap gap-3 p-4 bg-navy-50/50 rounded-[2rem] border border-navy-50 shadow-inner">
                              {mandatoryRoles.map(role => (
                                 <span key={role} className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-navy-100 text-[10px] font-black uppercase text-navy-900 shadow-sm">
                                    {role}
                                    <button onClick={() => removeRole(role)} className="material-symbols-outlined text-navy-200 text-sm cursor-pointer hover:text-red-500 transition-colors" aria-label={`Remove ${role}`}>close</button>
                                 </span>
                              ))}
                              <div className="relative">
                                 <button onClick={() => setShowRoleDropdown(!showRoleDropdown)} className="px-4 py-2 border-2 border-dashed border-navy-200 rounded-xl text-[10px] font-black text-navy-300 uppercase hover:border-primary hover:text-primary transition-all">Add Role</button>
                                 {showRoleDropdown && availableRolesToAdd.length > 0 && (
                                    <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl border border-navy-100 shadow-2xl z-50 py-2 min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-200">
                                       {availableRolesToAdd.map(role => (
                                          <button key={role} onClick={() => addRole(role)} className="w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-navy-600 hover:bg-primary/5 hover:text-primary transition-all">
                                             {role}
                                          </button>
                                       ))}
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                        <p className="text-[10px] font-bold text-navy-400 uppercase italic leading-relaxed tracking-wider opacity-60 px-1">Users with these roles must set up two-step verification on their next login.</p>
                     </div>

                     <div className="space-y-10">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Grace Period & Frequency</label>
                           <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest ml-1">Setup Deadline (Days)</p>
                                 <input type="number" value={gracePeriod} onChange={e => { setGracePeriod(Number(e.target.value)); touch(); }} className="w-full h-14 px-6 bg-navy-50 border-none rounded-2xl text-sm font-black text-navy-950 focus:ring-2 focus:ring-primary/20 shadow-inner" />
                              </div>
                              <div className="space-y-2">
                                 <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest ml-1">Verify Again After</p>
                                 <select value={trustFrequency} onChange={e => { setTrustFrequency(e.target.value); touch(); }} className="w-full h-14 px-6 bg-navy-50 border-none rounded-2xl text-xs font-black text-navy-950 uppercase appearance-none shadow-inner">
                                    <option>30 Days</option>
                                    <option>Every Login</option>
                                 </select>
                              </div>
                           </div>
                        </div>
                        <label className="flex items-center gap-4 cursor-pointer group bg-navy-50/50 p-6 rounded-3xl border border-navy-50 shadow-inner hover:bg-white transition-all">
                           <div className="relative flex items-center group/check">
                              <input type="checkbox" checked={rememberDevices} onChange={e => { setRememberDevices(e.target.checked); touch(); }} className="peer h-6 w-6 appearance-none rounded-lg border-2 border-navy-200 checked:bg-primary checked:border-primary transition-all shadow-sm cursor-pointer" />
                              <span className="material-symbols-outlined text-white text-sm absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 peer-checked:opacity-100 font-black pointer-events-none">check</span>
                           </div>
                           <span className="text-[10px] font-black text-navy-500 uppercase tracking-widest group-hover:text-navy-900 transition-colors">Allow users to remember trusted devices</span>
                        </label>
                     </div>
                  </div>
               </div>
            </div>

            {/* Security Health Sidebar */}
            <div className="bg-indigo-900 rounded-[4rem] text-white p-12 flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-indigo-900/20 group">
               <div className="absolute -top-10 -right-10 opacity-10 rotate-12 transition-transform group-hover:scale-110 duration-1000">
                  <span className="material-symbols-outlined text-[300px] font-black">shield_lock</span>
               </div>

               <div className="relative z-10 space-y-4">
                  <h3 className="text-xl font-black uppercase tracking-[0.25em]">Security Overview</h3>
                  <p className="text-indigo-200 text-sm font-bold uppercase tracking-widest leading-relaxed opacity-60">How many users have two-step verification turned on.</p>
               </div>

               <div className="relative z-10 py-12">
                  <div className="flex items-end gap-6 mb-4">
                     <span className="text-8xl font-black tracking-tighter">92%</span>
                     <div className="flex flex-col mb-4">
                        <span className="flex items-center gap-1 text-emerald-400 text-sm font-black bg-white/10 px-3 py-1 rounded-full border border-white/5 shadow-xl">
                           <span className="material-symbols-outlined text-sm">trending_up</span> +4%
                        </span>
                     </div>
                  </div>
                  <p className="text-indigo-300 text-xs font-black uppercase tracking-[0.2em] ml-1">1,140 SECURED OF 1,240 USERS</p>
               </div>

               <div className="relative z-10 pt-10 border-t border-white/10">
                  <button onClick={() => navigate(ROUTES.PASSWORD_POLICY)} className="w-full py-5 bg-white text-indigo-900 font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                     <span className="material-symbols-outlined">settings</span> Security Settings
                  </button>
               </div>
            </div>
         </div>

         {/* Status Table Section */}
         <div className="bg-white rounded-[4rem] border border-navy-100 shadow-sm overflow-hidden">
            <div className="p-10 border-b border-navy-50 bg-navy-50/20 flex flex-col md:flex-row gap-10 items-center justify-between">
               <h3 className="text-2xl font-black text-navy-950 uppercase tracking-tighter">User Verification Status</h3>
               <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1 max-w-2xl">
                  <div className="relative flex-1 group">
                     <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 group-focus-within:text-primary transition-all">search</span>
                     <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full h-14 pl-14 pr-6 bg-white border-2 border-navy-50 rounded-3xl text-sm font-black uppercase tracking-widest focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
                        placeholder="Search by name, ID, or role..."
                     />
                  </div>
                  <div className="relative">
                     <button onClick={() => setShowFilterDropdown(!showFilterDropdown)} className={`h-14 px-8 bg-white border-2 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter !== 'All' ? 'border-primary text-primary' : 'border-navy-50 text-navy-500 hover:text-primary'}`}>
                        <span className="material-symbols-outlined text-xl">filter_list</span> {statusFilter === 'All' ? 'Filter' : statusFilter}
                     </button>
                     {showFilterDropdown && (
                        <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl border border-navy-100 shadow-2xl z-50 py-2 min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-200">
                           {['All', 'Enforced', 'Optional', 'Not Setup'].map(status => (
                              <button key={status} onClick={() => { setStatusFilter(status); setShowFilterDropdown(false); }} className={`w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status ? 'text-primary bg-primary/5' : 'text-navy-600 hover:bg-primary/5 hover:text-primary'}`}>
                                 {status}
                              </button>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-white text-[9px] font-black text-navy-300 uppercase tracking-[0.3em] border-b border-navy-50">
                        <th className="px-12 py-10">User</th>
                        <th className="px-12 py-10">Role</th>
                        <th className="px-12 py-10">Status</th>
                        <th className="px-12 py-10">Login Method</th>
                        <th className="px-12 py-10">Last Active</th>
                        <th className="px-12 py-10 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-50">
                     {filteredUsers.length === 0 ? (
                        <tr>
                           <td colSpan={6} className="px-12 py-16 text-center">
                              <p className="text-navy-300 text-sm font-bold uppercase tracking-widest">No users match your search.</p>
                           </td>
                        </tr>
                     ) : filteredUsers.map((u, i) => (
                        <tr key={i} className={`hover:bg-navy-50/50 transition-all group cursor-default ${u.alert ? 'bg-red-50/20' : ''}`}>
                           <td className="px-12 py-12">
                              <div className="flex items-center gap-5">
                                 <div className="size-14 rounded-3xl bg-cover bg-center border-2 border-white shadow-md transition-all group-hover:scale-105" style={{ backgroundImage: `url(${u.avatar})` }} />
                                 <div className="space-y-1">
                                    <p className="text-base font-black text-navy-950 uppercase tracking-tighter">{u.name}</p>
                                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest opacity-60">ID: {u.id}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-12 py-12"><span className="text-[10px] font-black text-navy-600 uppercase tracking-widest">{u.role}</span></td>
                           <td className="px-12 py-12">
                              <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${u.status === 'Enforced' ? 'bg-emerald-50 text-emerald-700' : u.status === 'Not Setup' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                                 <span className={`size-1.5 rounded-full ${u.status === 'Enforced' ? 'bg-emerald-500' : u.status === 'Not Setup' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                                 {u.status}
                              </span>
                           </td>
                           <td className="px-12 py-12">
                              <div className="flex items-center gap-3 text-navy-700">
                                 <span className="material-symbols-outlined text-lg opacity-40">key</span>
                                 <span className="text-[10px] font-black uppercase tracking-widest">{u.method}</span>
                              </div>
                           </td>
                           <td className="px-12 py-12 font-mono text-xs font-black text-navy-300 uppercase tracking-widest">{u.time}</td>
                           <td className="px-12 py-12 text-right">
                              <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                 {u.alert && (
                                    <button onClick={() => handleForceEnroll(u)} className="px-4 py-2 bg-red-600 text-white text-[9px] font-black rounded-xl uppercase tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-700 transition-colors">
                                       Send Setup Email
                                    </button>
                                 )}
                                 <div className="relative">
                                    <button onClick={() => setOpenMenuIdx(openMenuIdx === i ? null : i)} className="p-2 text-navy-300 hover:text-primary transition-all">
                                       <span className="material-symbols-outlined">more_horiz</span>
                                    </button>
                                    {openMenuIdx === i && (
                                       <div className="absolute top-full right-0 mt-1 bg-white rounded-2xl border border-navy-100 shadow-2xl z-50 py-2 min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-200">
                                          <button onClick={() => handleResetMfa(u)} className="w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-navy-600 hover:bg-primary/5 hover:text-primary transition-all flex items-center gap-3">
                                             <span className="material-symbols-outlined text-base">restart_alt</span> Reset Verification
                                          </button>
                                          <button onClick={() => handleDisableMfa(u)} className="w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all flex items-center gap-3">
                                             <span className="material-symbols-outlined text-base">block</span> Disable for User
                                          </button>
                                          <hr className="my-1 border-navy-50" />
                                          <button onClick={() => handleViewHistory(u)} className="w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-navy-600 hover:bg-primary/5 hover:text-primary transition-all flex items-center gap-3">
                                             <span className="material-symbols-outlined text-base">history</span> View Login History
                                          </button>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
};

export default MFASettings;
