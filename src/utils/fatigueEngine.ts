/**
 * ═══════════════════════════════════════════════════════════
 * Fatigue Risk Management Engine
 * ═══════════════════════════════════════════════════════════
 * Bio-mathematical fatigue scoring inspired by the SAFTE/FAST
 * (Sleep, Activity, Fatigue & Task Effectiveness) process.
 *
 * Produces a 0–100 Fatigue Score where:
 *   100 = fully rested          ≥70 = LOW risk
 *   50–69 = MODERATE risk       40–49 = ELEVATED risk
 *   <40 = HIGH risk (operational concern)
 */

import type { DutyLogEntry } from './ftlEngine';
import { FTL_LIMITS } from './ftlEngine';

// ─── Types ──────────────────────────────────────────────────

export type FatigueRiskTier = 'low' | 'moderate' | 'elevated' | 'high';

export interface SleepEntry {
    id: string;
    crewId: string;
    date: string;            // YYYY-MM-DD
    hoursSlept: number;      // 0–16
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    notes?: string;
    createdAt?: any;
}

export interface FatigueAssessment {
    score: number;           // 0–100
    tier: FatigueRiskTier;
    breakdown: FatigueBreakdown;
    recommendations: string[];
}

export interface FatigueBreakdown {
    circadianPenalty: number;       // 0–25 (penalty for WOCL overlap)
    cumulativeDutyPenalty: number;  // 0–25 (penalty for high duty load)
    restAdequacyBonus: number;      // 0–20 (bonus for adequate rest)
    sleepDebtPenalty: number;       // 0–20 (penalty for sleep deficit)
    timeZonePenalty: number;        // 0–10 (penalty for TZ crossings)
}

export interface FatigueTrend {
    date: string;
    score: number;
    tier: FatigueRiskTier;
    dutyHours: number;
    sleepHours: number | null;
}

// ─── Constants ──────────────────────────────────────────────

/** WOCL (Window of Circadian Low) is 02:00–06:00 local time */
const WOCL_START = 2;
const WOCL_END = 6;

/** Baseline sleep need (hours) */
const BASELINE_SLEEP_HOURS = 8;

/** Quality multipliers for self-reported sleep quality */
const QUALITY_MULTIPLIER: Record<SleepEntry['quality'], number> = {
    poor: 0.6,
    fair: 0.8,
    good: 1.0,
    excellent: 1.1,
};

/** Risk tier thresholds */
export const FATIGUE_THRESHOLDS = {
    LOW: 70,
    MODERATE: 50,
    ELEVATED: 40,
} as const;

/** Risk tier metadata for UI rendering */
export const TIER_META: Record<FatigueRiskTier, { label: string; color: string; bgColor: string; icon: string }> = {
    low:      { label: 'Low Risk',      color: 'text-emerald-700', bgColor: 'bg-emerald-50',  icon: 'check_circle' },
    moderate: { label: 'Moderate Risk',  color: 'text-amber-700',   bgColor: 'bg-amber-50',    icon: 'warning' },
    elevated: { label: 'Elevated Risk',  color: 'text-orange-700',  bgColor: 'bg-orange-50',   icon: 'error' },
    high:     { label: 'High Risk',      color: 'text-red-700',     bgColor: 'bg-red-50',      icon: 'dangerous' },
};

// ─── Score Calculation ──────────────────────────────────────

/**
 * Calculate the fatigue score for a crew member.
 *
 * @param dutyLogs   — Duty logs from the last 28 days
 * @param sleepLogs  — Optional self-reported sleep entries
 * @param tzChanges  — Optional number of timezone crossings in last 72h
 * @returns FatigueAssessment with 0–100 score
 */
export function calculateCrewFatigueScore(
    dutyLogs: DutyLogEntry[],
    sleepLogs: SleepEntry[] = [],
    tzChanges: number = 0,
): FatigueAssessment {
    // Start from 100 and apply penalties / bonuses
    const breakdown: FatigueBreakdown = {
        circadianPenalty: calcCircadianPenalty(dutyLogs),
        cumulativeDutyPenalty: calcCumulativeDutyPenalty(dutyLogs),
        restAdequacyBonus: calcRestAdequacyBonus(dutyLogs),
        sleepDebtPenalty: calcSleepDebtPenalty(sleepLogs),
        timeZonePenalty: calcTimeZonePenalty(tzChanges),
    };

    const rawScore = 100
        - breakdown.circadianPenalty
        - breakdown.cumulativeDutyPenalty
        + breakdown.restAdequacyBonus
        - breakdown.sleepDebtPenalty
        - breakdown.timeZonePenalty;

    const score = Math.max(0, Math.min(100, Math.round(rawScore)));
    const tier = getScoreTier(score);
    const recommendations = generateRecommendations(score, breakdown);

    return { score, tier, breakdown, recommendations };
}

/**
 * Get the risk tier for a given score.
 */
export function getScoreTier(score: number): FatigueRiskTier {
    if (score >= FATIGUE_THRESHOLDS.LOW) return 'low';
    if (score >= FATIGUE_THRESHOLDS.MODERATE) return 'moderate';
    if (score >= FATIGUE_THRESHOLDS.ELEVATED) return 'elevated';
    return 'high';
}

// ─── Sub-Calculators ────────────────────────────────────────

/**
 * Circadian penalty (0–25): duty overlap with WOCL (02:00–06:00).
 * More overlap in recent 72h → higher penalty.
 */
function calcCircadianPenalty(logs: DutyLogEntry[]): number {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 72 * 60 * 60 * 1000); // 72h window

    let totalWoclMinutes = 0;

    for (const log of logs) {
        const logDate = new Date(log.date + 'T00:00:00');
        if (logDate < cutoff) continue;

        // Parse report & release times
        const [rH, rM] = log.reportTime.split(':').map(Number);
        const [eH, eM] = log.releaseTime.split(':').map(Number);

        // Calculate WOCL overlap minutes
        const dutyStart = rH + rM / 60;
        let dutyEnd = eH + eM / 60;
        if (dutyEnd <= dutyStart) dutyEnd += 24; // crosses midnight

        // Check overlap with WOCL band [2, 6]
        const overlapStart = Math.max(dutyStart, WOCL_START);
        const overlapEnd = Math.min(dutyEnd, WOCL_END);
        if (overlapEnd > overlapStart) {
            totalWoclMinutes += (overlapEnd - overlapStart) * 60;
        }

        // Also check if duty wraps past midnight into WOCL next day
        if (dutyEnd > 24) {
            const wrapStart = Math.max(0, WOCL_START);
            const wrapEnd = Math.min(dutyEnd - 24, WOCL_END);
            if (wrapEnd > wrapStart) {
                totalWoclMinutes += (wrapEnd - wrapStart) * 60;
            }
        }
    }

    // Max 25 points: 4h of WOCL exposure in 72h → full penalty
    return Math.min(25, Math.round((totalWoclMinutes / 240) * 25));
}

/**
 * Cumulative duty penalty (0–25): based on 7d and 28d duty utilization.
 */
function calcCumulativeDutyPenalty(logs: DutyLogEntry[]): number {
    const now = new Date();
    const cutoff7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const cutoff28 = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    let duty7d = 0;
    let duty28d = 0;
    let consecutiveDays = 0;
    let maxConsecutive = 0;

    // Sort logs by date
    const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    let lastDate = '';

    for (const log of sortedLogs) {
        const logDate = new Date(log.date + 'T00:00:00');
        const dutyH = log.totalDutyMinutes / 60;

        if (logDate >= cutoff7) duty7d += dutyH;
        if (logDate >= cutoff28) duty28d += dutyH;

        // Track consecutive days
        if (lastDate) {
            const prevDate = new Date(lastDate + 'T00:00:00');
            const dayDiff = Math.round((logDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
            if (dayDiff === 1) {
                consecutiveDays++;
                maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
            } else {
                consecutiveDays = 1;
            }
        } else {
            consecutiveDays = 1;
        }
        lastDate = log.date;
    }

    // 7-day utilization (0–12 penalty)
    const util7d = duty7d / FTL_LIMITS.ROLLING_7D_DUTY_HOURS;
    const penalty7d = Math.min(12, Math.round(util7d * 12));

    // 28-day utilization (0–8 penalty)
    const util28d = duty28d / FTL_LIMITS.ROLLING_28D_DUTY_HOURS;
    const penalty28d = Math.min(8, Math.round(util28d * 8));

    // Consecutive days (0–5 penalty)
    const consecutivePenalty = Math.min(5, Math.max(0, maxConsecutive - 3));

    return Math.min(25, penalty7d + penalty28d + consecutivePenalty);
}

/**
 * Rest adequacy bonus (0–20): reward for having good rest periods.
 */
function calcRestAdequacyBonus(logs: DutyLogEntry[]): number {
    if (logs.length === 0) return 20; // No recent duty → fully rested

    const now = new Date();
    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentLogs = logs.filter(l => new Date(l.date + 'T00:00:00') >= cutoff);

    if (recentLogs.length === 0) return 20;

    // Average rest before FDP
    const avgRest = recentLogs.reduce((sum, l) => sum + (l.restBeforeMinutes || 0), 0) / recentLogs.length;
    const avgRestHours = avgRest / 60;

    // 10h min rest → 0 bonus, 14h+ rest → full 20 bonus
    if (avgRestHours >= 14) return 20;
    if (avgRestHours <= FTL_LIMITS.MIN_REST_HOURS) return 0;
    return Math.round(((avgRestHours - FTL_LIMITS.MIN_REST_HOURS) / 4) * 20);
}

/**
 * Sleep debt penalty (0–20): based on crew-reported sleep vs 8h baseline.
 */
function calcSleepDebtPenalty(sleepLogs: SleepEntry[]): number {
    if (sleepLogs.length === 0) return 5; // No data → mild default penalty

    const now = new Date();
    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentSleep = sleepLogs.filter(s => new Date(s.date) >= cutoff);

    if (recentSleep.length === 0) return 5;

    // Calculate effective sleep (hours × quality multiplier)
    let totalDebt = 0;
    for (const entry of recentSleep) {
        const effective = entry.hoursSlept * QUALITY_MULTIPLIER[entry.quality];
        totalDebt += Math.max(0, BASELINE_SLEEP_HOURS - effective);
    }

    // Average daily debt
    const avgDailyDebt = totalDebt / recentSleep.length;

    // 0 debt → 0 penalty, 4h+ avg daily debt → full 20 penalty
    return Math.min(20, Math.round((avgDailyDebt / 4) * 20));
}

/**
 * Timezone penalty (0–10): based on number of timezone crossings in last 72h.
 */
function calcTimeZonePenalty(tzChanges: number): number {
    // 0 crossings → 0, 5+ crossings → full 10 penalty
    return Math.min(10, Math.round((tzChanges / 5) * 10));
}

// ─── Recommendations ────────────────────────────────────────

function generateRecommendations(score: number, breakdown: FatigueBreakdown): string[] {
    const recs: string[] = [];

    if (score < FATIGUE_THRESHOLDS.ELEVATED) {
        recs.push('CRITICAL: Consider removing from flight duties until fatigue score recovers above 50');
    }

    if (breakdown.circadianPenalty > 15) {
        recs.push('Reduce WOCL (02:00–06:00) duty exposure — consider roster adjustment');
    }

    if (breakdown.cumulativeDutyPenalty > 18) {
        recs.push('High cumulative duty load — schedule 36h+ rest break within next 48h');
    }

    if (breakdown.restAdequacyBonus < 5) {
        recs.push('Short rest periods detected — ensure minimum 12h rest between FDPs');
    }

    if (breakdown.sleepDebtPenalty > 12) {
        recs.push('Significant sleep debt — recommend extended off-duty recovery period');
    }

    if (breakdown.timeZonePenalty > 5) {
        recs.push('Multiple timezone crossings — allow circadian adjustment time before next duty');
    }

    if (recs.length === 0) {
        recs.push('Fatigue levels within acceptable range — continue normal operations');
    }

    return recs;
}

// ─── Trend Helpers ──────────────────────────────────────────

/**
 * Calculate fatigue trend for the last N days.
 */
export function calculateFatigueTrend(
    dutyLogs: DutyLogEntry[],
    sleepLogs: SleepEntry[],
    days: number = 7,
): FatigueTrend[] {
    const trend: FatigueTrend[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().slice(0, 10);

        // Get logs up to this date (rolling window)
        const logsToDate = dutyLogs.filter(l => l.date <= dateStr);
        const sleepToDate = sleepLogs.filter(s => s.date <= dateStr);

        const assessment = calculateCrewFatigueScore(logsToDate, sleepToDate);
        const daySleep = sleepLogs.find(s => s.date === dateStr);
        const dayDuty = dutyLogs.find(l => l.date === dateStr);

        trend.push({
            date: dateStr,
            score: assessment.score,
            tier: assessment.tier,
            dutyHours: dayDuty ? dayDuty.totalDutyMinutes / 60 : 0,
            sleepHours: daySleep ? daySleep.hoursSlept : null,
        });
    }

    return trend;
}

/**
 * Calculate fleet-wide fatigue summary.
 */
export function calculateFleetFatigueSummary(
    assessments: { crewId: string; crewName: string; assessment: FatigueAssessment }[],
): {
    avgScore: number;
    highRiskCount: number;
    elevatedRiskCount: number;
    moderateRiskCount: number;
    lowRiskCount: number;
    lowestScore: { crewId: string; crewName: string; score: number } | null;
} {
    if (assessments.length === 0) {
        return { avgScore: 100, highRiskCount: 0, elevatedRiskCount: 0, moderateRiskCount: 0, lowRiskCount: 0, lowestScore: null };
    }

    const avgScore = Math.round(assessments.reduce((s, a) => s + a.assessment.score, 0) / assessments.length);

    let lowest = assessments[0];
    for (const a of assessments) {
        if (a.assessment.score < lowest.assessment.score) lowest = a;
    }

    return {
        avgScore,
        highRiskCount: assessments.filter(a => a.assessment.tier === 'high').length,
        elevatedRiskCount: assessments.filter(a => a.assessment.tier === 'elevated').length,
        moderateRiskCount: assessments.filter(a => a.assessment.tier === 'moderate').length,
        lowRiskCount: assessments.filter(a => a.assessment.tier === 'low').length,
        lowestScore: { crewId: lowest.crewId, crewName: lowest.crewName, score: lowest.assessment.score },
    };
}

/**
 * Get the score color for rendering (CSS classes).
 */
export function getScoreColor(score: number): { text: string; bg: string; bar: string } {
    if (score >= FATIGUE_THRESHOLDS.LOW) return { text: 'text-emerald-700', bg: 'bg-emerald-50', bar: 'bg-emerald-500' };
    if (score >= FATIGUE_THRESHOLDS.MODERATE) return { text: 'text-amber-700', bg: 'bg-amber-50', bar: 'bg-amber-500' };
    if (score >= FATIGUE_THRESHOLDS.ELEVATED) return { text: 'text-orange-700', bg: 'bg-orange-50', bar: 'bg-orange-500' };
    return { text: 'text-red-700', bg: 'bg-red-50', bar: 'bg-red-500' };
}

/**
 * Calculate 7-day average sleep hours.
 */
export function calcAvgSleep(sleepLogs: SleepEntry[], days: number = 7): number {
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const recent = sleepLogs.filter(s => new Date(s.date) >= cutoff);
    if (recent.length === 0) return 0;
    return Math.round((recent.reduce((s, e) => s + e.hoursSlept, 0) / recent.length) * 10) / 10;
}

/**
 * Calculate cumulative sleep debt over N days vs 8h baseline.
 */
export function calcSleepDebt(sleepLogs: SleepEntry[], days: number = 7): number {
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const recent = sleepLogs.filter(s => new Date(s.date) >= cutoff);
    return Math.round(recent.reduce((debt, e) => debt + Math.max(0, BASELINE_SLEEP_HOURS - e.hoursSlept), 0) * 10) / 10;
}
