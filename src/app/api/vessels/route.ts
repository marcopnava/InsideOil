import { NextResponse } from "next/server";
import { getVessels } from "@/lib/vessels";
import { FALLBACK_VESSELS } from "@/lib/fallback-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const vessels = await getVessels();

    return NextResponse.json({
      success: true,
      data: {
        vessels,
        stats: {
          total: vessels.length,
          inTransit: vessels.filter((v) => v.status === "IN_TRANSIT").length,
          delayed: vessels.filter((v) => v.isDelayed).length,
          arriving: vessels.filter((v) => v.status === "ARRIVING").length,
          avgSpeed:
            vessels.length > 0
              ? Math.round(
                  (vessels.reduce((s, v) => s + (v.speed ?? 0), 0) /
                    vessels.length) *
                    10
                ) / 10
              : null,
        },
        source: "database",
      },
    });
  } catch {
    // DB not available — return fallback data
    const vessels = FALLBACK_VESSELS;
    return NextResponse.json({
      success: true,
      data: {
        vessels,
        stats: {
          total: vessels.length,
          inTransit: vessels.filter((v) => v.status === "IN_TRANSIT").length,
          delayed: vessels.filter((v) => v.isDelayed).length,
          arriving: vessels.filter((v) => v.status === "ARRIVING").length,
          avgSpeed:
            Math.round(
              (vessels.reduce((s, v) => s + (v.speed ?? 0), 0) /
                vessels.length) *
                10
            ) / 10,
        },
        source: "fallback",
      },
    });
  }
}
