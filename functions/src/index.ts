/**
 * Cloud Functions — Barrel Export
 *
 * Re-exports all Cloud Functions from modular files.
 * Firebase reads this file to discover deployable functions.
 */

export { setUserRole, onUserCreated, createUserAccount, disableUserAccount, deleteUserAccount } from './users';
export { updateFlightStatus, assignGate, swapAircraft } from './flights';
export { getDashboardStats } from './dashboard';
export { createPaymentIntent, processRefund, sendBookingConfirmation } from './payments';
export { handleStripeWebhook } from './webhook';
export { sendNotificationEmail, sendNotificationSms, onBookingConfirmed, onFlightDelayed, onCheckinReminder } from './notifications';
export { generateBoardingPass } from './boarding';
export { geminiAssistant } from './gemini';
export { aggregateDailySales } from './sales';
export { reconcilePayments } from './reconciliation';
export { publishSchedule, withdrawFlight } from './inventory';
export { onUserCreatedLoyalty, onBookingConfirmedLoyalty, onBookingRefundedLoyalty } from './loyalty';
export { webauthnGenerateRegistration, webauthnVerifyRegistration, webauthnGenerateAuthentication, webauthnVerifyAuthentication, webauthnListKeys, webauthnRemoveKey } from './webauthn';


