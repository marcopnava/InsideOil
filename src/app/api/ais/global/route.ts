import { NextRequest, NextResponse } from "next/server";
import { getLiveAisVessels, getAisStats } from "@/lib/ais-vessels";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const mode = req.nextUrl.searchParams.get("mode");
    const filter = req.nextUrl.searchParams.get("filter"); // tanker | cargo

    const range =
      filter === "tanker"
        ? { shipTypeMin: 80, shipTypeMax: 89 }
        : filter === "cargo"
          ? { shipTypeMin: 70, shipTypeMax: 79 }
          : {};

    const stats = await getAisStats();

    if (mode === "stats") {
      return NextResponse.json({
        success: true,
        data: {
          stats,
          source: "AISStream.io (global, free WebSocket)",
          coverage: "Global",
          warning: stats.stale
            ? "AIS worker is not running or has not flushed yet. Start: `npx tsx workers/ais-worker.ts`"
            : null,
        },
      });
    }

    const vessels = await getLiveAisVessels({ ...range, limit: 4000 });

    if (mode === "map") {
      return NextResponse.json({
        success: true,
        data: {
          // [lat, lng, heading, speed, shipType, mmsi, name, destination]
          vessels: vessels.map((v) => [
            v.lat,
            v.lng,
            v.heading ?? v.course ?? 0,
            v.speed ?? 0,
            v.shipType ?? 0,
            v.mmsi,
            v.name ?? "",
            v.destination ?? "",
          ]),
          counts: { total: stats.total, shown: vessels.length },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        vessels,
        stats,
        source: "AISStream.io (global)",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
