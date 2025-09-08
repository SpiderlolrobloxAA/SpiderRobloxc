import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard, type Product } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthProvider";
import { useProfile } from "@/context/ProfileProvider";
import { db } from "@/lib/firebase";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";

export default function Marketplace() {
  const [queryStr, setQueryStr] = useState("");
  const [sort, setSort] = useState("recent");
  const [items, setItems] = useState<Product[]>([]);
  const { user } = useAuth();
  const { role, credits, addCredits } = useProfile();

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
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Trier par" /></SelectTrigger>
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
                  <AddProduct onCreated={async () => {}} userId={user.uid} sellerRole={role as any} sellerName={user.displayName || user.email || "Utilisateur"} onCharge={addCredits} userCredits={credits} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p: any) => (
          <ProductCard key={p.id} product={{ id: p.id, title: p.title, price: p.price, free: false, seller: { name: p.sellerName, role: p.sellerRole }, rating: p.rating || 4.5 }} />
        ))}
      </div>
    </div>
  );
}

function AddProduct({ onCreated, userId, sellerRole, sellerName, onCharge, userCredits }: { onCreated: () => void; userId: string; sellerRole: string; sellerName: string; onCharge: (n: number) => Promise<void>; userCredits: number; }) {
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const cost = sellerRole === 'verified' ? 2 : 5;
  const can = userCredits >= cost && title && imageUrl && price > 0;

  const create = async () => {
    if (!can) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "products"), {
        title,
        imageUrl,
        price,
        sellerId: userId,
        sellerName,
        sellerRole,
        createdAt: serverTimestamp(),
      });
      await onCharge(-cost);
      onCreated();
      setTitle(""); setImageUrl(""); setPrice(0);
    } catch (e) {
      console.error('product:create failed', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-2">
      <Input placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input placeholder="Image URL (obligatoire)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      <Input placeholder="Prix (RC)" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
      <div className="text-xs text-foreground/70">Frais d'upload: {cost} RC (Certifié: 2 RC, sinon 5 RC)</div>
      <Button onClick={create} disabled={!can || saving}>{saving ? "Publication…" : "Publier"}</Button>
    </div>
  );
}
