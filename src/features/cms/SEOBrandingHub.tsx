import React, { useState, Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router';

// ─── Lazy-loaded Tab Panels ─────────────────────────────

const FaviconSEOAuditLog = lazy(() => import('./FaviconSEOAuditLog'));
const FAQCMS = lazy(() => import('./FAQCMS'));
const HealthCMS = lazy(() => import('./HealthCMS'));
const LegalCMS = lazy(() => import('./LegalCMS'));

// ─── Tab Configuration ──────────────────────────────────

interface TabConfig {
    id: string;
    label: string;
    icon: string;
    component: React.LazyExoticComponent<React.FC>;
    color: string;
}

const TABS: TabConfig[] = [
    { id: 'seo',     label: 'SEO & Branding',  icon: 'search',            component: FaviconSEOAuditLog, color: 'text-blue-600 bg-blue-50' },
    { id: 'faq',     label: 'FAQ Manager',      icon: 'quiz',              component: FAQCMS,             color: 'text-violet-600 bg-violet-50' },
    { id: 'health',  label: 'Health & Visa',    icon: 'health_and_safety', component: HealthCMS,          color: 'text-emerald-600 bg-emerald-50' },
    { id: 'legal',   label: 'Legal Pages',      icon: 'gavel',             component: LegalCMS,           color: 'text-red-600 bg-red-50' },
];

// ─── Loading Fallback ───────────────────────────────────

const TabLoader: React.FC = () => (
    <div className="flex items-center justify-center h-96">
        <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
    </div>
);

// ═══════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════

const SEOBrandingHub: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'seo';
    const [activeTab, setActiveTab] = useState(
        TABS.find(t => t.id === initialTab) ? initialTab : 'seo'
    );

    const switchTab = (id: string) => {
        setActiveTab(id);
        setSearchParams({ tab: id }, { replace: true });
    };

    const tab = TABS.find(t => t.id === activeTab)!;
    const TabComponent = tab.component;

    return (
        <div className="min-h-screen animate-in fade-in font-display">
            {/* ── Sticky Tab Bar ─────────────────────────── */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-navy-100">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Header Row */}
                    <div className="flex items-center justify-between py-4">
                        <div>
                            <h1 className="text-2xl font-black text-navy-950 tracking-tighter uppercase">SEO & Branding</h1>
                            <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest mt-0.5">
                                SEO • FAQ • Health & Visa • Legal
                            </p>
                        </div>
                    </div>

                    {/* Tab Strip */}
                    <div className="flex gap-1 overflow-x-auto pb-0 -mb-px scrollbar-hide">
                        {TABS.map(t => {
                            const isActive = activeTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => switchTab(t.id)}
                                    className={`group flex items-center gap-2 px-5 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${
                                        isActive
                                            ? `${t.color} border-current`
                                            : 'text-navy-400 border-transparent hover:text-navy-600 hover:border-navy-200'
                                    }`}
                                >
                                    <span className={`material-symbols-outlined transition-transform group-hover:scale-110 ${isActive ? '' : 'opacity-60'}`} style={{ fontSize: 18 }}>
                                        {t.icon}
                                    </span>
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Tab Content ─────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <Suspense fallback={<TabLoader />}>
                    <TabComponent />
                </Suspense>
            </div>
        </div>
    );
};

export default SEOBrandingHub;
