import { Button } from "@/components/ui/button";
import TopSellersCarousel from "@/components/TopSellersCarousel";
import { ProductCard, type Product } from "@/components/ProductCard";
import { ArrowRight, ShoppingBag, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Index() {
  const products: Product[] = [
    { id: "1", title: "Brain Rot Rare #2187", price: 24, seller: { name: "Aetherius", role: "verified" }, rating: 4.9 },
    { id: "2", title: "Starter Brain Rot Pack", price: 9, seller: { name: "NovaByte", role: "verified" }, rating: 4.7 },
    { id: "3", title: "Skin Emote – Glitch", price: 0, seller: { name: "Pixelya", role: "user" }, free: true, rating: 4.5 },
    { id: "4", title: "Ultra Brain Rot – Neon", price: 39, seller: { name: "Kairox", role: "verified" }, rating: 5 },
  ];
  const sellers = [
    { id: "s1", name: "Aetherius", sales: 1021 },
    { id: "s2", name: "NovaByte", sales: 856 },
    { id: "s3", name: "VortexZ", sales: 791 },
    { id: "s4", name: "Kairox", sales: 745 },
    { id: "s5", name: "Zenku", sales: 699 },
  ];

  return (
    <div>
      <section className="relative border-b border-border/60">
        <div className="container grid gap-10 py-14 md:grid-cols-2">
          <div className="flex flex-col justify-center">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-display text-4xl md:text-5xl font-extrabold tracking-tight"
            >
              Marketplace pro & immersif pour Steal a Brainrot
            </motion.h1>
            <p className="mt-4 text-foreground/80 max-w-prose">
              Achetez et vendez des Brain Rots, gagnez des <strong>RotCoins</strong> et profitez d'une expérience inspirée de G2G/Eldorado.
              Paiements PayPal, vendeurs certifiés, redistribution automatique.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-gradient-to-r from-primary to-secondary">
                <Link to="/marketplace" className="inline-flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Parcourir le Marketplace
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/shop" className="inline-flex items-center gap-2">
                  <CoinsIcon />
                  Acheter des RotCoins
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/sell" className="inline-flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Commencer à vendre
                </Link>
              </Button>
            </div>
            <div className="mt-8">
              <h3 className="text-sm uppercase tracking-wider text-foreground/60">Vendeurs certifiés — Top 5</h3>
              <div className="mt-3"><TopSellersCarousel sellers={sellers} /></div>
            </div>
          </div>
          <div className="relative">
            <div className="relative aspect-[4/3] rounded-2xl border border-border bg-gradient-to-br from-primary/20 via-secondary/10 to-background p-[2px]">
              <div className="h-full w-full rounded-2xl bg-[url('/placeholder.svg')] bg-cover bg-center opacity-70" />
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/5" />
            </div>
            <div className="absolute -bottom-4 -left-4 hidden md:block">
              <StatPill label="Commissions redistribuées" value="30% admins / 70% vendeurs" />
            </div>
          </div>
        </div>
      </section>

      <section className="container py-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold">Packs RotCoins</h2>
          <Link to="/shop" className="text-sm text-primary inline-flex items-center gap-1 hover:underline">
            Voir la boutique
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CreditPack name="Starter" amount={500} bonus={"+5%"} price="4,99€"/>
          <CreditPack name="Gamer" amount={1200} bonus={"+12%"} price="9,99€"/>
          <CreditPack name="Elite" amount={3500} bonus={"+18%"} price="24,99€"/>
          <CreditPack name="Pro" amount={8000} bonus={"+25%"} price="49,99€"/>
        </div>
      </section>

      <section className="container py-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold">En vedette</h2>
          <Link to="/marketplace" className="text-sm text-primary inline-flex items-center gap-1 hover:underline">
            Tout voir
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}

function CreditPack({ name, amount, bonus, price }: { name: string; amount: number; bonus: string; price: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-foreground/60">{name}</div>
          <div className="mt-1 text-2xl font-extrabold">{amount.toLocaleString()} RC</div>
          <div className="text-xs text-accent font-semibold">Bonus {bonus}</div>
        </div>
        <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-primary to-secondary ring-2 ring-primary/40" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-foreground/80"><span className="text-lg font-bold">{price}</span></div>
        <Button size="sm" className="bg-gradient-to-r from-primary to-secondary">Acheter</Button>
      </div>
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />
    </motion.div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/90 px-4 py-3 shadow-lg">
      <div className="text-[11px] uppercase tracking-wider text-foreground/60">{label}</div>
      <div className="text-sm font-semibold text-foreground/90">{value}</div>
    </div>
  );
}

function CoinsIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="12" r="5" fill="hsl(var(--accent))"/>
      <circle cx="16" cy="12" r="5" fill="hsl(var(--secondary))" fillOpacity="0.9"/>
    </svg>
  );
}
