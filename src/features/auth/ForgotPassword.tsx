
import React, { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../config/routes';
import { BRAND } from '../../config/brand';

const ForgotPassword: React.FC = () => {
  const { sendReset } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await sendReset(email);
      setSent(true);
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/user-not-found') {
        // Don't reveal if account exists — show success anyway
        setSent(true);
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-navy-50 font-sans text-navy-950 min-h-screen flex flex-col antialiased">
      {/* Top Navigation Bar */}
      <header className="w-full bg-white border-b border-navy-100 px-10 py-6">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <Link to={ROUTES.HOME} className="flex items-center gap-4 select-none cursor-pointer">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
              <span className="material-symbols-outlined text-white text-2xl font-black">airlines</span>
            </div>
            <h2 className="text-navy-950 text-xl font-black tracking-tighter uppercase">{BRAND.name}</h2>
          </Link>
          <Link
            to={ROUTES.LOGIN}
            className="hidden sm:flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-navy-400 hover:text-primary transition-all"
          >
            <span className="material-symbols-outlined text-xl">login</span> Sign In
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-[520px] bg-white rounded-[4rem] shadow-2xl border border-navy-100 overflow-hidden relative animate-in fade-in zoom-in duration-500">
          {/* Decorative top accent */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-blue-400 to-primary shadow-sm"></div>

          <div className="px-12 py-16 flex flex-col gap-10">
            {/* Headline & Body Text */}
            <div className="text-center flex flex-col gap-4">
              <div className="mx-auto bg-primary/5 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-4 shadow-inner">
                <span className="material-symbols-outlined text-5xl font-black text-primary">
                  {sent ? 'mark_email_read' : 'lock_reset'}
                </span>
              </div>
              <h1 className="text-navy-950 tracking-tighter text-4xl font-black uppercase">
                {sent ? 'Check Your Email' : 'Reset Password'}
              </h1>
              <p className="text-navy-400 text-sm font-bold uppercase tracking-widest italic opacity-70 px-4 leading-relaxed">
                {sent
                  ? `If an account exists for ${email}, a reset link has been sent. Check your inbox and spam folder.`
                  : `Enter your ${BRAND.shortName} personnel ID or registered email to initiate the master key reset.`
                }
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4 animate-in fade-in duration-300">
                <span className="material-symbols-outlined text-red-500 text-xl">error</span>
                <p className="text-xs font-bold text-red-700 uppercase tracking-wider">{error}</p>
              </div>
            )}

            {!sent ? (
              <>
                {/* Form Section */}
                <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-3">
                    <span className="text-navy-400 text-[10px] font-black uppercase tracking-widest ml-1">Enter your registered email</span>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-navy-300 group-focus-within:text-primary transition-colors">
                        <span className="material-symbols-outlined">mail</span>
                      </div>
                      <input
                        required
                        type="email"
                        className="form-input flex w-full rounded-[1.5rem] text-navy-950 border-none bg-navy-50 h-16 placeholder:text-navy-200 pl-14 pr-6 text-sm font-black uppercase tracking-widest focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
                        placeholder={`E.G. ${BRAND.placeholderEmail}`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-16 bg-primary hover:bg-primary-600 text-white text-sm font-black uppercase tracking-[0.25em] rounded-[1.5rem] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>Send Reset Link <span className="material-symbols-outlined">send</span></>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <Link
                to={ROUTES.LOGIN}
                className="w-full h-16 bg-primary text-white text-sm font-black uppercase tracking-[0.25em] rounded-[1.5rem] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Return to Login <span className="material-symbols-outlined">login</span>
              </Link>
            )}

            {/* Footer Link */}
            <div className="flex items-center justify-center">
              <Link
                to={ROUTES.LOGIN}
                className="group flex items-center gap-3 text-[10px] font-black text-navy-400 uppercase tracking-widest hover:text-primary transition-all"
              >
                <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-2">arrow_back</span>
                Return to Login
              </Link>
            </div>
          </div>

          {/* Bottom support area */}
          <div className="bg-navy-50/50 px-12 py-8 border-t border-navy-100 text-center">
            <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest">
              Station Access Issue? <button className="text-primary hover:underline ml-2">Contact Ops Support</button>
            </p>
          </div>
        </div>

        <p className="mt-12 text-center text-[9px] font-black text-navy-200 uppercase tracking-[0.4em] opacity-50">
          {BRAND.copyright} Operations. Secure Link Terminal V4.2
        </p>
      </main>
    </div>
  );
};

export default ForgotPassword;
