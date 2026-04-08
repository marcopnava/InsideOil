import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCachedAircraft } from "@/lib/opensky";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [vesselCount, delayedCount, alertCount, recentFetch] =
      await Promise.all([
        db.vessel.count(),
        db.vessel.count({ where: { isDelayed: true } }),
        db.alert.count({ where: { isResolved: false } }),
        db.fetchLog.findFirst({
          where: { source: "opensky" },
          orderBy: { fetchedAt: "desc" },
        }),
      ]);

    const aircraft = getCachedAircraft();

    return NextResponse.json({
      success: true,
      data: {
        aircraft: {
          total: aircraft.length,
          cargo: aircraft.filter((a) => a.isCargo).length,
        },
        vessels: {
          total: vesselCount,
          delayed: delayedCount,
        },
        alerts: alertCount,
        lastFetch: recentFetch?.fetchedAt ?? null,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
