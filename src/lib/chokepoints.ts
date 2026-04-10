/**
 * Global oil chokepoint flow tracker.
 *
 * Monitors the 6 strategic maritime chokepoints that handle ~60% of global
 * seaborne crude. A sustained drop in tanker transit count is a leading
 * indicator of supply disruption (geopolitics, weather, blockade) days
 * BEFORE prices react.
 *
 * For each chokepoint:
 *   - Count tankers currently inside the bbox (live snapshot)
 *   - Compute 24h transit count (unique MMSIs that crossed in last 24h, from ais_positions)
 *   - Compare to 7-day moving average
 *   - Flag anomalies > ±20%
 *
 * Source: U.S. EIA "World Oil Transit Chokepoints" (public).
 */

import { db } from "@/lib/db";
import { isTanker } from "@/lib/ais-types";

export interface Chokepoint {
  id: string;
  name: string;
  share: string; // share of global seaborne oil
  strategic: string;
  bbox: { latMin: number; latMax: number; lngMin: number; lngMax: number };
}

export const GLOBAL_CHOKEPOINTS: Chokepoint[] = [
  {
    id: "HORMUZ",
    name: "Strait of Hormuz",
    share: "~21% of global oil",
    strategic:
      "Only sea route from the Persian Gulf to open ocean. Saudi, Iraqi, Kuwaiti, UAE, Iranian and Qatari LNG/crude all transit here.",
    bbox: { latMin: 25.8, latMax: 27.0, lngMin: 55.5, lngMax: 57.5 },
  },
  {
    id: "MALACCA",
    name: "Strait of Malacca",
    share: "~16% of global oil",
    strategic:
      "Shortest route from Middle East/Africa to East Asian markets. Critical for China & Japan crude imports.",
    bbox: { latMin: 1.0, latMax: 4.5, lngMin: 99.0, lngMax: 104.0 },
  },
  {
    id: "SUEZ",
    name: "Suez Canal + SUMED pipeline",
    share: "~9% of global oil",
    strategic:
      "Shortest sea link between Europe and Asia. Closure forces a Cape of Good Hope detour adding ~10 days.",
    bbox: { latMin: 29.9, latMax: 31.6, lngMin: 32.2, lngMax: 32.8 },
  },
  {
    id: "BAB_EL_MANDEB",
    name: "Bab el-Mandeb",
    share: "~8% of global oil",
    strategic:
      "Connects Red Sea to the Gulf of Aden. Houthi attacks since late 2023 have forced rerouting.",
    bbox: { latMin: 12.0, latMax: 13.5, lngMin: 43.0, lngMax: 44.0 },
  },
  {
    id: "BOSPHORUS",
    name: "Turkish Straits (Bosphorus + Dardanelles)",
    share: "~3% of global oil",
    strategic:
      "Only outlet from the Black Sea. Carries Russian, Kazakh and Azeri crude to the Mediterranean.",
    bbox: { latMin: 40.5, latMax: 41.5, lngMin: 28.5, lngMax: 30.0 },
  },
  {
    id: "DENMARK",
    name: "Danish Straits",
    share: "~3% of global oil",
    strategic:
      "Russian Baltic exports (Primorsk, Ust-Luga) to North Sea/Atlantic markets must pass here.",
    bbox: { latMin: 55.0, latMax: 56.5, lngMin: 10.5, lngMax: 13.5 },
  },
];

export interface ChokepointReport {
  id: string;
  name: string;
  share: string;
  strategic: string;
  current: { tankers: number; cargo: number; total: number; avgSpeed: number };
  transit24h: number;
  avg7d: number;
  changePct: number;
  status: "normal" | "elevated" | "depressed" | "no-data";
  alert: string | null;
}

export interface ChokepointFlowReport {
  generatedAt: string;
  globalAlerts: string[];
  chokepoints: ChokepointReport[];
}

export async function computeChokepointFlow(): Promise<ChokepointFlowReport> {
  // Live snapshot from current AIS state
  const liveVessels = await db.aisVessel.findMany({
    where: { lastSeen: { gte: new Date(Date.now() - 60 * 60_000) } },
    select: { mmsi: true, lat: true, lng: true, shipType: true, speed: true },
  });

  const reports: ChokepointReport[] = [];
  const globalAlerts: string[] = [];

  for (const cp of GLOBAL_CHOKEPOINTS) {
    const inZone = liveVessels.filter(
      (v) =>
        v.lat >= cp.bbox.latMin &&
        v.lat <= cp.bbox.latMax &&
        v.lng >= cp.bbox.lngMin &&
        v.lng <= cp.bbox.lngMax
    );
    const tankers = inZone.filter((v) => isTanker(v.shipType)).length;
    const cargo = inZone.filter((v) => v.shipType != null && v.shipType >= 70 && v.shipType <= 79).length;
    const moving = inZone.filter((v) => (v.speed ?? 0) > 0.5);
    const avgSpeed =
      moving.length > 0
        ? Math.round((moving.reduce((s, v) => s + (v.speed ?? 0), 0) / moving.length) * 10) / 10
        : 0;

    // 24h unique tanker transits via ais_positions
    const since24h = new Date(Date.now() - 86400_000);
    const transitRows = await db.aisPosition.findMany({
      where: {
        timestamp: { gte: since24h },
        lat: { gte: cp.bbox.latMin, lte: cp.bbox.latMax },
        lng: { gte: cp.bbox.lngMin, lte: cp.bbox.lngMax },
      },
      select: { mmsi: true },
      take: 50_000,
    });
    const uniq24h = new Set(transitRows.map((r) => r.mmsi)).size;

    // 7-day moving avg (daily unique counts)
    const since7d = new Date(Date.now() - 7 * 86400_000);
    const weekRows = await db.aisPosition.findMany({
      where: {
        timestamp: { gte: since7d, lt: since24h },
        lat: { gte: cp.bbox.latMin, lte: cp.bbox.latMax },
        lng: { gte: cp.bbox.lngMin, lte: cp.bbox.lngMax },
      },
      select: { mmsi: true, timestamp: true },
      take: 200_000,
    });

    // Group by day
    const byDay = new Map<string, Set<number>>();
    for (const r of weekRows) {
      const day = r.timestamp.toISOString().slice(0, 10);
      let s = byDay.get(day);
      if (!s) {
        s = new Set();
        byDay.set(day, s);
      }
      s.add(r.mmsi);
    }
    const dailyCounts = Array.from(byDay.values()).map((s) => s.size);
    const avg7d =
      dailyCounts.length > 0
        ? Math.round(dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length)
        : 0;

    const changePct = avg7d > 0 ? Math.round(((uniq24h - avg7d) / avg7d) * 100) : 0;

    let status: ChokepointReport["status"] = "normal";
    let alert: string | null = null;
    if (avg7d === 0 && uniq24h === 0) {
      status = "no-data";
    } else if (changePct <= -20) {
      status = "depressed";
      alert = `Transit −${Math.abs(changePct)}% vs 7d avg → possible disruption / blockade. Bullish crude.`;
      globalAlerts.push(`${cp.name}: ${alert}`);
    } else if (changePct >= 20) {
      status = "elevated";
      alert = `Transit +${changePct}% vs 7d avg → surge in flows. Watch for inventory build downstream.`;
    }

    reports.push({
      id: cp.id,
      name: cp.name,
      share: cp.share,
      strategic: cp.strategic,
      current: { tankers, cargo, total: inZone.length, avgSpeed },
      transit24h: uniq24h,
      avg7d,
      changePct,
      status,
      alert,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    globalAlerts,
    chokepoints: reports,
  };
}
