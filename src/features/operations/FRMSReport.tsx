import React, { useState, useEffect, useMemo } from 'react';
import { useToastStore } from '../../stores/toastStore';
import {
    subscribeToCrew, getDutyLogs, getAllSleepLogs,
    ROLE_META, type CrewMember, type SleepLogEntry,
} from '../../services/crewService';
import { FTL_LIMITS } from '../../utils/ftlEngine';
import {
    calculateCrewFatigueScore, calcSleepDebt,
    FATIGUE_THRESHOLDS, TIER_META, getScoreColor,
    type SleepEntry,
} from '../../utils/fatigueEngine';
import { downloadCSV } from '../../utils/tableExport';

// ─── Helpers ────────────────────────────────────────────

function toSleepEntry(e: SleepLogEntry): SleepEntry {
    return { id: e.id, crewId: e.crewId, date: e.date, hoursSlept: e.hoursSlept, quality: e.quality, notes: e.notes };
}

type ReportPeriod = 'monthly' | 'quarterly';

interface CrewReportRow {
    crewId: string;
    crewName: string;
    role: string;
    fatigueScore: number;
    fatigueRisk: string;
    totalDutyHours: number;
    totalFlightHours: number;
    avgRestHours: number;
    daysAboveFtlWarning: number;
    daysHighFatigue: number;
    maxConsecutiveDuty: number;
    sleepDebtDays: number;
}

// ═══════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════

const FRMSReport: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [crew, setCrew] = useState<CrewMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [period, setPeriod] = useState<ReportPeriod>('monthly');
    const [reportRows, setReportRows] = useState<CrewReportRow[]>([]);
    const [reportGenerated, setReportGenerated] = useState(false);

    // Date range for selected period
    const dateRange = useMemo(() => {
        const end = new Date();
        const start = new Date();
        if (period === 'monthly') {
            start.setMonth(start.getMonth() - 1);
        } else {
            start.setMonth(start.getMonth() - 3);
        }
        return {
            start: start.toISOString().slice(0, 10),
            end: end.toISOString().slice(0, 10),
            label: period === 'monthly'
                ? `${start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                : `${start.toLocaleDateString('en-US', { month: 'short' })} – ${end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
        };
    }, [period]);

    useEffect(() => {
        const unsub = subscribeToCrew(data => {
            setCrew(data.filter(c => c.status === 'active'));
            setLoading(false);
        });
        return unsub;
    }, []);

    const generateReport = async () => {
        setGenerating(true);
        try {
            const allSleep = await getAllSleepLogs();
            const rows: CrewReportRow[] = [];

            for (const m of crew) {
                const allLogs = await getDutyLogs(m.id);
                const periodLogs = allLogs.filter(l => l.date >= dateRange.start && l.date <= dateRange.end);
                const sleepForCrew = allSleep.filter(s => s.crewId === m.id).map(toSleepEntry);

                // Fatigue assessment
                const assessment = calculateCrewFatigueScore(allLogs, sleepForCrew);



                // Day-level metrics
                let daysAboveFtlWarning = 0;
                let daysHighFatigue = 0;
                let maxConsecutive = 0;
                let consecutive = 0;
                let totalRest = 0;
                const sortedLogs = [...periodLogs].sort((a, b) => a.date.localeCompare(b.date));
                let lastDate = '';

                for (const log of sortedLogs) {
                    // FTL warning check
                    const dailyDuty = log.totalDutyMinutes / 60;
                    if (dailyDuty > FTL_LIMITS.MAX_DAILY_DUTY_HOURS * FTL_LIMITS.WARNING_THRESHOLD) {
                        daysAboveFtlWarning++;
                    }

                    // Rest tracking
                    totalRest += log.restBeforeMinutes || 0;

                    // Consecutive
                    if (lastDate) {
                        const prev = new Date(lastDate + 'T00:00:00');
                        const curr = new Date(log.date + 'T00:00:00');
                        const diff = Math.round((curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
                        if (diff === 1) { consecutive++; maxConsecutive = Math.max(maxConsecutive, consecutive); }
                        else { consecutive = 1; }
                    } else { consecutive = 1; }
                    lastDate = log.date;
                }

                if (assessment.score < FATIGUE_THRESHOLDS.ELEVATED) daysHighFatigue++;

                const totalDuty = periodLogs.reduce((s, l) => s + l.totalDutyMinutes, 0) / 60;
                const totalFlight = periodLogs.reduce((s, l) => s + l.totalFlightMinutes, 0) / 60;
                const avgRest = sortedLogs.length > 0 ? (totalRest / sortedLogs.length) / 60 : 0;
                const sleepDebt = calcSleepDebt(sleepForCrew, period === 'monthly' ? 30 : 90);

                rows.push({
                    crewId: m.id,
                    crewName: m.name,
                    role: ROLE_META[m.role].label,
                    fatigueScore: assessment.score,
                    fatigueRisk: TIER_META[assessment.tier].label,
                    totalDutyHours: Math.round(totalDuty * 10) / 10,
                    totalFlightHours: Math.round(totalFlight * 10) / 10,
                    avgRestHours: Math.round(avgRest * 10) / 10,
                    daysAboveFtlWarning,
                    daysHighFatigue,
                    maxConsecutiveDuty: maxConsecutive,
                    sleepDebtDays: sleepDebt > 0 ? Math.ceil(sleepDebt / 8) : 0,
                });
            }

            setReportRows(rows.sort((a, b) => a.fatigueScore - b.fatigueScore));
            setReportGenerated(true);
            addToast('Report generated', 'success');
        } catch (err) {
            console.error('Report generation error:', err);
            addToast('Failed to generate report', 'error');
        }
        setGenerating(false);
    };

    const exportCSV = () => {
        const data = reportRows.map(r => ({
            'Crew Member': r.crewName,
            'Role': r.role,
            'Fatigue Score': r.fatigueScore,
            'Risk Level': r.fatigueRisk,
            'Duty Hours': r.totalDutyHours,
            'Flight Hours': r.totalFlightHours,
            'Avg Rest (h)': r.avgRestHours,
            'FTL Warning Days': r.daysAboveFtlWarning,
            'High Fatigue Days': r.daysHighFatigue,
            'Max Consecutive Duty': r.maxConsecutiveDuty,
            'Sleep Debt Days': r.sleepDebtDays,
        }));
        downloadCSV(data, `frms_report_${dateRange.start}_${dateRange.end}`);
        addToast('CSV exported', 'success');
    };

    // Summary stats
    const stats = useMemo(() => {
        if (reportRows.length === 0) return null;
        return {
            avgFatigue: Math.round(reportRows.reduce((s, r) => s + r.fatigueScore, 0) / reportRows.length),
            avgDuty: Math.round(reportRows.reduce((s, r) => s + r.totalDutyHours, 0) / reportRows.length * 10) / 10,
            avgFlight: Math.round(reportRows.reduce((s, r) => s + r.totalFlightHours, 0) / reportRows.length * 10) / 10,
            avgRest: Math.round(reportRows.reduce((s, r) => s + r.avgRestHours, 0) / reportRows.length * 10) / 10,
            highRiskCount: reportRows.filter(r => r.fatigueScore < FATIGUE_THRESHOLDS.ELEVATED).length,
            totalCrew: reportRows.length,
        };
    }, [reportRows]);

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in font-display print:p-4">
            {/* ── Print Header (hidden on screen) ──────── */}
            <div className="hidden print:block text-center space-y-2 pb-6 border-b-2 border-navy-200">
                <h1 className="text-2xl font-black uppercase">Deltablue Jet Air — FRMS Report</h1>
                <p className="text-sm font-bold text-navy-600">Fatigue Risk Management System — {period === 'monthly' ? 'Monthly' : 'Quarterly'} Report</p>
                <p className="text-xs text-navy-400">Period: {dateRange.label} | Generated: {new Date().toLocaleDateString()}</p>
                <p className="text-xs text-navy-400">Prepared in compliance with GCAA / ICAO Annex 6 FRMS requirements</p>
            </div>

            {/* ── Screen Header ────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">FRMS Report</h1>
                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-1">
                        GCAA Compliance • Automated Reporting • Export Ready
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-navy-50 rounded-xl p-1">
                        {(['monthly', 'quarterly'] as ReportPeriod[]).map(p => (
                            <button
                                key={p}
                                onClick={() => { setPeriod(p); setReportGenerated(false); }}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-white shadow text-navy-950' : 'text-navy-400'}`}
                            >{p}</button>
                        ))}
                    </div>
                    <button
                        onClick={generateReport}
                        disabled={generating}
                        className="h-12 px-6 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {generating ? <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-lg">summarize</span>}
                        Generate Report
                    </button>
                </div>
            </div>

            {!reportGenerated ? (
                <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm text-center py-20 space-y-4">
                    <span className="material-symbols-outlined text-6xl text-navy-200">description</span>
                    <p className="text-lg font-black text-navy-950">Ready to Generate</p>
                    <p className="text-sm text-navy-400 max-w-md mx-auto">
                        Select a period (monthly or quarterly) and click Generate to compile the FRMS compliance report.
                    </p>
                    <p className="text-xs text-navy-300">Period: {dateRange.label}</p>
                </div>
            ) : (
                <>
                    {/* ── Summary Cards ─────────────────────── */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 print:grid-cols-6">
                            {[
                                { label: 'Avg Fatigue', value: stats.avgFatigue, color: getScoreColor(stats.avgFatigue) },
                                { label: 'Avg Duty (h)', value: stats.avgDuty, color: { text: 'text-navy-700', bg: 'bg-navy-50', bar: '' } },
                                { label: 'Avg Flight (h)', value: stats.avgFlight, color: { text: 'text-navy-700', bg: 'bg-navy-50', bar: '' } },
                                { label: 'Avg Rest (h)', value: stats.avgRest, color: { text: stats.avgRest >= 12 ? 'text-emerald-700' : 'text-amber-700', bg: stats.avgRest >= 12 ? 'bg-emerald-50' : 'bg-amber-50', bar: '' } },
                                { label: 'High Risk', value: stats.highRiskCount, color: { text: 'text-red-700', bg: 'bg-red-50', bar: '' } },
                                { label: 'Total Crew', value: stats.totalCrew, color: { text: 'text-navy-700', bg: 'bg-navy-50', bar: '' } },
                            ].map(card => (
                                <div key={card.label} className={`rounded-2xl border border-navy-100 p-4 print:p-2 ${card.color.bg}`}>
                                    <p className={`text-2xl font-black ${card.color.text} print:text-lg`}>{card.value}</p>
                                    <p className="text-[8px] font-black text-navy-400 uppercase tracking-widest">{card.label}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Main Report Table ─────────────────── */}
                    <div className="bg-white rounded-[2.5rem] print:rounded-none border border-navy-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-5 border-b border-navy-50 flex items-center justify-between print:hidden">
                            <h2 className="text-sm font-black text-navy-950 uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">table_chart</span>
                                Regulatory Metrics — Per Crew
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={exportCSV} className="h-9 px-4 bg-navy-50 text-navy-700 font-black uppercase text-[8px] tracking-widest rounded-xl hover:bg-navy-100 transition-all flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">download</span> CSV
                                </button>
                                <button onClick={() => window.print()} className="h-9 px-4 bg-navy-50 text-navy-700 font-black uppercase text-[8px] tracking-widest rounded-xl hover:bg-navy-100 transition-all flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">print</span> Print PDF
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left print:text-[9px]">
                                <thead>
                                    <tr className="text-[7px] font-black text-navy-400 uppercase tracking-widest border-b border-navy-100 print:border-navy-300">
                                        <th className="px-6 py-3 print:px-2">Crew Member</th>
                                        <th className="px-3 py-3 print:px-1">Role</th>
                                        <th className="px-3 py-3 print:px-1 text-center">Fatigue</th>
                                        <th className="px-3 py-3 print:px-1 text-center">Risk</th>
                                        <th className="px-3 py-3 print:px-1 text-center">Duty (h)</th>
                                        <th className="px-3 py-3 print:px-1 text-center">Flight (h)</th>
                                        <th className="px-3 py-3 print:px-1 text-center">Avg Rest</th>
                                        <th className="px-3 py-3 print:px-1 text-center">FTL Warn</th>
                                        <th className="px-3 py-3 print:px-1 text-center">High Fat.</th>
                                        <th className="px-3 py-3 print:px-1 text-center">Max Cons.</th>
                                        <th className="px-3 py-3 print:px-1 text-center">Sleep Debt</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-navy-50">
                                    {reportRows.map(r => {
                                        const colors = getScoreColor(r.fatigueScore);
                                        return (
                                            <tr key={r.crewId} className="hover:bg-navy-50/30 transition-all print:hover:bg-transparent">
                                                <td className="px-6 py-3 print:px-2 text-xs font-black text-navy-950">{r.crewName}</td>
                                                <td className="px-3 py-3 print:px-1 text-[9px] font-bold text-navy-500">{r.role}</td>
                                                <td className="px-3 py-3 print:px-1 text-center">
                                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black ${colors.bg} ${colors.text}`}>{r.fatigueScore}</span>
                                                </td>
                                                <td className="px-3 py-3 print:px-1 text-center text-[8px] font-black uppercase">{r.fatigueRisk}</td>
                                                <td className="px-3 py-3 print:px-1 text-center text-xs font-bold text-navy-700">{r.totalDutyHours}</td>
                                                <td className="px-3 py-3 print:px-1 text-center text-xs font-bold text-navy-700">{r.totalFlightHours}</td>
                                                <td className="px-3 py-3 print:px-1 text-center">
                                                    <span className={`text-xs font-bold ${r.avgRestHours >= 12 ? 'text-emerald-600' : r.avgRestHours >= 10 ? 'text-amber-600' : 'text-red-600'}`}>{r.avgRestHours}h</span>
                                                </td>
                                                <td className="px-3 py-3 print:px-1 text-center">
                                                    <span className={`text-xs font-black ${r.daysAboveFtlWarning > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{r.daysAboveFtlWarning}</span>
                                                </td>
                                                <td className="px-3 py-3 print:px-1 text-center">
                                                    <span className={`text-xs font-black ${r.daysHighFatigue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{r.daysHighFatigue}</span>
                                                </td>
                                                <td className="px-3 py-3 print:px-1 text-center">
                                                    <span className={`text-xs font-black ${r.maxConsecutiveDuty > 5 ? 'text-red-600' : 'text-navy-600'}`}>{r.maxConsecutiveDuty}</span>
                                                </td>
                                                <td className="px-3 py-3 print:px-1 text-center">
                                                    <span className={`text-xs font-black ${r.sleepDebtDays > 2 ? 'text-red-600' : 'text-emerald-600'}`}>{r.sleepDebtDays}d</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Print footer */}
                        <div className="hidden print:block px-6 py-4 border-t border-navy-200 text-center">
                            <p className="text-[8px] text-navy-400">Deltablue Jet Air — Fatigue Risk Management System • Report generated {new Date().toLocaleDateString()} • Compliant with GCAA/ICAO Annex 6</p>
                            <p className="text-[7px] text-navy-300 mt-1">This report is for regulatory compliance purposes. All data is based on actual duty records and crew-reported sleep data.</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default FRMSReport;
