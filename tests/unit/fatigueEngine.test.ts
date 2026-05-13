import { describe, it, expect } from 'vitest';
import {
    calculateCrewFatigueScore, getScoreTier, calculateFleetFatigueSummary,
    calcAvgSleep, calcSleepDebt, getScoreColor, FATIGUE_THRESHOLDS,
    type SleepEntry, type FatigueRiskTier,
} from '../../src/utils/fatigueEngine';
import type { DutyLogEntry } from '../../src/utils/ftlEngine';

function makeDutyLog(overrides: Partial<DutyLogEntry> = {}): DutyLogEntry {
    return {
        id: 'log-1', crewId: 'crew-1', date: new Date().toISOString().slice(0, 10),
        reportTime: '06:00', releaseTime: '14:00',
        totalDutyMinutes: 480, totalFlightMinutes: 360, totalLegs: 2,
        restBeforeMinutes: 840, legs: [], status: 'completed', ...overrides,
    };
}

function makeSleepEntry(overrides: Partial<SleepEntry> = {}): SleepEntry {
    return {
        id: 'sleep-1', crewId: 'crew-1',
        date: new Date().toISOString().slice(0, 10),
        hoursSlept: 8, quality: 'good', ...overrides,
    };
}

function recentDate(daysAgo: number): string {
    const d = new Date(); d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
}

// ═══════════════════════════════════════════════════════════
// getScoreTier
// ═══════════════════════════════════════════════════════════

describe('getScoreTier', () => {
    it('low >= 70', () => expect(getScoreTier(70)).toBe('low'));
    it('low = 100', () => expect(getScoreTier(100)).toBe('low'));
    it('moderate 50-69', () => { expect(getScoreTier(69)).toBe('moderate'); expect(getScoreTier(50)).toBe('moderate'); });
    it('elevated 40-49', () => { expect(getScoreTier(49)).toBe('elevated'); expect(getScoreTier(40)).toBe('elevated'); });
    it('high < 40', () => { expect(getScoreTier(39)).toBe('high'); expect(getScoreTier(0)).toBe('high'); });
});

// ═══════════════════════════════════════════════════════════
// calculateCrewFatigueScore
// ═══════════════════════════════════════════════════════════

describe('calculateCrewFatigueScore', () => {
    it('returns 100 (fully rested) with no duty or sleep data', () => {
        const result = calculateCrewFatigueScore([], []);
        // No duty → rest bonus = 20, no sleep → default penalty 5, no circadian/tz
        // 100 - 0 - 0 + 20 - 5 - 0 = 115 → clamped to 100
        expect(result.score).toBeLessThanOrEqual(100);
        expect(result.score).toBeGreaterThanOrEqual(80);
        expect(result.tier).toBe('low');
    });

    it('returns lower score with heavy duty', () => {
        const logs = Array.from({ length: 7 }, (_, i) => makeDutyLog({
            id: `log-${i}`, date: recentDate(i),
            totalDutyMinutes: 780, // 13h per day (near max)
            restBeforeMinutes: 600, // only 10h rest
        }));
        const result = calculateCrewFatigueScore(logs);
        expect(result.score).toBeLessThan(80);
    });

    it('penalizes poor sleep', () => {
        // Use some duty logs so the baseline isn't clamped at 100
        const dutyLogs = Array.from({ length: 5 }, (_, i) => makeDutyLog({
            id: `d-${i}`, date: recentDate(i), totalDutyMinutes: 600,
        }));
        const sleepLogs = Array.from({ length: 7 }, (_, i) => makeSleepEntry({
            id: `s-${i}`, date: recentDate(i), hoursSlept: 4, quality: 'poor',
        }));
        const noSleep = calculateCrewFatigueScore(dutyLogs, []);
        const poorSleep = calculateCrewFatigueScore(dutyLogs, sleepLogs);
        expect(poorSleep.score).toBeLessThan(noSleep.score);
    });

    it('penalizes timezone changes', () => {
        // Use some duty logs so the baseline isn't clamped at 100
        const dutyLogs = Array.from({ length: 5 }, (_, i) => makeDutyLog({
            id: `d-${i}`, date: recentDate(i), totalDutyMinutes: 600,
        }));
        const noTz = calculateCrewFatigueScore(dutyLogs, [], 0);
        const heavyTz = calculateCrewFatigueScore(dutyLogs, [], 5);
        expect(heavyTz.score).toBeLessThan(noTz.score);
    });

    it('generates recommendations for high-risk score', () => {
        const logs = Array.from({ length: 7 }, (_, i) => makeDutyLog({
            id: `log-${i}`, date: recentDate(i),
            totalDutyMinutes: 780, restBeforeMinutes: 600,
            reportTime: '02:00', releaseTime: '15:00', // overlaps WOCL
        }));
        const sleepLogs = Array.from({ length: 7 }, (_, i) => makeSleepEntry({
            id: `s-${i}`, date: recentDate(i), hoursSlept: 3, quality: 'poor',
        }));
        const result = calculateCrewFatigueScore(logs, sleepLogs, 4);
        expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('clamps score to 0-100 range', () => {
        // Even extreme inputs shouldn't go out of bounds
        const extreme = calculateCrewFatigueScore(
            Array.from({ length: 28 }, (_, i) => makeDutyLog({
                id: `log-${i}`, date: recentDate(i), totalDutyMinutes: 840,
                reportTime: '02:00', releaseTime: '16:00', restBeforeMinutes: 480,
            })),
            Array.from({ length: 7 }, (_, i) => makeSleepEntry({
                id: `s-${i}`, date: recentDate(i), hoursSlept: 2, quality: 'poor',
            })),
            10,
        );
        expect(extreme.score).toBeGreaterThanOrEqual(0);
        expect(extreme.score).toBeLessThanOrEqual(100);
    });

    it('breakdown fields are all numbers', () => {
        const result = calculateCrewFatigueScore([], []);
        const b = result.breakdown;
        expect(typeof b.circadianPenalty).toBe('number');
        expect(typeof b.cumulativeDutyPenalty).toBe('number');
        expect(typeof b.restAdequacyBonus).toBe('number');
        expect(typeof b.sleepDebtPenalty).toBe('number');
        expect(typeof b.timeZonePenalty).toBe('number');
    });
});

// ═══════════════════════════════════════════════════════════
// calculateFleetFatigueSummary
// ═══════════════════════════════════════════════════════════

describe('calculateFleetFatigueSummary', () => {
    it('handles empty fleet', () => {
        const summary = calculateFleetFatigueSummary([]);
        expect(summary.avgScore).toBe(100);
        expect(summary.lowestScore).toBeNull();
    });

    it('calculates correct counts', () => {
        const assessments = [
            { crewId: 'c1', crewName: 'Alice', assessment: { score: 80, tier: 'low' as FatigueRiskTier, breakdown: {} as any, recommendations: [] } },
            { crewId: 'c2', crewName: 'Bob', assessment: { score: 55, tier: 'moderate' as FatigueRiskTier, breakdown: {} as any, recommendations: [] } },
            { crewId: 'c3', crewName: 'Charlie', assessment: { score: 35, tier: 'high' as FatigueRiskTier, breakdown: {} as any, recommendations: [] } },
        ];
        const summary = calculateFleetFatigueSummary(assessments);
        expect(summary.lowRiskCount).toBe(1);
        expect(summary.moderateRiskCount).toBe(1);
        expect(summary.highRiskCount).toBe(1);
        expect(summary.lowestScore?.crewName).toBe('Charlie');
        expect(summary.avgScore).toBe(57); // (80+55+35)/3 = 56.67 → 57
    });
});

// ═══════════════════════════════════════════════════════════
// Helper functions
// ═══════════════════════════════════════════════════════════

describe('calcAvgSleep', () => {
    it('returns 0 for no data', () => expect(calcAvgSleep([])).toBe(0));
    it('averages recent sleep', () => {
        const logs = Array.from({ length: 7 }, (_, i) => makeSleepEntry({
            id: `s-${i}`, date: recentDate(i), hoursSlept: 7,
        }));
        expect(calcAvgSleep(logs)).toBe(7);
    });
});

describe('calcSleepDebt', () => {
    it('returns 0 for no data', () => expect(calcSleepDebt([])).toBe(0));
    it('calculates debt vs 8h baseline', () => {
        const logs = [makeSleepEntry({ date: recentDate(0), hoursSlept: 6 })];
        expect(calcSleepDebt(logs)).toBe(2); // 8 - 6 = 2h debt
    });
    it('no debt when sleeping 8h+', () => {
        const logs = [makeSleepEntry({ date: recentDate(0), hoursSlept: 9 })];
        expect(calcSleepDebt(logs)).toBe(0);
    });
});

describe('getScoreColor', () => {
    it('emerald for low risk', () => expect(getScoreColor(80).bar).toBe('bg-emerald-500'));
    it('amber for moderate', () => expect(getScoreColor(60).bar).toBe('bg-amber-500'));
    it('orange for elevated', () => expect(getScoreColor(45).bar).toBe('bg-orange-500'));
    it('red for high', () => expect(getScoreColor(30).bar).toBe('bg-red-500'));
});

describe('FATIGUE_THRESHOLDS', () => {
    it('correct values', () => {
        expect(FATIGUE_THRESHOLDS.LOW).toBe(70);
        expect(FATIGUE_THRESHOLDS.MODERATE).toBe(50);
        expect(FATIGUE_THRESHOLDS.ELEVATED).toBe(40);
    });
});
