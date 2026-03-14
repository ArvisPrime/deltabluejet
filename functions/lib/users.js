"use strict";
/**
 * User Role Management — Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreated = exports.setUserRole = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const auth_1 = require("firebase-admin/auth");
const firestore_2 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
const db = (0, firestore_2.getFirestore)();
/**
 * Set a user's role via custom claims.
 * Only callable by super_admin.
 */
exports.setUserRole = (0, https_1.onCall)(async (request) => {
    if (!request.auth || request.auth.token.role !== 'super_admin') {
        throw new https_1.HttpsError('permission-denied', 'Only super admins can assign roles.');
    }
    const { uid, role } = request.data;
    const validRoles = ['super_admin', 'ops_manager', 'crew_sched', 'cs_agent', 'customer'];
    if (!validRoles.includes(role)) {
        throw new https_1.HttpsError('invalid-argument', `Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
    await (0, auth_1.getAuth)().setCustomUserClaims(uid, { role });
    await db.doc(`users/${uid}`).update({ role, updatedAt: firestore_2.FieldValue.serverTimestamp() });
    // Audit log
    await db.collection('audit_logs').add({
        action: 'SET_USER_ROLE',
        entityType: 'user',
        entityId: uid,
        userId: request.auth.uid,
        userEmail: request.auth.token.email || '',
        details: { newRole: role },
        timestamp: firestore_2.FieldValue.serverTimestamp(),
    });
    return { success: true, message: `Role '${role}' assigned to user ${uid}` };
});
/**
 * Auto-assign 'customer' custom claim when a new user document is created.
 */
exports.onUserCreated = (0, firestore_1.onDocumentCreated)('users/{userId}', async (event) => {
    const userId = event.params.userId;
    const userData = event.data?.data();
    const role = userData?.role || 'customer';
    try {
        await (0, auth_1.getAuth)().setCustomUserClaims(userId, { role });
        console.log(`Custom claim set for user ${userId}: role=${role}`);
    }
    catch (error) {
        console.error(`Failed to set custom claim for user ${userId}:`, error);
    }
});
//# sourceMappingURL=users.js.map