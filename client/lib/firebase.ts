import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDMsFeXMVm61NlmN8QBk7UmH1ngPFW8TWo",
  authDomain: "keysystem-d0b86.firebaseapp.com",
  projectId: "keysystem-d0b86",
  storageBucket: "keysystem-d0b86.appspot.com",
  messagingSenderId: "1012783086146",
  appId: "1:1012783086146:web:6ae932b13a9e9c992a4bdb",
  measurementId: "G-PML2TD3Z35",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore only on the client. Initializing Firestore on the server
// during the dev server middleware can cause the SDK to attempt streaming
// operations using the environment's fetch/streams support which can lead to
// errors like "ReadableStreamDefaultReader constructor can only accept
// readable streams that are not yet locked to a reader". Guarding ensures
// Firestore is only created in the browser runtime.
export const db = initializeFirestore(app, {
  useFetchStreams: false,
  experimentalAutoDetectLongPolling: true,
} as any);

// Auth is browser-only: guard initialization so server builds don't initialize auth components
export const auth = getAuth(app);
// Optional: keep persistence if desired
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
}

export async function initAnalytics() {
  if (typeof window === "undefined") return null;
  try {
    if (await isSupported()) {
      return getAnalytics(app);
    }
  } catch {
    // no-op
  }
  return null;
}

export async function getStorageClient() {
  if (typeof window === "undefined") return undefined;
  try {
    const mod = await import("firebase/storage");
    return mod.getStorage(app);
  } catch (e) {
    // Storage not available in this environment or failed to load
    // eslint-disable-next-line no-console
    console.error('getStorageClient failed', e);
    return undefined;
  }
}
