"use strict";
/**
 * Notification System — Cloud Functions
 *
 * Supports SendGrid (email) and Twilio (SMS) when API keys are configured.
 * Falls back to mock/console.log when keys are absent (dev mode).
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onCheckinReminder = exports.onFlightDelayed = exports.onBookingConfirmed = exports.sendNotificationSms = exports.sendNotificationEmail = void 0;
const https_1 = require("firebase-functions/v2/https");
const rateLimit_1 = require("./rateLimit");
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_2 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const params_1 = require("firebase-functions/params");
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
const db = (0, firestore_2.getFirestore)();
/* ── Secrets (resolved at function deployment, not build time) ─── */
const SENDGRID_API_KEY = (0, params_1.defineSecret)('SENDGRID_API_KEY');
const TWILIO_ACCOUNT_SID = (0, params_1.defineSecret)('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = (0, params_1.defineSecret)('TWILIO_AUTH_TOKEN');
const TWILIO_FROM_NUMBER = (0, params_1.defineSecret)('TWILIO_FROM_NUMBER');
/* ── Template Rendering Helper ─────────────────────────────────── */
function renderTemplate(text, variables) {
    let rendered = text;
    for (const [key, value] of Object.entries(variables)) {
        rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return rendered;
}
/* ── Email Sending Helper (SendGrid or Mock) ───────────────────── */
async function dispatchEmail(to, subject, htmlBody) {
    const apiKey = SENDGRID_API_KEY.value();
    if (apiKey) {
        try {
            const sgMail = await Promise.resolve().then(() => __importStar(require('@sendgrid/mail')));
            sgMail.default.setApiKey(apiKey);
            await sgMail.default.send({
                to,
                from: 'noreply@deltabluejetair.com',
                subject,
                html: htmlBody,
            });
            console.log(`📧 [SendGrid] Email sent to ${to}`);
            return { provider: 'sendgrid', success: true };
        }
        catch (err) {
            console.error(`❌ [SendGrid] Failed to send to ${to}:`, err.message);
            return { provider: 'sendgrid', success: false, error: err.message };
        }
    }
    // Fallback: mock mode
    console.log(`📧 [Mock] Email to ${to} — Subject: "${subject}"`);
    return { provider: 'mock', success: true };
}
/* ── SMS Sending Helper (Twilio or Mock) ───────────────────────── */
async function dispatchSms(to, body) {
    const sid = TWILIO_ACCOUNT_SID.value();
    const token = TWILIO_AUTH_TOKEN.value();
    const from = TWILIO_FROM_NUMBER.value();
    if (sid && token && from) {
        try {
            const twilio = await Promise.resolve().then(() => __importStar(require('twilio')));
            const client = twilio.default(sid, token);
            await client.messages.create({ body, to, from });
            console.log(`📱 [Twilio] SMS sent to ${to}`);
            return { provider: 'twilio', success: true };
        }
        catch (err) {
            console.error(`❌ [Twilio] Failed to send to ${to}:`, err.message);
            return { provider: 'twilio', success: false, error: err.message };
        }
    }
    // Fallback: mock mode
    console.log(`📱 [Mock] SMS to ${to} — Body: "${body.slice(0, 80)}..."`);
    return { provider: 'mock', success: true };
}
/* ═══════════════════════════════════════════════════════════════
   Public Cloud Functions
   ═══════════════════════════════════════════════════════════════ */
/**
 * Send a notification email using a CMS template.
 */
exports.sendNotificationEmail = (0, https_1.onCall)({ secrets: [SENDGRID_API_KEY] }, async (request) => {
    const callerRole = request.auth?.token?.role;
    const allowedRoles = ['super_admin', 'ops_manager', 'cs_agent'];
    if (!callerRole || !allowedRoles.includes(callerRole)) {
        throw new https_1.HttpsError('permission-denied', 'Insufficient permissions to send notifications.');
    }
    // Rate limiting: max 20 emails per hour per user
    await (0, rateLimit_1.enforceRateLimit)(request.auth.uid, 'sendEmail', rateLimit_1.RATE_LIMITS.EMAIL_SEND);
    const { templateId, recipientEmail, variables, bookingRef } = request.data;
    if (!templateId || !recipientEmail) {
        throw new https_1.HttpsError('invalid-argument', 'templateId and recipientEmail are required.');
    }
    const templateDoc = await db.doc(`email_templates/${templateId}`).get();
    if (!templateDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Email template not found.');
    }
    const template = templateDoc.data();
    const renderedSubject = renderTemplate(template.subject || '', variables || {});
    const renderedBody = renderTemplate(template.htmlBody || '', variables || {});
    const result = await dispatchEmail(recipientEmail, renderedSubject, renderedBody);
    await db.collection('notification_logs').add({
        channel: 'email',
        templateId,
        templateName: template.name,
        recipientEmail,
        recipientPhone: null,
        bookingRef: bookingRef || null,
        subject: renderedSubject,
        status: result.success ? 'sent' : 'failed',
        provider: result.provider,
        errorMessage: result.error || null,
        sentBy: request.auth.token.email || 'system',
        sentAt: firestore_2.FieldValue.serverTimestamp(),
    });
    return { success: result.success, message: `Email ${result.success ? 'sent' : 'failed'} via ${result.provider}` };
});
/**
 * Send a notification SMS using a CMS template.
 */
exports.sendNotificationSms = (0, https_1.onCall)({ secrets: [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER] }, async (request) => {
    const callerRole = request.auth?.token?.role;
    const allowedRoles = ['super_admin', 'ops_manager', 'cs_agent'];
    if (!callerRole || !allowedRoles.includes(callerRole)) {
        throw new https_1.HttpsError('permission-denied', 'Insufficient permissions to send SMS.');
    }
    // Rate limiting: max 10 SMS per hour per user
    await (0, rateLimit_1.enforceRateLimit)(request.auth.uid, 'sendSms', rateLimit_1.RATE_LIMITS.SMS_SEND);
    const { templateId, recipientPhone, variables, bookingRef } = request.data;
    if (!templateId || !recipientPhone) {
        throw new https_1.HttpsError('invalid-argument', 'templateId and recipientPhone are required.');
    }
    const templateDoc = await db.doc(`sms_templates/${templateId}`).get();
    if (!templateDoc.exists) {
        throw new https_1.HttpsError('not-found', 'SMS template not found.');
    }
    const template = templateDoc.data();
    const renderedBody = renderTemplate(template.body || '', variables || {});
    const result = await dispatchSms(recipientPhone, renderedBody);
    await db.collection('notification_logs').add({
        channel: 'sms',
        templateId,
        templateName: template.name,
        recipientEmail: null,
        recipientPhone,
        bookingRef: bookingRef || null,
        subject: null,
        status: result.success ? 'sent' : 'failed',
        provider: result.provider,
        errorMessage: result.error || null,
        sentBy: request.auth.token.email || 'system',
        sentAt: firestore_2.FieldValue.serverTimestamp(),
    });
    return { success: result.success, message: `SMS ${result.success ? 'sent' : 'failed'} via ${result.provider}` };
});
/**
 * Auto-send confirmation email when a booking status changes to 'confirmed'.
 */
exports.onBookingConfirmed = (0, firestore_1.onDocumentUpdated)({ document: 'bookings/{bookingId}', secrets: [SENDGRID_API_KEY] }, async (event) => {
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
    const subject = renderTemplate(template.subject || 'Booking Confirmed', variables);
    const body = renderTemplate(template.htmlBody || '', variables);
    const result = await dispatchEmail(contactEmail, subject, body);
    await db.collection('notification_logs').add({
        channel: 'email',
        templateId,
        templateName: 'Booking Confirmation',
        recipientEmail: contactEmail,
        recipientPhone: null,
        bookingRef: after.pnr || bookingId,
        subject,
        status: result.success ? 'sent' : 'failed',
        provider: result.provider,
        errorMessage: result.error || null,
        sentBy: 'system',
        sentAt: firestore_2.FieldValue.serverTimestamp(),
    });
});
/**
 * Auto-send delay notification when a flight status changes to 'delayed'.
 * Looks up all bookings on that flight and notifies each passenger.
 */
exports.onFlightDelayed = (0, firestore_1.onDocumentUpdated)({ document: 'flights/{flightId}', secrets: [SENDGRID_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER] }, async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after)
        return;
    if (before.status === after.status)
        return;
    if (after.status !== 'delayed')
        return;
    const flightId = event.params.flightId;
    const flightNumber = after.flightNumber || flightId;
    const delayMinutes = after.delayMinutes || 0;
    const delayReason = after.delayReason || 'Operational reasons';
    console.log(`⏰ Flight ${flightNumber} delayed by ${delayMinutes}min — notifying passengers.`);
    // Find all bookings on this flight
    const bookingsSnap = await db.collection('bookings')
        .where('flightId', '==', flightId)
        .where('status', 'in', ['confirmed', 'checked_in'])
        .get();
    if (bookingsSnap.empty) {
        console.log(`ℹ️ No active bookings found for flight ${flightNumber}.`);
        return;
    }
    // Look for a "Flight Delay" email template
    const emailTemplateSnap = await db.collection('email_templates')
        .where('name', '==', 'Flight Delay')
        .where('status', '==', 'live')
        .limit(1)
        .get();
    // Look for a "Flight Delay" SMS template
    const smsTemplateSnap = await db.collection('sms_templates')
        .where('name', '==', 'Flight Delay')
        .where('status', '==', 'live')
        .limit(1)
        .get();
    for (const bookingDoc of bookingsSnap.docs) {
        const booking = bookingDoc.data();
        const variables = {
            passengerName: booking.contactEmail || 'Passenger',
            flightNumber,
            delayMinutes: String(delayMinutes),
            delayReason,
            origin: booking.origin?.city || booking.origin?.code || '',
            destination: booking.destination?.city || booking.destination?.code || '',
            pnr: booking.pnr || 'N/A',
            newDepartureTime: after.newDepartureTime?.toDate?.()
                ? after.newDepartureTime.toDate().toLocaleString()
                : 'To be confirmed',
        };
        // Send email notification
        if (booking.contactEmail && !emailTemplateSnap.empty) {
            const template = emailTemplateSnap.docs[0].data();
            const templateId = emailTemplateSnap.docs[0].id;
            const subject = renderTemplate(template.subject || `Flight ${flightNumber} Delayed`, variables);
            const body = renderTemplate(template.htmlBody || '', variables);
            const result = await dispatchEmail(booking.contactEmail, subject, body);
            await db.collection('notification_logs').add({
                channel: 'email',
                templateId,
                templateName: 'Flight Delay',
                recipientEmail: booking.contactEmail,
                recipientPhone: null,
                bookingRef: booking.pnr || bookingDoc.id,
                subject,
                status: result.success ? 'sent' : 'failed',
                provider: result.provider,
                errorMessage: result.error || null,
                sentBy: 'system',
                sentAt: firestore_2.FieldValue.serverTimestamp(),
            });
        }
        // Send SMS notification
        if (booking.contactPhone && !smsTemplateSnap.empty) {
            const template = smsTemplateSnap.docs[0].data();
            const templateId = smsTemplateSnap.docs[0].id;
            const body = renderTemplate(template.body || '', variables);
            const result = await dispatchSms(booking.contactPhone, body);
            await db.collection('notification_logs').add({
                channel: 'sms',
                templateId,
                templateName: 'Flight Delay',
                recipientEmail: null,
                recipientPhone: booking.contactPhone,
                bookingRef: booking.pnr || bookingDoc.id,
                subject: null,
                status: result.success ? 'sent' : 'failed',
                provider: result.provider,
                errorMessage: result.error || null,
                sentBy: 'system',
                sentAt: firestore_2.FieldValue.serverTimestamp(),
            });
        }
    }
    console.log(`✅ Delay notifications sent for flight ${flightNumber} — ${bookingsSnap.size} passengers notified.`);
});
/**
 * Scheduled: Check-in Reminder
 * Runs every hour. Finds bookings where departure is within 24 hours
 * and status is still 'confirmed', then sends check-in reminder.
 */
exports.onCheckinReminder = (0, scheduler_1.onSchedule)({ schedule: 'every 1 hours', timeZone: 'UTC', secrets: [SENDGRID_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER] }, async () => {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    console.log(`🔔 Running check-in reminder scan: ${now.toISOString()} → ${in24h.toISOString()}`);
    // Find bookings departing in the next 23-24 hours (1-hour window to avoid duplicates)
    const bookingsSnap = await db.collection('bookings')
        .where('departureTime', '>=', in23h)
        .where('departureTime', '<=', in24h)
        .where('status', '==', 'confirmed')
        .get();
    if (bookingsSnap.empty) {
        console.log('ℹ️ No bookings require check-in reminders at this time.');
        return;
    }
    // Look for template
    const emailTemplateSnap = await db.collection('email_templates')
        .where('name', '==', 'Check-in Reminder')
        .where('status', '==', 'live')
        .limit(1)
        .get();
    const smsTemplateSnap = await db.collection('sms_templates')
        .where('name', '==', 'Check-in Reminder')
        .where('status', '==', 'live')
        .limit(1)
        .get();
    let sentCount = 0;
    for (const bookingDoc of bookingsSnap.docs) {
        const booking = bookingDoc.data();
        const variables = {
            passengerName: booking.contactEmail || 'Passenger',
            flightNumber: booking.flightNumber || 'N/A',
            pnr: booking.pnr || 'N/A',
            origin: booking.origin?.city || booking.origin?.code || '',
            destination: booking.destination?.city || booking.destination?.code || '',
            departureDate: booking.departureTime?.toDate?.()
                ? booking.departureTime.toDate().toLocaleString()
                : 'Check your itinerary',
        };
        // Email reminder
        if (booking.contactEmail && !emailTemplateSnap.empty) {
            const template = emailTemplateSnap.docs[0].data();
            const templateId = emailTemplateSnap.docs[0].id;
            const subject = renderTemplate(template.subject || 'Time to Check In!', variables);
            const body = renderTemplate(template.htmlBody || '', variables);
            const result = await dispatchEmail(booking.contactEmail, subject, body);
            await db.collection('notification_logs').add({
                channel: 'email',
                templateId,
                templateName: 'Check-in Reminder',
                recipientEmail: booking.contactEmail,
                recipientPhone: null,
                bookingRef: booking.pnr || bookingDoc.id,
                subject,
                status: result.success ? 'sent' : 'failed',
                provider: result.provider,
                errorMessage: result.error || null,
                sentBy: 'system',
                sentAt: firestore_2.FieldValue.serverTimestamp(),
            });
            sentCount++;
        }
        // SMS reminder
        if (booking.contactPhone && !smsTemplateSnap.empty) {
            const template = smsTemplateSnap.docs[0].data();
            const templateId = smsTemplateSnap.docs[0].id;
            const body = renderTemplate(template.body || '', variables);
            const result = await dispatchSms(booking.contactPhone, body);
            await db.collection('notification_logs').add({
                channel: 'sms',
                templateId,
                templateName: 'Check-in Reminder',
                recipientEmail: null,
                recipientPhone: booking.contactPhone,
                bookingRef: booking.pnr || bookingDoc.id,
                subject: null,
                status: result.success ? 'sent' : 'failed',
                provider: result.provider,
                errorMessage: result.error || null,
                sentBy: 'system',
                sentAt: firestore_2.FieldValue.serverTimestamp(),
            });
            sentCount++;
        }
    }
    console.log(`✅ Check-in reminders: ${sentCount} notifications sent for ${bookingsSnap.size} bookings.`);
});
//# sourceMappingURL=notifications.js.map