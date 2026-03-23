import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';

const CONSENT_KEY = 'db_cookie_consent';
const CONSENT_VERSION = '1';

interface CookiePreferences {
    essential: boolean;   // always true
    analytics: boolean;
    marketing: boolean;
    preferences: boolean;
    version: string;
    timestamp: string;
}

const CookieConsent: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const [analytics, setAnalytics] = useState(false);
    const [marketing, setMarketing] = useState(false);
    const [preferences, setPreferences] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(CONSENT_KEY);
            if (!stored) {
                // Small delay so it doesn't flash on page load
                const timer = setTimeout(() => setVisible(true), 800);
                return () => clearTimeout(timer);
            }
            const parsed: CookiePreferences = JSON.parse(stored);
            if (parsed.version !== CONSENT_VERSION) {
                const timer = setTimeout(() => setVisible(true), 800);
                return () => clearTimeout(timer);
            }
        } catch {
            const timer = setTimeout(() => setVisible(true), 800);
            return () => clearTimeout(timer);
        }
    }, []);

    const saveConsent = (prefs: Omit<CookiePreferences, 'essential' | 'version' | 'timestamp'>) => {
        const consent: CookiePreferences = {
            essential: true,
            analytics: prefs.analytics,
            marketing: prefs.marketing,
            preferences: prefs.preferences,
            version: CONSENT_VERSION,
            timestamp: new Date().toISOString(),
        };
        localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
        setVisible(false);
    };

    const handleAcceptAll = () => {
        saveConsent({ analytics: true, marketing: true, preferences: true });
    };

    const handleRejectNonEssential = () => {
        saveConsent({ analytics: false, marketing: false, preferences: false });
    };

    const handleSavePreferences = () => {
        saveConsent({ analytics, marketing, preferences });
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 inset-x-0 z-[100] p-4 animate-in slide-in-from-bottom duration-500">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-navy-100 shadow-2xl overflow-hidden">
                {/* Main bar */}
                <div className="p-5 md:p-6">
                    <div className="flex items-start gap-4">
                        <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-xl shrink-0 text-xl">cookie</span>
                        <div className="flex-1">
                            <h3 className="text-sm font-black text-navy-900 uppercase tracking-widest">We value your privacy</h3>
                            <p className="text-xs text-navy-500 font-bold mt-1.5 leading-relaxed">
                                We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.
                                By clicking "Accept All", you consent to our use of cookies as described in our{' '}
                                <Link to={ROUTES.PRIVACY_POLICY} className="text-primary hover:underline">Privacy Policy</Link>.
                            </p>
                        </div>
                    </div>

                    {/* Preference toggles */}
                    {showPreferences && (
                        <div className="mt-5 pt-5 border-t border-navy-100 space-y-3">
                            {[
                                { key: 'essential', label: 'Essential', desc: 'Required for core functionality', checked: true, disabled: true },
                                { key: 'analytics', label: 'Analytics', desc: 'Help us improve our website', checked: analytics, disabled: false, onChange: setAnalytics },
                                { key: 'marketing', label: 'Marketing', desc: 'Relevant advertisements', checked: marketing, disabled: false, onChange: setMarketing },
                                { key: 'preferences', label: 'Preferences', desc: 'Remember your settings', checked: preferences, disabled: false, onChange: setPreferences },
                            ].map((cat) => (
                                <label key={cat.key} className="flex items-center justify-between p-3 bg-navy-50/50 rounded-xl cursor-pointer hover:bg-navy-50 transition-colors">
                                    <div>
                                        <span className="text-xs font-black text-navy-800 uppercase tracking-widest">{cat.label}</span>
                                        <span className="text-[10px] text-navy-400 font-bold ml-2">{cat.desc}</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={cat.checked}
                                            disabled={cat.disabled}
                                            onChange={cat.onChange ? (e) => cat.onChange!(e.target.checked) : undefined}
                                            className="sr-only peer"
                                        />
                                        <div className={`w-10 h-5 rounded-full transition-colors ${cat.disabled ? 'bg-primary/50 cursor-not-allowed' : 'bg-navy-200 peer-checked:bg-primary cursor-pointer'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform ${cat.checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-5">
                        <button
                            onClick={handleAcceptAll}
                            className="flex-1 h-11 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary-600 transition-colors shadow-lg shadow-primary/20"
                        >
                            Accept All
                        </button>
                        {showPreferences ? (
                            <button
                                onClick={handleSavePreferences}
                                className="flex-1 h-11 bg-navy-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-navy-800 transition-colors"
                            >
                                Save Preferences
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowPreferences(true)}
                                className="flex-1 h-11 border-2 border-navy-100 text-navy-700 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-navy-50 transition-colors"
                            >
                                Manage Preferences
                            </button>
                        )}
                        <button
                            onClick={handleRejectNonEssential}
                            className="flex-1 h-11 text-navy-500 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-navy-50 transition-colors"
                        >
                            Reject Non-Essential
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
