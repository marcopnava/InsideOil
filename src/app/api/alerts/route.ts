import { NextResponse } from "next/server";
import { getCachedDigitrafficVessels } from "@/lib/digitraffic";
import { getCachedAircraft } from "@/lib/opensky";

export const dynamic = "force-dynamic";

// Generate alerts dynamically from real data — no seeded/fake alerts
export async function GET() {
  try {
    const alerts: Array<{
      id: string; type: string; severity: "CRITICAL" | "WARNING" | "INFO";
      title: string; description: string; isRead: boolean; isResolved: boolean;
      entityType: string | null; entityId: string | null; userId: string | null;
      createdAt: string; resolvedAt: string | null;
    }> = [];

    const now = new Date().toISOString();
    const aisVessels = getCachedDigitrafficVessels();
    const aircraft = getCachedAircraft();

    // 1. AIS congestion alerts (real)
    if (aisVessels.length > 0) {
      const gofVessels = aisVessels.filter(
        (v) => v.lat > 59.0 && v.lat < 60.5 && v.lng > 22 && v.lng < 28 && v.speed > 0.3
      );
      if (gofVessels.length > 100) {
        alerts.push({
          id: "ais-gof", type: "CONGESTION", severity: gofVessels.length > 200 ? "CRITICAL" : "WARNING",
          title: `Gulf of Finland — ${gofVessels.length} vessels in transit`,
          description: `High traffic density. ${gofVessels.filter((v) => v.shipType >= 80 && v.shipType <= 89).length} tankers detected.`,
          isRead: false, isResolved: false, entityType: "route", entityId: null, userId: null, createdAt: now, resolvedAt: null,
        });
      }

      // Tanker fleet size
      const tankers = aisVessels.filter((v) => v.shipType >= 80 && v.shipType <= 89);
      const anchoredTankers = tankers.filter((v) => v.speed <= 0.5);
      if (anchoredTankers.length > 300) {
        alerts.push({
          id: "ais-storage", type: "CAPACITY", severity: "WARNING",
          title: `Floating storage: ${anchoredTankers.length} tankers anchored`,
          description: `${Math.round(anchoredTankers.length / tankers.length * 100)}% of tanker fleet stationary. Possible oversupply signal.`,
          isRead: false, isResolved: false, entityType: "fleet", entityId: null, userId: null, createdAt: now, resolvedAt: null,
        });
      }

      // AIS fleet status
      alerts.push({
        id: "ais-status", type: "SYSTEM", severity: "INFO",
        title: `AIS tracking ${aisVessels.length.toLocaleString()} vessels`,
        description: `${aisVessels.filter((v) => v.speed > 0.5).length} moving, ${aisVessels.filter((v) => v.speed <= 0.5).length} stationary. ${tankers.length} tankers.`,
        isRead: false, isResolved: false, entityType: null, entityId: null, userId: null, createdAt: now, resolvedAt: null,
      });
    }

    // 2. Aircraft alerts (real)
    if (aircraft.length > 0) {
      const cargo = aircraft.filter((a) => a.isCargo);
      alerts.push({
        id: "air-status", type: "SYSTEM", severity: "INFO",
        title: `${aircraft.length.toLocaleString()} aircraft tracked`,
        description: `${cargo.length} cargo flights identified worldwide via OpenSky Network.`,
        isRead: false, isResolved: false, entityType: null, entityId: null, userId: null, createdAt: now, resolvedAt: null,
      });
    }

    // Sort: critical first
    const order = { CRITICAL: 0, WARNING: 1, INFO: 2 };
    alerts.sort((a, b) => order[a.severity] - order[b.severity]);

    return NextResponse.json({ success: true, data: alerts });
  } catch (e) {
    return NextResponse.json({ success: true, data: [] });
  }
}
