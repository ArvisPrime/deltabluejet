/**
 * Set custom claims (role) on a Firebase Auth user.
 * Run with: node scripts/set-custom-claims.cjs <email> <role>
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (serviceAccountPath) {
    initializeApp({ credential: cert(require(serviceAccountPath)) });
} else {
    initializeApp({ projectId: 'deltablue-jet-air' });
}

const authAdmin = getAuth();

async function setCustomClaims() {
    const email = process.argv[2] || 'ola.bello@deltabluejetair.com';
    const role = process.argv[3] || 'super_admin';

    try {
        const user = await authAdmin.getUserByEmail(email);
        await authAdmin.setCustomUserClaims(user.uid, { role });
        console.log(`✅ Custom claims set for ${email}: { role: "${role}" }`);
        console.log(`   UID: ${user.uid}`);
        console.log('\n⚠️  User must sign out and sign back in for claims to take effect.');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

setCustomClaims().then(() => process.exit(0));
