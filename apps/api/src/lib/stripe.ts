import Stripe from "stripe";

import type { AppConfig } from "../config.js";

export function createStripeClient(config: AppConfig): Stripe | null {
  if (!config.STRIPE_SECRET_KEY) {
    return null;
  }

  return new Stripe(config.STRIPE_SECRET_KEY, {
    apiVersion: config.STRIPE_API_VERSION as Stripe.LatestApiVersion
  });
}

export function priceIdForPlan(config: AppConfig, plan: "pro" | "team" | "enterprise"): string | null {
  switch (plan) {
    case "pro":
      return config.STRIPE_PRICE_PRO ?? null;
    case "team":
      return config.STRIPE_PRICE_TEAM ?? null;
    case "enterprise":
      return config.STRIPE_PRICE_ENTERPRISE ?? null;
    default:
      return null;
  }
}
