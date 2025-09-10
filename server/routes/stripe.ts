import type { RequestHandler } from "express";
import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;

if (!stripeSecret) {
  // eslint-disable-next-line no-console
  console.warn("STRIPE_SECRET_KEY is not set. Stripe routes will not work until configured.");
}

const stripe = stripeSecret
  ? new Stripe(stripeSecret, {
      apiVersion: "2025-08-27.basil",
    })
  : null;

export const createPaymentIntent: RequestHandler = async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ error: "stripe_not_configured" });

    const { amount, currency = "EUR", metadata } = req.body as {
      amount: number | string;
      currency?: string;
      metadata?: Record<string, string>;
    };

    const amountNumber = typeof amount === "string" ? Number(amount) : amount;
    if (!amountNumber || !isFinite(amountNumber) || amountNumber <= 0)
      return res.status(400).json({ error: "invalid_amount" });

    const cents = Math.round(amountNumber * 100);

    const intent = await stripe.paymentIntents.create({
      amount: cents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata,
    });

    res.json({ clientSecret: intent.client_secret });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("stripe:createPaymentIntent", e);
    res.status(500).json({ error: "server_error" });
  }
};
