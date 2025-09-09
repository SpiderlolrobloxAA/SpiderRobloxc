import { useEffect, useState } from "react";
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

export default function Marketplace() {
  const [queryStr, setQueryStr] = useState("");
  const [sort, setSort] = useState("recent");
  const [items, setItems] = useState<Product[]>([]);
  const { user } = useAuth();
  const { role, credits, addCredits } = useProfile();
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setItems(rows as any);
    });
    return () => unsub();
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
              seller: { name: p.sellerName, role: p.sellerRole },
              rating: p.rating || 4.5,
            }}
          />
        ))}
      </div>
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

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const create = async () => {
    if (!can) return;
    setSaving(true);
    try {
      let finalUrl = imageUrl;
      if (!finalUrl && file) {
        const storage = await getStorageClient();
        if (storage) {
          const tmpRef = ref(
            storage,
            `products/${userId}/${Date.now()}_${file.name}`,
          );
          await uploadBytes(tmpRef, file);
          finalUrl = await getDownloadURL(tmpRef);
        } else {
          toast({
            title: "Upload image indisponible",
            description:
              "Veuillez saisir une URL d'image ou réessayer plus tard.",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
      }
      const refDoc = await addDoc(collection(db, "products"), {
        title: title.trim(),
        imageUrl: finalUrl,
        price: validPrice,
        sellerId: userId,
        sellerName,
        sellerRole,
        status: "active",
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
          status: "active",
          createdAt: serverTimestamp(),
        },
      );
      await onCharge(-cost);
      onCreated();
      setTitle("");
      setImageUrl("");
      setFile(null);
      setPrice(3);
      setFree(false);
    } catch (e) {
      console.error("product:create failed", e);
    } finally {
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
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={onDrop}
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
            Choisir une image
          </Button>
          <span className="text-foreground/60">ou glissez-déposez</span>
        </div>
        {(file || imageUrl) && (
          <div className="mt-2">
            <img
              src={file ? URL.createObjectURL(file) : imageUrl}
              alt="aperçu"
              className="mx-auto h-28 w-48 object-cover rounded-md"
            />
          </div>
        )}
      </div>
      <Input
        placeholder="…ou URL de l'image"
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
      <Button onClick={create} disabled={!can || saving}>
        {saving ? "Publication…" : "Publier"}
      </Button>
    </div>
  );
}
