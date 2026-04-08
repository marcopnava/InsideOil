/**
 * Digitraffic Marine API — Finnish Transport Agency
 * 100% free, no auth, real AIS vessel data
 *
 * Two endpoints merged:
 * - /api/ais/v1/locations  — real-time positions (lat/lng/speed/heading)
 * - /api/ais/v1/vessels    — vessel metadata (name/IMO/shipType/destination)
 */

const BASE = "https://meri.digitraffic.fi";

export interface AISVessel {
  mmsi: number;
  name: string | null;
  imo: number | null;
  shipType: number;
  shipTypeName: string;
  callSign: string | null;
  destination: string | null;
  lat: number;
  lng: number;
  speed: number;
  course: number;
  heading: number;
  status: number;
  statusName: string;
}

const NAV_STATUS: Record<number, string> = {
  0: "Under way using engine", 1: "At anchor", 2: "Not under command",
  3: "Restricted manoeuvrability", 4: "Constrained by draught", 5: "Moored",
  6: "Aground", 7: "Engaged in fishing", 8: "Under way sailing",
  15: "Not defined",
};

function shipTypeName(type: number): string {
  if (type >= 70 && type <= 79) return "Cargo";
  if (type >= 80 && type <= 89) return "Tanker";
  if (type >= 60 && type <= 69) return "Passenger";
  if (type >= 40 && type <= 49) return "High-speed craft";
  if (type >= 30 && type <= 39) return "Fishing";
  if (type === 52) return "Tug";
  if (type === 50) return "Pilot vessel";
  if (type === 51) return "SAR vessel";
  if (type === 55) return "Law enforcement";
  if (type >= 90 && type <= 99) return "Other";
  return "Unknown";
}

// ─── Cache ──────────────────────────────────────────────────

let cachedVessels: AISVessel[] = [];
let cachedMetadata: Map<number, { name: string | null; imo: number | null; shipType: number; callSign: string | null; destination: string | null }> = new Map();
let lastLocationFetch = 0;
let lastMetaFetch = 0;
const LOC_TTL = 30_000;  // 30s
const META_TTL = 300_000; // 5m (metadata changes slowly)

async function fetchMetadata(): Promise<void> {
  if (cachedMetadata.size > 0 && Date.now() - lastMetaFetch < META_TTL) return;

  try {
    const res = await fetch(`${BASE}/api/ais/v1/vessels`, {
      headers: { Accept: "application/json", "Accept-Encoding": "gzip", "Digitraffic-User": "KLN-LogHub" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (!Array.isArray(data)) return;

    cachedMetadata = new Map();
    for (const v of data) {
      cachedMetadata.set(v.mmsi, {
        name: v.name || null,
        imo: v.imo || null,
        shipType: v.shipType ?? 0,
        callSign: v.callSign || null,
        destination: v.destination || null,
      });
    }
    lastMetaFetch = Date.now();
    console.log(`[Digitraffic] ${cachedMetadata.size} vessel metadata cached`);
  } catch (e) {
    console.error("[Digitraffic] Metadata fetch failed:", e);
  }
}

export async function fetchDigitrafficVessels(): Promise<AISVessel[]> {
  const now = Date.now();
  if (cachedVessels.length > 0 && now - lastLocationFetch < LOC_TTL) {
    return cachedVessels;
  }

  // Fetch metadata if stale (non-blocking first time, then cached)
  await fetchMetadata();

  try {
    const res = await fetch(`${BASE}/api/ais/v1/locations`, {
      headers: { Accept: "application/json", "Accept-Encoding": "gzip", "Digitraffic-User": "KLN-LogHub" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`Digitraffic ${res.status}`);
    const data = await res.json();
    const features = data?.features;
    if (!Array.isArray(features)) return cachedVessels;

    const vessels: AISVessel[] = [];
    for (const f of features) {
      const props = f.properties;
      const coords = f.geometry?.coordinates;
      if (!coords || coords.length < 2) continue;

      const meta = cachedMetadata.get(props.mmsi);
      const st = meta?.shipType ?? 0;

      vessels.push({
        mmsi: props.mmsi,
        name: meta?.name ?? null,
        imo: meta?.imo ?? null,
        shipType: st,
        shipTypeName: shipTypeName(st),
        callSign: meta?.callSign ?? null,
        destination: meta?.destination ?? null,
        lat: coords[1],
        lng: coords[0],
        speed: props.sog != null ? Math.round(props.sog) / 10 : 0,
        course: props.cog != null ? Math.round(props.cog) / 10 : 0,
        heading: props.heading ?? 0,
        status: props.navStat ?? 15,
        statusName: NAV_STATUS[props.navStat ?? 15] || "Unknown",
      });
    }

    cachedVessels = vessels;
    lastLocationFetch = now;
    console.log(`[Digitraffic] ${vessels.length} AIS vessels (${cachedMetadata.size} with metadata)`);
    return vessels;
  } catch (e) {
    console.error("[Digitraffic] Location fetch failed:", e);
    return cachedVessels;
  }
}

export function getCachedDigitrafficVessels(): AISVessel[] {
  return cachedVessels;
}
