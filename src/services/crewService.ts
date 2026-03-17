/**
 * Crew Management Service
 *
 * Manages crew members, qualifications, scheduling, and fatigue rules.
 */

import {
    collection, doc, getDocs, addDoc, updateDoc, deleteDoc, getDoc,
    query, where, orderBy, onSnapshot, Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

// ─── Types ──────────────────────────────────────────────

export type CrewRole = 'captain' | 'first_officer' | 'purser' | 'cabin_crew' | 'engineer';
export type CrewStatus = 'active' | 'on_leave' | 'training' | 'inactive';

export interface CrewMember {
    id: string;
    employeeId: string;
    name: string;
    role: CrewRole;
    status: CrewStatus;
    qualifications: string[];
    baseAirport: string;
    email: string;
    phone: string;
    hireDate: Timestamp;
    totalFlightHours: number;
    lastFlightDate?: Timestamp;
}

export interface CrewAssignment {
    id: string;
    crewMemberId: string;
    crewMemberName: string;
    crewRole: CrewRole;
    flightNumber: string;
    flightId?: string;       // Link to flights collection
    routeInfo?: string;      // e.g. "BJL → LOS"
    date: string;      // YYYY-MM-DD
    dutyStart: string;  // HH:mm
    dutyEnd: string;
    status: 'scheduled' | 'checked_in' | 'completed';
}

// ─── Fatigue Rules ──────────────────────────────────────

const MAX_DUTY_HOURS = 14;
const MIN_REST_HOURS = 10;
const MAX_WEEKLY_HOURS = 60;
const MAX_CONSECUTIVE_DAYS = 6;

export interface FatigueCheck {
    passed: boolean;
    violations: string[];
}

export function checkFatigueRules(
    assignments: CrewAssignment[],
    newAssignment: { date: string; dutyStart: string; dutyEnd: string },
): FatigueCheck {
    const violations: string[] = [];

    // Check duty hours for the day
    const dutyH = timeDiffHours(newAssignment.dutyStart, newAssignment.dutyEnd);
    if (dutyH > MAX_DUTY_HOURS) {
        violations.push(`Duty period ${dutyH.toFixed(1)}h exceeds ${MAX_DUTY_HOURS}h limit`);
    }

    // Check rest between assignments
    const sameDayOrPrev = assignments
        .filter(a => a.date <= newAssignment.date)
        .sort((a, b) => b.date.localeCompare(a.date));

    if (sameDayOrPrev.length > 0) {
        const prev = sameDayOrPrev[0];
        if (prev.date === newAssignment.date && prev.dutyEnd > newAssignment.dutyStart) {
            violations.push('Overlapping duty period');
        }
    }

    // Check consecutive days
    const recentDates = new Set(assignments.map(a => a.date));
    let consecutiveDays = 1;
    const d = new Date(newAssignment.date);
    for (let i = 1; i <= MAX_CONSECUTIVE_DAYS; i++) {
        d.setDate(d.getDate() - 1);
        if (recentDates.has(d.toISOString().slice(0, 10))) {
            consecutiveDays++;
        } else { break; }
    }
    if (consecutiveDays > MAX_CONSECUTIVE_DAYS) {
        violations.push(`${consecutiveDays} consecutive duty days exceeds ${MAX_CONSECUTIVE_DAYS}-day limit`);
    }

    // Check weekly hours
    const weekStart = new Date(newAssignment.date);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekAssignments = assignments.filter(a => a.date >= weekStart.toISOString().slice(0, 10) && a.date <= newAssignment.date);
    const weeklyHours = weekAssignments.reduce((sum, a) => sum + timeDiffHours(a.dutyStart, a.dutyEnd), 0) + dutyH;
    if (weeklyHours > MAX_WEEKLY_HOURS) {
        violations.push(`Weekly hours ${weeklyHours.toFixed(1)}h exceeds ${MAX_WEEKLY_HOURS}h limit`);
    }

    return { passed: violations.length === 0, violations };
}

function timeDiffHours(start: string, end: string): number {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
}

// ─── Crew CRUD ──────────────────────────────────────────

const crewRef = collection(db, 'crew_members');
const assignRef = collection(db, 'crew_assignments');

export async function getAllCrew(): Promise<CrewMember[]> {
    const snap = await getDocs(crewRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CrewMember));
}

/** Real-time subscription to crew members */
export function subscribeToCrew(callback: (crew: CrewMember[]) => void): () => void {
    return onSnapshot(crewRef, (snap) => {
        const members = snap.docs.map(d => ({ id: d.id, ...d.data() } as CrewMember));
        callback(members);
    });
}

export async function getCrewMember(id: string): Promise<CrewMember | null> {
    const snap = await getDoc(doc(crewRef, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as CrewMember : null;
}

export async function createCrewMember(data: Omit<CrewMember, 'id'>): Promise<string> {
    const ref = await addDoc(crewRef, { ...data, createdAt: Timestamp.now() });
    return ref.id;
}

export async function updateCrewMember(id: string, data: Partial<CrewMember>): Promise<void> {
    await updateDoc(doc(crewRef, id), { ...data, updatedAt: Timestamp.now() });
}

export async function deleteCrewMember(id: string): Promise<void> {
    await deleteDoc(doc(crewRef, id));
}

// ─── Assignments ────────────────────────────────────────

export async function getAssignments(crewId?: string, date?: string): Promise<CrewAssignment[]> {
    let q;
    if (crewId && date) {
        q = query(assignRef, where('crewMemberId', '==', crewId), where('date', '==', date));
    } else if (crewId) {
        q = query(assignRef, where('crewMemberId', '==', crewId), orderBy('date', 'desc'));
    } else if (date) {
        q = query(assignRef, where('date', '==', date));
    } else {
        q = query(assignRef, orderBy('date', 'desc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CrewAssignment));
}

/** Real-time subscription to assignments */
export function subscribeToAssignments(callback: (assignments: CrewAssignment[]) => void): () => void {
    const q = query(assignRef, orderBy('date', 'desc'));
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as CrewAssignment)));
    });
}

export async function createAssignment(data: Omit<CrewAssignment, 'id'>): Promise<{ id: string; fatigueCheck: FatigueCheck }> {
    // Run fatigue check first
    const existing = await getAssignments(data.crewMemberId);
    const fatigueCheck = checkFatigueRules(existing, data);

    // Allow creation but return warning
    const ref = await addDoc(assignRef, { ...data, createdAt: Timestamp.now() });
    return { id: ref.id, fatigueCheck };
}

export async function updateAssignment(id: string, data: Partial<CrewAssignment>): Promise<void> {
    await updateDoc(doc(assignRef, id), { ...data, updatedAt: Timestamp.now() });
}

export async function deleteAssignment(id: string): Promise<void> {
    await deleteDoc(doc(assignRef, id));
}

// ─── Role Labels ────────────────────────────────────────

export const ROLE_META: Record<CrewRole, { label: string; icon: string; color: string }> = {
    captain: { label: 'Captain', icon: 'military_tech', color: 'text-amber-600 bg-amber-50' },
    first_officer: { label: 'First Officer', icon: 'airline_seat_recline_extra', color: 'text-blue-600 bg-blue-50' },
    purser: { label: 'Purser', icon: 'badge', color: 'text-purple-600 bg-purple-50' },
    cabin_crew: { label: 'Cabin Crew', icon: 'person', color: 'text-emerald-600 bg-emerald-50' },
    engineer: { label: 'Engineer', icon: 'construction', color: 'text-red-600 bg-red-50' },
};
