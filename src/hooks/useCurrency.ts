/**
 * useCurrency — Currency preference store & conversion helpers
 *
 * Uses Zustand for global state + localStorage persistence.
 * Provides convert() and format() based on the user's selected currency.
 */

import { create } from 'zustand';

// ─── Supported Currencies ──────────────────────────────────

export interface CurrencyInfo {
    code: string;
    symbol: string;
    name: string;
    rate: number;  // Rate relative to USD (1 USD = rate in this currency)
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
    { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
    { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
    { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
    { code: 'GMD', symbol: 'D', name: 'Gambian Dalasi', rate: 72 },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 1580 },
    { code: 'XOF', symbol: 'CFA', name: 'West African CFA', rate: 605 },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 3.67 },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 1.34 },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.36 },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand', rate: 18.6 },
];

// ─── Zustand Store ─────────────────────────────────────────

interface CurrencyState {
    currency: string;
    setCurrency: (code: string) => void;
}

const storedCurrency = typeof window !== 'undefined'
    ? localStorage.getItem('deltablue_currency') || 'USD'
    : 'USD';

export const useCurrencyStore = create<CurrencyState>((set) => ({
    currency: storedCurrency,
    setCurrency: (code: string) => {
        localStorage.setItem('deltablue_currency', code);
        set({ currency: code });
    },
}));

// ─── Conversion & Formatting Helpers ───────────────────────

function getRate(code: string): number {
    return SUPPORTED_CURRENCIES.find(c => c.code === code)?.rate || 1;
}

/**
 * Convert an amount from one currency to another using static rates.
 */
export function convertCurrency(amount: number, from: string, to: string): number {
    if (from === to) return amount;
    // Convert to USD first, then to target
    const amountInUsd = amount / getRate(from);
    return amountInUsd * getRate(to);
}

/**
 * Format an amount in the given currency with proper symbol and decimals.
 */
export function formatInCurrency(amount: number, currencyCode: string): string {
    const info = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    const symbol = info?.symbol || currencyCode;
    const decimals = ['GMD', 'NGN', 'XOF'].includes(currencyCode) ? 0 : 2;

    const formatted = amount.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });

    // Some currencies place symbol after (handled simply with space)
    if (['CFA'].includes(symbol)) {
        return `${formatted} ${symbol}`;
    }
    return `${symbol}${['D', 'CFA'].includes(symbol) ? ' ' : ''}${formatted}`;
}

/**
 * React hook that provides conversion from USD to the user's selected currency.
 */
export function useCurrency() {
    const { currency } = useCurrencyStore();

    return {
        currency,
        /** Convert from USD to user's currency */
        convert: (amountUsd: number) => convertCurrency(amountUsd, 'USD', currency),
        /** Convert from any currency to user's currency */
        convertFrom: (amount: number, from: string) => convertCurrency(amount, from, currency),
        /** Format an already-converted amount in user's currency */
        format: (amount: number) => formatInCurrency(amount, currency),
        /** Convert from USD and format in one step */
        display: (amountUsd: number) => formatInCurrency(convertCurrency(amountUsd, 'USD', currency), currency),
    };
}
