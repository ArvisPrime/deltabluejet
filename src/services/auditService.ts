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
 */
export async function searchAuditLogs(filters: AuditSearchFilters = {}): Promise<AuditLogDoc[]> {
    const constraints: ReturnType<typeof where>[] = [];

    if (filters.module && filters.module !== 'all') {
        constraints.push(where('module', '==', filters.module));
    }
    if (filters.severity && filters.severity !== ('all' as AuditSeverity)) {
        constraints.push(where('severity', '==', filters.severity));
    }
    if (filters.startDate) {
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters.endDate) {
        constraints.push(where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
    }

    const q = query(
        auditRef,
        ...constraints,
        orderBy('timestamp', 'desc'),
        limit(filters.maxResults || 100),
    );

    const snap = await getDocs(q);
    let results = snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLogDoc));

    // Client-side text search if searchTerm provided
    if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        results = results.filter(log =>
            log.userEmail.toLowerCase().includes(term) ||
            log.action.toLowerCase().includes(term) ||
            log.description.toLowerCase().includes(term) ||
            log.entityId.toLowerCase().includes(term)
        );
    }

    return results;
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
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const q = query(
        auditRef,
        where('timestamp', '>=', Timestamp.fromDate(oneDayAgo)),
        orderBy('timestamp', 'desc'),
        limit(500),
    );
    const snap = await getDocs(q);
    const logs = snap.docs.map(d => d.data());

    const userSet = new Set(logs.map(l => l.userId));

    return {
        totalEvents: logs.length,
        criticalErrors: logs.filter(l => l.severity === 'critical' || l.severity === 'error').length,
        warnings: logs.filter(l => l.severity === 'warning').length,
        uniqueUsers: userSet.size,
    };
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
        l.severity,
        l.userEmail,
        l.module,
        l.action,
        `${l.entityType}:${l.entityId}`,
        l.description,
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
