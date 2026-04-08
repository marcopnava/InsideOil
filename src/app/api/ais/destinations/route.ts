import { NextResponse } from "next/server";
import { getCachedDigitrafficVessels } from "@/lib/digitraffic";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const vessels = getCachedDigitrafficVessels();

    // Analyze destinations
    const destCounts: Record<string, { count: number; cargo: number; tanker: number; passenger: number }> = {};

    for (const v of vessels) {
      const dest = v.destination?.trim().toUpperCase();
      if (!dest || dest === "N/A" || dest.length < 2) continue;

      if (!destCounts[dest]) destCounts[dest] = { count: 0, cargo: 0, tanker: 0, passenger: 0 };
      destCounts[dest].count++;
      if (v.shipType >= 70 && v.shipType <= 79) destCounts[dest].cargo++;
      if (v.shipType >= 80 && v.shipType <= 89) destCounts[dest].tanker++;
      if (v.shipType >= 60 && v.shipType <= 69) destCounts[dest].passenger++;
    }

    const sorted = Object.entries(destCounts)
      .map(([dest, stats]) => ({ destination: dest, ...stats }))
      .sort((a, b) => b.count - a.count);

    // Vessels with no destination
    const noDestination = vessels.filter((v) => !v.destination || v.destination.trim().length < 2).length;

    return NextResponse.json({
      success: true,
      data: {
        top: sorted.slice(0, 30),
        total: sorted.length,
        noDestination,
        vesselsWithDest: vessels.length - noDestination,
        source: "Digitraffic AIS — real vessel destinations",
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
