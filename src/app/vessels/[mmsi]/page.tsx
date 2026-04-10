"use client";

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AppShell } from "@/components/app-shell";
import { ExternalVesselLinks } from "@/components/external-vessel-links";
import { PageHelp } from "@/components/page-help";

const VESSEL_HELP = {
  title: "Vessel Detail — what am I looking at?",
  intro:
    "Live position, identity, and recent track of a single vessel from the global AIS feed. Position history is sampled every ~5 minutes by the AISStream worker.",
  sections: [
    {
      title: "Vessel Identity",
      body: [
        "MMSI = 9-digit Maritime Mobile Service Identity (radio beacon ID).",
        "IMO = 7-digit International Maritime Organization number, permanent vessel identifier.",
        "Call Sign = vessel radio callsign.",
        "Ship Type = AIS code (80-89 = tanker, 70-79 = cargo).",
        "Draught = max static draught in metres. ≥17m suggests VLCC class.",
      ],
    },
    {
      title: "Track on map",
      body: [
        "The orange polyline is the vessel's path over the requested window (default 24h).",
        "The marker at the end is the latest reported position.",
        "You can switch the window between 6h, 24h, 72h, 7d.",
      ],
    },
    {
      title: "External providers",
      body: [
        "Top-right links open the vessel page on MarineTraffic, VesselFinder, FleetMon, MyShipTracking — for cross-checking with their commercial coverage.",
        "These are 100% free public pages.",
      ],
    },
  ],
};

interface VesselData {
  vessel: {
    mmsi: number;
    imo: number | null;
    name: string | null;
    callSign: string | null;
    shipType: number | null;
    shipTypeName: string | null;
    destination: string | null;
    eta: string | null;
    draught: number | null;
    lat: number;
    lng: number;
    speed: number | null;
    course: number | null;
    heading: number | null;
    navStatusName: string | null;
    lastSeen: string;
  };
  positions: Array<{ lat: number; lng: number; speed: number | null; course: number | null; t: string }>;
  count: number;
  hours: number;
}

const VesselTrackMap = dynamic(() => import("@/components/vessel-track-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[440px] flex items-center justify-center bg-bg2 rounded-[var(--radius)] border border-border">
      <div className="text-text3 text-xs">Loading map…</div>
    </div>
  ),
});

export default function VesselDetailPage({ params }: { params: Promise<{ mmsi: string }> }) {
  const { mmsi } = use(params);
  const [hours, setHours] = useState(24);
  const [data, setData] = useState<VesselData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/vessels/${mmsi}/track?hours=${hours}`)
      .then((r) => r.json())
      .then((j) => {
        if (!active) return;
        if (j.success) {
          setData(j.data);
          setError(null);
        } else {
          setError(j.error || "unknown error");
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [mmsi, hours]);

  return (
    <AppShell>
      <PageHelp {...VESSEL_HELP} />
      <div className="animate-fade-in max-w-[1400px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
        {loading && <div className="text-text3 text-xs">Loading vessel…</div>}
        {error && (
          <div className="bg-bg3 border border-border rounded-[var(--radius)] p-5">
            <div className="text-[10px] font-semibold text-accent uppercase tracking-[0.07em] mb-2">Vessel not found</div>
            <div className="text-xs text-text2">{error}</div>
            <div className="text-[11px] text-text3 mt-3">
              The vessel may not have transmitted to AISStream in the last hour. Try the external trackers below:
            </div>
            <div className="mt-2">
              <ExternalVesselLinks mmsi={mmsi} size="sm" />
            </div>
          </div>
        )}
        {data && (
          <>
            <div className="mb-6">
              <div className="text-[11px] font-semibold text-text3 uppercase tracking-[0.07em]">Vessel Detail</div>
              <h1 className="text-[30px] font-bold tracking-[-0.035em] mt-1 flex items-center flex-wrap gap-3">
                {data.vessel.name ?? `MMSI ${data.vessel.mmsi}`}
                <ExternalVesselLinks mmsi={data.vessel.mmsi} imo={data.vessel.imo} size="sm" />
              </h1>
              <p className="text-sm text-text3 mt-1">
                {data.vessel.shipTypeName ?? "Unknown type"} · {data.vessel.callSign ?? "no call sign"} · IMO {data.vessel.imo ?? "—"}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5 mb-3.5">
              <Stat label="MMSI" value={String(data.vessel.mmsi)} />
              <Stat label="IMO" value={data.vessel.imo ? String(data.vessel.imo) : "—"} />
              <Stat label="Speed" value={data.vessel.speed != null ? `${data.vessel.speed.toFixed(1)} kn` : "—"} />
              <Stat label="Course" value={data.vessel.course != null ? `${Math.round(data.vessel.course)}°` : "—"} />
              <Stat label="Draught" value={data.vessel.draught != null ? `${data.vessel.draught} m` : "—"} />
              <Stat label="Status" value={data.vessel.navStatusName ?? "—"} small />
            </div>

            <div className="bg-bg3 border border-border rounded-[var(--radius)] p-4 mb-3.5">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                <div>
                  <div className="text-[10px] font-semibold text-text3 uppercase tracking-[0.07em]">
                    Track — last {hours}h ({data.count} samples)
                  </div>
                  <div className="text-[11px] text-text2 mt-1">
                    Destination: <span className="text-text font-medium">{data.vessel.destination ?? "—"}</span>
                    {data.vessel.eta && <> · ETA: <span className="text-text font-medium">{data.vessel.eta}</span></>}
                  </div>
                </div>
                <div className="flex gap-1">
                  {[6, 24, 72, 168].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHours(h)}
                      className={`text-[10px] font-bold px-2 py-1 rounded ${
                        hours === h ? "bg-text text-white" : "bg-black/6 text-text2 hover:bg-black/12"
                      }`}
                    >
                      {h < 24 ? `${h}h` : `${h / 24}d`}
                    </button>
                  ))}
                </div>
              </div>
              <VesselTrackMap
                positions={data.positions}
                current={{ lat: data.vessel.lat, lng: data.vessel.lng, name: data.vessel.name ?? `MMSI ${data.vessel.mmsi}` }}
              />
              {data.positions.length < 3 && (
                <div className="text-[11px] text-text3 mt-3">
                  Not enough position samples in the selected window — the worker has only been recording this vessel recently. Try a longer window or come back in a few hours.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="bg-bg3 border border-border rounded-[var(--radius)] p-[14px_16px]">
      <div className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em] mb-1">{label}</div>
      <div className={`${small ? "text-[12px]" : "text-[18px]"} font-bold tracking-[-0.02em] leading-none`}>{value}</div>
    </div>
  );
}
