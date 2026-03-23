import React, { useState, useEffect, useMemo } from 'react';
import { useToastStore } from '../../stores/toastStore';
import { getReconciliationData, exportToCSV, type ReconRow } from '../../services/reportingService';
import { useCurrency } from '../../hooks/useCurrency';

const FinancialReconciliation: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const { display } = useCurrency();
    const [data, setData] = useState<ReconRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        (async () => { setLoading(true); try { setData(await getReconciliationData()); } catch { addToast('Failed to load', 'error'); } setLoading(false); })();
    }, []);

    const filtered = useMemo(() => {
        let result = data;
        if (statusFilter !== 'all') result = result.filter(r => r.paymentStatus === statusFilter);
        if (searchQuery) { const q = searchQuery.toLowerCase(); result = result.filter(r => r.bookingRef.toLowerCase().includes(q) || r.passenger.toLowerCase().includes(q)); }
        return result;
    }, [data, statusFilter, searchQuery]);

    const totalCharged = filtered.reduce((s, r) => s + r.totalCharged, 0);
    const totalRefunded = filtered.reduce((s, r) => s + r.refunded, 0);
    const netRevenue = filtered.reduce((s, r) => s + r.netRevenue, 0);
    const statuses = [...new Set(data.map(r => r.paymentStatus))];

    const handleExport = () => {
        exportToCSV(
            ['Booking Ref', 'Passenger', 'Route', 'Charged', 'Refunded', 'Net Revenue', 'Status', 'Date'],
            filtered.map(r => [r.bookingRef, r.passenger, r.route, r.totalCharged.toFixed(2), r.refunded.toFixed(2), r.netRevenue.toFixed(2), r.paymentStatus, r.date]),
            'financial_reconciliation'
        );
        addToast('CSV exported', 'success');
    };

    const statusColor = (s: string) => {
        if (s === 'confirmed' || s === 'paid') return 'text-emerald-600 bg-emerald-50';
        if (s === 'refunded' || s === 'cancelled') return 'text-red-600 bg-red-50';
        if (s === 'pending') return 'text-amber-600 bg-amber-50';
        return 'text-navy-500 bg-navy-50';
    };

    if (loading) return <div className="h-full flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto font-display custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
                <div><h1 className="text-2xl font-black text-navy-950 tracking-tighter uppercase">Financial Reconciliation</h1><p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">Revenue vs. collections, refund tracking, outstanding balances</p></div>
                <button onClick={handleExport} className="px-5 py-2.5 bg-navy-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">download</span>Export
                </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Charged', value: display(totalCharged), icon: 'payments', color: 'text-primary bg-primary/10' },
                    { label: 'Total Refunded', value: display(totalRefunded), icon: 'money_off', color: 'text-red-600 bg-red-50' },
                    { label: 'Net Revenue', value: display(netRevenue), icon: 'account_balance', color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Transactions', value: filtered.length.toString(), icon: 'receipt_long', color: 'text-amber-600 bg-amber-50' },
                ].map(m => (
                    <div key={m.label} className="bg-white rounded-2xl border border-navy-100 p-5">
                        <div className={`size-10 rounded-xl flex items-center justify-center mb-3 ${m.color}`}><span className="material-symbols-outlined">{m.icon}</span></div>
                        <p className="text-2xl font-black text-navy-950 tracking-tighter">{m.value}</p>
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{m.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6">
                <div className="relative max-w-xs flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-navy-300 text-sm">search</span>
                    <input type="text" placeholder="Search booking or passenger..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-navy-100 text-sm font-bold text-navy-800 placeholder:text-navy-300" />
                </div>
                <div className="flex gap-1 bg-navy-50 p-1 rounded-xl">
                    <button onClick={() => setStatusFilter('all')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${statusFilter === 'all' ? 'bg-white text-primary shadow-sm' : 'text-navy-400'}`}>All</button>
                    {statuses.map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${statusFilter === s ? 'bg-white text-primary shadow-sm' : 'text-navy-400'}`}>{s}</button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-navy-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead><tr className="border-b border-navy-100">
                        {['Booking', 'Passenger', 'Route', 'Charged', 'Refunded', 'Net', 'Status', 'Date'].map(h => (
                            <th key={h} className="px-4 py-3 text-[10px] font-black text-navy-400 uppercase tracking-widest">{h}</th>
                        ))}
                    </tr></thead>
                    <tbody>
                        {filtered.slice(0, 50).map((r, i) => (
                            <tr key={i} className="border-b border-navy-50 hover:bg-navy-50/30">
                                <td className="px-4 py-2.5 text-xs font-black text-primary">{r.bookingRef}</td>
                                <td className="px-4 py-2.5 text-xs font-bold text-navy-700">{r.passenger}</td>
                                <td className="px-4 py-2.5 text-xs text-navy-600">{r.route}</td>
                                <td className="px-4 py-2.5 text-xs font-bold text-navy-900">{display(r.totalCharged)}</td>
                                <td className="px-4 py-2.5 text-xs text-red-500">{r.refunded > 0 ? `-${display(r.refunded)}` : '—'}</td>
                                <td className="px-4 py-2.5 text-xs font-black text-navy-950">{display(r.netRevenue)}</td>
                                <td className="px-4 py-2.5"><span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${statusColor(r.paymentStatus)}`}>{r.paymentStatus}</span></td>
                                <td className="px-4 py-2.5 text-xs text-navy-400">{r.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FinancialReconciliation;
