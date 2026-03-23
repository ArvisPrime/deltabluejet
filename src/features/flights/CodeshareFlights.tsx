import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';
import {
    getActivePartners, getCodeshareRoutes, formatCarrierDisplay,
    supportsThroughCheckin, supportsBaggageTransfer,
} from '../../services/codeshareService';
import type { PartnerAirline, CodeshareRoute } from '../../services/codeshareService';

const DAYS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CodeshareFlights: React.FC = () => {
    const [partners, setPartners] = useState<PartnerAirline[]>([]);
    const [routes, setRoutes] = useState<CodeshareRoute[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPartner, setSelectedPartner] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [p, r] = await Promise.all([getActivePartners(), getCodeshareRoutes()]);
                setPartners(p);
                setRoutes(r.filter(rt => rt.active));
            } catch { /* ignore */ }
            setLoading(false);
        })();
    }, []);

    const filtered = useMemo(() => {
        let result = routes;
        if (selectedPartner !== 'all') result = result.filter(r => r.partnerId === selectedPartner);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(r =>
                r.marketingFlightNumber.toLowerCase().includes(q) ||
                r.operatingFlightNumber.toLowerCase().includes(q) ||
                r.origin.toLowerCase().includes(q) ||
                r.destination.toLowerCase().includes(q)
            );
        }
        return result;
    }, [routes, selectedPartner, searchQuery]);

    const getPartner = (id: string) => partners.find(p => p.id === id);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto font-display custom-scrollbar">
            <div className="flex flex-col gap-4 mb-8">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
                    <Link to={ROUTES.HOME} className="hover:text-primary">Home</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-primary">Codeshare Flights</span>
                </nav>
                <div>
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Codeshare Partners</h1>
                    <p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">
                        Fly further with our partner airlines
                    </p>
                </div>
            </div>

            {/* Partner Filter */}
            <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                <button onClick={() => setSelectedPartner('all')}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 ${
                        selectedPartner === 'all' ? 'bg-primary text-white shadow-md' : 'bg-white border border-navy-100 text-navy-500'
                    }`}>All Partners</button>
                {partners.map(p => (
                    <button key={p.id} onClick={() => setSelectedPartner(p.id)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 ${
                            selectedPartner === p.id ? 'bg-primary text-white shadow-md' : 'bg-white border border-navy-100 text-navy-500'
                        }`}>{p.code} — {p.name}</button>
                ))}
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-md">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300">search</span>
                <input type="text" placeholder="Search flight or route..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-navy-100 text-sm font-bold text-navy-800 placeholder:text-navy-300" />
            </div>

            {/* Routes */}
            {filtered.length === 0 ? (
                <div className="text-center py-16">
                    <span className="material-symbols-outlined text-5xl text-navy-200">connecting_airports</span>
                    <p className="text-xs font-black text-navy-300 uppercase tracking-widest mt-3">No codeshare routes found</p>
                </div>
            ) : (
                <div className="space-y-3 max-w-3xl">
                    {filtered.map(route => {
                        const partner = getPartner(route.partnerId);
                        const display = formatCarrierDisplay(route.marketingFlightNumber, route.operatingCarrier, route.operatingFlightNumber);
                        const hasThroughCI = partner ? supportsThroughCheckin(partner, route) : false;
                        const hasBaggage = partner ? supportsBaggageTransfer(partner) : false;

                        return (
                            <div key={route.id} className="bg-white rounded-2xl border border-navy-100 p-5 hover:shadow-lg transition-all">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <p className="text-xl font-black text-navy-950">{route.origin}</p>
                                        <span className="material-symbols-outlined text-primary">flight</span>
                                        <p className="text-xl font-black text-navy-950">{route.destination}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-sm font-black text-navy-950">{display.primary}</p>
                                            <span className="text-[9px] font-black text-white bg-primary px-2 py-0.5 rounded-full uppercase">{display.badge}</span>
                                        </div>
                                        <p className="text-[10px] text-navy-400">{display.secondary}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-navy-50">
                                    {route.daysOfWeek.map(d => (
                                        <span key={d} className="text-[9px] font-black text-navy-500 bg-navy-50 px-2 py-0.5 rounded">{DAYS[d]}</span>
                                    ))}
                                    {hasThroughCI && <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Through Check-in</span>}
                                    {hasBaggage && <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Baggage Transfer</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CodeshareFlights;
