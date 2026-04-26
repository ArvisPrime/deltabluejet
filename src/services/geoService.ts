/**
 * Geo-Location Service — Deltablue Jet Air
 *
 * Detects the visitor's country from their IP address and maps it to
 * the appropriate currency + language for the Deltablue platform.
 *
 * Primary:   ipwhois.app   (10 k/month free, commercial OK)
 * Secondary: Cloud Function proxy  (/api/geolocate)
 * Fallback:  GMD + English  (Gambia is the airline's home base)
 */

// ─── Country → Currency / Language Mapping ─────────────────

export interface GeoDefaults {
    currency: string;
    language: string;
}

/**
 * Static mapping from ISO 3166-1 alpha-2 country codes to
 * the best-matching supported currency and i18n language code.
 *
 * Only countries we explicitly support are listed — everything
 * else falls through to the FALLBACK.
 */
export const GEO_DEFAULTS: Record<string, GeoDefaults> = {
    // ── West Africa (home market) ───────────────────────────
    GM: { currency: 'GMD', language: 'en' },   // Gambia
    SN: { currency: 'XOF', language: 'fr' },   // Senegal
    GH: { currency: 'USD', language: 'en' },   // Ghana
    SL: { currency: 'USD', language: 'en' },   // Sierra Leone
    GN: { currency: 'XOF', language: 'fr' },   // Guinea
    GW: { currency: 'XOF', language: 'fr' },   // Guinea-Bissau
    LR: { currency: 'USD', language: 'en' },   // Liberia
    NG: { currency: 'NGN', language: 'en' },   // Nigeria
    CI: { currency: 'XOF', language: 'fr' },   // Côte d'Ivoire
    ML: { currency: 'XOF', language: 'fr' },   // Mali
    BF: { currency: 'XOF', language: 'fr' },   // Burkina Faso
    TG: { currency: 'XOF', language: 'fr' },   // Togo
    BJ: { currency: 'XOF', language: 'fr' },   // Benin
    NE: { currency: 'XOF', language: 'fr' },   // Niger
    MR: { currency: 'XOF', language: 'fr' },   // Mauritania
    CV: { currency: 'XOF', language: 'fr' },   // Cape Verde

    // ── Europe ──────────────────────────────────────────────
    GB: { currency: 'GBP', language: 'en' },   // United Kingdom
    FR: { currency: 'EUR', language: 'fr' },   // France
    DE: { currency: 'EUR', language: 'en' },   // Germany
    ES: { currency: 'EUR', language: 'en' },   // Spain
    NL: { currency: 'EUR', language: 'en' },   // Netherlands
    BE: { currency: 'EUR', language: 'fr' },   // Belgium
    IT: { currency: 'EUR', language: 'en' },   // Italy
    PT: { currency: 'EUR', language: 'en' },   // Portugal
    CH: { currency: 'EUR', language: 'fr' },   // Switzerland
    IE: { currency: 'EUR', language: 'en' },   // Ireland

    // ── Middle East ─────────────────────────────────────────
    AE: { currency: 'AED', language: 'ar' },   // UAE
    SA: { currency: 'AED', language: 'ar' },   // Saudi Arabia
    QA: { currency: 'AED', language: 'ar' },   // Qatar
    KW: { currency: 'AED', language: 'ar' },   // Kuwait
    BH: { currency: 'AED', language: 'ar' },   // Bahrain
    OM: { currency: 'AED', language: 'ar' },   // Oman
    EG: { currency: 'USD', language: 'ar' },   // Egypt
    MA: { currency: 'EUR', language: 'fr' },   // Morocco
    TN: { currency: 'EUR', language: 'fr' },   // Tunisia

    // ── Americas ────────────────────────────────────────────
    US: { currency: 'USD', language: 'en' },   // United States
    CA: { currency: 'CAD', language: 'en' },   // Canada

    // ── Asia-Pacific ────────────────────────────────────────
    SG: { currency: 'SGD', language: 'en' },   // Singapore

    // ── Southern Africa ─────────────────────────────────────
    ZA: { currency: 'ZAR', language: 'en' },   // South Africa
};

/** Default when country is unknown or not mapped */
export const GEO_FALLBACK: GeoDefaults = { currency: 'GMD', language: 'en' };

// ─── Session Cache Key ─────────────────────────────────────

const SESSION_KEY = 'deltablue_geo';

export interface GeoResult {
    countryCode: string;
    currency: string;
    language: string;
    source: 'ipwhois' | 'cloudfunction' | 'cache' | 'fallback';
}

// ─── Primary: ipwhois.app ──────────────────────────────────

async function fetchFromIpWhois(): Promise<GeoResult | null> {
    try {
        const resp = await fetch('https://ipwhois.app/json/?objects=country_code', {
            signal: AbortSignal.timeout(4000),
        });
        if (!resp.ok) return null;
        const data = await resp.json();
        const cc: string = data?.country_code;
        if (!cc || cc.length !== 2) return null;

        const defaults = GEO_DEFAULTS[cc] || GEO_FALLBACK;
        return { countryCode: cc, ...defaults, source: 'ipwhois' };
    } catch {
        console.warn('[GeoService] ipwhois.app lookup failed');
        return null;
    }
}

// ─── Secondary: Cloud Function proxy ───────────────────────

async function fetchFromCloudFunction(): Promise<GeoResult | null> {
    try {
        // The CF is deployed at the same origin under /api/geolocate
        const resp = await fetch('/api/geolocate', {
            signal: AbortSignal.timeout(5000),
        });
        if (!resp.ok) return null;
        const data = await resp.json();
        const cc: string = data?.countryCode;
        if (!cc || cc.length !== 2) return null;

        const defaults = GEO_DEFAULTS[cc] || GEO_FALLBACK;
        return { countryCode: cc, ...defaults, source: 'cloudfunction' };
    } catch {
        console.warn('[GeoService] Cloud Function geo-lookup failed');
        return null;
    }
}

// ─── Public API ────────────────────────────────────────────

/**
 * Detect the visitor's locale from their IP address.
 *
 * Resolution order:
 *   1. sessionStorage cache (avoids repeated API calls)
 *   2. ipwhois.app  (free, commercial OK)
 *   3. Cloud Function proxy  (/api/geolocate)
 *   4. Fallback: GMD + English
 */
export async function detectGeoLocale(): Promise<GeoResult> {
    // 1. Return session cache if present
    try {
        const cached = sessionStorage.getItem(SESSION_KEY);
        if (cached) {
            const parsed: GeoResult = JSON.parse(cached);
            parsed.source = 'cache';
            return parsed;
        }
    } catch { /* sessionStorage may be unavailable */ }

    // 2. Primary — ipwhois.app
    let result = await fetchFromIpWhois();

    // 3. Secondary — Cloud Function proxy
    if (!result) {
        result = await fetchFromCloudFunction();
    }

    // 4. Fallback
    if (!result) {
        result = { countryCode: 'GM', ...GEO_FALLBACK, source: 'fallback' };
    }

    // Cache in sessionStorage
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(result));
    } catch { /* ignore */ }

    return result;
}

/**
 * Clear the geo cache (useful when user explicitly changes locale).
 */
export function clearGeoCache(): void {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}
