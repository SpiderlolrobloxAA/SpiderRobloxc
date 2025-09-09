import {
  initializeApp,
  cert,
  getApps,
  applicationDefault,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let db: ReturnType<typeof getFirestore> | null = null;

export function getAdminDb() {
  if (db) return db;
  if (!getApps().length) {
    const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (svcJson) {
      const creds = JSON.parse(svcJson);
      initializeApp({ credential: cert(creds) });
    } else {
      initializeApp({ credential: applicationDefault() });
    }
  }
  db = getFirestore();
  return db;
}
