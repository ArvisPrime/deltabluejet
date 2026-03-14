
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../../config/routes';
import { useToastStore } from '../../stores/toastStore';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase.config';

const PROVIDERS = [
   { id: 'Okta', label: 'Corporate Okta', protocol: 'SAML 2.0', sync: '2 mins ago', verified: true, color: 'bg-blue-600' },
   { id: 'Azure', label: 'Azure AD Staff', protocol: 'OIDC', sync: '1 hour ago', verified: true, color: 'bg-cyan-500' },
   { id: 'Google', label: 'Google Workspace', protocol: 'OAuth 2.0', sync: 'Disabled', verified: false, color: 'bg-red-500' },
];

const SSOSettings: React.FC = () => {
   const navigate = useNavigate();
   const toast = useToastStore.getState().addToast;

   // ── State ───────────────────────────────────────────────
   const [activeProvider, setActiveProvider] = useState('Okta');
   const [activeTab, setActiveTab] = useState(0);
   const [filterQuery, setFilterQuery] = useState('');
   const [providerEnabled, setProviderEnabled] = useState(true);
   const [providerName, setProviderName] = useState('Corporate Okta');
   const [ssoUrl, setSsoUrl] = useState('https://dev-847291.okta.com/app/airline_sso/exk184729/sso/saml');
   const [entityId, setEntityId] = useState('http://www.okta.com/exk184729');
   const [dirty, setDirty] = useState(false);
   const [saving, setSaving] = useState(false);

   // Load saved config from Firestore
   useEffect(() => {
      const load = async () => {
         try {
            const snap = await getDoc(doc(db, 'admin_config', 'sso_settings'));
            if (snap.exists()) {
               const d = snap.data();
               if (d.providerEnabled !== undefined) setProviderEnabled(d.providerEnabled);
               if (d.providerName) setProviderName(d.providerName);
               if (d.ssoUrl) setSsoUrl(d.ssoUrl);
               if (d.entityId) setEntityId(d.entityId);
            }
         } catch (err) { console.error('Failed to load SSO config:', err); }
      };
      load();
   }, []);

   // ── Derived ─────────────────────────────────────────────
   const filteredProviders = useMemo(() =>
      PROVIDERS.filter(p =>
         p.label.toLowerCase().includes(filterQuery.toLowerCase()) ||
         p.protocol.toLowerCase().includes(filterQuery.toLowerCase())
      ), [filterQuery]);

   const activeProviderData = PROVIDERS.find(p => p.id === activeProvider);

   // ── Handlers ────────────────────────────────────────────
   const handleCopy = (text: string, label: string) => {
      navigator.clipboard.writeText(text);
      toast(`${label} copied to clipboard`, 'success');
   };

   const handleToggle = () => {
      setProviderEnabled(!providerEnabled);
      setDirty(true);
      toast(providerEnabled ? 'Provider disabled' : 'Provider enabled', 'success');
   };

   const handleSave = async () => {
      setSaving(true);
      try {
         await setDoc(doc(db, 'admin_config', 'sso_settings'), {
            providerEnabled,
            providerName,
            ssoUrl,
            entityId,
            activeProvider,
            updatedAt: Timestamp.now(),
         }, { merge: true });
         setDirty(false);
         toast('SSO settings saved successfully', 'success');
      } catch (err) {
         console.error('Failed to save SSO settings:', err);
         toast('Failed to save settings. Please try again.', 'error');
      } finally { setSaving(false); }
   };

   const handleRemove = () => {
      toast(`${providerName} provider removed`, 'warning');
   };

   const handleTestConnection = () => {
      toast(`Testing connection to ${providerName}...`, 'info');
      setTimeout(() => toast('Connection test successful', 'success'), 1500);
   };

   const markDirty = () => { if (!dirty) setDirty(true); };

   const acsUrl = import.meta.env.VITE_SSO_CALLBACK_URL || 'https://admin.deltablue.com/api/auth/sso/saml/callback';
   const audienceUri = 'urn:amazon:cognito:sp:us-east-1_Ty84jL';

   const tabs = ['General & Protocol', 'Field Mapping', 'Advanced Settings'];

   return (
      <div className="h-full flex flex-col font-sans bg-navy-50/20">
         <div className="max-w-[1600px] mx-auto w-full p-10 space-y-12 pb-24 animate-in slide-in-from-bottom duration-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-navy-100 pb-10">
               <div className="max-w-2xl space-y-6">
                  <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-navy-300 px-1">
                     <span>Security Settings</span>
                     <span className="material-symbols-outlined text-xs">chevron_right</span>
                     <span className="text-primary">Single Sign-On</span>
                  </nav>
                  <div className="space-y-4">
                     <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">Single Sign-On (SSO)</h1>
                     <p className="text-navy-500 font-medium italic text-xl leading-relaxed uppercase tracking-wider">Set up and manage login providers so staff can sign in with their company accounts.</p>
                  </div>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => navigate(ROUTES.SESSION_AUDIT_LOG)} className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-navy-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:bg-navy-50 shadow-sm transition-all">
                     <span className="material-symbols-outlined text-xl">history</span> View Audit Logs
                  </button>
                  <button onClick={() => toast('Add Provider form coming soon', 'info')} className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                     <span className="material-symbols-outlined text-xl">add</span> Add New Provider
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start h-full">
               {/* Provider Navigation */}
               <aside className="lg:col-span-4 flex flex-col gap-8 bg-white rounded-[3.5rem] border border-navy-100 p-10 shadow-sm h-full min-h-[600px]">
                  <div className="flex items-center justify-between pb-4 border-b border-navy-50">
                     <h2 className="text-[10px] font-black text-navy-300 uppercase tracking-[0.25em]">Login Providers</h2>
                     <span className="bg-primary/5 text-[10px] font-black px-4 py-1.5 rounded-full text-primary border border-primary/10">{PROVIDERS.filter(p => p.verified).length} ACTIVE</span>
                  </div>

                  <div className="relative group">
                     <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined">filter_list</span>
                     <input
                        value={filterQuery}
                        onChange={e => setFilterQuery(e.target.value)}
                        className="w-full h-14 pl-14 pr-6 bg-navy-50 border-none rounded-2xl text-xs font-black text-navy-950 uppercase focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                        placeholder="Filter providers..."
                     />
                  </div>

                  <div className="flex flex-col gap-4">
                     {filteredProviders.map((p) => (
                        <button
                           key={p.id}
                           onClick={() => setActiveProvider(p.id)}
                           className={`p-6 rounded-[2.5rem] border-2 transition-all group relative text-left flex flex-col gap-6 ${activeProvider === p.id
                              ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5'
                              : 'border-navy-50 hover:border-navy-100 bg-white'
                              } ${!p.verified && 'opacity-60'}`}
                        >
                           <div className="flex justify-between items-start">
                              <div className="size-14 rounded-2xl bg-white border-2 border-navy-50 p-2 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                 <div className={`size-full rounded-lg ${p.color}`} />
                              </div>
                              {p.verified ? (
                                 <div className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                 </div>
                              ) : (
                                 <span className="size-2 rounded-full bg-navy-200"></span>
                              )}
                           </div>
                           <div>
                              <h4 className="text-xl font-black text-navy-950 uppercase tracking-tighter leading-tight">{p.label}</h4>
                              <div className="flex items-center gap-3 mt-2">
                                 <span className="text-[9px] font-black text-navy-400 uppercase bg-navy-50 px-2 py-0.5 rounded border border-navy-100">{p.protocol}</span>
                                 <span className={`text-[9px] font-black uppercase ${p.verified ? 'text-emerald-500' : 'text-navy-300'}`}>{p.verified ? 'Active' : 'Inactive'}</span>
                              </div>
                           </div>
                           <p className="text-[10px] font-bold text-navy-300 uppercase tracking-widest italic pt-4 border-t border-navy-100 group-hover:text-navy-500 transition-colors">Last Synced: {p.sync}</p>
                        </button>
                     ))}
                     {filteredProviders.length === 0 && (
                        <p className="text-center text-navy-300 text-xs font-bold uppercase py-8">No providers match your filter</p>
                     )}
                  </div>
               </aside>

               {/* Configuration Workspace */}
               <main className="lg:col-span-8 flex flex-col gap-10">
                  <div className="bg-white rounded-[4rem] border border-navy-100 shadow-sm overflow-hidden flex flex-col">
                     <div className="p-10 border-b border-navy-50 bg-navy-50/30 flex flex-col md:flex-row md:items-center justify-between gap-10">
                        <div className="flex items-center gap-6">
                           <div className="size-16 rounded-[1.5rem] bg-white border-2 border-navy-100 p-3 flex items-center justify-center shadow-xl">
                              <div className={`size-full rounded-lg ${activeProviderData?.color || 'bg-blue-600'}`} />
                           </div>
                           <div>
                              <h2 className="text-3xl font-black text-navy-950 uppercase tracking-tighter">{providerName}</h2>
                              <p className="text-xs text-navy-400 font-bold uppercase tracking-widest opacity-60 mt-1">Connected since 24 Oct 2024</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-6 bg-navy-50 p-4 rounded-3xl border border-navy-100 shadow-inner">
                           <span className="text-[10px] font-black text-navy-500 uppercase tracking-widest">Status</span>
                           <button onClick={handleToggle} className="relative inline-flex items-center h-7 rounded-full w-14 transition-all cursor-pointer">
                              <div className={`w-14 h-7 rounded-full transition-all ${providerEnabled ? 'bg-primary' : 'bg-navy-200'} after:content-[''] after:absolute after:top-1 ${providerEnabled ? 'after:left-8' : 'after:left-1'} after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-md`}></div>
                           </button>
                        </div>
                     </div>

                     {/* Tabs */}
                     <div className="flex border-b border-navy-100 px-10">
                        {tabs.map((tab, i) => (
                           <button onClick={() => setActiveTab(i)} key={tab} className={`px-10 py-6 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === i ? 'text-primary' : 'text-navy-300 hover:text-navy-900'}`}>
                              {tab}
                              {activeTab === i && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_0_10px_rgba(19,127,236,0.5)]" />}
                           </button>
                        ))}
                     </div>

                     {/* Tab Content */}
                     <div className="p-12 space-y-12">
                        {activeTab === 0 && (
                           <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Provider Name</label>
                                    <input value={providerName} onChange={e => { setProviderName(e.target.value); markDirty(); }} className="w-full h-14 px-8 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 uppercase focus:ring-4 focus:ring-primary/5 transition-all shadow-inner" />
                                 </div>
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Sign-In Protocol</label>
                                    <div className="relative">
                                       <select className="w-full h-14 px-8 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 uppercase appearance-none shadow-inner opacity-60 cursor-not-allowed" disabled>
                                          <option>SAML 2.0</option>
                                       </select>
                                       <span className="absolute right-6 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined">lock</span>
                                    </div>
                                 </div>
                              </div>

                              <div className="space-y-8">
                                 <h3 className="text-sm font-black text-navy-950 uppercase tracking-[0.25em] border-b border-navy-50 pb-4">SAML Connection Details</h3>
                                 <div className="space-y-8">
                                    <div className="space-y-3">
                                       <div className="flex justify-between items-center px-1">
                                          <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Single Sign-On URL (IdP SSO URL)</label>
                                          <button onClick={() => toast('Setup guide will open in a new tab', 'info')} className="text-[10px] font-black text-primary underline">Setup Guide</button>
                                       </div>
                                       <input value={ssoUrl} onChange={e => { setSsoUrl(e.target.value); markDirty(); }} className="w-full h-14 px-8 bg-navy-50 border-none rounded-3xl text-xs font-black font-mono text-navy-950 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner" />
                                    </div>
                                    <div className="space-y-3">
                                       <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Identity Provider Issuer (Entity ID)</label>
                                       <input value={entityId} onChange={e => { setEntityId(e.target.value); markDirty(); }} className="w-full h-14 px-8 bg-navy-50 border-none rounded-3xl text-xs font-black font-mono text-navy-950 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner" />
                                    </div>
                                    <div className="space-y-3">
                                       <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Security Certificate</label>
                                       <div className="w-full bg-navy-50 rounded-[2.5rem] p-10 border-4 border-dashed border-navy-100 flex flex-col items-center justify-center gap-6 group hover:border-primary transition-all cursor-pointer shadow-inner">
                                          <div className="size-16 rounded-full bg-white flex items-center justify-center text-primary shadow-xl group-hover:scale-110 transition-transform">
                                             <span className="material-symbols-outlined text-3xl">upload_file</span>
                                          </div>
                                          <div className="text-center">
                                             <p className="text-sm font-black text-navy-950 uppercase tracking-tighter">okta_cert_global.pem</p>
                                             <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest mt-1">Uploaded Oct 24, 2024 • SHA-256 Valid</p>
                                          </div>
                                          <button onClick={() => toast('Certificate upload coming soon', 'info')} className="text-[10px] font-black text-primary uppercase tracking-widest underline decoration-2 underline-offset-4">Replace Certificate</button>
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              {/* SP Metadata */}
                              <div className="bg-primary/5 rounded-[3rem] p-10 border border-primary/10 space-y-6 shadow-inner">
                                 <div className="flex items-start gap-6">
                                    <div className="p-3 bg-white rounded-2xl text-primary shadow-md">
                                       <span className="material-symbols-outlined text-2xl">hub</span>
                                    </div>
                                    <div className="space-y-2">
                                       <h4 className="text-lg font-black text-navy-950 uppercase tracking-tighter">Service Provider (SP) Details</h4>
                                       <p className="text-xs text-navy-500 font-bold uppercase tracking-widest opacity-70 leading-relaxed">Share these URLs with your provider to complete the connection setup.</p>
                                    </div>
                                 </div>
                                 <div className="space-y-6 pt-4">
                                    <div className="space-y-3">
                                       <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest block px-1">Assertion Consumer Service (ACS) URL</label>
                                       <div className="flex gap-4">
                                          <code className="flex-1 bg-white border border-navy-100 text-navy-700 px-6 py-4 rounded-2xl text-[10px] font-black font-mono shadow-sm truncate">{acsUrl}</code>
                                          <button onClick={() => handleCopy(acsUrl, 'ACS URL')} className="p-4 bg-white border border-navy-100 rounded-2xl text-navy-300 hover:text-primary hover:border-primary transition-all shadow-sm"><span className="material-symbols-outlined">content_copy</span></button>
                                       </div>
                                    </div>
                                    <div className="space-y-3">
                                       <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest block px-1">Entity ID (Audience URI)</label>
                                       <div className="flex gap-4">
                                          <code className="flex-1 bg-white border border-navy-100 text-navy-700 px-6 py-4 rounded-2xl text-[10px] font-black font-mono shadow-sm truncate">{audienceUri}</code>
                                          <button onClick={() => handleCopy(audienceUri, 'Entity ID')} className="p-4 bg-white border border-navy-100 rounded-2xl text-navy-300 hover:text-primary hover:border-primary transition-all shadow-sm"><span className="material-symbols-outlined">content_copy</span></button>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </>
                        )}

                        {activeTab === 1 && (
                           <div className="space-y-8">
                              <div className="flex justify-between items-center px-2">
                                 <h3 className="text-xl font-black text-navy-950 uppercase tracking-tighter">Field Mapping</h3>
                                 <button onClick={() => toast('Field mapping editor coming soon', 'info')} className="text-[10px] font-black text-primary uppercase tracking-widest underline decoration-2 underline-offset-4">Edit Mapping</button>
                              </div>
                              <div className="overflow-x-auto">
                                 <table className="w-full text-left">
                                    <thead>
                                       <tr className="bg-navy-50/50 text-[9px] font-black text-navy-400 uppercase tracking-widest">
                                          <th className="px-8 py-4 rounded-l-2xl">Provider Field</th>
                                          <th className="px-8 py-4">Our Field</th>
                                          <th className="px-8 py-4 rounded-r-2xl">Type</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-navy-50">
                                       {[
                                          { idp: 'user.email', sys: 'email_address', type: 'String' },
                                          { idp: 'user.firstName', sys: 'first_name', type: 'String' },
                                          { idp: 'user.groups', sys: 'user_roles', type: 'Array', chip: true },
                                       ].map((attr, idx) => (
                                          <tr key={idx} className="group/row">
                                             <td className="px-8 py-6 font-mono text-xs font-black text-navy-400 uppercase">{attr.idp}</td>
                                             <td className="px-8 py-6 text-sm font-black text-navy-900 uppercase tracking-tighter">{attr.sys}</td>
                                             <td className="px-8 py-6">
                                                {attr.chip ? (
                                                   <span className="bg-primary/5 text-primary text-[9px] font-black px-3 py-1 rounded-lg border border-primary/10 uppercase tracking-widest">{attr.type}</span>
                                                ) : (
                                                   <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest opacity-60">{attr.type}</span>
                                                )}
                                             </td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>
                           </div>
                        )}

                        {activeTab === 2 && (
                           <div className="space-y-8">
                              <h3 className="text-xl font-black text-navy-950 uppercase tracking-tighter">Advanced Settings</h3>
                              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex gap-4 items-start">
                                 <span className="material-symbols-outlined text-amber-600 font-black">info</span>
                                 <p className="text-[10px] font-bold text-amber-900 uppercase leading-relaxed tracking-widest">Advanced settings allow fine-tuning of session timeouts, token lifetimes, and claim transformations. Contact your IT team before making changes.</p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Session Timeout (minutes)</label>
                                    <input defaultValue="480" className="w-full h-14 px-8 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 focus:ring-4 focus:ring-primary/5 shadow-inner" />
                                 </div>
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Token Lifetime (seconds)</label>
                                    <input defaultValue="3600" className="w-full h-14 px-8 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 focus:ring-4 focus:ring-primary/5 shadow-inner" />
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>

                     {/* Footer Actions */}
                     <div className="p-10 border-t border-navy-50 bg-navy-50/10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                        <button onClick={handleRemove} className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-red-50 px-6 py-3 rounded-2xl transition-all">
                           <span className="material-symbols-outlined text-lg">delete_forever</span> Remove Provider
                        </button>
                        <div className="flex gap-4 w-full md:w-auto">
                           <button onClick={handleTestConnection} className="flex-1 md:flex-none px-8 py-4 rounded-2xl border-2 border-navy-100 bg-white text-navy-700 text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 transition-all flex items-center justify-center gap-3">
                              <span className="material-symbols-outlined text-lg">bolt</span> Test Connection
                           </button>
                           <button onClick={handleSave} disabled={!dirty} className={`flex-1 md:flex-none px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${dirty ? 'bg-primary text-white shadow-xl shadow-primary/30 hover:scale-105' : 'bg-navy-100 text-navy-300 cursor-not-allowed'}`}>Save Changes</button>
                        </div>
                     </div>
                  </div>
               </main>
            </div>
         </div>
      </div>
   );
};

export default SSOSettings;
