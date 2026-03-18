import React, { useState, useEffect, useCallback } from 'react';
import {
  getRoles, createRole, updateRole, deleteRole,
  getPolicies, createPolicy, updatePolicy, deletePolicy,
  ROLE_COLORS, BUILT_IN_ROLES,
  type RoleDoc, type GroupPolicyDoc,
} from '../../services/rolesPolicyService';
import { MODULE_GROUPS, ALL_MODULE_IDS } from '../../services/dashboardAccessService';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { useToastStore } from '../../stores/toastStore';

/* ── Helpers ───────────────────────────────────────────────── */
const formatDate = (ts: any) => {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/* ── Main Component ────────────────────────────────────────── */
const RolesAndPolicies: React.FC = () => {
  const addToast = useToastStore(s => s.addToast);
  const [subTab, setSubTab] = useState<'roles' | 'policies'>('roles');
  const [roles, setRoles] = useState<RoleDoc[]>([]);
  const [policies, setPolicies] = useState<GroupPolicyDoc[]>([]);
  const [users, setUsers] = useState<{ uid: string; displayName: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── Modal state ────────────────────────────────────────── */
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDoc | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<GroupPolicyDoc | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'role' | 'policy'; id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  /* ── Role form state ────────────────────────────────────── */
  const [roleLabel, setRoleLabel] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [roleColor, setRoleColor] = useState(ROLE_COLORS[0]);
  const [roleModules, setRoleModules] = useState<string[]>([]);

  /* ── Policy form state ──────────────────────────────────── */
  const [policyName, setPolicyName] = useState('');
  const [policyDesc, setPolicyDesc] = useState('');
  const [policyRoleId, setPolicyRoleId] = useState('');
  const [policyUsers, setPolicyUsers] = useState<string[]>([]);
  const [policyEnforced, setPolicyEnforced] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  /* ── Load data ──────────────────────────────────────────── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [r, p, uSnap] = await Promise.all([
        getRoles(),
        getPolicies(),
        getDocs(query(collection(db, 'users'), orderBy('displayName'))),
      ]);
      setRoles(r);
      setPolicies(p);
      setUsers(uSnap.docs.map(d => {
        const data = d.data();
        return { uid: d.id, displayName: data.displayName || '', email: data.email || '' };
      }));
    } catch (err) {
      console.error('[RolesAndPolicies] load error:', err);
      addToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Role modal helpers ─────────────────────────────────── */
  const openRoleCreate = () => {
    setEditingRole(null);
    setRoleLabel('');
    setRoleDesc('');
    setRoleColor(ROLE_COLORS[0]);
    setRoleModules([]);
    setShowRoleModal(true);
  };

  const openRoleEdit = (role: RoleDoc) => {
    setEditingRole(role);
    setRoleLabel(role.label);
    setRoleDesc(role.description);
    setRoleColor(role.color);
    setRoleModules([...role.modules]);
    setShowRoleModal(true);
  };

  const handleSaveRole = async () => {
    if (!roleLabel.trim()) { addToast('Role name is required', 'error'); return; }
    setSaving(true);
    try {
      if (editingRole) {
        await updateRole(editingRole.id, { label: roleLabel, description: roleDesc, color: roleColor, modules: roleModules });
        addToast('Role updated', 'success');
      } else {
        await createRole({ label: roleLabel, description: roleDesc, color: roleColor, modules: roleModules });
        addToast('Role created', 'success');
      }
      setShowRoleModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
      addToast('Failed to save role', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── Policy modal helpers ───────────────────────────────── */
  const openPolicyCreate = () => {
    setEditingPolicy(null);
    setPolicyName('');
    setPolicyDesc('');
    setPolicyRoleId(roles.find(r => !r.isBuiltIn)?.id || roles[0]?.id || '');
    setPolicyUsers([]);
    setPolicyEnforced(true);
    setUserSearch('');
    setShowPolicyModal(true);
  };

  const openPolicyEdit = (policy: GroupPolicyDoc) => {
    setEditingPolicy(policy);
    setPolicyName(policy.name);
    setPolicyDesc(policy.description);
    setPolicyRoleId(policy.roleId);
    setPolicyUsers([...policy.assignedUsers]);
    setPolicyEnforced(policy.enforced);
    setUserSearch('');
    setShowPolicyModal(true);
  };

  const handleSavePolicy = async () => {
    if (!policyName.trim()) { addToast('Policy name is required', 'error'); return; }
    if (!policyRoleId) { addToast('Please select a role', 'error'); return; }
    setSaving(true);
    try {
      if (editingPolicy) {
        await updatePolicy(editingPolicy.id, { name: policyName, description: policyDesc, roleId: policyRoleId, assignedUsers: policyUsers, enforced: policyEnforced });
        addToast('Policy updated', 'success');
      } else {
        await createPolicy({ name: policyName, description: policyDesc, roleId: policyRoleId, assignedUsers: policyUsers, enforced: policyEnforced });
        addToast('Policy created', 'success');
      }
      setShowPolicyModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
      addToast('Failed to save policy', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete handlers ────────────────────────────────────── */
  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    setSaving(true);
    try {
      if (showDeleteConfirm.type === 'role') {
        await deleteRole(showDeleteConfirm.id);
        addToast('Role deleted', 'success');
      } else {
        await deletePolicy(showDeleteConfirm.id);
        addToast('Policy deleted', 'success');
      }
      setShowDeleteConfirm(null);
      await loadData();
    } catch (err) {
      console.error(err);
      addToast('Failed to delete', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnforce = async (policy: GroupPolicyDoc) => {
    try {
      await updatePolicy(policy.id, { enforced: !policy.enforced });
      addToast(policy.enforced ? 'Policy suspended' : 'Policy enforced', 'success');
      await loadData();
    } catch (err) {
      console.error(err);
      addToast('Failed to update policy', 'error');
    }
  };

  const toggleRoleModule = (moduleId: string) => {
    setRoleModules(prev => prev.includes(moduleId) ? prev.filter(m => m !== moduleId) : [...prev, moduleId]);
  };

  const filteredUsers = users.filter(u =>
    u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-3 border-navy-100 border-t-primary animate-spin" />
        <p className="text-sm font-bold text-navy-400">Loading roles & policies…</p>
      </div>
    );
  }

  const customRoles = roles.filter(r => !r.isBuiltIn);
  const builtInRoles = roles.filter(r => r.isBuiltIn);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-navy-950 tracking-tighter uppercase">Roles & Group Policies</h2>
          <p className="text-navy-400 text-sm font-medium italic">Create custom roles and manage group access policies.</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="bg-white rounded-2xl border border-navy-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-navy-100">
          <button
            onClick={() => setSubTab('roles')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
              subTab === 'roles' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-navy-400 hover:text-navy-700 hover:bg-navy-50/50'
            }`}
          >
            <span className="material-symbols-outlined text-lg">badge</span> Roles
          </button>
          <button
            onClick={() => setSubTab('policies')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
              subTab === 'policies' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-navy-400 hover:text-navy-700 hover:bg-navy-50/50'
            }`}
          >
            <span className="material-symbols-outlined text-lg">policy</span> Group Policies
          </button>
        </div>

        {/* ═══ ROLES TAB ════════════════════════════════════════ */}
        {subTab === 'roles' && (
          <div className="p-6 space-y-6">
            {/* Action bar */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{roles.length} Total Roles ({builtInRoles.length} built-in, {customRoles.length} custom)</span>
              <button onClick={openRoleCreate} className="flex items-center gap-2 h-10 px-5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-lg">add</span> New Role
              </button>
            </div>

            {/* Built-in roles */}
            <div className="space-y-3">
              <p className="text-[9px] font-black text-navy-400 uppercase tracking-[0.3em]">Built-in Roles</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {builtInRoles.map(role => (
                  <div key={role.id} className="bg-navy-50/30 border border-navy-100 rounded-2xl p-5 space-y-3 opacity-80">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: role.color + '18' }}>
                        <span className="material-symbols-outlined text-lg" style={{ color: role.color }}>shield_person</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-navy-950 truncate">{role.label}</h4>
                        <span className="text-[9px] font-bold text-navy-400 uppercase tracking-widest">System Role</span>
                      </div>
                      <span className="material-symbols-outlined text-navy-300 text-sm" title="Built-in — cannot be modified">lock</span>
                    </div>
                    <p className="text-[11px] text-navy-500 leading-relaxed">{role.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-full" style={{ backgroundColor: role.color }} />
                      <span className="text-[9px] font-bold text-navy-400 uppercase tracking-widest">{role.modules[0] === '*' ? 'Full Access' : `${role.modules.length} modules`}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom roles */}
            <div className="space-y-3">
              <p className="text-[9px] font-black text-navy-400 uppercase tracking-[0.3em]">Custom Roles</p>
              {customRoles.length === 0 ? (
                <div className="bg-navy-50/20 border border-dashed border-navy-200 rounded-2xl p-10 text-center">
                  <span className="material-symbols-outlined text-4xl text-navy-200 mb-3 block">add_circle_outline</span>
                  <p className="text-sm font-bold text-navy-400">No custom roles yet</p>
                  <p className="text-[11px] text-navy-300 mt-1">Create a custom role to define specific module access sets</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {customRoles.map(role => (
                    <div key={role.id} className="bg-white border border-navy-100 rounded-2xl p-5 space-y-3 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: role.color + '18' }}>
                          <span className="material-symbols-outlined text-lg" style={{ color: role.color }}>badge</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-black text-navy-950 truncate">{role.label}</h4>
                          <span className="text-[9px] font-bold text-navy-400 uppercase tracking-widest">Custom Role</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-navy-500 leading-relaxed line-clamp-2">{role.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="size-3 rounded-full" style={{ backgroundColor: role.color }} />
                          <span className="text-[9px] font-bold text-navy-400 uppercase tracking-widest">{role.modules.length} modules</span>
                        </div>
                        <span className="text-[9px] text-navy-300">{formatDate(role.createdAt)}</span>
                      </div>
                      <div className="flex gap-2 pt-1 border-t border-navy-50">
                        <button onClick={() => openRoleEdit(role)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider text-primary bg-primary/5 hover:bg-primary/10 transition-all">
                          <span className="material-symbols-outlined text-sm">edit</span> Edit
                        </button>
                        <button onClick={() => setShowDeleteConfirm({ type: 'role', id: role.id, name: role.label })} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 transition-all">
                          <span className="material-symbols-outlined text-sm">delete</span> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ POLICIES TAB ═════════════════════════════════════ */}
        {subTab === 'policies' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{policies.length} Group Policies</span>
              <button onClick={openPolicyCreate} className="flex items-center gap-2 h-10 px-5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-lg">add</span> New Policy
              </button>
            </div>

            {policies.length === 0 ? (
              <div className="bg-navy-50/20 border border-dashed border-navy-200 rounded-2xl p-10 text-center">
                <span className="material-symbols-outlined text-4xl text-navy-200 mb-3 block">policy</span>
                <p className="text-sm font-bold text-navy-400">No group policies defined</p>
                <p className="text-[11px] text-navy-300 mt-1">Create a policy to assign a role with specific permissions to a group of users</p>
              </div>
            ) : (
              <div className="space-y-3">
                {policies.map(policy => {
                  const linkedRole = roles.find(r => r.id === policy.roleId);
                  return (
                    <div key={policy.id} className={`border rounded-2xl p-5 transition-all ${policy.enforced ? 'bg-white border-navy-100' : 'bg-navy-50/30 border-navy-100 opacity-60'}`}>
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${policy.enforced ? 'bg-emerald-50' : 'bg-navy-100'}`}>
                            <span className={`material-symbols-outlined text-xl ${policy.enforced ? 'text-emerald-500' : 'text-navy-400'}`}>policy</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-navy-950 truncate">{policy.name}</h4>
                            <p className="text-[11px] text-navy-400 truncate">{policy.description || 'No description'}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {/* Linked role badge */}
                          {linkedRole && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: linkedRole.color + '40', backgroundColor: linkedRole.color + '08' }}>
                              <span className="size-2.5 rounded-full" style={{ backgroundColor: linkedRole.color }} />
                              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: linkedRole.color }}>{linkedRole.label}</span>
                            </div>
                          )}
                          {/* User count */}
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-50 rounded-lg">
                            <span className="material-symbols-outlined text-sm text-navy-400">group</span>
                            <span className="text-[9px] font-black text-navy-500 uppercase tracking-widest">{policy.assignedUsers.length} users</span>
                          </div>
                          {/* Status */}
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${policy.enforced ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                            <span className={`size-2 rounded-full ${policy.enforced ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                            <span className={`text-[9px] font-black uppercase tracking-widest ${policy.enforced ? 'text-emerald-700' : 'text-amber-700'}`}>{policy.enforced ? 'Active' : 'Suspended'}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => handleToggleEnforce(policy)} className={`size-9 rounded-lg flex items-center justify-center transition-all ${policy.enforced ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`} title={policy.enforced ? 'Suspend' : 'Enforce'}>
                            <span className="material-symbols-outlined text-lg">{policy.enforced ? 'pause' : 'play_arrow'}</span>
                          </button>
                          <button onClick={() => openPolicyEdit(policy)} className="size-9 rounded-lg flex items-center justify-center bg-primary/5 text-primary hover:bg-primary/10 transition-all" title="Edit">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button onClick={() => setShowDeleteConfirm({ type: 'policy', id: policy.id, name: policy.name })} className="size-9 rounded-lg flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 transition-all" title="Delete">
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Notice */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-amber-500 mt-0.5">info</span>
        <div>
          <p className="text-xs font-bold text-amber-800">How Roles & Policies Work</p>
          <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
            <strong>Roles</strong> define a set of module access permissions. <strong>Group Policies</strong> assign a role to a batch of users.
            When a policy is <strong>enforced</strong>, all assigned users inherit the role's permissions. Built-in roles cannot be modified but can be referenced by policies.
          </p>
        </div>
      </div>

      {/* ═══ ROLE MODAL ═════════════════════════════════════════ */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-navy-100 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            <div className="sticky top-0 bg-white border-b border-navy-100 p-6 flex items-center justify-between rounded-t-3xl z-10">
              <div>
                <h3 className="text-xl font-black text-navy-950 tracking-tight">{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
                <p className="text-sm text-navy-400 mt-0.5">Define the role name, color, and module access.</p>
              </div>
              <button onClick={() => setShowRoleModal(false)} className="size-10 rounded-xl flex items-center justify-center bg-navy-50 hover:bg-navy-100 transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Name & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-700 uppercase tracking-widest">Role Name *</label>
                  <input value={roleLabel} onChange={e => setRoleLabel(e.target.value)} className="w-full h-11 px-4 border border-navy-200 rounded-xl text-sm font-medium text-navy-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="e.g. Flight Operations" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-700 uppercase tracking-widest">Description</label>
                  <input value={roleDesc} onChange={e => setRoleDesc(e.target.value)} className="w-full h-11 px-4 border border-navy-200 rounded-xl text-sm font-medium text-navy-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Brief description of this role" />
                </div>
              </div>

              {/* Color picker */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-navy-700 uppercase tracking-widest">Badge Color</label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_COLORS.map(color => (
                    <button key={color} onClick={() => setRoleColor(color)} className={`size-8 rounded-lg transition-all ${roleColor === color ? 'ring-2 ring-offset-2 ring-navy-400 scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>

              {/* Module access */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-navy-700 uppercase tracking-widest">Module Access ({roleModules.length}/{ALL_MODULE_IDS.length})</label>
                  <div className="flex gap-2">
                    <button onClick={() => setRoleModules([...ALL_MODULE_IDS])} className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-all">All</button>
                    <button onClick={() => setRoleModules([])} className="px-3 py-1 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-red-100 transition-all">None</button>
                  </div>
                </div>

                {MODULE_GROUPS.map(group => (
                  <div key={group.group} className="bg-navy-50/20 rounded-xl border border-navy-100 overflow-hidden">
                    <div className="px-4 py-2.5 bg-navy-50/40 border-b border-navy-100 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-navy-400">{group.icon}</span>
                      <span className="text-[9px] font-black text-navy-700 uppercase tracking-widest">{group.group}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-2">
                      {group.modules.map(mod => {
                        const on = roleModules.includes(mod.id);
                        return (
                          <button key={mod.id} onClick={() => toggleRoleModule(mod.id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[9px] font-bold transition-all ${on ? 'bg-primary/10 text-primary' : 'text-navy-400 hover:bg-navy-50'}`}>
                            <span className="material-symbols-outlined text-sm">{on ? 'check_box' : 'check_box_outline_blank'}</span>
                            <span className="truncate">{mod.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-navy-100 p-6 flex gap-3 rounded-b-3xl">
              <button onClick={() => setShowRoleModal(false)} className="flex-1 h-12 bg-white border border-navy-200 text-navy-700 font-black rounded-xl hover:bg-navy-50 transition-all">Cancel</button>
              <button onClick={handleSaveRole} disabled={saving} className="flex-1 h-12 bg-primary text-white font-black rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</> : <><span className="material-symbols-outlined">save</span> {editingRole ? 'Update Role' : 'Create Role'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ POLICY MODAL ═══════════════════════════════════════ */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-navy-100 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            <div className="sticky top-0 bg-white border-b border-navy-100 p-6 flex items-center justify-between rounded-t-3xl z-10">
              <div>
                <h3 className="text-xl font-black text-navy-950 tracking-tight">{editingPolicy ? 'Edit Policy' : 'Create Group Policy'}</h3>
                <p className="text-sm text-navy-400 mt-0.5">Assign a role to a group of users.</p>
              </div>
              <button onClick={() => setShowPolicyModal(false)} className="size-10 rounded-xl flex items-center justify-center bg-navy-50 hover:bg-navy-100 transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Name & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-700 uppercase tracking-widest">Policy Name *</label>
                  <input value={policyName} onChange={e => setPolicyName(e.target.value)} className="w-full h-11 px-4 border border-navy-200 rounded-xl text-sm font-medium text-navy-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="e.g. Ops Team Q1" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-700 uppercase tracking-widest">Description</label>
                  <input value={policyDesc} onChange={e => setPolicyDesc(e.target.value)} className="w-full h-11 px-4 border border-navy-200 rounded-xl text-sm font-medium text-navy-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Brief description" />
                </div>
              </div>

              {/* Role selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-navy-700 uppercase tracking-widest">Linked Role *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {roles.map(role => (
                    <button key={role.id} onClick={() => setPolicyRoleId(role.id)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${policyRoleId === role.id ? 'border-primary bg-primary/5' : 'border-navy-100 hover:border-navy-200'}`}>
                      <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: role.color }} />
                      <span className={`text-[10px] font-black uppercase tracking-widest truncate ${policyRoleId === role.id ? 'text-primary' : 'text-navy-600'}`}>{role.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Enforce toggle */}
              <div className="flex items-center justify-between p-4 bg-navy-50/30 rounded-xl border border-navy-100">
                <div>
                  <p className="text-xs font-black text-navy-950">Policy Enforcement</p>
                  <p className="text-[11px] text-navy-400">When enforced, assigned users inherit this role's permissions</p>
                </div>
                <button onClick={() => setPolicyEnforced(!policyEnforced)} className={`w-12 h-7 rounded-full transition-all duration-200 ${policyEnforced ? 'bg-emerald-500' : 'bg-navy-200'}`}>
                  <div className={`size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${policyEnforced ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* User assignment */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-navy-700 uppercase tracking-widest">Assigned Users ({policyUsers.length})</label>
                  {policyUsers.length > 0 && (
                    <button onClick={() => setPolicyUsers([])} className="text-[9px] font-black text-red-600 uppercase tracking-wider hover:text-red-700">Clear All</button>
                  )}
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-navy-300 text-lg">search</span>
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)} className="w-full h-10 pl-10 pr-4 border border-navy-200 rounded-xl text-sm font-medium text-navy-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Search users…" />
                </div>
                <div className="border border-navy-100 rounded-xl max-h-48 overflow-y-auto divide-y divide-navy-50">
                  {filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-navy-400">No users found</div>
                  ) : filteredUsers.slice(0, 50).map(u => {
                    const selected = policyUsers.includes(u.uid);
                    return (
                      <button key={u.uid} onClick={() => setPolicyUsers(prev => selected ? prev.filter(id => id !== u.uid) : [...prev, u.uid])} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${selected ? 'bg-primary/5' : 'hover:bg-navy-50'}`}>
                        <span className={`material-symbols-outlined text-sm ${selected ? 'text-primary' : 'text-navy-300'}`}>{selected ? 'check_box' : 'check_box_outline_blank'}</span>
                        <span className="text-sm font-bold text-navy-950 truncate">{u.displayName || u.email}</span>
                        <span className="text-[10px] text-navy-400 truncate ml-auto">{u.email}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-navy-100 p-6 flex gap-3 rounded-b-3xl">
              <button onClick={() => setShowPolicyModal(false)} className="flex-1 h-12 bg-white border border-navy-200 text-navy-700 font-black rounded-xl hover:bg-navy-50 transition-all">Cancel</button>
              <button onClick={handleSavePolicy} disabled={saving} className="flex-1 h-12 bg-primary text-white font-black rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</> : <><span className="material-symbols-outlined">save</span> {editingPolicy ? 'Update Policy' : 'Create Policy'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELETE CONFIRM ══════════════════════════════════════ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-navy-100 shadow-2xl w-full max-w-md p-8 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center gap-4">
              <div className="size-16 rounded-full bg-red-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-red-500">delete_forever</span>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-navy-950 tracking-tight">Delete {showDeleteConfirm.type === 'role' ? 'Role' : 'Policy'}</h3>
                <p className="text-sm text-navy-500">Are you sure you want to delete <strong>"{showDeleteConfirm.name}"</strong>? This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} disabled={saving} className="flex-1 h-12 bg-white border border-navy-200 text-navy-700 font-black rounded-xl hover:bg-navy-50 transition-all">Cancel</button>
              <button onClick={handleDelete} disabled={saving} className="flex-1 h-12 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Deleting…</> : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesAndPolicies;
