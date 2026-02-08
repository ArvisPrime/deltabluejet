
import React from 'react';

const FlightScheduling: React.FC = () => {
  const flights = [
    { no: 'DJ-1024', route: ['TPA', 'MIA'], full: 'Tampa to Miami', dep: '08:00 AM', arr: '09:15 AM', days: [1,1,1,1,1,0,0], ac: 'ATR 72-600', rule: 'Standard Economy', tz: 'EST', gate: 'A04' },
    { no: 'DJ-2091', route: ['JFK', 'LHR'], full: 'New York to London', dep: '06:30 PM', arr: '06:45 AM', days: [1,0,1,0,1,1,1], ac: 'Boeing 787-9', rule: 'Dynamic (Peak)', tz: 'EST', nextDay: '+1', gate: 'B15' },
    { no: 'DJ-0042', route: ['SFO', 'NRT'], full: 'San Fran. to Tokyo', dep: '11:15 AM', arr: '03:45 PM', days: [0,1,0,1,0,1,0], ac: 'Boeing 777', rule: 'Standard Long Haul', tz: 'PST', nextDay: '+1', gate: null },
    { no: 'DJ-3301', route: ['LAX', 'SYD'], full: 'Los Angeles to Sydney', dep: '10:45 PM', arr: '08:20 AM', days: [1,1,1,1,1,1,1], ac: 'Airbus A350', rule: 'Premium Economy', tz: 'PST', nextDay: '+2', gate: 'TBIT-102' },
    { no: 'DJ-1088', route: ['MIA', 'EZE'], full: 'Miami to Buenos Aires', dep: '07:20 AM', arr: '05:30 PM', days: [0,1,0,1,0,1,1], ac: 'Boeing 787-8', rule: 'Standard Economy', tz: 'EST', gate: 'D08' },
  ];

  return (
    <div className="h-full flex flex-col font-sans bg-navy-50/30 overflow-hidden">
      <header className="bg-white border-b border-navy-100 shrink-0 z-10 p-8 pb-4">
        <div className="max-w-[1600px] mx-auto w-full space-y-8">
           <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">
              <span>Operations</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-primary">Flight Scheduling & Gates</span>
           </nav>
           <div className="flex flex-wrap justify-between items-end gap-6">
              <div className="space-y-1">
                 <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase">Flight & Gate Management</h1>
                 <p className="text-navy-400 font-bold uppercase text-xs tracking-widest mt-2 italic opacity-60">Schedule routes, assign aircraft, and allocate boarding gates.</p>
              </div>
              <button className="flex items-center gap-3 bg-primary hover:bg-primary-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-primary/20 active:scale-95">
                 <span className="material-symbols-outlined text-[20px]">add</span>
                 Create New Flight
              </button>
           </div>

           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pt-4 border-t border-navy-50">
              <div className="flex items-center gap-2 bg-navy-50 p-1.5 rounded-2xl border border-navy-100 shadow-inner">
                 <button className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white shadow-md text-navy-950 text-[10px] font-black uppercase tracking-widest transition-all">
                    <span className="material-symbols-outlined text-[18px]">table_rows</span>
                    List View
                 </button>
                 <button className="flex items-center gap-2 px-5 py-2 rounded-xl hover:bg-navy-100 text-navy-400 text-[10px] font-black uppercase tracking-widest transition-all">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    Calendar
                 </button>
                 <button className="flex items-center gap-2 px-5 py-2 rounded-xl hover:bg-navy-100 text-navy-400 text-[10px] font-black uppercase tracking-widest transition-all">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    Timeline
                 </button>
              </div>
              <div className="relative flex-1 max-w-md w-full">
                 <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 text-[20px]">search</span>
                 <input className="block w-full pl-12 pr-4 py-3.5 border-none bg-white shadow-sm ring-1 ring-navy-100 rounded-2xl text-navy-900 placeholder-navy-200 text-sm font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/20" placeholder="Search Master Registry..." />
              </div>
              <button className="flex items-center gap-3 px-6 py-3.5 bg-navy-50 border border-navy-100 text-navy-700 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-navy-100 shadow-sm transition-all">
                 <span className="material-symbols-outlined text-[20px]">filter_list</span>
                 Refine Filters
              </button>
           </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-[1600px] mx-auto space-y-12 pb-12">
          {/* Main List */}
          <div className="bg-white rounded-[3rem] border border-navy-100 shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                   <thead>
                      <tr className="bg-navy-50/50 text-[9px] font-black text-navy-300 uppercase tracking-[0.25em] border-b border-navy-50">
                         <th className="px-8 py-6 w-32">Flight #</th>
                         <th className="px-8 py-6">Route Profile</th>
                         <th className="px-8 py-6">Time (Local)</th>
                         <th className="px-8 py-6">Gate Assignment</th>
                         <th className="px-8 py-6">Operating Matrix</th>
                         <th className="px-8 py-6">Asset Assigned</th>
                         <th className="px-8 py-6">Pricing Model</th>
                         <th className="px-8 py-6 text-right">Settings</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-navy-50">
                      {flights.map((f, i) => (
                        <tr key={i} className="hover:bg-navy-50/30 transition-colors group">
                           <td className="px-8 py-8"><span className="font-black text-navy-950 uppercase tracking-tighter text-lg">{f.no}</span></td>
                           <td className="px-8 py-8">
                              <div className="flex items-center gap-4">
                                 <div className="flex flex-col"><span className="font-black text-navy-950 uppercase text-sm tracking-widest">{f.route[0]}</span><span className="text-[8px] font-black text-navy-300 uppercase tracking-[0.2em]">{f.tz}</span></div>
                                 <span className="material-symbols-outlined text-navy-200 text-lg">arrow_forward</span>
                                 <div className="flex flex-col"><span className="font-black text-navy-950 uppercase text-sm tracking-widest">{f.route[1]}</span><span className="text-[8px] font-black text-navy-300 uppercase tracking-[0.2em]">{f.tz}</span></div>
                              </div>
                              <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest block mt-2 opacity-50">{f.full}</span>
                           </td>
                           <td className="px-8 py-8">
                              <div className="space-y-2">
                                 <div className="flex items-center gap-2 text-xs font-black text-navy-700 tracking-tight uppercase"><span className="material-symbols-outlined text-navy-300 text-sm">flight_takeoff</span> {f.dep}</div>
                                 <div className="flex items-center gap-2 text-xs font-black text-navy-700 tracking-tight uppercase"><span className="material-symbols-outlined text-navy-300 text-sm">flight_land</span> {f.arr} {f.nextDay && <span className="text-primary text-[8px] align-top">{f.nextDay}</span>}</div>
                              </div>
                           </td>
                           <td className="px-8 py-8">
                              {f.gate ? (
                                <div className="group/gate relative">
                                  <button className={`flex items-center justify-between w-36 px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    f.no.includes('2091') ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}>
                                    <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">meeting_room</span> {f.gate}</span>
                                    <span className="material-symbols-outlined text-sm opacity-50">expand_more</span>
                                  </button>
                                  {f.no.includes('2091') && <p className="text-[8px] font-black text-amber-600 uppercase mt-1 px-1">Changed 10m ago</p>}
                                </div>
                              ) : (
                                <button className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-navy-100 rounded-xl text-navy-300 text-[10px] font-black uppercase tracking-widest hover:border-primary hover:text-primary transition-all">
                                   <span className="material-symbols-outlined text-sm">add_circle</span> Assign
                                </button>
                              )}
                           </td>
                           <td className="px-8 py-8">
                              <div className="flex gap-1">
                                 {['M','T','W','T','F','S','S'].map((day, di) => (
                                   <span key={di} className={`size-7 flex items-center justify-center rounded-lg text-[9px] font-black transition-all ${f.days[di] ? 'bg-primary text-white shadow-sm' : 'bg-navy-50 text-navy-200'}`}>{day}</span>
                                 ))}
                              </div>
                           </td>
                           <td className="px-8 py-8">
                              <div className="flex items-center gap-3 bg-navy-50/50 px-4 py-2 rounded-xl border border-navy-50 w-fit">
                                 <span className="material-symbols-outlined text-navy-300 text-lg">airlines</span>
                                 <span className="text-[10px] font-black text-navy-700 uppercase tracking-widest">{f.ac}</span>
                              </div>
                           </td>
                           <td className="px-8 py-8">
                              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-inner ${
                                f.rule.includes('Dynamic') ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-navy-50 text-navy-500 border-navy-100'
                              }`}>
                                 {f.rule}
                              </span>
                           </td>
                           <td className="px-8 py-8 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                 <button className="p-2 text-navy-400 hover:text-primary hover:bg-navy-50 rounded-xl transition-colors shadow-sm bg-white border border-navy-50"><span className="material-symbols-outlined text-xl">edit_calendar</span></button>
                                 <button className="p-2 text-navy-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shadow-sm bg-white border border-navy-50"><span className="material-symbols-outlined text-xl">block</span></button>
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             <div className="bg-navy-50/30 px-10 py-6 border-t border-navy-100 flex items-center justify-between">
                <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Showing Registry Routes 1-5 of 42 active</p>
                <div className="flex gap-4">
                   <button className="px-6 py-2.5 bg-white border border-navy-200 text-[10px] font-black uppercase tracking-widest rounded-xl text-navy-300 cursor-not-allowed shadow-sm" disabled>Previous</button>
                   <button className="px-8 py-2.5 bg-white border border-navy-200 text-[10px] font-black uppercase tracking-widest rounded-xl text-navy-700 hover:bg-navy-50 shadow-sm transition-all">Next</button>
                </div>
             </div>
          </div>

          {/* Monthly Preview */}
          <div className="space-y-8">
             <div className="flex justify-between items-center px-4">
                <div className="flex items-center gap-6">
                   <h2 className="text-xl font-black text-navy-950 uppercase tracking-tight">Monthly Schedule Overview</h2>
                   <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl shadow-sm border border-navy-100">
                      <button className="p-1 hover:text-primary transition-colors"><span className="material-symbols-outlined">chevron_left</span></button>
                      <span className="text-[10px] font-black text-navy-950 uppercase tracking-[0.2em]">October 2024</span>
                      <button className="p-1 hover:text-primary transition-colors"><span className="material-symbols-outlined">chevron_right</span></button>
                   </div>
                </div>
                <button className="text-[10px] font-black text-primary uppercase tracking-[0.2em] underline">View Full Calendar</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                {['MON 23', 'TUE 24', 'WED 25', 'THU 26', 'FRI 27', 'SAT 28', 'SUN 29'].map((day, i) => (
                  <div key={i} className={`bg-white rounded-[2rem] border border-navy-100 p-6 flex flex-col gap-4 min-h-[260px] shadow-sm transition-all hover:shadow-md ${i > 4 ? 'opacity-40 grayscale' : ''}`}>
                     <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] mb-2">{day}</p>
                     <div className="space-y-3">
                        <div className="bg-primary/5 border-l-4 border-primary p-3 rounded-2xl space-y-1 shadow-sm cursor-pointer hover:bg-primary/10 transition-colors">
                           <div className="flex justify-between items-center"><span className="text-xs font-black text-navy-950 uppercase">DJ-1024</span><span className="text-[8px] font-black text-navy-300 uppercase">ATR72</span></div>
                           <p className="text-[9px] font-bold text-navy-500 uppercase tracking-widest">08:00 AM • TPA</p>
                           <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">meeting_room</span> Gate A04</p>
                        </div>
                        {i === 1 && (
                          <div className="bg-amber-500/5 border-l-4 border-amber-500 p-3 rounded-2xl space-y-1 shadow-sm cursor-pointer hover:bg-amber-500/10 transition-colors">
                             <div className="flex justify-between items-center"><span className="text-xs font-black text-navy-950 uppercase">DJ-0042</span><span className="text-[8px] font-black text-navy-300 uppercase">B777</span></div>
                             <p className="text-[9px] font-bold text-navy-500 uppercase tracking-widest">11:15 AM • SFO</p>
                             <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">warning</span> No Gate</p>
                          </div>
                        )}
                        {(i === 0 || i === 2) && (
                          <div className="bg-navy-950 border-l-4 border-navy-400 p-3 rounded-2xl space-y-1 shadow-lg text-white">
                             <div className="flex justify-between items-center"><span className="text-xs font-black uppercase">DJ-2091</span><span className="text-[8px] font-black opacity-40 uppercase">B787</span></div>
                             <p className="text-[9px] font-black opacity-60 uppercase tracking-widest">06:30 PM • JFK</p>
                             <p className="text-[8px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">meeting_room</span> Gate B15</p>
                          </div>
                        )}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightScheduling;
