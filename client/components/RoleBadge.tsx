import { Crown, ShieldCheck, LifeBuoy, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type Role = "founder" | "moderator" | "helper" | "verified" | "user";

const roleMap: Record<Role, { label: string; Icon: any; className: string }> = {
  founder: {
    label: "Fondateur",
    Icon: Crown,
    className:
      "bg-gradient-to-r from-amber-400 to-yellow-500 text-black ring-1 ring-amber-300",
  },
  moderator: {
    label: "Modérateur",
    Icon: ShieldCheck,
    className:
      "bg-gradient-to-r from-sky-400 to-blue-600 text-white ring-1 ring-blue-400/60",
  },
  helper: {
    label: "Helper",
    Icon: LifeBuoy,
    className:
      "bg-gradient-to-r from-emerald-400 to-emerald-600 text-black ring-1 ring-emerald-300",
  },
  verified: {
    label: "Vendeur certifié",
    Icon: Star,
    className:
      "bg-gradient-to-r from-primary to-secondary text-white ring-1 ring-primary/50",
  },
  user: {
    label: "Utilisateur",
    Icon: User,
    className: "bg-muted text-foreground/80 ring-1 ring-border",
  },
};

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const cfg = roleMap[role];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm",
        cfg.className,
        className,
      )}
    >
      <cfg.Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}
