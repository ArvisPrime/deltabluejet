/**
 * CMS Header Store — Zustand store that loads the header config from Firestore.
 *
 * All public-facing and admin layouts should read branding & nav from here
 * instead of hardcoding values. Falls back to BRAND constants if CMS isn't set.
 */

import { create } from 'zustand';
import { BRAND } from '../config/brand';
import { getHeaderConfig } from '../services/cms';

export interface CmsNavItem {
    label: string;
    href: string;
    openInNewTab: boolean;
}

interface CmsHeaderState {
    loaded: boolean;
    logoUrl: string | null;
    faviconUrl: string | null;
    brandName: string;
    tagSuffix: string;
    navItems: CmsNavItem[];
    ctaLabel: string;
    ctaLink: string;
    ctaVisible: boolean;
    showSearch: boolean;
    showLanguageSwitcher: boolean;
    showLoginButton: boolean;
    /** Load (or reload) the header config from Firestore */
    load: () => Promise<void>;
}

export const useCmsHeaderStore = create<CmsHeaderState>((set, get) => ({
    loaded: false,
    logoUrl: null,
    faviconUrl: null,
    brandName: '',
    tagSuffix: '',
    navItems: [],
    ctaLabel: 'Book Now',
    ctaLink: '/book',
    ctaVisible: true,
    showSearch: true,
    showLanguageSwitcher: true,
    showLoginButton: true,

    load: async () => {
        // Skip if already loaded (call with force: true pattern via set first)
        try {
            const config = await getHeaderConfig();
            if (config) {
                set({
                    loaded: true,
                    logoUrl: config.logoUrl || null,
                    faviconUrl: config.faviconUrl || null,
                    brandName: config.brandName ?? '',
                    tagSuffix: config.tagSuffix ?? '',
                    navItems: (config.navItems || []).map((item) => ({
                        label: item.label,
                        href: item.href,
                        openInNewTab: item.openInNewTab || false,
                    })),
                    ctaLabel: config.ctaLabel || 'Book Now',
                    ctaLink: config.ctaLink || '/book',
                    ctaVisible: config.ctaVisible !== undefined ? config.ctaVisible : true,
                    showSearch: config.showSearch !== undefined ? config.showSearch : true,
                    showLanguageSwitcher: config.showLanguageSwitcher !== undefined ? config.showLanguageSwitcher : true,
                    showLoginButton: config.showLoginButton !== undefined ? config.showLoginButton : true,
                });

                // Update favicon dynamically
                if (config.faviconUrl) {
                    const link: HTMLLinkElement =
                        document.querySelector("link[rel~='icon']") ||
                        (() => {
                            const el = document.createElement('link');
                            el.rel = 'icon';
                            document.head.appendChild(el);
                            return el;
                        })();
                    link.href = config.faviconUrl;
                }
            } else {
                set({ loaded: true });
            }
        } catch (err) {
            console.error('Failed to load CMS header config:', err);
            set({ loaded: true }); // Still mark loaded so we use fallbacks
        }
    },
}));
