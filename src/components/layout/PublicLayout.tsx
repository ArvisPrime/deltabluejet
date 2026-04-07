import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { ROUTES } from '../../config/routes';
import { BRAND } from '../../config/brand';
import { useCmsHeaderStore } from '../../stores/cmsHeaderStore';
import { useToastStore } from '../../stores/toastStore';
import CookieConsent from '../common/CookieConsent';
import LanguageSwitcher from '../common/LanguageSwitcher';
import CurrencySelector from '../common/CurrencySelector';

/**
 * Public layout for customer-facing pages.
 * Reads branding and navigation from the CMS header store (Firestore-backed).
 * Falls back to BRAND constants when CMS isn't configured.
 */
const PublicLayout: React.FC = () => {
    const location = useLocation();
    const { logoUrl, brandName, tagSuffix, navItems, ctaLabel, ctaLink, ctaVisible, showSearch, showLanguageSwitcher, showLoginButton, loaded } = useCmsHeaderStore();
    const addToast = useToastStore(s => s.addToast);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

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

    /** Shared nav link renderer */
    const renderNavLink = (link: typeof displayNav[0], idx: number, isMobile = false) => {
        const isExternal = link.href.startsWith('http');
        const isActive = !isExternal && location.pathname.startsWith(link.href);
        const base = isMobile
            ? 'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-[0.12em] transition-all'
            : 'text-sm font-bold uppercase tracking-[0.15em] transition-colors';
        const active = isMobile
            ? 'bg-primary/10 text-primary'
            : 'text-primary';
        const inactive = isMobile
            ? 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
            : 'text-navy-500 hover:text-navy-800';

        if (isExternal) {
            return (
                <a
                    key={link.href + idx}
                    href={link.href}
                    target={link.openInNewTab ? '_blank' : undefined}
                    rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                    className={`${base} ${inactive}`}
                    onClick={() => isMobile && setMobileMenuOpen(false)}
                >
                    {link.label}
                </a>
            );
        }
        return (
            <Link
                key={link.href + idx}
                to={link.href}
                className={`${base} ${isActive ? active : inactive}`}
                onClick={() => isMobile && setMobileMenuOpen(false)}
            >
                {link.label}
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-navy-50 font-display flex flex-col">
            {/* Skip to Content — a11y for keyboard users */}
            <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-6 focus:py-3 focus:bg-primary focus:text-white focus:rounded-xl focus:font-black focus:text-sm focus:uppercase focus:tracking-widest focus:shadow-2xl">
                Skip to main content
            </a>
            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] md:hidden" onClick={() => setMobileMenuOpen(false)} />
            )}

            {/* Mobile Slide-Out Drawer */}
            <div className={`fixed top-0 right-0 h-full w-[280px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 md:hidden flex flex-col ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Drawer Header */}
                <div className="flex items-center justify-between px-5 h-16 border-b border-navy-100">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-navy-400">Menu</span>
                    <button onClick={() => setMobileMenuOpen(false)} className="size-9 rounded-xl bg-navy-50 flex items-center justify-center text-navy-500 hover:text-navy-800 transition-colors">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Drawer Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {displayNav.map((link, idx) => renderNavLink(link, idx, true))}
                </nav>

                {/* Drawer Actions */}
                <div className="p-4 border-t border-navy-100 space-y-3">
                    {ctaVisible !== false && (
                        <Link
                            to={displayCtaLink}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block w-full text-center bg-primary text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:bg-primary-600 transition-colors"
                        >
                            {displayCtaLabel}
                        </Link>
                    )}
                    {showLoginButton !== false && (
                        <Link
                            to={ROUTES.LOGIN}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] text-navy-500 bg-navy-50 hover:bg-navy-100 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">person</span>
                            My Account
                        </Link>
                    )}
                </div>
            </div>

            {/* Top Navigation */}
            <header className="bg-white/90 backdrop-blur-xl border-b border-navy-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
                    {/* Brand */}
                    <Link to={ROUTES.HOME} className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {logoUrl ? (
                            <img src={logoUrl} alt={displayBrandName} className="h-10 md:h-12 w-auto object-contain" />
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-primary text-2xl md:text-3xl">flight</span>
                                <span className="font-black text-navy-900 text-base md:text-lg tracking-tight">{displayBrandName}<span className="text-primary">{displayTagSuffix}</span></span>
                            </>
                        )}
                    </Link>

                    {/* Nav Links — desktop only */}
                    <nav className="hidden md:flex items-center gap-8">
                        {displayNav.map((link, idx) => renderNavLink(link, idx, false))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {showLanguageSwitcher !== false && (
                            <div className="hidden md:block">
                                <LanguageSwitcher />
                            </div>
                        )}
                        <div className="hidden md:block">
                            <CurrencySelector />
                        </div>
                        {showSearch !== false && (
                            <button className="text-navy-500 hover:text-navy-800 transition-colors hidden md:block">
                                <span className="material-symbols-outlined text-xl">search</span>
                            </button>
                        )}
                        {ctaVisible !== false && (
                            <Link
                                to={displayCtaLink}
                                className="hidden sm:inline-flex bg-primary text-white px-5 md:px-6 py-2 md:py-2.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.2em] hover:bg-primary-600 transition-colors shadow-lg shadow-primary/20"
                            >
                                {displayCtaLabel}
                            </Link>
                        )}
                        {showLoginButton !== false && (
                            <Link
                                to={ROUTES.LOGIN}
                                className="text-navy-500 hover:text-navy-800 transition-colors hidden md:flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-xl">person</span>
                                <span className="text-xs font-bold uppercase tracking-[0.15em]">My Account</span>
                            </Link>
                        )}
                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="md:hidden size-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-600 hover:bg-navy-100 transition-colors"
                            aria-label="Open menu"
                        >
                            <span className="material-symbols-outlined text-xl">menu</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Page Content */}
            <main id="main-content" className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-navy-950 text-white pt-16 md:pt-20 pb-10 md:pb-12 px-4 sm:px-6 md:px-12">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12 mb-12 md:mb-16">
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
                                    { label: 'Contact', path: ROUTES.ABOUT },
                                ],
                            },
                            {
                                title: 'Support',
                                links: [
                                    { label: 'Help Center', path: ROUTES.ABOUT },
                                    { label: 'Dangerous Goods', path: ROUTES.DANGEROUS_GOODS },
                                    { label: 'Visa Requirements', path: ROUTES.VISA_CHECKER },
                                ],
                            },
                            {
                                title: 'Legal',
                                links: [
                                    { label: 'Terms & Conditions', path: ROUTES.TERMS },
                                    { label: 'Privacy Policy', path: ROUTES.PRIVACY_POLICY },
                                    { label: 'Tarmac Delay Plan', path: ROUTES.TARMAC_DELAY_PLAN },
                                ],
                            },
                        ].map((col) => (
                            <div key={col.title} className="space-y-4 md:space-y-6">
                                <h4 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-white/80 border-b border-white/10 pb-3 md:pb-4">
                                    {col.title}
                                </h4>
                                <ul className="space-y-2.5 md:space-y-3">
                                    {col.links.map((link) => (
                                        <li key={link.label}>
                                            <Link
                                                to={link.path}
                                                className="text-xs md:text-sm font-bold text-navy-400 hover:text-primary transition-colors uppercase tracking-wider md:tracking-widest"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="pt-6 md:pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                        <div className="flex items-center gap-3">
                            {logoUrl ? (
                                <img src={logoUrl} alt={displayBrandName} className="h-8 md:h-9 w-auto object-contain" />
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-primary text-xl md:text-2xl">flight</span>
                                    <span className="font-black text-sm tracking-tight">{displayBrandName}<span className="text-primary">{displayTagSuffix}</span></span>
                                </>
                            )}
                        </div>
                        <p className="text-[9px] md:text-[10px] font-bold text-navy-500 uppercase tracking-[0.2em] md:tracking-[0.3em]">
                            {BRAND.copyright}
                        </p>
                        <div className="flex gap-6 md:gap-8 text-[9px] md:text-[10px] font-bold text-navy-500 uppercase tracking-widest">
                            <Link to={ROUTES.PRIVACY_POLICY} className="hover:text-primary transition-colors">Privacy</Link>
                            <Link to={ROUTES.TERMS} className="hover:text-primary transition-colors">Terms</Link>
                            <Link to={ROUTES.STAFF_LOGIN} className="text-primary font-black">Staff Login</Link>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Cookie Consent Banner */}
            <CookieConsent />
        </div>
    );
};

export default PublicLayout;
