let db: any = null;

export async function getAdminDb() {
  if (db) return db;

  // Dynamically import firebase-admin only when needed to avoid loading it during Vite config time
  // @ts-ignore - optional dependency, only required on server with creds
  const adminApp = await import("firebase-admin/app");
  // @ts-ignore - optional dependency, only required on server with creds
  const firestoreModule = await import("firebase-admin/firestore");

  const { initializeApp, cert, getApps, applicationDefault } = adminApp;
  const { getFirestore } = firestoreModule;

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
