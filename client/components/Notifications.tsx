import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

export default function Notifications() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const navigate = useNavigate();
  const lastSeenKey = useMemo(
    () => (user ? `notif:last:${user.uid}` : "notif:last"),
    [user],
  );
  const prevCount = useRef<number>(0);
  const initialized = useRef<boolean>(false);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (d) => {
      const data = d.data() as any;
      const arr = Array.isArray(data?.notifications) ? data!.notifications : [];
      const list = arr.slice().reverse();
      setNotes(list);

      // On first snapshot, initialize lastSeen to newest notification to avoid replaying old items
      if (!initialized.current) {
        const newest = list[0]?.createdAt?.toMillis?.() ?? 0;
        try {
          localStorage.setItem(lastSeenKey, String(newest || Date.now()));
        } catch {}
        initialized.current = true;
        prevCount.current = list.length;
        return;
      }

      // Detect brand-new items to announce
      const lastSeen = Number(localStorage.getItem(lastSeenKey) || 0);
      const newestTs = list[0]?.createdAt?.toMillis?.() ?? 0;
      if (newestTs > 0 && newestTs > lastSeen && prevCount.current > 0) {
        const fresh = list.filter(
          (n: any) => (n.createdAt?.toMillis?.() ?? 0) > lastSeen,
        );
        fresh.forEach((n: any) => {
          const title =
            n.title || (n.type === "thread" ? "Nouveau chat" : "Notification");
          const description = n.text || undefined;
          toast({ title, description });
          beep();
          if ("Notification" in window) {
            try {
              if (Notification.permission === "default") {
                Notification.requestPermission().catch(() => {});
              }
              if (Notification.permission === "granted") {
                new Notification(title, { body: description });
              }
            } catch {}
          }
        });
        try {
          localStorage.setItem(lastSeenKey, String(Date.now()));
        } catch {}
      }
      prevCount.current = list.length;
    });
    return () => unsub();
  }, [user, lastSeenKey]);

  const unread = notes.filter((n) => !n.read).length;

  if (!user) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="relative inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted/60"
          aria-label="Notifications (F8)"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
              {unread}
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-h-[80vh] bg-background/60 backdrop-blur-md border-border/60"
        aria-label="Notifications alt+T"
      >
        <DialogTitle>Notifications</DialogTitle>
        <div
          className="mt-3 space-y-2 max-h-[60vh] overflow-y-auto pr-1"
          role="region"
          aria-label="Notifications (F8)"
        >
          {notes.length === 0 && (
            <div className="text-sm text-foreground/60">
              Aucune notification
            </div>
          )}
          {notes.map((n, i) => (
            <div
              key={i}
              className="rounded-md border border-border/60 p-3 bg-card/70 backdrop-blur flex items-start justify-between gap-2"
            >
              <div>
                <div className="text-sm font-medium">
                  {n.type === "role"
                    ? `Rôle : ${n.role}`
                    : n.title || "Notification"}
                </div>
                <div className="text-xs text-foreground/70 mt-1">{n.text}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {!n.read && (
                  <button
                    className="text-xs text-primary underline"
                    onClick={async () => {
                      try {
                        const ref = doc(db, "users", user.uid);
                        const cur = notes.slice().reverse();
                        const target = n;
                        await updateDoc(ref, {
                          notifications: cur
                            .map((x: any) =>
                              x === target ? { ...x, read: true } : x,
                            )
                            .slice()
                            .reverse(),
                        });
                      } catch (e) {}
                    }}
                  >
                    Marquer lu
                  </button>
                )}
                {n.type === "thread" && n.threadId && (
                  <button
                    className="text-xs bg-primary text-white px-2 py-1 rounded"
                    onClick={() => {
                      navigate(`/messages?thread=${n.threadId}`);
                    }}
                  >
                    Ouvrir
                  </button>
                )}
                {n.type === "giftcard" && n.code && (
                  <button
                    className="text-xs bg-secondary text-white px-2 py-1 rounded"
                    onClick={() => {
                      navigate(`/gift-card?code=${encodeURIComponent(n.code)}`);
                    }}
                  >
                    Utiliser
                  </button>
                )}
                {n.link && (
                  <button
                    className="text-xs bg-accent text-black px-2 py-1 rounded"
                    onClick={() => navigate(n.link)}
                  >
                    Ouvrir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function beep() {
  try {
    const ctx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    o.start();
    o.stop(ctx.currentTime + 0.25);
  } catch {}
}
