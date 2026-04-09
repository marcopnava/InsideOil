"use client";

import { useApi } from "@/hooks/use-api";
import { KPICard } from "@/components/kpi-card";
import { Card } from "@/components/card";
import { Sparkline } from "@/components/sparkline";
import { TradeTabs } from "@/components/trade-tabs";
import { AppShell } from "@/components/app-shell";

interface TradeResult {
  entryDate: string; exitDate: string; direction: string; entry: number; exit: number;
  pnlPct: number; signal: string; holdDays: number;
}
interface BacktestData {
  trades: TradeResult[];
  equity: Array<{ date: string; value: number }>;
  stats: {
    totalTrades: number; wins: number; losses: number; winRate: number;
    totalReturn: number; avgWin: number; avgLoss: number; maxDrawdown: number;
    finalCapital: number; buyHoldReturn: number; alpha: number; avgHoldDays: number;
  };
  period: { start: string; end: string; days: number };
}

const fmt = (n: number) => n.toLocaleString("en-US");

export default function BacktestPage() {
  const { data } = useApi<BacktestData>("/api/trade/backtest", 600_000);

  return (
    <AppShell>
    <div className="animate-fade-in max-w-[1400px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
      <div className="mb-7">
        <h1 className="text-[30px] font-bold tracking-[-0.035em]">Backtest</h1>
        <p className="text-sm text-text3 mt-1">How would the Decision Engine have performed over the last 3 months?</p>
        <TradeTabs />
      </div>

      {data ? (
        <>
          {/* Performance KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-[22px]">
            <KPICard label="Total Return" value={`${data.stats.totalReturn > 0 ? "+" : ""}${data.stats.totalReturn}%`} sub={`$${fmt(data.stats.finalCapital)}`} trend={data.stats.totalReturn > 0 ? "up" : undefined} />
            <KPICard label="Buy & Hold" value={`${data.stats.buyHoldReturn > 0 ? "+" : ""}${data.stats.buyHoldReturn}%`} sub="benchmark" />
            <KPICard label="Alpha" value={`${data.stats.alpha > 0 ? "+" : ""}${data.stats.alpha}%`} sub="vs buy & hold" trend={data.stats.alpha > 0 ? "up" : undefined} />
            <KPICard label="Win Rate" value={`${data.stats.winRate}%`} sub={`${data.stats.wins}W / ${data.stats.losses}L`} />
            <KPICard label="Max Drawdown" value={`-${data.stats.maxDrawdown}%`} sub="peak to trough" trend={data.stats.maxDrawdown > 10 ? "up" : undefined} />
            <KPICard label="Avg Hold" value={`${data.stats.avgHoldDays}d`} sub={`${data.stats.totalTrades} trades`} />
          </div>

          {/* Equity Curve */}
          <Card title="Equity Curve ($100k starting capital)" badge={{ text: `${data.period.start} — ${data.period.end}` }} className="mb-[22px]">
            <Sparkline
              data={data.equity.map((e) => e.value)}
              labels={data.equity.map((e) => e.date)}
              height={220}
              color={data.stats.totalReturn >= 0 ? "#111" : "#e8590c"}
              fillColor={data.stats.totalReturn >= 0 ? "#111" : "#e8590c"}
              valuePrefix="$"
            />
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-[22px]">
            {/* Win/Loss Distribution */}
            <Card title="Trade Distribution">
              <div className="flex flex-col gap-3">
                {[
                  { label: "Winning trades", count: data.stats.wins, pct: data.stats.winRate, avgPnl: data.stats.avgWin },
                  { label: "Losing trades", count: data.stats.losses, pct: 100 - data.stats.winRate, avgPnl: data.stats.avgLoss },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="font-medium">{row.label}</span>
                      <span className="text-text3" style={{ fontFamily: "var(--font-jetbrains)" }}>
                        {row.count} ({row.pct}%) · avg {row.avgPnl > 0 ? "+" : ""}{row.avgPnl}%
                      </span>
                    </div>
                    <div className="hbar">
                      <div className="hbar-fill" style={{
                        width: `${row.pct}%`,
                        background: row.avgPnl >= 0 ? "#111" : "#e8590c",
                      }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-bg rounded-[var(--radius-sm)] border border-border text-[11px] text-text2 leading-[1.5]">
                {data.stats.alpha > 0
                  ? `The system outperformed buy-and-hold by ${data.stats.alpha}%. Active management added value over this period.`
                  : data.stats.alpha > -5
                    ? `The system roughly matched buy-and-hold (alpha: ${data.stats.alpha}%). No significant edge or loss.`
                    : `The system underperformed buy-and-hold by ${Math.abs(data.stats.alpha)}%. Review signal parameters.`}
              </div>
            </Card>

            {/* Avg Win vs Avg Loss */}
            <Card title="Risk/Reward Profile">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-bg rounded-[var(--radius-sm)] border border-border text-center">
                  <div className="text-[9px] font-semibold text-text3 uppercase">Avg Winner</div>
                  <div className="text-[28px] font-bold mt-1">+{data.stats.avgWin}%</div>
                </div>
                <div className="p-4 bg-bg rounded-[var(--radius-sm)] border border-accent-soft2 text-center">
                  <div className="text-[9px] font-semibold text-accent uppercase">Avg Loser</div>
                  <div className="text-[28px] font-bold mt-1 text-accent">{data.stats.avgLoss}%</div>
                </div>
              </div>
              <div className="p-3 bg-bg rounded-[var(--radius-sm)] border border-border text-[11px] text-text2 leading-[1.5]">
                {Math.abs(data.stats.avgWin) > Math.abs(data.stats.avgLoss)
                  ? `Winners are ${(Math.abs(data.stats.avgWin) / Math.abs(data.stats.avgLoss || 1)).toFixed(1)}x larger than losers. Positive risk/reward profile — even with sub-50% win rate, the system can be profitable.`
                  : `Losers are larger than winners. The system relies on high win rate (${data.stats.winRate}%) to be profitable. Consider tightening stops.`}
              </div>
            </Card>
          </div>

          {/* Trade Log */}
          <Card title="All Trades" badge={{ text: `${data.stats.totalTrades} trades` }}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead><tr>
                  {["Entry Date", "Exit Date", "Direction", "Entry", "Exit", "P&L", "Hold", "Signal"].map((h) => (
                    <th key={h} className="text-[10px] font-semibold uppercase tracking-[0.07em] text-text3 text-left px-3 py-[9px] border-b border-border2">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {data.trades.map((t, i) => (
                    <tr key={i} className="transition-colors hover:bg-bg2">
                      <td className="text-[11px] px-3 py-[10px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)" }}>{t.entryDate}</td>
                      <td className="text-[11px] px-3 py-[10px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)" }}>{t.exitDate}</td>
                      <td className="text-[11px] px-3 py-[10px] border-b border-border font-semibold">{t.direction}</td>
                      <td className="text-[11px] px-3 py-[10px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)" }}>${t.entry.toFixed(2)}</td>
                      <td className="text-[11px] px-3 py-[10px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)" }}>${t.exit.toFixed(2)}</td>
                      <td className={`text-[11px] px-3 py-[10px] border-b border-border font-semibold ${t.pnlPct >= 0 ? "" : "text-accent"}`} style={{ fontFamily: "var(--font-jetbrains)" }}>
                        {t.pnlPct >= 0 ? "+" : ""}{t.pnlPct}%
                      </td>
                      <td className="text-[11px] px-3 py-[10px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)" }}>{t.holdDays}d</td>
                      <td className="text-[10px] px-3 py-[10px] border-b border-border text-text3">{t.signal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="mt-4 text-[10px] text-text3 text-center">
            Backtested on {data.period.days} trading days. 50% capital per trade. Target +4%, Stop -2%, Max hold 10 days.
          </div>
        </>
      ) : (
        <div className="bg-bg3 border border-border rounded-[var(--radius)] p-16 text-center">
          <div className="text-text3 text-sm">Running backtest on 3 months of WTI data...</div>
          <div className="mt-3 w-5 h-5 border-2 border-border2 border-t-accent rounded-full animate-spin mx-auto" />
        </div>
      )}
    </div>
    </AppShell>
  );
}
