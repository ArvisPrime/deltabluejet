import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    confirmPasswordReset,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    onAuthStateChanged,
    type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase.config';
import { useAuthStore, type AuthUser, type MfaMethod } from '../stores/authStore';

// ─── Provider Singletons ──────────────────────────────────
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// ─── Type Helpers ─────────────────────────────────────────
type UserRole = string;
/** Any role that is not 'customer' is considered admin/staff */
function isAdminRole(role: string): boolean {
  return role !== 'customer';
}

/**
 * Map a Firebase User to our AuthUser shape.
 * Reads role exclusively from custom claims (set by Cloud Function).
 * No Firestore fallback — custom claims are the single source of truth.
 */
async function mapFirebaseUser(user: User): Promise<AuthUser> {
    const tokenResult = await user.getIdTokenResult();
    const role = tokenResult.claims.role as UserRole | undefined;

    return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: role || 'customer',
    };
}

/**
 * Check which MFA methods the user has enrolled but not yet verified this session.
 * Sets flags on the AuthUser object for the MFA verification gate.
 */
async function checkMfaRequirements(firebaseUser: User, authUser: AuthUser): Promise<void> {
    console.log('[MFA] checkMfaRequirements called for role:', authUser.role);
    if (!isAdminRole(authUser.role)) {
        console.log('[MFA] Not an admin role, skipping MFA check');
        return;
    }

    // Force refresh to get the latest custom claims from the server
    const tokenResult = await firebaseUser.getIdTokenResult(true);
    const claims = tokenResult.claims;
    console.log('[MFA] Custom Claims:', JSON.stringify({
        role: claims.role,
        yubikey_registered: claims.yubikey_registered,
        yubikey_verified: claims.yubikey_verified,
        totp_registered: claims.totp_registered,
        totp_verified: claims.totp_verified,
    }));

    const pending: MfaMethod[] = [];

    // ── YubiKey disabled ─────────────────────────────────────
    // To re-enable, uncomment the block below.
    // if (claims.yubikey_registered) {
    //     pending.push('yubikey');
    //     authUser.requiresYubikeyVerification = true;
    //     console.log('[MFA] YubiKey is registered — verification required');
    //     if (claims.yubikey_verified) {
    //         console.log('[MFA] Clearing stale YubiKey verified claim');
    //         try {
    //             const { httpsCallable } = await import('firebase/functions');
    //             const { functions } = await import('../config/firebase.config');
    //             await httpsCallable(functions, 'clearYubikeyVerified')();
    //         } catch (err) {
    //             console.warn('[MFA] Failed to clear stale YubiKey claim:', err);
    //         }
    //     }
    // }
    console.log('[MFA] YubiKey enforcement is DISABLED');

    // If TOTP is registered, ALWAYS require verification for this session.
    if (claims.totp_registered) {
        pending.push('totp');
        console.log('[MFA] TOTP is registered — verification required');

        if (claims.totp_verified) {
            console.log('[MFA] Clearing stale TOTP verified claim');
            try {
                const { httpsCallable } = await import('firebase/functions');
                const { functions } = await import('../config/firebase.config');
                await httpsCallable(functions, 'clearTotpVerified')();
            } catch (err) {
                console.warn('[MFA] Failed to clear stale TOTP claim:', err);
            }
        }
    }

    if (pending.length > 0) {
        authUser.requiresMfaVerification = true;
        authUser.pendingMfaMethods = pending;
        console.log('[MFA] Pending methods:', pending);
        // Force token refresh to pick up cleared claims
        await firebaseUser.getIdToken(true);
    } else {
        console.log('[MFA] No MFA methods registered — no verification needed');
    }
}

// ─── Auth Service ─────────────────────────────────────────

/**
 * Sign in with email and password.
 */
export async function loginWithEmail(email: string, password: string): Promise<AuthUser> {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    const authUser = await mapFirebaseUser(user);

    // Check MFA requirements for admin users
    await checkMfaRequirements(user, authUser);

    // Update last login in Firestore
    await setDoc(doc(db, 'users', user.uid), {
        lastLoginAt: serverTimestamp(),
    }, { merge: true });

    // Session tracking — create active session document
    await createSessionDoc(user.uid, authUser.displayName || user.email || '', authUser.role);

    useAuthStore.getState().setUser(authUser);
    return authUser;
}

/**
 * Register a new user with email, password, and display name.
 * Creates a Firestore user document.
 */
export async function registerWithEmail(
    email: string,
    password: string,
    displayName: string,
): Promise<AuthUser> {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    // Set display name
    await updateProfile(user, { displayName });

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName,
        role: 'customer',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
    });

    const authUser = await mapFirebaseUser(user);
    useAuthStore.getState().setUser(authUser);
    return authUser;
}

/**
 * Sign in with Google popup.
 * Creates Firestore document on first login.
 */
export async function loginWithGoogle(): Promise<AuthUser> {
    const { user } = await signInWithPopup(auth, googleProvider);

    // Check if first-time user
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: 'customer',
            provider: 'google',
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
        });
    } else {
        await setDoc(doc(db, 'users', user.uid), {
            lastLoginAt: serverTimestamp(),
        }, { merge: true });
    }

    const authUser = await mapFirebaseUser(user);

    // Check MFA requirements for admin users
    await checkMfaRequirements(user, authUser);

    // Session tracking — create active session document
    await createSessionDoc(user.uid, authUser.displayName || user.email || '', authUser.role);

    useAuthStore.getState().setUser(authUser);
    return authUser;
}

/**
 * Send a password reset email.
 */
export async function resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
}

/**
 * Confirm a password reset with the oob code from the email link.
 */
export async function confirmReset(oobCode: string, newPassword: string): Promise<void> {
    await confirmPasswordReset(auth, oobCode, newPassword);
}

/**
 * Sign out the current user.
 */
export async function logout(): Promise<void> {
    stopIdleTimer();
    const user = auth.currentUser;

    if (user) {
        // Clear MFA verified statuses so next login requires re-verification
        try {
            const { httpsCallable } = await import('firebase/functions');
            const { functions } = await import('../config/firebase.config');
            // YubiKey disabled — skip clearing yubikey verified claim
            // const clearVerified = httpsCallable(functions, 'clearYubikeyVerified');
            // await clearVerified();
            // Also clear TOTP verified status
            const clearTotp = httpsCallable(functions, 'clearTotpVerified');
            await clearTotp().catch(() => {}); // Ignore if not enrolled
        } catch (err) {
            console.warn('[Auth] Failed to clear MFA verified status:', err);
        }

        // Clean up session document before signing out
        await cleanupSessionDoc(user.uid, user.email || '');
    }

    await signOut(auth);
    useAuthStore.getState().logout();
}

// ─── Session Tracking Helpers ─────────────────────────────

/**
 * Create an active session document and write a LOGIN audit log.
 */
async function createSessionDoc(uid: string, name: string, role: string): Promise<void> {
    try {
        await setDoc(doc(db, 'active_sessions', uid), {
            userId: uid,
            name,
            role,
            location: 'Web App',
            activity: 'Dashboard',
            risk: 'safe',
            riskLabel: 'Normal Login',
            startedAt: serverTimestamp(),
            lastActiveAt: serverTimestamp(),
            userAgent: navigator.userAgent,
        });

        // Write audit log
        await addDoc(collection(db, 'session_audit_log'), {
            action: 'LOGIN',
            userId: uid,
            userName: name,
            userAgent: navigator.userAgent,
            timestamp: serverTimestamp(),
        });
    } catch (err) {
        console.warn('[Session] Failed to create session doc:', err);
    }
}

/**
 * Clean up session document and write a LOGOUT audit log.
 */
async function cleanupSessionDoc(uid: string, email: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'active_sessions', uid));

        // Write audit log
        await addDoc(collection(db, 'session_audit_log'), {
            action: 'LOGOUT',
            userId: uid,
            userName: email,
            userAgent: navigator.userAgent,
            timestamp: serverTimestamp(),
        });
    } catch (err) {
        console.warn('[Session] Failed to cleanup session doc:', err);
    }
}

// ─── Admin Idle Session Timeout ───────────────────────────
// Auto-logout admin/staff users after 30 minutes of inactivity.
// Customers are exempt (they use persistent sessions).

const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
let idleTimer: ReturnType<typeof setTimeout> | null = null;
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;

function resetIdleTimer(): void {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(async () => {
        const user = useAuthStore.getState().user;
        if (user && user.role !== 'customer') {
            console.warn('[Security] Admin idle timeout — signing out');
            await signOut(auth);
            useAuthStore.getState().logout();
            window.location.href = '/login?reason=idle';
        }
    }, ADMIN_IDLE_TIMEOUT_MS);
}

function startIdleTimer(): void {
    ACTIVITY_EVENTS.forEach(event =>
        document.addEventListener(event, resetIdleTimer, { passive: true })
    );
    resetIdleTimer();
}

function stopIdleTimer(): void {
    if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
    }
    ACTIVITY_EVENTS.forEach(event =>
        document.removeEventListener(event, resetIdleTimer)
    );
}

/**
 * Subscribe to auth state changes.
 * Call once at app startup to track login/logout automatically.
 * Returns an unsubscribe function.
 */
export function onAuthChange(callback?: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const authUser = await mapFirebaseUser(firebaseUser);

            // Check MFA requirements on session resume (e.g. page refresh)
            await checkMfaRequirements(firebaseUser, authUser);

            useAuthStore.getState().setUser(authUser);
            // Start idle timer for admin/staff users only
            if (authUser.role !== 'customer') {
                startIdleTimer();
            }
            callback?.(authUser);
        } else {
            stopIdleTimer();
            useAuthStore.getState().setUser(null);
            callback?.(null);
        }
    });
}
