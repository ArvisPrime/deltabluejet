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
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase.config';
import { useAuthStore, type AuthUser } from '../stores/authStore';

// ─── Provider Singletons ──────────────────────────────────
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// ─── Type Helpers ─────────────────────────────────────────
type UserRole = AuthUser['role'];

/**
 * Map a Firebase User to our AuthUser shape.
 * Reads role from custom claims (set by Cloud Function) with fallback to 'customer'.
 */
async function mapFirebaseUser(user: User): Promise<AuthUser> {
    const tokenResult = await user.getIdTokenResult();
    let role = tokenResult.claims.role as UserRole | undefined;

    // Fallback: read role from Firestore user document when custom claims aren't set
    if (!role) {
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                role = userDoc.data().role as UserRole;
            }
        } catch {
            // Firestore read may fail if rules are strict; use default
        }
    }

    return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: role || 'customer',
    };
}

// ─── Auth Service ─────────────────────────────────────────

/**
 * Sign in with email and password.
 */
export async function loginWithEmail(email: string, password: string): Promise<AuthUser> {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    const authUser = await mapFirebaseUser(user);

    // Update last login in Firestore
    await setDoc(doc(db, 'users', user.uid), {
        lastLoginAt: serverTimestamp(),
    }, { merge: true });

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
    await signOut(auth);
    useAuthStore.getState().logout();
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
            useAuthStore.getState().setUser(authUser);
            callback?.(authUser);
        } else {
            useAuthStore.getState().setUser(null);
            callback?.(null);
        }
    });
}
