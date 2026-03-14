/**
 * Notification System — Cloud Functions
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) initializeApp();
const db = getFirestore();

/**
 * Send a notification email using a template.
 */
export const sendNotificationEmail = onCall(async (request) => {
    const callerRole = request.auth?.token?.role as string | undefined;
    const allowedRoles = ['super_admin', 'ops_manager', 'cs_agent'];
    if (!callerRole || !allowedRoles.includes(callerRole)) {
        throw new HttpsError('permission-denied', 'Insufficient permissions to send notifications.');
    }

    const { templateId, recipientEmail, variables, bookingRef } = request.data;

    if (!templateId || !recipientEmail) {
        throw new HttpsError('invalid-argument', 'templateId and recipientEmail are required.');
    }

    const templateDoc = await db.doc(`email_templates/${templateId}`).get();
    if (!templateDoc.exists) {
        throw new HttpsError('not-found', 'Email template not found.');
    }

    const template = templateDoc.data()!;

    let renderedSubject = (template.subject as string) || '';
    let renderedBody = (template.htmlBody as string) || '';
    if (variables && typeof variables === 'object') {
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            renderedSubject = renderedSubject.replace(regex, String(value));
            renderedBody = renderedBody.replace(regex, String(value));
        }
    }

    // --- SendGrid Integration Point ---
    console.log(`📧 Email sent to ${recipientEmail} using template "${template.name}"`);

    await db.collection('notification_logs').add({
        channel: 'email',
        templateId,
        templateName: template.name,
        recipientEmail,
        recipientPhone: null,
        bookingRef: bookingRef || null,
        subject: renderedSubject,
        status: 'sent',
        provider: 'mock',
        errorMessage: null,
        sentBy: request.auth!.token.email || 'system',
        sentAt: FieldValue.serverTimestamp(),
    });

    return { success: true, message: `Email sent to ${recipientEmail}` };
});

/**
 * Send a notification SMS using a template.
 */
export const sendNotificationSms = onCall(async (request) => {
    const callerRole = request.auth?.token?.role as string | undefined;
    const allowedRoles = ['super_admin', 'ops_manager', 'cs_agent'];
    if (!callerRole || !allowedRoles.includes(callerRole)) {
        throw new HttpsError('permission-denied', 'Insufficient permissions to send SMS.');
    }

    const { templateId, recipientPhone, variables, bookingRef } = request.data;

    if (!templateId || !recipientPhone) {
        throw new HttpsError('invalid-argument', 'templateId and recipientPhone are required.');
    }

    const templateDoc = await db.doc(`sms_templates/${templateId}`).get();
    if (!templateDoc.exists) {
        throw new HttpsError('not-found', 'SMS template not found.');
    }

    const template = templateDoc.data()!;

    let renderedBody = (template.body as string) || '';
    if (variables && typeof variables === 'object') {
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            renderedBody = renderedBody.replace(regex, String(value));
        }
    }

    // --- Twilio Integration Point ---
    console.log(`📱 SMS sent to ${recipientPhone} using template "${template.name}"`);

    await db.collection('notification_logs').add({
        channel: 'sms',
        templateId,
        templateName: template.name,
        recipientEmail: null,
        recipientPhone,
        bookingRef: bookingRef || null,
        subject: null,
        status: 'sent',
        provider: 'mock',
        errorMessage: null,
        sentBy: request.auth!.token.email || 'system',
        sentAt: FieldValue.serverTimestamp(),
    });

    return { success: true, message: `SMS sent to ${recipientPhone}` };
});

/**
 * Auto-send confirmation email when a booking status changes to 'confirmed'.
 */
export const onBookingConfirmed = onDocumentUpdated('bookings/{bookingId}', async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) return;
    if (before.status === after.status) return;
    if (after.status !== 'confirmed') return;

    const bookingId = event.params.bookingId;
    const contactEmail = after.contactEmail as string | undefined;

    if (!contactEmail) {
        console.log(`⚠️ No contact email for booking ${bookingId}, skipping confirmation email.`);
        return;
    }

    const templatesSnap = await db.collection('email_templates')
        .where('name', '==', 'Booking Confirmation')
        .where('status', '==', 'live')
        .limit(1)
        .get();

    if (templatesSnap.empty) {
        console.log(`⚠️ No live "Booking Confirmation" email template found, skipping.`);
        return;
    }

    const template = templatesSnap.docs[0].data();
    const templateId = templatesSnap.docs[0].id;

    const variables: Record<string, string> = {
        passengerName: contactEmail,
        pnr: (after.pnr as string) || 'N/A',
        flightNumber: (after.flightNumber as string) || 'N/A',
        origin: after.origin?.city || after.origin?.code || '',
        destination: after.destination?.city || after.destination?.code || '',
        departureDate: after.departureTime?.toDate?.()
            ? after.departureTime.toDate().toISOString().split('T')[0]
            : 'TBD',
        totalAmount: `${after.currency || 'USD'} ${after.totalAmount || 0}`,
    };

    let subject = (template.subject as string) || 'Booking Confirmed';
    let body = (template.htmlBody as string) || '';
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, String(value));
        body = body.replace(regex, String(value));
    }

    console.log(`📧 Auto-sending booking confirmation to ${contactEmail} for PNR ${after.pnr}`);

    await db.collection('notification_logs').add({
        channel: 'email',
        templateId,
        templateName: 'Booking Confirmation',
        recipientEmail: contactEmail,
        recipientPhone: null,
        bookingRef: after.pnr || bookingId,
        subject,
        status: 'sent',
        provider: 'mock',
        errorMessage: null,
        sentBy: 'system',
        sentAt: FieldValue.serverTimestamp(),
    });
});
