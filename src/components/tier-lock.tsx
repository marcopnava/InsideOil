"use client";

import Link from "next/link";
import { TIER_LABEL, type Tier } from "@/lib/tiers";

interface Props {
  required: Tier;
  feature?: string;
  children?: React.ReactNode;
  /** Show a small inline badge instead of a full card. */
  compact?: boolean;
}

/**
 * Inline paywall card. Use when a feature should be visible in the layout but
 * the current user's tier is insufficient — hide the content behind this.
 *
 * Example:
 *   {hasAccess
 *     ? <RussiaTracker data={...} />
 *     : <TierLock required="institutional" feature="Russia Tanker Tracker" />}
 */
export function TierLock({ required, feature, children, compact }: Props) {
  if (compact) {
    return (
      <Link
        href={`/upgrade?required=${required}`}
        className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded-full bg-accent-soft text-accent text-[10px] font-bold uppercase tracking-[0.06em] no-underline hover:bg-accent hover:text-white transition-colors"
      >
        🔒 {TIER_LABEL[required]}
      </Link>
    );
  }

  return (
    <div className="relative bg-bg3 border border-border rounded-[var(--radius)] p-6 sm:p-8 text-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent-soft/30 via-transparent to-transparent pointer-events-none" />
      <div className="relative">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-soft border border-accent/20 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-[10px] font-bold text-accent uppercase tracking-[0.08em]">
            {TIER_LABEL[required]} feature
          </span>
        </div>
        <h3 className="text-[18px] sm:text-[22px] font-bold tracking-[-0.02em] text-text leading-tight">
          {feature ? feature : "This feature requires an upgrade"}
        </h3>
        <p className="text-[12px] sm:text-[13px] text-text2 mt-2 max-w-[440px] mx-auto leading-[1.55]">
          {children ?? `Upgrade to ${TIER_LABEL[required]} to unlock this feature and all other premium signals.`}
        </p>
        <Link
          href={`/upgrade?required=${required}`}
          className="inline-block mt-5 px-5 py-2.5 bg-text text-white text-[12px] font-semibold rounded-[var(--radius-xs)] hover:opacity-90 no-underline"
        >
          Upgrade to {TIER_LABEL[required]} →
        </Link>
      </div>
    </div>
  );
}
