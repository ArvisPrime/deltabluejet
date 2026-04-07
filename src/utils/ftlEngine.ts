/**
 * ═══════════════════════════════════════════════════════════
 * FTL (Flight Time Limitations) Compliance Engine
 * ═══════════════════════════════════════════════════════════
 * Implements ICAO/EASA/GCAA-aligned flight duty period limits,
 * rolling counter calculations, rest validation, and automated
 * alert generation for crew fatigue management.
 */

// ─── Constants & Limits ─────────────────────────────────────

/** Regulatory limits aligned with EASA ORO.FTL / GCAA */
export const FTL_LIMITS = {
    /** Maximum daily Flight Duty Period varies by report time & sectors — see getMaxFDP() */
    MAX_DAILY_DUTY_HOURS: 14,

    /** Rolling period cumulative limits */
    ROLLING_7D_DUTY_HOURS: 60,
    ROLLING_14D_DUTY_HOURS: 110,
    ROLLING_28D_DUTY_HOURS: 190,
    ROLLING_28D_FLIGHT_HOURS: 100,
    ROLLING_365D_FLIGHT_HOURS: 1000,
    CALENDAR_YEAR_FLIGHT_HOURS: 900,

    /** Rest requirements */
    MIN_REST_HOURS: 10,           // Minimum rest before next FDP (incl. 8h sleep)
    MIN_WEEKLY_REST_HOURS: 30,    // 30 consecutive hours per 168h

    /** Consecutive duty days */
    MAX_CONSECUTIVE_DUTY_DAYS: 6,

    /** Alert thresholds */
    WARNING_THRESHOLD: 0.80,      // 80% → amber warning
    CRITICAL_THRESHOLD: 0.90,     // 90% → red alert
    BLOCK_THRESHOLD: 1.00,        // 100% → hard block
} as const;

// ─── FDP Calculator ─────────────────────────────────────────

/**
 * Maximum FDP (hours) based on EASA ORO.FTL.205 table structure.
 * Rows = report time window (local time hour), Cols = number of sectors.
 *
 * Returns the maximum FDP in hours for a given report time and sector count.
 */
const FDP_TABLE: { startHour: number; endHour: number; sectors: number[] }[] = [
    // Report time window  →  Max FDP by sectors: [1, 2, 3, 4, 5, 6, 7+]
    { startHour: 6,  endHour: 7,   sectors: [13.0, 12.5, 12.0, 11.5, 11.0, 10.5, 10.0] },
    { startHour: 7,  endHour: 8,   sectors: [13.0, 12.5, 12.0, 11.5, 11.0, 10.5, 10.0] },
    { startHour: 8,  endHour: 9,   sectors: [13.0, 12.5, 12.0, 11.5, 11.0, 10.5, 10.0] },
    { startHour: 9,  endHour: 10,  sectors: [13.0, 12.5, 12.0, 11.5, 11.0, 10.5, 10.0] },
    { startHour: 10, endHour: 11,  sectors: [12.75, 12.25, 11.75, 11.25, 10.75, 10.25, 9.75] },
    { startHour: 11, endHour: 12,  sectors: [12.50, 12.00, 11.50, 11.00, 10.50, 10.00, 9.50] },
    { startHour: 12, endHour: 13,  sectors: [12.25, 11.75, 11.25, 10.75, 10.25, 9.75, 9.25] },
    { startHour: 13, endHour: 14,  sectors: [12.00, 11.50, 11.00, 10.50, 10.00, 9.50, 9.00] },
    { startHour: 14, endHour: 15,  sectors: [12.00, 11.50, 11.00, 10.50, 10.00, 9.50, 9.00] },
    { startHour: 15, endHour: 16,  sectors: [12.00, 11.50, 11.00, 10.50, 10.00, 9.50, 9.00] },
    { startHour: 16, endHour: 17,  sectors: [12.00, 11.50, 11.00, 10.50, 10.00, 9.50, 9.00] },
    { startHour: 17, endHour: 18,  sectors: [11.50, 11.00, 10.50, 10.00, 9.50, 9.00, 9.00] },
    { startHour: 18, endHour: 19,  sectors: [11.00, 10.50, 10.00, 9.50, 9.00, 9.00, 9.00] },
    { startHour: 19, endHour: 20,  sectors: [11.00, 10.50, 10.00, 9.50, 9.00, 9.00, 9.00] },
    { startHour: 20, endHour: 21,  sectors: [11.00, 10.50, 10.00, 9.50, 9.00, 9.00, 9.00] },
    { startHour: 21, endHour: 22,  sectors: [11.00, 10.50, 10.00, 9.50, 9.00, 9.00, 9.00] },
    { startHour: 22, endHour: 5,   sectors: [11.00, 10.50, 10.00, 9.50, 9.00, 9.00, 9.00] },  // WOCL band
    { startHour: 5,  endHour: 6,   sectors: [12.00, 11.50, 11.00, 10.50, 10.00, 9.50, 9.00] },
];

/**
 * Get the maximum Flight Duty Period for a given report time and sector count.
 * @param reportHour - The hour (0-23) of local report time
 * @param sectorCount - Number of flight sectors (takeoff-landing cycles)
 * @returns Maximum FDP in hours
 */
export function getMaxFDP(reportHour: number, sectorCount: number): number {
    const clampedSectors = Math.min(Math.max(sectorCount, 1), 7);
    const sectorIndex = clampedSectors - 1;

    // Find the matching time window
    for (const row of FDP_TABLE) {
        if (row.startHour <= row.endHour) {
            // Normal range (e.g., 6–7)
            if (reportHour >= row.startHour && reportHour < row.endHour) {
                return row.sectors[sectorIndex];
            }
        } else {
            // Wrapping range (e.g., 22–5 = WOCL)
            if (reportHour >= row.startHour || reportHour < row.endHour) {
                return row.sectors[sectorIndex];
            }
        }
    }

    // Default fallback (most restrictive)
    return 9.0;
}

/**
 * Calculate the latest allowed duty end time given a report time and max FDP.
 * @returns ISO string or HH:mm formatted time
 */
export function getMaxDutyEnd(reportTime: Date, maxFdpHours: number): Date {
    const end = new Date(reportTime.getTime());
    const totalMinutes = Math.floor(maxFdpHours * 60);
    end.setMinutes(end.getMinutes() + totalMinutes);
    return end;
}

// ─── Types ──────────────────────────────────────────────────

export interface DutyLogEntry {
    id: string;
    crewId: string;
    date: string;             // YYYY-MM-DD
    reportTime: string;       // HH:mm (FDP start)
    releaseTime: string;      // HH:mm (FDP end)
    totalDutyMinutes: number;
    totalFlightMinutes: number;
    totalLegs: number;
    restBeforeMinutes: number;
    legs: FlightLegEntry[];
    status: 'planned' | 'active' | 'completed';
    notes?: string;
    createdAt?: any;
    updatedAt?: any;
}

export interface FlightLegEntry {
    flightNumber: string;
    departure: string;        // IATA
    arrival: string;          // IATA
    blockOff: string;         // HH:mm
    blockOn: string;          // HH:mm
    blockMinutes: number;
    position: 'operating' | 'deadhead';
}

export interface FtlCounters {
    rolling7d:   { dutyHours: number; flightHours: number; legs: number };
    rolling14d:  { dutyHours: number };
    rolling28d:  { dutyHours: number; flightHours: number };
    rolling365d: { flightHours: number };
}

export type AlertSeverity = 'ok' | 'warning' | 'critical' | 'blocked';

export interface FtlAlert {
    severity: AlertSeverity;
    period: string;           // e.g. "7-day duty"
    metric: string;           // e.g. "Duty Hours"
    current: number;
    limit: number;
    percentage: number;
    message: string;
}

// ─── Rolling Counter Calculator ─────────────────────────────

/**
 * Calculate rolling FTL counters from an array of duty logs.
 * @param logs - All duty logs for a crew member (any date range — will be filtered)
 * @param referenceDate - The "today" date to calculate rolling windows from
 */
export function calculateFtlCounters(
    logs: DutyLogEntry[],
    referenceDate: Date = new Date(),
): FtlCounters {
    const refMs = referenceDate.getTime();

    const msPerDay = 24 * 60 * 60 * 1000;
    const cutoff7  = new Date(refMs - 7  * msPerDay);
    const cutoff14 = new Date(refMs - 14 * msPerDay);
    const cutoff28 = new Date(refMs - 28 * msPerDay);
    const cutoff365 = new Date(refMs - 365 * msPerDay);

    const counters: FtlCounters = {
        rolling7d:   { dutyHours: 0, flightHours: 0, legs: 0 },
        rolling14d:  { dutyHours: 0 },
        rolling28d:  { dutyHours: 0, flightHours: 0 },
        rolling365d: { flightHours: 0 },
    };

    for (const log of logs) {
        const logDate = new Date(log.date + 'T00:00:00');
        if (logDate > referenceDate) continue; // skip future

        const dutyH = log.totalDutyMinutes / 60;
        const flightH = log.totalFlightMinutes / 60;
        const legs = log.totalLegs || 0;

        if (logDate >= cutoff7) {
            counters.rolling7d.dutyHours += dutyH;
            counters.rolling7d.flightHours += flightH;
            counters.rolling7d.legs += legs;
        }
        if (logDate >= cutoff14) {
            counters.rolling14d.dutyHours += dutyH;
        }
        if (logDate >= cutoff28) {
            counters.rolling28d.dutyHours += dutyH;
            counters.rolling28d.flightHours += flightH;
        }
        if (logDate >= cutoff365) {
            counters.rolling365d.flightHours += flightH;
        }
    }

    return counters;
}

// ─── Alert Generator ────────────────────────────────────────

/**
 * Generate FTL alerts based on current counters vs regulatory limits.
 */
export function getFtlAlerts(counters: FtlCounters): FtlAlert[] {
    const alerts: FtlAlert[] = [];

    const checks: { period: string; metric: string; current: number; limit: number }[] = [
        { period: '7-Day', metric: 'Duty Hours',   current: counters.rolling7d.dutyHours,    limit: FTL_LIMITS.ROLLING_7D_DUTY_HOURS },
        { period: '14-Day', metric: 'Duty Hours',  current: counters.rolling14d.dutyHours,   limit: FTL_LIMITS.ROLLING_14D_DUTY_HOURS },
        { period: '28-Day', metric: 'Duty Hours',  current: counters.rolling28d.dutyHours,   limit: FTL_LIMITS.ROLLING_28D_DUTY_HOURS },
        { period: '28-Day', metric: 'Flight Hours', current: counters.rolling28d.flightHours, limit: FTL_LIMITS.ROLLING_28D_FLIGHT_HOURS },
        { period: '365-Day', metric: 'Flight Hours', current: counters.rolling365d.flightHours, limit: FTL_LIMITS.ROLLING_365D_FLIGHT_HOURS },
    ];

    for (const check of checks) {
        const percentage = check.limit > 0 ? check.current / check.limit : 0;
        let severity: AlertSeverity = 'ok';
        let message = '';

        if (percentage >= FTL_LIMITS.BLOCK_THRESHOLD) {
            severity = 'blocked';
            message = `${check.period} ${check.metric} LIMIT REACHED: ${check.current.toFixed(1)}h / ${check.limit}h`;
        } else if (percentage >= FTL_LIMITS.CRITICAL_THRESHOLD) {
            severity = 'critical';
            message = `${check.period} ${check.metric} at ${(percentage * 100).toFixed(0)}%: ${check.current.toFixed(1)}h / ${check.limit}h`;
        } else if (percentage >= FTL_LIMITS.WARNING_THRESHOLD) {
            severity = 'warning';
            message = `${check.period} ${check.metric} approaching limit: ${check.current.toFixed(1)}h / ${check.limit}h`;
        }

        alerts.push({
            severity,
            period: check.period,
            metric: check.metric,
            current: Math.round(check.current * 10) / 10,
            limit: check.limit,
            percentage: Math.round(percentage * 100),
            message,
        });
    }

    return alerts;
}

/**
 * Get the highest severity from a set of alerts.
 */
export function getOverallSeverity(alerts: FtlAlert[]): AlertSeverity {
    if (alerts.some(a => a.severity === 'blocked')) return 'blocked';
    if (alerts.some(a => a.severity === 'critical')) return 'critical';
    if (alerts.some(a => a.severity === 'warning')) return 'warning';
    return 'ok';
}

// ─── Rest Validator ─────────────────────────────────────────

/**
 * Check if minimum rest requirement is met between two duty periods.
 * @param previousReleaseTime - HH:mm of prior duty release
 * @param previousDate - YYYY-MM-DD of prior duty
 * @param nextReportTime - HH:mm of next duty report
 * @param nextDate - YYYY-MM-DD of next duty
 * @returns Object with `passed`, `restHours`, and `requiredHours`
 */
export function checkMinimumRest(
    previousReleaseTime: string,
    previousDate: string,
    nextReportTime: string,
    nextDate: string,
): { passed: boolean; restHours: number; requiredHours: number; message: string } {
    const prevEnd = new Date(`${previousDate}T${previousReleaseTime}:00`);
    const nextStart = new Date(`${nextDate}T${nextReportTime}:00`);

    const restMs = nextStart.getTime() - prevEnd.getTime();
    const restHours = restMs / (1000 * 60 * 60);

    return {
        passed: restHours >= FTL_LIMITS.MIN_REST_HOURS,
        restHours: Math.round(restHours * 10) / 10,
        requiredHours: FTL_LIMITS.MIN_REST_HOURS,
        message: restHours >= FTL_LIMITS.MIN_REST_HOURS
            ? `Rest period: ${restHours.toFixed(1)}h ✓`
            : `INSUFFICIENT REST: ${restHours.toFixed(1)}h < ${FTL_LIMITS.MIN_REST_HOURS}h minimum`,
    };
}

// ─── Utility Helpers ────────────────────────────────────────

/**
 * Calculate block time in minutes from HH:mm strings.
 */
export function calcBlockMinutes(blockOff: string, blockOn: string): number {
    const [offH, offM] = blockOff.split(':').map(Number);
    const [onH, onM] = blockOn.split(':').map(Number);
    let diff = (onH * 60 + onM) - (offH * 60 + offM);
    if (diff < 0) diff += 24 * 60; // crosses midnight
    return diff;
}

/**
 * Calculate total duty minutes from report and release times.
 */
export function calcDutyMinutes(reportTime: string, releaseTime: string): number {
    return calcBlockMinutes(reportTime, releaseTime);
}

/**
 * Format minutes as Xh Ym string.
 */
export function formatMinutesAsHM(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Format hours as X.Y string.
 */
export function formatHours(hours: number): string {
    return hours.toFixed(1);
}

/** Color helper for alert severity */
export function getSeverityColor(severity: AlertSeverity): { bg: string; text: string; border: string; bar: string } {
    switch (severity) {
        case 'blocked':  return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', bar: 'bg-red-500' };
        case 'critical': return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', bar: 'bg-red-400' };
        case 'warning':  return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'bg-amber-400' };
        default:         return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-400' };
    }
}
