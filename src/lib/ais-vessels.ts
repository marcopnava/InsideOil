/**
 * Read-side helpers for the global AIS feed (table: ais_vessels).
 * UI/API code goes through this — never queries `Vessel` (legacy/simulated).
 */

import { db } from "@/lib/db";
import { isTanker, isCargoVessel } from "@/lib/ais-types";

export interface AisVesselDTO {
  mmsi: number;
  imo: number | null;
  name: string | null;
  shipType: number | null;
  shipTypeName: string | null;
  destination: string | null;
  draught: number | null;
  lat: number;
  lng: number;
  speed: number | null;
  course: number | null;
  heading: number | null;
  navStatus: number | null;
  navStatusName: string | null;
  lastSeen: string;
}

const STALE_MINUTES = 60; // ignore vessels not seen in last hour

export async function getLiveAisVessels(opts?: {
  shipTypeMin?: number;
  shipTypeMax?: number;
  limit?: number;
}): Promise<AisVesselDTO[]> {
  const since = new Date(Date.now() - STALE_MINUTES * 60_000);
  const rows = await db.aisVessel.findMany({
    where: {
      lastSeen: { gte: since },
      ...(opts?.shipTypeMin != null && opts?.shipTypeMax != null
        ? { shipType: { gte: opts.shipTypeMin, lte: opts.shipTypeMax } }
        : {}),
    },
    orderBy: { lastSeen: "desc" },
    take: opts?.limit ?? 5000,
  });
  return rows.map((r) => ({
    mmsi: r.mmsi,
    imo: r.imo,
    name: r.name,
    shipType: r.shipType,
    shipTypeName: r.shipTypeName,
    destination: r.destination,
    draught: r.draught,
    lat: r.lat,
    lng: r.lng,
    speed: r.speed,
    course: r.course,
    heading: r.heading,
    navStatus: r.navStatus,
    navStatusName: r.navStatusName,
    lastSeen: r.lastSeen.toISOString(),
  }));
}

export async function getAisStats() {
  const since = new Date(Date.now() - STALE_MINUTES * 60_000);
  const rows = await db.aisVessel.findMany({
    where: { lastSeen: { gte: since } },
    select: { shipType: true, speed: true, draught: true, navStatus: true },
  });
  const total = rows.length;
  const tankers = rows.filter((r) => isTanker(r.shipType)).length;
  const cargo = rows.filter((r) => isCargoVessel(r.shipType)).length;
  const moving = rows.filter((r) => (r.speed ?? 0) > 0.5).length;
  const anchored = rows.filter((r) => (r.speed ?? 0) <= 0.5).length;
  const vlcc = rows.filter(
    (r) => isTanker(r.shipType) && (r.draught ?? 0) >= 17
  ).length;
  return { total, tankers, cargo, moving, anchored, vlcc, stale: total === 0 };
}
