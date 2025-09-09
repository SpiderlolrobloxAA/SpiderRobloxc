import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function TosModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const accepted = sessionStorage.getItem("tos_accepted");
      if (accepted !== "1") setOpen(true);
    } catch (e) {
      setOpen(true);
    }
  }, []);

  const accept = () => {
    try {
      sessionStorage.setItem("tos_accepted", "1");
    } catch (e) {}
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
      <DialogContent>
        <DialogTitle>Conditions d'utilisation (T.O.S)</DialogTitle>
        <DialogDescription>
          Veuillez lire et accepter les conditions suivantes pour utiliser ce site. L'acceptation est requise pour accéder au site lors de cette visite.
        </DialogDescription>

        <div className="mt-4 text-sm space-y-3">
          <p>
            1. Nous ne sommes pas responsables des fraudes, escroqueries ou litiges entre vendeurs et acheteurs. Les transactions se font
            directement entre utilisateurs.
          </p>
          <p>
            2. Nous conseillons fortement de privilégier les vendeurs certifiés — ceci indique uniquement qu'ils ont un badge de
            confiance, mais n'offre aucune garantie complète.
          </p>
          <p>
            3. En achetant ou en vendant sur cette plateforme, vous acceptez d'assumer les risques liés aux transactions entre
            utilisateurs. Pour toute contestation, contactez le vendeur ou ouvrez un ticket ; nous fournissons des outils, mais nous
            n'intervenons pas automatiquement.
          </p>
          <p>
            4. L'usage abusif, les contenus illicites ou la violation des règles peut entraîner une suspension de compte.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => window.location.assign("about:blank")}>Refuser</Button>
          <Button onClick={accept}>J'accepte</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
