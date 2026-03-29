/**
 * TOTPVerify — Authenticator App Verification Gate
 *
 * Displayed after login for admin users who have enrolled TOTP.
 * The user must enter a 6-digit code from their authenticator app
 * to complete authentication and access the admin dashboard.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '../../config/firebase.config';
import { useAuthStore } from '../../stores/authStore';

export default function TOTPVerify() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => { inputRefs.current[0]?.focus(); }, []);

    const handleChange = (idx: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // digits only
        const next = [...code];
        next[idx] = value.slice(-1);
        setCode(next);
        if (value && idx < 5) inputRefs.current[idx + 1]?.focus();
    };

    const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[idx] && idx > 0) {
            inputRefs.current[idx - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const next = [...code];
        for (let i = 0; i < 6; i++) next[i] = pasted[i] || '';
        setCode(next);
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    const handleVerify = useCallback(async () => {
        const fullCode = code.join('');
        if (fullCode.length !== 6) { setError('Please enter all 6 digits.'); return; }

        try {
            setVerifying(true);
            setError(null);

            const verifyTOTP = httpsCallable(functions, 'totpVerifyCode');
            await verifyTOTP({ code: fullCode });

            // Force token refresh to get updated claims
            await auth.currentUser?.getIdToken(true);

            // Update auth store
            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
                const pending = (currentUser.pendingMfaMethods || []).filter(m => m !== 'totp');
                useAuthStore.getState().setUser({
                    ...currentUser,
                    pendingMfaMethods: pending,
                    requiresMfaVerification: pending.length > 0,
                });
            }

            navigate('/admin', { replace: true });
        } catch (err: any) {
            const msg = err?.message || 'Verification failed.';
            setError(msg.replace('FirebaseError: ', '').replace(/\[.*?\]\s*/, ''));
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setVerifying(false);
        }
    }, [code, navigate]);

    // Auto-submit when all 6 digits are entered
    useEffect(() => {
        if (code.every(d => d !== '') && !verifying) handleVerify();
    }, [code, verifying, handleVerify]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-indigo-950 flex items-center justify-center p-6">
            <div className="w-full max-w-lg">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[4rem] p-14 shadow-2xl space-y-10 text-center">
                    {/* Icon */}
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-primary to-indigo-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/30 animate-in zoom-in duration-700">
                        <span className="material-symbols-outlined text-white text-5xl font-black">smartphone</span>
                    </div>

                    {/* Heading */}
                    <div className="space-y-3">
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Authenticator Code</h1>
                        <p className="text-white/40 text-sm font-bold uppercase tracking-widest">
                            Open your authenticator app and enter the 6-digit code
                        </p>
                    </div>

                    {/* OTP Input */}
                    <div className="flex justify-center gap-3" onPaste={handlePaste}>
                        {code.map((digit, idx) => (
                            <input
                                key={idx}
                                ref={el => { inputRefs.current[idx] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={e => handleChange(idx, e.target.value)}
                                onKeyDown={e => handleKeyDown(idx, e)}
                                className={`w-14 h-16 text-center text-2xl font-black rounded-2xl border-2 bg-white/5 text-white
                                    focus:ring-4 focus:ring-primary/30 focus:border-primary outline-none transition-all
                                    ${error ? 'border-red-500/50 shake' : 'border-white/10'}
                                `}
                                disabled={verifying}
                            />
                        ))}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                            <p className="text-red-400 text-xs font-black uppercase tracking-widest">{error}</p>
                        </div>
                    )}

                    {/* Verify Button */}
                    <button
                        onClick={handleVerify}
                        disabled={verifying || code.some(d => d === '')}
                        className="w-full py-5 bg-gradient-to-r from-primary to-indigo-500 text-white font-black uppercase tracking-[0.2em] text-sm rounded-2xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
                    >
                        {verifying ? (
                            <><span className="material-symbols-outlined text-xl animate-spin">progress_activity</span> Verifying...</>
                        ) : (
                            <><span className="material-symbols-outlined text-xl">check_circle</span> Verify Code</>
                        )}
                    </button>

                    {/* User Info */}
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">
                        Signed in as {user?.email || 'Admin'}
                    </p>
                </div>
            </div>
        </div>
    );
}
