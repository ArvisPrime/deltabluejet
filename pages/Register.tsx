
import React from 'react';

interface RegisterProps {
  onRegister: () => void;
  onGoToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onGoToLogin }) => {
  return (
    <div className="flex min-h-screen w-full font-sans text-navy-950 bg-white">
      {/* Left Side: Hero Image */}
      <div className="hidden lg:flex w-1/2 relative bg-navy-900 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] scale-110" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuALO6V4esqoBr4OpQ653wGJtuM524dSB0-XlcJH-ubpefREbX5MNGfeHo1be4WCknHdpqEEcjljZdox24WoJfYV-1ZSffw1tHu0zG3murm9WnvK2Cw5iyiBoItPkZoBC07ulmSXhXGIPogKQED3UUnvpO20hALA1_ZsiCBnU9xX1PT1eyJU2LTZCEUzCVyxdv0iwOfPKxEW_PN1tP21Ykd75WX0NY_kJrUbjo8j1tf0UhceibcWQtFdQ0DDNnkfdmJte4_DQGIHYo8')" }} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-900/20 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col h-full justify-between p-16 text-white">
          <div className="flex items-center gap-4 group cursor-default">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20 transition-transform group-hover:scale-110">
              <span className="material-symbols-outlined text-white text-2xl font-black">airlines</span>
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase">Deltablue Jet Air</span>
          </div>

          <div className="max-w-xl space-y-10">
            <blockquote className="text-5xl font-black leading-tight tracking-tighter uppercase italic opacity-90 drop-shadow-lg">
              "The journey of a thousand miles begins with a single step. Join us and explore the world."
            </blockquote>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Personnel Command Center • Registry Segment 04</p>
          </div>

          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">© 2024 Deltablue Jet Air. Security Cleared Personnel Only.</p>
        </div>
      </div>

      {/* Right Side: Registration Form */}
      <div className="flex flex-1 flex-col justify-center items-center overflow-y-auto w-full lg:w-1/2 p-8 lg:p-12 relative">
        {/* Mobile Header Logo */}
        <div className="lg:hidden absolute top-10 left-10 flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-xl font-black">airlines</span>
          </div>
          <span className="font-black text-xl tracking-tighter text-navy-950 uppercase">Deltablue</span>
        </div>

        <div className="w-full max-w-[520px] flex flex-col gap-12 animate-in fade-in slide-in-from-left duration-700">
          <div className="space-y-3 text-center lg:text-left">
            <h1 className="text-4xl font-black tracking-tighter uppercase text-navy-950">Welcome Aboard</h1>
            <p className="text-navy-400 text-sm font-bold uppercase tracking-widest italic">Request personnel credentials for Deltablue Ops.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['Google', 'Apple'].map(prov => (
              <button key={prov} className="flex items-center justify-center gap-3 h-14 rounded-2xl border-2 border-navy-50 hover:border-primary hover:bg-primary/5 transition-all group">
                <span className="material-symbols-outlined text-navy-300 group-hover:text-primary font-black">{prov === 'Google' ? 'workspaces' : 'ios'}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-navy-700 group-hover:text-navy-950">{prov} ID</span>
              </button>
            ))}
          </div>

          <div className="relative flex items-center">
            <div className="grow border-t border-navy-50"></div>
            <span className="mx-6 shrink-0 text-[10px] font-black text-navy-300 uppercase tracking-widest">Or Internal Registry</span>
            <div className="grow border-t border-navy-50"></div>
          </div>

          <form className="flex flex-col gap-8" onSubmit={(e) => { e.preventDefault(); onRegister(); }}>
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest px-1">Legal Full Name</label>
              <input required className="w-full h-14 rounded-2xl border-none bg-navy-50 px-6 font-black text-navy-950 uppercase tracking-widest text-sm focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" placeholder="E.G. JOHN A. DOE" type="text" />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest px-1">Personnel Email</label>
              <input required className="w-full h-14 rounded-2xl border-none bg-navy-50 px-6 font-black text-navy-950 uppercase tracking-widest text-sm focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" placeholder="E.G. DOE.J@DELTABLUE.COM" type="email" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest px-1">Master Password</label>
                <input required className="w-full h-14 rounded-2xl border-none bg-navy-50 px-6 font-black text-navy-950 text-sm focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" placeholder="••••••••" type="password" />
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest px-1">Verify Password</label>
                <input required className="w-full h-14 rounded-2xl border-none bg-navy-50 px-6 font-black text-navy-950 text-sm focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" placeholder="••••••••" type="password" />
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-navy-50/50 rounded-[2rem] border border-navy-50 shadow-inner group">
              <div className="flex items-center pt-1">
                <input required id="terms" type="checkbox" className="h-6 w-6 rounded-lg border-2 border-navy-100 text-primary focus:ring-primary transition-all" />
              </div>
              <label className="text-[10px] font-bold text-navy-500 uppercase leading-relaxed tracking-widest cursor-pointer select-none" htmlFor="terms">
                I acknowledge the <a className="text-primary font-black underline underline-offset-4 decoration-2" href="#">Operational Policies</a> and <a className="text-primary font-black underline underline-offset-4 decoration-2" href="#">Staff Conduct Registry</a> of Deltablue Jet Air.
              </label>
            </div>

            <button className="w-full h-16 rounded-[1.5rem] bg-primary text-white font-black uppercase tracking-[0.25em] text-sm shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
              Initialise Credentials <span className="material-symbols-outlined">how_to_reg</span>
            </button>
          </form>

          <div className="text-center text-[10px] font-black text-navy-400 uppercase tracking-widest pb-12">
            Already verified? 
            <button onClick={onGoToLogin} className="text-primary font-black ml-2 hover:underline decoration-2 underline-offset-4">Personnel Login</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
