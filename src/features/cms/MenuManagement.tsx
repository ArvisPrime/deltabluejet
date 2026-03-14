
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BRAND } from '../../config/brand';
import { ROUTES } from '../../config/routes';
import { getMenuConfig, updateMenuConfig } from '../../services/cms';
import type { CmsMenuItemDoc } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';

// All public routes available for selection
const ROUTE_OPTIONS: { label: string; path: string }[] = [
   { label: 'Home', path: ROUTES.HOME },
   { label: 'Destinations', path: ROUTES.DESTINATIONS },
   { label: 'Book a Flight', path: ROUTES.FLIGHT_SEARCH },
   { label: 'Flight Status', path: ROUTES.FLIGHT_TRACKER },
   { label: 'Online Check-in', path: ROUTES.CHECKIN },
   { label: 'Manage Booking', path: ROUTES.MANAGE_BOOKING },
   { label: 'Loyalty Programme', path: ROUTES.LOYALTY },
   { label: 'About Us', path: ROUTES.ABOUT },
   { label: 'Careers', path: ROUTES.CAREERS },
   { label: 'Login', path: ROUTES.LOGIN },
   { label: 'Register', path: ROUTES.REGISTER },
];

interface MenuItem {
   id: string;
   label: string;
   path: string;
   icon: string;
   linkType: 'internal' | 'external' | 'group';
   visible: boolean;
   openInNewTab: boolean;
   badge: string;
   visibility: 'public' | 'loggedIn' | 'admin';
   children: MenuItem[];
}

let nextId = 0;
const genId = () => `menu_${Date.now()}_${nextId++}`;

const fromFirestore = (items: CmsMenuItemDoc[]): MenuItem[] =>
   items.map(item => ({
      id: genId(),
      label: item.label,
      path: item.href,
      icon: 'link',
      linkType: item.href.startsWith('http') ? 'external' : item.children?.length ? 'group' : 'internal',
      visible: true,
      openInNewTab: item.openInNewTab || false,
      badge: item.badge || '',
      visibility: 'public' as const,
      children: item.children?.length ? fromFirestore(item.children) : [],
   }));

const toFirestore = (items: MenuItem[]): CmsMenuItemDoc[] =>
   items.filter(m => m.visible !== false).map((m, i) => ({
      label: m.label,
      href: m.path,
      order: i,
      openInNewTab: m.openInNewTab,
      badge: m.badge || undefined,
      hasMegaMenu: m.children.length > 0,
      children: m.children.length > 0 ? toFirestore(m.children) : [],
   }));

const MenuManagement: React.FC = () => {
   const addToast = useToastStore(s => s.addToast);
   const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
   const [selectedId, setSelectedId] = useState<string | null>(null);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);

   // Drag state
   const [dragIndex, setDragIndex] = useState<number | null>(null);
   const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

   const loadMenu = useCallback(async () => {
      setLoading(true);
      try {
         const items = await getMenuConfig();
         const mapped = items.length > 0 ? fromFirestore(items) : [
            { id: genId(), label: 'Destinations', path: ROUTES.DESTINATIONS, icon: 'explore', linkType: 'internal' as const, visible: true, openInNewTab: false, badge: '', visibility: 'public' as const, children: [] },
            { id: genId(), label: 'Flight Status', path: ROUTES.FLIGHT_TRACKER, icon: 'flight', linkType: 'internal' as const, visible: true, openInNewTab: false, badge: '', visibility: 'public' as const, children: [] },
            { id: genId(), label: 'Check-in', path: ROUTES.CHECKIN, icon: 'check_circle', linkType: 'internal' as const, visible: true, openInNewTab: false, badge: '', visibility: 'public' as const, children: [] },
            { id: genId(), label: 'Manage Booking', path: ROUTES.MANAGE_BOOKING, icon: 'confirmation_number', linkType: 'internal' as const, visible: true, openInNewTab: false, badge: '', visibility: 'public' as const, children: [] },
         ];
         setMenuItems(mapped);
         if (mapped.length > 0 && !selectedId) setSelectedId(mapped[0].id);
      } catch (err) {
         console.error('Failed to load menu:', err);
         addToast('Failed to load menu settings', 'error');
      } finally {
         setLoading(false);
      }
   }, []);

   useEffect(() => { loadMenu(); }, [loadMenu]);

   const selectedItem = menuItems.find(m => m.id === selectedId) || null;

   // ── Save ─────────────────────────────────────────────────

   const handleSave = async () => {
      setSaving(true);
      try {
         await updateMenuConfig(toFirestore(menuItems));
         addToast('Menu saved successfully', 'success');
      } catch (err) {
         console.error('Failed to save menu:', err);
         addToast('Failed to save menu', 'error');
      } finally {
         setSaving(false);
      }
   };

   // ── CRUD ─────────────────────────────────────────────────

   const handleAddItem = () => {
      const newItem: MenuItem = {
         id: genId(),
         label: 'New Link',
         path: '/',
         icon: 'link',
         linkType: 'internal',
         visible: true,
         openInNewTab: false,
         badge: '',
         visibility: 'public',
         children: [],
      };
      setMenuItems(prev => [...prev, newItem]);
      setSelectedId(newItem.id);
      addToast('Menu item added — edit the details on the right', 'info');
   };

   const handleDeleteItem = () => {
      if (!selectedId) return;
      const item = menuItems.find(m => m.id === selectedId);
      if (!item) return;
      if (!window.confirm(`Delete "${item.label}" from the menu?`)) return;
      setMenuItems(prev => prev.filter(m => m.id !== selectedId));
      setSelectedId(menuItems.find(m => m.id !== selectedId)?.id || null);
      addToast(`"${item.label}" removed from menu`, 'info');
   };

   const updateSelected = (updates: Partial<MenuItem>) => {
      if (!selectedId) return;
      setMenuItems(prev => prev.map(m => m.id === selectedId ? { ...m, ...updates } : m));
   };

   // ── Drag-and-drop ────────────────────────────────────────

   const handleDragStart = (index: number) => setDragIndex(index);

   const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      setDragOverIndex(index);
   };

   const handleDrop = (index: number) => {
      if (dragIndex === null || dragIndex === index) {
         setDragIndex(null);
         setDragOverIndex(null);
         return;
      }
      setMenuItems(prev => {
         const updated = [...prev];
         const [dragged] = updated.splice(dragIndex, 1);
         updated.splice(index, 0, dragged);
         return updated;
      });
      addToast('Menu item reordered', 'info');
      setDragIndex(null);
      setDragOverIndex(null);
   };

   const handleDragEnd = () => {
      setDragIndex(null);
      setDragOverIndex(null);
   };

   if (loading) {
      return (
         <div className="h-full flex items-center justify-center font-display">
            <div className="text-center space-y-4">
               <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
               <p className="text-xs font-black text-navy-400 uppercase tracking-widest">Loading Menu Settings…</p>
            </div>
         </div>
      );
   }

   return (
      <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar font-display bg-navy-50/30">
         <div className="max-w-[1600px] mx-auto w-full space-y-10 animate-in fade-in duration-500 pb-24">

            {/* Header */}
            <div className="space-y-6">
               <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300 px-1">
                  <span>Admin</span>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span>Content Manager</span>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span className="text-primary">Menu Settings</span>
               </nav>
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-navy-100 pb-8">
                  <div className="max-w-2xl space-y-3">
                     <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Menu Settings</h1>
                     <p className="text-navy-500 font-medium italic text-lg leading-relaxed uppercase tracking-wider opacity-80">Manage the navigation menu links shown on the {BRAND.name} website.</p>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={loadMenu} className="px-10 py-4 bg-white border-2 border-navy-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:bg-navy-50 transition-all shadow-sm flex items-center gap-3">
                        <span className="material-symbols-outlined text-lg">refresh</span> Reload Menu
                     </button>
                     <button onClick={handleSave} disabled={saving} className="px-12 py-4 bg-primary text-white rounded-[1.75rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3">
                        <span className="material-symbols-outlined text-lg">{saving ? 'progress_activity' : 'save'}</span>
                        {saving ? 'Saving…' : 'Save Changes'}
                     </button>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

               {/* Left Column: Menu Items List */}
               <div className="lg:col-span-5 space-y-8">
                  <div className="flex items-center justify-between px-4">
                     <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight">Menu Items</h3>
                     <span className="text-[10px] font-bold text-navy-300 uppercase tracking-widest">{menuItems.length} item{menuItems.length !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="bg-white rounded-[3.5rem] border border-navy-100 p-6 shadow-sm flex flex-col space-y-2 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-navy-950"><span className="material-symbols-outlined text-[140px] font-black">account_tree</span></div>

                     {menuItems.map((item, idx) => (
                        <div
                           key={item.id}
                           draggable
                           onDragStart={() => handleDragStart(idx)}
                           onDragOver={(e) => handleDragOver(e, idx)}
                           onDrop={() => handleDrop(idx)}
                           onDragEnd={handleDragEnd}
                           onClick={() => setSelectedId(item.id)}
                           className={`flex items-center gap-5 p-5 rounded-[2rem] border-2 transition-all cursor-pointer group relative ${dragOverIndex === idx && dragIndex !== idx
                                 ? 'border-primary/60 bg-primary/10 scale-[1.02] shadow-2xl'
                                 : dragIndex === idx
                                    ? 'opacity-40 border-dashed border-navy-200'
                                    : selectedId === item.id
                                       ? 'bg-primary/5 border-primary shadow-xl shadow-primary/5'
                                       : 'bg-white border-transparent hover:bg-navy-50'
                              }`}
                        >
                           <span className={`material-symbols-outlined cursor-grab active:cursor-grabbing transition-colors ${selectedId === item.id ? 'text-primary' : 'text-navy-100 group-hover:text-navy-400'}`}>drag_indicator</span>
                           <div className="flex-1 space-y-1">
                              <p className={`text-sm font-black uppercase tracking-tight ${selectedId === item.id ? 'text-primary' : 'text-navy-950'}`}>
                                 {item.label}
                                 {item.badge && <span className="ml-2 text-[8px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold">{item.badge}</span>}
                              </p>
                              <p className="text-[9px] font-bold text-navy-300 uppercase tracking-widest opacity-60 italic">
                                 {item.linkType === 'external' ? 'External' : 'Internal'}: <span className="font-mono text-navy-200">{item.path || '/'}</span>
                              </p>
                           </div>
                           <div className="flex items-center gap-4">
                              {!item.visible && <span className="text-[8px] font-black text-navy-300 uppercase tracking-widest px-2 py-1 rounded-full border border-navy-100 bg-navy-50">Hidden</span>}
                              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm ${item.visible ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-navy-50 text-navy-400 border-navy-100'
                                 }`}>{item.visible ? 'Active' : 'Hidden'}</span>
                              <span className={`material-symbols-outlined text-sm ${selectedId === item.id ? 'text-primary' : 'text-navy-200 opacity-0 group-hover:opacity-100'}`}>edit</span>
                           </div>
                        </div>
                     ))}

                     <button onClick={handleAddItem} className="mt-8 w-full py-5 border-2 border-dashed border-navy-100 rounded-[2.5rem] text-navy-300 font-black uppercase text-[10px] tracking-widest hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-3">
                        <span className="material-symbols-outlined">add_circle</span>
                        Add Menu Item
                     </button>
                  </div>
               </div>

               {/* Right Column: Item Editor */}
               <div className="lg:col-span-7">
                  <div className="sticky top-10 space-y-8">
                     {selectedItem ? (
                        <div className="bg-white rounded-[4rem] border border-navy-100 shadow-2xl overflow-hidden flex flex-col group">
                           <div className="p-10 border-b border-navy-50 bg-navy-50/30 flex justify-between items-center px-12">
                              <div className="space-y-1">
                                 <h3 className="text-2xl font-black text-navy-950 uppercase tracking-tighter">Edit Menu Item</h3>
                                 <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest italic opacity-60 leading-none">Editing: "{selectedItem.label}"</p>
                              </div>
                              <span className="px-5 py-2 rounded-xl bg-primary text-white text-[9px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">Editing</span>
                           </div>

                           <div className="p-12 px-14 space-y-12">
                              {/* Menu Label */}
                              <div className="space-y-4">
                                 <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-2">Menu Label</label>
                                 <input
                                    className="w-full h-16 px-8 bg-navy-50 border-none rounded-[1.75rem] text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
                                    value={selectedItem.label}
                                    onChange={e => updateSelected({ label: e.target.value })}
                                 />
                                 <p className="text-[9px] font-bold text-navy-300 uppercase italic ml-4 leading-relaxed">The text shown for this menu link on the website.</p>
                              </div>

                              {/* Link Type */}
                              <div className="space-y-4">
                                 <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-2">Link Type</label>
                                 <div className="flex bg-navy-50 p-1.5 rounded-[1.75rem] shadow-inner border border-navy-100 w-fit">
                                    {(['internal', 'external'] as const).map((t) => (
                                       <button
                                          key={t}
                                          onClick={() => updateSelected({ linkType: t })}
                                          className={`px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedItem.linkType === t
                                                ? 'bg-white text-navy-950 shadow-md border border-navy-100'
                                                : 'text-navy-400 hover:text-navy-700'
                                             }`}
                                       >
                                          {t === 'internal' ? 'Internal Link' : 'External Link'}
                                       </button>
                                    ))}
                                 </div>
                              </div>

                              {/* Path */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                 <div className="space-y-4">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-2">Navigation Path</label>
                                    {selectedItem.linkType === 'internal' ? (
                                       <div className="relative group">
                                          <select
                                             className="w-full h-16 px-8 bg-navy-50 border-none rounded-[1.75rem] text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 appearance-none shadow-inner transition-all"
                                             value={selectedItem.path}
                                             onChange={e => updateSelected({ path: e.target.value })}
                                          >
                                             {ROUTE_OPTIONS.map(r => (
                                                <option key={r.path} value={r.path}>{r.path} ({r.label})</option>
                                             ))}
                                          </select>
                                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-navy-200 material-symbols-outlined font-black pointer-events-none group-focus-within:text-primary transition-colors">expand_more</span>
                                       </div>
                                    ) : (
                                       <input
                                          className="w-full h-16 px-8 bg-navy-50 border-none rounded-[1.75rem] text-sm font-bold text-navy-950 focus:ring-8 focus:ring-primary/5 shadow-inner transition-all"
                                          value={selectedItem.path}
                                          onChange={e => updateSelected({ path: e.target.value })}
                                          placeholder="https://example.com"
                                       />
                                    )}
                                 </div>
                                 <div className="space-y-4">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-2">Badge Label</label>
                                    <input
                                       className="w-full h-16 px-8 bg-navy-50 border-none rounded-[1.75rem] text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 shadow-inner transition-all"
                                       value={selectedItem.badge}
                                       onChange={e => updateSelected({ badge: e.target.value })}
                                       placeholder="e.g. NEW, HOT (leave empty for none)"
                                    />
                                 </div>
                              </div>

                              {/* Toggles */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-navy-50 pt-10">
                                 <div className="flex items-center justify-between p-8 bg-navy-50/50 rounded-[2.5rem] border border-navy-50 shadow-inner">
                                    <div className="space-y-1">
                                       <p className="text-[10px] font-black text-navy-950 uppercase tracking-tight leading-none">Visible</p>
                                       <p className="text-[8px] font-bold text-navy-300 uppercase tracking-widest mt-2 leading-relaxed italic">Show this item in the navigation.</p>
                                    </div>
                                    <div
                                       className="relative inline-flex items-center h-8 rounded-full w-16 transition-all shadow-md cursor-pointer"
                                       onClick={() => updateSelected({ visible: !selectedItem.visible })}
                                    >
                                       <input checked={selectedItem.visible} readOnly type="checkbox" className="sr-only peer" />
                                       <div className="w-16 h-8 bg-navy-200 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-lg"></div>
                                    </div>
                                 </div>
                                 <div className="flex items-center justify-between p-8 bg-navy-50/50 rounded-[2.5rem] border border-navy-100 shadow-inner">
                                    <div className="space-y-1">
                                       <p className="text-[10px] font-black text-navy-950 uppercase tracking-tight leading-none">Open in New Tab</p>
                                       <p className="text-[8px] font-bold text-navy-300 uppercase tracking-widest mt-2 leading-relaxed italic">Opens link in a new browser tab.</p>
                                    </div>
                                    <div
                                       className="relative inline-flex items-center h-8 rounded-full w-16 transition-all shadow-md cursor-pointer"
                                       onClick={() => updateSelected({ openInNewTab: !selectedItem.openInNewTab })}
                                    >
                                       <input checked={selectedItem.openInNewTab} readOnly type="checkbox" className="sr-only peer" />
                                       <div className="w-16 h-8 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-lg"></div>
                                    </div>
                                 </div>
                              </div>

                              {/* Visibility */}
                              <div className="space-y-8 pt-4">
                                 <h4 className="text-[10px] font-black text-navy-300 uppercase tracking-[0.3em] px-4 border-l-2 border-navy-50">Who Can See This</h4>
                                 <div className="flex flex-wrap gap-10 px-4">
                                    {([
                                       { value: 'public', label: 'Everyone' },
                                       { value: 'loggedIn', label: 'Logged-In Users' },
                                       { value: 'admin', label: 'Admin Only' },
                                    ] as const).map(({ value, label }) => (
                                       <label key={value} className="flex items-center gap-5 cursor-pointer group/ch">
                                          <div className="relative flex items-center">
                                             <input
                                                type="radio"
                                                name="visibility"
                                                checked={selectedItem.visibility === value}
                                                onChange={() => updateSelected({ visibility: value })}
                                                className="peer h-7 w-7 appearance-none rounded-xl border-2 border-navy-100 checked:bg-primary checked:border-primary transition-all shadow-sm"
                                             />
                                             <span className="material-symbols-outlined text-white text-sm absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-all font-black">check</span>
                                          </div>
                                          <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest group-hover/ch:text-navy-950 transition-all">{label}</span>
                                       </label>
                                    ))}
                                 </div>
                              </div>
                           </div>

                           {/* Footer actions */}
                           <div className="p-10 border-t border-navy-50 bg-navy-50/10 flex flex-col sm:flex-row items-center justify-between px-16 gap-8">
                              <button onClick={handleDeleteItem} className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-red-50 px-8 py-4 rounded-2xl transition-all shadow-sm">
                                 <span className="material-symbols-outlined text-xl">delete_forever</span>
                                 Delete Menu Item
                              </button>
                              <button onClick={handleSave} disabled={saving} className="px-14 py-5 bg-navy-950 text-white text-[10px] font-black uppercase tracking-[0.25em] rounded-[1.5rem] shadow-[0_20px_40px_-10px_rgba(16,25,34,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                                 <span className="material-symbols-outlined text-lg">{saving ? 'progress_activity' : 'save'}</span>
                                 {saving ? 'Saving…' : 'Save Changes'}
                              </button>
                           </div>
                        </div>
                     ) : (
                        <div className="bg-white rounded-[4rem] border border-navy-100 shadow-sm p-16 text-center space-y-6">
                           <span className="material-symbols-outlined text-5xl text-navy-100">touch_app</span>
                           <p className="text-lg font-black text-navy-300 uppercase tracking-tight">Select a Menu Item</p>
                           <p className="text-xs font-bold text-navy-300 uppercase tracking-widest opacity-60">Click on an item in the list to edit its settings, or add a new one.</p>
                        </div>
                     )}

                     {/* Live Mini-Preview */}
                     <div className="rounded-[3rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.25)] border-4 border-white bg-white ring-1 ring-navy-100">
                        <div className="bg-navy-900 h-8 flex items-center gap-2 px-6 border-b border-white/5">
                           <div className="size-2.5 rounded-full bg-red-500/80"></div>
                           <div className="size-2.5 rounded-full bg-amber-500/80"></div>
                           <div className="size-2.5 rounded-full bg-emerald-500/80"></div>
                           <div className="ml-4 flex-1 h-4 bg-white/5 rounded text-[7px] flex items-center px-3 font-black uppercase text-white/20 tracking-widest border border-white/5">{BRAND.domain}</div>
                        </div>
                        <div className="bg-white px-8 h-16 flex items-center justify-between border-b border-navy-100">
                           <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-xl">flight</span>
                              <span className="font-black text-navy-900 text-sm tracking-tight">{BRAND.shortName}<span className="text-primary">{BRAND.tagSuffix}</span></span>
                           </div>
                           <nav className="flex items-center gap-6">
                              {menuItems.filter(m => m.visible).map(item => (
                                 <span
                                    key={item.id}
                                    className={`text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${selectedId === item.id ? 'text-primary' : 'text-navy-500'
                                       }`}
                                 >
                                    {item.label}
                                    {item.badge && <span className="ml-1 text-[7px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold">{item.badge}</span>}
                                 </span>
                              ))}
                           </nav>
                           <div className="flex items-center gap-3">
                              <span className="text-navy-400 material-symbols-outlined text-lg">search</span>
                              <span className="bg-primary text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">Book Now</span>
                           </div>
                        </div>
                        <div className="h-24 bg-gradient-to-b from-navy-50/50 to-transparent flex items-center justify-center">
                           <p className="text-[9px] font-bold text-navy-200 uppercase tracking-widest">Navigation Preview</p>
                        </div>
                     </div>

                     {/* Info Banner */}
                     <div className="bg-primary/5 rounded-[3.5rem] p-10 border border-primary/20 flex gap-8 items-start shadow-inner relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                           <span className="material-symbols-outlined text-[100px] font-black">tips_and_updates</span>
                        </div>
                        <span className="material-symbols-outlined text-primary p-4 bg-white rounded-2xl shadow-md font-black group-hover:rotate-12 transition-transform">info</span>
                        <div className="space-y-3 relative z-10">
                           <p className="text-sm font-black text-navy-950 uppercase tracking-tight leading-none">Note</p>
                           <p className="text-[10px] font-bold text-navy-500 uppercase tracking-widest opacity-70 leading-relaxed italic">Changes are saved as a draft. Click "Save Changes" to publish the updated navigation to the {BRAND.shortName} website. You can drag items to reorder them.</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default MenuManagement;
