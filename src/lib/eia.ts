/**
 * EIA — U.S. Energy Information Administration
 * Free public API. Get a key at https://www.eia.gov/opendata/register.php
 *
 * Endpoints used:
 *  - Weekly Petroleum Status Report (crude/gasoline/distillate stocks)
 *  - Strategic Petroleum Reserve (SPR) levels
 *
 * Data is stored in PriceCurve with synthetic instrument names so we don't
 * need a separate table:
 *   EIA_CRUDE_STOCK   — million barrels
 *   EIA_GASOLINE_STOCK
 *   EIA_DISTILLATE_STOCK
 *   EIA_SPR_STOCK
 *   EIA_REFINERY_UTIL — % of capacity
 */

import { db } from "@/lib/db";

const BASE = "https://api.eia.gov/v2";

interface EiaPoint {
  period: string; // YYYY-MM-DD
  value: number;
}

async function fetchSeries(path: string, params: Record<string, string>): Promise<EiaPoint[]> {
  const key = process.env.EIA_API_KEY;
  if (!key) {
    console.warn("[EIA] EIA_API_KEY not set — skipping fetch");
    return [];
  }
  const url = new URL(BASE + path);
  url.searchParams.set("api_key", key);
  url.searchParams.set("frequency", "weekly");
  url.searchParams.set("data[0]", "value");
  url.searchParams.set("sort[0][column]", "period");
  url.searchParams.set("sort[0][direction]", "desc");
  url.searchParams.set("offset", "0");
  url.searchParams.set("length", "12");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "InsideOil/1.0 (+https://www.insideoil.it)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.warn("[EIA]", path, "HTTP", res.status);
      return [];
    }
    const j = await res.json();
    const rows = j?.response?.data ?? [];
    return rows.map((r: { period: string; value: number | string }) => ({
      period: r.period,
      value: Number(r.value),
    })).filter((r: EiaPoint) => Number.isFinite(r.value));
  } catch (e) {
    console.warn("[EIA] fetch error:", e);
    return [];
  }
}

export async function refreshEiaData(): Promise<{ stored: number; series: Record<string, number> }> {
  const fetchedAt = new Date();
  const series: Record<string, EiaPoint[]> = {};

  // Crude oil stocks excluding SPR (WCESTUS1)
  series.EIA_CRUDE_STOCK = await fetchSeries("/petroleum/stoc/wstk/data/", {
    "facets[product][]": "EPC0",
    "facets[duoarea][]": "NUS",
  });
  // Total motor gasoline stocks (WGTSTUS1)
  series.EIA_GASOLINE_STOCK = await fetchSeries("/petroleum/stoc/wstk/data/", {
    "facets[product][]": "EPM0",
    "facets[duoarea][]": "NUS",
  });
  // Distillate fuel oil stocks (WDISTUS1)
  series.EIA_DISTILLATE_STOCK = await fetchSeries("/petroleum/stoc/wstk/data/", {
    "facets[product][]": "EPD0",
    "facets[duoarea][]": "NUS",
  });
  // Strategic Petroleum Reserve stocks
  series.EIA_SPR_STOCK = await fetchSeries("/petroleum/stoc/wstk/data/", {
    "facets[product][]": "EPC0",
    "facets[duoarea][]": "NUS-Z00",
  });
  // Refinery utilization
  series.EIA_REFINERY_UTIL = await fetchSeries("/petroleum/sum/snd/data/", {
    "facets[product][]": "EPXXX2",
    "facets[duoarea][]": "NUS",
  });

  const summary: Record<string, number> = {};
  let stored = 0;
  for (const [instrument, points] of Object.entries(series)) {
    if (points.length === 0) continue;
    summary[instrument] = points[0].value;
    await db.priceCurve.createMany({
      data: points.map((p) => ({
        instrument,
        contractMonth: p.period.slice(0, 7), // YYYY-MM
        price: p.value,
        source: "eia",
        fetchedAt,
      })),
      skipDuplicates: true,
    });
    stored += points.length;
  }
  return { stored, series: summary };
}

export async function getLatestEia(instrument: string): Promise<{ value: number; period: string } | null> {
  const row = await db.priceCurve.findFirst({
    where: { instrument, source: "eia" },
    orderBy: { fetchedAt: "desc" },
    select: { price: true, contractMonth: true },
  });
  if (!row) return null;
  return { value: row.price, period: row.contractMonth };
}

export async function getEiaWeeklySeries(instrument: string, weeks = 12) {
  const rows = await db.priceCurve.findMany({
    where: { instrument, source: "eia" },
    orderBy: { contractMonth: "desc" },
    take: weeks,
  });
  return rows.reverse().map((r) => ({ period: r.contractMonth, value: r.price }));
}
