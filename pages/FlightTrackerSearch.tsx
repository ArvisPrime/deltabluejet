
import React, { useState } from 'react';

interface FlightTrackerSearchProps {
  onNext: () => void;
  onBack: () => void;
}

const FlightTrackerSearch: React.FC<FlightTrackerSearchProps> = ({ onNext, onBack }) => {
  const [searchMode, setSearchMode] = useState<'ID' | 'ROUTE'>('ID');
  const [flightId, setFlightId] = useState('');

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 md:p-20 font-display animate-in fade-in duration-700">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        
        <div className="space-y-10">
           <div className="space-y-6">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-navy-950 text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-xl">
                 <span className="material-symbols-outlined text-sm text-primary animate-pulse">radar</span>
                 Fleet Tracking Terminal
              </div>
              <h1 className="text-6xl font-black text-navy-950 tracking-tighter uppercase leading-[0.9]">Track Live <br/>Telemetry</h1>
              <p className="text-navy-500 font-medium italic text-xl leading-relaxed uppercase tracking-wider opacity-80">
                 Monitor real-time positioning, gate assignments, and terminal logic nodes for any Deltablue sequence.
              </p>
           </div>

           <div className="bg-primary/5 p-8 rounded-[3rem] border border-primary/10 flex gap-6 items-start shadow-inner">
              <span className="material-symbols-outlined text-primary p-3 bg-white rounded-2xl shadow-md font-black">satellite_alt</span>
              <div className="space-y-1">
                 <p className="text-sm font-black text-navy-950 uppercase tracking-tight">Active Node Sync</p>
                 <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest leading-relaxed italic opacity-70">
                    Transponder signals are updated every 12 seconds via Global Hub link. 
                 </p>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-[4.5rem] border border-navy-100 p-12 md:p-16 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.15)] relative group overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
           
           <div className="flex bg-navy-50 p-1.5 rounded-[1.75rem] shadow-inner mb-12">
              <button 
                onClick={() => setSearchMode('ID')}
                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  searchMode === 'ID' ? 'bg-white text-navy-950 shadow-lg border border-navy-100' : 'text-navy-400 hover:text-navy-700'
                }`}
              >
                 Flight Number
              </button>
              <button 
                onClick={() => setSearchMode('ROUTE')}
                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  searchMode === 'ROUTE' ? 'bg-white text-navy-950 shadow-lg border border-navy-100' : 'text-navy-400 hover:text-navy-700'
                }`}
              >
                 Route Search
              </button>
           </div>

           <form className="space-y-12" onSubmit={(e) => { e.preventDefault(); onNext(); }}>
              {searchMode === 'ID' ? (
                <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
                   <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-2">Operational Identifier</label>
                   <div className="relative group/input">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-navy-200 group-focus-within/input:text-primary transition-colors">flight</span>
                      <input 
                        required
                        placeholder="E.G. DJ-102"
                        value={flightId}
                        onChange={(e) => setFlightId(e.target.value.toUpperCase())}
                        className="w-full h-20 pl-16 pr-8 bg-navy-50 border-none rounded-[2rem] text-2xl font-black text-navy-950 uppercase tracking-[0.2em] focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" 
                      />
                   </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-2">Origin Hub</label>
                      <input className="w-full h-16 px-8 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 uppercase tracking-widest focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" defaultValue="New York (JFK)" />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-2">Arrival Target</label>
                      <input className="w-full h-16 px-8 bg-navy-50 border-none rounded-3xl text-sm font-black text-navy-950 uppercase tracking-widest focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" placeholder="Select destination..." />
                   </div>
                </div>
              )}

              <div className="pt-6 space-y-6">
                 <button className="w-full h-20 bg-primary text-white font-black uppercase tracking-[0.3em] text-xs rounded-[2rem] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-6 group/btn">
                    Locate Sequence <span className="material-symbols-outlined text-2xl group-hover/btn:translate-x-2 transition-transform">my_location</span>
                 </button>
                 <button type="button" onClick={onBack} className="w-full text-[10px] font-black text-navy-300 uppercase tracking-[0.4em] hover:text-navy-950 transition-colors">Return to Landing Page</button>
              </div>
           </form>

           <div className="mt-12 pt-8 border-t border-navy-50 flex items-center gap-4 opacity-40">
              <span className="material-symbols-outlined text-navy-400">lock_open</span>
              <p className="text-[8px] font-bold text-navy-400 uppercase tracking-[0.2em] leading-relaxed">
                 Public transponder access. All telemetry data is for informational purposes and subject to station shift deltas.
              </p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default FlightTrackerSearch;
