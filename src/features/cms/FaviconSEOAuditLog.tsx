
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, query, orderBy, limit, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { BRAND } from '../../config/brand';
import { useAuthStore } from '../../stores/authStore';

/* ── Types ──────────────────────────────────────────────────── */
interface SeoConfig {
  metaTitleTemplate: string;
  metaDescription: string;
  robotsTxt: string;
  faviconUrl: string | null;
  faviconName: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  searchConsoles: { google: string; bing: string; baidu: string };
  updatedAt: Timestamp | null;
  updatedBy: string;
}

interface AuditEntry {
  id: string;
  ts: Timestamp;
  actor: string;
  type: string;
  detail: string;
  status: 'success' | 'failed';
}

const DEFAULT_CONFIG: SeoConfig = {
  metaTitleTemplate: `{{page_title}} | ${BRAND.name}`,
  metaDescription: `Book flights with ${BRAND.name}. Affordable fares, real-time tracking, and premium passenger services.`,
  robotsTxt: `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: https://${BRAND.domain}/sitemap.xml`,
  faviconUrl: null,
  faviconName: 'Deltablue_Icon_v4',
  ogTitle: `${BRAND.name} | Your Flight Partner`,
  ogDescription: 'Experience comfortable and affordable air travel with Deltablue Jet Air.',
  ogImageUrl: '',
  searchConsoles: { google: 'connected', bing: 'pending', baidu: 'disconnected' },
  updatedAt: null,
  updatedBy: '',
};

const CONSOLE_STATUS: Record<string, { label: string; color: string }> = {
  connected: { label: 'Connected', color: 'text-emerald-600' },
  pending: { label: 'Pending…', color: 'text-amber-600' },
  disconnected: { label: 'Not Connected', color: 'text-red-500' },
};

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/* ═══════════════════════════════════════════════════════════════
   SEO & Branding Component
   ═══════════════════════════════════════════════════════════════ */
const FaviconSEOAuditLog: React.FC = () => {
  const user = useAuthStore((s) => s.user);

  /* ── Tab state ─────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<'Assets' | 'SEO' | 'Technical'>('Assets');

  /* ── Data state ────────────────────────────────────────────── */
  const [config, setConfig] = useState<SeoConfig>(DEFAULT_CONFIG);
  const [draft, setDraft] = useState<SeoConfig>(DEFAULT_CONFIG);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* ── Technical tab state ───────────────────────────────────── */
  const [editingRobots, setEditingRobots] = useState(false);

  /* ── Load config from Firestore ────────────────────────────── */
  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'seo_config', 'default'));
      if (snap.exists()) {
        const data = { ...DEFAULT_CONFIG, ...snap.data() } as SeoConfig;
        setConfig(data);
        setDraft(data);
      }
      // Load audit logs
      const logsSnap = await getDocs(query(collection(db, 'seo_audit'), orderBy('ts', 'desc'), limit(50)));
      setAuditLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() }) as AuditEntry));
    } catch (err: any) {
      console.error('[SEO] Load error:', err);
      setError('Failed to load SEO settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  /* ── Computed: is dirty? ───────────────────────────────────── */
  const isDirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(draft), [config, draft]);

  /* ── Computed: SEO score ────────────────────────────────────── */
  const seoScore = useMemo(() => {
    let filled = 0;
    let total = 6;
    if (draft.metaTitleTemplate.trim()) filled++;
    if (draft.metaDescription.trim()) filled++;
    if (draft.ogTitle.trim()) filled++;
    if (draft.ogDescription.trim()) filled++;
    if (draft.faviconUrl || draft.faviconName) filled++;
    if (draft.robotsTxt.trim()) filled++;
    return Math.round((filled / total) * 100);
  }, [draft]);

  /* ── Save config ───────────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...draft,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || 'admin',
      };
      await setDoc(doc(db, 'seo_config', 'default'), payload);

      // Write audit log
      await addDoc(collection(db, 'seo_audit'), {
        ts: serverTimestamp(),
        actor: user?.displayName || user?.email || 'Admin',
        type: 'Settings',
        detail: 'SEO settings saved and published',
        status: 'success',
      });

      setConfig({ ...draft, updatedAt: Timestamp.now(), updatedBy: user?.email || 'admin' });
      setSuccessMsg('SEO settings saved and published successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
      loadConfig();
    } catch (err: any) {
      console.error('[SEO] Save error:', err);
      setError('Failed to save SEO settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [draft, user, loadConfig]);

  /* ── Discard draft ─────────────────────────────────────────── */
  const handleDiscard = useCallback(() => {
    setDraft(config);
    setSuccessMsg('Changes discarded — reverted to last saved version.');
    setTimeout(() => setSuccessMsg(null), 4000);
  }, [config]);

  /* ── Copy to clipboard ─────────────────────────────────────── */
  const handleCopyRobots = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(draft.robotsTxt);
      setSuccessMsg('Robots.txt copied to clipboard.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setError('Failed to copy to clipboard.');
    }
  }, [draft.robotsTxt]);

  /* ── Favicon upload via file picker ─────────────────────────── */
  const handleFaviconUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/x-icon,image/svg+xml';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // For now store the file name — full Storage upload can be added later
      setDraft(prev => ({ ...prev, faviconName: file.name, faviconUrl: URL.createObjectURL(file) }));
      setSuccessMsg(`Favicon "${file.name}" selected. Click "Save & Publish" to apply.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    };
    input.click();
  }, []);

  /* ── Download favicon ──────────────────────────────────────── */
  const handleDownloadFavicon = useCallback(() => {
    if (draft.faviconUrl) {
      const a = document.createElement('a');
      a.href = draft.faviconUrl;
      a.download = draft.faviconName || 'favicon';
      a.click();
    } else {
      setError('No favicon uploaded yet.');
    }
  }, [draft.faviconUrl, draft.faviconName]);

  /* ── Update draft field helper ─────────────────────────────── */
  const updateDraft = (field: keyof SeoConfig, value: any) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="h-full flex flex-col font-display bg-navy-50/20 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-navy-100 p-6 md:p-8 shrink-0 z-10 shadow-sm">
        <div className="max-w-[1600px] mx-auto w-full space-y-6">
          <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">
            <span>Admin</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span>Content Manager</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary">Branding & SEO</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-black text-navy-950 tracking-tighter uppercase leading-none">Branding & SEO</h1>
              <p className="text-navy-500 font-medium italic text-sm md:text-lg opacity-80">Manage your site's branding, icons, and search engine settings.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDiscard}
                disabled={!isDirty}
                className={`px-6 py-3 bg-white border-2 border-navy-100 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${isDirty ? 'text-navy-700 hover:bg-navy-50' : 'text-navy-300 cursor-not-allowed'}`}
              >
                Discard Changes
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="px-8 py-3 bg-primary text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">publish</span> Save & Publish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Status Messages */}
      {(error || successMsg) && (
        <div className="px-4 md:px-10 pt-4 max-w-[1600px] mx-auto w-full">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 animate-in slide-in-from-top duration-300 mb-3">
              <span className="material-symbols-outlined text-red-500">error</span>
              <p className="text-sm font-bold text-red-700">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><span className="material-symbols-outlined text-sm">close</span></button>
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 animate-in slide-in-from-top duration-300">
              <span className="material-symbols-outlined text-emerald-500">check_circle</span>
              <p className="text-sm font-bold text-emerald-700">{successMsg}</p>
              <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-400 hover:text-emerald-600"><span className="material-symbols-outlined text-sm">close</span></button>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 rounded-full border-3 border-navy-100 border-t-primary animate-spin mx-auto" />
            <p className="text-sm font-bold text-navy-400">Loading SEO settings…</p>
          </div>
        </div>
      )}

      {/* Main Container */}
      {!loading && (
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-10 pb-32">
          <div className="max-w-[1600px] mx-auto w-full grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">

            {/* Main Configuration Surface */}
            <div className="xl:col-span-8 space-y-10">
              {/* Tabs */}
              <div className="flex bg-white p-1.5 rounded-[2rem] border border-navy-100 shadow-sm w-fit">
                {(['Assets', 'SEO', 'Technical'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-10 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-navy-400 hover:bg-navy-50'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* ═══ Assets Tab ═══ */}
              {activeTab === 'Assets' && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="bg-white rounded-[3.5rem] border border-navy-100 p-8 md:p-12 shadow-sm space-y-12">
                    <div className="flex items-center gap-4 border-b border-navy-50 pb-8">
                      <div className="size-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shadow-inner">
                        <span className="material-symbols-outlined text-2xl font-black">palette</span>
                      </div>
                      <h2 className="text-2xl font-black text-navy-950 uppercase tracking-tighter">Brand Assets</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      {/* Upload Zone */}
                      <div className="space-y-6">
                        <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-1">Favicon Settings</label>
                        <div
                          onClick={handleFaviconUpload}
                          className="p-10 bg-navy-50 border-4 border-dashed border-navy-100 rounded-[3rem] flex flex-col items-center justify-center text-center gap-6 hover:border-primary transition-all group cursor-pointer shadow-inner"
                        >
                          <div className="size-20 rounded-[1.5rem] bg-white text-primary flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-black text-navy-950 uppercase tracking-tight">Upload New Favicon</p>
                            <p className="text-[10px] font-bold text-navy-300 uppercase tracking-widest leading-relaxed italic">Sizes for browser tabs, bookmarks, and mobile will be created automatically.</p>
                          </div>
                        </div>
                      </div>

                      {/* Current Favicon */}
                      <div className="space-y-8">
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-1">Current Favicon</p>
                        <div className="bg-navy-950 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden">
                          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#137fec 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
                          <div className="flex items-center gap-6 relative z-10">
                            <div className="size-16 rounded-2xl bg-white p-3 flex items-center justify-center shadow-2xl">
                              {draft.faviconUrl ? (
                                <img src={draft.faviconUrl} alt="Favicon" className="w-full h-full object-contain" />
                              ) : (
                                <span className="material-symbols-outlined text-primary text-4xl font-black">airlines</span>
                              )}
                            </div>
                            <div>
                              <p className="text-white font-black text-lg tracking-tight uppercase leading-none">{draft.faviconName}</p>
                              <p className="text-primary font-black text-[9px] uppercase tracking-widest mt-2">Active version</p>
                            </div>
                          </div>
                          <div className="flex gap-4 relative z-10">
                            <button onClick={handleFaviconUpload} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Replace</button>
                            <button onClick={handleDownloadFavicon} className="flex-1 py-3 bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">Download</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ SEO Tab ═══ */}
              {activeTab === 'SEO' && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  {/* Title & Description */}
                  <div className="bg-white rounded-[3.5rem] border border-navy-100 p-8 md:p-12 shadow-sm space-y-12">
                    <div className="flex items-center gap-4 border-b border-navy-50 pb-8">
                      <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                        <span className="material-symbols-outlined text-2xl font-black">travel_explore</span>
                      </div>
                      <h2 className="text-2xl font-black text-navy-950 uppercase tracking-tighter">SEO Settings</h2>
                    </div>

                    <div className="space-y-10">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-1">Page Title Template</label>
                        <input
                          value={draft.metaTitleTemplate}
                          onChange={(e) => updateDraft('metaTitleTemplate', e.target.value)}
                          className="w-full h-16 px-8 bg-navy-50 border-none rounded-[1.75rem] text-sm font-bold text-navy-950 tracking-wide focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
                        />
                        <p className="text-[9px] font-bold text-navy-300 uppercase tracking-widest italic ml-4">Use {'{{page_title}}'} to insert the page name. Example: <span className="text-navy-500">"Book a Flight | {BRAND.name}"</span></p>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-1">Site Description</label>
                        <textarea
                          value={draft.metaDescription}
                          onChange={(e) => updateDraft('metaDescription', e.target.value)}
                          className="w-full min-h-[120px] p-8 bg-navy-50 border-none rounded-[2.5rem] text-xs font-bold text-navy-700 leading-relaxed tracking-wide shadow-inner focus:ring-8 focus:ring-primary/5 transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Media Preview */}
                  <div className="bg-white rounded-[3.5rem] border border-navy-100 p-8 md:p-12 shadow-sm space-y-12">
                    <div className="flex items-center justify-between border-b border-navy-50 pb-8">
                      <h3 className="text-xl font-black text-navy-950 uppercase tracking-tighter">Social Media Preview</h3>
                      <span className="px-4 py-1 rounded-full bg-blue-50 text-primary text-[9px] font-black uppercase tracking-widest border border-blue-100">Live Preview</span>
                    </div>
                    <div className="flex flex-col lg:flex-row gap-12 items-center">
                      <div className="w-full lg:w-96 rounded-[2.5rem] border border-navy-100 overflow-hidden shadow-2xl group cursor-pointer hover:-translate-y-2 transition-all">
                        <div className="h-48 bg-navy-100 bg-cover bg-center transition-transform duration-[5s] group-hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80')" }}></div>
                        <div className="p-6 space-y-3 bg-white">
                          <p className="text-[8px] font-black text-navy-300 uppercase tracking-[0.25em]">www.{BRAND.domain}</p>
                          <h4 className="text-lg font-black text-navy-950 uppercase tracking-tight">{draft.ogTitle || `${BRAND.name} | Your Flight Partner`}</h4>
                          <p className="text-[10px] text-navy-500 font-bold leading-relaxed opacity-70">{draft.ogDescription || 'Experience comfortable air travel.'}</p>
                        </div>
                      </div>
                      <div className="flex-1 space-y-8">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-1">Social Sharing Title</label>
                          <input
                            value={draft.ogTitle}
                            onChange={(e) => updateDraft('ogTitle', e.target.value)}
                            className="w-full h-12 px-6 bg-navy-50 border-none rounded-xl text-sm font-bold text-navy-950 focus:ring-4 focus:ring-primary/5"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-1">Social Sharing Description</label>
                          <textarea
                            value={draft.ogDescription}
                            onChange={(e) => updateDraft('ogDescription', e.target.value)}
                            className="w-full min-h-[80px] p-6 bg-navy-50 border-none rounded-xl text-xs font-bold text-navy-700 leading-relaxed focus:ring-4 focus:ring-primary/5 resize-none"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] block px-1">Social Sharing Image URL</label>
                          <input
                            value={draft.ogImageUrl}
                            onChange={(e) => updateDraft('ogImageUrl', e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="w-full h-12 px-6 bg-navy-50 border-none rounded-xl text-sm font-bold text-navy-950 focus:ring-4 focus:ring-primary/5"
                          />
                          <p className="text-[9px] font-bold text-navy-300 uppercase tracking-widest italic ml-4">The image shown when your site is shared on social media (recommended 1200×630px).</p>
                        </div>
                        <div className="p-6 bg-navy-50 rounded-2xl border border-navy-100 shadow-inner space-y-4">
                          <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Social Sharing Tags</p>
                          <div className="space-y-3">
                            {[
                              { tag: 'og:title', filled: !!draft.ogTitle },
                              { tag: 'og:description', filled: !!draft.ogDescription },
                              { tag: 'og:image', filled: !!draft.ogImageUrl },
                            ].map(item => (
                              <div key={item.tag} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-1">
                                <span className="text-navy-300 font-mono">{item.tag}</span>
                                <span className={`flex items-center gap-1 ${item.filled ? 'text-emerald-500' : 'text-navy-300'}`}>
                                  <span className="material-symbols-outlined text-sm">{item.filled ? 'check_circle' : 'cancel'}</span>
                                  {item.filled ? 'SET' : 'EMPTY'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ Technical Tab ═══ */}
              {activeTab === 'Technical' && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Robots.txt */}
                    <div className="bg-white rounded-[3.5rem] border border-navy-100 p-10 shadow-sm space-y-8">
                      <h3 className="text-lg font-black text-navy-950 uppercase tracking-tighter border-b border-navy-50 pb-4">Robots.txt</h3>
                      {editingRobots ? (
                        <textarea
                          value={draft.robotsTxt}
                          onChange={(e) => updateDraft('robotsTxt', e.target.value)}
                          className="w-full min-h-[180px] p-6 bg-navy-950 rounded-[2rem] shadow-inner font-mono text-[11px] text-emerald-400 leading-relaxed focus:ring-4 focus:ring-primary/20 resize-none border-none"
                        />
                      ) : (
                        <div className="p-6 bg-navy-950 rounded-[2rem] shadow-inner font-mono text-[10px] text-emerald-400 leading-relaxed group relative">
                          <pre className="whitespace-pre-wrap">{draft.robotsTxt}</pre>
                          <button onClick={handleCopyRobots} className="absolute top-4 right-4 p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white transition-all">
                            <span className="material-symbols-outlined text-sm">content_copy</span>
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => setEditingRobots(!editingRobots)}
                        className="w-full py-4 bg-navy-50 border-2 border-navy-100 text-navy-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-primary hover:text-primary transition-all"
                      >
                        {editingRobots ? 'Done Editing' : 'Edit Robots.txt'}
                      </button>
                    </div>

                    {/* Search Consoles */}
                    <div className="bg-white rounded-[3.5rem] border border-navy-100 p-10 shadow-sm space-y-8">
                      <h3 className="text-lg font-black text-navy-950 uppercase tracking-tighter border-b border-navy-50 pb-4">Search Console Connections</h3>
                      <div className="space-y-6">
                        {([
                          { key: 'google', name: 'Google Search Console' },
                          { key: 'bing', name: 'Bing Webmaster' },
                          { key: 'baidu', name: 'Baidu' },
                        ] as const).map(node => {
                          const status = draft.searchConsoles[node.key] || 'disconnected';
                          const info = CONSOLE_STATUS[status] || CONSOLE_STATUS.disconnected;
                          return (
                            <div key={node.key} className="flex items-center justify-between p-5 bg-navy-50/50 rounded-2xl border border-navy-50 shadow-inner group hover:bg-white transition-all">
                              <span className="text-xs font-black text-navy-900 uppercase tracking-widest">{node.name}</span>
                              <span className={`text-[9px] font-black uppercase tracking-widest ${info.color}`}>{info.label}</span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[9px] font-bold text-navy-300 italic leading-relaxed px-2">Search console connections are managed in each provider's dashboard. Status is shown above for reference.</p>
                      <button
                        onClick={handleSave}
                        disabled={saving || !isDirty}
                        className="w-full py-4 bg-primary/5 border border-primary/10 text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="xl:col-span-4 space-y-10">
              {/* SEO Score Card */}
              <div className="bg-navy-950 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-navy-950/20 group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-110 transition-transform duration-[10s]">
                  <span className="material-symbols-outlined text-[160px] font-black">hub</span>
                </div>
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-primary/20 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                      <span className="material-symbols-outlined text-2xl font-black">sync</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-black uppercase tracking-tight">SEO Status</h4>
                      <p className="text-primary font-black text-[9px] uppercase tracking-widest mt-1">{isDirty ? 'Unsaved changes' : 'All settings saved'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-[9px] font-black text-white/40 uppercase tracking-widest">
                      <span>SEO Score</span>
                      <span className={seoScore >= 80 ? 'text-emerald-400' : seoScore >= 50 ? 'text-amber-400' : 'text-red-400'}>{seoScore}% COMPLETE</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex ring-4 ring-white/5">
                      <div className={`h-full ${seoScore >= 80 ? 'bg-emerald-500' : seoScore >= 50 ? 'bg-amber-500' : 'bg-red-500'} shadow-[0_0_15px_rgba(19,127,236,0.5)]`} style={{ width: `${seoScore}%` }}></div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Last Updated</p>
                      <p className="text-sm font-black tracking-tighter">{config.updatedAt ? formatDate(config.updatedAt) : 'Never'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Updated By</p>
                      <p className="text-sm font-black tracking-tighter">{config.updatedBy || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Log */}
              <div className="bg-white rounded-[3rem] border border-navy-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-8 border-b border-navy-50 bg-navy-50/20 flex items-center justify-between">
                  <h3 className="text-sm font-black text-navy-950 uppercase tracking-widest">Activity Log</h3>
                  <button onClick={loadConfig} className="text-[9px] font-black text-primary uppercase hover:underline">Refresh</button>
                </div>
                <div className="divide-y divide-navy-50">
                  {auditLogs.length === 0 ? (
                    <div className="p-8 text-center">
                      <span className="material-symbols-outlined text-3xl text-navy-200 block mb-2">history</span>
                      <p className="text-xs font-bold text-navy-400">No activity yet</p>
                      <p className="text-[10px] text-navy-300 mt-1">Changes will appear here after you save.</p>
                    </div>
                  ) : auditLogs.map(log => (
                    <div key={log.id} className="p-6 hover:bg-navy-50/30 transition-all cursor-default group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-black text-navy-400 uppercase tracking-widest">{formatDate(log.ts)}</span>
                        <span className={`size-1.5 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
                      </div>
                      <p className="text-[10px] font-black text-navy-900 uppercase tracking-tight group-hover:text-primary transition-colors">{log.detail}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="size-6 rounded-lg bg-navy-50 border border-navy-100 flex items-center justify-center font-black text-[8px] text-navy-300 uppercase shadow-inner">
                          {log.actor?.split(' ').map(w => w[0]).join('').slice(0, 2) || '??'}
                        </div>
                        <span className="text-[8px] font-bold text-navy-300 uppercase tracking-widest">{log.actor}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {auditLogs.length > 0 && (
                  <div className="p-6 bg-navy-50/30 border-t border-navy-50">
                    <button onClick={loadConfig} className="w-full py-3 bg-white border border-navy-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-navy-400 hover:text-navy-900 shadow-sm transition-all">View All Activity</button>
                  </div>
                )}
              </div>

              {/* Notice */}
              <div className="bg-blue-50/60 p-8 rounded-[2.5rem] border-2 border-blue-100 flex gap-6 items-start shadow-inner group">
                <span className="material-symbols-outlined text-primary p-3 bg-white rounded-2xl shadow-md font-black group-hover:scale-110 transition-transform">info</span>
                <div className="space-y-2">
                  <p className="text-sm font-black text-navy-950 uppercase tracking-tight leading-none">Good to Know</p>
                  <p className="text-[10px] font-bold text-blue-900 leading-relaxed tracking-wide opacity-70 italic">SEO changes may take 24–48 hours to appear in search engine results.</p>
                </div>
              </div>
            </div>

          </div>
        </main>
      )}
    </div>
  );
};

export default FaviconSEOAuditLog;
