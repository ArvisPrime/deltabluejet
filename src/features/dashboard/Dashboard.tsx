
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ROUTES } from '../../config/routes';
import { useAdminAction } from '../../hooks/useAdminAction';
import { getFlights, getAuditLogs } from '../../services/firestore';
import type { FlightDoc, AuditLogDoc } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';
import { useAuthStore } from '../../stores/authStore';

// ─── Helper to build 24-hour OTP chart from live flight data ─────────
function buildPerformanceData(flights: FlightDoc[]) {
  const now = new Date();
  const buckets: Record<string, { total: number; onTime: number }> = {};

  // Create time buckets for the last 24 hours (every 4h)
  const labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'];
  labels.forEach(l => { buckets[l] = { total: 0, onTime: 0 }; });

  for (const f of flights) {
    if (!f.departureTime?.toDate) continue;
    const d = f.departureTime.toDate();
    const hour = d.getHours();
    let label: string;
    if (hour < 4) label = '00:00';
    else if (hour < 8) label = '04:00';
    else if (hour < 12) label = '08:00';
    else if (hour < 16) label = '12:00';
    else if (hour < 20) label = '16:00';
    else label = '20:00';

    // If the flight is from today, map to its bucket
    const isToday = d.toDateString() === now.toDateString();
    if (!isToday) continue;

    buckets[label].total++;
    if (f.status !== 'delayed' && f.status !== 'cancelled') {
      buckets[label].onTime++;
    }
  }

  return labels.map(name => ({
    name,
    current: buckets[name].total > 0
      ? Math.round((buckets[name].onTime / buckets[name].total) * 100)
      : 80, // default target when no flights in that bucket
    target: 80,
  }));
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const action = useAdminAction();
  const user = useAuthStore(s => s.user);
  const userRole = user?.role || 'ops_manager';

  // ─── State ───────────────────────────────
  const [flights, setFlights] = useState<FlightDoc[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Computed metrics ────────────────────
  const activeFlights = flights.filter(f =>
    ['scheduled', 'boarding', 'departed', 'in_air'].includes(f.status)
  ).length;

  const totalDelays = flights.filter(f => f.status === 'delayed').length;

  const openConflicts = flights.filter(f =>
    f.status === 'cancelled' || (f.status === 'delayed' && f.delayMinutes > 60)
  ).length;

  const totalNonCancelled = flights.filter(f => f.status !== 'cancelled').length;
  const onTimeFlights = flights.filter(f =>
    f.status !== 'delayed' && f.status !== 'cancelled'
  ).length;
  const gateEfficiency = totalNonCancelled > 0
    ? Math.round((onTimeFlights / totalNonCancelled) * 100)
    : 0;

  const performanceData = buildPerformanceData(flights);

  // ─── Fetch data ──────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [flightData, logData] = await Promise.all([
          getFlights({ maxResults: 200 }),
          getAuditLogs(10),
        ]);
        setFlights(flightData);
        setAuditLogs(logData);
      } catch (err) {
        console.error('Dashboard load error:', err);
        useToastStore.getState().addToast("Dashboard load error", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ─── Helpers ─────────────────────────────
  const formatTimeAgo = (ts: any) => {
    if (!ts?.toDate) return '--';
    const diff = Date.now() - ts.toDate().getTime();
    if (diff < 60_000) return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} mins ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hours ago`;
    return ts.toDate().toLocaleDateString();
  };

  const actionColor = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('delete') || a.includes('cancel') || a.includes('emergency') || a.includes('flag'))
      return 'text-red-600 bg-red-50 border-red-100';
    if (a.includes('create') || a.includes('confirm') || a.includes('success') || a.includes('edit'))
      return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (a.includes('pending') || a.includes('delay') || a.includes('warn'))
      return 'text-orange-600 bg-orange-50 border-orange-100';
    return 'text-blue-600 bg-blue-50 border-blue-100';
  };

  const trendChar = (val: number) => {
    if (val > 0) return `+${val}`;
    if (val < 0) return `${val}`;
    return '0';
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-10 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Operational Health</h1>
          <p className="text-navy-500 font-medium italic mt-2 flex items-center gap-2 text-[10px] md:text-sm uppercase tracking-widest">
            <span className="size-2 md:size-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            {loading ? 'Loading data stream...' : `Live data stream active • ${flights.length} flights loaded`}
          </p>
        </div>
        <div className="flex gap-2 md:gap-3">
          <button onClick={action('Dashboard customization panel — coming soon', 'info')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 bg-white border border-navy-100 rounded-xl text-navy-700 text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 transition-all shadow-sm">
            <span className="material-symbols-outlined text-lg">tune</span> Customize
          </button>
          <button onClick={action('Exporting dashboard report as CSV…', 'success')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-600 transition-all">
            <span className="material-symbols-outlined text-lg">download</span> Export
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Active Flights', val: loading ? '...' : activeFlights.toLocaleString(), trend: trendChar(activeFlights), icon: 'flight', color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'Total Delays', val: loading ? '...' : String(totalDelays), trend: trendChar(totalDelays), icon: 'schedule', color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Open Conflicts', val: loading ? '...' : String(openConflicts), trend: trendChar(-openConflicts), icon: 'warning', color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Gate Efficiency', val: loading ? '...' : `${gateEfficiency}%`, trend: `${gateEfficiency > 80 ? '+' : ''}${gateEfficiency - 80}%`, icon: 'door_front', color: 'text-emerald-500', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-navy-100 rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${stat.bg} ${stat.color} shadow-inner group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-2xl md:text-3xl font-black">{stat.icon}</span>
              </div>
              <span className={`text-[9px] font-black px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border ${stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : stat.trend.startsWith('-') ? 'bg-red-50 text-red-700 border-red-100' : 'bg-navy-50 text-navy-400 border-navy-100'
                }`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
            <h3 className="text-2xl md:text-3xl font-black text-navy-950 tracking-tighter">{stat.val}</h3>
            <div className="mt-6 md:mt-8 w-full h-1 bg-navy-50 rounded-full overflow-hidden shadow-inner">
              <div className={`h-full rounded-full transition-all duration-1000 ${stat.color.replace('text-', 'bg-')}`} style={{ width: `${Math.min(100, Math.max(5, gateEfficiency))}%` }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl md:rounded-[3.5rem] border border-navy-100 p-6 md:p-12 shadow-sm relative group overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 md:mb-12 relative z-10 gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-xl md:text-2xl font-black text-navy-950 uppercase tracking-tighter">On-Time Performance (24h)</h3>
              <p className="text-[10px] text-navy-400 font-bold uppercase tracking-widest opacity-60">Aggregate baseline vs live tracking</p>
            </div>
            <div className="flex gap-2 items-center bg-navy-50 p-1 rounded-2xl shadow-inner w-full sm:w-auto">
              <button onClick={action('Switched to live trend view', 'info')} className="flex-1 sm:flex-none px-4 md:px-6 py-2 bg-white text-navy-950 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md border border-navy-100 whitespace-nowrap">Live Trend</button>
              <button onClick={action('Switched to baseline comparison view', 'info')} className="flex-1 sm:flex-none px-4 md:px-6 py-2 text-navy-400 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Baseline</button>
            </div>
          </div>
          <div className="h-64 md:h-96 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#137fec" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#137fec" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 30px -10px rgb(0 0 0 / 0.1)', padding: '20px' }}
                  itemStyle={{ fontWeight: 900, fontSize: '13px', textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="current" stroke="#137fec" strokeWidth={5} fillOpacity={1} fill="url(#colorCurrent)" />
                <Area type="monotone" dataKey="target" stroke="#e2e8f0" strokeWidth={2} fill="transparent" strokeDasharray="6 6" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-10 mt-6 md:mt-8 relative z-10">
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-navy-200"></span>
              <span className="text-[9px] md:text-[10px] font-black text-navy-400 uppercase tracking-[0.2em]">Control (Baseline)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-primary shadow-[0_0_8px_rgba(19,127,236,0.5)]"></span>
              <span className="text-[9px] md:text-[10px] font-black text-navy-950 uppercase tracking-[0.2em]">Live Tracking</span>
            </div>
          </div>
        </div>

        {/* Side panels */}
        <div className="flex flex-col gap-6 md:gap-8">
          <div className="bg-primary text-white p-6 rounded-2xl md:rounded-[2rem] shadow-lg shadow-primary/25 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold">Quick Actions</h3>
              <p className="text-blue-100 text-sm mt-1 mb-6 uppercase tracking-widest font-black text-[10px]">Manage your station efficiently.</p>
              <div className="flex flex-col gap-3">
                {(userRole === 'cs_agent') ? (
                  <button onClick={() => navigate(ROUTES.BOOKINGS)} className="bg-white text-primary w-full py-3 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
                    View Bookings
                  </button>
                ) : (
                  <button onClick={() => navigate(ROUTES.FLIGHT_SEARCH)} className="bg-white text-primary w-full py-3 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Create Booking
                  </button>
                )}
                {userRole === 'super_admin' && (
                  <button onClick={() => navigate(ROUTES.USER_MANAGEMENT)} className="bg-blue-600 text-white w-full py-3 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 border border-blue-500 shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    Manage Users
                  </button>
                )}
                {userRole === 'crew_sched' && (
                  <button onClick={() => navigate(ROUTES.CREW_SCHEDULING)} className="bg-blue-600 text-white w-full py-3 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 border border-blue-500 shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    Crew Schedule
                  </button>
                )}
                {userRole === 'ops_manager' && (
                  <button onClick={() => navigate(ROUTES.FLIGHT_SCHEDULING)} className="bg-blue-600 text-white w-full py-3 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 border border-blue-500 shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    Flight Schedule
                  </button>
                )}
              </div>
            </div>
            <div className="absolute -right-10 -top-10 size-40 bg-white/10 rounded-full blur-2xl"></div>
          </div>

          <div className="bg-white rounded-2xl md:rounded-[3rem] border border-navy-100 p-6 md:p-10 shadow-sm relative group overflow-hidden">
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-[10px] font-black text-navy-950 uppercase tracking-[0.25em] flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600">mark_email_read</span>
                Email Center
              </h3>
              <button onClick={() => navigate(ROUTES.EMAIL_TEMPLATES)} className="text-navy-300 hover:text-primary transition-all"><span className="material-symbols-outlined">settings</span></button>
            </div>
            <div className="space-y-3 relative z-10">
              <button onClick={() => navigate(ROUTES.EMAIL_TEMPLATES)} className="w-full flex items-center justify-between p-4 rounded-xl md:rounded-2xl bg-navy-50/50 hover:bg-white border border-transparent hover:border-navy-100 transition-all group">
                <div className="flex items-center gap-4 text-left">
                  <span className="material-symbols-outlined text-navy-300 group-hover:text-primary transition-colors">lock_reset</span>
                  <span className="text-[10px] font-black text-navy-900 uppercase tracking-widest">Password Reset</span>
                </div>
                <span className="material-symbols-outlined text-navy-200 text-sm">arrow_forward_ios</span>
              </button>
              <button onClick={() => navigate(ROUTES.EMAIL_TEMPLATES)} className="w-full flex items-center justify-between p-4 rounded-xl md:rounded-2xl bg-navy-50/50 hover:bg-white border border-transparent hover:border-navy-100 transition-all group">
                <div className="flex items-center gap-4 text-left">
                  <span className="material-symbols-outlined text-navy-300 group-hover:text-primary transition-colors">confirmation_number</span>
                  <span className="text-[10px] font-black text-navy-900 uppercase tracking-widest">Booking Confirmation</span>
                </div>
                <span className="material-symbols-outlined text-navy-200 text-sm">arrow_forward_ios</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl md:rounded-[3rem] border border-navy-100 p-6 md:p-10 shadow-sm relative group overflow-hidden">
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-[10px] font-black text-navy-950 uppercase tracking-[0.25em] flex items-center gap-2 text-red-500">
                <span className="material-symbols-outlined">report_problem</span>
                Ops Audit
              </h3>
              <button onClick={() => navigate(ROUTES.ALERT_AUDIT_LOG)} className="text-[10px] font-black text-primary uppercase underline">View All</button>
            </div>
            <div className="space-y-4 relative z-10">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest text-center py-6">No recent audit events</p>
              ) : (
                auditLogs.slice(0, 3).map((log, i) => (
                  <div key={log.id || i} className={`flex gap-4 p-4 rounded-2xl items-start cursor-pointer hover:opacity-80 transition-all border ${actionColor(log.action)}`}>
                    <div className="size-2 rounded-full bg-current mt-2 shrink-0 animate-pulse"></div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-tight">{log.action}</p>
                      <p className="text-[8px] font-bold uppercase tracking-widest opacity-70">
                        {log.userEmail || 'System'} • {formatTimeAgo(log.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl md:rounded-[4rem] border border-navy-100 shadow-sm overflow-hidden flex flex-col pb-8">
        <div className="p-6 md:p-10 border-b border-navy-50 flex flex-col sm:flex-row justify-between items-center bg-navy-50/10 gap-4">
          <h3 className="text-xl md:text-2xl font-black text-navy-950 uppercase tracking-tighter">System Activity</h3>
          <button onClick={() => navigate(ROUTES.ALERT_AUDIT_LOG)} className="text-[10px] font-black text-primary uppercase tracking-widest underline decoration-2 underline-offset-4">Full Audit Log</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-navy-50/50 text-[9px] font-black text-navy-300 uppercase tracking-[0.25em] border-b border-navy-50">
                <th className="px-6 md:px-10 py-6">Assigned Staff</th>
                <th className="px-6 md:px-10 py-6">Action Required</th>
                <th className="px-6 md:px-10 py-6">Temporal Seq</th>
                <th className="px-6 md:px-10 py-6">Entity</th>
                <th className="px-6 md:px-10 py-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-10 py-16 text-center">
                    <div className="flex items-center justify-center gap-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="text-xs font-black text-navy-300 uppercase tracking-widest">Loading activity...</span>
                    </div>
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-16 text-center">
                    <p className="text-xs font-black text-navy-300 uppercase tracking-widest">No audit log entries found</p>
                  </td>
                </tr>
              ) : (
                auditLogs.map((log, i) => (
                  <tr key={log.id || i} className="group hover:bg-navy-50/50 transition-all cursor-pointer">
                    <td className="px-6 md:px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-300 border border-navy-100 shrink-0">
                          <span className="material-symbols-outlined text-xl">person</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-black text-navy-950 uppercase tracking-tight truncate">{log.userEmail?.split('@')[0] || 'System'}</span>
                          <span className="text-[9px] text-navy-400 font-bold uppercase tracking-widest truncate">{log.userEmail || 'ops.auto@system'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-6">
                      <span className="text-xs font-black text-navy-700 uppercase tracking-tight">{log.action}</span>
                    </td>
                    <td className="px-6 md:px-10 py-6 text-[10px] font-bold text-navy-400 uppercase tracking-widest">{formatTimeAgo(log.timestamp)}</td>
                    <td className="px-6 md:px-10 py-6 text-[10px] font-bold text-navy-400 uppercase tracking-widest">{log.entityType}: {log.entityId?.slice(0, 8) || '--'}</td>
                    <td className="px-6 md:px-10 py-6 text-right">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${actionColor(log.action)}`}>
                        Completed
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
