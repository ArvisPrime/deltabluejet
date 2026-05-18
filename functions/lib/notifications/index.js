"use strict";
/**
 * Notifications Module — Barrel Export
 *
 * Groups all notification-related Cloud Functions:
 * email/SMS dispatch, booking confirmations, delay alerts, and check-in reminders.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onCheckinReminder = exports.onFlightDelayed = exports.onBookingConfirmed = exports.sendNotificationSms = exports.sendNotificationEmail = void 0;
var notifications_1 = require("../notifications");
Object.defineProperty(exports, "sendNotificationEmail", { enumerable: true, get: function () { return notifications_1.sendNotificationEmail; } });
Object.defineProperty(exports, "sendNotificationSms", { enumerable: true, get: function () { return notifications_1.sendNotificationSms; } });
Object.defineProperty(exports, "onBookingConfirmed", { enumerable: true, get: function () { return notifications_1.onBookingConfirmed; } });
Object.defineProperty(exports, "onFlightDelayed", { enumerable: true, get: function () { return notifications_1.onFlightDelayed; } });
Object.defineProperty(exports, "onCheckinReminder", { enumerable: true, get: function () { return notifications_1.onCheckinReminder; } });
//# sourceMappingURL=index.js.map