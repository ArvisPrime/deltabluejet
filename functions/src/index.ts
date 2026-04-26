/**
 * Cloud Functions — Barrel Export
 *
 * Re-exports all Cloud Functions from modular files.
 * Firebase reads this file to discover deployable functions.
 */

export { setUserRole, onUserCreated, createUserAccount, disableUserAccount, deleteUserAccount, syncAllClaims } from './users';
export { updateFlightStatus, assignGate, swapAircraft } from './flights';
export { getDashboardStats } from './dashboard';
export { createPaymentIntent, processRefund, sendBookingConfirmation, confirmPaymentSecure } from './payments';
export { handleStripeWebhook } from './webhook';
export { createFlutterwavePayment } from './flutterwave';
export { handleFlutterwaveWebhook } from './flutterwaveWebhook';
export { reconcilePayments } from './reconciliation';
export { sendNotificationEmail, sendNotificationSms, onBookingConfirmed, onFlightDelayed, onCheckinReminder } from './notifications';
export { generateBoardingPass } from './boarding';
export { createBookingSecure, cancelBookingSecure } from './bookings';
export { geminiAssistant } from './gemini';
export { aggregateDailySales } from './sales';
export { publishSchedule, withdrawFlight } from './inventory';
export { onUserCreatedLoyalty, onBookingConfirmedLoyalty, onBookingRefundedLoyalty, redeemPointsSecure, createAwardBookingSecure } from './loyalty';
export { webauthnGenerateRegistration, webauthnVerifyRegistration, webauthnGenerateAuthentication, webauthnVerifyAuthentication, webauthnListKeys, webauthnRemoveKey, clearYubikeyVerified, assignSecurityKeyRequirement, getSecurityKeyStatus, resetYubikeyRegistration } from './webauthn';
export { processCheckinSecure } from './checkin';
export { calculateDynamicPriceSecure, forecastRevenueSecure } from './pricing';
export { createVoucherSecure, redeemVoucherSecure } from './vouchers';
export { totpGenerateSecret, totpVerifySetup, totpVerifyCode, totpRemove, totpGetStatus, clearTotpVerified } from './totp';
export { checkFlightStatus } from './flightStatus';
export { geolocate } from './geolocate';
