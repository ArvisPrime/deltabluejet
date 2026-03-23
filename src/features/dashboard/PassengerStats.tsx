import React, { useState, useEffect } from 'react';
import { useToastStore } from '../../stores/toastStore';
import { getPassengerStats, exportToCSV, type PassengerStatsData } from '../../services/reportingService';

const PassengerStats: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [stats, setStats] = useState<PassengerStatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => { setLoading(true); try { setStats(await getPassengerStats()); } catch { addToast('Failed to load', 'error'); } setLoading(false); })();
    }, []);

    const handleExport = () => {
        if (!stats) return;
        exportToCSV(['Route', 'Bookings'], stats.topRoutes.map(r => [r.route, r.count]), 'passenger_stats');
        addToast('CSV exported', 'success');
    };

    if (loading || !stats) return <div className="h-full flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

    const maxRouteCount = stats.topRoutes[0]?.count || 1;

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto font-display custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
                <div><h1 className="text-2xl font-black text-navy-950 tracking-tighter uppercase">Passenger Statistics</h1><p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">Demographics, routes, and trends</p></div>
                <button onClick={handleExport} className="px-5 py-2.5 bg-navy-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">download</span>Export
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                    { label: 'Total Passengers', value: stats.totalPassengers.toLocaleString(), icon: 'groups', color: 'text-primary bg-primary/10' },
                    { label: 'Unique Passengers', value: stats.uniquePassengers.toLocaleString(), icon: 'person', color: 'text-emerald-600 bg-emerald-50' },
                ].map(m => (
                    <div key={m.label} className="bg-white rounded-2xl border border-navy-100 p-5">
                        <div className={`size-10 rounded-xl flex items-center justify-center mb-3 ${m.color}`}><span className="material-symbols-outlined">{m.icon}</span></div>
                        <p className="text-2xl font-black text-navy-950 tracking-tighter">{m.value}</p>
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{m.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-6 max-w-4xl">
                {/* Top Routes */}
                <div className="bg-white rounded-2xl border border-navy-100 p-5">
                    <h3 className="text-xs font-black text-navy-900 uppercase tracking-widest mb-4">Top O&D Pairs</h3>
                    <div className="space-y-2">
                        {stats.topRoutes.map((r, i) => (
                            <div key={r.route} className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-navy-300 w-5">{i + 1}.</span>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1"><span className="text-sm font-black text-navy-900">{r.route}</span><span className="text-xs font-bold text-navy-500">{r.count}</span></div>
                                    <div className="h-1.5 bg-navy-50 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${(r.count / maxRouteCount) * 100}%` }} /></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fare Class Distribution */}
                <div className="bg-white rounded-2xl border border-navy-100 p-5">
                    <h3 className="text-xs font-black text-navy-900 uppercase tracking-widest mb-4">Fare Class Split</h3>
                    <div className="space-y-3">
                        {Object.entries(stats.fareClassDistribution).map(([fc, count]) => {
                            const total = Object.values(stats.fareClassDistribution).reduce((s, c) => s + c, 0);
                            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                            const colors: Record<string, string> = { economy: 'bg-blue-500', business: 'bg-amber-500', first: 'bg-purple-500' };
                            return (
                                <div key={fc}>
                                    <div className="flex justify-between mb-1"><span className="text-sm font-black text-navy-900 capitalize">{fc}</span><span className="text-xs font-bold text-navy-500">{pct}% ({count})</span></div>
                                    <div className="h-2 bg-navy-50 rounded-full overflow-hidden"><div className={`h-full rounded-full ${colors[fc] || 'bg-navy-400'}`} style={{ width: `${pct}%` }} /></div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Monthly Trend */}
                <div className="bg-white rounded-2xl border border-navy-100 p-5 col-span-2">
                    <h3 className="text-xs font-black text-navy-900 uppercase tracking-widest mb-4">Monthly Booking Trend</h3>
                    <div className="flex items-end gap-2 h-32">
                        {stats.monthlyTrend.map(m => {
                            const max = Math.max(...stats.monthlyTrend.map(t => t.count), 1);
                            const h = (m.count / max) * 100;
                            return (
                                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[9px] font-black text-navy-500">{m.count}</span>
                                    <div className="w-full bg-primary/80 rounded-t-lg transition-all" style={{ height: `${h}%` }} />
                                    <span className="text-[8px] font-bold text-navy-400 truncate w-full text-center">{m.month.slice(5)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PassengerStats;
