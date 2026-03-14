"use strict";
/**
 * Sales Aggregation — Cloud Functions
 *
 * Scheduled function to aggregate daily booking data into
 * route_performance documents for fast dashboard queries.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateDailySales = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
/**
 * Runs daily at midnight UTC. Aggregates the previous day's bookings
 * into a `route_performance/{YYYY-MM-DD}` document for historical trending.
 */
exports.aggregateDailySales = (0, scheduler_1.onSchedule)({ schedule: 'every day 00:00', timeZone: 'UTC' }, async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    const startOfDay = new Date(yesterday);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(yesterday);
    endOfDay.setHours(23, 59, 59, 999);
    console.log(`📊 Aggregating sales data for ${dateKey}...`);
    // Fetch all bookings created yesterday
    const bookingsSnap = await db.collection('bookings')
        .where('createdAt', '>=', startOfDay)
        .where('createdAt', '<=', endOfDay)
        .get();
    let totalRevenue = 0;
    let totalBookings = 0;
    let totalCancellations = 0;
    const routeData = {};
    for (const doc of bookingsSnap.docs) {
        const b = doc.data();
        const originCode = b.origin?.code || 'UNK';
        const destCode = b.destination?.code || 'UNK';
        const routeKey = `${originCode}-${destCode}`;
        if (!routeData[routeKey]) {
            routeData[routeKey] = {
                revenue: 0,
                bookings: 0,
                cancellations: 0,
                origin: originCode,
                destination: destCode,
            };
        }
        if (b.status === 'cancelled') {
            totalCancellations++;
            routeData[routeKey].cancellations++;
        }
        else {
            totalRevenue += b.totalAmount || 0;
            totalBookings++;
            routeData[routeKey].revenue += b.totalAmount || 0;
            routeData[routeKey].bookings++;
        }
    }
    // Write summary doc
    await db.doc(`route_performance/${dateKey}`).set({
        date: dateKey,
        totalRevenue,
        totalBookings,
        totalCancellations,
        routes: routeData,
        avgFare: totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
    console.log(`✅ Sales aggregation for ${dateKey}: revenue=$${totalRevenue}, bookings=${totalBookings}, cancellations=${totalCancellations}, routes=${Object.keys(routeData).length}`);
});
//# sourceMappingURL=sales.js.map