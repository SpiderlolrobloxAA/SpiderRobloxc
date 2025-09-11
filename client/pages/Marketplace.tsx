import React, { useEffect, useState, useRef } from "react";
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
  updateDoc,
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
    const maintRef = doc(db, "maintenance", "global");
    const unsubMeta = onSnapshot(
      maintRef,
      (d) => {
        const data = d.data() as any | undefined;
        const isOn = Boolean(data?.on);
        const scope = data?.scope || "global";
        if (!isOn) return setMaintenance(false);
        setMaintenance(scope === "global" || scope === "marketplace");
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
    .sort((a, b) =>
      sort === "price" ? (a.price as number) - (b.price as number) : 0,
    );

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
        <div className="mt-6 rounded-xl border border-yellow-500/40 bg-yellow-400/90 text-black p-6 text-center">
          <div className="text-xl font-semibold">Maintenance en cours</div>
          <div className="mt-2 text-sm">
            Le marketplace est temporairement désactivé. Merci de revenir plus
            tard.
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="mt-6 rounded-xl border border-border/60 bg-card p-6 text-center">
          <div className="text-xl font-semibold">Aucun produit</div>
          <div className="mt-2 text-sm text-foreground/70">
            Aucun produit n'est disponible à la vente pour le moment.
          </div>
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
                seller: {
                  id: p.sellerId,
                  name: p.sellerName,
                  role: p.sellerRole,
                },
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
  // require an actual URL (imageUrl) to consider image present; files are converted on pick to imageUrl
  const imgOk = Boolean(imageUrl);
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
            if (
              trimmed.startsWith("data:image/") ||
              /(https?:\/\/.+\.(png|jpe?g|webp|gif))/i.test(trimmed)
            ) {
              setImageUrl(trimmed);
            }
          });
        }
      }
    } catch (err) {
      console.warn("paste handling failed", err);
    }
  };

  const [imageUploading, setImageUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const uploadedUrlRef = useRef<string | null>(null);
  const backgroundUploadRef = useRef<Promise<string | null> | null>(null);

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    // show immediate preview while processing
    try {
      const p = URL.createObjectURL(f);
      setPreviewUrl(p);
    } catch {}
    // reuse same logic as onPick
    const fake = {
      target: { files: [f] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    await onPick(fake);
  };

  // create a small preview quickly and start background upload of original file
  const startBackgroundUpload = async (fileToUpload: File) => {
    // compress image in-browser before uploading to reduce upload time and bandwidth
    const compress = async (file: File, maxDim = 1024, quality = 0.75) => {
      try {
        const img = await createImageBitmap(file);
        const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.round(img.width * ratio);
        const height = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return file;
        ctx.drawImage(img, 0, 0, width, height);
        const blob: Blob | null = await new Promise((res) =>
          canvas.toBlob(res, "image/jpeg", quality),
        );
        if (!blob) return file;
        // return a File so firebase upload keeps original filename context
        const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
        return new File([blob], newName, { type: "image/jpeg" });
      } catch (err) {
        console.warn("compression failed, uploading original", err);
        return file;
      }
    };

    const promise = (async () => {
      try {
        // compress before upload (this usually reduces size dramatically and speeds up uploads)
        const toUpload = await compress(fileToUpload, 1024, 0.75);

        // read as base64
        const arrayBuf = await toUpload.arrayBuffer();
        const b64 = Buffer.from(arrayBuf).toString("base64");
        const dataUrl = `data:${toUpload.type};base64,${b64}`;

        // send to server function to upload with admin SDK (avoids CORS)
        const resp = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: toUpload.name, data: dataUrl }),
        });
        if (!resp.ok) {
          console.warn("server upload failed", await resp.text());
          return null;
        }
        const json = await resp.json();
        const dl = json?.url || null;
        if (dl) uploadedUrlRef.current = dl;
        return dl;
      } catch (e) {
        console.warn("background upload failed", e);
        return null;
      }
    })();
    backgroundUploadRef.current = promise;
    return promise;
  };

  const createPreviewDataUrl = async (fileToPreview: File) => {
    try {
      const img = await createImageBitmap(fileToPreview);
      const maxDim = 800;
      let { width, height } = img;
      const ratio = Math.min(1, maxDim / Math.max(width, height));
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, width, height);
      return canvas.toDataURL("image/jpeg", 0.7);
    } catch (e) {
      return null;
    }
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageUploading(true);
    setFile(f);

    // create small preview immediately
    const preview = await createPreviewDataUrl(f);
    if (preview) {
      setPreviewUrl(preview);
      setImageUrl(preview); // use preview so UI is fast
    } else {
      try {
        const p = URL.createObjectURL(f);
        setPreviewUrl(p);
      } catch {}
    }

    // start background upload but do NOT block publish
    startBackgroundUpload(f).then((dl) => {
      if (dl) {
        // if preview was set to data URL, swap to final URL for subsequent publishes
        setImageUrl(dl);
      }
      setImageUploading(false);
    });
  };

  // actual creation logic extracted so it can be called after moderation acceptance
  const doCreate = async () => {
    setSaving(true);

    try {
      // Prefer background uploaded URL (fast path), otherwise use current imageUrl (preview or pasted URL)
      let finalUrl = uploadedUrlRef.current || imageUrl;

      // If still no image URL, use default placeholder image hosted on CDN
      if (!finalUrl) {
        finalUrl =
          "https://cdn.prod.website-files.com/643149de01d4474ba64c7cdc/65428da5c4c1a2b9740cc088_20231101-ImageNonDisponible-v1.jpg";
      }

      const flagged = moderationReasons.length > 0;
      const status = flagged ? "pending" : "active";

      // After publishing, if a background upload completes later, we'll reconcile the product image

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
      await setDoc(
        doc(db, "DataProject", "data1", "users", userId, "products", refDoc.id),
        {
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
        },
      );

      // charge only when active
      if (!flagged) await onCharge(-cost);
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
      toast({
        title: "Erreur",
        description: "Impossible de publier le produit.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const create = async () => {
    // validate and show reasons if cannot publish
    const reasons: string[] = [];
    if (!title.trim()) reasons.push("Titre requis");
    if (!imageUrl)
      reasons.push("Image requise (collez une URL ou choisissez un fichier)");
    if (userCredits < cost)
      reasons.push(`Solde insuffisant (il vous faut ${cost} RC)`);
    if (!free && (Number(price) || 0) < 3)
      reasons.push("Prix minimum 3 RC sauf si Gratuit");

    if (reasons.length > 0) {
      toast({
        title: "Impossible de publier",
        description: reasons.join(" — "),
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // call moderation endpoint
      const mod = await (
        await fetch("/api/moderate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: title }),
        })
      ).json();
      if (mod?.flagged) {
        setModerationReasons(Array.isArray(mod.reasons) ? mod.reasons : []);
        setModerationOpen(true);
        setSaving(false);
        return;
      }

      await doCreate();
    } catch (e) {
      console.error("product:create failed", e);
      toast({
        title: "Erreur",
        description: "Impossible de publier le produit.",
        variant: "destructive",
      });
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-3">
      <Input
        placeholder="Titre"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div
        className="rounded-md border border-dashed border-border/60 p-3 text-center text-sm"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onPaste={onPaste}
      >
        <div className="flex items-center justify-center gap-2">
          <input
            id="file"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPick}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("file")?.click()}
          >
            Choisir une image (sera convertie en lien)
          </Button>
          <span className="text-foreground/60">ou collez/glissez une URL</span>
        </div>
        {(imageUrl || previewUrl) && (
          <div className="mt-2">
            <img
              src={imageUrl || previewUrl || ""}
              alt="aperçu"
              className="mx-auto h-28 w-48 object-cover rounded-md"
            />
          </div>
        )}
        {imageUploading && (
          <div className="mt-2 text-sm text-foreground/60">
            Upload image en cours…
          </div>
        )}
      </div>
      <Input
        placeholder="URL de l'image (requis)"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={free}
          onChange={(e) => setFree(e.target.checked)}
        />{" "}
        Gratuit
      </label>
      {!free && (
        <Input
          placeholder="Prix (RC) — min 3"
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
      )}
      <div className="text-xs text-foreground/70">
        Frais de publication: {cost} RC (Certifié: 2 RC, sinon 5 RC)
      </div>
      <Button onClick={create} disabled={saving}>
        {saving ? "Publication…" : "Publier"}
      </Button>

      <ModerationWarning
        open={moderationOpen}
        reasons={moderationReasons}
        text={title}
        onCancel={() => setModerationOpen(false)}
        onAccept={async () => {
          // Accepting acknowledges the warning but product will remain pending review (not published)
          setModerationOpen(false);
          await doCreate();
        }}
      />
    </div>
  );
}
