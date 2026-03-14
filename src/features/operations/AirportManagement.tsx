
import React, { useState, useEffect, useCallback } from 'react';
import { useToastStore } from '../../stores/toastStore';
import {
    getAirports,
    createAirport,
    updateAirport,
    deleteAirport,
    toggleAirportActive,
    seedDefaultAirports,
    type Airport,
} from '../../services/airportService';

/* ── Modal for Add / Edit ────────────────────────────────────── */
interface AirportFormProps {
    airport?: Airport;
    onClose: () => void;
    onSaved: () => void;
}

const AirportForm: React.FC<AirportFormProps> = ({ airport, onClose, onSaved }) => {
    const isEdit = !!airport;
    const addToast = useToastStore(s => s.addToast);

    const [code, setCode] = useState(airport?.code ?? '');
    const [name, setName] = useState(airport?.name ?? '');
    const [city, setCity] = useState(airport?.city ?? '');
    const [country, setCountry] = useState(airport?.country ?? '');
    const [timezone, setTimezone] = useState(airport?.timezone ?? '');
    const [lat, setLat] = useState(airport?.lat?.toString() ?? '');
    const [lng, setLng] = useState(airport?.lng?.toString() ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const trimCode = code.trim().toUpperCase();
        if (!trimCode || trimCode.length !== 3) { setError('IATA code must be exactly 3 letters.'); return; }
        if (!name.trim()) { setError('Airport name is required.'); return; }
        if (!city.trim()) { setError('City is required.'); return; }
        if (!country.trim()) { setError('Country is required.'); return; }
        if (!lat || !lng || isNaN(Number(lat)) || isNaN(Number(lng))) { setError('Valid latitude and longitude are required.'); return; }

        setSaving(true);
        try {
            if (isEdit) {
                await updateAirport(trimCode, { name: name.trim(), city: city.trim(), country: country.trim(), timezone: timezone.trim(), lat: Number(lat), lng: Number(lng) });
                addToast(`Airport ${trimCode} updated`, 'success');
            } else {
                await createAirport({ code: trimCode, name: name.trim(), city: city.trim(), country: country.trim(), timezone: timezone.trim(), lat: Number(lat), lng: Number(lng) });
                addToast(`Airport ${trimCode} created`, 'success');
            }
            onSaved();
        } catch (err: any) {
            setError(err.message || 'Failed to save airport.');
        } finally {
            setSaving(false);
        }
    };

    const FIELD = "w-full h-11 px-4 rounded-xl border border-navy-100 bg-white text-sm font-bold text-navy-800 focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-navy-100 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-5 border-b border-navy-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-lg">flight_takeoff</span>
                        </div>
                        <h2 className="text-lg font-black text-navy-950 tracking-tight">{isEdit ? 'Edit Airport' : 'Add Airport'}</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-navy-100 rounded-lg">
                        <span className="material-symbols-outlined text-navy-400 text-sm">close</span>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600">{error}</div>}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1.5">IATA Code</label>
                            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={3} disabled={isEdit} placeholder="e.g. BJL" className={FIELD} />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Timezone</label>
                            <input value={timezone} onChange={e => setTimezone(e.target.value)} placeholder="e.g. Africa/Banjul" className={FIELD} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Airport Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Full airport name" className={FIELD} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1.5">City</label>
                            <input value={city} onChange={e => setCity(e.target.value)} placeholder="City name" className={FIELD} />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Country</label>
                            <input value={country} onChange={e => setCountry(e.target.value)} placeholder="Country name" className={FIELD} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Latitude</label>
                            <input type="number" step="0.001" value={lat} onChange={e => setLat(e.target.value)} placeholder="e.g. 13.338" className={FIELD} />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Longitude</label>
                            <input type="number" step="0.001" value={lng} onChange={e => setLng(e.target.value)} placeholder="e.g. -16.652" className={FIELD} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-navy-100 text-navy-500 font-black text-[10px] uppercase tracking-widest hover:bg-navy-50 transition-all">Cancel</button>
                        <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary-600 transition-all disabled:opacity-50">
                            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Airport Management — Admin Page
   ═══════════════════════════════════════════════════════════════ */
const AirportManagement: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const [airports, setAirports] = useState<Airport[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState<Airport | undefined>();
    const [seeding, setSeeding] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAirports(true); // include inactive
            setAirports(data);
        } catch (err) {
            addToast('Failed to load airports', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => { load(); }, [load]);

    const handleSeed = async () => {
        setSeeding(true);
        try {
            const count = await seedDefaultAirports();
            addToast(count > 0 ? `Seeded ${count} airports` : 'All airports already exist', count > 0 ? 'success' : 'info');
            await load();
        } catch (err) {
            addToast('Failed to seed airports', 'error');
        } finally {
            setSeeding(false);
        }
    };

    const handleDelete = async (code: string) => {
        if (!window.confirm(`Delete airport ${code}? This cannot be undone.`)) return;
        try {
            await deleteAirport(code);
            addToast(`Airport ${code} deleted`, 'success');
            await load();
        } catch (err) {
            addToast('Failed to delete airport', 'error');
        }
    };

    const handleToggle = async (code: string, isActive: boolean) => {
        try {
            await toggleAirportActive(code, !isActive);
            addToast(`${code} ${!isActive ? 'activated' : 'deactivated'}`, 'success');
            await load();
        } catch (err) {
            addToast('Failed to update status', 'error');
        }
    };

    const openEdit = (airport: Airport) => { setEditTarget(airport); setShowForm(true); };
    const openAdd = () => { setEditTarget(undefined); setShowForm(true); };
    const closeForm = () => { setShowForm(false); setEditTarget(undefined); };
    const onSaved = () => { closeForm(); load(); };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">
                        <span>Admin</span>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                        <span className="text-primary">Airports</span>
                    </nav>
                    <h1 className="text-3xl font-black text-navy-950 tracking-tight">Airport Management</h1>
                    <p className="text-navy-500 font-medium">Manage the airports in the DeltaBlue network.</p>
                </div>
                <div className="flex gap-3">
                    {airports.length === 0 && !loading && (
                        <button
                            onClick={handleSeed}
                            disabled={seeding}
                            className="px-6 py-2.5 bg-white border border-navy-100 text-navy-700 font-bold rounded-xl shadow-sm hover:bg-navy-50 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-lg">database</span>
                            {seeding ? 'Seeding...' : 'Seed Defaults'}
                        </button>
                    )}
                    <button
                        onClick={openAdd}
                        className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-600 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Add Airport
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-navy-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
                    </div>
                ) : airports.length === 0 ? (
                    <div className="text-center py-24 space-y-4">
                        <span className="material-symbols-outlined text-6xl text-navy-200">flight_takeoff</span>
                        <p className="text-sm font-black text-navy-300 uppercase tracking-widest">No airports yet</p>
                        <p className="text-xs text-navy-400 max-w-sm mx-auto">Click <strong>Seed Defaults</strong> to populate the 10 DeltaBlue network airports, or add them manually.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-navy-50/50 border-b border-navy-100 text-[10px] font-black text-navy-400 uppercase tracking-widest">
                                    <th className="px-6 py-4">Code</th>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">City</th>
                                    <th className="px-6 py-4">Country</th>
                                    <th className="px-6 py-4">Coordinates</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-navy-50">
                                {airports.map(a => (
                                    <tr key={a.code} className={`group ${!a.isActive ? 'opacity-50' : ''}`}>
                                        <td className="px-6 py-5">
                                            <span className="font-black text-primary text-sm">{a.code}</span>
                                        </td>
                                        <td className="px-6 py-5 text-sm font-bold text-navy-900">{a.name}</td>
                                        <td className="px-6 py-5 text-sm font-medium text-navy-600">{a.city}</td>
                                        <td className="px-6 py-5 text-sm font-medium text-navy-500">{a.country}</td>
                                        <td className="px-6 py-5">
                                            <span className="text-[10px] font-mono text-navy-400">{a.lat.toFixed(3)}, {a.lng.toFixed(3)}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <button
                                                onClick={() => handleToggle(a.code, a.isActive)}
                                                className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border cursor-pointer transition-colors ${a.isActive
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                                                    : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                                                }`}
                                            >
                                                {a.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEdit(a)}
                                                    className="p-2 rounded-lg hover:bg-navy-50 transition-colors"
                                                    title="Edit"
                                                >
                                                    <span className="material-symbols-outlined text-navy-400 text-base">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(a.code)}
                                                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                    title="Delete"
                                                >
                                                    <span className="material-symbols-outlined text-red-400 text-base">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showForm && <AirportForm airport={editTarget} onClose={closeForm} onSaved={onSaved} />}
        </div>
    );
};

export default AirportManagement;
