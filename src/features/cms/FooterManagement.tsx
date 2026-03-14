
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { BRAND } from '../../config/brand';
import { getFooterConfig, updateFooterConfig } from '../../services/cms';
import type { CmsFooterConfigDoc } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';

const SOCIAL_PLATFORMS = ['Facebook', 'Twitter / X', 'Instagram', 'LinkedIn'];

const FooterManagement: React.FC = () => {
   const navigate = useNavigate();
   const addToast = useToastStore((s) => s.addToast);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);

   // Preview
   const [previewWidth, setPreviewWidth] = useState<'desktop' | 'mobile'>('desktop');

   // Firestore-backed state
   const [columns, setColumns] = useState<{ title: string; links: { label: string; href: string }[] }[]>([]);
   const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([]);
   const [copyrightText, setCopyrightText] = useState('');
   const [showPaymentIcons, setShowPaymentIcons] = useState(true);
   const [contactEmail, setContactEmail] = useState('');
   const [contactPhone, setContactPhone] = useState('');

   // Newsletter
   const [newsletterEnabled, setNewsletterEnabled] = useState(false);
   const [newsletterTitle, setNewsletterTitle] = useState('Stay Updated');
   const [newsletterSubtitle, setNewsletterSubtitle] = useState('Get the latest deals and travel tips.');

   // App links
   const [appStoreUrl, setAppStoreUrl] = useState('');
   const [playStoreUrl, setPlayStoreUrl] = useState('');

   // Legal links
   const [legalLinks, setLegalLinks] = useState<{ label: string; href: string }[]>([
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
   ]);

   // Drag and drop for links
   const [dragCol, setDragCol] = useState<number | null>(null);
   const [dragLink, setDragLink] = useState<number | null>(null);
   const [dragOverLink, setDragOverLink] = useState<number | null>(null);

   useEffect(() => {
      (async () => {
         try {
            const config = await getFooterConfig();
            if (config) {
               setColumns(config.columns || []);
               setSocialLinks(config.socialLinks || []);
               setCopyrightText(config.copyrightText || `${BRAND.copyright}. All rights reserved.`);
               setShowPaymentIcons(config.showPaymentIcons !== false);
               setContactEmail(config.contactEmail || '');
               setContactPhone(config.contactPhone || '');
               setNewsletterEnabled(config.newsletterEnabled || false);
               setNewsletterTitle(config.newsletterTitle || 'Stay Updated');
               setNewsletterSubtitle(config.newsletterSubtitle || 'Get the latest deals and travel tips.');
               setAppStoreUrl(config.appStoreUrl || '');
               setPlayStoreUrl(config.playStoreUrl || '');
               if (config.legalLinks?.length) setLegalLinks(config.legalLinks);
            } else {
               // fallback defaults
               setColumns([
                  {
                     title: 'Company',
                     links: [
                        { label: 'About Us', href: '/about-us' },
                        { label: 'Careers', href: '/careers' },
                     ],
                  },
                  {
                     title: 'Support',
                     links: [
                        { label: 'Contact', href: '/contact' },
                        { label: 'Help Center', href: '/help' },
                     ],
                  },
               ]);
               setSocialLinks(
                  SOCIAL_PLATFORMS.map(p => ({ platform: p.toLowerCase(), url: '' }))
               );
               setCopyrightText(`${BRAND.copyright}. All rights reserved.`);
            }
         } catch (err) {
            console.error('Failed to load footer config:', err);
            addToast('Failed to load footer settings', 'error');
         } finally {
            setLoading(false);
         }
      })();
   }, []);

   const handleSave = async () => {
      setSaving(true);
      try {
         await updateFooterConfig({
            columns,
            socialLinks,
            copyrightText,
            showPaymentIcons,
            contactEmail,
            contactPhone,
            newsletterEnabled,
            newsletterTitle,
            newsletterSubtitle,
            appStoreUrl,
            playStoreUrl,
            legalLinks,
         });
         addToast('Footer settings saved successfully', 'success');
      } catch (err) {
         console.error('Failed to save footer config:', err);
         addToast('Failed to save footer settings', 'error');
      } finally {
         setSaving(false);
      }
   };

   // ── Column handlers ─────────────────────────────────────

   const handleColumnTitleChange = (colIdx: number, value: string) => {
      setColumns(prev => prev.map((col, ci) =>
         ci === colIdx ? { ...col, title: value } : col
      ));
   };

   const handleColumnLinkChange = (colIdx: number, linkIdx: number, field: 'label' | 'href', value: string) => {
      setColumns(prev => prev.map((col, ci) =>
         ci === colIdx
            ? { ...col, links: col.links.map((lnk, li) => li === linkIdx ? { ...lnk, [field]: value } : lnk) }
            : col
      ));
   };

   const handleAddLink = (colIdx: number) => {
      setColumns(prev => prev.map((col, ci) =>
         ci === colIdx ? { ...col, links: [...col.links, { label: 'New Link', href: '/' }] } : col
      ));
      addToast('Link added — edit the label and URL below', 'info');
   };

   const handleDeleteLink = (colIdx: number, linkIdx: number) => {
      setColumns(prev => prev.map((col, ci) =>
         ci === colIdx ? { ...col, links: col.links.filter((_, li) => li !== linkIdx) } : col
      ));
      addToast('Link removed', 'info');
   };

   const handleAddColumn = () => {
      setColumns(prev => [...prev, { title: 'New Section', links: [] }]);
      addToast('Footer column added', 'info');
   };

   const handleDeleteColumn = (colIdx: number) => {
      if (columns.length <= 1) {
         addToast('You must keep at least one footer column', 'warning');
         return;
      }
      if (!window.confirm(`Remove the "${columns[colIdx].title}" column and all its links?`)) return;
      setColumns(prev => prev.filter((_, ci) => ci !== colIdx));
      addToast('Footer column removed', 'info');
   };

   // ── Link drag-and-drop within a column ──────────────────

   const handleLinkDragStart = (colIdx: number, linkIdx: number) => {
      setDragCol(colIdx);
      setDragLink(linkIdx);
   };

   const handleLinkDragOver = (e: React.DragEvent, linkIdx: number) => {
      e.preventDefault();
      setDragOverLink(linkIdx);
   };

   const handleLinkDrop = (colIdx: number, linkIdx: number) => {
      if (dragCol !== colIdx || dragLink === null || dragLink === linkIdx) {
         setDragCol(null);
         setDragLink(null);
         setDragOverLink(null);
         return;
      }
      setColumns(prev => prev.map((col, ci) => {
         if (ci !== colIdx) return col;
         const updated = [...col.links];
         const [dragged] = updated.splice(dragLink, 1);
         updated.splice(linkIdx, 0, dragged);
         return { ...col, links: updated };
      }));
      addToast('Link reordered', 'info');
      setDragCol(null);
      setDragLink(null);
      setDragOverLink(null);
   };

   const handleLinkDragEnd = () => {
      setDragCol(null);
      setDragLink(null);
      setDragOverLink(null);
   };

   // ── Social handlers ─────────────────────────────────────

   const handleSocialChange = (platform: string, url: string) => {
      setSocialLinks(prev => {
         const existing = prev.find(s => s.platform.toLowerCase() === platform.toLowerCase());
         if (existing) {
            return prev.map(s => s.platform.toLowerCase() === platform.toLowerCase() ? { ...s, url } : s);
         }
         return [...prev, { platform: platform.toLowerCase(), url }];
      });
   };

   const getSocialUrl = (platform: string): string => {
      return socialLinks.find(s => s.platform.toLowerCase() === platform.toLowerCase())?.url || '';
   };

   // ── Legal link handlers ─────────────────────────────────

   const handleLegalLinkChange = (idx: number, field: 'label' | 'href', value: string) => {
      setLegalLinks(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
   };

   const handleAddLegalLink = () => {
      setLegalLinks(prev => [...prev, { label: 'New Link', href: '/' }]);
   };

   const handleDeleteLegalLink = (idx: number) => {
      setLegalLinks(prev => prev.filter((_, i) => i !== idx));
   };

   if (loading) {
      return (
         <div className="h-full flex items-center justify-center font-display">
            <div className="text-center space-y-4">
               <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
               <p className="text-xs font-black text-navy-400 uppercase tracking-widest">Loading Footer Settings…</p>
            </div>
         </div>
      );
   }

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
                  <span className="text-primary">Footer Settings</span>
               </nav>
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-2">
                     <h1 className="text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Footer Settings</h1>
                     <p className="text-navy-500 font-medium italic text-lg opacity-80 uppercase tracking-widest">Manage the footer links, social media, and legal information for the {BRAND.shortName} website.</p>
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
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 max-w-[1600px] mx-auto items-start">

               {/* Editor Column */}
               <div className="xl:col-span-7 space-y-10">
                  <div className="flex items-center justify-between px-2">
                     <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight">Footer Content</h3>
                     <button onClick={handleAddColumn} className="px-6 py-2.5 rounded-xl border-2 border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-all shadow-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">add</span> Add Column
                     </button>
                  </div>

                  <div className="space-y-6">
                     {/* Footer Columns */}
                     {columns.map((col, colIdx) => (
                        <div key={colIdx} className="bg-white rounded-[3.5rem] border border-navy-100 shadow-sm overflow-hidden group transition-all hover:shadow-xl">
                           <div className="p-8 px-10 flex items-center justify-between bg-navy-50/20 border-b border-navy-50">
                              <div className="flex items-center gap-6">
                                 <div className="size-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shadow-inner">
                                    <span className="material-symbols-outlined text-2xl font-black">view_column</span>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-lg font-black text-navy-950 uppercase tracking-tight">Column {colIdx + 1}: {col.title}</p>
                                    <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">{col.links.length} link{col.links.length !== 1 ? 's' : ''}</p>
                                 </div>
                              </div>
                              <button onClick={() => handleDeleteColumn(colIdx)} className="size-10 rounded-xl bg-white border border-navy-100 flex items-center justify-center text-navy-300 hover:text-red-500 transition-all shadow-sm opacity-0 group-hover:opacity-100">
                                 <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                           </div>
                           <div className="p-10 px-12 space-y-8">
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest px-2 block">Column Title</label>
                                 <input
                                    className="w-full h-14 px-8 bg-navy-50 border-none rounded-2xl text-sm font-black text-navy-950 uppercase tracking-widest focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
                                    value={col.title}
                                    onChange={e => handleColumnTitleChange(colIdx, e.target.value)}
                                 />
                              </div>

                              <div className="space-y-4">
                                 <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest px-2 mb-4">Links</p>
                                 {col.links.map((link, linkIdx) => (
                                    <div
                                       key={linkIdx}
                                       draggable
                                       onDragStart={() => handleLinkDragStart(colIdx, linkIdx)}
                                       onDragOver={(e) => handleLinkDragOver(e, linkIdx)}
                                       onDrop={() => handleLinkDrop(colIdx, linkIdx)}
                                       onDragEnd={handleLinkDragEnd}
                                       className={`flex gap-4 items-center p-5 rounded-[2rem] border-2 transition-all group/item shadow-inner ${dragCol === colIdx && dragOverLink === linkIdx && dragLink !== linkIdx
                                             ? 'border-primary/60 bg-primary/10 scale-[1.02]'
                                             : dragCol === colIdx && dragLink === linkIdx
                                                ? 'opacity-40 border-dashed border-navy-200 bg-navy-50/30'
                                                : 'border-transparent bg-navy-50/30 hover:border-navy-100'
                                          }`}
                                    >
                                       <span className="cursor-grab active:cursor-grabbing text-navy-100 hover:text-primary transition-colors">
                                          <span className="material-symbols-outlined font-black">drag_indicator</span>
                                       </span>
                                       <div className="flex-1 grid grid-cols-2 gap-6 px-2">
                                          <input
                                             className="bg-transparent border-none p-0 text-sm font-black text-navy-950 uppercase tracking-tight focus:ring-0"
                                             value={link.label}
                                             onChange={e => handleColumnLinkChange(colIdx, linkIdx, 'label', e.target.value)}
                                             placeholder="Link label"
                                          />
                                          <input
                                             className="bg-transparent border-none p-0 text-[11px] font-mono font-bold text-navy-300 focus:ring-0"
                                             value={link.href}
                                             onChange={e => handleColumnLinkChange(colIdx, linkIdx, 'href', e.target.value)}
                                             placeholder="/page-url"
                                          />
                                       </div>
                                       <button onClick={() => handleDeleteLink(colIdx, linkIdx)} className="p-2 text-navy-100 hover:text-red-500 transition-colors">
                                          <span className="material-symbols-outlined text-lg">delete</span>
                                       </button>
                                    </div>
                                 ))}
                                 <button onClick={() => handleAddLink(colIdx)} className="w-full py-5 border-2 border-dashed border-navy-100 rounded-[2rem] text-navy-300 font-black uppercase text-[10px] tracking-widest hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-3">
                                    <span className="material-symbols-outlined">add_circle</span>
                                    Add Link
                                 </button>
                              </div>
                           </div>
                        </div>
                     ))}

                     {/* Social Media */}
                     <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-sm overflow-hidden group transition-all hover:shadow-xl">
                        <div className="p-8 px-10 flex items-center justify-between bg-navy-50/20 border-b border-navy-50">
                           <div className="flex items-center gap-6">
                              <div className="size-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                                 <span className="material-symbols-outlined text-2xl font-black">share</span>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-lg font-black text-navy-950 uppercase tracking-tight">Social Media Links</p>
                                 <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">Your social media profile URLs</p>
                              </div>
                           </div>
                        </div>
                        <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-10">
                           {SOCIAL_PLATFORMS.map((p) => (
                              <div key={p} className="space-y-3">
                                 <label className="text-[9px] font-black text-navy-300 uppercase tracking-[0.3em] block px-2">{p} URL</label>
                                 <div className="flex bg-navy-50 rounded-2xl border-none shadow-inner group-focus-within:ring-8 group-focus-within:ring-primary/5 transition-all overflow-hidden h-14">
                                    <span className="flex items-center px-5 bg-navy-100/50 text-navy-400"><span className="material-symbols-outlined text-xl">link</span></span>
                                    <input
                                       className="flex-1 bg-transparent border-none text-[11px] font-mono font-bold text-navy-900 focus:ring-0 placeholder:text-navy-100"
                                       placeholder={`https://${p.toLowerCase().replace(' / x', '')}.com/deltablue`}
                                       value={getSocialUrl(p)}
                                       onChange={e => handleSocialChange(p, e.target.value)}
                                    />
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* Contact Information */}
                     <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-sm overflow-hidden group transition-all hover:shadow-xl">
                        <div className="p-8 px-10 flex items-center justify-between bg-navy-50/20 border-b border-navy-50">
                           <div className="flex items-center gap-6">
                              <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                                 <span className="material-symbols-outlined text-2xl font-black">contact_mail</span>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-lg font-black text-navy-950 uppercase tracking-tight">Contact Information</p>
                                 <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">Email and phone number shown in the footer</p>
                              </div>
                           </div>
                        </div>
                        <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-10">
                           <div className="space-y-3">
                              <label className="text-[9px] font-black text-navy-300 uppercase tracking-[0.3em] block px-2">Email Address</label>
                              <div className="flex bg-navy-50 rounded-2xl shadow-inner overflow-hidden h-14">
                                 <span className="flex items-center px-5 bg-navy-100/50 text-navy-400"><span className="material-symbols-outlined text-xl">mail</span></span>
                                 <input
                                    className="flex-1 bg-transparent border-none text-[11px] font-mono font-bold text-navy-900 focus:ring-0 placeholder:text-navy-100"
                                    placeholder={BRAND.email}
                                    value={contactEmail}
                                    onChange={e => setContactEmail(e.target.value)}
                                 />
                              </div>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[9px] font-black text-navy-300 uppercase tracking-[0.3em] block px-2">Phone Number</label>
                              <div className="flex bg-navy-50 rounded-2xl shadow-inner overflow-hidden h-14">
                                 <span className="flex items-center px-5 bg-navy-100/50 text-navy-400"><span className="material-symbols-outlined text-xl">call</span></span>
                                 <input
                                    className="flex-1 bg-transparent border-none text-[11px] font-mono font-bold text-navy-900 focus:ring-0 placeholder:text-navy-100"
                                    placeholder="+220 000 0000"
                                    value={contactPhone}
                                    onChange={e => setContactPhone(e.target.value)}
                                 />
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Legal & Copyright */}
                     <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-sm overflow-hidden group transition-all hover:shadow-xl">
                        <div className="p-8 px-10 flex items-center justify-between bg-navy-50/20 border-b border-navy-50">
                           <div className="flex items-center gap-6">
                              <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                                 <span className="material-symbols-outlined text-2xl font-black">gavel</span>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-lg font-black text-navy-950 uppercase tracking-tight">Legal & Copyright</p>
                                 <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">Copyright text, legal page links, and payment icons</p>
                              </div>
                           </div>
                        </div>
                        <div className="p-12 space-y-10">
                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-2">Copyright Text</label>
                              <textarea
                                 className="w-full min-h-[120px] p-8 bg-navy-50 border-none rounded-[2.5rem] text-xs font-bold text-navy-700 leading-relaxed tracking-wider shadow-inner focus:ring-8 focus:ring-primary/5 transition-all resize-none"
                                 value={copyrightText}
                                 onChange={e => setCopyrightText(e.target.value)}
                              />
                           </div>

                           {/* Legal Links */}
                           <div className="space-y-4">
                              <p className="text-[10px] font-black text-navy-300 uppercase tracking-widest px-2">Legal Page Links</p>
                              {legalLinks.map((link, idx) => (
                                 <div key={idx} className="flex gap-4 items-center p-4 rounded-2xl bg-navy-50/30 hover:bg-navy-50 transition-all">
                                    <div className="flex-1 grid grid-cols-2 gap-6 px-2">
                                       <input
                                          className="bg-transparent border-none p-0 text-sm font-black text-navy-950 uppercase tracking-tight focus:ring-0"
                                          value={link.label}
                                          onChange={e => handleLegalLinkChange(idx, 'label', e.target.value)}
                                          placeholder="Link label"
                                       />
                                       <input
                                          className="bg-transparent border-none p-0 text-[11px] font-mono font-bold text-navy-300 focus:ring-0"
                                          value={link.href}
                                          onChange={e => handleLegalLinkChange(idx, 'href', e.target.value)}
                                          placeholder="/privacy"
                                       />
                                    </div>
                                    <button onClick={() => handleDeleteLegalLink(idx)} className="p-2 text-navy-100 hover:text-red-500 transition-colors">
                                       <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                 </div>
                              ))}
                              <button onClick={handleAddLegalLink} className="w-full py-4 border-2 border-dashed border-navy-100 rounded-2xl text-navy-300 font-black uppercase text-[10px] tracking-widest hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-3">
                                 <span className="material-symbols-outlined text-sm">add_circle</span> Add Legal Link
                              </button>
                           </div>

                           {/* Payment Icons Toggle */}
                           <div className="flex items-center justify-between p-8 bg-navy-50/50 rounded-[2.5rem] border-2 border-navy-50 shadow-inner">
                              <div className="space-y-1">
                                 <p className="text-sm font-black text-navy-950 uppercase tracking-tight leading-none">Payment Card Icons</p>
                                 <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest italic opacity-60">Show Visa, Mastercard, and Amex logos in the footer</p>
                              </div>
                              <div className="relative inline-flex items-center h-8 rounded-full w-16 transition-all shadow-md cursor-pointer" onClick={() => setShowPaymentIcons(!showPaymentIcons)}>
                                 <input checked={showPaymentIcons} readOnly type="checkbox" className="sr-only peer" />
                                 <div className="w-16 h-8 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-lg"></div>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Newsletter */}
                     <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-sm overflow-hidden group transition-all hover:shadow-xl">
                        <div className="p-8 px-10 flex items-center justify-between bg-navy-50/20 border-b border-navy-50">
                           <div className="flex items-center gap-6">
                              <div className="size-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-inner">
                                 <span className="material-symbols-outlined text-2xl font-black">newspaper</span>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-lg font-black text-navy-950 uppercase tracking-tight">Newsletter Signup</p>
                                 <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">Email signup section shown in the footer</p>
                              </div>
                           </div>
                        </div>
                        <div className="p-12 space-y-8">
                           <div className="flex items-center justify-between p-6 bg-navy-50/50 rounded-[2rem] border-2 border-navy-50 shadow-inner">
                              <div className="space-y-1">
                                 <p className="text-sm font-black text-navy-950 uppercase tracking-tight leading-none">Show Newsletter</p>
                                 <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest italic opacity-60">Display an email signup section in the footer</p>
                              </div>
                              <div className="relative inline-flex items-center h-7 rounded-full w-14 transition-all shadow-inner cursor-pointer" onClick={() => setNewsletterEnabled(!newsletterEnabled)}>
                                 <input checked={newsletterEnabled} readOnly type="checkbox" className="sr-only peer" />
                                 <div className="w-14 h-7 bg-navy-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-lg"></div>
                              </div>
                           </div>
                           {newsletterEnabled && (
                              <div className="space-y-6">
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-2">Title</label>
                                    <input
                                       className="w-full h-14 px-8 bg-navy-50 border-none rounded-2xl text-sm font-black text-navy-950 uppercase tracking-widest focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
                                       value={newsletterTitle}
                                       onChange={e => setNewsletterTitle(e.target.value)}
                                    />
                                 </div>
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-navy-300 uppercase tracking-widest block px-2">Subtitle</label>
                                    <input
                                       className="w-full h-14 px-8 bg-navy-50 border-none rounded-2xl text-sm font-bold text-navy-700 focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
                                       value={newsletterSubtitle}
                                       onChange={e => setNewsletterSubtitle(e.target.value)}
                                    />
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>

                     {/* App Download Links */}
                     <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-sm overflow-hidden group transition-all hover:shadow-xl">
                        <div className="p-8 px-10 flex items-center justify-between bg-navy-50/20 border-b border-navy-50">
                           <div className="flex items-center gap-6">
                              <div className="size-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center shadow-inner">
                                 <span className="material-symbols-outlined text-2xl font-black">phone_iphone</span>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-lg font-black text-navy-950 uppercase tracking-tight">Mobile App Links</p>
                                 <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">App Store and Google Play download links</p>
                              </div>
                           </div>
                        </div>
                        <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-10">
                           <div className="space-y-3">
                              <label className="text-[9px] font-black text-navy-300 uppercase tracking-[0.3em] block px-2">Apple App Store URL</label>
                              <div className="flex bg-navy-50 rounded-2xl shadow-inner overflow-hidden h-14">
                                 <span className="flex items-center px-5 bg-navy-100/50 text-navy-400"><span className="material-symbols-outlined text-xl">phone_iphone</span></span>
                                 <input
                                    className="flex-1 bg-transparent border-none text-[11px] font-mono font-bold text-navy-900 focus:ring-0 placeholder:text-navy-100"
                                    placeholder="https://apps.apple.com/app/..."
                                    value={appStoreUrl}
                                    onChange={e => setAppStoreUrl(e.target.value)}
                                 />
                              </div>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[9px] font-black text-navy-300 uppercase tracking-[0.3em] block px-2">Google Play Store URL</label>
                              <div className="flex bg-navy-50 rounded-2xl shadow-inner overflow-hidden h-14">
                                 <span className="flex items-center px-5 bg-navy-100/50 text-navy-400"><span className="material-symbols-outlined text-xl">android</span></span>
                                 <input
                                    className="flex-1 bg-transparent border-none text-[11px] font-mono font-bold text-navy-900 focus:ring-0 placeholder:text-navy-100"
                                    placeholder="https://play.google.com/store/apps/..."
                                    value={playStoreUrl}
                                    onChange={e => setPlayStoreUrl(e.target.value)}
                                 />
                              </div>
                           </div>
                        </div>
                     </div>
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

               {/* Live Preview Column */}
               <div className="xl:col-span-5 space-y-8 sticky top-10">
                  <div className="flex items-center justify-between px-2">
                     <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight">Live Preview</h3>
                     <div className="flex bg-white rounded-2xl p-1.5 border border-navy-100 shadow-sm">
                        <button onClick={() => setPreviewWidth('desktop')} className={`px-5 py-2.5 rounded-xl transition-all ${previewWidth === 'desktop' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-navy-300 hover:text-primary'}`}><span className="material-symbols-outlined text-lg">desktop_windows</span></button>
                        <button onClick={() => setPreviewWidth('mobile')} className={`px-5 py-2.5 rounded-xl transition-all ${previewWidth === 'mobile' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-navy-300 hover:text-primary'}`}><span className="material-symbols-outlined text-lg">smartphone</span></button>
                     </div>
                  </div>

                  <div className={`rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] border-4 border-white bg-navy-950 ring-1 ring-navy-100 transition-all duration-300 ${previewWidth === 'mobile' ? 'max-w-[375px] mx-auto' : 'w-full'}`}>
                     {/* Browser UI */}
                     <div className="bg-navy-900 h-10 flex items-center gap-2.5 px-8 border-b border-white/5">
                        <div className="size-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                        <div className="size-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                        <div className="size-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                        <div className="ml-6 flex-1 h-5 bg-white/5 rounded-lg text-[8px] flex items-center px-4 font-black uppercase text-white/20 tracking-widest border border-white/5">{BRAND.domain}</div>
                     </div>

                     {/* Rendered Footer */}
                     <div className="p-16 flex flex-col justify-end min-h-[500px] relative overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "radial-gradient(#137fec 2px, transparent 2px)", backgroundSize: "40px 40px" }}></div>

                        {/* Newsletter preview */}
                        {newsletterEnabled && (
                           <div className="relative z-10 mb-16 p-8 bg-white/5 rounded-3xl border border-white/10">
                              <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">{newsletterTitle}</h4>
                              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-4">{newsletterSubtitle}</p>
                              <div className="flex gap-3">
                                 <div className="flex-1 h-10 bg-white/5 rounded-xl border border-white/10"></div>
                                 <div className="h-10 px-6 bg-primary rounded-xl flex items-center text-[9px] font-black text-white uppercase tracking-widest">Subscribe</div>
                              </div>
                           </div>
                        )}

                        <div className={`grid gap-16 relative z-10 mb-20 ${previewWidth === 'mobile' ? 'grid-cols-1' : `grid-cols-${Math.min(columns.length, 4)}`}`}>
                           {columns.map((col, ci) => (
                              <div key={ci} className="space-y-6">
                                 <h4 className="text-xs font-black text-white uppercase tracking-[0.25em] border-b border-white/10 pb-4">{col.title}</h4>
                                 <ul className="space-y-3">
                                    {col.links.map((l) => (
                                       <li key={l.label + l.href} className="text-xs font-bold text-white/40 uppercase tracking-widest hover:text-primary transition-colors cursor-pointer">{l.label}</li>
                                    ))}
                                 </ul>
                              </div>
                           ))}
                        </div>

                        {/* Contact info */}
                        {(contactEmail || contactPhone) && (
                           <div className="flex flex-wrap gap-8 relative z-10 mb-10">
                              {contactEmail && (
                                 <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">mail</span> {contactEmail}
                                 </span>
                              )}
                              {contactPhone && (
                                 <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">call</span> {contactPhone}
                                 </span>
                              )}
                           </div>
                        )}

                        <div className="h-px w-full bg-white/5 relative z-10 mb-10"></div>

                        <div className="flex flex-col gap-10 relative z-10">
                           <div className="flex items-center gap-6">
                              {socialLinks.filter(s => s.url).slice(0, 4).map((s, i) => (
                                 <div key={i} className="size-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:bg-primary hover:text-white hover:border-primary transition-all cursor-pointer">
                                    <span className="material-symbols-outlined text-lg">public</span>
                                 </div>
                              ))}
                              {socialLinks.filter(s => s.url).length === 0 && [1, 2, 3].map(i => (
                                 <div key={i} className="size-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40">
                                    <span className="material-symbols-outlined text-lg">public</span>
                                 </div>
                              ))}
                           </div>
                           <div className="space-y-6">
                              <p className="text-[10px] font-bold text-white/20 leading-relaxed uppercase tracking-widest">{copyrightText}</p>
                              <div className="flex flex-wrap gap-8">
                                 {legalLinks.map(l => (
                                    <span key={l.label} className="text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors cursor-pointer">{l.label}</span>
                                 ))}
                              </div>
                           </div>

                           {/* App download previews */}
                           {(appStoreUrl || playStoreUrl) && (
                              <div className="flex gap-4">
                                 {appStoreUrl && <div className="h-10 px-6 bg-white/10 rounded-xl border border-white/10 flex items-center gap-2 text-white/40 text-[9px] font-black uppercase tracking-widest"><span className="material-symbols-outlined text-sm">phone_iphone</span> App Store</div>}
                                 {playStoreUrl && <div className="h-10 px-6 bg-white/10 rounded-xl border border-white/10 flex items-center gap-2 text-white/40 text-[9px] font-black uppercase tracking-widest"><span className="material-symbols-outlined text-sm">android</span> Google Play</div>}
                              </div>
                           )}

                           {showPaymentIcons && (
                              <div className="flex gap-4 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700">
                                 <div className="h-7 w-12 bg-white/10 rounded-xl border border-white/10 flex items-center justify-center text-[7px] font-black text-white/60">VISA</div>
                                 <div className="h-7 w-12 bg-white/10 rounded-xl border border-white/10 flex items-center justify-center text-[7px] font-black text-white/60">MC</div>
                                 <div className="h-7 w-12 bg-white/10 rounded-xl border border-white/10 flex items-center justify-center text-[7px] font-black text-white/60">AMEX</div>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </main>
      </div>
   );
};

export default FooterManagement;
