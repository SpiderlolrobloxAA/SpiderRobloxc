import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ModerationWarning from "@/components/ModerationWarning";

import { useAuth } from "@/context/AuthProvider";
import { useProfile } from "@/context/ProfileProvider";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  query,
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
  const { role } = useProfile();
  const [title, setTitle] = useState("");
  const [msg, setMsg] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tickets"), (snap) => {
      const rows = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((t: any) => t.uid === user?.uid);
      setTickets(rows as any);
      if (!active && rows.length) setActive(rows[0].id);
    });
    return () => unsub();
  }, [user, active]);

  const [moderationOpen, setModerationOpen] = useState(false);
  const [moderationReasons, setModerationReasons] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

  const runWithModeration = async (textToCheck: string, action: () => Promise<void>) => {
    try {
      const res = await fetch("/api/moderate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: textToCheck }) });
      const j = await res.json();
      if (j?.flagged) {
        setModerationReasons(Array.isArray(j.reasons) ? j.reasons : []);
        setPendingAction(() => action);
        setModerationOpen(true);
        return;
      }
      await action();
    } catch (e) {
      console.error("moderation failed", e);
      await action();
    }
  };

  const create = async () => {
    if (!user || !title) return;
    await runWithModeration(title, async () => {
      try {
        const ref = await addDoc(collection(db, "tickets"), {
          uid: user.uid,
          email: user.email,
          title,
          status: "open",
          createdAt: serverTimestamp(),
        });
        await addDoc(collection(db, "tickets", ref.id, "messages"), {
          senderId: user.uid,
          senderName: user.displayName || user.email || "Utilisateur",
          senderRole: role || "user",
          text: msg || "Ticket créé",
          createdAt: serverTimestamp(),
        });
        setTitle("");
        setMsg("");
        setActive(ref.id);
      } catch (e) {
        console.error("ticket:create failed", e);
      }
    });
  };

  useEffect(() => {
    if (!active) return;
    const unsub = onSnapshot(
      query(collection(db, "tickets", active, "messages")),
      (snap) => {
        setMsgs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      },
    );
    return () => unsub();
  }, [active]);

  const send = async () => {
    if (!user || !active || !text.trim()) return;
    try {
      await addDoc(collection(db, "tickets", active, "messages"), {
        senderId: user.uid,
        text: text.trim(),
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("ticket:send failed", e);
    }
    setText("");
  };

  return (
    <div className="container py-10">
      <h1 className="font-display text-2xl font-bold">Tickets</h1>
      <div className="mt-4 grid gap-4 md:grid-cols-[300px,1fr]">
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
          <div className="text-sm font-semibold">Nouveau ticket</div>
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
          <div className="mt-4">
            <div className="font-semibold text-sm">Vos tickets</div>
            <div className="mt-2 max-h-[50vh] overflow-auto divide-y divide-border/60">
              {tickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActive(t.id)}
                  className={`w-full text-left px-2 py-2 hover:bg-muted ${active === t.id ? "bg-muted" : ""}`}
                >
                  <div className="text-sm">{t.title}</div>
                  <div className="text-xs text-foreground/60 capitalize">
                    {t.status}
                  </div>
                </button>
              ))}
              {tickets.length === 0 && (
                <div className="text-sm text-foreground/60 px-2 py-2">
                  Aucun ticket
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          {active ? (
            <div className="flex h-[60vh] flex-col">
              <div className="flex-1 space-y-2 overflow-auto">
                {msgs.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[70%] rounded-md px-3 py-2 text-sm ${m.senderId === user?.uid ? "ml-auto bg-secondary/20" : "bg-muted"}`}
                  >
                    <div className="text-xs text-foreground/60 mb-1 flex items-center gap-2">
                      <div>{m.senderName || (m.senderId === "admin" ? "Admin" : "Utilisateur")}</div>
                      {m.senderRole && m.senderRole !== 'user' && (
                        <div className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{m.senderRole}</div>
                      )}
                    </div>
                    {m.text}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  className="flex-1 rounded-md bg-background px-3 py-2 border border-border/60"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Votre message…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                />
                <Button onClick={send}>Envoyer</Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-foreground/70">
              Sélectionnez un ticket pour ouvrir le chat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
