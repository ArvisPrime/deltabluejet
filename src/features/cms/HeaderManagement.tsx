
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { BRAND } from '../../config/brand';
import { getHeaderConfig, updateHeaderConfig, uploadBrandAsset } from '../../services/cms';
import type { CmsHeaderConfigDoc, CmsMenuItemDoc } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';
import { useCmsHeaderStore } from '../../stores/cmsHeaderStore';

// ─── Types ────────────────────────────────────────────────

interface NavItem {
   label: string;
   path: string;
   type: 'internal' | 'external';
   id: string;
   openInNewTab: boolean;
   hasMegaMenu: boolean;
   badge: string;
}

type TabKey = 'Branding' | 'Navigation' | 'Utilities' | 'CTA Button';

// ─── Component ────────────────────────────────────────────

const HeaderManagement: React.FC = () => {
   const navigate = useNavigate();
   const addToast = useToastStore((s) => s.addToast);
   const [activeTab, setActiveTab] = useState<TabKey>('Navigation');
   const [selectedItem, setSelectedItem] = useState('');
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);

   // Preview
   const [previewWidth, setPreviewWidth] = useState<'desktop' | 'mobile'>('desktop');

   // Firestore-backed state
   const [headerConfig, setHeaderConfig] = useState<CmsHeaderConfigDoc | null>(null);
   const [menuItems, setMenuItems] = useState<NavItem[]>([]);

   // Branding state
   const [logoUrl, setLogoUrl] = useState<string | null>(null);
   const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
   const [brandName, setBrandName] = useState('');
   const [tagSuffix, setTagSuffix] = useState('');
   const [uploadingLogo, setUploadingLogo] = useState(false);
   const [uploadingFavicon, setUploadingFavicon] = useState(false);
   const logoInputRef = useRef<HTMLInputElement>(null);
   const faviconInputRef = useRef<HTMLInputElement>(null);

   // Edit form state for selected navigation item
   const [editLabel, setEditLabel] = useState('');
   const [editPath, setEditPath] = useState('');
   const [editType, setEditType] = useState<'internal' | 'external'>('internal');
   const [editOpenInNewTab, setEditOpenInNewTab] = useState(false);
   const [editHasMegaMenu, setEditHasMegaMenu] = useState(false);
   const [editBadge, setEditBadge] = useState('');

   // CTA state
   const [ctaLabel, setCtaLabel] = useState('Join Club');
   const [ctaLink, setCtaLink] = useState('/loyalty');
   const [ctaVisible, setCtaVisible] = useState(true);

   // Utility state
   const [showSearch, setShowSearch] = useState(true);
   const [showLanguageSwitcher, setShowLanguageSwitcher] = useState(true);
   const [showLoginButton, setShowLoginButton] = useState(true);

   // Original values for cancel
   const [originalEdit, setOriginalEdit] = useState<{ label: string; path: string; type: 'internal' | 'external'; openInNewTab: boolean; hasMegaMenu: boolean; badge: string }>({ label: '', path: '', type: 'internal', openInNewTab: false, hasMegaMenu: false, badge: '' });

   // Drag-and-drop state
   const [dragIndex, setDragIndex] = useState<number | null>(null);
   const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

   let nextId = useRef(0);

   useEffect(() => {
      (async () => {
         try {
            const config = await getHeaderConfig();
            setHeaderConfig(config);
            if (config) {
               setLogoUrl(config.logoUrl || null);
               setFaviconUrl(config.faviconUrl || null);
               setBrandName(config.brandName ?? '');
               setTagSuffix(config.tagSuffix ?? '');
               // CTA
               if (config.ctaLabel !== undefined) setCtaLabel(config.ctaLabel);
               if (config.ctaLink !== undefined) setCtaLink(config.ctaLink);
               if (config.ctaVisible !== undefined) setCtaVisible(config.ctaVisible);
               // Utilities
               if (config.showSearch !== undefined) setShowSearch(config.showSearch);
               if (config.showLanguageSwitcher !== undefined) setShowLanguageSwitcher(config.showLanguageSwitcher);
               if (config.showLoginButton !== undefined) setShowLoginButton(config.showLoginButton);
            }
            if (config?.navItems?.length) {
               const flat: NavItem[] = config.navItems.map((item: CmsMenuItemDoc, i: number) => ({
                  label: item.label,
                  path: item.href,
                  type: (item.href?.startsWith('http') ? 'external' : 'internal') as 'internal' | 'external',
                  id: `nav_${String(i + 1).padStart(2, '0')}`,
                  openInNewTab: item.openInNewTab || false,
                  hasMegaMenu: item.hasMegaMenu || false,
                  badge: item.badge || '',
               }));
               nextId.current = flat.length + 1;
               setMenuItems(flat);
               selectItem(flat[0]);
            } else {
               const defaults: NavItem[] = [
                  { label: 'Book', path: '/book', type: 'internal', id: 'nav_01', openInNewTab: false, hasMegaMenu: true, badge: '' },
                  { label: 'Check-in', path: '/check-in', type: 'internal', id: 'nav_02', openInNewTab: false, hasMegaMenu: false, badge: '' },
                  { label: 'My Trips', path: '/manage-booking', type: 'internal', id: 'nav_03', openInNewTab: false, hasMegaMenu: false, badge: '' },
                  { label: 'Flight Status', path: '/flight-status', type: 'internal', id: 'nav_04', openInNewTab: false, hasMegaMenu: false, badge: '' },
               ];
               nextId.current = 5;
               setMenuItems(defaults);
               selectItem(defaults[0]);
            }
         } catch (err) {
            console.error('Failed to load header config:', err);
            addToast('Failed to load header settings', 'error');
         } finally {
            setLoading(false);
         }
      })();
   }, []);

   const selectItem = (item: NavItem) => {
      setSelectedItem(item.label);
      setEditLabel(item.label);
      setEditPath(item.path);
      setEditType(item.type);
      setEditOpenInNewTab(item.openInNewTab);
      setEditHasMegaMenu(item.hasMegaMenu);
      setEditBadge(item.badge);
      setOriginalEdit({ label: item.label, path: item.path, type: item.type, openInNewTab: item.openInNewTab, hasMegaMenu: item.hasMegaMenu, badge: item.badge });
   };

   // sync edit form when selected item changes
   useEffect(() => {
      const found = menuItems.find(m => m.label === selectedItem);
      if (found) selectItem(found);
   }, [selectedItem]);

   const handleSave = async () => {
      setSaving(true);
      try {
         const navItems: CmsMenuItemDoc[] = menuItems.map((m, i) => ({
            label: m.label ?? '',
            href: m.path ?? '',
            order: i,
            children: [],
            openInNewTab: m.openInNewTab ?? false,
            hasMegaMenu: m.hasMegaMenu ?? false,
            badge: m.badge ?? '',
         }));

         // Sanitize: Firestore rejects `undefined` — ensure every value is concrete
         const payload: Record<string, any> = {
            navItems,
            logoUrl: logoUrl ?? null,
            faviconUrl: faviconUrl ?? null,
            brandName: brandName ?? '',
            tagSuffix: tagSuffix ?? '',
            ctaLabel: ctaLabel ?? '',
            ctaLink: ctaLink ?? '',
            ctaVisible: ctaVisible ?? true,
            showSearch: showSearch ?? true,
            showLanguageSwitcher: showLanguageSwitcher ?? true,
            showLoginButton: showLoginButton ?? true,
         };

         await updateHeaderConfig(payload);
         addToast('Header settings saved successfully', 'success');
         // Reload the global CMS store so public header updates immediately
         useCmsHeaderStore.getState().load();
      } catch (err) {
         console.error('Failed to save header config:', err);
         addToast('Failed to save header settings', 'error');
      } finally {
         setSaving(false);
      }
   };

   const handleUpdateItem = () => {
      setMenuItems(prev =>
         prev.map(m =>
            m.label === selectedItem
               ? { ...m, label: editLabel, path: editPath, type: editType, openInNewTab: editOpenInNewTab, hasMegaMenu: editHasMegaMenu, badge: editBadge }
               : m
         )
      );
      setSelectedItem(editLabel);
      addToast(`Updated "${editLabel}"`, 'success');
   };

   const handleCancelEdit = () => {
      setEditLabel(originalEdit.label);
      setEditPath(originalEdit.path);
      setEditType(originalEdit.type);
      setEditOpenInNewTab(originalEdit.openInNewTab);
      setEditHasMegaMenu(originalEdit.hasMegaMenu);
      setEditBadge(originalEdit.badge);
   };

   const handleAddItem = () => {
      const newId = `nav_${String(nextId.current++).padStart(2, '0')}`;
      const newItem: NavItem = {
         label: `New Link ${nextId.current - 1}`,
         path: '/',
         type: 'internal',
         id: newId,
         openInNewTab: false,
         hasMegaMenu: false,
         badge: '',
      };
      setMenuItems(prev => [...prev, newItem]);
      setSelectedItem(newItem.label);
      addToast('New menu item added — edit it on the right panel', 'info');
   };

   const handleDeleteItem = (e: React.MouseEvent, item: NavItem) => {
      e.stopPropagation();
      if (menuItems.length <= 1) {
         addToast('You must keep at least one menu item', 'warning');
         return;
      }
      if (!window.confirm(`Remove "${item.label}" from the navigation?`)) return;
      setMenuItems(prev => {
         const updated = prev.filter(m => m.id !== item.id);
         if (selectedItem === item.label && updated.length > 0) {
            setSelectedItem(updated[0].label);
         }
         return updated;
      });
      addToast(`"${item.label}" removed`, 'info');
   };

   const handleEditClick = (e: React.MouseEvent, item: NavItem) => {
      e.stopPropagation();
      setSelectedItem(item.label);
   };

   // ── Drag-and-drop handlers ──────────────────────────────
   const handleDragStart = (index: number) => {
      setDragIndex(index);
   };

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
      addToast('Menu item reordered — click "Save Changes" to publish', 'info');
      setDragIndex(null);
      setDragOverIndex(null);
   };

   const handleDragEnd = () => {
      setDragIndex(null);
      setDragOverIndex(null);
   };

   const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadingLogo(true);
      try {
         const url = await uploadBrandAsset(file, 'logo');
         setLogoUrl(url);
         addToast('Logo uploaded — click "Save Changes" to publish', 'success');
      } catch (err) {
         console.error('Logo upload failed:', err);
         addToast('Failed to upload logo', 'error');
      } finally {
         setUploadingLogo(false);
      }
   };

   const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadingFavicon(true);
      try {
         const url = await uploadBrandAsset(file, 'favicon');
         setFaviconUrl(url);
         addToast('Favicon uploaded — click "Save Changes" to publish', 'success');
      } catch (err) {
         console.error('Favicon upload failed:', err);
         addToast('Failed to upload favicon', 'error');
      } finally {
         setUploadingFavicon(false);
      }
   };

   if (loading) {
      return (
         <div className="h-full flex items-center justify-center font-display">
            <div className="text-center space-y-4">
               <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
               <p className="text-xs font-black text-navy-400 uppercase tracking-widest">Loading Header Settings…</p>
            </div>
         </div>
      );
   }

   // ────── Tab Content Renderers ──────────────────────────

   const renderBrandingTab = () => (
      <div className="p-12 space-y-10">
         <h3 className="text-sm font-black text-navy-950 uppercase tracking-[0.25em] flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">palette</span>
            Branding
         </h3>

         {/* Logo Upload */}
         <div className="space-y-4">
            <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Logo</label>
            <div className="flex items-center gap-6">
               <div className="size-24 rounded-2xl bg-navy-50 border-2 border-dashed border-navy-200 flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                     <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                     <span className="material-symbols-outlined text-3xl text-navy-200">image</span>
                  )}
               </div>
               <div className="space-y-3">
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <div className="flex gap-3">
                     <button
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="px-6 py-3 rounded-xl border-2 border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center gap-2 disabled:opacity-50"
                     >
                        <span className="material-symbols-outlined text-sm">{uploadingLogo ? 'progress_activity' : 'upload'}</span>
                        {uploadingLogo ? 'Uploading…' : logoUrl ? 'Replace Logo' : 'Upload Logo'}
                     </button>
                     {logoUrl && (
                        <button
                           onClick={() => { setLogoUrl(null); addToast('Logo removed — brand name will be used instead', 'info'); }}
                           className="px-6 py-3 rounded-xl border-2 border-red-100 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center gap-2"
                        >
                           <span className="material-symbols-outlined text-sm">delete</span>
                           Remove Logo
                        </button>
                     )}
                  </div>
                  <p className="text-[9px] font-bold text-navy-300 uppercase italic">PNG, SVG, or JPG. Recommended: 200×60px</p>
                  {logoUrl && <p className="text-[9px] font-bold text-amber-600 uppercase italic">Logo is active — brand name text is disabled</p>}
               </div>
            </div>
         </div>

         {/* Favicon Upload */}
         <div className="space-y-4">
            <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Favicon</label>
            <div className="flex items-center gap-6">
               <div className="size-16 rounded-xl bg-navy-50 border-2 border-dashed border-navy-200 flex items-center justify-center overflow-hidden">
                  {faviconUrl ? (
                     <img src={faviconUrl} alt="Favicon" className="w-full h-full object-contain p-1" />
                  ) : (
                     <span className="material-symbols-outlined text-xl text-navy-200">star</span>
                  )}
               </div>
               <div className="space-y-3">
                  <input ref={faviconInputRef} type="file" accept="image/png,image/x-icon,image/svg+xml" className="hidden" onChange={handleFaviconUpload} />
                  <button
                     onClick={() => faviconInputRef.current?.click()}
                     disabled={uploadingFavicon}
                     className="px-6 py-3 rounded-xl border-2 border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                     <span className="material-symbols-outlined text-sm">{uploadingFavicon ? 'progress_activity' : 'upload'}</span>
                     {uploadingFavicon ? 'Uploading…' : 'Upload Favicon'}
                  </button>
                  <p className="text-[9px] font-bold text-navy-300 uppercase italic">ICO, PNG, or SVG. Recommended: 32×32px</p>
               </div>
            </div>
         </div>

         {/* Brand Name */}
         <div className={`space-y-4 ${logoUrl ? 'opacity-40 pointer-events-none' : ''}`}>
            <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Brand Name {logoUrl && <span className="text-amber-500">(disabled — using logo)</span>}</label>
            <input
               className="w-full max-w-md h-14 px-8 bg-white border-none rounded-[1.5rem] text-sm font-black text-navy-950 uppercase tracking-widest focus:ring-8 focus:ring-primary/5 transition-all shadow-sm disabled:cursor-not-allowed"
               value={brandName}
               onChange={e => setBrandName(e.target.value)}
               placeholder="e.g. Deltablue"
               disabled={!!logoUrl}
            />
         </div>

         {/* Tag Suffix */}
         <div className={`space-y-4 ${logoUrl ? 'opacity-40 pointer-events-none' : ''}`}>
            <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Brand Suffix {logoUrl && <span className="text-amber-500">(disabled — using logo)</span>}</label>
            <input
               className="w-full max-w-md h-14 px-8 bg-white border-none rounded-[1.5rem] text-sm font-black text-navy-950 uppercase tracking-widest focus:ring-8 focus:ring-primary/5 transition-all shadow-sm disabled:cursor-not-allowed"
               value={tagSuffix}
               onChange={e => setTagSuffix(e.target.value)}
               placeholder="e.g. Air"
               disabled={!!logoUrl}
            />
            <p className="text-[9px] font-bold text-navy-300 uppercase italic ml-2">Displayed after the brand name in the header, e.g. Deltablue<strong>Air</strong></p>
         </div>
      </div>
   );

   const renderNavigationTab = () => (
      <div className="flex flex-col lg:flex-row flex-1">
         {/* Left: Navigation List */}
         <div className="flex-1 p-12 border-r border-navy-50 space-y-10">
            <div className="flex justify-between items-center px-2">
               <h3 className="text-sm font-black text-navy-950 uppercase tracking-[0.25em] flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">segment</span>
                  Menu Items
               </h3>
               <button
                  onClick={handleAddItem}
                  className="px-6 py-2.5 rounded-xl border-2 border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-all shadow-sm flex items-center gap-2"
               >
                  <span className="material-symbols-outlined text-sm">add</span> Add Menu Item
               </button>
            </div>

            <div className="space-y-4">
               {menuItems.map((item, idx) => (
                  <div
                     key={item.id}
                     draggable
                     onDragStart={() => handleDragStart(idx)}
                     onDragOver={(e) => handleDragOver(e, idx)}
                     onDrop={() => handleDrop(idx)}
                     onDragEnd={handleDragEnd}
                     onClick={() => setSelectedItem(item.label)}
                     className={`flex items-center gap-6 p-6 rounded-[2rem] border-2 transition-all cursor-pointer relative overflow-hidden group ${dragOverIndex === idx && dragIndex !== idx
                        ? 'border-primary/60 bg-primary/10 scale-[1.02] shadow-2xl'
                        : dragIndex === idx
                           ? 'opacity-40 border-dashed border-navy-200'
                           : selectedItem === item.label
                              ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5'
                              : 'border-transparent bg-navy-50/30 hover:bg-navy-50'
                        }`}
                  >
                     {selectedItem === item.label && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />}
                     <span className={`material-symbols-outlined cursor-grab active:cursor-grabbing transition-colors ${selectedItem === item.label ? 'text-primary' : 'text-navy-100 group-hover:text-navy-300'}`}>drag_indicator</span>
                     <div className="flex-1 space-y-1">
                        <p className={`text-base font-black uppercase tracking-tight ${selectedItem === item.label ? 'text-primary' : 'text-navy-950'}`}>
                           {item.label}
                           {item.badge && <span className="ml-2 text-[8px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold">{item.badge}</span>}
                        </p>
                        <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest opacity-60 italic">
                           {item.path} • {item.type === 'external' ? 'External Link' : 'Internal'}{item.hasMegaMenu ? ' • Has Dropdown' : ''}
                        </p>
                     </div>
                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={(e) => handleEditClick(e, item)} className="size-9 rounded-xl bg-white border border-navy-100 flex items-center justify-center text-navy-400 hover:text-primary transition-all shadow-sm"><span className="material-symbols-outlined text-lg">edit</span></button>
                        <button onClick={(e) => handleDeleteItem(e, item)} className="size-9 rounded-xl bg-white border border-navy-100 flex items-center justify-center text-navy-400 hover:text-red-500 transition-all shadow-sm"><span className="material-symbols-outlined text-lg">delete</span></button>
                     </div>
                  </div>
               ))}
            </div>

            <div className="p-8 rounded-[2.5rem] border-2 border-dashed border-navy-100 flex flex-col items-center justify-center text-center gap-4 bg-navy-50/10 group cursor-pointer hover:border-primary/40 transition-all" onClick={handleAddItem}>
               <span className="material-symbols-outlined text-4xl text-navy-100 group-hover:text-primary/30 transition-all">playlist_add</span>
               <p className="text-[10px] font-black text-navy-300 uppercase tracking-[0.3em]">Click to add a new menu item</p>
            </div>
         </div>

         {/* Right: Item Editor */}
         <div className="w-full lg:w-[480px] bg-navy-50/40 p-12 space-y-10 flex flex-col shadow-inner">
            <div className="flex items-center justify-between pb-8 border-b border-navy-100">
               <div className="space-y-1">
                  <h4 className="text-xl font-black text-navy-950 uppercase tracking-tighter">Edit Menu Item</h4>
                  <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest italic opacity-60">ID: {menuItems.find(m => m.label === selectedItem)?.id || '—'}</p>
               </div>
            </div>

            <form className="space-y-10" onSubmit={e => e.preventDefault()}>
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Menu Label</label>
                  <input
                     className="w-full h-14 px-8 bg-white border-none rounded-[1.5rem] text-sm font-black text-navy-950 uppercase tracking-widest focus:ring-8 focus:ring-primary/5 transition-all shadow-sm"
                     value={editLabel}
                     onChange={e => setEditLabel(e.target.value)}
                  />
               </div>

               <div className="space-y-4">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Link Type</label>
                  <div className="flex bg-navy-50 p-1.5 rounded-2xl shadow-inner border border-navy-100 w-fit">
                     {(['internal', 'external'] as const).map((t) => (
                        <button
                           key={t}
                           type="button"
                           onClick={() => setEditType(t)}
                           className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editType === t ? 'bg-white text-navy-950 shadow-md border border-navy-100' : 'text-navy-400 hover:text-navy-950'}`}
                        >
                           {t === 'internal' ? 'Internal Link' : 'External Link'}
                        </button>
                     ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Link URL</label>
                  <div className="relative group">
                     <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined font-black">link</span>
                     <input
                        className="w-full h-14 pl-14 pr-6 bg-white border-none rounded-[1.5rem] text-sm font-black text-navy-900 focus:ring-8 focus:ring-primary/5 transition-all shadow-sm"
                        value={editPath}
                        onChange={e => setEditPath(e.target.value)}
                        placeholder={editType === 'internal' ? '/about' : 'https://example.com'}
                     />
                  </div>
                  <p className="text-[9px] font-bold text-navy-300 uppercase italic ml-2">The page URL this link goes to (e.g. /about)</p>
               </div>

               <div className="space-y-6 pt-6 border-t border-navy-100">
                  {/* Mega Menu Toggle */}
                  <div className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-navy-50 shadow-sm group/toggle">
                     <div className="space-y-1">
                        <p className="text-sm font-black text-navy-950 uppercase tracking-tight leading-none transition-colors group-hover/toggle:text-primary">Show Dropdown Menu</p>
                        <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest italic opacity-60">Shows a dropdown with sub-menu items</p>
                     </div>
                     <div className="relative inline-flex items-center h-7 rounded-full w-14 transition-all shadow-inner cursor-pointer" onClick={() => setEditHasMegaMenu(!editHasMegaMenu)}>
                        <input checked={editHasMegaMenu} readOnly type="checkbox" className="sr-only peer" />
                        <div className="w-14 h-7 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-lg"></div>
                     </div>
                  </div>

                  {/* Open in New Tab Toggle */}
                  <div className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-navy-50 shadow-sm group/toggle">
                     <div className="space-y-1">
                        <p className="text-sm font-black text-navy-950 uppercase tracking-tight leading-none transition-colors group-hover/toggle:text-primary">Open in New Tab</p>
                        <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest italic opacity-60">Opens this link in a new browser tab</p>
                     </div>
                     <div className="relative inline-flex items-center h-7 rounded-full w-14 transition-all shadow-inner cursor-pointer" onClick={() => setEditOpenInNewTab(!editOpenInNewTab)}>
                        <input checked={editOpenInNewTab} readOnly type="checkbox" className="sr-only peer" />
                        <div className="w-14 h-7 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-lg"></div>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Menu Label Badge (Optional)</label>
                  <input
                     className="w-full h-14 px-8 bg-white border-none rounded-[1.5rem] text-sm font-black text-navy-950 uppercase focus:ring-8 focus:ring-primary/5 transition-all shadow-sm"
                     placeholder="E.G. NEW, LIMITED, HOT"
                     value={editBadge}
                     onChange={e => setEditBadge(e.target.value)}
                  />
               </div>
            </form>

            <div className="mt-auto pt-10 flex gap-4 border-t border-navy-100">
               <button onClick={handleCancelEdit} className="flex-1 py-4 text-[10px] font-black text-navy-400 uppercase tracking-[0.2em] hover:text-red-500 transition-colors">Cancel</button>
               <button
                  onClick={handleUpdateItem}
                  className="flex-1 py-4 bg-navy-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-navy-950/20 hover:scale-105 active:scale-95 transition-all"
               >
                  Apply Changes
               </button>
            </div>
         </div>
      </div>
   );

   const renderUtilitiesTab = () => (
      <div className="p-12 space-y-10">
         <h3 className="text-sm font-black text-navy-950 uppercase tracking-[0.25em] flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">tune</span>
            Header Utility Buttons
         </h3>
         <p className="text-xs text-navy-400 italic">Control which utility buttons appear in the header's right-hand area.</p>

         <div className="space-y-6 max-w-xl">
            {/* Search Toggle */}
            <div className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-navy-50 shadow-sm group/toggle">
               <div className="space-y-1">
                  <p className="text-sm font-black text-navy-950 uppercase tracking-tight leading-none">Search Button</p>
                  <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest italic opacity-60">Show the search icon in the header</p>
               </div>
               <div className="relative inline-flex items-center h-7 rounded-full w-14 transition-all shadow-inner cursor-pointer" onClick={() => setShowSearch(!showSearch)}>
                  <input checked={showSearch} readOnly type="checkbox" className="sr-only peer" />
                  <div className="w-14 h-7 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-lg"></div>
               </div>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-navy-50 shadow-sm group/toggle">
               <div className="space-y-1">
                  <p className="text-sm font-black text-navy-950 uppercase tracking-tight leading-none">Language & Currency</p>
                  <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest italic opacity-60">Show the language and currency selector</p>
               </div>
               <div className="relative inline-flex items-center h-7 rounded-full w-14 transition-all shadow-inner cursor-pointer" onClick={() => setShowLanguageSwitcher(!showLanguageSwitcher)}>
                  <input checked={showLanguageSwitcher} readOnly type="checkbox" className="sr-only peer" />
                  <div className="w-14 h-7 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-lg"></div>
               </div>
            </div>

            {/* Login Button */}
            <div className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-navy-50 shadow-sm group/toggle">
               <div className="space-y-1">
                  <p className="text-sm font-black text-navy-950 uppercase tracking-tight leading-none">Login / Account Button</p>
                  <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest italic opacity-60">Show the login or user account icon</p>
               </div>
               <div className="relative inline-flex items-center h-7 rounded-full w-14 transition-all shadow-inner cursor-pointer" onClick={() => setShowLoginButton(!showLoginButton)}>
                  <input checked={showLoginButton} readOnly type="checkbox" className="sr-only peer" />
                  <div className="w-14 h-7 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-lg"></div>
               </div>
            </div>
         </div>
      </div>
   );

   const renderCtaTab = () => (
      <div className="p-12 space-y-10">
         <h3 className="text-sm font-black text-navy-950 uppercase tracking-[0.25em] flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">ads_click</span>
            Call-to-Action Button
         </h3>
         <p className="text-xs text-navy-400 italic">Configure the main action button that appears in the header.</p>

         <div className="space-y-8 max-w-xl">
            {/* CTA Visible Toggle */}
            <div className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-navy-50 shadow-sm group/toggle">
               <div className="space-y-1">
                  <p className="text-sm font-black text-navy-950 uppercase tracking-tight leading-none">Show CTA Button</p>
                  <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest italic opacity-60">Toggle visibility of the main action button</p>
               </div>
               <div className="relative inline-flex items-center h-7 rounded-full w-14 transition-all shadow-inner cursor-pointer" onClick={() => setCtaVisible(!ctaVisible)}>
                  <input checked={ctaVisible} readOnly type="checkbox" className="sr-only peer" />
                  <div className="w-14 h-7 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-lg"></div>
               </div>
            </div>

            {/* CTA Label */}
            <div className="space-y-4">
               <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Button Label</label>
               <input
                  className="w-full h-14 px-8 bg-white border-none rounded-[1.5rem] text-sm font-black text-navy-950 uppercase tracking-widest focus:ring-8 focus:ring-primary/5 transition-all shadow-sm"
                  value={ctaLabel}
                  onChange={e => setCtaLabel(e.target.value)}
                  placeholder="e.g. Join Club, Book Now"
               />
            </div>

            {/* CTA Link */}
            <div className="space-y-4">
               <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest block px-1">Button Link</label>
               <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined font-black">link</span>
                  <input
                     className="w-full h-14 pl-14 pr-6 bg-white border-none rounded-[1.5rem] text-sm font-black text-navy-900 focus:ring-8 focus:ring-primary/5 transition-all shadow-sm"
                     value={ctaLink}
                     onChange={e => setCtaLink(e.target.value)}
                     placeholder="/loyalty"
                  />
               </div>
               <p className="text-[9px] font-bold text-navy-300 uppercase italic ml-2">Where the button takes the user when clicked</p>
            </div>
         </div>
      </div>
   );

   // ────── Main Render ────────────────────────────────────

   return (
      <div className="h-full flex flex-col font-display bg-navy-50/20 overflow-hidden">
         {/* Header */}
         <header className="bg-white border-b border-navy-100 p-8 shrink-0 z-10 shadow-sm">
            <div className="max-w-[1600px] mx-auto w-full space-y-6">
               <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300 px-1">
                  <span>Admin</span>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span>Content Manager</span>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span className="text-primary">Header Settings</span>
               </nav>
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-2">
                     <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Header Settings</h1>
                     <p className="text-navy-500 font-medium italic text-lg opacity-80 uppercase tracking-widest max-w-3xl">Customize the navigation menu, branding, and header buttons for your website.</p>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => navigate('/admin/audit-log')} className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-navy-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-navy-700 hover:text-primary transition-all shadow-sm group">
                        <span className="material-symbols-outlined text-xl text-navy-300 group-hover:text-primary">history</span> Change History
                     </button>
                     <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-10 py-4 bg-primary text-white rounded-[1.75rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50"
                     >
                        <span className="material-symbols-outlined text-xl">{saving ? 'progress_activity' : 'save'}</span>
                        {saving ? 'Saving…' : 'Save Changes'}
                     </button>
                  </div>
               </div>
            </div>
         </header>

         {/* Main Workspace */}
         <main className="flex-1 overflow-y-auto custom-scrollbar p-10 pb-32">
            <div className="max-w-[1600px] mx-auto w-full space-y-12">

               {/* Live Preview Section */}
               <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-sm overflow-hidden group transition-all hover:shadow-xl">
                  <div className="p-8 px-10 flex items-center justify-between bg-navy-50/20 border-b border-navy-50 cursor-pointer">
                     <div className="flex items-center gap-6">
                        <div className="size-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shadow-inner">
                           <span className="material-symbols-outlined text-2xl font-black">preview</span>
                        </div>
                        <div className="space-y-1">
                           <p className="text-lg font-black text-navy-950 uppercase tracking-tight">Live Header Preview</p>
                           <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">
                              {previewWidth === 'desktop' ? 'Desktop view (1440px)' : 'Mobile view (375px)'}
                           </p>
                        </div>
                     </div>
                     <div className="flex bg-white rounded-2xl p-1.5 border border-navy-100 shadow-sm">
                        <button onClick={() => setPreviewWidth('desktop')} className={`px-5 py-2.5 rounded-xl transition-all ${previewWidth === 'desktop' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-navy-300 hover:text-primary'}`}><span className="material-symbols-outlined text-lg">desktop_windows</span></button>
                        <button onClick={() => setPreviewWidth('mobile')} className={`px-5 py-2.5 rounded-xl transition-all ${previewWidth === 'mobile' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-navy-300 hover:text-primary'}`}><span className="material-symbols-outlined text-lg">smartphone</span></button>
                     </div>
                  </div>

                  {/* Browser Mock */}
                  <div className="p-12 bg-navy-50/10">
                     <div className={`mx-auto rounded-2xl overflow-hidden shadow-2xl border border-navy-100 bg-white transition-all duration-300 ${previewWidth === 'mobile' ? 'max-w-[375px]' : 'w-full'}`}>
                        <div className="bg-navy-900 h-10 flex items-center gap-2.5 px-8 border-b border-white/5">
                           <div className="size-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                           <div className="size-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                           <div className="size-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                           <div className="ml-6 flex-1 h-5 bg-white/5 rounded-lg text-[8px] flex items-center px-4 font-black uppercase text-white/20 tracking-widest border border-white/5">{BRAND.domain}</div>
                        </div>

                        {/* Rendered Header */}
                        <div className="px-10 py-6 flex items-center justify-between border-b-4 border-primary">
                           <div className="flex items-center gap-12">
                              <div className="flex items-center gap-3 font-black text-2xl tracking-tighter text-navy-950 uppercase">
                                 {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" className="h-9 w-auto object-contain" />
                                 ) : (
                                    <>
                                       <div className="size-9 bg-primary rounded-tr-xl rounded-bl-xl shadow-lg shadow-primary/20" />
                                       {brandName}<span className="text-primary">{tagSuffix}</span>
                                    </>
                                 )}
                              </div>
                              {previewWidth === 'desktop' && (
                                 <nav className="hidden xl:flex items-center gap-8">
                                    {menuItems.map(item => (
                                       <span key={item.id} className={`text-xs font-black uppercase tracking-widest transition-all pb-1 border-b-2 ${item.label === menuItems[0]?.label ? 'text-primary border-primary' : 'text-navy-400 border-transparent'}`}>
                                          {item.label}
                                          {item.badge && <span className="ml-1 text-[7px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">{item.badge}</span>}
                                       </span>
                                    ))}
                                 </nav>
                              )}
                           </div>
                           {previewWidth === 'desktop' && (
                              <div className="flex items-center gap-6">
                                 {showLanguageSwitcher && (
                                    <div className="flex items-center gap-2 text-[10px] font-black text-navy-400 uppercase tracking-widest">
                                       <span className="material-symbols-outlined text-lg">public</span>
                                       EN / USD
                                       <span className="material-symbols-outlined text-sm">expand_more</span>
                                    </div>
                                 )}
                                 {showLanguageSwitcher && <div className="h-6 w-px bg-navy-100" />}
                                 {showSearch && <span className="text-navy-400 material-symbols-outlined text-xl">search</span>}
                                 {showLoginButton && (
                                    <span className="flex items-center gap-2 text-[10px] font-black text-navy-700 uppercase tracking-widest">
                                       <span className="material-symbols-outlined text-xl">account_circle</span>
                                       Login
                                    </span>
                                 )}
                                 {ctaVisible && (
                                    <span className="bg-primary text-white text-[9px] font-black px-6 py-3 rounded-full uppercase tracking-widest shadow-xl shadow-primary/20">{ctaLabel}</span>
                                 )}
                              </div>
                           )}
                           {previewWidth === 'mobile' && (
                              <span className="material-symbols-outlined text-2xl text-navy-400">menu</span>
                           )}
                        </div>

                        {/* Content Placeholder */}
                        <div className="h-48 bg-navy-50/20 flex items-center justify-center relative overflow-hidden">
                           <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#137fec 2px, transparent 2px)', backgroundSize: '40px 40px' }}></div>
                           <div className="text-center space-y-4 relative z-10">
                              <p className="text-xs font-bold text-navy-300 uppercase tracking-[0.4em]">Page Content Area</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Configurator Section */}
               <div className="bg-white rounded-[4rem] border border-navy-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="border-b border-navy-50 px-10 bg-navy-50/10">
                     <div className="flex gap-12 overflow-x-auto no-scrollbar">
                        {(['Branding', 'Navigation', 'Utilities', 'CTA Button'] as TabKey[]).map(tab => (
                           <button
                              key={tab}
                              onClick={() => setActiveTab(tab)}
                              className={`py-8 text-[11px] font-black uppercase tracking-[0.25em] transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-primary' : 'text-navy-300 hover:text-navy-950'}`}
                           >
                              {tab}
                              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary rounded-t-full shadow-[0_0_12px_rgba(19,127,236,0.6)]" />}
                           </button>
                        ))}
                     </div>
                  </div>

                  {activeTab === 'Branding' && renderBrandingTab()}
                  {activeTab === 'Navigation' && renderNavigationTab()}
                  {activeTab === 'Utilities' && renderUtilitiesTab()}
                  {activeTab === 'CTA Button' && renderCtaTab()}
               </div>

               {/* Info Banner */}
               <div className="bg-amber-50/60 p-8 rounded-[3rem] border-2 border-amber-100 flex gap-6 items-start shadow-inner group">
                  <span className="material-symbols-outlined text-amber-600 p-3 bg-white rounded-2xl shadow-md font-black group-hover:scale-110 transition-transform">tips_and_updates</span>
                  <div className="space-y-2">
                     <p className="text-sm font-black text-amber-950 uppercase tracking-tight">How It Works</p>
                     <p className="text-[10px] font-bold text-amber-900 uppercase leading-relaxed tracking-wider opacity-70 italic">Changes are saved as a draft. Click "Save Changes" to publish them to the live website. All changes are logged in the Change History for review.</p>
                  </div>
               </div>
            </div>
         </main>
      </div>
   );
};

export default HeaderManagement;
