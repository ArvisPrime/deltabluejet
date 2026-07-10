/**
 * CMS About Page Store — Zustand store with Firestore real-time sync.
 *
 * Uses `onSnapshot` to listen for changes to the `cms_config/aboutValues`
 * document. When the CMS editor saves, the listener fires and the public
 * About page re-renders instantly — no refresh needed.
 *
 * The CMS editor also writes to this store on every keystroke (via `patch`)
 * so the admin sees changes reflected live. Only when Save is clicked does
 * the data persist to Firestore, which then triggers onSnapshot for any
 * other open tab/component.
 */

import { create } from 'zustand';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { BRAND } from '../config/brand';
import { updateAboutPageConfig } from '../services/cms';
import type {
    CmsAboutValueItem,
    CmsAboutStatItem,
    CmsAboutMilestoneItem,
    CmsAboutLeaderItem,
    CmsAboutPageDoc,
} from '../types/firestore';

/* ── Defaults (shown when CMS has no data) ──────────────────── */
const DEFAULT_VALUES: CmsAboutValueItem[] = [
    { icon: 'shield', title: 'Safety Without Compromise', body: 'Our foundation is built on rigorous international safety standards. We believe that peace of mind is the ultimate luxury in air travel.' },
    { icon: 'eco', title: 'Authentic Hospitality', body: "We don't just transport passengers; we host them. We bring the spirit of The Gambia to the skies, ensuring every guest feels the warmth of our culture from takeoff to landing." },
    { icon: 'diversity_3', title: 'Operational Agility', body: 'In a fast-moving world, we stay ahead through efficiency and innovation, ensuring our schedules are dependable and our services are accessible to all.' },
    { icon: 'lightbulb', title: 'Innovation', body: 'We leverage AI-driven scheduling, real-time disruption management, and a fully digital booking experience to keep you moving seamlessly.' },
];

const DEFAULT_STATS: CmsAboutStatItem[] = [
    { value: '120+', label: 'Destinations', icon: 'public' },
    { value: '85', label: 'Aircraft', icon: 'flight' },
    { value: '14M', label: 'Passengers/Year', icon: 'groups' },
    { value: '99.2%', label: 'On-time Rate', icon: 'schedule' },
];

const DEFAULT_MILESTONES: CmsAboutMilestoneItem[] = [
    { year: '2012', event: 'Founded in New York with 3 leased aircraft serving 8 domestic routes.' },
    { year: '2015', event: 'Expanded to transatlantic service — London, Paris, and Frankfurt added.' },
    { year: '2018', event: 'Fleet grows to 50 aircraft. Deltablue Club loyalty program launched.' },
    { year: '2021', event: 'Full digital transformation — app-based booking, AI disruption engine, and biometric check-in.' },
    { year: '2024', event: '120+ destinations across 6 continents. Named "Best Mid-Size Carrier" by Skyline Awards.' },
];

const DEFAULT_LEADERS: CmsAboutLeaderItem[] = [
    { name: 'Amara Okafor', role: 'Chief Executive Officer', icon: 'person' },
    { name: 'James Whitfield', role: 'Chief Operations Officer', icon: 'person' },
    { name: 'Lina Chen', role: 'Chief Technology Officer', icon: 'person' },
    { name: 'Marcus Rivera', role: 'VP of Customer Experience', icon: 'person' },
];

/* ── Store interface ──────────────────────────────────────── */
export interface CmsAboutState {
    loaded: boolean;
    dirty: boolean;

    // Hero
    heroBadge: string;
    heroHeading: string;
    heroSubtitle: string;

    // Stats
    stats: CmsAboutStatItem[];

    // Mission
    missionBadge: string;
    missionHeading: string;
    missionParagraph1: string;
    missionParagraph2: string;

    // Values
    sectionLabel: string;
    sectionTitle: string;
    values: CmsAboutValueItem[];

    // Milestones
    milestones: CmsAboutMilestoneItem[];

    // Leadership
    leadersBadge: string;
    leadersTitle: string;
    leaders: CmsAboutLeaderItem[];

    // CTA
    ctaHeading: string;
    ctaDescription: string;
    ctaButtonText: string;
    ctaButtonLink: string;

    /** Patch any fields — marks store as dirty (used by CMS editor) */
    patch: (partial: Partial<Omit<CmsAboutState, 'loaded' | 'dirty' | 'patch' | 'subscribe' | 'save'>>) => void;
    /**
     * Subscribe to real-time Firestore updates.
     * Returns an unsubscribe function.
     * Safe to call multiple times — only subscribes once.
     */
    subscribe: () => () => void;
    /** Persist current state to Firestore, returns success boolean */
    save: () => Promise<boolean>;
}

/* ── Track the single active Firestore listener ───────────── */
let _unsubscribe: Unsubscribe | null = null;
let _subscriberCount = 0;

export const useCmsAboutStore = create<CmsAboutState>((set, get) => ({
    loaded: false,
    dirty: false,

    // Hero
    heroBadge: 'Our Story',
    heroHeading: `About ${BRAND.shortName}`,
    heroSubtitle: 'Redefining aviation with precision, sustainability, and an unwavering commitment to every passenger who trusts us with their journey.',

    // Stats
    stats: DEFAULT_STATS,

    // Mission
    missionBadge: 'Our Mission',
    missionHeading: 'Connecting People, Bridging Worlds',
    missionParagraph1: `${BRAND.name} to provide safe, affordable, and exceptional air travel that showcases the warmth of The Gambia. We are dedicated to bridging the gap between West Africa and the global community by investing in a modern fleet, empowering our local workforce, and delivering a travel experience rooted in reliability and 'Smiling Coast' hospitality.`,
    missionParagraph2: "We don't just move passengers — we connect communities with precision, safety, and care at every step.",

    // Values
    sectionLabel: 'What Drives Us',
    sectionTitle: 'Our Values',
    values: DEFAULT_VALUES,

    // Milestones
    milestones: DEFAULT_MILESTONES,

    // Leadership
    leadersBadge: 'The Team',
    leadersTitle: 'Leadership',
    leaders: DEFAULT_LEADERS,

    // CTA
    ctaHeading: 'Ready to Fly With Us?',
    ctaDescription: `Join millions of travellers who trust ${BRAND.name} for seamless, sustainable, and inspired journeys across the globe.`,
    ctaButtonText: 'Book Your Journey',
    ctaButtonLink: '/book',

    /* ── Patch (CMS editor keystroke) ───────────────────────────── */
    patch: (partial) => set({ ...partial, dirty: true }),

    /* ── Subscribe to real-time Firestore updates ──────────────── */
    subscribe: () => {
        _subscriberCount++;

        // Only create one listener for all subscribers
        if (!_unsubscribe) {
            _unsubscribe = onSnapshot(
                doc(db, 'cms_config', 'aboutValues'),
                (snap) => {
                    if (snap.exists()) {
                        const config = snap.data() as CmsAboutPageDoc;
                        const s = get();

                        // Only apply Firestore updates when the store is NOT dirty
                        // (i.e., the CMS editor doesn't have unsaved local changes)
                        if (!s.dirty) {
                            set({
                                loaded: true,
                                heroBadge: config.heroBadge || s.heroBadge,
                                heroHeading: config.heroHeading || s.heroHeading,
                                heroSubtitle: config.heroSubtitle || s.heroSubtitle,
                                stats: config.stats?.length ? config.stats : s.stats,
                                missionBadge: config.missionBadge || s.missionBadge,
                                missionHeading: config.missionHeading || s.missionHeading,
                                missionParagraph1: config.missionParagraph1 || s.missionParagraph1,
                                missionParagraph2: config.missionParagraph2 || s.missionParagraph2,
                                sectionLabel: config.sectionLabel || s.sectionLabel,
                                sectionTitle: config.sectionTitle || s.sectionTitle,
                                values: config.values?.length ? config.values : s.values,
                                milestones: config.milestones?.length ? config.milestones : s.milestones,
                                leadersBadge: config.leadersBadge || s.leadersBadge,
                                leadersTitle: config.leadersTitle || s.leadersTitle,
                                leaders: config.leaders?.length ? config.leaders : s.leaders,
                                ctaHeading: config.ctaHeading || s.ctaHeading,
                                ctaDescription: config.ctaDescription || s.ctaDescription,
                                ctaButtonText: config.ctaButtonText || s.ctaButtonText,
                                ctaButtonLink: config.ctaButtonLink || s.ctaButtonLink,
                            });
                        } else {
                            // Still mark as loaded even if dirty
                            set({ loaded: true });
                        }
                    } else {
                        // Document doesn't exist yet — use defaults
                        set({ loaded: true });
                    }
                },
                (err) => {
                    console.error('Firestore onSnapshot error for aboutValues:', err);
                    set({ loaded: true }); // Mark loaded so UI doesn't hang
                }
            );
        }

        // Return cleanup function (ref-counted)
        return () => {
            _subscriberCount--;
            if (_subscriberCount <= 0 && _unsubscribe) {
                _unsubscribe();
                _unsubscribe = null;
                _subscriberCount = 0;
            }
        };
    },

    /* ── Save to Firestore ─────────────────────────────────────── */
    save: async () => {
        const s = get();
        try {
            await updateAboutPageConfig({
                heroBadge: s.heroBadge,
                heroHeading: s.heroHeading,
                heroSubtitle: s.heroSubtitle,
                stats: s.stats,
                missionBadge: s.missionBadge,
                missionHeading: s.missionHeading,
                missionParagraph1: s.missionParagraph1,
                missionParagraph2: s.missionParagraph2,
                sectionLabel: s.sectionLabel,
                sectionTitle: s.sectionTitle,
                values: s.values,
                milestones: s.milestones,
                leadersBadge: s.leadersBadge,
                leadersTitle: s.leadersTitle,
                leaders: s.leaders,
                ctaHeading: s.ctaHeading,
                ctaDescription: s.ctaDescription,
                ctaButtonText: s.ctaButtonText,
                ctaButtonLink: s.ctaButtonLink,
            });
            set({ dirty: false });
            return true;
        } catch (err) {
            console.error('Failed to save about page:', err);
            return false;
        }
    },
}));
