"use client";

import { useEffect, useCallback } from "react";
import { useApi } from "@/hooks/use-api";
import { KPICard } from "@/components/kpi-card";
import { Card } from "@/components/card";
import { Sparkline } from "@/components/sparkline";
import { TradeTabs } from "@/components/trade-tabs";
import { AppShell } from "@/components/app-shell";

interface Proposal {
  direction: string; conviction: string; instrument: string; action: string;
  entry: number; target: number; stopLoss: number; riskReward: string;
  rationale: string; positionSize: string; timeframe: string;
  alternatives: Array<{ instrument: string; action: string; rationale: string }>;
}
interface ProposalData {
  proposal: Proposal | null;
  context: { wti: number; brent: number; crack: number | null; brentWti: number | null; storageRatio: number; utilizationRatio: number; tankers: number; momentum: number; score: number };
  updatedAt: string;
  disclaimer: string;
}
interface ChartData { wti: { dates: string[]; prices: number[] } | null }
interface PortfolioEntry {
  id: string; timestamp: string; action: string; direction: string; conviction: string;
  instrument: string; entry: number; target: number; stopLoss: number; riskReward: string;
  timeframe: string; score: number; status: string; currentPrice: number | null;
  pnlPct: number | null; closedAt: string | null; validUntil: string;
}
interface PortfolioData {
  entries: PortfolioEntry[];
  stats: { total: number; open: number; wins: number; losses: number; expired: number; winRate: number };
}

const fmt = (n: number) => n.toLocaleString("en-US");
const actCls: Record<string, string> = { BUY: "bg-black text-white", SELL: "bg-accent text-white", WAIT: "bg-black/10 text-text" };
const statusCls: Record<string, string> = {
  OPEN: "bg-black/6 text-text", TARGET_HIT: "bg-black/80 text-white",
  STOPPED: "bg-accent-soft2 text-accent", EXPIRED: "bg-black/4 text-text3",
  SUPERSEDED: "bg-black/4 text-text3", CLOSED: "bg-black/6 text-text2",
};
const statusLabel: Record<string, string> = {
  OPEN: "OPEN", TARGET_HIT: "TARGET HIT", STOPPED: "STOPPED",
  EXPIRED: "EXPIRED", SUPERSEDED: "REPLACED", CLOSED: "CLOSED",
};

function fmtDt(d: string) {
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function validityPct(validUntil: string): number {
  const now = Date.now();
  const end = new Date(validUntil).getTime();
  const start = end - 14 * 86400000; // assume max 14 days
  if (now >= end) return 0;
  return Math.max(0, Math.min(100, Math.round(((end - now) / (end - start)) * 100)));
}

export default function ProposalPage() {
  const { data, refetch: refetchProposal } = useApi<ProposalData>("/api/trade/proposal", 120_000);
  const { data: charts } = useApi<ChartData>("/api/trade/charts", 600_000);
  const { data: portfolio, refetch: refetchPortfolio } = useApi<PortfolioData>("/api/trade/portfolio", 30_000);

  // Auto-save proposal to portfolio when it changes
  const saveToPortfolio = useCallback(async () => {
    if (!data?.proposal || data.proposal.action === "WAIT") return;
    const p = data.proposal;
    const ctx = data.context;
    try {
      await fetch("/api/trade/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: p.action, direction: p.direction, conviction: p.conviction,
          instrument: p.instrument, entry: p.entry, target: p.target,
          stopLoss: p.stopLoss, riskReward: p.riskReward, timeframe: p.timeframe,
          positionSize: p.positionSize, rationale: p.rationale, score: ctx.score,
          context: { wti: ctx.wti, brent: ctx.brent, crack: ctx.crack, storageRatio: ctx.storageRatio, tankers: ctx.tankers },
        }),
      });
      refetchPortfolio();
    } catch { /* */ }
  }, [data, refetchPortfolio]);

  useEffect(() => { saveToPortfolio(); }, [saveToPortfolio]);

  const p = data?.proposal;
  const ctx = data?.context;
  const pf = portfolio;

  return (
    <AppShell>
    <div className="animate-fade-in max-w-[1400px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
      <div className="mb-7">
        <h1 className="text-[30px] font-bold tracking-[-0.035em]">Trade Proposal</h1>
        <p className="text-sm text-text3 mt-1">Auto-generated trade with entry/target/stop — updates every 2 minutes</p>
        <TradeTabs />
      </div>

      {p && ctx ? (
        <>
          {/* Active Proposal */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3.5 mb-[22px]">
            <div className="bg-bg3 border border-border rounded-[var(--radius)] p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className={`text-[24px] font-bold px-5 py-2 rounded-[var(--radius-xs)] ${actCls[p.action] ?? "bg-black/10"}`}>
                  {p.action} {p.direction}
                </span>
                <div>
                  <div className="text-[11px] text-text3">Conviction: <span className="font-semibold text-text">{p.conviction}</span> · Score: <span style={{ fontFamily: "var(--font-jetbrains)" }}>{ctx.score}</span></div>
                </div>
              </div>

              <div className="text-[14px] font-semibold mb-4">{p.instrument}</div>

              {p.action !== "WAIT" && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 bg-bg rounded-[var(--radius-sm)] border border-border">
                    <div className="text-[9px] font-semibold text-text3 uppercase">Entry</div>
                    <div className="text-[20px] font-bold mt-1" style={{ fontFamily: "var(--font-jetbrains)" }}>${p.entry.toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-bg rounded-[var(--radius-sm)] border border-border">
                    <div className="text-[9px] font-semibold text-text3 uppercase">Target</div>
                    <div className="text-[20px] font-bold mt-1" style={{ fontFamily: "var(--font-jetbrains)" }}>${p.target.toFixed(2)}</div>
                    <div className="text-[10px] text-text3">{((p.target - p.entry) / p.entry * 100).toFixed(1)}%</div>
                  </div>
                  <div className="p-3 bg-bg rounded-[var(--radius-sm)] border border-accent-soft2">
                    <div className="text-[9px] font-semibold text-accent uppercase">Stop Loss</div>
                    <div className="text-[20px] font-bold mt-1 text-accent" style={{ fontFamily: "var(--font-jetbrains)" }}>${p.stopLoss.toFixed(2)}</div>
                    <div className="text-[10px] text-accent">{((p.stopLoss - p.entry) / p.entry * 100).toFixed(1)}%</div>
                  </div>
                  <div className="p-3 bg-bg rounded-[var(--radius-sm)] border border-border">
                    <div className="text-[9px] font-semibold text-text3 uppercase">Risk/Reward</div>
                    <div className="text-[20px] font-bold mt-1">{p.riskReward}</div>
                  </div>
                  <div className="p-3 bg-bg rounded-[var(--radius-sm)] border border-border">
                    <div className="text-[9px] font-semibold text-text3 uppercase">Timeframe</div>
                    <div className="text-[16px] font-bold mt-1">{p.timeframe}</div>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-bg rounded-[var(--radius-sm)] border border-border">
                <div className="text-[10px] font-semibold text-text3 uppercase mb-1">Rationale</div>
                <div className="text-[12px] text-text2 leading-[1.5]">{p.rationale}</div>
              </div>

              <div className="flex gap-3 mt-3">
                <div className="p-2.5 bg-bg rounded-[var(--radius-sm)] border border-border flex-1">
                  <div className="text-[9px] font-semibold text-text3 uppercase">Position Size</div>
                  <div className="text-[11px] font-semibold mt-0.5">{p.positionSize}</div>
                </div>
                <div className="p-2.5 bg-bg rounded-[var(--radius-sm)] border border-border flex-1">
                  <div className="text-[9px] font-semibold text-text3 uppercase">Updated</div>
                  <div className="text-[11px] font-semibold mt-0.5" style={{ fontFamily: "var(--font-jetbrains)" }}>{fmtDt(data.updatedAt)}</div>
                </div>
              </div>
            </div>

            {/* Validity + Context sidebar */}
            <div className="flex flex-col gap-3.5">
              {/* Trade Validity */}
              <div className="bg-bg3 border border-border rounded-[var(--radius)] p-5">
                <div className="text-[10px] font-semibold text-text3 uppercase tracking-[0.07em] mb-3">Trade Validity</div>
                <div className="text-[13px] font-semibold mb-1">
                  {p.conviction === "HIGH" ? "Strong setup — high probability" :
                   p.conviction === "MODERATE" ? "Decent setup — moderate probability" :
                   "Weak setup — wait for confirmation"}
                </div>
                <div className="text-[11px] text-text2 leading-[1.4] mb-3">
                  {p.conviction === "HIGH"
                    ? "Multiple signals align. Crack spread, fleet utilization, and storage all confirm direction. Execute with full position size."
                    : p.conviction === "MODERATE"
                      ? "Majority of signals lean one way but not unanimously. Execute with reduced size and tight stops."
                      : "Signals are mixed. Consider waiting or trading spreads instead of outright direction."}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Score", value: ctx.score.toFixed(2) },
                    { label: "Signals", value: ctx.score > 0 ? "Bullish" : ctx.score < 0 ? "Bearish" : "Mixed" },
                    { label: "Momentum", value: (ctx.momentum >= 0 ? "+" : "") + ctx.momentum.toFixed(1) + "%" },
                  ].map((s) => (
                    <div key={s.label} className="p-2 bg-bg rounded-[var(--radius-sm)] border border-border">
                      <div className="text-[8px] text-text3 uppercase">{s.label}</div>
                      <div className="text-[13px] font-bold mt-0.5">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini chart */}
              {charts?.wti && (
                <div className="bg-bg3 border border-border rounded-[var(--radius)] p-4">
                  <div className="text-[10px] font-semibold text-text3 uppercase tracking-[0.07em] mb-2">WTI — 3 Month</div>
                  <Sparkline data={charts.wti.prices} labels={charts.wti.dates} height={120} color="#e8590c" fillColor="#e8590c" showAxis={false} />
                </div>
              )}

              {/* Alternatives */}
              {p.alternatives.length > 0 && (
                <div className="bg-bg3 border border-border rounded-[var(--radius)] p-5">
                  <div className="text-[10px] font-semibold text-text3 uppercase tracking-[0.07em] mb-2">Alternatives</div>
                  {p.alternatives.map((alt, i) => (
                    <div key={i} className="py-2 border-b border-border last:border-b-0">
                      <div className="text-[11px] font-semibold">{alt.action}: {alt.instrument}</div>
                      <div className="text-[10px] text-text3 mt-0.5">{alt.rationale.split(".")[0]}.</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Portfolio Stats */}
          {pf && pf.stats.total > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 mb-3.5">
              <KPICard label="Total Proposals" value={pf.stats.total} sub="since session start" />
              <KPICard label="Open" value={pf.stats.open} sub="active trades" />
              <KPICard label="Target Hit" value={pf.stats.wins} sub="winning trades" />
              <KPICard label="Stopped Out" value={pf.stats.losses} sub="losing trades" trend={pf.stats.losses > 0 ? "up" : undefined} />
              <KPICard label="Win Rate" value={pf.stats.winRate + "%"} sub={`${pf.stats.wins}W / ${pf.stats.losses}L`} />
            </div>
          )}

          {/* Portfolio History */}
          {pf && pf.entries.length > 0 && (
            <Card title="Proposal History" badge={{ text: `${pf.entries.length} proposals` }}>
              <div className="scroll-x">
                <table className="w-full border-collapse">
                  <thead><tr>
                    {["Date", "Action", "Entry", "Target", "Stop", "Score", "Status", "P&L"].map((h) => (
                      <th key={h} className="text-[10px] font-semibold uppercase tracking-[0.07em] text-text3 text-left px-3 py-[9px] border-b border-border2">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {pf.entries.map((e) => (
                      <tr key={e.id} className="transition-colors hover:bg-bg2">
                        <td className="text-[11px] px-3 py-[12px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)" }}>{fmtDt(e.timestamp)}</td>
                        <td className="text-[11px] px-3 py-[12px] border-b border-border font-semibold">{e.action} {e.direction}</td>
                        <td className="text-[11px] px-3 py-[12px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)" }}>${e.entry.toFixed(2)}</td>
                        <td className="text-[11px] px-3 py-[12px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)" }}>${e.target.toFixed(2)}</td>
                        <td className="text-[11px] px-3 py-[12px] border-b border-border text-accent" style={{ fontFamily: "var(--font-jetbrains)" }}>${e.stopLoss.toFixed(2)}</td>
                        <td className="text-[11px] px-3 py-[12px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)" }}>{e.score.toFixed(2)}</td>
                        <td className="text-[11px] px-3 py-[12px] border-b border-border">
                          <span className={`inline-flex px-[8px] py-[2px] rounded-full text-[9px] font-semibold ${statusCls[e.status] ?? "bg-black/4 text-text3"}`}>
                            {statusLabel[e.status] ?? e.status}
                          </span>
                        </td>
                        <td className={`text-[11px] px-3 py-[12px] border-b border-border font-semibold ${(e.pnlPct ?? 0) >= 0 ? "text-text" : "text-accent"}`} style={{ fontFamily: "var(--font-jetbrains)" }}>
                          {e.pnlPct != null ? (e.pnlPct >= 0 ? "+" : "") + e.pnlPct.toFixed(2) + "%" : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <div className="mt-4 p-3 rounded-[var(--radius-sm)] border border-border bg-bg text-[10px] text-text3 leading-[1.5]">
            {data.disclaimer}
            <br />Proposals auto-saved to portfolio. Outcomes tracked against live WTI price. Updated every 2 minutes.
          </div>
        </>
      ) : (
        <div className="bg-bg3 border border-border rounded-[var(--radius)] p-16 text-center">
          <div className="text-text3 text-sm">Generating trade proposal...</div>
          <div className="mt-3 w-5 h-5 border-2 border-border2 border-t-accent rounded-full animate-spin mx-auto" />
        </div>
      )}
    </div>
    </AppShell>
  );
}
