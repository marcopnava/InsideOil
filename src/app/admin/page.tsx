"use client";

import { useApi } from "@/hooks/use-api";
import { KPICard } from "@/components/kpi-card";
import { Card } from "@/components/card";
import { AppShell } from "@/components/app-shell";

interface AISStats { stats: { total: number; cargo: number; tankers: number; moving: number; anchored: number } }
interface AircraftStats { stats: { total: number; cargo: number } }
interface PortData { ports: Array<{ name: string; total: number; congestion: string }> }
interface DecisionData { decision: string; confidence: string; prices: { wti: number | null; brent: number | null; crack321: number | null } }

const fmt = (n: number) => n.toLocaleString("en-US");

export default function AdminOverview() {
  const { data: ais } = useApi<AISStats>("/api/ais", 30_000);
  const { data: air } = useApi<AircraftStats>("/api/aircraft", 15_000);
  const { data: ports } = useApi<PortData>("/api/ais/ports", 30_000);
  const { data: decision } = useApi<DecisionData>("/api/trade/decision", 120_000);

  return (
    <AppShell>
      <div className="animate-fade-in max-w-[1400px] mx-auto p-7 px-8 pb-14">
        <div className="mb-7">
          <h1 className="text-[30px] font-bold tracking-[-0.035em]">Admin Overview</h1>
          <p className="text-sm text-text3 mt-1">Platform status, data feeds, live metrics</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-[22px]">
          <KPICard label="AIS Vessels" value={ais?.stats.total ? fmt(ais.stats.total) : "..."} sub="Digitraffic" />
          <KPICard label="AIS Tankers" value={ais?.stats.tankers ? fmt(ais.stats.tankers) : "..."} sub="shipType 80-89" />
          <KPICard label="Aircraft" value={air?.stats.total ? fmt(air.stats.total) : "..."} sub="OpenSky" />
          <KPICard label="Cargo Flights" value={air?.stats.cargo ? fmt(air.stats.cargo) : "..."} sub="filtered" />
          <KPICard label="WTI" value={decision?.prices.wti ? "$" + decision.prices.wti.toFixed(2) : "..."} sub="Yahoo Finance" />
          <KPICard label="Decision" value={decision?.decision ?? "..."} sub={decision?.confidence ?? ""} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <Card title="Data Sources">
            <div className="flex flex-col gap-1">
              {[
                { name: "OpenSky Network", ok: !!air, count: air?.stats.total ?? 0, freq: "15s" },
                { name: "Digitraffic AIS", ok: !!ais, count: ais?.stats.total ?? 0, freq: "30s" },
                { name: "Yahoo Finance", ok: !!decision?.prices.wti, count: 5, freq: "5min" },
                { name: "Open-Meteo Marine", ok: true, count: 12, freq: "5min" },
                { name: "Google News RSS", ok: true, count: 25, freq: "10min" },
                { name: "ECB Exchange Rates", ok: true, count: 10, freq: "1h" },
                { name: "PostgreSQL", ok: true, count: 0, freq: "realtime" },
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between py-2.5 border-b border-border last:border-b-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${s.ok ? "bg-[#16a34a]" : "bg-text3"}`} />
                    <span className="text-[12px] font-medium">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-text3" style={{ fontFamily: "var(--font-jetbrains)" }}>
                    {s.count > 0 && <span>{fmt(s.count)}</span>}
                    <span>{s.freq}</span>
                    <span className={`font-semibold px-1.5 py-[1px] rounded-full ${s.ok ? "bg-black/5 text-text2" : "bg-accent-soft text-accent"}`}>
                      {s.ok ? "OK" : "..."}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Busiest Ports (Live)">
            <div className="flex flex-col gap-1">
              {ports?.ports.slice(0, 8).map((p) => (
                <div key={p.name} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                  <span className="text-[12px] font-medium">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold" style={{ fontFamily: "var(--font-jetbrains)" }}>{p.total}</span>
                    <span className={`text-[9px] font-semibold px-1.5 py-[1px] rounded-full ${p.congestion === "high" ? "bg-accent-soft text-accent" : "bg-black/4 text-text3"}`}>{p.congestion}</span>
                  </div>
                </div>
              ))}
              {!ports && <div className="text-text3 text-xs text-center py-4">Loading...</div>}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
