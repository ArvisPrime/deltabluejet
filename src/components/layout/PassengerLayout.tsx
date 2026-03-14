
import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { ROUTES } from '../../config/routes';
import { BRAND } from '../../config/brand';
import { useAuth } from '../../hooks/useAuth';
import { useCmsHeaderStore } from '../../stores/cmsHeaderStore';

const NAV_ITEMS = [
    { path: ROUTES.MY_DASHBOARD, label: 'Dashboard', icon: 'dashboard' },
    { path: ROUTES.MY_TRIPS, label: 'My Trips', icon: 'flight' },
    { path: ROUTES.MY_PROFILE, label: 'My Profile', icon: 'person' },
    { path: ROUTES.LOYALTY, label: 'Loyalty', icon: 'stars' },
];

/**
 * Layout wrapper for the passenger portal (/my/*).
 * Uses a horizontal tab navigation at the top with the public header/footer.
 */
const PassengerLayout: React.FC = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const logoUrl = useCmsHeaderStore(s => s.logoUrl);

    const handleLogout = async () => {
        await logout();
        navigate(ROUTES.HOME, { replace: true });
    };

    return (
        <div className="min-h-screen bg-navy-50/40 font-sans text-navy-950">
            {/* Top Header */}
            <header className="bg-white border-b border-navy-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to={ROUTES.HOME} className="flex items-center gap-3 group no-underline shrink-0">
                            {logoUrl ? (
                                <img src={logoUrl} alt={BRAND.name} className="h-8 w-auto" />
                            ) : (
                                <div className="size-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/15 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-white text-xl font-black">airlines</span>
                                </div>
                            )}
                            <span className="text-lg font-black tracking-tighter uppercase text-navy-950 hidden sm:inline">{BRAND.shortName}</span>
                        </Link>

                        {/* Nav Tabs */}
                        <nav className="flex items-center gap-1 h-full">
                            {NAV_ITEMS.map(item => {
                                const isActive = item.path === ROUTES.MY_DASHBOARD
                                    ? pathname === item.path
                                    : pathname.startsWith(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all no-underline
                      ${isActive
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-navy-400 hover:text-navy-700 hover:bg-navy-50'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                                        <span className="hidden md:inline">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* User Menu */}
                        <div className="flex items-center gap-4 shrink-0">
                            <div className="hidden sm:flex items-center gap-3">
                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-black uppercase">
                                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-navy-700 uppercase tracking-wider leading-none">{user?.displayName || 'Member'}</p>
                                    <p className="text-[9px] font-bold text-navy-300 uppercase tracking-wide">{BRAND.loyaltyProgram}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-navy-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">logout</span>
                                <span className="hidden sm:inline">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Page Content */}
            <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
                <Outlet />
            </main>

            {/* Minimal Footer */}
            <footer className="border-t border-navy-100 bg-white mt-auto">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">{BRAND.copyright}</p>
                    <div className="flex items-center gap-6">
                        <Link to={ROUTES.ABOUT} className="text-[9px] font-black text-navy-300 uppercase tracking-widest hover:text-primary transition-colors no-underline">About</Link>
                        <Link to={ROUTES.DESTINATIONS} className="text-[9px] font-black text-navy-300 uppercase tracking-widest hover:text-primary transition-colors no-underline">Destinations</Link>
                        <Link to={ROUTES.FLIGHT_TRACKER} className="text-[9px] font-black text-navy-300 uppercase tracking-widest hover:text-primary transition-colors no-underline">Flight Status</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PassengerLayout;
