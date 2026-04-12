/**
 * Local-date helpers — Deltablue Jet Air
 *
 * Uses local timezone (not UTC) to produce YYYY-MM-DD strings,
 * avoiding the classic "off-by-one day" bug caused by toISOString()
 * converting to UTC before slicing.
 */

/**
 * Returns a YYYY-MM-DD string for a Date object in the **local** timezone.
 * This avoids the common bug where toISOString().slice(0,10) returns
 * yesterday's date when the local time is before midnight UTC.
 */
export function toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Returns today's date as a YYYY-MM-DD string in the local timezone.
 */
export function todayString(): string {
    return toLocalDateString(new Date());
}
