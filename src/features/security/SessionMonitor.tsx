
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, serverTimestamp, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';

/* ── Types ───────────────────────────────────────────────── */
interface Session {
   id: string;
   name: string;
   adminId: string;
   location: string;
   ip: string;
   activity: string;
   duration: string;
   risk: 'high' | 'medium' | 'safe';
   riskLabel: string;
   avatar: string;
   startedAt: Timestamp | null;
}

interface PolicyConfig {
   unrecognizedIp: boolean;
   unrecognizedIpAction: string;
   concurrentLogins: boolean;
   maxSessions: number;
   failedLogins: boolean;
   failedLoginThreshold: number;
   failedLoginLock: boolean;
   unusualHours: boolean;
   unusualStart: string;
   unusualEnd: string;
   sensitiveModule: boolean;
   sensitiveModules: string[];
   notifyEmail: boolean;
   notifySlack: boolean;
   notifySms: boolean;
}

const DEFAULT_POLICY: PolicyConfig = {
   unrecognizedIp: true,
   unrecognizedIpAction: 'Force Logout',
   concurrentLogins: true,
   maxSessions: 1,
   failedLogins: true,
   failedLoginThreshold: 5,
   failedLoginLock: true,
   unusualHours: true,
   unusualStart: '22:00',
   unusualEnd: '06:00',
   sensitiveModule: true,
   sensitiveModules: ['Financial Settings', 'Role Management'],
   notifyEmail: true,
   notifySlack: true,
   notifySms: false,
};

const DEMO_SESSIONS: Session[] = [
   { id: '1', avatar: 'https://i.pravatar.cc/100?u=jane', name: 'jane_doe_super', adminId: '#8921', location: 'Banjul, GM', ip: '192.168.44.12', activity: 'Viewing Payment Settings', duration: '04h 12m', risk: 'high', riskLabel: 'High (Unusual IP)', startedAt: null },
   { id: '2', avatar: 'https://i.pravatar.cc/100?u=mike', name: 'm_korver_admin', adminId: '#4402', location: 'London, UK', ip: '82.14.11.201', activity: 'Editing Flight Schedule', duration: '00h 45m', risk: 'medium', riskLabel: 'Medium (Multiple Logins)', startedAt: null },
   { id: '3', avatar: 'https://i.pravatar.cc/100?u=smith', name: 'a_smith_ops', adminId: '#1120', location: 'Lagos, NG', ip: '104.22.18.5', activity: 'Reviewing Passenger List', duration: '01h 10m', risk: 'safe', riskLabel: 'Safe', startedAt: null },
   { id: '4', avatar: 'https://i.pravatar.cc/100?u=turner', name: 'r_turner_support', adminId: '#3321', location: 'Accra, GH', ip: '92.16.88.11', activity: 'Processing Ticket Refund', duration: '02h 05m', risk: 'safe', riskLabel: 'Safe', startedAt: null },
];

const RISK_STYLES: Record<string, { col: string; dot: string }> = {
   high: { col: 'bg-red-50 text-red-700 border-red-100', dot: 'bg-red-500 animate-pulse' },
   medium: { col: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
   safe: { col: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
};

const SENSITIVE_OPTIONS = ['Financial Settings', 'Role Management', 'System Logs'];

/* ════════════════════════════════════════════════════════════
   Session Monitor Component
   ════════════════════════════════════════════════════════════ */
const SessionMonitor: React.FC = () => {
   const user = useAuthStore(s => s.user);
   const addToast = useToastStore(s => s.addToast);

   /* ── State ────────────────────────────────────────────── */
   const [sessions, setSessions] = useState<Session[]>([]);
   const [policy, setPolicy] = useState<PolicyConfig>(DEFAULT_POLICY);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');
   const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'safe'>('all');
   const [page, setPage] = useState(0);
   const [detailSession, setDetailSession] = useState<Session | null>(null);
   const PAGE_SIZE = 10;

   /* ── Load data ────────────────────────────────────────── */
   const loadData = useCallback(async () => {
      setLoading(true);
      try {
         // Load sessions
         const sessSnap = await getDocs(query(collection(db, 'active_sessions'), orderBy('startedAt', 'desc')));
         if (sessSnap.empty) {
            setSessions(DEMO_SESSIONS);
         } else {
            setSessions(sessSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Session));
         }

         // Load policy
         const polSnap = await getDoc(doc(db, 'security_policies', 'session'));
         if (polSnap.exists()) {
            setPolicy({ ...DEFAULT_POLICY, ...polSnap.data() } as PolicyConfig);
         }
      } catch (err) {
         console.error('[Sessions] Load error:', err);
         setSessions(DEMO_SESSIONS);
      } finally {
         setLoading(false);
      }
   }, []);

   useEffect(() => { loadData(); }, [loadData]);

   /* ── Save policy ──────────────────────────────────────── */
   const handleSavePolicy = async () => {
      setSaving(true);
      try {
         await setDoc(doc(db, 'security_policies', 'session'), {
            ...policy,
            updatedAt: serverTimestamp(),
            updatedBy: user?.email || 'admin',
         });
         addToast('Security settings saved', 'success');
      } catch (err) {
         console.error('[Sessions] Save error:', err);
         addToast('Failed to save settings', 'error');
      } finally {
         setSaving(false);
      }
   };

   /* ── Force logout ─────────────────────────────────────── */
   const handleForceLogout = async (session: Session) => {
      if (!window.confirm(`Force logout "${session.name}"? This will end their session immediately.`)) return;
      try {
         await deleteDoc(doc(db, 'active_sessions', session.id));
         setSessions(prev => prev.filter(s => s.id !== session.id));
         addToast(`"${session.name}" has been logged out`, 'success');
      } catch (err) {
         console.error('[Sessions] Logout error:', err);
         addToast('Failed to force logout', 'error');
      }
   };

   /* ── Export CSV ────────────────────────────────────────── */
   const handleExport = () => {
      const header = 'Name,Admin ID,Location,IP Address,Activity,Duration,Risk Level';
      const rows = filteredSessions.map(s =>
         `"${s.name}","${s.adminId}","${s.location}","${s.ip}","${s.activity}","${s.duration}","${s.riskLabel}"`
      );
      const csv = [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sessions_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Sessions exported as CSV', 'success');
   };

   /* ── Filter + Search ──────────────────────────────────── */
   const filteredSessions = useMemo(() => {
      let result = sessions;
      if (riskFilter !== 'all') {
         result = result.filter(s => s.risk === riskFilter);
      }
      if (searchQuery.trim()) {
         const q = searchQuery.toLowerCase();
         result = result.filter(s =>
            s.name.toLowerCase().includes(q) ||
            s.adminId.toLowerCase().includes(q) ||
            s.ip.includes(q) ||
            s.location.toLowerCase().includes(q)
         );
      }
      return result;
   }, [sessions, riskFilter, searchQuery]);

   const totalPages = Math.ceil(filteredSessions.length / PAGE_SIZE);
   const pagedSessions = filteredSessions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

   /* ── Computed stats ───────────────────────────────────── */
   const stats = useMemo(() => ({
      total: sessions.length,
      highRisk: sessions.filter(s => s.risk === 'high').length,
      avgDuration: sessions.length > 0
         ? Math.round(sessions.reduce((sum, s) => {
            const m = s.duration.match(/(\d+)h\s*(\d+)m/);
            return sum + (m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 0);
         }, 0) / sessions.length)
         : 0,
   }), [sessions]);

   /* ── Policy updater ───────────────────────────────────── */
   const updatePolicy = (field: keyof PolicyConfig, value: any) => {
      setPolicy(prev => ({ ...prev, [field]: value }));
   };

   const toggleSensitiveModule = (mod: string) => {
      setPolicy(prev => ({
         ...prev,
         sensitiveModules: prev.sensitiveModules.includes(mod)
            ? prev.sensitiveModules.filter(m => m !== mod)
            : [...prev.sensitiveModules, mod],
      }));
   };

   if (loading) {
      return (
         <div className="h-full flex items-center justify-center font-display">
            <div className="text-center space-y-4">
               <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
               <p className="text-xs font-black text-navy-400 uppercase tracking-widest">Loading Sessions…</p>
            </div>
         </div>
      );
   }

   return (
      <div className="h-full flex overflow-hidden font-display bg-navy-50/20">
         {/* Main Content */}
         <main className="flex-1 overflow-y-auto custom-scrollbar p-10 pb-32">
            <div className="max-w-[1200px] mx-auto w-full space-y-10 animate-in fade-in duration-700">

               {/* Header */}
               <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-2">
                     <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Session Monitor</h1>
                        <span className="flex h-3 w-3 relative">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        </span>
                     </div>
                     <p className="text-navy-500 font-medium italic text-lg opacity-80 uppercase tracking-widest">Active Sessions · Security Alerts</p>
                     <p className="text-navy-400 text-xs font-bold uppercase tracking-widest mt-2 max-w-2xl leading-relaxed">
                        Monitor active admin sessions and security access across the admin panel.
                     </p>
                  </div>
               </div>

               {/* Stats */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                     { label: 'Active Admins', val: String(stats.total), icon: 'admin_panel_settings', color: 'text-primary', bg: 'bg-primary/5', alert: false },
                     { label: 'High Risk Sessions', val: String(stats.highRisk), sub: stats.highRisk > 0 ? 'NEEDS ATTENTION' : 'ALL CLEAR', icon: 'warning', color: 'text-red-600', bg: 'bg-red-50', alert: stats.highRisk > 0 },
                     { label: 'Avg Session Time', val: `${stats.avgDuration}m`, sub: 'Across all sessions', icon: 'schedule', color: 'text-primary', bg: 'bg-primary/5', alert: false },
                  ].map((s, i) => (
                     <div key={i} className={`bg-white p-8 rounded-[3rem] border shadow-sm flex flex-col group hover:shadow-xl transition-all relative overflow-hidden ${s.alert ? 'border-red-100 ring-2 ring-red-50' : 'border-navy-100'}`}>
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-navy-950 group-hover:scale-110 transition-transform">
                           <span className="material-symbols-outlined text-[100px] font-black">{s.icon}</span>
                        </div>
                        <div className="flex justify-between items-start mb-6">
                           <p className={`text-[10px] font-black uppercase tracking-widest ${s.alert ? 'text-red-500' : 'text-navy-400'}`}>{s.label}</p>
                           <div className={`p-2.5 rounded-xl bg-navy-50 ${s.color} shadow-inner group-hover:scale-110 transition-transform`}>
                              <span className="material-symbols-outlined font-black">{s.icon}</span>
                           </div>
                        </div>
                        <div className="flex items-baseline gap-4 relative z-10">
                           <h3 className={`text-4xl font-black tracking-tighter uppercase leading-none ${s.alert ? 'text-red-600' : 'text-navy-950'}`}>{s.val}</h3>
                           {s.sub && (
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border shadow-sm ${s.alert ? 'bg-red-50 text-red-600 border-red-200' : 'bg-navy-50 text-navy-400 border-navy-100'}`}>
                                 {s.sub}
                              </span>
                           )}
                        </div>
                     </div>
                  ))}
               </div>

               {/* Search & Filter Bar */}
               <div className="bg-white rounded-[3rem] border border-navy-100 p-8 shadow-sm">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                     <div className="lg:col-span-5">
                        <div className="relative group">
                           <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined text-lg group-focus-within:text-primary transition-all">search</span>
                           <input
                              className="w-full h-14 pl-14 pr-6 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
                              placeholder="Search by name, IP, or location..."
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                           />
                        </div>
                     </div>
                     <div className="lg:col-span-7 flex flex-wrap gap-3 justify-end">
                        {([
                           { key: 'all', label: 'All Sessions', dotClass: '' },
                           { key: 'high', label: 'High Risk', dotClass: 'bg-red-500' },
                           { key: 'medium', label: 'Medium Risk', dotClass: 'bg-amber-500' },
                           { key: 'safe', label: 'Safe', dotClass: 'bg-emerald-500' },
                        ] as const).map(f => (
                           <button
                              key={f.key}
                              onClick={() => { setRiskFilter(f.key); setPage(0); }}
                              className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${riskFilter === f.key
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-navy-50 border border-navy-100 text-navy-500 hover:text-navy-950'
                                 }`}
                           >
                              {f.dotClass && <span className={`size-2 rounded-full ${f.dotClass}`}></span>}
                              {f.label}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Sessions Table */}
               <div className="bg-white rounded-[4rem] border border-navy-100 shadow-2xl overflow-hidden flex flex-col relative">
                  <div className="p-8 border-b border-navy-50 bg-navy-50/20 flex items-center justify-between px-12">
                     <h3 className="text-xl font-black text-navy-950 uppercase tracking-tighter">Active Sessions</h3>
                     <button onClick={handleExport} className="text-[10px] font-black text-primary uppercase underline tracking-widest flex items-center gap-2 hover:text-primary-600 transition-colors">
                        <span className="material-symbols-outlined text-lg">download</span> Export Sessions
                     </button>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse min-w-[1100px]">
                        <thead>
                           <tr className="bg-navy-50/50 text-[10px] font-black text-navy-300 uppercase tracking-[0.25em] border-b border-navy-100">
                              <th className="px-12 py-8 w-[320px]">Admin</th>
                              <th className="px-8 py-8 w-[240px]">Location / IP Address</th>
                              <th className="px-8 py-8">Current Activity</th>
                              <th className="px-8 py-8 w-[160px]">Duration</th>
                              <th className="px-8 py-8 w-[220px]">Risk Level</th>
                              <th className="px-12 py-8 text-right w-[120px]">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-50">
                           {pagedSessions.length === 0 ? (
                              <tr>
                                 <td colSpan={6} className="px-12 py-16 text-center">
                                    <span className="material-symbols-outlined text-4xl text-navy-200 block mb-3">search_off</span>
                                    <p className="text-sm font-bold text-navy-400">No sessions match your filters</p>
                                 </td>
                              </tr>
                           ) : pagedSessions.map(session => {
                              const style = RISK_STYLES[session.risk] || RISK_STYLES.safe;
                              return (
                                 <tr key={session.id} className="group hover:bg-primary/5 transition-all cursor-default">
                                    <td className="px-12 py-10">
                                       <div className="flex items-center gap-5">
                                          <div className="size-12 rounded-[1.5rem] bg-navy-100 border-2 border-white shadow-md overflow-hidden shrink-0 group-hover:scale-110 transition-transform">
                                             <img src={session.avatar} alt="" className="w-full h-full object-cover" />
                                          </div>
                                          <div className="space-y-1">
                                             <p className="text-sm font-black text-navy-950 uppercase tracking-tight">{session.name}</p>
                                             <p className="text-[9px] font-black font-mono text-navy-200 uppercase tracking-widest opacity-60">ID: {session.adminId}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-8 py-10">
                                       <div className="flex flex-col gap-1.5 text-navy-950">
                                          <div className="flex items-center gap-2">
                                             <span className="material-symbols-outlined text-navy-200 text-sm">flag</span>
                                             <span className="text-[10px] font-black uppercase tracking-widest">{session.location}</span>
                                          </div>
                                          <span className="text-[10px] font-mono font-bold text-navy-300 tracking-tight">{session.ip}</span>
                                       </div>
                                    </td>
                                    <td className="px-8 py-10">
                                       <p className="text-[11px] font-bold text-navy-500 uppercase italic leading-relaxed tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
                                          {session.activity}
                                       </p>
                                    </td>
                                    <td className="px-8 py-10">
                                       <span className="font-mono text-xs font-black text-navy-300 uppercase tracking-widest tabular-nums">{session.duration}</span>
                                    </td>
                                    <td className="px-8 py-10">
                                       <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${style.col}`}>
                                          <span className={`size-1.5 rounded-full ${style.dot}`} />
                                          {session.riskLabel}
                                       </span>
                                    </td>
                                    <td className="px-12 py-10 text-right">
                                       <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                          <button onClick={() => setDetailSession(session)} className="p-3 bg-navy-50 text-navy-200 border border-navy-50 hover:text-primary hover:bg-white transition-all shadow-inner rounded-2xl" title="View details">
                                             <span className="material-symbols-outlined text-lg">visibility</span>
                                          </button>
                                          <button onClick={() => handleForceLogout(session)} className="p-3 bg-red-50 text-red-400 border border-red-50 hover:bg-red-600 hover:text-white transition-all shadow-inner rounded-2xl" title="Force logout">
                                             <span className="material-symbols-outlined text-lg">logout</span>
                                          </button>
                                       </div>
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>

                  {/* Pagination */}
                  <div className="px-12 py-10 bg-navy-50/20 border-t border-navy-100 flex flex-col sm:flex-row items-center justify-between gap-8">
                     <div className="text-[10px] font-black text-navy-400 uppercase tracking-widest">
                        Showing <span className="text-navy-950">{filteredSessions.length === 0 ? 0 : page * PAGE_SIZE + 1}</span> to <span className="text-navy-950">{Math.min((page + 1) * PAGE_SIZE, filteredSessions.length)}</span> of <span className="text-navy-950">{filteredSessions.length}</span> sessions
                     </div>
                     <div className="flex items-center gap-4">
                        <button
                           onClick={() => setPage(p => Math.max(0, p - 1))}
                           disabled={page === 0}
                           className={`px-8 py-3 bg-white border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all ${page === 0 ? 'border-navy-200 text-navy-300 cursor-not-allowed' : 'border-navy-100 text-navy-950 hover:bg-navy-50'}`}
                        >Previous</button>
                        <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{page + 1} / {Math.max(1, totalPages)}</span>
                        <button
                           onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                           disabled={page >= totalPages - 1}
                           className={`px-8 py-3 bg-white border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all ${page >= totalPages - 1 ? 'border-navy-200 text-navy-300 cursor-not-allowed' : 'border-navy-100 text-navy-950 hover:bg-navy-50'}`}
                        >Next</button>
                     </div>
                  </div>
               </div>
            </div>
         </main>

         {/* Session Detail Dialog */}
         {detailSession && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setDetailSession(null)}>
               <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg p-10 space-y-8 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-5">
                     <div className="size-16 rounded-2xl bg-navy-100 border-2 border-white shadow-md overflow-hidden">
                        <img src={detailSession.avatar} alt="" className="w-full h-full object-cover" />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight">{detailSession.name}</h3>
                        <p className="text-[10px] font-bold text-navy-300 uppercase tracking-widest">ID: {detailSession.adminId}</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     {[
                        { label: 'Location', value: detailSession.location },
                        { label: 'IP Address', value: detailSession.ip },
                        { label: 'Activity', value: detailSession.activity },
                        { label: 'Duration', value: detailSession.duration },
                        { label: 'Risk Level', value: detailSession.riskLabel },
                     ].map(item => (
                        <div key={item.label} className="space-y-1">
                           <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">{item.label}</p>
                           <p className="text-sm font-bold text-navy-950">{item.value}</p>
                        </div>
                     ))}
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-navy-100">
                     <button onClick={() => setDetailSession(null)} className="flex-1 py-4 bg-navy-50 border border-navy-100 text-navy-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-navy-100 transition-all">Close</button>
                     <button onClick={() => { handleForceLogout(detailSession); setDetailSession(null); }} className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-lg">logout</span> Force Logout
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Right Sidebar: Policy Configuration */}
         <aside className="w-[440px] bg-white border-l border-navy-100 flex flex-col shrink-0 overflow-y-auto custom-scrollbar z-10 shadow-[-30px_0_60px_-15px_rgba(0,0,0,0.05)]">
            <div className="p-10 border-b border-navy-50 bg-navy-50/30 space-y-1">
               <h3 className="font-black text-2xl text-navy-950 uppercase tracking-tight">Security Alert Settings</h3>
               <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest opacity-60">Configure automatic detection rules</p>
            </div>

            <div className="p-10 space-y-12">
               {/* Login Anomalies */}
               <div className="space-y-8">
                  <h4 className="text-[10px] font-black text-navy-300 uppercase tracking-[0.3em] px-1 border-l-2 border-primary">Login Rules</h4>

                  {/* Rule: Unrecognized IP */}
                  <div className="bg-navy-50/50 p-8 rounded-[3rem] border border-navy-50 shadow-inner space-y-8">
                     <div className="flex items-center justify-between">
                        <label className="text-sm font-black text-navy-950 uppercase tracking-tight">Unrecognized IP Address</label>
                        <div className="relative inline-flex items-center h-8 rounded-full w-14 transition-all cursor-pointer" onClick={() => updatePolicy('unrecognizedIp', !policy.unrecognizedIp)}>
                           <input checked={policy.unrecognizedIp} readOnly type="checkbox" className="sr-only peer" />
                           <div className="w-14 h-8 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all shadow-md"></div>
                        </div>
                     </div>
                     {policy.unrecognizedIp && (
                        <div className="space-y-6 pt-4 border-t border-navy-100/50">
                           <div className="flex justify-between items-center text-[10px] font-black text-navy-400 uppercase tracking-widest px-1">
                              <span>Trigger Condition</span>
                              <span className="text-navy-900">Unknown IP Address</span>
                           </div>
                           <div className="flex justify-between items-center text-[10px] font-black text-navy-400 uppercase tracking-widest px-1">
                              <span>Automatic Response</span>
                              <select
                                 value={policy.unrecognizedIpAction}
                                 onChange={e => updatePolicy('unrecognizedIpAction', e.target.value)}
                                 className="bg-white border border-navy-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-navy-950 focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer"
                              >
                                 <option>Force Logout</option>
                                 <option>Restrict Access</option>
                              </select>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Rule: Concurrent Logins */}
                  <div className="bg-navy-50/50 p-8 rounded-[3rem] border border-navy-50 shadow-inner space-y-8">
                     <div className="flex items-center justify-between">
                        <label className="text-sm font-black text-navy-950 uppercase tracking-tight">Concurrent Logins</label>
                        <div className="relative inline-flex items-center h-8 rounded-full w-14 transition-all cursor-pointer" onClick={() => updatePolicy('concurrentLogins', !policy.concurrentLogins)}>
                           <input checked={policy.concurrentLogins} readOnly type="checkbox" className="sr-only peer" />
                           <div className="w-14 h-8 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all shadow-md"></div>
                        </div>
                     </div>
                     {policy.concurrentLogins && (
                        <div className="pt-4 border-t border-navy-100/50 flex justify-between items-center px-1">
                           <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Max Active Sessions</span>
                           <input type="number" value={policy.maxSessions} onChange={e => updatePolicy('maxSessions', parseInt(e.target.value) || 1)} min={1} max={10} className="w-16 h-10 text-center bg-white border border-navy-100 rounded-xl text-xs font-black text-navy-950 focus:ring-4 focus:ring-primary/5 shadow-sm" />
                        </div>
                     )}
                  </div>

                  {/* Rule: Failed Logins */}
                  <div className="bg-navy-50/50 p-8 rounded-[3rem] border border-navy-100 shadow-inner space-y-8 ring-2 ring-red-500/10">
                     <div className="flex items-center justify-between">
                        <label className="text-sm font-black text-navy-950 uppercase tracking-tight">Excessive Failed Logins</label>
                        <div className="relative inline-flex items-center h-8 rounded-full w-14 transition-all cursor-pointer" onClick={() => updatePolicy('failedLogins', !policy.failedLogins)}>
                           <input checked={policy.failedLogins} readOnly type="checkbox" className="sr-only peer" />
                           <div className="w-14 h-8 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all shadow-md"></div>
                        </div>
                     </div>
                     {policy.failedLogins && (
                        <div className="space-y-6 pt-4 border-t border-navy-100/50">
                           <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Threshold (per minute)</span>
                              <input type="number" value={policy.failedLoginThreshold} onChange={e => updatePolicy('failedLoginThreshold', parseInt(e.target.value) || 1)} min={1} max={100} className="w-16 h-10 text-center bg-white border border-navy-100 rounded-xl text-xs font-black text-navy-950 focus:ring-4 focus:ring-primary/5 shadow-sm" />
                           </div>
                           <label className="flex items-center gap-4 cursor-pointer group px-1" onClick={() => updatePolicy('failedLoginLock', !policy.failedLoginLock)}>
                              <div className="relative flex items-center">
                                 <input type="checkbox" checked={policy.failedLoginLock} readOnly className="peer h-6 w-6 appearance-none rounded-lg border-2 border-navy-200 checked:bg-red-500 checked:border-red-500 transition-all shadow-sm" />
                                 <span className="material-symbols-outlined text-white text-sm absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 peer-checked:opacity-100 font-black">check</span>
                              </div>
                              <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest group-hover:text-red-600 transition-colors">Temporary Account Lock (15m)</span>
                           </label>
                        </div>
                     )}
                  </div>
               </div>

               {/* Behavioral Monitoring */}
               <div className="space-y-8">
                  <h4 className="text-[10px] font-black text-navy-300 uppercase tracking-[0.3em] px-1 border-l-2 border-primary">Activity Monitoring</h4>

                  {/* Unusual Hours */}
                  <div className="bg-navy-50/50 p-8 rounded-[3rem] border border-navy-50 shadow-inner space-y-8">
                     <div className="flex items-center justify-between">
                        <label className="text-sm font-black text-navy-950 uppercase tracking-tight">Unusual Hours Activity</label>
                        <div className="relative inline-flex items-center h-8 rounded-full w-14 transition-all cursor-pointer" onClick={() => updatePolicy('unusualHours', !policy.unusualHours)}>
                           <input checked={policy.unusualHours} readOnly type="checkbox" className="sr-only peer" />
                           <div className="w-14 h-7 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all shadow-md"></div>
                        </div>
                     </div>
                     {policy.unusualHours && (
                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-navy-100/50">
                           <div className="space-y-2">
                              <span className="text-[9px] font-black text-navy-300 uppercase tracking-widest ml-2">Start Time</span>
                              <input type="time" value={policy.unusualStart} onChange={e => updatePolicy('unusualStart', e.target.value)} className="w-full h-12 px-5 bg-white border border-navy-100 rounded-2xl text-xs font-black text-navy-950 uppercase focus:ring-4 focus:ring-primary/5 shadow-inner appearance-none" />
                           </div>
                           <div className="space-y-2">
                              <span className="text-[9px] font-black text-navy-300 uppercase tracking-widest ml-2">End Time</span>
                              <input type="time" value={policy.unusualEnd} onChange={e => updatePolicy('unusualEnd', e.target.value)} className="w-full h-12 px-5 bg-white border border-navy-100 rounded-2xl text-xs font-black text-navy-950 uppercase focus:ring-4 focus:ring-primary/5 shadow-inner appearance-none" />
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Sensitive Module */}
                  <div className="bg-navy-50/50 p-8 rounded-[3rem] border border-navy-50 shadow-inner space-y-8">
                     <div className="flex items-center justify-between">
                        <label className="text-sm font-black text-navy-950 uppercase tracking-tight">Sensitive Area Access</label>
                        <div className="relative inline-flex items-center h-8 rounded-full w-14 transition-all cursor-pointer" onClick={() => updatePolicy('sensitiveModule', !policy.sensitiveModule)}>
                           <input checked={policy.sensitiveModule} readOnly type="checkbox" className="sr-only peer" />
                           <div className="w-14 h-7 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all shadow-md"></div>
                        </div>
                     </div>
                     {policy.sensitiveModule && (
                        <div className="space-y-4 pt-4 border-t border-navy-100/50">
                           <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest mb-2 ml-1">Alert when accessing:</p>
                           {SENSITIVE_OPTIONS.map(lbl => (
                              <label key={lbl} className="flex items-center gap-4 cursor-pointer group" onClick={() => toggleSensitiveModule(lbl)}>
                                 <div className="relative flex items-center">
                                    <input type="checkbox" checked={policy.sensitiveModules.includes(lbl)} readOnly className="peer h-6 w-6 appearance-none rounded-lg border-2 border-navy-200 checked:bg-primary checked:border-primary transition-all shadow-sm" />
                                    <span className="material-symbols-outlined text-white text-sm absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 peer-checked:opacity-100 font-black">check</span>
                                 </div>
                                 <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest group-hover:text-navy-900 transition-colors">{lbl}</span>
                              </label>
                           ))}
                        </div>
                     )}
                  </div>
               </div>

               {/* Notification Channels */}
               <div className="space-y-8 pt-4">
                  <h4 className="text-[10px] font-black text-navy-300 uppercase tracking-[0.3em] px-1 border-l-2 border-primary">Alert Channels</h4>
                  <div className="space-y-3">
                     {([
                        { key: 'notifyEmail' as const, lbl: 'Email Alerts', icon: 'mail', color: 'bg-blue-50 text-blue-600' },
                        { key: 'notifySlack' as const, lbl: 'Slack Channel', icon: 'tag', color: 'bg-purple-50 text-purple-600' },
                        { key: 'notifySms' as const, lbl: 'SMS Alert', icon: 'sms', color: 'bg-orange-50 text-orange-600' },
                     ]).map(ch => (
                        <label key={ch.key} className="flex items-center justify-between p-5 rounded-[2rem] bg-navy-50 border border-navy-100 hover:bg-white transition-all cursor-pointer group shadow-sm" onClick={() => updatePolicy(ch.key, !policy[ch.key])}>
                           <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-xl ${ch.color} shadow-inner group-hover:scale-110 transition-transform`}>
                                 <span className="material-symbols-outlined text-lg">{ch.icon}</span>
                              </div>
                              <span className="text-[10px] font-black text-navy-700 uppercase tracking-widest">{ch.lbl}</span>
                           </div>
                           <div className="relative flex items-center">
                              <input type="checkbox" checked={policy[ch.key]} readOnly className="peer h-6 w-6 appearance-none rounded-lg border-2 border-navy-200 checked:bg-emerald-500 checked:border-emerald-500 transition-all shadow-sm" />
                              <span className="material-symbols-outlined text-white text-sm absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 peer-checked:opacity-100 font-black">check</span>
                           </div>
                        </label>
                     ))}
                  </div>
               </div>
            </div>

            {/* Sticky Save */}
            <div className="p-10 border-t border-navy-50 bg-navy-50/10 sticky bottom-0 z-10 backdrop-blur-md">
               <button onClick={handleSavePolicy} disabled={saving} className="w-full py-5 bg-primary text-white font-black uppercase text-xs tracking-[0.2em] rounded-[1.75rem] shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                  <span className="material-symbols-outlined text-xl">{saving ? 'progress_activity' : 'save'}</span>
                  {saving ? 'Saving…' : 'Save Settings'}
               </button>
            </div>
         </aside>
      </div>
   );
};

export default SessionMonitor;
