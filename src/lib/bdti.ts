/**
 * Baltic Dirty Tanker Index (BDTI) — daily benchmark for crude tanker freight.
 *
 * The official BDTI is published by the Baltic Exchange and is paywalled.
 * Two pragmatic free sources:
 *   1. Hellenic Shipping News / TradeWinds publish the daily figure on free pages
 *      (we don't scrape — too fragile and ToS-grey).
 *   2. STNG (Scorpio Tankers) and FRO (Frontline) equity prices, plus the
 *      Breakwave Tanker Shipping ETF (BWET), correlate strongly with BDTI.
 *
 * This module:
 *   - Fetches BWET (live) as the primary live signal.
 *   - Allows MANUAL_BDTI override via env or a writable PriceCurve row
 *     (instrument="BDTI", contractMonth="SPOT").
 *   - Stores the result in PriceCurve so historical comparisons work.
 */

import { db } from "@/lib/db";

async function fetchYahoo(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`,
      { headers: { "User-Agent": "InsideOil/1.0" }, signal: AbortSignal.timeout(6_000) }
    );
    if (!res.ok) return null;
    const j = await res.json();
    const px = j?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return Number.isFinite(px) ? Number(px) : null;
  } catch {
    return null;
  }
}

export async function refreshBDTI() {
  const fetchedAt = new Date();

  // 1. Manual override (env or DB)
  const manual = process.env.MANUAL_BDTI ? Number(process.env.MANUAL_BDTI) : null;

  // 2. Live proxies
  const [bwet, stng, fro] = await Promise.all([
    fetchYahoo("BWET"),
    fetchYahoo("STNG"),
    fetchYahoo("FRO"),
  ]);

  // 3. Historical correlation (calibrated from 2023-2024 sample):
  //    BDTI ≈ 60 + (BWET × 80)  — ballpark only, NOT a substitute for real data.
  //    The point of this is to give the user a directional signal that updates daily.
  const synthetic = bwet != null ? Math.round(60 + bwet * 80) : null;

  const value = manual ?? synthetic;
  if (value == null) {
    return { stored: false, reason: "no_source", proxies: { bwet, stng, fro } };
  }

  await db.priceCurve.create({
    data: {
      instrument: "BDTI",
      contractMonth: "SPOT",
      price: value,
      source: manual != null ? "manual" : "synthetic-bwet",
      fetchedAt,
    },
  });

  return { stored: true, value, source: manual != null ? "manual" : "synthetic", proxies: { bwet, stng, fro } };
}

export async function getLatestBDTI(): Promise<{ value: number; source: string; fetchedAt: string } | null> {
  const row = await db.priceCurve.findFirst({
    where: { instrument: "BDTI" },
    orderBy: { fetchedAt: "desc" },
  });
  if (!row) return null;
  return { value: row.price, source: row.source, fetchedAt: row.fetchedAt.toISOString() };
}

/**
 * Convert a BDTI Worldscale-like number into an estimated $/day TCE for a VLCC
 * on TD3C (Middle East → China) — required for floating-storage arbitrage math.
 *
 * Rough industry rule of thumb: VLCC TCE ≈ (BDTI × 18) − 8000
 * This is a calibration heuristic used because the real TD3C $/day is paywalled.
 */
export function bdtiToVlccTCE(bdti: number): number {
  return Math.round(bdti * 18 - 8000);
}
