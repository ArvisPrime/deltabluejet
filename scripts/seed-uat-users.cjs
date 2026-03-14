/**
 * UAT Test Users — Seed Script
 *
 * Creates 4 test accounts in Firebase Auth and seeds both
 * the `users` collection (role) and `customers` collection (profile/loyalty).
 *
 * Run with:
 *   node scripts/seed-uat-users.cjs
 *
 * Requires either:
 *   - GOOGLE_APPLICATION_CREDENTIALS env var → service account key path
 *   - OR Firebase CLI login (`firebase login` first)
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// ─── Firebase Init ─────────────────────────────────────────
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (serviceAccountPath) {
    initializeApp({ credential: cert(require(serviceAccountPath)) });
} else {
    initializeApp({ projectId: 'deltablue-jet-air' });
}

const db = getFirestore();
const auth = getAuth();

// ─── UAT Users ─────────────────────────────────────────────
const UAT_PASSWORD = 'DeltaBlue2026!';

const UAT_USERS = [
    {
        email: 'aisha@test.com',
        displayName: 'Aisha Jallow',
        role: 'customer',
        loyaltyTier: 'bronze',
        totalTrips: 2,
        phone: '+220-301-1111',
        nationality: 'Gambian',
        preferences: {
            seatPreference: 'window',
            mealPreference: 'halal',
            emailNotifications: true,
            smsNotifications: false,
        },
    },
    {
        email: 'omar@test.com',
        displayName: 'Omar Faye',
        role: 'customer',
        loyaltyTier: 'gold',
        totalTrips: 28,
        phone: '+220-302-2222',
        nationality: 'Gambian',
        preferences: {
            seatPreference: 'aisle',
            mealPreference: 'standard',
            emailNotifications: true,
            smsNotifications: true,
        },
    },
    {
        email: 'lamin@test.com',
        displayName: 'Lamin Sanneh',
        role: 'ops_manager',
        loyaltyTier: 'silver',
        totalTrips: 12,
        phone: '+220-303-3333',
        nationality: 'Gambian',
        preferences: {
            seatPreference: 'aisle',
            mealPreference: 'standard',
            emailNotifications: true,
            smsNotifications: true,
        },
    },
    {
        email: 'abdou@test.com',
        displayName: 'Abdou Touray',
        role: 'super_admin',
        loyaltyTier: 'platinum',
        totalTrips: 45,
        phone: '+220-304-4444',
        nationality: 'Gambian',
        preferences: {
            seatPreference: 'window',
            mealPreference: 'standard',
            emailNotifications: true,
            smsNotifications: true,
        },
    },
];

// ─── Seed Function ─────────────────────────────────────────
async function seedUATUsers() {
    console.log('👥 Creating UAT test users...\n');
    console.log(`   Password for all accounts: ${UAT_PASSWORD}\n`);

    for (const u of UAT_USERS) {
        const { email, displayName, role, loyaltyTier, totalTrips, phone, nationality, preferences } = u;

        // 1. Create or update Firebase Auth user
        let uid;
        try {
            // Check if user already exists
            const existing = await auth.getUserByEmail(email);
            uid = existing.uid;
            console.log(`   ⚡ ${email} already exists (uid: ${uid}) — updating...`);
            await auth.updateUser(uid, { displayName, password: UAT_PASSWORD });
        } catch (err) {
            if (err.code === 'auth/user-not-found') {
                const created = await auth.createUser({
                    email,
                    password: UAT_PASSWORD,
                    displayName,
                    emailVerified: true,
                });
                uid = created.uid;
                console.log(`   ✅ Created ${email} (uid: ${uid})`);
            } else {
                console.error(`   ❌ Failed for ${email}:`, err.message);
                continue;
            }
        }

        // 2. Set custom claims for role
        await auth.setCustomUserClaims(uid, { role });
        console.log(`      → Custom claim: role = ${role}`);

        // 3. Write to `users` collection (auth/role doc)
        await db.doc(`users/${uid}`).set({
            email,
            displayName,
            role,
            createdAt: Timestamp.now(),
            lastLoginAt: Timestamp.now(),
        }, { merge: true });
        console.log(`      → users/${uid} written`);

        // 4. Write to `customers` collection (profile/loyalty doc)
        await db.doc(`customers/${uid}`).set({
            email,
            displayName,
            phone,
            nationality,
            documentType: 'passport',
            documentNumber: null,
            documentExpiry: null,
            dateOfBirth: null,
            preferences,
            loyaltyTier,
            totalTrips,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        }, { merge: true });
        console.log(`      → customers/${uid} written (${loyaltyTier} tier)\n`);
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ UAT Users Ready!\n');
    console.log('┌──────────────────┬──────────────┬──────────────────┐');
    console.log('│ Email            │ Role         │ Password         │');
    console.log('├──────────────────┼──────────────┼──────────────────┤');
    for (const u of UAT_USERS) {
        const em = u.email.padEnd(16);
        const rl = u.role.padEnd(12);
        console.log(`│ ${em} │ ${rl} │ ${UAT_PASSWORD} │`);
    }
    console.log('└──────────────────┴──────────────┴──────────────────┘');
}

seedUATUsers().catch((err) => {
    console.error('💥 Seed failed:', err);
    process.exit(1);
});
