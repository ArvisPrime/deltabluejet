
import React from 'react';

const RegulatoryManifest: React.FC = () => {
  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar font-display bg-navy-50/20">
      <div className="max-w-[1600px] mx-auto w-full space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-wrap gap-2 items-center text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
           <span>Operations</span>
           <span className="material-symbols-outlined text-xs">chevron_right</span>
           <span>Compliance</span>
           <span className="material-symbols-outlined text-xs">chevron_right</span>
           <span className="text-primary">Regulatory View</span>
        </div>

        <div className="flex flex-wrap justify-between items-end gap-6 border-b border-navy-100 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
               <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase">Flight DJ4590</h1>
               <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">International</span>
            </div>
            <div className="flex items-center gap-3 text-navy-400 font-bold text-[10px] uppercase tracking-widest mt-2">
              <span className="font-black text-navy-600">LHR (London)</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
              <span className="font-black text-navy-600">JFK (New York)</span>
              <span className="size-1 rounded-full bg-navy-100"></span>
              <span className="font-mono">Oct 24, 2024</span>
              <span className="size-1 rounded-full bg-navy-100"></span>
              <span className="text-red-500 flex items-center gap-1">
                 <span className="material-symbols-outlined text-sm">warning</span> 3 Flagged Pax
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-navy-100 bg-white text-navy-700 font-black uppercase text-[10px] tracking-widest hover:bg-navy-50 transition-all shadow-sm">
              <span className="material-symbols-outlined text-lg">history</span>
              Audit Log
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-navy-900 text-white font-black uppercase text-[10px] tracking-widest hover:bg-navy-950 transition-all shadow-xl shadow-navy-900/20">
              <span className="material-symbols-outlined text-lg">send</span>
              Submit to APIS
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Manifest Status', val: 'Pending Submission', tag: 'bg-amber-100 text-amber-700', icon: 'pending_actions' },
            { label: 'Total Onboard', val: '286 Pax', sub: 'Active Load', icon: 'groups' },
            { label: 'Docs Verified', val: '98.2%', sub: '5 Verification Required', icon: 'verified_user', alert: true },
            { label: 'Watchlist Hits', val: '0 Hit', sub: 'Clear for Departure', icon: 'priority_high', green: true },
          ].map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-navy-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
               <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">{s.label}</p>
                  {s.tag ? (
                    <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${s.tag}`}>{s.val}</span>
                  ) : (
                    <span className={`material-symbols-outlined ${s.alert ? 'text-red-500' : s.green ? 'text-emerald-500' : 'text-navy-300'}`}>{s.icon}</span>
                  )}
               </div>
               <div>
                  <p className="text-2xl font-black text-navy-950 tracking-tight">{s.tag ? s.sub || '286 Pax' : s.val}</p>
                  {s.sub && <p className={`text-[10px] font-bold uppercase mt-1 ${s.alert ? 'text-red-500' : 'text-navy-400'}`}>{s.sub}</p>}
               </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-5 rounded-[2.5rem] border border-navy-100 shadow-sm flex flex-col xl:flex-row gap-6 items-center justify-between">
           <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
              <div className="relative w-full md:w-80">
                 <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300">search</span>
                 <input className="w-full pl-12 pr-4 py-3 bg-navy-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-950 focus:ring-2 focus:ring-primary/20 placeholder:text-navy-300" placeholder="Search PNR, Name, Passport..." />
              </div>
              <div className="flex gap-4 overflow-x-auto pb-1">
                 {['Nationality', 'Doc Status', 'Flight Status'].map((f, idx) => (
                    <select key={idx} className="h-12 px-5 bg-navy-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-700 min-w-[160px] focus:ring-2 focus:ring-primary/20 appearance-none">
                       <option>{f}</option>
                    </select>
                 ))}
              </div>
           </div>
           <div className="flex gap-4">
              <button className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-navy-50 text-navy-700 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-navy-50">
                 <span className="material-symbols-outlined text-lg">print</span>
                 Print Registry
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary/20">
                 <span className="material-symbols-outlined text-lg">download</span>
                 Export APIS (CSV)
              </button>
           </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-navy-100 shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-navy-50/50 text-[9px] font-black text-navy-300 uppercase tracking-[0.25em] border-b border-navy-50">
                       <th className="px-10 py-6">Passenger / Identity</th>
                       <th className="px-10 py-6">Nationality / Doc #</th>
                       <th className="px-10 py-6">Profile</th>
                       <th className="px-10 py-6">PNR / Ticket</th>
                       <th className="px-10 py-6">Seat</th>
                       <th className="px-10 py-6">Boarding</th>
                       <th className="px-10 py-6">APIS Compliance</th>
                       <th className="px-10 py-6 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-navy-50">
                    {[
                      { name: 'SMITH, JOHN', type: 'ADULT', nation: 'USA', nationIcon: '🇺🇸', doc: 'P: A12345678', dob: '12 Jan 1980', detail: '44y / Male', pnr: 'X7Y2Z', tkt: '125-2345678901', seat: '12A', class: 'Econ', status: 'Checked-In', statusColor: 'bg-emerald-50 text-emerald-700', check: 'Docs OK', checkIcon: 'check_circle', checkColor: 'text-emerald-500' },
                      { name: 'DOE, JANE', type: 'ADULT', nation: 'GBR', nationIcon: '🇬🇧', doc: 'P: B98765432', dob: '22 May 1992', detail: '32y / Female', pnr: 'A1B2C', tkt: '125-2345678902', seat: '--', class: 'Bus', status: 'No Show', statusColor: 'bg-red-50 text-red-700', check: 'Pending', checkIcon: 'pending', checkColor: 'text-amber-500' },
                      { name: 'KHAN, MOHAMMED', type: 'ADULT', nation: 'UAE', nationIcon: '🇦🇪', doc: 'MISSING DOCS', dob: '03 Mar 1975', detail: '49y / Male', pnr: 'Z8X9Y', tkt: '125-2345678905', seat: '14F', class: 'Econ', status: 'Pending', statusColor: 'bg-navy-50 text-navy-500', check: 'Action Req', checkIcon: 'error', checkColor: 'text-red-500', alert: true },
                    ].map((p, i) => (
                      <tr key={i} className={`hover:bg-navy-50/50 transition-colors group ${p.alert ? 'bg-red-50/30' : ''}`}>
                         <td className="px-10 py-6">
                            <div className="flex items-center gap-4">
                               <div className="size-10 rounded-full bg-navy-50 flex items-center justify-center font-black text-navy-400 border border-navy-100 uppercase">{p.name.split(',')[0].charAt(0)}{p.name.split(' ')[1]?.charAt(0)}</div>
                               <div>
                                  <p className="text-xs font-black text-navy-950 uppercase tracking-wider">{p.name}</p>
                                  <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest">{p.type}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-6">
                            <div className="flex items-center gap-2 mb-1">
                               <span className="text-base">{p.nationIcon}</span>
                               <span className="text-[10px] font-black text-navy-900 uppercase tracking-widest">{p.nation}</span>
                            </div>
                            <p className={`text-[8px] font-black uppercase tracking-widest ${p.doc.includes('MISSING') ? 'text-red-500' : 'text-navy-300'}`}>{p.doc}</p>
                         </td>
                         <td className="px-10 py-6">
                            <p className="text-[10px] font-black text-navy-900 uppercase tracking-widest">{p.dob}</p>
                            <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest mt-1">{p.detail}</p>
                         </td>
                         <td className="px-10 py-6">
                            <p className="text-[10px] font-black text-primary uppercase tracking-tighter">{p.pnr}</p>
                            <p className="text-[8px] font-black text-navy-300 uppercase tracking-widest mt-1">{p.tkt}</p>
                         </td>
                         <td className="px-10 py-6">
                            <div className="flex items-center gap-2">
                               <span className={`text-xs font-black tracking-tighter ${p.seat === '--' ? 'text-navy-200' : 'text-navy-950'}`}>{p.seat}</span>
                               <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-navy-50 text-navy-400">{p.class}</span>
                            </div>
                         </td>
                         <td className="px-10 py-6">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.15em] border border-transparent ${p.statusColor}`}>
                               {p.status}
                            </span>
                         </td>
                         <td className="px-10 py-6">
                            <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${p.checkColor}`}>
                               <span className="material-symbols-outlined text-lg">{p.checkIcon}</span>
                               {p.check}
                            </div>
                         </td>
                         <td className="px-10 py-6 text-right">
                            {p.alert ? (
                               <button className="bg-red-600 text-white text-[9px] font-black uppercase px-4 py-2 rounded-xl shadow-lg shadow-red-500/20 hover:scale-105 transition-all">Verify Now</button>
                            ) : (
                               <button className="text-navy-300 hover:text-primary transition-colors"><span className="material-symbols-outlined">edit_document</span></button>
                            )}
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           <div className="px-10 py-6 bg-navy-50/30 border-t border-navy-50 flex items-center justify-between">
              <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Displaying 1-3 of 286 Regulatory Records</p>
              <div className="flex gap-4">
                 <button className="px-6 py-2.5 bg-white border border-navy-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-navy-300 cursor-not-allowed">Previous</button>
                 <button className="px-8 py-2.5 bg-white border border-navy-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:bg-navy-50 transition-all">Next</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RegulatoryManifest;
