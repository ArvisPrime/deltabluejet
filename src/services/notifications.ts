/**
 * Notification Service — Email/SMS template CRUD + delivery logs.
 * Reads/writes email_templates, sms_templates, and notification_logs collections.
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase.config';
import type {
    EmailTemplateDoc,
    SmsTemplateDoc,
    NotificationLogDoc,
    NotificationChannel,
} from '../types/firestore';

// ─── Collection Refs ───────────────────────────────────────

const emailTemplatesRef = collection(db, 'email_templates');
const smsTemplatesRef = collection(db, 'sms_templates');
const notificationLogsRef = collection(db, 'notification_logs');

// ─── Email Templates ───────────────────────────────────────

export async function getEmailTemplates(): Promise<EmailTemplateDoc[]> {
    const q = query(emailTemplatesRef, orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EmailTemplateDoc));
}

export async function getEmailTemplateById(id: string): Promise<EmailTemplateDoc | null> {
    const snap = await getDoc(doc(emailTemplatesRef, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as EmailTemplateDoc : null;
}

export async function createEmailTemplate(
    data: Omit<EmailTemplateDoc, 'id' | 'createdAt' | 'updatedAt' | 'version'>
): Promise<string> {
    const docRef = await addDoc(emailTemplatesRef, {
        ...data,
        version: 1,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    return docRef.id;
}

export async function updateEmailTemplate(
    id: string,
    data: Partial<Omit<EmailTemplateDoc, 'id' | 'createdAt'>>
): Promise<void> {
    await updateDoc(doc(emailTemplatesRef, id), {
        ...data,
        updatedAt: Timestamp.now(),
    });
}

export async function deleteEmailTemplate(id: string): Promise<void> {
    await deleteDoc(doc(emailTemplatesRef, id));
}

// ─── SMS Templates ─────────────────────────────────────────

export async function getSmsTemplates(): Promise<SmsTemplateDoc[]> {
    const q = query(smsTemplatesRef, orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SmsTemplateDoc));
}

export async function getSmsTemplateById(id: string): Promise<SmsTemplateDoc | null> {
    const snap = await getDoc(doc(smsTemplatesRef, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as SmsTemplateDoc : null;
}

export async function createSmsTemplate(
    data: Omit<SmsTemplateDoc, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const docRef = await addDoc(smsTemplatesRef, {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    return docRef.id;
}

export async function updateSmsTemplate(
    id: string,
    data: Partial<Omit<SmsTemplateDoc, 'id' | 'createdAt'>>
): Promise<void> {
    await updateDoc(doc(smsTemplatesRef, id), {
        ...data,
        updatedAt: Timestamp.now(),
    });
}

export async function deleteSmsTemplate(id: string): Promise<void> {
    await deleteDoc(doc(smsTemplatesRef, id));
}

// ─── Notification Logs ─────────────────────────────────────

export async function getNotificationLogs(options?: {
    channel?: NotificationChannel;
    maxResults?: number;
}): Promise<NotificationLogDoc[]> {
    let q;
    if (options?.channel) {
        q = query(
            notificationLogsRef,
            where('channel', '==', options.channel),
            orderBy('sentAt', 'desc'),
            limit(options?.maxResults || 50),
        );
    } else {
        q = query(
            notificationLogsRef,
            orderBy('sentAt', 'desc'),
            limit(options?.maxResults || 50),
        );
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as NotificationLogDoc));
}

export function subscribeToNotificationLogs(
    callback: (logs: NotificationLogDoc[]) => void,
    options?: { channel?: NotificationChannel; maxResults?: number },
): () => void {
    let q;
    if (options?.channel) {
        q = query(
            notificationLogsRef,
            where('channel', '==', options.channel),
            orderBy('sentAt', 'desc'),
            limit(options?.maxResults || 50),
        );
    } else {
        q = query(
            notificationLogsRef,
            orderBy('sentAt', 'desc'),
            limit(options?.maxResults || 50),
        );
    }
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as NotificationLogDoc)));
    });
}

// ─── Cloud Function Callables ──────────────────────────────

export const sendNotificationEmail = httpsCallable(functions, 'sendNotificationEmail');
export const sendNotificationSms = httpsCallable(functions, 'sendNotificationSms');
