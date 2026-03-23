/**
 * Currency Service — Deltablue Jet Air
 *
 * Multi-currency conversion, formatting, and live exchange rate support.
 * Static fallback rates are used when live API is unavailable.
 */

// ─── Static Fallback Rates (1 USD = X) ────────────────────

const STATIC_RATES: Record<string, number> = {
    USD: 1,
    GMD: 72,
    EUR: 0.92,
    GBP: 0.79,
    NGN: 1580,
    XOF: 605,
    AED: 3.67,
    SGD: 1.34,
    CAD: 1.36,
    ZAR: 18.6,
};

// ─── Live Rate Cache ───────────────────────────────────────

interface RateCache {
    rates: Record<string, number>;
    fetchedAt: number;
}

let _cache: RateCache | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch live exchange rates from a free API.
 * Falls back to static rates on failure.
 * Caches results for 1 hour.
 */
export async function fetchLiveRates(): Promise<Record<string, number>> {
    // Return cache if fresh
    if (_cache && Date.now() - _cache.fetchedAt < CACHE_TTL_MS) {
        return _cache.rates;
    }

    try {
        const resp = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        if (data?.rates) {
            // Only keep the currencies we support
            const rates: Record<string, number> = {};
            for (const code of Object.keys(STATIC_RATES)) {
                rates[code] = data.rates[code] ?? STATIC_RATES[code];
            }
            _cache = { rates, fetchedAt: Date.now() };
            return rates;
        }
    } catch (err) {
        console.warn('[CurrencyService] Live rate fetch failed, using static rates', err);
    }

    return { ...STATIC_RATES };
}

/**
 * Get current rates (cached live or static fallback). Synchronous.
 */
export function getRates(): Record<string, number> {
    return _cache?.rates ?? { ...STATIC_RATES };
}

// ─── Exchange Rate Info (legacy compat) ────────────────────

export interface ExchangeRates {
    GMD_PER_USD: number;
    USD_PER_GMD: number;
    lastUpdated: string;
}

export function getExchangeRates(): ExchangeRates {
    const rates = getRates();
    return {
        GMD_PER_USD: rates.GMD,
        USD_PER_GMD: 1 / rates.GMD,
        lastUpdated: _cache
            ? new Date(_cache.fetchedAt).toISOString().slice(0, 10)
            : '2026-03-23',
    };
}

// ─── Universal Conversion ──────────────────────────────────

/** Convert an amount from one currency to another. */
export function convertAmount(amount: number, from: string, to: string): number {
    if (from === to) return amount;
    const rates = getRates();
    const fromRate = rates[from.toUpperCase()] ?? 1;
    const toRate = rates[to.toUpperCase()] ?? 1;
    return (amount / fromRate) * toRate;
}

/** Convert to USD (legacy compat). */
export function convertToUSD(amount: number, fromCurrency: string): number {
    return convertAmount(amount, fromCurrency, 'USD');
}

/** Convert to GMD (legacy compat). */
export function convertToGMD(amount: number, fromCurrency: string): number {
    return convertAmount(amount, fromCurrency, 'GMD');
}

// ─── Formatting ────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    GMD: 'D',
    EUR: '€',
    GBP: '£',
    XOF: 'CFA',
    NGN: '₦',
    AED: 'د.إ',
    SGD: 'S$',
    CAD: 'C$',
    ZAR: 'R',
};

const ZERO_DECIMAL_CURRENCIES = new Set(['GMD', 'NGN', 'XOF', 'ZAR']);

/**
 * Format an amount with the correct currency symbol.
 * Examples: formatCurrency(1500, 'GMD') → "D 1,500"
 *           formatCurrency(25.99, 'USD') → "$25.99"
 */
export function formatCurrency(amount: number, currency: string): string {
    const cur = currency.toUpperCase();
    const symbol = CURRENCY_SYMBOLS[cur] || cur;
    const decimals = ZERO_DECIMAL_CURRENCIES.has(cur) ? 0 : 2;
    const formatted = amount.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });

    // Some symbols need a space (D 1,500 vs $25.99)
    const spacer = ['D', 'CFA', 'R'].includes(symbol) ? ' ' : '';
    // CFA goes after the number
    if (symbol === 'CFA') return `${formatted} CFA`;
    return `${symbol}${spacer}${formatted}`;
}

/**
 * Format amount in both GMD and USD for display.
 * Example: "D 5,400 (~$75.00)"
 */
export function formatDualCurrency(amount: number, currency: string): string {
    const primary = formatCurrency(amount, currency);
    const cur = currency.toUpperCase();
    if (cur === 'GMD') {
        const usdAmount = convertToUSD(amount, 'GMD');
        return `${primary} (~$${usdAmount.toFixed(2)})`;
    }
    if (cur === 'USD') {
        const gmdAmount = convertToGMD(amount, 'USD');
        return `${primary} (~D ${Math.round(gmdAmount).toLocaleString()})`;
    }
    return primary;
}
