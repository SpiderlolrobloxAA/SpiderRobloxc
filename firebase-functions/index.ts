import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

export const createUserProfile = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const email = user.email || null;
  const username = (user.displayName || (email ? email.split('@')[0] : 'user')) as string;

  const ref = db.doc(`users/${uid}`);
  await ref.set({
    email,
    username,
    role: 'user',
    balances: { available: 0, pending: 0 },
    quests: { completed: [], progress: {} },
    stats: { sales: 0, purchases: 0, joinedAt: FieldValue.serverTimestamp() },
    lastSeen: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
});
