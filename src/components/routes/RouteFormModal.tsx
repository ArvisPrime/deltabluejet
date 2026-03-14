import React, { useState, useEffect } from 'react';
import type { RouteDoc } from '../../types/firestore';
import { createRoute, updateRoute } from '../../services/firestore';
import {
    getAirports,
    getAirportByCode,
    calculateDistance,
    estimateDuration,
    toAirportRef,
    type Airport,
} from '../../services/airportService';
import { useToastStore } from '../../stores/toastStore';

interface RouteFormModalProps {
    route?: RouteDoc;
    onClose: () => void;
    onSaved: () => void;
}

const DAYS = [
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
    { value: 7, label: 'Sun' },
];

const RouteFormModal: React.FC<RouteFormModalProps> = ({ route, onClose, onSaved }) => {
    const isEdit = !!route;

    const [airports, setAirports] = useState<Airport[]>([]);
    const [airportsLoading, setAirportsLoading] = useState(true);
    const [originCode, setOriginCode] = useState(route?.origin?.code || '');
    const [destCode, setDestCode] = useState(route?.destination?.code || '');
    const [fareEconomy, setFareEconomy] = useState(route?.baseFares?.economy || 0);
    const [fareBusiness, setFareBusiness] = useState(route?.baseFares?.business || 0);
    const [fareFirst, setFareFirst] = useState(route?.baseFares?.first || 0);
    const [frequency, setFrequency] = useState<number[]>(route?.frequency || [1, 2, 3, 4, 5]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Load airports from Firestore on mount
    useEffect(() => {
        getAirports()
            .then(setAirports)
            .catch(() => setError('Failed to load airports.'))
            .finally(() => setAirportsLoading(false));
    }, []);

    // Calculate distance & duration from cached airport data
    const originAirport = airports.find(a => a.code === originCode);
    const destAirport = airports.find(a => a.code === destCode);
    const distance = originAirport && destAirport ? calculateDistance(originAirport, destAirport) : 0;
    const duration = distance > 0 ? estimateDuration(distance) : 0;

    const toggleDay = (day: number) => {
        setFrequency((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!originCode || !destCode) {
            setError('Please select both origin and destination airports.');
            return;
        }
        if (originCode === destCode) {
            setError('Origin and destination must be different.');
            return;
        }
        if (fareEconomy <= 0) {
            setError('Economy fare must be greater than 0.');
            return;
        }
        if (frequency.length === 0) {
            setError('Select at least one operating day.');
            return;
        }

        const origin = await getAirportByCode(originCode);
        const dest = await getAirportByCode(destCode);
        if (!origin || !dest) {
            setError('Invalid airport selection.');
            return;
        }

        setSaving(true);
        try {
            const data = {
                origin: toAirportRef(origin),
                destination: toAirportRef(dest),
                distance_km: distance,
                duration_minutes: duration,
                isActive: route?.isActive ?? true,
                baseFares: { economy: fareEconomy, business: fareBusiness, first: fareFirst },
                frequency,
            };

            if (isEdit && route) {
                await updateRoute(route.id, data);
            } else {
                await createRoute(data);
            }
            onSaved();
        } catch (err) {
            console.error(err);
            setError('Failed to save route.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl border border-navy-100 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-5 border-b border-navy-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-lg">route</span>
                        </div>
                        <h2 className="text-lg font-black text-navy-950 tracking-tight">
                            {isEdit ? 'Edit Route' : 'Add New Route'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-navy-100 rounded-lg">
                        <span className="material-symbols-outlined text-navy-400 text-sm">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600">{error}</div>
                    )}

                    {/* Airport Selectors */}
                    {airportsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <span className="material-symbols-outlined text-primary animate-spin text-3xl">progress_activity</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Origin</label>
                                <select
                                    value={originCode}
                                    onChange={(e) => setOriginCode(e.target.value)}
                                    disabled={isEdit}
                                    className="w-full h-11 px-3 rounded-xl border border-navy-100 bg-white text-sm font-bold text-navy-800 focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
                                >
                                    <option value="">Select airport</option>
                                    {airports.map((a) => (
                                        <option key={a.code} value={a.code}>{a.code} — {a.city}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Destination</label>
                                <select
                                    value={destCode}
                                    onChange={(e) => setDestCode(e.target.value)}
                                    disabled={isEdit}
                                    className="w-full h-11 px-3 rounded-xl border border-navy-100 bg-white text-sm font-bold text-navy-800 focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
                                >
                                    <option value="">Select airport</option>
                                    {airports.filter((a) => a.code !== originCode).map((a) => (
                                        <option key={a.code} value={a.code}>{a.code} — {a.city}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Auto-Calculated Distance & Duration */}
                    {distance > 0 && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                                <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Distance</p>
                                <p className="text-lg font-black text-blue-700">{distance.toLocaleString()} km</p>
                            </div>
                            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                                <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Est. Duration</p>
                                <p className="text-lg font-black text-blue-700">
                                    {Math.floor(duration / 60)}h {duration % 60}m
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Base Fares */}
                    <div>
                        <label className="block text-[9px] font-black text-navy-400 uppercase tracking-widest mb-2">Base Fares (USD)</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Economy', value: fareEconomy, set: setFareEconomy, color: 'emerald' },
                                { label: 'Business', value: fareBusiness, set: setFareBusiness, color: 'blue' },
                                { label: 'First', value: fareFirst, set: setFareFirst, color: 'amber' },
                            ].map((f) => (
                                <div key={f.label}>
                                    <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest mb-1">{f.label}</p>
                                    <input
                                        type="number"
                                        min={0}
                                        value={f.value || ''}
                                        onChange={(e) => f.set(Number(e.target.value))}
                                        placeholder="0"
                                        className="w-full h-10 px-3 rounded-xl border border-navy-100 text-sm font-bold text-navy-800 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Frequency */}
                    <div>
                        <label className="block text-[9px] font-black text-navy-400 uppercase tracking-widest mb-2">Operating Days</label>
                        <div className="flex gap-2">
                            {DAYS.map((d) => (
                                <button
                                    key={d.value}
                                    type="button"
                                    onClick={() => toggleDay(d.value)}
                                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${frequency.includes(d.value)
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white text-navy-400 border-navy-100 hover:border-primary/50'
                                        }`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-navy-100 text-navy-500 font-black text-[10px] uppercase tracking-widest hover:bg-navy-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || airportsLoading}
                            className="px-6 py-2.5 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary-600 transition-all disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : isEdit ? 'Update Route' : 'Create Route'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RouteFormModal;
