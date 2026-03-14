/**
 * YubiKeyVerify — Security Key Verification Gate
 *
 * Displayed after email/password login for admin users who have
 * registered a YubiKey. The user must touch their security key
 * to complete authentication and access the admin dashboard.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { httpsCallable } from 'firebase/functions';
import { startAuthentication } from '@simplewebauthn/browser';
import { functions, auth } from '../../config/firebase.config';
import { useAuthStore } from '../../stores/authStore';

export default function YubiKeyVerify() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleVerify = useCallback(async () => {
        try {
            setVerifying(true);
            setError(null);

            // Step 1: Get authentication challenge from server
            const genAuth = httpsCallable(functions, 'webauthnGenerateAuthentication');
            const optionsResult = await genAuth();
            const options = optionsResult.data as any;

            // Step 2: Prompt user's YubiKey via browser WebAuthn API
            const credential = await startAuthentication({ optionsJSON: options });

            // Step 3: Verify on server
            const verifyAuth = httpsCallable(functions, 'webauthnVerifyAuthentication');
            const result = await verifyAuth({ credential });
            const data = result.data as any;

            if (data.verified) {
                // Force token refresh to pick up the new custom claim
                await auth.currentUser?.getIdToken(true);
                navigate('/admin', { replace: true });
            }
        } catch (err: any) {
            if (err.name === 'NotAllowedError') {
                setError('Security key verification was cancelled or timed out. Please try again.');
            } else {
                setError(err.message || 'Verification failed. Please ensure your security key is connected.');
            }
        } finally {
            setVerifying(false);
        }
    }, [navigate]);

    const handleLogout = async () => {
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
        useAuthStore.getState().logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-primary-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center">
                    {/* Animated Key Icon */}
                    <div className="relative mx-auto w-20 h-20 mb-6">
                        <div className="absolute inset-0 bg-primary-500/20 rounded-full animate-ping" />
                        <div className="relative w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30">
                            <span className="material-symbols-outlined text-white text-3xl">security_key</span>
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">Security Key Required</h1>
                    <p className="text-white/60 text-sm mb-6">
                        {user?.email ? `Signed in as ${user.email}` : 'Admin authentication'} — touch your YubiKey or security key to continue.
                    </p>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm text-left">
                            <span className="material-symbols-outlined text-sm align-middle mr-1">error</span>
                            {error}
                        </div>
                    )}

                    {/* Verify Button */}
                    <button
                        onClick={handleVerify}
                        disabled={verifying}
                        className="w-full py-3.5 px-6 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2"
                    >
                        {verifying ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                Touch your security key...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-lg">fingerprint</span>
                                Verify with Security Key
                            </>
                        )}
                    </button>

                    {/* Help Text */}
                    <div className="mt-6 text-white/40 text-xs space-y-1">
                        <p>Insert your YubiKey into a USB port, then click Verify above.</p>
                        <p>If using NFC, hold your key against the back of your device.</p>
                    </div>

                    {/* Alternative Actions */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <button
                            onClick={handleLogout}
                            className="text-white/50 hover:text-white/80 text-sm transition-colors"
                        >
                            Sign out and use a different account
                        </button>
                    </div>
                </div>

                {/* Branding */}
                <p className="text-center text-white/20 text-xs mt-4">
                    DeltaBlue Jet Air • Secure Admin Access
                </p>
            </div>
        </div>
    );
}
