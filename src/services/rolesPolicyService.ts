import {
  collection, doc, getDocs, getDoc, setDoc, deleteDoc,
  query, orderBy, Timestamp, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

/* ── Types ─────────────────────────────────────────────────── */
export interface RoleDoc {
  id: string;
  label: string;
  color: string;
  description: string;
  modules: string[];
  isBuiltIn: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface GroupPolicyDoc {
  id: string;
  name: string;
  description: string;
  roleId: string;
  assignedUsers: string[];
  enforced: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

/* ── Built-in roles (read-only, not stored in Firestore) ──── */
export const BUILT_IN_ROLES: RoleDoc[] = [
  { id: 'super_admin', label: 'Super Admin', color: '#dc2626', description: 'Full system access. Cannot be modified.', modules: ['*'], isBuiltIn: true, createdAt: null, updatedAt: null },
  { id: 'ops_manager', label: 'Ops Manager', color: '#7c3aed', description: 'Manages flight operations, scheduling, and fleet.', modules: ['*'], isBuiltIn: true, createdAt: null, updatedAt: null },
  { id: 'crew_sched', label: 'Crew Scheduler', color: '#2563eb', description: 'Manages crew assignments and scheduling.', modules: ['DASHBOARD', 'CREW_MANAGEMENT', 'CREW_SCHEDULING', 'FLIGHT_SCHEDULING', 'FLEET_MANAGEMENT'], isBuiltIn: true, createdAt: null, updatedAt: null },
  { id: 'cs_agent', label: 'CS Agent', color: '#0891b2', description: 'Customer service and booking management.', modules: ['DASHBOARD', 'BOOKINGS', 'TICKET_REISSUE', 'USER_MANAGEMENT'], isBuiltIn: true, createdAt: null, updatedAt: null },
  { id: 'customer', label: 'Customer', color: '#059669', description: 'Passenger portal access only.', modules: [], isBuiltIn: true, createdAt: null, updatedAt: null },
];

/* ── Color palette for custom roles ──────────────────────── */
export const ROLE_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#eab308', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1',
];

const ROLES_COL = collection(db, 'roles');
const POLICIES_COL = collection(db, 'groupPolicies');

/* ── Roles CRUD ────────────────────────────────────────────── */
export async function getRoles(): Promise<RoleDoc[]> {
  const snap = await getDocs(query(ROLES_COL, orderBy('label')));
  const custom: RoleDoc[] = snap.docs.map(d => ({ ...d.data(), id: d.id, isBuiltIn: false } as RoleDoc));
  return [...BUILT_IN_ROLES, ...custom];
}

export async function createRole(data: Omit<RoleDoc, 'id' | 'isBuiltIn' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = doc(ROLES_COL);
  await setDoc(ref, {
    ...data,
    isBuiltIn: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateRole(id: string, data: Partial<Omit<RoleDoc, 'id' | 'isBuiltIn' | 'createdAt'>>): Promise<void> {
  await setDoc(doc(ROLES_COL, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function deleteRole(id: string): Promise<void> {
  await deleteDoc(doc(ROLES_COL, id));
}

/* ── Policies CRUD ─────────────────────────────────────────── */
export async function getPolicies(): Promise<GroupPolicyDoc[]> {
  const snap = await getDocs(query(POLICIES_COL, orderBy('name')));
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as GroupPolicyDoc));
}

export async function createPolicy(data: Omit<GroupPolicyDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = doc(POLICIES_COL);
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePolicy(id: string, data: Partial<Omit<GroupPolicyDoc, 'id' | 'createdAt'>>): Promise<void> {
  await setDoc(doc(POLICIES_COL, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function deletePolicy(id: string): Promise<void> {
  await deleteDoc(doc(POLICIES_COL, id));
}
