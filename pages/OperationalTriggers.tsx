
import React, { useState } from 'react';

const OperationalTriggers: React.FC = () => {
  const [activeRole, setActiveRole] = useState('Dispatcher');

  const roles = [
    { id: 'Admin', label: 'Administrator', sub: 'Full Access', icon: 'admin_panel_settings', count: 3 },
    { id: 'Dispatcher', label: 'Flight Dispatcher', sub: 'Ops Alert Control', icon: 'flight_takeoff', count: 12 },
    { id: 'Agent', label: 'Gate Agent', sub: 'Read-only Flow', icon: 'confirmation_number', count: 45 },
    { id: 'Maint', label: 'Maintenance', sub: 'Tech Ops Triage', icon: 'engineering', count: 8 },
    { id: 'Ground', label: 'Ground Ops', sub: 'Logistics Alerts', icon: 'local_shipping', count: 22 },
  ];

  return (
    <div className="h-full flex flex-col font-sans bg-navy-50/20">
      <div className="max-w-[1600px] mx-auto w-full p-10 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-navy-100 pb-10">
          <div className="max-w-2xl space-y-6">
             <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-navy-300">
                <span>Security</span>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-primary">Alert Roles & Permissions</span>
             </nav>
             <div className="space-y-4">
                <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">Access Control Matrix</h1>
                <p className="text-navy-500 font-medium italic text-xl leading-relaxed uppercase tracking-wider">Manage access levels and safety thresholds for the Operational Alert Management System.</p>
          </div>
          </div>
          <div className="flex gap-4">
             <button className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-navy-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:bg-navy-50 shadow-sm transition-all">
                <span className="material-symbols-outlined text-xl">history</span> Audit History
             </button>
             <button className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-xl">add</span> Create New Role
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start h-full pb-20">
          {/* Role Navigation */}
          <aside className="lg:col-span-3 flex flex-col gap-6 bg-white rounded-[3rem] border border-navy-100 p-8 shadow-sm h-full min-h-[600px]">
            <div className="flex items-center justify-between pb-4 border-b border-navy-50">
              <h2 className="text-[10px] font-black text-navy-300 uppercase tracking-[0.25em]">Registered Roles</h2>
              <span className="bg-navy-50 text-[10px] font-black px-3 py-1 rounded-full text-navy-400">5 ACTIVE</span>
            </div>
            <div className="flex flex-col gap-2">
              {roles.map((role) => (
                <button 
                  key={role.id}
                  onClick={() => setActiveRole(role.id)}
                  className={`flex items-center justify-between gap-4 p-5 rounded-[2rem] transition-all group relative overflow-hidden ${
                    activeRole === role.id ? 'bg-primary/5 border-2 border-primary/20 shadow-inner' : 'hover:bg-navy-50'
                  }`}
                >
                  {activeRole === role.id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>}
                  <div className="flex items-center gap-4">
                    <span className={`material-symbols-outlined text-2xl ${activeRole === role.id ? 'text-primary' : 'text-navy-300 group-hover:text-navy-950'}`}>{role.icon}</span>
                    <div className="text-left">
                      <p className={`text-sm font-black uppercase tracking-tight ${activeRole === role.id ? 'text-navy-950' : 'text-navy-500'}`}>{role.label}</p>
                      <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest opacity-60">{role.sub}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-black font-mono px-2 py-1 rounded-lg ${activeRole === role.id ? 'bg-primary text-white' : 'text-navy-200'}`}>{role.count}</span>
                </button>
              ))}
            </div>
            <div className="mt-auto pt-6 border-t border-navy-50">
               <button className="flex items-center gap-3 text-navy-400 font-black uppercase text-[10px] tracking-widest hover:text-primary transition-all w-full px-2">
                 <span className="material-symbols-outlined">group_add</span> Manage Global Groups
               </button>
            </div>
          </aside>

          {/* Permissions Workspace */}
          <main className="lg:col-span-9 space-y-10">
            <div className="bg-white rounded-[3.5rem] border border-navy-100 p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-sm">
               <div className="space-y-2">
                  <div className="flex items-center gap-4">
                     <h2 className="text-3xl font-black text-navy-950 uppercase tracking-tighter">Flight Dispatcher Profile</h2>
                     <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Active Permissions Set</span>
                  </div>
                  <p className="text-xs text-navy-400 font-bold uppercase tracking-widest italic opacity-60">Master audit performed on Oct 24, 2024 by System Admin</p>
               </div>
               <div className="flex items-center gap-4 bg-navy-50 p-1.5 rounded-[1.5rem] shadow-inner border border-navy-100">
                  <button className="px-8 py-3 rounded-2xl bg-white text-navy-950 text-[10px] font-black uppercase tracking-widest shadow-lg border border-navy-100">Matrix Matrix</button>
                  <button className="px-8 py-3 text-navy-400 text-[10px] font-black uppercase tracking-widest hover:text-navy-900 transition-all">Associated Users (12)</button>
               </div>
            </div>

            {/* Sections */}
            {[
              { title: 'Configuration Access', sub: 'Define logical triggers', icon: 'tune', color: 'text-primary', bg: 'bg-primary/5', 
                rows: [
                  { label: 'Create & Edit Alert Rules', desc: 'Allows defining new operational logic and threshold deltas.', active: true },
                  { label: 'Delete High-Critical Alerts', desc: 'Irreversible removal of safety-critical alert definitions.', active: false }
                ] 
              },
              { title: 'Notification Routing', sub: 'Delivery channel logic', icon: 'notifications_active', color: 'text-orange-600', bg: 'bg-orange-50',
                multi: true,
                rows: [
                  { label: 'Critical Severity Dispatch', desc: 'System-wide safety and security broadcast management.' },
                  { label: 'Warning Severity Dispatch', desc: 'Operational delay and asset availability monitoring.' }
                ]
              },
              { title: 'Operational Lifecycle', sub: 'Interactive triage control', icon: 'bolt', color: 'text-indigo-600', bg: 'bg-indigo-50',
                rows: [
                  { label: 'Acknowledge Active Alerts', desc: 'Flag incidents as "In-Progress" to global network.', active: true },
                  { label: 'Escalate to Hub Command', desc: 'Elevate incident profile to Tier 2 operational support.', active: true },
                  { label: 'Resolve & Global Archive', desc: 'Complete incident loop and write to master audit log.', active: false, lock: true }
                ]
              }
            ].map((section, si) => (
              <div key={si} className="bg-white rounded-[3.5rem] border border-navy-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="p-8 px-10 border-b border-navy-50 bg-navy-50/20 flex items-center gap-6">
                   <div className={`p-4 rounded-2xl ${section.bg} ${section.color} shadow-inner`}>
                      <span className="material-symbols-outlined text-2xl font-black">{section.icon}</span>
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight leading-none">{section.title}</h3>
                      <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-2 opacity-60">{section.sub}</p>
                   </div>
                </div>
                <div className="divide-y divide-navy-50">
                  {section.rows.map((row, ri) => (
                    <div key={ri} className="p-10 px-12 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:bg-navy-50/30 transition-all group">
                       <div className="max-w-xl space-y-2">
                          <p className="text-lg font-black text-navy-950 uppercase tracking-tighter group-hover:text-primary transition-colors">{row.label}</p>
                          <p className="text-sm text-navy-400 font-bold uppercase tracking-widest opacity-60 leading-relaxed">{row.desc}</p>
                       </div>
                       {section.multi ? (
                         <div className="flex gap-6">
                            {['In-App', 'SMS Blast', 'E-Mail'].map((lbl, li) => (
                              <label key={li} className="flex items-center gap-4 cursor-pointer">
                                 <div className="relative flex items-center group/check">
                                    <input type="checkbox" defaultChecked={li < 2} className="peer h-6 w-6 appearance-none rounded-lg border-2 border-navy-100 checked:bg-primary checked:border-primary transition-all shadow-sm" />
                                    <span className="material-symbols-outlined text-white text-sm absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-all font-black">check</span>
                                 </div>
                                 <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest group-hover:text-navy-900">{lbl}</span>
                              </label>
                            ))}
                         </div>
                       ) : (
                         <div className="flex items-center gap-6">
                            {row.lock && (
                               <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full border border-red-100 shadow-sm">
                                  <span className="material-symbols-outlined text-sm font-black">lock</span>
                                  <span className="text-[8px] font-black uppercase tracking-widest">Requires 2FA Override</span>
                               </div>
                            )}
                            <div className="relative inline-flex items-center h-8 rounded-full w-16 transition-all shadow-inner">
                               <input type="checkbox" defaultChecked={row.active} className="sr-only peer" />
                               <div className="w-16 h-8 bg-navy-50 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-lg"></div>
                            </div>
                         </div>
                       )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Global Sticky Footer */}
            <div className="sticky bottom-10 z-20 flex justify-center w-full pt-10">
               <div className="bg-navy-950/95 backdrop-blur-3xl border border-white/10 px-10 py-5 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] flex items-center gap-10 border-t border-white/20 animate-in slide-in-from-bottom duration-1000">
                  <div className="flex items-center gap-6 border-r border-white/10 pr-10">
                     <div className="size-3 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(19,127,236,0.8)]"></div>
                     <div className="space-y-0.5">
                        <p className="text-white font-black uppercase text-[10px] tracking-widest">Master Key Link</p>
                        <p className="text-white/40 font-black uppercase text-[8px] tracking-[0.25em]">Session Integrity: Valid</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-6">
                     <button className="px-8 py-3 bg-white/5 border border-white/10 text-white/50 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:text-white hover:bg-white/10 transition-all">Discard Local Changes</button>
                     <button className="px-12 py-4 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
                        <span className="material-symbols-outlined text-xl">save</span> Commit Logical Configuration
                     </button>
                  </div>
               </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default OperationalTriggers;
