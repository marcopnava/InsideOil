import { NextRequest, NextResponse } from "next/server";
import { getCachedDigitrafficVessels } from "@/lib/digitraffic";

export const dynamic = "force-dynamic";

// Strategic significance of major destinations
const DEST_INTEL: Record<string, string> = {
  "PORT SAID": "Northern entrance to Suez Canal. High tanker traffic indicates strong East→West crude flow. Surge = Asian demand pulling barrels from Atlantic basin.",
  "EGPSD": "Port Said (UNLOC code). Same as PORT SAID — Suez Canal transit indicator.",
  "EG PSD": "Port Said variant. Suez Canal gateway.",
  "FOR ORDERS": "Vessel waiting for destination assignment. High count = market uncertainty, traders holding cargoes speculatively or waiting for better price signals.",
  "SKAW": "Skagen, Denmark — mandatory reporting point for Baltic exits. High count = increased Baltic crude exports (Russian, Norwegian).",
  "DK SKA": "Skagen UNLOC. Same as SKAW.",
  "ROTTERDAM": "Europe's largest refining hub. Increased tanker arrivals = rising European crude demand or inventory builds.",
  "NLRTM": "Rotterdam UNLOC. Key indicator for NW European refining margins.",
  "FUJAIRAH": "UAE bunkering/storage hub. Floating storage indicator for Middle East crude.",
  "SINGAPORE": "Asia's main bunkering port. Tanker traffic = Asian crude demand proxy.",
  "HOUSTON": "US Gulf Coast refining center. Traffic indicates US crude import demand.",
  "PRIMORSK": "Russia's main Baltic crude export terminal. Traffic = Russian crude supply indicator.",
  "UST-LUGA": "Russian Baltic export terminal. Key for monitoring Russian crude export volumes.",
  "GDANSK": "Polish oil terminal. Receives crude via pipeline and sea — CEE demand indicator.",
  "GOTHENBURG": "Sweden's largest port. Receives refined products — Scandinavian demand.",
  "BROFJORDEN": "Swedish refinery port (Preem). Tanker arrivals = Nordic refining activity.",
  "VENTSPILS": "Latvian oil terminal. Historical Russian crude transit point.",
};

function getIntel(dest: string): string {
  const key = dest.toUpperCase().trim();
  if (DEST_INTEL[key]) return DEST_INTEL[key];
  // Generic intel
  if (key.includes("ORDER")) return "Vessel awaiting destination — speculative cargo or market uncertainty signal.";
  if (key.match(/^[A-Z]{2}\s?[A-Z]{3}$/)) return "UNLOC port code. Click to view on map for geographic context.";
  return "Destination port. Monitor traffic changes over time for supply/demand shifts.";
}

export async function GET(req: NextRequest) {
  const dest = req.nextUrl.searchParams.get("dest")?.toUpperCase().trim();
  if (!dest) {
    return NextResponse.json({ success: false, error: "Missing dest param" }, { status: 400 });
  }

  try {
    const all = getCachedDigitrafficVessels();
    const tankers = all.filter((v) => v.shipType >= 80 && v.shipType <= 89);

    // Find tankers heading to this destination
    const heading = tankers.filter((v) => {
      const d = v.destination?.toUpperCase().trim();
      return d === dest || d?.includes(dest) || dest.includes(d ?? "");
    });

    const moving = heading.filter((v) => v.speed > 0.5);
    const anchored = heading.filter((v) => v.speed <= 0.5);

    const avgSpeed = moving.length > 0
      ? Math.round((moving.reduce((s, v) => s + v.speed, 0) / moving.length) * 10) / 10
      : 0;

    // Individual vessel details
    const vessels = heading.slice(0, 20).map((v) => ({
      mmsi: v.mmsi,
      name: v.name,
      imo: v.imo,
      speed: v.speed,
      status: v.statusName,
      lat: v.lat,
      lng: v.lng,
      callSign: v.callSign,
    }));

    // Compare to all tanker traffic — what % is heading here?
    const shareOfFleet = tankers.length > 0
      ? Math.round((heading.length / tankers.length) * 1000) / 10
      : 0;

    // Speed analysis — are they rushing or slow steaming?
    const speedAssessment = avgSpeed > 12
      ? "High speed — suggests urgency or time-sensitive cargo"
      : avgSpeed > 8
        ? "Normal transit speed — standard delivery"
        : avgSpeed > 3
          ? "Below normal — potential slow steaming or congested approach"
          : "Very slow or maneuvering — likely in port approach or anchored nearby";

    return NextResponse.json({
      success: true,
      data: {
        destination: dest,
        intel: getIntel(dest),
        count: heading.length,
        moving: moving.length,
        anchored: anchored.length,
        avgSpeed,
        speedAssessment,
        shareOfFleet,
        vessels,
        tradingImplication: heading.length > 10
          ? `Significant tanker concentration (${heading.length} vessels, ${shareOfFleet}% of fleet). ${avgSpeed > 10 ? "Fast arrivals suggest tight supply at destination." : "Normal pace — routine deliveries."}`
          : heading.length > 3
            ? `Moderate traffic to ${dest}. Monitor for changes — increase could signal shifting trade flows.`
            : `Low traffic to ${dest}. Either minor port or unusual routing — could indicate trade disruption or new arbitrage.`,
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
