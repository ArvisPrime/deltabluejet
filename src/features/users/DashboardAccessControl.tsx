import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getDashboardAccess,
  saveDashboardAccess,
  MODULE_GROUPS,
  ALL_MODULE_IDS,
  type DashboardAccessConfig,
} from '../../services/dashboardAccessService';
import { getRoles, type RoleDoc } from '../../services/rolesPolicyService';
import { useToastStore } from '../../stores/toastStore';

/* Icon lookup — built-in roles get specific icons; custom roles get a fallback */
const ROLE_ICON: Record<string, string> = {
  ops_manager: 'engineering',
  crew_sched: 'calendar_month',
  cs_agent: 'support_agent',
};
const getRoleIcon = (roleId: string) => ROLE_ICON[roleId] || 'badge';

const DashboardAccessControl: React.FC = () => {
  const addToast = useToastStore(s => s.addToast);
  const [config, setConfig] = useState<DashboardAccessConfig>({});
  const [allRoles, setAllRoles] = useState<RoleDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  /* Derive configurable roles (exclude super_admin + customer) */
  const configurableRoles = useMemo(() => {
    return allRoles
      .filter(r => r.id !== 'super_admin' && r.id !== 'customer')
      .map(r => ({
        id: r.id,
        label: r.label,
        icon: ROLE_ICON[r.id] || 'badge',
        color: r.color,
      }));
  }, [allRoles]);

  const [activeRole, setActiveRole] = useState<string>('');

  /* ── Load config + roles from Firestore ──────────────────── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [data, roles] = await Promise.all([getDashboardAccess(), getRoles()]);
      setConfig(data);
      setAllRoles(roles);
      const first = roles.find(r => r.id !== 'super_admin' && r.id !== 'customer');
      if (first) setActiveRole(first.id);
      setLoading(false);
    })();
  }, []);

  /* ── Toggle a single module ─────────────────────────────────── */
  const toggleModule = useCallback((moduleId: string) => {
    setConfig(prev => {
      const current = prev[activeRole] || [];
      const next = current.includes(moduleId)
        ? current.filter(id => id !== moduleId)
        : [...current, moduleId];
      return { ...prev, [activeRole]: next };
    });
    setDirty(true);
  }, [activeRole]);

  /* ── Bulk toggle: select / deselect an entire group ─────────── */
  const toggleGroup = useCallback((moduleIds: string[], selectAll: boolean) => {
    setConfig(prev => {
      const current = prev[activeRole] || [];
      let next: string[];
      if (selectAll) {
        next = Array.from(new Set([...current, ...moduleIds]));
      } else {
        next = current.filter(id => !moduleIds.includes(id));
      }
      return { ...prev, [activeRole]: next };
    });
    setDirty(true);
  }, [activeRole]);

  /* ── Select All / Deselect All for the entire role ─────────── */
  const toggleAll = useCallback((selectAll: boolean) => {
    setConfig(prev => ({
      ...prev,
      [activeRole]: selectAll ? [...ALL_MODULE_IDS] : [],
    }));
    setDirty(true);
  }, [activeRole]);

  /* ── Save to Firestore ─────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveDashboardAccess(config);
      addToast('Access permissions saved successfully', 'success');
      setDirty(false);
    } catch (err) {
      console.error('[DashboardAccessControl] Save error:', err);
      addToast('Failed to save permissions. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }, [config, addToast]);

  const activeModules = config[activeRole] || [];
  const totalModules = ALL_MODULE_IDS.length;
  const enabledCount = activeModules.length;

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-3 border-navy-100 border-t-primary animate-spin" />
        <p className="text-sm font-bold text-navy-400">Loading access configuration…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-navy-950 tracking-tighter uppercase">Dashboard Access Control</h2>
          <p className="text-navy-400 text-sm font-medium italic">Select which sidebar modules each role can access. Super Admin always has full access.</p>
        </div>
        <div className="flex gap-3 items-center">
          {dirty && (
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest animate-pulse flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">warning</span> Unsaved Changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="flex items-center gap-2 h-11 px-6 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">save</span> Save Permissions
              </>
            )}
          </button>
        </div>
      </div>

      {/* Role Selector Tabs */}
      <div className="bg-white rounded-2xl border border-navy-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-navy-100">
          {configurableRoles.map(role => (
            <button
              key={role.id}
              onClick={() => setActiveRole(role.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                activeRole === role.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-navy-400 hover:text-navy-700 hover:bg-navy-50/50'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{role.icon}</span>
              <span className="hidden sm:inline">{role.label}</span>
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div className="px-6 py-4 bg-navy-50/30 border-b border-navy-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">
              {configurableRoles.find(r => r.id === activeRole)?.label}
            </span>
            <span className="text-[10px] font-black text-navy-300 uppercase tracking-widest">
              {enabledCount} / {totalModules} Modules Enabled
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toggleAll(true)}
              className="px-4 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-all"
            >
              Enable All
            </button>
            <button
              onClick={() => toggleAll(false)}
              className="px-4 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-red-100 transition-all"
            >
              Disable All
            </button>
          </div>
        </div>

        {/* Module Groups */}
        <div className="p-6 space-y-6">
          {MODULE_GROUPS.map(group => {
            const groupIds = group.modules.map(m => m.id);
            const enabledInGroup = groupIds.filter(id => activeModules.includes(id)).length;
            const allGroupEnabled = enabledInGroup === groupIds.length;

            return (
              <div key={group.group} className="bg-navy-50/20 rounded-2xl border border-navy-100 overflow-hidden">
                {/* Group Header */}
                <div className="px-6 py-4 bg-navy-50/40 border-b border-navy-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg text-navy-400">{group.icon}</span>
                    <span className="text-xs font-black text-navy-950 uppercase tracking-widest">{group.group}</span>
                    <span className="text-[10px] font-bold text-navy-300 ml-2">
                      {enabledInGroup}/{groupIds.length}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleGroup(groupIds, !allGroupEnabled)}
                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${
                      allGroupEnabled
                        ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    {allGroupEnabled ? 'Disable Group' : 'Enable Group'}
                  </button>
                </div>

                {/* Module List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
                  {group.modules.map(mod => {
                    const isEnabled = activeModules.includes(mod.id);
                    return (
                      <button
                        key={mod.id}
                        onClick={() => toggleModule(mod.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group ${
                          isEnabled
                            ? 'bg-primary/5 border-primary/30 hover:bg-primary/10'
                            : 'bg-white border-navy-100 hover:border-navy-200 opacity-60 hover:opacity-80'
                        }`}
                      >
                        <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                          isEnabled ? 'bg-primary text-white' : 'bg-navy-100 text-navy-400'
                        }`}>
                          <span className="material-symbols-outlined text-sm">{mod.icon}</span>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest truncate ${
                          isEnabled ? 'text-navy-950' : 'text-navy-400'
                        }`}>
                          {mod.label}
                        </span>
                        <span className={`material-symbols-outlined text-sm ml-auto shrink-0 transition-all ${
                          isEnabled ? 'text-emerald-500' : 'text-navy-200'
                        }`}>
                          {isEnabled ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Notice */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-amber-500 mt-0.5">info</span>
        <div>
          <p className="text-xs font-bold text-amber-800">How Access Control Works</p>
          <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
            Changes take effect immediately after saving. Users with the affected role will only see the enabled modules
            in their sidebar on their next page load. <strong>Super Admin</strong> always retains full access regardless of these settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardAccessControl;
