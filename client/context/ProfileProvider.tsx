import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { type Role } from "@/components/RoleBadge";
import { useAuth } from "@/context/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, increment, onSnapshot, setDoc } from "firebase/firestore";

interface Profile {
  credits: number;
  role: Role;
}
interface ProfileCtx extends Profile {
  addCredits: (n: number) => Promise<void>;
  setRole: (r: Role) => Promise<void>;
}

const defaultProfile: Profile = { credits: 0, role: "user" };
const KEY = "brm_profile";

const Ctx = createContext<ProfileCtx>({
  ...defaultProfile,
  addCredits: async () => {},
  setRole: async () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw) as Profile;
    } catch {}
    return defaultProfile;
  });

  useEffect(() => {
    if (!user) {
      setProfile(defaultProfile);
      return;
    }
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() as any | undefined;
      if (data) {
        setProfile({
          credits: Number(data.credits ?? 0),
          role: (data.role ?? "user") as Role,
        });
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(profile));
    } catch {}
  }, [profile]);

  const addCredits = async (n: number) => {
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid),
      { credits: increment(n) },
      { merge: true },
    );
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
