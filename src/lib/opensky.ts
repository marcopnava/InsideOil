import { db } from "@/lib/db";

const OPENSKY_URL = "https://opensky-network.org/api/states/all";

// Cargo airline ICAO callsign prefixes
const CARGO_PREFIXES = [
  "FDX", "UPS", "GTI", "CLX", "CKS", "BOX", "ABW", "MPH", "QTR", "UAE",
  "MAS", "ANA", "KAL", "CPA", "SIA", "DLH", "BAW", "AFR", "ETH", "THY",
  "CCA", "CSN", "CES", "PAC", "GEC", "ABX", "ATN", "KFS", "POC", "SRR",
  "TAY", "TNO", "NPT", "GSS", "SQC", "NCR", "ICE", "HVN",
];

function isCargoCallsign(callsign: string | null): boolean {
  if (!callsign) return false;
  const cs = callsign.trim().toUpperCase();
  return CARGO_PREFIXES.some((p) => cs.startsWith(p));
}

export interface Aircraft {
  icao24: string;
  callsign: string | null;
  country: string;
  lat: number;
  lng: number;
  altitude: number | null; // feet
  speed: number | null; // knots
  heading: number | null;
  verticalRate: number | null;
  onGround: boolean;
  isCargo: boolean;
}

// In-memory cache
let cachedAircraft: Aircraft[] = [];
let lastFetch = 0;
const CACHE_TTL = 12_000; // 12s

export async function fetchAircraft(): Promise<Aircraft[]> {
  const now = Date.now();
  if (cachedAircraft.length > 0 && now - lastFetch < CACHE_TTL) {
    return cachedAircraft;
  }

  const start = Date.now();
  try {
    const res = await fetch(OPENSKY_URL, {
      next: { revalidate: 10 },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`OpenSky ${res.status}`);
    const data = await res.json();

    const aircraft: Aircraft[] = [];
    if (data.states) {
      for (const s of data.states) {
        // Skip if no position or on ground
        if (s[5] === null || s[6] === null) continue;

        aircraft.push({
          icao24: s[0],
          callsign: s[1]?.trim() || null,
          country: s[2] || "Unknown",
          lng: s[5],
          lat: s[6],
          altitude: s[7] != null ? Math.round(s[7] * 3.28084) : null,
          speed: s[9] != null ? Math.round(s[9] * 1.94384) : null,
          heading: s[10],
          verticalRate: s[11],
          onGround: s[8] === true,
          isCargo: isCargoCallsign(s[1]),
        });
      }
    }

    cachedAircraft = aircraft;
    lastFetch = now;

    // Log fetch to DB (non-blocking)
    const duration = Date.now() - start;
    db.fetchLog
      .create({
        data: {
          source: "opensky",
          aircraftCount: aircraft.length,
          durationMs: duration,
        },
      })
      .catch((e) => console.warn("[OpenSky] DB write failed:", e));

    // Store cargo snapshots (non-blocking, latest batch only)
    const cargoOnly = aircraft.filter((a) => a.isCargo);
    if (cargoOnly.length > 0) {
      db.aircraftSnapshot
        .createMany({
          data: cargoOnly.map((a) => ({
            icao24: a.icao24,
            callsign: a.callsign,
            country: a.country,
            lat: a.lat,
            lng: a.lng,
            altitude: a.altitude,
            speed: a.speed,
            heading: a.heading,
            verticalRate: a.verticalRate,
            onGround: a.onGround,
            isCargo: true,
          })),
        })
        .catch((e) => console.warn("[OpenSky] DB write failed:", e));
    }

    return aircraft;
  } catch (e) {
    console.error("[OpenSky] Fetch failed:", e);
    // Return cache if available, otherwise empty
    if (cachedAircraft.length > 0) return cachedAircraft;

    // Log error
    db.fetchLog
      .create({
        data: {
          source: "opensky",
          error: String(e),
          durationMs: Date.now() - start,
        },
      })
      .catch((e) => console.warn("[OpenSky] DB write failed:", e));

    return [];
  }
}

export function getCachedAircraft(): Aircraft[] {
  return cachedAircraft;
}
