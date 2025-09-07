import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="container py-20 text-center">
      <h1 className="font-display text-3xl font-extrabold">{title}</h1>
      <p className="mt-3 text-foreground/70 max-w-xl mx-auto">
        Cette page sera bientôt disponible. Dites-moi quelles sections vous souhaitez et je l'implémenterai.
      </p>
      <div className="mt-6">
        <Button asChild className="bg-gradient-to-r from-primary to-secondary">
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </div>
  );
}
