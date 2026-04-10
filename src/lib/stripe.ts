import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("[Stripe] STRIPE_SECRET_KEY not set — payment features disabled");
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Plan configuration — EUR pricing (annual = monthly × 10, save 2 months)
export const PLANS: Record<string, { name: string; price: number; currency: string; interval: "month" | "year"; features: string[] }> = {
  junior_monthly: {
    name: "InsideOil Junior Trader",
    price: 1900, currency: "eur", interval: "month",
    features: ["Command Center", "Live Map", "News / Weather / Ports", "Education hub", "3 email alerts"],
  },
  junior_annual: {
    name: "InsideOil Junior Trader (Annual)",
    price: 19000, currency: "eur", interval: "year",
    features: ["Same as monthly — save 2 months"],
  },
  trader_monthly: {
    name: "InsideOil Trader",
    price: 9900, currency: "eur", interval: "month",
    features: ["Institutional Signals", "EIA + CFTC", "Forward Curve", "Vessel tracks", "Unlimited alerts"],
  },
  trader_annual: {
    name: "InsideOil Trader (Annual)",
    price: 99000, currency: "eur", interval: "year",
    features: ["Same as monthly — save 2 months"],
  },
  institutional_monthly: {
    name: "InsideOil Institutional",
    price: 49900, currency: "eur", interval: "month",
    features: ["Russia + Dark Fleet", "OPEC+ Compliance", "API access", "Priority refresh", "1:1 onboarding"],
  },
  institutional_annual: {
    name: "InsideOil Institutional (Annual)",
    price: 499000, currency: "eur", interval: "year",
    features: ["Same as monthly — save 2 months"],
  },
  // Legacy aliases kept for backward compatibility with old signup links
  professional_monthly: {
    name: "InsideOil Institutional",
    price: 49900, currency: "eur", interval: "month",
    features: ["Russia + Dark Fleet", "OPEC+ Compliance", "API access", "Priority refresh", "1:1 onboarding"],
  },
  professional_annual: {
    name: "InsideOil Institutional (Annual)",
    price: 499000, currency: "eur", interval: "year",
    features: ["Same as monthly — save 2 months"],
  },
};
