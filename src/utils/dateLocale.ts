/**
 * Date/Time Locale Utilities — Deltablue Jet Air
 *
 * Locale-aware formatting using Intl.DateTimeFormat.
 * Reads locale from i18n or falls back to browser.
 */

import i18n from '../config/i18n';

// Map i18n language codes to Intl locale codes
const LOCALE_MAP: Record<string, string> = {
    en: 'en-GB',   // DD/MM/YYYY, 24h convention for aviation
    fr: 'fr-FR',
    ar: 'ar-SA',
};

function getLocale(): string {
    return LOCALE_MAP[i18n.language] || 'en-GB';
}

/**
 * Format a date (e.g. "23 Mar 2026" in en-GB, "23 mars 2026" in fr-FR)
 */
export function formatDate(date: Date | string | number, style: 'short' | 'medium' | 'long' = 'medium'): string {
    const d = date instanceof Date ? date : new Date(date);

    const optionsMap: Record<string, Intl.DateTimeFormatOptions> = {
        short: { day: '2-digit' as const, month: '2-digit' as const, year: 'numeric' as const },
        medium: { day: 'numeric' as const, month: 'short' as const, year: 'numeric' as const },
        long: { day: 'numeric' as const, month: 'long' as const, year: 'numeric' as const, weekday: 'long' as const },
    };

    return new Intl.DateTimeFormat(getLocale(), optionsMap[style]).format(d);
}

/**
 * Format a time (e.g. "14:30" in 24h, "2:30 PM" in 12h)
 */
export function formatTime(date: Date | string | number, use24h: boolean = true): string {
    const d = date instanceof Date ? date : new Date(date);

    return new Intl.DateTimeFormat(getLocale(), {
        hour: '2-digit',
        minute: '2-digit',
        hour12: !use24h,
    }).format(d);
}

/**
 * Format date and time together (e.g. "23 Mar 2026, 14:30")
 */
export function formatDateTime(date: Date | string | number, style: 'short' | 'medium' | 'long' = 'medium'): string {
    const d = date instanceof Date ? date : new Date(date);

    const dateStr = formatDate(d, style);
    const timeStr = formatTime(d);
    return `${dateStr}, ${timeStr}`;
}

/**
 * Format a duration in hours and minutes (e.g. "2h 45m")
 */
export function formatDuration(minutes: number): string {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
}

/**
 * Get the relative time string (e.g. "in 3 hours", "2 days ago")
 */
export function formatRelativeTime(date: Date | string | number): string {
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' });

    if (Math.abs(diffMins) < 60) return rtf.format(diffMins, 'minute');
    if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
    return rtf.format(diffDays, 'day');
}
