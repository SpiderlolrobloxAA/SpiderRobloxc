import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

const ROLES = ["user", "verified", "helper", "moderator", "founder"] as const;

type Role = (typeof ROLES)[number];

function AdminLogin({ onOk }: { onOk: () => void }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  return (
    <div className="container max-w-sm py-16">
      <h1 className="font-display text-2xl font-bold">Admin Login</h1>
      <div className="mt-4 space-y-3">
        <Input
          placeholder="Identifiant"
          value={u}
          onChange={(e) => setU(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Mot de passe"
          value={p}
          onChange={(e) => setP(e.target.value)}
        />
        <Button
          onClick={() => {
            if (u === "Admin" && p === "Antoine80@") {
              localStorage.setItem("brm_admin", "1");
              onOk();
            }
          }}
        >
          Se connecter
        </Button>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [ok, setOk] = useState<boolean>(
    () => localStorage.getItem("brm_admin") === "1",
  );
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingRole, setSavingRole] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoadingUsers(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const unsub = onSnapshot(doc(db, "users", userId), (d) => {
      if (d.exists()) {
        const data = { id: d.id, ...d.data() } as any;
        setUserInfo(data);
        if (selectedRole == null) setSelectedRole(((data.role ?? "user") as Role));
      }
    });
    return () => unsub();
  }, [userId]);

  useEffect(() => {
    const q = query(
      collection(db, "tickets"),
      where("status", "in", ["open", "pending"]),
    );
    const unsub = onSnapshot(q, (snap) =>
      setTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
    return () => unsub();
  }, []);

  const findUser = async () => {
    try {
      setSearching(true);
      const q = query(collection(db, "users"), where("email", "==", email));
      const res = await getDocs(q);
      if (!res.empty) {
        const d = res.docs[0];
        setUserId(d.id);
        setUserInfo(d.data());
        setSelectedRole((((d.data() as any).role ?? "user") as Role));
        toast({ title: "Utilisateur trouvé", description: (d.data() as any).email });
      } else {
        toast({ title: "Introuvable", description: email });
      }
    } finally {
      setSearching(false);
    }
  };

  const saveRole = async () => {
    if (!userId || !selectedRole) return;
    try {
      setSavingRole(true);
      await setDoc(
        doc(db, "users", userId),
        { role: selectedRole, updatedAt: serverTimestamp() },
        { merge: true },
      );
      toast({ title: "Rôle sauvegardé", description: `${selectedRole}` });
    } finally {
      setSavingRole(false);
    }
  };

  const adjustCredits = async (amount: number) => {
    if (!userId) return;
    try {
      setAdjusting(true);
      await setDoc(
        doc(db, "users", userId),
        { credits: increment(amount), updatedAt: serverTimestamp() },
        { merge: true },
      );
      toast({
        title: "Crédits modifiés",
        description: `${amount > 0 ? "+" : ""}${amount} RC`,
      });
    } finally {
      setAdjusting(false);
    }
  };

  const createTicket = async (title: string, body: string) => {
    const ref = doc(collection(db, "tickets"));
    await setDoc(ref, {
      title,
      body,
      status: "open",
      createdAt: serverTimestamp(),
    });
  };
  const replyTicket = async (id: string, message: string) => {
    await updateDoc(doc(db, "tickets", id), {
      lastReply: message,
      updatedAt: serverTimestamp(),
      status: "pending",
    });
  };
  const closeTicket = async (id: string, reason: string) => {
    await updateDoc(doc(db, "tickets", id), {
      status: "closed",
      closeReason: reason,
      closedAt: serverTimestamp(),
    });
  };

  if (!ok) return <AdminLogin onOk={() => setOk(true)} />;

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-extrabold">Admin Panel</h1>
      <p className="text-sm text-foreground/70">
        CTRL + F1 pour ouvrir rapidement cet écran.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card p-3 md:col-span-1">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Filtrer par email/nom"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          {loadingUsers ? (
            <div className="mt-3 text-sm text-foreground/70">Chargement…</div>
          ) : (
          <div className="mt-2 max-h-80 overflow-auto divide-y divide-border/50">
            {users
              .filter((u) => {
                const q = filter.toLowerCase();
                if (!q) return true;
                return (
                  (u.email ?? "").toLowerCase().includes(q) ||
                  (u.displayName ?? "").toLowerCase().includes(q) ||
                  (u.role ?? "").toLowerCase().includes(q)
                );
              })
              .map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setUserId(u.id);
                    setUserInfo(u);
                    setSelectedRole(((u.role ?? "user") as Role));
                  }}
                  className={`w-full text-left px-2 py-2 hover:bg-muted transition-colors ${
                    userId === u.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="text-sm">
                    {u.displayName || u.email || u.id}
                  </div>
                  <div className="text-xs text-foreground/60">
                    {(u.role ?? "user").toString()} · {(u.credits ?? 0).toLocaleString()} RC
                  </div>
                </button>
              ))}
          </div>
          )}
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4 md:col-span-2">
          <div className="flex flex-wrap items-end gap-2">
            <Input
              placeholder="Email utilisateur"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-64"
            />
            <Button onClick={findUser} disabled={searching}>{searching ? "Recherche…" : "Rechercher"}</Button>
            {userInfo && (
              <div className="text-sm text-foreground/80">
                {userInfo.displayName || userInfo.email}
              </div>
            )}
          </div>
          {userId && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-foreground/70">Rôle:</span>
              {ROLES.map((r) => (
                <Button
                  key={r}
                  size="sm"
                  variant={selectedRole === r ? "default" : "outline"}
                  onClick={() => setSelectedRole(r as Role)}
                >
                  {r}
                </Button>
              ))}
              <Button size="sm" className="ml-2" onClick={saveRole} disabled={savingRole}>
                {savingRole ? "Sauvegarde…" : "Sauvegarder"}
              </Button>
              <span className="ml-4 text-xs text-foreground/70">Crédits:</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => adjustCredits(100)}
                disabled={adjusting}
              >
                {adjusting ? "…" : "+100"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => adjustCredits(1000)}
                disabled={adjusting}
              >
                {adjusting ? "…" : "+1000"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => adjustCredits(-100)}
                disabled={adjusting}
              >
                {adjusting ? "…" : "-100"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="helper" className="mt-8">
        <TabsList>
          <TabsTrigger value="helper">Helper</TabsTrigger>
          <TabsTrigger value="moderator">Modérateur</TabsTrigger>
          <TabsTrigger value="founder">Fondateur</TabsTrigger>
        </TabsList>
        <TabsContent value="helper">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <h3 className="font-semibold">Tickets (ouverts)</h3>
              <div className="mt-3 space-y-2 max-h-72 overflow-auto">
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-md border border-border/60 p-3"
                  >
                    <div className="text-sm font-semibold">{t.title}</div>
                    <div className="text-xs text-foreground/70">{t.body}</div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          replyTicket(t.id, "Merci, nous regardons.")
                        }
                      >
                        Répondre
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => closeTicket(t.id, "Résolu")}
                      >
                        Fermer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <h3 className="font-semibold">Créer un ticket</h3>
              <CreateTicket onCreate={createTicket} />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="moderator">
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h3 className="font-semibold">Modération</h3>
            <p className="text-sm text-foreground/70">
              Bannir / avertir via mise à jour du document utilisateur.
            </p>
            {userId ? (
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    await setDoc(
                      doc(db, "users", userId),
                      { banned: true, bannedAt: serverTimestamp() },
                      { merge: true },
                    );
                    toast({ title: "Utilisateur banni" });
                  }}
                >
                  Bannir
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await setDoc(
                      doc(db, "users", userId),
                      { warnings: increment(1) },
                      { merge: true },
                    );
                    toast({ title: "Avertissement envoyé" });
                  }}
                >
                  Warn
                </Button>
              </div>
            ) : (
              <div className="text-sm text-foreground/70">
                Recherchez un utilisateur ci-dessus.
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="founder">
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h3 className="font-semibold">Fondateur</h3>
            <p className="text-sm text-foreground/70">
              Accès complet: rôles, crédits, suppression de posts/avis (à
              implémenter).
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CreateTicket({
  onCreate,
}: {
  onCreate: (title: string, body: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  return (
    <div className="space-y-2">
      <Input
        placeholder="Titre"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Input
        placeholder="Message"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <Button
        onClick={() => {
          if (title) {
            onCreate(title, body);
            setTitle("");
            setBody("");
          }
        }}
      >
        Créer
      </Button>
    </div>
  );
}
