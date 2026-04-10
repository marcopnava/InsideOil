"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/hooks/use-api";
import { KPICard } from "@/components/kpi-card";
import { Card } from "@/components/card";
import { DetailPanel, DetailRow } from "@/components/detail-panel";
import { TradeTabs } from "@/components/trade-tabs";
import { AppShell } from "@/components/app-shell";

interface BallastData {
  ballastFleet: { total: number; bySpeed: { fast: number; forOrders: number } };
  portAvailability: Array<{ port: string; nearbyBallast: number; approaching: number; totalAvailable: number; vessels: Array<{ mmsi: number; name: string | null; speed: number; destination: string | null }> }>;
  marketSignal: { ballastRatio: number; interpretation: string; sentiment: string };
}
interface DarkData {
  darkFleet: { candidates: Array<{ mmsi: number; name: string | null; lastSpeed: number; gapMinutes: number }>; count: number; note: string };
  stsMonitor: { zones: Array<{ zone: string; tankersPresent: number; stationary: number; potentialSTS: boolean }>; activeSTS: number };
  fleetIntegrity: { totalTankers: number; monitoringSince: string };
}
interface CrackData {
  prices: { wti: number | null; brent: number | null; gasolinePerBarrel: number | null; heatingOilPerBarrel: number | null };
  spreads: { crack321WTI: number | null; crack321Brent: number | null; gasolineCrackWTI: number | null; heatingOilCrackWTI: number | null; brentWTI: number | null };
  assessment: string | null;
  sentiment: string;
}
interface ArbitrageRoute {
  label: string; from: string; to: string; distance: number; transitDays: number;
  buyPrice: number; discount: number; freightPerBarrel: number;
  grossMargin: number; netMargin: number; totalPnL: number; profitable: boolean; cargoBarrels: number;
}
interface ArbitrageData { routes: ArbitrageRoute[]; brentPrice: number; bestRoute: string; bestMargin: number; profitableRoutes: number; totalRoutes: number }
interface VoyageResult {
  route: { from: string; to: string };
  distance: { routed: number };
  timing: { seaDaysLoaded: number; totalDays: number };
  costs: { fuel: { total: number }; port: number; opex: number; total: number; perTonne: number; perBarrel: number };
  economics: { tce: number; tceAssessment: string };
}
interface PortOption { name: string; region: string; type: string }

const fmt = (n: number) => n.toLocaleString("en-US");
const sentCls: Record<string, string> = { bullish: "bg-black/8 text-text", bearish: "bg-accent-soft2 text-accent", neutral: "bg-black/4 text-text3" };

export default function TradingDesk() {
  const { data: ballast } = useApi<BallastData>("/api/trade/ballast", 30_000);
  const { data: dark } = useApi<DarkData>("/api/trade/dark-fleet", 30_000);
  const { data: crack } = useApi<CrackData>("/api/trade/crack-spread", 300_000);
  const { data: arb } = useApi<ArbitrageData>("/api/trade/arbitrage", 300_000);

  const [ports, setPorts] = useState<PortOption[]>([]);
  const [fromPort, setFromPort] = useState("Primorsk");
  const [toPort, setToPort] = useState("Rotterdam");
  const [voyage, setVoyage] = useState<VoyageResult | null>(null);
  const [loadingVoyage, setLoadingVoyage] = useState(false);
  const [selectedPort, setSelectedPort] = useState<BallastData["portAvailability"][0] | null>(null);
  const [selectedArb, setSelectedArb] = useState<ArbitrageRoute | null>(null);

  useEffect(() => {
    fetch("/api/trade/voyage").then((r) => r.json()).then((j) => { if (j.success) setPorts(j.data.ports); });
  }, []);

  const calcVoyage = async () => {
    setLoadingVoyage(true);
    try {
      const r = await fetch(`/api/trade/voyage?from=${encodeURIComponent(fromPort)}&to=${encodeURIComponent(toPort)}`);
      const j = await r.json();
      if (j.success) setVoyage(j.data);
    } catch { /* */ }
    setLoadingVoyage(false);
  };

  const selectStyle = { backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat" as const, backgroundPosition: "right 10px center", paddingRight: "32px" };

  return (
    <AppShell>
    <div className="animate-fade-in max-w-[1400px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
      <div className="mb-7">
        <h1 className="text-[30px] font-bold tracking-[-0.035em]">Trading Desk</h1>
        <p className="text-sm text-text3 mt-1">Voyage economics, crack spreads, arbitrage scanner, dark fleet — operational intelligence</p>
        <TradeTabs />
      </div>

      {/* Crack Spreads */}
      <Card title="Crack Spread & Refinery Margins" badge={{ text: "Live" }} className="mb-[22px]">
        {crack ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
              {[
                { label: "3-2-1 Crack (WTI)", value: crack.spreads.crack321WTI, key: true },
                { label: "3-2-1 Crack (Brent)", value: crack.spreads.crack321Brent, key: false },
                { label: "Gasoline Crack", value: crack.spreads.gasolineCrackWTI, key: false },
                { label: "Heating Oil Crack", value: crack.spreads.heatingOilCrackWTI, key: false },
                { label: "Brent-WTI", value: crack.spreads.brentWTI, key: false },
                { label: "Gasoline $/bbl", value: crack.prices.gasolinePerBarrel, key: false },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-[var(--radius-sm)] border border-border bg-bg">
                  <div className="text-[9px] font-semibold text-text3 uppercase tracking-[0.05em]">{s.label}</div>
                  <div className={`text-[20px] font-bold mt-1 tracking-[-0.02em] ${s.key && (s.value ?? 0) > 25 ? "" : s.key && (s.value ?? 0) < 15 ? "text-accent" : ""}`}>
                    {s.value != null ? "$" + s.value.toFixed(2) : "..."}
                  </div>
                </div>
              ))}
            </div>
            {crack.assessment && (
              <div className={`p-3 rounded-[var(--radius-sm)] border text-[11.5px] leading-[1.4] ${sentCls[crack.sentiment]}`}>
                <span className="font-semibold">{crack.sentiment.toUpperCase()}:</span> {crack.assessment}
              </div>
            )}
          </>
        ) : <div className="text-text3 text-xs text-center py-8">Loading crack spreads...</div>}
      </Card>

      {/* Arbitrage Scanner */}
      <Card title="Arbitrage Scanner" badge={{ text: arb ? `${arb.profitableRoutes}/${arb.totalRoutes} profitable` : "..." }} className="mb-[22px]">
        {arb ? (
          <div className="scroll-x">
            <table className="w-full border-collapse">
              <thead><tr>
                {["Route", "Discount", "Freight", "Net Margin", "Cargo P&L", ""].map((h) => (
                  <th key={h} className="text-[10px] font-semibold uppercase tracking-[0.07em] text-text3 text-left px-3 py-[9px] border-b border-border2">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {arb.routes.map((r, i) => (
                  <tr key={`${r.from}-${r.to}-${i}`} className="transition-colors hover:bg-bg2 cursor-pointer" onClick={() => setSelectedArb(r)}>
                    <td className="text-[12px] px-3 py-[12px] border-b border-border font-medium">{r.label}</td>
                    <td className="text-[12px] px-3 py-[12px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)" }}>${r.discount.toFixed(1)}/bbl</td>
                    <td className="text-[12px] px-3 py-[12px] border-b border-border text-text2" style={{ fontFamily: "var(--font-jetbrains)" }}>${r.freightPerBarrel}/bbl</td>
                    <td className={`text-[12px] px-3 py-[12px] border-b border-border font-semibold ${r.profitable ? "" : "text-accent"}`} style={{ fontFamily: "var(--font-jetbrains)" }}>
                      ${r.netMargin.toFixed(2)}/bbl
                    </td>
                    <td className={`text-[12px] px-3 py-[12px] border-b border-border font-semibold ${r.profitable ? "" : "text-accent"}`} style={{ fontFamily: "var(--font-jetbrains)" }}>
                      {r.profitable ? "+" : ""}${fmt(r.totalPnL)}
                    </td>
                    <td className="text-[12px] px-3 py-[12px] border-b border-border">
                      <span className={`inline-flex px-[8px] py-[2px] rounded-full text-[10px] font-semibold ${r.profitable ? "bg-black/6 text-text" : "bg-accent-soft text-accent"}`}>
                        {r.profitable ? "GO" : "NO"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 text-[9px] text-text3">Based on Brent ${arb.brentPrice.toFixed(2)} · Aframax 80k DWT · estimated crude discounts</div>
          </div>
        ) : <div className="text-text3 text-xs text-center py-8">Scanning routes...</div>}
      </Card>

      {/* Voyage Calculator */}
      <Card title="Voyage Calculator" badge={{ text: "Aframax" }} className="mb-[22px]">
        <div className="flex flex-wrap items-end gap-3 mb-5">
          <div>
            <label className="text-[10px] font-semibold text-text3 uppercase tracking-[0.05em] block mb-1">Loading Port</label>
            <select value={fromPort} onChange={(e) => setFromPort(e.target.value)}
              className="px-3 py-2 rounded-[var(--radius-xs)] border border-border2 bg-white text-[12.5px] font-medium min-w-[180px] outline-none appearance-none cursor-pointer hover:border-text3 focus:border-text transition-colors" style={selectStyle}>
              {ports.filter((p) => p.type.includes("Loading")).map((p) => <option key={p.name} value={p.name}>{p.name} ({p.region})</option>)}
            </select>
          </div>
          <div className="text-text3 text-lg font-light pb-1">→</div>
          <div>
            <label className="text-[10px] font-semibold text-text3 uppercase tracking-[0.05em] block mb-1">Discharge Port</label>
            <select value={toPort} onChange={(e) => setToPort(e.target.value)}
              className="px-3 py-2 rounded-[var(--radius-xs)] border border-border2 bg-white text-[12.5px] font-medium min-w-[180px] outline-none appearance-none cursor-pointer hover:border-text3 focus:border-text transition-colors" style={selectStyle}>
              {ports.filter((p) => p.type.includes("Discharge") || p.type.includes("Refining") || p.type.includes("Transit")).map((p) => <option key={p.name} value={p.name}>{p.name} ({p.region})</option>)}
            </select>
          </div>
          <button onClick={calcVoyage} disabled={loadingVoyage}
            className="px-5 py-2 rounded-[var(--radius-xs)] bg-text text-white text-[12px] font-semibold cursor-pointer border-none hover:bg-black/80 transition-colors disabled:opacity-50">
            {loadingVoyage ? "..." : "Calculate"}
          </button>
        </div>
        {voyage && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Distance", value: fmt(voyage.distance.routed) + " nm" },
                { label: "Transit", value: voyage.timing.totalDays + " days" },
                { label: "Total Cost", value: "$" + fmt(voyage.costs.total) },
                { label: "$/Barrel", value: "$" + voyage.costs.perBarrel },
                { label: "TCE", value: "$" + fmt(voyage.economics.tce) + "/d", accent: voyage.economics.tce < 0 },
                { label: "Verdict", value: voyage.economics.tceAssessment.split("—")[0] },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-[var(--radius-sm)] border border-border bg-bg">
                  <div className="text-[9px] font-semibold text-text3 uppercase tracking-[0.05em]">{s.label}</div>
                  <div className={`text-[16px] font-bold mt-1 ${"accent" in s && s.accent ? "text-accent" : ""}`}>{s.value}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-2 text-[10px] text-text3">
              <span>Fuel: ${fmt(voyage.costs.fuel.total)}</span>
              <span>Port: ${fmt(voyage.costs.port)}</span>
              <span>OPEX: ${fmt(voyage.costs.opex)}</span>
            </div>
          </>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Ballast */}
        <Card title="Ballast Positioning" badge={{ text: ballast ? `${ballast.ballastFleet.total} empty` : "..." }}>
          {ballast && (
            <div className={`p-3 rounded-[var(--radius-sm)] border border-border mb-4 ${sentCls[ballast.marketSignal.sentiment]}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.05em]">Tonnage Signal</span>
                <span className="text-[9px] font-bold">{ballast.marketSignal.ballastRatio}% ballast</span>
              </div>
              <div className="text-[11px] mt-1 leading-[1.4]">{ballast.marketSignal.interpretation}</div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {ballast?.portAvailability.map((p) => {
              const max = ballast.portAvailability[0]?.totalAvailable || 1;
              const pct = Math.round((p.totalAvailable / max) * 100);
              return (
                <div key={p.port} className="cursor-pointer hover:bg-bg2 -mx-1 px-1 py-0.5 rounded transition-colors" onClick={() => setSelectedPort(p)}>
                  <div className="flex justify-between text-[11.5px] mb-[3px]">
                    <span className="font-medium">{p.port}</span>
                    <span className="text-text3" style={{ fontFamily: "var(--font-jetbrains)" }}>{p.nearbyBallast} nearby · {p.approaching} appr.</span>
                  </div>
                  <div className="hbar"><div className="hbar-fill" style={{ width: `${pct}%`, background: p.totalAvailable > 3 ? "#111" : "#bbb" }} /></div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Dark Fleet */}
        <Card title="Dark Fleet Monitor" badge={{ text: dark ? `${dark.darkFleet.count} flagged` : "..." }}>
          {dark ? (
            <>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="p-3 rounded-[var(--radius-sm)] border border-border bg-bg text-center">
                  <div className="text-[9px] font-semibold text-text3 uppercase">Monitoring</div>
                  <div className="text-[16px] font-bold mt-1">{fmt(dark.fleetIntegrity.totalTankers)}</div>
                </div>
                <div className="p-3 rounded-[var(--radius-sm)] border border-border bg-bg text-center">
                  <div className="text-[9px] font-semibold text-text3 uppercase">AIS Gaps</div>
                  <div className={`text-[16px] font-bold mt-1 ${dark.darkFleet.count > 0 ? "text-accent" : ""}`}>{dark.darkFleet.count}</div>
                </div>
                <div className="p-3 rounded-[var(--radius-sm)] border border-border bg-bg text-center">
                  <div className="text-[9px] font-semibold text-text3 uppercase">STS Zones</div>
                  <div className={`text-[16px] font-bold mt-1 ${dark.stsMonitor.activeSTS > 0 ? "text-accent" : ""}`}>{dark.stsMonitor.activeSTS}</div>
                </div>
              </div>
              {dark.darkFleet.candidates.length > 0 && dark.darkFleet.candidates.slice(0, 5).map((d) => (
                <div key={d.mmsi} className="flex justify-between py-2 border-b border-border text-[11px]">
                  <span className="font-medium">{d.name || `MMSI ${d.mmsi}`}</span>
                  <span className="text-accent font-semibold" style={{ fontFamily: "var(--font-jetbrains)" }}>gap {d.gapMinutes}m</span>
                </div>
              ))}
              {dark.stsMonitor.zones.map((z) => (
                <div key={z.zone} className={`p-2.5 rounded-[var(--radius-sm)] border mt-2 ${z.potentialSTS ? "border-accent bg-accent-soft" : "border-border bg-bg"}`}>
                  <div className="flex justify-between text-[11px]">
                    <span className="font-semibold">{z.zone}</span>
                    <span className={z.potentialSTS ? "text-accent font-bold" : "text-text3"}>{z.stationary}/{z.tankersPresent}</span>
                  </div>
                  {z.potentialSTS && <div className="text-[10px] text-accent mt-1 font-medium">Potential STS transfer</div>}
                </div>
              ))}
            </>
          ) : <div className="text-text3 text-xs text-center py-8">Initializing...</div>}
        </Card>
      </div>

      {/* Arbitrage Detail */}
      <DetailPanel open={!!selectedArb} onClose={() => setSelectedArb(null)}>
        {selectedArb && (
          <>
            <div className="text-[11px] text-text3">Arbitrage Analysis</div>
            <h2 className="text-[20px] font-bold mt-1 tracking-[-0.02em]">{selectedArb.label}</h2>
            <span className={`inline-flex px-[9px] py-[3px] rounded-full text-[10px] font-semibold mt-2 ${selectedArb.profitable ? "bg-black/6 text-text" : "bg-accent-soft text-accent"}`}>
              {selectedArb.profitable ? "PROFITABLE" : "LOSS-MAKING"}
            </span>
            <div className="mt-4">
              <DetailRow label="Route" value={`${selectedArb.from} → ${selectedArb.to}`} />
              <DetailRow label="Distance" value={fmt(selectedArb.distance) + " nm"} mono />
              <DetailRow label="Transit" value={selectedArb.transitDays + " days"} mono />
              <DetailRow label="Buy Price" value={"$" + selectedArb.buyPrice.toFixed(2) + "/bbl"} mono />
              <DetailRow label="Crude Discount" value={"$" + selectedArb.discount.toFixed(1) + "/bbl"} mono />
              <DetailRow label="Freight Cost" value={"$" + selectedArb.freightPerBarrel + "/bbl"} mono />
              <DetailRow label="Gross Margin" value={"$" + selectedArb.grossMargin.toFixed(2) + "/bbl"} mono />
              <DetailRow label="Net Margin" value={"$" + selectedArb.netMargin.toFixed(2) + "/bbl"} mono accent={!selectedArb.profitable} />
              <DetailRow label="Cargo Size" value={fmt(selectedArb.cargoBarrels) + " barrels"} mono />
              <DetailRow label="Total P&L" value={(selectedArb.profitable ? "+$" : "-$") + fmt(Math.abs(selectedArb.totalPnL))} mono accent={!selectedArb.profitable} />
            </div>
            <div className="mt-4 p-3 rounded-[var(--radius-sm)] border border-border bg-bg text-[11px] leading-[1.5] text-text2">
              {selectedArb.profitable
                ? `This trade generates $${selectedArb.netMargin.toFixed(2)}/barrel net after freight. On a cargo of ${fmt(selectedArb.cargoBarrels)} barrels, total P&L is +$${fmt(selectedArb.totalPnL)}. Consider executing if tonnage is available at ${selectedArb.from}.`
                : `This trade is currently uneconomical. The crude discount ($${selectedArb.discount.toFixed(1)}) does not cover freight costs ($${selectedArb.freightPerBarrel}/bbl). Wait for wider spreads or lower freight rates.`}
            </div>
          </>
        )}
      </DetailPanel>

      {/* Ballast Detail */}
      <DetailPanel open={!!selectedPort} onClose={() => setSelectedPort(null)}>
        {selectedPort && (
          <>
            <div className="text-[11px] text-text3">Ballast Availability</div>
            <h2 className="text-[20px] font-bold mt-1 tracking-[-0.02em]">{selectedPort.port}</h2>
            <div className="mt-4">
              <DetailRow label="Nearby" value={selectedPort.nearbyBallast} mono />
              <DetailRow label="Approaching" value={selectedPort.approaching} mono />
              <DetailRow label="Total" value={selectedPort.totalAvailable} mono accent={selectedPort.totalAvailable > 5} />
            </div>
            {selectedPort.vessels.length > 0 && (
              <>
                <h4 className="text-[11px] font-semibold mt-4 mb-2 text-text3 uppercase tracking-[0.05em]">Empty Tankers</h4>
                {selectedPort.vessels.map((v) => (
                  <div key={v.mmsi} className="flex justify-between py-2 border-b border-border text-[11px] last:border-b-0">
                    <div><div className="font-medium">{v.name || `MMSI ${v.mmsi}`}</div><div className="text-[9px] text-text3">{v.destination || "No dest"}</div></div>
                    <span className="text-text3" style={{ fontFamily: "var(--font-jetbrains)" }}>{v.speed.toFixed(1)} kn</span>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </DetailPanel>
    </div>
    </AppShell>
  );
}
