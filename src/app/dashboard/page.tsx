"use client";

import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { Card } from "@/components/card";
import { AppShell } from "@/components/app-shell";
import { Sparkline } from "@/components/sparkline";

interface DecisionData {
  decision: string;
  action: string;
  confidence: string;
  score: { normalized: number; raw: number; max: number };
  signals: Array<{ name: string; value: string; score: number; weight: number }>;
  prices: { wti: number | null; brent: number | null; crack321: number | null; brentWti: number | null };
  fleet: { totalTankers: number; moving: number; anchored: number; storageRatio: number; utilizationRatio: number };
}
interface CommodityData {
  prices: Array<{ symbol: string; name: string; price: number | null; change: number | null; changePct: number | null }>;
  spreads: Record<string, number>;
}
interface ChartData {
  wti: { dates: string[]; prices: number[] } | null;
  crackSpread: { dates: string[]; values: number[] } | null;
}
interface AISStats { stats: { total: number; cargo: number; tankers: number; moving: number; anchored: number; avgSpeed: number } }
interface AircraftStats { stats: { total: number; cargo: number } }
interface NewsItem { title: string; link: string; source: string; pubDate: string; category: string }
interface Notification { id: string; type: string; severity: string; title: string; description: string; source: string }
interface PortStat { name: string; total: number; congestion: string }
interface PortData { ports: PortStat[] }

const fmt = (n: number) => n.toLocaleString("en-US");
const decCls: Record<string, string> = { "STRONG BUY": "bg-black text-white", "BUY": "bg-black/80 text-white", "HOLD / NEUTRAL": "bg-black/10 text-text", "SELL / REDUCE": "bg-accent-soft2 text-accent", "STRONG SELL": "bg-accent text-white" };

function timeAgo(d: string): string {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function CommandCenter() {
  const { data: decision } = useApi<DecisionData>("/api/trade/decision", 120_000);
  const { data: commodities } = useApi<CommodityData>("/api/trade/commodities", 300_000);
  const { data: charts } = useApi<ChartData>("/api/trade/charts", 600_000);
  const { data: ais } = useApi<AISStats>("/api/ais", 30_000);
  const { data: air } = useApi<AircraftStats>("/api/aircraft", 15_000);
  const { data: news } = useApi<NewsItem[]>("/api/news", 600_000);
  const { data: alerts } = useApi<Notification[]>("/api/notifications", 15_000);
  const { data: portData } = useApi<PortData>("/api/ais/ports", 30_000);

  const oilNews = news?.filter((n) => {
    const t = (n.title + " " + n.category).toLowerCase();
    return t.includes("oil") || t.includes("crude") || t.includes("tanker") || t.includes("shipping") || t.includes("freight") || t.includes("opec") || t.includes("supply chain");
  }) ?? [];

  const critAlerts = alerts?.filter((a) => a.severity === "critical" || a.severity === "warning") ?? [];

  return (
    <AppShell>
    <div className="animate-fade-in max-w-[1400px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
      <div className="mb-6">
        <h1 className="text-[30px] font-bold tracking-[-0.035em]">Command Center</h1>
        <p className="text-sm text-text3 mt-1">Everything at a glance — real-time data, auto-refreshing</p>
      </div>

      {/* Row 1: Decision + Prices */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3.5 mb-3.5">
        {/* Decision */}
        <div className="bg-bg3 border border-border rounded-[var(--radius)] p-5">
          <div className="text-[10px] font-semibold text-text3 uppercase tracking-[0.07em] mb-3">Decision Engine</div>
          {decision ? (
            <>
              <div className={`text-[20px] font-bold px-4 py-2 rounded-[var(--radius-xs)] inline-block ${decCls[decision.decision] ?? "bg-black/10 text-text"}`}>
                {decision.decision}
              </div>
              <div className="text-[11px] text-text3 mt-2">Confidence: {decision.confidence}</div>
              <div className="text-[11px] text-text2 mt-2 leading-[1.4]">{decision.action.split(".")[0]}.</div>
              <Link href="/trade/decision" className="inline-block mt-3 text-[11px] font-semibold text-accent no-underline hover:underline">
                View full analysis →
              </Link>
            </>
          ) : (
            <div className="text-text3 text-xs">Analyzing...</div>
          )}
        </div>

        {/* Commodity Prices */}
        <div className="bg-bg3 border border-border rounded-[var(--radius)] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-semibold text-text3 uppercase tracking-[0.07em]">Commodity Prices</div>
            <Link href="/trade" className="text-[10px] font-semibold text-accent no-underline hover:underline">Details →</Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {commodities?.prices?.map((p) => (
              <div key={p.symbol}>
                <div className="text-[9px] text-text3 font-medium">{p.name.replace(" Crude Oil", "").replace("RBOB ", "")}</div>
                <div className="text-[18px] font-bold tracking-[-0.02em] mt-0.5">{p.price ? "$" + p.price.toFixed(2) : "..."}</div>
                {p.changePct != null && (
                  <div className={`text-[10px] font-semibold ${p.changePct >= 0 ? "text-text2" : "text-accent"}`}>
                    {p.changePct >= 0 ? "+" : ""}{p.changePct.toFixed(2)}%
                  </div>
                )}
              </div>
            ))}
            {commodities?.spreads && Object.entries(commodities.spreads)?.map(([k, v]) => (
              <div key={k}>
                <div className="text-[9px] text-text3 font-medium">{k}</div>
                <div className={`text-[18px] font-bold tracking-[-0.02em] mt-0.5 ${v < 0 ? "text-accent" : ""}`}>${v.toFixed(2)}</div>
                <div className="text-[10px] text-text3">{v > 3 ? "Wide" : v > 0 ? "Normal" : "Inverted"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Charts + Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">
        <Card title="WTI Crude — 3 Month" badge={{ text: "Live" }}>
          {charts?.wti ? <Sparkline data={charts.wti.prices} labels={charts.wti.dates} height={150} color="#e8590c" fillColor="#e8590c" /> : <div className="h-[150px] flex items-center justify-center text-text3 text-xs">Loading...</div>}
        </Card>
        <Card title="Crack Spread — 3 Month" badge={{ text: "Live" }}>
          {charts?.crackSpread ? <Sparkline data={charts.crackSpread.values} labels={charts.crackSpread.dates} height={150} color="#111" fillColor="#111" zeroLine /> : <div className="h-[150px] flex items-center justify-center text-text3 text-xs">Loading...</div>}
        </Card>
      </div>

      {/* Row 3: Fleet + Alerts + Ports */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5 mb-3.5">
        {[
          { label: "Aircraft", value: air?.stats.total ? fmt(air.stats.total) : "...", sub: "OpenSky" },
          { label: "Cargo Flights", value: air?.stats.cargo ? fmt(air.stats.cargo) : "...", sub: "filtered" },
          { label: "AIS Vessels", value: ais?.stats.total ? fmt(ais.stats.total) : "...", sub: "Digitraffic" },
          { label: "AIS Tankers", value: ais?.stats.tankers ? fmt(ais.stats.tankers) : "...", sub: "shipType 80-89" },
          { label: "Moving", value: ais?.stats.moving ? fmt(ais.stats.moving) : "...", sub: "underway" },
          { label: "Anchored", value: ais?.stats.anchored ? fmt(ais.stats.anchored) : "...", sub: "stationary" },
          { label: "Storage Ratio", value: decision ? decision.fleet.storageRatio + "%" : "...", sub: "float. storage" },
          { label: "Crack Spread", value: decision?.prices.crack321 ? "$" + decision.prices.crack321.toFixed(0) : "...", sub: "3-2-1" },
        ].map((s) => (
          <div key={s.label} className="bg-bg3 border border-border rounded-[var(--radius)] p-[14px_16px]">
            <div className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em] mb-1">{s.label}</div>
            <div className="text-[20px] font-bold tracking-[-0.03em] leading-none">{s.value}</div>
            <div className="text-[9px] text-text3 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Row 4: Signals + News + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 mb-3.5">
        {/* Trading Signals summary */}
        <Card title="Trading Signals" badge={{ text: decision?.decision ?? "..." }}>
          <div className="flex flex-col gap-2">
            {decision?.signals.map((s) => {
              const cls = s.score >= 1 ? "bg-black/6 text-text" : s.score <= -1 ? "bg-accent-soft text-accent" : "bg-black/3 text-text3";
              const label = s.score >= 1 ? "BULL" : s.score <= -1 ? "BEAR" : "NEUT";
              return (
                <div key={s.name} className="flex items-center justify-between py-1.5 border-b border-border last:border-b-0">
                  <span className="text-[11px] font-medium">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text3" style={{ fontFamily: "var(--font-jetbrains)" }}>{s.value.split("(")[0].trim()}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-[1px] rounded-full ${cls}`}>{label}</span>
                  </div>
                </div>
              );
            })}
            {!decision && <div className="text-text3 text-xs text-center py-4">Loading...</div>}
          </div>
          <Link href="/trade/decision" className="inline-block mt-3 text-[10px] font-semibold text-accent no-underline hover:underline">Full decision analysis →</Link>
        </Card>

        {/* News */}
        <Card title="Market News" badge={{ text: String(oilNews.length) }}>
          <div className="flex flex-col">
            {(oilNews.length > 0 ? oilNews : news ?? []).slice(0, 6).map((n, i) => (
              <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" className="py-2 border-b border-border last:border-b-0 no-underline group">
                <div className="text-[11.5px] font-medium text-text leading-[1.3] group-hover:text-accent transition-colors line-clamp-2">{n.title}</div>
                <div className="text-[9px] text-text3 mt-0.5">{n.source} · {timeAgo(n.pubDate)}</div>
              </a>
            ))}
            {!news && <div className="text-text3 text-xs text-center py-4">Loading...</div>}
          </div>
          <Link href="/news" className="inline-block mt-3 text-[10px] font-semibold text-accent no-underline hover:underline">All news →</Link>
        </Card>

        {/* Alerts + Ports */}
        <div className="flex flex-col gap-3.5">
          <Card title="Active Alerts" badge={{ text: String(critAlerts.length) }}>
            <div className="flex flex-col gap-1.5">
              {critAlerts.slice(0, 4).map((a) => (
                <div key={a.id} className={`p-2.5 rounded-[var(--radius-sm)] border-l-[3px] text-[11px] ${a.severity === "critical" ? "bg-accent-soft border-l-accent" : "bg-black/3 border-l-text3"}`}>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-text3 text-[10px] mt-0.5">{a.source}</div>
                </div>
              ))}
              {critAlerts.length === 0 && <div className="text-text3 text-xs text-center py-3">No critical alerts</div>}
            </div>
          </Card>

          <Card title="Busiest Ports" badge={{ text: "AIS" }}>
            <div className="flex flex-col gap-1.5">
              {portData?.ports.slice(0, 4).map((p) => (
                <div key={p.name} className="flex items-center justify-between py-1.5 border-b border-border last:border-b-0">
                  <span className="text-[11px] font-medium">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text3" style={{ fontFamily: "var(--font-jetbrains)" }}>{p.total}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-[1px] rounded-full ${p.congestion === "high" ? "bg-accent-soft text-accent" : "bg-black/4 text-text3"}`}>{p.congestion}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/ports" className="inline-block mt-2 text-[10px] font-semibold text-accent no-underline hover:underline">All ports →</Link>
          </Card>
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {[
          { href: "/tracking", label: "Live Map", sub: "Aircraft + AIS vessels" },
          { href: "/trade", label: "Trade Intelligence", sub: "Signals, flows, prices" },
          { href: "/trade/desk", label: "Trading Desk", sub: "Voyage, arbitrage, dark fleet" },
          { href: "/trade/decision", label: "Decision Engine", sub: "Composite BUY/SELL signal" },
          { href: "/ports", label: "Port Status", sub: "Baltic port congestion" },
          { href: "/weather", label: "Maritime Weather", sub: "Waves, wind, temperature" },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="p-3 rounded-[var(--radius-sm)] border border-border bg-bg hover:bg-bg2 transition-colors no-underline group">
            <div className="text-[12px] font-semibold text-text group-hover:text-accent transition-colors">{l.label}</div>
            <div className="text-[9px] text-text3 mt-0.5">{l.sub}</div>
          </Link>
        ))}
      </div>
    </div>
    </AppShell>
  );
}
