/**
 * Cloud Functions — Barrel Export
 *
 * Re-exports all Cloud Functions from modular files.
 * Firebase reads this file to discover deployable functions.
 */

export { setUserRole, onUserCreated } from './users';
export { updateFlightStatus, assignGate, swapAircraft } from './flights';
export { getDashboardStats } from './dashboard';
export { createPaymentIntent, processRefund, sendBookingConfirmation } from './payments';
export { sendNotificationEmail, sendNotificationSms, onBookingConfirmed } from './notifications';
export { generateBoardingPass } from './boarding';
export { geminiAssistant } from './gemini';
