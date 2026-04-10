"use client";

import { useApi } from "@/hooks/use-api";
import { Card } from "@/components/card";
import { AppShell } from "@/components/app-shell";
import { PageHelp } from "@/components/page-help";
import { ExternalVesselLinks } from "@/components/external-vessel-links";
import Link from "next/link";

const RUSSIA_HELP = {
  title: "Russia Tanker Tracker — what am I looking at?",
  intro:
    "Real-time tanker activity at Russian crude export terminals: Primorsk, Ust-Luga, Novorossiysk, Kozmino. Plus a dark-fleet detector flagging tankers near Russian terminals with missing identity or obfuscated destination — typical sanctions-evasion signature.",
  sections: [
    {
      title: "Why this matters",
      body: [
        "Russia exports ~5 million b/d of crude. Since 2022 sanctions, much of it is moved by 'dark fleet' tankers operating outside G7 insurance.",
        "Compliance teams in oil majors and banks must monitor this. We make it visible.",
      ],
    },
    {
      title: "Terminal cards",
      body: [
        "Each card shows live tanker count and estimated barrels currently 'on site' (anchored or loading).",
        "Click any vessel name to open its full track page with the recent route.",
        "Click [MT] [VF] [FM] [MST] to cross-check on external trackers.",
      ],
    },
    {
      title: "Dark Fleet Detector",
      body: [
        "Tankers detected near Russian terminals with one of:",
        "• No IMO number (suspicious — modern tankers have IMO)",
        "• No destination field (intentionally hidden)",
        "These are classic sanctions evasion signatures. Confirmation requires more digging (vessel history, ownership) — we just flag candidates.",
      ],
    },
    {
      title: "Coverage caveats",
      body: [
        "Baltic terminals (Primorsk, Ust-Luga) are well covered by terrestrial AIS.",
        "Black Sea (Novorossiysk) coverage is decent.",
        "Far East (Kozmino) has weaker coverage in the free feed.",
      ],
    },
  ],
};

interface Vessel {
  mmsi: number;
  imo: number | null;
  name: string | null;
  draught: number | null;
  speed: number | null;
  destination: string | null;
  navStatus: string | null;
  lat?: number;
  lng?: number;
  reason?: string;
}

interface Terminal {
  id: string;
  name: string;
  tankerCount: number;
  estimatedBblOnSite: number;
  vessels: Vessel[];
}

interface RussiaData {
  terminals: Terminal[];
  darkFleet: { count: number; vessels: Vessel[] };
  summary: { totalTankersTracked: number; totalEstimatedBbl: number; darkFleetSuspects: number };
}

const fmt = (n: number) => n.toLocaleString("en-US");

export default function RussiaPage() {
  const { data, loading } = useApi<RussiaData>("/api/russia", 60_000);

  return (
    <AppShell>
      <PageHelp {...RUSSIA_HELP} />
      <div className="animate-fade-in max-w-[1400px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
        <div className="mb-6">
          <div className="text-[11px] font-semibold text-text3 uppercase tracking-[0.07em]">Sanctions Intelligence</div>
          <h1 className="text-[30px] font-bold tracking-[-0.035em] mt-1">Russia Tanker Tracker</h1>
          <p className="text-sm text-text3 mt-1">
            Live activity at Russian crude export terminals · dark-fleet detection
          </p>
        </div>

        {loading && <div className="text-text3 text-xs">Loading…</div>}

        {data && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-3.5">
              <StatBox label="Tankers Tracked" value={fmt(data.summary.totalTankersTracked)} sub="last 60 min" />
              <StatBox label="Est. Barrels On-Site" value={`${(data.summary.totalEstimatedBbl / 1_000_000).toFixed(1)}M`} sub="across all terminals" />
              <StatBox label="Dark Fleet Suspects" value={fmt(data.summary.darkFleetSuspects)} sub="missing IMO / dest." highlight={data.summary.darkFleetSuspects > 0} />
              <StatBox label="Terminals Monitored" value={fmt(data.terminals.length)} sub="Baltic + Black Sea + Far East" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">
              {data.terminals.map((t) => (
                <Card
                  key={t.id}
                  title={t.name}
                  badge={
                    t.tankerCount > 0
                      ? { text: `${t.tankerCount} tankers`, variant: "accent" }
                      : { text: "no activity", variant: "dark" }
                  }
                >
                  <div className="text-[11px] text-text3 mb-2">
                    Estimated barrels on-site: <span className="text-text font-semibold">{fmt(t.estimatedBblOnSite)}</span>
                  </div>
                  {t.vessels.length === 0 ? (
                    <div className="text-text3 text-xs">No tankers in radius right now.</div>
                  ) : (
                    <div className="scroll-x -mx-6 px-6 max-h-[280px] overflow-y-auto">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em]">
                            <th className="py-1.5 pr-3 text-left">Vessel</th>
                            <th className="py-1.5 pr-3 text-right">Speed</th>
                            <th className="py-1.5 pr-3 text-left">Destination</th>
                          </tr>
                        </thead>
                        <tbody>
                          {t.vessels.map((v) => (
                            <tr key={v.mmsi} className="border-t border-border">
                              <td className="py-1.5 pr-3 font-medium">
                                <Link href={`/vessels/${v.mmsi}`} className="text-text hover:text-accent no-underline">
                                  {v.name ?? `MMSI ${v.mmsi}`}
                                </Link>
                                <ExternalVesselLinks mmsi={v.mmsi} imo={v.imo} />
                              </td>
                              <td className="py-1.5 pr-3 text-right" style={{ fontFamily: "var(--font-jetbrains)" }}>
                                {v.speed != null ? `${v.speed.toFixed(1)}` : "—"}
                              </td>
                              <td className="py-1.5 pr-3 text-text2 truncate max-w-[140px]">{v.destination ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <Card
              title="Dark Fleet Candidates"
              badge={
                data.darkFleet.count > 0
                  ? { text: `${data.darkFleet.count} suspects`, variant: "accent" }
                  : { text: "none", variant: "dark" }
              }
            >
              {data.darkFleet.vessels.length === 0 ? (
                <div className="text-text3 text-xs">
                  No tanker matches the dark-fleet signature near Russian terminals right now. This typically appears when sanctioned tonnage is loading.
                </div>
              ) : (
                <div className="scroll-x -mx-6 px-6 max-h-[420px] overflow-y-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em]">
                        <th className="py-1.5 pr-3 text-left">Vessel</th>
                        <th className="py-1.5 pr-3 text-left">Reason</th>
                        <th className="py-1.5 pr-3 text-right">Speed</th>
                        <th className="py-1.5 pr-3 text-left">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.darkFleet.vessels.map((v) => (
                        <tr key={v.mmsi} className="border-t border-border bg-accent-soft/30">
                          <td className="py-1.5 pr-3 font-medium">
                            <Link href={`/vessels/${v.mmsi}`} className="text-text hover:text-accent no-underline">
                              {v.name ?? `MMSI ${v.mmsi}`}
                            </Link>
                            <ExternalVesselLinks mmsi={v.mmsi} imo={v.imo} />
                          </td>
                          <td className="py-1.5 pr-3 text-accent font-bold">{v.reason}</td>
                          <td className="py-1.5 pr-3 text-right" style={{ fontFamily: "var(--font-jetbrains)" }}>
                            {v.speed != null ? v.speed.toFixed(1) : "—"}
                          </td>
                          <td className="py-1.5 pr-3 text-text3" style={{ fontFamily: "var(--font-jetbrains)" }}>
                            {v.lat != null && v.lng != null ? `${v.lat.toFixed(2)}, ${v.lng.toFixed(2)}` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}

function StatBox({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className="bg-bg3 border border-border rounded-[var(--radius)] p-[14px_16px]">
      <div className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em] mb-1">{label}</div>
      <div className={`text-[20px] font-bold tracking-[-0.03em] leading-none ${highlight ? "text-accent" : ""}`}>{value}</div>
      <div className="text-[9px] text-text3 mt-1">{sub}</div>
    </div>
  );
}
