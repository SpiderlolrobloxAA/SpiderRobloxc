import { Button } from "@/components/ui/button";
import { RoleBadge, type Role } from "./RoleBadge";
import { motion } from "framer-motion";

export interface Product {
  id: string;
  title: string;
  price: number; // in RotCoins
  image?: string;
  seller: { name: string; role: Role };
  free?: boolean;
  rating?: number;
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      className="group relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-gradient-to-tr from-muted to-muted/60">
        <div className="h-full w-full bg-[url('/placeholder.svg')] bg-center bg-cover opacity-60 group-hover:opacity-80 transition-opacity" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold leading-tight">{product.title}</h3>
            <div className="mt-1 text-xs text-foreground/70 flex items-center gap-2">
              <span className="truncate max-w-[140px]">{product.seller.name}</span>
              <RoleBadge role={product.seller.role} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-primary">{product.free ? "GRATUIT" : `${product.price} RC`}</div>
            {product.rating ? (
              <div className="text-[11px] text-foreground/70">★ {product.rating.toFixed(1)}</div>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Button size="sm" variant="secondary" className="">Voir le produit</Button>
          <Button size="sm" className="bg-gradient-to-r from-primary to-secondary">
            Acheter
          </Button>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5 group-hover:ring-primary/40" />
    </motion.div>
  );
}
