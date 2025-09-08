import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";

export default function Transactions() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "transactions"), where("uid", "==", user.uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [user]);
  if (!user) return <div className="container py-10">Connectez-vous.</div>;
  return (
    <div className="container py-10">
      <h1 className="font-display text-2xl font-bold">Transactions</h1>
      <div className="mt-4 rounded-xl border border-border/60 bg-card">
        <div className="grid grid-cols-4 px-4 py-2 text-xs text-foreground/60 border-b border-border/60">
          <div>Date</div><div>Type</div><div>Détails</div><div>Montant</div>
        </div>
        <div>
          {rows.length === 0 ? (
            <div className="p-4 text-sm text-foreground/70">Aucune transaction.</div>
          ) : rows.map((t) => (
            <div key={t.id} className="grid grid-cols-4 px-4 py-2 border-t border-border/50 text-sm">
              <div>{t.createdAt?.toDate ? new Date(t.createdAt.toDate()).toLocaleString() : ""}</div>
              <div>{t.type}</div>
              <div>{t.orderId || t.note || "—"}</div>
              <div>{t.credits ? `${t.credits} RC` : t.amountEUR ? `${t.amountEUR}€` : ""}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
