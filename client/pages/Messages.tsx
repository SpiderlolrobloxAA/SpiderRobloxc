import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { db } from "@/lib/firebase";
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Messages() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "threads"), where("participants", "array-contains", user.uid), orderBy("updatedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setThreads(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [user]);

  return (
    <div className="container py-10 grid gap-4 md:grid-cols-[260px,1fr]">
      <div className="rounded-xl border border-border/60 bg-card p-3">
        <div className="text-sm font-semibold">Messagerie</div>
        <div className="mt-2 divide-y divide-border/60 max-h-[60vh] overflow-auto">
          {threads.map((t) => (
            <button key={t.id} onClick={() => setActive(t.id)} className={`w-full text-left px-2 py-2 hover:bg-muted ${active===t.id? 'bg-muted':''}`}>
              <div className="text-sm">{(t.title)||"Conversation"}</div>
              <div className="text-xs text-foreground/60">{t.lastMessage?.text || "—"}</div>
            </button>
          ))}
          {threads.length===0 && <div className="px-2 py-4 text-sm text-foreground/60">Aucun message</div>}
        </div>
      </div>
      <div className="rounded-xl border border-border/60 bg-card p-3 min-h-[50vh]">
        {active ? <Thread id={active} /> : <div className="text-sm text-foreground/70">Sélectionnez une conversation</div>}
      </div>
    </div>
  );
}

function Thread({ id }: { id: string }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const q = query(collection(db, "threads", id, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => setMsgs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length]);

  useEffect(() => {
    if (!user) return;
    // mark as read
    updateDoc(doc(db, "threads", id), { [`lastReadAt.${user.uid}`]: serverTimestamp() }).catch(()=>{});
  }, [id, user]);

  const send = async () => {
    if (!user || !text.trim()) return;
    try {
      await addDoc(collection(db, "threads", id, "messages"), {
        senderId: user.uid,
        text: text.trim(),
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, "threads", id), {
        lastMessage: { text: text.trim(), senderId: user.uid },
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setText("");
    } catch (e) {
      console.error('thread:send failed', e);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-2 overflow-auto p-2">
        {msgs.map((m) => (
          <div key={m.id} className={`max-w-[70%] rounded-md px-3 py-2 text-sm ${m.senderId===user?.uid? 'ml-auto bg-secondary/20' : 'bg-muted'}`}>{m.text}</div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Votre message…" onKeyDown={(e)=>{ if(e.key==='Enter') send(); }} />
        <Button onClick={send}>Envoyer</Button>
      </div>
    </div>
  );
}
