import { NextResponse } from "next/server";
import { getCachedDigitrafficVessels } from "@/lib/digitraffic";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const all = getCachedDigitrafficVessels();
    const tankers = all.filter((v) => v.shipType >= 80 && v.shipType <= 89);
    const cargo = all.filter((v) => v.shipType >= 70 && v.shipType <= 79);
    const moving = tankers.filter((v) => v.speed > 0.5);

    // ─── Ton-Mile Proxy ────────────────────────────────────
    // Higher avg speed × more tankers moving = higher ton-mile demand
    const avgSpeed = moving.length > 0
      ? moving.reduce((s, v) => s + v.speed, 0) / moving.length : 0;
    const tonMileIndex = Math.round(moving.length * avgSpeed * 10) / 10;

    // ─── Route Analysis ────────────────────────────────────
    // Cluster tankers by destination region
    const regions: Record<string, { name: string; count: number; avgSpeed: number; tankers: number[] }> = {
      "suez_transit": { name: "Suez Transit (Port Said/EGPSD)", count: 0, avgSpeed: 0, tankers: [] },
      "baltic_export": { name: "Baltic Export (Skaw/Danish Straits)", count: 0, avgSpeed: 0, tankers: [] },
      "nw_europe": { name: "NW Europe (Rotterdam/ARA)", count: 0, avgSpeed: 0, tankers: [] },
      "scandinavia": { name: "Scandinavia (Gothenburg/Brofjorden)", count: 0, avgSpeed: 0, tankers: [] },
      "russia_baltic": { name: "Russian Baltic (Primorsk/Ust-Luga)", count: 0, avgSpeed: 0, tankers: [] },
      "for_orders": { name: "For Orders (Unassigned)", count: 0, avgSpeed: 0, tankers: [] },
    };

    for (const v of tankers) {
      const d = (v.destination ?? "").toUpperCase();
      if (d.includes("SAID") || d.includes("EGPSD") || d.includes("PSD") || d.includes("SUEZ")) {
        regions.suez_transit.count++;
        regions.suez_transit.tankers.push(v.speed);
      } else if (d.includes("SKAW") || d.includes("SKA") || d.includes("SKAGEN")) {
        regions.baltic_export.count++;
        regions.baltic_export.tankers.push(v.speed);
      } else if (d.includes("ROTTERDAM") || d.includes("NLRTM") || d.includes("ANTWERP") || d.includes("AMSTERDAM")) {
        regions.nw_europe.count++;
        regions.nw_europe.tankers.push(v.speed);
      } else if (d.includes("GOTHEN") || d.includes("BROFJ") || d.includes("SEWGB")) {
        regions.scandinavia.count++;
        regions.scandinavia.tankers.push(v.speed);
      } else if (d.includes("PRIMORSK") || d.includes("UST") || d.includes("LUGA") || d.includes("RUPRI")) {
        regions.russia_baltic.count++;
        regions.russia_baltic.tankers.push(v.speed);
      } else if (d.includes("ORDER")) {
        regions.for_orders.count++;
        regions.for_orders.tankers.push(v.speed);
      }
    }

    // Calculate avg speeds per route
    const routeAnalysis = Object.values(regions)
      .map((r) => ({
        route: r.name,
        tankers: r.count,
        avgSpeed: r.tankers.length > 0
          ? Math.round((r.tankers.reduce((a, b) => a + b, 0) / r.tankers.length) * 10) / 10
          : 0,
      }))
      .filter((r) => r.tankers > 0)
      .sort((a, b) => b.tankers - a.tankers);

    // ─── Supply/Demand Balance ─────────────────────────────
    const forOrdersPct = tankers.length > 0
      ? Math.round((regions.for_orders.count / tankers.length) * 1000) / 10 : 0;

    const loadedEstimate = moving.filter((v) => v.speed > 5 && v.speed < 14).length;
    const ballastEstimate = moving.filter((v) => v.speed >= 14).length; // ballast = faster

    const supplyDemand = [
      {
        metric: "Ton-Mile Index",
        value: tonMileIndex.toLocaleString(),
        context: "Proxy for tanker demand (moving tankers x avg speed). Higher = more oil in transit.",
        trend: tonMileIndex > 5000 ? "strong" : tonMileIndex > 2000 ? "moderate" : "weak",
      },
      {
        metric: "Unassigned Cargoes",
        value: `${regions.for_orders.count} (${forOrdersPct}%)`,
        context: "Tankers heading 'For Orders' — traders holding cargoes waiting for better prices or uncertain about destination.",
        trend: forOrdersPct > 5 ? "elevated" : "normal",
      },
      {
        metric: "Loaded vs Ballast (est.)",
        value: `${loadedEstimate} loaded / ${ballastEstimate} ballast`,
        context: "Speed-based estimate. Loaded tankers travel 10-13 kn, ballast (empty) 14+ kn. Ratio indicates fleet utilization.",
        trend: loadedEstimate > ballastEstimate * 2 ? "tight" : "balanced",
      },
      {
        metric: "Baltic Export Flow",
        value: `${regions.baltic_export.count + regions.suez_transit.count} tankers`,
        context: "Tankers heading to Skaw (Baltic exit) + Suez (East-bound). Proxy for Baltic crude export volume.",
        trend: (regions.baltic_export.count + regions.suez_transit.count) > 50 ? "high" : "normal",
      },
      {
        metric: "Tanker/Cargo Ratio",
        value: `${(tankers.length / (cargo.length || 1)).toFixed(2)}`,
        context: "Ratio of tankers to cargo vessels. Rising ratio may indicate increased oil trade relative to dry goods.",
        trend: tankers.length / (cargo.length || 1) > 0.5 ? "oil-heavy" : "balanced",
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        tonMileIndex,
        routeAnalysis,
        supplyDemand,
        fleetSnapshot: {
          totalTankers: tankers.length,
          totalCargo: cargo.length,
          totalAll: all.length,
          movingTankers: moving.length,
          loadedEstimate,
          ballastEstimate,
          forOrders: regions.for_orders.count,
        },
        source: "Derived from Digitraffic AIS real-time data",
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
