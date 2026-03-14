"use strict";
/**
 * Notification System — Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onBookingConfirmed = exports.sendNotificationSms = exports.sendNotificationEmail = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
const db = (0, firestore_2.getFirestore)();
/**
 * Send a notification email using a template.
 */
exports.sendNotificationEmail = (0, https_1.onCall)(async (request) => {
    const callerRole = request.auth?.token?.role;
    const allowedRoles = ['super_admin', 'ops_manager', 'cs_agent'];
    if (!callerRole || !allowedRoles.includes(callerRole)) {
        throw new https_1.HttpsError('permission-denied', 'Insufficient permissions to send notifications.');
    }
    const { templateId, recipientEmail, variables, bookingRef } = request.data;
    if (!templateId || !recipientEmail) {
        throw new https_1.HttpsError('invalid-argument', 'templateId and recipientEmail are required.');
    }
    const templateDoc = await db.doc(`email_templates/${templateId}`).get();
    if (!templateDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Email template not found.');
    }
    const template = templateDoc.data();
    let renderedSubject = template.subject || '';
    let renderedBody = template.htmlBody || '';
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
        sentBy: request.auth.token.email || 'system',
        sentAt: firestore_2.FieldValue.serverTimestamp(),
    });
    return { success: true, message: `Email sent to ${recipientEmail}` };
});
/**
 * Send a notification SMS using a template.
 */
exports.sendNotificationSms = (0, https_1.onCall)(async (request) => {
    const callerRole = request.auth?.token?.role;
    const allowedRoles = ['super_admin', 'ops_manager', 'cs_agent'];
    if (!callerRole || !allowedRoles.includes(callerRole)) {
        throw new https_1.HttpsError('permission-denied', 'Insufficient permissions to send SMS.');
    }
    const { templateId, recipientPhone, variables, bookingRef } = request.data;
    if (!templateId || !recipientPhone) {
        throw new https_1.HttpsError('invalid-argument', 'templateId and recipientPhone are required.');
    }
    const templateDoc = await db.doc(`sms_templates/${templateId}`).get();
    if (!templateDoc.exists) {
        throw new https_1.HttpsError('not-found', 'SMS template not found.');
    }
    const template = templateDoc.data();
    let renderedBody = template.body || '';
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
        sentBy: request.auth.token.email || 'system',
        sentAt: firestore_2.FieldValue.serverTimestamp(),
    });
    return { success: true, message: `SMS sent to ${recipientPhone}` };
});
/**
 * Auto-send confirmation email when a booking status changes to 'confirmed'.
 */
exports.onBookingConfirmed = (0, firestore_1.onDocumentUpdated)('bookings/{bookingId}', async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after)
        return;
    if (before.status === after.status)
        return;
    if (after.status !== 'confirmed')
        return;
    const bookingId = event.params.bookingId;
    const contactEmail = after.contactEmail;
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
    const variables = {
        passengerName: contactEmail,
        pnr: after.pnr || 'N/A',
        flightNumber: after.flightNumber || 'N/A',
        origin: after.origin?.city || after.origin?.code || '',
        destination: after.destination?.city || after.destination?.code || '',
        departureDate: after.departureTime?.toDate?.()
            ? after.departureTime.toDate().toISOString().split('T')[0]
            : 'TBD',
        totalAmount: `${after.currency || 'USD'} ${after.totalAmount || 0}`,
    };
    let subject = template.subject || 'Booking Confirmed';
    let body = template.htmlBody || '';
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
        sentAt: firestore_2.FieldValue.serverTimestamp(),
    });
});
//# sourceMappingURL=notifications.js.map