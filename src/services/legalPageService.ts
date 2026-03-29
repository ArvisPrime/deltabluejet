/**
 * Legal Page Service — Firestore-backed legal page content (Terms, Privacy, Dangerous Goods, etc.)
 *
 * Each document in `cms_legal_pages` represents one page, containing an array of sections.
 */

import {
    collection, doc, getDocs, setDoc, updateDoc, deleteDoc,
    onSnapshot, query, serverTimestamp, type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

/* ── Types ───────────────────────────────────────────────────── */

export interface LegalSection {
    id: string;
    title: string;
    icon: string;
    /** For simple pages, an array of paragraph strings */
    content?: string[];
    /** For mixed content (Privacy Policy), array of blocks */
    blocks?: { type: 'text' | 'list'; value?: string; items?: string[] }[];
}

export interface LegalPage {
    id: string;       // doc ID, e.g. "terms", "privacy", "dangerous-goods"
    title: string;    // Display title
    subtitle: string; // Tagline or date line
    badge: string;    // Hero badge text
    badgeIcon: string;
    sections: LegalSection[];
    active: boolean;
    updatedAt?: unknown;
    createdAt?: unknown;
}

const COL = 'cms_legal_pages';

/* ── Real-time ───────────────────────────────────────────────── */

export function subscribeToLegalPages(callback: (pages: LegalPage[]) => void): Unsubscribe {
    const q = query(collection(db, COL));
    return onSnapshot(q, snap => {
        callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as LegalPage)));
    });
}

/* ── One-shot ────────────────────────────────────────────────── */

export async function getLegalPages(): Promise<LegalPage[]> {
    const snap = await getDocs(collection(db, COL));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as LegalPage));
}

export async function getLegalPage(pageId: string): Promise<LegalPage | null> {
    const snap = await getDocs(collection(db, COL));
    const doc = snap.docs.find(d => d.id === pageId);
    return doc ? ({ ...doc.data(), id: doc.id } as LegalPage) : null;
}

/* ── Admin CRUD ──────────────────────────────────────────────── */

export async function createLegalPage(page: Omit<LegalPage, 'createdAt' | 'updatedAt'>): Promise<void> {
    const { id, ...rest } = page;
    await setDoc(doc(db, COL, id), { ...rest, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function updateLegalPage(id: string, updates: Partial<LegalPage>): Promise<void> {
    const { id: _id, ...rest } = updates as LegalPage;
    await updateDoc(doc(db, COL, id), { ...rest, updatedAt: serverTimestamp() });
}

export async function deleteLegalPage(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id));
}

/* ── Seed ────────────────────────────────────────────────────── */

export async function seedLegalPages(): Promise<number> {
    const existing = await getDocs(collection(db, COL));
    if (!existing.empty) return 0;

    const pages: Omit<LegalPage, 'createdAt' | 'updatedAt'>[] = [
        {
            id: 'terms', title: 'Terms & Conditions', subtitle: 'Conditions of Carriage — Effective March 2026',
            badge: 'Legal', badgeIcon: 'description', active: true,
            sections: [
                { id: 'definitions', title: '1. Definitions', icon: 'menu_book', content: [
                    '"Carrier" refers to Deltablue Jet Air Ltd., operating under the trade name DeltaBlue Jet Air.',
                    '"Passenger" refers to any person, except members of the crew, carried or to be carried in an aircraft pursuant to a Ticket.',
                    '"Ticket" means the electronic document issued by the Carrier confirming a booking.',
                    '"Booking" means a confirmed reservation for carriage on a specific flight, identified by a PNR.',
                    '"Fare" means the price charged for carriage of a Passenger and their baggage.',
                    '"Days" means calendar days, including Sundays and public holidays.',
                ] },
                { id: 'tickets', title: '2. Tickets & Reservations', icon: 'confirmation_number', content: [
                    'A Ticket is evidence of the contract of carriage between the Carrier and the Passenger. The Ticket is non-transferable.',
                    'Reservations may be made through the website, mobile application, authorized travel agents, or the contact center.',
                    'Each Booking is confirmed with a unique six-character PNR code.',
                    'The Carrier reserves the right to cancel a reservation if full payment is not received within the specified ticketing time limit.',
                ] },
                { id: 'fares', title: '3. Fares, Taxes & Payment', icon: 'payments', content: [
                    'Fares apply only for carriage from the airport at the point of origin to the airport at the point of destination.',
                    'All applicable taxes, airport charges, fuel surcharges, and government-imposed fees are collected in addition to the published fare.',
                    'Fares are guaranteed only upon receipt of full payment and issuance of an e-ticket.',
                ] },
                { id: 'cancellations', title: '4. Cancellation & Refund Policy', icon: 'event_busy', content: [
                    'Voluntary cancellations made more than 72 hours before departure: Economy (75%), Business (90%), First Class (100% minus admin fee).',
                    'Cancellations 24-72 hours before: Economy (50%), Business (75%), First Class (100% minus admin fee).',
                    'Cancellations less than 24 hours: Economy (non-refundable), Business (25%), First Class (100% minus admin fee).',
                    'Involuntary cancellations entitle Passengers to a full refund or rebooking at no additional cost.',
                    'Refunds are processed within 7–14 business days.',
                ] },
                { id: 'baggage', title: '5. Baggage', icon: 'luggage', content: [
                    'Carry-on baggage is limited to one bag not exceeding 8 kg and dimensions of 55 × 40 × 20 cm, plus one personal item.',
                    'The Carrier\'s liability for lost, delayed, or damaged baggage is limited in accordance with the Montreal Convention.',
                ] },
                { id: 'checkin', title: '6. Check-in & Boarding', icon: 'how_to_reg', content: [
                    'Online check-in opens 48 hours and closes 2 hours before scheduled departure.',
                    'Airport check-in counters open 3 hours and close 60 minutes before departure.',
                    'Boarding gates close 20 minutes before scheduled departure.',
                ] },
                { id: 'liability', title: '7. Liability', icon: 'gavel', content: [
                    'The Carrier\'s liability for death or bodily injury is governed by the Montreal Convention.',
                    'The Carrier is not liable for damage caused by compliance with applicable laws or circumstances beyond its control.',
                    'Any claim for damages must be submitted in writing within 21 days (7 days for baggage damage).',
                ] },
                { id: 'governing-law', title: '8. Governing Law', icon: 'balance', content: [
                    'These Conditions of Carriage shall be governed by applicable international aviation conventions including the Montreal Convention.',
                ] },
            ],
        },
        {
            id: 'privacy', title: 'Privacy Policy', subtitle: 'How we collect, use, and protect your personal data — Last updated March 2026',
            badge: 'Privacy', badgeIcon: 'shield', active: true,
            sections: [
                { id: 'collection', title: '1. Information We Collect', icon: 'database', content: [
                    'We collect Identity Data, Travel Document Data, Contact Data, Booking & Travel Data, Payment Data, Loyalty Data, Technical Data, and Communication Data.',
                ] },
                { id: 'usage', title: '2. How We Use Your Data', icon: 'settings', content: [
                    'We process your data for Booking & Travel Services, Legal Compliance, Safety & Security, Customer Service, Marketing (with consent), and Analytics.',
                ] },
                { id: 'sharing', title: '3. When We Share Your Data', icon: 'share', content: [
                    'We share data with Government Authorities, Airport Authorities, Payment Processors, Communication Providers, and Codeshare Partners. We never sell your personal data.',
                ] },
                { id: 'retention', title: '4. Data Retention', icon: 'schedule', content: [
                    'Booking Data: 3 years. Payment Data: 7 years. Loyalty Data: membership duration plus 2 years. Technical Logs: 12 months.',
                ] },
                { id: 'rights', title: '5. Your Rights', icon: 'verified_user', content: [
                    'Under GDPR/CCPA: Right of Access, Rectification, Erasure, Restrict Processing, Data Portability, Object, and Withdraw Consent.',
                    'Contact our Data Protection Officer at dpo@deltabluejet.com.',
                ] },
                { id: 'cookies', title: '6. Cookies & Tracking', icon: 'cookie', content: [
                    'Essential, Analytics, Marketing, and Preference cookies. Manage preferences via the cookie settings link in our footer.',
                ] },
                { id: 'security', title: '7. Data Security', icon: 'lock', content: [
                    'TLS 1.3 encryption, PCI-DSS compliant payment processing, role-based access controls, MFA for admin systems, regular security audits.',
                ] },
            ],
        },
        {
            id: 'dangerous-goods', title: 'Dangerous Goods', subtitle: 'Prohibited & restricted items for international flights — IATA compliant',
            badge: 'Safety', badgeIcon: 'warning', active: true,
            sections: [
                { id: 'explosives', title: 'Explosives', icon: 'bomb', content: ['Fireworks & flares', 'Ammunition', 'Detonators', 'Blasting caps', 'Christmas crackers'] },
                { id: 'flammable-liquids', title: 'Flammable Liquids', icon: 'local_fire_department', content: ['Gasoline / Petrol', 'Lighter fluid (large)', 'Paint thinners', 'Alcohol over 140 proof (70%)', 'Acetone'] },
                { id: 'toxic', title: 'Toxic Substances', icon: 'skull', content: ['Pesticides', 'Rat poison', 'Infectious substances', 'Biological agents', 'Medical waste'] },
                { id: 'corrosive', title: 'Corrosive Materials', icon: 'science', content: ['Acids (sulfuric, hydrochloric)', 'Wet-cell batteries', 'Mercury', 'Industrial bleach', 'Drain cleaners'] },
                { id: 'sharp', title: 'Sharp & Bladed Items', icon: 'carpenter', content: ['Knives & razors (carry-on)', 'Box cutters', 'Scissors over 10cm', 'Swords & machetes', 'Ice axes & ice picks'] },
            ],
        },
    ];

    let count = 0;
    for (const page of pages) {
        const { id, ...rest } = page;
        await setDoc(doc(db, COL, id), { ...rest, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        count++;
    }
    return count;
}
