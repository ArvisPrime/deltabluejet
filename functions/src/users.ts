/**
 * User Role Management — Cloud Functions
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) initializeApp();
const db = getFirestore();

/**
 * Set a user's role via custom claims.
 * Only callable by super_admin.
 */
export const setUserRole = onCall(async (request) => {
    if (!request.auth || request.auth.token.role !== 'super_admin') {
        throw new HttpsError('permission-denied', 'Only super admins can assign roles.');
    }

    const { uid, role } = request.data;
    const validRoles = ['super_admin', 'ops_manager', 'crew_sched', 'cs_agent', 'customer'];
    if (!validRoles.includes(role)) {
        throw new HttpsError('invalid-argument', `Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    await getAuth().setCustomUserClaims(uid, { role });
    await db.doc(`users/${uid}`).update({ role, updatedAt: FieldValue.serverTimestamp() });

    // Audit log
    await db.collection('audit_logs').add({
        action: 'SET_USER_ROLE',
        entityType: 'user',
        entityId: uid,
        userId: request.auth.uid,
        userEmail: request.auth.token.email || '',
        details: { newRole: role },
        timestamp: FieldValue.serverTimestamp(),
    });

    return { success: true, message: `Role '${role}' assigned to user ${uid}` };
});

/**
 * Auto-assign 'customer' custom claim when a new user document is created.
 */
export const onUserCreated = onDocumentCreated('users/{userId}', async (event) => {
    const userId = event.params.userId;
    const userData = event.data?.data();
    const role = userData?.role || 'customer';

    try {
        // Set custom auth claims
        await getAuth().setCustomUserClaims(userId, { role });
        console.log(`Custom claim set for user ${userId}: role=${role}`);

        // Auto-create loyalty document for DeltaBlue Club enrollment
        await db.doc(`loyalty/${userId}`).set({
            uid: userId,
            tier: 'blue',
            totalPoints: 0,
            lifetimePoints: 0,
            pointsHistory: [],
            tierExpiryDate: null,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        console.log(`Loyalty doc created for user ${userId}: tier=blue`);
    } catch (error) {
        console.error(`Failed to initialize user ${userId}:`, error);
    }
});
