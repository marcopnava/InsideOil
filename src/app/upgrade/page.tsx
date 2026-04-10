"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/card";
import { TIER_LABEL, type Tier } from "@/lib/tiers";

interface Profile {
  id: string;
  name: string | null;
  email: string;
  subscriptionTier: string;
  subscriptionEnd: string | null;
}

const REQUIREMENT_COPY: Record<Tier, { title: string; subtitle: string }> = {
  free: { title: "", subtitle: "" },
  junior: {
    title: "Upgrade to Junior Trader",
    subtitle: "The entry plan that unlocks the core InsideOil app.",
  },
  trader: {
    title: "Upgrade to Trader",
    subtitle: "Full Institutional Signals, forward curve, EIA + CFTC, vessel tracks.",
  },
  institutional: {
    title: "Upgrade to Institutional",
    subtitle: "Russia + Dark Fleet tracker, OPEC+ compliance per country, API access.",
  },
};

interface PricingTier {
  id: Tier;
  name: string;
  monthly: { price: string; id: string };
  annual: { price: string; id: string; save: string };
  desc: string;
  features: string[];
  highlight: boolean;
}

const PRICING: PricingTier[] = [
  {
    id: "junior",
    name: "Junior Trader",
    monthly: { price: "19", id: "junior_monthly" },
    annual: { price: "190", id: "junior_annual", save: "38" },
    desc: "For the retail trader getting started",
    features: [
      "Live Command Center",
      "Live global map",
      "Daily Briefing auto-generated",
      "News, Weather, Ports",
      "Trade Intelligence basic",
      "Full Education hub",
      "3 email alerts",
      "Portfolio / trade journal",
      "Economic calendar",
    ],
    highlight: false,
  },
  {
    id: "trader",
    name: "Trader",
    monthly: { price: "99", id: "trader_monthly" },
    annual: { price: "990", id: "trader_annual", save: "198" },
    desc: "For the serious retail and semi-pro trader",
    features: [
      "Everything in Junior",
      "Institutional Signals real-time",
      "Forward curve Brent/WTI/Dubai",
      "BDTI + VLCC TCE",
      "EIA Weekly Petroleum Status",
      "CFTC Commitments of Traders",
      "Vessel detail + live track map",
      "External vessel cross-check",
      "Crude differentials & arbitrage",
      "Unlimited alerts",
    ],
    highlight: true,
  },
  {
    id: "institutional",
    name: "Institutional",
    monthly: { price: "499", id: "institutional_monthly" },
    annual: { price: "4,990", id: "institutional_annual", save: "998" },
    desc: "For family offices, prop desks, specialised funds",
    features: [
      "Everything in Trader",
      "Russia Tanker Tracker",
      "Dark Fleet Detector",
      "OPEC+ compliance per country",
      "Historical data > 30 days",
      "Priority data refresh",
      "API access (JSON)",
      "1-on-1 onboarding call",
      "Priority support",
    ],
    highlight: false,
  },
];

function UpgradeContent() {
  const params = useSearchParams();
  const required = (params.get("required") as Tier | null) ?? null;
  const from = params.get("from") ?? null;
  const [annual, setAnnual] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetch("/api/settings/profile")
      .then((r) => r.json())
      .then((j) => j.success && setProfile(j.data));
  }, []);

  const currentTier = (profile?.subscriptionTier as Tier | undefined) ?? "free";

  return (
    <div className="animate-fade-in max-w-[1200px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
      <div className="mb-6">
        {required ? (
          <>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-soft border border-accent/20 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-[10px] font-bold text-accent uppercase tracking-[0.07em]">Upgrade required</span>
            </div>
            <h1 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.035em] leading-[1.15]">
              {REQUIREMENT_COPY[required].title}
            </h1>
            <p className="text-[14px] sm:text-[16px] text-text2 mt-3 max-w-[640px] leading-[1.6]">
              {REQUIREMENT_COPY[required].subtitle}
              {from && (
                <>
                  {" "}You were trying to access <code className="text-text font-mono text-[12px] bg-bg2 px-1.5 py-[1px] rounded">{from}</code>.
                </>
              )}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.035em]">Upgrade your plan</h1>
            <p className="text-[14px] sm:text-[16px] text-text2 mt-3">
              Choose the plan that fits how you trade.
            </p>
          </>
        )}
        {profile && (
          <div className="text-[11px] text-text3 mt-4">
            Current plan: <span className="font-semibold text-text">{TIER_LABEL[currentTier]}</span>
            {profile.subscriptionEnd && (
              <> · Valid until {new Date(profile.subscriptionEnd).toLocaleDateString("en-GB")}</>
            )}
          </div>
        )}
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
        <span className={`text-[13px] font-medium ${!annual ? "text-text" : "text-text3"}`}>Monthly</span>
        <button
          type="button"
          onClick={() => setAnnual(!annual)}
          className={`relative w-12 h-6 rounded-full cursor-pointer border-none transition-colors ${
            annual ? "bg-text" : "bg-border2"
          }`}
          aria-label="Toggle annual pricing"
        >
          <div
            className="absolute top-[2px] w-5 h-5 rounded-full bg-white shadow-sm transition-transform"
            style={{ transform: `translateX(${annual ? 24 : 2}px)` }}
          />
        </button>
        <span className={`text-[13px] font-medium ${annual ? "text-text" : "text-text3"}`}>
          Annual <span className="text-accent font-semibold text-[11px]">Save 2 months</span>
        </span>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PRICING.map((p) => {
          const isCurrent = currentTier === p.id;
          const isRecommended = required === p.id || (!required && p.highlight);
          const isDowngrade = p.id === "junior" && currentTier === "trader";
          const isUnderCurrent =
            (currentTier === "institutional" && p.id !== "institutional") ||
            (currentTier === "trader" && p.id === "junior");
          const plan = annual ? p.annual : p.monthly;
          const period = annual ? "/year" : "/mo";

          return (
            <Card
              key={p.id}
              title={p.name}
              badge={
                isCurrent
                  ? { text: "Current plan", variant: "dark" }
                  : isRecommended
                    ? { text: "Recommended", variant: "accent" }
                    : undefined
              }
              className={isRecommended ? "ring-2 ring-accent" : ""}
            >
              <div className="flex flex-col h-full">
                <div className="mt-1 mb-1 flex items-baseline flex-wrap">
                  <span className="text-[36px] font-bold tracking-[-0.04em] leading-none">€{plan.price}</span>
                  <span className="text-[14px] text-text3 ml-0.5">{period}</span>
                </div>
                {annual && (
                  <div className="text-[11px] text-accent font-semibold mb-1">
                    Save €{p.annual.save}/year
                  </div>
                )}
                <p className="text-[12px] text-text3 mb-4">{p.desc}</p>
                <ul className="flex flex-col gap-2 mb-5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="text-[12px] text-text2 flex items-start gap-2 leading-[1.45]">
                      <span className="text-accent mt-0.5 shrink-0">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="block text-center py-2.5 rounded-[7px] bg-bg2 text-text3 text-[12px] font-semibold border border-border">
                    Current plan
                  </div>
                ) : isUnderCurrent ? (
                  <a
                    href={`/api/checkout?plan=${plan.id}`}
                    className="block text-center py-2.5 rounded-[7px] bg-bg2 text-text2 text-[12px] font-semibold border border-border hover:bg-bg3 no-underline"
                  >
                    Downgrade
                  </a>
                ) : (
                  <a
                    href={`/api/checkout?plan=${plan.id}`}
                    className={`block text-center py-2.5 rounded-[7px] text-[12px] font-semibold no-underline transition-all ${
                      isRecommended
                        ? "bg-accent text-white hover:opacity-90"
                        : "bg-text text-white hover:opacity-90"
                    }`}
                  >
                    {annual ? `Start ${p.name} — €${p.annual.price}/year` : `Start ${p.name} — €${p.monthly.price}/mo`}
                  </a>
                )}
                {isDowngrade && (
                  <div className="text-[10px] text-text3 mt-2 text-center">
                    You will lose access to Institutional features at renewal.
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 text-center text-[11px] text-text3">
        Secure payment by Stripe. Cancel anytime from Settings → Subscription.
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-text3 text-xs">Loading…</div>}>
        <UpgradeContent />
      </Suspense>
    </AppShell>
  );
}
