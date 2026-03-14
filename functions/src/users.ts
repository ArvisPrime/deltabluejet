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
 * Create a new user account (Auth + Firestore).
 * Only callable by super_admin.
 */
export const createUserAccount = onCall(async (request) => {
    if (!request.auth || request.auth.token.role !== 'super_admin') {
        throw new HttpsError('permission-denied', 'Only super admins can create users.');
    }

    const { email, displayName, role, password } = request.data;
    if (!email || !displayName) {
        throw new HttpsError('invalid-argument', 'Email and display name are required.');
    }

    const validRoles = ['super_admin', 'ops_manager', 'crew_sched', 'cs_agent', 'customer'];
    const assignRole = validRoles.includes(role) ? role : 'customer';

    // Generate a temporary password if none provided
    const userPassword = password || `Temp${Math.random().toString(36).slice(2, 10)}!`;

    try {
        // 1. Create Firebase Auth account
        const userRecord = await getAuth().createUser({
            email,
            displayName,
            password: userPassword,
            disabled: false,
        });

        // 2. Set custom claims
        await getAuth().setCustomUserClaims(userRecord.uid, { role: assignRole });

        // 3. Create Firestore user document
        await db.doc(`users/${userRecord.uid}`).set({
            email,
            displayName,
            role: assignRole,
            status: 'active',
            photoURL: null,
            provider: 'email',
            mfaEnabled: false,
            lastLoginAt: null,
            createdAt: FieldValue.serverTimestamp(),
            createdBy: request.auth.uid,
        });

        // 4. Audit log
        await db.collection('audit_logs').add({
            action: 'CREATE_USER',
            entityType: 'user',
            entityId: userRecord.uid,
            userId: request.auth.uid,
            userEmail: request.auth.token.email || '',
            details: { email, displayName, role: assignRole },
            timestamp: FieldValue.serverTimestamp(),
        });

        return {
            success: true,
            uid: userRecord.uid,
            message: `User '${displayName}' created with role '${assignRole}'.`,
            tempPassword: userPassword,
        };
    } catch (error: any) {
        console.error('createUserAccount error:', error);
        if (error.code === 'auth/email-already-exists') {
            throw new HttpsError('already-exists', 'A user with this email already exists.');
        }
        throw new HttpsError('internal', error.message || 'Failed to create user.');
    }
});

/**
 * Disable or re-enable a user account.
 * Only callable by super_admin.
 */
export const disableUserAccount = onCall(async (request) => {
    if (!request.auth || request.auth.token.role !== 'super_admin') {
        throw new HttpsError('permission-denied', 'Only super admins can disable/enable users.');
    }

    const { uid, disabled } = request.data;
    if (!uid || typeof disabled !== 'boolean') {
        throw new HttpsError('invalid-argument', 'uid (string) and disabled (boolean) are required.');
    }

    // Prevent self-disable
    if (uid === request.auth.uid) {
        throw new HttpsError('failed-precondition', 'You cannot disable your own account.');
    }

    try {
        await getAuth().updateUser(uid, { disabled });

        const newStatus = disabled ? 'suspended' : 'active';
        await db.doc(`users/${uid}`).update({
            status: newStatus,
            updatedAt: FieldValue.serverTimestamp(),
        });

        // Audit log
        await db.collection('audit_logs').add({
            action: disabled ? 'SUSPEND_USER' : 'REACTIVATE_USER',
            entityType: 'user',
            entityId: uid,
            userId: request.auth.uid,
            userEmail: request.auth.token.email || '',
            details: { newStatus },
            timestamp: FieldValue.serverTimestamp(),
        });

        return { success: true, message: `User ${disabled ? 'suspended' : 'reactivated'}.` };
    } catch (error: any) {
        console.error('disableUserAccount error:', error);
        throw new HttpsError('internal', error.message || 'Failed to update user status.');
    }
});

/**
 * Permanently delete a user account (Auth + Firestore).
 * Only callable by super_admin.
 */
export const deleteUserAccount = onCall(async (request) => {
    if (!request.auth || request.auth.token.role !== 'super_admin') {
        throw new HttpsError('permission-denied', 'Only super admins can delete users.');
    }

    const { uid } = request.data;
    if (!uid) {
        throw new HttpsError('invalid-argument', 'uid is required.');
    }

    // Prevent self-delete
    if (uid === request.auth.uid) {
        throw new HttpsError('failed-precondition', 'You cannot delete your own account.');
    }

    try {
        // Get user info for audit before deletion
        let userEmail = '';
        try {
            const userRecord = await getAuth().getUser(uid);
            userEmail = userRecord.email || '';
        } catch { /* user may not exist in Auth */ }

        // 1. Delete from Firebase Auth
        try {
            await getAuth().deleteUser(uid);
        } catch (e: any) {
            if (e.code !== 'auth/user-not-found') throw e;
        }

        // 2. Delete Firestore user document
        await db.doc(`users/${uid}`).delete();

        // 3. Delete loyalty document if exists
        try {
            await db.doc(`loyalty/${uid}`).delete();
        } catch { /* may not exist */ }

        // 4. Audit log
        await db.collection('audit_logs').add({
            action: 'DELETE_USER',
            entityType: 'user',
            entityId: uid,
            userId: request.auth.uid,
            userEmail: request.auth.token.email || '',
            details: { deletedUserEmail: userEmail },
            timestamp: FieldValue.serverTimestamp(),
        });

        return { success: true, message: 'User account permanently deleted.' };
    } catch (error: any) {
        console.error('deleteUserAccount error:', error);
        throw new HttpsError('internal', error.message || 'Failed to delete user.');
    }
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
