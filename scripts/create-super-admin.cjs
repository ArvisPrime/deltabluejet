/**
 * Create Super Admin User
 * Run with: node scripts/create-super-admin.cjs
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (serviceAccountPath) {
    initializeApp({ credential: cert(require(serviceAccountPath)) });
} else {
    initializeApp({ projectId: 'deltablue-jet-air' });
}

const db = getFirestore();
const auth = getAuth();

async function createSuperAdmin() {
    const email = 'ola.bello@deltabluejetair.com';
    const password = 'Lagos@12345';
    const displayName = 'Ola Bello';
    const role = 'super_admin';

    try {
        // 1. Create Firebase Auth user
        console.log(`Creating Auth user: ${email}...`);
        const userRecord = await auth.createUser({
            email,
            password,
            displayName,
            emailVerified: true,
        });
        console.log(`✅ Auth user created: ${userRecord.uid}`);

        // 2. Create Firestore user document
        console.log('Writing Firestore user document...');
        await db.collection('users').doc(userRecord.uid).set({
            email,
            displayName,
            role,
            status: 'active',
            emailVerified: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        console.log(`✅ Firestore doc written: users/${userRecord.uid}`);

        console.log('\n🎉 Super Admin created successfully!');
        console.log(`   Email:    ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   Role:     ${role}`);
        console.log(`   UID:      ${userRecord.uid}`);
    } catch (error) {
        if (error.code === 'auth/email-already-exists') {
            console.log(`⚠️  User ${email} already exists in Auth. Updating Firestore doc...`);
            const existing = await auth.getUserByEmail(email);
            await db.collection('users').doc(existing.uid).set({
                email,
                displayName,
                role,
                status: 'active',
                emailVerified: true,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            }, { merge: true });
            console.log(`✅ Firestore doc updated for ${existing.uid}`);
        } else {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    }
}

createSuperAdmin().then(() => process.exit(0));
