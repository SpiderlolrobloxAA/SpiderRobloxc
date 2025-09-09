import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, initAnalytics, db } from "@/lib/firebase";
import { doc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}
const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAnalytics();
    if (!auth) {
      // Auth not available (SSR). Mark loading false and skip auth listeners.
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        try {
          const ref = doc(db, "users", u.uid);
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            // First time: create full profile with initial balances
            await setDoc(
              ref,
              {
                username: u.displayName || u.email?.split("@")[0] || "user",
                email: u.email || null,
                role: "user",
                balances: { available: 0, pending: 0 },
                quests: { completed: [], progress: {} },
                stats: { sales: 0, purchases: 0, joinedAt: serverTimestamp() },
                settings: { notifications: true },
                lastSeen: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true },
            );
          } else {
            // Don't overwrite balances on every auth change — only update missing fields and timestamps
            const data = snap.data() as any;
            const updates: any = {
              lastSeen: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            if (!data.username && u.displayName)
              updates.username = u.displayName;
            if (!data.email && u.email) updates.email = u.email;
            await setDoc(ref, updates, { merge: true });
          }
        } catch (e) {
          console.error("auth:setUserDoc failed", e);
        }
      }
    });
    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <Ctx.Provider value={{ user, loading, logout }}>{children}</Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
