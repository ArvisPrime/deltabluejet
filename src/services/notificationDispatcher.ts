/**
 * Notification Dispatcher — Template-based email/SMS delivery.
 *
 * Dev mode: logs to Firestore without calling external APIs.
 * Production: calls Cloud Functions (sendNotificationEmail, sendNotificationSms).
 */

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import type {
    EmailTemplateDoc,
    SmsTemplateDoc,
    NotificationLogDoc,
    NotificationChannel,
    NotificationStatus,
} from '../types/firestore';
import { sendNotificationEmail, sendNotificationSms } from './notifications';

const notificationLogsRef = collection(db, 'notification_logs');
const emailTemplatesRef = collection(db, 'email_templates');
const smsTemplatesRef = collection(db, 'sms_templates');

const IS_NOTIFICATIONS_LIVE = import.meta.env.VITE_NOTIFICATIONS_LIVE === 'true';

// ─── Template Variable Substitution ────────────────────────

function fillTemplate(template: string, data: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? `{{${key}}}`);
}

// ─── Log a notification ────────────────────────────────────

async function logNotification(entry: Omit<NotificationLogDoc, 'id'>): Promise<string> {
    const docRef = await addDoc(notificationLogsRef, entry);
    return docRef.id;
}

// ─── Find Template by Name ─────────────────────────────────

async function findEmailTemplate(name: string): Promise<EmailTemplateDoc | null> {
    const snap = await getDocs(
        query(emailTemplatesRef, where('name', '==', name), where('status', '==', 'live')),
    );
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as EmailTemplateDoc;
}

async function findSmsTemplate(name: string): Promise<SmsTemplateDoc | null> {
    const snap = await getDocs(
        query(smsTemplatesRef, where('name', '==', name), where('status', '==', 'live')),
    );
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as SmsTemplateDoc;
}

// ─── Dispatch Email ────────────────────────────────────────

export async function dispatchEmail(params: {
    templateName: string;
    recipientEmail: string;
    dynamicData: Record<string, string>;
    bookingRef?: string;
    sentBy?: string;
}): Promise<{ success: boolean; logId: string }> {
    const template = await findEmailTemplate(params.templateName);
    if (!template) {
        // Log failed attempt — no template found
        const logId = await logNotification({
            channel: 'email' as NotificationChannel,
            templateId: 'not-found',
            templateName: params.templateName,
            recipientEmail: params.recipientEmail,
            recipientPhone: null,
            bookingRef: params.bookingRef || null,
            subject: null,
            status: 'failed' as NotificationStatus,
            provider: 'mock',
            errorMessage: `Template "${params.templateName}" not found or not live`,
            sentBy: params.sentBy || 'system',
            sentAt: Timestamp.now(),
        });
        return { success: false, logId };
    }

    const subject = fillTemplate(template.subject, params.dynamicData);
    const htmlBody = fillTemplate(template.htmlBody, params.dynamicData);
    let status: NotificationStatus = 'sent';
    let errorMessage: string | null = null;

    if (IS_NOTIFICATIONS_LIVE) {
        try {
            await sendNotificationEmail({
                to: params.recipientEmail,
                subject,
                html: htmlBody,
                templateId: template.id,
            });
        } catch (err: any) {
            status = 'failed';
            errorMessage = err.message || 'Cloud Function call failed';
        }
    }
    // Dev mode: skip actual send, log as "sent"

    const logId = await logNotification({
        channel: 'email',
        templateId: template.id,
        templateName: template.name,
        recipientEmail: params.recipientEmail,
        recipientPhone: null,
        bookingRef: params.bookingRef || null,
        subject,
        status,
        provider: IS_NOTIFICATIONS_LIVE ? 'sendgrid' : 'mock',
        errorMessage,
        sentBy: params.sentBy || 'system',
        sentAt: Timestamp.now(),
    });

    return { success: status === 'sent', logId };
}

// ─── Dispatch SMS ──────────────────────────────────────────

export async function dispatchSms(params: {
    templateName: string;
    recipientPhone: string;
    dynamicData: Record<string, string>;
    bookingRef?: string;
    sentBy?: string;
}): Promise<{ success: boolean; logId: string }> {
    const template = await findSmsTemplate(params.templateName);
    if (!template) {
        const logId = await logNotification({
            channel: 'sms',
            templateId: 'not-found',
            templateName: params.templateName,
            recipientEmail: null,
            recipientPhone: params.recipientPhone,
            bookingRef: params.bookingRef || null,
            subject: null,
            status: 'failed',
            provider: 'mock',
            errorMessage: `SMS template "${params.templateName}" not found or not live`,
            sentBy: params.sentBy || 'system',
            sentAt: Timestamp.now(),
        });
        return { success: false, logId };
    }

    const body = fillTemplate(template.body, params.dynamicData);
    let status: NotificationStatus = 'sent';
    let errorMessage: string | null = null;

    if (IS_NOTIFICATIONS_LIVE) {
        try {
            await sendNotificationSms({
                to: params.recipientPhone,
                body,
                templateId: template.id,
            });
        } catch (err: any) {
            status = 'failed';
            errorMessage = err.message || 'Cloud Function call failed';
        }
    }

    const logId = await logNotification({
        channel: 'sms',
        templateId: template.id,
        templateName: template.name,
        recipientEmail: null,
        recipientPhone: params.recipientPhone,
        bookingRef: params.bookingRef || null,
        subject: null,
        status,
        provider: IS_NOTIFICATIONS_LIVE ? template.provider : 'mock',
        errorMessage,
        sentBy: params.sentBy || 'system',
        sentAt: Timestamp.now(),
    });

    return { success: status === 'sent', logId };
}

// ─── High-Level Notification Actions ───────────────────────

export async function sendBookingConfirmation(params: {
    recipientEmail: string;
    recipientPhone?: string;
    passengerName: string;
    pnr: string;
    flightNumber: string;
    route: string;
    departureDate: string;
    eTicketNumber: string;
    amountPaid: string;
}): Promise<void> {
    const data: Record<string, string> = {
        passengerName: params.passengerName,
        pnr: params.pnr,
        flightNumber: params.flightNumber,
        route: params.route,
        departureDate: params.departureDate,
        eTicketNumber: params.eTicketNumber,
        amountPaid: params.amountPaid,
        airlineName: 'Deltablue Jet Air',
    };

    await dispatchEmail({
        templateName: 'Booking Confirmation',
        recipientEmail: params.recipientEmail,
        dynamicData: data,
        bookingRef: params.pnr,
    });

    if (params.recipientPhone) {
        await dispatchSms({
            templateName: 'Booking Confirmation',
            recipientPhone: params.recipientPhone,
            dynamicData: data,
            bookingRef: params.pnr,
        });
    }
}

export async function sendCheckInReminder(params: {
    recipientEmail: string;
    recipientPhone?: string;
    passengerName: string;
    pnr: string;
    flightNumber: string;
    route: string;
    departureDate: string;
    departureTime: string;
}): Promise<void> {
    const data: Record<string, string> = {
        passengerName: params.passengerName,
        pnr: params.pnr,
        flightNumber: params.flightNumber,
        route: params.route,
        departureDate: params.departureDate,
        departureTime: params.departureTime,
        airlineName: 'Deltablue Jet Air',
    };

    await dispatchEmail({
        templateName: 'Check-In Reminder',
        recipientEmail: params.recipientEmail,
        dynamicData: data,
        bookingRef: params.pnr,
    });

    if (params.recipientPhone) {
        await dispatchSms({
            templateName: 'Check-In Reminder',
            recipientPhone: params.recipientPhone,
            dynamicData: data,
            bookingRef: params.pnr,
        });
    }
}

export async function sendFlightStatusAlert(params: {
    recipientEmail: string;
    recipientPhone?: string;
    passengerName: string;
    pnr: string;
    flightNumber: string;
    route: string;
    statusChange: string;       // e.g. "Delayed by 45 minutes"
    newDepartureTime?: string;
}): Promise<void> {
    const data: Record<string, string> = {
        passengerName: params.passengerName,
        pnr: params.pnr,
        flightNumber: params.flightNumber,
        route: params.route,
        statusChange: params.statusChange,
        newDepartureTime: params.newDepartureTime || 'TBD',
        airlineName: 'Deltablue Jet Air',
    };

    await dispatchEmail({
        templateName: 'Flight Status Change',
        recipientEmail: params.recipientEmail,
        dynamicData: data,
        bookingRef: params.pnr,
    });

    if (params.recipientPhone) {
        await dispatchSms({
            templateName: 'Flight Status Change',
            recipientPhone: params.recipientPhone,
            dynamicData: data,
            bookingRef: params.pnr,
        });
    }
}
