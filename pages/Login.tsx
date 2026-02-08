
import React, { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
  onGoToRegister: () => void;
  onGoToForgot: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onGoToRegister, onGoToForgot }) => {
  const [step, setStep] = useState<'CREDENTIALS' | 'MFA'>('CREDENTIALS');
  const [showPass, setShowPass] = useState(false);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'CREDENTIALS') {
      setStep('MFA');
    } else {
      onLogin();
    }
  };

  return (
    <div className="flex min-h-screen w-full font-sans text-navy-950 bg-white overflow-hidden">
      {/* Left Side: Visual/Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-navy-900 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] scale-110 animate-slow-zoom opacity-40" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80')" }} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/40 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col justify-between p-20 w-full h-full text-white">
          <div className="flex items-center gap-4 group cursor-default">
            <div className="size-12 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 group-hover:scale-110 transition-transform ring-4 ring-white/10">
              <span className="material-symbols-outlined text-white text-3xl font-black">airlines</span>
            </div>
            <span className="text-3xl font-black tracking-tighter uppercase">Deltablue Jet Air</span>
          </div>

          <div className="space-y-8">
            <h1 className="text-7xl font-black leading-none tracking-tighter uppercase drop-shadow-2xl">
              Precision <br/> In Flight.
            </h1>
            <p className="text-xl text-navy-100 max-w-md font-medium leading-relaxed opacity-80 uppercase tracking-widest italic">
              Global operations command for elite aviation personnel.
            </p>
            <div className="flex items-center gap-6 pt-10 border-t border-white/10">
               <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                  <span className="material-symbols-outlined text-sm">lock</span> 256-BIT SSL
               </div>
               <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                  <span className="material-symbols-outlined text-sm">verified_user</span> IDENTITY VERIFIED
               </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
            <span className="material-symbols-outlined text-xl">public</span>
            <span>SYSTEM NODE: GLOBAL-SOUTH-04</span>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex flex-col relative bg-white overflow-y-auto">
        {/* Top Nav */}
        <div className="flex justify-end p-8 shrink-0">
          <div className="flex items-center gap-6">
            <a className="text-[10px] font-black uppercase tracking-widest text-navy-300 hover:text-primary transition-colors" href="#">IT Support</a>
            <span className="h-4 w-px bg-navy-50"></span>
            <p className="text-[10px] font-black uppercase tracking-widest text-navy-400">
              {step === 'CREDENTIALS' ? "New Personnel?" : "Wrong Account?"}
              <button onClick={step === 'CREDENTIALS' ? onGoToRegister : () => setStep('CREDENTIALS')} className="text-primary hover:underline ml-2">
                {step === 'CREDENTIALS' ? "Initialise Access" : "Switch Node"}
              </button>
            </p>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 flex flex-col justify-center px-10 sm:px-20 md:px-32 xl:px-44 py-12">
          <div className="w-full max-w-md mx-auto space-y-12">
            
            {step === 'CREDENTIALS' ? (
              <div className="space-y-12 animate-in fade-in slide-in-from-right duration-700">
                <div className="space-y-4">
                   <div className="flex items-center gap-3 mb-2 lg:hidden">
                      <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white"><span className="material-symbols-outlined text-xl font-black">airlines</span></div>
                      <span className="font-black text-xl tracking-tighter uppercase text-navy-950">Deltablue</span>
                   </div>
                   <h2 className="text-5xl font-black tracking-tighter uppercase text-navy-950">Authorized Access</h2>
                   <p className="text-navy-400 text-sm font-bold uppercase tracking-widest italic leading-relaxed opacity-80">Please enter your administrative credentials to continue to the operations console.</p>
                </div>

                <form className="space-y-8" onSubmit={handleNextStep}>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Personnel Identifier</label>
                    <div className="relative group">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-navy-200 group-focus-within:text-primary transition-colors">badge</span>
                      <input 
                        required
                        className="w-full h-16 pl-14 pr-6 bg-navy-50 border-none rounded-[1.75rem] text-sm font-black text-navy-950 uppercase tracking-widest focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" 
                        placeholder="E.G. ADMIN.CHEN@DELTABLUE.COM" 
                        type="email" 
                        defaultValue="admin@deltablue.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Security Key</label>
                      <button type="button" onClick={onGoToForgot} className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest decoration-2 underline-offset-4">Forgot Key?</button>
                    </div>
                    <div className="relative group">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-navy-200 group-focus-within:text-primary transition-colors">lock</span>
                      <input 
                        required
                        className="w-full h-16 pl-14 pr-16 bg-navy-50 border-none rounded-[1.75rem] text-sm font-black text-navy-950 tracking-widest focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" 
                        placeholder="••••••••••••" 
                        type={showPass ? 'text' : 'password'}
                        defaultValue="password123"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-navy-200 hover:text-primary transition-colors"
                      >
                         <span className="material-symbols-outlined text-xl">{showPass ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 flex gap-4 items-start shadow-inner group">
                     <span className="material-symbols-outlined text-primary text-xl font-black group-hover:rotate-12 transition-transform">shield</span>
                     <p className="text-[9px] font-bold text-blue-900 uppercase leading-relaxed tracking-wider italic opacity-70">Log entry notice: All login attempts are monitored and logged. Unauthorized access is a violation of Deltablue corporate safety protocols.</p>
                  </div>

                  <button className="w-full h-16 bg-primary text-white font-black uppercase tracking-[0.25em] text-xs rounded-[1.75rem] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4">
                    Identify & Proceed <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-12 animate-in fade-in zoom-in duration-500">
                <div className="space-y-4">
                   <h2 className="text-5xl font-black tracking-tighter uppercase text-navy-950">Identity Verification</h2>
                   <p className="text-navy-400 text-sm font-bold uppercase tracking-widest italic opacity-80">MFA Required. Please enter the operational sequence from your authentication terminal.</p>
                </div>

                <div className="bg-white p-10 rounded-[3.5rem] border-2 border-primary shadow-2xl space-y-10 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1.5 h-full bg-primary shadow-[0_0_15px_rgba(19,127,236,0.8)]"></div>
                   
                   <div className="flex items-center gap-6">
                      <div className="size-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                         <span className="material-symbols-outlined text-3xl font-black animate-pulse">phonelink_lock</span>
                      </div>
                      <div>
                         <p className="text-sm font-black text-navy-950 uppercase tracking-tight">Two-Factor Authenticator</p>
                         <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest opacity-60">System Registry Hub Protocol</p>
                      </div>
                   </div>

                   <form className="space-y-8" onSubmit={handleNextStep}>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-2">Verification Code</label>
                         <div className="relative group">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-navy-200 material-symbols-outlined font-black group-focus-within:text-primary transition-colors">pin</span>
                            <input 
                              autoFocus
                              maxLength={6}
                              className="w-full h-16 pl-16 pr-8 bg-navy-50 border-none rounded-[1.75rem] text-2xl font-black font-mono tracking-[0.5em] text-navy-950 focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" 
                              placeholder="000000" 
                              type="text" 
                            />
                         </div>
                      </div>

                      <div className="flex items-center justify-between px-2 pt-2">
                         <button type="button" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">sms</span> SMS Dispatch
                         </button>
                         <button type="button" className="text-[10px] font-black text-navy-300 uppercase tracking-widest hover:text-navy-950 transition-colors">Secondary Method</button>
                      </div>

                      <button className="w-full h-16 bg-navy-950 text-white font-black uppercase tracking-[0.25em] text-xs rounded-2xl shadow-xl shadow-navy-950/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4">
                         Verify & Sign In <span className="material-symbols-outlined text-xl">verified</span>
                      </button>
                   </form>
                </div>
              </div>
            )}

            <div className="pt-12 border-t border-navy-100 flex flex-col items-center gap-6 opacity-30">
               <div className="flex items-center gap-10">
                  <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
                     <span className="material-symbols-outlined text-sm">dns</span> HUB: NYC-01
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
                     <span className="material-symbols-outlined text-sm">update</span> v2.5.0-B904
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 text-center xl:px-44 pb-12 opacity-40">
          <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest leading-loose">
            © 2024 Deltablue Jet Air Operations Hub. Security Cleared Personnel Only. <br className="sm:hidden" />
            <a className="hover:text-primary hover:underline mx-4 transition-colors" href="#">Operational Registry</a>
            <a className="hover:text-primary hover:underline mx-4 transition-colors" href="#">Privacy Protocol</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
