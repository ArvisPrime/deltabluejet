
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BRAND } from '../../config/brand';
import {
  getCmsPages,
  updateCmsPage,
  createCmsPage,
  deleteCmsPage,
  uploadPageImage,
  seedDefaultPages,
} from '../../services/cms';
import type { CmsPageDoc, CmsPageStatus } from '../../types/firestore';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';

/* ── Helpers ────────────────────────────────────────────────── */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const STATUS_STYLES: Record<CmsPageStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Draft' },
  published: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Published' },
  archived: { bg: 'bg-navy-100 border-navy-200', text: 'text-navy-500', label: 'Archived' },
};

const fmtDate = (ts: any) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/* ═════════════════════════════════════════════════════════════
   Page Editor
   ═════════════════════════════════════════════════════════════ */
const PageEditor: React.FC = () => {
  const { user } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);

  /* ── State ──────────────────────────────────────────────── */
  const [pages, setPages] = useState<CmsPageDoc[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Editable fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [parentPage, setParentPage] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<CmsPageStatus>('draft');

  // Tag input
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Load pages ─────────────────────────────────────────── */
  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      await seedDefaultPages();
      const data = await getCmsPages();
      setPages(data);
      return data;
    } catch (err) {
      console.error('Failed to load CMS pages:', err);
      addToast('Failed to load pages', 'error');
      return [];
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadPages().then((data) => {
      if (data.length > 0) {
        selectPage(data[0]);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Select a page → populate fields ────────────────────── */
  const selectPage = (page: CmsPageDoc) => {
    setSelectedPageId(page.id);
    setTitle(page.title);
    setSlug(page.slug);
    setContent(page.content || '');
    setMetaTitle(page.metaTitle || '');
    setMetaDescription(page.metaDescription || '');
    setFeaturedImage(page.featuredImage || null);
    setParentPage(page.parentPage || null);
    setTags(page.tags || []);
    setStatus(page.status);
  };

  /* ── Save (draft or publish) ────────────────────────────── */
  const handleSave = async (newStatus?: CmsPageStatus) => {
    if (!selectedPageId) return;
    setSaving(true);
    try {
      await updateCmsPage(selectedPageId, {
        title,
        slug,
        content,
        metaTitle,
        metaDescription,
        featuredImage,
        parentPage,
        tags,
        status: newStatus || status,
      });
      if (newStatus) setStatus(newStatus);
      const data = await loadPages();
      const refreshed = data.find((p) => p.id === selectedPageId);
      if (refreshed) selectPage(refreshed);
      addToast(newStatus === 'published' ? 'Page published' : 'Draft saved', 'success');
    } catch (err) {
      console.error('Save failed:', err);
      addToast('Failed to save page', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── Create new page ────────────────────────────────────── */
  const handleCreate = async () => {
    setCreating(true);
    try {
      const newId = await createCmsPage({
        title: 'Untitled Page',
        slug: 'untitled-page',
        content: '',
        metaTitle: '',
        metaDescription: '',
        featuredImage: null,
        parentPage: null,
        tags: [],
        status: 'draft',
        author: user?.email || 'admin',
      });
      const data = await loadPages();
      const newPage = data.find((p) => p.id === newId);
      if (newPage) selectPage(newPage);
      addToast('New page created', 'success');
    } catch (err) {
      console.error('Create failed:', err);
      addToast('Failed to create page', 'error');
    } finally {
      setCreating(false);
    }
  };

  /* ── Delete page ────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!selectedPageId) return;
    if (!window.confirm('Are you sure you want to delete this page? This cannot be undone.')) return;
    try {
      await deleteCmsPage(selectedPageId);
      setSelectedPageId(null);
      const data = await loadPages();
      if (data.length > 0) selectPage(data[0]);
      addToast('Page deleted', 'success');
    } catch (err) {
      console.error('Delete failed:', err);
      addToast('Failed to delete page', 'error');
    }
  };

  /* ── Image upload ───────────────────────────────────────── */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPageId) return;
    setUploading(true);
    try {
      const url = await uploadPageImage(file, selectedPageId);
      setFeaturedImage(url);
      await updateCmsPage(selectedPageId, { featuredImage: url });
      addToast('Image uploaded', 'success');
    } catch (err) {
      console.error('Upload failed:', err);
      addToast('Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  /* ── Tag management ─────────────────────────────────────── */
  const addTag = () => {
    const tag = newTag.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag('');
      setShowTagInput(false);
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  /* ── Preview link ───────────────────────────────────────── */
  const previewUrl = slug ? `/${slug}` : '#';

  const selectedPage = pages.find((p) => p.id === selectedPageId) || null;

  /* ── Loading state ──────────────────────────────────────── */
  if (loading && pages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin size-8 border-3 border-navy-200 border-t-primary rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col font-display bg-navy-50/20 overflow-hidden">
      {/* Top Action Header */}
      <header className="bg-white border-b border-navy-100 h-20 px-10 flex items-center justify-between shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">
            <span>Content Management</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary">Page Editor</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {selectedPageId && (
            <>
              <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${STATUS_STYLES[status].bg} ${STATUS_STYLES[status].text}`}>
                {STATUS_STYLES[status].label}
              </span>
              <button
                onClick={() => handleSave()}
                disabled={saving}
                className="h-11 px-6 rounded-xl bg-white border border-navy-100 text-navy-700 text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <div className="animate-spin size-3 border-2 border-navy-300 border-t-navy-700 rounded-full" /> : <span className="material-symbols-outlined text-sm">save</span>}
                Save Draft
              </button>
              <button
                onClick={() => window.open(previewUrl, '_blank')}
                className="h-11 px-6 rounded-xl bg-white border border-navy-100 text-navy-700 text-[10px] font-black uppercase tracking-widest hover:bg-navy-50 transition-all shadow-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">visibility</span> Preview
              </button>
              <button
                onClick={() => handleSave('published')}
                disabled={saving}
                className="h-11 px-8 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                Publish
              </button>
            </>
          )}
        </div>
      </header>

      {/* Workspace Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left — Page List Sidebar */}
        <aside className="w-72 bg-white border-r border-navy-100 overflow-y-auto custom-scrollbar shrink-0 flex flex-col">
          <div className="p-6 border-b border-navy-50 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em]">All Pages</h3>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
            >
              <span className="material-symbols-outlined text-lg">{creating ? 'hourglass_top' : 'add'}</span>
            </button>
          </div>
          <div className="flex-1 p-3 space-y-1">
            {pages.map((page) => {
              const isActive = page.id === selectedPageId;
              const st = STATUS_STYLES[page.status];
              return (
                <button
                  key={page.id}
                  onClick={() => selectPage(page)}
                  className={`w-full text-left p-4 rounded-2xl transition-all ${isActive ? 'bg-primary/5 border border-primary/20 shadow-sm' : 'hover:bg-navy-50 border border-transparent'}`}
                >
                  <p className={`text-sm font-black truncate ${isActive ? 'text-primary' : 'text-navy-950'}`}>{page.title || 'Untitled'}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${st.bg} ${st.text}`}>{st.label}</span>
                    <span className="text-[8px] font-bold text-navy-300">{fmtDate(page.updatedAt)}</span>
                  </div>
                </button>
              );
            })}
            {pages.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-xs text-navy-300 font-bold">No pages yet.</p>
                <button onClick={handleCreate} className="mt-3 text-xs font-black text-primary underline">Create your first page</button>
              </div>
            )}
          </div>
        </aside>

        {/* Center — Editor */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-12 flex justify-center pb-32">
          {selectedPageId ? (
            <div className="w-full max-w-4xl flex flex-col gap-10">
              {/* Page Title + Subtitle */}
              <div className="space-y-4">
                <input
                  className="w-full bg-transparent border-none p-0 text-5xl font-black text-navy-950 placeholder:text-navy-100 focus:ring-0 uppercase tracking-tighter"
                  placeholder="Enter Page Title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setSlug(slugify(e.target.value));
                    if (!metaTitle) setMetaTitle(e.target.value);
                  }}
                />
              </div>

              {/* Content Editor */}
              <div className="bg-white rounded-[3.5rem] border border-navy-100 shadow-2xl min-h-[600px] flex flex-col overflow-hidden">
                {/* Simple Toolbar */}
                <div className="sticky top-0 z-10 flex items-center gap-4 p-4 px-10 border-b border-navy-50 bg-white/80 backdrop-blur-xl">
                  <p className="text-[9px] font-black text-navy-300 uppercase tracking-[0.2em]">Page Content (HTML)</p>
                  <div className="flex-1" />
                  <span className="text-[9px] font-bold text-navy-200">{content.length} characters</span>
                </div>

                {/* Content Area */}
                <textarea
                  className="flex-1 p-10 text-sm font-medium text-navy-800 leading-relaxed outline-none resize-none min-h-[500px] font-mono"
                  placeholder="Enter your page content here... HTML is supported."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              {/* Delete Page */}
              <div className="flex justify-end">
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Delete Page
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <span className="material-symbols-outlined text-6xl text-navy-100 mb-4">article</span>
              <p className="text-lg font-black text-navy-300">No page selected</p>
              <p className="text-xs text-navy-300 mt-1">Select a page from the list or create a new one.</p>
            </div>
          )}
        </div>

        {/* Right — Settings Sidebar */}
        {selectedPageId && (
          <aside className="w-96 bg-white border-l border-navy-100 overflow-y-auto custom-scrollbar shrink-0 flex flex-col shadow-2xl z-10">
            <div className="p-8 border-b border-navy-50 bg-navy-50/30">
              <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight">Page Settings</h3>
            </div>

            <div className="p-8 space-y-12">
              {/* Page URL */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-1">Page URL</label>
                <div className="flex bg-navy-50 rounded-2xl border-none shadow-inner overflow-hidden">
                  <span className="inline-flex items-center px-5 bg-navy-100/50 text-navy-300 text-[10px] font-black uppercase tracking-widest border-r border-navy-50">
                    /
                  </span>
                  <input
                    className="flex-1 min-w-0 block w-full px-5 py-4 bg-transparent border-none text-navy-950 text-sm font-black tracking-widest focus:ring-8 focus:ring-primary/5 transition-all"
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => window.open(`/${slug}`, '_blank')}
                  className="text-[9px] font-black text-primary uppercase underline tracking-widest block px-1"
                >
                  View Live Page
                </button>
              </div>

              {/* Featured Image */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-1">Featured Image</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {featuredImage ? (
                  <div className="relative group/img rounded-[2.5rem] overflow-hidden border border-navy-100 shadow-sm">
                    <img src={featuredImage} alt="Featured" className="w-full h-40 object-cover" />
                    <div className="absolute inset-0 bg-navy-950/0 group-hover/img:bg-navy-950/40 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover/img:opacity-100">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-5 py-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-xl text-[9px] font-black uppercase tracking-widest text-navy-950 hover:scale-105 transition-all"
                      >
                        Replace
                      </button>
                      <button
                        onClick={() => setFeaturedImage(null)}
                        className="px-5 py-2.5 bg-red-500/90 backdrop-blur-md rounded-xl shadow-xl text-[9px] font-black uppercase tracking-widest text-white hover:scale-105 transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-4 border-dashed border-navy-100 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group shadow-inner"
                  >
                    <div className="size-16 rounded-[1.5rem] bg-white text-primary flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-3xl">
                        {uploading ? 'hourglass_top' : 'add_photo_alternate'}
                      </span>
                    </div>
                    <p className="text-[10px] font-black text-navy-950 uppercase tracking-widest">
                      {uploading ? 'Uploading…' : 'Upload Image'}
                    </p>
                    <p className="text-[8px] font-bold text-navy-300 uppercase mt-2 tracking-[0.2em]">Accepts SVG, PNG, JPG</p>
                  </div>
                )}
              </div>

              {/* SEO Settings */}
              <div className="space-y-8 pt-8 border-t border-navy-50">
                <h3 className="text-sm font-black text-navy-950 uppercase tracking-[0.3em] flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">search</span>
                  SEO Settings
                </h3>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Meta Title</label>
                      <span className="text-[8px] font-black text-navy-200">{metaTitle.length}/60</span>
                    </div>
                    <input
                      className="block w-full rounded-2xl border-none bg-navy-50 text-navy-950 py-4 px-6 text-sm font-bold tracking-wide focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
                      type="text"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder={`Page Title | ${BRAND.name}`}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Meta Description</label>
                      <span className="text-[8px] font-black text-navy-200">{metaDescription.length}/160</span>
                    </div>
                    <textarea
                      className="block w-full rounded-[2rem] border-none bg-navy-50 text-navy-950 py-5 px-6 text-xs font-bold leading-relaxed focus:ring-8 focus:ring-primary/5 transition-all shadow-inner resize-none h-28"
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="A brief description of this page for search engines..."
                    />
                  </div>

                  {/* SEO Preview */}
                  <div className="bg-white rounded-3xl p-6 border-2 border-navy-50 shadow-sm space-y-4">
                    <p className="text-[8px] font-black text-navy-300 uppercase tracking-[0.3em] pb-3 border-b border-navy-50">Search Preview</p>
                    <div className="space-y-2">
                      <p className="text-blue-700 text-lg font-bold leading-tight truncate">
                        {metaTitle || title || 'Page Title'} | {BRAND.shortName}
                      </p>
                      <p className="text-emerald-700 text-xs font-medium truncate">
                        www.{BRAND.domain} › {slug || 'page-url'}
                      </p>
                      <p className="text-navy-400 text-xs leading-relaxed line-clamp-2">
                        {metaDescription || 'Add a meta description to see a preview here.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page Organization */}
              <div className="space-y-8 pt-8 border-t border-navy-50">
                <h3 className="text-sm font-black text-navy-950 uppercase tracking-[0.3em]">Page Organization</h3>
                <div className="space-y-8">
                  {/* Parent Page */}
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest block px-1">Parent Page</label>
                    <div className="relative">
                      <select
                        className="block w-full rounded-2xl border-none bg-navy-50 py-4 px-6 text-xs font-black uppercase tracking-widest text-navy-950 focus:ring-8 focus:ring-primary/5 transition-all appearance-none shadow-inner"
                        value={parentPage || ''}
                        onChange={(e) => setParentPage(e.target.value || null)}
                      >
                        <option value="">(None — Top Level)</option>
                        {pages
                          .filter((p) => p.id !== selectedPageId)
                          .map((p) => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                          ))}
                      </select>
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-navy-200 material-symbols-outlined pointer-events-none">expand_more</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest block px-1">Tags</label>
                    <div className="flex flex-wrap gap-3">
                      {tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 shadow-sm">
                          {tag}
                          <button onClick={() => removeTag(tag)} className="text-primary hover:text-red-500 transition-colors">
                            <span className="material-symbols-outlined text-sm font-black">close</span>
                          </button>
                        </span>
                      ))}
                      {showTagInput ? (
                        <div className="inline-flex items-center gap-1">
                          <input
                            className="h-8 px-3 rounded-lg border border-primary/30 bg-white text-xs font-bold text-navy-950 outline-none focus:ring-2 focus:ring-primary/20 w-28"
                            placeholder="Tag name"
                            autoFocus
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') addTag(); if (e.key === 'Escape') { setShowTagInput(false); setNewTag(''); } }}
                          />
                          <button onClick={addTag} className="size-8 rounded-lg bg-primary text-white flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm">check</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowTagInput(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-navy-50 text-navy-400 border border-navy-100 hover:bg-navy-100 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">add</span> Add Tag
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Page Status */}
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-navy-400 uppercase tracking-widest block px-1">Page Status</label>
                    <div className="relative">
                      <select
                        className="block w-full rounded-2xl border-none bg-navy-50 py-4 px-6 text-xs font-black uppercase tracking-widest text-navy-950 focus:ring-8 focus:ring-primary/5 transition-all appearance-none shadow-inner"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as CmsPageStatus)}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-navy-200 material-symbols-outlined pointer-events-none">expand_more</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
};

export default PageEditor;
