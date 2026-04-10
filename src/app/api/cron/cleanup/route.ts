import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000);

    const [aircraft, fetchLogs, oldPositions] = await Promise.all([
      db.aircraftSnapshot.deleteMany({ where: { fetchedAt: { lt: sevenDaysAgo } } }),
      db.fetchLog.deleteMany({ where: { fetchedAt: { lt: sevenDaysAgo } } }),
      db.aisPosition.deleteMany({ where: { timestamp: { lt: thirtyDaysAgo } } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        aircraftSnapshotsDeleted: aircraft.count,
        fetchLogsDeleted: fetchLogs.count,
        aisPositionsDeleted: oldPositions.count,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
