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
    const [noKeysDetected, setNoKeysDetected] = useState(false);
    const [resetting, setResetting] = useState(false);

    const handleBypass = useCallback(async () => {
        // Force token refresh and clear the verification flag
        await auth.currentUser?.getIdToken(true);
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
            useAuthStore.getState().setUser({
                ...currentUser,
                requiresYubikeyVerification: false,
                requiresMfaVerification: false,
                pendingMfaMethods: [],
            });
        }
        navigate('/admin/security/keys', { replace: true });
    }, [navigate]);

    const handleResetKey = useCallback(async () => {
        try {
            setResetting(true);
            setError(null);

            // Call the Cloud Function to clear all YubiKey claims and credentials
            const resetFn = httpsCallable(functions, 'resetYubikeyRegistration');
            const result = await resetFn();
            const data = result.data as any;

            if (data.success) {
                // Force token refresh to pick up the cleared claims
                await auth.currentUser?.getIdToken(true);

                // Clear the MFA gate state
                const currentUser = useAuthStore.getState().user;
                if (currentUser) {
                    useAuthStore.getState().setUser({
                        ...currentUser,
                        requiresYubikeyVerification: false,
                        requiresMfaVerification: false,
                        pendingMfaMethods: (currentUser.pendingMfaMethods || []).filter(m => m !== 'yubikey'),
                    });
                }

                // Redirect to MFA settings so they can re-register
                navigate('/admin/security/keys', { replace: true });
            }
        } catch (err: any) {
            setError(err?.message || 'Failed to reset security key. Please try again.');
        } finally {
            setResetting(false);
        }
    }, [navigate]);

    const handleVerify = useCallback(async () => {
        try {
            setVerifying(true);
            setError(null);

            // Step 1: Get authentication challenge from server
            const genAuth = httpsCallable(functions, 'webauthnGenerateAuthentication');
            const optionsResult = await genAuth();
            const options = optionsResult.data as any;

            // Handle case where credentials were deleted but claims remained (self-healing)
            if (options.noKeysFound) {
                await auth.currentUser?.getIdToken(true);
                const currentUser = useAuthStore.getState().user;
                if (currentUser) {
                    useAuthStore.getState().setUser({
                        ...currentUser,
                        requiresYubikeyVerification: false,
                        requiresMfaVerification: false,
                        pendingMfaMethods: [],
                    });
                }
                navigate('/admin', { replace: true });
                return;
            }

            // Step 2: Prompt user's YubiKey via browser WebAuthn API
            const credential = await startAuthentication({ optionsJSON: options });

            // Step 3: Verify on server
            const verifyAuth = httpsCallable(functions, 'webauthnVerifyAuthentication');
            const result = await verifyAuth({ credential });
            const data = result.data as any;

            if (data.verified) {
                // Force token refresh to pick up the new custom claim
                await auth.currentUser?.getIdToken(true);
                // Clear the verification flag in the store so ProtectedRoute permits access
                const currentUser = useAuthStore.getState().user;
                if (currentUser) {
                    useAuthStore.getState().setUser({
                        ...currentUser,
                        requiresYubikeyVerification: false,
                        requiresMfaVerification: false,
                        pendingMfaMethods: (currentUser.pendingMfaMethods || []).filter(m => m !== 'yubikey'),
                    });
                }
                navigate('/admin', { replace: true });
            }
        } catch (err: any) {
            const msg = err?.message || '';
            if (msg.includes('No security keys registered') || msg.includes('not-found')) {
                setNoKeysDetected(true);
                setError('No security keys registered for this account. Use the button below to register one.');
            } else if (err.name === 'NotAllowedError') {
                setError('Security key verification was cancelled or timed out. Please try again.');
            } else {
                setError(msg || 'Verification failed. Please ensure your security key is connected.');
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
                        <div className={`mb-4 p-3 rounded-lg text-sm text-left ${noKeysDetected ? 'bg-amber-500/20 border border-amber-500/30 text-amber-200' : 'bg-red-500/20 border border-red-500/30 text-red-200'}`}>
                            <span className="material-symbols-outlined text-sm align-middle mr-1">{noKeysDetected ? 'info' : 'error'}</span>
                            {error}
                        </div>
                    )}

                    {/* No Keys — Bypass to Register */}
                    {noKeysDetected && (
                        <button
                            onClick={handleBypass}
                            className="w-full mb-3 py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">add_circle</span>
                            Proceed to Register a Security Key
                        </button>
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

                    {/* Lost/Changed Key — Reset */}
                    <button
                        onClick={handleResetKey}
                        disabled={resetting}
                        className="w-full mt-3 py-2.5 px-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-xl text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {resetting ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                Resetting...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-sm">restart_alt</span>
                                Lost or changed your key? Reset registration
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

