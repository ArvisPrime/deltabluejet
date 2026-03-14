import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { RouteDoc } from '../../types/firestore';
import { subscribeToRoutes } from '../../services/firestore';
import RouteDetailPanel from '../../components/routes/RouteDetailPanel';
import RouteFormModal from '../../components/routes/RouteFormModal';

type StatusFilter = 'all' | 'active' | 'inactive';

const RouteManagement: React.FC = () => {
    const [routes, setRoutes] = useState<RouteDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editRoute, setEditRoute] = useState<RouteDoc | null>(null);

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

    // Derive selected route from live data so it always reflects real-time updates
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

    const formatDuration = (min: number) => {
        if (!min) return '—';
        const h = Math.floor(min / 60);
        const m = min % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-navy-950 tracking-tight uppercase">Route Management</h1>
                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-1">
                        Network Routes & Fare Configuration
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add Route
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Routes', value: stats.total, icon: 'route', color: 'text-primary', bg: 'bg-primary/5' },
                    { label: 'Active', value: stats.active, icon: 'check_circle', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Inactive', value: stats.inactive, icon: 'cancel', color: 'text-red-600', bg: 'bg-red-50' },
                ].map((stat) => (
                    <div key={stat.label} className="p-5 bg-white rounded-2xl border border-navy-100 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                            <div className={`size-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                <span className={`material-symbols-outlined text-lg ${stat.color}`}>{stat.icon}</span>
                            </div>
                            <div>
                                <p className="text-2xl font-black text-navy-950 tracking-tight">{stat.value}</p>
                                <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-navy-50 rounded-2xl p-1">
                    {(['all', 'active', 'inactive'] as StatusFilter[]).map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s
                                    ? 'bg-white text-navy-950 shadow-sm'
                                    : 'text-navy-400 hover:text-navy-700'
                                }`}
                        >
                            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="flex-1 relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 text-sm">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by airport code or city..."
                        className="w-full h-11 pl-10 pr-4 bg-white border border-navy-100 rounded-2xl text-sm font-medium text-navy-950 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>
            </div>

            {/* Content */}
            <div className={`grid gap-6 ${selectedRoute ? 'grid-cols-[1fr_420px]' : 'grid-cols-1'}`}>
                {/* Route Table */}
                <div className="bg-white rounded-3xl border border-navy-100 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin size-8 border-2 border-navy-200 border-t-primary rounded-full mx-auto mb-4" />
                            <p className="text-xs font-bold text-navy-400">Loading routes...</p>
                        </div>
                    ) : filteredRoutes.length === 0 ? (
                        <div className="p-12 text-center">
                            <span className="material-symbols-outlined text-4xl text-navy-200 mb-4 block">route</span>
                            <p className="text-sm font-bold text-navy-400">No routes found</p>
                            <p className="text-xs text-navy-300 mt-1">
                                {searchQuery ? 'Try adjusting your search' : 'Add routes to build your network'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-navy-100">
                                    {['Route', 'Distance', 'Duration', 'Economy Fare', 'Frequency', 'Status'].map((h) => (
                                        <th key={h} className="text-left px-5 py-4 text-[9px] font-black text-navy-300 uppercase tracking-widest">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRoutes.map((rt) => {
                                    const isSelected = selectedRoute?.id === rt.id;
                                    return (
                                        <tr
                                            key={rt.id}
                                            onClick={() => setSelectedRouteId(isSelected ? null : rt.id)}
                                            className={`border-b border-navy-50 cursor-pointer transition-all ${isSelected
                                                    ? 'bg-primary/5 border-l-4 border-l-primary'
                                                    : 'hover:bg-navy-50/50'
                                                }`}
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-9 rounded-xl bg-navy-50 flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-sm text-navy-400">route</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-navy-950 tracking-tight">
                                                            {rt.origin.code} → {rt.destination.code}
                                                        </p>
                                                        <p className="text-[10px] text-navy-400 font-medium">
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
                                                <p className="text-xs font-black text-navy-950">
                                                    {rt.baseFares?.economy ? `$${rt.baseFares.economy}` : '—'}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex gap-0.5">
                                                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                                                        <span
                                                            key={i}
                                                            className={`size-5 rounded text-[8px] font-black flex items-center justify-center ${rt.frequency?.includes(i + 1)
                                                                    ? 'bg-primary/10 text-primary'
                                                                    : 'bg-navy-50 text-navy-300'
                                                                }`}
                                                        >
                                                            {d}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${rt.isActive
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-red-50 text-red-700'
                                                    }`}>
                                                    <span className={`size-1.5 rounded-full ${rt.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                                    {rt.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
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

            {/* Modals */}
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
