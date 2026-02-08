
import React from 'react';
import { Page } from '../types';

interface AccountSettingsProps {
  onNavigate: (page: Page) => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-navy-50 font-sans text-navy-950 pb-32 overflow-x-hidden">
      
      {/* Traveler Hero Section */}
      <section className="relative h-[45vh] min-h-[400px] bg-navy-950 flex flex-col justify-end p-8 md:p-20 overflow-hidden rounded-b-[4rem] md:rounded-b-[6rem]">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-900/60 to-transparent z-10"></div>
          <div 
            className="w-full h-full bg-cover bg-center opacity-40 animate-slow-zoom scale-110" 
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&q=80')" }} 
          />
          {/* Animated Mesh Gradient Overlay */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,#137fec_0%,transparent_50%)] animate-pulse"></div>
        </div>

        <div className="relative z-20 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-end justify-between gap-12">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-10">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/30 rounded-[3.5rem] blur-2xl group-hover:bg-primary/50 transition-all"></div>
              <div className="relative size-32 md:size-44 rounded-[3.5rem] bg-cover bg-center border-4 border-white shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500 ring-8 ring-white/5" style={{ backgroundImage: 'url(https://picsum.photos/400/400)' }} />
              <button className="absolute bottom-2 right-2 size-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-primary hover:scale-110 transition-all border border-navy-50">
                 <span className="material-symbols-outlined font-black">edit_square</span>
              </button>
            </div>
            
            <div className="text-center md:text-left space-y-3">
              <div className="flex items-center justify-center md:justify-start gap-4">
                 <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none">Marcus Chen</h1>
                 <span className="hidden sm:block size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-[10px] font-black text-white/50 uppercase tracking-[0.4em]">
                 <span className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">qr_code</span> Traveler ID: #DB-88421</span>
                 <span className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">location_on</span> Hub: New York (JFK)</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] w-full lg:w-96 shadow-2xl space-y-6">
             <div className="flex justify-between items-center text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Tier Status</p>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Diamond Platinum</span>
             </div>
             <div className="space-y-3">
                <div className="flex justify-between items-end">
                   <p className="text-3xl font-black text-white tracking-tighter">84,392 <span className="text-[10px] opacity-40">SkyPoints</span></p>
                   <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Next Tier: Black Diamond</p>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex ring-1 ring-white/10 shadow-inner">
                   <div className="bg-primary w-[75%] h-full shadow-[0_0_15px_rgba(19,127,236,0.6)]"></div>
                </div>
             </div>
             <button className="w-full py-4 bg-white text-navy-950 font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl hover:bg-primary hover:text-white transition-all shadow-xl">View Member Rewards</button>
          </div>
        </div>
      </section>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 xl:grid-cols-12 gap-12">
        
        {/* Quick Navigation Sidebar */}
        <aside className="xl:col-span-3 space-y-8">
           <div className="bg-white rounded-[3rem] border border-navy-100 p-8 shadow-sm space-y-10">
              <nav className="flex flex-col gap-2">
                 {[
                   { label: 'Traveler Profile', icon: 'person', active: true },
                   { label: 'Upcoming Journeys', icon: 'flight_takeoff', page: Page.BOOKINGS },
                   { label: 'Digital Wallet', icon: 'account_balance_wallet' },
                   { label: 'Dispatch Logic', icon: 'notifications_active', page: Page.NOTIFICATION_PREFS },
                   { label: 'Security Registry', icon: 'verified_user' },
                 ].map((link, i) => (
                    <button 
                      key={i} 
                      onClick={() => link.page && onNavigate(link.page)}
                      className={`flex items-center justify-between p-4 rounded-2xl transition-all group ${link.active ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-navy-400 hover:bg-navy-50'}`}
                    >
                       <div className="flex items-center gap-4">
                          <span className="material-symbols-outlined text-xl">{link.icon}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">{link.label}</span>
                       </div>
                       {link.active && <span className="material-symbols-outlined text-sm">chevron_right</span>}
                    </button>
                 ))}
              </nav>
           </div>

           <div className="bg-navy-50/50 p-8 rounded-[3rem] border border-navy-100 space-y-6 group">
              <div className="flex items-start gap-4">
                 <span className="material-symbols-outlined text-navy-300 font-black p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">help_outline</span>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-navy-950 uppercase tracking-widest">Support Portal</p>
                    <p className="text-[9px] font-bold text-navy-400 uppercase leading-relaxed tracking-wider opacity-70">
                       Direct access to Deltablue Executive Services for Diamond members.
                    </p>
                 </div>
              </div>
              <button className="w-full py-3 bg-white border border-navy-100 text-[10px] font-black uppercase tracking-widest text-navy-700 hover:text-primary hover:border-primary transition-all rounded-xl">Open Priority Link</button>
           </div>
        </aside>

        {/* Content Flow */}
        <div className="xl:col-span-9 space-y-12">
          
          {/* Next Adventure Card */}
          <section className="space-y-6">
             <h2 className="text-[10px] font-black text-navy-300 uppercase tracking-[0.4em] px-6">Upcoming Journey</h2>
             <div className="bg-white rounded-[4rem] border border-navy-100 shadow-2xl overflow-hidden relative group hover:shadow-primary/5 transition-all duration-700">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary shadow-[0_0_15px_rgba(19,127,236,0.6)]"></div>
                
                <div className="p-10 md:p-14 flex flex-col md:flex-row items-center gap-12">
                   <div className="flex flex-col items-center md:items-start space-y-1 min-w-[120px]">
                      <span className="text-5xl font-black text-navy-950 tracking-tighter">JFK</span>
                      <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">New York</p>
                   </div>
                   
                   <div className="flex-1 flex flex-col items-center px-4 relative">
                      <div className="w-full h-px bg-navy-100 relative mb-8">
                         <div className="absolute left-[45%] -top-5 bg-white p-3 rounded-full border border-navy-50 text-primary shadow-lg group-hover:rotate-45 transition-transform duration-1000">
                            <span className="material-symbols-outlined font-black text-2xl rotate-90">flight</span>
                         </div>
                      </div>
                      <div className="flex gap-4">
                         <span className="px-4 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100 animate-pulse">Confirmed Sequence</span>
                         <span className="px-4 py-1 rounded-full bg-navy-50 text-navy-400 text-[8px] font-black uppercase tracking-widest border border-navy-100">Nov 12, 2024</span>
                      </div>
                   </div>

                   <div className="flex flex-col items-center md:items-end space-y-1 min-w-[120px]">
                      <span className="text-5xl font-black text-navy-950 tracking-tighter">LHR</span>
                      <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">London</p>
                   </div>
                   
                   <div className="h-24 w-px bg-navy-50 hidden md:block mx-4" />

                   <div className="flex flex-col gap-4">
                      <button onClick={() => onNavigate(Page.BOOKING_DETAIL)} className="px-8 py-4 bg-navy-950 text-white font-black uppercase text-[10px] tracking-[0.25em] rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">
                         Manage <span className="material-symbols-outlined text-lg">settings</span>
                      </button>
                      <button className="px-8 py-4 bg-primary text-white font-black uppercase text-[10px] tracking-[0.25em] rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">Check-in Now</button>
                   </div>
                </div>
             </div>
          </section>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             
             {/* Traveler Identity */}
             <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all">
                <div className="p-10 border-b border-navy-50 bg-navy-50/20 flex justify-between items-center">
                   <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight flex items-center gap-4">
                      <span className="material-symbols-outlined text-primary font-black">badge</span> Identity Node
                   </h3>
                   <button className="size-10 rounded-2xl bg-white border border-navy-100 text-navy-400 hover:text-primary transition-all shadow-sm flex items-center justify-center"><span className="material-symbols-outlined text-lg">edit</span></button>
                </div>
                <div className="p-10 space-y-8">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-1">
                         <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Legal Given Name</p>
                         <p className="text-sm font-black text-navy-900 uppercase">Marcus</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Legal Surname</p>
                         <p className="text-sm font-black text-navy-900 uppercase">Chen</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Passport Sequence</p>
                         <p className="text-sm font-black text-navy-900 uppercase">A12****78</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Date of Registry</p>
                         <p className="text-sm font-black text-navy-900 uppercase">15 Jun 1985</p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Digital Wallet */}
             <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all">
                <div className="p-10 border-b border-navy-50 bg-navy-50/20 flex justify-between items-center">
                   <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight flex items-center gap-4">
                      <span className="material-symbols-outlined text-primary font-black">payments</span> Digital Wallet
                   </h3>
                   <button className="size-10 rounded-2xl bg-white border border-navy-100 text-navy-400 hover:text-primary transition-all shadow-sm flex items-center justify-center"><span className="material-symbols-outlined text-lg">add</span></button>
                </div>
                <div className="p-10 space-y-8">
                   <div className="bg-navy-950 rounded-3xl p-6 text-white relative overflow-hidden group/card cursor-pointer">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:scale-110 transition-transform">
                         <span className="material-symbols-outlined text-5xl">contactless</span>
                      </div>
                      <div className="space-y-6 relative z-10">
                         <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Master Logic</span>
                            <span className="text-xs font-black">VISA</span>
                         </div>
                         <p className="text-xl font-mono tracking-widest">**** **** **** 4421</p>
                         <div className="flex justify-between items-end">
                            <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Exp: 12/28</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Active Node</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Security & Access */}
             <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all">
                <div className="p-10 border-b border-navy-50 bg-navy-50/20">
                   <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight flex items-center gap-4">
                      <span className="material-symbols-outlined text-primary font-black">lock</span> Access Control
                   </h3>
                </div>
                <div className="p-10 space-y-6">
                   <button className="w-full flex items-center justify-between p-6 bg-navy-50/50 rounded-2xl border border-navy-50 hover:bg-white hover:border-primary transition-all group/btn">
                      <div className="flex items-center gap-4">
                         <span className="material-symbols-outlined text-navy-300 group-hover/btn:text-primary">shield_person</span>
                         <span className="text-[10px] font-black text-navy-700 uppercase tracking-widest">Update Master Key</span>
                      </div>
                      <span className="material-symbols-outlined text-navy-200">arrow_forward_ios</span>
                   </button>
                   <button className="w-full flex items-center justify-between p-6 bg-navy-50/50 rounded-2xl border border-navy-50 hover:bg-white hover:border-primary transition-all group/btn">
                      <div className="flex items-center gap-4">
                         <span className="material-symbols-outlined text-navy-300 group-hover/btn:text-primary">phonelink_lock</span>
                         <span className="text-[10px] font-black text-navy-700 uppercase tracking-widest">2FA Handshake Logic</span>
                      </div>
                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">Enabled</span>
                   </button>
                </div>
             </div>

             {/* Communication Hub */}
             <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all">
                <div className="p-10 border-b border-navy-50 bg-navy-50/20">
                   <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight flex items-center gap-4">
                      <span className="material-symbols-outlined text-primary font-black">campaign</span> Dispatch Protocol
                   </h3>
                </div>
                <div className="p-10 space-y-6">
                   <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest leading-relaxed px-2">Manage how the system node notifies you of operational shifts.</p>
                   <div className="space-y-3">
                      {[
                        { lbl: 'E-Mail Dispatch', active: true },
                        { lbl: 'SMS Telemetry', active: true },
                        { lbl: 'App Push Nodes', active: false }
                      ].map((n, i) => (
                        <div key={i} className="flex items-center justify-between px-2">
                           <span className="text-[10px] font-black text-navy-700 uppercase tracking-widest">{n.lbl}</span>
                           <div className="relative inline-flex items-center h-6 rounded-full w-12 transition-all">
                              <input checked={n.active} readOnly type="checkbox" className="sr-only peer" />
                              <div className="w-12 h-6 bg-navy-100 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-md"></div>
                           </div>
                        </div>
                      ))}
                   </div>
                   <button onClick={() => onNavigate(Page.NOTIFICATION_PREFS)} className="w-full py-4 mt-2 text-[10px] font-black text-primary uppercase underline tracking-widest">Global Comms Terminal</button>
                </div>
             </div>

          </div>

          {/* Sticky Global Actions */}
          <div className="sticky bottom-10 z-40 w-full pt-10">
             <div className="bg-white/80 backdrop-blur-3xl border border-navy-100 p-8 rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] flex flex-col sm:flex-row items-center justify-between gap-8 animate-in slide-in-from-bottom duration-1000">
                <div className="flex items-center gap-4">
                   <div className="size-3 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(19,127,236,0.6)]"></div>
                   <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Session Integrity: Validated Node-NYC-01</p>
                </div>
                <div className="flex items-center gap-6 w-full sm:w-auto">
                   <button className="flex-1 sm:flex-none px-12 py-5 bg-navy-950 text-white font-black uppercase text-[10px] tracking-[0.25em] rounded-[1.5rem] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4">
                      Commit Sequence Changes <span className="material-symbols-outlined text-lg">save</span>
                   </button>
                </div>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AccountSettings;
