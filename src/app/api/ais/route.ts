import { NextRequest, NextResponse } from "next/server";
import { fetchDigitrafficVessels } from "@/lib/digitraffic";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const vessels = await fetchDigitrafficVessels();

    const mode = req.nextUrl.searchParams.get("mode");

    // mode=map → compact format, prioritize cargo/tanker/passenger, limit total
    if (mode === "map") {
      const moving = vessels.filter((v) => v.speed > 0.3);
      // Prioritize: cargo/tanker/passenger first, then others (capped at 2000 total)
      const major = moving.filter((v) => v.shipType >= 60 && v.shipType <= 89);
      const others = moving.filter((v) => v.shipType < 60 || v.shipType > 89);
      const cap = 2000 - major.length;
      const limited = [...major, ...others.slice(0, Math.max(0, cap))];
      return NextResponse.json({
        success: true,
        data: {
          // [lat, lng, heading, speed, shipType, mmsi, name, destination]
          vessels: limited.map((v) => [v.lat, v.lng, v.heading || v.course, v.speed, v.shipType, v.mmsi, v.name ?? "", v.destination ?? ""]),
          counts: { total: vessels.length, moving: moving.length, shown: limited.length },
        },
      });
    }

    // Default: stats only
    const cargo = vessels.filter((v) => v.shipType >= 70 && v.shipType <= 79);
    const tankers = vessels.filter((v) => v.shipType >= 80 && v.shipType <= 89);
    const passenger = vessels.filter((v) => v.shipType >= 60 && v.shipType <= 69);
    const moving = vessels.filter((v) => v.speed > 0.5);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          total: vessels.length,
          cargo: cargo.length,
          tankers: tankers.length,
          passenger: passenger.length,
          moving: moving.length,
          anchored: vessels.length - moving.length,
          avgSpeed:
            moving.length > 0
              ? Math.round(
                  (moving.reduce((s, v) => s + v.speed, 0) / moving.length) * 10
                ) / 10
              : 0,
        },
        source: "Digitraffic Marine API (Finnish Transport Agency)",
        coverage: "Baltic Sea, Gulf of Finland, Finnish waters",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
