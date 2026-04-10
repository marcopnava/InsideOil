/**
 * CFTC Commitments of Traders (COT) report.
 * Free, no auth. Updated every Friday for the prior Tuesday.
 *
 * Source URL: https://www.cftc.gov/dea/futures/deacmesf.htm  (HTML report)
 * Or the parsed CSV: https://www.cftc.gov/dea/newcot/c_year.txt (legacy text)
 *
 * Easier modern access via the Socrata API:
 *   https://publicreporting.cftc.gov/resource/jun7-fc8e.json
 *   (Disaggregated, all futures, weekly)
 *
 * We pull the latest few weeks for the WTI / Brent contracts and store
 * Managed Money net positions in PriceCurve as:
 *   COT_WTI_NETLONG    — Managed Money long − short
 *   COT_BRENT_NETLONG
 */

import { db } from "@/lib/db";

const SOCRATA = "https://publicreporting.cftc.gov/resource/jun7-fc8e.json";

interface CotRow {
  report_date_as_yyyy_mm_dd: string;
  market_and_exchange_names: string;
  m_money_positions_long_all: string;
  m_money_positions_short_all: string;
}

async function fetchCotForContract(marketContains: string, weeks = 12): Promise<{ date: string; netLong: number }[]> {
  const url = new URL(SOCRATA);
  url.searchParams.set("$where", `market_and_exchange_names like '%${marketContains}%'`);
  url.searchParams.set("$order", "report_date_as_yyyy_mm_dd DESC");
  url.searchParams.set("$limit", String(weeks));
  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "InsideOil/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return [];
    const rows: CotRow[] = await res.json();
    return rows
      .map((r) => ({
        date: r.report_date_as_yyyy_mm_dd?.slice(0, 10),
        netLong:
          (Number(r.m_money_positions_long_all) || 0) -
          (Number(r.m_money_positions_short_all) || 0),
      }))
      .filter((r) => r.date);
  } catch (e) {
    console.warn("[CFTC] fetch error:", e);
    return [];
  }
}

export async function refreshCftcData(): Promise<{ stored: number; latest: Record<string, number> }> {
  const fetchedAt = new Date();
  const wti = await fetchCotForContract("CRUDE OIL, LIGHT SWEET-NYMEX");
  const brent = await fetchCotForContract("BRENT LAST DAY");

  const latest: Record<string, number> = {};
  let stored = 0;

  if (wti.length > 0) {
    latest.COT_WTI_NETLONG = wti[0].netLong;
    await db.priceCurve.createMany({
      data: wti.map((w) => ({
        instrument: "COT_WTI_NETLONG",
        contractMonth: w.date,
        price: w.netLong,
        source: "cftc",
        fetchedAt,
      })),
      skipDuplicates: true,
    });
    stored += wti.length;
  }

  if (brent.length > 0) {
    latest.COT_BRENT_NETLONG = brent[0].netLong;
    await db.priceCurve.createMany({
      data: brent.map((b) => ({
        instrument: "COT_BRENT_NETLONG",
        contractMonth: b.date,
        price: b.netLong,
        source: "cftc",
        fetchedAt,
      })),
      skipDuplicates: true,
    });
    stored += brent.length;
  }

  return { stored, latest };
}

export async function getLatestCot(instrument: string) {
  const row = await db.priceCurve.findFirst({
    where: { instrument, source: "cftc" },
    orderBy: { contractMonth: "desc" },
    select: { price: true, contractMonth: true },
  });
  if (!row) return null;
  return { value: row.price, date: row.contractMonth };
}

export async function getCotSeries(instrument: string, weeks = 26) {
  const rows = await db.priceCurve.findMany({
    where: { instrument, source: "cftc" },
    orderBy: { contractMonth: "desc" },
    take: weeks,
  });
  return rows.reverse().map((r) => ({ date: r.contractMonth, value: r.price }));
}
