// Script to create initial users in Firebase
// Run with: node scripts/create-users.js

const admin = require('firebase-admin');

// Initialize Firebase Admin with service account
// Download service account key from Firebase Console > Project Settings > Service Accounts
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function createUser(email, password, displayName, role) {
  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName
    });

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      role,
      createdAt: Date.now()
    });

    console.log(`User created: ${email} (${role})`);
    return userRecord;
  } catch (error) {
    console.error(`Error creating user ${email}:`, error.message);
    throw error;
  }
}

async function main() {
  // Create your two users here
  // Replace with actual email addresses and passwords

  await createUser(
    'user1@example.com',  // Replace with actual email
    'securePassword123',   // Replace with actual password
    'Korisnik 1',
    'admin'
  );

  await createUser(
    'user2@example.com',  // Replace with actual email
    'securePassword123',   // Replace with actual password
    'Korisnik 2',
    'user'
  );

  console.log('\\nUsers created successfully!');
  process.exit(0);
}

main().catch(console.error);
