import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Fetch real prices
async function getPrice(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, {
      signal: AbortSignal.timeout(6_000), headers: { "User-Agent": "KLN-LogHub/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null;
  } catch { return null; }
}

// Get dynamic fuel cost (from Heating Oil futures)
async function getFuelCost(): Promise<number> {
  try {
    const ho = await getPrice("HO=F");
    if (ho) return Math.round(ho * 307 * 0.87); // $/tonne VLSFO
  } catch { /* */ }
  return 580;
}

// Dynamic crude discount estimation
// Since no free API for Urals differential, we derive it from:
// 1. Brent-WTI spread (real) as a baseline for inter-grade spreads
// 2. Apply multipliers based on historical relationships
function estimateDiscounts(brent: number, wti: number) {
  const brentWti = brent - wti;

  // Urals typically trades at a discount to Brent
  // The discount widens when Brent-WTI is negative (US crude expensive = less competition)
  // and narrows when Brent premium is large
  // Base Urals discount: ~$8-15 depending on market (post-2022 sanctions regime)
  const uralsBase = 10 + Math.max(0, -brentWti * 0.5);

  // Johan Sverdrup (Norwegian) trades very close to Brent
  const sverdrupBase = 0.3 + Math.abs(brentWti) * 0.1;

  // Arab Light typically $1-3 below Brent for European delivery
  const arabLightBase = 1.5 + Math.max(0, brentWti * 0.2);

  // WTI for export: WTI + export premium (~$1-2)
  const wtiExport = -brentWti + 1.5; // negative = WTI is cheaper

  return {
    urals: Math.round(uralsBase * 10) / 10,
    sverdrup: Math.round(sverdrupBase * 10) / 10,
    arabLight: Math.round(arabLightBase * 10) / 10,
    wtiExport: Math.round(wtiExport * 10) / 10,
    note: `Estimated from Brent-WTI spread ($${brentWti.toFixed(2)}). Urals discount widened post-sanctions. Not exact market quotes.`,
  };
}

function distNm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PORTS: Record<string, { lat: number; lng: number }> = {
  "Primorsk": { lat: 60.35, lng: 29.0 }, "Ust-Luga": { lat: 59.68, lng: 28.4 },
  "Rotterdam": { lat: 51.9, lng: 4.5 }, "Augusta": { lat: 37.22, lng: 15.22 },
  "Gdansk": { lat: 54.4, lng: 18.67 }, "Wilhelmshaven": { lat: 53.5, lng: 8.15 },
  "Mongstad": { lat: 60.8, lng: 5.02 }, "Gothenburg": { lat: 57.7, lng: 11.93 },
  "Ras Tanura": { lat: 26.65, lng: 50.15 }, "Singapore": { lat: 1.26, lng: 103.85 },
  "Houston": { lat: 29.73, lng: -95.2 },
};

export async function GET() {
  try {
    const [brent, wti, fuelCost] = await Promise.all([
      getPrice("BZ=F"), getPrice("CL=F"), getFuelCost(),
    ]);

    if (!brent || !wti) {
      return NextResponse.json({ success: false, error: "Could not fetch prices" }, { status: 500 });
    }

    const discounts = estimateDiscounts(brent, wti);

    // Build routes with DYNAMIC discounts
    const ROUTES = [
      { from: "Primorsk", to: "Rotterdam", discount: discounts.urals, label: "Urals → NW Europe", grade: "Urals" },
      { from: "Primorsk", to: "Augusta", discount: discounts.urals - 1, label: "Urals → Med", grade: "Urals" },
      { from: "Primorsk", to: "Gdansk", discount: discounts.urals + 1, label: "Urals → Poland", grade: "Urals" },
      { from: "Ust-Luga", to: "Rotterdam", discount: discounts.urals, label: "Urals → NW Europe (Ust-Luga)", grade: "Urals" },
      { from: "Ust-Luga", to: "Wilhelmshaven", discount: discounts.urals - 0.5, label: "Urals → Germany", grade: "Urals" },
      { from: "Mongstad", to: "Rotterdam", discount: discounts.sverdrup, label: "Sverdrup → NW Europe", grade: "Johan Sverdrup" },
      { from: "Mongstad", to: "Gothenburg", discount: discounts.sverdrup - 0.1, label: "Sverdrup → Sweden", grade: "Johan Sverdrup" },
      { from: "Ras Tanura", to: "Rotterdam", discount: discounts.arabLight, label: "Arab Light → NW Europe", grade: "Arab Light" },
      { from: "Ras Tanura", to: "Singapore", discount: discounts.arabLight - 1, label: "Arab Light → Asia", grade: "Arab Light" },
      { from: "Houston", to: "Rotterdam", discount: discounts.wtiExport, label: "WTI → NW Europe", grade: "WTI Midland" },
    ];

    const results = ROUTES.map((r) => {
      const origin = PORTS[r.from];
      const dest = PORTS[r.to];
      const dist = Math.round(distNm(origin.lat, origin.lng, dest.lat, dest.lng) * 1.15);

      const seaDays = dist / (13.5 * 24);
      const fuelTotal = seaDays * 45 * fuelCost;
      const portCost = 60000;
      const totalCost = fuelTotal + portCost + seaDays * 8500;
      const barrels = 80000 * 7.33;
      const freightPerBarrel = Math.round((totalCost / barrels) * 100) / 100;

      const netMargin = Math.round((r.discount - freightPerBarrel) * 100) / 100;
      const totalPnL = Math.round(netMargin * barrels);

      return {
        label: r.label, grade: r.grade, from: r.from, to: r.to,
        distance: dist, transitDays: Math.round(seaDays * 10) / 10,
        brentPrice: brent, buyPrice: Math.round((brent - r.discount) * 100) / 100,
        discount: r.discount, freightPerBarrel,
        grossMargin: r.discount,
        netMargin, totalPnL,
        profitable: netMargin > 0, cargoBarrels: Math.round(barrels),
        fuelCostPerTonne: fuelCost,
      };
    });

    results.sort((a, b) => b.netMargin - a.netMargin);

    return NextResponse.json({
      success: true,
      data: {
        routes: results,
        brentPrice: brent,
        wtiPrice: wti,
        fuelCost,
        discounts,
        bestRoute: results[0]?.label ?? "N/A",
        bestMargin: results[0]?.netMargin ?? 0,
        profitableRoutes: results.filter((r) => r.profitable).length,
        totalRoutes: results.length,
        source: "Brent/WTI from Yahoo Finance. Fuel from HO=F. Discounts estimated from Brent-WTI spread.",
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
