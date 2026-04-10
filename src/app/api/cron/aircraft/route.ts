import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { fetchAircraft, getOpenSkyDiagnostics } from "@/lib/opensky";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const aircraft = await fetchAircraft({ force: true });
    const diag = getOpenSkyDiagnostics();
    return NextResponse.json({
      success: true,
      data: {
        total: aircraft.length,
        cargo: aircraft.filter((a) => a.isCargo).length,
        diagnostics: diag,
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "unknown",
        diagnostics: getOpenSkyDiagnostics(),
      },
      { status: 500 }
    );
  }
}
