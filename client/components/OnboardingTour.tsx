import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";

interface Step {
  selector: string;
  title: string;
  body: string;
}

function useElementRect(selector: string) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    function update() {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) return setRect(null);
      const r = el.getBoundingClientRect();
      setRect(r);
    }
    update();
    const id = window.setInterval(update, 300);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [selector]);
  return rect;
}

export default function OnboardingTour() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  // Show only once per device (and per user if connected)
  useEffect(() => {
    const key = user ? `onboarding:v1:${user.uid}` : "onboarding:v1:anon";
    const done = localStorage.getItem(key) === "1";
    if (!done) setOpen(true);
  }, [user]);

  const steps: Step[] = useMemo(
    () => [
      {
        selector: '[data-tour="nav-menu"]',
        title: "Menu",
        body: "Ouvrez le menu pour accéder rapidement aux pages du site.",
      },
      {
        selector: '[data-tour="marketplace-search"]',
        title: "Recherche",
        body: "Cherchez des produits et des vendeurs dans le marketplace.",
      },
      {
        selector: '[data-tour="add-product"]',
        title: "Ajouter un produit",
        body: "Publiez vos brainrots: image convertie en lien CatBox automatiquement.",
      },
      {
        selector: '[data-tour="messages-entry"]',
        title: "Messagerie",
        body: "Discutez avec les acheteurs/vendeurs. Les messages restent dans ce panneau.",
      },
      {
        selector: '[data-tour="shop-entry"]',
        title: "Acheter des RC",
        body: "Accédez à la boutique pour recharger vos RotCoins.",
      },
      {
        selector: '[data-tour="profile-entry"]',
        title: "Profil",
        body: "Gérez votre profil et vos informations.",
      },
      {
        selector: '[data-tour="notifications"]',
        title: "Notifications",
        body: "Recevez des alertes en temps réel pour vos ventes et messages.",
      },
    ],
    [],
  );

  // Skip steps that are not currently visible
  useEffect(() => {
    if (!open) return;
    let idx = i;
    for (let guard = 0; guard < steps.length; guard++) {
      const sel = steps[idx]?.selector;
      if (!sel) break;
      const el = document.querySelector(sel);
      if (el) break;
      idx = (idx + 1) % steps.length;
      if (idx === i) break;
    }
    if (idx !== i) setI(idx);
  }, [open, i, steps, location.pathname]);

  const cur = steps[i];
  const rect = useElementRect(cur?.selector || "");

  if (!open || !cur) return null;
  const saveDone = () => {
    const key = user ? `onboarding:v1:${user.uid}` : "onboarding:v1:anon";
    localStorage.setItem(key, "1");
  };
  const close = () => {
    saveDone();
    setOpen(false);
  };

  const portalRoot = document.body;

  return createPortal(
    <div className="fixed inset-0 z-[150]">
      <div className="absolute inset-0 bg-black/50" onClick={close} />
      {rect && (
        <div
          className="absolute rounded-lg ring-2 ring-primary/80 pointer-events-none"
          style={{
            top: `${rect.top + window.scrollY - 6}px`,
            left: `${rect.left + window.scrollX - 6}px`,
            width: `${rect.width + 12}px`,
            height: `${rect.height + 12}px`,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
          }}
        />
      )}
      {rect && (
        <TooltipCard
          title={cur.title}
          body={cur.body}
          target={rect}
          onPrev={() => setI((v) => (v > 0 ? v - 1 : steps.length - 1))}
          onNext={() => setI((v) => (v + 1) % steps.length)}
          onSkip={close}
          onFinish={close}
          isLast={i === steps.length - 1}
        />
      )}
      {!rect && (
        <div className="absolute left-1/2 top-1/2 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border/60 bg-card p-4 text-sm">
          <div className="text-base font-semibold">Bienvenue 👋</div>
          <div className="mt-2 text-foreground/70">
            Suivez le tutoriel pour découvrir les fonctionnalités principales.
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={close}>
              Skip tout
            </Button>
            <Button onClick={() => setI((v) => (v + 1) % steps.length)}>Suivant</Button>
          </div>
        </div>
      )}
    </div>,
    portalRoot,
  );
}

function TooltipCard({
  title,
  body,
  target,
  onPrev,
  onNext,
  onSkip,
  onFinish,
  isLast,
}: {
  title: string;
  body: string;
  target: DOMRect;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
  onFinish: () => void;
  isLast: boolean;
}) {
  const margin = 12;
  // Default place below target; if near bottom, place above
  const belowTop = target.top + window.scrollY + target.height + margin;
  const aboveTop = target.top + window.scrollY - 140 - margin;
  const left = Math.max(
    12,
    Math.min(
      window.scrollX + target.left + target.width / 2 - 160,
      document.documentElement.scrollWidth - 320 - 12,
    ),
  );
  const top = belowTop + 160 > window.scrollY + window.innerHeight ? aboveTop : belowTop;
  const pointTop = top === belowTop ? top - 8 : target.top + window.scrollY - 8;
  const pointLeft = window.scrollX + target.left + target.width / 2 - 8;

  return (
    <div>
      <div
        className="absolute z-[151] h-4 w-4 rotate-45 bg-card border border-border/60"
        style={{ top: `${pointTop}px`, left: `${pointLeft}px` }}
      />
      <div
        className="absolute z-[152] w-80 rounded-xl border border-border/60 bg-card p-3 shadow-xl"
        style={{ top: `${top}px`, left: `${left}px` }}
      >
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-xs text-foreground/70">{body}</div>
        <div className="mt-3 flex items-center justify-between">
          <button className="text-xs text-foreground/60 hover:underline" onClick={onSkip}>
            Skip tout
          </button>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onPrev}>
              Précédent
            </Button>
            <Button size="sm" onClick={isLast ? onFinish : onNext}>
              {isLast ? "Terminer" : "Suivant"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
