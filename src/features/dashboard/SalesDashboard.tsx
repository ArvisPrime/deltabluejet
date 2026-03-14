import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import { BRAND } from '../../config/brand';
import {
    getDailySalesData,
    getRevenueByClass,
    getRoutePerformance,
    getSalesSummary,
    exportSalesCSV,
    type DailySalesPoint,
    type ClassBreakdown,
    type RoutePerformance,
    type SalesSummary,
} from '../../services/salesService';
import { useToastStore } from '../../stores/toastStore';

const CLASS_COLORS: Record<string, string> = {
    economy: '#137fec',
    business: '#8b5cf6',
    first: '#f59e0b',
};

const SalesDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<SalesSummary | null>(null);
    const [daily, setDaily] = useState<DailySalesPoint[]>([]);
    const [classSplit, setClassSplit] = useState<ClassBreakdown[]>([]);
    const [routes, setRoutes] = useState<RoutePerformance[]>([]);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [s, d, c, r] = await Promise.all([
                    getSalesSummary(),
                    getDailySalesData(30),
                    getRevenueByClass(30),
                    getRoutePerformance(30),
                ]);
                setSummary(s);
                setDaily(d);
                setClassSplit(c);
                setRoutes(r);
            } catch (err) {
                console.error('Sales dashboard load error:', err);
                useToastStore.getState().addToast("Sales dashboard load error", "error");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleExport = async () => {
        setExporting(true);
        try { await exportSalesCSV(30); } finally { setExporting(false); }
    };

    const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-10 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Sales Intelligence</h1>
                    <p className="text-navy-500 font-medium italic mt-2 flex items-center gap-2 text-[10px] md:text-sm uppercase tracking-widest">
                        <span className="size-2 md:size-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        {loading ? 'Aggregating revenue data...' : `${BRAND.shortName} • Last 30 days`}
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={exporting || loading}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-600 transition-all disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-lg">download</span>
                    {exporting ? 'Exporting...' : 'Export CSV'}
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: "Today's Revenue", val: loading ? '...' : fmt(summary?.todayRevenue || 0), icon: 'payments', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Total Bookings', val: loading ? '...' : (summary?.totalBookings || 0).toLocaleString(), icon: 'confirmation_number', color: 'text-primary', bg: 'bg-primary/5' },
                    { label: 'Active Flights', val: loading ? '...' : String(summary?.activeFlights || 0), icon: 'flight_takeoff', color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Avg Fare', val: loading ? '...' : fmt(summary?.avgFare || 0), icon: 'trending_up', color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white border border-navy-100 rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${stat.bg} ${stat.color} shadow-inner group-hover:scale-110 transition-transform`}>
                                <span className="material-symbols-outlined text-2xl md:text-3xl font-black">{stat.icon}</span>
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                        <h3 className="text-2xl md:text-3xl font-black text-navy-950 tracking-tighter">{stat.val}</h3>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
                {/* Revenue Trend */}
                <div className="lg:col-span-2 bg-white rounded-2xl md:rounded-[3.5rem] border border-navy-100 p-6 md:p-12 shadow-sm relative">
                    <div className="mb-8 md:mb-12">
                        <h3 className="text-xl md:text-2xl font-black text-navy-950 uppercase tracking-tighter">Revenue Trend (30d)</h3>
                        <p className="text-[10px] text-navy-400 font-bold uppercase tracking-widest opacity-60">Daily revenue from confirmed bookings</p>
                    </div>
                    <div className="h-64 md:h-80 w-full">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin size-8 border-3 border-navy-200 border-t-primary rounded-full" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={daily}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }}
                                        tickFormatter={(v: string) => v.slice(5)} // MM-DD
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }}
                                        tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 15px 30px -10px rgb(0 0 0 / 0.1)', padding: '16px' }}
                                        formatter={(v: number | string | undefined) => [`$${Number(v || 0).toLocaleString()}`, 'Revenue']}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Bookings by Class Donut */}
                <div className="bg-white rounded-2xl md:rounded-[3.5rem] border border-navy-100 p-6 md:p-10 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-black text-navy-950 uppercase tracking-tighter">Revenue by Class</h3>
                        <p className="text-[10px] text-navy-400 font-bold uppercase tracking-widest opacity-60">Last 30 days</p>
                    </div>
                    <div className="h-64">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin size-8 border-3 border-navy-200 border-t-primary rounded-full" />
                            </div>
                        ) : classSplit.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-navy-300 text-xs font-bold uppercase">No data</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={classSplit}
                                        dataKey="revenue"
                                        nameKey="fareClass"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        stroke="none"
                                    >
                                        {classSplit.map((entry) => (
                                            <Cell key={entry.fareClass} fill={CLASS_COLORS[entry.fareClass] || '#94a3b8'} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                        formatter={(v: number | string | undefined) => [`$${Number(v || 0).toLocaleString()}`, 'Revenue']}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        formatter={(value: string) => (
                                            <span className="text-[10px] font-black text-navy-600 uppercase tracking-widest">{value}</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    {/* Class breakdown list */}
                    <div className="space-y-3 mt-4">
                        {classSplit.map((c) => (
                            <div key={c.fareClass} className="flex items-center justify-between p-3 bg-navy-50/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="size-3 rounded-full" style={{ background: CLASS_COLORS[c.fareClass] || '#94a3b8' }} />
                                    <span className="text-[10px] font-black text-navy-700 uppercase tracking-widest">{c.fareClass}</span>
                                </div>
                                <span className="text-xs font-black text-navy-950">{c.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Route Performance Table */}
            <div className="bg-white rounded-2xl md:rounded-[4rem] border border-navy-100 shadow-sm overflow-hidden">
                <div className="p-6 md:p-10 border-b border-navy-50 flex flex-col sm:flex-row justify-between items-center bg-navy-50/10 gap-4">
                    <div>
                        <h3 className="text-xl md:text-2xl font-black text-navy-950 uppercase tracking-tighter">Route Performance</h3>
                        <p className="text-[10px] text-navy-400 font-bold uppercase tracking-widest opacity-60">Ranked by revenue — last 30 days</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                        <thead>
                            <tr className="bg-navy-50/50 text-[9px] font-black text-navy-300 uppercase tracking-[0.25em] border-b border-navy-50">
                                <th className="px-6 md:px-10 py-5">#</th>
                                <th className="px-6 md:px-10 py-5">Route</th>
                                <th className="px-6 md:px-10 py-5 text-right">Revenue</th>
                                <th className="px-6 md:px-10 py-5 text-right">Bookings</th>
                                <th className="px-6 md:px-10 py-5 text-right">Avg Fare</th>
                                <th className="px-6 md:px-10 py-5 text-right">Load Factor</th>
                                <th className="px-6 md:px-10 py-5 text-right">Trend</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-10 py-16 text-center">
                                        <div className="flex items-center justify-center gap-4">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                            <span className="text-xs font-black text-navy-300 uppercase tracking-widest">Loading routes...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : routes.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-10 py-16 text-center">
                                        <p className="text-xs font-black text-navy-300 uppercase tracking-widest">No route data yet</p>
                                    </td>
                                </tr>
                            ) : (
                                routes.map((r, i) => (
                                    <tr key={r.route} className="group hover:bg-navy-50/50 transition-all">
                                        <td className="px-6 md:px-10 py-5 text-xs font-black text-navy-300">{i + 1}</td>
                                        <td className="px-6 md:px-10 py-5">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-primary text-lg">flight</span>
                                                <span className="text-sm font-black text-navy-950 uppercase tracking-tight">{r.route}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 md:px-10 py-5 text-right text-sm font-black text-emerald-600">{fmt(r.revenue)}</td>
                                        <td className="px-6 md:px-10 py-5 text-right text-sm font-black text-navy-700">{r.bookings}</td>
                                        <td className="px-6 md:px-10 py-5 text-right text-sm font-black text-navy-500">{fmt(r.avgFare)}</td>
                                        <td className="px-6 md:px-10 py-5 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-navy-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${r.loadFactor > 70 ? 'bg-emerald-500' : r.loadFactor > 40 ? 'bg-amber-500' : 'bg-red-400'}`}
                                                        style={{ width: `${r.loadFactor}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-navy-500">{r.loadFactor}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 md:px-10 py-5 text-right">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${r.trend > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                r.trend < 0 ? 'bg-red-50 text-red-700 border-red-100' :
                                                    'bg-navy-50 text-navy-400 border-navy-100'
                                                }`}>
                                                {r.trend > 0 ? '+' : ''}{r.trend}%
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalesDashboard;
