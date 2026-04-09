"use client";

import { useApi } from "@/hooks/use-api";
import { Card } from "@/components/card";
import { Sparkline } from "@/components/sparkline";
import { TradeTabs } from "@/components/trade-tabs";
import { AppShell } from "@/components/app-shell";

interface Signal {
  name: string;
  value: string;
  score: number;
  weight: number;
  reasoning: string;
}

interface DecisionData {
  decision: string;
  action: string;
  confidence: string;
  instruments: string[];
  score: { raw: number; normalized: number; max: number; min: number };
  signals: Signal[];
  prices: { wti: number | null; brent: number | null; crack321: number | null; brentWti: number | null };
  fleet: { totalTankers: number; moving: number; anchored: number; storageRatio: number; utilizationRatio: number };
  timestamp: string;
  disclaimer: string;
}

const fmt = (n: number) => n.toLocaleString("en-US");

const decisionCls: Record<string, string> = {
  "STRONG BUY": "bg-black text-white",
  "BUY": "bg-black/80 text-white",
  "HOLD / NEUTRAL": "bg-black/10 text-text",
  "SELL / REDUCE": "bg-accent-soft2 text-accent",
  "STRONG SELL": "bg-accent text-white",
};

function ScoreBar({ score, min, max }: { score: number; min: number; max: number }) {
  const range = max - min;
  const pct = Math.max(0, Math.min(100, ((score - min) / range) * 100));
  return (
    <div className="relative h-2 bg-bg2 rounded-full overflow-hidden mt-2">
      <div className="absolute inset-0 flex">
        <div className="flex-1 bg-accent/20" />
        <div className="flex-1 bg-black/5" />
        <div className="flex-1 bg-black/10" />
      </div>
      <div
        className="absolute top-0 h-full w-1 bg-text rounded-full"
        style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
      />
    </div>
  );
}

function SignalRow({ signal }: { signal: Signal }) {
  const scoreCls = signal.score >= 2 ? "bg-black text-white" :
    signal.score >= 1 ? "bg-black/70 text-white" :
    signal.score === 0 ? "bg-black/10 text-text3" :
    signal.score >= -1 ? "bg-accent-soft text-accent" :
    "bg-accent text-white";

  const label = signal.score >= 2 ? "STRONG BULL" :
    signal.score >= 1 ? "BULLISH" :
    signal.score === 0 ? "NEUTRAL" :
    signal.score >= -1 ? "BEARISH" :
    "STRONG BEAR";

  return (
    <div className="p-4 rounded-[var(--radius-sm)] border border-border bg-bg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-text3 uppercase tracking-[0.05em]">{signal.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-text3">weight: {signal.weight}/3</span>
          <span className={`text-[9px] font-bold px-2 py-[2px] rounded-full ${scoreCls}`}>{label}</span>
        </div>
      </div>
      <div className="text-[18px] font-bold tracking-[-0.02em]">{signal.value}</div>
      <div className="text-[11px] text-text2 mt-2 leading-[1.5]">{signal.reasoning}</div>
    </div>
  );
}

export default function DecisionPage() {
  const { data } = useApi<DecisionData>("/api/trade/decision", 120_000);
  const { data: charts } = useApi<{ wti: { dates: string[]; prices: number[] } | null; crackSpread: { dates: string[]; values: number[] } | null }>("/api/trade/charts", 600_000);

  return (
    <AppShell>
    <div className="animate-fade-in max-w-[1400px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
      <div className="mb-7">
        <h1 className="text-[30px] font-bold tracking-[-0.035em]">Decision Engine</h1>
        <p className="text-sm text-text3 mt-1">Composite signal analysis — synthesizes all indicators into a directional bias</p>
        <TradeTabs />
      </div>

      {data ? (
        <>
          {/* Main Decision */}
          <div className="bg-bg3 border border-border rounded-[var(--radius)] p-8 mb-[22px]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <span className={`text-[24px] font-bold px-5 py-2 rounded-[var(--radius-xs)] ${decisionCls[data.decision] ?? "bg-black/10 text-text"}`}>
                {data.decision}
              </span>
              <div>
                <div className="text-[11px] font-semibold text-text3 uppercase tracking-[0.05em]">Confidence: {data.confidence}</div>
                <div className="text-[11px] text-text3 mt-0.5" style={{ fontFamily: "var(--font-jetbrains)" }}>
                  Score: {data.score.normalized.toFixed(2)} ({data.score.raw > 0 ? "+" : ""}{data.score.raw}/{data.score.max})
                </div>
              </div>
            </div>

            <ScoreBar score={data.score.raw} min={data.score.min} max={data.score.max} />
            <div className="flex justify-between text-[9px] text-text3 mt-1 px-1">
              <span>STRONG SELL</span><span>SELL</span><span>NEUTRAL</span><span>BUY</span><span>STRONG BUY</span>
            </div>

            <div className="mt-6 p-4 rounded-[var(--radius-sm)] border border-border bg-bg">
              <div className="text-[13px] font-semibold mb-2">Action</div>
              <div className="text-[12.5px] text-text2 leading-[1.5]">{data.action}</div>
            </div>
          </div>

          {/* Instruments */}
          <Card title="Instruments to Consider" className="mb-[22px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.instruments.map((inst, i) => (
                <div key={i} className="p-3 rounded-[var(--radius-sm)] border border-border bg-bg text-[12px] font-medium">
                  {inst}
                </div>
              ))}
            </div>
          </Card>

          {/* Market Snapshot */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-[22px]">
            {[
              { label: "WTI", value: data.prices.wti ? "$" + data.prices.wti.toFixed(2) : "..." },
              { label: "Brent", value: data.prices.brent ? "$" + data.prices.brent.toFixed(2) : "..." },
              { label: "Crack Spread", value: data.prices.crack321 ? "$" + data.prices.crack321.toFixed(2) : "..." },
              { label: "Tankers Tracked", value: fmt(data.fleet.totalTankers) },
              { label: "Storage Ratio", value: data.fleet.storageRatio + "%" },
            ].map((s) => (
              <div key={s.label} className="bg-bg3 border border-border rounded-[var(--radius)] p-[16px_20px]">
                <div className="text-[10px] font-semibold text-text3 uppercase tracking-[0.07em] mb-1">{s.label}</div>
                <div className="text-[22px] font-bold tracking-[-0.03em]">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          {charts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-[22px]">
              {charts.wti && (
                <Card title="WTI Crude — 3 Month">
                  <Sparkline data={charts.wti.prices} labels={charts.wti.dates} height={160} color="#e8590c" fillColor="#e8590c" />
                </Card>
              )}
              {charts.crackSpread && (
                <Card title="3-2-1 Crack Spread — 3 Month">
                  <Sparkline data={charts.crackSpread.values} labels={charts.crackSpread.dates} height={160} color="#111" fillColor="#111" zeroLine />
                </Card>
              )}
            </div>
          )}

          {/* Individual Signals */}
          <Card title={`Signal Breakdown (${data.signals.length} indicators)`} badge={{ text: data.decision, variant: "dark" as const }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.signals.map((s) => (
                <SignalRow key={s.name} signal={s} />
              ))}
            </div>
          </Card>

          <div className="mt-4 p-3 rounded-[var(--radius-sm)] border border-border bg-bg text-[10px] text-text3 leading-[1.5]">
            {data.disclaimer}
            <br />Updated: {new Date(data.timestamp).toLocaleTimeString("en-GB")} — Auto-refreshes every 2 minutes
          </div>
        </>
      ) : (
        <div className="bg-bg3 border border-border rounded-[var(--radius)] p-16 text-center">
          <div className="text-text3 text-sm">Analyzing 6 market signals across AIS fleet data and commodity prices...</div>
          <div className="mt-3 w-5 h-5 border-2 border-border2 border-t-accent rounded-full animate-spin mx-auto" />
        </div>
      )}
    </div>
    </AppShell>
  );
}
