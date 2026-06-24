/**
 * useGeoLocale — IP-based auto-detection of currency & language
 *
 * Runs once on app startup. Silently sets the currency store
 * and i18n language based on the visitor's detected country.
 *
 * Skips detection if the user has manually chosen a preference.
 */

import { useEffect } from 'react';
import { detectGeoLocale } from '../services/geoService';
import { useCurrencyStore, SUPPORTED_CURRENCIES } from './useCurrency';
import i18n from '../config/i18n';

/** localStorage key set when user manually picks a preference */
export const MANUAL_PREF_KEY = 'deltablue_manual_pref';

/**
 * Checks whether the user has previously made a manual
 * currency or language selection.
 */
function hasManualPreference(): boolean {
    try {
        return localStorage.getItem(MANUAL_PREF_KEY) === '1';
    } catch {
        return false;
    }
}

/**
 * Mark that the user explicitly chose their locale
 * (called from CurrencySelector / LanguageSwitcher).
 */
export function setManualPreference(): void {
    try {
        localStorage.setItem(MANUAL_PREF_KEY, '1');
    } catch { /* ignore */ }
}

/**
 * Call this hook once at the app root (e.g. inside App.tsx).
 * It performs a non-blocking geo lookup and silently applies
 * the detected locale. If the detection is slower than the
 * initial render, the UI will flash‑update without disruption.
 */
export function useGeoLocale(): void {
    useEffect(() => {
        // If user already expressed a manual preference, respect it
        if (hasManualPreference()) return;

        let cancelled = false;

        // Defer geo lookup so it doesn't compete with critical
        // JS/CSS/font downloads during initial page load.
        const deferMs = 3000;
        const scheduleGeo = () => {
            setTimeout(async () => {
                if (cancelled) return;

                const geo = await detectGeoLocale();
                if (cancelled) return;

                // ── Currency ────────────────────────────────────
                const currentCurrency = useCurrencyStore.getState().currency;
                const isSupported = SUPPORTED_CURRENCIES.some(c => c.code === geo.currency);

                // Only change if detected currency differs AND is in our list
                if (isSupported && geo.currency !== currentCurrency) {
                    useCurrencyStore.getState().setCurrency(geo.currency);
                }

                // ── Language ────────────────────────────────────
                const supportedLngs = i18n.options.supportedLngs as string[] | undefined;
                const isLangSupported = supportedLngs
                    ? supportedLngs.includes(geo.language)
                    : true;

                if (isLangSupported && geo.language !== i18n.language) {
                    await i18n.changeLanguage(geo.language);
                }
            }, deferMs);
        };

        // Use requestIdleCallback if available, else just setTimeout
        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(scheduleGeo);
        } else {
            scheduleGeo();
        }

        return () => { cancelled = true; };
    }, []);
}
