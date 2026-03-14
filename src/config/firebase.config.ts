import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// ─── Firebase App Check ───────────────────────────────────
// Protects backend resources from abuse by verifying requests
// come from your legitimate app. Requires reCAPTCHA Enterprise
// site key from Firebase Console → App Check.
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (RECAPTCHA_SITE_KEY) {
    // Enable debug token in dev mode for emulator/localhost testing
    if (import.meta.env.DEV) {
        (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
    });
}

// ─── Explicit LOCAL Persistence ───────────────────────────
// Ensures users stay logged in across browser restarts and tab
// closes — they will only be logged out when they click "Sign Out".
setPersistence(auth, browserLocalPersistence).catch(console.error);

// ─── Emulator Connections ──────────────────────────────────
// Connect to Firebase emulators ONLY in local dev mode.
// Both conditions must be true: Vite dev server AND explicit env var.
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
    console.log('🔧 Connecting to Firebase Emulators...');
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('✅ Firebase Emulators connected (Auth:9099, Firestore:8080, Functions:5001, Storage:9199)');
}

