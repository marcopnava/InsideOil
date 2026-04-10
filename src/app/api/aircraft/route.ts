import { NextRequest, NextResponse } from "next/server";
import { fetchAircraft } from "@/lib/opensky";
import { getLatestCargoAircraft, getAircraftStaleness } from "@/lib/aircraft-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Read from DB (worker writes here every 5 min). Vercel can't reach
    // opensky-network.org directly, so we never call fetchAircraft live here.
    let cargo = await getLatestCargoAircraft();

    // If DB is empty (worker not running), try a live fetch as last resort.
    let total = cargo.length;
    if (cargo.length === 0) {
      try {
        const live = await fetchAircraft();
        cargo = live.filter((a) => a.isCargo);
        total = live.length;
      } catch {
        // ignore — return empty stats below
      }
    }

    const staleness = await getAircraftStaleness();
    const mode = req.nextUrl.searchParams.get("mode");

    if (mode === "map") {
      return NextResponse.json({
        success: true,
        data: {
          cargo: cargo.map((a) => [
            a.lat, a.lng, a.heading ?? 0, a.callsign ?? "", a.icao24,
            a.country, a.altitude ?? 0, a.speed ?? 0,
          ]),
          other: [],
          counts: { total, cargo: cargo.length },
          staleness,
        },
      });
    }

    const limitParam = req.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 1000) : cargo.length;

    return NextResponse.json({
      success: true,
      data: {
        cargo: cargo.slice(0, limit),
        stats: {
          total,
          cargo: cargo.length,
          avgAltitude:
            cargo.length > 0
              ? Math.round(cargo.reduce((s, a) => s + (a.altitude ?? 0), 0) / cargo.length)
              : null,
          avgSpeed:
            cargo.length > 0
              ? Math.round(cargo.reduce((s, a) => s + (a.speed ?? 0), 0) / cargo.length)
              : null,
          byCountry: Object.entries(
            cargo.reduce(
              (acc, a) => {
                acc[a.country] = (acc[a.country] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            )
          )
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([country, count]) => ({ country, count })),
        },
        staleness,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
