/**
 * One-time script to sync Firebase Auth custom claims 
 * from Firestore user documents.
 * 
 * Usage: node scripts/sync-claims.cjs
 */
const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'deltablue-jet-air',
});

const db = admin.firestore();

async function syncClaims() {
  const snap = await db.collection('users').get();
  console.log(`Found ${snap.size} user documents\n`);

  for (const doc of snap.docs) {
    const { email, role, displayName } = doc.data();
    const uid = doc.id;
    
    if (!role) {
      console.log(`SKIP ${uid} (${email}) — no role field`);
      continue;
    }

    try {
      // Get current claims
      const userRecord = await admin.auth().getUser(uid);
      const currentRole = userRecord.customClaims?.role;

      if (currentRole === role) {
        console.log(`  OK  ${displayName || email} — claims already match: ${role}`);
      } else {
        await admin.auth().setCustomUserClaims(uid, { role });
        console.log(` SET  ${displayName || email} — ${currentRole || '(none)'} → ${role}`);
      }
    } catch (err) {
      console.log(` ERR  ${uid} (${email}) — ${err.message}`);
    }
  }
  
  console.log('\nDone! Users need to sign out and back in to pick up new claims.');
}

syncClaims().catch(console.error);
