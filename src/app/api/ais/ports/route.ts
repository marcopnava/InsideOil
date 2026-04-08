import { NextResponse } from "next/server";
import { fetchDigitrafficVessels } from "@/lib/digitraffic";

export const dynamic = "force-dynamic";

// Major Baltic ports with their approximate bounding boxes
const PORTS = [
  { name: "Helsinki", country: "Finland", lat: 60.16, lng: 24.94, radius: 0.15 },
  { name: "Tallinn", country: "Estonia", lat: 59.45, lng: 24.76, radius: 0.12 },
  { name: "Stockholm", country: "Sweden", lat: 59.33, lng: 18.07, radius: 0.15 },
  { name: "Gothenburg", country: "Sweden", lat: 57.7, lng: 11.93, radius: 0.12 },
  { name: "Copenhagen", country: "Denmark", lat: 55.69, lng: 12.6, radius: 0.15 },
  { name: "Gdansk", country: "Poland", lat: 54.4, lng: 18.67, radius: 0.15 },
  { name: "Riga", country: "Latvia", lat: 57.0, lng: 24.1, radius: 0.12 },
  { name: "St. Petersburg", country: "Russia", lat: 59.93, lng: 30.3, radius: 0.2 },
  { name: "Turku", country: "Finland", lat: 60.44, lng: 22.23, radius: 0.1 },
  { name: "Klaipeda", country: "Lithuania", lat: 55.72, lng: 21.12, radius: 0.1 },
  { name: "Kotka", country: "Finland", lat: 60.47, lng: 26.95, radius: 0.1 },
  { name: "Hamina", country: "Finland", lat: 60.57, lng: 27.18, radius: 0.08 },
  { name: "Rostock", country: "Germany", lat: 54.15, lng: 12.1, radius: 0.12 },
  { name: "Lubeck", country: "Germany", lat: 53.9, lng: 10.87, radius: 0.1 },
  { name: "Malmo", country: "Sweden", lat: 55.61, lng: 13.0, radius: 0.1 },
];

function distance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return Math.sqrt((lat1 - lat2) ** 2 + (lng1 - lng2) ** 2);
}

export async function GET() {
  try {
    const vessels = await fetchDigitrafficVessels();

    const portStats = PORTS.map((port) => {
      const nearby = vessels.filter(
        (v) => distance(v.lat, v.lng, port.lat, port.lng) < port.radius
      );
      const cargo = nearby.filter((v) => v.shipType >= 70 && v.shipType <= 79);
      const tankers = nearby.filter((v) => v.shipType >= 80 && v.shipType <= 89);
      const passenger = nearby.filter((v) => v.shipType >= 60 && v.shipType <= 69);
      const moving = nearby.filter((v) => v.speed > 0.5);
      const anchored = nearby.filter((v) => v.speed <= 0.5);

      return {
        ...port,
        total: nearby.length,
        cargo: cargo.length,
        tankers: tankers.length,
        passenger: passenger.length,
        other: nearby.length - cargo.length - tankers.length - passenger.length,
        moving: moving.length,
        anchored: anchored.length,
        congestion: nearby.length > 30 ? "high" : nearby.length > 15 ? "medium" : "low",
      };
    });

    // Sort by traffic volume
    portStats.sort((a, b) => b.total - a.total);

    return NextResponse.json({
      success: true,
      data: {
        ports: portStats,
        summary: {
          totalPorts: portStats.length,
          totalVesselsInPorts: portStats.reduce((s, p) => s + p.total, 0),
          busiestPort: portStats[0]?.name ?? "N/A",
          highCongestion: portStats.filter((p) => p.congestion === "high").length,
        },
        source: "Digitraffic AIS — real-time vessel positions",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
