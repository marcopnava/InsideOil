"use client";

import { useState, useCallback } from "react";
import { useApi } from "@/hooks/use-api";
import { KPICard } from "@/components/kpi-card";
import { Sparkline } from "@/components/sparkline";
import { Card } from "@/components/card";
import { DetailPanel, DetailRow } from "@/components/detail-panel";
import { TradeTabs } from "@/components/trade-tabs";
import { AppShell } from "@/components/app-shell";
import { PageHelp } from "@/components/page-help";

const TRADE_HELP = {
  title: "Trade Intelligence — what am I looking at?",
  intro:
    "This page combines live commodity prices, tanker fleet analytics, chokepoint flow, and route intelligence to give you the building blocks for crude oil trading decisions. Everything is computed from real-time data — no estimates, no delayed feeds.",
  sections: [
    {
      title: "Commodity Prices row",
      body: [
        "Live (15-min delayed) WTI, Brent, RBOB Gasoline, Heating Oil, Natural Gas + Brent-WTI spread.",
        "Source: Yahoo Finance free API.",
        "Click any price to see full chart and history in the dedicated commodities section.",
      ],
    },
    {
      title: "Tanker Fleet Overview",
      body: [
        "Total tankers in the global AIS feed (shipType 80-89).",
        "Moving = underway with speed > 0.5 knots.",
        "Anchored / Floating Storage estimate = stationary tankers.",
        "Slow Steaming = moving but at <8 knots, often a sign of carriers absorbing excess capacity.",
        "Avg Speed: low (<10kn) suggests oversupply, high (>12kn) suggests urgency.",
      ],
    },
    {
      title: "Trading Signals",
      body: [
        "Each signal is derived from real fleet behavior. BULL / BEAR / NEUTRAL classification.",
        "Floating Storage Ratio: % anchored. >40% = bearish.",
        "Slow Steaming Ratio: % of moving fleet doing <8kn. >30% = bearish.",
        "Fleet Utilization: moving / total. >70% = bullish.",
      ],
    },
    {
      title: "Chokepoints",
      body: [
        "The 6 strategic maritime chokepoints handling ~60% of global oil: Hormuz, Malacca, Suez, Bab-el-Mandeb, Bosphorus, Danish Straits.",
        "Tankers in zone = current count.",
        "Congestion: high / medium / low based on vessel density.",
        "COVERAGE NOTE: free AIS has gaps in Persian Gulf and Red Sea. Hormuz / Bab-el-Mandeb counts underestimate reality.",
      ],
    },
    {
      title: "Top Tanker Destinations",
      body: [
        "Where the global tanker fleet is heading right now, by port name from AIS destination field.",
        "A surge in destinations of a specific country signals demand build-up there 1-3 weeks ahead of physical delivery.",
      ],
    },
    {
      title: "Speed Distribution",
      body: [
        "Histogram of fleet speeds: stationary, slow steaming, normal, fast.",
        "Shifts in this distribution are leading indicators of supply/demand changes.",
      ],
    },
    {
      title: "Route Analysis",
      body: [
        "Major crude oil shipping routes with current tanker counts.",
        "Tracks flow on the most economically significant lanes (Middle East→Asia, Russia→India, US Gulf→Europe).",
      ],
    },
  ],
};

interface TankerData {
  overview: { total: number; moving: number; anchored: number; slowSteaming: number; normalSpeed: number; avgSpeed: number; potentialFloatingStorage: number };
  signals: Array<{ signal: string; value: string; interpretation: string; sentiment: "bullish" | "bearish" | "neutral" }>;
  speedBuckets: Array<{ label: string; count: number }>;
  topDestinations: Array<{ destination: string; count: number }>;
}
interface Chokepoint { name: string; strategic: string; totalVessels: number; tankers: number; cargo: number; other: number; moving: number; congestion: string; avgSpeed: number }
interface ChokepointData { chokepoints: Chokepoint[]; totalTankersInChokepoints: number }
interface MetricsData {
  tonMileIndex: number;
  routeAnalysis: Array<{ route: string; tankers: number; avgSpeed: number }>;
  supplyDemand: Array<{ metric: string; value: string; context: string; trend: string }>;
  fleetSnapshot: { totalTankers: number; totalCargo: number; movingTankers: number; loadedEstimate: number; ballastEstimate: number; forOrders: number };
}
interface DestDetail {
  destination: string; intel: string; count: number; moving: number; anchored: number; avgSpeed: number;
  speedAssessment: string; shareOfFleet: number; tradingImplication: string;
  vessels: Array<{ mmsi: number; name: string | null; speed: number; status: string; lat: number; lng: number }>;
}
interface NewsItem { title: string; link: string; source: string; pubDate: string; category: string }
interface CommodityData {
  prices: Array<{ symbol: string; name: string; unit: string; price: number | null; change: number | null; changePct: number | null; prevClose: number | null; dayHigh: number | null; dayLow: number | null }>;
  spreads: Record<string, number>;
}
interface ChartData {
  wti: { dates: string[]; prices: number[] } | null;
  brent: { dates: string[]; prices: number[] } | null;
  crackSpread: { dates: string[]; values: number[] } | null;
  brentWtiSpread: { dates: string[]; values: number[] } | null;
}

const fmt = (n: number) => n.toLocaleString("en-US");
const sentCls: Record<string, string> = { bullish: "bg-black/8 text-text", bearish: "bg-accent-soft2 text-accent", neutral: "bg-black/4 text-text3" };
const sentLabel: Record<string, string> = { bullish: "BULLISH", bearish: "BEARISH", neutral: "NEUTRAL" };
function timeAgo(d: string): string { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 60) return `${m}m`; const h = Math.floor(m / 60); if (h < 24) return `${h}h`; return `${Math.floor(h / 24)}d`; }

export default function TradePage() {
  const { data: tankers } = useApi<TankerData>("/api/trade/tankers", 30_000);
  const { data: choke } = useApi<ChokepointData>("/api/trade/chokepoints", 30_000);
  const { data: metrics } = useApi<MetricsData>("/api/trade/metrics", 30_000);
  const { data: news } = useApi<NewsItem[]>("/api/news", 600_000);
  const { data: commodities } = useApi<CommodityData>("/api/trade/commodities", 300_000);
  const { data: charts } = useApi<ChartData>("/api/trade/charts", 600_000);

  const [selectedCP, setSelectedCP] = useState<Chokepoint | null>(null);
  const [selectedDest, setSelectedDest] = useState<DestDetail | null>(null);
  const [loadingDest, setLoadingDest] = useState(false);

  const oilNews = news?.filter((n) => {
    const t = (n.title + " " + n.category).toLowerCase();
    return t.includes("oil") || t.includes("crude") || t.includes("tanker") || t.includes("petroleum") ||
      t.includes("opec") || t.includes("lng") || t.includes("fuel") || t.includes("refin") ||
      t.includes("shipping") || t.includes("freight") || t.includes("supply chain");
  }) ?? [];

  const clickDestination = useCallback(async (dest: string) => {
    setLoadingDest(true);
    try {
      const res = await fetch(`/api/trade/destination?dest=${encodeURIComponent(dest)}`);
      const json = await res.json();
      if (json.success) { setSelectedDest(json.data); setSelectedCP(null); }
    } catch { /* */ }
    setLoadingDest(false);
  }, []);

  const ov = tankers?.overview;
  const fs = metrics?.fleetSnapshot;

  return (
    <AppShell>
    <PageHelp {...TRADE_HELP} />
    <div className="animate-fade-in max-w-[1400px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
      <div className="mb-7">
        <h1 className="text-[30px] font-bold tracking-[-0.035em]">Trade Intelligence</h1>
        <p className="text-sm text-text3 mt-1">Tanker fleet analytics, chokepoints, route flows, trading signals — all from real AIS data</p>
        <TradeTabs />
      </div>

      {/* Commodity Prices */}
      {commodities?.prices && commodities.prices.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-3.5">
          {commodities.prices.map((p) => (
            <div key={p.symbol} className="bg-bg3 border border-border rounded-[var(--radius)] p-[18px_20px] transition-all hover:shadow-[var(--shadow2)] hover:-translate-y-px">
              <div className="text-[10px] font-semibold text-text3 uppercase tracking-[0.07em] mb-2">{p.name}</div>
              <div className="text-[26px] font-bold tracking-[-0.03em] leading-none">{p.price ? "$" + p.price.toFixed(2) : "..."}</div>
              <div className="flex items-center gap-2 mt-2">
                {p.change != null && (
                  <span className={`text-[11px] font-semibold ${p.change >= 0 ? "text-text2" : "text-accent"}`}>
                    {p.change >= 0 ? "+" : ""}{p.change.toFixed(2)}
                  </span>
                )}
                {p.changePct != null && (
                  <span className={`text-[10px] font-semibold px-1.5 py-[1px] rounded-full ${p.changePct >= 0 ? "bg-black/5 text-text2" : "bg-accent-soft text-accent"}`}>
                    {p.changePct >= 0 ? "+" : ""}{p.changePct.toFixed(2)}%
                  </span>
                )}
              </div>
              {p.dayHigh != null && p.dayLow != null && (
                <div className="text-[9px] text-text3 mt-1" style={{ fontFamily: "var(--font-jetbrains)" }}>
                  L {p.dayLow.toFixed(2)} — H {p.dayHigh.toFixed(2)}
                </div>
              )}
            </div>
          ))}
          {Object.entries(commodities.spreads).map(([name, value]) => (
            <div key={name} className="bg-bg3 border border-border rounded-[var(--radius)] p-[18px_20px]">
              <div className="text-[10px] font-semibold text-text3 uppercase tracking-[0.07em] mb-2">{name} Spread</div>
              <div className={`text-[26px] font-bold tracking-[-0.03em] leading-none ${value > 0 ? "" : "text-accent"}`}>${value.toFixed(2)}</div>
              <div className="text-[10px] text-text3 mt-2">
                {value > 3 ? "Wide — Atlantic basin premium" : value > 0 ? "Normal contango" : "Inverted — unusual"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Price Charts */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-[22px]">
          <Card title="Crude Oil — 3 Month" badge={{ text: "Daily" }}>
            <div className="flex flex-col gap-4">
              {charts.wti && <Sparkline data={charts.wti.prices} labels={charts.wti.dates} height={140} color="#e8590c" fillColor="#e8590c" title="WTI Crude (CL=F)" />}
              {charts.brent && <Sparkline data={charts.brent.prices} labels={charts.brent.dates} height={140} color="#111" fillColor="#111" title="Brent Crude (BZ=F)" />}
            </div>
          </Card>
          <Card title="Spreads — 3 Month" badge={{ text: "Daily" }}>
            <div className="flex flex-col gap-4">
              {charts.crackSpread && <Sparkline data={charts.crackSpread.values} labels={charts.crackSpread.dates} height={140} color="#e8590c" fillColor="#e8590c" title="3-2-1 Crack Spread" zeroLine />}
              {charts.brentWtiSpread && <Sparkline data={charts.brentWtiSpread.values} labels={charts.brentWtiSpread.dates} height={140} color="#555" title="Brent-WTI Spread" zeroLine />}
            </div>
          </Card>
        </div>
      )}

      {/* Fleet KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-3.5">
        <KPICard label="Tankers" value={ov ? fmt(ov.total) : "..."} sub="Baltic AIS" />
        <KPICard label="In Transit" value={ov ? fmt(ov.moving) : "..."} sub="moving" />
        <KPICard label="Floating Storage" value={ov ? fmt(ov.potentialFloatingStorage) : "..."} sub="anchored tankers" trend={ov && ov.potentialFloatingStorage > 100 ? "up" : undefined} />
        <KPICard label="Ton-Mile Index" value={metrics ? fmt(metrics.tonMileIndex) : "..."} sub="demand proxy" />
        <KPICard label="Loaded (est.)" value={fs ? fmt(fs.loadedEstimate) : "..."} sub="by speed profile" />
        <KPICard label="For Orders" value={fs ? fmt(fs.forOrders) : "..."} sub="unassigned" trend={fs && fs.forOrders > 50 ? "up" : undefined} />
      </div>

      {/* Signals */}
      <Card title="Trading Signals" badge={{ text: "AIS-derived" }} className="mb-[22px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tankers?.signals.map((s) => (
            <div key={s.signal} className="p-4 rounded-[var(--radius-sm)] border border-border bg-bg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-text3 uppercase tracking-[0.05em]">{s.signal}</span>
                <span className={`text-[9px] font-bold px-2 py-[2px] rounded-full ${sentCls[s.sentiment]}`}>{sentLabel[s.sentiment]}</span>
              </div>
              <div className="text-[22px] font-bold tracking-[-0.02em]">{s.value}</div>
              <div className="text-[11px] text-text2 mt-1 leading-[1.4]">{s.interpretation}</div>
            </div>
          ))}
          {!tankers && <div className="text-text3 text-xs text-center py-8 col-span-2">Loading tanker intelligence...</div>}
        </div>
      </Card>

      {/* Supply/Demand Metrics */}
      <Card title="Supply / Demand Metrics" badge={{ text: "Live" }} className="mb-[22px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {metrics?.supplyDemand.map((m) => (
            <div key={m.metric} className="p-4 rounded-[var(--radius-sm)] border border-border bg-bg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-text3 uppercase tracking-[0.05em]">{m.metric}</span>
                <span className={`text-[8px] font-bold px-1.5 py-[1px] rounded-full ${m.trend === "tight" || m.trend === "strong" || m.trend === "high" ? "bg-accent-soft2 text-accent" : m.trend === "elevated" || m.trend === "oil-heavy" ? "bg-black/8 text-text" : "bg-black/4 text-text3"}`}>
                  {m.trend}
                </span>
              </div>
              <div className="text-[18px] font-bold tracking-[-0.02em] mt-1">{m.value}</div>
              <div className="text-[10px] text-text3 mt-1 leading-[1.4]">{m.context}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 mb-[22px]">
        {/* Route Analysis */}
        <Card title="Route Flow Analysis">
          <div className="flex flex-col gap-3">
            {metrics?.routeAnalysis.map((r, i) => {
              const max = metrics.routeAnalysis[0]?.tankers ?? 1;
              const pct = Math.round((r.tankers / max) * 100);
              return (
                <div key={r.route}>
                  <div className="flex justify-between text-[11px] mb-[3px]">
                    <span className="font-medium">{r.route}</span>
                    <span className={`font-semibold ${i === 0 ? "text-accent" : "text-text3"}`} style={{ fontFamily: "var(--font-jetbrains)" }}>
                      {r.tankers} · {r.avgSpeed}kn
                    </span>
                  </div>
                  <div className="hbar"><div className="hbar-fill" style={{ width: `${pct}%`, background: i === 0 ? "#e8590c" : "#111" }} /></div>
                </div>
              );
            })}
            {!metrics && <div className="text-text3 text-xs text-center py-8">Loading...</div>}
          </div>
        </Card>

        {/* Tanker Destinations — clickable */}
        <Card title="Tanker Destinations" badge={{ text: loadingDest ? "Loading..." : "Click for intel" }}>
          <div className="flex flex-col gap-2">
            {tankers?.topDestinations.slice(0, 10).map((d, i) => {
              const max = tankers.topDestinations[0]?.count ?? 1;
              const pct = Math.round((d.count / max) * 100);
              return (
                <div key={d.destination} className="cursor-pointer hover:bg-bg2 -mx-1 px-1 py-0.5 rounded transition-colors" onClick={() => clickDestination(d.destination)}>
                  <div className="flex justify-between text-[11px] mb-[3px]">
                    <span className="font-medium">{d.destination}</span>
                    <span className={`font-semibold ${i === 0 ? "text-accent" : "text-text3"}`} style={{ fontFamily: "var(--font-jetbrains)" }}>{d.count}</span>
                  </div>
                  <div className="hbar"><div className="hbar-fill" style={{ width: `${pct}%`, background: i === 0 ? "#e8590c" : "#555" }} /></div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Market News */}
        <Card title="Market News" badge={{ text: String(oilNews.length) }}>
          <div className="flex flex-col">
            {oilNews.slice(0, 7).map((n, i) => (
              <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" className="py-2 border-b border-border last:border-b-0 no-underline group">
                <div className="text-[11.5px] font-medium text-text leading-[1.4] group-hover:text-accent transition-colors">{n.title}</div>
                <div className="text-[9px] text-text3 mt-0.5">{n.source} · {timeAgo(n.pubDate)}</div>
              </a>
            ))}
            {oilNews.length === 0 && news && <div className="text-text3 text-xs text-center py-4">No oil/shipping news</div>}
          </div>
        </Card>
      </div>

      {/* Chokepoints + Speed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <Card title="Chokepoint Monitor" badge={{ text: "Real-time" }}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead><tr>
                {["Chokepoint", "Total", "Tankers", "Avg Speed", "Status"].map((h) => (
                  <th key={h} className="text-[10px] font-semibold uppercase tracking-[0.07em] text-text3 text-left px-3 py-[9px] border-b border-border2">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {choke?.chokepoints.map((cp) => (
                  <tr key={cp.name} className="transition-colors hover:bg-bg2 cursor-pointer" onClick={() => { setSelectedCP(cp); setSelectedDest(null); }}>
                    <td className="text-[12px] px-3 py-[12px] border-b border-border font-medium">{cp.name}</td>
                    <td className="text-[12px] px-3 py-[12px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)" }}>{cp.totalVessels}</td>
                    <td className="text-[12px] px-3 py-[12px] border-b border-border font-semibold" style={{ fontFamily: "var(--font-jetbrains)" }}>{cp.tankers}</td>
                    <td className="text-[12px] px-3 py-[12px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)" }}>{cp.avgSpeed} kn</td>
                    <td className="text-[12px] px-3 py-[12px] border-b border-border">
                      <span className={`inline-flex px-[8px] py-[2px] rounded-full text-[10px] font-semibold ${cp.congestion === "high" ? "bg-accent-soft2 text-accent" : cp.congestion === "medium" ? "bg-black/8 text-text" : "bg-black/4 text-text3"}`}>{cp.congestion}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Speed Distribution">
          <div className="flex flex-col gap-3">
            {tankers?.speedBuckets.map((b) => {
              const max = Math.max(...(tankers?.speedBuckets.map((x) => x.count) ?? [1]));
              const pct = Math.round((b.count / max) * 100);
              const hl = b.label.includes("Slow");
              return (
                <div key={b.label}>
                  <div className="flex justify-between text-[11.5px] mb-[3px]">
                    <span className="font-medium">{b.label}</span>
                    <span className={`font-semibold ${hl ? "text-accent" : "text-text3"}`} style={{ fontFamily: "var(--font-jetbrains)" }}>{fmt(b.count)}</span>
                  </div>
                  <div className="hbar"><div className="hbar-fill" style={{ width: `${pct}%`, background: hl ? "#e8590c" : "#111" }} /></div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Chokepoint Detail */}
      <DetailPanel open={!!selectedCP} onClose={() => setSelectedCP(null)}>
        {selectedCP && (
          <>
            <div className="text-[11px] text-text3">Chokepoint</div>
            <h2 className="text-[20px] font-bold mt-1 tracking-[-0.02em]">{selectedCP.name}</h2>
            <span className={`inline-flex px-[9px] py-[3px] rounded-full text-[10px] font-semibold mt-2 ${selectedCP.congestion === "high" ? "bg-accent-soft2 text-accent" : "bg-black/4 text-text3"}`}>{selectedCP.congestion}</span>
            <p className="text-[11.5px] text-text2 mt-4 leading-[1.5]">{selectedCP.strategic}</p>
            <div className="mt-4">
              <DetailRow label="Total Vessels" value={selectedCP.totalVessels} mono />
              <DetailRow label="Tankers" value={selectedCP.tankers} mono accent={selectedCP.tankers > 5} />
              <DetailRow label="Cargo" value={selectedCP.cargo} mono />
              <DetailRow label="Avg Speed" value={selectedCP.avgSpeed + " kn"} mono />
            </div>
          </>
        )}
      </DetailPanel>

      {/* Destination Detail */}
      <DetailPanel open={!!selectedDest} onClose={() => setSelectedDest(null)}>
        {selectedDest && (
          <>
            <div className="text-[11px] text-text3">Destination Intelligence</div>
            <h2 className="text-[20px] font-bold mt-1 tracking-[-0.02em]">{selectedDest.destination}</h2>
            <div className="text-[12px] text-text2 mt-3 leading-[1.5] p-3 bg-bg rounded-[var(--radius-sm)] border border-border">
              {selectedDest.intel}
            </div>
            <div className="mt-4">
              <DetailRow label="Tankers Heading Here" value={selectedDest.count} mono />
              <DetailRow label="Moving" value={selectedDest.moving} mono />
              <DetailRow label="Anchored Nearby" value={selectedDest.anchored} mono />
              <DetailRow label="Avg Speed" value={selectedDest.avgSpeed + " kn"} mono />
              <DetailRow label="Fleet Share" value={selectedDest.shareOfFleet + "%"} mono accent={selectedDest.shareOfFleet > 3} />
            </div>
            <div className="text-[11px] text-text2 mt-3 leading-[1.4] p-3 bg-bg rounded-[var(--radius-sm)] border border-border">
              <span className="font-semibold text-text">Speed Assessment:</span> {selectedDest.speedAssessment}
            </div>
            <div className="text-[11px] mt-3 leading-[1.4] p-3 rounded-[var(--radius-sm)] border border-accent bg-accent-soft">
              <span className="font-semibold text-accent">Trading Implication:</span>
              <span className="text-text2"> {selectedDest.tradingImplication}</span>
            </div>
            {selectedDest.vessels.length > 0 && (
              <>
                <h4 className="text-[11px] font-semibold mt-4 mb-2 text-text3 uppercase tracking-[0.05em]">Vessels ({selectedDest.vessels.length})</h4>
                <div className="flex flex-col gap-1">
                  {selectedDest.vessels.slice(0, 10).map((v) => (
                    <div key={v.mmsi} className="flex justify-between text-[11px] py-1.5 border-b border-border last:border-b-0">
                      <span className="font-medium">{v.name || `MMSI ${v.mmsi}`}</span>
                      <span className="text-text3" style={{ fontFamily: "var(--font-jetbrains)" }}>{v.speed.toFixed(1)} kn</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="mt-4 text-[9px] text-text3">Source: Digitraffic AIS — real-time tanker positions</div>
          </>
        )}
      </DetailPanel>
    </div>
    </AppShell>
  );
}
