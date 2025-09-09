import { Crown, ShieldCheck, LifeBuoy, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSmoothTiltHandlers } from "@/lib/tilt";

export type Role = "founder" | "moderator" | "helper" | "verified" | "user";

export const VERIFIED_IMG =
  "https://cdn.builder.io/api/v1/image/assets%2Fec69bd5deeba4d6a81033567db96cbc0%2Fad5998f22c5a449f88de74ab7b33fdf4?format=webp&width=800";

const roleMap: Record<
  Role,
  { label: string; icon?: string; className: string }
> = {
  founder: {
    label: "Fondateur",
    icon: "/icons/crown.svg",
    className: "bg-amber-600/10 text-amber-600 ring-1 ring-amber-300/30",
  },
  moderator: {
    label: "Modérateur",
    icon: "/icons/shield.svg",
    className: "bg-sky-600/10 text-sky-600 ring-1 ring-sky-300/30",
  },
  helper: {
    label: "Helper",
    icon: "/icons/chat.svg",
    className: "bg-emerald-600/10 text-emerald-600 ring-1 ring-emerald-300/30",
  },
  verified: {
    label: "Certifié",
    icon: undefined,
    className: "bg-violet-600/10 text-violet-600 ring-1 ring-violet-300/30",
  },
  user: {
    label: "Utilisateur",
    icon: "/icons/avatar.svg",
    className: "bg-muted text-foreground/90 ring-1 ring-border",
  },
};

export function RoleBadge({
  role,
  className,
  compact,
}: {
  role?: Role | string;
  className?: string;
  compact?: boolean;
}) {
  const key =
    typeof role === "string" && role in roleMap ? (role as Role) : "user";
  const cfg = roleMap[key];

  if (compact) {
    if (key === "verified") {
      const handlers = createSmoothTiltHandlers(10, 1.08);
      return (
        <img
          src={VERIFIED_IMG}
          alt="Certifié"
          title="Certifié"
          className={cn(
            "h-4 w-4 object-contain will-change-transform",
            className,
          )}
          {...handlers}
        />
      );
    }
    return cfg.icon ? (
      <img
        src={cfg.icon}
        alt={cfg.label}
        className={cn("h-4 w-4 object-contain", className)}
      />
    ) : null;
  }

  if (key === "verified") {
    const handlers = createSmoothTiltHandlers(10, 1.08);
    return (
      <img
        src={VERIFIED_IMG}
        alt="Certifié"
        title="Certifié"
        className={cn(
          "h-4 w-4 object-contain will-change-transform",
          className,
        )}
        {...handlers}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[12px] font-semibold leading-none",
        "min-h-[28px]",
        cfg.className || "",
        className,
      )}
    >
      {cfg.icon ? (
        <img
          src={cfg.icon}
          alt={cfg.label}
          className="h-4 w-4 object-contain"
        />
      ) : null}
      <span className="truncate">{cfg.label}</span>
    </span>
  );
}
