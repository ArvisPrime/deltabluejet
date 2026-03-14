"use strict";
/**
 * Cloud Functions — Barrel Export
 *
 * Re-exports all Cloud Functions from modular files.
 * Firebase reads this file to discover deployable functions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiAssistant = exports.generateBoardingPass = exports.onBookingConfirmed = exports.sendNotificationSms = exports.sendNotificationEmail = exports.sendBookingConfirmation = exports.processRefund = exports.createPaymentIntent = exports.getDashboardStats = exports.swapAircraft = exports.assignGate = exports.updateFlightStatus = exports.onUserCreated = exports.setUserRole = void 0;
var users_1 = require("./users");
Object.defineProperty(exports, "setUserRole", { enumerable: true, get: function () { return users_1.setUserRole; } });
Object.defineProperty(exports, "onUserCreated", { enumerable: true, get: function () { return users_1.onUserCreated; } });
var flights_1 = require("./flights");
Object.defineProperty(exports, "updateFlightStatus", { enumerable: true, get: function () { return flights_1.updateFlightStatus; } });
Object.defineProperty(exports, "assignGate", { enumerable: true, get: function () { return flights_1.assignGate; } });
Object.defineProperty(exports, "swapAircraft", { enumerable: true, get: function () { return flights_1.swapAircraft; } });
var dashboard_1 = require("./dashboard");
Object.defineProperty(exports, "getDashboardStats", { enumerable: true, get: function () { return dashboard_1.getDashboardStats; } });
var payments_1 = require("./payments");
Object.defineProperty(exports, "createPaymentIntent", { enumerable: true, get: function () { return payments_1.createPaymentIntent; } });
Object.defineProperty(exports, "processRefund", { enumerable: true, get: function () { return payments_1.processRefund; } });
Object.defineProperty(exports, "sendBookingConfirmation", { enumerable: true, get: function () { return payments_1.sendBookingConfirmation; } });
var notifications_1 = require("./notifications");
Object.defineProperty(exports, "sendNotificationEmail", { enumerable: true, get: function () { return notifications_1.sendNotificationEmail; } });
Object.defineProperty(exports, "sendNotificationSms", { enumerable: true, get: function () { return notifications_1.sendNotificationSms; } });
Object.defineProperty(exports, "onBookingConfirmed", { enumerable: true, get: function () { return notifications_1.onBookingConfirmed; } });
var boarding_1 = require("./boarding");
Object.defineProperty(exports, "generateBoardingPass", { enumerable: true, get: function () { return boarding_1.generateBoardingPass; } });
var gemini_1 = require("./gemini");
Object.defineProperty(exports, "geminiAssistant", { enumerable: true, get: function () { return gemini_1.geminiAssistant; } });
//# sourceMappingURL=index.js.map