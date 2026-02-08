
import React from 'react';

const PageEditor: React.FC = () => {
  return (
    <div className="h-full flex flex-col font-display bg-navy-50/20 overflow-hidden">
      {/* Top Action Header */}
      <header className="bg-white border-b border-navy-100 h-20 px-10 flex items-center justify-between shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">
             <span>Content Management</span>
             <span className="material-symbols-outlined text-xs">chevron_right</span>
             <span className="text-primary">Landing Page Editor</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-navy-200 mr-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">cloud_done</span> Autosaved in Cloud
          </span>
          <button className="h-11 px-6 rounded-xl bg-white border border-navy-100 text-navy-700 text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 transition-all shadow-sm">Save Draft Registry</button>
          <button className="h-11 px-6 rounded-xl bg-white border border-navy-100 text-navy-700 text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 transition-all shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">visibility</span> Preview Node
          </button>
          <button className="h-11 px-8 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">Publish to Prod</button>
        </div>
      </header>

      {/* Workspace Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Center Editor Canvas */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-12 flex justify-center pb-32">
          <div className="w-full max-w-4xl flex flex-col gap-10">
            {/* Page Meta Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1 rounded-full bg-blue-50 text-primary border border-blue-100 text-[9px] font-black uppercase tracking-widest shadow-inner">Operational Draft</span>
                <p className="text-navy-300 text-[9px] font-black uppercase tracking-widest italic opacity-60 leading-none">Last modified by Admin Cluster #042</p>
              </div>
              <div className="space-y-4">
                 <input className="w-full bg-transparent border-none p-0 text-5xl font-black text-navy-950 placeholder:text-navy-100 focus:ring-0 uppercase tracking-tighter" placeholder="Enter Registry Title" defaultValue="Summer Getaways 2024" />
                 <input className="w-full bg-transparent border-none p-0 text-xl font-medium text-navy-400 placeholder:text-navy-100 focus:ring-0 italic" placeholder="Add a descriptive lede or operational context..." />
              </div>
            </div>

            {/* Editor Surface */}
            <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-2xl min-h-[800px] flex flex-col overflow-hidden group">
              {/* Toolbar */}
              <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 p-4 px-10 border-b border-navy-50 bg-white/80 backdrop-blur-xl group-hover:bg-white transition-colors duration-500">
                <div className="flex items-center border-r border-navy-50 pr-4 mr-2">
                  <button className="p-2.5 rounded-xl hover:bg-navy-50 text-navy-300 hover:text-primary transition-all active:scale-90"><span className="material-symbols-outlined">undo</span></button>
                  <button className="p-2.5 rounded-xl hover:bg-navy-50 text-navy-300 hover:text-primary transition-all active:scale-90"><span className="material-symbols-outlined">redo</span></button>
                </div>
                <div className="flex items-center border-r border-navy-50 pr-4 mr-2">
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl hover:bg-navy-50 text-navy-700 text-[10px] font-black uppercase tracking-widest transition-all">
                    Paragraph Node <span className="material-symbols-outlined text-lg">expand_more</span>
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-3 rounded-xl bg-navy-950 text-white font-black shadow-lg shadow-navy-900/20"><span className="material-symbols-outlined">format_bold</span></button>
                  <button className="p-3 rounded-xl hover:bg-navy-50 text-navy-400 transition-all"><span className="material-symbols-outlined">format_italic</span></button>
                  <button className="p-3 rounded-xl hover:bg-navy-50 text-navy-400 transition-all"><span className="material-symbols-outlined">format_underlined</span></button>
                  <button className="p-3 rounded-xl hover:bg-navy-50 text-navy-400 transition-all"><span className="material-symbols-outlined">link</span></button>
                </div>
                <div className="h-8 w-px bg-navy-50 mx-4"></div>
                <div className="flex items-center gap-1">
                  <button className="p-3 rounded-xl hover:bg-navy-50 text-navy-400 transition-all"><span className="material-symbols-outlined">format_list_bulleted</span></button>
                  <button className="p-3 rounded-xl hover:bg-navy-50 text-navy-400 transition-all"><span className="material-symbols-outlined">format_quote</span></button>
                </div>
                <div className="flex-1"></div>
                <div className="flex items-center gap-2">
                  <button className="p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-inner"><span className="material-symbols-outlined">add_photo_alternate</span></button>
                  <button className="p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-inner"><span className="material-symbols-outlined">grid_view</span></button>
                </div>
              </div>

              {/* Editor Content */}
              <div className="p-16 prose prose-navy max-w-none flex-1 outline-none space-y-10">
                <h2 className="text-3xl font-black text-navy-950 uppercase tracking-tighter">Discover Paradise This Season</h2>
                <p className="text-lg text-navy-700 leading-relaxed font-medium uppercase tracking-wider opacity-80 italic">
                  Escape the ordinary and immerse yourself in the breathtaking landscapes of our newest summer destinations. Whether you're seeking the tranquil blue waters of the Maldives or the vibrant street markets of Bangkok, Deltablue has the perfect itinerary for you.
                </p>
                <div className="relative group/img my-16 rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-navy-50">
                  <div className="w-full h-[400px] bg-navy-100 bg-center bg-cover transition-transform duration-[10s] group-hover/img:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&q=80')" }}></div>
                  <div className="absolute inset-0 bg-navy-950/0 group-hover/img:bg-navy-950/10 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                    <button className="px-10 py-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl text-navy-950 text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all">Update Visual Asset</button>
                  </div>
                </div>
                <h3 className="text-xl font-black text-navy-950 uppercase tracking-tighter border-l-4 border-primary pl-6">Why Fly Deltablue?</h3>
                <ul className="space-y-4 list-none p-0">
                  {[
                    'Award-winning in-flight entertainment system with live satellite feed.',
                    'Complimentary gourmet meals curated by our executive culinary team.',
                    'Extra legroom and ergonomic seating in our new Premium Node class.'
                  ].map((feat, i) => (
                    <li key={i} className="flex gap-4 items-start text-navy-600 font-bold uppercase text-[11px] tracking-widest bg-navy-50/50 p-4 rounded-2xl border border-navy-50">
                      <span className="material-symbols-outlined text-primary text-xl font-black">check_circle</span>
                      <span className="pt-0.5">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Settings Sidebar */}
        <aside className="w-96 bg-white border-l border-navy-100 overflow-y-auto custom-scrollbar shrink-0 flex flex-col shadow-2xl z-10">
          <div className="p-8 border-b border-navy-50 bg-navy-50/30">
            <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight">Logical Page Settings</h3>
          </div>

          <div className="p-8 space-y-12">
            {/* Permalink */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-1">Registry Permalink</label>
              <div className="flex bg-navy-50 rounded-2xl border-none shadow-inner overflow-hidden">
                <span className="inline-flex items-center px-5 bg-navy-100/50 text-navy-300 text-[10px] font-black uppercase tracking-widest border-r border-navy-50">
                  /registry/
                </span>
                <input className="flex-1 min-w-0 block w-full px-5 py-4 bg-transparent border-none text-navy-950 text-sm font-black uppercase tracking-widest focus:ring-8 focus:ring-primary/5 transition-all" type="text" defaultValue="summer-getaways-2024" />
              </div>
              <button className="text-[9px] font-black text-primary uppercase underline tracking-widest block px-1">View Live Production Node</button>
            </div>

            {/* Featured Image */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-1">Primary Signature Image</label>
              <div className="border-4 border-dashed border-navy-100 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group shadow-inner">
                <div className="size-16 rounded-[1.5rem] bg-white text-primary flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                </div>
                <p className="text-[10px] font-black text-navy-950 uppercase tracking-widest">Initialise Upload</p>
                <p className="text-[8px] font-bold text-navy-300 uppercase mt-2 tracking-[0.2em]">SVG, PNG, JPG Protocol only</p>
              </div>
            </div>

            {/* SEO Section */}
            <div className="space-y-8 pt-8 border-t border-navy-50">
              <h3 className="text-sm font-black text-navy-950 uppercase tracking-[0.3em] flex items-center gap-3">
                 <span className="material-symbols-outlined text-primary text-xl">search</span>
                 Search Graph Logic
              </h3>
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Metadata Title</label>
                    <span className="text-[8px] font-black text-navy-200">42/60 Chars</span>
                  </div>
                  <input className="block w-full rounded-2xl border-none bg-navy-50 text-navy-950 py-4 px-6 text-sm font-black uppercase tracking-widest focus:ring-8 focus:ring-primary/5 transition-all shadow-inner" type="text" defaultValue="Summer Travel Deals 2024 | Deltablue Jet Air" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Logical Description</label>
                    <span className="text-[8px] font-black text-navy-200">145/160 Chars</span>
                  </div>
                  <textarea className="block w-full rounded-[2rem] border-none bg-navy-50 text-navy-950 py-5 px-6 text-xs font-bold uppercase tracking-widest leading-relaxed focus:ring-8 focus:ring-primary/5 transition-all shadow-inner resize-none h-32" defaultValue="Book your summer vacation with Deltablue Jet Air. Exclusive offers on flights to Maldives, Thailand, and more. Limited time deals available now." />
                </div>

                {/* SEO Preview Card */}
                <div className="bg-white rounded-3xl p-6 border-2 border-navy-50 shadow-sm space-y-4">
                  <p className="text-[8px] font-black text-navy-300 uppercase tracking-[0.3em] pb-3 border-b border-navy-50">Search Engine Simulation</p>
                  <div className="space-y-2">
                    <p className="text-blue-700 text-lg font-bold leading-tight truncate hover:underline cursor-pointer">Summer Travel Deals 2024 | Deltablue...</p>
                    <p className="text-emerald-700 text-xs font-medium truncate">www.deltablue.com › registry › summer...</p>
                    <p className="text-navy-400 text-xs leading-relaxed line-clamp-2">Book your summer vacation with Deltablue Jet Air. Exclusive offers on flights to Maldives, Thailand, and more. Limited time deals available now.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attributes */}
            <div className="space-y-8 pt-8 border-t border-navy-50">
              <h3 className="text-sm font-black text-navy-950 uppercase tracking-[0.3em]">Operational Hierarchy</h3>
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest block px-1">Parent Node Binding</label>
                  <div className="relative">
                    <select className="block w-full rounded-2xl border-none bg-navy-50 py-4 px-6 text-xs font-black uppercase tracking-widest text-navy-950 focus:ring-8 focus:ring-primary/5 transition-all appearance-none shadow-inner">
                      <option>(ROOT HUB)</option>
                      <option>Destinations Terminal</option>
                      <option>Staff Portal</option>
                      <option>Operational Offers</option>
                    </select>
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-navy-200 material-symbols-outlined">expand_more</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest block px-1">Registry Tags</label>
                  <div className="flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 shadow-sm">
                       Global Cluster
                       <button className="text-primary hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-sm font-black">close</span></button>
                    </span>
                    <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-navy-50 text-navy-400 border border-navy-100 hover:bg-navy-100 transition-all">
                       <span className="material-symbols-outlined text-sm">add</span> Link Tag
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default PageEditor;
