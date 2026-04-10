/**
 * Tier hierarchy and access-check helpers.
 *
 *   free         = no paid access (new signup or cancelled subscription)
 *   junior       = entry plan €19/mo
 *   trader       = main plan €99/mo
 *   institutional = power user €499/mo
 *
 * Access is monotonic: a higher tier sees everything a lower tier sees.
 *
 * This module is used by:
 *   - src/middleware.ts (page-level gating via redirect)
 *   - src/lib/api-tier.ts (API-level gating via 403 JSON)
 *   - src/components/tier-lock.tsx (optional inline upgrade prompt)
 */

export type Tier = "free" | "junior" | "trader" | "institutional";

export const TIER_ORDER: Tier[] = ["free", "junior", "trader", "institutional"];

export const TIER_LABEL: Record<Tier, string> = {
  free: "Free",
  junior: "Junior Trader",
  trader: "Trader",
  institutional: "Institutional",
};

export const TIER_PRICE_MONTHLY: Record<Tier, number> = {
  free: 0,
  junior: 19,
  trader: 99,
  institutional: 499,
};

export function tierRank(t: string | null | undefined): number {
  if (!t) return 0;
  const idx = TIER_ORDER.indexOf(t as Tier);
  return idx < 0 ? 0 : idx;
}

export function hasTierAccess(userTier: string | null | undefined, required: Tier): boolean {
  return tierRank(userTier) >= tierRank(required);
}

/**
 * Determine the minimum tier required for a given pathname.
 * Returns null if the path is open to any authenticated user.
 */
export function requiredTierForPath(pathname: string): Tier | null {
  // Institutional-only
  if (pathname.startsWith("/russia")) return "institutional";

  // Trader and above
  if (
    pathname.startsWith("/signals") ||
    pathname.startsWith("/differentials") ||
    pathname.startsWith("/vessels")
  ) {
    return "trader";
  }

  // Junior and above — the core app
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/briefing") ||
    pathname.startsWith("/tracking") ||
    pathname.startsWith("/trade") ||
    pathname.startsWith("/portfolio") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/ports") ||
    pathname.startsWith("/weather") ||
    pathname.startsWith("/news") ||
    pathname.startsWith("/shipments") ||
    pathname.startsWith("/forecast") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/tools") ||
    pathname.startsWith("/watchlist") ||
    pathname.startsWith("/alerts")
  ) {
    return "junior";
  }

  // Open to any authenticated user (no paid tier needed)
  //   /education, /settings, /upgrade
  return null;
}

/**
 * Mirror of requiredTierForPath for API routes.
 */
export function requiredTierForApi(pathname: string): Tier | null {
  if (pathname.startsWith("/api/russia")) return "institutional";
  if (
    pathname.startsWith("/api/signals") ||
    pathname.startsWith("/api/differentials") ||
    pathname.startsWith("/api/vessels/") ||
    pathname.startsWith("/api/curve")
  ) {
    return "trader";
  }
  if (
    pathname.startsWith("/api/ais") ||
    pathname.startsWith("/api/aircraft") ||
    pathname.startsWith("/api/trade") ||
    pathname.startsWith("/api/morning-brief") ||
    pathname.startsWith("/api/calendar") ||
    pathname.startsWith("/api/journal") ||
    pathname.startsWith("/api/alerts") ||
    pathname.startsWith("/api/news") ||
    pathname.startsWith("/api/weather") ||
    pathname.startsWith("/api/ports") ||
    pathname.startsWith("/api/stats") ||
    pathname.startsWith("/api/notifications")
  ) {
    return "junior";
  }
  return null;
}

/**
 * A subscription is active if tier != free AND (no subscriptionEnd OR end > now).
 * Call this wherever you read user tier.
 */
export function isSubscriptionActive(
  tier: string | null | undefined,
  end: Date | string | null | undefined
): boolean {
  if (!tier || tier === "free") return false;
  if (!end) return true;
  const endDate = end instanceof Date ? end : new Date(end);
  return endDate.getTime() > Date.now();
}
