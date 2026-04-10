import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mmsi: string }> }
) {
  const { mmsi: mmsiStr } = await params;
  const mmsi = Number(mmsiStr);
  if (!Number.isFinite(mmsi)) {
    return NextResponse.json({ success: false, error: "invalid mmsi" }, { status: 400 });
  }
  const hours = Math.min(168, Math.max(1, Number(req.nextUrl.searchParams.get("hours") ?? "24")));

  try {
    const vessel = await db.aisVessel.findUnique({ where: { mmsi } });
    if (!vessel) {
      return NextResponse.json({ success: false, error: "vessel not in feed" }, { status: 404 });
    }
    const since = new Date(Date.now() - hours * 3600_000);
    const positions = await db.aisPosition.findMany({
      where: { mmsi, timestamp: { gte: since } },
      orderBy: { timestamp: "asc" },
      select: { lat: true, lng: true, speed: true, course: true, timestamp: true },
      take: 5000,
    });

    return NextResponse.json({
      success: true,
      data: {
        vessel: {
          mmsi: vessel.mmsi,
          imo: vessel.imo,
          name: vessel.name,
          callSign: vessel.callSign,
          shipType: vessel.shipType,
          shipTypeName: vessel.shipTypeName,
          destination: vessel.destination,
          eta: vessel.eta,
          draught: vessel.draught,
          lat: vessel.lat,
          lng: vessel.lng,
          speed: vessel.speed,
          course: vessel.course,
          heading: vessel.heading,
          navStatusName: vessel.navStatusName,
          lastSeen: vessel.lastSeen.toISOString(),
        },
        positions: positions.map((p) => ({
          lat: p.lat,
          lng: p.lng,
          speed: p.speed,
          course: p.course,
          t: p.timestamp.toISOString(),
        })),
        count: positions.length,
        hours,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
