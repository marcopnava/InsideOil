/**
 * Floating-storage detector — single-query version (scales to 10k+ tankers).
 *
 * A vessel is "in floating storage" when it satisfies ALL of:
 *   1. Ship type is tanker (80–89), preferably VLCC (draught ≥ 17m).
 *   2. Average speed over the last `windowDays` is < 1.5 kn.
 *   3. Position is in open sea (outside the radius of any major terminal).
 *   4. Has at least one position observation older than `minIdleDays`.
 *
 * Uses a single GROUP BY query on `ais_positions` + `ais_vessels` instead
 * of N+1 per-tanker lookups. Falls through immediately if position history
 * is empty (common in the first hours of worker runtime).
 */

import { db } from "@/lib/db";
import { isOpenSea } from "@/lib/oil-ports";
import { isLikelyVLCC } from "@/lib/ais-types";

export interface FloatingStorageCandidate {
  mmsi: number;
  imo: number | null;
  name: string | null;
  shipType: number | null;
  draught: number | null;
  lat: number;
  lng: number;
  isVLCC: boolean;
  idleDays: number;
  avgSpeed: number;
  lastSeen: string;
}

export interface FloatingStorageReport {
  generatedAt: string;
  windowDays: number;
  minIdleDays: number;
  totals: {
    candidatesAll: number;
    vlcc: number;
    suezmaxOrSmaller: number;
  };
  estimatedBarrels: number;
  candidates: FloatingStorageCandidate[];
}

interface AggRow {
  mmsi: bigint | number;
  avg_speed: number | null;
  first_seen: Date;
  samples: bigint | number;
}

export async function detectFloatingStorage(opts?: {
  windowDays?: number;
  minIdleDays?: number;
}): Promise<FloatingStorageReport> {
  const windowDays = opts?.windowDays ?? 7;
  const minIdleDays = opts?.minIdleDays ?? 5;
  const since = new Date(Date.now() - windowDays * 86400_000);

  // Fast-path: skip all work if history is empty (first hours of worker).
  const positionsCount = await db.aisPosition.count({ where: { timestamp: { gte: since } } });
  if (positionsCount === 0) {
    return empty(windowDays, minIdleDays);
  }

  // Single aggregate: per tanker mmsi, compute avg speed + first observation +
  // sample count within the window. Tanker filter is applied via JOIN on
  // ais_vessels where shipType is 80-89.
  const rows = await db.$queryRaw<AggRow[]>`
    SELECT p.mmsi,
           AVG(p.speed)::float AS avg_speed,
           MIN(p.timestamp)    AS first_seen,
           COUNT(*)            AS samples
    FROM ais_positions p
    INNER JOIN ais_vessels v ON v.mmsi = p.mmsi
    WHERE p.timestamp >= ${since}
      AND v."shipType" BETWEEN 80 AND 89
    GROUP BY p.mmsi
    HAVING AVG(p.speed) < 1.5
       AND MIN(p.timestamp) <= ${new Date(Date.now() - minIdleDays * 86400_000)}
       AND COUNT(*) >= 3
  `;

  if (rows.length === 0) return empty(windowDays, minIdleDays);

  // Load current vessel records for the candidate set (one batched query).
  const mmsis = rows.map((r) => Number(r.mmsi));
  const vessels = await db.aisVessel.findMany({
    where: { mmsi: { in: mmsis } },
    select: {
      mmsi: true,
      imo: true,
      name: true,
      shipType: true,
      draught: true,
      lat: true,
      lng: true,
      lastSeen: true,
    },
  });
  const vesselByMmsi = new Map(vessels.map((v) => [v.mmsi, v]));

  const candidates: FloatingStorageCandidate[] = [];
  for (const row of rows) {
    const mmsi = Number(row.mmsi);
    const v = vesselByMmsi.get(mmsi);
    if (!v) continue;
    // Must currently be in open sea (outside terminal radii).
    if (!isOpenSea(v.lat, v.lng, 5)) continue;

    const idleDays = (Date.now() - row.first_seen.getTime()) / 86400_000;
    candidates.push({
      mmsi,
      imo: v.imo,
      name: v.name,
      shipType: v.shipType,
      draught: v.draught,
      lat: v.lat,
      lng: v.lng,
      isVLCC: isLikelyVLCC(v.shipType, v.draught),
      idleDays: Math.round(idleDays * 10) / 10,
      avgSpeed: Math.round((row.avg_speed ?? 0) * 100) / 100,
      lastSeen: v.lastSeen.toISOString(),
    });
  }

  const vlccCount = candidates.filter((c) => c.isVLCC).length;
  const otherCount = candidates.length - vlccCount;
  const estimatedBarrels = vlccCount * 2_000_000 + otherCount * 1_000_000;

  return {
    generatedAt: new Date().toISOString(),
    windowDays,
    minIdleDays,
    totals: {
      candidatesAll: candidates.length,
      vlcc: vlccCount,
      suezmaxOrSmaller: otherCount,
    },
    estimatedBarrels,
    candidates: candidates.sort((a, b) => b.idleDays - a.idleDays).slice(0, 200),
  };
}

function empty(windowDays: number, minIdleDays: number): FloatingStorageReport {
  return {
    generatedAt: new Date().toISOString(),
    windowDays,
    minIdleDays,
    totals: { candidatesAll: 0, vlcc: 0, suezmaxOrSmaller: 0 },
    estimatedBarrels: 0,
    candidates: [],
  };
}
