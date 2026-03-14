/**
 * Audit Service — Immutable Audit Trail
 *
 * Writes, queries, and exports system audit logs for compliance.
 */

import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import type { AuditLogDoc, AuditSeverity } from '../types/firestore';

const auditRef = collection(db, 'audit_logs');

// ─── Types ─────────────────────────────────────────────────

export interface AuditLogEntry {
    userId: string;
    userEmail: string;
    action: string;
    module: string;
    entityType: string;
    entityId: string;
    description: string;
    severity: AuditSeverity;
    beforeData?: Record<string, unknown>;
    afterData?: Record<string, unknown>;
}

export interface AuditSearchFilters {
    searchTerm?: string;
    module?: string;
    severity?: AuditSeverity;
    startDate?: Date;
    endDate?: Date;
    maxResults?: number;
}

// ─── Write (Immutable) ────────────────────────────────────

/**
 * Write an immutable audit log entry. No update/delete allowed.
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<string> {
    const docRef = await addDoc(auditRef, {
        ...entry,
        timestamp: Timestamp.now(),
    });
    return docRef.id;
}

// ─── Search ───────────────────────────────────────────────

/**
 * Search audit logs with filters.
 *
 * Strategy: Use a simple `orderBy('timestamp', 'desc')` query to avoid
 * needing composite indexes for every filter combination. Equality filters
 * that pair with orderBy are safe ONLY if a matching composite index exists.
 * We try the indexed query first; if Firestore throws the classic
 * "requires an index" error we fall back to a broader fetch + client filter.
 */
export async function searchAuditLogs(filters: AuditSearchFilters = {}): Promise<AuditLogDoc[]> {
    const maxResults = filters.maxResults || 100;

    // Try a simple timestamp-only query first (no composite index needed)
    // Then apply module / severity / search as client-side filters.
    try {
        const q = query(
            auditRef,
            orderBy('timestamp', 'desc'),
            limit(500), // fetch a broader set, then filter client-side
        );
        const snap = await getDocs(q);
        let results = snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLogDoc));

        // Client-side filtering
        if (filters.module && filters.module !== 'all') {
            const mod = filters.module.toLowerCase();
            results = results.filter(log => (log.module || '').toLowerCase() === mod);
        }
        if (filters.severity && (filters.severity as string) !== 'all') {
            results = results.filter(log => log.severity === filters.severity);
        }
        if (filters.startDate) {
            const start = filters.startDate.getTime();
            results = results.filter(log => {
                const ts = log.timestamp?.toDate ? log.timestamp.toDate().getTime() : 0;
                return ts >= start;
            });
        }
        if (filters.endDate) {
            const end = filters.endDate.getTime();
            results = results.filter(log => {
                const ts = log.timestamp?.toDate ? log.timestamp.toDate().getTime() : 0;
                return ts <= end;
            });
        }
        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            results = results.filter(log =>
                (log.userEmail || '').toLowerCase().includes(term) ||
                (log.action || '').toLowerCase().includes(term) ||
                (log.description || '').toLowerCase().includes(term) ||
                (log.entityId || '').toLowerCase().includes(term)
            );
        }

        return results.slice(0, maxResults);
    } catch (err: any) {
        console.error('searchAuditLogs error:', err);
        throw err;
    }
}

/**
 * Get aggregate stats for the last 24 hours.
 */
export async function getAuditStats(): Promise<{
    totalEvents: number;
    criticalErrors: number;
    warnings: number;
    uniqueUsers: number;
}> {
    try {
        // Simple timestamp-ordered query — no composite index needed
        const q = query(
            auditRef,
            orderBy('timestamp', 'desc'),
            limit(500),
        );
        const snap = await getDocs(q);
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

        // Filter to last 24 hours client-side
        const logs = snap.docs
            .map(d => d.data())
            .filter(l => {
                const ts = l.timestamp?.toDate ? l.timestamp.toDate().getTime() : 0;
                return ts >= oneDayAgo;
            });

        const userSet = new Set(logs.map(l => l.userId).filter(Boolean));

        return {
            totalEvents: logs.length,
            criticalErrors: logs.filter(l => l.severity === 'critical' || l.severity === 'error').length,
            warnings: logs.filter(l => l.severity === 'warning').length,
            uniqueUsers: userSet.size,
        };
    } catch (err: any) {
        console.error('getAuditStats error:', err);
        return { totalEvents: 0, criticalErrors: 0, warnings: 0, uniqueUsers: 0 };
    }
}

// ─── Export ───────────────────────────────────────────────

/**
 * Export audit logs as CSV download.
 */
export function exportAuditCSV(logs: AuditLogDoc[]): void {
    const headers = [
        'Timestamp',
        'Severity',
        'User',
        'Module',
        'Action',
        'Entity',
        'Description',
    ];

    const rows = logs.map(l => [
        l.timestamp?.toDate ? l.timestamp.toDate().toISOString() : '',
        l.severity || '',
        l.userEmail || '',
        l.module || '',
        l.action || '',
        `${l.entityType || ''}:${l.entityId || ''}`,
        l.description || '',
    ]);

    const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
