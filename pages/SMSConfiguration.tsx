
import React, { useState } from 'react';

interface SMSConfigurationProps {
  onOpenLog: () => void;
}

const SMSConfiguration: React.FC<SMSConfigurationProps> = ({ onOpenLog }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('Flight Delay Alert');
  const [message, setMessage] = useState('Deltablue Alert: Flight {{flight_number}} to {{destination}} is delayed. New departure: {{new_time}}. We apologize for the inconvenience.');

  const templates = [
    { name: 'Flight Delay Alert', status: 'Active', summary: 'Deltablue Alert: Flight {{flight_number}} is delayed...' },
    { name: 'Gate Change', status: 'Active', summary: 'Attention: Flight {{flight_number}} now boarding at Gate {{gate}}.' },
    { name: 'Booking Confirmed', status: 'Draft', summary: 'Confirmed! Your booking reference is {{booking_ref}}.' },
    { name: 'Boarding Reminder', status: 'Active', summary: 'Boarding for flight {{flight_number}} starts in 15 mins.' },
    { name: 'Baggage Claim', status: 'Inactive', summary: 'Your bags will be at carousel {{carousel_number}}.' },
  ];

  const charCount = message.length;
  const segments = Math.ceil(charCount / 160) || 1;

  return (
    <div className="h-full flex flex-col p-8 overflow-hidden font-sans bg-navy-50/20">
      <div className="max-w-[1600px] mx-auto w-full h-full flex flex-col space-y-8 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="shrink-0 space-y-6">
           <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300 px-1">
              <span>Home</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span>Communication</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-primary">SMS Configuration</span>
           </nav>
           <div className="flex flex-wrap justify-between items-end gap-6">
              <div className="space-y-2">
                 <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">SMS Templates</h1>
                 <p className="text-navy-500 font-medium italic text-lg opacity-80 uppercase tracking-widest">Manage and customize automated SMS notifications sent to passengers.</p>
              </div>
              <button 
                onClick={onOpenLog}
                className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:text-primary hover:border-primary transition-all shadow-sm group"
              >
                <span className="material-symbols-outlined text-xl text-navy-300 group-hover:text-primary transition-colors">receipt_long</span>
                Audit Logs
              </button>
           </div>
        </div>

        <div className="flex-1 flex overflow-hidden gap-8">
           {/* Sidebar - Template List */}
           <div className="w-80 lg:w-96 flex flex-col bg-white rounded-[3rem] border border-navy-100 shadow-sm overflow-hidden shrink-0">
              <div className="p-6 border-b border-navy-50 bg-navy-50/30">
                 <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined text-xl group-focus-within:text-primary transition-all">search</span>
                    <input className="w-full pl-12 pr-4 py-3.5 bg-white border-none rounded-2xl text-xs font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" placeholder="Search templates..." />
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                 {templates.map((t, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setSelectedTemplate(t.name)}
                      className={`w-full p-5 rounded-2xl flex flex-col gap-1 text-left transition-all border-2 ${
                        selectedTemplate === t.name ? 'bg-primary/5 border-primary shadow-lg shadow-primary/5' : 'bg-white border-transparent hover:bg-navy-50'
                      }`}
                    >
                       <div className="flex justify-between items-center mb-1">
                          <span className={`text-sm font-black uppercase tracking-tight ${selectedTemplate === t.name ? 'text-primary' : 'text-navy-950'}`}>{t.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                            t.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                            t.status === 'Draft' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-navy-50 text-navy-400 border-navy-100'
                          }`}>{t.status}</span>
                       </div>
                       <p className="text-[10px] font-medium text-navy-400 line-clamp-1 italic">{t.summary}</p>
                    </button>
                 ))}
              </div>
              <div className="p-6 border-t border-navy-50 bg-navy-50/20">
                 <button className="w-full py-4 rounded-2xl bg-white border-2 border-dashed border-navy-100 text-[10px] font-black uppercase tracking-widest text-navy-400 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-xl">add</span>
                    New Template
                 </button>
              </div>
           </div>

           {/* Editor Pane */}
           <div className="flex-1 flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-2 pb-12">
              {/* Metadata Card */}
              <div className="bg-white rounded-[3rem] border border-navy-100 p-8 shadow-sm space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Template Label</label>
                       <input className="w-full h-14 px-8 bg-navy-50 border-none rounded-2xl text-sm font-black text-navy-950 focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" defaultValue={selectedTemplate} />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Trigger Event Hub</label>
                       <div className="relative group">
                          <select className="w-full h-14 px-8 bg-navy-50 border-none rounded-2xl text-xs font-black text-navy-950 uppercase appearance-none focus:ring-8 focus:ring-primary/5 transition-all shadow-inner">
                             <option>Flight Status: Delayed</option>
                             <option>Flight Status: Cancelled</option>
                             <option>Gate Change Notification</option>
                             <option>Manual Staff Dispatch</option>
                          </select>
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined pointer-events-none group-focus-within:text-primary transition-colors">expand_more</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Audit Summary Mini */}
              <div className="bg-white rounded-3xl border border-navy-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                 <div className="flex items-center gap-5">
                    <div className="size-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                       <span className="material-symbols-outlined text-2xl">manage_search</span>
                    </div>
                    <div>
                       <div className="flex items-center gap-3">
                          <h3 className="text-sm font-black text-navy-950 uppercase tracking-tight">Active Version Log</h3>
                          <span className="px-2 py-0.5 rounded bg-navy-50 text-navy-500 text-[8px] font-black uppercase tracking-widest border border-navy-100">v14.2</span>
                       </div>
                       <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mt-1 opacity-60">Last updated by <span className="text-navy-950">Sarah Jenkins</span> on Oct 24, 10:42 AM</p>
                    </div>
                 </div>
                 <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-navy-100 text-[10px] font-black uppercase text-navy-700 hover:text-primary transition-all">
                    View Full Log <span className="material-symbols-outlined text-sm">arrow_forward</span>
                 </button>
              </div>

              {/* Message Content Editor */}
              <div className="bg-white rounded-[3.5rem] border border-navy-100 p-10 shadow-sm flex-1 flex flex-col space-y-8">
                 <div className="flex justify-between items-center border-b border-navy-50 pb-6">
                    <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight">SMS Dispatch Body</h3>
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-1.5 rounded-full border border-amber-100 text-[9px] font-black uppercase tracking-widest">
                       <span className="material-symbols-outlined text-sm">warning</span> GSM-7 Encoding Protocol
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Inject Logical Variable</label>
                    <div className="flex flex-wrap gap-2">
                       {['flight_number', 'destination', 'new_time', 'passenger_name', 'gate_id'].map(v => (
                         <button 
                           key={v}
                           onClick={() => setMessage(prev => prev + ` {{${v}}}`)}
                           className="px-4 py-2 bg-primary/5 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm flex items-center gap-2 group"
                         >
                            <span className="material-symbols-outlined text-xs group-hover:rotate-90 transition-transform">add</span>
                            {v}
                         </button>
                       ))}
                       <button className="px-4 py-2 bg-navy-50 text-navy-400 border border-navy-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-navy-100 transition-all">More...</button>
                    </div>
                 </div>

                 <div className="relative flex-1 group">
                    <textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full h-full min-h-[250px] p-10 bg-navy-50 border-none rounded-[3rem] text-navy-950 font-mono text-sm leading-relaxed focus:ring-8 focus:ring-primary/5 transition-all shadow-inner resize-none"
                    />
                    <div className="absolute bottom-6 right-10 flex gap-6 text-[10px] font-black text-navy-300 uppercase tracking-[0.2em] select-none pointer-events-none">
                       <span>{charCount} / 160 Characters</span>
                       <span className="text-navy-100">|</span>
                       <span>{segments} Dispatch Segment{segments > 1 ? 's' : ''}</span>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-navy-50 flex justify-between items-center">
                    <button className="text-[10px] font-black text-navy-400 uppercase tracking-widest hover:text-red-500 transition-colors">Revert to Master Default</button>
                    <div className="flex gap-4">
                       <button className="px-8 py-3.5 bg-white border-2 border-navy-100 text-navy-700 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-navy-50 transition-all shadow-sm">Dispatch Test SMS</button>
                       <button className="px-10 py-3.5 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">Commit Changes</button>
                    </div>
                 </div>
              </div>
           </div>

           {/* Live Preview Pane */}
           <div className="hidden xl:flex w-80 lg:w-96 flex-col items-center justify-center bg-navy-50/50 rounded-[4rem] border border-navy-100 p-12 shrink-0 relative overflow-hidden group">
              {/* Decorative Pattern */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-[10s]" style={{ backgroundImage: 'radial-gradient(#137fec 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
              
              <div className="relative w-full max-w-[300px] h-[600px] bg-navy-950 rounded-[3.5rem] border-[8px] border-navy-900 shadow-2xl overflow-hidden flex flex-col">
                 <div className="absolute top-0 inset-x-0 h-8 flex justify-center items-center">
                    <div className="w-32 h-4 bg-navy-900 rounded-b-2xl"></div>
                 </div>
                 
                 <div className="h-12 flex justify-between items-end px-8 pb-1 text-[10px] font-black text-white/50 uppercase tracking-widest">
                    <span>9:41</span>
                    <div className="flex gap-1.5">
                       <span className="material-symbols-outlined text-xs">signal_cellular_alt</span>
                       <span className="material-symbols-outlined text-xs">wifi</span>
                       <span className="material-symbols-outlined text-xs rotate-90">battery_full</span>
                    </div>
                 </div>

                 <div className="px-6 py-4 bg-navy-900/50 backdrop-blur-md border-b border-white/5 flex items-center gap-4">
                    <div className="size-9 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                       <span className="material-symbols-outlined text-xl">flight</span>
                    </div>
                    <div>
                       <p className="text-xs font-black text-white uppercase tracking-tight">Deltablue Info</p>
                       <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">Live Registry Node</p>
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 custom-scrollbar">
                    <div className="text-center">
                       <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Today 9:41 AM</span>
                    </div>

                    <div className="self-start max-w-[85%] animate-in slide-in-from-left duration-700">
                       <div className="bg-white/10 text-white rounded-3xl rounded-tl-none p-5 text-[11px] font-bold leading-relaxed border border-white/5 shadow-xl">
                          Check-in for flight DJ-102 to London is now open. <span className="text-primary underline">deltablue.to/chk</span>
                       </div>
                    </div>

                    <div className="self-start max-w-[85%] animate-pulse">
                       <div className="bg-primary text-white rounded-3xl rounded-tl-none p-5 text-[11px] font-black leading-relaxed shadow-xl shadow-primary/20 relative">
                          <div className="absolute -left-1 top-0 w-1.5 h-full bg-white opacity-20"></div>
                          {message.replace(/{{(\w+)}}/g, (match, p1) => {
                            switch(p1) {
                              case 'flight_number': return 'DJ-102';
                              case 'destination': return 'London';
                              case 'new_time': return '14:30';
                              case 'gate': return 'B12';
                              default: return `[${p1}]`;
                            }
                          })}
                       </div>
                       <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mt-3 ml-2">Live Preview Hub</p>
                    </div>
                 </div>

                 <div className="p-4 bg-navy-900/80 border-t border-white/5 flex items-center gap-4">
                    <div className="size-8 rounded-full bg-white/5 flex items-center justify-center text-white/20"><span className="material-symbols-outlined text-lg">add</span></div>
                    <div className="flex-1 h-10 bg-white/5 border border-white/10 rounded-full px-6 flex items-center text-[10px] font-black text-white/20 uppercase tracking-widest">Message Payload</div>
                    <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20"><span className="material-symbols-outlined text-lg">arrow_upward</span></div>
                 </div>

                 <div className="h-6 flex justify-center items-center pb-2 bg-navy-950">
                    <div className="w-24 h-1 bg-white/10 rounded-full"></div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SMSConfiguration;
