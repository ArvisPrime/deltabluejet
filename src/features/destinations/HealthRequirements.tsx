import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';
import { subscribeToHealthReqs, type HealthRequirement } from '../../services/healthService';

const HealthRequirements: React.FC = () => {
    const [data, setData] = useState<HealthRequirement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDest, setSelectedDest] = useState<HealthRequirement | null>(null);

    useEffect(() => {
        const unsub = subscribeToHealthReqs(reqs => {
            setData(reqs.filter(r => r.active));
            setLoading(false);
        });
        return unsub;
    }, []);

    const filtered = useMemo(() => {
        if (!searchQuery) return data;
        const q = searchQuery.toLowerCase();
        return data.filter(h =>
            h.destination.toLowerCase().includes(q) ||
            h.country.toLowerCase().includes(q) ||
            h.region.toLowerCase().includes(q)
        );
    }, [data, searchQuery]);

    const advisoryColor = (a: string) => {
        if (a === 'restricted') return 'text-red-600 bg-red-50';
        if (a === 'caution') return 'text-amber-600 bg-amber-50';
        return 'text-emerald-600 bg-emerald-50';
    };

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto font-display custom-scrollbar">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-8">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
                    <Link to={ROUTES.HOME} className="hover:text-primary transition-colors">Home</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-primary" aria-current="page">Health Requirements</span>
                </nav>
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Health &amp; Vaccination</h1>
                    <p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">
                        Check health and vaccination requirements by destination
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-md">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300">search</span>
                <input type="text" placeholder="Search destination, country, or region..."
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-navy-100 text-sm font-bold text-navy-800 placeholder:text-navy-300 focus:ring-2 focus:ring-primary/20"
                    aria-label="Search destinations" />
            </div>

            {loading ? (
                <div className="flex flex-col items-center py-16">
                    <div className="mb-4 size-10 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
                    <p className="text-xs font-bold text-navy-400">Loading health data...</p>
                </div>
            ) : selectedDest ? (
                <div className="space-y-6 max-w-2xl">
                    <button onClick={() => setSelectedDest(null)} className="flex items-center gap-1 text-xs font-black text-primary hover:underline">
                        <span className="material-symbols-outlined text-sm">arrow_back</span> Back to all destinations
                    </button>
                    <div className="bg-white rounded-2xl border border-navy-100 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-black text-navy-950 tracking-tighter">{selectedDest.country}</h2>
                                <p className="text-xs font-bold text-navy-400">{selectedDest.destination} • {selectedDest.region}</p>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${advisoryColor(selectedDest.travelAdvisory)}`}>
                                {selectedDest.travelAdvisory === 'none' ? 'No Advisories' : selectedDest.travelAdvisory}
                            </span>
                        </div>
                        <div className="mb-6">
                            <h3 className="text-xs font-black text-navy-900 uppercase tracking-widest mb-3">Vaccinations</h3>
                            <div className="space-y-2">
                                {selectedDest.vaccinations.map(v => (
                                    <div key={v.name} className="flex items-start gap-3 p-3 rounded-xl bg-navy-50/30">
                                        <span className={`material-symbols-outlined text-sm mt-0.5 ${v.required ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {v.required ? 'error' : 'info'}
                                        </span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-black text-navy-900">{v.name}</p>
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${v.required ? 'text-red-600 bg-red-50' : 'text-navy-400 bg-navy-50'}`}>
                                                    {v.required ? 'Required' : 'Recommended'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-navy-500 mt-0.5">{v.notes}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mb-6">
                            <h3 className="text-xs font-black text-navy-900 uppercase tracking-widest mb-2">COVID-19 Policy</h3>
                            <p className="text-sm text-navy-600 p-3 bg-navy-50/30 rounded-xl">{selectedDest.covidPolicy}</p>
                        </div>
                        {selectedDest.malariaRisk && (
                            <div className="mb-6">
                                <h3 className="text-xs font-black text-navy-900 uppercase tracking-widest mb-2">Malaria Risk</h3>
                                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                                    <span className="material-symbols-outlined text-amber-600">warning</span>
                                    <p className="text-sm text-amber-800">{selectedDest.malariaInfo}</p>
                                </div>
                            </div>
                        )}
                        {selectedDest.additionalNotes && (
                            <div>
                                <h3 className="text-xs font-black text-navy-900 uppercase tracking-widest mb-2">Additional Notes</h3>
                                <p className="text-sm text-navy-600 p-3 bg-navy-50/30 rounded-xl">{selectedDest.additionalNotes}</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-4xl">
                    {filtered.length === 0 ? (
                        <div className="col-span-full text-center py-16">
                            <span className="material-symbols-outlined text-5xl text-navy-200">search_off</span>
                            <p className="text-xs font-black text-navy-300 uppercase tracking-widest mt-3">No destinations found</p>
                        </div>
                    ) : (
                        filtered.map(dest => (
                            <button key={dest.id} onClick={() => setSelectedDest(dest)}
                                className="text-left bg-white rounded-2xl border border-navy-100 p-5 hover:shadow-lg hover:border-navy-200 transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="text-xl font-black text-navy-950 tracking-tighter">{dest.destination}</p>
                                        <p className="text-xs font-bold text-navy-400">{dest.country}</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-navy-300">{dest.region}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {dest.vaccinations.filter(v => v.required).map(v => (
                                        <span key={v.name} className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                            {v.name}
                                        </span>
                                    ))}
                                    {dest.malariaRisk && (
                                        <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                            Malaria
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default HealthRequirements;
