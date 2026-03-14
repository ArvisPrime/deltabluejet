/**
 * Loyalty Admin Service
 * 
 * CRUD for rewards catalog and partner management.
 */

import {
    collection, doc, getDocs, addDoc, updateDoc, deleteDoc, setDoc, Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import type { LoyaltyReward } from './loyaltyService';

// ─── Partner Types ──────────────────────────────────────

export interface LoyaltyPartner {
    id: string;
    name: string;
    category: string;
    conversionRate: number; // points per $1
    logoUrl?: string;
    active: boolean;
}

// ─── Rewards CRUD ──────────────────────────────────────

export async function getAllRewards(): Promise<LoyaltyReward[]> {
    const snap = await getDocs(collection(db, 'loyalty_rewards'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as LoyaltyReward));
}

export async function createReward(data: Omit<LoyaltyReward, 'id'>): Promise<string> {
    const ref = await addDoc(collection(db, 'loyalty_rewards'), {
        ...data,
        createdAt: Timestamp.now(),
    });
    return ref.id;
}

export async function updateReward(id: string, data: Partial<LoyaltyReward>): Promise<void> {
    await updateDoc(doc(db, 'loyalty_rewards', id), {
        ...data,
        updatedAt: Timestamp.now(),
    });
}

export async function deleteReward(id: string): Promise<void> {
    await deleteDoc(doc(db, 'loyalty_rewards', id));
}

// ─── Partners CRUD ──────────────────────────────────────

export async function getAllPartners(): Promise<LoyaltyPartner[]> {
    const snap = await getDocs(collection(db, 'loyalty_partners'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as LoyaltyPartner));
}

export async function createPartner(data: Omit<LoyaltyPartner, 'id'>): Promise<string> {
    const ref = await addDoc(collection(db, 'loyalty_partners'), {
        ...data,
        createdAt: Timestamp.now(),
    });
    return ref.id;
}

export async function updatePartner(id: string, data: Partial<LoyaltyPartner>): Promise<void> {
    await updateDoc(doc(db, 'loyalty_partners', id), {
        ...data,
        updatedAt: Timestamp.now(),
    });
}

export async function deletePartner(id: string): Promise<void> {
    await deleteDoc(doc(db, 'loyalty_partners', id));
}
