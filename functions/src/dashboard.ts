/**
 * Dashboard Statistics — Cloud Functions
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) initializeApp();
const db = getFirestore();

/**
 * Get dashboard statistics — callable by any authenticated staff.
 */
export const getDashboardStats = onCall(async (request) => {
    const callerRole = request.auth?.token?.role as string | undefined;
    const staffRoles = ['super_admin', 'ops_manager', 'crew_sched', 'cs_agent'];
    if (!callerRole || !staffRoles.includes(callerRole)) {
        throw new HttpsError('permission-denied', 'Staff access required.');
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
