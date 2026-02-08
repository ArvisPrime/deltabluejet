
import React, { useState } from 'react';

const TicketReissue: React.FC = () => {
  const [pnr, setPnr] = useState('DJ8273X');
  const [ticketNum, setTicketNum] = useState('');

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-navy-400 uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">confirmation_number</span>
            Manual Processing
          </div>
          <h1 className="text-4xl font-black text-navy-950 tracking-tighter">Ticket Reissue</h1>
          <p className="text-navy-500 font-medium">Handle fare adjustments, route changes, and manual re-ticketing.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-2.5 bg-white border border-navy-100 text-navy-700 font-bold rounded-xl shadow-sm hover:bg-navy-50 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined">history</span> View History
          </button>
        </div>
      </div>

      {/* Retrieval Card */}
      <div className="bg-white p-8 rounded-3xl border-2 border-navy-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-black text-navy-400 uppercase">PNR / Record Locator</label>
            <input 
              value={pnr} 
              onChange={(e) => setPnr(e.target.value.toUpperCase())}
              className="w-full h-12 px-5 bg-navy-50 rounded-xl border-none font-black text-lg focus:ring-2 focus:ring-primary/20 text-navy-900"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-navy-400 uppercase">Ticket Number</label>
            <input 
              value={ticketNum} 
              onChange={(e) => setTicketNum(e.target.value)}
              placeholder="012-0000000000"
              className="w-full h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-lg focus:ring-2 focus:ring-primary/20 text-navy-900"
            />
          </div>
          <button className="h-12 bg-primary text-white font-black rounded-xl hover:bg-primary-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined">search</span> Retrieve Booking
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-navy-100 shadow-sm overflow-hidden">
            <div className="px-8 py-4 bg-navy-50/50 border-b border-navy-100 flex items-center justify-between">
              <h3 className="font-black text-navy-900 uppercase text-xs tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">connecting_airports</span> Flight Segments
              </h3>
              <button className="text-primary text-xs font-black hover:underline">+ Add Segment</button>
            </div>
            <div className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] font-black text-navy-400 uppercase tracking-widest">
                    <th className="px-4 py-3">Flight</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-50">
                  <tr className="group">
                    <td className="px-4 py-5 font-bold text-navy-900">DJ 104</td>
                    <td className="px-4 py-5 text-sm font-medium text-navy-500">12 JUN 24</td>
                    <td className="px-4 py-5 font-bold font-mono">LHR <span className="text-navy-300">→</span> JFK</td>
                    <td className="px-4 py-5">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-xs">Y</span>
                    </td>
                    <td className="px-4 py-5">
                      <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-full">
                        <span className="size-1.5 bg-emerald-500 rounded-full"></span> HK (Conf)
                      </span>
                    </td>
                    <td className="px-4 py-5 text-right">
                      <button className="text-primary font-black text-xs hover:underline">Change</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-navy-100 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-navy-900 tracking-tight">Fare Breakdown</h3>
            
            <div className="space-y-3">
              <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Original Fare</p>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-navy-500">Base Fare</span>
                <span className="text-navy-900">USD 450.00</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-navy-500">Taxes</span>
                <span className="text-navy-900">USD 120.00</span>
              </div>
              <div className="pt-3 border-t border-dashed border-navy-100 flex justify-between font-black">
                <span className="text-navy-900">Total Paid</span>
                <span className="text-primary">USD 570.00</span>
              </div>
            </div>

            <div className="bg-primary/5 p-6 rounded-2xl space-y-4">
               <div className="flex justify-between items-center">
                 <p className="text-[10px] font-black text-primary uppercase tracking-widest">New Calculation</p>
                 <button className="text-[10px] font-black text-primary underline">Auto-Price</button>
               </div>
               <div className="space-y-4">
                 <div className="flex flex-col gap-1.5">
                   <label className="text-[10px] font-bold text-navy-400 uppercase">New Base Fare</label>
                   <input className="w-full h-9 px-3 bg-white border border-navy-100 rounded-lg text-sm font-bold text-navy-900 text-right" defaultValue="520.00" />
                 </div>
                 <div className="flex flex-col gap-1.5">
                   <label className="text-[10px] font-bold text-navy-400 uppercase">Penalty Fee</label>
                   <input className="w-full h-9 px-3 bg-white border border-red-100 text-red-600 rounded-lg text-sm font-bold text-right" defaultValue="150.00" />
                 </div>
               </div>
            </div>

            <div className="pt-4 border-t border-navy-100 space-y-1">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-navy-400">Total Difference</span>
                <span className="text-2xl font-black text-navy-950">USD 220.00</span>
              </div>
              <p className="text-[10px] text-right text-navy-300 font-bold">Includes 5% surcharge</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-navy-100 shadow-sm space-y-4">
             <h4 className="text-xs font-black text-navy-400 uppercase tracking-widest">Payment Authorization</h4>
             <select className="w-full h-10 px-4 bg-navy-50 border-none rounded-xl text-sm font-bold text-navy-700 focus:ring-2 focus:ring-primary/20">
               <option>Corporate Credit Card (*4421)</option>
               <option>Agency Credit Line</option>
               <option>Direct Cash Collection</option>
             </select>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-navy-100 p-6 flex justify-center z-40">
        <div className="max-w-6xl w-full flex items-center justify-between">
           <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl text-xs font-bold border border-amber-100">
             <span className="material-symbols-outlined text-lg">warning</span>
             Action is final upon re-ticketing.
           </div>
           <div className="flex gap-4">
             <button className="px-8 py-3 bg-white border border-navy-200 text-navy-700 font-black rounded-xl hover:bg-navy-50 transition-all">Save Draft</button>
             <button className="px-10 py-3 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2">
               <span className="material-symbols-outlined">print</span> Issue Ticket
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TicketReissue;
