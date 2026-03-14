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
            // Prefer cross-platform (USB YubiKey) but allow platform (Touch ID)
            authenticatorAttachment: undefined,
            userVerification: 'preferred',
            residentKey: 'preferred',
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

    // Store credential in Firestore
    const credDocId = Buffer.from(regCred.id).toString('base64url');
    await db.collection('webauthn_credentials').doc(credDocId).set({
        userId,
        credentialId: credDocId,
        publicKey: Buffer.from(regCred.publicKey).toString('base64'),
        counter: regCred.counter,
        transports: credential.response?.transports || [],
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
        throw new HttpsError('not-found', 'No security keys registered for this account.');
    }

    const allowCredentials = credsSnap.docs.map((doc) => {
        const data = doc.data();
        return {
            id: data.credentialId,
            type: 'public-key' as const,
            transports: (data.transports || []) as AuthenticatorTransportFuture[],
        };
    });

    const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        allowCredentials,
        userVerification: 'preferred',
    });

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

    // Find the matching credential
    const credId = credential.id;
    const credDoc = await db.doc(`webauthn_credentials/${credId}`).get();

    if (!credDoc.exists) {
        throw new HttpsError('not-found', 'Security key not recognized.');
    }

    const storedCred = credDoc.data()!;
    if (storedCred.userId !== userId) {
        throw new HttpsError('permission-denied', 'Security key does not belong to this account.');
    }

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
    await db.doc(`webauthn_credentials/${credId}`).update({
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
