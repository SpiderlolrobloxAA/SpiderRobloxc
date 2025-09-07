import { Button } from "@/components/ui/button";
import { RoleBadge, type Role } from "./RoleBadge";
import { motion } from "framer-motion";
import { DEFAULT_AVATAR_IMG } from "@/lib/images";

export interface Product {
  id: string;
  title: string;
  price: number; // in RotCoins
  image?: string;
  seller: { name: string; role: Role };
  free?: boolean;
  rating?: number;
}

function MiniCoin() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#F9D84A" />
      <circle cx="12" cy="12" r="7" fill="#FFC928" />
      <path d="M9 12h6M12 9v6" stroke="#8B5E00" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      className="group relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-gradient-to-tr from-muted to-muted/60">
        <div className="h-full w-full bg-[url('/placeholder.svg')] bg-center bg-cover opacity-80 transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-medium leading-tight line-clamp-1">{product.title}</h3>
            <div className="mt-1 text-xs text-foreground/70 flex items-center gap-1.5">
              <img src={DEFAULT_AVATAR_IMG} alt="avatar" className="h-4 w-4 rounded-full object-cover" />
              <span title={product.seller.name} className="font-medium">{product.seller.name}</span>
              <RoleBadge role={product.seller.role} className="h-4 w-4" />
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
          <Button size="sm" variant="ghost" className="text-foreground/80 hover:text-foreground underline-offset-4 hover:underline">Détails</Button>
          <Button size="sm" className="bg-gradient-to-r from-primary to-secondary">Acheter</Button>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5 group-hover:ring-primary/40" />
    </motion.div>
  );
}
