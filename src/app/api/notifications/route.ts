import { NextResponse } from "next/server";
import { getCachedAircraft } from "@/lib/opensky";
import { getCachedDigitrafficVessels } from "@/lib/digitraffic";

export const dynamic = "force-dynamic";

interface Notification {
  id: string;
  type: "delay" | "congestion" | "weather" | "geofence" | "system";
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  timestamp: string;
  source: string;
}

export async function GET() {
  const notifications: Notification[] = [];
  const now = new Date().toISOString();

  // 1. Check AIS congestion hotspots
  const aisVessels = getCachedDigitrafficVessels();
  if (aisVessels.length > 0) {
    // Strait of Finland congestion
    const straitVessels = aisVessels.filter(
      (v) => v.lat > 59.0 && v.lat < 60.5 && v.lng > 22 && v.lng < 28 && v.speed > 0.3
    );
    if (straitVessels.length > 100) {
      notifications.push({
        id: "cong-gof",
        type: "congestion",
        severity: straitVessels.length > 200 ? "critical" : "warning",
        title: `Gulf of Finland — ${straitVessels.length} vessels`,
        description: `High traffic density detected. ${straitVessels.filter((v) => v.shipType >= 80 && v.shipType <= 89).length} tankers in transit.`,
        timestamp: now,
        source: "Digitraffic AIS",
      });
    }

    // Oresund strait
    const oresund = aisVessels.filter(
      (v) => v.lat > 55.3 && v.lat < 56.1 && v.lng > 12.4 && v.lng < 13.0 && v.speed > 0.3
    );
    if (oresund.length > 30) {
      notifications.push({
        id: "cong-ore",
        type: "congestion",
        severity: "warning",
        title: `Oresund Strait — ${oresund.length} vessels`,
        description: "Moderate congestion in narrow passage between Denmark and Sweden.",
        timestamp: now,
        source: "Digitraffic AIS",
      });
    }

    // Total fleet notification
    notifications.push({
      id: "ais-status",
      type: "system",
      severity: "info",
      title: `AIS tracking ${aisVessels.length.toLocaleString()} vessels`,
      description: `Baltic Sea fleet: ${aisVessels.filter((v) => v.speed > 0.5).length} moving, ${aisVessels.filter((v) => v.speed <= 0.5).length} stationary.`,
      timestamp: now,
      source: "Digitraffic AIS",
    });
  }

  // 2. Check aircraft data
  const aircraft = getCachedAircraft();
  if (aircraft.length > 0) {
    const cargo = aircraft.filter((a) => a.isCargo);
    notifications.push({
      id: "air-status",
      type: "system",
      severity: "info",
      title: `Tracking ${aircraft.length.toLocaleString()} aircraft`,
      description: `${cargo.length} cargo flights identified worldwide.`,
      timestamp: now,
      source: "OpenSky Network",
    });

    // Cargo density alert
    if (cargo.length > 500) {
      notifications.push({
        id: "cargo-high",
        type: "info" as "geofence",
        severity: "info",
        title: "High cargo flight volume",
        description: `${cargo.length} cargo aircraft airborne — above average.`,
        timestamp: now,
        source: "OpenSky Network",
      });
    }
  }

  // 3. Geofence alerts — check for vessels in sensitive areas
  const sensAreas = [
    { name: "Suomenlinna fortress area", latMin: 60.13, latMax: 60.16, lngMin: 24.96, lngMax: 25.02 },
  ];
  for (const area of sensAreas) {
    const inArea = aisVessels.filter(
      (v) => v.lat > area.latMin && v.lat < area.latMax && v.lng > area.lngMin && v.lng < area.lngMax && v.speed > 2
    );
    if (inArea.length > 0) {
      notifications.push({
        id: `geo-${area.name}`,
        type: "geofence",
        severity: "warning",
        title: `Geofence: ${area.name}`,
        description: `${inArea.length} vessel(s) moving at speed in restricted zone.`,
        timestamp: now,
        source: "Geofence Monitor",
      });
    }
  }

  // Sort: critical first, then warning, then info
  const order = { critical: 0, warning: 1, info: 2 };
  notifications.sort((a, b) => order[a.severity] - order[b.severity]);

  return NextResponse.json({
    success: true,
    data: notifications,
  });
}
