import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("[Stripe] STRIPE_SECRET_KEY not set — payment features disabled");
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Plan configuration — EUR pricing
export const PLANS: Record<string, { name: string; price: number; currency: string; interval: "month" | "year"; features: string[] }> = {
  junior_monthly: { name: "InsideOil Junior Trader", price: 1900, currency: "eur", interval: "month", features: ["Live vessel map", "Aircraft tracking", "Weather", "News", "Basic signals"] },
  junior_annual: { name: "InsideOil Junior Trader (Annual)", price: 19000, currency: "eur", interval: "year", features: ["Same as monthly — save 2 months"] },
  trader_monthly: { name: "InsideOil Trader", price: 9900, currency: "eur", interval: "month", features: ["Decision Engine", "Trade Proposals", "Crack Spread", "Calendar", "Backtest", "Alerts"] },
  trader_annual: { name: "InsideOil Trader (Annual)", price: 99000, currency: "eur", interval: "year", features: ["Same as monthly — save 2 months"] },
  professional_monthly: { name: "InsideOil Professional", price: 49900, currency: "eur", interval: "month", features: ["Voyage Calculator", "Dark Fleet", "Arbitrage", "API", "CSV Export"] },
  professional_annual: { name: "InsideOil Professional (Annual)", price: 499000, currency: "eur", interval: "year", features: ["Same as monthly — save 2 months"] },
};
