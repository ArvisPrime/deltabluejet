/**
 * WebAuthn / YubiKey — Cloud Functions
 *
 * Implements FIDO2/WebAuthn registration and authentication flows
 * using @simplewebauthn/server. Stores credentials in Firestore
 * and sets custom claims for verified admin users.
 *
 * Supports hardware security keys (YubiKey) and platform
 * authenticators (Touch ID, Windows Hello).
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps } from 'firebase-admin/app';
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
    AuthenticatorTransportFuture,
} from '@simplewebauthn/server';

if (!getApps().length) initializeApp();
const db = getFirestore();
const adminAuth = getAuth();

// ─── Relying Party Configuration ──────────────────────────
// These identify your app to the browser's WebAuthn API.
const RP_NAME = 'DeltaBlue Jet Air';
const RP_ID = 'deltablue-jet-air.web.app';
const RP_ORIGIN = `https://${RP_ID}`;

// Admin roles that require security key verification
const ADMIN_ROLES = ['super_admin', 'ops_manager', 'cs_agent', 'finance'];

/* ══════════════════════════════════════════════════════════════
   Registration Flow — Link a YubiKey to an Admin Account
   ══════════════════════════════════════════════════════════════ */

/**
 * Step 1: Generate registration options (challenge) for the browser.
 * The admin's browser will use these to prompt their YubiKey.
 */
export const webauthnGenerateRegistration = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }

    const callerRole = request.auth.token.role as string | undefined;
    if (!callerRole || !ADMIN_ROLES.includes(callerRole)) {
        throw new HttpsError('permission-denied', 'Only admin users can register security keys.');
    }

    const userId = request.auth.uid;
    const userEmail = request.auth.token.email || 'admin';
    const keyName = request.data?.keyName || 'Security Key';

    // Get existing credentials for this user (for excludeCredentials)
    const existingCreds = await db
        .collection('webauthn_credentials')
        .where('userId', '==', userId)
        .get();

    const excludeCredentials = existingCreds.docs.map((doc) => {
        const data = doc.data();
        return {
            id: data.credentialId,
            type: 'public-key' as const,
            transports: (data.transports || []) as AuthenticatorTransportFuture[],
        };
    });

    const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userID: new TextEncoder().encode(userId),
        userName: userEmail,
        userDisplayName: userEmail,
        attestationType: 'none',
        authenticatorSelection: {
            // Force cross-platform: only USB/NFC hardware keys (YubiKey), no passkeys
            authenticatorAttachment: 'cross-platform',
            userVerification: 'preferred',
            residentKey: 'discouraged',
            requireResidentKey: false,
        },
        excludeCredentials,
    });

    // Store challenge temporarily (5 min TTL)
    await db.doc(`webauthn_challenges/${userId}`).set({
        challenge: options.challenge,
        type: 'registration',
        keyName,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    return options;
});

/**
 * Step 2: Verify the registration response and store the credential.
 */
export const webauthnVerifyRegistration = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }

    const userId = request.auth.uid;
    const { credential } = request.data;

    if (!credential) {
        throw new HttpsError('invalid-argument', 'Missing credential data.');
    }

    // Retrieve stored challenge
    const challengeDoc = await db.doc(`webauthn_challenges/${userId}`).get();
    if (!challengeDoc.exists) {
        throw new HttpsError('failed-precondition', 'No pending registration challenge. Please start over.');
    }

    const challengeData = challengeDoc.data()!;
    const expectedChallenge = challengeData.challenge;
    const keyName = challengeData.keyName || 'Security Key';

    // Check expiry
    const expiresAt = challengeData.expiresAt?.toDate?.() || new Date(challengeData.expiresAt);
    if (new Date() > expiresAt) {
        await db.doc(`webauthn_challenges/${userId}`).delete();
        throw new HttpsError('deadline-exceeded', 'Challenge expired. Please try again.');
    }

    let verification;
    try {
        verification = await verifyRegistrationResponse({
            response: credential,
            expectedChallenge,
            expectedOrigin: RP_ORIGIN,
            expectedRPID: RP_ID,
        });
    } catch (error: any) {
        throw new HttpsError('invalid-argument', `Verification failed: ${error.message}`);
    }

    if (!verification.verified || !verification.registrationInfo) {
        throw new HttpsError('invalid-argument', 'Security key verification failed.');
    }

    const { credential: regCred, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    // CRITICAL: regCred.id may be a Uint8Array that contains UTF-8 bytes of a base64url string
    // (not raw credential bytes). We must detect this and avoid double-encoding.
    let credId: string;
    if (typeof regCred.id === 'string') {
        credId = regCred.id;
    } else {
        // Convert Uint8Array to UTF-8 string first
        const asUtf8 = Buffer.from(regCred.id).toString('utf8');
        // Check if it's already a base64url string (only contains base64url chars)
        if (/^[A-Za-z0-9_-]+={0,2}$/.test(asUtf8) && asUtf8.length > 20) {
            credId = asUtf8;
        } else {
            credId = Buffer.from(regCred.id).toString('base64url');
        }
    }

    // Same pattern for publicKey
    let pubKey: string;
    if (typeof regCred.publicKey === 'string') {
        pubKey = regCred.publicKey;
    } else {
        pubKey = Buffer.from(regCred.publicKey).toString('base64');
    }

    console.log('[WEBAUTHN_REG] credId:', credId, 'type was:', typeof regCred.id);

    // Resolve transports — empty array is truthy in JS, so check .length explicitly
    const rawTransports = credential.response?.transports || credential.transports;
    const resolvedTransports = (Array.isArray(rawTransports) && rawTransports.length > 0)
        ? rawTransports
        : ['usb'];

    // Use credId as Firestore doc ID (replace / with _ for safety)
    const docId = credId.replace(/\//g, '_');
    await db.collection('webauthn_credentials').doc(docId).set({
        userId,
        credentialId: credId,
        publicKey: pubKey,
        counter: regCred.counter,
        transports: resolvedTransports,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        keyName,
        registeredAt: FieldValue.serverTimestamp(),
    });

    // Clean up challenge
    await db.doc(`webauthn_challenges/${userId}`).delete();

    // Set custom claims to mark this user as having a registered key
    const existingClaims = (await adminAuth.getUser(userId)).customClaims || {};
    await adminAuth.setCustomUserClaims(userId, {
        ...existingClaims,
        yubikey_registered: true,
    });

    return {
        verified: true,
        keyName,
        deviceType: credentialDeviceType,
    };
});

/* ══════════════════════════════════════════════════════════════
   Authentication Flow — Verify YubiKey on Login
   ══════════════════════════════════════════════════════════════ */

/**
 * Step 1: Generate authentication options (challenge).
 */
export const webauthnGenerateAuthentication = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }

    const userId = request.auth.uid;

    // Get user's registered credentials
    const credsSnap = await db
        .collection('webauthn_credentials')
        .where('userId', '==', userId)
        .get();

    if (credsSnap.empty) {
        // Self-healing: clear stale yubikey claims if credentials were deleted
        const existingClaims = (await adminAuth.getUser(userId)).customClaims || {};
        if (existingClaims.yubikey_registered || existingClaims.yubikey_verified || existingClaims.yubikey_required) {
            await adminAuth.setCustomUserClaims(userId, {
                ...existingClaims,
                yubikey_registered: false,
                yubikey_verified: false,
                yubikey_required: false,
            });
        }
        return { noKeysFound: true, message: 'No security keys registered. Claims have been cleared.' };
    }

    const allowCredentials = credsSnap.docs.map((doc) => {
        const data = doc.data();
        const transports = (data.transports && data.transports.length > 0)
            ? data.transports as AuthenticatorTransportFuture[]
            : ['usb' as AuthenticatorTransportFuture];
        console.log('[WEBAUTHN_AUTH] Credential from Firestore:', data.credentialId, 'transports:', transports);
        return {
            id: data.credentialId,
            type: 'public-key' as const,
            transports,
        };
    });

    console.log('[WEBAUTHN_AUTH] allowCredentials count:', allowCredentials.length);

    const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        allowCredentials,
        userVerification: 'preferred',
    });

    console.log('[WEBAUTHN_AUTH] Generated options.allowCredentials:', JSON.stringify(options.allowCredentials));

    // Store challenge (5 min TTL)
    await db.doc(`webauthn_challenges/${userId}`).set({
        challenge: options.challenge,
        type: 'authentication',
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    return options;
});

/**
 * Step 2: Verify the authentication response.
 * On success, sets `yubikey_verified: true` custom claim.
 */
export const webauthnVerifyAuthentication = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }

    const userId = request.auth.uid;
    const { credential } = request.data;

    if (!credential) {
        throw new HttpsError('invalid-argument', 'Missing credential data.');
    }

    // Retrieve stored challenge
    const challengeDoc = await db.doc(`webauthn_challenges/${userId}`).get();
    if (!challengeDoc.exists) {
        throw new HttpsError('failed-precondition', 'No pending authentication challenge.');
    }

    const challengeData = challengeDoc.data()!;
    const expectedChallenge = challengeData.challenge;

    // Check expiry
    const expiresAt = challengeData.expiresAt?.toDate?.() || new Date(challengeData.expiresAt);
    if (new Date() > expiresAt) {
        await db.doc(`webauthn_challenges/${userId}`).delete();
        throw new HttpsError('deadline-exceeded', 'Challenge expired. Please try again.');
    }

    // Find the matching credential by credentialId field
    const credId = credential.id;
    console.log('[WEBAUTHN_VERIFY_AUTH] Looking up credentialId:', credId);
    const credQuery = await db.collection('webauthn_credentials')
        .where('credentialId', '==', credId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

    if (credQuery.empty) {
        throw new HttpsError('not-found', 'Security key not recognized.');
    }

    const credDoc = credQuery.docs[0];
    const storedCred = credDoc.data();

    let verification;
    try {
        verification = await verifyAuthenticationResponse({
            response: credential,
            expectedChallenge,
            expectedOrigin: RP_ORIGIN,
            expectedRPID: RP_ID,
            credential: {
                id: storedCred.credentialId,
                publicKey: new Uint8Array(Buffer.from(storedCred.publicKey, 'base64')),
                counter: storedCred.counter,
                transports: storedCred.transports as AuthenticatorTransportFuture[],
            },
        });
    } catch (error: any) {
        throw new HttpsError('invalid-argument', `Authentication failed: ${error.message}`);
    }

    if (!verification.verified) {
        throw new HttpsError('invalid-argument', 'Security key authentication failed.');
    }

    // Update counter (replay attack prevention)
    await credDoc.ref.update({
        counter: verification.authenticationInfo.newCounter,
        lastUsedAt: FieldValue.serverTimestamp(),
    });

    // Clean up challenge
    await db.doc(`webauthn_challenges/${userId}`).delete();

    // Set custom claim: verified
    const existingClaims = (await adminAuth.getUser(userId)).customClaims || {};
    await adminAuth.setCustomUserClaims(userId, {
        ...existingClaims,
        yubikey_verified: true,
    });

    return { verified: true };
});

/* ══════════════════════════════════════════════════════════════
   Management — List & Remove Security Keys
   ══════════════════════════════════════════════════════════════ */

/**
 * List all security keys registered for the current user.
 */
export const webauthnListKeys = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }

    const userId = request.auth.uid;
    const snap = await db
        .collection('webauthn_credentials')
        .where('userId', '==', userId)
        .get();

    return snap.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            keyName: data.keyName || 'Security Key',
            deviceType: data.deviceType || 'unknown',
            registeredAt: data.registeredAt?.toDate?.()?.toISOString() || null,
            lastUsedAt: data.lastUsedAt?.toDate?.()?.toISOString() || null,
        };
    });
});

/**
 * Remove a security key. Admins can only remove their own keys.
 */
export const webauthnRemoveKey = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }

    const userId = request.auth.uid;
    const { credentialId } = request.data;

    if (!credentialId) {
        throw new HttpsError('invalid-argument', 'credentialId is required.');
    }

    const credDoc = await db.doc(`webauthn_credentials/${credentialId}`).get();
    if (!credDoc.exists) {
        throw new HttpsError('not-found', 'Security key not found.');
    }

    if (credDoc.data()!.userId !== userId) {
        throw new HttpsError('permission-denied', 'You can only remove your own security keys.');
    }

    await db.doc(`webauthn_credentials/${credentialId}`).delete();

    // Check if user has any remaining keys
    const remaining = await db
        .collection('webauthn_credentials')
        .where('userId', '==', userId)
        .limit(1)
        .get();

    if (remaining.empty) {
        // No more keys — remove the registered claim
        const existingClaims = (await adminAuth.getUser(userId)).customClaims || {};
        const { yubikey_registered, yubikey_verified, ...rest } = existingClaims;
        await adminAuth.setCustomUserClaims(userId, rest);
    }

    return { success: true };
});

/* ══════════════════════════════════════════════════════════════
   Session Scoping — Clear verified status on logout
   ══════════════════════════════════════════════════════════════ */

/**
 * Clear the `yubikey_verified` claim so the admin must re-verify
 * their security key on the next login session.
 * Called automatically during logout.
 */
export const clearYubikeyVerified = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }

    const userId = request.auth.uid;
    const existingClaims = (await adminAuth.getUser(userId)).customClaims || {};

    // Only clear if the user actually has a registered key
    if (existingClaims.yubikey_registered) {
        await adminAuth.setCustomUserClaims(userId, {
            ...existingClaims,
            yubikey_verified: false,
        });
    }

    return { success: true };
});

/* ══════════════════════════════════════════════════════════════
   Super-Admin Key Management
   ══════════════════════════════════════════════════════════════ */

/**
 * Assign or remove the security-key requirement for a target admin user.
 * - Sets (or clears) the `yubikey_required` custom claim.
 * - Only super_admin callers may invoke this.
 */
export const assignSecurityKeyRequirement = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }

    // Only super_admin can assign key requirements
    const callerClaims = (await adminAuth.getUser(request.auth.uid)).customClaims || {};
    if (callerClaims.role !== 'super_admin') {
        throw new HttpsError('permission-denied', 'Only super admins can assign security key requirements.');
    }

    const { targetUid, required } = request.data as { targetUid: string; required: boolean };
    if (!targetUid || typeof required !== 'boolean') {
        throw new HttpsError('invalid-argument', 'targetUid (string) and required (boolean) are required.');
    }

    // Verify target exists and is an admin role
    const targetUser = await adminAuth.getUser(targetUid);
    const targetClaims = targetUser.customClaims || {};
    const adminRoles = ['super_admin', 'ops_manager', 'crew_sched', 'cs_agent'];
    if (!adminRoles.includes(targetClaims.role)) {
        throw new HttpsError('failed-precondition', 'Security keys can only be assigned to admin/staff users.');
    }

    // Update claims
    await adminAuth.setCustomUserClaims(targetUid, {
        ...targetClaims,
        yubikey_required: required,
    });

    // Log the action
    await db.collection('audit_logs').add({
        action: required ? 'security_key_required' : 'security_key_requirement_removed',
        targetUid,
        performedBy: request.auth.uid,
        timestamp: FieldValue.serverTimestamp(),
    });

    return {
        success: true,
        message: required
            ? `Security key requirement enabled for ${targetUser.email}`
            : `Security key requirement removed for ${targetUser.email}`,
    };
});

/**
 * Get security key status for a target user.
 * Returns whether the user has a registered key, is required to use one, and current verified state.
 */
export const getSecurityKeyStatus = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }

    // Only ops staff can view key status
    const callerClaims = (await adminAuth.getUser(request.auth.uid)).customClaims || {};
    const opsRoles = ['super_admin', 'ops_manager', 'crew_sched', 'cs_agent'];
    if (!opsRoles.includes(callerClaims.role)) {
        throw new HttpsError('permission-denied', 'Insufficient permissions.');
    }

    const { targetUid } = request.data as { targetUid: string };
    if (!targetUid) {
        throw new HttpsError('invalid-argument', 'targetUid is required.');
    }

    const targetUser = await adminAuth.getUser(targetUid);
    const claims = targetUser.customClaims || {};

    // Count registered credentials
    const credsSnap = await db
        .collection('webauthn_credentials')
        .where('userId', '==', targetUid)
        .get();

    return {
        yubikey_required: !!claims.yubikey_required,
        yubikey_registered: !!claims.yubikey_registered,
        yubikey_verified: !!claims.yubikey_verified,
        credentialCount: credsSnap.size,
    };
});
