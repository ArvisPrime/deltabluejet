/**
 * App Configuration — Deltablue Jet Air
 *
 * Operational constants that may vary per deployment.
 * Import from here instead of using magic numbers.
 */

export const APP_CONFIG = {
    /** Default currency for bookings and payments */
    defaultCurrency: 'USD',

    /** Supported currencies */
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'GMD'],

    /** Hours before departure that check-in opens */
    checkinWindowHours: 48,

    /** Hours before departure that check-in closes */
    checkinCloseHours: 1,

    /** Minutes before departure for boarding time */
    boardingTimeBeforeMinutes: 45,

    /** Phone country codes for passenger forms */
    phoneCodes: [
        { code: '+220', country: 'GM', label: 'Gambia' },
        { code: '+221', country: 'SN', label: 'Senegal' },
        { code: '+233', country: 'GH', label: 'Ghana' },
        { code: '+232', country: 'SL', label: 'Sierra Leone' },
        { code: '+224', country: 'GN', label: 'Guinea' },
        { code: '+245', country: 'GW', label: 'Guinea-Bissau' },
        { code: '+231', country: 'LR', label: 'Liberia' },
        { code: '+880', country: 'BD', label: 'Bangladesh' },
        { code: '+44', country: 'GB', label: 'UK' },
        { code: '+1', country: 'US', label: 'US' },
        { code: '+971', country: 'AE', label: 'UAE' },
        { code: '+90', country: 'TR', label: 'Turkey' },
    ],
};
