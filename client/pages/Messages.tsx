import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { db, getStorageClient } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "react-router-dom";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { RoleBadge } from "@/components/RoleBadge";
import { DEFAULT_AVATAR_IMG } from "@/lib/images";
import { cn } from "@/lib/utils";

export default function Messages() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "threads"),
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => setThreads(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.error("messages:onSnapshot error", err);
        const msg = String(err?.message || err);
        const match = msg.match(
          /https?:\/\/console\.firebase\.google\.com\/[\S]+/,
        );
        const indexUrl = match ? match[0] : undefined;
        try {
          // user-friendly toast with index URL if available
          toast({
            title: "Firestore: index requis",
            description: indexUrl
              ? `Cette requête nécessite un index. Ouvrez: ${indexUrl}`
              : "Cette requête Firestore nécessite un index composite. Créez-le dans la console Firebase.",
            variant: "destructive",
          });
        } catch {}
      },
    );
    return () => unsub();
  }, [user]);

  // sync active thread from URL ?thread=
  useEffect(() => {
    const param = searchParams.get("thread");
    if (param) setActive(param);
  }, [searchParams]);

  return (
    <div className="container py-10 grid gap-4 md:grid-cols-[260px,1fr]">
      <div className="rounded-xl border border-border/60 bg-card p-3">
        <div className="text-sm font-semibold">Messagerie</div>
        <div className="mt-2 divide-y divide-border/60 max-h-[60vh] overflow-auto">
          {threads.map((t) => {
            const lastFrom = t.lastMessage?.senderId;
            const updatedAt = t.updatedAt?.toMillis?.() ?? 0;
            const lastReadAt =
              t.lastReadAt?.[user?.uid || ""]?.toMillis?.() ?? 0;
            const unread = !!(
              lastFrom &&
              lastFrom !== user?.uid &&
              updatedAt > lastReadAt
            );
            return (
              <button
                key={t.id}
                onClick={() => setSearchParams({ thread: t.id })}
                className={cn(
                  "w-full text-left px-2 py-2 hover:bg-muted",
                  active === t.id && "bg-muted",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={cn(
                      "text-sm truncate",
                      unread && "font-semibold",
                    )}
                  >
                    {t.title || "Conversation"}
                  </div>
                  {unread && (
                    <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <div className="text-xs text-foreground/60 truncate">
                  {t.lastMessage?.text || ""}
                </div>
              </button>
            );
          })}
          {threads.length === 0 && (
            <div className="px-2 py-4 text-sm text-foreground/60">
              Aucun message
            </div>
          )}
        </div>
      </div>
      <div className="rounded-xl border border-border/60 bg-card p-3 h-[70vh] overflow-hidden">
        {active ? (
          <Thread id={active} />
        ) : (
          <div className="text-sm text-foreground/70">
            Sélectionnez une conversation
          </div>
        )}
      </div>
    </div>
  );
}

function Thread({ id }: { id: string }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [threadMeta, setThreadMeta] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);

  // WebRTC call state
  const [inCall, setInCall] = useState(false);
  const [incoming, setIncoming] = useState<any>(null);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callRoleRef = useRef<"caller" | "callee" | null>(null);
  const [callStatus, setCallStatus] = useState<string>("");
  const [callSeconds, setCallSeconds] = useState<number>(0);
  const lastOfferSdpRef = useRef<string | null>(null);
  const restartingRef = useRef<boolean>(false);

  useEffect(() => {
    const q = query(
      collection(db, "threads", id, "messages"),
      orderBy("createdAt", "asc"),
    );
    const unsub = onSnapshot(q, (snap) =>
      setMsgs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
    return () => unsub();
  }, [id]);

  // subscribe to thread meta to know if it's a system thread
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "threads", id), (d) => {
      if (d.exists()) setThreadMeta(d.data());
      else setThreadMeta(null);
    });
    return () => unsub();
  }, [id]);

  // subscribe to the other participant for name/role/status
  useEffect(() => {
    const otherId = threadMeta?.participants?.find(
      (p: string) => p !== user?.uid,
    );
    if (!otherId) return;
    const unsub = onSnapshot(doc(db, "users", otherId), (d) => {
      setOtherUser(d.data());
    });
    return () => unsub();
  }, [threadMeta?.participants, user?.uid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  const otherId = useMemo(
    () => threadMeta?.participants?.find((p: string) => p !== user?.uid),
    [threadMeta?.participants, user?.uid],
  );

  useEffect(() => {
    if (!user) return;
    // mark as read
    updateDoc(doc(db, "threads", id), {
      [`lastReadAt.${user.uid}`]: serverTimestamp(),
    }).catch(() => {});
  }, [id, user]);

  // Listen for incoming calls offers
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "threads", id, "calls"), (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      const offer = rows.find(
        (r) => r.status === "offer" && r.createdBy !== user?.uid && !r.endedAt,
      );
      setIncoming(offer || null);
    });
    return () => unsub();
  }, [id, user?.uid]);

  // Call duration timer
  useEffect(() => {
    if (!inCall) {
      setCallSeconds(0);
      return;
    }
    const int = window.setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(int);
  }, [inCall]);

  const { toast } = useToast();
  const roleLabel = (role?: string) => {
    if (!role) return "";
    if (role === "verified") return "Certifié";
    if (role === "helper") return "Helper";
    if (role === "moderator") return "Modérateur";
    if (role === "founder") return "Fondateur";
    return "User";
  };

  const send = async () => {
    if (!user || !text.trim()) return;
    if (threadMeta?.system) {
      toast({
        title: "Impossible de répondre",
        description:
          "Ce message provient du système et n'accepte pas de réponses.",
        variant: "default",
      });
      setText("");
      return;
    }
    try {
      await addDoc(collection(db, "threads", id, "messages"), {
        senderId: user.uid,
        text: text.trim(),
        createdAt: serverTimestamp(),
      });
      await setDoc(
        doc(db, "threads", id),
        {
          lastMessage: { text: text.trim(), senderId: user.uid },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setText("");
    } catch (e) {
      console.error("thread:send failed", e);
    }
  };

  const dayLabel = (ms: number) => {
    if (!ms) return "";
    const d = new Date(ms);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    if (isSameDay(d, today)) return "Aujourd’hui";
    if (isSameDay(d, yesterday)) return "Hier";
    return d.toLocaleDateString();
  };

  const timeHM = (ms?: number) =>
    ms
      ? new Date(ms).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  function createPeerConnection(callDocRef: any, role: "caller" | "callee") {
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      ],
    });
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
    };
    pc.onicecandidate = async (event) => {
      if (!event.candidate) return;
      const target = role === "caller" ? "offerCandidates" : "answerCandidates";
      await addDoc(collection(callDocRef, target), event.candidate.toJSON());
    };
    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      setCallStatus(st);
      if (
        (st === "disconnected" || st === "failed") &&
        !restartingRef.current
      ) {
        restartingRef.current = true;
        tryIceRestart(callDocRef, role).finally(() => {
          setTimeout(() => {
            restartingRef.current = false;
          }, 1500);
        });
      }
      if (st === "closed") setInCall(false);
    };
    pcRef.current = pc;
    return pc;
  }

  async function getLocalStream(video: boolean) {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video,
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  }

  async function startCall(video: boolean) {
    if (!user) return;
    try {
      const callDocRef = await addDoc(collection(db, "threads", id, "calls"), {
        createdBy: user.uid,
        status: "offer",
        createdAt: serverTimestamp(),
      });
      setCurrentCallId(callDocRef.id);
      callRoleRef.current = "caller";
      const pc = createPeerConnection(callDocRef, "caller");
      const stream = await getLocalStream(video);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      lastOfferSdpRef.current = offer.sdp || null;
      await setDoc(callDocRef, { offer }, { merge: true });
      attachCallSubscriptions(callDocRef, "caller", pc);
    } catch (e) {
      console.error("startCall failed", e);
    }
  }

  async function acceptCall(call: any, video: boolean) {
    if (!user) return;
    try {
      const callDocRef = doc(db, "threads", id, "calls", call.id);
      setCurrentCallId(call.id);
      callRoleRef.current = "callee";
      const pc = createPeerConnection(callDocRef, "callee");
      const stream = await getLocalStream(video);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      await pc.setRemoteDescription(new RTCSessionDescription(call.offer));
      lastOfferSdpRef.current = call.offer?.sdp || null;
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await setDoc(callDocRef, { answer, status: "ongoing" }, { merge: true });
      attachCallSubscriptions(callDocRef, "callee", pc);
      setIncoming(null);
      setInCall(true);
    } catch (e) {
      console.error("acceptCall failed", e);
    }
  }

  async function hangUp() {
    try {
      pcRef.current?.getSenders().forEach((s) => {
        try {
          s.track?.stop();
        } catch {}
      });
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      (pcRef.current as any)?._cleanupSubs?.();
      pcRef.current?.close();
      pcRef.current = null;
      setInCall(false);
      setCallStatus("");
      if (currentCallId) {
        try {
          await setDoc(
            doc(db, "threads", id, "calls", currentCallId),
            { status: "ended", endedAt: serverTimestamp() },
            { merge: true },
          );
        } catch {}
      }
      setCurrentCallId(null);
    } catch (e) {
      console.error("hangUp failed", e);
    }
  }

  function toggleMic() {
    const on = !micOn;
    setMicOn(on);
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = on));
  }
  function toggleCam() {
    const on = !camOn;
    setCamOn(on);
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = on));
  }
  async function startScreenShare() {
    try {
      const display = await (navigator.mediaDevices as any).getDisplayMedia({
        video: true,
      });
      const track = display.getVideoTracks()[0];
      const sender = pcRef.current
        ?.getSenders()
        .find((s) => s.track?.kind === "video");
      if (sender && track) sender.replaceTrack(track);
      track.onended = () => {
        const original = localStreamRef.current?.getVideoTracks()[0];
        if (sender && original) sender.replaceTrack(original);
      };
    } catch (e) {
      console.error("screen share failed", e);
    }
  }

  function attachCallSubscriptions(
    callDocRef: any,
    role: "caller" | "callee",
    pc: RTCPeerConnection,
  ) {
    // monitor call doc for renegotiation and end
    const unsubDoc = onSnapshot(callDocRef, async (d) => {
      const data = d.data() as any;
      if (!data) return;
      if (data.status === "ended") {
        await hangUp();
        return;
      }
      if (role === "caller") {
        if (data.answer && pc.signalingState !== "stable") {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          setInCall(true);
        }
      } else {
        // callee reacts to new offers for ICE restarts
        if (
          data.offer &&
          data.offer.sdp &&
          data.offer.sdp !== lastOfferSdpRef.current
        ) {
          lastOfferSdpRef.current = data.offer.sdp;
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await setDoc(
            callDocRef,
            { answer, status: "ongoing" },
            { merge: true },
          );
        }
      }
    });

    // ICE candidates subscription
    const path = role === "caller" ? "answerCandidates" : "offerCandidates";
    const unsubCands = onSnapshot(collection(callDocRef, path), (snap) => {
      snap.docChanges().forEach((c) => {
        if (c.type === "added") {
          try {
            pc.addIceCandidate(new RTCIceCandidate(c.doc.data() as any));
          } catch {}
        }
      });
    });

    (pc as any)._cleanupSubs = () => {
      try {
        unsubDoc();
      } catch {}
      try {
        unsubCands();
      } catch {}
    };
  }

  async function tryIceRestart(callDocRef: any, role: "caller" | "callee") {
    const pc = pcRef.current;
    if (!pc) return;
    try {
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      lastOfferSdpRef.current = offer.sdp || null;
      await setDoc(callDocRef, { offer }, { merge: true });
    } catch (e) {
      console.error("ice restart failed", e);
    }
  }

  const sendImage = async (file: File) => {
    if (!user || !file || threadMeta?.system) return;
    try {
      setUploading(true);
      let url: string | null = null;
      // Try proxy upload first (avoids Firebase CORS in prod)
      try {
        const { fileToDataUrl } = await import("@/lib/images");
        const data = await fileToDataUrl(file, {
          maxWidth: 1280,
          quality: 0.85,
        });
        const up = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl: data, filename: file.name }),
        });
        if (up.ok) {
          const j = await up.json();
          url = j?.url || null;
        }
      } catch (e) {
        console.warn("messages: proxy upload failed", e);
      }
      // No Firebase fallback; require proxy success
      if (!url) throw new Error("upload_failed");

      await addDoc(collection(db, "threads", id, "messages"), {
        senderId: user.uid,
        imageUrl: url,
        createdAt: serverTimestamp(),
      });
      await setDoc(
        doc(db, "threads", id),
        {
          lastMessage: { text: "📷 Image", senderId: user.uid },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (e) {
      console.error("thread:image failed", e);
      toast({ title: "Upload image indisponible", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mx-2 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={otherUser?.avatarUrl || DEFAULT_AVATAR_IMG}
            alt="avatar"
            className="h-7 w-7 rounded-full object-cover"
          />
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">
              {threadMeta?.title || "Conversation"}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-foreground/60">
              <span className="truncate max-w-[200px]">
                {otherUser?.username || otherUser?.email || "Utilisateur"}
              </span>
              <RoleBadge
                role={otherUser?.role}
                compact
                className="h-3.5 w-3.5"
              />
            </div>
          </div>
        </div>
        {otherUser && <UserStatus otherUser={otherUser} />}
      </div>
      {threadMeta?.productId || threadMeta?.order ? (
        <div className="mx-2 mb-2 rounded-md border border-primary/40 bg-primary/10 p-2 text-xs">
          <div className="font-semibold">
            Commande: {threadMeta?.order?.productTitle || threadMeta?.title}
          </div>
          <div className="opacity-80">
            Prix: {threadMeta?.order?.price ?? "-"} RC • Acheteur:{" "}
            {threadMeta?.order?.buyerId
              ? threadMeta.order.buyerId === user?.uid
                ? "vous"
                : threadMeta.order.buyerId
              : ""}
          </div>
        </div>
      ) : null}
      {inCall && (
        <div className="mx-2 mb-2 grid grid-cols-2 gap-2 rounded-md border border-border/60 bg-card/60 p-2">
          <video
            ref={localVideoRef}
            className="w-full rounded-md bg-black/60"
            autoPlay
            playsInline
            muted
          />
          <video
            ref={remoteVideoRef}
            className="w-full rounded-md bg-black/60"
            autoPlay
            playsInline
          />
          <div className="col-span-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-foreground/70">
              {callStatus || "connecté"} •{" "}
              {Math.trunc(callSeconds / 60)
                .toString()
                .padStart(2, "0")}
              :{(callSeconds % 60).toString().padStart(2, "0")}
            </span>
            <Button size="sm" variant="outline" onClick={toggleMic}>
              {micOn ? "Mute" : "Unmute"}
            </Button>
            <Button size="sm" variant="outline" onClick={toggleCam}>
              {camOn ? "Cam off" : "Cam on"}
            </Button>
            <Button size="sm" variant="outline" onClick={startScreenShare}>
              Partager écran
            </Button>
            <Button size="sm" variant="destructive" onClick={hangUp}>
              Raccrocher
            </Button>
          </div>
        </div>
      )}
      {!!incoming && !inCall && (
        <div className="mx-2 mb-2 flex items-center justify-between rounded-md border border-border/60 bg-card/60 p-2 text-sm">
          <div>Appel entrant…</div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => acceptCall(incoming, false)}>
              Audio
            </Button>
            <Button size="sm" onClick={() => acceptCall(incoming, true)}>
              Vidéo
            </Button>
          </div>
        </div>
      )}
      <div className="flex-1 space-y-3 overflow-auto p-2">
        {(() => {
          const out: JSX.Element[] = [];
          let lastDay = "";
          msgs.forEach((m) => {
            const ts = m.createdAt?.toMillis?.() ?? 0;
            const curDay = dayLabel(ts);
            if (curDay && curDay !== lastDay) {
              out.push(
                <div
                  key={`sep-${ts}`}
                  className="flex items-center justify-center gap-2 text-[11px] text-foreground/60"
                >
                  <div className="h-px flex-1 bg-border/60" />
                  <span>{curDay}</span>
                  <div className="h-px flex-1 bg-border/60" />
                </div>,
              );
              lastDay = curDay;
            }

            if (m.senderId === "system") {
              out.push(
                <div
                  key={m.id}
                  className="mx-auto max-w-[80%] rounded-md border border-border/50 bg-muted/60 px-3 py-1.5 text-center text-xs text-foreground/70"
                >
                  {m.text}
                </div>,
              );
              return;
            }

            const mine = m.senderId === user?.uid;
            const name = mine
              ? "Vous"
              : otherUser?.username || otherUser?.email || "Utilisateur";
            const role = mine ? "" : roleLabel(otherUser?.role);
            const avatarUrl = mine
              ? user?.photoURL || DEFAULT_AVATAR_IMG
              : otherUser?.avatarUrl || DEFAULT_AVATAR_IMG;

            out.push(
              <div
                key={m.id}
                className={cn(
                  "flex items-end gap-2 animate-in fade-in slide-in-from-bottom-1",
                  mine ? "justify-end" : "justify-start",
                )}
              >
                {!mine && (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                )}
                <div className={cn("max-w-[75%]", mine && "items-end")}>
                  <div
                    className={cn(
                      "mb-1 flex items-center gap-2 text-[10px] text-foreground/60",
                      mine ? "justify-end" : "",
                    )}
                  >
                    <span className="truncate max-w-[200px]">{name}</span>
                    {role && (
                      <RoleBadge
                        role={otherUser?.role}
                        compact
                        className="h-3.5 w-3.5"
                      />
                    )}
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words border",
                      mine
                        ? "bg-secondary/20 border-secondary/30"
                        : "bg-muted border-border/60",
                    )}
                  >
                    {m.imageUrl ? (
                      <a href={m.imageUrl} target="_blank" rel="noreferrer">
                        <img
                          src={m.imageUrl}
                          alt="image"
                          className="max-h-60 rounded-md"
                        />
                      </a>
                    ) : (
                      m.text
                    )}
                  </div>
                  <div
                    className={cn(
                      "mt-1 text-[10px] text-foreground/50",
                      mine ? "text-right" : "",
                    )}
                  >
                    {timeHM(ts)}
                  </div>
                </div>
                {mine && (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                )}
              </div>,
            );
          });
          return out;
        })()}
        <div ref={bottomRef} />
      </div>
      {threadMeta?.system ? (
        <div className="mt-2 text-sm text-foreground/60">
          Message système — les réponses sont désactivées.
        </div>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => startCall(false)}>
              Appel
            </Button>
            <Button size="sm" variant="outline" onClick={() => startCall(true)}>
              Vidéo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setText((t) => (t ? t + " Merci !" : "Merci !"))}
            >
              Merci
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setText((t) => (t ? t + " Produit envoyé." : "Produit envoyé."))
              }
            >
              Produit envoyé
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setText((t) => (t ? t + " Ok reçu." : "Ok reçu."))}
            >
              Ok reçu
            </Button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Votre message…"
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
            />
            <label className={cn("text-xs", uploading && "opacity-60")}>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void sendImage(f);
                  e.currentTarget.value = "";
                }}
                disabled={uploading}
              />
              <Button variant="outline" disabled={uploading}>
                Image
              </Button>
            </label>
            <Button onClick={send} disabled={!text.trim()}>
              Envoyer
            </Button>
          </div>
          {(() => {
            const myLast = [...msgs]
              .reverse()
              .find((m) => m.senderId === user?.uid);
            const otherSeen =
              threadMeta?.lastReadAt?.[otherId || ""]?.toMillis?.() ?? 0;
            const myLastTs = myLast?.createdAt?.toMillis?.() ?? 0;
            if (myLast && otherSeen && otherSeen >= myLastTs) {
              return (
                <div className="mt-1 text-[11px] text-foreground/60 text-right">
                  Vu à {timeHM(otherSeen)}
                </div>
              );
            }
            return null;
          })()}
        </>
      )}
    </div>
  );
}

function UserStatus({ otherUser }: { otherUser: any }) {
  const ts = otherUser?.lastSeen?.toMillis?.() ?? 0;
  let label = "hors ligne";
  let color = "bg-gray-400";
  if (ts) {
    const diff = Date.now() - ts;
    if (diff < 2 * 60 * 1000) {
      label = "en ligne";
      color = "bg-emerald-500";
    } else if (diff < 10 * 60 * 1000) {
      label = "inactif";
      color = "bg-amber-500";
    }
  }
  return (
    <div className="text-xs text-foreground/70 inline-flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="capitalize">{label}</span>
      <span className="opacity-60">•</span>
      <span className="truncate max-w-[160px]">
        {otherUser?.username || otherUser?.email || "Utilisateur"}
      </span>
    </div>
  );
}
