import React, { useState, useEffect, useMemo } from 'react';
import { useToastStore } from '../../stores/toastStore';
import { getRevenueData, exportToCSV, type RevenueRow } from '../../services/reportingService';

const RevenueReports: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [data, setData] = useState<RevenueRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [groupBy, setGroupBy] = useState<'route' | 'fareClass' | 'period'>('route');

    useEffect(() => {
        (async () => { setLoading(true); try { setData(await getRevenueData()); } catch { addToast('Failed to load', 'error'); } setLoading(false); })();
    }, []);

    const grouped = useMemo(() => {
        const map: Record<string, { revenue: number; bookings: number }> = {};
        data.forEach(r => {
            const key = r[groupBy];
            if (!map[key]) map[key] = { revenue: 0, bookings: 0 };
            map[key].revenue += r.revenue;
            map[key].bookings += r.bookings;
        });
        return Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue);
    }, [data, groupBy]);

    const totalRevenue = grouped.reduce((s, [, v]) => s + v.revenue, 0);
    const totalBookings = grouped.reduce((s, [, v]) => s + v.bookings, 0);
    const maxRevenue = grouped.length > 0 ? grouped[0][1].revenue : 1;

    const handleExport = () => {
        exportToCSV(['Group', 'Revenue', 'Bookings', 'Avg Revenue'], grouped.map(([k, v]) => [k, v.revenue.toFixed(2), v.bookings, v.bookings > 0 ? (v.revenue / v.bookings).toFixed(2) : '0']), `revenue_by_${groupBy}`);
        addToast('CSV exported', 'success');
    };

    if (loading) return <div className="h-full flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto font-display custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
                <div><h1 className="text-2xl font-black text-navy-950 tracking-tighter uppercase">Revenue Reports</h1><p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">Revenue breakdown by route, fare class, and period</p></div>
                <button onClick={handleExport} className="px-5 py-2.5 bg-navy-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-navy-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">download</span>Export CSV
                </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: 'payments', color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Total Bookings', value: totalBookings.toLocaleString(), icon: 'confirmation_number', color: 'text-primary bg-primary/10' },
                    { label: 'Avg per Booking', value: `$${totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : '0'}`, icon: 'trending_up', color: 'text-amber-600 bg-amber-50' },
                ].map(m => (
                    <div key={m.label} className="bg-white rounded-2xl border border-navy-100 p-5">
                        <div className={`size-10 rounded-xl flex items-center justify-center mb-3 ${m.color}`}><span className="material-symbols-outlined">{m.icon}</span></div>
                        <p className="text-2xl font-black text-navy-950 tracking-tighter">{m.value}</p>
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{m.label}</p>
                    </div>
                ))}
            </div>

            {/* Group By */}
            <div className="flex gap-1 bg-navy-50 p-1 rounded-xl mb-6 w-fit">
                {[{ key: 'route', label: 'By Route' }, { key: 'fareClass', label: 'By Class' }, { key: 'period', label: 'By Month' }].map(g => (
                    <button key={g.key} onClick={() => setGroupBy(g.key as any)} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${groupBy === g.key ? 'bg-white text-primary shadow-sm' : 'text-navy-400'}`}>{g.label}</button>
                ))}
            </div>

            {/* Chart-like bars */}
            <div className="space-y-2 max-w-3xl">
                {grouped.map(([key, val]) => (
                    <div key={key} className="bg-white rounded-xl border border-navy-100 p-4">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-black text-navy-900">{key}</p>
                            <p className="text-sm font-black text-navy-950">${val.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="h-2 bg-navy-50 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(val.revenue / maxRevenue) * 100}%` }} />
                        </div>
                        <p className="text-[10px] text-navy-400 mt-1">{val.bookings} bookings · ${val.bookings > 0 ? (val.revenue / val.bookings).toFixed(2) : '0'} avg</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RevenueReports;
