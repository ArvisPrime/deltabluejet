import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { ROUTES } from '../../config/routes';
import { BRAND } from '../../config/brand';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { useCmsHeaderStore } from '../../stores/cmsHeaderStore';
import { getDashboardAccess, type DashboardAccessConfig } from '../../services/dashboardAccessService';
import { subscribeToNotificationLogs } from '../../services/notifications';
import type { NotificationLogDoc } from '../../types/firestore';
import { useNotificationSound } from '../../hooks/useNotificationSound';

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
            { label: 'FAQ Manager', path: ROUTES.FAQ_CMS, icon: 'quiz' },
            { label: 'Careers', path: ROUTES.CAREERS_CMS, icon: 'work' },
            { label: 'Health & Visa', path: ROUTES.HEALTH_CMS, icon: 'health_and_safety' },
            { label: 'Legal Pages', path: ROUTES.LEGAL_CMS, icon: 'gavel' },
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
            { label: 'FRMS Report', path: ROUTES.CREW_FRMS_REPORT, icon: 'summarize' },
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
    const [liveNotifications, setLiveNotifications] = useState<NotificationLogDoc[]>([]);
    const [readIds, setReadIds] = useState<Set<string>>(new Set());
    const prevCountRef = useRef(0);
    const { playSound } = useNotificationSound();
    const initialLoadRef = useRef(true);

    /* ── Load dashboard access config ────────────────────────── */
    useEffect(() => {
        getDashboardAccess().then(setAccessConfig).catch(() => setAccessConfig(null));
    }, []);

    /* ── Subscribe to live notification logs ─────────────────── */
    useEffect(() => {
        const unsub = subscribeToNotificationLogs(
            (logs) => {
                setLiveNotifications(logs);

                // Play sound for new critical/warning notifications
                if (initialLoadRef.current) {
                    // Skip sound on initial load
                    initialLoadRef.current = false;
                    prevCountRef.current = logs.length;
                    return;
                }

                if (logs.length > prevCountRef.current) {
                    // New notification(s) arrived
                    const newest = logs[0]; // sorted desc by sentAt
                    const name = (newest?.templateName || '').toLowerCase();

                    if (name.includes('delay') || name.includes('disrupt') || name.includes('cancel') || newest?.status === 'failed') {
                        playSound('critical');
                    } else if (name.includes('warning') || name.includes('gate') || name.includes('alert')) {
                        playSound('warning');
                    } else {
                        playSound('info');
                    }
                }
                prevCountRef.current = logs.length;
            },
            { maxResults: 20 },
        );
        return unsub;
    }, [playSound]);

    /* ── Computed notification helpers ───────────────────────── */
    const unreadCount = liveNotifications.filter(n => !readIds.has(n.id)).length;

    const markAllRead = useCallback(() => {
        setReadIds(new Set(liveNotifications.map(n => n.id)));
        setShowNotifications(false);
        addToast('All notifications marked as read', 'success');
    }, [liveNotifications, addToast]);

    const formatTimeAgo = useCallback((sentAt: any) => {
        if (!sentAt?.toDate) return '';
        const diff = Date.now() - sentAt.toDate().getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    }, []);

    const getNotificationType = useCallback((n: NotificationLogDoc): 'warning' | 'info' | 'success' | 'error' => {
        if (n.status === 'failed') return 'error';
        const name = (n.templateName || '').toLowerCase();
        if (name.includes('delay') || name.includes('disrupt') || name.includes('cancel')) return 'warning';
        if (name.includes('confirm') || name.includes('success')) return 'success';
        return 'info';
    }, []);

    const getNotificationIcon = useCallback((type: string) => {
        switch (type) {
            case 'warning': return 'warning';
            case 'error': return 'error';
            case 'success': return 'check_circle';
            default: return 'info';
        }
    }, []);

    const getIconColor = useCallback((type: string) => {
        switch (type) {
            case 'warning': return 'text-amber-500';
            case 'error': return 'text-red-500';
            case 'success': return 'text-emerald-500';
            default: return 'text-blue-500';
        }
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
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center animate-pulse">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                            {showNotifications && (
                                <div className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-navy-100 overflow-hidden z-50">
                                    <div className="px-5 py-4 border-b border-navy-100 flex items-center justify-between">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-navy-800">
                                            Notifications
                                            {unreadCount > 0 && <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[9px]">{unreadCount} new</span>}
                                        </h3>
                                        <button onClick={markAllRead} className="text-[10px] font-bold text-primary hover:underline">Mark all read</button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                        {liveNotifications.length === 0 ? (
                                            <div className="px-5 py-8 text-center">
                                                <span className="material-symbols-outlined text-3xl text-navy-200">notifications_off</span>
                                                <p className="text-xs text-navy-400 mt-2">No notifications yet</p>
                                            </div>
                                        ) : liveNotifications.map((n) => {
                                            const type = getNotificationType(n);
                                            const isUnread = !readIds.has(n.id);
                                            return (
                                                <div
                                                    key={n.id}
                                                    className={`px-5 py-3 border-b border-navy-50 hover:bg-navy-50/50 transition-colors cursor-pointer flex items-start gap-3 ${
                                                        isUnread ? 'bg-blue-50/40' : ''
                                                    }`}
                                                    onClick={() => {
                                                        setReadIds(prev => new Set([...prev, n.id]));
                                                        addToast(`${n.templateName}: ${n.recipientEmail || n.recipientPhone || ''}`, type);
                                                        setShowNotifications(false);
                                                    }}
                                                >
                                                    <span className={`material-symbols-outlined text-base mt-0.5 ${getIconColor(type)}`}>
                                                        {getNotificationIcon(type)}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs font-bold text-navy-800 truncate">{n.templateName}</p>
                                                            {isUnread && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />}
                                                        </div>
                                                        <p className="text-[10px] text-navy-500 truncate">
                                                            {n.channel === 'email' ? '📧' : '📱'} {n.recipientEmail || n.recipientPhone || 'System'}
                                                            {n.status === 'failed' && <span className="ml-1 text-red-500 font-bold">FAILED</span>}
                                                        </p>
                                                        <p className="text-[9px] text-navy-400 mt-0.5">{formatTimeAgo(n.sentAt)}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {liveNotifications.length > 0 && (
                                        <div className="px-5 py-3 border-t border-navy-100 text-center">
                                            <Link to={ROUTES.EMAIL_AUDIT_LOG} className="text-[10px] font-bold text-primary hover:underline" onClick={() => setShowNotifications(false)}>
                                                View all notifications →
                                            </Link>
                                        </div>
                                    )}
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
