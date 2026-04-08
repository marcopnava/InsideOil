import { NextResponse } from "next/server";
import { getCachedDigitrafficVessels } from "@/lib/digitraffic";

export const dynamic = "force-dynamic";

// Key loading ports in Baltic region
const LOADING_PORTS = [
  { name: "Primorsk", lat: 60.35, lng: 29.0, radius: 0.5 },
  { name: "Ust-Luga", lat: 59.68, lng: 28.4, radius: 0.4 },
  { name: "Ventspils", lat: 57.4, lng: 21.55, radius: 0.3 },
  { name: "Butinge", lat: 56.07, lng: 21.0, radius: 0.3 },
  { name: "Gdansk", lat: 54.4, lng: 18.67, radius: 0.3 },
  { name: "Gothenburg", lat: 57.7, lng: 11.93, radius: 0.3 },
  { name: "Mongstad", lat: 60.8, lng: 5.02, radius: 0.4 },
  { name: "Sture", lat: 60.6, lng: 4.85, radius: 0.3 },
];

function dist(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return Math.sqrt((lat1 - lat2) ** 2 + (lng1 - lng2) ** 2);
}

export async function GET() {
  try {
    const all = getCachedDigitrafficVessels();
    const tankers = all.filter((v) => v.shipType >= 80 && v.shipType <= 89);

    // Ballast tankers: moving fast (>12kn typically = empty) OR heading with "ORDERS"/"LOAD"
    const ballast = tankers.filter((v) => {
      if (v.speed >= 13) return true; // Fast = likely empty
      const d = (v.destination ?? "").toUpperCase();
      if (d.includes("ORDER") || d.includes("LOAD") || d.includes("WAITING")) return true;
      return false;
    });

    // Count ballast tankers near each loading port
    const portAvailability = LOADING_PORTS.map((port) => {
      const nearby = ballast.filter((v) => dist(v.lat, v.lng, port.lat, port.lng) < port.radius);
      const approaching = ballast.filter((v) => {
        const d = dist(v.lat, v.lng, port.lat, port.lng);
        return d >= port.radius && d < port.radius * 3 && v.speed > 5;
      });

      return {
        port: port.name,
        lat: port.lat,
        lng: port.lng,
        nearbyBallast: nearby.length,
        approaching: approaching.length,
        totalAvailable: nearby.length + approaching.length,
        vessels: nearby.slice(0, 5).map((v) => ({
          mmsi: v.mmsi,
          name: v.name,
          speed: v.speed,
          destination: v.destination,
        })),
      };
    });

    portAvailability.sort((a, b) => b.totalAvailable - a.totalAvailable);

    // Market signal
    const totalBallast = ballast.length;
    const totalMoving = tankers.filter((v) => v.speed > 0.5).length;
    const ballastRatio = totalMoving > 0 ? totalBallast / totalMoving : 0;

    return NextResponse.json({
      success: true,
      data: {
        ballastFleet: {
          total: totalBallast,
          bySpeed: {
            fast: ballast.filter((v) => v.speed >= 13).length,
            forOrders: ballast.filter((v) => (v.destination ?? "").toUpperCase().includes("ORDER")).length,
          },
        },
        portAvailability,
        marketSignal: {
          ballastRatio: Math.round(ballastRatio * 100),
          interpretation: ballastRatio > 0.3
            ? "High ballast ratio — ample tonnage available. Charterers have leverage — freight rates likely soft."
            : ballastRatio > 0.15
              ? "Balanced fleet positioning. Market in equilibrium."
              : "Low ballast availability — tight tonnage. Owners have leverage — freight rates likely firm.",
          sentiment: ballastRatio > 0.3 ? "bearish" : ballastRatio < 0.15 ? "bullish" : "neutral" as "bullish" | "bearish" | "neutral",
        },
        source: "Digitraffic AIS — speed-based ballast estimation",
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
