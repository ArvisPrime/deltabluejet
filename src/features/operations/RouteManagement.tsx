import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { RouteDoc } from '../../types/firestore';
import { subscribeToRoutes, deleteRoute } from '../../services/firestore';
import { useToastStore } from '../../stores/toastStore';
import RouteDetailPanel from '../../components/routes/RouteDetailPanel';
import RouteFormModal from '../../components/routes/RouteFormModal';

type StatusFilter = 'all' | 'active' | 'inactive';
type ViewMode = 'grid' | 'list';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_FULL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ── solid dark blue for all route card headers ───────────── */
const CARD_HEADER_BG = 'bg-[#1a2744]';

const RouteManagement: React.FC = () => {
    const [routes, setRoutes] = useState<RouteDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editRoute, setEditRoute] = useState<RouteDoc | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [deleteTarget, setDeleteTarget] = useState<RouteDoc | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const unsub = subscribeToRoutes((data) => {
            setRoutes(data);
            setLoading(false);
        });
        return unsub;
    }, []);

    const filteredRoutes = useMemo(() => {
        let result = routes;
        if (statusFilter === 'active') result = result.filter((r) => r.isActive);
        if (statusFilter === 'inactive') result = result.filter((r) => !r.isActive);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (r) =>
                    r.origin.code.toLowerCase().includes(q) ||
                    r.destination.code.toLowerCase().includes(q) ||
                    r.origin.city.toLowerCase().includes(q) ||
                    r.destination.city.toLowerCase().includes(q)
            );
        }
        return result;
    }, [routes, statusFilter, searchQuery]);

    const selectedRoute = useMemo(
        () => (selectedRouteId ? routes.find((r) => r.id === selectedRouteId) || null : null),
        [routes, selectedRouteId]
    );

    const stats = useMemo(() => ({
        total: routes.length,
        active: routes.filter((r) => r.isActive).length,
        inactive: routes.filter((r) => !r.isActive).length,
    }), [routes]);

    const handleSaved = useCallback(() => {
        setShowAddModal(false);
        setEditRoute(null);
    }, []);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteRoute(deleteTarget.id);
            useToastStore.getState().addToast(`Route ${deleteTarget.origin.code} → ${deleteTarget.destination.code} deleted`, 'success');
            if (selectedRouteId === deleteTarget.id) setSelectedRouteId(null);
        } catch (err) {
            console.error('Delete route error:', err);
            useToastStore.getState().addToast('Failed to delete route', 'error');
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    const formatDuration = (min: number) => {
        if (!min) return '—';
        const h = Math.floor(min / 60);
        const m = min % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    return (
        <div className="space-y-8">
            {/* ── Page Header with gradient mesh ─────────────────── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-8 shadow-2xl">
                {/* decorative shapes */}
                <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
                <div className="pointer-events-none absolute -left-16 bottom-0 size-56 rounded-full bg-fuchsia-400/20 blur-2xl" />

                <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/90 backdrop-blur">
                            <span className="material-symbols-outlined text-sm">public</span>
                            Network Overview
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-lg sm:text-5xl">Route Management</h1>
                        <p className="mt-1 text-sm font-bold text-white/60 uppercase tracking-widest">
                            Routes &amp; Fare Configuration
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 self-start rounded-2xl bg-white px-6 py-3 font-black text-[11px] uppercase tracking-widest text-indigo-700 shadow-xl shadow-indigo-900/30 transition-all hover:scale-105 hover:shadow-2xl active:scale-95 sm:self-auto"
                    >
                        <span className="material-symbols-outlined text-sm">add_circle</span>
                        Add Route
                    </button>
                </div>
            </div>

            {/* ── Stat Cards ────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                    { label: 'Total Routes', value: stats.total, icon: 'route', gradient: 'from-indigo-500 to-violet-600', shadow: 'shadow-indigo-500/25' },
                    { label: 'Active', value: stats.active, icon: 'check_circle', gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/25' },
                    { label: 'Inactive', value: stats.inactive, icon: 'cancel', gradient: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/25' },
                ].map((stat) => (
                    <div key={stat.label} className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.gradient} p-5 shadow-lg ${stat.shadow} transition-all hover:-translate-y-1 hover:shadow-xl`}>
                        <div className="pointer-events-none absolute -right-4 -top-4 size-24 rounded-full bg-white/10 blur-xl transition-all group-hover:scale-150" />
                        <div className="relative flex items-center gap-4">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-inner">
                                <span className="material-symbols-outlined text-2xl text-white">{stat.icon}</span>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-white tracking-tight">{stat.value}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/70">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Toolbar: Filters + View Toggle ────────────────── */}
            <div className="flex flex-wrap items-center gap-4">
                {/* Status Filter Pills */}
                <div className="flex items-center gap-1 rounded-2xl bg-navy-50 p-1">
                    {(['all', 'active', 'inactive'] as StatusFilter[]).map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                                statusFilter === s
                                    ? 'bg-white text-navy-950 shadow-sm'
                                    : 'text-navy-400 hover:text-navy-700'
                            }`}
                        >
                            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 text-sm">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by airport code or city..."
                        className="h-11 w-full rounded-2xl border border-navy-100 bg-white pl-10 pr-4 text-sm font-medium text-navy-950 outline-none focus:ring-2 focus:ring-violet-300"
                    />
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 rounded-2xl bg-navy-50 p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                            viewMode === 'grid'
                                ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-sm'
                                : 'text-navy-400 hover:text-navy-700'
                        }`}
                    >
                        <span className="material-symbols-outlined text-sm">grid_view</span>
                        Grid
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                            viewMode === 'list'
                                ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-sm'
                                : 'text-navy-400 hover:text-navy-700'
                        }`}
                    >
                        <span className="material-symbols-outlined text-sm">view_list</span>
                        List
                    </button>
                </div>
            </div>

            {/* ── Content Area ───────────────────────────────────── */}
            <div className={`grid gap-6 ${selectedRoute ? 'grid-cols-[1fr_420px]' : 'grid-cols-1'}`}>
                {/* Main Content */}
                <div>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center rounded-3xl border border-navy-100 bg-white p-16">
                            <div className="mb-4 size-10 animate-spin rounded-full border-[3px] border-violet-200 border-t-violet-600" />
                            <p className="text-xs font-bold text-navy-400">Loading route network...</p>
                        </div>
                    ) : filteredRoutes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-3xl border border-navy-100 bg-white p-16 text-center">
                            <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100">
                                <span className="material-symbols-outlined text-4xl text-violet-400">route</span>
                            </div>
                            <p className="text-sm font-bold text-navy-500">No routes found</p>
                            <p className="mt-1 text-xs text-navy-300">
                                {searchQuery ? 'Try adjusting your search' : 'Add routes to build your network'}
                            </p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        /* ── GRID VIEW ──────────────────────────────── */
                        <div className={`grid gap-5 ${selectedRoute ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
                            {filteredRoutes.map((rt, idx) => {
                                const isSelected = selectedRoute?.id === rt.id;
                                return (
                                    <div
                                        key={rt.id}
                                        className={`group relative overflow-hidden rounded-2xl border bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl ${
                                            isSelected ? 'ring-2 ring-violet-400 border-violet-300' : 'border-navy-100'
                                        }`}
                                    >
                                        {/* Card Header — gradient strip */}
                                        <div className={`relative ${CARD_HEADER_BG} px-5 py-4`}>
                                            <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-white/10 blur-xl" />
                                            <div className="relative flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 shadow-inner backdrop-blur-sm">
                                                        <span className="material-symbols-outlined text-lg text-white">flight_takeoff</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-black tracking-tight text-white">
                                                            {rt.origin.code} → {rt.destination.code}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                                                            {rt.origin.city} — {rt.destination.city}
                                                        </p>
                                                    </div>
                                                </div>
                                                {/* Status badge */}
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest backdrop-blur-sm ${
                                                    rt.isActive
                                                        ? 'bg-emerald-400/20 text-emerald-100'
                                                        : 'bg-red-400/20 text-red-100'
                                                }`}>
                                                    <span className={`size-1.5 rounded-full ${rt.isActive ? 'bg-emerald-300 animate-pulse' : 'bg-red-300'}`} />
                                                    {rt.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="space-y-4 p-5">
                                            {/* Quick Stats */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 p-2.5 text-center border border-sky-100">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-sky-400">Distance</p>
                                                    <p className="text-xs font-black text-sky-700">{rt.distance_km.toLocaleString()} km</p>
                                                </div>
                                                <div className="rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 p-2.5 text-center border border-violet-100">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-violet-400">Duration</p>
                                                    <p className="text-xs font-black text-violet-700">{formatDuration(rt.duration_minutes)}</p>
                                                </div>
                                                <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-2.5 text-center border border-emerald-100">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Economy</p>
                                                    <p className="text-xs font-black text-emerald-700">
                                                        {rt.baseFares?.economy ? `$${rt.baseFares.economy}` : '—'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Fare Classes Chips */}
                                            {rt.baseFares && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {rt.baseFares.economy > 0 && (
                                                        <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white">
                                                            Economy ${rt.baseFares.economy}
                                                        </span>
                                                    )}
                                                    {rt.baseFares.business > 0 && (
                                                        <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white">
                                                            Business ${rt.baseFares.business}
                                                        </span>
                                                    )}
                                                    {rt.baseFares.first > 0 && (
                                                        <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white">
                                                            First ${rt.baseFares.first}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Frequency Pills */}
                                            <div className="flex gap-1">
                                                {DAY_LABELS.map((d, i) => (
                                                    <span
                                                        key={i}
                                                        className={`flex size-7 items-center justify-center rounded-lg text-[9px] font-black transition-all ${
                                                            rt.frequency?.includes(i + 1)
                                                                ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm shadow-violet-500/30'
                                                                : 'bg-navy-50 text-navy-300'
                                                        }`}
                                                    >
                                                        {d}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 border-t border-navy-50 pt-3">
                                                <button
                                                    onClick={() => setSelectedRouteId(isSelected ? null : rt.id)}
                                                    className="flex items-center gap-1 rounded-xl bg-navy-50 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-navy-600 transition-all hover:bg-violet-50 hover:text-violet-700"
                                                >
                                                    <span className="material-symbols-outlined text-xs">visibility</span>
                                                    {isSelected ? 'Close' : 'Details'}
                                                </button>
                                                <button
                                                    onClick={() => setEditRoute(rt)}
                                                    className="flex items-center gap-1 rounded-xl bg-navy-50 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-navy-600 transition-all hover:bg-blue-50 hover:text-blue-700"
                                                >
                                                    <span className="material-symbols-outlined text-xs">edit</span>
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(rt)}
                                                    className="ml-auto flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-red-500 transition-all hover:bg-red-100 hover:text-red-700"
                                                >
                                                    <span className="material-symbols-outlined text-xs">delete</span>
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* ── LIST VIEW ──────────────────────────────── */
                        <div className="overflow-hidden rounded-3xl border border-navy-100 bg-white shadow-sm">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-navy-50 to-slate-50 border-b border-navy-100">
                                        {['Route', 'Distance', 'Duration', 'Fares', 'Frequency', 'Status', ''].map((h) => (
                                            <th key={h} className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-widest text-navy-400">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRoutes.map((rt, idx) => {
                                        const isSelected = selectedRoute?.id === rt.id;
                                        return (
                                            <tr
                                                key={rt.id}
                                                className={`group border-b border-navy-50 transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-violet-50/50 border-l-4 border-l-violet-500'
                                                        : 'hover:bg-navy-50/50'
                                                }`}
                                                onClick={() => setSelectedRouteId(isSelected ? null : rt.id)}
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`flex size-10 items-center justify-center rounded-xl ${CARD_HEADER_BG} shadow-sm`}>
                                                            <span className="material-symbols-outlined text-sm text-white">flight_takeoff</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black tracking-tight text-navy-950">
                                                                {rt.origin.code} → {rt.destination.code}
                                                            </p>
                                                            <p className="text-[10px] font-medium text-navy-400">
                                                                {rt.origin.city} to {rt.destination.city}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="text-xs font-bold text-navy-700">{rt.distance_km.toLocaleString()} km</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="text-xs font-bold text-navy-700">{formatDuration(rt.duration_minutes)}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {rt.baseFares?.economy > 0 && (
                                                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[8px] font-black text-emerald-700">E ${rt.baseFares.economy}</span>
                                                        )}
                                                        {rt.baseFares?.business > 0 && (
                                                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[8px] font-black text-blue-700">B ${rt.baseFares.business}</span>
                                                        )}
                                                        {rt.baseFares?.first > 0 && (
                                                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[8px] font-black text-amber-700">F ${rt.baseFares.first}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex gap-0.5">
                                                        {DAY_LABELS.map((d, i) => (
                                                            <span
                                                                key={i}
                                                                title={DAY_FULL[i]}
                                                                className={`flex size-5 items-center justify-center rounded text-[8px] font-black ${
                                                                    rt.frequency?.includes(i + 1)
                                                                        ? 'bg-violet-100 text-violet-700'
                                                                        : 'bg-navy-50 text-navy-300'
                                                                }`}
                                                            >
                                                                {d}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest ${
                                                        rt.isActive
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-red-50 text-red-700'
                                                    }`}>
                                                        <span className={`size-1.5 rounded-full ${rt.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                                        {rt.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-4">
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setEditRoute(rt); }}
                                                            className="flex size-8 items-center justify-center rounded-lg text-navy-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                                                            title="Edit route"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(rt); }}
                                                            className="flex size-8 items-center justify-center rounded-lg text-navy-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                                            title="Delete route"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Detail Panel */}
                {selectedRoute && (
                    <RouteDetailPanel
                        route={selectedRoute}
                        onEdit={() => setEditRoute(selectedRoute)}
                        onClose={() => setSelectedRouteId(null)}
                        onDelete={() => setSelectedRouteId(null)}
                    />
                )}
            </div>

            {/* ── Delete Confirmation Modal ──────────────────────── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md space-y-6 rounded-3xl border border-navy-100 bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-rose-200">
                                <span className="material-symbols-outlined text-3xl text-red-500">delete_forever</span>
                            </div>
                            <div className="space-y-2 text-center">
                                <h3 className="text-xl font-black tracking-tight text-navy-950">Delete Route</h3>
                                <p className="text-sm text-navy-500">
                                    Permanently delete <strong>{deleteTarget.origin.code} → {deleteTarget.destination.code}</strong>?
                                    This cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="h-12 flex-1 rounded-xl border border-navy-200 bg-white font-black text-navy-700 transition-all hover:bg-navy-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="h-12 flex-1 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 font-black text-white shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <><div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Deleting…</>
                                ) : (
                                    'Delete Route'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Form Modals ───────────────────────────────────── */}
            {showAddModal && (
                <RouteFormModal onClose={() => setShowAddModal(false)} onSaved={handleSaved} />
            )}
            {editRoute && (
                <RouteFormModal route={editRoute} onClose={() => setEditRoute(null)} onSaved={handleSaved} />
            )}
        </div>
    );
};

export default RouteManagement;
