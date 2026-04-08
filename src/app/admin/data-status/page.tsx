"use client";

import { useApi } from "@/hooks/use-api";
import { KPICard } from "@/components/kpi-card";
import { Card } from "@/components/card";
import { AppShell } from "@/components/app-shell";

interface AISStats { stats: { total: number; cargo: number; tankers: number; passenger: number; moving: number; anchored: number; avgSpeed: number } }
interface AircraftStats { stats: { total: number; cargo: number; avgAltitude: number | null; avgSpeed: number | null; byCountry: Array<{ country: string; count: number }> } }
interface CommodityData { prices?: Array<{ symbol: string; name: string; price: number | null; changePct: number | null }> }

const fmt = (n: number) => n.toLocaleString("en-US");

export default function DataStatusPage() {
  const { data: ais } = useApi<AISStats>("/api/ais", 10_000);
  const { data: air } = useApi<AircraftStats>("/api/aircraft", 10_000);
  const { data: commodities } = useApi<CommodityData>("/api/trade/commodities", 60_000);

  return (
    <AppShell>
      <div className="animate-fade-in max-w-[1400px] mx-auto p-7 px-8 pb-14">
        <div className="mb-7">
          <h1 className="text-[30px] font-bold tracking-[-0.035em]">Data Status</h1>
          <p className="text-sm text-text3 mt-1">Live data feed health — refreshes every 10 seconds</p>
        </div>

        {/* AIS Detailed */}
        <Card title="Digitraffic AIS — Vessel Breakdown" badge={{ text: ais ? "LIVE" : "..." }} className="mb-[22px]">
          {ais ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                { label: "Total", value: fmt(ais.stats.total) },
                { label: "Cargo", value: fmt(ais.stats.cargo) },
                { label: "Tankers", value: fmt(ais.stats.tankers) },
                { label: "Passenger", value: fmt(ais.stats.passenger) },
                { label: "Moving", value: fmt(ais.stats.moving) },
                { label: "Anchored", value: fmt(ais.stats.anchored) },
                { label: "Avg Speed", value: ais.stats.avgSpeed + " kn" },
                { label: "Coverage", value: "Baltic Sea" },
              ].map((s) => (
                <div key={s.label} className="p-3 bg-bg rounded-[var(--radius-sm)] border border-border text-center">
                  <div className="text-[9px] font-semibold text-text3 uppercase">{s.label}</div>
                  <div className="text-[16px] font-bold mt-0.5">{s.value}</div>
                </div>
              ))}
            </div>
          ) : <div className="text-text3 text-xs text-center py-8">Connecting to Digitraffic...</div>}
        </Card>

        {/* Aircraft Detailed */}
        <Card title="OpenSky Network — Aircraft Data" badge={{ text: air ? "LIVE" : "..." }} className="mb-[22px]">
          {air ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="p-3 bg-bg rounded-[var(--radius-sm)] border border-border text-center">
                  <div className="text-[9px] font-semibold text-text3 uppercase">Total Aircraft</div>
                  <div className="text-[16px] font-bold mt-0.5">{fmt(air.stats.total)}</div>
                </div>
                <div className="p-3 bg-bg rounded-[var(--radius-sm)] border border-border text-center">
                  <div className="text-[9px] font-semibold text-text3 uppercase">Cargo Flights</div>
                  <div className="text-[16px] font-bold mt-0.5">{fmt(air.stats.cargo)}</div>
                </div>
                <div className="p-3 bg-bg rounded-[var(--radius-sm)] border border-border text-center">
                  <div className="text-[9px] font-semibold text-text3 uppercase">Avg Altitude</div>
                  <div className="text-[16px] font-bold mt-0.5">{air.stats.avgAltitude ? fmt(air.stats.avgAltitude) + " ft" : "N/A"}</div>
                </div>
                <div className="p-3 bg-bg rounded-[var(--radius-sm)] border border-border text-center">
                  <div className="text-[9px] font-semibold text-text3 uppercase">Avg Speed</div>
                  <div className="text-[16px] font-bold mt-0.5">{air.stats.avgSpeed ? air.stats.avgSpeed + " kn" : "N/A"}</div>
                </div>
              </div>
              {air.stats.byCountry && (
                <div className="flex flex-col gap-1.5">
                  {air.stats.byCountry.slice(0, 8).map((c, i) => (
                    <div key={c.country} className="flex justify-between text-[11px] py-1 border-b border-border last:border-b-0">
                      <span className="font-medium">{c.country}</span>
                      <span className={`font-semibold ${i === 0 ? "text-accent" : "text-text3"}`} style={{ fontFamily: "var(--font-jetbrains)" }}>{fmt(c.count)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : <div className="text-text3 text-xs text-center py-8">Connecting to OpenSky...</div>}
        </Card>

        {/* Commodity Prices */}
        <Card title="Yahoo Finance — Commodity Prices" badge={{ text: commodities?.prices ? "LIVE" : "..." }}>
          {commodities?.prices ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {commodities.prices.map((p) => (
                <div key={p.symbol} className="p-3 bg-bg rounded-[var(--radius-sm)] border border-border">
                  <div className="text-[9px] font-semibold text-text3 uppercase">{p.name}</div>
                  <div className="text-[18px] font-bold mt-0.5">{p.price ? "$" + p.price.toFixed(2) : "..."}</div>
                  {p.changePct != null && (
                    <div className={`text-[10px] font-semibold ${p.changePct >= 0 ? "text-text2" : "text-accent"}`}>
                      {p.changePct >= 0 ? "+" : ""}{p.changePct.toFixed(2)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : <div className="text-text3 text-xs text-center py-8">Loading prices...</div>}
        </Card>
      </div>
    </AppShell>
  );
}
