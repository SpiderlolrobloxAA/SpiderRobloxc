import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="container py-24 text-center">
      <div className="inline-flex items-center rounded-full border border-border/60 bg-card px-3 py-1 text-xs text-foreground/70">Erreur 404</div>
      <h1 className="mt-3 text-3xl font-display font-extrabold">Page introuvable</h1>
      <p className="mt-2 text-foreground/70">La page que vous cherchez n'existe pas.</p>
      <a href="/" className="mt-6 inline-block text-primary hover:underline">Retour à l'accueil</a>
    </div>
  );
};

export default NotFound;
