
import React, { useState } from 'react';

const SSOSettings: React.FC = () => {
  const [activeProvider, setActiveProvider] = useState('Okta');

  return (
    <div className="h-full flex flex-col font-sans bg-navy-50/20">
      <div className="max-w-[1600px] mx-auto w-full p-10 space-y-12 pb-24 animate-in slide-in-from-bottom duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-navy-100 pb-10">
          <div className="max-w-2xl space-y-6">
             <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-navy-300 px-1">
                <span>Security Settings</span>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-primary">SSO Configuration</span>
             </nav>
             <div className="space-y-4">
                <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">Single Sign-On (SSO)</h1>
                <p className="text-navy-500 font-medium italic text-xl leading-relaxed uppercase tracking-wider">Manage enterprise identity providers, configure trust protocols, and map personnel attributes for global authentication.</p>
             </div>
          </div>
          <div className="flex gap-4">
             <button className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-navy-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:bg-navy-50 shadow-sm transition-all">
                <span className="material-symbols-outlined text-xl">history</span> View Audit Logs
             </button>
             <button className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-xl">add</span> Add New Provider
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start h-full">
          {/* Provider Navigation */}
          <aside className="lg:col-span-4 flex flex-col gap-8 bg-white rounded-[3.5rem] border border-navy-100 p-10 shadow-sm h-full min-h-[600px]">
            <div className="flex items-center justify-between pb-4 border-b border-navy-50">
              <h2 className="text-[10px] font-black text-navy-300 uppercase tracking-[0.25em]">Configured Trusts</h2>
              <span className="bg-primary/5 text-[10px] font-black px-4 py-1.5 rounded-full text-primary border border-primary/10">3 ACTIVE</span>
            </div>

            <div className="relative group">
               <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined">filter_list</span>
               <input className="w-full h-14 pl-14 pr-6 bg-navy-50 border-none rounded-2xl text-xs font-black text-navy-950 uppercase focus:ring-4 focus:ring-primary/5 transition-all shadow-inner" placeholder="Filter providers..." />
            </div>

            <div className="flex flex-col gap-4">
              {[
                { id: 'Okta', label: 'Corporate Okta', protocol: 'SAML 2.0', sync: '2 mins ago', verified: true, color: 'bg-blue-600' },
                { id: 'Azure', label: 'Azure AD Staff', protocol: 'OIDC', sync: '1 hour ago', verified: true, color: 'bg-cyan-500' },
                { id: 'Google', label: 'Google Workspace', protocol: 'OAuth 2.0', sync: 'Disabled', verified: false, color: 'bg-red-500' },
              ].map((p) => (
                <button 
                  key={p.id}
                  onClick={() => setActiveProvider(p.id)}
                  className={`p-6 rounded-[2.5rem] border-2 transition-all group relative text-left flex flex-col gap-6 ${
                    activeProvider === p.id 
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
                       <span className={`text-[9px] font-black uppercase ${p.verified ? 'text-emerald-500' : 'text-navy-300'}`}>{p.verified ? 'Verified' : 'Inactive'}</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-navy-300 uppercase tracking-widest italic pt-4 border-t border-navy-100 group-hover:text-navy-500 transition-colors">Sync Cycle: {p.sync}</p>
                </button>
              ))}
            </div>
          </aside>

          {/* Configuration Workspace */}
          <main className="lg:col-span-8 flex flex-col gap-10">
            <div className="bg-white rounded-[4rem] border border-navy-100 shadow-sm overflow-hidden flex flex-col">
               <div className="p-10 border-b border-navy-50 bg-navy-50/30 flex flex-col md:flex-row md:items-center justify-between gap-10">
                  <div className="flex items-center gap-6">
                     <div className="size-16 rounded-[1.5rem] bg-white border-2 border-navy-100 p-3 flex items-center justify-center shadow-xl">
                        <div className="size-full rounded-lg bg-blue-600" />
                     </div>
                     <div>
                        <h2 className="text-3xl font-black text-navy-950 uppercase tracking-tighter">Corporate Okta Configuration</h2>
                        <p className="text-xs text-navy-400 font-bold uppercase tracking-widest opacity-60 mt-1">Personnel trust relationship established 24 Oct 2024</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-6 bg-navy-50 p-4 rounded-3xl border border-navy-100 shadow-inner">
                     <span className="text-[10px] font-black text-navy-500 uppercase tracking-widest">Master Status</span>
                     <div className="relative inline-flex items-center h-7 rounded-full w-14 transition-all">
                        <input checked readOnly type="checkbox" className="sr-only peer" />
                        <div className="w-14 h-7 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-md"></div>
                     </div>
                  </div>
               </div>

               <div className="flex border-b border-navy-100 px-10">
                  {['General & Protocol', 'Attribute Mapping', 'Advanced Settings'].map((tab, i) => (
                    <button key={tab} className={`px-10 py-6 text-[10px] font-black uppercase tracking-widest transition-all relative ${i === 0 ? 'text-primary' : 'text-navy-300 hover:text-navy-900'}`}>
                       {tab}
                       {i === 0 && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_0_10px_rgba(19,127,236,0.5)]" />}
                    </button>
                  ))}
               </div>

               <div className="p-12 space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Provider Master Name</label>
                        <input className="w-full h-14 px-8 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 uppercase focus:ring-4 focus:ring-primary/5 transition-all shadow-inner" defaultValue="Corporate Okta" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Trust Protocol</label>
                        <div className="relative">
                           <select className="w-full h-14 px-8 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 uppercase appearance-none shadow-inner opacity-60 cursor-not-allowed" disabled>
                              <option>SAML 2.0</option>
                           </select>
                           <span className="absolute right-6 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined">lock</span>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-8">
                     <h3 className="text-sm font-black text-navy-950 uppercase tracking-[0.25em] border-b border-navy-50 pb-4">SAML Handshake Logic</h3>
                     <div className="space-y-8">
                        <div className="space-y-3">
                           <div className="flex justify-between items-center px-1">
                              <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Single Sign-On URL (IdP SSO URL)</label>
                              <button className="text-[10px] font-black text-primary underline">Registry Guide</button>
                           </div>
                           <input className="w-full h-14 px-8 bg-navy-50 border-none rounded-3xl text-xs font-black font-mono text-navy-950 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner" defaultValue="https://dev-847291.okta.com/app/airline_sso/exk184729/sso/saml" />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Identity Provider Issuer (Entity ID)</label>
                           <input className="w-full h-14 px-8 bg-navy-50 border-none rounded-3xl text-xs font-black font-mono text-navy-950 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner" defaultValue="http://www.okta.com/exk184729" />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">X.509 Master Certificate</label>
                           <div className="w-full bg-navy-50 rounded-[2.5rem] p-10 border-4 border-dashed border-navy-100 flex flex-col items-center justify-center gap-6 group hover:border-primary transition-all cursor-pointer shadow-inner">
                              <div className="size-16 rounded-full bg-white flex items-center justify-center text-primary shadow-xl group-hover:scale-110 transition-transform">
                                 <span className="material-symbols-outlined text-3xl">upload_file</span>
                              </div>
                              <div className="text-center">
                                 <p className="text-sm font-black text-navy-950 uppercase tracking-tighter">okta_cert_global.pem</p>
                                 <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest mt-1">Uploaded Oct 24, 2024 • SHA-256 Valid</p>
                              </div>
                              <button className="text-[10px] font-black text-primary uppercase tracking-widest underline decoration-2 underline-offset-4">Replace Certificate Profile</button>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-primary/5 rounded-[3rem] p-10 border border-primary/10 space-y-6 shadow-inner">
                     <div className="flex items-start gap-6">
                        <div className="p-3 bg-white rounded-2xl text-primary shadow-md">
                           <span className="material-symbols-outlined text-2xl">hub</span>
                        </div>
                        <div className="space-y-2">
                           <h4 className="text-lg font-black text-navy-950 uppercase tracking-tighter">Service Provider (SP) Metadata</h4>
                           <p className="text-xs text-navy-500 font-bold uppercase tracking-widest opacity-70 leading-relaxed">Provide these endpoints to Okta to complete the trust handshake.</p>
                        </div>
                     </div>
                     <div className="space-y-6 pt-4">
                        <div className="space-y-3">
                           <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest block px-1">Assertion Consumer Service (ACS) URL</label>
                           <div className="flex gap-4">
                              <code className="flex-1 bg-white border border-navy-100 text-navy-700 px-6 py-4 rounded-2xl text-[10px] font-black font-mono shadow-sm truncate">https://admin.deltablue.com/api/auth/sso/saml/callback</code>
                              <button className="p-4 bg-white border border-navy-100 rounded-2xl text-navy-300 hover:text-primary hover:border-primary transition-all shadow-sm"><span className="material-symbols-outlined">content_copy</span></button>
                           </div>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest block px-1">Entity ID (Audience URI)</label>
                           <div className="flex gap-4">
                              <code className="flex-1 bg-white border border-navy-100 text-navy-700 px-6 py-4 rounded-2xl text-[10px] font-black font-mono shadow-sm truncate">urn:amazon:cognito:sp:us-east-1_Ty84jL</code>
                              <button className="p-4 bg-white border border-navy-100 rounded-2xl text-navy-300 hover:text-primary hover:border-primary transition-all shadow-sm"><span className="material-symbols-outlined">content_copy</span></button>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="p-10 border-t border-navy-50 bg-navy-50/10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                  <button className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-red-50 px-6 py-3 rounded-2xl transition-all">
                     <span className="material-symbols-outlined text-lg">delete_forever</span> Purge Trust Configuration
                  </button>
                  <div className="flex gap-4 w-full md:w-auto">
                     <button className="flex-1 md:flex-none px-8 py-4 rounded-2xl border-2 border-navy-100 bg-white text-navy-700 text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 transition-all flex items-center justify-center gap-3">
                        <span className="material-symbols-outlined text-lg">bolt</span> Test Handshake
                     </button>
                     <button className="flex-1 md:flex-none px-12 py-4 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 transition-all">Save Profile Changes</button>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-[3.5rem] border border-navy-100 p-10 shadow-sm space-y-8 group hover:shadow-xl transition-all">
               <div className="flex justify-between items-center px-2">
                  <h3 className="text-xl font-black text-navy-950 uppercase tracking-tighter">Active Attribute Mapping</h3>
                  <button className="text-[10px] font-black text-primary uppercase tracking-widest underline decoration-2 underline-offset-4">Edit Logic</button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-navy-50/50 text-[9px] font-black text-navy-400 uppercase tracking-widest">
                           <th className="px-8 py-4 rounded-l-2xl">Identity Attribute (IdP)</th>
                           <th className="px-8 py-4">Deltablue System Field</th>
                           <th className="px-8 py-4 rounded-r-2xl">Logic Type</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-navy-50">
                        {[
                          { idp: 'user.email', sys: 'email_address', type: 'String' },
                          { idp: 'user.firstName', sys: 'first_name', type: 'String' },
                          { idp: 'user.groups', sys: 'personnel_roles', type: 'Array', chip: true },
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
          </main>
        </div>
      </div>
    </div>
  );
};

export default SSOSettings;
