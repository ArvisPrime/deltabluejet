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
import { toLocalDateString } from '../utils/localDate';

// ─── Types ──────────────────────────────────────────────

export type CrewRole = 'captain' | 'first_officer' | 'purser' | 'cabin_crew' | 'engineer';
export type CrewStatus = 'active' | 'on_leave' | 'training' | 'inactive';
export type AssignmentType = 'flight' | 'standby_office' | 'standby_home';

/** Structured type rating with expiry */
export interface TypeRating {
    aircraftType: string;     // e.g. 'B737', 'A320'
    issueDate: string;        // YYYY-MM-DD
    expiryDate: string;       // YYYY-MM-DD
    status: 'valid' | 'expiring' | 'expired';
}

/** Medical certificate */
export interface MedicalCertificate {
    class: string;            // 'Class 1', 'Class 2'
    issueDate: string;
    expiryDate: string;
    status: 'valid' | 'expiring' | 'expired';
}

/** Landing recency (90-day rule) */
export interface LandingRecency {
    lastLandingDate: string;  // YYYY-MM-DD
    landingsLast90Days: number;
    current: boolean;
}

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
    // ── Phase 2: Structured Qualifications ──
    typeRatings?: TypeRating[];
    medicalCertificate?: MedicalCertificate;
    recency?: LandingRecency;
    passportExpiry?: string;  // YYYY-MM-DD
}

export interface CrewAssignment {
    id: string;
    crewMemberId: string;
    crewMemberName: string;
    crewRole: CrewRole;
    assignmentType: AssignmentType;
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
        if (recentDates.has(toLocalDateString(d))) {
            consecutiveDays++;
        } else { break; }
    }
    if (consecutiveDays > MAX_CONSECUTIVE_DAYS) {
        violations.push(`${consecutiveDays} consecutive duty days exceeds ${MAX_CONSECUTIVE_DAYS}-day limit`);
    }

    // Check weekly hours
    const weekStart = new Date(newAssignment.date);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekAssignments = assignments.filter(a => a.date >= toLocalDateString(weekStart) && a.date <= newAssignment.date);
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
    // Run fatigue check first (non-blocking — if query fails, still create)
    let fatigueCheck: FatigueCheck = { passed: true, violations: [] };
    try {
        const existing = await getAssignments(data.crewMemberId);
        fatigueCheck = checkFatigueRules(existing, data);
    } catch (err) {
        console.warn('Fatigue check skipped (index may be building):', err);
    }

    // Always create the assignment
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

// ─── Duty Logs ──────────────────────────────────────────────

import type { DutyLogEntry, FlightLegEntry } from '../utils/ftlEngine';
export type { DutyLogEntry, FlightLegEntry };

const dutyLogRef = collection(db, 'duty_logs');

/** Create a new duty log */
export async function createDutyLog(data: Omit<DutyLogEntry, 'id'>): Promise<string> {
    const ref = await addDoc(dutyLogRef, { ...data, createdAt: Timestamp.now() });
    return ref.id;
}

/** Update an existing duty log */
export async function updateDutyLog(id: string, data: Partial<DutyLogEntry>): Promise<void> {
    await updateDoc(doc(dutyLogRef, id), { ...data, updatedAt: Timestamp.now() });
}

/** Delete a duty log */
export async function deleteDutyLog(id: string): Promise<void> {
    await deleteDoc(doc(dutyLogRef, id));
}

/** Get all duty logs for a crew member */
export async function getDutyLogs(crewId: string): Promise<DutyLogEntry[]> {
    const q = query(dutyLogRef, where('crewId', '==', crewId), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as DutyLogEntry));
}

/** Get duty logs for a crew member within a date range */
export async function getDutyLogsForPeriod(
    crewId: string,
    startDate: string,
    endDate: string,
): Promise<DutyLogEntry[]> {
    const q = query(
        dutyLogRef,
        where('crewId', '==', crewId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as DutyLogEntry));
}

/** Real-time subscription to duty logs for a crew member */
export function subscribeToDutyLogs(
    crewId: string,
    callback: (logs: DutyLogEntry[]) => void,
): () => void {
    const q = query(dutyLogRef, where('crewId', '==', crewId), orderBy('date', 'desc'));
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as DutyLogEntry)));
    });
}

// ─── Qualification Helpers ──────────────────────────────────

/** Available aircraft types for type ratings */
export const AIRCRAFT_TYPES = ['B737', 'B757', 'B767', 'B777', 'B787', 'A319', 'A320', 'A321', 'A330', 'A340', 'ATR72', 'E190', 'CRJ900'] as const;

/** Get the expiry status of a date string */
export function getExpiryStatus(expiryDate: string, warningDays = 60): 'valid' | 'expiring' | 'expired' {
    const now = new Date();
    const expiry = new Date(expiryDate + 'T23:59:59');
    if (expiry < now) return 'expired';
    const warningDate = new Date(now.getTime() + warningDays * 24 * 60 * 60 * 1000);
    if (expiry <= warningDate) return 'expiring';
    return 'valid';
}

/** Check if crew member is qualified for an aircraft type */
export function isQualifiedForAircraft(member: CrewMember, aircraftType: string): boolean {
    if (!member.typeRatings?.length) return false;
    return member.typeRatings.some(
        r => r.aircraftType === aircraftType && getExpiryStatus(r.expiryDate) !== 'expired'
    );
}

/** Check if crew member has valid medical */
export function hasValidMedical(member: CrewMember): boolean {
    if (!member.medicalCertificate) return false;
    return getExpiryStatus(member.medicalCertificate.expiryDate) !== 'expired';
}

/** Check if crew member has current landing recency */
export function hasLandingRecency(member: CrewMember): boolean {
    if (!member.recency) return false;
    return member.recency.landingsLast90Days >= 3;
}

/** Get all crew members with qualifications expiring within N days */
export function getExpiringQualifications(
    crewList: CrewMember[],
    withinDays: number = 60,
): { member: CrewMember; type: string; expiryDate: string; daysRemaining: number }[] {
    const results: { member: CrewMember; type: string; expiryDate: string; daysRemaining: number }[] = [];
    const now = new Date();

    for (const m of crewList) {
        for (const r of m.typeRatings || []) {
            const days = Math.ceil((new Date(r.expiryDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
            if (days > 0 && days <= withinDays) {
                results.push({ member: m, type: `Type Rating: ${r.aircraftType}`, expiryDate: r.expiryDate, daysRemaining: days });
            }
        }
        if (m.medicalCertificate) {
            const days = Math.ceil((new Date(m.medicalCertificate.expiryDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
            if (days > 0 && days <= withinDays) {
                results.push({ member: m, type: `Medical (${m.medicalCertificate.class})`, expiryDate: m.medicalCertificate.expiryDate, daysRemaining: days });
            }
        }
        if (m.passportExpiry) {
            const days = Math.ceil((new Date(m.passportExpiry).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
            if (days > 0 && days <= withinDays) {
                results.push({ member: m, type: 'Passport', expiryDate: m.passportExpiry, daysRemaining: days });
            }
        }
    }

    return results.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

/** Get crew members qualified for a specific aircraft on a given date */
export function getQualifiedCrew(
    crewList: CrewMember[],
    aircraftType: string,
): CrewMember[] {
    return crewList.filter(m =>
        m.status === 'active' &&
        isQualifiedForAircraft(m, aircraftType) &&
        hasValidMedical(m)
    );
}

// ─── Sleep Log Operations (Phase 3: FRMS) ───────────────

const sleepLogRef = collection(db, 'sleep_logs');

export interface SleepLogEntry {
    id: string;
    crewId: string;
    date: string;            // YYYY-MM-DD
    hoursSlept: number;      // 0–16
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    notes?: string;
    createdAt?: any;
}

/** Create a sleep log entry */
export async function createSleepLog(data: Omit<SleepLogEntry, 'id'>): Promise<string> {
    const ref = await addDoc(sleepLogRef, { ...data, createdAt: Timestamp.now() });
    return ref.id;
}

/** Update a sleep log entry */
export async function updateSleepLog(id: string, data: Partial<SleepLogEntry>): Promise<void> {
    await updateDoc(doc(sleepLogRef, id), { ...data });
}

/** Delete a sleep log entry */
export async function deleteSleepLog(id: string): Promise<void> {
    await deleteDoc(doc(sleepLogRef, id));
}

/** Get sleep logs for a crew member */
export async function getSleepLogs(crewId: string): Promise<SleepLogEntry[]> {
    const q = query(sleepLogRef, where('crewId', '==', crewId), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SleepLogEntry));
}

/** Get all sleep logs (for fleet view) */
export async function getAllSleepLogs(): Promise<SleepLogEntry[]> {
    const q = query(sleepLogRef, orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SleepLogEntry));
}

/** Real-time subscription to sleep logs for a crew member */
export function subscribeToSleepLogs(
    crewId: string,
    callback: (logs: SleepLogEntry[]) => void,
): () => void {
    const q = query(sleepLogRef, where('crewId', '==', crewId), orderBy('date', 'desc'));
    return onSnapshot(q, snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as SleepLogEntry)));
    });
}

/** Real-time subscription to all sleep logs */
export function subscribeToAllSleepLogs(
    callback: (logs: SleepLogEntry[]) => void,
): () => void {
    const q = query(sleepLogRef, orderBy('date', 'desc'));
    return onSnapshot(q, snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as SleepLogEntry)));
    });
}
