import { Crown, ShieldCheck, LifeBuoy, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type Role = "founder" | "moderator" | "helper" | "verified" | "user";

const VERIFIED_IMG = "https://cdn.builder.io/api/v1/image/assets%2Fec69bd5deeba4d6a81033567db96cbc0%2Fad5998f22c5a449f88de74ab7b33fdf4?format=webp&width=800";

const roleMap: Record<Role, { label: string; Icon: any | null; className: string }> = {
  founder: {
    label: "Fondateur",
    Icon: Crown,
    className: "bg-amber-500/20 text-white ring-1 ring-amber-400/40",
  },
  moderator: {
    label: "Modérateur",
    Icon: ShieldCheck,
    className: "bg-sky-500/20 text-white ring-1 ring-sky-400/40",
  },
  helper: {
    label: "Helper",
    Icon: LifeBuoy,
    className: "bg-emerald-500/20 text-white ring-1 ring-emerald-400/40",
  },
  verified: {
    label: "Certifié",
    Icon: null,
    className: "bg-violet-500/25 text-white ring-1 ring-violet-400/40",
  },
  user: {
    label: "Utilisateur",
    Icon: User,
    className: "bg-muted text-foreground/90 ring-1 ring-border",
  },
};

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const cfg = roleMap[role];
  if (role === "verified") {
    return (
      <img
        src={VERIFIED_IMG}
        alt="Certifié"
        title="Certifié"
        className={cn("h-4 w-4 object-contain", className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm",
        cfg.className,
        className,
      )}
    >
      {cfg.Icon ? <cfg.Icon className="h-3.5 w-3.5 text-white" /> : null}
      {cfg.label}
    </span>
  );
}
