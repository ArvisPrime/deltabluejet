/**
 * Clear Demo Data — Flights, Bookings (+ sub-collections), and Schedules
 * Run with: node scripts/clear-demo-data.cjs
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (serviceAccountPath) {
    initializeApp({ credential: cert(require(serviceAccountPath)) });
} else {
    initializeApp({ projectId: 'deltablue-jet-air' });
}

const db = getFirestore();

async function deleteCollection(collectionPath) {
    const colRef = db.collection(collectionPath);
    const snapshot = await colRef.get();

    if (snapshot.empty) {
        console.log(`   ⏭  ${collectionPath} — already empty`);
        return 0;
    }

    let count = 0;
    const batchSize = 400; // Firestore batch limit is 500
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
        // Delete sub-collections first (e.g. bookings/{id}/passengers)
        const subCollections = await doc.ref.listCollections();
        for (const subCol of subCollections) {
            const subSnap = await subCol.get();
            for (const subDoc of subSnap.docs) {
                batch.delete(subDoc.ref);
                batchCount++;
                if (batchCount >= batchSize) {
                    await batch.commit();
                    batch = db.batch();
                    batchCount = 0;
                }
            }
        }

        batch.delete(doc.ref);
        batchCount++;
        count++;

        if (batchCount >= batchSize) {
            await batch.commit();
            batch = db.batch();
            batchCount = 0;
        }
    }

    if (batchCount > 0) {
        await batch.commit();
    }

    console.log(`   ✅ ${collectionPath} — deleted ${count} documents`);
    return count;
}

async function main() {
    console.log('\n🧹 Clearing demo data from Firestore...\n');

    const collections = ['flights', 'bookings', 'schedules'];
    let total = 0;

    for (const col of collections) {
        total += await deleteCollection(col);
    }

    console.log(`\n🎉 Done! Removed ${total} documents total.\n`);
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Error:', err.message);
        process.exit(1);
    });
