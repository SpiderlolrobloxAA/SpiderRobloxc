import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, initAnalytics } from "@/lib/firebase";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}
const Ctx = createContext<AuthCtx>({ user: null, loading: true, logout: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAnalytics();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return <Ctx.Provider value={{ user, loading, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
