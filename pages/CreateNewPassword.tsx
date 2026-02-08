
import React, { useState } from 'react';

interface CreateNewPasswordProps {
  onResetComplete: () => void;
  onBackToLogin: () => void;
}

const CreateNewPassword: React.FC<CreateNewPasswordProps> = ({ onResetComplete, onBackToLogin }) => {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="bg-navy-50 font-sans text-navy-950 min-h-screen flex flex-col antialiased">
      {/* Top Navigation Bar */}
      <header className="w-full bg-white border-b border-navy-100 px-10 py-6">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 select-none cursor-pointer" onClick={onBackToLogin}>
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
              <span className="material-symbols-outlined text-white text-2xl font-black">airlines</span>
            </div>
            <h2 className="text-navy-950 text-xl font-black tracking-tighter uppercase">Deltablue Jet Air</h2>
          </div>
          <button onClick={onBackToLogin} className="text-[10px] font-black uppercase tracking-widest text-navy-400 hover:text-primary transition-all">Support</button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-[520px] bg-white rounded-[4rem] shadow-2xl border border-navy-100 overflow-hidden relative animate-in fade-in slide-in-from-bottom duration-500">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-blue-400 to-primary shadow-sm"></div>
          
          <div className="px-12 py-16 flex flex-col gap-10">
            <div className="text-center flex flex-col gap-4">
              <div className="mx-auto bg-primary/5 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-4 shadow-inner">
                <span className="material-symbols-outlined text-5xl font-black text-primary">security</span>
              </div>
              <h1 className="text-navy-950 tracking-tighter text-4xl font-black uppercase">Create New Password</h1>
              <p className="text-navy-400 text-sm font-bold uppercase tracking-widest italic opacity-70 px-4">
                Establish your new master key for Deltablue network access.
              </p>
            </div>

            <form className="flex flex-col gap-8" onSubmit={(e) => { e.preventDefault(); onResetComplete(); }}>
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  <label className="text-navy-400 text-[10px] font-black uppercase tracking-widest px-1">New Password</label>
                  <div className="relative group">
                    <input 
                      required
                      type={showPass ? 'text' : 'password'}
                      className="w-full h-16 px-8 pr-16 bg-navy-50 border-none rounded-[1.5rem] text-navy-950 font-black text-sm focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" 
                      placeholder="••••••••" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-navy-300 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">{showPass ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                {/* Strength Meter */}
                <div className="space-y-2 px-1">
                   <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                      <span className="text-navy-300">Entropy Level</span>
                      <span className="text-amber-500">Medium</span>
                   </div>
                   <div className="flex gap-2 h-1.5 w-full">
                      <div className="flex-1 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                      <div className="flex-1 bg-amber-500 rounded-full"></div>
                      <div className="flex-1 bg-navy-50 rounded-full"></div>
                      <div className="flex-1 bg-navy-50 rounded-full"></div>
                   </div>
                </div>
              </div>

              {/* Requirements List */}
              <div className="bg-navy-50/50 rounded-[2rem] p-8 border border-navy-50 shadow-inner space-y-4">
                 <p className="text-[9px] font-black uppercase tracking-widest text-navy-300 border-b border-navy-50 pb-3">Validation Logic</p>
                 <ul className="space-y-3">
                    {[
                      { label: 'At least 8 characters', valid: true },
                      { label: 'Contains a numeric digit', valid: true },
                      { label: 'Contains special symbol', valid: false },
                    ].map((req, i) => (
                      <li key={i} className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-widest ${req.valid ? 'text-emerald-500' : 'text-navy-300'}`}>
                        <span className="material-symbols-outlined text-sm font-black">{req.valid ? 'check_circle' : 'radio_button_unchecked'}</span>
                        {req.label}
                      </li>
                    ))}
                 </ul>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-navy-400 text-[10px] font-black uppercase tracking-widest px-1">Confirm Identity Key</label>
                <div className="relative group">
                  <input 
                    required
                    type="password" 
                    className="w-full h-16 px-8 bg-navy-50 border-none rounded-[1.5rem] text-navy-950 font-black text-sm focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" 
                    placeholder="••••••••" 
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-navy-100">lock</span>
                </div>
              </div>

              <button className="w-full h-16 bg-primary hover:bg-primary-600 text-white text-sm font-black uppercase tracking-[0.25em] rounded-[1.5rem] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3">
                Set New Master Password <span className="material-symbols-outlined">arrow_forward</span>
              </button>

              <button 
                type="button"
                onClick={onBackToLogin}
                className="text-[10px] font-black text-navy-300 uppercase tracking-widest hover:text-navy-900 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span> Return to Login
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateNewPassword;
