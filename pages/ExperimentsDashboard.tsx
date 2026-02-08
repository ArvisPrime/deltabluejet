
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Page } from '../types';

interface ExperimentsDashboardProps {
  onNavigate: (page: Page) => void;
}

const trendData = [
  { name: 'Mon', control: 2.1, variant: 2.8 },
  { name: 'Tue', control: 2.3, variant: 3.2 },
  { name: 'Wed', control: 2.5, variant: 3.1 },
  { name: 'Thu', control: 2.2, variant: 3.3 },
  { name: 'Fri', control: 2.4, variant: 3.5 },
  { name: 'Sat', control: 2.6, variant: 3.2 },
  { name: 'Sun', control: 2.5, variant: 3.8 },
];

const experiments = [
  { name: 'Homepage Winter Sale Hero', id: 'EXP-2023-089', target: '/home', visitors: '12,450', conv: '4.2%', uplift: '+12%', status: 'Running', icon: 'web' },
  { name: 'Seat Selection UI v2', id: 'EXP-2023-092', target: '/booking/seats', visitors: '3,205', conv: '18.5%', uplift: '0%', status: 'Running', icon: 'airline_seat_recline_extra' },
  { name: 'Quick Checkout Flow', id: 'EXP-2023-085', target: '/checkout/payment', visitors: '850', conv: '-', uplift: '-', status: 'Draft', icon: 'credit_card' },
];

const auditPreview = [
  { action: 'Traffic Update', time: '12m ago', actor: 'Admin User', detail: 'changed allocation for Homepage Hero to 50/50.' },
  { action: 'Status Change', time: '2h ago', actor: 'Sarah J.', detail: 'paused experiment Checkout Flow due to errors.' },
  { action: 'New Variant', time: 'Yesterday', actor: 'Dev Team', detail: 'added Variant C to Seat Selection.' },
];

const ExperimentsDashboard: React.FC<ExperimentsDashboardProps> = ({ onNavigate }) => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 font-display">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">
            <span>Home</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary">Optimization</span>
          </nav>
          <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Experiments Dashboard</h1>
          <p className="text-navy-500 font-medium italic mt-2 text-lg">Monitor active tests, analyze traffic allocation, and configure optimizations.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:bg-navy-50 transition-all shadow-sm">
            <span className="material-symbols-outlined text-lg">filter_list</span> Filter View
          </button>
          <button className="flex items-center gap-3 px-8 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-xl">add</span> Create Experiment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Active Experiments', val: '8', sub: '1 New', icon: 'science', color: 'text-primary', bg: 'bg-primary/5', progress: 65, pText: '65% of traffic in tests' },
          { label: 'Traffic Impacted', val: '15.4k', sub: '+12%', icon: 'group', color: 'text-blue-500', bg: 'bg-blue-50', progress: 0, pText: 'Daily unique visitors' },
          { label: 'Avg. Conversion Uplift', val: '+2.4%', sub: '+0.5%', icon: 'payments', color: 'text-emerald-500', bg: 'bg-emerald-50', progress: 0, pText: 'Est. impact: $12,400' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[3rem] border border-navy-100 p-8 shadow-sm flex flex-col group hover:shadow-xl transition-all relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{stat.label}</p>
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} shadow-inner group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined font-black">{stat.icon}</span>
              </div>
            </div>
            <div className="flex items-baseline gap-3 mb-2">
              <h3 className="text-4xl font-black text-navy-950 tracking-tighter uppercase">{stat.val}</h3>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                stat.sub.startsWith('+') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-navy-50 text-navy-400 border-navy-100'
              }`}>
                {stat.sub}
              </span>
            </div>
            {stat.progress > 0 && (
              <div className="w-full bg-navy-50 rounded-full h-1.5 mt-4 overflow-hidden shadow-inner">
                <div className={`${stat.color.replace('text-', 'bg-')} h-full rounded-full transition-all duration-1000`} style={{ width: `${stat.progress}%` }}></div>
              </div>
            )}
            <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mt-4 opacity-60 italic">{stat.pText}</p>
            <div className="absolute -bottom-10 -right-10 opacity-[0.03] text-navy-950">
               <span className="material-symbols-outlined text-[180px] font-black">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white rounded-[4rem] border border-navy-100 p-12 shadow-sm relative group overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 relative z-10">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-navy-950 uppercase tracking-tighter">Conversion Rate Trend</h3>
              <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest opacity-60">Experiment: <span className="text-primary">Homepage Winter Sale Hero</span></p>
            </div>
            <div className="flex gap-4 items-center bg-navy-50 p-1.5 rounded-[1.5rem] shadow-inner border border-navy-100">
               <button className="px-6 py-2 bg-white text-navy-950 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md border border-navy-100">7 Days</button>
               <button className="px-6 py-2 text-navy-400 text-[10px] font-black uppercase tracking-widest">30 Days</button>
            </div>
          </div>
          <div className="h-[400px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorVariant" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#137fec" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#137fec" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                <YAxis hide domain={[0, 5]} />
                <Tooltip 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 30px -10px rgb(0 0 0 / 0.1)', padding: '20px'}} 
                  itemStyle={{fontWeight: 900, fontSize: '13px', textTransform: 'uppercase'}}
                />
                <Area type="monotone" dataKey="control" stroke="#94a3b8" strokeWidth={2} fill="transparent" strokeDasharray="6 6" />
                <Area type="monotone" dataKey="variant" stroke="#137fec" strokeWidth={5} fillOpacity={1} fill="url(#colorVariant)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-10 mt-8 relative z-10">
             <div className="flex items-center gap-3">
                <span className="size-2.5 rounded-full bg-navy-200"></span>
                <span className="text-[10px] font-black text-navy-400 uppercase tracking-[0.2em]">Control (Original)</span>
             </div>
             <div className="flex items-center gap-3">
                <span className="size-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(19,127,236,0.5)]"></span>
                <span className="text-[10px] font-black text-navy-950 uppercase tracking-[0.2em]">Variant B (New Layout)</span>
             </div>
          </div>
        </div>

        {/* Right Side Widgets */}
        <div className="space-y-8">
           {/* Probability Card */}
           <div className="bg-white rounded-[3.5rem] border border-navy-100 p-10 shadow-sm flex flex-col items-center text-center space-y-8 group hover:shadow-xl transition-all">
              <div className="space-y-1">
                 <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight leading-none">Winning Probability</h3>
                 <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest opacity-60">Chance of Variant B outperforming Control</p>
              </div>
              
              <div className="relative size-48 flex items-center justify-center">
                 <svg className="size-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" className="fill-none stroke-navy-50" strokeWidth="8" />
                    <circle cx="50" cy="50" r="45" className="fill-none stroke-primary" strokeWidth="8" strokeDasharray="282.7" strokeDashoffset="11.3" strokeLinecap="round" />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-navy-950 tracking-tighter">96%</span>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Significant</span>
                 </div>
              </div>

              <button className="w-full py-4 rounded-2xl bg-navy-950 text-white font-black uppercase text-[10px] tracking-[0.3em] shadow-xl hover:bg-black transition-all">Declare Operational Winner</button>
           </div>

           {/* Traffic Allocation */}
           <div className="bg-white rounded-[3rem] border border-navy-100 p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-center px-1">
                 <h3 className="text-[10px] font-black text-navy-950 uppercase tracking-widest">Traffic Allocation</h3>
                 <span className="material-symbols-outlined text-navy-200 text-sm cursor-help">info</span>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between text-[10px] font-black text-navy-400 uppercase tracking-widest px-1">
                    <span>Control (50%)</span>
                    <span>Variant B (50%)</span>
                 </div>
                 <div className="h-4 w-full bg-navy-50 rounded-full overflow-hidden flex shadow-inner border border-navy-100/50">
                    <div className="bg-navy-200 w-1/2 h-full border-r border-white/50"></div>
                    <div className="bg-primary w-1/2 h-full shadow-inner"></div>
                 </div>
              </div>
           </div>

           {/* Audit Log Mini */}
           <div className="bg-white rounded-[3rem] border border-navy-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-navy-50 bg-navy-50/20 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-sm font-black">verified_user</span>
                    <h3 className="text-[10px] font-black text-navy-950 uppercase tracking-widest">Audit Log</h3>
                 </div>
                 <button onClick={() => onNavigate(Page.EXPERIMENTS_AUDIT_LOG)} className="text-[10px] font-black text-primary uppercase underline">View Full</button>
              </div>
              <div className="divide-y divide-navy-50">
                 {auditPreview.map((log, i) => (
                    <div key={i} className="p-5 hover:bg-navy-50/50 transition-all cursor-pointer group">
                       <div className="flex justify-between items-start mb-1.5">
                          <span className="text-[10px] font-black text-navy-950 uppercase tracking-tight group-hover:text-primary transition-colors">{log.action}</span>
                          <span className="text-[8px] font-black text-navy-300 uppercase tracking-widest">{log.time}</span>
                       </div>
                       <p className="text-[9px] font-bold text-navy-500 uppercase italic leading-relaxed tracking-wider opacity-70">
                          <span className="text-navy-950">{log.actor}</span> {log.detail}
                       </p>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Experiments Table */}
      <div className="bg-white rounded-[4rem] border border-navy-100 shadow-sm overflow-hidden flex flex-col pb-12">
         <div className="p-10 border-b border-navy-50 flex flex-wrap gap-8 items-center justify-between bg-navy-50/10">
            <h3 className="text-2xl font-black text-navy-950 uppercase tracking-tighter">Active Experiments</h3>
            <div className="flex gap-4">
               <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined text-xl">search</span>
                  <input className="w-48 pl-12 pr-4 py-2.5 bg-white border-2 border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-primary/5 transition-all" placeholder="Filter..." />
               </div>
               <button className="p-2.5 bg-white border-2 border-navy-100 rounded-2xl text-navy-400 hover:text-primary transition-all shadow-sm">
                  <span className="material-symbols-outlined">download</span>
               </button>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-navy-50/50 text-[9px] font-black text-navy-300 uppercase tracking-[0.25em] border-b border-navy-50">
                     <th className="px-12 py-6">Experiment Name & ID</th>
                     <th className="px-12 py-6">Target Page</th>
                     <th className="px-12 py-6">Registry Visitors</th>
                     <th className="px-12 py-6">Conversion Delta</th>
                     <th className="px-12 py-6">Operational Status</th>
                     <th className="px-12 py-6 text-right">Settings</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-navy-50">
                  {experiments.map((exp, i) => (
                    <tr key={i} className="group hover:bg-navy-50/50 transition-all cursor-pointer">
                       <td className="px-12 py-8">
                          <div className="flex items-center gap-5">
                             <div className="size-11 rounded-[1.25rem] bg-navy-50 flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-xl font-black">{exp.icon}</span>
                             </div>
                             <div>
                                <p className="text-sm font-black text-navy-950 uppercase tracking-tight">{exp.name}</p>
                                <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mt-0.5 opacity-60">ID: {exp.id}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-12 py-8"><span className="text-[10px] font-black text-primary uppercase tracking-widest font-mono">{exp.target}</span></td>
                       <td className="px-12 py-8">
                          <div className="space-y-0.5">
                             <p className="text-sm font-black text-navy-950 uppercase tracking-tighter">{exp.visitors}</p>
                             <p className="text-[8px] font-bold text-navy-300 uppercase tracking-widest italic">{exp.name.includes('Hero') ? 'Since Oct 24' : 'Since Nov 01'}</p>
                          </div>
                       </td>
                       <td className="px-12 py-8">
                          <div className="flex items-center gap-3">
                             <span className="text-sm font-black text-navy-950 uppercase tracking-tighter">{exp.conv}</span>
                             {exp.uplift !== '-' && (
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                  exp.uplift.startsWith('+') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-navy-50 text-navy-400 border-navy-100'
                                }`}>{exp.uplift}</span>
                             )}
                          </div>
                       </td>
                       <td className="px-12 py-8">
                          <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                            exp.status === 'Running' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-navy-50 text-navy-400 border-navy-100'
                          }`}>
                             <span className={`size-1.5 rounded-full ${exp.status === 'Running' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-navy-300'}`} />
                             {exp.status}
                          </span>
                       </td>
                       <td className="px-12 py-8 text-right">
                          <button className="p-2.5 bg-navy-50 text-navy-200 hover:text-primary hover:bg-white rounded-xl transition-all shadow-inner"><span className="material-symbols-outlined">more_vert</span></button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
         <div className="px-12 py-8 bg-navy-50/30 border-t border-navy-50 flex items-center justify-between">
            <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Showing 3 of 12 Registered Experiments</p>
            <div className="flex gap-4">
               <button className="px-6 py-2.5 bg-white border-2 border-navy-200 text-navy-300 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed shadow-sm" disabled>Previous Cycle</button>
               <button className="px-8 py-2.5 bg-white border-2 border-navy-100 text-navy-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 shadow-sm transition-all">Next Segment</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ExperimentsDashboard;
