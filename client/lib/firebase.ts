import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDMsFeXMVm61NlmN8QBk7UmH1ngPFW8TWo",
  authDomain: "keysystem-d0b86.firebaseapp.com",
  projectId: "keysystem-d0b86",
  storageBucket: "keysystem-d0b86.firebasestorage.app",
  messagingSenderId: "1012783086146",
  appId: "1:1012783086146:web:6ae932b13a9e9c992a4bdb",
  measurementId: "G-PML2TD3Z35",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

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
