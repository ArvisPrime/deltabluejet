"use strict";
/**
 * Rate Limiter Utility — Cloud Functions
 *
 * Firestore-backed per-user rate limiting to prevent abuse of
 * expensive operations like payments, refunds, and notifications.
 *
 * Uses a sliding window approach with Firestore counters.
 * Documents auto-expire and can be cleaned up via TTL policies.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATE_LIMITS = void 0;
exports.enforceRateLimit = enforceRateLimit;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const db = (0, firestore_1.getFirestore)();
const DEFAULT_WINDOW = 60 * 60 * 1000; // 1 hour
const DEFAULT_COLLECTION = 'rate_limits';
/**
 * Check and enforce rate limiting for a user/action pair.
 * Throws HttpsError if rate limit is exceeded.
 *
 * @param userId - The authenticated user's UID
 * @param action - Action identifier (e.g., 'createPaymentIntent', 'sendEmail')
 * @param config - Rate limit configuration
 */
async function enforceRateLimit(userId, action, config) {
    const { maxRequests, windowMs = DEFAULT_WINDOW, collection = DEFAULT_COLLECTION } = config;
    const now = Date.now();
    const windowStart = new Date(now - windowMs);
    const docId = `${userId}_${action}`;
    const docRef = db.collection(collection).doc(docId);
    const result = await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists) {
            // First request — create the counter
            transaction.set(docRef, {
                userId,
                action,
                requests: [{ timestamp: firestore_1.FieldValue.serverTimestamp() }],
                count: 1,
                firstRequestAt: firestore_1.FieldValue.serverTimestamp(),
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
            return { allowed: true, count: 1 };
        }
        const data = snap.data();
        // Filter to only requests within the current window
        const recentRequests = (data.requests || []).filter((r) => {
            const ts = r.timestamp?.toDate?.() || new Date(r.timestamp);
            return ts >= windowStart;
        });
        if (recentRequests.length >= maxRequests) {
            return { allowed: false, count: recentRequests.length };
        }
        // Add new request and prune expired ones
        transaction.update(docRef, {
            requests: [...recentRequests, { timestamp: firestore_1.FieldValue.serverTimestamp() }],
            count: recentRequests.length + 1,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        return { allowed: true, count: recentRequests.length + 1 };
    });
    if (!result.allowed) {
        const retryAfterMinutes = Math.ceil(windowMs / 60000);
        throw new https_1.HttpsError('resource-exhausted', `Rate limit exceeded for ${action}. Maximum ${maxRequests} requests per ${retryAfterMinutes} minutes. Please try again later.`);
    }
}
/* ── Pre-configured rate limits for common operations ─────────── */
exports.RATE_LIMITS = {
    /** Payment creation: 10 per hour per user */
    PAYMENT_CREATE: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
    /** Refund processing: 5 per hour per user */
    REFUND_PROCESS: { maxRequests: 5, windowMs: 60 * 60 * 1000 },
    /** Email sending: 20 per hour per user */
    EMAIL_SEND: { maxRequests: 20, windowMs: 60 * 60 * 1000 },
    /** SMS sending: 10 per hour per user */
    SMS_SEND: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
    /** Flight operations: 30 per hour per user */
    FLIGHT_OPS: { maxRequests: 30, windowMs: 60 * 60 * 1000 },
    /** Schedule publishing: 5 per hour per user */
    SCHEDULE_PUBLISH: { maxRequests: 5, windowMs: 60 * 60 * 1000 },
};
//# sourceMappingURL=rateLimit.js.map