import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = "https://api.frankfurter.app";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cache: any = null;
let lastFetch = 0;
const TTL = 3600_000;

export async function GET() {
  try {
    if (cache && Date.now() - lastFetch < TTL) {
      return NextResponse.json({ success: true, data: cache });
    }

    const latestRes = await fetch(
      `${BASE}/latest?base=USD&symbols=EUR,GBP,CNY,JPY,KRW,SGD,NOK,SEK,DKK,INR,BRL,AED`,
      { signal: AbortSignal.timeout(10_000) }
    );
    const latest = await latestRes.json();
    const newRates = latest.rates || {};

    // Build trends (simple: no historical call to avoid failures)
    const trends: Record<string, { rate: number; change: number; pct: number }> = {};
    for (const [cur, rate] of Object.entries(newRates)) {
      trends[cur] = { rate: rate as number, change: 0, pct: 0 };
    }

    // Try historical for YTD comparison (non-critical)
    try {
      const histRes = await fetch(`${BASE}/2026-01-02?base=USD&symbols=EUR,CNY,GBP,JPY,KRW,SGD`, {
        signal: AbortSignal.timeout(5_000),
      });
      if (histRes.ok) {
        const hist = await histRes.json();
        const oldRates = hist.rates || {};
        for (const [cur, rate] of Object.entries(newRates)) {
          const oldRate = (oldRates as Record<string, number>)[cur];
          if (oldRate) {
            const change = (rate as number) - oldRate;
            trends[cur] = {
              rate: rate as number,
              change: Math.round(change * 10000) / 10000,
              pct: Math.round((change / oldRate) * 10000) / 100,
            };
          }
        }
      }
    } catch { /* historical is optional */ }

    const result = {
      rates: newRates,
      trends,
      base: "USD",
      date: latest.date,
      source: "European Central Bank via Frankfurter API (free)",
    };

    cache = result;
    lastFetch = Date.now();

    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    // Return cached if available
    if (cache) return NextResponse.json({ success: true, data: cache });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
