/**
 * Health Requirements Service — Firestore-backed health & vaccination data.
 */

import {
    collection, doc, getDocs, setDoc, updateDoc, deleteDoc,
    onSnapshot, orderBy, query, serverTimestamp, type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

/* ── Types ───────────────────────────────────────────────────── */

export interface Vaccination {
    name: string;
    required: boolean;
    notes: string;
}

export interface HealthRequirement {
    id: string;
    destination: string;
    country: string;
    region: string;
    vaccinations: Vaccination[];
    covidPolicy: string;
    malariaRisk: boolean;
    malariaInfo: string;
    travelAdvisory: 'none' | 'caution' | 'restricted';
    additionalNotes: string;
    active: boolean;
    createdAt?: unknown;
    updatedAt?: unknown;
}

const COL = 'health_requirements';

/* ── Real-time ───────────────────────────────────────────────── */

export function subscribeToHealthReqs(callback: (reqs: HealthRequirement[]) => void): Unsubscribe {
    const q = query(collection(db, COL), orderBy('destination', 'asc'));
    return onSnapshot(q, snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as HealthRequirement)));
    });
}

/* ── One-shot ────────────────────────────────────────────────── */

export async function getHealthReqs(): Promise<HealthRequirement[]> {
    const snap = await getDocs(query(collection(db, COL), orderBy('destination', 'asc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as HealthRequirement));
}

/* ── Admin CRUD ──────────────────────────────────────────────── */

export async function createHealthReq(req: Omit<HealthRequirement, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = doc(collection(db, COL));
    await setDoc(ref, { ...req, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return ref.id;
}

export async function updateHealthReq(id: string, updates: Partial<HealthRequirement>): Promise<void> {
    const { id: _id, ...rest } = updates as HealthRequirement;
    await updateDoc(doc(db, COL, id), { ...rest, updatedAt: serverTimestamp() });
}

export async function deleteHealthReq(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id));
}

/* ── Seed ────────────────────────────────────────────────────── */

const SEED: Omit<HealthRequirement, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
        destination: 'BJL', country: 'The Gambia', region: 'West Africa', active: true,
        vaccinations: [
            { name: 'Yellow Fever', required: true, notes: 'Required for all travellers over 9 months of age' },
            { name: 'COVID-19', required: false, notes: 'Recommended — no longer mandatory' },
            { name: 'Hepatitis A', required: false, notes: 'Recommended for all travellers' },
            { name: 'Typhoid', required: false, notes: 'Recommended for most travellers' },
        ],
        covidPolicy: 'No COVID-19 restrictions currently in place. Proof of vaccination recommended but not required.',
        malariaRisk: true, malariaInfo: 'High risk throughout the year. Antimalarial prophylaxis strongly recommended.',
        travelAdvisory: 'none', additionalNotes: 'Yellow Fever vaccination certificate is checked on arrival.',
    },
    {
        destination: 'DSS', country: 'Senegal', region: 'West Africa', active: true,
        vaccinations: [
            { name: 'Yellow Fever', required: true, notes: 'Required if arriving from an endemic area' },
            { name: 'COVID-19', required: false, notes: 'No longer required' },
            { name: 'Meningococcal', required: false, notes: 'Recommended during dry season (Dec-Jun)' },
        ],
        covidPolicy: 'No COVID-19 entry restrictions. Health declaration form may be required.',
        malariaRisk: true, malariaInfo: 'Risk present year-round, higher during rainy season (Jul-Oct).',
        travelAdvisory: 'none', additionalNotes: '',
    },
    {
        destination: 'LHR', country: 'United Kingdom', region: 'Europe', active: true,
        vaccinations: [
            { name: 'COVID-19', required: false, notes: 'No vaccination requirements' },
            { name: 'Routine Vaccines', required: false, notes: 'Ensure standard vaccinations are up to date' },
        ],
        covidPolicy: 'No COVID-19 restrictions. No testing or quarantine requirements.',
        malariaRisk: false, malariaInfo: '',
        travelAdvisory: 'none', additionalNotes: 'Visa may be required depending on nationality. Check UK visa requirements.',
    },
    {
        destination: 'JFK', country: 'United States', region: 'North America', active: true,
        vaccinations: [
            { name: 'COVID-19', required: false, notes: 'No vaccination requirement for air travel' },
            { name: 'Routine Vaccines', required: false, notes: 'Ensure MMR, Tdap, and influenza vaccinations are current' },
        ],
        covidPolicy: 'No COVID-19 restrictions for inbound travellers.',
        malariaRisk: false, malariaInfo: '',
        travelAdvisory: 'none', additionalNotes: 'ESTA or visa required. Customs declaration form completed on arrival.',
    },
    {
        destination: 'DXB', country: 'United Arab Emirates', region: 'Middle East', active: true,
        vaccinations: [
            { name: 'Yellow Fever', required: true, notes: 'Required if arriving from an endemic country' },
            { name: 'COVID-19', required: false, notes: 'No longer mandatory' },
            { name: 'Polio', required: false, notes: 'May be required from specific countries' },
        ],
        covidPolicy: 'No COVID-19 restrictions. PCR testing centres available at airports.',
        malariaRisk: false, malariaInfo: '',
        travelAdvisory: 'none', additionalNotes: 'Visa on arrival for many nationalities. Check UAE ICP for eligibility.',
    },
    {
        destination: 'ACC', country: 'Ghana', region: 'West Africa', active: true,
        vaccinations: [
            { name: 'Yellow Fever', required: true, notes: 'Required for all travellers' },
            { name: 'COVID-19', required: false, notes: 'Recommended but not mandatory' },
            { name: 'Hepatitis B', required: false, notes: 'Recommended for extended stays' },
        ],
        covidPolicy: 'No COVID-19 restrictions currently in effect.',
        malariaRisk: true, malariaInfo: 'High risk throughout the country year-round. Prophylaxis essential.',
        travelAdvisory: 'none', additionalNotes: 'Visa required for most nationalities. Apply online via Ghana E-Visa portal.',
    },
];

export async function seedHealthReqs(): Promise<number> {
    const existing = await getDocs(collection(db, COL));
    if (!existing.empty) return 0;
    let count = 0;
    for (const req of SEED) {
        await setDoc(doc(collection(db, COL)), { ...req, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        count++;
    }
    return count;
}
