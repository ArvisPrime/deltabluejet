/**
 * Codeshare & Interline Service — Deltablue Jet Air
 *
 * Partner airline registry, marketing↔operating carrier mapping,
 * through-check-in logic, and interline baggage rules.
 */

import {
    collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

// ─── Types ────────────────────────────────────────────────

export interface PartnerAirline {
    id: string;
    code: string;           // IATA 2-letter
    name: string;
    logo?: string;
    agreementType: 'codeshare' | 'interline' | 'both';
    agreementStart: string;  // ISO date
    agreementEnd: string;
    active: boolean;
    throughCheckin: boolean;
    baggageTransfer: boolean;
    loyaltyAccrual: boolean;
    loyaltyRedemption: boolean;
    contactEmail: string;
    notes: string;
}

export interface CodeshareRoute {
    id: string;
    partnerId: string;
    partnerCode: string;
    marketingFlightNumber: string;  // e.g. "DB-2101"
    operatingFlightNumber: string;  // e.g. "BA-075"
    operatingCarrier: string;
    origin: string;
    destination: string;
    daysOfWeek: number[];
    active: boolean;
    fareClasses: string[];
}

export interface InterlineBaggageRule {
    id: string;
    partnerId: string;
    partnerCode: string;
    routeType: 'domestic' | 'international' | 'all';
    maxPieces: number;
    maxWeightKg: number;
    throughTag: boolean;
    specialItemsAccepted: boolean;
    notes: string;
}

// ─── Partner Airlines CRUD ────────────────────────────────

const partnersRef = collection(db, 'partner_airlines');

export async function getPartnerAirlines(): Promise<PartnerAirline[]> {
    const snap = await getDocs(partnersRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PartnerAirline));
}

export async function getActivePartners(): Promise<PartnerAirline[]> {
    const q = query(partnersRef, where('active', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PartnerAirline));
}

export async function getPartnerByCode(code: string): Promise<PartnerAirline | null> {
    const q = query(partnersRef, where('code', '==', code));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as PartnerAirline;
}

export async function savePartnerAirline(data: Omit<PartnerAirline, 'id'>, id?: string): Promise<string> {
    if (id) {
        const ref = doc(partnersRef, id);
        await updateDoc(ref, { ...data, updatedAt: Timestamp.now() } as any);
        return id;
    }
    const ref = doc(partnersRef);
    await setDoc(ref, { ...data, createdAt: Timestamp.now() });
    return ref.id;
}

export async function deletePartnerAirline(id: string): Promise<void> {
    await deleteDoc(doc(partnersRef, id));
}

// ─── Codeshare Routes ─────────────────────────────────────

const codesharesRef = collection(db, 'codeshare_routes');

export async function getCodeshareRoutes(): Promise<CodeshareRoute[]> {
    const snap = await getDocs(codesharesRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CodeshareRoute));
}

export async function getCodesharesByPartner(partnerId: string): Promise<CodeshareRoute[]> {
    const q = query(codesharesRef, where('partnerId', '==', partnerId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CodeshareRoute));
}

export async function saveCodeshareRoute(data: Omit<CodeshareRoute, 'id'>, id?: string): Promise<string> {
    if (id) {
        await updateDoc(doc(codesharesRef, id), { ...data, updatedAt: Timestamp.now() } as any);
        return id;
    }
    const ref = doc(codesharesRef);
    await setDoc(ref, { ...data, createdAt: Timestamp.now() });
    return ref.id;
}

export async function deleteCodeshareRoute(id: string): Promise<void> {
    await deleteDoc(doc(codesharesRef, id));
}

// ─── Interline Baggage Rules ──────────────────────────────

const baggageRulesRef = collection(db, 'interline_baggage_rules');

export async function getInterlineBaggageRules(): Promise<InterlineBaggageRule[]> {
    const snap = await getDocs(baggageRulesRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as InterlineBaggageRule));
}

export async function getBaggageRulesByPartner(partnerId: string): Promise<InterlineBaggageRule[]> {
    const q = query(baggageRulesRef, where('partnerId', '==', partnerId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as InterlineBaggageRule));
}

export async function saveInterlineBaggageRule(data: Omit<InterlineBaggageRule, 'id'>, id?: string): Promise<string> {
    if (id) {
        await updateDoc(doc(baggageRulesRef, id), { ...data, updatedAt: Timestamp.now() } as any);
        return id;
    }
    const ref = doc(baggageRulesRef);
    await setDoc(ref, { ...data, createdAt: Timestamp.now() });
    return ref.id;
}

// ─── Through-Check-In Logic ──────────────────────────────

export function supportsThroughCheckin(partner: PartnerAirline, _route?: CodeshareRoute): boolean {
    return partner.active && partner.throughCheckin;
}

export function supportsBaggageTransfer(partner: PartnerAirline): boolean {
    return partner.active && partner.baggageTransfer;
}

// ─── Display Helpers ─────────────────────────────────────

export function formatCarrierDisplay(marketingFlight: string, operatingCarrier: string, operatingFlight: string): {
    primary: string; secondary: string; badge: string;
} {
    return {
        primary: marketingFlight,
        secondary: `Operated by ${operatingCarrier} as ${operatingFlight}`,
        badge: 'Codeshare',
    };
}
