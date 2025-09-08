import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/context/AuthProvider";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export default function Placeholder({ title }: { title: string }) {
  if (title === "Tickets support") {
    return <TicketsPage />;
  }
  return (
    <div className="container py-20 text-center">
      <h1 className="font-display text-3xl font-extrabold">{title}</h1>
      <p className="mt-3 text-foreground/70 max-w-xl mx-auto">
        Cette page sera bientôt disponible. Dites-moi quelles sections vous
        souhaitez et je l'implémenterai.
      </p>
      <div className="mt-6">
        <Button asChild className="bg-gradient-to-r from-primary to-secondary">
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </div>
  );
}

function TicketsPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [msg, setMsg] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tickets"), (snap) =>
      setTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
    return () => unsub();
  }, []);

  const create = async () => {
    if (!user || !title) return;
    try {
      await addDoc(collection(db, "tickets"), {
        uid: user.uid,
        email: user.email,
        title,
        body: msg,
        status: "open",
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setMsg("");
    } catch (e) {
      console.error('ticket:create failed', e);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="font-display text-2xl font-bold">Tickets</h1>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
          <input
            className="w-full rounded-md bg-background px-3 py-2 border border-border/60"
            placeholder="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full rounded-md bg-background px-3 py-2 border border-border/60"
            placeholder="Message"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />
          <Button onClick={create}>Créer</Button>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <h3 className="font-semibold">Vos tickets</h3>
          <div className="mt-3 space-y-2 max-h-72 overflow-auto">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="rounded-md border border-border/60 p-3"
              >
                <div className="text-sm font-semibold">{t.title}</div>
                <div className="text-xs text-foreground/70">{t.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
