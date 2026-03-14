import React, { useState } from 'react';
import type { AircraftDoc } from '../../types/firestore';
import { createAircraft, updateAircraft } from '../../services/firestore';
import { useToastStore } from '../../stores/toastStore';

interface AircraftFormModalProps {
    aircraft?: AircraftDoc | null;  // null = add mode, defined = edit mode
    onClose: () => void;
    onSaved: () => void;
}

const MANUFACTURERS = ['Boeing', 'Airbus', 'ATR', 'Embraer', 'De Havilland Canada', 'Bombardier'];

const AircraftFormModal: React.FC<AircraftFormModalProps> = ({ aircraft, onClose, onSaved }) => {
    const isEdit = !!aircraft;

    const [form, setForm] = useState({
        type: aircraft?.type || '',
        registration: aircraft?.registration || '',
        manufacturer: aircraft?.manufacturer || '',
        model: aircraft?.model || '',
        totalSeats: aircraft?.totalSeats || 0,
        seatConfigEconomy: aircraft?.seatConfig?.economy || 0,
        seatConfigBusiness: aircraft?.seatConfig?.business || 0,
        seatConfigFirst: aircraft?.seatConfig?.first || 0,
        range_km: aircraft?.range_km || 0,
        homeBase: aircraft?.homeBase || 'BJL',
        maxTakeoff: aircraft?.weightLimits?.maxTakeoff || 0,
        maxLanding: aircraft?.weightLimits?.maxLanding || 0,
        maxPayload: aircraft?.weightLimits?.maxPayload || 0,
        notes: aircraft?.notes || '',
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const updateField = (field: string, value: string | number) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!form.type.trim()) { setError('Aircraft type is required.'); return; }
        if (!form.registration.trim()) { setError('Registration is required.'); return; }
        if (!form.manufacturer.trim()) { setError('Manufacturer is required.'); return; }
        if (!form.model.trim()) { setError('Model is required.'); return; }
        if (form.totalSeats <= 0) { setError('Total seats must be greater than 0.'); return; }
        if (form.range_km <= 0) { setError('Range must be greater than 0.'); return; }

        const seatSum = form.seatConfigEconomy + form.seatConfigBusiness + form.seatConfigFirst;
        if (seatSum !== form.totalSeats) {
            setError(`Seat class totals (${seatSum}) must equal total seats (${form.totalSeats}).`);
            return;
        }

        setSaving(true);
        try {
            const data = {
                type: form.type.trim(),
                registration: form.registration.trim().toUpperCase(),
                manufacturer: form.manufacturer.trim(),
                model: form.model.trim(),
                totalSeats: form.totalSeats,
                seatConfig: {
                    economy: form.seatConfigEconomy,
                    business: form.seatConfigBusiness,
                    first: form.seatConfigFirst,
                },
                range_km: form.range_km,
                homeBase: form.homeBase.trim().toUpperCase(),
                weightLimits: {
                    maxTakeoff: form.maxTakeoff,
                    maxLanding: form.maxLanding,
                    maxPayload: form.maxPayload,
                },
                notes: form.notes.trim(),
            };

            if (isEdit && aircraft) {
                await updateAircraft(aircraft.id, data);
            } else {
                await createAircraft({
                    ...data,
                    status: 'active',
                    lastMaintenanceDate: new Date() as any,
                    nextMaintenanceDate: new Date() as any,
                    maintenanceWindows: [],
                });
            }

            onSaved();
        } catch (err) {
            setError('Failed to save aircraft. Please try again.');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-8 py-6 border-b border-navy-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10">
                    <div>
                        <h2 className="text-xl font-black text-navy-950 tracking-tight uppercase">
                            {isEdit ? 'Edit Aircraft' : 'Add Aircraft'}
                        </h2>
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-1">
                            {isEdit ? `Editing ${aircraft?.registration}` : 'Register new aircraft to fleet'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-navy-50 rounded-xl transition-colors">
                        <span className="material-symbols-outlined text-navy-400">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-navy-300 uppercase tracking-widest flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-primary">flight</span>
                            Aircraft Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="space-y-2">
                                <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Type</span>
                                <input
                                    value={form.type}
                                    onChange={(e) => updateField('type', e.target.value)}
                                    placeholder="e.g. Embraer ERJ-120"
                                    className="w-full h-12 px-4 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Registration</span>
                                <input
                                    value={form.registration}
                                    onChange={(e) => updateField('registration', e.target.value)}
                                    placeholder="e.g. DB-7380"
                                    className="w-full h-12 px-4 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/20 outline-none uppercase"
                                />
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Manufacturer</span>
                                <select
                                    value={form.manufacturer}
                                    onChange={(e) => updateField('manufacturer', e.target.value)}
                                    className="w-full h-12 px-4 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                                >
                                    <option value="">Select...</option>
                                    {MANUFACTURERS.map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Model</span>
                                <input
                                    value={form.model}
                                    onChange={(e) => updateField('model', e.target.value)}
                                    placeholder="e.g. ERJ-120"
                                    className="w-full h-12 px-4 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="space-y-2">
                                <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Range (km)</span>
                                <input
                                    type="number"
                                    value={form.range_km || ''}
                                    onChange={(e) => updateField('range_km', parseInt(e.target.value) || 0)}
                                    className="w-full h-12 px-4 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Home Base (IATA)</span>
                                <input
                                    value={form.homeBase}
                                    onChange={(e) => updateField('homeBase', e.target.value)}
                                    maxLength={3}
                                    className="w-full h-12 px-4 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/20 outline-none uppercase"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Seat Configuration */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-navy-300 uppercase tracking-widest flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-primary">airline_seat_recline_normal</span>
                            Seat Configuration
                        </h3>
                        <div className="grid grid-cols-4 gap-4">
                            <label className="space-y-2">
                                <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Total Seats</span>
                                <input
                                    type="number"
                                    value={form.totalSeats || ''}
                                    onChange={(e) => updateField('totalSeats', parseInt(e.target.value) || 0)}
                                    className="w-full h-12 px-4 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Economy</span>
                                <input
                                    type="number"
                                    value={form.seatConfigEconomy || ''}
                                    onChange={(e) => updateField('seatConfigEconomy', parseInt(e.target.value) || 0)}
                                    className="w-full h-12 px-4 bg-sky-50 border border-sky-200 rounded-xl text-sm font-bold text-navy-950 focus:ring-2 focus:ring-sky-200 outline-none"
                                />
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Business</span>
                                <input
                                    type="number"
                                    value={form.seatConfigBusiness || ''}
                                    onChange={(e) => updateField('seatConfigBusiness', parseInt(e.target.value) || 0)}
                                    className="w-full h-12 px-4 bg-indigo-50 border border-indigo-200 rounded-xl text-sm font-bold text-navy-950 focus:ring-2 focus:ring-indigo-200 outline-none"
                                />
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">First</span>
                                <input
                                    type="number"
                                    value={form.seatConfigFirst || ''}
                                    onChange={(e) => updateField('seatConfigFirst', parseInt(e.target.value) || 0)}
                                    className="w-full h-12 px-4 bg-amber-50 border border-amber-200 rounded-xl text-sm font-bold text-navy-950 focus:ring-2 focus:ring-amber-200 outline-none"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Weight Limits */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-navy-300 uppercase tracking-widest flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-primary">scale</span>
                            Weight Limits (kg)
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <label className="space-y-2">
                                <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Max Takeoff</span>
                                <input
                                    type="number"
                                    value={form.maxTakeoff || ''}
                                    onChange={(e) => updateField('maxTakeoff', parseInt(e.target.value) || 0)}
                                    className="w-full h-12 px-4 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Max Landing</span>
                                <input
                                    type="number"
                                    value={form.maxLanding || ''}
                                    onChange={(e) => updateField('maxLanding', parseInt(e.target.value) || 0)}
                                    className="w-full h-12 px-4 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Max Payload</span>
                                <input
                                    type="number"
                                    value={form.maxPayload || ''}
                                    onChange={(e) => updateField('maxPayload', parseInt(e.target.value) || 0)}
                                    className="w-full h-12 px-4 bg-navy-50 border border-navy-100 rounded-xl text-sm font-bold text-navy-950 focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Notes */}
                    <label className="block space-y-2">
                        <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Notes</span>
                        <textarea
                            value={form.notes}
                            onChange={(e) => updateField('notes', e.target.value)}
                            rows={2}
                            placeholder="Operational notes..."
                            className="w-full px-4 py-3 bg-navy-50 border border-navy-100 rounded-xl text-sm font-medium text-navy-950 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                        />
                    </label>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-500 text-sm">error</span>
                            <span className="text-xs font-bold text-red-700">{error}</span>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
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
                            className="flex-1 py-3.5 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">{isEdit ? 'save' : 'add'}</span>
                            {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Aircraft')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AircraftFormModal;
