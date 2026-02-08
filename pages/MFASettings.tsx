
import React from 'react';

const MFASettings: React.FC = () => {
  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-24">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 border-b border-navy-100 pb-10">
        <div className="space-y-4 max-w-3xl">
          <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-navy-300">
            <span>Security</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary">MFA Configuration</span>
          </nav>
          <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">Multi-Factor Authentication</h1>
          <p className="text-navy-500 font-medium italic text-xl leading-relaxed uppercase tracking-wider">Configure system-wide authentication policies, manage verification methods, and oversee user enrollment status.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-navy-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:bg-navy-50 shadow-sm transition-all">
            <span className="material-symbols-outlined text-xl">history</span> View Audit Logs
          </button>
          <button className="flex items-center gap-3 px-10 py-4 bg-primary text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-xl">save</span> Save Changes
          </button>
        </div>
      </div>

      {/* Global Status Banner */}
      <div className="bg-white rounded-[3rem] border border-navy-100 p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10 group hover:shadow-md transition-all">
        <div className="flex items-start gap-8">
          <div className="p-6 bg-emerald-50 text-emerald-600 rounded-[2rem] shadow-inner">
            <span className="material-symbols-outlined text-4xl font-black">verified_user</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-navy-950 uppercase tracking-tighter">MFA is currently Enabled</h2>
            <p className="text-sm text-navy-500 font-bold uppercase tracking-widest opacity-70">Active for 85% of users. Enforce globally to secure all administrative accounts.</p>
          </div>
        </div>
        <div className="flex items-center gap-8 bg-navy-50 p-6 rounded-[2.5rem] shadow-inner border border-navy-100">
           <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Global Enforce</span>
           <div className="relative inline-flex items-center h-8 rounded-full w-16 transition-all shadow-md">
             <input checked readOnly type="checkbox" className="sr-only peer" />
             <div className="w-16 h-8 bg-navy-200 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-lg"></div>
           </div>
        </div>
      </div>

      {/* Allowed Methods Grid */}
      <div className="space-y-8">
        <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight flex items-center gap-4">
           <span className="material-symbols-outlined text-primary p-2 bg-primary/5 rounded-2xl shadow-inner font-black">lock_open</span>
           Allowed Verification Methods
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { id: 1, icon: 'smartphone', label: 'Authenticator App', desc: 'TOTP via Google Auth, Authy, or Microsoft.', active: true },
            { id: 2, icon: 'sms', label: 'SMS Verification', desc: 'One-time codes sent via text message.', active: true },
            { id: 3, icon: 'mail', label: 'Email OTP', desc: 'Codes sent to corporate email accounts.', active: false },
            { id: 4, icon: 'security_key', label: 'FIDO2 / WebAuthn', desc: 'Hardware keys or biometric sensors.', active: true },
          ].map((m) => (
            <div key={m.id} className={`bg-white rounded-[3rem] border-2 p-10 space-y-8 transition-all hover:shadow-2xl relative overflow-hidden group ${m.active ? 'border-primary shadow-sm' : 'border-navy-50'}`}>
               <div className="flex justify-between items-start">
                  <div className={`p-4 rounded-2xl ${m.active ? 'bg-primary/5 text-primary' : 'bg-navy-50 text-navy-300'} shadow-inner group-hover:scale-110 transition-transform`}>
                     <span className="material-symbols-outlined text-3xl font-black">{m.icon}</span>
                  </div>
                  <div className="relative inline-flex items-center h-6 rounded-full w-12 transition-all">
                     <input checked={m.active} readOnly type="checkbox" className="sr-only peer" />
                     <div className="w-12 h-6 bg-navy-100 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </div>
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
                 Enforcement Policies
              </h3>
           </div>
           <div className="p-12 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                 <div className="space-y-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Mandatory Roles</label>
                       <div className="flex flex-wrap gap-3 p-4 bg-navy-50/50 rounded-[2rem] border border-navy-50 shadow-inner">
                          {['Super Admin', 'Ops Manager', 'Dispatcher'].map(role => (
                            <span key={role} className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-navy-100 text-[10px] font-black uppercase text-navy-900 shadow-sm">
                               {role} <span className="material-symbols-outlined text-navy-200 text-sm cursor-pointer hover:text-red-500">close</span>
                            </span>
                          ))}
                          <button className="px-4 py-2 border-2 border-dashed border-navy-200 rounded-xl text-[10px] font-black text-navy-300 uppercase hover:border-primary hover:text-primary transition-all">Add Role</button>
                       </div>
                    </div>
                    <p className="text-[10px] font-bold text-navy-400 uppercase italic leading-relaxed tracking-wider opacity-60 px-1">These selected roles will be strictly forced to setup and verify MFA on their next login session.</p>
                 </div>

                 <div className="space-y-10">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Grace Period & Session</label>
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest ml-1">Period (Days)</p>
                             <input type="number" defaultValue="7" className="w-full h-14 px-6 bg-navy-50 border-none rounded-2xl text-sm font-black text-navy-950 focus:ring-2 focus:ring-primary/20 shadow-inner" />
                          </div>
                          <div className="space-y-2">
                             <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest ml-1">Trust Freq.</p>
                             <select className="w-full h-14 px-6 bg-navy-50 border-none rounded-2xl text-xs font-black text-navy-950 uppercase appearance-none shadow-inner">
                                <option>30 Days</option>
                                <option>Every Login</option>
                             </select>
                          </div>
                       </div>
                    </div>
                    <label className="flex items-center gap-4 cursor-pointer group bg-navy-50/50 p-6 rounded-3xl border border-navy-50 shadow-inner hover:bg-white transition-all">
                       <div className="relative flex items-center group/check">
                          <input type="checkbox" className="peer h-6 w-6 appearance-none rounded-lg border-2 border-navy-200 checked:bg-primary checked:border-primary transition-all shadow-sm" />
                          <span className="material-symbols-outlined text-white text-sm absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 peer-checked:opacity-100 font-black">check</span>
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
              <h3 className="text-xl font-black uppercase tracking-[0.25em]">Security Health</h3>
              <p className="text-indigo-200 text-sm font-bold uppercase tracking-widest leading-relaxed opacity-60">Overall adoption rate across all DeltaBlue personnel units.</p>
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
              <button className="w-full py-5 bg-white text-indigo-900 font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                 <span className="material-symbols-outlined">policy</span> Configure Compliance
              </button>
           </div>
        </div>
      </div>

      {/* Status Table Section */}
      <div className="bg-white rounded-[4rem] border border-navy-100 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-navy-50 bg-navy-50/20 flex flex-col md:flex-row gap-10 items-center justify-between">
           <h3 className="text-2xl font-black text-navy-950 uppercase tracking-tighter">User MFA Registry</h3>
           <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1 max-w-2xl">
              <div className="relative flex-1 group">
                 <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 group-focus-within:text-primary transition-all">search</span>
                 <input className="w-full h-14 pl-14 pr-6 bg-white border-2 border-navy-50 rounded-3xl text-sm font-black uppercase tracking-widest focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" placeholder="Scan by Name, ID or Role..." />
              </div>
              <button className="h-14 px-8 bg-white border-2 border-navy-50 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-navy-500 hover:text-primary transition-all">
                 <span className="material-symbols-outlined text-xl">filter_list</span> Filter
              </button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white text-[9px] font-black text-navy-300 uppercase tracking-[0.3em] border-b border-navy-50">
                <th className="px-12 py-10">Employee Profile</th>
                <th className="px-12 py-10">Duty Role</th>
                <th className="px-12 py-10">Status</th>
                <th className="px-12 py-10">Auth Profile</th>
                <th className="px-12 py-10">Last Sequence</th>
                <th className="px-12 py-10 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {[
                { name: 'Ethan Hunt', id: '882910', role: 'Captain', status: 'Enforced', color: 'bg-emerald-50 text-emerald-700', method: 'Authenticator App', avatar: 'https://i.pravatar.cc/150?u=ethan', time: '2m ago' },
                { name: 'Sarah Connor', id: '992100', role: 'Ground Ops', status: 'Optional', color: 'bg-amber-50 text-amber-700', method: 'SMS / Text', avatar: 'https://i.pravatar.cc/150?u=sarah', time: 'Yesterday' },
                { name: 'Michael Knight', id: '112093', role: 'Admin', status: 'Enforced', color: 'bg-emerald-50 text-emerald-700', method: 'FIDO2 Key', avatar: 'https://i.pravatar.cc/150?u=michael', time: '4h ago' },
                { name: 'Ellen Ripley', id: '449201', role: 'Dispatcher', status: 'Not Setup', color: 'bg-red-50 text-red-700', method: '--', avatar: 'https://i.pravatar.cc/150?u=ellen', time: 'Never', alert: true },
              ].map((u, i) => (
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
                     <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${u.color}`}>
                        <span className={`size-1.5 rounded-full ${u.status.includes('Enforce') ? 'bg-emerald-500' : u.status.includes('Setup') ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
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
                        {u.alert && <button className="px-4 py-2 bg-red-600 text-white text-[9px] font-black rounded-xl uppercase tracking-widest shadow-xl shadow-red-500/20">Force Enroll</button>}
                        <button className="p-2 text-navy-300 hover:text-primary transition-all"><span className="material-symbols-outlined">more_horiz</span></button>
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
