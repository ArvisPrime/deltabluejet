/**
 * Operations Module — Barrel Export
 *
 * Groups all operational Cloud Functions:
 * flight management, inventory, dashboard, sales, pricing, flight status, and geo.
 */

export { updateFlightStatus, assignGate, swapAircraft } from '../flights';
export { publishSchedule, withdrawFlight } from '../inventory';
export { getDashboardStats } from '../dashboard';
export { aggregateDailySales } from '../sales';
export { calculateDynamicPriceSecure, forecastRevenueSecure } from '../pricing';
export { checkFlightStatus } from '../flightStatus';
export { geolocate } from '../geolocate';
export { geminiAssistant } from '../gemini';
