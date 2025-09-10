import { useCallback, useEffect, useMemo, useState } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements, useElements, useStripe, PaymentElement } from "@stripe/react-stripe-js";

const stripePk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

function CheckoutForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: (paymentId: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const onSubmit = useCallback(async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });
      if (error) {
        // eslint-disable-next-line no-console
        console.error("stripe.confirmPayment error", error);
        return;
      }
      if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess(paymentIntent.id);
      }
    } finally {
      setSubmitting(false);
    }
  }, [stripe, elements, onSuccess]);

  return (
    <div className="space-y-3">
      <PaymentElement options={{ layout: "tabs" }} />
      <button
        onClick={onSubmit}
        disabled={!stripe || submitting}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {submitting ? "Traitement…" : "Payer"}
      </button>
    </div>
  );
}

export default function StripeCheckout({
  amount,
  currency = "EUR",
  onSuccess,
}: {
  amount: string;
  currency?: string;
  onSuccess: (paymentId: string) => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    async function createIntent() {
      try {
        setError(null);
        const res = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Number(amount), currency }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { clientSecret: string };
        if (!aborted) setClientSecret(data.clientSecret);
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.error("create-payment-intent failed", e);
        if (!aborted) setError("Paiement indisponible. Réessayez plus tard.");
      }
    }
    createIntent();
    return () => {
      aborted = true;
    };
  }, [amount, currency]);

  const stripePromise = useMemo(() => (stripePk ? loadStripe(stripePk) : null), []);

  if (!stripePk) {
    return (
      <div className="rounded-md border border-border/60 bg-card p-3 text-sm text-foreground/80">
        Stripe non configuré. Ajoutez VITE_STRIPE_PUBLISHABLE_KEY dans les variables d'environnement puis rechargez.
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  if (!clientSecret || !stripePromise) {
    return (
      <div className="flex items-center gap-2 text-sm text-foreground/80">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
        Préparation du paiement…
      </div>
    );
  }

  const options: StripeElementsOptions = { clientSecret, appearance: { theme: "flat" } };
  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm clientSecret={clientSecret} onSuccess={onSuccess} />
    </Elements>
  );
}
