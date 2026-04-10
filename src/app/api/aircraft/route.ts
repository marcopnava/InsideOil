import { NextRequest, NextResponse } from "next/server";
import { fetchAircraft } from "@/lib/opensky";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const aircraft = await fetchAircraft();
    const cargo = aircraft.filter((a) => a.isCargo);

    const mode = req.nextUrl.searchParams.get("mode");

    // mode=map → only send positions (compact format for map rendering)
    if (mode === "map") {
      // Send ALL cargo, but only a sample of others for performance
      const otherSample = aircraft
        .filter((a) => !a.isCargo)
        .filter((_, i) => i % 8 === 0); // ~1/8 of all aircraft

      return NextResponse.json({
        success: true,
        data: {
          cargo: cargo.map((a) => [a.lat, a.lng, a.heading ?? 0, a.callsign ?? "", a.icao24, a.country, a.altitude ?? 0, a.speed ?? 0]),
          other: otherSample.map((a) => [a.lat, a.lng, a.heading ?? 0]),
          counts: { total: aircraft.length, cargo: cargo.length },
        },
      });
    }

    // Default: stats + full cargo list
    const limitParam = req.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 1000) : cargo.length;
    return NextResponse.json({
      success: true,
      data: {
        cargo: cargo.slice(0, limit),
        stats: {
          total: aircraft.length,
          cargo: cargo.length,
          avgAltitude:
            cargo.length > 0
              ? Math.round(
                  cargo.reduce((s, a) => s + (a.altitude ?? 0), 0) / cargo.length
                )
              : null,
          avgSpeed:
            cargo.length > 0
              ? Math.round(
                  cargo.reduce((s, a) => s + (a.speed ?? 0), 0) / cargo.length
                )
              : null,
          byCountry: Object.entries(
            aircraft.reduce(
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
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
