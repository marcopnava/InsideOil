import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PORTS: Record<string, { lat: number; lng: number; region: string; type: string; portCost: number }> = {
  "Primorsk": { lat: 60.35, lng: 29.0, region: "Baltic", type: "Loading", portCost: 35000 },
  "Ust-Luga": { lat: 59.68, lng: 28.4, region: "Baltic", type: "Loading", portCost: 30000 },
  "Rotterdam": { lat: 51.9, lng: 4.5, region: "NW Europe", type: "Discharge", portCost: 45000 },
  "Gothenburg": { lat: 57.7, lng: 11.93, region: "Scandinavia", type: "Discharge", portCost: 28000 },
  "Gdansk": { lat: 54.4, lng: 18.67, region: "Baltic", type: "Discharge", portCost: 22000 },
  "Wilhelmshaven": { lat: 53.5, lng: 8.15, region: "NW Europe", type: "Discharge", portCost: 38000 },
  "Port Said": { lat: 31.26, lng: 32.3, region: "Suez", type: "Transit", portCost: 55000 },
  "Fujairah": { lat: 25.12, lng: 56.35, region: "Middle East", type: "Loading/Storage", portCost: 25000 },
  "Ras Tanura": { lat: 26.65, lng: 50.15, region: "Middle East", type: "Loading", portCost: 20000 },
  "Singapore": { lat: 1.26, lng: 103.85, region: "Asia", type: "Bunkering/Transit", portCost: 30000 },
  "Houston": { lat: 29.73, lng: -95.2, region: "US Gulf", type: "Loading/Discharge", portCost: 50000 },
  "Sidi Kerir": { lat: 31.13, lng: 29.78, region: "Med", type: "Loading (SUMED)", portCost: 28000 },
  "Augusta": { lat: 37.22, lng: 15.22, region: "Med", type: "Discharge/Refining", portCost: 25000 },
  "Skaw": { lat: 57.72, lng: 10.58, region: "Baltic Exit", type: "Reporting/STS", portCost: 5000 },
  "Mongstad": { lat: 60.8, lng: 5.02, region: "Norway", type: "Loading/Refining", portCost: 30000 },
};

function distanceNm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Get REAL fuel price from Heating Oil futures
// VLSFO ≈ Heating Oil price × 307 gallons/tonne × 0.87 discount factor
async function getDynamicFuelPrice(): Promise<{ pricePerTonne: number; source: string }> {
  try {
    const res = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/HO=F?interval=1d&range=1d", {
      signal: AbortSignal.timeout(6_000), headers: { "User-Agent": "KLN-LogHub/1.0" },
    });
    if (!res.ok) throw new Error("Failed");
    const data = await res.json();
    const hoPrice = data?.chart?.result?.[0]?.meta?.regularMarketPrice; // $/gallon
    if (hoPrice) {
      // Convert: $/gallon → $/tonne. 1 tonne VLSFO ≈ 307 gallons, VLSFO trades at ~87% of HO
      const vlsfo = Math.round(hoPrice * 307 * 0.87);
      return { pricePerTonne: vlsfo, source: `Derived from HO=F ($${hoPrice.toFixed(4)}/gal) — real-time` };
    }
  } catch { /* fallback */ }
  return { pricePerTonne: 580, source: "Fallback estimate" };
}

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ success: true, data: { ports: Object.entries(PORTS).map(([name, p]) => ({ name, ...p })) } });
  }

  const origin = PORTS[from];
  const dest = PORTS[to];
  if (!origin || !dest) {
    return NextResponse.json({ success: false, error: "Unknown port" }, { status: 400 });
  }

  // Get DYNAMIC fuel price
  const fuel = await getDynamicFuelPrice();

  const distance = Math.round(distanceNm(origin.lat, origin.lng, dest.lat, dest.lng));
  const routedDistance = Math.round(distance * 1.15);

  const speedLoaded = 13.5;
  const speedBallast = 14.5;
  const fuelConsLoaded = 45; // tonnes/day
  const fuelConsBallast = 40;
  const cargoCapacity = 80000;
  const dailyOpex = 8500;

  const seaDaysLoaded = Math.round((routedDistance / (speedLoaded * 24)) * 10) / 10;
  const seaDaysBallast = Math.round((routedDistance / (speedBallast * 24)) * 10) / 10;
  const portDays = 4;
  const totalVoyageDays = Math.round((seaDaysLoaded + seaDaysBallast + portDays) * 10) / 10;

  const fuelCostLoaded = Math.round(seaDaysLoaded * fuelConsLoaded * fuel.pricePerTonne);
  const fuelCostBallast = Math.round(seaDaysBallast * fuelConsBallast * fuel.pricePerTonne);
  const totalFuelCost = fuelCostLoaded + fuelCostBallast;
  const portCosts = origin.portCost + dest.portCost;
  const totalOpex = Math.round(totalVoyageDays * dailyOpex);
  const totalVoyageCost = totalFuelCost + portCosts + totalOpex;

  const costPerTonne = Math.round((totalVoyageCost / cargoCapacity) * 100) / 100;
  const costPerBarrel = Math.round(costPerTonne / 7.33 * 100) / 100;

  const ws100Flat = Math.round(routedDistance * 0.5 + 3000);
  const estimatedWS = 75;
  const freightRevenue = Math.round(ws100Flat * estimatedWS / 100 * cargoCapacity / 1000);
  const tce = Math.round((freightRevenue - totalFuelCost - portCosts) / totalVoyageDays);

  return NextResponse.json({
    success: true,
    data: {
      route: { from, to, fromRegion: origin.region, toRegion: dest.region },
      distance: { direct: distance, routed: routedDistance, unit: "nm" },
      timing: { seaDaysLoaded, seaDaysBallast, portDays, totalDays: totalVoyageDays },
      vessel: { type: "Aframax", capacity: cargoCapacity, speedLoaded, speedBallast },
      costs: {
        fuel: { loaded: fuelCostLoaded, ballast: fuelCostBallast, total: totalFuelCost, pricePerTonne: fuel.pricePerTonne, source: fuel.source },
        port: portCosts,
        opex: totalOpex,
        total: totalVoyageCost,
        perTonne: costPerTonne,
        perBarrel: costPerBarrel,
      },
      economics: { estimatedFreightRevenue: freightRevenue, tce, tceAssessment: tce > 30000 ? "Strong earnings" : tce > 15000 ? "Moderate earnings" : tce > 0 ? "Marginal" : "Loss-making", breakeven: costPerTonne + " $/tonne" },
    },
  });
}
