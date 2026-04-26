import React from 'react';
import { useCurrencyStore, SUPPORTED_CURRENCIES } from '../../hooks/useCurrency';
import { setManualPreference } from '../../hooks/useGeoLocale';
import { clearGeoCache } from '../../services/geoService';

const CurrencySelector: React.FC = () => {
    const { currency, setCurrency } = useCurrencyStore();

    const handleSelect = (code: string) => {
        setCurrency(code);
        setManualPreference();
        clearGeoCache();
    };
    return (
        <div className="relative group">
            <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-50/50 hover:bg-navy-100/80 transition-all text-[10px] font-black text-navy-500 uppercase tracking-widest"
                aria-label="Select currency"
            >
                <span className="text-sm">{SUPPORTED_CURRENCIES.find(c => c.code === currency)?.symbol || '$'}</span>
                <span className="hidden sm:inline">{currency}</span>
                <span className="material-symbols-outlined text-xs text-navy-300">expand_more</span>
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-navy-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[180px] max-h-[300px] overflow-y-auto">
                {SUPPORTED_CURRENCIES.map(cur => (
                    <button
                        key={cur.code}
                        onClick={() => handleSelect(cur.code)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-colors hover:bg-navy-50 ${
                            currency === cur.code ? 'text-primary bg-primary/5' : 'text-navy-600'
                        }`}
                    >
                        <span className="text-sm w-6 text-center font-black">{cur.symbol}</span>
                        <span>{cur.code}</span>
                        <span className="text-navy-300 ml-auto text-[10px]">{cur.name}</span>
                        {currency === cur.code && (
                            <span className="material-symbols-outlined text-primary text-sm">check</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CurrencySelector;
