"use strict";
/**
 * Dashboard Statistics — Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
/**
 * Get dashboard statistics — callable by any authenticated staff.
 */
exports.getDashboardStats = (0, https_1.onCall)(async (request) => {
    const callerRole = request.auth?.token?.role;
    const staffRoles = ['super_admin', 'ops_manager', 'crew_sched', 'cs_agent'];
    if (!callerRole || !staffRoles.includes(callerRole)) {
        throw new https_1.HttpsError('permission-denied', 'Staff access required.');
    }
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [flightsSnap, bookingsSnap, aircraftSnap, usersSnap] = await Promise.all([
        db.collection('flights').where('departureTime', '>=', todayStart).get(),
        db.collection('bookings').where('status', '==', 'confirmed').get(),
        db.collection('aircraft').where('status', '==', 'active').get(),
        db.collection('users').get(),
    ]);
    const flights = flightsSnap.docs.map((d) => d.data());
    const delayed = flights.filter((f) => f.status === 'delayed').length;
    const cancelled = flights.filter((f) => f.status === 'cancelled').length;
    const onTime = flights.filter((f) => !['delayed', 'cancelled'].includes(f.status)).length;
    return {
        totalFlightsToday: flights.length,
        onTimeFlights: onTime,
        delayedFlights: delayed,
        cancelledFlights: cancelled,
        activeBookings: bookingsSnap.size,
        activeAircraft: aircraftSnap.size,
        totalUsers: usersSnap.size,
        onTimeRate: flights.length > 0 ? Math.round((onTime / flights.length) * 100) : 100,
    };
});
//# sourceMappingURL=dashboard.js.map