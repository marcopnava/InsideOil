/**
 * Read-side helpers for aircraft data persisted by the worker.
 *
 * Vercel serverless functions cannot reach opensky-network.org (their egress
 * IPs are blocked / TCP-timeouted). The Mac worker polls OpenSky every 5 min
 * and writes cargo snapshots to `aircraft_snapshots`. UI/API routes read from
 * here instead of trying OpenSky live.
 */

import { db } from "@/lib/db";
import type { Aircraft } from "@/lib/opensky";

const FRESH_MINUTES = 30;

export async function getLatestCargoAircraft(): Promise<Aircraft[]> {
  const since = new Date(Date.now() - FRESH_MINUTES * 60_000);
  const rows = await db.aircraftSnapshot.findMany({
    where: { fetchedAt: { gte: since }, isCargo: true },
    orderBy: { fetchedAt: "desc" },
    take: 2000,
  });
  // Dedupe by icao24, keep latest
  const seen = new Map<string, Aircraft>();
  for (const r of rows) {
    if (seen.has(r.icao24)) continue;
    seen.set(r.icao24, {
      icao24: r.icao24,
      callsign: r.callsign,
      country: r.country ?? "Unknown",
      lat: r.lat,
      lng: r.lng,
      altitude: r.altitude,
      speed: r.speed,
      heading: r.heading,
      verticalRate: r.verticalRate,
      onGround: r.onGround,
      isCargo: true,
    });
  }
  return Array.from(seen.values());
}

export async function getAircraftStaleness(): Promise<{ ageSec: number | null; count: number }> {
  const latest = await db.aircraftSnapshot.findFirst({
    where: { isCargo: true },
    orderBy: { fetchedAt: "desc" },
    select: { fetchedAt: true },
  });
  const count = await db.aircraftSnapshot.count({
    where: {
      isCargo: true,
      fetchedAt: { gte: new Date(Date.now() - FRESH_MINUTES * 60_000) },
    },
  });
  if (!latest) return { ageSec: null, count };
  return {
    ageSec: Math.round((Date.now() - latest.fetchedAt.getTime()) / 1000),
    count,
  };
}
