"use client";

import { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { KPICard } from "@/components/kpi-card";
import { Card } from "@/components/card";
import { DetailPanel, DetailRow } from "@/components/detail-panel";
import { AppShell } from "@/components/app-shell";

interface PortStat {
  name: string;
  country: string;
  lat: number;
  lng: number;
  total: number;
  cargo: number;
  tankers: number;
  passenger: number;
  other: number;
  moving: number;
  anchored: number;
  congestion: "high" | "medium" | "low";
}

interface PortData {
  ports: PortStat[];
  summary: {
    totalPorts: number;
    totalVesselsInPorts: number;
    busiestPort: string;
    highCongestion: number;
  };
}

const fmt = (n: number) => n.toLocaleString("en-US");

const congCls: Record<string, string> = {
  high: "bg-accent-soft2 text-accent",
  medium: "bg-black/8 text-text",
  low: "bg-black/4 text-text3",
};

export default function PortsPage() {
  const { data } = useApi<PortData>("/api/ais/ports", 30_000);
  const [selected, setSelected] = useState<PortStat | null>(null);

  return (
    <AppShell>
    <div className="animate-fade-in max-w-[1400px] mx-auto p-7 px-8 pb-14">
      <div className="mb-7">
        <h1 className="text-[30px] font-bold tracking-[-0.035em]">Port Status</h1>
        <p className="text-sm text-text3 mt-1">
          Real-time vessel count at Baltic ports — Digitraffic AIS data
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-[22px]">
        <KPICard label="Monitored Ports" value={data?.summary.totalPorts ?? "..."} sub="Baltic region" />
        <KPICard label="Vessels in Ports" value={data?.summary.totalVesselsInPorts ? fmt(data.summary.totalVesselsInPorts) : "..."} sub="within port radius" />
        <KPICard label="Busiest Port" value={data?.summary.busiestPort ?? "..."} sub="by vessel count" />
        <KPICard label="High Congestion" value={data?.summary.highCongestion ?? "..."} sub="ports with 30+ vessels" trend={(data?.summary.highCongestion ?? 0) > 0 ? "up" : undefined} />
      </div>

      {/* Port bars */}
      <Card title="Traffic by Port" badge={{ text: "AIS Live" }} className="mb-[22px]">
        <div className="flex flex-col gap-3">
          {data?.ports.map((p) => {
            const max = data.ports[0]?.total || 1;
            const pct = Math.round((p.total / max) * 100);
            return (
              <div key={p.name}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="font-medium">{p.name}, {p.country}</span>
                  <span className="font-bold" style={{ fontFamily: "var(--font-jetbrains)" }}>
                    {p.total} vessels
                  </span>
                </div>
                <div className="flex gap-[2px] h-[6px] rounded overflow-hidden bg-bg2">
                  {p.cargo > 0 && <div style={{ width: `${(p.cargo / max) * 100}%`, background: "#111" }} className="rounded-l" />}
                  {p.tankers > 0 && <div style={{ width: `${(p.tankers / max) * 100}%`, background: "#555" }} />}
                  {p.passenger > 0 && <div style={{ width: `${(p.passenger / max) * 100}%`, background: "#888" }} />}
                  {p.other > 0 && <div style={{ width: `${(p.other / max) * 100}%`, background: "#ccc" }} className="rounded-r" />}
                </div>
              </div>
            );
          })}
          {!data && <div className="text-text3 text-xs text-center py-8">Loading port data...</div>}
        </div>
        <div className="flex gap-4 mt-4 pt-3 border-t border-border">
          {[
            { color: "#111", label: "Cargo" },
            { color: "#555", label: "Tanker" },
            { color: "#888", label: "Passenger" },
            { color: "#ccc", label: "Other" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-[5px] text-[10px] text-text3">
              <span className="w-2 h-2 rounded-full" style={{ background: l.color }} /> {l.label}
            </div>
          ))}
        </div>
      </Card>

      {/* Full table */}
      <Card title="Port Details" badge={{ text: String(data?.ports.length ?? 0), variant: "dark" as const }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Port", "Country", "Total", "Cargo", "Tankers", "Passenger", "Moving", "Anchored", "Congestion"].map((h) => (
                  <th key={h} className="text-[10px] font-semibold uppercase tracking-[0.07em] text-text3 text-left px-3.5 py-[9px] border-b border-border2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.ports.map((p) => (
                <tr key={p.name} className="transition-colors hover:bg-bg2 cursor-pointer" onClick={() => setSelected(p)}>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border font-medium">{p.name}</td>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border text-text2">{p.country}</td>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border font-semibold" style={{ fontFamily: "var(--font-jetbrains)" }}>{p.total}</td>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border font-semibold" style={{ fontFamily: "var(--font-jetbrains)" }}>{p.cargo}</td>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)", color: "#555" }}>{p.tankers}</td>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)", color: "#888" }}>{p.passenger}</td>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)" }}>{p.moving}</td>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)" }}>{p.anchored}</td>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border">
                    <span className={`inline-flex px-[9px] py-[3px] rounded-[20px] text-[10.5px] font-semibold ${congCls[p.congestion]}`}>
                      {p.congestion}
                    </span>
                  </td>
                </tr>
              ))}
              {!data && <tr><td colSpan={9} className="text-center text-text3 text-xs py-8">Loading...</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Port Detail Panel */}
      <DetailPanel open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <>
            <div className="text-[11px] text-text3">{selected.country}</div>
            <h2 className="text-[20px] font-bold mt-1 tracking-[-0.02em]">{selected.name}</h2>
            <span className={`inline-flex px-[9px] py-[3px] rounded-[20px] text-[10.5px] font-semibold mt-2 ${congCls[selected.congestion]}`}>
              {selected.congestion} congestion
            </span>
            <div className="mt-5">
              <DetailRow label="Total Vessels" value={selected.total} mono />
              <DetailRow label="Cargo Vessels" value={selected.cargo} mono />
              <DetailRow label="Tankers" value={selected.tankers} mono />
              <DetailRow label="Passenger" value={selected.passenger} mono />
              <DetailRow label="Other" value={selected.other} mono />
              <DetailRow label="Moving" value={selected.moving} mono />
              <DetailRow label="Anchored/Moored" value={selected.anchored} mono />
              <DetailRow label="Position" value={`${selected.lat.toFixed(3)}, ${selected.lng.toFixed(3)}`} mono />
            </div>
            <a
              href={`/tracking?lat=${selected.lat}&lng=${selected.lng}&zoom=12`}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-xs)] bg-text text-white text-[12px] font-semibold no-underline hover:bg-black/80 transition-colors"
            >
              View on Map
            </a>
            <div className="mt-4 text-[9px] text-text3">Source: Digitraffic AIS — real-time</div>
          </>
        )}
      </DetailPanel>
    </div>
    </AppShell>
  );
}
