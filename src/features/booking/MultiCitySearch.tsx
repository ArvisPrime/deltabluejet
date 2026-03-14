
import React, { useState, useCallback } from 'react';
import {
    searchMultiCityFlights,
    calculateCombinedFare,
    type SearchLeg,
    type LegResult,
    type SegmentSelection,
    type FareSummary,
} from '../../services/multiCityService';
import type { FlightDoc } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';

const MAX_LEGS = 4;
const MIN_LEGS = 2;

const emptyLeg = (): SearchLeg => ({ origin: '', destination: '', date: '' });

const MultiCitySearch: React.FC = () => {
    const [legs, setLegs] = useState<SearchLeg[]>([emptyLeg(), emptyLeg()]);
    const [results, setResults] = useState<LegResult[]>([]);
    const [selections, setSelections] = useState<Map<number, SegmentSelection>>(new Map());
    const [fareSummary, setFareSummary] = useState<FareSummary | null>(null);
    const [searching, setSearching] = useState(false);
    const [step, setStep] = useState<'search' | 'results' | 'summary'>('search');

    const updateLeg = (idx: number, field: keyof SearchLeg, value: string) => {
        setLegs(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
    };

    const addLeg = () => {
        if (legs.length < MAX_LEGS) setLegs(prev => [...prev, emptyLeg()]);
    };

    const removeLeg = (idx: number) => {
        if (legs.length > MIN_LEGS) setLegs(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSearch = useCallback(async () => {
        const valid = legs.every(l => l.origin && l.destination && l.date);
        if (!valid) return;
        setSearching(true);
        try {
            const data = await searchMultiCityFlights(legs);
            setResults(data);
            setSelections(new Map());
            setFareSummary(null);
            setStep('results');
        } catch (err) { console.error(err); useToastStore.getState().addToast(err instanceof Error ? err.message : "An unexpected error occurred", "error"); }
        finally { setSearching(false); }
    }, [legs]);

    const handleSelectFlight = (legIndex: number, flight: FlightDoc) => {
        const baseFare = flight.baseFare?.economy ?? 0;
        const sel: SegmentSelection = { legIndex, flight, fareClass: 'economy', fareAmount: baseFare };
        const updated = new Map(selections);
        updated.set(legIndex, sel);
        setSelections(updated);

        // If all legs selected, calculate fare
        if (updated.size === legs.length) {
            const allSelections = Array.from(updated.values()).sort((a, b) => a.legIndex - b.legIndex);
            const summary = calculateCombinedFare(allSelections);
            setFareSummary(summary);
            setStep('summary');
        }
    };

    const fmtTime = (ts: any) => ts?.toDate ? ts.toDate().toLocaleString('en-US', {
        hour: '2-digit', minute: '2-digit',
    }) : '--';

    const fmtDate = (ts: any) => ts?.toDate ? ts.toDate().toLocaleString('en-US', {
        month: 'short', day: 'numeric',
    }) : '--';

    return (
        <div className="h-full overflow-y-auto custom-scrollbar bg-navy-50/30">
            <div className="max-w-5xl mx-auto px-8 py-12 space-y-10 animate-in fade-in duration-500">
                {/* Header */}
                <div className="space-y-2">
                    <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">
                        <span>Booking</span>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                        <span className="text-primary">Multi-City</span>
                    </nav>
                    <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase">Multi-City Trip</h1>
                    <p className="text-navy-500 font-medium text-lg">Build your perfect multi-destination itinerary</p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-4">
                    {['Search', 'Select Flights', 'Summary'].map((s, i) => {
                        const stepKey = ['search', 'results', 'summary'][i];
                        const isActive = step === stepKey;
                        const isPast = ['search', 'results', 'summary'].indexOf(step) > i;
                        return (
                            <React.Fragment key={i}>
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' :
                                        isPast ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            'bg-navy-50 text-navy-300 border border-navy-100'
                                    }`}>
                                    {isPast && <span className="material-symbols-outlined text-sm">check</span>}
                                    <span>{s}</span>
                                </div>
                                {i < 2 && <div className={`flex-1 h-0.5 rounded-full ${isPast ? 'bg-emerald-200' : 'bg-navy-100'}`} />}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Search Form */}
                {step === 'search' && (
                    <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm p-8 space-y-6">
                        <h3 className="text-sm font-black text-navy-950 uppercase tracking-widest flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary p-2 bg-primary/5 rounded-xl">flight</span>
                            Flight Legs ({legs.length})
                        </h3>

                        <div className="space-y-4">
                            {legs.map((leg, i) => (
                                <div key={i} className="flex items-center gap-4 p-5 bg-navy-50/50 rounded-2xl border border-navy-100 group">
                                    <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">{i + 1}</div>
                                    <div className="flex-1 grid grid-cols-3 gap-4">
                                        <input
                                            value={leg.origin}
                                            onChange={e => updateLeg(i, 'origin', e.target.value.toUpperCase())}
                                            placeholder="From (e.g. BJL)"
                                            maxLength={3}
                                            className="w-full p-3 bg-white rounded-xl border border-navy-100 text-sm font-black text-navy-950 uppercase text-center focus:ring-2 focus:ring-primary/20 placeholder:text-navy-200"
                                        />
                                        <input
                                            value={leg.destination}
                                            onChange={e => updateLeg(i, 'destination', e.target.value.toUpperCase())}
                                            placeholder="To (e.g. DKR)"
                                            maxLength={3}
                                            className="w-full p-3 bg-white rounded-xl border border-navy-100 text-sm font-black text-navy-950 uppercase text-center focus:ring-2 focus:ring-primary/20 placeholder:text-navy-200"
                                        />
                                        <input
                                            type="date"
                                            value={leg.date}
                                            onChange={e => updateLeg(i, 'date', e.target.value)}
                                            className="w-full p-3 bg-white rounded-xl border border-navy-100 text-sm font-black text-navy-700 focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    {legs.length > MIN_LEGS && (
                                        <button onClick={() => removeLeg(i)} className="text-navy-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                            <span className="material-symbols-outlined">close</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-4">
                            {legs.length < MAX_LEGS ? (
                                <button onClick={addLeg} className="flex items-center gap-2 px-5 py-2.5 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 rounded-xl transition-all">
                                    <span className="material-symbols-outlined text-lg">add</span> Add Leg
                                </button>
                            ) : <div />}
                            <button
                                onClick={handleSearch}
                                disabled={searching || !legs.every(l => l.origin && l.destination && l.date)}
                                className="px-10 py-3.5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
                            >
                                {searching ? 'Searching...' : 'Search Flights'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Results */}
                {step === 'results' && (
                    <div className="space-y-6">
                        <button onClick={() => setStep('search')} className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest hover:underline">
                            <span className="material-symbols-outlined text-sm">arrow_back</span> Modify Search
                        </button>

                        {results.map((lr) => (
                            <div key={lr.legIndex} className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm p-8 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-navy-950 uppercase tracking-widest flex items-center gap-3">
                                        <span className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">{lr.legIndex + 1}</span>
                                        {lr.leg.origin} → {lr.leg.destination}
                                    </h3>
                                    {selections.has(lr.legIndex) && (
                                        <span className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                            <span className="material-symbols-outlined text-sm">check</span> Selected
                                        </span>
                                    )}
                                </div>

                                {lr.flights.length === 0 ? (
                                    <p className="text-sm text-navy-300 font-bold uppercase tracking-widest py-8 text-center">No flights available on {lr.leg.date}</p>
                                ) : (
                                    <div className="space-y-3">
                                        {lr.flights.map(f => {
                                            const isSelected = selections.get(lr.legIndex)?.flight.id === f.id;
                                            const baseFare = f.baseFare?.economy ?? 0;
                                            return (
                                                <button
                                                    key={f.id}
                                                    onClick={() => handleSelectFlight(lr.legIndex, f)}
                                                    className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${isSelected
                                                            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                                            : 'border-navy-100 hover:border-primary/30 hover:bg-navy-50/30'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-6">
                                                        <span className="text-sm font-black text-primary uppercase tracking-tighter">{f.flightNumber}</span>
                                                        <div className="flex items-center gap-3 text-navy-600">
                                                            <span className="text-sm font-black">{fmtTime(f.departureTime)}</span>
                                                            <span className="material-symbols-outlined text-sm text-navy-200">arrow_forward</span>
                                                            <span className="text-sm font-black">{fmtTime(f.arrivalTime)}</span>
                                                        </div>
                                                        <span className="text-[9px] font-black text-navy-300 uppercase tracking-widest">{fmtDate(f.departureTime)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-lg font-black text-navy-950">${baseFare}</span>
                                                        {isSelected && <span className="material-symbols-outlined text-primary">check_circle</span>}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Fare Summary */}
                {step === 'summary' && fareSummary && (
                    <div className="space-y-6">
                        <button onClick={() => setStep('results')} className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest hover:underline">
                            <span className="material-symbols-outlined text-sm">arrow_back</span> Change Selection
                        </button>

                        {/* Connection Timeline */}
                        <div className="bg-white rounded-[2.5rem] border border-navy-100 shadow-sm p-8">
                            <h3 className="text-sm font-black text-navy-950 uppercase tracking-widest mb-6">Your Itinerary</h3>
                            <div className="space-y-0">
                                {fareSummary.segments.map((seg, i) => (
                                    <div key={i} className="flex items-start gap-6">
                                        <div className="flex flex-col items-center">
                                            <div className="size-4 rounded-full bg-primary border-4 border-primary/20" />
                                            {i < fareSummary.segments.length - 1 && <div className="w-0.5 h-16 bg-navy-100" />}
                                        </div>
                                        <div className="pb-8">
                                            <p className="text-sm font-black text-navy-950 uppercase tracking-tight">
                                                Leg {seg.legIndex + 1}: {seg.from} → {seg.to}
                                            </p>
                                            <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-1">
                                                {seg.flightNumber} — ${seg.fare}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Fare Breakdown */}
                        <div className="bg-navy-950 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Fare Breakdown</h3>
                            <div className="space-y-3">
                                {fareSummary.segments.map((seg, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white/5 rounded-2xl p-4 border border-white/10">
                                        <span className="text-sm font-black text-white/60 uppercase tracking-tighter">
                                            {seg.from} → {seg.to} ({seg.flightNumber})
                                        </span>
                                        <span className="text-sm font-black text-white">${seg.fare}</span>
                                    </div>
                                ))}
                                <div className="border-t border-white/10 pt-3 mt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Subtotal</span>
                                        <span className="text-sm font-black text-white/60">${fareSummary.subtotal}</span>
                                    </div>
                                    {fareSummary.discount > 0 && (
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                                                Multi-City Discount ({(fareSummary.discountPct * 100).toFixed(0)}%)
                                            </span>
                                            <span className="text-sm font-black text-emerald-400">-${fareSummary.discount}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                                        <span className="text-lg font-black text-white uppercase tracking-tight">Total</span>
                                        <span className="text-3xl font-black text-white tracking-tighter">${fareSummary.total}</span>
                                    </div>
                                </div>
                            </div>

                            <button className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-[1.02] transition-all">
                                Continue to Passenger Details
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MultiCitySearch;
