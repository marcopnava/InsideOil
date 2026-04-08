import { NextResponse } from "next/server";
import { tickVesselPositions } from "@/lib/vessels";

export const dynamic = "force-dynamic";

/** POST /api/vessels/tick — advance vessel positions (called by cron or manually) */
export async function POST() {
  try {
    await tickVesselPositions();
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
