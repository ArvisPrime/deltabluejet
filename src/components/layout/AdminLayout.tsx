import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { ROUTES } from '../../config/routes';
import { BRAND } from '../../config/brand';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { useCmsHeaderStore } from '../../stores/cmsHeaderStore';
import { getDashboardAccess, type DashboardAccessConfig } from '../../services/dashboardAccessService';

const navGroups = [
    {
        label: 'Storefront',
        icon: 'storefront',
        items: [
            { label: 'Public Home', path: ROUTES.HOME, icon: 'home' },
            { label: 'Destinations', path: ROUTES.DESTINATIONS, icon: 'travel_explore' },
        ],
    },
    {
        label: 'Core Operations',
        icon: 'hub',
        items: [
            { label: 'Ops Dashboard', path: ROUTES.DASHBOARD, icon: 'dashboard' },
            { label: 'Flight Scheduling', path: ROUTES.FLIGHT_SCHEDULING, icon: 'schedule' },
            { label: 'Fleet Management', path: ROUTES.FLEET_MANAGEMENT, icon: 'airlines' },
            { label: 'Gate Assignments', path: ROUTES.GATE_ASSIGNMENT, icon: 'door_front' },
            { label: 'Delay Management', path: ROUTES.MANAGE_DELAY, icon: 'timer_off' },
            { label: 'Disruption Center', path: ROUTES.DISRUPTION_RESOLUTION, icon: 'warning' },
            { label: 'Aircraft Swap', path: ROUTES.AIRCRAFT_SWAP, icon: 'swap_horiz' },
            { label: 'Manifest & Docs', path: ROUTES.REGULATORY_MANIFEST, icon: 'description' },
            { label: 'Op Triggers', path: ROUTES.OPERATIONAL_TRIGGERS, icon: 'bolt' },
            { label: 'Alert Audit Log', path: ROUTES.ALERT_AUDIT_LOG, icon: 'notification_important' },
            { label: 'Seat Map CMS', path: ROUTES.SEAT_MAP_CMS, icon: 'airline_seat_recline_normal' },
            { label: 'Route Management', path: ROUTES.ROUTE_MANAGEMENT, icon: 'route' },
            { label: 'Airports', path: ROUTES.AIRPORT_MANAGEMENT, icon: 'flight_takeoff' },
        ],
    },
    {
        label: 'User Manager',
        icon: 'group',
        items: [
            { label: 'Bookings', path: ROUTES.BOOKINGS, icon: 'confirmation_number' },
            { label: 'Ticket Reissue', path: ROUTES.TICKET_REISSUE, icon: 'receipt_long' },
            { label: 'User Management', path: ROUTES.USER_MANAGEMENT, icon: 'manage_accounts' },
            { label: 'Account Settings', path: ROUTES.ACCOUNT_SETTINGS, icon: 'settings' },
            { label: 'Notifications', path: ROUTES.NOTIFICATION_PREFERENCES, icon: 'notifications' },
        ],
    },
    {
        label: 'Content CMS',
        icon: 'edit_note',
        items: [
            { label: 'Landing Page', path: ROUTES.LANDING_PAGE_EDITOR, icon: 'home' },
            { label: 'Page Builder', path: ROUTES.PAGE_EDITOR, icon: 'web' },
            { label: 'Header', path: ROUTES.HEADER_MANAGEMENT, icon: 'view_compact' },
            { label: 'Footer', path: ROUTES.FOOTER_MANAGEMENT, icon: 'view_agenda' },
            { label: 'Navigation', path: ROUTES.MENU_MANAGEMENT, icon: 'menu' },
            { label: 'SEO & Branding', path: ROUTES.FAVICON_SEO, icon: 'search' },
            { label: 'About Values', path: ROUTES.ABOUT_VALUES_CMS, icon: 'auto_awesome' },
            { label: 'Destinations', path: ROUTES.DESTINATIONS_CMS, icon: 'travel_explore' },
        ],
    },
    {
        label: 'Security',
        icon: 'shield',
        items: [
            { label: 'Session Monitor', path: ROUTES.SESSION_MONITOR, icon: 'monitor_heart' },
            { label: 'Session Audit Log', path: ROUTES.SESSION_AUDIT_LOG, icon: 'history' },
            { label: 'MFA Settings', path: ROUTES.MFA_SETTINGS, icon: 'security' },
            { label: 'SSO Settings', path: ROUTES.SSO_SETTINGS, icon: 'key' },
            { label: 'Password Policy', path: ROUTES.PASSWORD_POLICY, icon: 'lock' },
            { label: 'Security Keys', path: ROUTES.SECURITY_KEYS, icon: 'security_key' },
        ],
    },
    {
        label: 'Communications',
        icon: 'mail',
        items: [
            { label: 'Email Templates', path: ROUTES.EMAIL_TEMPLATES, icon: 'drafts' },
            { label: 'Email Audit Log', path: ROUTES.EMAIL_AUDIT_LOG, icon: 'mark_email_read' },
            { label: 'SMS Config', path: ROUTES.SMS_CONFIGURATION, icon: 'sms' },
            { label: 'SMS Audit Log', path: ROUTES.SMS_AUDIT_LOG, icon: 'chat_bubble' },
        ],
    },
    {
        label: 'Experiments',
        icon: 'science',
        items: [
            { label: 'Experiments', path: ROUTES.EXPERIMENTS_DASHBOARD, icon: 'labs' },
            { label: 'Experiment Audit', path: ROUTES.EXPERIMENTS_AUDIT_LOG, icon: 'biotech' },
        ],
    },
    {
        label: 'Revenue',
        icon: 'payments',
        items: [
            { label: 'Sales Dashboard', path: ROUTES.SALES_DASHBOARD, icon: 'trending_up' },
            { label: 'Pricing Rules', path: ROUTES.PRICING_RULES, icon: 'price_change' },
            { label: 'Loyalty Admin', path: ROUTES.LOYALTY_ADMIN, icon: 'loyalty' },
            { label: 'Ancillary Products', path: ROUTES.ANCILLARY_ADMIN, icon: 'shopping_bag' },
        ],
    },
    {
        label: 'Crew',
        icon: 'badge',
        items: [
            { label: 'Crew Management', path: ROUTES.CREW_MANAGEMENT, icon: 'group' },
            { label: 'Crew Scheduling', path: ROUTES.CREW_SCHEDULING, icon: 'calendar_month' },
            { label: 'Boarding Scanner', path: ROUTES.BOARDING_SCANNER, icon: 'qr_code_scanner' },
        ],
    },
];

/** Reverse map: ROUTES path → module ID key.
 *  e.g. ROUTES.DASHBOARD path → 'DASHBOARD' */
const PATH_TO_MODULE_ID: Record<string, string> = {};
for (const group of navGroups) {
    for (const item of group.items) {
        // Find the ROUTES key whose value matches this item.path
        const routeKey = (Object.keys(ROUTES) as (keyof typeof ROUTES)[]).find(k => ROUTES[k] === item.path);
        if (routeKey) PATH_TO_MODULE_ID[item.path] = routeKey;
    }
}

/**
 * Admin layout with collapsible sidebar, top header, and content area.
 * Mirrors the existing prototype's admin chrome.
 */
const AdminLayout: React.FC = () => {
    const location = useLocation();
    const { sidebarCollapsed, toggleSidebar, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();
    const { user, logout } = useAuthStore();
    const addToast = useToastStore((s) => s.addToast);
    const { logoUrl, brandName } = useCmsHeaderStore();
    const [showNotifications, setShowNotifications] = useState(false);
    const [accessConfig, setAccessConfig] = useState<DashboardAccessConfig | null>(null);

    /* ── Load dashboard access config ────────────────────────── */
    useEffect(() => {
        getDashboardAccess().then(setAccessConfig).catch(() => setAccessConfig(null));
    }, []);

    /* ── Filter navGroups based on role ──────────────────────── */
    const filteredNavGroups = useMemo(() => {
        // super_admin always sees everything
        if (!accessConfig || !user || user.role === 'super_admin') return navGroups;
        const allowedModules = new Set(accessConfig[user.role] || []);
        return navGroups
            .map(group => ({
                ...group,
                items: group.items.filter(item => {
                    const moduleId = PATH_TO_MODULE_ID[item.path];
                    // If no module mapping exists (e.g. external links), always show
                    if (!moduleId) return true;
                    return allowedModules.has(moduleId);
                }),
            }))
            .filter(group => group.items.length > 0);
    }, [accessConfig, user]);

    const mockNotifications = [
        { id: 1, title: 'Gate B7 conflict detected', time: '2 min ago', type: 'warning' as const },
        { id: 2, title: 'Flight DB-204 delay updated', time: '15 min ago', type: 'info' as const },
        { id: 3, title: 'New crew roster published', time: '1 hr ago', type: 'success' as const },
    ];

    const sidebarWidth = sidebarCollapsed ? 'w-20' : 'w-[264px]';

    return (
        <div className="min-h-screen bg-navy-50 font-display flex">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeMobileMenu} />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:sticky top-0 left-0 h-screen ${sidebarWidth} bg-navy-950 text-white flex flex-col transition-all duration-300 z-50 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                {/* Brand */}
                <div className="h-20 flex items-center px-6 border-b border-white/10">
                    {logoUrl ? (
                        <img src={logoUrl} alt={brandName} className="h-10 w-auto object-contain" />
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-primary text-2xl">flight</span>
                            {!sidebarCollapsed && (
                                <span className="ml-3 font-black text-sm tracking-tight whitespace-nowrap">
                                    {brandName}<span className="text-primary">Admin</span>
                                </span>
                            )}
                        </>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar" role="navigation" aria-label="Admin sidebar">
                    {filteredNavGroups.map((group) => (
                        <div key={group.label} className="mb-2">
                            {!sidebarCollapsed && (
                                <p className="px-6 py-2 text-[9px] font-black uppercase tracking-[0.3em] text-navy-500">
                                    {group.label}
                                </p>
                            )}
                            {group.items.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={closeMobileMenu}
                                        className={`flex items-center gap-3 px-6 py-2.5 text-xs font-bold transition-all ${isActive
                                            ? 'text-white bg-primary/20 border-r-2 border-primary'
                                            : 'text-navy-400 hover:text-white hover:bg-white/5'
                                            }`}
                                        aria-current={isActive ? 'page' : undefined}
                                    >
                                        <span className="material-symbols-outlined text-lg">{item.icon}</span>
                                        {!sidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* User Profile & Logout */}
                <div className="p-4 border-t border-white/10">
                    {!sidebarCollapsed ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-lg">person</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate">{user?.displayName || 'Admin User'}</p>
                                    <p className="text-[10px] text-navy-400 truncate">{user?.role || 'System Admin'}</p>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                                <span className="material-symbols-outlined text-sm">logout</span>
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={logout}
                            title="Sign Out"
                            className="w-full flex items-center justify-center p-2.5 rounded-xl text-navy-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">logout</span>
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Header */}
                <header className="h-20 bg-white border-b border-navy-100 flex items-center justify-between px-6 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button onClick={toggleMobileMenu} className="lg:hidden text-navy-500">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <button onClick={toggleSidebar} className="hidden lg:block text-navy-500 hover:text-navy-800">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <h1 className="text-xs font-black uppercase tracking-[0.25em] text-navy-400">
                            {BRAND.shortName} Admin
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-emerald-500">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Live Sync</span>
                        </div>
                        <button className="text-navy-400 hover:text-navy-800" onClick={() => addToast('Language toggle — English (EN) active', 'info')}>
                            <span className="material-symbols-outlined">language</span>
                        </button>
                        <div className="relative">
                            <button className="text-navy-400 hover:text-navy-800 relative" onClick={() => setShowNotifications((p) => !p)}>
                                <span className="material-symbols-outlined">notifications</span>
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">{mockNotifications.length}</span>
                            </button>
                            {showNotifications && (
                                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-navy-100 overflow-hidden z-50">
                                    <div className="px-5 py-4 border-b border-navy-100 flex items-center justify-between">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-navy-800">Notifications</h3>
                                        <button onClick={() => { setShowNotifications(false); addToast('All notifications marked as read', 'success'); }} className="text-[10px] font-bold text-primary hover:underline">Mark all read</button>
                                    </div>
                                    {mockNotifications.map((n) => (
                                        <div key={n.id} className="px-5 py-3 border-b border-navy-50 hover:bg-navy-50/50 transition-colors cursor-pointer" onClick={() => { addToast(n.title, n.type); setShowNotifications(false); }}>
                                            <p className="text-xs font-bold text-navy-800">{n.title}</p>
                                            <p className="text-[10px] text-navy-400 mt-0.5">{n.time}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto custom-scrollbar">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
