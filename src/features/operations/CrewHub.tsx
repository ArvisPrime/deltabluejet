import React, { useState, Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';

// ─── Lazy-loaded Tab Panels ─────────────────────────────

const CrewManagement = lazy(() => import('./CrewManagement'));
const CrewFTL = lazy(() => import('./CrewFTL'));
const CrewQualifications = lazy(() => import('./CrewQualifications'));
const DisruptionManager = lazy(() => import('./DisruptionManager'));
const FatigueRiskDashboard = lazy(() => import('./FatigueRiskDashboard'));
const SleepTracker = lazy(() => import('./SleepTracker'));

// ─── Tab Configuration ──────────────────────────────────

interface TabConfig {
    id: string;
    label: string;
    icon: string;
    component: React.LazyExoticComponent<React.FC>;
    color: string;
}

const TABS: TabConfig[] = [
    { id: 'roster',        label: 'Roster',         icon: 'group',          component: CrewManagement,       color: 'text-blue-600 bg-blue-50' },
    { id: 'ftl',           label: 'FTL Tracker',    icon: 'speed',          component: CrewFTL,              color: 'text-orange-600 bg-orange-50' },
    { id: 'qualifications',label: 'Qualifications', icon: 'school',         component: CrewQualifications,   color: 'text-violet-600 bg-violet-50' },
    { id: 'disruptions',   label: 'Disruptions',    icon: 'report_problem', component: DisruptionManager,    color: 'text-amber-600 bg-amber-50' },
    { id: 'fatigue',       label: 'Fatigue Risk',   icon: 'monitor_heart',  component: FatigueRiskDashboard, color: 'text-red-600 bg-red-50' },
    { id: 'sleep',         label: 'Sleep Tracker',  icon: 'bedtime',        component: SleepTracker,         color: 'text-indigo-600 bg-indigo-50' },
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

const CrewHub: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'roster';
    const [activeTab, setActiveTab] = useState(
        TABS.find(t => t.id === initialTab) ? initialTab : 'roster'
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
                            <h1 className="text-2xl font-black text-navy-950 tracking-tighter uppercase">Crew Management</h1>
                            <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest mt-0.5">
                                Roster • Compliance • Fatigue • Safety
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
                                    className={`
                                        relative flex items-center gap-2 px-5 py-3 rounded-t-xl text-[10px] font-black uppercase tracking-widest
                                        transition-all duration-200 whitespace-nowrap border border-b-0
                                        ${isActive
                                            ? 'bg-white border-navy-100 text-navy-950 shadow-sm -mb-px z-10'
                                            : 'bg-transparent border-transparent text-navy-400 hover:text-navy-600 hover:bg-navy-50/50'
                                        }
                                    `}
                                >
                                    <span className={`material-symbols-outlined text-base ${isActive ? t.color.split(' ')[0] : ''}`}>
                                        {t.icon}
                                    </span>
                                    <span className="hidden sm:inline">{t.label}</span>
                                    {/* Active Indicator */}
                                    {isActive && (
                                        <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-t-full" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Tab Panel ──────────────────────────────── */}
            <div className="bg-white min-h-[600px]">
                <Suspense fallback={<TabLoader />}>
                    <TabComponent />
                </Suspense>
            </div>
        </div>
    );
};

export default CrewHub;
