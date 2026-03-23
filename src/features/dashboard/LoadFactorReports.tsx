import React, { useState, useEffect, useMemo } from 'react';
import { useToastStore } from '../../stores/toastStore';
import { getLoadFactorData, exportToCSV, type LoadFactorRow } from '../../services/reportingService';

const LoadFactorReports: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [data, setData] = useState<LoadFactorRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterRoute, setFilterRoute] = useState('all');

    useEffect(() => {
        (async () => { setLoading(true); try { setData(await getLoadFactorData()); } catch { addToast('Failed to load', 'error'); } setLoading(false); })();
    }, []);

    const allRoutes = useMemo(() => [...new Set(data.map(d => d.route))], [data]);
    const filtered = useMemo(() => filterRoute === 'all' ? data : data.filter(d => d.route === filterRoute), [data, filterRoute]);
    const avgLF = filtered.length > 0 ? Math.round(filtered.reduce((s, d) => s + d.loadFactor, 0) / filtered.length) : 0;
    const highLF = filtered.filter(d => d.loadFactor >= 85).length;

    const handleExport = () => {
        exportToCSV(['Flight', 'Route', 'Date', 'Total Seats', 'Booked', 'Load Factor (%)'], filtered.map(d => [d.flightNumber, d.route, d.date, d.totalSeats, d.bookedSeats, d.loadFactor]), 'load_factor');
        addToast('CSV exported', 'success');
    };

    const lfColor = (lf: number) => lf >= 85 ? 'text-emerald-600 bg-emerald-50' : lf >= 60 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
    const barColor = (lf: number) => lf >= 85 ? 'bg-emerald-500' : lf >= 60 ? 'bg-amber-500' : 'bg-red-500';

    if (loading) return <div className="h-full flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto font-display custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
                <div><h1 className="text-2xl font-black text-navy-950 tracking-tighter uppercase">Load Factor</h1><p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">Capacity utilization by flight and route</p></div>
                <button onClick={handleExport} className="px-5 py-2.5 bg-navy-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">download</span>Export
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Average Load Factor', value: `${avgLF}%`, icon: 'pie_chart', color: 'text-primary bg-primary/10' },
                    { label: 'Total Flights', value: filtered.length.toString(), icon: 'flight', color: 'text-navy-600 bg-navy-50' },
                    { label: 'High Load (≥85%)', value: highLF.toString(), icon: 'trending_up', color: 'text-emerald-600 bg-emerald-50' },
                ].map(m => (
                    <div key={m.label} className="bg-white rounded-2xl border border-navy-100 p-5">
                        <div className={`size-10 rounded-xl flex items-center justify-center mb-3 ${m.color}`}><span className="material-symbols-outlined">{m.icon}</span></div>
                        <p className="text-2xl font-black text-navy-950 tracking-tighter">{m.value}</p>
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{m.label}</p>
                    </div>
                ))}
            </div>

            {/* Route Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                <button onClick={() => setFilterRoute('all')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 ${filterRoute === 'all' ? 'bg-primary text-white' : 'bg-white border border-navy-100 text-navy-500'}`}>All Routes</button>
                {allRoutes.map(r => (
                    <button key={r} onClick={() => setFilterRoute(r)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 ${filterRoute === r ? 'bg-primary text-white' : 'bg-white border border-navy-100 text-navy-500'}`}>{r}</button>
                ))}
            </div>

            {/* Flights Table */}
            <div className="bg-white rounded-2xl border border-navy-100 overflow-hidden max-w-4xl">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-navy-100">
                            {['Flight', 'Route', 'Date', 'Capacity', 'Load Factor'].map(h => (
                                <th key={h} className="px-5 py-3 text-[10px] font-black text-navy-400 uppercase tracking-widest">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.slice(0, 50).map((f, i) => (
                            <tr key={i} className="border-b border-navy-50">
                                <td className="px-5 py-3 text-sm font-black text-navy-900">{f.flightNumber}</td>
                                <td className="px-5 py-3 text-sm text-navy-600">{f.route}</td>
                                <td className="px-5 py-3 text-sm text-navy-600">{f.date}</td>
                                <td className="px-5 py-3 text-sm text-navy-600">{f.bookedSeats}/{f.totalSeats}</td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-2 bg-navy-50 rounded-full overflow-hidden"><div className={`h-full rounded-full ${barColor(f.loadFactor)}`} style={{ width: `${f.loadFactor}%` }} /></div>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${lfColor(f.loadFactor)}`}>{f.loadFactor}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LoadFactorReports;
