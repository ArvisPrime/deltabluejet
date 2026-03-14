/**
 * Customer Service — Deltablue Jet Air
 *
 * Customer profile management, booking history, and saved travelers.
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import type {
    CustomerDoc,
    SavedTravelerDoc,
    BookingDoc,
} from '../types/firestore';

const customersRef = collection(db, 'customers');

// ─── Customer Profile ──────────────────────────────────────

const DEFAULT_PREFERENCES: CustomerDoc['preferences'] = {
    seatPreference: 'none',
    mealPreference: 'standard',
    emailNotifications: true,
    smsNotifications: false,
};

/**
 * Get or create a customer profile. Auto-creates on first access.
 */
export async function getOrCreateCustomer(
    uid: string,
    email: string,
    displayName: string,
): Promise<CustomerDoc> {
    const docRef = doc(customersRef, uid);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
        return { uid: snap.id, ...snap.data() } as CustomerDoc;
    }

    // Auto-create on first access
    const newCustomer: Omit<CustomerDoc, 'uid'> = {
        email,
        displayName,
        phone: null,
        nationality: null,
        documentType: null,
        documentNumber: null,
        documentExpiry: null,
        dateOfBirth: null,
        preferences: DEFAULT_PREFERENCES,
        loyaltyTier: 'bronze',
        totalTrips: 0,
        gdprConsent: false,
        marketingOptIn: false,
        consentUpdatedAt: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    await setDoc(docRef, newCustomer);
    return { uid, ...newCustomer };
}

/**
 * Get customer profile by UID.
 */
export async function getCustomer(uid: string): Promise<CustomerDoc | null> {
    const snap = await getDoc(doc(customersRef, uid));
    return snap.exists() ? { uid: snap.id, ...snap.data() } as CustomerDoc : null;
}

/**
 * Update customer profile fields.
 */
export async function updateCustomer(
    uid: string,
    data: Partial<Omit<CustomerDoc, 'uid' | 'createdAt'>>,
): Promise<void> {
    await setDoc(doc(customersRef, uid), {
        ...data,
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

// ─── Booking History ───────────────────────────────────────

/**
 * Get booking history for a customer, latest first.
 */
export async function getBookingHistory(
    uid: string,
    maxResults = 20,
): Promise<BookingDoc[]> {
    const q = query(
        collection(db, 'bookings'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(maxResults),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BookingDoc);
}

// ─── Saved Travelers ───────────────────────────────────────

function travelersRef(uid: string) {
    return collection(db, `customers/${uid}/savedTravelers`);
}

/**
 * Get all saved travelers for a customer.
 */
export async function getSavedTravelers(uid: string): Promise<SavedTravelerDoc[]> {
    const q = query(travelersRef(uid), orderBy('lastName', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SavedTravelerDoc);
}

/**
 * Add a new saved traveler.
 */
export async function addSavedTraveler(
    uid: string,
    data: Omit<SavedTravelerDoc, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
    const docRef = await addDoc(travelersRef(uid), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    return docRef.id;
}

/**
 * Update an existing saved traveler.
 */
export async function updateSavedTraveler(
    uid: string,
    travelerId: string,
    data: Partial<Omit<SavedTravelerDoc, 'id' | 'createdAt'>>,
): Promise<void> {
    await updateDoc(doc(travelersRef(uid), travelerId), {
        ...data,
        updatedAt: Timestamp.now(),
    });
}

/**
 * Delete a saved traveler.
 */
export async function deleteSavedTraveler(uid: string, travelerId: string): Promise<void> {
    await deleteDoc(doc(travelersRef(uid), travelerId));
}
