import React, { useState, useEffect } from 'react';
import type { RouteDoc, AircraftDoc } from '../../types/firestore';
import { Timestamp } from 'firebase/firestore';
import { subscribeToAircraft, updateRoute, deleteRoute } from '../../services/firestore';
import { useToastStore } from '../../stores/toastStore';

interface RouteDetailPanelProps {
    route: RouteDoc;
    onEdit: () => void;
    onClose: () => void;
    onDelete?: () => void;
}

const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const RouteDetailPanel: React.FC<RouteDetailPanelProps> = ({ route, onEdit, onClose, onDelete }) => {
    const [aircraft, setAircraft] = useState<AircraftDoc[]>([]);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Subscribe to aircraft to compute compatibility
    useEffect(() => {
        const unsub = subscribeToAircraft((data) => setAircraft(data));
        return unsub;
    }, []);

    const compatibleAircraft = aircraft.filter(
        (ac) => ac.status === 'active' && ac.range_km >= route.distance_km
    );

    const formatCurrency = (val: number) => (val ? `$${val.toLocaleString()}` : '—');
    const formatDate = (ts: Timestamp | unknown): string => {
        if (ts instanceof Timestamp) {
            return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        return '—';
    };

    const handleToggleActive = async () => {
        try {
            await updateRoute(route.id, { isActive: !route.isActive });
        } catch (err) {
            console.error('Failed to toggle route:', err);
            useToastStore.getState().addToast("Failed to toggle route", "error");
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-navy-100 shadow-xl overflow-hidden animate-in slide-in-from-right">
            {/* Header */}
            <div className="px-6 py-5 bg-navy-50/50 border-b border-navy-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-navy-100">
                        <span className="material-symbols-outlined text-2xl text-primary">route</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-navy-950 tracking-tight">
                            {route.origin.code} → {route.destination.code}
                        </h3>
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">
                            {route.origin.city} to {route.destination.city}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${route.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                        <span className={`size-1.5 rounded-full ${route.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        {route.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={onClose} className="p-1.5 hover:bg-navy-100 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-navy-400 text-sm">close</span>
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {/* Route Specs */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'Distance', value: `${route.distance_km.toLocaleString()} km`, icon: 'straighten' },
                        { label: 'Duration', value: `${Math.floor(route.duration_minutes / 60)}h ${route.duration_minutes % 60}m`, icon: 'schedule' },
                        { label: 'Origin', value: `${route.origin.code} — ${route.origin.name}`, icon: 'flight_takeoff' },
                        { label: 'Destination', value: `${route.destination.code} — ${route.destination.name}`, icon: 'flight_land' },
                    ].map((spec) => (
                        <div key={spec.label} className="p-3 bg-navy-50/30 rounded-xl border border-navy-50">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="material-symbols-outlined text-xs text-navy-300">{spec.icon}</span>
                                <span className="text-[8px] font-black text-navy-300 uppercase tracking-widest">{spec.label}</span>
                            </div>
                            <p className="text-xs font-black text-navy-800 tracking-tight">{spec.value}</p>
                        </div>
                    ))}
                </div>

                {/* Base Fares */}
                <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-navy-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-navy-300">payments</span>
                        Base Fares
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                        {Object.entries(route.baseFares || {}).map(([cls, fare]) => (
                            <div key={cls} className="p-3 bg-navy-50/30 rounded-xl border border-navy-50 text-center">
                                <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest capitalize">{cls}</p>
                                <p className="text-sm font-black text-navy-800">{formatCurrency(fare)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Frequency */}
                <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-navy-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-navy-300">calendar_month</span>
                        Operating Days
                    </h4>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                            <div
                                key={day}
                                className={`flex-1 py-2 rounded-xl text-center text-[10px] font-black uppercase tracking-widest border ${route.frequency?.includes(day)
                                        ? 'bg-primary/10 text-primary border-primary/30'
                                        : 'bg-navy-50/30 text-navy-300 border-navy-50'
                                    }`}
                            >
                                {DAY_NAMES[day]}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Compatible Aircraft */}
                <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-navy-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-navy-300">flight</span>
                        Compatible Aircraft ({compatibleAircraft.length})
                    </h4>
                    {compatibleAircraft.length === 0 ? (
                        <p className="text-xs text-navy-400 font-medium p-3 bg-navy-50/30 rounded-xl">No active aircraft with sufficient range.</p>
                    ) : (
                        <div className="space-y-1.5">
                            {compatibleAircraft.map((ac) => (
                                <div key={ac.id} className="flex items-center gap-3 p-2.5 bg-navy-50/30 rounded-xl border border-navy-50">
                                    <div className="size-8 rounded-lg bg-white flex items-center justify-center border border-navy-100">
                                        <span className="material-symbols-outlined text-xs text-navy-400">flight</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-navy-800">{ac.registration}</p>
                                        <p className="text-[10px] text-navy-400 font-medium truncate">{ac.type} • {ac.totalSeats} seats</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-emerald-600">{ac.range_km.toLocaleString()} km</p>
                                        <span className="material-symbols-outlined text-emerald-500 text-xs">check_circle</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-navy-50/30 rounded-lg text-center">
                        <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Created</p>
                        <p className="text-[10px] font-bold text-navy-500">{formatDate(route.createdAt)}</p>
                    </div>
                    <div className="p-2 bg-navy-50/30 rounded-lg text-center">
                        <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Updated</p>
                        <p className="text-[10px] font-bold text-navy-500">{formatDate(route.updatedAt)}</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-navy-100 bg-navy-50/20 flex flex-wrap gap-2">
                <button
                    onClick={onEdit}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-navy-100 text-navy-700 font-black text-[10px] uppercase tracking-widest hover:border-primary hover:text-primary transition-all"
                >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Edit
                </button>
                <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all"
                >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Delete
                </button>
                <button
                    onClick={handleToggleActive}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ml-auto ${route.isActive
                            ? 'bg-red-50 border border-red-100 text-red-500 hover:bg-red-100'
                            : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        }`}
                >
                    <span className="material-symbols-outlined text-sm">{route.isActive ? 'cancel' : 'check_circle'}</span>
                    {route.isActive ? 'Deactivate' : 'Activate'}
                </button>
            </div>

            {/* Delete Confirmation */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-navy-100 shadow-2xl w-full max-w-md p-8 space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center gap-4">
                            <div className="size-16 rounded-full bg-red-50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl text-red-500">delete_forever</span>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-black text-navy-950 tracking-tight">Delete Route</h3>
                                <p className="text-sm text-navy-500">
                                    Permanently delete <strong>{route.origin.code} → {route.destination.code}</strong>?
                                    This cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDelete(false)} className="flex-1 h-12 bg-white border border-navy-200 text-navy-700 font-black rounded-xl hover:bg-navy-50 transition-all">Cancel</button>
                            <button
                                onClick={async () => {
                                    setDeleting(true);
                                    try {
                                        await deleteRoute(route.id);
                                        useToastStore.getState().addToast('Route deleted', 'success');
                                        onDelete?.();
                                    } catch (err) {
                                        console.error('Delete route error:', err);
                                        useToastStore.getState().addToast('Failed to delete route', 'error');
                                    } finally {
                                        setDeleting(false);
                                        setConfirmDelete(false);
                                    }
                                }}
                                disabled={deleting}
                                className="flex-1 h-12 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleting ? (<><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Deleting…</>) : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RouteDetailPanel;
