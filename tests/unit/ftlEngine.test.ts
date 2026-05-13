import { describe, it, expect } from 'vitest';
import {
    getMaxFDP, getMaxDutyEnd, calculateFtlCounters, getFtlAlerts,
    getOverallSeverity, checkMinimumRest, calcBlockMinutes, calcDutyMinutes,
    formatMinutesAsHM, formatHours, getSeverityColor, FTL_LIMITS,
    type DutyLogEntry,
} from '../../src/utils/ftlEngine';

function makeDutyLog(overrides: Partial<DutyLogEntry> = {}): DutyLogEntry {
    return {
        id: 'log-1', crewId: 'crew-1', date: '2026-05-10',
        reportTime: '06:00', releaseTime: '14:00',
        totalDutyMinutes: 480, totalFlightMinutes: 360, totalLegs: 2,
        restBeforeMinutes: 720, legs: [], status: 'completed', ...overrides,
    };
}

function makeLogs(count: number, base = '2026-05-10'): DutyLogEntry[] {
    return Array.from({ length: count }, (_, i) => {
        const d = new Date(base); d.setDate(d.getDate() - i);
        return makeDutyLog({ id: `log-${i}`, date: d.toISOString().slice(0, 10) });
    });
}

describe('getMaxFDP', () => {
    it('morning report 1 sector → 13h', () => expect(getMaxFDP(6, 1)).toBe(13.0));
    it('reduces with sectors', () => { expect(getMaxFDP(6, 3)).toBe(12.0); expect(getMaxFDP(6, 7)).toBe(10.0); });
    it('clamps sector 0→1', () => expect(getMaxFDP(6, 0)).toBe(13.0));
    it('clamps sector 10→7', () => expect(getMaxFDP(6, 10)).toBe(10.0));
    it('WOCL band restrictive', () => { expect(getMaxFDP(23, 1)).toBe(11.0); expect(getMaxFDP(3, 1)).toBe(11.0); });
    it('afternoon FDP', () => expect(getMaxFDP(14, 4)).toBe(10.5));
});

describe('getMaxDutyEnd', () => {
    it('adds FDP hours to report time', () => {
        const end = getMaxDutyEnd(new Date('2026-05-10T06:00:00'), 13.0);
        expect(end.getHours()).toBe(19);
    });
    it('handles fractional hours', () => {
        const end = getMaxDutyEnd(new Date('2026-05-10T06:00:00'), 12.5);
        expect(end.getHours()).toBe(18); expect(end.getMinutes()).toBe(30);
    });
    it('crosses midnight', () => {
        const end = getMaxDutyEnd(new Date('2026-05-10T18:00:00'), 11.0);
        expect(end.getDate()).toBe(11); expect(end.getHours()).toBe(5);
    });
});

describe('calculateFtlCounters', () => {
    it('zeroes for empty logs', () => {
        const c = calculateFtlCounters([]);
        expect(c.rolling7d.dutyHours).toBe(0); expect(c.rolling28d.flightHours).toBe(0);
    });
    it('accumulates 7d duty', () => {
        const c = calculateFtlCounters(makeLogs(5, '2026-05-10'), new Date('2026-05-10T12:00:00'));
        expect(c.rolling7d.dutyHours).toBe(40); expect(c.rolling7d.legs).toBe(10);
    });
    it('14d >= 7d', () => {
        const c = calculateFtlCounters(makeLogs(12, '2026-05-28'), new Date('2026-05-28T12:00:00'));
        expect(c.rolling14d.dutyHours).toBeGreaterThanOrEqual(c.rolling7d.dutyHours);
    });
});

describe('getFtlAlerts', () => {
    it('OK for zero counters', () => {
        getFtlAlerts(calculateFtlCounters([])).forEach(a => expect(a.severity).toBe('ok'));
    });
    it('warning at 83%', () => {
        const alerts = getFtlAlerts({ rolling7d: { dutyHours: 50, flightHours: 0, legs: 0 }, rolling14d: { dutyHours: 0 }, rolling28d: { dutyHours: 0, flightHours: 0 }, rolling365d: { flightHours: 0 } });
        expect(alerts.find(a => a.period === '7-Day')?.severity).toBe('warning');
    });
    it('blocked at 100%', () => {
        const alerts = getFtlAlerts({ rolling7d: { dutyHours: 60, flightHours: 0, legs: 0 }, rolling14d: { dutyHours: 0 }, rolling28d: { dutyHours: 0, flightHours: 0 }, rolling365d: { flightHours: 0 } });
        expect(alerts.find(a => a.period === '7-Day')?.severity).toBe('blocked');
    });
});

describe('getOverallSeverity', () => {
    it('ok when all ok', () => expect(getOverallSeverity(getFtlAlerts(calculateFtlCounters([])))).toBe('ok'));
    it('blocked wins', () => expect(getOverallSeverity([
        { severity: 'ok', period: '', metric: '', current: 0, limit: 60, percentage: 0, message: '' },
        { severity: 'blocked', period: '', metric: '', current: 60, limit: 60, percentage: 100, message: '' },
    ])).toBe('blocked'));
});

describe('checkMinimumRest', () => {
    it('passes at 16h rest', () => {
        const r = checkMinimumRest('14:00', '2026-05-10', '06:00', '2026-05-11');
        expect(r.passed).toBe(true); expect(r.restHours).toBe(16);
    });
    it('fails at 8h rest', () => {
        const r = checkMinimumRest('22:00', '2026-05-10', '06:00', '2026-05-11');
        expect(r.passed).toBe(false); expect(r.restHours).toBe(8);
    });
    it('passes exactly at 10h', () => {
        expect(checkMinimumRest('20:00', '2026-05-10', '06:00', '2026-05-11').passed).toBe(true);
    });
    it('message includes markers', () => {
        expect(checkMinimumRest('14:00', '2026-05-10', '06:00', '2026-05-11').message).toContain('✓');
        expect(checkMinimumRest('23:00', '2026-05-10', '06:00', '2026-05-11').message).toContain('INSUFFICIENT');
    });
});

describe('utility functions', () => {
    it('calcBlockMinutes normal', () => expect(calcBlockMinutes('08:00', '10:30')).toBe(150));
    it('calcBlockMinutes midnight', () => expect(calcBlockMinutes('23:00', '01:30')).toBe(150));
    it('calcDutyMinutes', () => expect(calcDutyMinutes('06:00', '14:00')).toBe(480));
    it('formatMinutesAsHM', () => { expect(formatMinutesAsHM(150)).toBe('2h 30m'); expect(formatMinutesAsHM(120)).toBe('2h'); });
    it('formatHours', () => expect(formatHours(12.55)).toBe('12.6'));
    it('getSeverityColor', () => { expect(getSeverityColor('blocked').text).toBe('text-red-700'); expect(getSeverityColor('ok').text).toBe('text-emerald-700'); });
});

describe('FTL_LIMITS constants', () => {
    it('regulatory limits', () => {
        expect(FTL_LIMITS.ROLLING_7D_DUTY_HOURS).toBe(60);
        expect(FTL_LIMITS.ROLLING_28D_DUTY_HOURS).toBe(190);
        expect(FTL_LIMITS.MIN_REST_HOURS).toBe(10);
    });
    it('thresholds', () => {
        expect(FTL_LIMITS.WARNING_THRESHOLD).toBe(0.80);
        expect(FTL_LIMITS.CRITICAL_THRESHOLD).toBe(0.90);
    });
});
