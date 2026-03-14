import React from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { ROUTES } from '../../config/routes';
import { BRAND } from '../../config/brand';
import { useCmsHeaderStore } from '../../stores/cmsHeaderStore';

/**
 * Public layout for customer-facing pages.
 * Reads branding and navigation from the CMS header store (Firestore-backed).
 * Falls back to BRAND constants when CMS isn't configured.
 */
const PublicLayout: React.FC = () => {
    const location = useLocation();
    const { logoUrl, brandName, tagSuffix, navItems, ctaLabel, ctaLink, ctaVisible, showSearch, showLanguageSwitcher, showLoginButton, loaded } = useCmsHeaderStore();

    // Default nav items — used when CMS hasn't been configured yet
    const defaultNavItems = [
        { label: 'Destinations', href: ROUTES.DESTINATIONS, openInNewTab: false },
        { label: 'Flight Status', href: ROUTES.FLIGHT_TRACKER, openInNewTab: false },
        { label: 'Check-in', href: ROUTES.CHECKIN, openInNewTab: false },
        { label: 'Manage Booking', href: ROUTES.MANAGE_BOOKING, openInNewTab: false },
    ];

    const displayNav = navItems.length > 0 ? navItems : defaultNavItems;
    const displayBrandName = brandName || BRAND.shortName;
    const displayTagSuffix = tagSuffix || BRAND.tagSuffix;
    const displayCtaLabel = ctaLabel || 'Book Now';
    const displayCtaLink = ctaLink || ROUTES.FLIGHT_SEARCH;

    return (
        <div className="min-h-screen bg-navy-50 font-display flex flex-col">
            {/* Top Navigation */}
            <header className="bg-white/90 backdrop-blur-xl border-b border-navy-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    {/* Brand */}
                    <Link to={ROUTES.HOME} className="flex items-center gap-3">
                        {logoUrl ? (
                            <img src={logoUrl} alt={displayBrandName} className="h-9 w-auto object-contain" />
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-primary text-3xl">flight</span>
                                <span className="font-black text-navy-900 text-lg tracking-tight">{displayBrandName}<span className="text-primary">{displayTagSuffix}</span></span>
                            </>
                        )}
                    </Link>

                    {/* Nav Links — from CMS or defaults */}
                    <nav className="hidden md:flex items-center gap-8">
                        {displayNav.map((link) => {
                            const isExternal = link.href.startsWith('http');
                            const isActive = !isExternal && location.pathname.startsWith(link.href);

                            if (isExternal) {
                                return (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        target={link.openInNewTab ? '_blank' : undefined}
                                        rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                                        className="text-sm font-bold uppercase tracking-[0.15em] text-navy-500 hover:text-navy-800 transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                );
                            }

                            return (
                                <Link
                                    key={link.href}
                                    to={link.href}
                                    className={`text-sm font-bold uppercase tracking-[0.15em] transition-colors ${isActive
                                        ? 'text-primary'
                                        : 'text-navy-500 hover:text-navy-800'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        {showLanguageSwitcher !== false && (
                            <div className="hidden md:flex items-center gap-1 text-xs font-bold text-navy-500 uppercase tracking-widest cursor-pointer hover:text-navy-800 transition-colors">
                                <span className="material-symbols-outlined text-lg">public</span>
                                EN
                                <span className="material-symbols-outlined text-sm">expand_more</span>
                            </div>
                        )}
                        {showSearch !== false && (
                            <button className="text-navy-500 hover:text-navy-800 transition-colors hidden md:block">
                                <span className="material-symbols-outlined text-xl">search</span>
                            </button>
                        )}
                        {ctaVisible !== false && (
                            <Link
                                to={displayCtaLink}
                                className="bg-primary text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.2em] hover:bg-primary-600 transition-colors shadow-lg shadow-primary/20"
                            >
                                {displayCtaLabel}
                            </Link>
                        )}
                        {showLoginButton !== false && (
                            <Link
                                to={ROUTES.LOGIN}
                                className="text-navy-500 hover:text-navy-800 transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-xl">person</span>
                                <span className="hidden md:inline text-xs font-bold uppercase tracking-[0.15em]">My Account</span>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Page Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-navy-950 text-white pt-20 pb-12 px-6 md:px-12">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
                        {[
                            {
                                title: 'Travel',
                                links: [
                                    { label: 'Book a Flight', path: ROUTES.FLIGHT_SEARCH },
                                    { label: 'Destinations', path: ROUTES.DESTINATIONS },
                                    { label: 'Flight Status', path: ROUTES.FLIGHT_TRACKER },
                                    { label: 'Check-in', path: ROUTES.CHECKIN },
                                ],
                            },
                            {
                                title: 'Manage',
                                links: [
                                    { label: 'My Bookings', path: ROUTES.MANAGE_BOOKING },
                                    { label: BRAND.loyaltyProgram, path: ROUTES.LOYALTY },
                                    { label: 'My Account', path: ROUTES.LOGIN },
                                ],
                            },
                            {
                                title: 'Company',
                                links: [
                                    { label: 'About Us', path: ROUTES.ABOUT },
                                    { label: 'Careers', path: ROUTES.CAREERS },
                                    { label: 'Contact', path: `${ROUTES.ABOUT}#contact` },
                                ],
                            },
                            {
                                title: 'Support',
                                links: [
                                    { label: 'Help Center', path: `${ROUTES.ABOUT}#support` },
                                    { label: 'Baggage Info', path: `${ROUTES.ABOUT}#baggage` },
                                    { label: 'Accessible Travel', path: `${ROUTES.ABOUT}#accessibility` },
                                ],
                            },
                        ].map((col) => (
                            <div key={col.title} className="space-y-6">
                                <h4 className="text-xs font-black uppercase tracking-[0.4em] text-white/80 border-b border-white/10 pb-4">
                                    {col.title}
                                </h4>
                                <ul className="space-y-3">
                                    {col.links.map((link) => (
                                        <li key={link.label}>
                                            <Link
                                                to={link.path}
                                                className="text-sm font-bold text-navy-400 hover:text-primary transition-colors uppercase tracking-widest"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            {logoUrl ? (
                                <img src={logoUrl} alt={displayBrandName} className="h-7 w-auto object-contain" />
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-primary text-2xl">flight</span>
                                    <span className="font-black text-sm tracking-tight">{displayBrandName}<span className="text-primary">{displayTagSuffix}</span></span>
                                </>
                            )}
                        </div>
                        <p className="text-[10px] font-bold text-navy-500 uppercase tracking-[0.3em]">
                            {BRAND.copyright}
                        </p>
                        <div className="flex gap-8 text-[10px] font-bold text-navy-500 uppercase tracking-widest">
                            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                            <a href="#" className="hover:text-primary transition-colors">Terms</a>
                            <Link to={ROUTES.LOGIN} className="text-primary font-black">Staff Login</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
