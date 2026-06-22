// migarations/runMigration.ts
import admin from 'firebase-admin';

// 1. Load service account JSON
// Path is relative to this file (runMigration.ts)
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'terravision-b0eb4',
  });
}

const db = admin.firestore();

async function main() {
  const schemaData = {
    userId: 'user_77a9f9c0',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    images: {
      beforeUrl: 'https://storage.googleapis.com/placeholder-before.jpg',
      afterUrl: 'https://storage.googleapis.com/placeholder-after.jpg',
    },
    selections: {
      trees: true,
      shade: true,
      greenBelt: false,
      cycleLane: true,
      vegetation: true,
      gardens: false,
      intensity: 75,
    },
    impact: {
      tempReduction: '-2.8°C',
      carbonOffset: '12kg/yr',
    },
  };

  try {
    const colRef = db.collection('image_generation_table');
    const docRef = await colRef.add(schemaData);
    console.log('Created document in image_generation_table with id:', docRef.id);
  } catch (err) {
    console.error('Error creating document:', err);
  } finally {
    process.exit(0);
  }
}

main();
