/**
 * Forward curve fetcher (Brent / WTI / RBOB / HO).
 *
 * Uses Yahoo Finance futures contract symbols. Yahoo encodes individual
 * monthly contracts as `<root><month-letter><year-2-digit>.<exchange>`.
 *
 * Month letters: F=Jan G=Feb H=Mar J=Apr K=May M=Jun N=Jul Q=Aug U=Sep V=Oct X=Nov Z=Dec
 *
 * Roots used here:
 *   CL = WTI Crude     (NYMEX)
 *   BZ = Brent Crude   (NYMEX-listed clone, follows ICE Brent)
 *   RB = RBOB Gasoline (NYMEX)
 *   HO = Heating Oil / ULSD (NYMEX)
 *
 * NOTE: "Dubai" crude does not have a free Yahoo symbol. We approximate the
 * Dubai curve from Brent minus a static EFS spread (Brent–Dubai swap).
 * The EFS can be overridden later via env var or a manual price entry.
 */

import { db } from "@/lib/db";

const MONTH_LETTERS = ["F", "G", "H", "J", "K", "M", "N", "Q", "U", "V", "X", "Z"];

export interface CurvePoint {
  contractMonth: string; // YYYY-MM
  price: number;
}

function buildFuturesSymbols(root: string, monthsAhead: number): { symbol: string; contractMonth: string }[] {
  const out: { symbol: string; contractMonth: string }[] = [];
  const now = new Date();
  for (let i = 0; i < monthsAhead; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    const m = d.getUTCMonth();
    const y = d.getUTCFullYear() % 100;
    const symbol = `${root}${MONTH_LETTERS[m]}${y.toString().padStart(2, "0")}.NYM`;
    const contractMonth = `${d.getUTCFullYear()}-${String(m + 1).padStart(2, "0")}`;
    out.push({ symbol, contractMonth });
  }
  return out;
}

async function fetchYahooClose(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`,
      { headers: { "User-Agent": "InsideOil/1.0" }, signal: AbortSignal.timeout(6_000) }
    );
    if (!res.ok) return null;
    const j = await res.json();
    const meta = j?.chart?.result?.[0]?.meta;
    const px = meta?.regularMarketPrice ?? meta?.previousClose ?? meta?.chartPreviousClose;
    return Number.isFinite(px) ? Number(px) : null;
  } catch {
    return null;
  }
}

export async function fetchForwardCurve(root: "CL" | "BZ" | "RB" | "HO", monthsAhead = 12): Promise<CurvePoint[]> {
  const symbols = buildFuturesSymbols(root, monthsAhead);
  const out: CurvePoint[] = [];
  for (const { symbol, contractMonth } of symbols) {
    const price = await fetchYahooClose(symbol);
    if (price != null) out.push({ contractMonth, price });
  }
  return out;
}

const INSTRUMENT_MAP: Record<string, "CL" | "BZ" | "RB" | "HO"> = {
  WTI: "CL",
  BRENT: "BZ",
  RBOB: "RB",
  HO: "HO",
};

export async function refreshForwardCurves(monthsAhead = 12) {
  const fetchedAt = new Date();
  const results: Record<string, number> = {};
  for (const [instrument, root] of Object.entries(INSTRUMENT_MAP)) {
    const curve = await fetchForwardCurve(root, monthsAhead);
    if (curve.length === 0) {
      results[instrument] = 0;
      continue;
    }
    await db.priceCurve.createMany({
      data: curve.map((p) => ({
        instrument,
        contractMonth: p.contractMonth,
        price: p.price,
        source: "yahoo",
        fetchedAt,
      })),
      skipDuplicates: true,
    });
    results[instrument] = curve.length;
  }

  // Synthetic Dubai curve = Brent − EFS (default $2/bbl, override via env)
  const efs = Number(process.env.BRENT_DUBAI_EFS ?? "2");
  const brent = await db.priceCurve.findMany({
    where: { instrument: "BRENT", fetchedAt },
    orderBy: { contractMonth: "asc" },
  });
  if (brent.length > 0) {
    await db.priceCurve.createMany({
      data: brent.map((p) => ({
        instrument: "DUBAI",
        contractMonth: p.contractMonth,
        price: Math.round((p.price - efs) * 100) / 100,
        source: "synthetic-brent-efs",
        fetchedAt,
      })),
      skipDuplicates: true,
    });
    results["DUBAI"] = brent.length;
  }
  return { fetchedAt: fetchedAt.toISOString(), counts: results };
}

export async function getLatestCurve(instrument: string): Promise<CurvePoint[]> {
  const latest = await db.priceCurve.findFirst({
    where: { instrument },
    orderBy: { fetchedAt: "desc" },
    select: { fetchedAt: true },
  });
  if (!latest) return [];
  const rows = await db.priceCurve.findMany({
    where: { instrument, fetchedAt: latest.fetchedAt },
    orderBy: { contractMonth: "asc" },
  });
  return rows.map((r) => ({ contractMonth: r.contractMonth, price: r.price }));
}

/** Detect contango/backwardation structure from a curve. */
export function curveStructure(curve: CurvePoint[]): {
  shape: "contango" | "backwardation" | "flat";
  m1: number;
  m6: number;
  m12: number | null;
  spread6m: number;
  spread12m: number | null;
} {
  if (curve.length < 2) return { shape: "flat", m1: 0, m6: 0, m12: null, spread6m: 0, spread12m: null };
  const m1 = curve[0].price;
  const m6 = curve[Math.min(5, curve.length - 1)].price;
  const m12 = curve.length >= 12 ? curve[11].price : null;
  const spread6m = Math.round((m6 - m1) * 100) / 100;
  const spread12m = m12 != null ? Math.round((m12 - m1) * 100) / 100 : null;
  const shape: "contango" | "backwardation" | "flat" =
    Math.abs(spread6m) < 0.2 ? "flat" : spread6m > 0 ? "contango" : "backwardation";
  return { shape, m1, m6, m12, spread6m, spread12m };
}
