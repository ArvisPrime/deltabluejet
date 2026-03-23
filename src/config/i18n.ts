/**
 * i18n Configuration — Deltablue Jet Air
 *
 * Initializes react-i18next with:
 * - Browser language detection (localStorage → navigator → html lang)
 * - English fallback
 * - Inline translations (no lazy-loading for now)
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import fr from '../locales/fr.json';
import ar from '../locales/ar.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            fr: { translation: fr },
            ar: { translation: ar },
        },
        fallbackLng: 'en',
        supportedLngs: ['en', 'fr', 'ar'],
        interpolation: {
            escapeValue: false, // React already escapes
        },
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
            lookupLocalStorage: 'deltablue_lang',
        },
    });

// Set document direction when language changes
i18n.on('languageChanged', (lng) => {
    const dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lng;
});

export default i18n;
