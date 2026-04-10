"use client";

import { useApi } from "@/hooks/use-api";
import { Card } from "@/components/card";
import { Sparkline } from "@/components/sparkline";
import { AppShell } from "@/components/app-shell";
import { PageHelp } from "@/components/page-help";
import { MorningBriefCard } from "@/components/morning-brief-card";

const BRIEFING_HELP = {
  title: "Daily Briefing — what am I looking at?",
  intro:
    "An auto-generated morning report combining today's prices, decision engine, arbitrage opportunities, port congestion and oil-related news. Refreshed every 5-10 minutes.",
  sections: [
    {
      title: "Executive Summary",
      body: "The headline: where the Decision Engine stands today (BUY/SELL/HOLD), with confidence and the 3 most important reasons.",
    },
    {
      title: "Best Arbitrage Route",
      body: "The single most profitable trans-region trade right now (USGC→NWE, Russia→India, etc.) with net margin per barrel after freight.",
    },
    {
      title: "Congested Ports",
      body: "Ports flagged as high congestion — usually meaning >50 vessels in port circle. Congestion delays loading, tightens local supply, can be bullish for the regional benchmark.",
    },
    {
      title: "Today's News",
      body: "Filtered oil/crude/OPEC headlines from Google News. Click any headline to read the full article.",
    },
    {
      title: "Charts",
      body: "WTI 3-month price + Crack Spread 3-month from Yahoo daily candles.",
    },
  ],
};

interface DecisionData {
  decision: string; action: string; confidence: string;
  score: { normalized: number };
  signals: Array<{ name: string; value: string; score: number }>;
  prices: { wti: number | null; brent: number | null; crack321: number | null; brentWti: number | null };
  fleet: { totalTankers: number; moving: number; anchored: number; storageRatio: number; utilizationRatio: number };
}
interface ArbitrageData { routes: Array<{ label: string; netMargin: number; totalPnL: number; profitable: boolean }>; profitableRoutes: number; totalRoutes: number; brentPrice: number }
interface PortData { ports: Array<{ name: string; total: number; congestion: string; cargo: number; tankers: number }> }
interface NewsItem { title: string; link: string; source: string; pubDate: string }
interface ChartData { wti: { dates: string[]; prices: number[] } | null; crackSpread: { dates: string[]; values: number[] } | null }

const fmt = (n: number) => n.toLocaleString("en-US");
const decCls: Record<string, string> = { "STRONG BUY": "bg-black text-white", "BUY": "bg-black/80 text-white", "HOLD / NEUTRAL": "bg-black/10 text-text", "SELL / REDUCE": "bg-accent-soft2 text-accent", "STRONG SELL": "bg-accent text-white" };

function timeAgo(d: string): string { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 60) return `${m}m`; const h = Math.floor(m / 60); if (h < 24) return `${h}h`; return `${Math.floor(h / 24)}d`; }

export default function BriefingPage() {
  const { data: decision } = useApi<DecisionData>("/api/trade/decision", 120_000);
  const { data: arb } = useApi<ArbitrageData>("/api/trade/arbitrage", 300_000);
  const { data: ports } = useApi<PortData>("/api/ais/ports", 30_000);
  const { data: news } = useApi<NewsItem[]>("/api/news", 600_000);
  const { data: charts } = useApi<ChartData>("/api/trade/charts", 600_000);

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const oilNews = news?.filter((n) => {
    const t = n.title.toLowerCase();
    return t.includes("oil") || t.includes("crude") || t.includes("tanker") || t.includes("opec") || t.includes("shipping") || t.includes("freight");
  }) ?? [];

  const bestRoute = arb?.routes.filter((r) => r.profitable).sort((a, b) => b.netMargin - a.netMargin)[0];
  const congestedPorts = ports?.ports.filter((p) => p.congestion === "high") ?? [];

  return (
    <AppShell>
    <PageHelp {...BRIEFING_HELP} />
    <div className="animate-fade-in max-w-[1400px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
      <div className="mb-8">
        <div className="text-[11px] font-semibold text-text3 uppercase tracking-[0.07em]">Daily Briefing</div>
        <h1 className="text-[30px] font-bold tracking-[-0.035em] mt-1">{today}</h1>
        <p className="text-sm text-text3 mt-1">Morning market summary — auto-generated from live data</p>
      </div>

      {/* Executive Summary */}
      <Card title="Executive Summary" className="mb-5">
        {decision ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`text-[18px] font-bold px-4 py-1.5 rounded-[var(--radius-xs)] ${decCls[decision.decision] ?? "bg-black/10"}`}>
                {decision.decision}
              </span>
              <span className="text-[12px] text-text3">Confidence: {decision.confidence}</span>
            </div>
            <p className="text-[13px] text-text2 leading-[1.6]">{decision.action}</p>
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-bg rounded-[var(--radius-sm)] border border-border">
                <div className="text-[9px] text-text3 font-semibold uppercase">WTI</div>
                <div className="text-[18px] font-bold mt-0.5">${decision.prices.wti?.toFixed(2) ?? "..."}</div>
              </div>
              <div className="p-3 bg-bg rounded-[var(--radius-sm)] border border-border">
                <div className="text-[9px] text-text3 font-semibold uppercase">Brent</div>
                <div className="text-[18px] font-bold mt-0.5">${decision.prices.brent?.toFixed(2) ?? "..."}</div>
              </div>
              <div className="p-3 bg-bg rounded-[var(--radius-sm)] border border-border">
                <div className="text-[9px] text-text3 font-semibold uppercase">Crack 3-2-1</div>
                <div className="text-[18px] font-bold mt-0.5">${decision.prices.crack321?.toFixed(0) ?? "..."}</div>
              </div>
              <div className="p-3 bg-bg rounded-[var(--radius-sm)] border border-border">
                <div className="text-[9px] text-text3 font-semibold uppercase">Tankers</div>
                <div className="text-[18px] font-bold mt-0.5">{fmt(decision.fleet.totalTankers)}</div>
              </div>
            </div>
          </div>
        ) : <div className="text-text3 text-xs text-center py-8">Generating briefing...</div>}
      </Card>

      {/* Auto-generated Morning Brief */}
      <div className="mb-5">
        <MorningBriefCard />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
        <Card title="WTI — 3 Month">
          {charts?.wti ? <Sparkline data={charts.wti.prices} labels={charts.wti.dates} height={130} color="#e8590c" fillColor="#e8590c" /> : <div className="h-[130px]" />}
        </Card>
        <Card title="Crack Spread — 3 Month">
          {charts?.crackSpread ? <Sparkline data={charts.crackSpread.values} labels={charts.crackSpread.dates} height={130} color="#111" fillColor="#111" zeroLine /> : <div className="h-[130px]" />}
        </Card>
      </div>

      {/* Signal Summary */}
      <Card title="Signal Summary" className="mb-5">
        <div className="flex flex-col gap-1">
          {decision?.signals.map((s) => {
            const label = s.score >= 1 ? "BULL" : s.score <= -1 ? "BEAR" : "NEUT";
            const cls = s.score >= 1 ? "text-text" : s.score <= -1 ? "text-accent" : "text-text3";
            return (
              <div key={s.name} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                <span className="text-[12px] font-medium">{s.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-text3" style={{ fontFamily: "var(--font-jetbrains)" }}>{s.value.split("(")[0].trim()}</span>
                  <span className={`text-[10px] font-bold ${cls}`}>{label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Arbitrage + Ports */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
        <Card title="Best Arbitrage" badge={{ text: arb ? `${arb.profitableRoutes}/${arb.totalRoutes}` : "..." }}>
          {bestRoute ? (
            <div>
              <div className="text-[14px] font-bold">{bestRoute.label}</div>
              <div className="text-[11px] text-text2 mt-1">Net margin: ${bestRoute.netMargin.toFixed(2)}/bbl</div>
              <div className="text-[11px] text-text2">Cargo P&L: +${fmt(bestRoute.totalPnL)}</div>
              <div className="text-[11px] text-text3 mt-2">Based on Brent ${arb?.brentPrice.toFixed(2)}</div>
            </div>
          ) : <div className="text-text3 text-xs">No profitable routes</div>}
        </Card>
        <Card title="Port Congestion" badge={{ text: `${congestedPorts.length} high` }}>
          {congestedPorts.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {congestedPorts.slice(0, 4).map((p) => (
                <div key={p.name} className="flex justify-between text-[11.5px] py-1 border-b border-border last:border-b-0">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-accent font-semibold" style={{ fontFamily: "var(--font-jetbrains)" }}>{p.total} vessels</span>
                </div>
              ))}
            </div>
          ) : <div className="text-text3 text-xs">No congestion detected</div>}
        </Card>
      </div>

      {/* News */}
      <Card title="Key Headlines" badge={{ text: String(oilNews.length) }}>
        <div className="flex flex-col">
          {(oilNews.length > 0 ? oilNews : news ?? []).slice(0, 8).map((n, i) => (
            <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" className="py-2.5 border-b border-border last:border-b-0 no-underline group">
              <div className="text-[12.5px] font-medium text-text leading-[1.4] group-hover:text-accent transition-colors">{n.title}</div>
              <div className="text-[9px] text-text3 mt-0.5">{n.source} · {timeAgo(n.pubDate)}</div>
            </a>
          ))}
        </div>
      </Card>

      <div className="mt-5 text-[10px] text-text3 text-center">
        Auto-generated from live data sources — OpenSky, Digitraffic AIS, Yahoo Finance, Open-Meteo, Google News
      </div>
    </div>
    </AppShell>
  );
}
