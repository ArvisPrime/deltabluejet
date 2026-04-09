import React, { useState, Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router';

// ─── Lazy-loaded Tab Panels ─────────────────────────────

const LandingPageEditor = lazy(() => import('./LandingPageEditor'));
const PageEditor = lazy(() => import('./PageEditor'));
const HeaderManagement = lazy(() => import('./HeaderManagement'));
const FooterManagement = lazy(() => import('./FooterManagement'));
const MenuManagement = lazy(() => import('./MenuManagement'));
const AboutValuesManagement = lazy(() => import('./AboutValuesManagement'));
const DestinationsCMS = lazy(() => import('./DestinationsCMS'));
const CareersCMS = lazy(() => import('./CareersCMS'));

// ─── Tab Configuration ──────────────────────────────────

interface TabConfig {
    id: string;
    label: string;
    icon: string;
    component: React.LazyExoticComponent<React.FC>;
    color: string;
}

const TABS: TabConfig[] = [
    { id: 'builder',      label: 'Page Builder',   icon: 'web',             component: PageEditor,            color: 'text-blue-600 bg-blue-50' },
    { id: 'landing',      label: 'Landing Page',   icon: 'home',            component: LandingPageEditor,     color: 'text-violet-600 bg-violet-50' },
    { id: 'header',       label: 'Header',         icon: 'view_compact',    component: HeaderManagement,      color: 'text-emerald-600 bg-emerald-50' },
    { id: 'footer',       label: 'Footer',         icon: 'view_agenda',     component: FooterManagement,      color: 'text-orange-600 bg-orange-50' },
    { id: 'navigation',   label: 'Navigation',     icon: 'menu',            component: MenuManagement,        color: 'text-cyan-600 bg-cyan-50' },
    { id: 'about',        label: 'About Values',   icon: 'auto_awesome',    component: AboutValuesManagement, color: 'text-pink-600 bg-pink-50' },
    { id: 'destinations', label: 'Destinations',   icon: 'travel_explore',  component: DestinationsCMS,       color: 'text-teal-600 bg-teal-50' },
    { id: 'careers',      label: 'Careers',        icon: 'work',            component: CareersCMS,            color: 'text-amber-600 bg-amber-50' },
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

const PageBuilderHub: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'builder';
    const [activeTab, setActiveTab] = useState(
        TABS.find(t => t.id === initialTab) ? initialTab : 'builder'
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
                            <h1 className="text-2xl font-black text-navy-950 tracking-tighter uppercase">Page Builder</h1>
                            <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest mt-0.5">
                                Pages • Layout • Navigation • Content
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
                                    className={`group flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${
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

export default PageBuilderHub;
