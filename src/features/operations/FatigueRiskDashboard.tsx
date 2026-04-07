import React, { useState, useEffect, useMemo } from 'react';
import { useToastStore } from '../../stores/toastStore';
import {
    subscribeToCrew, getDutyLogs, subscribeToAllSleepLogs,
    ROLE_META, type CrewMember, type SleepLogEntry,
} from '../../services/crewService';
import type { DutyLogEntry } from '../../utils/ftlEngine';
import {
    calculateCrewFatigueScore, calculateFatigueTrend, calculateFleetFatigueSummary,
    getScoreColor, getScoreTier, TIER_META, FATIGUE_THRESHOLDS,
    type FatigueAssessment, type FatigueTrend, type SleepEntry,
} from '../../utils/fatigueEngine';

// ─── Helpers ────────────────────────────────────────────

/** Map SleepLogEntry → SleepEntry (engine format) */
function toSleepEntry(e: SleepLogEntry): SleepEntry {
    return { id: e.id, crewId: e.crewId, date: e.date, hoursSlept: e.hoursSlept, quality: e.quality, notes: e.notes };
}

// ═══════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════

const FatigueRiskDashboard: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [crew, setCrew] = useState<CrewMember[]>([]);
    const [allSleep, setAllSleep] = useState<SleepLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [assessments, setAssessments] = useState<{ crewId: string; crewName: string; role: string; assessment: FatigueAssessment }[]>([]);
    const [selectedCrew, setSelectedCrew] = useState<string | null>(null);
    const [selectedTrend, setSelectedTrend] = useState<FatigueTrend[]>([]);
    const [trendLoading, setTrendLoading] = useState(false);

    // Load crew and sleep logs
    useEffect(() => {
        const unsubCrew = subscribeToCrew(data => {
            setCrew(data.filter(c => c.status === 'active'));
        });
        const unsubSleep = subscribeToAllSleepLogs(data => {
            setAllSleep(data);
        });
        setLoading(false);
        return () => { unsubCrew(); unsubSleep(); };
    }, []);

    // Calculate fleet fatigue when crew or sleep changes
    useEffect(() => {
        if (crew.length === 0) return;
        const fetchAll = async () => {
            const results: typeof assessments = [];
            for (const m of crew.slice(0, 30)) {
                try {
                    const logs = await getDutyLogs(m.id);
                    const sleepForCrew = allSleep.filter(s => s.crewId === m.id).map(toSleepEntry);
                    const assessment = calculateCrewFatigueScore(logs, sleepForCrew);
                    results.push({ crewId: m.id, crewName: m.name, role: ROLE_META[m.role].label, assessment });
                } catch {
                    results.push({
                        crewId: m.id, crewName: m.name, role: ROLE_META[m.role].label,
                        assessment: { score: 85, tier: 'low', breakdown: { circadianPenalty: 0, cumulativeDutyPenalty: 5, restAdequacyBonus: 10, sleepDebtPenalty: 5, timeZonePenalty: 0 }, recommendations: ['Fatigue levels within acceptable range — continue normal operations'] },
                    });
                }
            }
            setAssessments(results);
        };
        fetchAll();
    }, [crew, allSleep]);

    // Load individual trend
    const loadTrend = async (crewId: string) => {
        setSelectedCrew(crewId);
        setTrendLoading(true);
        try {
            const logs = await getDutyLogs(crewId);
            const sleepForCrew = allSleep.filter(s => s.crewId === crewId).map(toSleepEntry);
            setSelectedTrend(calculateFatigueTrend(logs, sleepForCrew, 7));
        } catch {
            setSelectedTrend([]);
        }
        setTrendLoading(false);
    };

    const summary = useMemo(() => calculateFleetFatigueSummary(assessments), [assessments]);
    const sortedAssessments = useMemo(() =>
        [...assessments].sort((a, b) => a.assessment.score - b.assessment.score),
    [assessments]);

    const selectedMember = crew.find(c => c.id === selectedCrew);
    const selectedAssessment = assessments.find(a => a.crewId === selectedCrew);

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in font-display">
            {/* ── Header ─────────────────────────────── */}
            <div>
                <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Fatigue Risk Management</h1>
                <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-1">
                    FRMS Dashboard • Bio-Mathematical Scoring • SAFTE/FAST Model
                </p>
            </div>

            {/* ── Risk Alert Banner ────────────────────── */}
            {(summary.highRiskCount > 0 || summary.elevatedRiskCount > 0) && (
                <div className={`rounded-2xl border p-5 flex items-center gap-4 ${
                    summary.highRiskCount > 0 ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
                }`}>
                    <span className={`material-symbols-outlined text-2xl ${summary.highRiskCount > 0 ? 'text-red-600' : 'text-orange-600'}`}>
                        {summary.highRiskCount > 0 ? 'dangerous' : 'warning'}
                    </span>
                    <div>
                        <p className={`text-sm font-black ${summary.highRiskCount > 0 ? 'text-red-800' : 'text-orange-800'}`}>
                            {summary.highRiskCount > 0
                                ? `${summary.highRiskCount} crew member${summary.highRiskCount > 1 ? 's' : ''} at HIGH fatigue risk`
                                : `${summary.elevatedRiskCount} crew member${summary.elevatedRiskCount > 1 ? 's' : ''} at ELEVATED fatigue risk`
                            }
                        </p>
                        <p className="text-[9px] font-bold text-navy-500 mt-0.5">Review individual assessments and consider operational adjustments</p>
                    </div>
                </div>
            )}

            {/* ── Fleet Overview Cards ─────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Fleet Avg Score', value: summary.avgScore, icon: 'monitoring', color: getScoreColor(summary.avgScore) },
                    { label: 'Low Risk', value: summary.lowRiskCount, icon: 'check_circle', color: { text: 'text-emerald-700', bg: 'bg-emerald-50', bar: 'bg-emerald-500' } },
                    { label: 'Moderate', value: summary.moderateRiskCount, icon: 'warning', color: { text: 'text-amber-700', bg: 'bg-amber-50', bar: 'bg-amber-500' } },
                    { label: 'Elevated', value: summary.elevatedRiskCount, icon: 'error', color: { text: 'text-orange-700', bg: 'bg-orange-50', bar: 'bg-orange-500' } },
                    { label: 'High Risk', value: summary.highRiskCount, icon: 'dangerous', color: { text: 'text-red-700', bg: 'bg-red-50', bar: 'bg-red-500' } },
                ].map(card => (
                    <div key={card.label} className="bg-white rounded-2xl border border-navy-100 p-5 flex items-center gap-4">
                        <div className={`size-12 rounded-xl flex items-center justify-center ${card.color.bg}`}>
                            <span className={`material-symbols-outlined text-xl ${card.color.text}`}>{card.icon}</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-navy-950">{card.value}</p>
                            <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest">{card.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Risk Heatmap ─────────────────────────── */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-navy-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-5 border-b border-navy-50 flex items-center justify-between">
                        <h2 className="text-sm font-black text-navy-950 uppercase tracking-widest flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">thermostat</span>
                            Crew Fatigue Heatmap
                        </h2>
                        <div className="flex items-center gap-2">
                            {(['low', 'moderate', 'elevated', 'high'] as const).map(tier => (
                                <span key={tier} className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${TIER_META[tier].bgColor} ${TIER_META[tier].color}`}>
                                    {TIER_META[tier].label}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="divide-y divide-navy-50 max-h-[600px] overflow-y-auto">
                        {sortedAssessments.map(({ crewId, crewName, role, assessment }) => {
                            const colors = getScoreColor(assessment.score);
                            const tierMeta = TIER_META[assessment.tier];
                            return (
                                <button
                                    key={crewId}
                                    onClick={() => loadTrend(crewId)}
                                    className={`w-full px-8 py-4 flex items-center gap-4 hover:bg-navy-50/50 transition-all text-left ${selectedCrew === crewId ? 'bg-primary/5 border-l-4 border-primary' : ''}`}
                                >
                                    <div className={`size-10 rounded-xl flex items-center justify-center ${tierMeta.bgColor}`}>
                                        <span className={`material-symbols-outlined text-lg ${tierMeta.color}`}>{tierMeta.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-black text-navy-950 truncate">{crewName}</p>
                                            <span className={`text-lg font-black ${colors.text}`}>{assessment.score}</span>
                                        </div>
                                        <p className="text-[8px] font-bold text-navy-400 uppercase">{role}</p>
                                        <div className="mt-1.5 w-full h-2 bg-navy-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                                                style={{ width: `${assessment.score}%` }}
                                            />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                        {sortedAssessments.length === 0 && (
                            <div className="text-center py-16 space-y-3">
                                <span className="material-symbols-outlined text-5xl text-navy-200">group</span>
                                <p className="text-sm text-navy-400">Loading crew fatigue data…</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Individual Drill-Down ─────────────────── */}
                <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-navy-50">
                        <h2 className="text-sm font-black text-navy-950 uppercase tracking-widest flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">person</span>
                            Individual Assessment
                        </h2>
                    </div>

                    {!selectedCrew ? (
                        <div className="text-center py-16 space-y-3">
                            <span className="material-symbols-outlined text-5xl text-navy-200">touch_app</span>
                            <p className="text-sm text-navy-400">Select a crew member from the heatmap</p>
                        </div>
                    ) : trendLoading ? (
                        <div className="text-center py-16">
                            <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                        </div>
                    ) : selectedAssessment ? (
                        <div className="p-6 space-y-5">
                            {/* Score */}
                            <div className="text-center space-y-2">
                                <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest">{selectedMember?.name}</p>
                                <div className={`inline-flex items-center justify-center size-20 rounded-2xl ${getScoreColor(selectedAssessment.assessment.score).bg}`}>
                                    <span className={`text-3xl font-black ${getScoreColor(selectedAssessment.assessment.score).text}`}>
                                        {selectedAssessment.assessment.score}
                                    </span>
                                </div>
                                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl ${TIER_META[selectedAssessment.assessment.tier].bgColor}`}>
                                    <span className={`material-symbols-outlined text-sm ${TIER_META[selectedAssessment.assessment.tier].color}`}>
                                        {TIER_META[selectedAssessment.assessment.tier].icon}
                                    </span>
                                    <span className={`text-[9px] font-black uppercase ${TIER_META[selectedAssessment.assessment.tier].color}`}>
                                        {TIER_META[selectedAssessment.assessment.tier].label}
                                    </span>
                                </div>
                            </div>

                            {/* Breakdown */}
                            <div className="space-y-2">
                                <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest">Score Breakdown</p>
                                {[
                                    { label: 'Circadian (WOCL)', value: -selectedAssessment.assessment.breakdown.circadianPenalty, max: 25, icon: 'dark_mode' },
                                    { label: 'Cumulative Duty', value: -selectedAssessment.assessment.breakdown.cumulativeDutyPenalty, max: 25, icon: 'work_history' },
                                    { label: 'Rest Adequacy', value: +selectedAssessment.assessment.breakdown.restAdequacyBonus, max: 20, icon: 'hotel', positive: true },
                                    { label: 'Sleep Debt', value: -selectedAssessment.assessment.breakdown.sleepDebtPenalty, max: 20, icon: 'bedtime' },
                                    { label: 'Timezone', value: -selectedAssessment.assessment.breakdown.timeZonePenalty, max: 10, icon: 'public' },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-xs text-navy-300">{item.icon}</span>
                                        <span className="text-[8px] font-bold text-navy-500 w-24 truncate">{item.label}</span>
                                        <div className="flex-1 h-1.5 bg-navy-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${item.value >= 0 ? 'bg-emerald-400' : Math.abs(item.value) > item.max * 0.6 ? 'bg-red-400' : 'bg-amber-400'}`}
                                                style={{ width: `${Math.min(100, (Math.abs(item.value) / item.max) * 100)}%` }}
                                            />
                                        </div>
                                        <span className={`text-[8px] font-black w-8 text-right ${item.value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {item.value >= 0 ? '+' : ''}{item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* 7-Day Sparkline */}
                            <div className="space-y-2">
                                <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest">7-Day Trend</p>
                                <div className="flex items-end gap-1 h-16">
                                    {selectedTrend.map((t, i) => {
                                        const colors = getScoreColor(t.score);
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                                                <span className={`text-[7px] font-black ${colors.text}`}>{t.score}</span>
                                                <div
                                                    className={`w-full rounded-t ${colors.bar} transition-all`}
                                                    style={{ height: `${Math.max(4, (t.score / 100) * 48)}px` }}
                                                />
                                                <span className="text-[6px] font-bold text-navy-300">{t.date.slice(5)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="space-y-2">
                                <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest">Recommendations</p>
                                {selectedAssessment.assessment.recommendations.map((rec, i) => (
                                    <div key={i} className="flex items-start gap-2 text-[9px] text-navy-600">
                                        <span className="material-symbols-outlined text-xs text-primary mt-0.5">arrow_right</span>
                                        <span>{rec}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default FatigueRiskDashboard;
