"use strict";
/**
 * Cloud Functions — Barrel Export
 *
 * Re-exports all Cloud Functions from modular subdirectories.
 * Firebase reads this file to discover deployable functions.
 *
 * Module organisation:
 *   payment/      — Stripe, Flutterwave, webhooks, reconciliation
 *   booking/      — Booking lifecycle, check-in, boarding passes
 *   notifications/ — Email/SMS dispatch, automated triggers
 *   operations/   — Flights, inventory, dashboard, sales, pricing, geo
 *   security/     — WebAuthn, TOTP, vouchers
 *   loyalty/      — Points, tiers, award bookings
 *   users/        — Role assignment, account management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.totpGetStatus = exports.totpRemove = exports.totpVerifyCode = exports.totpVerifySetup = exports.totpGenerateSecret = exports.resetYubikeyRegistration = exports.getSecurityKeyStatus = exports.assignSecurityKeyRequirement = exports.clearYubikeyVerified = exports.webauthnRemoveKey = exports.webauthnListKeys = exports.webauthnVerifyAuthentication = exports.webauthnGenerateAuthentication = exports.webauthnVerifyRegistration = exports.webauthnGenerateRegistration = exports.geminiAssistant = exports.geolocate = exports.checkFlightStatus = exports.forecastRevenueSecure = exports.calculateDynamicPriceSecure = exports.aggregateDailySales = exports.getDashboardStats = exports.withdrawFlight = exports.publishSchedule = exports.swapAircraft = exports.assignGate = exports.updateFlightStatus = exports.onCheckinReminder = exports.onFlightDelayed = exports.onBookingConfirmed = exports.sendNotificationSms = exports.sendNotificationEmail = exports.generateBoardingPass = exports.processCheckinSecure = exports.cancelBookingSecure = exports.createBookingSecure = exports.reconcilePayments = exports.handleFlutterwaveWebhook = exports.handleStripeWebhook = exports.createFlutterwavePayment = exports.confirmPaymentSecure = exports.sendBookingConfirmation = exports.processRefund = exports.createPaymentIntent = exports.syncAllClaims = exports.deleteUserAccount = exports.disableUserAccount = exports.createUserAccount = exports.onUserCreated = exports.setUserRole = void 0;
exports.createAwardBookingSecure = exports.redeemPointsSecure = exports.onBookingRefundedLoyalty = exports.onBookingConfirmedLoyalty = exports.onUserCreatedLoyalty = exports.redeemVoucherSecure = exports.createVoucherSecure = exports.clearTotpVerified = void 0;
/* ── Users ─────────────────────────────────────────────────── */
var users_1 = require("./users");
Object.defineProperty(exports, "setUserRole", { enumerable: true, get: function () { return users_1.setUserRole; } });
Object.defineProperty(exports, "onUserCreated", { enumerable: true, get: function () { return users_1.onUserCreated; } });
Object.defineProperty(exports, "createUserAccount", { enumerable: true, get: function () { return users_1.createUserAccount; } });
Object.defineProperty(exports, "disableUserAccount", { enumerable: true, get: function () { return users_1.disableUserAccount; } });
Object.defineProperty(exports, "deleteUserAccount", { enumerable: true, get: function () { return users_1.deleteUserAccount; } });
Object.defineProperty(exports, "syncAllClaims", { enumerable: true, get: function () { return users_1.syncAllClaims; } });
/* ── Payment ───────────────────────────────────────────────── */
var payment_1 = require("./payment");
Object.defineProperty(exports, "createPaymentIntent", { enumerable: true, get: function () { return payment_1.createPaymentIntent; } });
Object.defineProperty(exports, "processRefund", { enumerable: true, get: function () { return payment_1.processRefund; } });
Object.defineProperty(exports, "sendBookingConfirmation", { enumerable: true, get: function () { return payment_1.sendBookingConfirmation; } });
Object.defineProperty(exports, "confirmPaymentSecure", { enumerable: true, get: function () { return payment_1.confirmPaymentSecure; } });
Object.defineProperty(exports, "createFlutterwavePayment", { enumerable: true, get: function () { return payment_1.createFlutterwavePayment; } });
Object.defineProperty(exports, "handleStripeWebhook", { enumerable: true, get: function () { return payment_1.handleStripeWebhook; } });
Object.defineProperty(exports, "handleFlutterwaveWebhook", { enumerable: true, get: function () { return payment_1.handleFlutterwaveWebhook; } });
Object.defineProperty(exports, "reconcilePayments", { enumerable: true, get: function () { return payment_1.reconcilePayments; } });
/* ── Booking ───────────────────────────────────────────────── */
var booking_1 = require("./booking");
Object.defineProperty(exports, "createBookingSecure", { enumerable: true, get: function () { return booking_1.createBookingSecure; } });
Object.defineProperty(exports, "cancelBookingSecure", { enumerable: true, get: function () { return booking_1.cancelBookingSecure; } });
Object.defineProperty(exports, "processCheckinSecure", { enumerable: true, get: function () { return booking_1.processCheckinSecure; } });
Object.defineProperty(exports, "generateBoardingPass", { enumerable: true, get: function () { return booking_1.generateBoardingPass; } });
/* ── Notifications ─────────────────────────────────────────── */
var notifications_1 = require("./notifications");
Object.defineProperty(exports, "sendNotificationEmail", { enumerable: true, get: function () { return notifications_1.sendNotificationEmail; } });
Object.defineProperty(exports, "sendNotificationSms", { enumerable: true, get: function () { return notifications_1.sendNotificationSms; } });
Object.defineProperty(exports, "onBookingConfirmed", { enumerable: true, get: function () { return notifications_1.onBookingConfirmed; } });
Object.defineProperty(exports, "onFlightDelayed", { enumerable: true, get: function () { return notifications_1.onFlightDelayed; } });
Object.defineProperty(exports, "onCheckinReminder", { enumerable: true, get: function () { return notifications_1.onCheckinReminder; } });
/* ── Operations ────────────────────────────────────────────── */
var operations_1 = require("./operations");
Object.defineProperty(exports, "updateFlightStatus", { enumerable: true, get: function () { return operations_1.updateFlightStatus; } });
Object.defineProperty(exports, "assignGate", { enumerable: true, get: function () { return operations_1.assignGate; } });
Object.defineProperty(exports, "swapAircraft", { enumerable: true, get: function () { return operations_1.swapAircraft; } });
Object.defineProperty(exports, "publishSchedule", { enumerable: true, get: function () { return operations_1.publishSchedule; } });
Object.defineProperty(exports, "withdrawFlight", { enumerable: true, get: function () { return operations_1.withdrawFlight; } });
Object.defineProperty(exports, "getDashboardStats", { enumerable: true, get: function () { return operations_1.getDashboardStats; } });
Object.defineProperty(exports, "aggregateDailySales", { enumerable: true, get: function () { return operations_1.aggregateDailySales; } });
Object.defineProperty(exports, "calculateDynamicPriceSecure", { enumerable: true, get: function () { return operations_1.calculateDynamicPriceSecure; } });
Object.defineProperty(exports, "forecastRevenueSecure", { enumerable: true, get: function () { return operations_1.forecastRevenueSecure; } });
Object.defineProperty(exports, "checkFlightStatus", { enumerable: true, get: function () { return operations_1.checkFlightStatus; } });
Object.defineProperty(exports, "geolocate", { enumerable: true, get: function () { return operations_1.geolocate; } });
Object.defineProperty(exports, "geminiAssistant", { enumerable: true, get: function () { return operations_1.geminiAssistant; } });
/* ── Security ──────────────────────────────────────────────── */
var security_1 = require("./security");
Object.defineProperty(exports, "webauthnGenerateRegistration", { enumerable: true, get: function () { return security_1.webauthnGenerateRegistration; } });
Object.defineProperty(exports, "webauthnVerifyRegistration", { enumerable: true, get: function () { return security_1.webauthnVerifyRegistration; } });
Object.defineProperty(exports, "webauthnGenerateAuthentication", { enumerable: true, get: function () { return security_1.webauthnGenerateAuthentication; } });
Object.defineProperty(exports, "webauthnVerifyAuthentication", { enumerable: true, get: function () { return security_1.webauthnVerifyAuthentication; } });
Object.defineProperty(exports, "webauthnListKeys", { enumerable: true, get: function () { return security_1.webauthnListKeys; } });
Object.defineProperty(exports, "webauthnRemoveKey", { enumerable: true, get: function () { return security_1.webauthnRemoveKey; } });
Object.defineProperty(exports, "clearYubikeyVerified", { enumerable: true, get: function () { return security_1.clearYubikeyVerified; } });
Object.defineProperty(exports, "assignSecurityKeyRequirement", { enumerable: true, get: function () { return security_1.assignSecurityKeyRequirement; } });
Object.defineProperty(exports, "getSecurityKeyStatus", { enumerable: true, get: function () { return security_1.getSecurityKeyStatus; } });
Object.defineProperty(exports, "resetYubikeyRegistration", { enumerable: true, get: function () { return security_1.resetYubikeyRegistration; } });
Object.defineProperty(exports, "totpGenerateSecret", { enumerable: true, get: function () { return security_1.totpGenerateSecret; } });
Object.defineProperty(exports, "totpVerifySetup", { enumerable: true, get: function () { return security_1.totpVerifySetup; } });
Object.defineProperty(exports, "totpVerifyCode", { enumerable: true, get: function () { return security_1.totpVerifyCode; } });
Object.defineProperty(exports, "totpRemove", { enumerable: true, get: function () { return security_1.totpRemove; } });
Object.defineProperty(exports, "totpGetStatus", { enumerable: true, get: function () { return security_1.totpGetStatus; } });
Object.defineProperty(exports, "clearTotpVerified", { enumerable: true, get: function () { return security_1.clearTotpVerified; } });
Object.defineProperty(exports, "createVoucherSecure", { enumerable: true, get: function () { return security_1.createVoucherSecure; } });
Object.defineProperty(exports, "redeemVoucherSecure", { enumerable: true, get: function () { return security_1.redeemVoucherSecure; } });
/* ── Loyalty ───────────────────────────────────────────────── */
var loyalty_1 = require("./loyalty");
Object.defineProperty(exports, "onUserCreatedLoyalty", { enumerable: true, get: function () { return loyalty_1.onUserCreatedLoyalty; } });
Object.defineProperty(exports, "onBookingConfirmedLoyalty", { enumerable: true, get: function () { return loyalty_1.onBookingConfirmedLoyalty; } });
Object.defineProperty(exports, "onBookingRefundedLoyalty", { enumerable: true, get: function () { return loyalty_1.onBookingRefundedLoyalty; } });
Object.defineProperty(exports, "redeemPointsSecure", { enumerable: true, get: function () { return loyalty_1.redeemPointsSecure; } });
Object.defineProperty(exports, "createAwardBookingSecure", { enumerable: true, get: function () { return loyalty_1.createAwardBookingSecure; } });
//# sourceMappingURL=index.js.map