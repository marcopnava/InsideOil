import { db } from "@/lib/db";
import { isCargoCallsign } from "@/lib/cargo-airlines";

const OPENSKY_URL = "https://opensky-network.org/api/states/all";
const TOKEN_URL =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";

export interface Aircraft {
  icao24: string;
  callsign: string | null;
  country: string;
  lat: number;
  lng: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  verticalRate: number | null;
  onGround: boolean;
  isCargo: boolean;
}

let cachedAircraft: Aircraft[] = [];
let lastFetch = 0;
// Default cache TTL = 5 min. Aligned with the Vercel cron schedule (every 5 min)
// to keep credit usage at ~288 calls/day × 4 credits = ~1150/day, well under 4000.
const CACHE_TTL = 5 * 60_000;

// ─── OAuth2 client credentials token cache ──────────────
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  const id = process.env.OPENSKY_CLIENT_ID;
  const secret = process.env.OPENSKY_CLIENT_SECRET;
  if (!id || !secret) return null;

  if (tokenCache && Date.now() < tokenCache.expiresAt - 30_000) {
    return tokenCache.token;
  }

  try {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: id,
      client_secret: secret,
    });
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.warn("[OpenSky] token endpoint", res.status);
      return null;
    }
    const j = (await res.json()) as { access_token: string; expires_in: number };
    tokenCache = {
      token: j.access_token,
      expiresAt: Date.now() + j.expires_in * 1000,
    };
    return tokenCache.token;
  } catch (e) {
    console.warn("[OpenSky] token error:", e);
    return null;
  }
}

export async function fetchAircraft(opts?: { force?: boolean }): Promise<Aircraft[]> {
  const now = Date.now();
  if (!opts?.force && cachedAircraft.length > 0 && now - lastFetch < CACHE_TTL) {
    return cachedAircraft;
  }

  const start = Date.now();
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    const token = await getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(OPENSKY_URL, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`OpenSky ${res.status}`);
    const data = await res.json();

    const aircraft: Aircraft[] = [];
    if (data.states) {
      for (const s of data.states) {
        if (s[5] === null || s[6] === null) continue;
        const callsign = s[1]?.trim() || null;
        aircraft.push({
          icao24: s[0],
          callsign,
          country: s[2] || "Unknown",
          lng: s[5],
          lat: s[6],
          altitude: s[7] != null ? Math.round(s[7] * 3.28084) : null,
          speed: s[9] != null ? Math.round(s[9] * 1.94384) : null,
          heading: s[10],
          verticalRate: s[11],
          onGround: s[8] === true,
          isCargo: isCargoCallsign(callsign),
        });
      }
    }

    cachedAircraft = aircraft;
    lastFetch = now;

    const duration = Date.now() - start;
    db.fetchLog
      .create({ data: { source: "opensky", aircraftCount: aircraft.length, durationMs: duration } })
      .catch(() => {});

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
        .catch(() => {});
    }

    return aircraft;
  } catch (e) {
    console.error("[OpenSky] Fetch failed:", e);
    db.fetchLog
      .create({ data: { source: "opensky", error: String(e), durationMs: Date.now() - start } })
      .catch(() => {});

    if (cachedAircraft.length > 0) return cachedAircraft;

    try {
      const since = new Date(Date.now() - 30 * 60_000);
      const rows = await db.aircraftSnapshot.findMany({
        where: { fetchedAt: { gte: since }, isCargo: true },
        orderBy: { fetchedAt: "desc" },
        take: 500,
      });
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
    } catch {
      return [];
    }
  }
}

export function getCachedAircraft(): Aircraft[] {
  return cachedAircraft;
}
