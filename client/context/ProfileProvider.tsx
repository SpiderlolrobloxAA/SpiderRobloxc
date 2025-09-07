import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { type Role } from "@/components/RoleBadge";

interface Profile {
  credits: number;
  role: Role;
}
interface ProfileCtx extends Profile {
  addCredits: (n: number) => void;
  setRole: (r: Role) => void;
}

const defaultProfile: Profile = { credits: 0, role: "user" };
const KEY = "brm_profile";

const Ctx = createContext<ProfileCtx>({ ...defaultProfile, addCredits: () => {}, setRole: () => {} });

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw) as Profile;
    } catch {}
    return defaultProfile;
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(profile));
    } catch {}
  }, [profile]);

  const addCredits = (n: number) => setProfile((p) => ({ ...p, credits: p.credits + n }));
  const setRole = (r: Role) => setProfile((p) => ({ ...p, role: r }));

  return <Ctx.Provider value={{ ...profile, addCredits, setRole }}>{children}</Ctx.Provider>;
}

export const useProfile = () => useContext(Ctx);
