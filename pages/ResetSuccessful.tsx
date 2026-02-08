
import React from 'react';

interface ResetSuccessfulProps {
  onGoToLogin: () => void;
}

const ResetSuccessful: React.FC<ResetSuccessfulProps> = ({ onGoToLogin }) => {
  return (
    <div className="bg-navy-50 font-sans text-navy-950 min-h-screen flex flex-col antialiased">
      {/* Top Navigation Bar */}
      <header className="w-full bg-white border-b border-navy-100 px-10 py-6">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 select-none cursor-default">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
              <span className="material-symbols-outlined text-white text-2xl font-black">airlines</span>
            </div>
            <h2 className="text-navy-950 text-xl font-black tracking-tighter uppercase">Deltablue Jet Air</h2>
          </div>
          <button 
            onClick={onGoToLogin}
            className="px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-600 transition-all"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-[520px] space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
          
          <div className="bg-white rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-navy-100 overflow-hidden flex flex-col items-center text-center p-16 space-y-10">
            {/* Hero Icon */}
            <div className="relative group">
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-25"></div>
              <div className="relative bg-emerald-50 text-emerald-600 p-8 rounded-full flex items-center justify-center size-28 shadow-inner group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined !text-6xl font-black">check_circle</span>
              </div>
            </div>

            {/* Headline & Body */}
            <div className="space-y-4">
              <h1 className="text-3xl font-black text-navy-950 uppercase tracking-tighter">Reset Successful</h1>
              <p className="text-navy-400 text-sm font-bold uppercase tracking-widest italic leading-relaxed opacity-70">
                Your Deltablue master credentials have been updated. Your session is now secure and ready for station login.
              </p>
            </div>

            {/* CTA Button */}
            <button 
              onClick={onGoToLogin}
              className="w-full h-16 bg-navy-950 text-white text-sm font-black uppercase tracking-[0.25em] rounded-[1.5rem] shadow-2xl shadow-navy-950/20 hover:bg-black transition-all transform hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-4 group"
            >
              Access Personnel Console 
              <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-2">arrow_forward</span>
            </button>
          </div>

          {/* Security Alert Footer */}
          <div className="px-4">
            <div className="flex items-start gap-5 p-8 bg-blue-50/60 rounded-[2.5rem] border border-blue-100 shadow-inner group hover:bg-white transition-all">
              <div className="p-2 bg-white rounded-xl shadow-sm text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined font-black">security</span>
              </div>
              <p className="text-[10px] font-bold text-navy-500 uppercase leading-loose tracking-widest">
                System Log: A confirmation digest has been dispatched to your personnel terminal. If you did not authorise this credential reset, initiate <button className="text-primary font-black underline decoration-2 underline-offset-4">Emergency Hub Triage</button> immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Legal Footer */}
        <div className="mt-16 flex flex-col items-center gap-6">
           <div className="flex flex-wrap items-center justify-center gap-10 opacity-30">
              <a className="text-[9px] font-black text-navy-950 uppercase tracking-widest hover:text-primary transition-colors" href="#">System Registry</a>
              <a className="text-[9px] font-black text-navy-950 uppercase tracking-widest hover:text-primary transition-colors" href="#">Ops Protocols</a>
              <a className="text-[9px] font-black text-navy-950 uppercase tracking-widest hover:text-primary transition-colors" href="#">Triage Support</a>
           </div>
           <p className="text-[8px] font-black text-navy-200 uppercase tracking-[0.4em]">© 2024 Deltablue Jet Air Operations Hub</p>
        </div>
      </main>
    </div>
  );
};

export default ResetSuccessful;
