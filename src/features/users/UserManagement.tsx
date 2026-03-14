
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, query, orderBy, limit, startAfter, type DocumentSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../config/firebase.config';
import type { UserDoc } from '../../types/firestore';

/* ── Constants ──────────────────────────────────────────────── */
const PAGE_SIZE = 20;

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  ops_manager: 'Ops Manager',
  crew_sched: 'Crew Scheduler',
  cs_agent: 'CS Agent',
  customer: 'Customer',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-50 text-purple-700 border-purple-100',
  ops_manager: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  crew_sched: 'bg-blue-50 text-blue-700 border-blue-100',
  cs_agent: 'bg-sky-50 text-sky-700 border-sky-100',
  customer: 'bg-navy-50 text-navy-700 border-navy-100',
};

const STATUS_STYLES: Record<string, { badge: string; icon: string; label: string }> = {
  active: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: 'check_circle', label: 'Active' },
  suspended: { badge: 'bg-amber-50 text-amber-700 border-amber-100', icon: 'pause_circle', label: 'Suspended' },
  deactivated: { badge: 'bg-red-50 text-red-700 border-red-100', icon: 'cancel', label: 'Deactivated' },
};

/* ── Cloud Function callables ──────────────────────────────── */
const createUserAccountCF = httpsCallable<
  { email: string; displayName: string; role: string; password?: string },
  { success: boolean; uid: string; message: string; tempPassword: string }
>(functions, 'createUserAccount');

const setUserRoleCF = httpsCallable<
  { uid: string; role: string },
  { success: boolean; message: string }
>(functions, 'setUserRole');

const disableUserAccountCF = httpsCallable<
  { uid: string; disabled: boolean },
  { success: boolean; message: string }
>(functions, 'disableUserAccount');

const deleteUserAccountCF = httpsCallable<
  { uid: string },
  { success: boolean; message: string }
>(functions, 'deleteUserAccount');

/* ── Helpers ───────────────────────────────────────────────── */
function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/* ═══════════════════════════════════════════════════════════════
   User Management Component — Full CRUD
   ═══════════════════════════════════════════════════════════════ */
const UserManagement: React.FC = () => {
  /* ── Data state ────────────────────────────────────────────── */
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── UI state ──────────────────────────────────────────────── */
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  /* ── Modal state ───────────────────────────────────────────── */
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ displayName: '', email: '', role: 'customer', password: '' });
  const [savingUser, setSavingUser] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [tempPasswordDisplay, setTempPasswordDisplay] = useState<string | null>(null);

  /* ── Role edit state ───────────────────────────────────────── */
  const [editingRoleUid, setEditingRoleUid] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('');

  /* ── Delete / Suspend confirm state ─────────────────────────── */
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'suspend' | 'reactivate'; user: UserDoc } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  /* ── Pagination ────────────────────────────────────────────── */
  const [currentPage, setCurrentPage] = useState(1);
  const [lastDocs, setLastDocs] = useState<DocumentSnapshot[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  /* ── Fetch users from Firestore ────────────────────────────── */
  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const countSnap = await getDocs(collection(db, 'users'));
      setTotalCount(countSnap.size);

      let q;
      if (page === 1) {
        q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
      } else {
        const lastDoc = lastDocs[page - 2];
        if (lastDoc) {
          q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(PAGE_SIZE));
        } else {
          q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
        }
      }

      const snap = await getDocs(q);
      const fetched = snap.docs.map(d => ({ uid: d.id, ...d.data() }) as UserDoc);
      setUsers(fetched);

      if (snap.docs.length > 0) {
        const newLastDocs = [...lastDocs];
        newLastDocs[page - 1] = snap.docs[snap.docs.length - 1];
        setLastDocs(newLastDocs);
      }

      setCurrentPage(page);
    } catch (err: any) {
      console.error('[UserManagement] Fetch error:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [lastDocs]);

  useEffect(() => { fetchUsers(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Computed: filtered users ───────────────────────────────── */
  const filteredUsers = useMemo(() => {
    let result = users;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.displayName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(u => (u as any).status === statusFilter);
    }
    return result;
  }, [users, searchQuery, roleFilter, statusFilter]);

  /* ── Computed: stats ───────────────────────────────────────── */
  const stats = useMemo(() => {
    const activeCount = users.filter(u => (u as any).status !== 'suspended' && (u as any).status !== 'deactivated').length;
    const suspendedCount = users.filter(u => (u as any).status === 'suspended').length;
    const mfaCount = users.filter(u => u.mfaEnabled).length;
    return {
      total: totalCount || users.length,
      active: activeCount,
      suspended: suspendedCount,
      mfa: mfaCount,
    };
  }, [users, totalCount]);

  /* ── Create new user (via Cloud Function) ────────────────── */
  const handleCreateUser = useCallback(async () => {
    if (!newUserForm.displayName.trim() || !newUserForm.email.trim()) {
      setError('Please fill in both name and email.');
      return;
    }
    setSavingUser(true);
    setError(null);
    try {
      const result = await createUserAccountCF({
        displayName: newUserForm.displayName.trim(),
        email: newUserForm.email.trim().toLowerCase(),
        role: newUserForm.role,
        password: newUserForm.password || undefined,
      });
      setTempPasswordDisplay(result.data.tempPassword);
      setShowNewUserModal(false);
      setNewUserForm({ displayName: '', email: '', role: 'customer', password: '' });
      setSuccessMsg(result.data.message);
      setTimeout(() => setSuccessMsg(null), 8000);
      fetchUsers(1);
    } catch (err: any) {
      console.error('[UserManagement] Create error:', err);
      const msg = err?.message || 'Failed to create user.';
      setError(msg.includes('already-exists') ? 'A user with this email already exists.' : msg);
    } finally {
      setSavingUser(false);
    }
  }, [newUserForm, fetchUsers]);

  /* ── Update user role (via Cloud Function) ──────────────── */
  const handleUpdateRole = useCallback(async (uid: string) => {
    if (!newRole) return;
    try {
      await setUserRoleCF({ uid, role: newRole });
      setEditingRoleUid(null);
      setSuccessMsg('Role updated successfully (custom claims set).');
      setTimeout(() => setSuccessMsg(null), 4000);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole as UserDoc['role'] } : u));
    } catch (err: any) {
      console.error('[UserManagement] Role update error:', err);
      setError('Failed to update role. Please try again.');
    }
  }, [newRole]);

  /* ── Suspend / Reactivate user ─────────────────────────────── */
  const handleToggleSuspend = useCallback(async (u: UserDoc, disable: boolean) => {
    setActionLoading(true);
    try {
      await disableUserAccountCF({ uid: u.uid, disabled: disable });
      setConfirmAction(null);
      setSuccessMsg(disable ? `${u.displayName} has been suspended.` : `${u.displayName} has been reactivated.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setUsers(prev => prev.map(usr =>
        usr.uid === u.uid ? { ...usr, status: (disable ? 'suspended' : 'active') as any } : usr
      ));
    } catch (err: any) {
      console.error('[UserManagement] Suspend/reactivate error:', err);
      setError(err?.message || 'Failed to update user status.');
      setConfirmAction(null);
    } finally {
      setActionLoading(false);
    }
  }, []);

  /* ── Delete user account ────────────────────────────────────── */
  const handleDeleteUser = useCallback(async (u: UserDoc) => {
    setActionLoading(true);
    try {
      await deleteUserAccountCF({ uid: u.uid });
      setConfirmAction(null);
      setSuccessMsg(`${u.displayName || u.email} has been permanently deleted.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setUsers(prev => prev.filter(usr => usr.uid !== u.uid));
      setTotalCount(prev => prev - 1);
    } catch (err: any) {
      console.error('[UserManagement] Delete error:', err);
      setError(err?.message || 'Failed to delete user.');
      setConfirmAction(null);
    } finally {
      setActionLoading(false);
    }
  }, []);

  /* ── Pagination handlers ───────────────────────────────────── */
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const handlePrevPage = () => { if (currentPage > 1) fetchUsers(currentPage - 1); };
  const handleNextPage = () => { if (currentPage < totalPages) fetchUsers(currentPage + 1); };

  const getStatusStyle = (u: UserDoc) => {
    const status = (u as any).status || 'active';
    return STATUS_STYLES[status] || STATUS_STYLES.active;
  };

  return (
    <div className="p-4 md:p-8 space-y-8 md:space-y-10 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-24">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">User Management</h1>
          <p className="text-navy-500 font-medium italic text-sm md:text-base">Manage user accounts, roles, and access levels.</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <button
            onClick={() => { setEditingRoleUid(null); fetchUsers(1); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-4 md:px-5 border border-navy-100 bg-white rounded-xl text-navy-700 text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">refresh</span> Refresh
          </button>
          <button
            onClick={() => setShowNewUserModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-6 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-primary/20"
          >
            <span className="material-symbols-outlined text-lg">add</span> New User
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <span className="material-symbols-outlined text-red-500">error</span>
          <p className="text-sm font-bold text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <span className="material-symbols-outlined text-emerald-500">check_circle</span>
          <p className="text-sm font-bold text-emerald-700">{successMsg}</p>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-400 hover:text-emerald-600">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}
      {tempPasswordDisplay && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <span className="material-symbols-outlined text-blue-500">key</span>
          <div>
            <p className="text-sm font-bold text-blue-700">Temporary password for new user:</p>
            <p className="font-mono text-lg font-black text-blue-900 select-all mt-1">{tempPasswordDisplay}</p>
            <p className="text-xs text-blue-500 mt-1">Please share this securely with the user. They should change it on first login.</p>
          </div>
          <button onClick={() => setTempPasswordDisplay(null)} className="ml-auto text-blue-400 hover:text-blue-600 self-start">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', val: stats.total.toLocaleString(), icon: 'group', col: 'text-primary' },
          { label: 'Active', val: stats.active.toString(), icon: 'check_circle', col: 'text-emerald-600' },
          { label: 'Suspended', val: stats.suspended.toString(), icon: 'pause_circle', col: 'text-amber-600' },
          { label: 'Two-Factor Enabled', val: stats.mfa.toString(), icon: 'security', col: 'text-indigo-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-navy-100 shadow-sm flex flex-col gap-1 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <p className="text-navy-400 font-black text-[10px] uppercase tracking-widest">{stat.label}</p>
              <span className={`material-symbols-outlined text-lg ${stat.col}`}>{stat.icon}</span>
            </div>
            <span className="text-2xl font-black text-navy-950 tracking-tighter">{stat.val}</span>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl md:rounded-[3rem] border border-navy-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 md:p-8 border-b border-navy-100 bg-navy-50/10 flex flex-col xl:flex-row gap-6 justify-between items-center">
          <div className="relative w-full lg:max-w-xl group">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 group-focus-within:text-primary transition-all">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 md:h-14 pl-14 pr-6 bg-white border-2 border-navy-50 rounded-2xl text-sm font-bold tracking-wide focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
              placeholder="Search users by name or email…"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full lg:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="flex-1 sm:flex-none h-12 md:h-14 px-4 md:px-6 bg-white border-2 border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-900 appearance-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="ops_manager">Ops Manager</option>
              <option value="crew_sched">Crew Scheduler</option>
              <option value="cs_agent">CS Agent</option>
              <option value="customer">Customer</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none h-12 md:h-14 px-4 md:px-6 bg-white border-2 border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-900 appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <div className="flex border-2 border-navy-100 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setViewMode('table')}
                className={`p-3 transition-all border-r border-navy-100 ${viewMode === 'table' ? 'bg-primary text-white' : 'bg-white text-navy-300 hover:text-primary'}`}
              >
                <span className="material-symbols-outlined text-lg">view_list</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 transition-all ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-navy-300 hover:text-primary'}`}
              >
                <span className="material-symbols-outlined text-lg">grid_view</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-16 flex flex-col items-center gap-4">
            <div className="w-8 h-8 rounded-full border-3 border-navy-100 border-t-primary animate-spin" />
            <p className="text-sm font-bold text-navy-400">Loading users…</p>
          </div>
        )}

        {/* Table View */}
        {!loading && viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="bg-navy-50/50 border-b border-navy-50 text-[10px] font-black text-navy-300 uppercase tracking-[0.25em]">
                  <th className="px-6 md:px-10 py-6">User</th>
                  <th className="px-6 md:px-8 py-6">Role</th>
                  <th className="px-6 md:px-8 py-6">Status</th>
                  <th className="px-6 md:px-8 py-6">Two-Factor</th>
                  <th className="px-6 md:px-8 py-6">Last Login</th>
                  <th className="px-6 md:px-10 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-10 py-16 text-center">
                      <span className="material-symbols-outlined text-5xl text-navy-200 block mb-3">person_off</span>
                      <p className="font-bold text-navy-400">No users found</p>
                      <p className="text-xs text-navy-300 mt-1">Try adjusting your search or filter.</p>
                    </td>
                  </tr>
                ) : filteredUsers.map((u) => {
                  const statusStyle = getStatusStyle(u);
                  return (
                  <React.Fragment key={u.uid}>
                    <tr
                      onClick={() => setExpandedUser(expandedUser === u.uid ? null : u.uid)}
                      className={`group transition-all cursor-pointer ${expandedUser === u.uid ? 'bg-primary/5' : 'hover:bg-navy-50/50'}`}
                    >
                      <td className="px-6 md:px-10 py-6">
                        <div className="flex items-center gap-4">
                          {u.photoURL ? (
                            <div
                              className={`h-12 w-12 rounded-xl bg-cover bg-center border-2 border-white shadow-md transition-all group-hover:scale-105 ${expandedUser === u.uid ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                              style={{ backgroundImage: `url(${u.photoURL})` }}
                            />
                          ) : (
                            <div className={`h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm border-2 border-white shadow-md transition-all group-hover:scale-105 ${expandedUser === u.uid ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                              {getInitials(u.displayName || u.email)}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-black text-navy-950 tracking-tight truncate">{u.displayName || 'Unnamed User'}</span>
                            <span className="text-[10px] text-navy-400 font-bold tracking-widest truncate opacity-60">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 md:px-8 py-6">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${ROLE_COLORS[u.role] || 'bg-navy-50 text-navy-600 border-navy-100'}`}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-6 md:px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${statusStyle.badge}`}>
                          <span className="material-symbols-outlined text-xs">{statusStyle.icon}</span>
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="px-6 md:px-8 py-6">
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-sm ${u.mfaEnabled ? 'text-emerald-500' : 'text-navy-200'}`}>
                            {u.mfaEnabled ? 'verified_user' : 'shield'}
                          </span>
                          <span className="text-[10px] font-black text-navy-900 uppercase tracking-widest">
                            {u.mfaEnabled ? 'Enabled' : 'Off'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 md:px-8 py-6 text-[10px] font-black text-navy-400 uppercase tracking-widest italic opacity-70">
                        {formatDate(u.lastLoginAt)}
                      </td>
                      <td className="px-6 md:px-10 py-6 text-right">
                        <button className={`p-2 transition-all rounded-xl ${expandedUser === u.uid ? 'bg-primary text-white' : 'text-navy-200 hover:text-primary'}`}>
                          <span className="material-symbols-outlined">{expandedUser === u.uid ? 'expand_less' : 'expand_more'}</span>
                        </button>
                      </td>
                    </tr>
                    {/* Expanded detail row */}
                    {expandedUser === u.uid && (
                      <tr className="bg-primary/5">
                        <td colSpan={6} className="px-6 md:px-10 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            <div>
                              <p className="text-[10px] font-black text-navy-400 uppercase mb-1">User ID</p>
                              <p className="text-xs font-bold text-navy-900 font-mono">{u.uid}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-navy-400 uppercase mb-1">Sign-in Method</p>
                              <p className="text-xs font-bold text-navy-900 capitalize">{u.provider || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-navy-400 uppercase mb-1">Account Created</p>
                              <p className="text-xs font-bold text-navy-900">{formatDate(u.createdAt)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-navy-400 uppercase mb-1">Change Role</p>
                              {editingRoleUid === u.uid ? (
                                <div className="flex gap-2">
                                  <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    className="h-8 px-2 bg-white border border-navy-100 rounded-lg text-xs font-bold"
                                  >
                                    <option value="customer">Customer</option>
                                    <option value="cs_agent">CS Agent</option>
                                    <option value="crew_sched">Crew Scheduler</option>
                                    <option value="ops_manager">Ops Manager</option>
                                    <option value="super_admin">Super Admin</option>
                                  </select>
                                  <button onClick={() => handleUpdateRole(u.uid)} className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-600">Save</button>
                                  <button onClick={() => setEditingRoleUid(null)} className="px-3 py-1 bg-white border border-navy-100 rounded-lg text-xs font-bold text-navy-500 hover:bg-navy-50">Cancel</button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingRoleUid(u.uid); setNewRole(u.role); }}
                                  className="text-xs font-bold text-primary hover:underline"
                                >
                                  Edit Role →
                                </button>
                              )}
                            </div>
                            {/* Account Actions */}
                            <div>
                              <p className="text-[10px] font-black text-navy-400 uppercase mb-2">Account Actions</p>
                              <div className="flex flex-wrap gap-2">
                                {(u as any).status === 'suspended' ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'reactivate', user: u }); }}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-all"
                                  >
                                    <span className="material-symbols-outlined text-xs">play_circle</span> Reactivate
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'suspend', user: u }); }}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-amber-100 transition-all"
                                  >
                                    <span className="material-symbols-outlined text-xs">pause_circle</span> Suspend
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'delete', user: u }); }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-red-100 transition-all"
                                >
                                  <span className="material-symbols-outlined text-xs">delete</span> Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Grid View */}
        {!loading && viewMode === 'grid' && (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUsers.length === 0 ? (
              <div className="col-span-full py-16 text-center">
                <span className="material-symbols-outlined text-5xl text-navy-200 block mb-3">person_off</span>
                <p className="font-bold text-navy-400">No users found</p>
              </div>
            ) : filteredUsers.map((u) => {
              const statusStyle = getStatusStyle(u);
              return (
              <div key={u.uid} className="bg-navy-50/30 rounded-2xl p-6 border border-navy-100 hover:shadow-md transition-all space-y-4">
                <div className="flex items-center gap-3">
                  {u.photoURL ? (
                    <div className="h-12 w-12 rounded-xl bg-cover bg-center border-2 border-white shadow-md" style={{ backgroundImage: `url(${u.photoURL})` }} />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm border-2 border-white shadow-md">
                      {getInitials(u.displayName || u.email)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-black text-navy-950 truncate">{u.displayName || 'Unnamed'}</p>
                    <p className="text-[10px] text-navy-400 font-bold truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${ROLE_COLORS[u.role] || 'bg-navy-50 text-navy-600 border-navy-100'}`}>
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${statusStyle.badge}`}>
                    <span className="material-symbols-outlined text-[10px]">{statusStyle.icon}</span>
                    {statusStyle.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-navy-400 font-bold">Last login: {formatDate(u.lastLoginAt)}</p>
                  <div className="flex gap-1">
                    {(u as any).status === 'suspended' ? (
                      <button onClick={() => setConfirmAction({ type: 'reactivate', user: u })} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="Reactivate">
                        <span className="material-symbols-outlined text-sm">play_circle</span>
                      </button>
                    ) : (
                      <button onClick={() => setConfirmAction({ type: 'suspend', user: u })} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Suspend">
                        <span className="material-symbols-outlined text-sm">pause_circle</span>
                      </button>
                    )}
                    <button onClick={() => setConfirmAction({ type: 'delete', user: u })} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="p-6 md:p-10 bg-navy-50/20 border-t border-navy-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] text-center sm:text-left">
            Showing {filteredUsers.length} of {totalCount.toLocaleString()} users · Page {currentPage} of {Math.max(1, totalPages)}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className={`px-6 py-2 bg-white border-2 border-navy-100 rounded-xl text-[10px] font-black uppercase transition-all ${currentPage <= 1 ? 'text-navy-300 cursor-not-allowed' : 'text-navy-950 hover:bg-navy-50'}`}
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className={`px-6 py-2 bg-white border-2 border-navy-100 rounded-xl text-[10px] font-black uppercase transition-all ${currentPage >= totalPages ? 'text-navy-300 cursor-not-allowed' : 'text-navy-950 hover:bg-navy-50'}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* New User Modal */}
      {showNewUserModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-navy-100 shadow-2xl w-full max-w-lg p-8 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-navy-950 tracking-tight">Create New User</h2>
              <button onClick={() => setShowNewUserModal(false)} className="text-navy-400 hover:text-navy-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-navy-400 uppercase">Full Name</label>
                <input
                  value={newUserForm.displayName}
                  onChange={(e) => setNewUserForm(f => ({ ...f, displayName: e.target.value }))}
                  placeholder="e.g. John Smith"
                  className="w-full h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-navy-900 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-navy-400 uppercase">Email Address</label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="e.g. john@example.com"
                  className="w-full h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-navy-900 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-navy-400 uppercase">Password (optional)</label>
                <input
                  type="text"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Leave blank to auto-generate"
                  className="w-full h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-navy-900 focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-[10px] text-navy-400">If left empty, a temporary password will be generated and displayed.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-navy-400 uppercase">Role</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-navy-900 focus:ring-2 focus:ring-primary/20"
                >
                  <option value="customer">Customer</option>
                  <option value="cs_agent">CS Agent</option>
                  <option value="crew_sched">Crew Scheduler</option>
                  <option value="ops_manager">Ops Manager</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowNewUserModal(false)}
                className="flex-1 h-12 bg-white border border-navy-200 text-navy-700 font-black rounded-xl hover:bg-navy-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={savingUser}
                className="flex-1 h-12 bg-primary text-white font-black rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingUser ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Creating…
                  </>
                ) : (
                  'Create User'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-navy-100 shadow-2xl w-full max-w-md p-8 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center gap-4">
              <div className={`size-16 rounded-full flex items-center justify-center ${
                confirmAction.type === 'delete' ? 'bg-red-50' : confirmAction.type === 'suspend' ? 'bg-amber-50' : 'bg-emerald-50'
              }`}>
                <span className={`material-symbols-outlined text-3xl ${
                  confirmAction.type === 'delete' ? 'text-red-500' : confirmAction.type === 'suspend' ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {confirmAction.type === 'delete' ? 'delete_forever' : confirmAction.type === 'suspend' ? 'pause_circle' : 'play_circle'}
                </span>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-navy-950 tracking-tight">
                  {confirmAction.type === 'delete' ? 'Delete User Account' : confirmAction.type === 'suspend' ? 'Suspend User Account' : 'Reactivate User Account'}
                </h3>
                <p className="text-sm text-navy-500">
                  {confirmAction.type === 'delete'
                    ? `This will permanently delete "${confirmAction.user.displayName || confirmAction.user.email}" and remove their Auth account, Firestore data, and loyalty profile. This action cannot be undone.`
                    : confirmAction.type === 'suspend'
                    ? `This will suspend "${confirmAction.user.displayName || confirmAction.user.email}". They will not be able to log in until reactivated.`
                    : `This will reactivate "${confirmAction.user.displayName || confirmAction.user.email}". They will be able to log in again.`
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={actionLoading}
                className="flex-1 h-12 bg-white border border-navy-200 text-navy-700 font-black rounded-xl hover:bg-navy-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === 'delete') handleDeleteUser(confirmAction.user);
                  else handleToggleSuspend(confirmAction.user, confirmAction.type === 'suspend');
                }}
                disabled={actionLoading}
                className={`flex-1 h-12 font-black rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 ${
                  confirmAction.type === 'delete' ? 'bg-red-500 text-white shadow-red-500/20 hover:bg-red-600'
                    : confirmAction.type === 'suspend' ? 'bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600'
                    : 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600'
                }`}
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Processing…
                  </>
                ) : (
                  confirmAction.type === 'delete' ? 'Delete Permanently' : confirmAction.type === 'suspend' ? 'Suspend Account' : 'Reactivate Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
