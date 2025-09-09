import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { useProfile } from "@/context/ProfileProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

export default function AdminRoles() {
  const { user } = useAuth();
  const { role } = useProfile();
  const [founders, setFounders] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await getDocs(
        query(collection(db, "users"), where("role", "==", "founder")),
      );
      setFounders(res.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setLoading(false);
    })();
  }, []);

  const bootstrapAllowed = useMemo(
    () => !loading && founders.length === 0,
    [loading, founders.length],
  );
  const canAssign = role === "founder";

  const makeFounderSelf = async () => {
    if (!user || !bootstrapAllowed) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { role: "founder", updatedAt: serverTimestamp() },
        { merge: true },
      );
      // fetch again
      const res = await getDocs(
        query(collection(db, "users"), where("role", "==", "founder")),
      );
      setFounders(res.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } finally {
      setSaving(false);
    }
  };

  const setUserRoleByEmail = async (r: string) => {
    if (!canAssign || !email.trim()) return;
    setSaving(true);
    try {
      const res = await getDocs(
        query(collection(db, "users"), where("email", "==", email.trim())),
      );
      if (res.empty) return;
      const d = res.docs[0];
      await setDoc(
        doc(db, "users", d.id),
        { role: r, updatedAt: serverTimestamp() },
        { merge: true },
      );
      setEmail("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-10 max-w-2xl">
      <h1 className="font-display text-3xl font-extrabold">
        Gestion des rôles
      </h1>
      {loading ? (
        <div className="mt-4 text-sm text-foreground/70">Chargement…</div>
      ) : (
        <>
          {bootstrapAllowed && (
            <div className="mt-4 rounded-xl border border-border/60 bg-card p-4">
              <div className="font-semibold">Initialisation</div>
              <p className="mt-1 text-sm text-foreground/70">
                Aucun fondateur n'existe encore. Vous pouvez vous attribuer le
                rôle Fondateur une seule fois.
              </p>
              <Button
                className="mt-2"
                onClick={makeFounderSelf}
                disabled={saving || !user}
              >
                {saving ? "…" : "Me définir Fondateur"}
              </Button>
            </div>
          )}

          <div className="mt-6 rounded-xl border border-border/60 bg-card p-4">
            <div className="font-semibold">Attribuer un rôle</div>
            {!canAssign && !bootstrapAllowed ? (
              <p className="mt-1 text-sm text-foreground/70">
                Accès refusé. Seul un Fondateur peut attribuer des rôles.
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Email utilisateur"
                  className="w-64"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={() => setUserRoleByEmail("user")}
                  disabled={saving}
                >
                  User
                </Button>
                <Button
                  size="sm"
                  onClick={() => setUserRoleByEmail("verified")}
                  disabled={saving}
                >
                  Verified
                </Button>
                <Button
                  size="sm"
                  onClick={() => setUserRoleByEmail("helper")}
                  disabled={saving}
                >
                  Helper
                </Button>
                <Button
                  size="sm"
                  onClick={() => setUserRoleByEmail("moderator")}
                  disabled={saving}
                >
                  Modérateur
                </Button>
                <Button
                  size="sm"
                  onClick={() => setUserRoleByEmail("founder")}
                  disabled={saving}
                >
                  Fondateur
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
