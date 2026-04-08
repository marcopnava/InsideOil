import { NextRequest, NextResponse } from "next/server";
import { getCachedAircraft } from "@/lib/opensky";
import { getCachedDigitrafficVessels } from "@/lib/digitraffic";
import { FALLBACK_VESSELS } from "@/lib/fallback-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase();
  if (!q || q.length < 2) {
    return NextResponse.json({ success: true, data: { aircraft: [], vessels: [], ais: [] } });
  }

  // Search aircraft (from cache)
  const allAircraft = getCachedAircraft();
  const matchedAircraft = allAircraft
    .filter(
      (a) =>
        a.callsign?.toLowerCase().includes(q) ||
        a.icao24.toLowerCase().includes(q) ||
        a.country.toLowerCase().includes(q)
    )
    .slice(0, 20);

  // Search AIS vessels (from cache)
  const aisVessels = getCachedDigitrafficVessels();
  const matchedAIS = aisVessels
    .filter(
      (v) =>
        String(v.mmsi).includes(q) ||
        v.shipTypeName.toLowerCase().includes(q)
    )
    .slice(0, 20);

  // Search DB/fallback vessels
  const dbVessels = FALLBACK_VESSELS;
  const matchedDB = dbVessels
    .filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.imo.toLowerCase().includes(q) ||
        (v.cargo?.toLowerCase().includes(q) ?? false) ||
        (v.flag?.toLowerCase().includes(q) ?? false)
    )
    .slice(0, 20);

  return NextResponse.json({
    success: true,
    data: {
      aircraft: matchedAircraft.map((a) => ({
        type: "aircraft" as const,
        id: a.icao24,
        title: a.callsign || a.icao24,
        subtitle: `${a.country} — ${a.altitude ? a.altitude.toLocaleString() + " ft" : "N/A"}`,
        lat: a.lat,
        lng: a.lng,
        isCargo: a.isCargo,
      })),
      vessels: matchedDB.map((v) => ({
        type: "vessel" as const,
        id: v.imo,
        title: v.name,
        subtitle: `${v.originPort?.name ?? "?"} → ${v.destPort?.name ?? "?"} — ${v.status.replace("_", " ")}`,
        lat: v.lat,
        lng: v.lng,
        isDelayed: v.isDelayed,
      })),
      ais: matchedAIS.map((v) => ({
        type: "ais" as const,
        id: String(v.mmsi),
        title: `MMSI ${v.mmsi}`,
        subtitle: `${v.shipTypeName} — ${v.speed.toFixed(1)} kn`,
        lat: v.lat,
        lng: v.lng,
      })),
      total: matchedAircraft.length + matchedDB.length + matchedAIS.length,
    },
  });
}
