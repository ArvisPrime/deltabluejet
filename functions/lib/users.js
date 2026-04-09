"use strict";
/**
 * User Role Management — Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreated = exports.syncAllClaims = exports.deleteUserAccount = exports.disableUserAccount = exports.createUserAccount = exports.setUserRole = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const auth_1 = require("firebase-admin/auth");
const firestore_2 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
const db = (0, firestore_2.getFirestore)();
/**
 * Helper: Check if caller is an admin.
 * First checks custom claims, then falls back to Firestore user doc.
 * This solves the chicken-and-egg problem where claims haven't been set yet.
 */
async function assertCallerIsAdmin(request) {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication required.');
    }
    // 1. Check custom claims first (fast path)
    const claimRole = request.auth.token?.role;
    if (claimRole && claimRole !== 'customer') {
        return claimRole;
    }
    // 2. Fallback: check Firestore user document
    const userDoc = await db.doc(`users/${request.auth.uid}`).get();
    const firestoreRole = userDoc.data()?.role;
    if (firestoreRole && firestoreRole !== 'customer') {
        // Auto-fix: sync the custom claims to match Firestore
        await (0, auth_1.getAuth)().setCustomUserClaims(request.auth.uid, { role: firestoreRole });
        console.log(`Auto-synced claims for ${request.auth.uid}: ${firestoreRole}`);
        return firestoreRole;
    }
    throw new https_1.HttpsError('permission-denied', 'Only admin users can perform this action.');
}
/**
 * Built-in role IDs that Firestore security rules recognize.
 * Custom roles (stored in `roles` collection) are mapped to 'ops_manager' for security purposes.
 */
const BUILT_IN_ROLE_IDS = ['super_admin', 'ops_manager', 'crew_sched', 'cs_agent', 'finance', 'customer'];
/**
 * Resolve a role identifier to its security-level claim.
 * Built-in roles pass through unchanged.
 * Custom roles (Firestore doc IDs) are mapped to 'ops_manager' since they are staff roles.
 */
async function resolveSecurityClaim(roleId) {
    if (BUILT_IN_ROLE_IDS.includes(roleId))
        return roleId;
    // It's a custom role document ID — verify it exists in the roles collection
    const roleDoc = await db.doc(`roles/${roleId}`).get();
    if (roleDoc.exists) {
        // Custom roles are all operational staff, so map to ops_manager for security rules
        return 'ops_manager';
    }
    // Unknown role — treat as customer for safety
    console.warn(`Unknown role ID: ${roleId}, defaulting to customer`);
    return 'customer';
}
/**
 * Set a user's role via custom claims.
 * Callable by any admin (non-customer) role.
 *
 * For custom roles (Firestore doc IDs), stores the role ID in the user document
 * but sets the security claim to the resolved base role (e.g. ops_manager).
 */
exports.setUserRole = (0, https_1.onCall)(async (request) => {
    await assertCallerIsAdmin(request);
    const { uid, role } = request.data;
    if (!uid || !role || typeof role !== 'string' || role.trim() === '') {
        throw new https_1.HttpsError('invalid-argument', 'uid and role are required.');
    }
    // Resolve the role to a security claim that Firestore rules understand
    const securityClaim = await resolveSecurityClaim(role);
    // Set the security claim on the Auth token, and preserve the original role ID
    await (0, auth_1.getAuth)().setCustomUserClaims(uid, { role: securityClaim, customRoleId: role !== securityClaim ? role : null });
    // Store the original role ID in Firestore for UI display purposes
    await db.doc(`users/${uid}`).update({ role, updatedAt: firestore_2.FieldValue.serverTimestamp() });
    // Audit log
    await db.collection('audit_logs').add({
        action: 'SET_USER_ROLE',
        entityType: 'user',
        entityId: uid,
        userId: request.auth.uid,
        userEmail: request.auth.token.email || '',
        details: { newRole: role, securityClaim },
        timestamp: firestore_2.FieldValue.serverTimestamp(),
    });
    return { success: true, message: `Role '${role}' assigned to user ${uid} (security: ${securityClaim})` };
});
/**
 * Create a new user account (Auth + Firestore).
 * Callable by any admin role.
 */
exports.createUserAccount = (0, https_1.onCall)(async (request) => {
    await assertCallerIsAdmin(request);
    const { email, displayName, role, password } = request.data;
    if (!email || !displayName) {
        throw new https_1.HttpsError('invalid-argument', 'Email and display name are required.');
    }
    // Accept any role string; default to customer if not provided
    const assignRole = (role && typeof role === 'string' && role.trim() !== '') ? role : 'customer';
    // Generate a temporary password if none provided
    const userPassword = password || `Temp${Math.random().toString(36).slice(2, 10)}!`;
    try {
        // 1. Create Firebase Auth account
        const userRecord = await (0, auth_1.getAuth)().createUser({
            email,
            displayName,
            password: userPassword,
            disabled: false,
        });
        // 2. Set custom claims — resolve custom roles to security-level claims
        const securityClaim = await resolveSecurityClaim(assignRole);
        await (0, auth_1.getAuth)().setCustomUserClaims(userRecord.uid, { role: securityClaim, customRoleId: assignRole !== securityClaim ? assignRole : null });
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
            createdAt: firestore_2.FieldValue.serverTimestamp(),
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
            timestamp: firestore_2.FieldValue.serverTimestamp(),
        });
        return {
            success: true,
            uid: userRecord.uid,
            message: `User '${displayName}' created with role '${assignRole}'.`,
            tempPassword: userPassword,
        };
    }
    catch (error) {
        console.error('createUserAccount error:', error);
        if (error.code === 'auth/email-already-exists') {
            throw new https_1.HttpsError('already-exists', 'A user with this email already exists.');
        }
        throw new https_1.HttpsError('internal', error.message || 'Failed to create user.');
    }
});
/**
 * Disable or re-enable a user account.
 * Callable by any admin role.
 */
exports.disableUserAccount = (0, https_1.onCall)(async (request) => {
    await assertCallerIsAdmin(request);
    const { uid, disabled } = request.data;
    if (!uid || typeof disabled !== 'boolean') {
        throw new https_1.HttpsError('invalid-argument', 'uid (string) and disabled (boolean) are required.');
    }
    // Prevent self-disable
    if (uid === request.auth.uid) {
        throw new https_1.HttpsError('failed-precondition', 'You cannot disable your own account.');
    }
    try {
        await (0, auth_1.getAuth)().updateUser(uid, { disabled });
        const newStatus = disabled ? 'suspended' : 'active';
        await db.doc(`users/${uid}`).update({
            status: newStatus,
            updatedAt: firestore_2.FieldValue.serverTimestamp(),
        });
        // Audit log
        await db.collection('audit_logs').add({
            action: disabled ? 'SUSPEND_USER' : 'REACTIVATE_USER',
            entityType: 'user',
            entityId: uid,
            userId: request.auth.uid,
            userEmail: request.auth.token.email || '',
            details: { newStatus },
            timestamp: firestore_2.FieldValue.serverTimestamp(),
        });
        return { success: true, message: `User ${disabled ? 'suspended' : 'reactivated'}.` };
    }
    catch (error) {
        console.error('disableUserAccount error:', error);
        throw new https_1.HttpsError('internal', error.message || 'Failed to update user status.');
    }
});
/**
 * Permanently delete a user account (Auth + Firestore).
 * Callable by any admin role.
 */
exports.deleteUserAccount = (0, https_1.onCall)(async (request) => {
    await assertCallerIsAdmin(request);
    const { uid } = request.data;
    if (!uid) {
        throw new https_1.HttpsError('invalid-argument', 'uid is required.');
    }
    // Prevent self-delete
    if (uid === request.auth.uid) {
        throw new https_1.HttpsError('failed-precondition', 'You cannot delete your own account.');
    }
    try {
        // Get user info for audit before deletion
        let userEmail = '';
        try {
            const userRecord = await (0, auth_1.getAuth)().getUser(uid);
            userEmail = userRecord.email || '';
        }
        catch { /* user may not exist in Auth */ }
        // 1. Delete from Firebase Auth
        try {
            await (0, auth_1.getAuth)().deleteUser(uid);
        }
        catch (e) {
            if (e.code !== 'auth/user-not-found')
                throw e;
        }
        // 2. Delete Firestore user document
        await db.doc(`users/${uid}`).delete();
        // 3. Delete loyalty document if exists
        try {
            await db.doc(`loyalty/${uid}`).delete();
        }
        catch { /* may not exist */ }
        // 4. Audit log
        await db.collection('audit_logs').add({
            action: 'DELETE_USER',
            entityType: 'user',
            entityId: uid,
            userId: request.auth.uid,
            userEmail: request.auth.token.email || '',
            details: { deletedUserEmail: userEmail },
            timestamp: firestore_2.FieldValue.serverTimestamp(),
        });
        return { success: true, message: 'User account permanently deleted.' };
    }
    catch (error) {
        console.error('deleteUserAccount error:', error);
        throw new https_1.HttpsError('internal', error.message || 'Failed to delete user.');
    }
});
/**
 * Sync all Firebase Auth custom claims from Firestore user documents.
 * Callable by any admin. Use this if claims are out of sync.
 */
exports.syncAllClaims = (0, https_1.onCall)(async (request) => {
    await assertCallerIsAdmin(request);
    const snap = await db.collection('users').get();
    let synced = 0;
    let skipped = 0;
    let errors = 0;
    for (const userDoc of snap.docs) {
        const { role, email } = userDoc.data();
        const uid = userDoc.id;
        if (!role) {
            skipped++;
            continue;
        }
        try {
            const securityClaim = await resolveSecurityClaim(role);
            const userRecord = await (0, auth_1.getAuth)().getUser(uid);
            if (userRecord.customClaims?.role !== securityClaim) {
                await (0, auth_1.getAuth)().setCustomUserClaims(uid, { role: securityClaim, customRoleId: role !== securityClaim ? role : null });
                synced++;
                console.log(`Synced ${email}: ${role} → claim:${securityClaim}`);
            }
            else {
                skipped++;
            }
        }
        catch (err) {
            errors++;
            console.error(`Failed to sync ${uid}: ${err.message}`);
        }
    }
    return {
        success: true,
        message: `Claims sync complete: ${synced} updated, ${skipped} already correct, ${errors} errors.`,
    };
});
/**
 * Auto-assign custom claim when a new user document is created.
 */
exports.onUserCreated = (0, firestore_1.onDocumentCreated)('users/{userId}', async (event) => {
    const userId = event.params.userId;
    const userData = event.data?.data();
    const role = userData?.role || 'customer';
    try {
        // Resolve custom role IDs to security-level claims
        const securityClaim = await resolveSecurityClaim(role);
        await (0, auth_1.getAuth)().setCustomUserClaims(userId, { role: securityClaim, customRoleId: role !== securityClaim ? role : null });
        console.log(`Custom claim set for user ${userId}: role=${role} → claim:${securityClaim}`);
        // Auto-create loyalty document for DeltaBlue Club enrollment
        await db.doc(`loyalty/${userId}`).set({
            uid: userId,
            tier: 'blue',
            totalPoints: 0,
            lifetimePoints: 0,
            pointsHistory: [],
            tierExpiryDate: null,
            createdAt: firestore_2.FieldValue.serverTimestamp(),
            updatedAt: firestore_2.FieldValue.serverTimestamp(),
        });
        console.log(`Loyalty doc created for user ${userId}: tier=blue`);
    }
    catch (error) {
        console.error(`Failed to initialize user ${userId}:`, error);
    }
});
//# sourceMappingURL=users.js.map