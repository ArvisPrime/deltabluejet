/**
 * Support Ticket Service — Deltablue Jet Air
 *
 * CRUD operations for support tickets with SLA tracking.
 */

import {
    collection, query, where, getDocs, addDoc, updateDoc,
    doc, Timestamp, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

// ─── Types ─────────────────────────────────────────────────

export type TicketStatus = 'open' | 'in_progress' | 'escalated' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory =
    | 'booking' | 'baggage' | 'refund' | 'check_in'
    | 'flight_disruption' | 'loyalty' | 'payment'
    | 'accessibility' | 'complaint' | 'other';

export interface SupportTicket {
    id?: string;
    ticketNumber: string;       // e.g. "DB-TKT-20260323-001"
    userId: string;
    customerName: string;
    customerEmail: string;
    category: TicketCategory;
    priority: TicketPriority;
    subject: string;
    description: string;
    bookingReference?: string;
    status: TicketStatus;
    assignedTo?: string;
    slaDeadline: Timestamp;
    resolvedAt?: Timestamp;
    closedAt?: Timestamp;
    notes: TicketNote[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface TicketNote {
    author: string;
    content: string;
    isInternal: boolean;
    createdAt: Timestamp;
}

// ─── SLA Configuration (hours) ─────────────────────────────

const SLA_HOURS: Record<TicketPriority, number> = {
    urgent: 2,
    high: 8,
    medium: 24,
    low: 72,
};

// ─── Generate Ticket Number ────────────────────────────────

function generateTicketNumber(): string {
    const d = new Date();
    const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const rand = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    return `DB-TKT-${date}-${rand}`;
}

// ─── Create Ticket ─────────────────────────────────────────

export async function createTicket(
    data: Omit<SupportTicket, 'id' | 'ticketNumber' | 'status' | 'slaDeadline' | 'notes' | 'createdAt' | 'updatedAt'>,
): Promise<SupportTicket> {
    const slaMs = SLA_HOURS[data.priority] * 60 * 60 * 1000;
    const slaDeadline = Timestamp.fromMillis(Date.now() + slaMs);

    const ticket: Omit<SupportTicket, 'id'> = {
        ...data,
        ticketNumber: generateTicketNumber(),
        status: 'open',
        slaDeadline,
        notes: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    const ref = await addDoc(collection(db, 'support_tickets'), ticket);
    return { ...ticket, id: ref.id };
}

// ─── Get User Tickets ──────────────────────────────────────

export async function getUserTickets(userId: string): Promise<SupportTicket[]> {
    const q = query(
        collection(db, 'support_tickets'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as SupportTicket);
}

// ─── Get All Tickets (Admin) ───────────────────────────────

export async function getAllTickets(maxResults = 100): Promise<SupportTicket[]> {
    const q = query(
        collection(db, 'support_tickets'),
        orderBy('createdAt', 'desc'),
        limit(maxResults),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as SupportTicket);
}

// ─── Update Ticket Status ──────────────────────────────────

export async function updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    assignedTo?: string,
): Promise<void> {
    const ref = doc(db, 'support_tickets', ticketId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = { status, updatedAt: serverTimestamp() };
    if (status === 'resolved') updates.resolvedAt = serverTimestamp();
    if (status === 'closed') updates.closedAt = serverTimestamp();
    if (assignedTo) updates.assignedTo = assignedTo;
    await updateDoc(ref, updates);
}

// ─── Add Note to Ticket ────────────────────────────────────

export async function addTicketNote(
    ticketId: string,
    author: string,
    content: string,
    isInternal = false,
): Promise<void> {
    const ref = doc(db, 'support_tickets', ticketId);
    // We append to the notes array via a get-then-update pattern
    const { getDoc: getDocFn } = await import('firebase/firestore');
    const snap = await getDocFn(ref);
    const existing = snap.data() as SupportTicket;
    const newNote: TicketNote = {
        author,
        content,
        isInternal,
        createdAt: Timestamp.now(),
    };
    const updatedNotes = [...(existing.notes || []), newNote];
    await updateDoc(ref, { notes: updatedNotes, updatedAt: serverTimestamp() } as any);
}

// ─── SLA Helpers ───────────────────────────────────────────

export function isSLABreached(ticket: SupportTicket): boolean {
    if (ticket.status === 'resolved' || ticket.status === 'closed') return false;
    return Timestamp.now().toMillis() > ticket.slaDeadline.toMillis();
}

export function getSLATimeRemaining(ticket: SupportTicket): number {
    if (ticket.status === 'resolved' || ticket.status === 'closed') return 0;
    return ticket.slaDeadline.toMillis() - Timestamp.now().toMillis();
}

export function formatSLARemaining(ms: number): string {
    if (ms <= 0) return 'Breached';
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const mins = Math.floor((ms % (60 * 60 * 1000)) / 60000);
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h ${mins}m`;
}
