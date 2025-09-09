import { Button } from "@/components/ui/button";
import { RoleBadge, type Role } from "./RoleBadge";
import { emailToUsername } from "@/lib/usernameAuth";
import { motion } from "framer-motion";
import { DEFAULT_AVATAR_IMG } from "@/lib/images";
import { Dialog, DialogTrigger, DialogContent } from "./ui/dialog";
import { ProductDetailContent } from "./ProductDetail";
import { useAuth } from "@/context/AuthProvider";
import { db } from "@/lib/firebase";
import { deleteDoc, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export interface Product {
  id: string;
  title: string;
  price: number; // in RotCoins
  image?: string;
  seller: { id?: string; name: string; role: Role };
  free?: boolean;
  rating?: number;
}

function MiniCoin() {
  const src = "https://cdn.builder.io/api/v1/image/assets%2F7ca6692b844e492da4519bd1be30c27d%2F010980b0e1d0488b82cdd1e39f84e4d5?format=webp&width=800";
  return <img src={src} alt="RC" className="h-4 w-4 object-contain" />;
}

export function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { toast } = useToast();

  return (
    <Dialog>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        className="group relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
      >
        <div className="aspect-[16/10] w-full overflow-hidden bg-gradient-to-tr from-muted to-muted/60">
          <div
            className="h-full w-full bg-center bg-cover opacity-80 transition-transform duration-300 group-hover:scale-105"
            style={{
              backgroundImage: `url(${product.image || "/placeholder.svg"})`,
            }}
          />
        </div>
        <div className="p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-medium leading-tight line-clamp-1">{product.title}</h3>
              <div className="mt-1 text-xs text-foreground/70 flex items-center gap-1">
                <img src={DEFAULT_AVATAR_IMG} alt="avatar" className="h-4 w-4 rounded-full object-cover" />
                <span title={product.seller.name} className="font-medium mr-2">
                  {product.seller.name}
                </span>
                {/* compact role icon (no bubble) */}
                <RoleBadge role={product.seller.role} compact className="ml-0" />
              </div>
            </div>
            <div className="text-right shrink-0">
              {product.free ? (
                <div className="text-sm font-bold text-emerald-400">GRATUIT</div>
              ) : (
                <div className="flex items-center justify-end gap-1">
                  <span className="text-base md:text-lg font-extrabold text-white">{product.price}</span>
                  <MiniCoin />
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <DialogTrigger asChild>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 bg-transparent text-foreground/80 hover:text-foreground underline-offset-4 hover:underline">
                Détails
              </button>
            </DialogTrigger>

            <div className="flex items-center gap-2">
              <DialogTrigger asChild>
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 bg-gradient-to-r from-primary to-secondary text-white">
                  Acheter
                </button>
              </DialogTrigger>

              {/* If current user is the seller, show delete button */}
              {user && product.seller?.id && user.uid === product.seller.id ? (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const ok = window.confirm("Supprimer ce produit ? Cette action est irréversible.");
                    if (!ok) return;
                    try {
                      await deleteDoc(doc(db, "products", product.id));
                    } catch (err) {}
                    try {
                      if (product.seller.id) await deleteDoc(doc(db, "DataProject", "data1", "users", product.seller.id, "products", product.id));
                    } catch (err) {}
                    toast({ title: "Produit supprimé", variant: "default" });
                  }}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 bg-destructive text-white"
                >
                  Supprimer
                </button>
              ) : null}
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5 group-hover:ring-primary/40" />
      </motion.div>

      <DialogContent className="max-w-2xl">
        <ProductDetailContent product={product as any} onClose={() => {}} />
      </DialogContent>
    </Dialog>
  );
}
