/**
 * PhoneVerification — Reusable phone verification component
 *
 * Two-step OTP flow:
 * 1. Enter phone number → Send Code
 * 2. Enter 6-digit OTP → Verify
 * 3. Success → Verified badge
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePhoneVerification } from '../../hooks/usePhoneVerification';

interface PhoneVerificationProps {
    currentPhone?: string | null;
    isVerified?: boolean;
    onVerified: (phone: string) => void;
}

const PhoneVerification: React.FC<PhoneVerificationProps> = ({
    currentPhone,
    isVerified = false,
    onVerified,
}) => {
    const { step, error, loading, sendCode, verifyCode, reset } = usePhoneVerification();
    const [phoneInput, setPhoneInput] = useState(currentPhone || '');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [showVerifyFlow, setShowVerifyFlow] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer for resend
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => setCountdown(c => c - 1), 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    // Auto-focus first OTP input when code is sent
    useEffect(() => {
        if (step === 'codeSent') {
            setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
        }
    }, [step]);

    // Notify parent on success
    useEffect(() => {
        if (step === 'verified') {
            onVerified(phoneInput.replace(/\s+/g, ''));
        }
    }, [step, phoneInput, onVerified]);

    const handleSendCode = useCallback(async () => {
        await sendCode(phoneInput, 'phone-verify-btn');
        setCountdown(60);
    }, [phoneInput, sendCode]);

    const handleOtpChange = useCallback((index: number, value: string) => {
        // Only allow digits
        const digit = value.replace(/\D/g, '').slice(-1);
        setOtp(prev => {
            const next = [...prev];
            next[index] = digit;
            return next;
        });

        // Auto-focus next input
        if (digit && index < 5) {
            otpInputsRef.current[index + 1]?.focus();
        }
    }, []);

    const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputsRef.current[index - 1]?.focus();
        }
    }, [otp]);

    const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length > 0) {
            const newOtp = [...otp];
            for (let i = 0; i < 6; i++) {
                newOtp[i] = pasted[i] || '';
            }
            setOtp(newOtp);
            // Focus last filled input
            const lastIndex = Math.min(pasted.length, 5);
            otpInputsRef.current[lastIndex]?.focus();
        }
    }, [otp]);

    const handleVerify = useCallback(async () => {
        const code = otp.join('');
        if (code.length !== 6) return;
        await verifyCode(code);
    }, [otp, verifyCode]);

    const handleResend = useCallback(async () => {
        setOtp(['', '', '', '', '', '']);
        reset();
        // Small delay to let reset complete
        setTimeout(() => handleSendCode(), 100);
    }, [reset, handleSendCode]);

    const handleCancel = useCallback(() => {
        setShowVerifyFlow(false);
        setOtp(['', '', '', '', '', '']);
        reset();
    }, [reset]);

    // ─── Already Verified State ──────────────────────────────
    if (isVerified && !showVerifyFlow) {
        return (
            <div className="space-y-1.5">
                <label className="text-[9px] font-black text-navy-300 uppercase tracking-widest">
                    Phone Number
                </label>
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-12 px-4 bg-navy-50 rounded-xl font-bold text-navy-900 flex items-center gap-3">
                        <span className="material-symbols-outlined text-base text-navy-400">phone</span>
                        {currentPhone || 'Not set'}
                    </div>
                    <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-emerald-600 text-sm">verified</span>
                        <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Verified</span>
                    </div>
                    <button
                        onClick={() => setShowVerifyFlow(true)}
                        className="px-3 py-1.5 text-[9px] font-black text-navy-500 uppercase tracking-widest hover:text-primary transition-colors"
                    >
                        Change
                    </button>
                </div>
            </div>
        );
    }

    // ─── Verified Success State ──────────────────────────────
    if (step === 'verified') {
        return (
            <div className="space-y-1.5">
                <label className="text-[9px] font-black text-navy-300 uppercase tracking-widest">
                    Phone Number
                </label>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-in fade-in duration-500">
                    <div className="size-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-emerald-600 text-xl">check_circle</span>
                    </div>
                    <div>
                        <p className="text-sm font-black text-emerald-800">Phone Verified!</p>
                        <p className="text-[10px] font-bold text-emerald-600">{phoneInput}</p>
                    </div>
                </div>
            </div>
        );
    }

    // ─── OTP Entry State ─────────────────────────────────────
    if (step === 'codeSent' || step === 'verifying' || (step === 'error' && otp.some(d => d))) {
        return (
            <div className="space-y-1.5">
                <label className="text-[9px] font-black text-navy-300 uppercase tracking-widest">
                    Verify Phone Number
                </label>
                <div className="p-6 bg-white border border-navy-100 rounded-2xl shadow-sm space-y-5">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-xl">sms</span>
                        </div>
                        <div>
                            <p className="text-sm font-black text-navy-900">Enter verification code</p>
                            <p className="text-[10px] font-bold text-navy-400">
                                We sent a 6-digit code to <span className="text-navy-700">{phoneInput}</span>
                            </p>
                        </div>
                    </div>

                    {/* OTP Inputs */}
                    <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                ref={el => { otpInputsRef.current[i] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={e => handleOtpChange(i, e.target.value)}
                                onKeyDown={e => handleOtpKeyDown(i, e)}
                                className={`w-12 h-14 text-center text-xl font-black rounded-xl border-2 outline-none transition-all ${
                                    digit
                                        ? 'border-primary bg-primary/5 text-navy-900'
                                        : 'border-navy-200 bg-navy-50 text-navy-400'
                                } focus:border-primary focus:ring-2 focus:ring-primary/20`}
                                disabled={loading}
                            />
                        ))}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-500 text-sm">error</span>
                            <p className="text-xs font-bold text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleResend}
                            disabled={countdown > 0 || loading}
                            className="text-[10px] font-black text-primary uppercase tracking-widest disabled:text-navy-300 disabled:cursor-not-allowed hover:underline"
                        >
                            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCancel}
                                disabled={loading}
                                className="px-4 py-2.5 text-[10px] font-black text-navy-500 uppercase tracking-widest hover:text-navy-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleVerify}
                                disabled={otp.join('').length !== 6 || loading}
                                className="px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-[0.15em] rounded-xl shadow-md shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <><div className="animate-spin size-3 border-2 border-white/30 border-t-white rounded-full" /> Verifying...</>
                                ) : (
                                    <><span className="material-symbols-outlined text-sm">verified</span> Verify</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Default: Phone Input + Send Code ────────────────────
    return (
        <div className="space-y-1.5">
            <label className="text-[9px] font-black text-navy-300 uppercase tracking-widest">
                Phone Number
            </label>
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 text-base">phone</span>
                    <input
                        className="w-full h-12 pl-11 pr-4 bg-navy-50 rounded-xl font-bold text-navy-900 outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="+220 123 4567"
                        value={phoneInput}
                        onChange={e => setPhoneInput(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <button
                    id="phone-verify-btn"
                    onClick={handleSendCode}
                    disabled={!phoneInput.trim() || loading}
                    className="px-5 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-[0.15em] rounded-xl shadow-md shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                    {loading ? (
                        <><div className="animate-spin size-3 border-2 border-white/30 border-t-white rounded-full" /> Sending...</>
                    ) : (
                        <><span className="material-symbols-outlined text-sm">send</span> Send Code</>
                    )}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 mt-2">
                    <span className="material-symbols-outlined text-red-500 text-sm">error</span>
                    <p className="text-xs font-bold text-red-700">{error}</p>
                </div>
            )}

            {!isVerified && currentPhone && (
                <p className="text-[9px] font-bold text-amber-600 flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-xs">warning</span>
                    Phone not verified — verify to receive SMS notifications
                </p>
            )}
        </div>
    );
};

export default PhoneVerification;
