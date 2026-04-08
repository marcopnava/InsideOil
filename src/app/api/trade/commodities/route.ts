import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Yahoo Finance API (unofficial but free, no key)
// We fetch crude oil futures data
const SYMBOLS = [
  { symbol: "CL=F", name: "WTI Crude Oil", unit: "$/barrel" },
  { symbol: "BZ=F", name: "Brent Crude Oil", unit: "$/barrel" },
  { symbol: "NG=F", name: "Natural Gas", unit: "$/MMBtu" },
  { symbol: "HO=F", name: "Heating Oil", unit: "$/gallon" },
  { symbol: "RB=F", name: "RBOB Gasoline", unit: "$/gallon" },
];

interface PriceData {
  symbol: string;
  name: string;
  unit: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  prevClose: number | null;
  dayHigh: number | null;
  dayLow: number | null;
}

let cache: { data: PriceData[]; spreads: Record<string, number>; ts: number } | null = null;
const TTL = 300_000; // 5min

async function fetchYahooQuote(symbol: string): Promise<{ price: number; change: number; changePct: number; prevClose: number; high: number; low: number } | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`,
      { signal: AbortSignal.timeout(8_000), headers: { "User-Agent": "KLN-LogHub/1.0" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const prevClose = meta.previousClose ?? meta.chartPreviousClose;
    const change = prevClose ? price - prevClose : 0;
    const changePct = prevClose ? (change / prevClose) * 100 : 0;

    const indicators = result.indicators?.quote?.[0];
    const highs = indicators?.high?.filter((v: number | null) => v != null) ?? [];
    const lows = indicators?.low?.filter((v: number | null) => v != null) ?? [];

    return {
      price,
      change: Math.round(change * 100) / 100,
      changePct: Math.round(changePct * 100) / 100,
      prevClose: prevClose ?? price,
      high: highs.length > 0 ? Math.max(...highs) : price,
      low: lows.length > 0 ? Math.min(...lows.filter((v: number) => v > 0)) : price,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < TTL) {
      return NextResponse.json({ success: true, data: cache });
    }

    const results = await Promise.allSettled(
      SYMBOLS.map(async (s) => {
        const quote = await fetchYahooQuote(s.symbol);
        return {
          symbol: s.symbol,
          name: s.name,
          unit: s.unit,
          price: quote?.price ?? null,
          change: quote?.change ?? null,
          changePct: quote?.changePct ?? null,
          prevClose: quote?.prevClose ?? null,
          dayHigh: quote?.high ?? null,
          dayLow: quote?.low ?? null,
        };
      })
    );

    const prices: PriceData[] = results
      .filter((r): r is PromiseFulfilledResult<PriceData> => r.status === "fulfilled")
      .map((r) => r.value);

    // Calculate spreads
    const wti = prices.find((p) => p.symbol === "CL=F")?.price;
    const brent = prices.find((p) => p.symbol === "BZ=F")?.price;
    const spreads: Record<string, number> = {};
    if (wti && brent) {
      spreads["Brent-WTI"] = Math.round((brent - wti) * 100) / 100;
    }

    cache = { data: prices, spreads, ts: Date.now() };

    return NextResponse.json({
      success: true,
      data: {
        prices,
        spreads,
        source: "Yahoo Finance (free, real-time delayed ~15min)",
        lastUpdate: new Date().toISOString(),
      },
    });
  } catch (e) {
    if (cache) return NextResponse.json({ success: true, data: cache });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
