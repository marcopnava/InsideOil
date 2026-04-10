"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/card";
import { PageHelp } from "@/components/page-help";

const PORTFOLIO_HELP = {
  title: "Portfolio / Trade Journal — what am I looking at?",
  intro:
    "Log every trade you take: entry, stop, target, size, notes. The app tracks live P&L for open positions against current market prices, and records realised P&L when you close. This is the retail equivalent of the CTRM system a physical crude desk uses.",
  sections: [
    {
      title: "Why a trade journal matters",
      body: [
        "Without a journal, you repeat mistakes forever. With one, you learn from every trade.",
        "Review your journal weekly. Ask: which signals led to winners? Which to losers?",
      ],
    },
    {
      title: "How to log a trade",
      body: [
        "Click 'New trade'.",
        "Instrument: BRENT or WTI (matches our live price data so the app can compute live P&L).",
        "Direction: LONG (bullish) or SHORT (bearish).",
        "Entry price: the price at which you entered.",
        "Size: number of barrels or contracts.",
        "Stop / Target: your exit levels.",
        "Notes: which InsideOil signal led to the trade (e.g. 'EIA surprise draw + backwardation').",
        "When the trade is closed, click 'Close' and enter exit price. The app computes realised P&L.",
      ],
    },
    {
      title: "Live P&L",
      body: [
        "For each OPEN position, the app fetches the latest spot price and shows you the current unrealised P&L — both per barrel and total.",
        "CLOSED positions show the realised P&L at close.",
      ],
    },
    {
      title: "Risk calculator",
      body: [
        "The right sidebar on desktop has a small risk calculator. Enter entry + stop + size to see the maximum $ loss before you open the trade.",
        "Rule: never risk more than 1-2% of your account on a single trade.",
      ],
    },
  ],
};

interface Entry {
  id: string;
  instrument: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  size: number;
  sizeUnit: string;
  stopLoss: number | null;
  target: number | null;
  notes: string | null;
  signalsUsed: string[] | null;
  status: "OPEN" | "CLOSED";
  exitPrice: number | null;
  exitReason: string | null;
  pnlBbl: number | null;
  pnlTotal: number | null;
  openedAt: string;
  closedAt: string | null;
  livePrice: number | null;
  livePnlBbl: number | null;
  livePnlTotal: number | null;
}

interface Summary {
  openPositions: number;
  closedTrades: number;
  realizedPnl: number;
  unrealizedPnl: number;
  winRate: number | null;
}

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

export default function PortfolioPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/journal");
    const j = await r.json();
    if (j.success) {
      setEntries(j.data.entries);
      setSummary(j.data.summary);
    }
    setLoading(false);
  }
  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  async function closeTrade(id: string) {
    const exitStr = prompt("Exit price:");
    if (!exitStr) return;
    const exit = Number(exitStr);
    if (!Number.isFinite(exit)) return;
    await fetch(`/api/journal?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exitPrice: exit, exitReason: "MANUAL" }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this trade from the journal?")) return;
    await fetch(`/api/journal?id=${id}`, { method: "DELETE" });
    load();
  }

  const open = entries.filter((e) => e.status === "OPEN");
  const closed = entries.filter((e) => e.status === "CLOSED");

  return (
    <AppShell>
      <PageHelp {...PORTFOLIO_HELP} />
      <div className="animate-fade-in max-w-[1400px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
        <div className="mb-5 sm:mb-6 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-[26px] sm:text-[30px] font-bold tracking-[-0.035em]">Portfolio</h1>
            <p className="text-[12px] sm:text-sm text-text3 mt-1">
              Your personal trade journal with live P&amp;L
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen((o) => !o)}
            className="px-5 py-2.5 bg-text text-white text-[12px] font-semibold rounded-[var(--radius-xs)] hover:opacity-90"
          >
            {formOpen ? "Close form" : "+ New trade"}
          </button>
        </div>

        {/* Summary KPIs */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 mb-3.5">
            <StatBox label="Open positions" value={fmt(summary.openPositions)} />
            <StatBox label="Closed trades" value={fmt(summary.closedTrades)} />
            <StatBox
              label="Realised P&L"
              value={`$${fmt(summary.realizedPnl)}`}
              highlight={summary.realizedPnl >= 0}
            />
            <StatBox
              label="Unrealised P&L"
              value={`$${fmt(summary.unrealizedPnl)}`}
              highlight={summary.unrealizedPnl >= 0}
            />
            <StatBox
              label="Win rate"
              value={summary.winRate != null ? `${summary.winRate}%` : "—"}
              sub="closed trades"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3.5">
          <div className="flex flex-col gap-3.5">
            {formOpen && <NewTradeForm onCreated={() => { setFormOpen(false); load(); }} />}

            <Card title={`Open positions (${open.length})`}>
              {loading ? (
                <div className="text-text3 text-xs">Loading…</div>
              ) : open.length === 0 ? (
                <div className="text-text3 text-xs">No open positions. Click &quot;+ New trade&quot; to log one.</div>
              ) : (
                <div className="scroll-x -mx-6 px-6">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em]">
                        <th className="py-1.5 pr-3 text-left">Opened</th>
                        <th className="py-1.5 pr-3 text-left">Instrument</th>
                        <th className="py-1.5 pr-3 text-left">Dir.</th>
                        <th className="py-1.5 pr-3 text-right">Entry</th>
                        <th className="py-1.5 pr-3 text-right">Now</th>
                        <th className="py-1.5 pr-3 text-right">Size</th>
                        <th className="py-1.5 pr-3 text-right">P&L $/bbl</th>
                        <th className="py-1.5 pr-3 text-right">P&L total</th>
                        <th className="py-1.5 pr-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {open.map((e) => (
                        <tr key={e.id} className="border-t border-border">
                          <td className="py-2 pr-3 text-text3 whitespace-nowrap">
                            {new Date(e.openedAt).toLocaleDateString("en-GB")}
                          </td>
                          <td className="py-2 pr-3 font-semibold">{e.instrument}</td>
                          <td className="py-2 pr-3">
                            <span className={`text-[9px] font-bold px-1.5 py-[1px] rounded-full ${
                              e.direction === "LONG" ? "bg-black text-white" : "bg-accent text-white"
                            }`}>
                              {e.direction}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-right" style={{ fontFamily: "var(--font-jetbrains)" }}>
                            ${e.entryPrice.toFixed(2)}
                          </td>
                          <td className="py-2 pr-3 text-right" style={{ fontFamily: "var(--font-jetbrains)" }}>
                            {e.livePrice != null ? `$${e.livePrice.toFixed(2)}` : "—"}
                          </td>
                          <td className="py-2 pr-3 text-right" style={{ fontFamily: "var(--font-jetbrains)" }}>
                            {fmt(e.size)} {e.sizeUnit}
                          </td>
                          <td
                            className={`py-2 pr-3 text-right font-semibold ${
                              (e.livePnlBbl ?? 0) > 0 ? "text-text" : (e.livePnlBbl ?? 0) < 0 ? "text-accent" : "text-text3"
                            }`}
                            style={{ fontFamily: "var(--font-jetbrains)" }}
                          >
                            {e.livePnlBbl != null ? `${e.livePnlBbl >= 0 ? "+" : ""}$${e.livePnlBbl.toFixed(2)}` : "—"}
                          </td>
                          <td
                            className={`py-2 pr-3 text-right font-bold ${
                              (e.livePnlTotal ?? 0) > 0 ? "text-text" : (e.livePnlTotal ?? 0) < 0 ? "text-accent" : "text-text3"
                            }`}
                            style={{ fontFamily: "var(--font-jetbrains)" }}
                          >
                            {e.livePnlTotal != null ? `${e.livePnlTotal >= 0 ? "+" : ""}$${fmt(e.livePnlTotal)}` : "—"}
                          </td>
                          <td className="py-2 pr-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => closeTrade(e.id)}
                              className="text-[10px] font-semibold text-text hover:text-accent"
                            >
                              Close
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(e.id)}
                              className="text-[10px] text-text3 hover:text-accent ml-2"
                            >
                              🗑
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card title={`Closed trades (${closed.length})`}>
              {closed.length === 0 ? (
                <div className="text-text3 text-xs">No closed trades yet.</div>
              ) : (
                <div className="scroll-x -mx-6 px-6">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em]">
                        <th className="py-1.5 pr-3 text-left">Closed</th>
                        <th className="py-1.5 pr-3 text-left">Inst.</th>
                        <th className="py-1.5 pr-3 text-left">Dir.</th>
                        <th className="py-1.5 pr-3 text-right">Entry</th>
                        <th className="py-1.5 pr-3 text-right">Exit</th>
                        <th className="py-1.5 pr-3 text-left">Why</th>
                        <th className="py-1.5 pr-3 text-right">P&L $/bbl</th>
                        <th className="py-1.5 pr-3 text-right">P&L total</th>
                        <th className="py-1.5 pr-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {closed.map((e) => (
                        <tr key={e.id} className="border-t border-border">
                          <td className="py-2 pr-3 text-text3 whitespace-nowrap">
                            {e.closedAt ? new Date(e.closedAt).toLocaleDateString("en-GB") : "—"}
                          </td>
                          <td className="py-2 pr-3 font-semibold">{e.instrument}</td>
                          <td className="py-2 pr-3">{e.direction}</td>
                          <td className="py-2 pr-3 text-right" style={{ fontFamily: "var(--font-jetbrains)" }}>
                            ${e.entryPrice.toFixed(2)}
                          </td>
                          <td className="py-2 pr-3 text-right" style={{ fontFamily: "var(--font-jetbrains)" }}>
                            {e.exitPrice != null ? `$${e.exitPrice.toFixed(2)}` : "—"}
                          </td>
                          <td className="py-2 pr-3 text-text3 text-[10px]">{e.exitReason ?? "—"}</td>
                          <td
                            className={`py-2 pr-3 text-right font-semibold ${
                              (e.pnlBbl ?? 0) > 0 ? "text-text" : (e.pnlBbl ?? 0) < 0 ? "text-accent" : "text-text3"
                            }`}
                            style={{ fontFamily: "var(--font-jetbrains)" }}
                          >
                            {e.pnlBbl != null ? `${e.pnlBbl >= 0 ? "+" : ""}$${e.pnlBbl.toFixed(2)}` : "—"}
                          </td>
                          <td
                            className={`py-2 pr-3 text-right font-bold ${
                              (e.pnlTotal ?? 0) > 0 ? "text-text" : (e.pnlTotal ?? 0) < 0 ? "text-accent" : "text-text3"
                            }`}
                            style={{ fontFamily: "var(--font-jetbrains)" }}
                          >
                            {e.pnlTotal != null ? `${e.pnlTotal >= 0 ? "+" : ""}$${fmt(e.pnlTotal)}` : "—"}
                          </td>
                          <td className="py-2 pr-3 text-right">
                            <button
                              type="button"
                              onClick={() => remove(e.id)}
                              className="text-[10px] text-text3 hover:text-accent"
                            >
                              🗑
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Risk calculator sidebar */}
          <aside className="lg:sticky lg:top-[calc(var(--nav-h)+16px)] lg:self-start">
            <RiskCalculator />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function NewTradeForm({ onCreated }: { onCreated: () => void }) {
  const [instrument, setInstrument] = useState("BRENT");
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [entryPrice, setEntryPrice] = useState("");
  const [size, setSize] = useState("");
  const [sizeUnit, setSizeUnit] = useState<"bbl" | "contracts">("bbl");
  const [stopLoss, setStopLoss] = useState("");
  const [target, setTarget] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!entryPrice || !size) return;
    setSubmitting(true);
    const r = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instrument,
        direction,
        entryPrice: Number(entryPrice),
        size: Number(size),
        sizeUnit,
        stopLoss: stopLoss ? Number(stopLoss) : null,
        target: target ? Number(target) : null,
        notes: notes || null,
      }),
    });
    const j = await r.json();
    setSubmitting(false);
    if (j.success) onCreated();
    else alert(j.error || "Failed");
  }

  return (
    <Card title="Log a new trade">
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Field label="Instrument">
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            className="w-full px-3 py-2 bg-bg2 border border-border rounded-[var(--radius-xs)] text-[13px]"
          >
            <option value="BRENT">Brent</option>
            <option value="WTI">WTI</option>
          </select>
        </Field>
        <Field label="Direction">
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as "LONG" | "SHORT")}
            className="w-full px-3 py-2 bg-bg2 border border-border rounded-[var(--radius-xs)] text-[13px]"
          >
            <option value="LONG">Long (bullish)</option>
            <option value="SHORT">Short (bearish)</option>
          </select>
        </Field>
        <Field label="Entry price ($/bbl)">
          <input
            type="number"
            step="any"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            className="w-full px-3 py-2 bg-bg2 border border-border rounded-[var(--radius-xs)] text-[13px]"
            required
          />
        </Field>
        <Field label="Size">
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="flex-1 px-3 py-2 bg-bg2 border border-border rounded-[var(--radius-xs)] text-[13px]"
              required
            />
            <select
              value={sizeUnit}
              onChange={(e) => setSizeUnit(e.target.value as "bbl" | "contracts")}
              className="px-2 py-2 bg-bg2 border border-border rounded-[var(--radius-xs)] text-[11px]"
            >
              <option value="bbl">bbl</option>
              <option value="contracts">contracts</option>
            </select>
          </div>
        </Field>
        <Field label="Stop loss (optional)">
          <input
            type="number"
            step="any"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            className="w-full px-3 py-2 bg-bg2 border border-border rounded-[var(--radius-xs)] text-[13px]"
          />
        </Field>
        <Field label="Target (optional)">
          <input
            type="number"
            step="any"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full px-3 py-2 bg-bg2 border border-border rounded-[var(--radius-xs)] text-[13px]"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes (why did you take this trade?)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. EIA surprise draw + Brent in backwardation + crack spread holding $25"
              className="w-full px-3 py-2 bg-bg2 border border-border rounded-[var(--radius-xs)] text-[13px] font-sans"
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-text text-white text-[12px] font-semibold rounded-[var(--radius-xs)] hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Log trade"}
          </button>
        </div>
      </form>
    </Card>
  );
}

function RiskCalculator() {
  const [entry, setEntry] = useState("85");
  const [stop, setStop] = useState("83");
  const [size, setSize] = useState("1000");

  const entryN = Number(entry);
  const stopN = Number(stop);
  const sizeN = Number(size);
  const valid = Number.isFinite(entryN) && Number.isFinite(stopN) && Number.isFinite(sizeN);
  const riskBbl = valid ? Math.abs(entryN - stopN) : 0;
  const riskTotal = valid ? riskBbl * sizeN : 0;

  return (
    <Card title="Risk calculator">
      <div className="flex flex-col gap-3">
        <Field label="Entry price ($/bbl)">
          <input
            type="number"
            step="any"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            className="w-full px-3 py-2 bg-bg2 border border-border rounded-[var(--radius-xs)] text-[13px]"
          />
        </Field>
        <Field label="Stop loss ($/bbl)">
          <input
            type="number"
            step="any"
            value={stop}
            onChange={(e) => setStop(e.target.value)}
            className="w-full px-3 py-2 bg-bg2 border border-border rounded-[var(--radius-xs)] text-[13px]"
          />
        </Field>
        <Field label="Size (bbl)">
          <input
            type="number"
            step="any"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-full px-3 py-2 bg-bg2 border border-border rounded-[var(--radius-xs)] text-[13px]"
          />
        </Field>
        <div className="pt-3 border-t border-border">
          <div className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em] mb-1">
            Risk per bbl
          </div>
          <div className="text-[18px] font-bold" style={{ fontFamily: "var(--font-jetbrains)" }}>
            ${riskBbl.toFixed(2)}
          </div>
          <div className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em] mb-1 mt-3">
            Total max loss
          </div>
          <div className="text-[26px] font-bold text-accent tracking-[-0.03em]" style={{ fontFamily: "var(--font-jetbrains)" }}>
            ${riskTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-text3 mt-2 leading-[1.5]">
            Rule: never risk more than 1-2% of your account. For a €10k account, keep this under €100-€200.
          </div>
        </div>
      </div>
    </Card>
  );
}

function StatBox({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className="bg-bg3 border border-border rounded-[var(--radius)] p-[14px_16px]">
      <div className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em] mb-1">{label}</div>
      <div className={`text-[18px] sm:text-[20px] font-bold tracking-[-0.03em] leading-none ${highlight === false ? "text-accent" : ""}`}>
        {value}
      </div>
      {sub && <div className="text-[9px] text-text3 mt-1">{sub}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em] block mb-1">{label}</label>
      {children}
    </div>
  );
}
