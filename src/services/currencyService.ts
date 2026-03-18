/**
 * Currency Service — Deltablue Jet Air
 *
 * GMD ↔ USD conversion and multi-currency formatting.
 * Uses a static exchange rate (configurable). Replace with a
 * live API (e.g., Exchange Rates API) when ready for production.
 */

// ─── Exchange Rate Configuration ───────────────────────────

/**
 * Static GMD→USD exchange rate.
 * As of March 2026, 1 USD ≈ 72 GMD.
 * Update this value periodically or replace with a live API call.
 */
const GMD_PER_USD = 72;

export interface ExchangeRates {
    GMD_PER_USD: number;
    USD_PER_GMD: number;
    lastUpdated: string;
}

export function getExchangeRates(): ExchangeRates {
    return {
        GMD_PER_USD,
        USD_PER_GMD: 1 / GMD_PER_USD,
        lastUpdated: '2026-03-18',
    };
}

// ─── Conversion Helpers ────────────────────────────────────

/** Convert an amount to USD from any supported currency. */
export function convertToUSD(amount: number, fromCurrency: string): number {
    const cur = fromCurrency.toUpperCase();
    if (cur === 'USD') return amount;
    if (cur === 'GMD') return amount / GMD_PER_USD;
    // Unknown currency — return as-is with a console warning
    console.warn(`[CurrencyService] Unknown currency "${cur}", returning amount as-is`);
    return amount;
}

/** Convert an amount to GMD from any supported currency. */
export function convertToGMD(amount: number, fromCurrency: string): number {
    const cur = fromCurrency.toUpperCase();
    if (cur === 'GMD') return amount;
    if (cur === 'USD') return amount * GMD_PER_USD;
    console.warn(`[CurrencyService] Unknown currency "${cur}", returning amount as-is`);
    return amount;
}

// ─── Formatting ────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    GMD: 'D',
    EUR: '€',
    GBP: '£',
    XOF: 'CFA',
};

/**
 * Format an amount with the correct currency symbol.
 * Examples: formatCurrency(1500, 'GMD') → "D 1,500"
 *           formatCurrency(25.99, 'USD') → "$25.99"
 */
export function formatCurrency(amount: number, currency: string): string {
    const cur = currency.toUpperCase();
    const symbol = CURRENCY_SYMBOLS[cur] || cur;
    const formatted = amount.toLocaleString('en-US', {
        minimumFractionDigits: cur === 'GMD' ? 0 : 2,
        maximumFractionDigits: 2,
    });
    return `${symbol}${cur === 'GMD' ? ' ' : ''}${formatted}`;
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
