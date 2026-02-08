
import React from 'react';

interface EmailTemplatesCMSProps {
  onOpenLog: () => void;
}

const EmailTemplatesCMS: React.FC<EmailTemplatesCMSProps> = ({ onOpenLog }) => {
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
              <span className="text-primary">Email Templates</span>
           </nav>
           <div className="flex flex-wrap justify-between items-end gap-6">
              <div className="space-y-2">
                 <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Email Template Customization</h1>
                 <p className="text-navy-500 font-medium italic text-lg opacity-80 uppercase tracking-widest">Manage and edit automated email communications sent to passengers and staff.</p>
              </div>
              <button 
                onClick={onOpenLog}
                className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:text-primary hover:border-primary transition-all shadow-sm group"
              >
                <span className="material-symbols-outlined text-xl text-navy-300 group-hover:text-primary transition-colors">receipt_long</span>
                Audit Log
              </button>
           </div>
        </div>

        <div className="flex-1 flex overflow-hidden gap-8">
           {/* Sidebar - Template List */}
           <div className="w-96 flex flex-col bg-white rounded-[3rem] border border-navy-100 shadow-sm overflow-hidden shrink-0">
              <div className="p-6 border-b border-navy-50 bg-navy-50/30">
                 <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 material-symbols-outlined text-xl group-focus-within:text-primary transition-all">search</span>
                    <input className="w-full pl-12 pr-4 py-3.5 bg-white border-none rounded-2xl text-xs font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" placeholder="Search templates..." />
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
                 <div>
                    <h3 className="px-5 py-2 text-[10px] font-black text-navy-300 uppercase tracking-[0.25em]">Transactional</h3>
                    <div className="space-y-1">
                       {[
                         { name: 'Booking Confirmation', time: '2 hrs ago', status: 'Live', active: true },
                         { name: 'Password Reset', time: 'Yesterday', status: 'Live' },
                         { name: 'E-Ticket Delivery', time: '5 days ago', status: 'Draft' },
                       ].map((t, idx) => (
                         <button key={idx} className={`w-full p-5 rounded-2xl flex flex-col gap-1 text-left transition-all border-2 ${
                           t.active ? 'bg-primary/5 border-primary shadow-lg shadow-primary/5' : 'bg-white border-transparent hover:bg-navy-50 hover:border-navy-50'
                         }`}>
                           <div className="flex justify-between items-center">
                              <span className={`text-sm font-black uppercase tracking-tight ${t.active ? 'text-primary' : 'text-navy-950'}`}>{t.name}</span>
                              <div className={`size-2 rounded-full ${t.status === 'Live' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-navy-200'}`}></div>
                           </div>
                           <div className="flex justify-between items-center mt-2">
                              <span className="text-[9px] font-bold text-navy-400 uppercase tracking-widest italic opacity-60">Edited {t.time}</span>
                              {t.active && <span className="material-symbols-outlined text-primary text-sm">chevron_right</span>}
                           </div>
                         </button>
                       ))}
                    </div>
                 </div>
                 <div>
                    <h3 className="px-5 py-2 text-[10px] font-black text-navy-300 uppercase tracking-[0.25em]">Operational</h3>
                    <div className="space-y-1">
                       {[
                         { name: 'Flight Delay Alert', time: '10 mins ago', status: 'Live' },
                         { name: 'Gate Change Notification', time: '--', status: 'Draft' },
                       ].map((t, idx) => (
                         <button key={idx} className="w-full p-5 rounded-2xl flex flex-col gap-1 text-left transition-all border-2 bg-white border-transparent hover:bg-navy-50 hover:border-navy-50">
                           <div className="flex justify-between items-center">
                              <span className="text-sm font-black uppercase tracking-tight text-navy-950">{t.name}</span>
                              <div className={`size-2 rounded-full ${t.status === 'Live' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`}></div>
                           </div>
                           <div className="flex justify-between items-center mt-2">
                              <span className="text-[9px] font-bold text-navy-400 uppercase tracking-widest italic opacity-60">
                                {t.time === '--' ? 'Not yet published' : `Edited ${t.time}`}
                              </span>
                           </div>
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
              <div className="p-6 border-t border-navy-50 bg-navy-50/20 space-y-4">
                 <button className="w-full py-4 rounded-2xl bg-white border-2 border-navy-100 text-[10px] font-black uppercase tracking-widest text-navy-700 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-3 shadow-sm">
                    <span className="material-symbols-outlined text-xl">add</span>
                    New Template
                 </button>
                 <button onClick={onOpenLog} className="w-full text-center text-[9px] font-black text-navy-300 uppercase tracking-[0.2em] hover:text-primary transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">history_edu</span>
                    Full Change History
                 </button>
              </div>
           </div>

           {/* Editor Pane */}
           <div className="flex-1 flex flex-col bg-white rounded-[3.5rem] border border-navy-100 shadow-sm overflow-hidden min-w-0">
              {/* Editor Header */}
              <div className="p-8 border-b border-navy-50 bg-navy-50/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div className="space-y-1">
                    <div className="flex items-center gap-4">
                       <h2 className="text-2xl font-black text-navy-950 uppercase tracking-tighter">Booking Confirmation</h2>
                       <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-widest shadow-sm">Published</span>
                    </div>
                    <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest opacity-60">ID: #T-9821 • Segment: Master Ops • Lang: EN-US</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-navy-100 bg-white text-[10px] font-black uppercase text-navy-700 hover:text-primary transition-all">
                       <span className="material-symbols-outlined text-lg text-navy-300">history</span> Version History
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-navy-100 bg-white text-[10px] font-black uppercase text-navy-700 hover:text-primary transition-all">
                       <span className="material-symbols-outlined text-lg text-navy-300">send</span> Send Test
                    </button>
                    <button className="px-8 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-[1.25rem] shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                       <span className="material-symbols-outlined text-lg">save</span> Save Changes
                    </button>
                 </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                 {/* Main Content Area */}
                 <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-navy-50/30">
                    <div className="p-8 space-y-6">
                       <div className="bg-white p-8 rounded-[2.5rem] border border-navy-100 shadow-sm space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] items-center gap-6">
                             <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Subject Line</label>
                             <div className="relative group">
                                <input className="w-full h-14 pl-6 pr-32 bg-navy-50 border-none rounded-2xl text-sm font-black text-navy-950 focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" defaultValue="Your flight {{flight_number}} to {{destination}} is confirmed" />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                                   <span className="text-[8px] font-black bg-white/60 text-primary border border-primary/20 px-2 py-1 rounded-md uppercase">FLIGHT_NO</span>
                                   <span className="text-[8px] font-black bg-white/60 text-primary border border-primary/20 px-2 py-1 rounded-md uppercase">DEST</span>
                                </div>
                             </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] items-center gap-6">
                             <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Preheader</label>
                             <input className="w-full h-14 px-6 bg-navy-50 border-none rounded-2xl text-sm font-bold text-navy-500 italic focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" defaultValue="Get ready for your trip! Manage your booking online." />
                          </div>
                       </div>

                       {/* Editor Toolbar */}
                       <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border border-navy-100 p-4 rounded-[2rem] shadow-xl flex flex-wrap gap-4 items-center justify-between">
                          <div className="flex items-center gap-2 border-r border-navy-50 pr-4">
                             <button className="p-2 hover:bg-navy-50 rounded-xl transition-all text-navy-400"><span className="material-symbols-outlined text-xl">undo</span></button>
                             <button className="p-2 hover:bg-navy-50 rounded-xl transition-all text-navy-400"><span className="material-symbols-outlined text-xl">redo</span></button>
                          </div>
                          <div className="flex items-center gap-2 border-r border-navy-50 pr-4">
                             <select className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-navy-700 focus:ring-0 cursor-pointer">
                                <option>Paragraph</option>
                                <option>Heading 1</option>
                             </select>
                          </div>
                          <div className="flex items-center gap-2">
                             <button className="p-2.5 rounded-xl bg-navy-950 text-white shadow-lg shadow-navy-950/20"><span className="material-symbols-outlined text-xl font-black">format_bold</span></button>
                             <button className="p-2.5 rounded-xl hover:bg-navy-50 text-navy-400 transition-all"><span className="material-symbols-outlined text-xl">format_italic</span></button>
                             <button className="p-2.5 rounded-xl hover:bg-navy-50 text-navy-400 transition-all"><span className="material-symbols-outlined text-xl">format_underlined</span></button>
                          </div>
                          <div className="flex-1"></div>
                          <button className="flex items-center gap-3 px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                             <span className="material-symbols-outlined text-lg">data_object</span>
                             Insert Logical Variable
                          </button>
                       </div>

                       {/* Email Preview Mock */}
                       <div className="flex justify-center py-10 pb-20">
                          <div className="w-full max-w-[640px] bg-white shadow-2xl rounded-sm border border-navy-50 flex flex-col overflow-hidden min-h-[800px]">
                             <div className="h-32 w-full bg-navy-950 flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #137fec 0%, #101922 100%)' }}>
                                <div className="absolute inset-0 opacity-10 bg-cover bg-center scale-150" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80')" }}></div>
                                <div className="relative z-10 flex items-center gap-4 text-white">
                                   <span className="material-symbols-outlined !text-5xl font-black">airlines</span>
                                   <span className="text-3xl font-black tracking-tighter uppercase">Deltablue</span>
                                </div>
                             </div>
                             <div className="p-12 space-y-8 font-sans">
                                <h1 className="text-4xl font-black text-navy-950 uppercase tracking-tighter leading-none">Booking Confirmed!</h1>
                                <p className="text-lg text-navy-700 leading-relaxed">
                                   Dear <span className="bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 font-black">{'{{first_name}}'}</span>,
                                </p>
                                <p className="text-lg text-navy-700 leading-relaxed italic uppercase tracking-wider font-medium opacity-80">
                                   Thank you for choosing Deltablue Jet Air. Your flight to <span className="bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 font-black">{'{{destination}}'}</span> is confirmed. We are excited to welcome you on board.
                                </p>
                                
                                <div className="p-8 rounded-[2rem] border-2 border-navy-50 bg-navy-50/20 space-y-8">
                                   <div className="flex justify-between items-center border-b border-navy-50 pb-6">
                                      <span className="text-xs font-black uppercase tracking-[0.2em] text-navy-400">Flight Details</span>
                                      <span className="text-xs font-black text-navy-950 uppercase tracking-widest">REF: <span className="text-primary font-black">{'{{booking_ref}}'}</span></span>
                                   </div>
                                   <div className="grid grid-cols-2 gap-10">
                                      <div className="space-y-2">
                                         <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest">Sequence #</p>
                                         <p className="text-2xl font-black text-navy-950 tracking-tighter">{'{{flight_number}}'}</p>
                                      </div>
                                      <div className="space-y-2 text-right">
                                         <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest">Registry Date</p>
                                         <p className="text-2xl font-black text-navy-950 tracking-tighter">{'{{departure_date}}'}</p>
                                      </div>
                                   </div>
                                </div>

                                <div className="pt-10 flex flex-col items-center gap-8">
                                   <button className="px-12 py-5 bg-primary text-white font-black uppercase text-sm tracking-[0.3em] rounded-2xl shadow-2xl shadow-primary/40">Manage Console Hub</button>
                                   <p className="text-sm font-bold text-navy-400 uppercase tracking-widest text-center opacity-60">Safe Travels,<br/>The Deltablue Ops Team</p>
                                </div>
                             </div>
                             <div className="mt-auto bg-navy-50 p-8 text-center border-t border-navy-50">
                                <p className="text-[10px] font-black text-navy-300 uppercase tracking-[0.3em] mb-4">© 2024 Deltablue Jet Air • Operational Security: Cleared</p>
                                <div className="flex justify-center gap-8 text-[10px] font-black text-navy-300 uppercase tracking-widest opacity-50">
                                   <a className="hover:text-primary underline" href="#">Privacy</a>
                                   <a className="hover:text-primary underline" href="#">Contact</a>
                                   <a className="hover:text-primary underline" href="#">Deregister</a>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Side Pane - Variable Drag */}
                 <div className="w-80 bg-white border-l border-navy-50 flex flex-col shrink-0">
                    <div className="p-8 border-b border-navy-50">
                       <h3 className="text-sm font-black text-navy-950 uppercase tracking-[0.2em] flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary text-xl">data_object</span>
                          Logical Variables
                       </h3>
                       <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest mt-2">Available for this template segment</p>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10">
                       {[
                         { cat: 'Personnel', vars: ['{{first_name}}', '{{last_name}}', '{{id_number}}'] },
                         { cat: 'Operational', vars: ['{{flight_number}}', '{{booking_ref}}', '{{departure_time}}', '{{gate_id}}', '{{destination}}'] },
                         { cat: 'System', vars: ['{{support_hub_link}}', '{{airline_legal_name}}'] }
                       ].map((cat, ci) => (
                         <div key={ci} className="space-y-4">
                            <h4 className="text-[10px] font-black text-navy-300 uppercase tracking-[0.3em] px-2">{cat.cat}</h4>
                            <div className="flex flex-wrap gap-2">
                               {cat.vars.map((v, vi) => (
                                 <button key={vi} className="px-3 py-2 bg-navy-50 border border-navy-100 rounded-xl text-[10px] font-black text-navy-700 hover:border-primary hover:text-primary hover:bg-white transition-all shadow-sm cursor-grab active:cursor-grabbing">
                                    {v}
                                 </button>
                               ))}
                            </div>
                         </div>
                       ))}
                    </div>
                    <div className="p-6 bg-navy-50/50 border-t border-navy-50">
                       <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest text-center leading-relaxed">Logic tags are validated against the master schema before publishing.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplatesCMS;
