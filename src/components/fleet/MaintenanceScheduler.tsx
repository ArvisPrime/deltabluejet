import React, { useState } from 'react';
import type { AircraftDoc, MaintenanceWindow } from '../../types/firestore';
import { updateAircraft } from '../../services/firestore';
import { Timestamp } from 'firebase/firestore';
import { useToastStore } from '../../stores/toastStore';

interface MaintenanceSchedulerProps {
    aircraft: AircraftDoc;
    onClose: () => void;
    onSaved: () => void;
}

const MaintenanceScheduler: React.FC<MaintenanceSchedulerProps> = ({ aircraft, onClose, onSaved }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const existingWindows = aircraft.maintenanceWindows || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!startDate || !endDate || !reason.trim()) {
            setError('All fields are required.');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end <= start) {
            setError('End date must be after start date.');
            return;
        }

        // Check for overlapping windows
        const overlaps = existingWindows.some((w) => {
            const wStart = w.startDate instanceof Timestamp ? w.startDate.toDate() : new Date(w.startDate as unknown as string);
            const wEnd = w.endDate instanceof Timestamp ? w.endDate.toDate() : new Date(w.endDate as unknown as string);
            return start < wEnd && end > wStart;
        });

        if (overlaps) {
            setError('This window overlaps with an existing maintenance window.');
            return;
        }

        setSaving(true);
        try {
            const newWindow: MaintenanceWindow = {
                startDate: Timestamp.fromDate(start),
                endDate: Timestamp.fromDate(end),
                reason: reason.trim(),
                createdBy: 'current-user', // In production, get from auth store
            };

            await updateAircraft(aircraft.id, {
                maintenanceWindows: [...existingWindows, newWindow],
                status: 'maintenance',
            });

            onSaved();
        } catch (err) {
            setError('Failed to schedule maintenance. Please try again.');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (ts: Timestamp | unknown): string => {
        if (ts instanceof Timestamp) return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return String(ts);
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="px-8 py-6 border-b border-navy-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-navy-950 tracking-tight uppercase">Schedule Maintenance</h2>
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-1">
                            {aircraft.registration} — {aircraft.type}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-navy-50 rounded-xl transition-colors">
                        <span className="material-symbols-outlined text-navy-400">close</span>
                    </button>
                </div>

                {/* Existing windows */}
                {existingWindows.length > 0 && (
                    <div className="px-8 py-4 bg-navy-50/30 border-b border-navy-50">
                        <h3 className="text-[10px] font-black text-navy-400 uppercase tracking-widest mb-3">Existing Windows</h3>
                        <div className="space-y-2">
                            {existingWindows.map((w, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-navy-100">
                                    <span className="material-symbols-outlined text-amber-500 text-sm">engineering</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-navy-700 truncate">{w.reason}</p>
                                        <p className="text-[10px] text-navy-400 font-medium">
                                            {formatDate(w.startDate)} — {formatDate(w.endDate)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <label className="space-y-2">
                            <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Start Date</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full h-12 px-4 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </label>
                        <label className="space-y-2">
                            <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">End Date</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full h-12 px-4 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </label>
                    </div>

                    <label className="block space-y-2">
                        <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Reason</span>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder="e.g. C-Check scheduled maintenance, engine overhaul..."
                            className="w-full px-4 py-3 bg-navy-50 border border-navy-100 rounded-xl text-sm font-medium text-navy-950 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                        />
                    </label>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-500 text-sm">error</span>
                            <span className="text-xs font-bold text-red-700">{error}</span>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3.5 rounded-2xl border-2 border-navy-100 text-navy-700 font-black uppercase text-[10px] tracking-widest hover:bg-navy-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-3.5 rounded-2xl bg-amber-500 text-white font-black uppercase text-[10px] tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">engineering</span>
                            {saving ? 'Scheduling...' : 'Schedule Maintenance'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MaintenanceScheduler;
