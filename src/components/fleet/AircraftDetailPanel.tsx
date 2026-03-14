import React from 'react';
import type { AircraftDoc } from '../../types/firestore';
import { Timestamp } from 'firebase/firestore';
import SeatLayoutPreview from './SeatLayoutPreview';

interface AircraftDetailPanelProps {
    aircraft: AircraftDoc;
    onEdit: () => void;
    onScheduleMaintenance: () => void;
    onStatusChange: (status: AircraftDoc['status']) => void;
    onClose: () => void;
}

const STATUS_CONFIG = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Active' },
    maintenance: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Maintenance' },
    retired: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Retired' },
};

const AircraftDetailPanel: React.FC<AircraftDetailPanelProps> = ({
    aircraft,
    onEdit,
    onScheduleMaintenance,
    onStatusChange,
    onClose,
}) => {
    const status = STATUS_CONFIG[aircraft.status] || STATUS_CONFIG.active;

    const formatDate = (ts: Timestamp | unknown): string => {
        if (ts instanceof Timestamp) {
            return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        return '—';
    };

    const formatWeight = (kg: number): string => {
        if (!kg) return '—';
        return `${(kg / 1000).toFixed(1)}t`;
    };

    return (
        <div className="bg-white rounded-3xl border border-navy-100 shadow-xl overflow-hidden animate-in slide-in-from-right">
            {/* Header */}
            <div className="px-6 py-5 bg-navy-50/50 border-b border-navy-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-navy-100">
                        <span className="material-symbols-outlined text-2xl text-primary">flight</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-navy-950 tracking-tight">{aircraft.registration}</h3>
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{aircraft.type}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${status.bg} ${status.text}`}>
                        <span className={`size-1.5 rounded-full ${status.dot} ${aircraft.status === 'active' ? 'animate-pulse' : ''}`} />
                        {status.label}
                    </span>
                    <button onClick={onClose} className="p-1.5 hover:bg-navy-100 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-navy-400 text-sm">close</span>
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {/* Specs Grid */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Manufacturer', value: aircraft.manufacturer, icon: 'factory' },
                        { label: 'Model', value: aircraft.model, icon: 'info' },
                        { label: 'Home Base', value: aircraft.homeBase, icon: 'location_on' },
                        { label: 'Total Seats', value: String(aircraft.totalSeats), icon: 'event_seat' },
                        { label: 'Range', value: `${aircraft.range_km?.toLocaleString()} km`, icon: 'route' },
                        { label: 'Status', value: status.label, icon: 'monitoring' },
                    ].map((spec) => (
                        <div key={spec.label} className="p-3 bg-navy-50/30 rounded-xl border border-navy-50">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="material-symbols-outlined text-xs text-navy-300">{spec.icon}</span>
                                <span className="text-[8px] font-black text-navy-300 uppercase tracking-widest">{spec.label}</span>
                            </div>
                            <p className="text-sm font-black text-navy-800 tracking-tight">{spec.value}</p>
                        </div>
                    ))}
                </div>

                {/* Weight Limits */}
                {aircraft.weightLimits && (
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-navy-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-navy-300">scale</span>
                            Weight Limits
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-3 bg-navy-50/30 rounded-xl border border-navy-50 text-center">
                                <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Max Takeoff</p>
                                <p className="text-sm font-black text-navy-800">{formatWeight(aircraft.weightLimits.maxTakeoff)}</p>
                            </div>
                            <div className="p-3 bg-navy-50/30 rounded-xl border border-navy-50 text-center">
                                <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Max Landing</p>
                                <p className="text-sm font-black text-navy-800">{formatWeight(aircraft.weightLimits.maxLanding)}</p>
                            </div>
                            <div className="p-3 bg-navy-50/30 rounded-xl border border-navy-50 text-center">
                                <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Max Payload</p>
                                <p className="text-sm font-black text-navy-800">{formatWeight(aircraft.weightLimits.maxPayload)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Seat Layout */}
                <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Seat Configuration</h4>
                    <SeatLayoutPreview seatConfig={aircraft.seatConfig} aircraftType={aircraft.type} />
                </div>

                {/* Maintenance */}
                <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-navy-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-navy-300">engineering</span>
                        Maintenance
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-navy-50/30 rounded-xl border border-navy-50">
                            <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Last Maintenance</p>
                            <p className="text-xs font-bold text-navy-700">{formatDate(aircraft.lastMaintenanceDate)}</p>
                        </div>
                        <div className="p-3 bg-navy-50/30 rounded-xl border border-navy-50">
                            <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">Next Maintenance</p>
                            <p className="text-xs font-bold text-navy-700">{formatDate(aircraft.nextMaintenanceDate)}</p>
                        </div>
                    </div>
                    {aircraft.maintenanceWindows?.length > 0 && (
                        <div className="space-y-1.5 mt-2">
                            {aircraft.maintenanceWindows.map((w, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-amber-50/50 rounded-lg border border-amber-100">
                                    <span className="material-symbols-outlined text-amber-500 text-xs">schedule</span>
                                    <span className="text-[10px] font-bold text-amber-700 flex-1 truncate">{w.reason}</span>
                                    <span className="text-[9px] text-amber-500 font-medium whitespace-nowrap">
                                        {formatDate(w.startDate)} — {formatDate(w.endDate)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notes */}
                {aircraft.notes && (
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Notes</p>
                        <p className="text-xs text-blue-700 font-medium">{aircraft.notes}</p>
                    </div>
                )}
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
                    onClick={onScheduleMaintenance}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-black text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all"
                >
                    <span className="material-symbols-outlined text-sm">engineering</span>
                    Maintenance
                </button>
                {aircraft.status !== 'active' && (
                    <button
                        onClick={() => onStatusChange('active')}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all"
                    >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Activate
                    </button>
                )}
                {aircraft.status === 'active' && (
                    <button
                        onClick={() => onStatusChange('maintenance')}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-navy-100 text-navy-500 font-black text-[10px] uppercase tracking-widest hover:bg-navy-50 transition-all"
                    >
                        <span className="material-symbols-outlined text-sm">pause_circle</span>
                        Set Maintenance
                    </button>
                )}
                {aircraft.status !== 'retired' && (
                    <button
                        onClick={() => onStatusChange('retired')}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all ml-auto"
                    >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Retire
                    </button>
                )}
            </div>
        </div>
    );
};

export default AircraftDetailPanel;
