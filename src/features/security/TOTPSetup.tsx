/**
 * TOTPSetup — Authenticator App Enrollment Wizard
 *
 * Guides admin users through setting up a TOTP authenticator app:
 * 1. Generate secret + QR code
 * 2. Scan QR code with authenticator app
 * 3. Enter verification code to confirm setup
 */

import { useState, useRef, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '../../config/firebase.config';
import { useToastStore } from '../../stores/toastStore';

interface TOTPSetupProps {
    onComplete?: () => void;
    onCancel?: () => void;
}

export default function TOTPSetup({ onComplete, onCancel }: TOTPSetupProps) {
    const addToast = useToastStore(s => s.addToast);
    const [step, setStep] = useState<'generate' | 'verify'>('generate');
    const [loading, setLoading] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [showSecret, setShowSecret] = useState(false);
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Step 1: Generate secret
    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const genSecret = httpsCallable(functions, 'totpGenerateSecret');
            const result = await genSecret();
            const data = result.data as any;
            setQrCodeUrl(data.qrCodeDataUrl);
            setSecret(data.secret);
            setStep('verify');
        } catch (err: any) {
            const msg = err?.message || 'Failed to generate QR code.';
            setError(msg.replace('FirebaseError: ', '').replace(/\[.*?\]\s*/, ''));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (step === 'verify') inputRefs.current[0]?.focus();
    }, [step]);

    const handleChange = (idx: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
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

    // Step 2: Verify the code
    const handleVerify = async () => {
        const fullCode = code.join('');
        if (fullCode.length !== 6) { setError('Enter all 6 digits.'); return; }

        setVerifying(true);
        setError(null);
        try {
            const verifyCF = httpsCallable(functions, 'totpVerifySetup');
            await verifyCF({ code: fullCode });

            // Force token refresh
            await auth.currentUser?.getIdToken(true);

            addToast('Authenticator app has been set up successfully!', 'success');
            onComplete?.();
        } catch (err: any) {
            const msg = err?.message || 'Verification failed.';
            setError(msg.replace('FirebaseError: ', '').replace(/\[.*?\]\s*/, ''));
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Step 1: Generate */}
            {step === 'generate' && (
                <div className="text-center space-y-8">
                    <div className="mx-auto w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-4xl font-black">qr_code_2</span>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black text-navy-950 uppercase tracking-tighter">Set Up Authenticator App</h3>
                        <p className="text-sm text-navy-500 font-bold uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                            Use Google Authenticator, Microsoft Authenticator, or any TOTP-compatible app to generate verification codes.
                        </p>
                    </div>
                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                            <p className="text-red-600 text-xs font-black uppercase tracking-widest">{error}</p>
                        </div>
                    )}
                    <div className="flex gap-4 justify-center">
                        <button onClick={onCancel} className="px-8 py-4 border-2 border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-500 hover:bg-navy-50 transition-all">
                            Cancel
                        </button>
                        <button onClick={handleGenerate} disabled={loading} className="px-10 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                            {loading ? 'Generating...' : 'Generate QR Code'}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Scan + Verify */}
            {step === 'verify' && (
                <div className="space-y-8">
                    {/* QR Code */}
                    <div className="text-center space-y-6">
                        <h3 className="text-xl font-black text-navy-950 uppercase tracking-tighter">Scan This QR Code</h3>
                        <p className="text-xs text-navy-500 font-bold uppercase tracking-widest">
                            Open your authenticator app and scan the QR code below
                        </p>
                        <div className="mx-auto w-64 h-64 bg-white rounded-3xl border-2 border-navy-100 p-4 shadow-inner">
                            <img src={qrCodeUrl} alt="TOTP QR Code" className="w-full h-full" />
                        </div>
                    </div>

                    {/* Manual Entry */}
                    <div className="text-center">
                        <button onClick={() => setShowSecret(!showSecret)} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline transition-all">
                            {showSecret ? 'Hide' : "Can't scan? Enter code manually"}
                        </button>
                        {showSecret && (
                            <div className="mt-4 bg-navy-50 rounded-2xl p-4 border border-navy-100">
                                <p className="text-xs font-mono font-black text-navy-800 tracking-wider select-all">{secret}</p>
                            </div>
                        )}
                    </div>

                    {/* Verification Code Input */}
                    <div className="space-y-4 text-center">
                        <p className="text-xs font-black text-navy-500 uppercase tracking-widest">Enter the 6-digit code from your app</p>
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
                                    className={`w-12 h-14 text-center text-xl font-black rounded-xl border-2 bg-white
                                        focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all
                                        ${error ? 'border-red-300' : 'border-navy-100'}
                                    `}
                                    disabled={verifying}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
                            <p className="text-red-600 text-xs font-black uppercase tracking-widest">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 justify-center">
                        <button onClick={onCancel} className="px-8 py-4 border-2 border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-500 hover:bg-navy-50 transition-all">
                            Cancel
                        </button>
                        <button
                            onClick={handleVerify}
                            disabled={verifying || code.some(d => d === '')}
                            className="px-10 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {verifying ? 'Verifying...' : 'Verify & Enable'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
