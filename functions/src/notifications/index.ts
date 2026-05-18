/**
 * Notifications Module — Barrel Export
 *
 * Groups all notification-related Cloud Functions:
 * email/SMS dispatch, booking confirmations, delay alerts, and check-in reminders.
 */

export {
    sendNotificationEmail,
    sendNotificationSms,
    onBookingConfirmed,
    onFlightDelayed,
    onCheckinReminder,
} from '../notifications';
