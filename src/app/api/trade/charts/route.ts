import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Fetch historical price data from Yahoo Finance
async function fetchHistory(symbol: string, range: string = "3mo"): Promise<{ dates: string[]; prices: number[] } | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${range}`,
      { signal: AbortSignal.timeout(10_000), headers: { "User-Agent": "KLN-LogHub/1.0" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];

    const dates: string[] = [];
    const prices: number[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] != null) {
        dates.push(new Date(timestamps[i] * 1000).toISOString().split("T")[0]);
        prices.push(Math.round(closes[i] * 100) / 100);
      }
    }

    return { dates, prices };
  } catch {
    return null;
  }
}

let cache: { data: unknown; ts: number } | null = null;
const TTL = 600_000; // 10min

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < TTL) {
      return NextResponse.json({ success: true, data: cache.data });
    }

    const [wti, brent, gasoline, heatingOil, natGas] = await Promise.all([
      fetchHistory("CL=F"),
      fetchHistory("BZ=F"),
      fetchHistory("RB=F"),
      fetchHistory("HO=F"),
      fetchHistory("NG=F"),
    ]);

    // Calculate historical crack spread (3-2-1)
    let crackSpread: { dates: string[]; values: number[] } | null = null;
    if (wti && gasoline && heatingOil) {
      const dates: string[] = [];
      const values: number[] = [];
      // Align by date
      for (let i = 0; i < wti.dates.length; i++) {
        const d = wti.dates[i];
        const gi = gasoline.dates.indexOf(d);
        const hi = heatingOil.dates.indexOf(d);
        if (gi >= 0 && hi >= 0) {
          const crack = (2 * gasoline.prices[gi] * 42 + heatingOil.prices[hi] * 42 - 3 * wti.prices[i]) / 3;
          dates.push(d);
          values.push(Math.round(crack * 100) / 100);
        }
      }
      crackSpread = { dates, values };
    }

    // Brent-WTI spread history
    let brentWtiSpread: { dates: string[]; values: number[] } | null = null;
    if (wti && brent) {
      const dates: string[] = [];
      const values: number[] = [];
      for (let i = 0; i < wti.dates.length; i++) {
        const d = wti.dates[i];
        const bi = brent.dates.indexOf(d);
        if (bi >= 0) {
          dates.push(d);
          values.push(Math.round((brent.prices[bi] - wti.prices[i]) * 100) / 100);
        }
      }
      brentWtiSpread = { dates, values };
    }

    const result = {
      wti, brent, gasoline, heatingOil, natGas,
      crackSpread, brentWtiSpread,
      source: "Yahoo Finance — 3 month daily history",
    };

    cache = { data: result, ts: Date.now() };
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    if (cache) return NextResponse.json({ success: true, data: cache.data });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
