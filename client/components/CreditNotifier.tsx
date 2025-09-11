import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthProvider";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

type Item = { id: string; text: string };

export default function CreditNotifier() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const key = `tx:last:${user.uid}`;
    const last = Number(localStorage.getItem(key) || 0);

    const q = query(
      collection(db, "transactions"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      // Determine most recent createdAt in the snapshot
      const latest = snap.docs[0]?.data()?.createdAt?.toMillis?.() ?? Date.now();

      // If we have no recorded last timestamp, initialize it to the latest
      // and do not show historic notifications on first load.
      if (!last) {
        try {
          localStorage.setItem(key, String(latest));
        } catch {}
        return;
      }

      const fresh = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((t) => {
          const ts = t.createdAt?.toMillis?.() ?? 0;
          return ts > last;
        })
        .reverse();
      if (fresh.length === 0) return;

      const map: Record<string, string> = {
        admin_grant: "admin",
        saleReleased: "vente validée",
        quest: "quête",
        giftcard: "carte cadeau",
        credits_purchase: "achat boutique",
      };
      const newItems: Item[] = [];
      let maxTs = last;
      for (const t of fresh) {
        const c = Number(t.credits || 0);
        if (c <= 0) continue;
        const source = map[t.type] || t.type;
        newItems.push({ id: t.id, text: `+${c} crédits reçus de ${source}` });
        const ts = t.createdAt?.toMillis?.() ?? 0;
        if (ts > maxTs) maxTs = ts;
        if (navigator?.vibrate)
          try {
            navigator.vibrate(40);
          } catch {}
      }
      if (newItems.length) {
        setItems((cur) => [...cur, ...newItems]);
        try {
          // persist latest processed timestamp to avoid duplicates
          localStorage.setItem(key, String(Math.max(maxTs, Date.now())));
        } catch {}
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (items.length === 0) return;
    const id = window.setTimeout(() => {
      setItems((list) => list.slice(1));
    }, 2500);
    timerRef.current = id;
    return () => window.clearTimeout(id);
  }, [items.length]);

  if (!user) return null;

  return (
    <div className="pointer-events-none fixed left-4 top-16 z-[120] space-y-2">
      {items.map((it) => (
        <div
          key={it.id}
          className="rounded-md border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-300 shadow-[0_10px_30px_rgba(0,0,0,0.25)] animate-in fade-in slide-in-from-left-4 duration-200"
        >
          {it.text}
        </div>
      ))}
    </div>
  );
}
