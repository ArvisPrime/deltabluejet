/**
 * Ancillary Revenue Service
 *
 * Manages add-on products: baggage, meals, lounge access, priority boarding.
 */

import {
    collection, doc, getDocs, addDoc, updateDoc, deleteDoc, getDoc, setDoc,
    query, where, Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

// ─── Types ──────────────────────────────────────────────

export type AncillaryCategory = 'baggage' | 'meal' | 'lounge' | 'priority' | 'wifi' | 'insurance';

export interface AncillaryProduct {
    id: string;
    name: string;
    description: string;
    category: AncillaryCategory;
    price: number;          // in cents
    currency: string;
    available: boolean;
    iconName?: string;      // Material symbol name
}

export interface BookingAncillary {
    productId: string;
    productName: string;
    category: AncillaryCategory;
    price: number;
    quantity: number;
    addedAt: Timestamp;
}

const CATEGORY_META: Record<AncillaryCategory, { label: string; icon: string; color: string }> = {
    baggage: { label: 'Extra Baggage', icon: 'luggage', color: 'text-blue-600 bg-blue-50' },
    meal: { label: 'In-Flight Meals', icon: 'restaurant', color: 'text-amber-600 bg-amber-50' },
    lounge: { label: 'Lounge Access', icon: 'weekend', color: 'text-purple-600 bg-purple-50' },
    priority: { label: 'Priority Boarding', icon: 'priority_high', color: 'text-emerald-600 bg-emerald-50' },
    wifi: { label: 'Wi-Fi Package', icon: 'wifi', color: 'text-indigo-600 bg-indigo-50' },
    insurance: { label: 'Travel Insurance', icon: 'shield', color: 'text-red-600 bg-red-50' },
};

export function getCategoryMeta(cat: AncillaryCategory) {
    return CATEGORY_META[cat] || CATEGORY_META.baggage;
}

// ─── Product Catalog CRUD ──────────────────────────────

export async function getAllProducts(): Promise<AncillaryProduct[]> {
    const snap = await getDocs(collection(db, 'ancillary_products'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AncillaryProduct));
}

export async function getAvailableProducts(): Promise<AncillaryProduct[]> {
    const q = query(collection(db, 'ancillary_products'), where('available', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AncillaryProduct));
}

export async function createProduct(data: Omit<AncillaryProduct, 'id'>): Promise<string> {
    const ref = await addDoc(collection(db, 'ancillary_products'), { ...data, createdAt: Timestamp.now() });
    return ref.id;
}

export async function updateProduct(id: string, data: Partial<AncillaryProduct>): Promise<void> {
    await updateDoc(doc(db, 'ancillary_products', id), { ...data, updatedAt: Timestamp.now() });
}

export async function deleteProduct(id: string): Promise<void> {
    await deleteDoc(doc(db, 'ancillary_products', id));
}

// ─── Booking Add-ons ────────────────────────────────────

export async function addAncillaryToBooking(
    bookingId: string,
    product: AncillaryProduct,
    quantity: number = 1,
): Promise<void> {
    const ancillary: BookingAncillary = {
        productId: product.id,
        productName: product.name,
        category: product.category,
        price: product.price,
        quantity,
        addedAt: Timestamp.now(),
    };
    await addDoc(collection(db, 'bookings', bookingId, 'ancillaries'), ancillary);

    // Also update the booking total
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);
    if (bookingSnap.exists()) {
        const current = bookingSnap.data();
        const addOnTotal = product.price * quantity;
        await updateDoc(bookingRef, {
            ancillaryTotal: (current.ancillaryTotal || 0) + addOnTotal,
            updatedAt: Timestamp.now(),
        });
    }
}

export async function getBookingAncillaries(bookingId: string): Promise<BookingAncillary[]> {
    const snap = await getDocs(collection(db, 'bookings', bookingId, 'ancillaries'));
    return snap.docs.map(d => d.data() as BookingAncillary);
}

// ─── Meal Pre-Selection ────────────────────────────────

export interface MealOption {
    id: string;
    name: string;
    dietaryType: string;
    description: string;
    priceCents: number;  // 0 for included
    included: boolean;
}

const MEAL_CATALOG: MealOption[] = [
    { id: 'std', name: 'Standard Meal', dietaryType: 'standard', description: 'Chef-curated main course with salad and dessert', priceCents: 0, included: true },
    { id: 'veg', name: 'Vegetarian', dietaryType: 'vegetarian', description: 'Plant-based entrée with seasonal vegetables', priceCents: 0, included: true },
    { id: 'vgn', name: 'Vegan', dietaryType: 'vegan', description: 'Fully plant-based meal, dairy and egg free', priceCents: 0, included: true },
    { id: 'hal', name: 'Halal', dietaryType: 'halal', description: 'Halal-certified meal prepared according to Islamic dietary laws', priceCents: 0, included: true },
    { id: 'kos', name: 'Kosher', dietaryType: 'kosher', description: 'Kosher-certified meal sealed by rabbinical authority', priceCents: 500, included: false },
    { id: 'gfr', name: 'Gluten Free', dietaryType: 'gluten_free', description: 'Carefully prepared without wheat, barley, or rye', priceCents: 0, included: true },
    { id: 'dia', name: 'Diabetic', dietaryType: 'diabetic', description: 'Low-sugar, balanced carbohydrate meal', priceCents: 0, included: true },
    { id: 'chd', name: 'Child Meal', dietaryType: 'child', description: 'Kid-friendly portions with familiar favourites', priceCents: 0, included: true },
    { id: 'prm', name: 'Premium Dining', dietaryType: 'standard', description: 'Multi-course gourmet experience with wine pairing', priceCents: 4500, included: false },
];

/**
 * Returns available meal options. Business/First classes get premium dining included.
 */
export function getMealOptions(fareClass: string = 'economy'): MealOption[] {
    const normalized = fareClass.toLowerCase();
    if (normalized === 'first' || normalized === 'business') {
        return MEAL_CATALOG.map(m => m.id === 'prm' ? { ...m, priceCents: 0, included: true } : m);
    }
    return MEAL_CATALOG;
}

// ─── Lounge Access ─────────────────────────────────────

export interface LoungeInfo {
    id: string;
    name: string;
    airportCode: string;
    terminal: string;
    priceCents: number;
    amenities: string[];
    openHours: string;
}

const LOUNGES: LoungeInfo[] = [
    { id: 'lng-jfk', name: 'DeltaBlue Sky Lounge', airportCode: 'JFK', terminal: 'T4', priceCents: 5500, amenities: ['Shower suites', 'Bar', 'Buffet dining', 'Business centre', 'Nap pods'], openHours: '05:00–23:00' },
    { id: 'lng-lhr', name: 'DeltaBlue Crown Lounge', airportCode: 'LHR', terminal: 'T5', priceCents: 4500, amenities: ['Spa treatments', 'À la carte dining', 'Runway views', 'Kids zone'], openHours: '06:00–22:00' },
    { id: 'lng-dxb', name: 'DeltaBlue Oasis Lounge', airportCode: 'DXB', terminal: 'T3', priceCents: 6000, amenities: ['Swimming pool', 'Fine dining', 'Cigar lounge', 'Prayer rooms', 'Business centre'], openHours: '24 hours' },
    { id: 'lng-sin', name: 'DeltaBlue Garden Lounge', airportCode: 'SIN', terminal: 'T1', priceCents: 5000, amenities: ['Rooftop garden', 'Spa', 'Local cuisine', 'Quiet zone'], openHours: '24 hours' },
    { id: 'lng-los', name: 'DeltaBlue Balmoral Lounge', airportCode: 'LOS', terminal: 'Int\'l', priceCents: 3500, amenities: ['Buffet meals', 'Wi-Fi', 'Shower facilities', 'Business desks'], openHours: '05:00–23:30' },
];

/**
 * Returns available lounges at the given airport. Business/First class get complimentary access.
 */
export function getLoungeAvailability(airportCode?: string, fareClass: string = 'economy'): LoungeInfo[] {
    const normalized = fareClass.toLowerCase();
    const isComplementary = normalized === 'first' || normalized === 'business';
    const filtered = airportCode
        ? LOUNGES.filter(l => l.airportCode === airportCode.toUpperCase())
        : LOUNGES;
    return isComplementary
        ? filtered.map(l => ({ ...l, priceCents: 0 }))
        : filtered;
}

// ─── Priority Boarding ─────────────────────────────────

export interface PriorityBoardingOption {
    id: string;
    name: string;
    description: string;
    priceCents: number;
    included: boolean;
}

export function getPriorityBoardingPrice(fareClass: string = 'economy'): PriorityBoardingOption {
    const normalized = fareClass.toLowerCase();
    if (normalized === 'first') {
        return { id: 'prio-first', name: 'Priority Boarding', description: 'Board first with First Class passengers', priceCents: 0, included: true };
    }
    if (normalized === 'business') {
        return { id: 'prio-biz', name: 'Priority Boarding', description: 'Board with Business Class passengers', priceCents: 0, included: true };
    }
    return { id: 'prio-eco', name: 'Priority Boarding', description: 'Skip the queue and board early with Zone 1', priceCents: 1500, included: false };
}

// ─── Travel Insurance ──────────────────────────────────

export interface InsurancePlan {
    id: string;
    name: string;
    coverageType: 'basic' | 'standard' | 'premium';
    premiumCents: number;
    coverageAmountCents: number;
    coverageDetails: string[];
}

const INSURANCE_PLANS: InsurancePlan[] = [
    {
        id: 'ins-basic', name: 'Basic Protection', coverageType: 'basic',
        premiumCents: 1200, coverageAmountCents: 500000,
        coverageDetails: ['Trip cancellation up to $5,000', 'Lost baggage up to $1,000', '24/7 emergency hotline'],
    },
    {
        id: 'ins-standard', name: 'Standard Protection', coverageType: 'standard',
        premiumCents: 2500, coverageAmountCents: 2500000,
        coverageDetails: ['Trip cancellation up to $25,000', 'Lost baggage up to $3,000', 'Medical expenses up to $50,000', 'Trip delay coverage ($200/day)', '24/7 emergency hotline'],
    },
    {
        id: 'ins-premium', name: 'Premium Protection', coverageType: 'premium',
        premiumCents: 4900, coverageAmountCents: 10000000,
        coverageDetails: ['Trip cancellation up to $100,000', 'Lost baggage up to $5,000', 'Medical expenses up to $500,000', 'Trip delay coverage ($500/day)', 'Emergency evacuation & repatriation', 'Rental car damage coverage', '24/7 concierge service'],
    },
];

export function getInsuranceQuotes(): InsurancePlan[] {
    return INSURANCE_PLANS;
}

