import React, { useState } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';
import {
    checkVisaRequirements,
    COUNTRIES,
    type VisaRequirement,
    type VisaStatus,
} from '../../services/travelDocService';

const statusConfig: Record<VisaStatus, { label: string; color: string; icon: string }> = {
    visa_free: { label: 'Visa Free', color: 'emerald', icon: 'check_circle' },
    visa_on_arrival: { label: 'Visa on Arrival', color: 'blue', icon: 'flight_land' },
    e_visa: { label: 'e-Visa Available', color: 'purple', icon: 'language' },
    visa_required: { label: 'Visa Required', color: 'red', icon: 'gpp_bad' },
    unknown: { label: 'Check with Embassy', color: 'amber', icon: 'help' },
};

const VisaChecker: React.FC = () => {
    const [nationality, setNationality] = useState('');
    const [destination, setDestination] = useState('');
    const [result, setResult] = useState<VisaRequirement | null>(null);

    const handleCheck = () => {
        if (!nationality || !destination) return;
        setResult(checkVisaRequirements(nationality, destination));
    };

    const config = result ? statusConfig[result.status] : null;
    const natName = COUNTRIES.find(c => c.code === nationality)?.name || nationality;
    const destName = COUNTRIES.find(c => c.code === destination)?.name || destination;

    return (
        <div className="min-h-screen bg-navy-50 font-display">
            {/* Hero */}
            <div className="bg-navy-950 text-white py-16 md:py-24 px-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-20 w-64 h-64 rounded-full bg-blue-400/30 blur-3xl" />
                    <div className="absolute bottom-10 right-20 w-56 h-56 rounded-full bg-primary/20 blur-3xl" />
                </div>
                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-blue-400 text-3xl">travel_explore</span>
                        <span className="px-3 py-1 bg-blue-400/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-full">Travel Info</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                        Visa & Entry <span className="text-primary">Requirements</span>
                    </h1>
                    <p className="text-navy-400 font-bold mt-4 text-sm md:text-base uppercase tracking-wider">
                        Check visa requirements before you book
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
                {/* Checker Form */}
                <div className="bg-white rounded-3xl border border-navy-100 shadow-sm p-6 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] mb-2">
                                Your Nationality
                            </label>
                            <select
                                value={nationality}
                                onChange={(e) => { setNationality(e.target.value); setResult(null); }}
                                className="w-full h-12 px-4 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold text-navy-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            >
                                <option value="">Select nationality</option>
                                {COUNTRIES.map(c => (
                                    <option key={c.code} value={c.code}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] mb-2">
                                Travelling To
                            </label>
                            <select
                                value={destination}
                                onChange={(e) => { setDestination(e.target.value); setResult(null); }}
                                className="w-full h-12 px-4 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold text-navy-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            >
                                <option value="">Select destination</option>
                                {COUNTRIES.map(c => (
                                    <option key={c.code} value={c.code}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button
                        onClick={handleCheck}
                        disabled={!nationality || !destination}
                        className="w-full h-12 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary-600 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">search</span>
                        Check Requirements
                    </button>
                </div>

                {/* Result */}
                {result && config && (
                    <div className={`bg-${config.color}-50 rounded-3xl border border-${config.color}-100 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300`}>
                        <div className="flex items-center gap-4 mb-4">
                            <span className={`material-symbols-outlined text-${config.color}-500 p-3 bg-white rounded-xl shadow-sm text-3xl`}>{config.icon}</span>
                            <div>
                                <h3 className={`text-sm font-black text-${config.color}-800 uppercase tracking-widest`}>{config.label}</h3>
                                <p className="text-xs text-navy-500 font-bold mt-1">
                                    {natName} passport → {destName}
                                </p>
                            </div>
                        </div>

                        {result.maxStayDays && (
                            <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-white/60 rounded-xl">
                                <span className="material-symbols-outlined text-navy-400">schedule</span>
                                <span className="text-sm font-bold text-navy-700">Maximum stay: {result.maxStayDays} days</span>
                            </div>
                        )}

                        <p className="text-sm text-navy-600 leading-relaxed font-medium">{result.notes}</p>

                        <p className="text-[10px] text-navy-400 font-bold mt-4 uppercase tracking-widest">
                            Last verified: {result.lastUpdated} · Always confirm with the nearest embassy
                        </p>
                    </div>
                )}

                {/* Disclaimer */}
                <div className="bg-amber-50/50 rounded-3xl border border-amber-100 p-6 flex items-start gap-4">
                    <span className="material-symbols-outlined text-amber-500 p-2 bg-white rounded-xl shadow-sm text-xl shrink-0">info</span>
                    <div>
                        <h3 className="text-xs font-black text-navy-900 uppercase tracking-widest">Disclaimer</h3>
                        <p className="text-xs text-navy-500 font-bold mt-1 leading-relaxed">
                            This tool provides general guidance only. Visa requirements change frequently and may vary based on your
                            specific circumstances (purpose of travel, previous visits, etc.). Always verify with the embassy or
                            consulate of your destination country before travel.
                        </p>
                    </div>
                </div>

                {/* Related Links */}
                <div className="flex flex-wrap gap-3">
                    <Link to={ROUTES.DANGEROUS_GOODS} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-navy-100 rounded-xl text-xs font-bold text-navy-600 hover:bg-navy-50 transition-colors">
                        <span className="material-symbols-outlined text-base">warning</span>
                        Dangerous Goods
                    </Link>
                    <Link to={ROUTES.TERMS} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-navy-100 rounded-xl text-xs font-bold text-navy-600 hover:bg-navy-50 transition-colors">
                        <span className="material-symbols-outlined text-base">description</span>
                        Terms & Conditions
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default VisaChecker;
