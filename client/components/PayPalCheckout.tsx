import { useEffect, useRef, useState } from "react";

declare global {
  interface Window { paypal?: any }
}

export default function PayPalCheckout({ amount, currency = "EUR", onSuccess }: { amount: string; currency?: string; onSuccess: (orderId: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (!clientId) return;
    const qs = new URLSearchParams({ "client-id": clientId, currency }).toString();
    const src = `https://www.paypal.com/sdk/js?${qs}`;
    const existing = document.querySelector(`script[src^="https://www.paypal.com/sdk/js"]`) as HTMLScriptElement | null;
    const script = existing ?? Object.assign(document.createElement("script"), { src, async: true, crossOrigin: 'anonymous' as any });
    if (!existing) document.body.appendChild(script);
    const onLoad = () => setReady(true);
    const onError = (e: any) => {
      console.error('PayPal script failed to load', e);
      setReady(false);
    };
    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);
    return () => {
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };
  }, [clientId, currency]);

  useEffect(() => {
    if (!ready || !window.paypal || !ref.current) return;
    const buttons = window.paypal.Buttons({
      style: { layout: "horizontal", color: "blue", shape: "pill", label: "pay" },
      createOrder: (_: any, actions: any) => actions.order.create({
        intent: "CAPTURE",
        application_context: { brand_name: "BrainrotMarket" },
        purchase_units: [{ amount: { value: amount } }],
      }),
      onApprove: async (_: any, actions: any) => {
        try {
          const details = await actions.order.capture();
          onSuccess(details.id);
        } catch (err) {
          console.error('PayPal onApprove error', err);
        }
      },
    });
    try {
      buttons.render(ref.current);
    } catch (err) {
      console.error('PayPal render failed', err);
      setReady(false);
    }
    return () => {
      try { buttons.close(); } catch {}
    };
  }, [ready, amount, currency, onSuccess]);

  if (!clientId) {
    return (
      <div className="rounded-md border border-border/60 bg-card p-3 text-sm text-foreground/80">
        PayPal non configuré. Ajoutez VITE_PAYPAL_CLIENT_ID dans les variables d'environnement puis rechargez.
      </div>
    );
  }

  return <div ref={ref} />;
}
