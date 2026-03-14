import React, { useState, useEffect, useMemo } from 'react';
import type { AircraftDoc } from '../../types/firestore';
import { subscribeToAircraft, updateAircraft } from '../../services/firestore';
import AircraftDetailPanel from '../../components/fleet/AircraftDetailPanel';
import AircraftFormModal from '../../components/fleet/AircraftFormModal';
import MaintenanceScheduler from '../../components/fleet/MaintenanceScheduler';
import SeatLayoutPreview from '../../components/fleet/SeatLayoutPreview';
import { useToastStore } from '../../stores/toastStore';

type StatusFilter = 'all' | 'active' | 'maintenance' | 'retired';

const STATUS_BADGE = {
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  maintenance: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  retired: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

const FleetManagement: React.FC = () => {
  const [aircraft, setAircraft] = useState<AircraftDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftDoc | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editAircraft, setEditAircraft] = useState<AircraftDoc | null>(null);
  const [showMaintenance, setShowMaintenance] = useState<AircraftDoc | null>(null);

  // Subscribe to live updates
  useEffect(() => {
    const unsubscribe = subscribeToAircraft((data) => {
      setAircraft(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Filtered + searched aircraft
  const filteredAircraft = useMemo(() => {
    let result = aircraft;

    if (statusFilter !== 'all') {
      result = result.filter((ac) => ac.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (ac) =>
          ac.registration.toLowerCase().includes(q) ||
          ac.type.toLowerCase().includes(q) ||
          ac.manufacturer.toLowerCase().includes(q) ||
          ac.model.toLowerCase().includes(q)
      );
    }

    return result;
  }, [aircraft, statusFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total: aircraft.length,
    active: aircraft.filter((a) => a.status === 'active').length,
    maintenance: aircraft.filter((a) => a.status === 'maintenance').length,
    retired: aircraft.filter((a) => a.status === 'retired').length,
  }), [aircraft]);

  const handleStatusChange = async (aircraftDoc: AircraftDoc, newStatus: AircraftDoc['status']) => {
    try {
      await updateAircraft(aircraftDoc.id, { status: newStatus });
      // Update local selected if same
      if (selectedAircraft?.id === aircraftDoc.id) {
        setSelectedAircraft({ ...aircraftDoc, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      useToastStore.getState().addToast("Failed to update status", "error");
    }
  };

  const handleSaved = () => {
    setShowAddModal(false);
    setEditAircraft(null);
    setShowMaintenance(null);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-navy-950 tracking-tight uppercase">Fleet Management</h1>
          <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-1">
            Aircraft Registry & Configuration
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add Aircraft
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Fleet', value: stats.total, icon: 'flight', color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'Active', value: stats.active, icon: 'check_circle', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'In Maintenance', value: stats.maintenance, icon: 'engineering', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Retired', value: stats.retired, icon: 'cancel', color: 'text-red-600', bg: 'bg-red-50' },
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
          {(['all', 'active', 'maintenance', 'retired'] as StatusFilter[]).map((s) => (
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
            placeholder="Search by registration, type, manufacturer..."
            className="w-full h-11 pl-10 pr-4 bg-white border border-navy-100 rounded-2xl text-sm font-medium text-navy-950 focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className={`grid gap-6 ${selectedAircraft ? 'grid-cols-[1fr_420px]' : 'grid-cols-1'}`}>
        {/* Aircraft Table */}
        <div className="bg-white rounded-3xl border border-navy-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin size-8 border-2 border-navy-200 border-t-primary rounded-full mx-auto mb-4" />
              <p className="text-xs font-bold text-navy-400">Loading fleet data...</p>
            </div>
          ) : filteredAircraft.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-navy-200 mb-4 block">flight_takeoff</span>
              <p className="text-sm font-bold text-navy-400">No aircraft found</p>
              <p className="text-xs text-navy-300 mt-1">
                {searchQuery ? 'Try adjusting your search' : 'Add some aircraft to get started'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-100">
                  {['Registration', 'Type', 'Seats', 'Range', 'Status', 'Home'].map((h) => (
                    <th key={h} className="text-left px-5 py-4 text-[9px] font-black text-navy-300 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAircraft.map((ac) => {
                  const badge = STATUS_BADGE[ac.status] || STATUS_BADGE.active;
                  const isSelected = selectedAircraft?.id === ac.id;
                  return (
                    <tr
                      key={ac.id}
                      onClick={() => setSelectedAircraft(isSelected ? null : ac)}
                      className={`border-b border-navy-50 cursor-pointer transition-all ${isSelected
                          ? 'bg-primary/5 border-l-4 border-l-primary'
                          : 'hover:bg-navy-50/50'
                        }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-navy-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm text-navy-400">flight</span>
                          </div>
                          <div>
                            <p className="text-sm font-black text-navy-950 tracking-tight">{ac.registration}</p>
                            <p className="text-[10px] text-navy-400 font-medium">{ac.manufacturer}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-navy-700">{ac.type}</p>
                        <p className="text-[10px] text-navy-400 font-medium">{ac.model}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-black text-navy-950">{ac.totalSeats}</p>
                        <div className="w-20 mt-1">
                          <SeatLayoutPreview seatConfig={ac.seatConfig} compact />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-navy-700">{ac.range_km?.toLocaleString()} km</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${badge.bg} ${badge.text}`}>
                          <span className={`size-1.5 rounded-full ${badge.dot} ${ac.status === 'active' ? 'animate-pulse' : ''}`} />
                          {ac.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold text-navy-500">{ac.homeBase}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {selectedAircraft && (
          <AircraftDetailPanel
            aircraft={selectedAircraft}
            onEdit={() => {
              setEditAircraft(selectedAircraft);
            }}
            onScheduleMaintenance={() => {
              setShowMaintenance(selectedAircraft);
            }}
            onStatusChange={(status) => handleStatusChange(selectedAircraft, status)}
            onClose={() => setSelectedAircraft(null)}
          />
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AircraftFormModal onClose={() => setShowAddModal(false)} onSaved={handleSaved} />
      )}
      {editAircraft && (
        <AircraftFormModal aircraft={editAircraft} onClose={() => setEditAircraft(null)} onSaved={handleSaved} />
      )}
      {showMaintenance && (
        <MaintenanceScheduler aircraft={showMaintenance} onClose={() => setShowMaintenance(null)} onSaved={handleSaved} />
      )}
    </div>
  );
};

export default FleetManagement;
