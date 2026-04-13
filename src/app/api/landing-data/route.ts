import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUpcomingEvents, getMocStatus } from "@/lib/events-calendar";

export const dynamic = "force-dynamic";

/**
 * Public endpoint — no auth required. Returns a curated subset of live data
 * for the landing page widget. Intentionally lightweight and cacheable.
 */
export async function GET() {
  try {
    const [brent, wti, bdti, vesselCount, tankerCount, aircraftCount] = await Promise.all([
      db.priceCurve.findFirst({ where: { instrument: "BRENT" }, orderBy: { fetchedAt: "desc" }, select: { price: true } }),
      db.priceCurve.findFirst({ where: { instrument: "WTI" }, orderBy: { fetchedAt: "desc" }, select: { price: true } }),
      db.priceCurve.findFirst({ where: { instrument: "BDTI" }, orderBy: { fetchedAt: "desc" }, select: { price: true } }),
      db.aisVessel.count({ where: { lastSeen: { gte: new Date(Date.now() - 60 * 60_000) } } }),
      db.aisVessel.count({ where: { lastSeen: { gte: new Date(Date.now() - 60 * 60_000) }, shipType: { gte: 80, lte: 89 } } }),
      db.aircraftSnapshot.count({ where: { fetchedAt: { gte: new Date(Date.now() - 30 * 60_000) }, isCargo: true } }),
    ]);

    // Curve structure
    const brentCurve = await db.priceCurve.findMany({
      where: { instrument: "BRENT" },
      orderBy: { fetchedAt: "desc" },
      take: 12,
      select: { price: true, contractMonth: true },
    });
    let curveShape: "contango" | "backwardation" | "flat" = "flat";
    if (brentCurve.length >= 6) {
      const front = brentCurve[0].price;
      const m6 = brentCurve[5].price;
      const spread = m6 - front;
      curveShape = Math.abs(spread) < 0.2 ? "flat" : spread > 0 ? "contango" : "backwardation";
    }

    // Next high-impact event
    const events = getUpcomingEvents(7);
    const nextHigh = events.find((e) => e.impact === "high" && e.at.getTime() > Date.now());
    const moc = getMocStatus();

    const brentPrice = brent?.price ?? null;
    const wtiPrice = wti?.price ?? null;
    const spread = brentPrice != null && wtiPrice != null ? Math.round((brentPrice - wtiPrice) * 100) / 100 : null;

    return NextResponse.json({
      success: true,
      data: {
        prices: { brent: brentPrice, wti: wtiPrice, spread },
        curve: curveShape,
        bdti: bdti?.price ?? null,
        fleet: { vessels: vesselCount, tankers: tankerCount, cargoFlights: aircraftCount },
        nextEvent: nextHigh ? { title: nextHigh.title, at: nextHigh.at.toISOString(), impact: nextHigh.impact } : null,
        moc: { phase: moc.phase, msUntilStart: moc.msUntilStart },
      },
    });
  } catch {
    return NextResponse.json({ success: true, data: null });
  }
}
