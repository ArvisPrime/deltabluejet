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
