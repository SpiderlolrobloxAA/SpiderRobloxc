import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { type Role } from "@/components/RoleBadge";
import { useAuth } from "@/context/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, increment, onSnapshot, updateDoc, setDoc } from "firebase/firestore";

interface Profile {
  credits: number;
  role: Role;
}
interface ProfileCtx extends Profile {
  addCredits: (n: number) => Promise<void>;
  setRole: (r: Role) => Promise<void>;
}

const defaultProfile: Profile = { credits: 0, role: "user" };

const Ctx = createContext<ProfileCtx>({
  ...defaultProfile,
  addCredits: async () => {},
  setRole: async () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>(defaultProfile);

  useEffect(() => {
    if (!user) {
      setProfile(defaultProfile);
      return;
    }

    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() as any | undefined;
        const credits = Number(data?.balances?.available ?? data?.credits ?? 0);
        const role = (data?.role ?? "user") as Role;
        setProfile({ credits, role });
      },
      (err) => {
        console.error("profile:onSnapshot failed", err);
      },
    );
    return () => unsub();
  }, [user]);

  const addCredits = async (n: number) => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    try {
      await updateDoc(ref, { "balances.available": increment(n) } as any);
    } catch (e) {
      // If update fails (doc missing), fallback to setDoc merge
      try {
        await setDoc(ref, { balances: { available: increment(n) } as any }, { merge: true });
      } catch (err) {
        console.error("addCredits failed", err);
      }
    }
  };

  const setRole = async (r: Role) => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid), { role: r }, { merge: true });
  };

  return (
    <Ctx.Provider value={{ ...profile, addCredits, setRole }}>
      {children}
    </Ctx.Provider>
  );
}

export const useProfile = () => useContext(Ctx);
