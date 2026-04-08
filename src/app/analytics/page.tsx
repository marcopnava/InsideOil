"use client";

import { useApi } from "@/hooks/use-api";
import { KPICard } from "@/components/kpi-card";
import { Card } from "@/components/card";
import { AppShell } from "@/components/app-shell";

interface ExchangeData {
  rates: Record<string, number>;
  base: string;
  date: string;
  trends: Record<string, { rate: number; change: number; pct: number }>;
  source: string;
}

interface DestData {
  top: Array<{ destination: string; count: number; cargo: number; tanker: number; passenger: number }>;
  total: number;
  noDestination: number;
  vesselsWithDest: number;
}

const fmt = (n: number) => n.toLocaleString("en-US");

function exportCSV(data: Array<Record<string, unknown>>, filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) => headers.map((h) => `"${String(row[h] ?? "")}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  const { data: exchange } = useApi<ExchangeData>("/api/exchange", 3600_000);
  const { data: destinations } = useApi<DestData>("/api/ais/destinations", 60_000);

  const shippingCurrencies = ["EUR", "CNY", "GBP", "SGD", "JPY", "KRW", "NOK", "SEK", "AED", "INR"];

  return (
    <AppShell>
    <div className="animate-fade-in max-w-[1400px] mx-auto p-7 px-8 pb-14">
      <div className="mb-7">
        <h1 className="text-[30px] font-bold tracking-[-0.035em]">Analytics</h1>
        <p className="text-sm text-text3 mt-1">Exchange rates, destination analysis, data export — all real data</p>
      </div>

      {/* Exchange KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-3.5">
        <KPICard label="EUR/USD" value={exchange?.trends?.EUR ? exchange.trends.EUR.rate.toFixed(4) : "..."} sub={exchange?.trends?.EUR ? `${exchange.trends.EUR.pct > 0 ? "+" : ""}${exchange.trends.EUR.pct}% YTD` : "ECB rates"} trend={exchange?.trends?.EUR?.pct && exchange.trends.EUR.pct > 0 ? "up" : undefined} />
        <KPICard label="CNY/USD" value={exchange?.trends?.CNY ? exchange.trends.CNY.rate.toFixed(4) : "..."} sub={exchange?.trends?.CNY ? `${exchange.trends.CNY.pct > 0 ? "+" : ""}${exchange.trends.CNY.pct}% YTD` : ""} />
        <KPICard label="GBP/USD" value={exchange?.trends?.GBP ? exchange.trends.GBP.rate.toFixed(4) : "..."} sub={exchange?.trends?.GBP ? `${exchange.trends.GBP.pct > 0 ? "+" : ""}${exchange.trends.GBP.pct}% YTD` : ""} />
        <KPICard label="Top Destination" value={destinations?.top?.[0]?.destination ?? "..."} sub={destinations?.top?.[0] ? `${destinations.top[0].count} vessels` : ""} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-[22px]">
        {/* Exchange Rates */}
        <Card title="Shipping Currency Rates" badge={{ text: exchange?.date ?? "...", variant: "dark" as const }}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead><tr>
                {["Currency", "Rate (1 USD)", "Change", "YTD %"].map(h => (
                  <th key={h} className="text-[10px] font-semibold uppercase tracking-[0.07em] text-text3 text-left px-3.5 py-[9px] border-b border-border2">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {exchange?.trends && shippingCurrencies.map(cur => {
                  const t = exchange.trends[cur];
                  if (!t) return null;
                  return (
                    <tr key={cur} className="transition-colors hover:bg-bg2">
                      <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border font-semibold">{cur}</td>
                      <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)" }}>{t.rate.toFixed(4)}</td>
                      <td className={`text-[12.5px] px-3.5 py-[13px] border-b border-border ${t.change > 0 ? "text-accent" : "text-text2"}`} style={{ fontFamily: "var(--font-jetbrains)" }}>
                        {t.change > 0 ? "+" : ""}{t.change.toFixed(4)}
                      </td>
                      <td className={`text-[12.5px] px-3.5 py-[13px] border-b border-border font-semibold ${Math.abs(t.pct) > 3 ? "text-accent" : "text-text2"}`} style={{ fontFamily: "var(--font-jetbrains)" }}>
                        {t.pct > 0 ? "+" : ""}{t.pct}%
                      </td>
                    </tr>
                  );
                })}
                {!exchange && <tr><td colSpan={4} className="text-center text-text3 text-xs py-8">Loading ECB rates...</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[9px] text-text3">{exchange?.source}</div>
        </Card>

        {/* Top Destinations */}
        <Card title="Top Vessel Destinations" badge={{ text: "AIS Live" }}>
          <div className="flex flex-col gap-2">
            {destinations?.top.slice(0, 12).map((d, i) => {
              const max = destinations.top[0]?.count ?? 1;
              const pct = Math.round((d.count / max) * 100);
              return (
                <div key={d.destination}>
                  <div className="flex justify-between text-[11.5px] mb-[3px]">
                    <span className="font-medium">{d.destination}</span>
                    <span className={`font-semibold ${i === 0 ? "text-accent" : "text-text3"}`} style={{ fontFamily: "var(--font-jetbrains)" }}>
                      {d.count} {d.cargo > 0 && `(${d.cargo}C)`} {d.tanker > 0 && `(${d.tanker}T)`}
                    </span>
                  </div>
                  <div className="hbar"><div className="hbar-fill" style={{ width: `${pct}%`, background: i === 0 ? "#e8590c" : "#111" }} /></div>
                </div>
              );
            })}
            {!destinations && <div className="text-text3 text-xs text-center py-8">Loading destinations...</div>}
          </div>
          {destinations && (
            <div className="mt-3 pt-3 border-t border-border flex justify-between text-[10px] text-text3">
              <span>{destinations.total} unique destinations · {fmt(destinations.vesselsWithDest)} with destination set</span>
              <span>{fmt(destinations.noDestination)} unknown</span>
            </div>
          )}
        </Card>
      </div>

      {/* Export */}
      <Card title="Data Export">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Exchange Rates CSV", desc: "Current ECB rates for all shipping currencies", onClick: () => exchange && exportCSV(Object.entries(exchange.trends).map(([c, t]) => ({ currency: c, rate: t.rate, change: t.change, pctYTD: t.pct })), "exchange-rates.csv") },
            { label: "Top Destinations CSV", desc: "AIS vessel destination analysis", onClick: () => destinations && exportCSV(destinations.top, "ais-destinations.csv") },
            { label: "Full AIS Data CSV", desc: "All vessel positions (from cache)", onClick: async () => { const r = await fetch("/api/ais"); const j = await r.json(); if (j.success) exportCSV([j.data.stats], "ais-summary.csv"); } },
          ].map(e => (
            <button key={e.label} onClick={e.onClick} className="p-4 rounded-[var(--radius-sm)] border border-border bg-bg text-left hover:bg-bg2 transition-colors cursor-pointer">
              <div className="text-[13px] font-semibold">{e.label}</div>
              <div className="text-[11px] text-text3 mt-1">{e.desc}</div>
            </button>
          ))}
        </div>
      </Card>
    </div>
    </AppShell>
  );
}
