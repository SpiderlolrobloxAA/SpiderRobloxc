import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crown, ShieldCheck, LifeBuoy, Star, User, ShoppingCart, Coins, Home, BadgeCheck } from "lucide-react";
import { useEffect } from "react";

const nav = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/marketplace", label: "Marketplace", icon: ShoppingCart },
  { to: "/shop", label: "RotCoins", icon: Coins },
  { to: "/quests", label: "Quêtes", icon: BadgeCheck },
  { to: "/profile", label: "Profil", icon: User },
  { to: "/transactions", label: "Transactions", icon: Coins },
];

function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-background/80 border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/20 ring-1 ring-primary/40 shadow-[0_0_24px_rgba(107,61,245,0.35)]">
            <span className="block h-4 w-4 rounded-sm bg-gradient-to-tr from-primary to-secondary" />
          </span>
          <span className="font-display text-xl tracking-tight">RotMarket</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {nav.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-foreground/80 hover:text-foreground hover:bg-muted"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="hidden sm:inline-flex">Se connecter</Button>
          <Button className="bg-gradient-to-r from-primary to-secondary shadow-[0_0_24px_rgba(107,61,245,0.35)] hover:from-primary/90 hover:to-secondary/90">
            S'inscrire
          </Button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 bg-gradient-to-b from-background to-background/40">
      <div className="container py-10 grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/20 ring-1 ring-primary/40">
              <span className="block h-4 w-4 rounded-sm bg-gradient-to-tr from-primary to-secondary" />
            </span>
            <span className="font-display text-lg">RotMarket</span>
          </div>
          <p className="mt-3 text-sm text-foreground/70 max-w-sm">
            Marketplace pro & gaming pour Steal a Brainrot. Achetez, vendez et gagnez des RotCoins en toute sécurité.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Liens</h4>
          <ul className="space-y-2 text-sm text-foreground/80">
            <li><Link className="hover:text-foreground" to="/marketplace">Marketplace</Link></li>
            <li><Link className="hover:text-foreground" to="/shop">Acheter des RotCoins</Link></li>
            <li><Link className="hover:text-foreground" to="/quests">Quêtes sociales</Link></li>
            <li><Link className="hover:text-foreground" to="/tickets">Tickets support</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Paiements</h4>
          <div className="flex items-center gap-3 text-foreground/70">
            <PayPalLogo />
            <VisaLogo />
            <MastercardLogo />
          </div>
          <p className="mt-3 text-xs text-foreground/60">Transactions sécurisées via PayPal Checkout. Redistribution 70% vendeur / 30% admins.</p>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-foreground/60">
        © {new Date().getFullYear()} RotMarket — Projet communautaire non affilié à Roblox.
      </div>
    </footer>
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

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <BackgroundAura />
      <Header />
      <main className="relative z-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function BackgroundAura() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute top-20 -right-32 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(107,61,245,0.08),transparent)]" />
    </div>
  );
}
