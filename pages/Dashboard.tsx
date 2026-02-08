
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Page } from '../types';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

const performanceData = [
  { name: '00:00', current: 75, target: 80 },
  { name: '04:00', current: 82, target: 80 },
  { name: '08:00', current: 78, target: 80 },
  { name: '12:00', current: 85, target: 80 },
  { name: '16:00', current: 83, target: 80 },
  { name: '20:00', current: 88, target: 80 },
  { name: 'Now', current: 86, target: 80 },
];

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-10 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Operational Health</h1>
          <p className="text-navy-500 font-medium italic mt-2 flex items-center gap-2 text-[10px] md:text-sm uppercase tracking-widest">
            <span className="size-2 md:size-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            Live data stream active • Updated: Just now
          </p>
        </div>
        <div className="flex gap-2 md:gap-3">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 bg-white border border-navy-100 rounded-xl text-navy-700 text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 transition-all shadow-sm">
            <span className="material-symbols-outlined text-lg">tune</span> Customize
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-600 transition-all">
            <span className="material-symbols-outlined text-lg">download</span> Export
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Active Flights', val: '1,240', trend: '+2.5%', icon: 'flight', color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'Total Delays', val: '14', trend: '+5', icon: 'schedule', color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Open Conflicts', val: '3', trend: '-1', icon: 'warning', color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Gate Efficiency', val: '94%', trend: '0.5%', icon: 'door_front', color: 'text-emerald-500', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-navy-100 rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${stat.bg} ${stat.color} shadow-inner group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-2xl md:text-3xl font-black">{stat.icon}</span>
              </div>
              <span className={`text-[9px] font-black px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border ${
                stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
              }`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
            <h3 className="text-2xl md:text-3xl font-black text-navy-950 tracking-tighter">{stat.val}</h3>
            <div className="mt-6 md:mt-8 w-full h-1 bg-navy-50 rounded-full overflow-hidden shadow-inner">
               <div className={`h-full rounded-full transition-all duration-1000 ${stat.color.replace('text-', 'bg-')}`} style={{ width: '75%' }}></div>
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
               <button className="flex-1 sm:flex-none px-4 md:px-6 py-2 bg-white text-navy-950 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md border border-navy-100 whitespace-nowrap">Live Trend</button>
               <button className="flex-1 sm:flex-none px-4 md:px-6 py-2 text-navy-400 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Baseline</button>
            </div>
          </div>
          <div className="h-64 md:h-96 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#137fec" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#137fec" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 30px -10px rgb(0 0 0 / 0.1)', padding: '20px'}} 
                  itemStyle={{fontWeight: 900, fontSize: '13px', textTransform: 'uppercase'}}
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
                <span className="text-[9px] md:text-[10px] font-black text-navy-950 uppercase tracking-[0.2em]">Active Telemetry</span>
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
                    <button onClick={() => onNavigate(Page.BOOKING_SEARCH)} className="bg-white text-primary w-full py-3 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                       <span className="material-symbols-outlined text-[18px]">add</span>
                       Create Booking
                    </button>
                    <button onClick={() => onNavigate(Page.USER_MGMT)} className="bg-blue-600 text-white w-full py-3 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 border border-blue-500 shadow-sm">
                       <span className="material-symbols-outlined text-[18px]">person_add</span>
                       Add New User
                    </button>
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
                <button onClick={() => onNavigate(Page.EMAIL_CMS)} className="text-navy-300 hover:text-primary transition-all"><span className="material-symbols-outlined">settings</span></button>
             </div>
             <div className="space-y-3 relative z-10">
                <button onClick={() => onNavigate(Page.EMAIL_CMS)} className="w-full flex items-center justify-between p-4 rounded-xl md:rounded-2xl bg-navy-50/50 hover:bg-white border border-transparent hover:border-navy-100 transition-all group">
                   <div className="flex items-center gap-4 text-left">
                      <span className="material-symbols-outlined text-navy-300 group-hover:text-primary transition-colors">lock_reset</span>
                      <span className="text-[10px] font-black text-navy-900 uppercase tracking-widest">Password Reset</span>
                   </div>
                   <span className="material-symbols-outlined text-navy-200 text-sm">arrow_forward_ios</span>
                </button>
                <button onClick={() => onNavigate(Page.EMAIL_CMS)} className="w-full flex items-center justify-between p-4 rounded-xl md:rounded-2xl bg-navy-50/50 hover:bg-white border border-transparent hover:border-navy-100 transition-all group">
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
                <button onClick={() => onNavigate(Page.ALERT_AUDIT_LOG)} className="text-[10px] font-black text-primary uppercase underline">View All</button>
             </div>
             <div className="space-y-4 relative z-10">
                <div className="flex gap-4 p-4 rounded-2xl bg-red-50 border border-red-100 items-start cursor-pointer hover:bg-red-100 transition-all">
                   <div className="size-2 rounded-full bg-red-500 mt-2 shrink-0 animate-pulse"></div>
                   <div>
                      <p className="text-[10px] font-black text-red-800 uppercase tracking-tight">Price Override Auth</p>
                      <p className="text-[8px] font-bold text-red-600/70 uppercase tracking-widest">User: Alex M. • 12m ago</p>
                   </div>
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl md:rounded-[4rem] border border-navy-100 shadow-sm overflow-hidden flex flex-col pb-8">
        <div className="p-6 md:p-10 border-b border-navy-50 flex flex-col sm:flex-row justify-between items-center bg-navy-50/10 gap-4">
           <h3 className="text-xl md:text-2xl font-black text-navy-950 uppercase tracking-tighter">System Activity</h3>
           <button className="text-[10px] font-black text-primary uppercase tracking-widest underline decoration-2 underline-offset-4">Full Audit Hub</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-navy-50/50 text-[9px] font-black text-navy-300 uppercase tracking-[0.25em] border-b border-navy-50">
                <th className="px-6 md:px-10 py-6">Personnel Node</th>
                <th className="px-6 md:px-10 py-6">Sequence Action</th>
                <th className="px-6 md:px-10 py-6">Temporal Seq</th>
                <th className="px-6 md:px-10 py-6">Operational Status</th>
                <th className="px-6 md:px-10 py-6 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {[
                { name: 'Marcus Chen', email: 'chen.m@deltablue.com', action: 'Template Edit: Flight Delay', time: '2 mins ago', status: 'Success', col: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                { name: 'Alex Rivera', email: 'rivera.a@deltablue.com', action: 'Gate Move: A12 to C04', time: '15 mins ago', status: 'Completed', col: 'text-blue-600 bg-blue-50 border-blue-100' },
                { name: 'Sarah Connor', email: 'connor.s@deltablue.com', action: 'Emergency Maintenance Flag', time: '1 hour ago', status: 'Pending', col: 'text-orange-600 bg-orange-50 border-orange-100' },
                { name: 'System Core', email: 'ops.auto@deltablue.com', action: 'Automated Manifest Sync', time: '3 hours ago', status: 'Verified', col: 'text-navy-600 bg-navy-50 border-navy-100' },
              ].map((act, i) => (
                <tr key={i} className="group hover:bg-navy-50/50 transition-all cursor-pointer">
                  <td className="px-6 md:px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-navy-50 bg-cover bg-center shrink-0 border-2 border-white shadow-sm" style={{backgroundImage: `url(https://i.pravatar.cc/100?img=${i+10})`}} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-black text-navy-950 uppercase tracking-tight truncate">{act.name}</span>
                        <span className="text-[9px] text-navy-400 font-bold uppercase tracking-widest truncate">{act.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 md:px-10 py-6">
                    <span className="text-xs font-black text-navy-700 uppercase tracking-tight">{act.action}</span>
                  </td>
                  <td className="px-6 md:px-10 py-6 text-[10px] font-bold text-navy-400 uppercase tracking-widest">{act.time}</td>
                  <td className="px-6 md:px-10 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${act.col}`}>
                      {act.status}
                    </span>
                  </td>
                  <td className="px-6 md:px-10 py-6 text-right">
                    <button className="p-2 text-navy-200 hover:text-primary transition-all"><span className="material-symbols-outlined">more_horiz</span></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
