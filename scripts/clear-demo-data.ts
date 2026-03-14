/**
 * Clear Demo Data — Flights, Bookings (+ sub-collections), and Schedules
 * Uses the Firebase JS SDK (same as the app) to delete data.
 * Run with: npx tsx scripts/clear-demo-data.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, writeBatch, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBQMbpFMbLrjBYeVjIBl5Q7_IMszWMB9Ck",
    authDomain: "deltablue-jet-air.firebaseapp.com",
    projectId: "deltablue-jet-air",
    storageBucket: "deltablue-jet-air.firebasestorage.app",
    messagingSenderId: "816728,863746",
    appId: "1:816728863746:web:afd2e3b9e98bc1ab6aa30a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteCollectionDocs(collectionName: string): Promise<number> {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
        console.log(`   ⏭  ${collectionName} — already empty`);
        return 0;
    }

    let count = 0;

    for (const docSnap of snapshot.docs) {
        // Check for sub-collections by trying known ones (passengers for bookings)
        if (collectionName === 'bookings') {
            try {
                const passengersSnap = await getDocs(collection(db, 'bookings', docSnap.id, 'passengers'));
                for (const paxDoc of passengersSnap.docs) {
                    await deleteDoc(doc(db, 'bookings', docSnap.id, 'passengers', paxDoc.id));
                }
            } catch { /* no passengers sub-collection */ }
        }

        await deleteDoc(doc(db, collectionName, docSnap.id));
        count++;
    }

    console.log(`   ✅ ${collectionName} — deleted ${count} documents`);
    return count;
}

async function main() {
    console.log('\n🧹 Clearing demo data from Firestore...\n');

    const collections = ['flights', 'bookings', 'schedules'];
    let total = 0;

    for (const col of collections) {
        total += await deleteCollectionDocs(col);
    }

    console.log(`\n🎉 Done! Removed ${total} documents total.\n`);
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Error:', err.message);
        process.exit(1);
    });
