import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthProvider";
import { useProfile } from "@/context/ProfileProvider";
import { db } from "@/lib/firebase";
import { collection, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc, where } from "firebase/firestore";

interface QuestDef {
  id: string;
  title: string;
  reward: number; // RC
  eligible: (ctx: { hasPurchase: boolean; hasTicket: boolean; hasProfile: boolean }) => boolean;
}

const QUESTS: QuestDef[] = [
  {
    id: "profile_complete",
    title: "Compléter votre profil",
    reward: 50,
    eligible: ({ hasProfile }) => hasProfile,
  },
  {
    id: "first_purchase",
    title: "Acheter des RotCoins",
    reward: 100,
    eligible: ({ hasPurchase }) => hasPurchase,
  },
  {
    id: "open_ticket",
    title: "Créer un ticket",
    reward: 30,
    eligible: ({ hasTicket }) => hasTicket,
  },
];

export default function Quests() {
  const { user } = useAuth();
  const { addCredits } = useProfile();
  const [status, setStatus] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [ctx, setCtx] = useState({ hasPurchase: false, hasTicket: false, hasProfile: false });

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "meta", "quests");
    const unsub = onSnapshot(ref, (snap) => {
      setStatus((snap.data() as any) ?? {});
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const hasPurchase = !(await getDocs(query(collection(db, "transactions"), where("uid", "==", user.uid), where("type", "==", "credits_purchase")))).empty;
      const hasTicket = !(await getDocs(query(collection(db, "tickets"), where("uid", "==", user.uid)))).empty;
      // Profile complete if displayName exists on auth or users doc
      let hasProfile = Boolean(user.displayName);
      try {
        const userDoc = doc(db, "users", user.uid);
        // We already listen above but we just infer from auth to keep it simple
        hasProfile = hasProfile || Boolean(user.displayName);
      } catch {}
      setCtx({ hasPurchase, hasTicket, hasProfile });
    })();
  }, [user]);

  const items = useMemo(() => QUESTS.map((q) => {
    const st = status[q.id] as any | undefined;
    const claimed = Boolean(st?.claimedAt);
    const eligible = q.eligible(ctx);
    return { ...q, claimed, eligible };
  }), [status, ctx]);

  const claim = async (q: QuestDef) => {
    if (!user) return;
    const eligible = q.eligible(ctx);
    if (!eligible) return;
    try {
      await addCredits(q.reward);
      await setDoc(doc(db, "users", user.uid, "meta", "quests"), {
        [q.id]: { claimedAt: serverTimestamp(), reward: q.reward },
      }, { merge: true });
    } catch (e) {
      console.error('quests:claim failed', e);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="font-display text-2xl font-bold">Quêtes</h1>
      <p className="text-sm text-foreground/70">Complétez des quêtes et gagnez des RotCoins.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((q) => (
          <div key={q.id} className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{q.title}</div>
                <div className="text-xs text-foreground/70">Récompense: {q.reward} RC</div>
              </div>
              {q.claimed ? (
                <span className="text-xs text-emerald-400 font-semibold">Réclamée ✔</span>
              ) : q.eligible ? (
                <Button size="sm" onClick={() => claim(q)}>Réclamer</Button>
              ) : (
                <span className="text-xs text-foreground/60">Non éligible</span>
              )}
            </div>
            <QuestLink id={q.id} />
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestLink({ id }: { id: string }) {
  let to = "/";
  if (id === "profile_complete") to = "/profile";
  else if (id === "first_purchase") to = "/shop";
  else if (id === "open_ticket") to = "/tickets";
  return (
    <a href={to} className="text-xs text-primary hover:underline">Aller à la page</a>
  );
}
