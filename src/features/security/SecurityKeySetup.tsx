/**
 * SecurityKeySetup — Admin Security Key Management
 *
 * Allows admins to register, view, and remove YubiKey/WebAuthn
 * security keys from their account. Supports multiple keys
 * (primary + backup).
 */

import { useState, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { startRegistration } from '@simplewebauthn/browser';
import { functions } from '../../config/firebase.config';
import { useAuthStore } from '../../stores/authStore';

interface SecurityKey {
    id: string;
    keyName: string;
    deviceType: string;
    registeredAt: string | null;
    lastUsedAt: string | null;
}

export default function SecurityKeySetup() {
    const { user } = useAuthStore();
    const [keys, setKeys] = useState<SecurityKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [keyName, setKeyName] = useState('');
    const [showRegister, setShowRegister] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const loadKeys = useCallback(async () => {
        try {
            setLoading(true);
            const listKeys = httpsCallable<void, SecurityKey[]>(functions, 'webauthnListKeys');
            const result = await listKeys();
            setKeys(result.data);
        } catch (err: any) {
            console.error('Failed to load keys:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadKeys();
    }, [loadKeys]);

    const handleRegister = async () => {
        if (!keyName.trim()) {
            setMessage({ type: 'error', text: 'Please enter a name for this security key.' });
            return;
        }

        try {
            setRegistering(true);
            setMessage(null);

            // Step 1: Get registration options from server
            const genReg = httpsCallable(functions, 'webauthnGenerateRegistration');
            const optionsResult = await genReg({ keyName: keyName.trim() });
            const options = optionsResult.data as any;

            // Step 2: Prompt user's YubiKey via browser WebAuthn API
            const credential = await startRegistration({ optionsJSON: options });

            // Step 3: Verify on server
            const verifyReg = httpsCallable(functions, 'webauthnVerifyRegistration');
            const verifyResult = await verifyReg({ credential });
            const data = verifyResult.data as any;

            if (data.verified) {
                setMessage({ type: 'success', text: `Security key "${keyName}" registered successfully!` });
                setKeyName('');
                setShowRegister(false);
                await loadKeys();
            }
        } catch (err: any) {
            const msg = err.message || 'Registration failed. Make sure your security key is plugged in.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setRegistering(false);
        }
    };

    const handleRemove = async (credId: string, name: string) => {
        if (!confirm(`Remove security key "${name}"? This cannot be undone.`)) return;

        try {
            const removeKey = httpsCallable(functions, 'webauthnRemoveKey');
            await removeKey({ credentialId: credId });
            setMessage({ type: 'success', text: `Security key "${name}" removed.` });
            await loadKeys();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to remove key.' });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary-500">security_key</span>
                        Security Keys (YubiKey / WebAuthn)
                    </h2>
                    <p className="text-sm text-navy-500 mt-1">
                        Register hardware security keys for phishing-resistant two-factor authentication.
                    </p>
                </div>
                <button
                    onClick={() => setShowRegister(!showRegister)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Register New Key
                </button>
            </div>

            {/* Status Message */}
            {message && (
                <div className={`p-3 rounded-lg text-sm ${
                    message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700'
                        : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Registration Form */}
            {showRegister && (
                <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800 rounded-xl p-6">
                    <h3 className="font-semibold text-navy-900 dark:text-white mb-3">Register a Security Key</h3>
                    <p className="text-sm text-navy-500 mb-4">
                        Insert your YubiKey or connect your security key, then give it a name and click Register.
                    </p>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Key name (e.g., 'Primary YubiKey', 'Backup Key')"
                            value={keyName}
                            onChange={(e) => setKeyName(e.target.value)}
                            className="flex-1 px-4 py-2. border border-navy-200 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-800 text-navy-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            disabled={registering}
                        />
                        <button
                            onClick={handleRegister}
                            disabled={registering}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {registering ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                    Touch your key...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">fingerprint</span>
                                    Register
                                </>
                            )}
                        </button>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-navy-400">
                        <span className="material-symbols-outlined text-sm">info</span>
                        Compatible with YubiKey 5 series, Google Titan, and any FIDO2-compliant security key.
                    </div>
                </div>
            )}

            {/* Registered Keys List */}
            <div className="bg-white dark:bg-navy-800 rounded-xl border border-navy-200 dark:border-navy-700 overflow-hidden">
                <div className="px-5 py-3 border-b border-navy-100 dark:border-navy-700">
                    <h3 className="font-semibold text-navy-900 dark:text-white text-sm">
                        Registered Keys ({keys.length})
                    </h3>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-navy-400">
                        <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
                        <p className="mt-2 text-sm">Loading security keys...</p>
                    </div>
                ) : keys.length === 0 ? (
                    <div className="p-8 text-center">
                        <span className="material-symbols-outlined text-4xl text-navy-300 dark:text-navy-600">vpn_key_off</span>
                        <p className="mt-2 text-navy-500 text-sm">No security keys registered</p>
                        <p className="text-navy-400 text-xs mt-1">Register a YubiKey to add phishing-resistant login protection.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-navy-100 dark:divide-navy-700">
                        {keys.map((key) => (
                            <div key={key.id} className="px-5 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary-600 dark:text-primary-400">
                                            {key.deviceType === 'multiDevice' ? 'devices' : 'usb'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-navy-900 dark:text-white text-sm">{key.keyName}</p>
                                        <div className="flex items-center gap-3 text-xs text-navy-400 mt-0.5">
                                            <span>Added {key.registeredAt ? new Date(key.registeredAt).toLocaleDateString() : '—'}</span>
                                            {key.lastUsedAt && (
                                                <span>Last used {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                                            )}
                                            <span className="capitalize">{key.deviceType === 'singleDevice' ? 'Hardware Key' : key.deviceType === 'multiDevice' ? 'Synced Passkey' : 'Key'}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemove(key.id, key.keyName)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                                    title="Remove key"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info Banner */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex gap-3">
                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 mt-0.5">shield</span>
                    <div>
                        <p className="font-medium text-amber-800 dark:text-amber-200 text-sm">Security Recommendation</p>
                        <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                            Register at least two security keys — a primary key for daily use and a backup stored securely.
                            If you lose your primary key, the backup can be used to access your account.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
