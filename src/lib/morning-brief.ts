/**
 * Morning Brief generator.
 *
 * Aggregates the last 24 hours of data into a short human-readable summary,
 * equivalent to what a physical crude desk reads from Platts Oil Telegram
 * or Argus Daily in the morning — but generated automatically from our
 * free data feeds.
 *
 * Sections:
 *   1. Price moves (Brent, WTI, Brent-WTI spread, Crack)
 *   2. Curve structure (contango/backwardation)
 *   3. Freight (BDTI, VLCC TCE)
 *   4. Fleet activity (chokepoint flow anomalies, storage ratio)
 *   5. Notable headlines (top 3-5 from oil news)
 *   6. Today's catalysts (upcoming events in next 24h)
 */

import { db } from "@/lib/db";
import { getLatestCurve, curveStructure } from "@/lib/forward-curve";
import { getLatestBDTI, bdtiToVlccTCE } from "@/lib/bdti";
import { getUpcomingEvents } from "@/lib/events-calendar";

export interface BriefSection {
  title: string;
  bullets: string[];
  sentiment?: "bullish" | "bearish" | "neutral";
}

export interface MorningBrief {
  generatedAt: string;
  overallTone: "bullish" | "bearish" | "neutral" | "mixed";
  oneLineSummary: string;
  sections: BriefSection[];
}

export async function generateMorningBrief(): Promise<MorningBrief> {
  const sections: BriefSection[] = [];
  let bullishPoints = 0;
  let bearishPoints = 0;

  // 1. Price moves
  const [brentCurve, wtiCurve, bdti] = await Promise.all([
    getLatestCurve("BRENT"),
    getLatestCurve("WTI"),
    getLatestBDTI(),
  ]);
  const brent = brentCurve[0]?.price ?? null;
  const wti = wtiCurve[0]?.price ?? null;
  const brentYesterday = await priceYesterday("BRENT");
  const wtiYesterday = await priceYesterday("WTI");

  if (brent != null && wti != null) {
    const brentChg = brentYesterday != null ? brent - brentYesterday : null;
    const wtiChg = wtiYesterday != null ? wti - wtiYesterday : null;
    const brentWti = Math.round((brent - wti) * 100) / 100;
    sections.push({
      title: "Price action",
      bullets: [
        `Brent at $${brent.toFixed(2)}${brentChg != null ? ` (${brentChg >= 0 ? "+" : ""}${brentChg.toFixed(2)} vs yesterday)` : ""}`,
        `WTI at $${wti.toFixed(2)}${wtiChg != null ? ` (${wtiChg >= 0 ? "+" : ""}${wtiChg.toFixed(2)} vs yesterday)` : ""}`,
        `Brent-WTI spread at $${brentWti.toFixed(2)}`,
      ],
    });
    if (brentChg != null && brentChg > 0.5) bullishPoints++;
    if (brentChg != null && brentChg < -0.5) bearishPoints++;
  }

  // 2. Curve structure
  if (brentCurve.length >= 6) {
    const struct = curveStructure(brentCurve);
    const sentiment =
      struct.shape === "backwardation" ? "bullish" : struct.shape === "contango" ? "bearish" : "neutral";
    sections.push({
      title: "Forward curve",
      sentiment,
      bullets: [
        `Brent curve: ${struct.shape.toUpperCase()} — 6-month spread $${struct.spread6m.toFixed(2)}/bbl`,
        struct.shape === "backwardation"
          ? "Backwardation indicates physical market is tight — structurally bullish for spot prices."
          : struct.shape === "contango"
            ? "Contango means oversupply — bearish structural signal."
            : "Curve is flat — no strong signal either way.",
      ],
    });
    if (sentiment === "bullish") bullishPoints++;
    if (sentiment === "bearish") bearishPoints++;
  }

  // 3. Freight
  if (bdti) {
    const tce = bdtiToVlccTCE(bdti.value);
    sections.push({
      title: "Freight market",
      bullets: [
        `BDTI at ${bdti.value.toLocaleString()} (${bdti.source})`,
        `Implied VLCC TCE ≈ $${tce.toLocaleString()}/day`,
        tce > 100_000
          ? "Extreme tanker rates — freight squeeze signals physical tightness in crude markets."
          : tce > 50_000
            ? "Elevated tanker rates — normal for tight physical market."
            : "Moderate freight rates — no unusual signal.",
      ],
    });
    if (tce > 100_000) bullishPoints++;
  }

  // 4. Fleet activity from latest signal snapshot
  const snap = await db.signalSnapshot.findFirst({
    where: { type: "COMPOSITE" },
    orderBy: { generatedAt: "desc" },
  });
  if (snap) {
    const payload = snap.payload as Record<string, unknown>;
    const storage = payload.storage as { totals?: { candidatesAll?: number; vlcc?: number } } | undefined;
    const chokepoints = payload.chokepoints as
      | { globalAlerts?: string[]; chokepoints?: Array<{ name: string; changePct: number; status: string }> }
      | undefined;

    const bullets: string[] = [];
    if (storage?.totals?.candidatesAll != null) {
      bullets.push(
        `Floating storage: ${storage.totals.candidatesAll} tanker candidates (${storage.totals.vlcc ?? 0} VLCC class)`
      );
    }
    const anomalies = chokepoints?.chokepoints?.filter((c) => c.status === "depressed" || c.status === "elevated");
    if (anomalies && anomalies.length > 0) {
      for (const a of anomalies.slice(0, 2)) {
        bullets.push(
          `${a.name}: transit ${a.changePct > 0 ? "+" : ""}${a.changePct}% vs 7-day average — ${a.status.toUpperCase()}`
        );
        if (a.status === "depressed") bullishPoints++;
        if (a.status === "elevated") bearishPoints++;
      }
    } else {
      bullets.push("No chokepoint anomalies detected in the last 24h.");
    }
    if (bullets.length > 0) {
      sections.push({ title: "Fleet & chokepoints", bullets });
    }
  }

  // 5. Top headlines
  try {
    const newsRes = await fetch(
      typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/news`
        : "https://www.insideoil.it/api/news",
      { cache: "no-store", signal: AbortSignal.timeout(10_000) }
    );
    if (newsRes.ok) {
      const j = await newsRes.json();
      const items: Array<{ title: string; source: string }> = Array.isArray(j) ? j : (j.data ?? []);
      const oilNews = items
        .filter((n) =>
          ["oil", "crude", "tanker", "opec", "brent", "wti", "refinery", "pipeline"].some((k) =>
            n.title?.toLowerCase().includes(k)
          )
        )
        .slice(0, 5);
      if (oilNews.length > 0) {
        sections.push({
          title: "Headlines overnight",
          bullets: oilNews.map((n) => `${n.title} (${n.source})`),
        });
      }
    }
  } catch {
    // news fetch optional
  }

  // 6. Today's catalysts
  const events = getUpcomingEvents(2).slice(0, 5);
  if (events.length > 0) {
    sections.push({
      title: "Catalysts in the next 48h",
      bullets: events.map(
        (e) =>
          `${e.at.toLocaleString("en-GB", {
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Rome",
          })} CET — ${e.title} (${e.impact} impact)`
      ),
    });
  }

  // Decide overall tone
  let overallTone: MorningBrief["overallTone"] = "neutral";
  if (bullishPoints > bearishPoints + 1) overallTone = "bullish";
  else if (bearishPoints > bullishPoints + 1) overallTone = "bearish";
  else if (bullishPoints > 0 && bearishPoints > 0) overallTone = "mixed";

  // One-line summary
  const brentStr = brent != null ? `Brent $${brent.toFixed(2)}` : "Brent —";
  const summary =
    overallTone === "bullish"
      ? `${brentStr}. Bullish signals dominate overnight data: watch for continuation.`
      : overallTone === "bearish"
        ? `${brentStr}. Bearish signals dominate: fleet + curve + freight align to the downside.`
        : overallTone === "mixed"
          ? `${brentStr}. Mixed signals: curve and freight disagree, wait for confirmation.`
          : `${brentStr}. No strong directional signal overnight — balanced market.`;

  return {
    generatedAt: new Date().toISOString(),
    overallTone,
    oneLineSummary: summary,
    sections,
  };
}

async function priceYesterday(instrument: string): Promise<number | null> {
  const yesterday = new Date(Date.now() - 24 * 3600_000);
  const row = await db.priceCurve.findFirst({
    where: { instrument, fetchedAt: { lte: yesterday } },
    orderBy: { fetchedAt: "desc" },
    select: { price: true },
  });
  return row?.price ?? null;
}
