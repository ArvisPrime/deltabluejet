/**
 * usePhoneVerification — Firebase Phone Auth hook
 *
 * Manages the full OTP verification flow:
 * 1. Sets up invisible reCAPTCHA verifier
 * 2. Sends SMS code via signInWithPhoneNumber
 * 3. Verifies code via PhoneAuthProvider.credential + linkWithCredential
 *
 * Uses linkWithCredential to attach phone to existing account
 * (user is already signed in — we don't want to create a new session).
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import {
    RecaptchaVerifier,
    signInWithPhoneNumber,
    PhoneAuthProvider,
    linkWithCredential,
    updatePhoneNumber,
    type ConfirmationResult,
} from 'firebase/auth';
import { auth } from '../config/firebase.config';

export type PhoneVerifyStep = 'idle' | 'sending' | 'codeSent' | 'verifying' | 'verified' | 'error';

export function usePhoneVerification() {
    const [step, setStep] = useState<PhoneVerifyStep>('idle');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
    const confirmationRef = useRef<ConfirmationResult | null>(null);

    // Clean up reCAPTCHA on unmount
    useEffect(() => {
        return () => {
            if (recaptchaRef.current) {
                try { recaptchaRef.current.clear(); } catch { /* already cleared */ }
                recaptchaRef.current = null;
            }
        };
    }, []);

    const setupRecaptcha = useCallback((buttonId: string) => {
        if (recaptchaRef.current) {
            try { recaptchaRef.current.clear(); } catch { /* ignore */ }
        }
        recaptchaRef.current = new RecaptchaVerifier(auth, buttonId, {
            size: 'invisible',
            callback: () => {
                // reCAPTCHA solved — signInWithPhoneNumber will proceed
            },
            'expired-callback': () => {
                setError('reCAPTCHA expired. Please try again.');
                setStep('idle');
            },
        });
    }, []);

    const sendCode = useCallback(async (phoneNumber: string, buttonId: string) => {
        setError(null);
        setLoading(true);
        setStep('sending');

        try {
            // Validate phone format (basic check)
            const cleaned = phoneNumber.replace(/\s+/g, '');
            if (!cleaned.startsWith('+') || cleaned.length < 8) {
                throw new Error('Please enter a valid phone number with country code (e.g. +220 1234567)');
            }

            setupRecaptcha(buttonId);
            const appVerifier = recaptchaRef.current!;

            const confirmation = await signInWithPhoneNumber(auth, cleaned, appVerifier);
            confirmationRef.current = confirmation;
            setStep('codeSent');
        } catch (err: any) {
            console.error('Phone verification — send code error:', err);

            let msg = 'Failed to send verification code.';
            if (err.code === 'auth/invalid-phone-number') {
                msg = 'Invalid phone number format. Use international format (e.g. +220 1234567).';
            } else if (err.code === 'auth/too-many-requests') {
                msg = 'Too many attempts. Please wait a few minutes and try again.';
            } else if (err.code === 'auth/quota-exceeded') {
                msg = 'SMS quota exceeded. Please try again later.';
            } else if (err.code === 'auth/captcha-check-failed') {
                msg = 'reCAPTCHA verification failed. Please refresh and try again.';
            } else if (err.message) {
                msg = err.message;
            }

            setError(msg);
            setStep('error');

            // Reset reCAPTCHA for retry
            if (recaptchaRef.current) {
                try { recaptchaRef.current.clear(); } catch { /* ignore */ }
                recaptchaRef.current = null;
            }
        } finally {
            setLoading(false);
        }
    }, [setupRecaptcha]);

    const verifyCode = useCallback(async (otp: string) => {
        if (!confirmationRef.current) {
            setError('No verification in progress. Please resend the code.');
            return false;
        }

        setError(null);
        setLoading(true);
        setStep('verifying');

        try {
            // Create credential from the OTP
            const credential = PhoneAuthProvider.credential(
                confirmationRef.current.verificationId,
                otp,
            );

            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('You must be signed in to verify your phone number.');
            }

            // Try to link phone to existing account
            try {
                await linkWithCredential(currentUser, credential);
            } catch (linkErr: any) {
                if (linkErr.code === 'auth/provider-already-linked' ||
                    linkErr.code === 'auth/credential-already-in-use') {
                    // Phone already linked — just update the phone number
                    await updatePhoneNumber(currentUser, credential);
                } else {
                    throw linkErr;
                }
            }

            setStep('verified');
            return true;
        } catch (err: any) {
            console.error('Phone verification — verify code error:', err);

            let msg = 'Verification failed.';
            if (err.code === 'auth/invalid-verification-code') {
                msg = 'Invalid code. Please check and try again.';
            } else if (err.code === 'auth/code-expired') {
                msg = 'Code expired. Please request a new one.';
            } else if (err.message) {
                msg = err.message;
            }

            setError(msg);
            setStep('error');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setStep('idle');
        setError(null);
        setLoading(false);
        confirmationRef.current = null;
        if (recaptchaRef.current) {
            try { recaptchaRef.current.clear(); } catch { /* ignore */ }
            recaptchaRef.current = null;
        }
    }, []);

    return { step, error, loading, sendCode, verifyCode, reset };
}

export default usePhoneVerification;
