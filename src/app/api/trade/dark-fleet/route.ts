import { NextResponse } from "next/server";
import { getCachedDigitrafficVessels } from "@/lib/digitraffic";

export const dynamic = "force-dynamic";

// Track MMSI history to detect AIS gaps
let previousSnapshot: Map<number, { lat: number; lng: number; speed: number; name: string | null; ts: number }> = new Map();
let darkCandidates: Array<{
  mmsi: number; name: string | null; lastLat: number; lastLng: number;
  lastSpeed: number; lastSeen: number; gapMinutes: number;
}> = [];

export async function GET() {
  try {
    const current = getCachedDigitrafficVessels();
    const tankers = current.filter((v) => v.shipType >= 80 && v.shipType <= 89);
    const now = Date.now();

    // Build current MMSI set
    const currentMMSI = new Set(tankers.map((v) => v.mmsi));

    // Detect vessels that were in previous snapshot but not in current
    if (previousSnapshot.size > 0) {
      const newDark: typeof darkCandidates = [];

      for (const [mmsi, prev] of previousSnapshot) {
        if (!currentMMSI.has(mmsi)) {
          const gapMinutes = Math.round((now - prev.ts) / 60000);
          // Only flag if gap > 10 min and vessel was moving
          if (gapMinutes > 10 && prev.speed > 2) {
            newDark.push({
              mmsi,
              name: prev.name,
              lastLat: prev.lat,
              lastLng: prev.lng,
              lastSpeed: prev.speed,
              lastSeen: prev.ts,
              gapMinutes,
            });
          }
        }
      }

      // Merge with existing dark candidates (keep last 50)
      darkCandidates = [...newDark, ...darkCandidates.filter((d) => now - d.lastSeen < 3600000)].slice(0, 50);
    }

    // Update snapshot
    previousSnapshot = new Map();
    for (const v of tankers) {
      previousSnapshot.set(v.mmsi, { lat: v.lat, lng: v.lng, speed: v.speed, name: v.name, ts: now });
    }

    // Suspicious behavior: tankers near sensitive areas moving slowly (potential STS transfer)
    const stsZones = [
      { name: "Kalamata STS zone", latMin: 36.5, latMax: 37.5, lngMin: 21.5, lngMax: 23.0 },
      { name: "Ceuta STS zone", latMin: 35.7, latMax: 36.1, lngMin: -5.5, lngMax: -5.0 },
      { name: "Skaw anchorage", latMin: 57.5, latMax: 58.0, lngMin: 10.0, lngMax: 11.0 },
    ];

    const stsActivity = stsZones.map((zone) => {
      const inZone = tankers.filter(
        (v) => v.lat >= zone.latMin && v.lat <= zone.latMax && v.lng >= zone.lngMin && v.lng <= zone.lngMax
      );
      const stationaryTankers = inZone.filter((v) => v.speed < 1);
      return {
        zone: zone.name,
        tankersPresent: inZone.length,
        stationary: stationaryTankers.length,
        potentialSTS: stationaryTankers.length >= 2,
        vessels: stationaryTankers.slice(0, 5).map((v) => ({ mmsi: v.mmsi, name: v.name, speed: v.speed })),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        darkFleet: {
          candidates: darkCandidates,
          count: darkCandidates.length,
          note: "Tankers that disappeared from AIS while moving. May indicate AIS transponder off (sanctions evasion), entering areas outside Digitraffic coverage, or technical issues.",
        },
        stsMonitor: {
          zones: stsActivity,
          activeSTS: stsActivity.filter((z) => z.potentialSTS).length,
          note: "Zones where ship-to-ship transfers commonly occur. Two or more stationary tankers in close proximity may indicate STS operations.",
        },
        fleetIntegrity: {
          totalTankers: tankers.length,
          withAIS: currentMMSI.size,
          monitoringSince: previousSnapshot.size > 0 ? "Active" : "Initializing (need 2 data cycles)",
        },
        source: "Digitraffic AIS — gap detection and behavioral analysis",
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
