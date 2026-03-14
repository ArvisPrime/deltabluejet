
import React, { useState, useEffect, useCallback } from 'react';
import {
   generateManifest,
   exportManifestCSV,
   getUpcomingFlights,
   type ManifestSummary,
} from '../../services/manifestService';
import type { FlightDoc } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';

const RegulatoryManifest: React.FC = () => {
   const [flights, setFlights] = useState<FlightDoc[]>([]);
   const [selectedFlightId, setSelectedFlightId] = useState('');
   const [manifest, setManifest] = useState<ManifestSummary | null>(null);
   const [loading, setLoading] = useState(true);
   const [generating, setGenerating] = useState(false);
   const [searchTerm, setSearchTerm] = useState('');

   useEffect(() => {
      const load = async () => {
         try {
            const data = await getUpcomingFlights();
            setFlights(data);
         } catch (err) { console.error(err); useToastStore.getState().addToast(err instanceof Error ? err.message : "An unexpected error occurred", "error"); }
         finally { setLoading(false); }
      };
      load();
   }, []);

   const handleGenerate = useCallback(async (flightId: string) => {
      if (!flightId) return;
      setGenerating(true);
      try {
         const result = await generateManifest(flightId);
         setManifest(result);
      } catch (err) { console.error(err); useToastStore.getState().addToast(err instanceof Error ? err.message : "An unexpected error occurred", "error"); }
      finally { setGenerating(false); }
   }, []);

   const handleFlightChange = (id: string) => {
      setSelectedFlightId(id);
      if (id) handleGenerate(id);
   };

   const selectedFlight = flights.find(f => f.id === selectedFlightId);
   const fmtTime = (ts: any) => ts?.toDate ? ts.toDate().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--';

   const filteredRecords = manifest?.records.filter(r =>
      !searchTerm || r.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.pnr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.documentNumber.toLowerCase().includes(searchTerm.toLowerCase())
   ) || [];

   const docsVerifiedPct = manifest && manifest.totalPassengers > 0
      ? ((manifest.docsVerified / manifest.totalPassengers) * 100).toFixed(1) : '0';

   return (
      <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar font-display bg-navy-50/20">
         <div className="max-w-[1600px] mx-auto w-full space-y-6 animate-in fade-in duration-500">
            {/* Breadcrumbs */}
            <div className="flex flex-wrap gap-2 items-center text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
               <span>Operations</span>
               <span className="material-symbols-outlined text-xs">chevron_right</span>
               <span>Compliance</span>
               <span className="material-symbols-outlined text-xs">chevron_right</span>
               <span className="text-primary">Passenger Manifest</span>
            </div>

            {/* Header + Flight Selector */}
            <div className="flex flex-wrap justify-between items-end gap-6 border-b border-navy-100 pb-6">
               <div className="space-y-1">
                  <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase">
                     {selectedFlight ? selectedFlight.flightNumber : 'Passenger Manifest'}
                  </h1>
                  <div className="flex items-center gap-3 text-navy-400 font-bold text-[10px] uppercase tracking-widest mt-2">
                     {selectedFlight ? (
                        <>
                           <span className="font-black text-navy-600">{selectedFlight.origin.code}</span>
                           <span className="material-symbols-outlined text-sm">arrow_forward</span>
                           <span className="font-black text-navy-600">{selectedFlight.destination.code}</span>
                           <span className="size-1 rounded-full bg-navy-100" />
                           <span className="font-mono">{fmtTime(selectedFlight.departureTime)}</span>
                        </>
                     ) : (
                        <span>{loading ? 'Loading flights...' : 'Select a flight to generate manifest'}</span>
                     )}
                  </div>
               </div>
               <div className="flex gap-3 items-center">
                  <select
                     value={selectedFlightId}
                     onChange={e => handleFlightChange(e.target.value)}
                     className="h-12 px-5 bg-white border-2 border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-700 min-w-[220px] focus:ring-2 focus:ring-primary/20 shadow-sm"
                  >
                     <option value="">Select Flight</option>
                     {flights.map(f => (
                        <option key={f.id} value={f.id}>
                           {f.flightNumber} — {f.origin.code}→{f.destination.code} — {fmtTime(f.departureTime)}
                        </option>
                     ))}
                  </select>
                  {manifest && (
                     <button
                        onClick={() => exportManifestCSV(manifest.records, selectedFlight?.flightNumber || 'manifest')}
                        className="flex items-center gap-2 px-6 py-3 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary/20 transition-all"
                     >
                        <span className="material-symbols-outlined text-lg">download</span>
                        Export CSV
                     </button>
                  )}
               </div>
            </div>

            {/* Generating Spinner */}
            {generating && (
               <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-4">
                     <div className="animate-spin size-8 border-3 border-navy-200 border-t-primary rounded-full" />
                     <p className="text-xs font-black text-navy-400 uppercase tracking-widest">Generating manifest...</p>
                  </div>
               </div>
            )}

            {/* Summary Cards */}
            {manifest && !generating && (
               <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                     {[
                        { label: 'Manifest Status', val: manifest.totalPassengers > 0 ? 'Ready' : 'Empty', tag: manifest.totalPassengers > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700', icon: 'pending_actions' },
                        { label: 'Total Onboard', val: `${manifest.totalPassengers} Pax`, sub: `${manifest.checkedIn} checked in`, icon: 'groups' },
                        { label: 'Docs Verified', val: `${docsVerifiedPct}%`, sub: `${manifest.docsPending} pending`, icon: 'verified_user', alert: manifest.docsPending > 0 },
                        { label: 'Action Required', val: `${manifest.records.filter(r => r.apisCompliance === 'Action Required').length}`, sub: manifest.records.filter(r => r.apisCompliance === 'Action Required').length === 0 ? 'Clear' : 'Needs review', icon: 'priority_high', green: manifest.records.filter(r => r.apisCompliance === 'Action Required').length === 0 },
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
                              <p className="text-2xl font-black text-navy-950 tracking-tight">{s.tag ? manifest.totalPassengers + ' Pax' : s.val}</p>
                              {s.sub && <p className={`text-[10px] font-bold uppercase mt-1 ${s.alert ? 'text-red-500' : 'text-navy-400'}`}>{s.sub}</p>}
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* Search */}
                  <div className="bg-white p-5 rounded-[2.5rem] border border-navy-100 shadow-sm flex flex-col xl:flex-row gap-6 items-center justify-between">
                     <div className="relative w-full xl:w-96">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300">search</span>
                        <input
                           value={searchTerm}
                           onChange={e => setSearchTerm(e.target.value)}
                           className="w-full pl-12 pr-4 py-3 bg-navy-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-950 focus:ring-2 focus:ring-primary/20 placeholder:text-navy-300"
                           placeholder="Search PNR, Name, Passport..."
                        />
                     </div>
                     <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">
                        Showing {filteredRecords.length} of {manifest.totalPassengers} records
                     </p>
                  </div>

                  {/* Manifest Table */}
                  <div className="bg-white rounded-[3rem] border border-navy-100 shadow-sm overflow-hidden">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="bg-navy-50/50 text-[9px] font-black text-navy-300 uppercase tracking-[0.25em] border-b border-navy-50">
                                 <th className="px-10 py-6">Passenger</th>
                                 <th className="px-10 py-6">Nationality / Doc</th>
                                 <th className="px-10 py-6">DOB</th>
                                 <th className="px-10 py-6">PNR</th>
                                 <th className="px-10 py-6">Seat</th>
                                 <th className="px-10 py-6">Boarding</th>
                                 <th className="px-10 py-6">APIS</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-navy-50">
                              {filteredRecords.length === 0 ? (
                                 <tr><td colSpan={7} className="px-10 py-12 text-center text-xs font-black text-navy-300 uppercase tracking-widest">No passengers found</td></tr>
                              ) : (
                                 filteredRecords.map((p, i) => (
                                    <tr key={i} className={`hover:bg-navy-50/50 transition-colors ${p.apisCompliance === 'Action Required' ? 'bg-red-50/30' : ''}`}>
                                       <td className="px-10 py-6">
                                          <div className="flex items-center gap-4">
                                             <div className="size-10 rounded-full bg-navy-50 flex items-center justify-center font-black text-navy-400 border border-navy-100 uppercase text-xs">
                                                {p.passengerName.split(',')[0]?.charAt(0)}{p.passengerName.split(' ')[1]?.charAt(0) || ''}
                                             </div>
                                             <span className="text-xs font-black text-navy-950 uppercase tracking-wider">{p.passengerName}</span>
                                          </div>
                                       </td>
                                       <td className="px-10 py-6">
                                          <p className="text-[10px] font-black text-navy-900 uppercase tracking-widest">{p.nationality}</p>
                                          <p className={`text-[8px] font-black uppercase tracking-widest mt-1 ${p.documentNumber === 'MISSING' ? 'text-red-500' : 'text-navy-300'}`}>
                                             {p.documentType}: {p.documentNumber}
                                          </p>
                                       </td>
                                       <td className="px-10 py-6 text-[10px] font-black text-navy-600 uppercase tracking-widest">{p.dateOfBirth}</td>
                                       <td className="px-10 py-6 text-[10px] font-black text-primary uppercase tracking-tighter">{p.pnr}</td>
                                       <td className="px-10 py-6">
                                          <div className="flex items-center gap-2">
                                             <span className={`text-xs font-black tracking-tighter ${p.seatNumber === '--' ? 'text-navy-200' : 'text-navy-950'}`}>{p.seatNumber}</span>
                                             <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-navy-50 text-navy-400">{p.fareClass}</span>
                                          </div>
                                       </td>
                                       <td className="px-10 py-6">
                                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.15em] ${p.boardingStatus === 'Checked-In' ? 'bg-emerald-50 text-emerald-700' :
                                                p.boardingStatus === 'No-Show' ? 'bg-red-50 text-red-700' :
                                                   'bg-navy-50 text-navy-500'
                                             }`}>{p.boardingStatus}</span>
                                       </td>
                                       <td className="px-10 py-6">
                                          <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${p.apisCompliance === 'OK' ? 'text-emerald-500' :
                                                p.apisCompliance === 'Pending' ? 'text-amber-500' :
                                                   'text-red-500'
                                             }`}>
                                             <span className="material-symbols-outlined text-lg">
                                                {p.apisCompliance === 'OK' ? 'check_circle' : p.apisCompliance === 'Pending' ? 'pending' : 'error'}
                                             </span>
                                             {p.apisCompliance}
                                          </div>
                                       </td>
                                    </tr>
                                 ))
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </>
            )}

            {/* Empty State */}
            {!manifest && !generating && !loading && (
               <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <span className="material-symbols-outlined text-6xl text-navy-100">description</span>
                  <p className="text-sm font-black text-navy-300 uppercase tracking-widest">Select a flight to generate the passenger manifest</p>
               </div>
            )}
         </div>
      </div>
   );
};

export default RegulatoryManifest;
