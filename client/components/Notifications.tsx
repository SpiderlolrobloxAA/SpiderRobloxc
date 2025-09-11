import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

function useLocalPref<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue] as const;
}

export default function Notifications() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const navigate = useNavigate();
  const [soundOn, setSoundOn] = useLocalPref<boolean>("pref:soundOn", true);
  const [desktopOn, setDesktopOn] = useLocalPref<boolean>(
    "pref:desktopOn",
    false,
  );
  const lastSeenKey = useMemo(
    () => (user ? `notif:last:${user.uid}` : "notif:last"),
    [user],
  );
  const prevCount = useRef<number>(0);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (d) => {
      const data = d.data() as any;
      const arr = Array.isArray(data?.notifications) ? data!.notifications : [];
      const list = arr.slice().reverse();
      setNotes(list);

      // Detect brand-new items to announce
      const lastSeen = Number(localStorage.getItem(lastSeenKey) || 0);
      const newestTs = list[0]?.createdAt?.toMillis?.() ?? 0;
      // On first load, don't spam; only notify if there's something newer than saved lastSeen
      if (newestTs > 0 && newestTs > lastSeen && prevCount.current > 0) {
        const fresh = list.filter(
          (n: any) => (n.createdAt?.toMillis?.() ?? 0) > lastSeen,
        );
        fresh.forEach((n: any) => {
          const title = n.title || (n.type === "thread" ? "Nouveau chat" : "Notification");
          const description = n.text || undefined;
          toast({ title, description });
          if (soundOn) beep();
          if (desktopOn && "Notification" in window) {
            try {
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
  }, [user, lastSeenKey, soundOn, desktopOn]);

  const unread = notes.filter((n) => !n.read).length;

  if (!user) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="relative inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted/60" aria-label="Notifications (F8)">
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
      <DialogContent className="sm:max-h-[80vh]" aria-label="Notifications alt+T">
        <DialogTitle>Notifications</DialogTitle>

        <div className="mt-2 flex items-center gap-2">
          <Button
            variant={soundOn ? "default" : "outline"}
            size="sm"
            onClick={async () => {
              const next = !soundOn;
              setSoundOn(next);
              if (user) await setDoc(doc(db, "users", user.uid), { settings: { sound: next } } as any, { merge: true });
            }}
          >
            {soundOn ? "🔊 Son ON" : "🔇 Son OFF"}
          </Button>
          <Button
            variant={desktopOn ? "default" : "outline"}
            size="sm"
            onClick={async () => {
              if ("Notification" in window) {
                try {
                  if (Notification.permission !== "granted") {
                    const p = await Notification.requestPermission();
                    if (p !== "granted") return;
                  }
                } catch {}
              }
              const next = !desktopOn;
              setDesktopOn(next);
              if (user) await setDoc(doc(db, "users", user.uid), { settings: { desktop: next } } as any, { merge: true });
            }}
          >
            {desktopOn ? "🔔 Desktop ON" : "🔕 Desktop OFF"}
          </Button>
        </div>

        <div className="mt-3 space-y-2 max-h-[60vh] overflow-y-auto pr-1" role="region" aria-label="Notifications (F8)">
          {notes.length === 0 && (
            <div className="text-sm text-foreground/60">Aucune notification</div>
          )}
          {notes.map((n, i) => (
            <div
              key={i}
              className="rounded-md border border-border/60 p-3 bg-card flex items-start justify-between gap-2"
            >
              <div>
                <div className="text-sm font-medium">
                  {n.type === "role" ? `Rôle : ${n.role}` : n.title || "Notification"}
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
                            .map((x: any) => (x === target ? { ...x, read: true } : x))
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
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
