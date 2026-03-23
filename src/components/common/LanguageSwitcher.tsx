import React from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();

    return (
        <div className="relative group">
            <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-50/50 hover:bg-navy-100/80 transition-all text-[10px] font-black text-navy-500 uppercase tracking-widest"
                aria-label="Select language"
            >
                <span className="text-sm">{LANGUAGES.find(l => l.code === i18n.language)?.flag || '🌐'}</span>
                <span className="hidden sm:inline">{i18n.language?.toUpperCase()}</span>
                <span className="material-symbols-outlined text-xs text-navy-300">expand_more</span>
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-navy-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[160px]">
                {LANGUAGES.map(lang => (
                    <button
                        key={lang.code}
                        onClick={() => i18n.changeLanguage(lang.code)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-colors hover:bg-navy-50 ${
                            i18n.language === lang.code ? 'text-primary bg-primary/5' : 'text-navy-600'
                        }`}
                    >
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.label}</span>
                        {i18n.language === lang.code && (
                            <span className="material-symbols-outlined text-primary text-sm ml-auto">check</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LanguageSwitcher;
