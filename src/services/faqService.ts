/**
 * FAQ Service — Firestore-backed FAQ management with seeding.
 *
 * Provides CRUD operations for FAQs displayed in the Help Center,
 * plus a one-time seed function to migrate the original hardcoded data.
 */

import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

/* ── Types ───────────────────────────────────────────────────── */

export interface FAQItem {
    id: string;
    question: string;
    answer: string;
    category: string;
    order: number;
    active: boolean;
    createdAt?: unknown;
    updatedAt?: unknown;
}

const COL = 'faqs';

/* ── Real-time Subscription ──────────────────────────────────── */

export function subscribeToFAQs(callback: (faqs: FAQItem[]) => void): Unsubscribe {
    const q = query(collection(db, COL), orderBy('order', 'asc'));
    return onSnapshot(q, (snap) => {
        const faqs = snap.docs.map(d => ({ id: d.id, ...d.data() } as FAQItem));
        callback(faqs);
    });
}

/* ── One-shot Fetch ──────────────────────────────────────────── */

export async function getFAQs(): Promise<FAQItem[]> {
    const q = query(collection(db, COL), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FAQItem));
}

/* ── Admin CRUD ──────────────────────────────────────────────── */

export async function createFAQ(faq: Omit<FAQItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = doc(collection(db, COL));
    await setDoc(ref, {
        ...faq,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updateFAQ(id: string, updates: Partial<FAQItem>): Promise<void> {
    const { id: _id, ...rest } = updates as FAQItem;
    await updateDoc(doc(db, COL, id), {
        ...rest,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteFAQ(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id));
}

/* ── Seed Data ───────────────────────────────────────────────── */

const SEED_FAQS: Omit<FAQItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
    // Booking
    { order: 1, category: 'Booking', active: true, question: 'How do I book a flight?', answer: 'Visit our homepage and use the flight search form. Enter your departure and destination cities, travel dates, number of passengers, and preferred cabin class. Click "Search Flights" to see available options, then follow the booking flow to complete your reservation.' },
    { order: 2, category: 'Booking', active: true, question: 'Can I book a multi-city itinerary?', answer: 'Yes! Select "Multi-City" on the flight search page. You can add up to 4 flight segments with different routes and dates. Multi-city bookings follow the same payment and confirmation process.' },
    { order: 3, category: 'Booking', active: true, question: 'How do I modify my booking?', answer: 'Go to "Manage Booking" and enter your booking reference (PNR) and last name. From there you can change dates, routes, or passenger details. Modification fees may apply depending on your fare class.' },
    { order: 4, category: 'Booking', active: true, question: 'What is the cancellation policy?', answer: 'Cancellation policies vary by fare class. Full Economy (Y class) tickets are fully refundable. Economy Standard and below are non-refundable but may receive credit for future travel. You can cancel online via the Manage Booking page.' },
    { order: 5, category: 'Booking', active: true, question: 'How do I book for a group of 10+ people?', answer: 'Visit our Group Booking page for groups of 10 or more passengers. You\'ll receive volume discounts ranging from 5% to 20% depending on group size. Our team will contact you within 24 hours with a personalized quote.' },
    // Baggage
    { order: 6, category: 'Baggage', active: true, question: 'What is the checked baggage allowance?', answer: 'Economy class: 1 bag up to 23kg. Business class: 2 bags up to 32kg each. First class: 3 bags up to 32kg each. Carry-on: 1 bag up to 7kg plus 1 personal item for all classes.' },
    { order: 7, category: 'Baggage', active: true, question: 'How do I add extra baggage?', answer: 'You can add extra baggage during booking, at online check-in, or at the airport. Pre-purchasing online is the most cost-effective option — typically 30-50% cheaper than airport counter fees.' },
    { order: 8, category: 'Baggage', active: true, question: 'What should I do if my baggage is lost or delayed?', answer: 'Report missing baggage immediately at the Baggage Service desk before leaving the airport. You\'ll receive a Property Irregularity Report (PIR) number to track your bag. Use our Baggage Tracking page to monitor status. Most delayed bags are delivered within 24-48 hours.' },
    { order: 9, category: 'Baggage', active: true, question: 'Can I track my checked baggage?', answer: 'Yes, use the Baggage Tracking feature on our website. Enter your PIR number or booking reference. We provide real-time updates on your bag\'s location from check-in to arrival.' },
    // Check-in
    { order: 10, category: 'Check-in', active: true, question: 'When does online check-in open?', answer: 'Online check-in opens 48 hours before departure and closes 2 hours before departure for international flights (1 hour for domestic). Check in early to get the best seat selection.' },
    { order: 11, category: 'Check-in', active: true, question: 'Can I choose my seat during check-in?', answer: 'Yes, you can select or change your seat during online check-in. Standard seats are complimentary; premium seats (extra legroom, exit row) may require an additional fee depending on your fare class.' },
    { order: 12, category: 'Check-in', active: true, question: 'Do I need to print my boarding pass?', answer: 'No, we accept mobile boarding passes on your smartphone. After completing online check-in, your boarding pass will be available in the app and via email. You can also add it to Apple Wallet or Google Wallet.' },
    // Loyalty
    { order: 13, category: 'Loyalty', active: true, question: 'How do I earn miles?', answer: 'Miles are earned on every Deltablue Jet Air flight based on distance flown and fare class. You also earn miles through our partner airlines, hotel bookings, car rentals, and credit card spending with our loyalty partners.' },
    { order: 14, category: 'Loyalty', active: true, question: 'What are the loyalty tier levels?', answer: 'We offer three tiers: Silver (10,000+ miles), Gold (25,000+ miles), and Platinum (50,000+ miles). Each tier offers increasing benefits including lounge access, priority boarding, extra baggage, and upgrade vouchers.' },
    { order: 15, category: 'Loyalty', active: true, question: 'How do I redeem my miles?', answer: 'Visit the Loyalty Redemption page in your account. You can redeem miles for flights, upgrades, extra baggage, or lounge access. Miles + Cash options let you use a combination of miles and money.' },
    // Payments
    { order: 16, category: 'Payments', active: true, question: 'What payment methods do you accept?', answer: 'We accept Visa, Mastercard, American Express, PayPal, bank transfers, and mobile money (for select markets). All payments are processed securely via Stripe with 3D Secure authentication.' },
    { order: 17, category: 'Payments', active: true, question: 'Is my payment information secure?', answer: 'Yes, we use bank-grade encryption and PCI DSS Level 1 compliance. All transactions are processed through Stripe — we never store your full card number. 3D Secure adds an extra layer of authentication.' },
    { order: 18, category: 'Payments', active: true, question: 'Can I pay in my local currency?', answer: 'Yes, we support 10 currencies including USD, EUR, GBP, GMD, XOF, and more. Use the currency selector on any page to switch. Exchange rates are updated hourly from live market data.' },
    // Disruptions
    { order: 19, category: 'Disruptions', active: true, question: 'What happens if my flight is cancelled?', answer: 'We will automatically rebook you on the next available flight at no extra cost. If the delay exceeds 2 hours, you\'re entitled to meal vouchers. For overnight delays, we arrange complimentary hotel accommodation and transport.' },
    { order: 20, category: 'Disruptions', active: true, question: 'Am I entitled to compensation for delays?', answer: 'For delays over 3 hours on arrival, you may be entitled to compensation under EU261-equivalent regulations: up to €250 for short-haul, €400 for medium-haul, and €600 for long-haul flights. Compensation does not apply in extraordinary circumstances.' },
    { order: 21, category: 'Disruptions', active: true, question: 'How will I be notified of flight changes?', answer: 'We send notifications via email, SMS, and push notifications (if enabled). Notifications are sent immediately when disruptions are detected, with rebooking information included when available.' },
    // Special Services
    { order: 22, category: 'Special Services', active: true, question: 'How do I request wheelchair assistance?', answer: 'Add special assistance during booking or through the Special Assistance page. We offer wheelchair assistance to/from the gate, onboard wheelchair, and meet-and-assist services. Request at least 48 hours before departure.' },
    { order: 23, category: 'Special Services', active: true, question: 'Can unaccompanied minors travel on Deltablue?', answer: 'Yes, children aged 5-14 travelling alone can use our Unaccompanied Minor (UMNR) service. The child is supervised from check-in to handoff at the destination. A mandatory fee applies and must be booked through our support team or Special Assistance page.' },
];

/**
 * Seed FAQs into Firestore. Checks if collection is empty first.
 * Returns the number of FAQs seeded, or 0 if already populated.
 */
export async function seedFAQs(): Promise<number> {
    const existing = await getDocs(collection(db, COL));
    if (!existing.empty) return 0; // Already seeded

    let count = 0;
    for (const faq of SEED_FAQS) {
        const ref = doc(collection(db, COL));
        await setDoc(ref, {
            ...faq,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        count++;
    }
    return count;
}
