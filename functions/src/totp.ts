/**
 * TOTP (Time-based One-Time Password) — Cloud Functions
 *
 * Implements Authenticator App MFA using TOTP (RFC 6238).
 * Compatible with Google Authenticator, Microsoft Authenticator,
 * Authy, and any TOTP-compatible app.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp } from 'firebase-admin/app';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { authenticator } = require('otplib');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const QRCode = require('qrcode');

if (!getApps().length) initializeApp();

const db = getFirestore();
const adminAuth = getAuth();

const RP_NAME = 'DeltaBlue Jet Air';
const ADMIN_ROLES = ['super_admin', 'ops_manager', 'cs_agent', 'finance'];

/* ══════════════════════════════════════════════════════════════
   TOTP Enrollment Flow
   ══════════════════════════════════════════════════════════════ */

/**
 * Step 1: Generate a TOTP secret and return a QR code for enrollment.
 * The user scans this QR code with their authenticator app.
 */
export const totpGenerateSecret = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }

    const callerRole = request.auth.token.role as string;
    if (!callerRole || !ADMIN_ROLES.includes(callerRole)) {
        throw new HttpsError('permission-denied', 'Only admin users can set up authenticator app.');
    }

    const userId = request.auth.uid;
    const userEmail = request.auth.token.email || 'admin';

    // Check if already enrolled
    const existingDoc = await db.doc(`mfa_totp_secrets/${userId}`).get();
    if (existingDoc.exists && existingDoc.data()?.verified) {
        throw new HttpsError('already-exists', 'Authenticator app is already set up. Remove it first to re-enroll.');
    }

    // Generate a secure TOTP secret
    const secret = authenticator.generateSecret();

    // Build the otpauth:// URI for QR code
    const otpauthUri = authenticator.keyuri(userEmail, RP_NAME, secret);

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, {
        width: 256,
        margin: 2,
        color: { dark: '#0A1628', light: '#FFFFFF' },
    });

    // Store the pending (unverified) secret
    await db.doc(`mfa_totp_secrets/${userId}`).set({
        userId,
        secret,               // In production, encrypt this with KMS
        verified: false,       // Not yet confirmed by user
        createdAt: FieldValue.serverTimestamp(),
    });

    return {
        qrCodeDataUrl,
        secret,                // Also return plain text for manual entry
        otpauthUri,
    };
});

/**
 * Step 2: Verify the user's first TOTP code to confirm enrollment.
 * This proves they successfully set up the authenticator app.
 */
export const totpVerifySetup = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }

    const userId = request.auth.uid;
    const { code } = request.data;

    if (!code || typeof code !== 'string' || code.length !== 6) {
        throw new HttpsError('invalid-argument', 'A 6-digit verification code is required.');
    }

    // Get the pending secret
    const secretDoc = await db.doc(`mfa_totp_secrets/${userId}`).get();
    if (!secretDoc.exists) {
        throw new HttpsError('not-found', 'No pending authenticator setup found. Please start over.');
    }

    const data = secretDoc.data()!;
    if (data.verified) {
        throw new HttpsError('already-exists', 'Authenticator app is already verified.');
    }

    // Verify the code against the secret
    const isValid = authenticator.verify({ token: code, secret: data.secret });
    if (!isValid) {
        throw new HttpsError('invalid-argument', 'Invalid code. Make sure your authenticator app shows the correct code and try again.');
    }

    // Mark as verified
    await db.doc(`mfa_totp_secrets/${userId}`).update({
        verified: true,
        verifiedAt: FieldValue.serverTimestamp(),
    });

    // Set custom claim: totp_registered
    const existingClaims = (await adminAuth.getUser(userId)).customClaims || {};
    await adminAuth.setCustomUserClaims(userId, {
        ...existingClaims,
        totp_registered: true,
    });

    return { verified: true, message: 'Authenticator app successfully set up!' };
});

/* ══════════════════════════════════════════════════════════════
   TOTP Verification Flow — Used During Login
   ══════════════════════════════════════════════════════════════ */

/**
 * Verify a TOTP code during login.
 * On success, sets `totp_verified: true` custom claim for this session.
 */
export const totpVerifyCode = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }

    const userId = request.auth.uid;
    const { code } = request.data;

    if (!code || typeof code !== 'string' || code.length !== 6) {
        throw new HttpsError('invalid-argument', 'A 6-digit verification code is required.');
    }

    // Get the verified secret
    const secretDoc = await db.doc(`mfa_totp_secrets/${userId}`).get();
    if (!secretDoc.exists || !secretDoc.data()?.verified) {
        throw new HttpsError('not-found', 'No authenticator app is set up for this account.');
    }

    const data = secretDoc.data()!;

    // Check rate limiting — max 5 attempts per 5 minutes
    const attempts = data.recentAttempts || 0;
    const lastAttemptAt = data.lastAttemptAt?.toDate?.() || new Date(0);
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

    if (lastAttemptAt > fiveMinAgo && attempts >= 5) {
        throw new HttpsError('resource-exhausted', 'Too many attempts. Please wait a few minutes and try again.');
    }

    // Reset counter if last attempt was > 5 min ago
    const currentAttempts = lastAttemptAt > fiveMinAgo ? attempts + 1 : 1;

    // Verify the code (with ±1 window for clock drift)
    const isValid = authenticator.verify({ token: code, secret: data.secret });

    // Update attempt tracking
    await db.doc(`mfa_totp_secrets/${userId}`).update({
        recentAttempts: currentAttempts,
        lastAttemptAt: FieldValue.serverTimestamp(),
        ...(isValid ? { lastUsedAt: FieldValue.serverTimestamp() } : {}),
    });

    if (!isValid) {
        throw new HttpsError('invalid-argument', `Invalid code. ${5 - currentAttempts} attempts remaining.`);
    }

    // Set custom claim: totp_verified for this session
    const existingClaims = (await adminAuth.getUser(userId)).customClaims || {};
    await adminAuth.setCustomUserClaims(userId, {
        ...existingClaims,
        totp_verified: true,
    });

    return { verified: true };
});

/* ══════════════════════════════════════════════════════════════
   TOTP Management — Remove / Status
   ══════════════════════════════════════════════════════════════ */

/**
 * Remove TOTP enrollment for the current user.
 */
export const totpRemove = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }

    const userId = request.auth.uid;

    // Delete the secret document
    await db.doc(`mfa_totp_secrets/${userId}`).delete();

    // Remove custom claims
    const existingClaims = (await adminAuth.getUser(userId)).customClaims || {};
    const { totp_registered, totp_verified, ...rest } = existingClaims;
    await adminAuth.setCustomUserClaims(userId, rest);

    return { success: true, message: 'Authenticator app has been removed.' };
});

/**
 * Check TOTP enrollment status for the current user.
 */
export const totpGetStatus = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }

    const userId = request.auth.uid;
    const secretDoc = await db.doc(`mfa_totp_secrets/${userId}`).get();
    const claims = (await adminAuth.getUser(userId)).customClaims || {};

    return {
        enrolled: secretDoc.exists && secretDoc.data()?.verified === true,
        verified: !!claims.totp_verified,
        registeredAt: secretDoc.data()?.verifiedAt?.toDate?.()?.toISOString() || null,
    };
});

/* ══════════════════════════════════════════════════════════════
   Session Scoping — Clear verified status on logout
   ══════════════════════════════════════════════════════════════ */

/**
 * Clear the `totp_verified` claim so the admin must re-verify
 * their authenticator app on the next login session.
 * Called automatically during logout.
 */
export const clearTotpVerified = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }

    const userId = request.auth.uid;
    const existingClaims = (await adminAuth.getUser(userId)).customClaims || {};

    if (existingClaims.totp_registered) {
        await adminAuth.setCustomUserClaims(userId, {
            ...existingClaims,
            totp_verified: false,
        });
    }

    return { success: true };
});
