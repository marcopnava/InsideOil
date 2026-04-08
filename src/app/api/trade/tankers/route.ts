import { NextResponse } from "next/server";
import { getCachedDigitrafficVessels } from "@/lib/digitraffic";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const all = getCachedDigitrafficVessels();
    const tankers = all.filter((v) => v.shipType >= 80 && v.shipType <= 89);

    const moving = tankers.filter((v) => v.speed > 0.5);
    const anchored = tankers.filter((v) => v.speed <= 0.5);
    const slowSteaming = moving.filter((v) => v.speed > 0.5 && v.speed < 8); // <8kn = slow steaming
    const normalSpeed = moving.filter((v) => v.speed >= 8);

    // Average speed (moving only)
    const avgSpeed = moving.length > 0
      ? Math.round((moving.reduce((s, v) => s + v.speed, 0) / moving.length) * 10) / 10
      : 0;

    // Floating storage estimation: tankers anchored (speed < 0.3)
    // In reality you'd check draft depth + days anchored, but from position data:
    const potentialStorage = anchored.filter((v) => v.status === 1 || v.status === 5); // at anchor or moored

    // Destination analysis for tankers
    const destCounts: Record<string, number> = {};
    for (const v of tankers) {
      const d = v.destination?.trim().toUpperCase();
      if (d && d.length > 1) destCounts[d] = (destCounts[d] || 0) + 1;
    }
    const topDestinations = Object.entries(destCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([dest, count]) => ({ destination: dest, count }));

    // Speed distribution buckets
    const speedBuckets = [
      { label: "Stationary (0-0.5 kn)", min: 0, max: 0.5, count: anchored.length },
      { label: "Slow steaming (0.5-8 kn)", min: 0.5, max: 8, count: slowSteaming.length },
      { label: "Normal (8-14 kn)", min: 8, max: 14, count: moving.filter((v) => v.speed >= 8 && v.speed < 14).length },
      { label: "Fast (14+ kn)", min: 14, max: 99, count: moving.filter((v) => v.speed >= 14).length },
    ];

    // Trading signals (derived from real data)
    const signals: Array<{ signal: string; value: string; interpretation: string; sentiment: "bullish" | "bearish" | "neutral" }> = [];

    const storageRatio = tankers.length > 0 ? anchored.length / tankers.length : 0;
    signals.push({
      signal: "Floating Storage Ratio",
      value: `${Math.round(storageRatio * 100)}%`,
      interpretation: storageRatio > 0.4
        ? "High anchored ratio suggests oversupply / contango structure"
        : storageRatio > 0.25
          ? "Moderate storage — market in equilibrium"
          : "Low storage — tight supply, potential backwardation",
      sentiment: storageRatio > 0.4 ? "bearish" : storageRatio < 0.25 ? "bullish" : "neutral",
    });

    signals.push({
      signal: "Avg Tanker Speed",
      value: `${avgSpeed} kn`,
      interpretation: avgSpeed < 10
        ? "Below-average speed indicates fleet slow steaming — oversupply signal"
        : avgSpeed > 12
          ? "Above-average speed suggests urgency in deliveries — tight market"
          : "Normal fleet speed — balanced supply/demand",
      sentiment: avgSpeed < 10 ? "bearish" : avgSpeed > 12 ? "bullish" : "neutral",
    });

    const slowRatio = moving.length > 0 ? slowSteaming.length / moving.length : 0;
    signals.push({
      signal: "Slow Steaming Ratio",
      value: `${Math.round(slowRatio * 100)}% of moving fleet`,
      interpretation: slowRatio > 0.3
        ? "High slow steaming — carriers absorbing excess capacity"
        : "Normal transit speeds — no significant capacity adjustment",
      sentiment: slowRatio > 0.3 ? "bearish" : "neutral",
    });

    signals.push({
      signal: "Fleet Utilization",
      value: `${moving.length}/${tankers.length} (${tankers.length > 0 ? Math.round((moving.length / tankers.length) * 100) : 0}%)`,
      interpretation: moving.length / (tankers.length || 1) > 0.7
        ? "High utilization — strong demand for tanker tonnage"
        : "Low utilization — excess tanker capacity available",
      sentiment: moving.length / (tankers.length || 1) > 0.7 ? "bullish" : "bearish",
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total: tankers.length,
          moving: moving.length,
          anchored: anchored.length,
          slowSteaming: slowSteaming.length,
          normalSpeed: normalSpeed.length,
          avgSpeed,
          potentialFloatingStorage: potentialStorage.length,
        },
        signals,
        speedBuckets,
        topDestinations,
        source: "Digitraffic AIS — real tanker positions (Baltic Sea coverage)",
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
