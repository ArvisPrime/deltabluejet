
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { logAuditEntry } from '../../services/firestore';
import { useToastStore } from '../../stores/toastStore';
import { ROUTES } from '../../config/routes';

// ─── Types ────────────────────────────────────────────────

interface RoleDef {
  id: string;
  label: string;
  sub: string;
  icon: string;
  count: number;
}

interface PermToggle {
  key: string;
  label: string;
  desc: string;
  locked?: boolean;
}

interface ChannelRow {
  key: string;
  label: string;
  desc: string;
}

interface PermSection {
  title: string;
  sub: string;
  icon: string;
  color: string;
  bg: string;
  type: 'toggle' | 'channel';
  rows: (PermToggle | ChannelRow)[];
}

// ─── Role definitions ─────────────────────────────────────

const ROLES: RoleDef[] = [
  { id: 'Admin', label: 'Administrator', sub: 'Full Access', icon: 'admin_panel_settings', count: 3 },
  { id: 'Dispatcher', label: 'Flight Dispatcher', sub: 'Manages Alerts', icon: 'flight_takeoff', count: 12 },
  { id: 'Agent', label: 'Gate Agent', sub: 'View Only', icon: 'confirmation_number', count: 45 },
  { id: 'Maint', label: 'Maintenance', sub: 'Maintenance Alerts', icon: 'engineering', count: 8 },
  { id: 'Ground', label: 'Ground Ops', sub: 'Ground Alerts', icon: 'local_shipping', count: 22 },
];

// ─── Permission sections per role ─────────────────────────

const SECTIONS: PermSection[] = [
  {
    title: 'Alert Rules', sub: 'Who can create or edit alert rules', icon: 'tune', color: 'text-primary', bg: 'bg-primary/5',
    type: 'toggle',
    rows: [
      { key: 'create_edit_rules', label: 'Create & Edit Alert Rules', desc: 'Allows creating new alerts and editing alert thresholds.' },
      { key: 'delete_critical', label: 'Delete Safety-Critical Alerts', desc: 'Permanently remove safety-critical alert definitions.', locked: true },
    ],
  },
  {
    title: 'How Alerts Are Sent', sub: 'Choose notification channels per alert level', icon: 'notifications_active', color: 'text-orange-600', bg: 'bg-orange-50',
    type: 'channel',
    rows: [
      { key: 'critical_channel', label: 'Critical Alert', desc: 'Safety and security alerts sent to all staff.' },
      { key: 'warning_channel', label: 'Warning Alert', desc: 'Aircraft and crew availability alerts.' },
    ],
  },
  {
    title: 'Alert Response Actions', sub: 'What actions each role can take on active alerts', icon: 'bolt', color: 'text-indigo-600', bg: 'bg-indigo-50',
    type: 'toggle',
    rows: [
      { key: 'acknowledge', label: 'Acknowledge Active Alerts', desc: 'Mark an alert as "being handled" so other staff can see.' },
      { key: 'escalate', label: 'Send to Senior Ops Team', desc: 'Forward the alert to the senior operations team for review.' },
      { key: 'resolve_archive', label: 'Close & Save to Log', desc: 'Mark alert as resolved and save a record to the audit log.', locked: true },
    ],
  },
];

// ─── Default toggle/channel state per role ────────────────

function getDefaultState(roleId: string) {
  const toggles: Record<string, boolean> = {};
  const channels: Record<string, Record<string, boolean>> = {};

  const presets: Record<string, Record<string, boolean>> = {
    Admin: { create_edit_rules: true, delete_critical: true, acknowledge: true, escalate: true, resolve_archive: true },
    Dispatcher: { create_edit_rules: true, delete_critical: false, acknowledge: true, escalate: true, resolve_archive: false },
    Agent: { create_edit_rules: false, delete_critical: false, acknowledge: true, escalate: false, resolve_archive: false },
    Maint: { create_edit_rules: false, delete_critical: false, acknowledge: true, escalate: true, resolve_archive: false },
    Ground: { create_edit_rules: false, delete_critical: false, acknowledge: true, escalate: false, resolve_archive: false },
  };

  const channelPresets: Record<string, Record<string, Record<string, boolean>>> = {
    Admin: { critical_channel: { inApp: true, sms: true, email: true }, warning_channel: { inApp: true, sms: true, email: true } },
    Dispatcher: { critical_channel: { inApp: true, sms: true, email: false }, warning_channel: { inApp: true, sms: false, email: false } },
    Agent: { critical_channel: { inApp: true, sms: false, email: false }, warning_channel: { inApp: true, sms: false, email: false } },
    Maint: { critical_channel: { inApp: true, sms: true, email: true }, warning_channel: { inApp: true, sms: true, email: false } },
    Ground: { critical_channel: { inApp: true, sms: true, email: false }, warning_channel: { inApp: true, sms: false, email: false } },
  };

  SECTIONS.forEach(s => {
    s.rows.forEach(r => {
      if (s.type === 'toggle') {
        toggles[r.key] = presets[roleId]?.[r.key] ?? false;
      }
    });
  });

  SECTIONS.filter(s => s.type === 'channel').forEach(s => {
    s.rows.forEach(r => {
      channels[r.key] = channelPresets[roleId]?.[r.key] ?? { inApp: true, sms: false, email: false };
    });
  });

  return { toggles, channels };
}

// ─── Component ────────────────────────────────────────────

const OperationalTriggers: React.FC = () => {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [activeRole, setActiveRole] = useState('Dispatcher');
  const [activeTab, setActiveTab] = useState<'rules' | 'users'>('rules');
  const [saving, setSaving] = useState(false);
  const [showNewRole, setShowNewRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  // Per-role state cache
  const [roleStates, setRoleStates] = useState<Record<string, { toggles: Record<string, boolean>; channels: Record<string, Record<string, boolean>> }>>(() => {
    const init: Record<string, { toggles: Record<string, boolean>; channels: Record<string, Record<string, boolean>> }> = {};
    ROLES.forEach(r => { init[r.id] = getDefaultState(r.id); });
    return init;
  });

  // Saved snapshot for discard
  const [savedStates, setSavedStates] = useState(() => JSON.parse(JSON.stringify(roleStates)));

  const currentRole = useMemo(() => ROLES.find(r => r.id === activeRole) || ROLES[0], [activeRole]);
  const currentState = roleStates[activeRole] || getDefaultState(activeRole);

  const isDirty = useMemo(() => JSON.stringify(roleStates) !== JSON.stringify(savedStates), [roleStates, savedStates]);

  // ─── Handlers ─────────────────────────────────────

  const handleToggle = useCallback((key: string) => {
    setRoleStates(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        toggles: { ...prev[activeRole].toggles, [key]: !prev[activeRole].toggles[key] },
      },
    }));
  }, [activeRole]);

  const handleChannelToggle = useCallback((rowKey: string, channel: string) => {
    setRoleStates(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        channels: {
          ...prev[activeRole].channels,
          [rowKey]: { ...prev[activeRole].channels[rowKey], [channel]: !prev[activeRole].channels[rowKey]?.[channel] },
        },
      },
    }));
  }, [activeRole]);

  const handleDiscard = () => {
    setRoleStates(JSON.parse(JSON.stringify(savedStates)));
    addToast('Changes discarded — restored to last saved settings', 'info');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'cms_config', 'alert_triggers'), {
        rolePermissions: roleStates,
        updatedAt: Timestamp.now(),
      }, { merge: true });

      try {
        await logAuditEntry({
          action: 'alert_settings_updated',
          module: 'operational_triggers',
          detail: `Updated alert settings for role: ${currentRole.label}`,
          performedBy: 'admin',
        });
      } catch { /* non-critical */ }

      setSavedStates(JSON.parse(JSON.stringify(roleStates)));
      addToast('Alert settings saved successfully', 'success');
    } catch (err: any) {
      console.error('Failed to save alert settings:', err);
      addToast('Failed to save alert settings. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      addToast('Please enter a role name', 'warning');
      return;
    }
    addToast(`Role "${newRoleName}" — role creation requires backend setup. Contact your system administrator.`, 'info');
    setNewRoleName('');
    setShowNewRole(false);
  };

  // ─── Render ───────────────────────────────────────

  return (
    <div className="h-full flex flex-col font-sans bg-navy-50/20">
      <div className="max-w-[1600px] mx-auto w-full p-10 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-navy-100 pb-10">
          <div className="max-w-2xl space-y-6">
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-navy-300">
              <span>Operations</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-primary">Alert Settings</span>
            </nav>
            <div className="space-y-4">
              <h1 className="text-5xl font-black text-navy-950 tracking-tighter uppercase leading-none">Alert Settings</h1>
              <p className="text-navy-500 font-medium italic text-xl leading-relaxed uppercase tracking-wider">Configure which alerts are sent, how they are delivered, and who can respond to them.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate(ROUTES.ALERT_AUDIT_LOG)} className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-navy-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:bg-navy-50 shadow-sm transition-all">
              <span className="material-symbols-outlined text-xl">history</span> Audit History
            </button>
            <button onClick={() => setShowNewRole(true)} className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-xl">add</span> Create New Role
            </button>
          </div>
        </div>

        {/* New Role Modal */}
        {showNewRole && (
          <div className="bg-white rounded-[3rem] border-2 border-primary/20 p-10 shadow-xl shadow-primary/5 space-y-6 max-w-lg">
            <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight">Create New Role</h3>
            <input
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              placeholder="e.g. Crew Manager"
              className="w-full h-14 px-8 bg-navy-50 rounded-2xl text-sm font-black text-navy-950 uppercase tracking-widest focus:ring-4 focus:ring-primary/10 border-none"
            />
            <div className="flex gap-4">
              <button onClick={() => { setShowNewRole(false); setNewRoleName(''); }} className="flex-1 py-3 text-[10px] font-black text-navy-400 uppercase tracking-widest hover:text-red-500 transition-colors">Cancel</button>
              <button onClick={handleCreateRole} className="flex-1 py-3 bg-navy-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Create Role</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start h-full pb-20">
          {/* Role Sidebar */}
          <aside className="lg:col-span-3 flex flex-col gap-6 bg-white rounded-[3rem] border border-navy-100 p-8 shadow-sm h-full min-h-[600px]">
            <div className="flex items-center justify-between pb-4 border-b border-navy-50">
              <h2 className="text-[10px] font-black text-navy-300 uppercase tracking-[0.25em]">Staff Roles</h2>
              <span className="bg-navy-50 text-[10px] font-black px-3 py-1 rounded-full text-navy-400">{ROLES.length} ACTIVE</span>
            </div>
            <div className="flex flex-col gap-2">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  onClick={() => { setActiveRole(role.id); setActiveTab('rules'); }}
                  className={`flex items-center justify-between gap-4 p-5 rounded-[2rem] transition-all group relative overflow-hidden ${activeRole === role.id ? 'bg-primary/5 border-2 border-primary/20 shadow-inner' : 'hover:bg-navy-50'
                    }`}
                >
                  {activeRole === role.id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>}
                  <div className="flex items-center gap-4">
                    <span className={`material-symbols-outlined text-2xl ${activeRole === role.id ? 'text-primary' : 'text-navy-300 group-hover:text-navy-950'}`}>{role.icon}</span>
                    <div className="text-left">
                      <p className={`text-sm font-black uppercase tracking-tight ${activeRole === role.id ? 'text-navy-950' : 'text-navy-500'}`}>{role.label}</p>
                      <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest opacity-60">{role.sub}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-black font-mono px-2 py-1 rounded-lg ${activeRole === role.id ? 'bg-primary text-white' : 'text-navy-200'}`}>{role.count}</span>
                </button>
              ))}
            </div>
            <div className="mt-auto pt-6 border-t border-navy-50">
              <button onClick={() => navigate(ROUTES.USER_MANAGEMENT)} className="flex items-center gap-3 text-navy-400 font-black uppercase text-[10px] tracking-widest hover:text-primary transition-all w-full px-2">
                <span className="material-symbols-outlined">group_add</span> Manage Staff Groups
              </button>
            </div>
          </aside>

          {/* Permissions Workspace */}
          <main className="lg:col-span-9 space-y-10">
            <div className="bg-white rounded-[3.5rem] border border-navy-100 p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <h2 className="text-3xl font-black text-navy-950 uppercase tracking-tighter">{currentRole.label}</h2>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Active</span>
                  {isDirty && <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Unsaved Changes</span>}
                </div>
                <p className="text-xs text-navy-400 font-bold uppercase tracking-widest italic opacity-60">{currentRole.count} users assigned to this role</p>
              </div>
              <div className="flex items-center gap-4 bg-navy-50 p-1.5 rounded-[1.5rem] shadow-inner border border-navy-100">
                <button onClick={() => setActiveTab('rules')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'rules' ? 'bg-white text-navy-950 shadow-lg border border-navy-100' : 'text-navy-400 hover:text-navy-900'}`}>Alert Rules</button>
                <button onClick={() => setActiveTab('users')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-navy-950 shadow-lg border border-navy-100' : 'text-navy-400 hover:text-navy-900'}`}>Users in Role ({currentRole.count})</button>
              </div>
            </div>

            {activeTab === 'users' && (
              <div className="bg-white rounded-[3.5rem] border border-navy-100 p-12 shadow-sm text-center space-y-4">
                <span className="material-symbols-outlined text-5xl text-navy-200">group</span>
                <p className="text-sm font-black text-navy-400 uppercase tracking-widest">{currentRole.count} users assigned as {currentRole.label}</p>
                <button onClick={() => navigate(ROUTES.USER_MANAGEMENT)} className="px-8 py-3 bg-primary/10 text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all">
                  View in User Management
                </button>
              </div>
            )}

            {activeTab === 'rules' && SECTIONS.map((section, si) => (
              <div key={si} className="bg-white rounded-[3.5rem] border border-navy-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="p-8 px-10 border-b border-navy-50 bg-navy-50/20 flex items-center gap-6">
                  <div className={`p-4 rounded-2xl ${section.bg} ${section.color} shadow-inner`}>
                    <span className="material-symbols-outlined text-2xl font-black">{section.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight leading-none">{section.title}</h3>
                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-2 opacity-60">{section.sub}</p>
                  </div>
                </div>
                <div className="divide-y divide-navy-50">
                  {section.rows.map((row) => (
                    <div key={row.key} className="p-10 px-12 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:bg-navy-50/30 transition-all group">
                      <div className="max-w-xl space-y-2">
                        <p className="text-lg font-black text-navy-950 uppercase tracking-tighter group-hover:text-primary transition-colors">{row.label}</p>
                        <p className="text-sm text-navy-400 font-bold uppercase tracking-widest opacity-60 leading-relaxed">{row.desc}</p>
                      </div>
                      {section.type === 'channel' ? (
                        <div className="flex gap-6">
                          {[{ key: 'inApp', label: 'In-App' }, { key: 'sms', label: 'SMS' }, { key: 'email', label: 'Email' }].map((ch) => (
                            <label key={ch.key} className="flex items-center gap-4 cursor-pointer" onClick={() => handleChannelToggle(row.key, ch.key)}>
                              <div className="relative flex items-center">
                                <input type="checkbox" checked={currentState.channels[row.key]?.[ch.key] ?? false} readOnly className="peer h-6 w-6 appearance-none rounded-lg border-2 border-navy-100 checked:bg-primary checked:border-primary transition-all shadow-sm cursor-pointer" />
                                <span className="material-symbols-outlined text-white text-sm absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-all font-black">check</span>
                              </div>
                              <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{ch.label}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-6">
                          {(row as PermToggle).locked && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full border border-red-100 shadow-sm">
                              <span className="material-symbols-outlined text-sm font-black">lock</span>
                              <span className="text-[8px] font-black uppercase tracking-widest">Admin Only</span>
                            </div>
                          )}
                          <div
                            className="relative inline-flex items-center h-8 rounded-full w-16 transition-all shadow-inner cursor-pointer"
                            onClick={() => handleToggle(row.key)}
                          >
                            <input type="checkbox" checked={currentState.toggles[row.key] ?? false} readOnly className="sr-only peer" />
                            <div className="w-16 h-8 bg-navy-50 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-lg"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Sticky Footer */}
            <div className="sticky bottom-10 z-20 flex justify-center w-full pt-10">
              <div className="bg-navy-950/95 backdrop-blur-3xl border border-white/10 px-10 py-5 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] flex items-center gap-10 border-t border-white/20">
                <div className="flex items-center gap-6 border-r border-white/10 pr-10">
                  <div className={`size-3 rounded-full ${isDirty ? 'bg-amber-400 animate-pulse shadow-[0_0_15px_rgba(251,191,36,0.8)]' : 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]'}`}></div>
                  <div className="space-y-0.5">
                    <p className="text-white font-black uppercase text-[10px] tracking-widest">{isDirty ? 'Unsaved Changes' : 'All Saved'}</p>
                    <p className="text-white/40 font-black uppercase text-[8px] tracking-[0.25em]">Connected</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <button
                    onClick={handleDiscard}
                    disabled={!isDirty}
                    className="px-8 py-3 bg-white/5 border border-white/10 text-white/50 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                    className="px-12 py-4 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-xl">{saving ? 'progress_activity' : 'save'}</span>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default OperationalTriggers;
