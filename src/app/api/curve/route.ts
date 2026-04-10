import { NextRequest, NextResponse } from "next/server";
import { getLatestCurve, curveStructure } from "@/lib/forward-curve";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const instrument = (req.nextUrl.searchParams.get("instrument") ?? "BRENT").toUpperCase();
  try {
    const curve = await getLatestCurve(instrument);
    if (curve.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          instrument,
          curve: [],
          structure: null,
          warning: "No curve data yet. Trigger /api/cron/prices to populate.",
        },
      });
    }
    const structure = curveStructure(curve);
    return NextResponse.json({
      success: true,
      data: { instrument, curve, structure },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
