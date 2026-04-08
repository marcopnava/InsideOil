"use client";

import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/hooks/use-api";
import { Card } from "@/components/card";
import { AppShell } from "@/components/app-shell";

interface WatchItem {
  id: string;
  type: "vessel" | "route" | "commodity" | "alert-rule";
  label: string;
  config: Record<string, string | number>;
  addedAt: string;
}

interface CommodityData {
  prices: Array<{ symbol: string; name: string; price: number | null; changePct: number | null }>;
}
interface TankerData {
  overview: { total: number; anchored: number; avgSpeed: number; potentialFloatingStorage: number };
}
interface CrackData {
  spreads: { crack321WTI: number | null };
}

const fmt = (n: number) => n.toLocaleString("en-US");

function loadWatchlist(): WatchItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("kln-watchlist") || "[]"); } catch { return []; }
}
function saveWatchlist(items: WatchItem[]) {
  localStorage.setItem("kln-watchlist", JSON.stringify(items));
}

// Default watchlist for new users
const DEFAULT_WATCHLIST: WatchItem[] = [
  { id: "w1", type: "commodity", label: "WTI Crude Oil", config: { symbol: "CL=F" }, addedAt: new Date().toISOString() },
  { id: "w2", type: "commodity", label: "Brent Crude Oil", config: { symbol: "BZ=F" }, addedAt: new Date().toISOString() },
  { id: "w3", type: "alert-rule", label: "Crack spread below $15", config: { metric: "crack321", operator: "below", threshold: 15 }, addedAt: new Date().toISOString() },
  { id: "w4", type: "alert-rule", label: "Floating storage above 500", config: { metric: "floatingStorage", operator: "above", threshold: 500 }, addedAt: new Date().toISOString() },
  { id: "w5", type: "alert-rule", label: "WTI below $70", config: { metric: "wti", operator: "below", threshold: 70 }, addedAt: new Date().toISOString() },
  { id: "w6", type: "alert-rule", label: "Tanker avg speed below 5 kn", config: { metric: "avgSpeed", operator: "below", threshold: 5 }, addedAt: new Date().toISOString() },
];

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [newType, setNewType] = useState<"commodity" | "alert-rule">("alert-rule");
  const [newLabel, setNewLabel] = useState("");
  const [newMetric, setNewMetric] = useState("crack321");
  const [newOp, setNewOp] = useState("below");
  const [newThreshold, setNewThreshold] = useState("");

  const { data: commodities } = useApi<CommodityData>("/api/trade/commodities", 300_000);
  const { data: tankers } = useApi<TankerData>("/api/trade/tankers", 30_000);
  const { data: crack } = useApi<CrackData>("/api/trade/crack-spread", 300_000);

  useEffect(() => {
    const loaded = loadWatchlist();
    setItems(loaded.length > 0 ? loaded : DEFAULT_WATCHLIST);
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveWatchlist(next);
      return next;
    });
  }, []);

  const addRule = useCallback(() => {
    if (!newThreshold) return;
    const item: WatchItem = {
      id: `w-${Date.now()}`,
      type: "alert-rule",
      label: newLabel || `${newMetric} ${newOp} ${newThreshold}`,
      config: { metric: newMetric, operator: newOp, threshold: Number(newThreshold) },
      addedAt: new Date().toISOString(),
    };
    setItems((prev) => {
      const next = [...prev, item];
      saveWatchlist(next);
      return next;
    });
    setNewLabel(""); setNewThreshold("");
  }, [newLabel, newMetric, newOp, newThreshold]);

  // Evaluate alert rules against live data
  const evaluateRule = (item: WatchItem): { triggered: boolean; current: string } => {
    const { metric, operator, threshold } = item.config;
    let current: number | null = null;

    switch (metric) {
      case "crack321": current = crack?.spreads?.crack321WTI ?? null; break;
      case "wti": current = commodities?.prices?.find((p) => p.symbol === "CL=F")?.price ?? null; break;
      case "brent": current = commodities?.prices?.find((p) => p.symbol === "BZ=F")?.price ?? null; break;
      case "floatingStorage": current = tankers?.overview?.potentialFloatingStorage ?? null; break;
      case "avgSpeed": current = tankers?.overview?.avgSpeed ?? null; break;
      case "totalTankers": current = tankers?.overview?.total ?? null; break;
      case "anchored": current = tankers?.overview?.anchored ?? null; break;
    }

    if (current === null) return { triggered: false, current: "..." };

    const th = Number(threshold);
    const triggered = operator === "below" ? current < th : operator === "above" ? current > th : false;
    return { triggered, current: current.toFixed(2) };
  };

  const alertRules = items.filter((i) => i.type === "alert-rule");
  const commodityItems = items.filter((i) => i.type === "commodity");

  const selectStyle = { backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat" as const, backgroundPosition: "right 8px center", paddingRight: "28px" };

  return (
    <AppShell>
    <div className="animate-fade-in max-w-[1400px] mx-auto p-7 px-8 pb-14">
      <div className="mb-7">
        <h1 className="text-[30px] font-bold tracking-[-0.035em]">Watchlist & Alerts</h1>
        <p className="text-sm text-text3 mt-1">Monitor specific assets and set custom alert rules — saved locally</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-[22px]">
        {/* Alert Rules */}
        <Card title="Alert Rules" badge={{ text: `${alertRules.filter((r) => evaluateRule(r).triggered).length} triggered` }}>
          <div className="flex flex-col gap-2 mb-4">
            {alertRules.map((item) => {
              const { triggered, current } = evaluateRule(item);
              return (
                <div key={item.id} className={`p-3 rounded-[var(--radius-sm)] border flex items-start justify-between ${triggered ? "border-accent bg-accent-soft" : "border-border bg-bg"}`}>
                  <div>
                    <div className={`text-[12px] font-semibold ${triggered ? "text-accent" : "text-text"}`}>{item.label}</div>
                    <div className="text-[10px] text-text3 mt-0.5">
                      Current: <span style={{ fontFamily: "var(--font-jetbrains)" }}>{current}</span>
                      {" · "}Threshold: <span style={{ fontFamily: "var(--font-jetbrains)" }}>{String(item.config.threshold)}</span>
                      {triggered && <span className="text-accent font-semibold ml-2">TRIGGERED</span>}
                    </div>
                  </div>
                  <button onClick={() => remove(item.id)} className="text-text3 hover:text-accent text-[14px] cursor-pointer bg-transparent border-none px-1">x</button>
                </div>
              );
            })}
            {alertRules.length === 0 && <div className="text-text3 text-xs text-center py-4">No alert rules set</div>}
          </div>

          {/* Add new rule */}
          <div className="p-3 rounded-[var(--radius-sm)] border border-border2 bg-bg2">
            <div className="text-[10px] font-semibold text-text3 uppercase tracking-[0.05em] mb-2">New Alert Rule</div>
            <div className="flex flex-wrap gap-2 items-end">
              <select value={newMetric} onChange={(e) => setNewMetric(e.target.value)}
                className="px-2.5 py-1.5 rounded-[var(--radius-xs)] border border-border2 bg-white text-[11px] font-medium outline-none appearance-none cursor-pointer" style={selectStyle}>
                <option value="crack321">Crack Spread</option>
                <option value="wti">WTI Price</option>
                <option value="brent">Brent Price</option>
                <option value="floatingStorage">Floating Storage</option>
                <option value="avgSpeed">Tanker Avg Speed</option>
                <option value="anchored">Anchored Tankers</option>
              </select>
              <select value={newOp} onChange={(e) => setNewOp(e.target.value)}
                className="px-2.5 py-1.5 rounded-[var(--radius-xs)] border border-border2 bg-white text-[11px] font-medium outline-none appearance-none cursor-pointer" style={selectStyle}>
                <option value="below">drops below</option>
                <option value="above">rises above</option>
              </select>
              <input type="number" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)} placeholder="Value"
                className="px-2.5 py-1.5 rounded-[var(--radius-xs)] border border-border2 bg-white text-[11px] font-medium outline-none w-[80px]" />
              <button onClick={addRule}
                className="px-3 py-1.5 rounded-[var(--radius-xs)] bg-text text-white text-[11px] font-semibold cursor-pointer border-none hover:bg-black/80 transition-colors">
                Add
              </button>
            </div>
          </div>
        </Card>

        {/* Watched Commodities */}
        <Card title="Watched Commodities">
          <div className="flex flex-col gap-2">
            {commodityItems.map((item) => {
              const price = commodities?.prices?.find((p) => p.symbol === item.config.symbol);
              return (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-[var(--radius-sm)] border border-border bg-bg">
                  <div>
                    <div className="text-[12px] font-semibold">{item.label}</div>
                    <div className="text-[10px] text-text3" style={{ fontFamily: "var(--font-jetbrains)" }}>{String(item.config.symbol)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[18px] font-bold">{price?.price ? "$" + price.price.toFixed(2) : "..."}</div>
                    {price?.changePct != null && (
                      <div className={`text-[10px] font-semibold ${price.changePct >= 0 ? "text-text2" : "text-accent"}`}>
                        {price.changePct >= 0 ? "+" : ""}{price.changePct.toFixed(2)}%
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
    </AppShell>
  );
}
