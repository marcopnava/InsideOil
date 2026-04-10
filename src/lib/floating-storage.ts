/**
 * Floating-storage detector.
 *
 * A vessel is "in floating storage" when it satisfies ALL of:
 *   1. Ship type is tanker (80–89), preferably VLCC (draught ≥ 17m).
 *   2. Average speed over the last `windowDays` is < 1.5 kn.
 *   3. Position is in open sea (outside the radius of any major terminal).
 *   4. Has at least one position observation older than `minIdleDays`.
 *
 * Using `AisPosition` history (sparse snapshots from the worker).
 */

import { db } from "@/lib/db";
import { isOpenSea } from "@/lib/oil-ports";
import { isTanker, isLikelyVLCC } from "@/lib/ais-types";

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
  estimatedBarrels: number; // VLCC ≈ 2M bbl, Suezmax ≈ 1M bbl
  candidates: FloatingStorageCandidate[];
}

export async function detectFloatingStorage(opts?: {
  windowDays?: number;
  minIdleDays?: number;
}): Promise<FloatingStorageReport> {
  const windowDays = opts?.windowDays ?? 7;
  const minIdleDays = opts?.minIdleDays ?? 5;
  const since = new Date(Date.now() - windowDays * 86400_000);

  // Pull all tankers seen in the last window
  const tankers = await db.aisVessel.findMany({
    where: {
      shipType: { gte: 80, lte: 89 },
      lastSeen: { gte: new Date(Date.now() - 86400_000) }, // alive in last 24h
    },
    take: 10_000,
  });

  const candidates: FloatingStorageCandidate[] = [];

  for (const t of tankers) {
    if (!isOpenSea(t.lat, t.lng, 5)) continue; // exclude port-area

    const positions = await db.aisPosition.findMany({
      where: { mmsi: t.mmsi, timestamp: { gte: since } },
      orderBy: { timestamp: "asc" },
      select: { speed: true, timestamp: true, lat: true, lng: true },
    });
    if (positions.length < 3) continue;

    const speeds = positions.map((p) => p.speed ?? 0);
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    if (avgSpeed >= 1.5) continue;

    const firstSeen = positions[0].timestamp;
    const idleDays = (Date.now() - firstSeen.getTime()) / 86400_000;
    if (idleDays < minIdleDays) continue;

    // Confirm position is stable (max drift < 5 nm) — true at-anchor signature
    const drift = positions.every(
      (p) =>
        Math.abs(p.lat - t.lat) < 0.1 && Math.abs(p.lng - t.lng) < 0.15
    );
    if (!drift) continue;

    candidates.push({
      mmsi: t.mmsi,
      imo: t.imo,
      name: t.name,
      shipType: t.shipType,
      draught: t.draught,
      lat: t.lat,
      lng: t.lng,
      isVLCC: isLikelyVLCC(t.shipType, t.draught),
      idleDays: Math.round(idleDays * 10) / 10,
      avgSpeed: Math.round(avgSpeed * 100) / 100,
      lastSeen: t.lastSeen.toISOString(),
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
