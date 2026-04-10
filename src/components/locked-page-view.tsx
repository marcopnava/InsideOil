"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TIER_LABEL, TIER_PRICE_MONTHLY, type Tier } from "@/lib/tiers";
import { Card } from "./card";

interface Props {
  required: Tier;
  title: string;
  subtitle: string;
  /** Key features the user gets if they upgrade. */
  features: string[];
  /** Sample screenshot blocks that show what the feature looks like. */
  samples?: Array<{ title: string; rows: Array<[string, string]> }>;
  /** Optional longer description paragraphs. */
  description?: React.ReactNode;
  /** Current user tier — used to show proration hint if they already pay. */
  currentTier?: Tier;
}

export function LockedPageView({
  required,
  title,
  subtitle,
  features,
  samples,
  description,
  currentTier,
}: Props) {
  const alreadyPays = currentTier && currentTier !== "free";
  const upgradeDelta =
    currentTier && currentTier !== "free"
      ? TIER_PRICE_MONTHLY[required] - TIER_PRICE_MONTHLY[currentTier]
      : null;

  return (
    <div className="animate-fade-in max-w-[1400px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
      {/* Hero */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-soft border border-accent/20 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-[10px] font-bold text-accent uppercase tracking-[0.07em]">
            🔒 {TIER_LABEL[required]} feature
          </span>
        </div>
        <h1 className="text-[28px] sm:text-[34px] font-bold tracking-[-0.035em] leading-[1.1]">
          {title}
        </h1>
        <p className="text-[14px] sm:text-[16px] text-text2 mt-3 max-w-[680px] leading-[1.55]">
          {subtitle}
        </p>
      </div>

      {/* CTA banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-bg3 border-2 border-accent rounded-[var(--radius)] p-5 sm:p-6 mb-4 overflow-hidden"
      >
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute -inset-[1px] rounded-[15px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 0% 0%, rgba(232,89,12,0.10), transparent 60%)",
          }}
        />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <div className="text-[9px] font-bold text-text3 uppercase tracking-[0.07em] mb-1">
              {alreadyPays ? "Upgrade to unlock" : "Unlock this feature"}
            </div>
            <div className="text-[18px] sm:text-[22px] font-bold tracking-[-0.025em] leading-tight">
              Upgrade to {TIER_LABEL[required]} — €{TIER_PRICE_MONTHLY[required]}/month
            </div>
            {alreadyPays && upgradeDelta != null && upgradeDelta > 0 && (
              <p className="text-[12px] text-text2 mt-2 leading-[1.5]">
                You&apos;re on <strong className="text-text">{TIER_LABEL[currentTier!]}</strong> — you
                only pay the difference.{" "}
                <strong className="text-accent">
                  Stripe prorates automatically
                </strong>
                : what you&apos;ve already paid for the current period is credited toward the new plan.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/upgrade?required=${required}`}
              className="inline-block px-5 py-2.5 bg-text text-white text-[12px] font-semibold rounded-[var(--radius-xs)] hover:opacity-90 no-underline whitespace-nowrap"
            >
              View plans →
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Feature description + samples grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-3.5">
        {/* What you get */}
        <Card title={`What you'll get with ${TIER_LABEL[required]}`}>
          <ul className="flex flex-col gap-2.5">
            {features.map((f, i) => (
              <li key={i} className="text-[13px] text-text2 flex items-start gap-2.5 leading-[1.55]">
                <span className="text-accent font-bold mt-0.5 shrink-0">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {description && (
            <div className="mt-5 pt-5 border-t border-border text-[12px] text-text2 leading-[1.6] [&_p]:mb-3 [&_strong]:text-text">
              {description}
            </div>
          )}
        </Card>

        {/* Sample output preview */}
        {samples && samples.length > 0 && (
          <div className="flex flex-col gap-3.5">
            {samples.map((s) => (
              <Card key={s.title} title={s.title}>
                <div className="relative">
                  <div className="flex flex-col gap-2 select-none pointer-events-none">
                    {s.rows.map(([k, v], i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center py-1.5 border-b border-border last:border-b-0 text-[12px]"
                      >
                        <span className="text-text2">{k}</span>
                        <span className="font-semibold" style={{ fontFamily: "var(--font-jetbrains)" }}>
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent 40%, rgba(250,250,250,0.85) 100%)",
                    }}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="mt-5 bg-bg3 border border-border rounded-[var(--radius)] p-5 sm:p-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[240px]">
          <div className="text-[13px] text-text font-semibold">
            Ready to unlock {TIER_LABEL[required]}?
          </div>
          <div className="text-[11px] text-text3 mt-1">
            Secure payment by Stripe · Cancel anytime · Instant access after checkout
          </div>
        </div>
        <Link
          href={`/upgrade?required=${required}`}
          className="px-6 py-3 bg-accent text-white text-[13px] font-bold rounded-[var(--radius-xs)] hover:opacity-90 no-underline"
        >
          Upgrade to {TIER_LABEL[required]} →
        </Link>
      </div>
    </div>
  );
}
