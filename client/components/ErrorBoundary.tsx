import React from "react";

type Props = { children: React.ReactNode };

type State = { hasError: boolean; error?: any };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught: ", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-20 text-center">
          <div className="inline-flex items-center rounded-full border border-border/60 bg-card px-3 py-1 text-xs text-foreground/70">
            Erreur d'affichage
          </div>
          <h1 className="mt-3 text-2xl font-display font-extrabold">
            Un problème est survenu
          </h1>
          <p className="mt-2 text-foreground/70">
            Essayez d'actualiser la page. Si le problème persiste, contactez le
            support.
          </p>
          <button
            className="mt-4 rounded-md border border-border/60 bg-muted px-3 py-2 text-sm"
            onClick={() => window.location.reload()}
          >
            Actualiser
          </button>
        </div>
      );
    }
    return this.props.children as any;
  }
}

export default ErrorBoundary;
