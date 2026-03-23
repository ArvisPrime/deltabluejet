/**
 * Baggage Service — Deltablue Jet Air
 *
 * Fare-class-aware baggage allowances, excess pricing engine,
 * special items handling, and baggage claim management.
 */

import {
    collection, doc, addDoc, getDocs, getDoc, updateDoc,
    query, where, Timestamp, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import type { BaggageClaimDoc, BaggageClaimType } from '../types/firestore';

// ─── Baggage Allowance Defaults ────────────────────────────

export interface BaggageAllowance {
    fareClass: string;
    displayName: string;
    cabin: { count: number; maxWeightKg: number };
    checked: { count: number; maxWeightKg: number };
    personalItem: boolean;
}

const DEFAULT_ALLOWANCES: Record<string, BaggageAllowance> = {
    economy: {
        fareClass: 'economy',
        displayName: 'Economy',
        cabin: { count: 1, maxWeightKg: 8 },
        checked: { count: 1, maxWeightKg: 23 },
        personalItem: true,
    },
    business: {
        fareClass: 'business',
        displayName: 'Business',
        cabin: { count: 2, maxWeightKg: 10 },
        checked: { count: 2, maxWeightKg: 32 },
        personalItem: true,
    },
    first: {
        fareClass: 'first',
        displayName: 'First Class',
        cabin: { count: 2, maxWeightKg: 12 },
        checked: { count: 3, maxWeightKg: 32 },
        personalItem: true,
    },
};

export function getDefaultAllowance(fareClass: string): BaggageAllowance {
    const normalized = fareClass.toLowerCase().replace(/[^a-z]/g, '');
    return DEFAULT_ALLOWANCES[normalized] || DEFAULT_ALLOWANCES.economy;
}

export function getAllAllowances(): BaggageAllowance[] {
    return Object.values(DEFAULT_ALLOWANCES);
}

// ─── Excess Baggage Pricing ────────────────────────────────

export interface ExcessBagResult {
    extraBags: number;
    extraBagFee: number;      // cents
    overweightFee: number;    // cents
    totalFee: number;         // cents
    breakdown: string[];
}

const EXTRA_BAG_FEE_CENTS: Record<string, number> = {
    economy: 5000,     // $50 per extra bag
    business: 3500,    // $35
    first: 0,          // free extras for first class up to limit
};

const OVERWEIGHT_PER_KG_CENTS = 1500;  // $15/kg over limit
const MAX_TOTAL_BAGS = 5;

/**
 * Calculate excess baggage fees for a passenger.
 */
export function calculateExcessFee(
    fareClass: string,
    totalCheckedBags: number,
    totalWeightKg: number,
): ExcessBagResult {
    const allowance = getDefaultAllowance(fareClass);
    const breakdown: string[] = [];

    // Extra bags fee
    const extraBags = Math.max(0, Math.min(totalCheckedBags, MAX_TOTAL_BAGS) - allowance.checked.count);
    const perBagFee = EXTRA_BAG_FEE_CENTS[allowance.fareClass] || EXTRA_BAG_FEE_CENTS.economy;
    const extraBagFee = extraBags * perBagFee;

    if (extraBags > 0) {
        breakdown.push(`${extraBags} extra bag${extraBags > 1 ? 's' : ''} × $${(perBagFee / 100).toFixed(2)} = $${(extraBagFee / 100).toFixed(2)}`);
    }

    // Overweight fee
    const allowedWeight = allowance.checked.maxWeightKg * Math.max(totalCheckedBags, allowance.checked.count);
    const overweightKg = Math.max(0, totalWeightKg - allowedWeight);
    const overweightFee = overweightKg * OVERWEIGHT_PER_KG_CENTS;

    if (overweightKg > 0) {
        breakdown.push(`${overweightKg}kg overweight × $${(OVERWEIGHT_PER_KG_CENTS / 100).toFixed(2)}/kg = $${(overweightFee / 100).toFixed(2)}`);
    }

    if (breakdown.length === 0) {
        breakdown.push('Within your free baggage allowance');
    }

    return {
        extraBags,
        extraBagFee,
        overweightFee,
        totalFee: extraBagFee + overweightFee,
        breakdown,
    };
}

// ─── Special Items ─────────────────────────────────────────

export interface SpecialItemOption {
    id: string;
    name: string;
    icon: string;
    description: string;
    feeCents: number;
    requiresApproval: boolean;
}

export const SPECIAL_ITEMS: SpecialItemOption[] = [
    {
        id: 'sports',
        name: 'Sports Equipment',
        icon: 'sports_tennis',
        description: 'Golf bags, skis, surfboards, bicycles (must be properly packed)',
        feeCents: 7500,
        requiresApproval: false,
    },
    {
        id: 'instruments',
        name: 'Musical Instruments',
        icon: 'piano',
        description: 'Small instruments in cabin (guitar-size max). Larger items as checked baggage.',
        feeCents: 5000,
        requiresApproval: false,
    },
    {
        id: 'pet_cabin',
        name: 'Pet in Cabin',
        icon: 'pets',
        description: 'Small cats and dogs under 8kg (including carrier). Health certificate required.',
        feeCents: 12500,
        requiresApproval: true,
    },
    {
        id: 'pet_hold',
        name: 'Pet in Hold',
        icon: 'pet_supplies',
        description: 'Larger animals in temperature-controlled hold. IATA-compliant crate required.',
        feeCents: 20000,
        requiresApproval: true,
    },
    {
        id: 'wheelchair',
        name: 'Wheelchair / Mobility Aid',
        icon: 'accessible',
        description: 'Manual or powered wheelchair, mobility scooter. Carried free of charge.',
        feeCents: 0,
        requiresApproval: false,
    },
    {
        id: 'medical',
        name: 'Medical Equipment',
        icon: 'medical_services',
        description: 'CPAP machines, portable oxygen concentrators. Doctor\'s letter required.',
        feeCents: 0,
        requiresApproval: true,
    },
];

// ─── Baggage Claims ────────────────────────────────────────

const claimsRef = collection(db, 'baggage_claims');

export async function createBaggageClaim(
    bookingId: string,
    userId: string,
    pnr: string,
    type: BaggageClaimType,
    description: string,
    contactPhone: string,
    contactEmail: string,
    tagNumber: string,
    deliveryAddress?: string,
): Promise<string> {
    const claim: Omit<BaggageClaimDoc, 'id'> = {
        bookingId,
        userId,
        pnr,
        tagNumber,
        type,
        status: 'submitted',
        description,
        contactPhone,
        contactEmail,
        deliveryAddress,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(claimsRef, claim);
    return docRef.id;
}

export async function getUserClaims(userId: string): Promise<(BaggageClaimDoc & { id: string })[]> {
    const snap = await getDocs(query(claimsRef, where('userId', '==', userId)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as BaggageClaimDoc & { id: string }));
}

export async function getAllClaims(): Promise<(BaggageClaimDoc & { id: string })[]> {
    const snap = await getDocs(claimsRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as BaggageClaimDoc & { id: string }));
}

export async function updateClaimStatus(
    claimId: string,
    status: BaggageClaimDoc['status'],
    resolution?: string,
    compensationAmount?: number,
): Promise<void> {
    const ref = doc(db, 'baggage_claims', claimId);
    // Build a flat update object with only defined keys
    const base = { status, updatedAt: serverTimestamp() };
    if (resolution !== undefined && compensationAmount !== undefined) {
        await updateDoc(ref, { ...base, resolution, compensationAmount });
    } else if (resolution !== undefined) {
        await updateDoc(ref, { ...base, resolution });
    } else if (compensationAmount !== undefined) {
        await updateDoc(ref, { ...base, compensationAmount });
    } else {
        await updateDoc(ref, base);
    }
}
