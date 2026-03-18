
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../config/routes';
import { BRAND } from '../../config/brand';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleLogin } = useAuth();

  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const intendedPath = (location.state as any)?.from?.pathname;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const authUser = await login(email, password);
      const target = intendedPath || (authUser.role === 'customer' ? ROUTES.MY_DASHBOARD : ROUTES.DASHBOARD);
      navigate(target, { replace: true });
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a moment and try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const authUser = await googleLogin();
      const target = intendedPath || (authUser.role === 'customer' ? ROUTES.MY_DASHBOARD : ROUTES.DASHBOARD);
      navigate(target, { replace: true });
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full font-sans text-navy-950 bg-white overflow-hidden">
      {/* Left Side: Warm Travel Visual */}
      <div className="hidden lg:flex w-1/2 relative bg-primary overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] scale-110 animate-slow-zoom opacity-30"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-transparent"></div>

        <div className="relative z-10 flex flex-col justify-between p-16 lg:p-20 w-full h-full text-white">
          <Link to={ROUTES.HOME} className="flex items-center gap-4 group cursor-pointer no-underline">
            <div className="size-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform ring-4 ring-white/10">
              <span className="material-symbols-outlined text-white text-3xl font-black">airlines</span>
            </div>
            <span className="text-3xl font-black tracking-tighter uppercase text-white">{BRAND.name}</span>
          </Link>

          <div className="space-y-8">
            <h1 className="text-6xl xl:text-7xl font-black leading-none tracking-tighter uppercase drop-shadow-2xl">
              Your Journey <br />Starts Here.
            </h1>
            <p className="text-xl text-white/80 max-w-md font-medium leading-relaxed">
              Sign in to manage your bookings, check in for flights, and earn loyalty rewards.
            </p>
            <div className="flex items-center gap-4 pt-8 border-t border-white/20">
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                <span className="material-symbols-outlined text-sm">flight_takeoff</span> 120+ Routes
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                <span className="material-symbols-outlined text-sm">loyalty</span> Earn Miles
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                <span className="material-symbols-outlined text-sm">lock</span> Secure
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
            <span className="material-symbols-outlined text-xl">travel_explore</span>
            <span>FLY WITH CONFIDENCE</span>
          </div>
        </div>
      </div>

      {/* Right Side: Passenger Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col relative bg-white overflow-y-auto">
        {/* Top Nav */}
        <div className="flex justify-between items-center p-6 sm:p-8 shrink-0">
          <Link to={ROUTES.HOME} className="flex items-center gap-3 lg:hidden no-underline">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-xl font-black">airlines</span>
            </div>
            <span className="font-black text-xl tracking-tighter uppercase text-navy-950">{BRAND.shortName}</span>
          </Link>
          <div className="flex items-center gap-4 ml-auto">
            <p className="text-[10px] font-black uppercase tracking-widest text-navy-400">
              New here?
              <Link
                to={ROUTES.REGISTER}
                className="text-primary hover:underline ml-2"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 md:px-24 xl:px-36 py-8">
          <div className="w-full max-w-md mx-auto space-y-10">

            <div className="space-y-3 animate-in fade-in slide-in-from-right duration-700">
              <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-navy-950">Welcome Back</h2>
              <p className="text-navy-400 text-sm font-medium leading-relaxed">
                Sign in to access your bookings, check in online, and manage your travel profile.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div id="login-error" className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in duration-300" role="alert">
                <span className="material-symbols-outlined text-red-500 text-lg mt-0.5">error</span>
                <p className="text-xs font-semibold text-red-700">{error}</p>
              </div>
            )}

            {/* Google Sign-in */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl border-2 border-navy-100 hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-sm font-bold text-navy-700 group-hover:text-navy-950">Continue with Google</span>
            </button>

            <div className="relative flex items-center">
              <div className="grow border-t border-navy-100"></div>
              <span className="mx-6 shrink-0 text-xs font-semibold text-navy-300">or</span>
              <div className="grow border-t border-navy-100"></div>
            </div>

            <form className="space-y-6" onSubmit={handleLogin} aria-label="Login form">
              <div className="space-y-2">
                <label className="text-xs font-bold text-navy-500 block px-1">Email Address</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-navy-300 group-focus-within:text-primary transition-colors text-xl">mail</span>
                  <input
                    required
                    className="w-full h-14 pl-12 pr-6 bg-navy-50 border border-navy-100 rounded-xl text-sm font-medium text-navy-950 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                    placeholder="your.email@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-label="Email address"
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-xs font-bold text-navy-500">Password</label>
                  <Link to={ROUTES.FORGOT_PASSWORD} className="text-xs font-bold text-primary hover:underline">Forgot password?</Link>
                </div>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-navy-300 group-focus-within:text-primary transition-colors text-xl">lock</span>
                  <input
                    required
                    className="w-full h-14 pl-12 pr-14 bg-navy-50 border border-navy-100 rounded-xl text-sm font-medium text-navy-950 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                    placeholder="Enter your password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-label="Password"
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-300 hover:text-primary transition-colors"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-xl">{showPass ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-primary text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>Sign In <span className="material-symbols-outlined text-lg">arrow_forward</span></>
                )}
              </button>
            </form>

            {/* Divider + Staff Login Link */}
            <div className="pt-6 border-t border-navy-100 flex flex-col items-center gap-4">
              <p className="text-xs text-navy-400">
                {BRAND.shortName} staff member?{' '}
                <Link to={ROUTES.STAFF_LOGIN} className="text-primary font-bold hover:underline">
                  Staff Login →
                </Link>
              </p>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-6 sm:p-8 text-center shrink-0">
          <p className="text-[10px] font-semibold text-navy-300 leading-loose">
            {BRAND.copyright} ·{' '}
            <Link to={ROUTES.ABOUT} className="hover:text-primary transition-colors">About Us</Link>{' · '}
            <Link to={ROUTES.DESTINATIONS} className="hover:text-primary transition-colors">Destinations</Link>{' · '}
            <Link to={ROUTES.FLIGHT_TRACKER} className="hover:text-primary transition-colors">Flight Status</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
