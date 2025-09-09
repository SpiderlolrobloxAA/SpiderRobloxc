import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard, type Product } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthProvider";
import { useProfile } from "@/context/ProfileProvider";
import { db, getStorageClient } from "@/lib/firebase";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  doc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { canPublish, normalizePrice } from "@/lib/marketplace";
import { useToast } from "@/hooks/use-toast";
import ModerationWarning from "@/components/ModerationWarning";

export default function Marketplace() {
  const [queryStr, setQueryStr] = useState("");
  const [sort, setSort] = useState("recent");
  const [items, setItems] = useState<Product[]>([]);
  const { user } = useAuth();
  const { role, credits, addCredits } = useProfile();
  const { toast } = useToast();
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    const metaRef = doc(db, "meta", "site");
    const unsubMeta = onSnapshot(
      metaRef,
      (d) => {
        const data = d.data() as any | undefined;
        setMaintenance(Boolean(data?.maintenance));
      },
      () => {},
    );

    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((r) => r.status === "active");
      setItems(rows as any);
    });

    return () => {
      unsub();
      unsubMeta();
    };
  }, []);

  const products = items
    .filter((p) => p.title.toLowerCase().includes(queryStr.toLowerCase()))
    .sort((a, b) => (sort === "price" ? (a.price as number) - (b.price as number) : 0));

  return (
    <div className="container py-10">
      <div className="sticky top-16 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-4 px-4 py-3 rounded-xl border border-border/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-bold">Marketplace</h1>
          <div className="flex flex-1 items-center gap-3 sm:justify-end">
            <Input
              value={queryStr}
              onChange={(e) => setQueryStr(e.target.value)}
              placeholder="Search products, sellers…"
              className="w-full max-w-xl h-11 rounded-xl"
            />
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Récents</SelectItem>
                <SelectItem value="price">Prix</SelectItem>
              </SelectContent>
            </Select>
            {user && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary">+ Ajouter</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md p-4">
                  <DialogTitle className="text-sm">Nouveau produit</DialogTitle>
                  <AddProduct
                    onCreated={async () => {}}
                    userId={user.uid}
                    sellerRole={role as any}
                    sellerName={user.displayName || user.email || "Utilisateur"}
                    onCharge={addCredits}
                    userCredits={credits}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      {maintenance ? (
        <div className="mt-6 rounded-xl border border-border/60 bg-card p-6 text-center">
          <div className="text-xl font-semibold">Maintenance</div>
          <div className="mt-2 text-sm text-foreground/70">Le marketplace est actuellement en maintenance. Merci de revenir plus tard.</div>
        </div>
      ) : products.length === 0 ? (
        <div className="mt-6 rounded-xl border border-border/60 bg-card p-6 text-center">
          <div className="text-xl font-semibold">Aucun produit</div>
          <div className="mt-2 text-sm text-foreground/70">Aucun produit n'est disponible à la vente pour le moment.</div>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p: any) => (
            <ProductCard
              key={p.id}
              product={{
                id: p.id,
                title: p.title,
                price: p.price ?? 0,
                image: p.imageUrl || p.image,
                free: (p.price ?? 0) === 0,
                seller: { id: p.sellerId, name: p.sellerName, role: p.sellerRole },
                rating: p.rating || 4.5,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AddProduct({
  onCreated,
  userId,
  sellerRole,
  sellerName,
  onCharge,
  userCredits,
}: {
  onCreated: () => void;
  userId: string;
  sellerRole: string;
  sellerName: string;
  onCharge: (n: number) => Promise<void>;
  userCredits: number;
}) {
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [free, setFree] = useState(false);
  const [price, setPrice] = useState<number>(3);
  const [saving, setSaving] = useState(false);
  const [moderationOpen, setModerationOpen] = useState(false);
  const [moderationReasons, setModerationReasons] = useState<string[]>([]);
  const [moderationAccepted, setModerationAccepted] = useState(false);
  const { toast } = useToast();
  const cost = sellerRole === "verified" ? 2 : 5;
  const validPrice = normalizePrice(price, free);
  const imgOk = Boolean(imageUrl) || Boolean(file);
  const can = canPublish({
    title,
    hasImage: imgOk,
    price,
    free,
    balance: userCredits,
    cost,
  });

  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    try {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.kind === "file" && it.type.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) {
            setFile(f);
            return;
          }
        }
        if (it.kind === "string") {
          it.getAsString((s) => {
            const trimmed = s.trim();
            if (trimmed.startsWith("data:image/") || /(https?:\/\/.+\.(png|jpe?g|webp|gif))/i.test(trimmed)) {
              setImageUrl(trimmed);
            }
          });
        }
      }
    } catch (err) {
      console.warn("paste handling failed", err);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      // Try to upload immediately to storage and set imageUrl to the returned link
      const storage = await getStorageClient();
      if (storage) {
        const tmpRef = ref(storage, `products/${userId}/${Date.now()}_${f.name}`);
        await uploadBytes(tmpRef, f);
        const dl = await getDownloadURL(tmpRef);
        setImageUrl(dl);
        setFile(null);
        return;
      }
    } catch (err) {
      console.warn("upload immediate failed", err);
    }

    // Fallback: convert to data URL and set it as imageUrl
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(f);
      });
      setImageUrl(data);
      setFile(null);
    } catch (err) {
      console.warn("file to dataURL failed", err);
      setFile(f);
    }
  };

  // actual creation logic extracted so it can be called after moderation acceptance
  const doCreate = async () => {
    setSaving(true);
    try {
      let finalUrl = imageUrl;
      if (!finalUrl && file) {
        const storage = await getStorageClient();
        if (storage) {
          const tmpRef = ref(storage, `products/${userId}/${Date.now()}_${file.name}`);
          await uploadBytes(tmpRef, file);
          finalUrl = await getDownloadURL(tmpRef);
        } else {
          // Fallback: convert file to data URL and store in Firestore so it can be displayed
          try {
            finalUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result || ""));
              reader.onerror = (err) => reject(err);
              reader.readAsDataURL(file);
            });
          } catch (err) {
            toast({
              title: "Upload image indisponible",
              description: "Veuillez saisir une URL d'image ou réessayer plus tard.",
              variant: "destructive",
            });
            setSaving(false);
            return;
          }
        }
      }

      const isFlagged = moderationReasons.length > 0 && !moderationAccepted;
      const status = isFlagged ? "pending" : "active";

      const refDoc = await addDoc(collection(db, "products"), {
        title: title.trim(),
        imageUrl: finalUrl,
        price: validPrice,
        sellerId: userId,
        sellerName,
        sellerRole,
        status,
        moderation: {
          flagged: moderationReasons.length > 0,
          reasons: moderationReasons,
          accepted: moderationAccepted,
        },
        createdAt: serverTimestamp(),
      });

      // Mirror to namespaced per-user collection for instant access
      await setDoc(doc(db, "DataProject", "data1", "users", userId, "products", refDoc.id), {
        title: title.trim(),
        imageUrl: finalUrl,
        price: validPrice,
        sellerId: userId,
        sellerName,
        sellerRole,
        status,
        moderation: {
          flagged: moderationReasons.length > 0,
          reasons: moderationReasons,
          accepted: moderationAccepted,
        },
        createdAt: serverTimestamp(),
      });

      await onCharge(-cost);
      onCreated();
      setTitle("");
      setImageUrl("");
      setFile(null);
      setPrice(3);
      setFree(false);
      // reset moderation state after creation
      setModerationReasons([]);
      setModerationAccepted(false);
    } catch (e) {
      console.error("product:create failed", e);
      toast({ title: "Erreur", description: "Impossible de publier le produit.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const create = async () => {
    if (!can) return;
    setSaving(true);
    try {
      // call moderation endpoint
      const mod = await (await fetch("/api/moderate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: title }) })).json();
      if (mod?.flagged) {
        setModerationReasons(Array.isArray(mod.reasons) ? mod.reasons : []);
        setModerationOpen(true);
        setSaving(false);
        return;
      }

      await doCreate();
    } catch (e) {
      console.error("product:create failed", e);
      toast({ title: "Erreur", description: "Impossible de publier le produit.", variant: "destructive" });
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-3">
      <Input placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="rounded-md border border-dashed border-border/60 p-3 text-center text-sm" onDragOver={(e) => e.preventDefault()} onDrop={onDrop} onPaste={onPaste}>
        <div className="flex items-center justify-center gap-2">
          <input id="file" type="file" accept="image/*" className="hidden" onChange={onPick} />
          <Button variant="outline" size="sm" onClick={() => document.getElementById("file")?.click()}>
            Choisir une image
          </Button>
          <span className="text-foreground/60">ou glissez-déposez</span>
        </div>
        {(file || imageUrl) && (
          <div className="mt-2">
            <img src={file ? URL.createObjectURL(file) : imageUrl} alt="aperçu" className="mx-auto h-28 w-48 object-cover rounded-md" />
          </div>
        )}
      </div>
      <Input placeholder="…ou URL de l'image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} /> Gratuit
      </label>
      {!free && (
        <Input placeholder="Prix (RC) — min 3" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
      )}
      <div className="text-xs text-foreground/70">Frais de publication: {cost} RC (Certifié: 2 RC, sinon 5 RC)</div>
      <Button onClick={create} disabled={!can || saving}>
        {saving ? "Publication…" : "Publier"}
      </Button>

      <ModerationWarning
        open={moderationOpen}
        reasons={moderationReasons}
        text={title}
        onCancel={() => setModerationOpen(false)}
        onAccept={async () => {
          setModerationAccepted(true);
          setModerationOpen(false);
          await doCreate();
        }}
      />
    </div>
  );
}
