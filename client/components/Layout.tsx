import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Crown,
  ShieldCheck,
  LifeBuoy,
  Star,
  User,
  ShoppingCart,
  Coins,
  Home,
  BadgeCheck,
  LogOut,
} from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { DEFAULT_AVATAR_IMG } from "@/lib/images";
import { VERIFIED_IMG } from "@/components/RoleBadge";

const nav = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/marketplace", label: "Marketplace", icon: ShoppingCart },
  { to: "/shop", label: "RotCoins", icon: Coins },
  { to: "/quests", label: "Quêtes", icon: BadgeCheck },
  { to: "/profile", label: "Profil", icon: User },
  { to: "/transactions", label: "Transactions", icon: Coins },
];

function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-background/80 border-b border-border">
      <div className="container grid h-14 md:h-16 grid-cols-2 md:grid-cols-[auto,1fr,auto] items-center gap-2 md:gap-6">
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fec69bd5deeba4d6a81033567db96cbc0%2Fa179a2c715a64edaafe6df770c43ddf5?format=webp&width=800"
            alt="Brainrot Market logo"
            className="h-8 w-8 rounded-md object-cover"
          />
          <span className="font-display text-lg md:text-xl tracking-tight">
            Brainrot Market{" "}
            <span role="img" aria-label="France">
              🇫🇷
            </span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center justify-center gap-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-2.5 py-2 rounded-md text-[13px] md:text-sm transition-colors inline-flex items-center gap-2 ${
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-foreground/80 hover:text-foreground hover:bg-muted"
                }`
              }
            >
              <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-3">
          {!user ? (
            <>
              <Button asChild variant="outline" className="h-8 md:h-9 px-2 md:px-3 text-xs md:text-sm">
                <Link to="/login">Se connecter</Link>
              </Button>
              <Button
                asChild
                className="h-8 md:h-9 px-2 md:px-3 text-xs md:text-sm bg-gradient-to-r from-primary to-secondary shadow-[0_0_24px_rgba(107,61,245,0.35)] hover:from-primary/90 hover:to-secondary/90"
              >
                <Link to="/register">S'inscrire</Link>
              </Button>
            </>
          ) : (
            <UserInfo />
          )}
        </div>
      </div>
    </header>
  );
}

import { useProfile } from "@/context/ProfileProvider";
import { RoleBadge } from "@/components/RoleBadge";

function CompactRole({ role }: { role: string }) {
  if (role === "verified") {
    return (
      <img
        src={VERIFIED_IMG}
        alt="Certifié"
        title="Certifié"
        className="h-4 w-4 object-contain"
      />
    );
  }
  const map: Record<string, { label: string; icon: React.ReactNode }> = {
    founder: { label: "Fondateur", icon: <span>👑</span> },
    moderator: { label: "Mod", icon: <span>🛡️</span> },
    helper: { label: "Helper", icon: <span>��</span> },
    user: { label: "User", icon: <span>👤</span> },
  };
  const cfg = map[role] ?? map.user;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-[2px] text-[10px] md:text-[11px] text-foreground/80">
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function UserInfo() {
  const { user, logout } = useAuth();
  const { credits, role } = useProfile();
  return (
    <div className="hidden md:flex items-center justify-end gap-4">
      <div className="flex items-center gap-2 min-w-0">
        <img
          src={DEFAULT_AVATAR_IMG}
          alt="avatar"
          className="h-8 w-8 rounded-full object-cover"
        />
        <span className="max-w-[160px] truncate text-sm text-foreground/90">
          {user?.displayName || user?.email}
        </span>
        <CompactRole role={role as any} />
      </div>
      <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-card/60 px-2 py-1 text-xs whitespace-nowrap" title="Crédits disponibles">
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" fill="#F9D84A" />
          <circle cx="12" cy="12" r="7" fill="#FFC928" />
        </svg>
        {credits.toLocaleString()} RC
      </span>
      <Button
        variant="outline"
        onClick={logout}
        className="h-9 px-3 inline-flex items-center gap-2 whitespace-nowrap"
      >
        <LogOut className="h-4 w-4" />
        Déconnexion
      </Button>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 bg-gradient-to-b from-background to-background/40">
      <div className="container py-10 grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Fec69bd5deeba4d6a81033567db96cbc0%2Fa179a2c715a64edaafe6df770c43ddf5?format=webp&width=800"
              alt="Brainrot Market logo"
              className="h-8 w-8 rounded-md object-cover"
            />
            <span className="font-display text-lg">
              Brainrot Market{" "}
              <span role="img" aria-label="France">
                🇫🇷
              </span>
            </span>
          </div>
          <p className="mt-3 text-sm text-foreground/70 max-w-sm">
            Marketplace pro & gaming pour Steal a Brainrot. Achetez, vendez et
            gagnez des RotCoins en toute sécurité.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">À propos</h4>
          <ul className="space-y-2 text-sm text-foreground/80">
            <li>
              <Link className="hover:text-foreground" to="/">
                Notre mission
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" to="/profile">
                Compte & profil
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" to="/transactions">
                Transactions
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" to="/marketplace">
                Marketplace
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Support</h4>
          <ul className="space-y-2 text-sm text-foreground/80">
            <li>
              <Link className="hover:text-foreground" to="/tickets">
                Centre d'aide
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" to="/tickets">
                Ouvrir un ticket
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" to="/">
                Politique de remboursement
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" to="/">
                Conditions & légales
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Paiements</h4>
          <div className="flex items-center gap-3 text-foreground/70">
            <PayPalLogo />
            <VisaLogo />
            <MastercardLogo />
          </div>
          <p className="mt-3 text-xs text-foreground/60">
            Transactions sécurisées via PayPal Checkout. Redistribution 70%
            vendeur / 30% admins.
          </p>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-foreground/60">
        © {new Date().getFullYear()} Brainrot Market 🇫🇷 — Projet communautaire
        non affilié à Roblox.
      </div>
    </footer>
  );
}

function PayPalLogo() {
  return (
    <svg
      width="52"
      height="20"
      viewBox="0 0 52 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="52" height="20" rx="4" fill="hsl(var(--muted))" />
      <text
        x="26"
        y="13"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fill="hsl(var(--secondary))"
      >
        PayPal
      </text>
    </svg>
  );
}
function VisaLogo() {
  return (
    <svg
      width="44"
      height="20"
      viewBox="0 0 44 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="44" height="20" rx="4" fill="hsl(var(--muted))" />
      <text
        x="22"
        y="13"
        textAnchor="middle"
        fontSize="9"
        fontWeight="800"
        fill="hsl(var(--primary))"
      >
        VISA
      </text>
    </svg>
  );
}
function MastercardLogo() {
  return (
    <svg
      width="44"
      height="20"
      viewBox="0 0 44 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === "F1" || e.code === "F1")) {
        e.preventDefault();
        window.location.assign("/admin");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute top-20 -right-32 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(107,61,245,0.08),transparent)]" />
    </div>
  );
}
