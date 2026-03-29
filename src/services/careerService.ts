/**
 * Career Service — Firestore-backed job listings and career content.
 */

import {
    collection, doc, getDocs, setDoc, updateDoc, deleteDoc,
    onSnapshot, orderBy, query, serverTimestamp, type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

/* ── Types ───────────────────────────────────────────────────── */

export interface JobListing {
    id: string;
    title: string;
    department: string;
    location: string;
    type: string;
    icon: string;
    active: boolean;
    order: number;
    createdAt?: unknown;
    updatedAt?: unknown;
}

const COL = 'job_listings';

/* ── Real-time ───────────────────────────────────────────────── */

export function subscribeToJobs(callback: (jobs: JobListing[]) => void): Unsubscribe {
    const q = query(collection(db, COL), orderBy('order', 'asc'));
    return onSnapshot(q, snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as JobListing)));
    });
}

/* ── One-shot ────────────────────────────────────────────────── */

export async function getJobs(): Promise<JobListing[]> {
    const snap = await getDocs(query(collection(db, COL), orderBy('order', 'asc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as JobListing));
}

/* ── Admin CRUD ──────────────────────────────────────────────── */

export async function createJob(job: Omit<JobListing, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = doc(collection(db, COL));
    await setDoc(ref, { ...job, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return ref.id;
}

export async function updateJob(id: string, updates: Partial<JobListing>): Promise<void> {
    const { id: _id, ...rest } = updates as JobListing;
    await updateDoc(doc(db, COL, id), { ...rest, updatedAt: serverTimestamp() });
}

export async function deleteJob(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id));
}

/* ── Seed ────────────────────────────────────────────────────── */

const SEED: Omit<JobListing, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { order: 1, active: true, title: 'First Officer (Boeing 737)', department: 'Flight Operations', location: 'Banjul, The Gambia', type: 'Full-time', icon: 'flight' },
    { order: 2, active: true, title: 'Cabin Crew Member', department: 'In-Flight Services', location: 'Banjul, The Gambia', type: 'Full-time', icon: 'airline_seat_recline_extra' },
    { order: 3, active: true, title: 'Aircraft Maintenance Engineer', department: 'Engineering', location: 'Banjul, The Gambia', type: 'Full-time', icon: 'build' },
    { order: 4, active: true, title: 'Ground Operations Agent', department: 'Airport Services', location: 'Lagos, Nigeria', type: 'Full-time', icon: 'luggage' },
    { order: 5, active: true, title: 'Revenue Management Analyst', department: 'Commercial', location: 'Banjul, The Gambia', type: 'Full-time', icon: 'analytics' },
    { order: 6, active: true, title: 'Customer Service Representative', department: 'Customer Experience', location: 'Remote / Banjul', type: 'Full-time', icon: 'support_agent' },
    { order: 7, active: true, title: 'Software Engineer — Aviation Systems', department: 'Technology', location: 'Remote', type: 'Full-time', icon: 'code' },
    { order: 8, active: true, title: 'Safety & Compliance Officer', department: 'Safety', location: 'Banjul, The Gambia', type: 'Full-time', icon: 'verified_user' },
];

export async function seedJobs(): Promise<number> {
    const existing = await getDocs(collection(db, COL));
    if (!existing.empty) return 0;
    let count = 0;
    for (const job of SEED) {
        await setDoc(doc(collection(db, COL)), { ...job, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        count++;
    }
    return count;
}
