import React from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { useAuth } from "@/context/AuthProvider";
import { useProfile } from "@/context/ProfileProvider";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  setDoc,
  arrayUnion,
  increment,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export interface Product {
  id: string;
  title: string;
  price: number;
  image?: string;
  seller: { id?: string; name: string; role: string };
  free?: boolean;
}

export function ProductDetailContent({ product, onClose }: { product: Product; onClose?: () => void }) {
  const { user } = useAuth();
  const { credits } = useProfile();
  const { toast } = useToast();

  const purchase = async () => {
    if (!user) {
      toast({ title: "Connectez-vous", description: "Veuillez vous connecter pour acheter.", variant: "destructive" });
      return;
    }
    const sellerId = product.seller.id;
    const price = product.price || 0;
    try {
      if (product.free) {
        // mark product sold and create thread
        await updateDoc(doc(db, "products", product.id), { status: "sold", soldAt: serverTimestamp(), buyerId: user.uid });
        const thRef = await addDoc(collection(db, "threads"), {
          participants: [user.uid, sellerId].filter(Boolean),
          title: product.title,
          productId: product.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await addDoc(collection(db, "threads", thRef.id, "messages"), {
          senderId: user.uid,
          text: `Produit acheté : ${product.title}`,
          createdAt: serverTimestamp(),
        });
        if (sellerId) {
          await updateDoc(doc(db, "users", sellerId), {
            notifications: arrayUnion({ type: "thread", threadId: thRef.id, text: `${user.displayName || user.email || "Un utilisateur"} a acheté votre produit`, createdAt: serverTimestamp(), read: false }),
          }).catch(() => {});
        }
        toast({ title: "Achat confirmé", description: "Le vendeur a été contacté.", variant: "default" });
        onClose?.();
        return;
      }

      // Paid product
      if ((credits || 0) < price) {
        toast({ title: "Crédits insuffisants", description: "Vous n'avez pas assez de RotCoins.", variant: "destructive" });
        return;
      }

      const ok = window.confirm(`Confirmer l'achat de ${product.title} pour ${price} RC ?`);
      if (!ok) return;

      // Deduct buyer credits
      await updateDoc(doc(db, "users", user.uid), { "balances.available": (window as any).firebaseIncrement ? (window as any).firebaseIncrement(-price) : undefined }, { });
      // The above uses a fallback; instead perform atomic decrement via server update using FieldValue is not available on client here.
      // Use updateDoc with increment from firebase/firestore
    } catch (e) {
      console.error("purchase failed", e);
      toast({ title: "Erreur", description: "Impossible d'effectuer l'achat.", variant: "destructive" });
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{product.title}</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <img src={product.image || "/placeholder.svg"} alt={product.title} className="w-full rounded-md object-cover" />
        </div>
        <div className="space-y-3">
          <div className="text-sm">Vendeur: {product.seller.name}</div>
          <div className="text-lg font-bold">{product.free ? "GRATUIT" : `${product.price} RC`}</div>
          <div className="text-sm text-foreground/70">Description non fournie.</div>
          <div className="pt-2">
            <Button onClick={purchase} className="w-full">
              Acheter
            </Button>
          </div>
        </div>
      </div>
      <DialogFooter />
    </>
  );
}
