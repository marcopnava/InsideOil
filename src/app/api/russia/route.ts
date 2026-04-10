import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OIL_TERMINALS, distanceNm } from "@/lib/oil-ports";
import { isTanker } from "@/lib/ais-types";

export const dynamic = "force-dynamic";

const RUSSIAN_TERMINALS = OIL_TERMINALS.filter((t) => t.region === "RUSSIA_CIS");

export async function GET() {
  try {
    // Live tankers in Russian terminal radii
    const since = new Date(Date.now() - 60 * 60_000);
    const allTankers = await db.aisVessel.findMany({
      where: {
        shipType: { gte: 80, lte: 89 },
        lastSeen: { gte: since },
        // Coarse bbox covering all Russian terminals + Black Sea + Baltic
        OR: [
          { lat: { gte: 56, lte: 63 }, lng: { gte: 18, lte: 35 } }, // Baltic
          { lat: { gte: 41, lte: 48 }, lng: { gte: 28, lte: 42 } }, // Black Sea
          { lat: { gte: 38, lte: 48 }, lng: { gte: 128, lte: 145 } }, // Far East
        ],
      },
      select: {
        mmsi: true, imo: true, name: true, draught: true, lat: true, lng: true,
        speed: true, destination: true, lastSeen: true, navStatusName: true,
      },
      take: 5000,
    });

    const byTerminal: Record<string, { name: string; vessels: typeof allTankers; volumeBblEst: number }> = {};
    for (const t of RUSSIAN_TERMINALS) {
      const inRadius = allTankers.filter(
        (v) => distanceNm(v.lat, v.lng, t.lat, t.lng) <= t.radiusNm
      );
      const volumeBblEst = inRadius.reduce((s, v) => {
        if (v.draught == null) return s + 1_000_000;
        if (v.draught >= 17) return s + 2_000_000;
        if (v.draught >= 14) return s + 1_000_000;
        return s + 700_000;
      }, 0);
      byTerminal[t.id] = { name: t.name, vessels: inRadius, volumeBblEst };
    }

    // Dark fleet candidates: tanker without IMO or with destination obfuscated
    const darkFleet = allTankers.filter((v) => {
      const inRussianRegion = RUSSIAN_TERMINALS.some(
        (t) => distanceNm(v.lat, v.lng, t.lat, t.lng) <= t.radiusNm * 2
      );
      if (!inRussianRegion) return false;
      const noDest = !v.destination || v.destination.length < 2;
      const noImo = v.imo == null;
      return noDest || noImo;
    });

    return NextResponse.json({
      success: true,
      data: {
        terminals: Object.entries(byTerminal).map(([id, t]) => ({
          id,
          name: t.name,
          tankerCount: t.vessels.length,
          estimatedBblOnSite: t.volumeBblEst,
          vessels: t.vessels.slice(0, 30).map((v) => ({
            mmsi: v.mmsi,
            imo: v.imo,
            name: v.name,
            draught: v.draught,
            speed: v.speed,
            destination: v.destination,
            navStatus: v.navStatusName,
            lastSeen: v.lastSeen.toISOString(),
          })),
        })),
        darkFleet: {
          count: darkFleet.length,
          vessels: darkFleet.slice(0, 50).map((v) => ({
            mmsi: v.mmsi,
            imo: v.imo,
            name: v.name,
            lat: v.lat,
            lng: v.lng,
            speed: v.speed,
            reason: !v.imo ? "no IMO" : "no destination",
            lastSeen: v.lastSeen.toISOString(),
          })),
        },
        summary: {
          totalTankersTracked: allTankers.length,
          totalEstimatedBbl: Object.values(byTerminal).reduce((s, t) => s + t.volumeBblEst, 0),
          darkFleetSuspects: darkFleet.length,
        },
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
