import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthProvider";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  increment,
} from "firebase/firestore";
import { useSearchParams } from "react-router-dom";

export default function GiftCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search] = useSearchParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const c = (search.get("code") || "").toUpperCase();
    if (c) setCode(c);
  }, [search]);

  const redeem = async () => {
    if (!user) {
      toast({ title: "Connectez-vous pour continuer", variant: "destructive" });
      return;
    }
    const c = code.trim().toUpperCase();
    if (!c) return;
    try {
      setLoading(true);
      const ref = doc(db, "giftcards", c);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        toast({ title: "Code invalide", variant: "destructive" });
        return;
      }
      const data = snap.data() as any;
      if (data.active === false) {
        toast({ title: "Carte désactivée", variant: "destructive" });
        return;
      }
      const amount = Number(data.amount || 0);
      if (!amount || !isFinite(amount)) {
        toast({ title: "Montant invalide", variant: "destructive" });
        return;
      }
      // target check
      if (data.target?.type === "uid" && data.target.uid !== user.uid) {
        toast({ title: "Non autorisé pour ce code", variant: "destructive" });
        return;
      }
      const already = Boolean(data.redemptions?.[user.uid]);
      if (already) {
        toast({ title: "Déjà utilisé" });
        return;
      }
      // credit user
      await updateDoc(doc(db, "users", user.uid), {
        "balances.available": increment(amount),
      } as any);
      // record transaction
      await addDoc(collection(db, "transactions"), {
        uid: user.uid,
        type: "giftcard",
        credits: amount,
        status: "completed",
        createdAt: serverTimestamp(),
      });
      // mark redemption
      await updateDoc(ref, {
        ["redemptions." + user.uid]: true,
        lastRedeemedAt: serverTimestamp(),
      });
      toast({ title: `+${amount} RC ajoutés` });
      setCode("");
    } catch (e) {
      console.error(e);
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10 max-w-md">
      <h1 className="font-display text-2xl font-bold">Gift Card Redeem</h1>
      <p className="text-sm text-foreground/70 mt-1">
        Entrez votre code cadeau pour recevoir des RotCoins.
      </p>
      <div className="mt-4 flex items-center gap-2">
        <Input
          placeholder="CODE-CADEAU"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <Button onClick={redeem} disabled={loading}>
          {loading ? "…" : "Valider"}
        </Button>
      </div>
    </div>
  );
}
