import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";

export default function ModerationWarning({
  open,
  reasons,
  onAccept,
  onCancel,
  text,
}: {
  open: boolean;
  reasons?: string[];
  text?: string;
  onAccept: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent>
        <DialogTitle>Contenu potentiellement offensant</DialogTitle>
        <DialogDescription>
          Nous avons détecté que votre contenu peut contenir des insultes ou du
          langage offensant. Veuillez vérifier et accepter pour continuer.
        </DialogDescription>
        <div className="mt-4 text-sm">
          {reasons && reasons.length > 0 && (
            <div className="mb-2">
              <div className="font-semibold">Raisons détectées:</div>
              <ul className="list-disc list-inside mt-1 text-foreground/80">
                {reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {text && (
            <div className="mt-2 text-xs text-foreground/60">
              Aperçu:{" "}
              <span className="italic">
                {text.length > 120 ? text.slice(0, 120) + "…" : text}
              </span>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={onAccept}>Accepter et publier</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
