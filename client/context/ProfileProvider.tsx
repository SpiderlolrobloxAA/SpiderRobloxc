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

const Ctx = createContext<ProfileCtx>({
  ...defaultProfile,
  addCredits: async () => {},
  setRole: async () => {},
});

function getLocalKey(uid?: string | null) {
  return `brm_profile_${uid ?? "anon"}`;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>(() => {
    try {
      const raw = localStorage.getItem(getLocalKey(null));
      if (raw) return JSON.parse(raw) as Profile;
    } catch {}
    return defaultProfile;
  });

  useEffect(() => {
    if (!user) {
      setProfile((prev) => {
        // keep local anonymous cache if present
        try {
          const raw = localStorage.getItem(getLocalKey(null));
          if (raw) return JSON.parse(raw) as Profile;
        } catch {}
        return defaultProfile;
      });
      return;
    }

    const localRaw = (() => {
      try {
        const raw = localStorage.getItem(getLocalKey(user.uid));
        if (raw) return JSON.parse(raw) as Profile;
      } catch {}
      return null;
    })();

    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(
      ref,
      async (snap) => {
        const data = snap.data() as any | undefined;
        const serverCredits = Number(data?.balances?.available ?? data?.credits ?? 0);
        const serverRole = (data?.role ?? "user") as Role;
        const localCredits = localRaw?.credits ?? profile.credits ?? 0;

        // Prefer the highest value to avoid losing local cached credits
        const mergedCredits = Math.max(serverCredits, localCredits);

        // If local cache has more credits than server, sync up
        if (mergedCredits > serverCredits) {
          try {
            await setDoc(
              ref,
              { balances: { available: increment(mergedCredits - serverCredits) } as any },
              { merge: true },
            );
          } catch (e) {
            console.error("profile:sync to server failed", e);
          }
        }

        setProfile({ credits: Number(mergedCredits), role: serverRole });
      },
      (err) => {
        console.error("profile:onSnapshot failed", err);
      },
    );
    return () => unsub();
  }, [user]);

  useEffect(() => {
    try {
      const key = getLocalKey(user?.uid ?? null);
      localStorage.setItem(key, JSON.stringify(profile));
    } catch {}
  }, [profile, user?.uid]);

  const addCredits = async (n: number) => {
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid),
      { balances: { available: increment(n) } as any },
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
