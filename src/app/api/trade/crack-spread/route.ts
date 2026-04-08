import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Fetches current prices and calculates refinery margins
async function getPrice(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      { signal: AbortSignal.timeout(6_000), headers: { "User-Agent": "KLN-LogHub/1.0" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null;
  } catch { return null; }
}

let cache: { data: unknown; ts: number } | null = null;
const TTL = 300_000;

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < TTL) {
      return NextResponse.json({ success: true, data: cache.data });
    }

    const [wti, brent, gasoline, heatingOil, natGas] = await Promise.all([
      getPrice("CL=F"),
      getPrice("BZ=F"),
      getPrice("RB=F"),
      getPrice("HO=F"),
      getPrice("NG=F"),
    ]);

    // Convert gasoline and heating oil from $/gallon to $/barrel (42 gallons per barrel)
    const gasBbl = gasoline ? gasoline * 42 : null;
    const hoBbl = heatingOil ? heatingOil * 42 : null;

    // 3-2-1 Crack Spread (most common)
    // = (2 * gasoline_bbl + 1 * heating_oil_bbl - 3 * crude_bbl) / 3
    const crack321WTI = gasBbl && hoBbl && wti
      ? Math.round(((2 * gasBbl + hoBbl - 3 * wti) / 3) * 100) / 100
      : null;
    const crack321Brent = gasBbl && hoBbl && brent
      ? Math.round(((2 * gasBbl + hoBbl - 3 * brent) / 3) * 100) / 100
      : null;

    // Simple gasoline crack
    const gasCrackWTI = gasBbl && wti ? Math.round((gasBbl - wti) * 100) / 100 : null;
    const gasCrackBrent = gasBbl && brent ? Math.round((gasBbl - brent) * 100) / 100 : null;

    // Heating oil crack
    const hoCrackWTI = hoBbl && wti ? Math.round((hoBbl - wti) * 100) / 100 : null;
    const hoCrackBrent = hoBbl && brent ? Math.round((hoBbl - brent) * 100) / 100 : null;

    // Brent-WTI spread
    const brentWtiSpread = brent && wti ? Math.round((brent - wti) * 100) / 100 : null;

    // Interpretation
    const crackAssessment = crack321WTI != null
      ? crack321WTI > 30 ? "Very strong refinery margins — refineries buying crude aggressively. Bullish crude demand."
        : crack321WTI > 20 ? "Healthy margins — normal refinery operations. Steady crude demand."
        : crack321WTI > 10 ? "Moderate margins — some refineries may reduce runs. Slight demand risk."
        : "Weak margins — refineries cutting throughput. Bearish for crude demand."
      : null;

    const result = {
      prices: {
        wti, brent, gasoline, heatingOil, natGas,
        gasolinePerBarrel: gasBbl ? Math.round(gasBbl * 100) / 100 : null,
        heatingOilPerBarrel: hoBbl ? Math.round(hoBbl * 100) / 100 : null,
      },
      spreads: {
        crack321WTI, crack321Brent,
        gasolineCrackWTI: gasCrackWTI, gasolineCrackBrent: gasCrackBrent,
        heatingOilCrackWTI: hoCrackWTI, heatingOilCrackBrent: hoCrackBrent,
        brentWTI: brentWtiSpread,
      },
      assessment: crackAssessment,
      sentiment: crack321WTI != null
        ? crack321WTI > 25 ? "bullish" : crack321WTI > 15 ? "neutral" : "bearish"
        : "neutral",
      source: "Yahoo Finance — real-time (15min delay)",
    };

    cache = { data: result, ts: Date.now() };
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    if (cache) return NextResponse.json({ success: true, data: cache.data });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
