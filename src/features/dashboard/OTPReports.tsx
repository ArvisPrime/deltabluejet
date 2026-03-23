import React, { useState, useEffect, useMemo } from 'react';
import { useToastStore } from '../../stores/toastStore';
import { getOTPData, exportToCSV, type OTPRow } from '../../services/reportingService';

const OTPReports: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [data, setData] = useState<OTPRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => { setLoading(true); try { setData(await getOTPData()); } catch { addToast('Failed to load', 'error'); } setLoading(false); })();
    }, []);

    const otpRate = useMemo(() => data.length > 0 ? Math.round((data.filter(d => d.onTime).length / data.length) * 100) : 0, [data]);
    const avgDelay = useMemo(() => { const delayed = data.filter(d => d.delayMinutes > 0); return delayed.length > 0 ? Math.round(delayed.reduce((s, d) => s + d.delayMinutes, 0) / delayed.length) : 0; }, [data]);
    const cancelled = data.filter(d => d.status === 'cancelled').length;

    const delayBuckets = useMemo(() => {
        const b = { onTime: 0, '16-30min': 0, '31-60min': 0, '61-120min': 0, '120+min': 0 };
        data.forEach(d => {
            if (d.delayMinutes <= 15) b.onTime++;
            else if (d.delayMinutes <= 30) b['16-30min']++;
            else if (d.delayMinutes <= 60) b['31-60min']++;
            else if (d.delayMinutes <= 120) b['61-120min']++;
            else b['120+min']++;
        });
        return b;
    }, [data]);

    const bucketColors: Record<string, string> = { onTime: 'bg-emerald-500', '16-30min': 'bg-amber-400', '31-60min': 'bg-amber-500', '61-120min': 'bg-red-400', '120+min': 'bg-red-600' };

    const handleExport = () => {
        exportToCSV(['Flight', 'Route', 'Date', 'Scheduled', 'Actual', 'Delay (min)', 'On Time', 'Status'], data.map(d => [d.flightNumber, d.route, d.date, d.scheduledDep, d.actualDep, d.delayMinutes, d.onTime ? 'Yes' : 'No', d.status]), 'otp_report');
        addToast('CSV exported', 'success');
    };

    if (loading) return <div className="h-full flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto font-display custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
                <div><h1 className="text-2xl font-black text-navy-950 tracking-tighter uppercase">On-Time Performance</h1><p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">Flight punctuality tracking (15-min DOT threshold)</p></div>
                <button onClick={handleExport} className="px-5 py-2.5 bg-navy-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">download</span>Export
                </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'OTP Rate', value: `${otpRate}%`, icon: 'timer', color: otpRate >= 80 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50' },
                    { label: 'Total Flights', value: data.length.toString(), icon: 'flight', color: 'text-primary bg-primary/10' },
                    { label: 'Avg Delay', value: `${avgDelay} min`, icon: 'schedule', color: 'text-amber-600 bg-amber-50' },
                    { label: 'Cancelled', value: cancelled.toString(), icon: 'cancel', color: 'text-red-600 bg-red-50' },
                ].map(m => (
                    <div key={m.label} className="bg-white rounded-2xl border border-navy-100 p-5">
                        <div className={`size-10 rounded-xl flex items-center justify-center mb-3 ${m.color}`}><span className="material-symbols-outlined">{m.icon}</span></div>
                        <p className="text-2xl font-black text-navy-950 tracking-tighter">{m.value}</p>
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{m.label}</p>
                    </div>
                ))}
            </div>

            {/* Delay Distribution */}
            <div className="bg-white rounded-2xl border border-navy-100 p-5 mb-6 max-w-2xl">
                <h3 className="text-xs font-black text-navy-900 uppercase tracking-widest mb-4">Delay Distribution</h3>
                <div className="flex h-6 rounded-full overflow-hidden">
                    {Object.entries(delayBuckets).map(([k, v]) => v > 0 && (
                        <div key={k} className={`${bucketColors[k]} transition-all`} style={{ width: `${(v / data.length) * 100}%` }} title={`${k}: ${v}`} />
                    ))}
                </div>
                <div className="flex flex-wrap gap-3 mt-3">
                    {Object.entries(delayBuckets).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-1.5">
                            <div className={`w-3 h-3 rounded-sm ${bucketColors[k]}`} />
                            <span className="text-[10px] font-bold text-navy-500">{k}: {v}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Delayed Flights */}
            <div className="bg-white rounded-2xl border border-navy-100 overflow-hidden max-w-3xl">
                <div className="p-4 border-b border-navy-100"><h3 className="text-xs font-black text-navy-900 uppercase tracking-widest">Recent Delayed Flights</h3></div>
                <table className="w-full text-left">
                    <thead><tr className="border-b border-navy-100">
                        {['Flight', 'Route', 'Date', 'Delay', 'Status'].map(h => <th key={h} className="px-4 py-2 text-[10px] font-black text-navy-400 uppercase tracking-widest">{h}</th>)}
                    </tr></thead>
                    <tbody>
                        {data.filter(d => d.delayMinutes > 15).slice(0, 20).map((d, i) => (
                            <tr key={i} className="border-b border-navy-50">
                                <td className="px-4 py-2.5 text-sm font-black text-navy-900">{d.flightNumber}</td>
                                <td className="px-4 py-2.5 text-sm text-navy-600">{d.route}</td>
                                <td className="px-4 py-2.5 text-sm text-navy-600">{d.date}</td>
                                <td className="px-4 py-2.5"><span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${d.delayMinutes > 60 ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'}`}>{d.delayMinutes}min</span></td>
                                <td className="px-4 py-2.5"><span className="text-[10px] font-black text-navy-500 uppercase">{d.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OTPReports;
