import { NextResponse } from "next/server";
import { getCachedDigitrafficVessels } from "@/lib/digitraffic";

export const dynamic = "force-dynamic";

// Baltic chokepoints we can monitor with Digitraffic AIS
const CHOKEPOINTS = [
  { name: "Danish Straits (Oresund)", latMin: 55.3, latMax: 56.1, lngMin: 12.4, lngMax: 13.2, strategic: "Gateway between Baltic and North Sea. All Baltic oil exports pass through here." },
  { name: "Great Belt", latMin: 55.2, latMax: 55.8, lngMin: 10.8, lngMax: 11.4, strategic: "Main deep-water passage for large tankers exiting the Baltic." },
  { name: "Gulf of Finland", latMin: 59.4, latMax: 60.5, lngMin: 23.0, lngMax: 28.0, strategic: "Route to Russian oil terminals (Primorsk, Ust-Luga). Key for Russian crude exports." },
  { name: "Kiel Canal approach", latMin: 54.3, latMax: 54.5, lngMin: 10.0, lngMax: 10.3, strategic: "Shortcut between Baltic and North Sea. Used by smaller tankers to save transit time." },
  { name: "Gotland passage", latMin: 57.0, latMax: 58.5, lngMin: 18.0, lngMax: 20.0, strategic: "Central Baltic transit zone. High tanker traffic between Russian and European ports." },
  { name: "Aland Sea", latMin: 59.5, latMax: 60.5, lngMin: 19.0, lngMax: 21.0, strategic: "Passage between Sweden and Finland. Tanker traffic to/from Turku and Stockholm." },
];

function inBox(lat: number, lng: number, c: typeof CHOKEPOINTS[0]) {
  return lat >= c.latMin && lat <= c.latMax && lng >= c.lngMin && lng <= c.lngMax;
}

export async function GET() {
  try {
    const vessels = getCachedDigitrafficVessels();

    const results = CHOKEPOINTS.map((cp) => {
      const inZone = vessels.filter((v) => inBox(v.lat, v.lng, cp));
      const tankers = inZone.filter((v) => v.shipType >= 80 && v.shipType <= 89);
      const cargo = inZone.filter((v) => v.shipType >= 70 && v.shipType <= 79);
      const moving = inZone.filter((v) => v.speed > 0.5);

      return {
        ...cp,
        totalVessels: inZone.length,
        tankers: tankers.length,
        cargo: cargo.length,
        other: inZone.length - tankers.length - cargo.length,
        moving: moving.length,
        congestion: inZone.length > 50 ? "high" : inZone.length > 20 ? "medium" : "low",
        avgSpeed: moving.length > 0
          ? Math.round((moving.reduce((s, v) => s + v.speed, 0) / moving.length) * 10) / 10
          : 0,
      };
    });

    results.sort((a, b) => b.totalVessels - a.totalVessels);

    return NextResponse.json({
      success: true,
      data: {
        chokepoints: results,
        totalTankersInChokepoints: results.reduce((s, c) => s + c.tankers, 0),
        source: "Digitraffic AIS — real-time",
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
