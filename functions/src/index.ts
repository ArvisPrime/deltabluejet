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

/* ── Users ─────────────────────────────────────────────────── */
export { setUserRole, onUserCreated, createUserAccount, disableUserAccount, deleteUserAccount, syncAllClaims } from './users';

/* ── Payment ───────────────────────────────────────────────── */
export { createPaymentIntent, processRefund, sendBookingConfirmation, confirmPaymentSecure, createFlutterwavePayment, handleStripeWebhook, handleFlutterwaveWebhook, reconcilePayments } from './payment';

/* ── Booking ───────────────────────────────────────────────── */
export { createBookingSecure, cancelBookingSecure, processCheckinSecure, generateBoardingPass } from './booking';

/* ── Notifications ─────────────────────────────────────────── */
export { sendNotificationEmail, sendNotificationSms, onBookingConfirmed, onFlightDelayed, onCheckinReminder } from './notifications';

/* ── Operations ────────────────────────────────────────────── */
export { updateFlightStatus, assignGate, swapAircraft, publishSchedule, withdrawFlight, getDashboardStats, aggregateDailySales, calculateDynamicPriceSecure, forecastRevenueSecure, checkFlightStatus, geolocate, geminiAssistant } from './operations';

/* ── Security ──────────────────────────────────────────────── */
export { webauthnGenerateRegistration, webauthnVerifyRegistration, webauthnGenerateAuthentication, webauthnVerifyAuthentication, webauthnListKeys, webauthnRemoveKey, clearYubikeyVerified, assignSecurityKeyRequirement, getSecurityKeyStatus, resetYubikeyRegistration, totpGenerateSecret, totpVerifySetup, totpVerifyCode, totpRemove, totpGetStatus, clearTotpVerified, createVoucherSecure, redeemVoucherSecure } from './security';

/* ── Loyalty ───────────────────────────────────────────────── */
export { onUserCreatedLoyalty, onBookingConfirmedLoyalty, onBookingRefundedLoyalty, redeemPointsSecure, createAwardBookingSecure } from './loyalty';
