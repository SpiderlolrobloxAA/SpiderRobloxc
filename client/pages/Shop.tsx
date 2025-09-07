import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthProvider";
import { useProfile } from "@/context/ProfileProvider";
import PayPalCheckout from "@/components/PayPalCheckout";
import { ShieldCheck, Zap, BadgeDollarSign } from "lucide-react";
import { useState } from "react";

const packs = [
  { id: "starter", name: "Starter", coins: 500, price: 4.99, bonus: 5 },
  { id: "gamer", name: "Gamer", coins: 1200, price: 9.99, bonus: 12, popular: true },
  { id: "elite", name: "Elite", coins: 3500, price: 24.99, bonus: 18 },
  { id: "pro", name: "Pro", coins: 8000, price: 49.99, bonus: 25, best: true },
  { id: "legend", name: "Legend", coins: 15000, price: 89.99, bonus: 32 },
];

export default function Shop() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { addCredits } = useProfile();
  const [open, setOpen] = useState<string | null>(null);

  const onBuy = (id: string) => {
    const pack = packs.find((p) => p.id === id)!;
    if (!user) {
      toast({ title: "Connexion requise", description: "Veuillez vous connecter pour acheter des RotCoins." });
      return;
    }
    setOpen(id);
  };

  return (
    <div className="container py-10">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Boutique RotCoins</h1>
          <p className="text-sm text-foreground/70">Achetez des crédits instantanément. Paiements sécurisés via PayPal.</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-foreground/70">
          <Badge icon={<ShieldCheck className="h-4 w-4" />} text="Paiements sécurisés" />
          <Badge icon={<Zap className="h-4 w-4" />} text="Livraison instantanée" />
          <Badge icon={<BadgeDollarSign className="h-4 w-4" />} text="Meilleur prix" />
        </div>
      </header>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {packs.map((p) => (
          <div key={p.id} className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
            {p.popular && (
              <span className="absolute left-0 top-3 rounded-r-md bg-secondary px-2 py-1 text-[10px] font-semibold">Populaire</span>
            )}
            {p.best && (
              <span className="absolute left-0 top-3 rounded-r-md bg-primary px-2 py-1 text-[10px] font-semibold">Meilleur prix</span>
            )}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-foreground/60">{p.name}</div>
                <div className="mt-1 text-2xl font-extrabold">{p.coins.toLocaleString()} RC</div>
                <div className="text-xs text-emerald-400 font-semibold">Bonus +{p.bonus}%</div>
              </div>
              <GoldCoin size={52} />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-foreground/80">
                <span className="text-xl font-extrabold">{p.price.toFixed(2)}€</span>
              </div>
              <Button size="sm" onClick={() => onBuy(p.id)} className="bg-gradient-to-r from-primary to-secondary">Acheter</Button>
            </div>
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border/60 bg-card p-5">
        <h3 className="font-semibold">Moyens de paiement</h3>
        <div className="mt-3 flex items-center gap-3 text-foreground/70">
          <PayPalLogo />
          <VisaLogo />
          <MastercardLogo />
        </div>
      </div>
    </div>
  );
}

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-card/60 px-2 py-1">
      {icon}
      {text}
    </span>
  );
}

function GoldCoin({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="#F9D84A" />
      <circle cx="32" cy="32" r="22" fill="#FFC928" />
      <path d="M24 32h16M32 24v16" stroke="#8B5E00" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function PayPalLogo() {
  return (
    <svg width="52" height="20" viewBox="0 0 52 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="52" height="20" rx="4" fill="hsl(var(--muted))" />
      <text x="26" y="13" textAnchor="middle" fontSize="9" fontWeight="700" fill="hsl(var(--secondary))">PayPal</text>
    </svg>
  );
}
function VisaLogo() {
  return (
    <svg width="44" height="20" viewBox="0 0 44 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="44" height="20" rx="4" fill="hsl(var(--muted))" />
      <text x="22" y="13" textAnchor="middle" fontSize="9" fontWeight="800" fill="hsl(var(--primary))">VISA</text>
    </svg>
  );
}
function MastercardLogo() {
  return (
    <svg width="44" height="20" viewBox="0 0 44 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="44" height="20" rx="4" fill="hsl(var(--muted))" />
      <circle cx="18" cy="10" r="5" fill="#EB001B" />
      <circle cx="26" cy="10" r="5" fill="#F79E1B" />
    </svg>
  );
}
