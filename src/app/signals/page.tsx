"use client";

import { useApi } from "@/hooks/use-api";
import { Card } from "@/components/card";
import { AppShell } from "@/components/app-shell";

interface ArbTenor {
  tenor: number;
  contractMonth: string;
  forwardPrice: number;
  spotPrice: number;
  contangoPerBbl: number;
  freightPerBbl: number;
  financingPerBbl: number;
  insurancePerBbl: number;
  profitPerBbl: number;
  profitable: boolean;
}

interface ArbReport {
  generatedAt: string;
  instrument: string;
  spotPrice: number | null;
  vlccTCEPerDay: number | null;
  bdti: number | null;
  tenors: ArbTenor[];
  best: ArbTenor | null;
  recommendation: string;
  sentiment: "bullish_storage" | "neutral" | "no_arb";
}

interface StorageCandidate {
  mmsi: number;
  name: string | null;
  isVLCC: boolean;
  idleDays: number;
  avgSpeed: number;
  draught: number | null;
  lat: number;
  lng: number;
}

interface StorageReport {
  totals: { candidatesAll: number; vlcc: number; suezmaxOrSmaller: number };
  estimatedBarrels: number;
  candidates: StorageCandidate[];
}

interface OpecCountry {
  country: string;
  quotaKbd: number;
  estimatedKbd: number;
  compliancePct: number;
  delta: number;
  over: boolean;
  loadings: number;
}

interface OpecReport {
  generatedAt: string;
  countries: OpecCountry[];
  totalQuotaKbd: number;
  totalEstimatedKbd: number;
  groupCompliancePct: number;
  alerts: string[];
}

interface CurveStructure {
  shape: "contango" | "backwardation" | "flat";
  m1: number;
  m6: number;
  m12: number | null;
  spread6m: number;
  spread12m: number | null;
}

interface ChokepointReport {
  id: string;
  name: string;
  share: string;
  strategic: string;
  current: { tankers: number; cargo: number; total: number; avgSpeed: number };
  transit24h: number;
  avg7d: number;
  changePct: number;
  status: "normal" | "elevated" | "depressed" | "no-data";
  alert: string | null;
}

interface ChokepointFlow {
  generatedAt: string;
  globalAlerts: string[];
  chokepoints: ChokepointReport[];
}

interface SignalsPayload {
  generatedAt: string;
  storage: StorageReport | { error: string };
  arbitrage: { brent: ArbReport; wti: ArbReport };
  opec: OpecReport | { error: string };
  structure: { brent: CurveStructure | null; wti: CurveStructure | null };
  bdti: { value: number; source: string; fetchedAt: string } | null;
  chokepoints: ChokepointFlow | { error: string };
}

const usd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const fmt = (n: number) => n.toLocaleString("en-US");

function sentimentBadge(s: string) {
  if (s === "bullish_storage") return { text: "BULLISH STORAGE", cls: "bg-black text-white" };
  if (s === "neutral") return { text: "NEUTRAL", cls: "bg-black/6 text-text2" };
  return { text: "NO ARB", cls: "bg-black/6 text-text3" };
}

export default function SignalsPage() {
  const { data, loading, error } = useApi<SignalsPayload>("/api/signals", 120_000);

  return (
    <AppShell>
      <div className="animate-fade-in max-w-[1400px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
        <div className="mb-6">
          <h1 className="text-[30px] font-bold tracking-[-0.035em]">Institutional Signals</h1>
          <p className="text-sm text-text3 mt-1">
            Floating storage · Contango arbitrage · OPEC+ compliance · Chokepoint flow · Crack spread
          </p>
        </div>

        {loading && (
          <div className="bg-bg3 border border-border rounded-[var(--radius)] p-6 text-text3 text-xs">
            Computing signals…
          </div>
        )}
        {error && (
          <div className="bg-bg3 border border-border rounded-[var(--radius)] p-5 mb-4">
            <div className="text-[10px] font-semibold text-accent uppercase tracking-[0.07em] mb-2">Error</div>
            <div className="text-xs text-text2">{error}</div>
          </div>
        )}

        {data && (
          <>
            {/* Row 1 — Contango Brent + WTI */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">
              <Card
                title="Contango Arbitrage — Brent"
                badge={{ text: sentimentBadge(data.arbitrage.brent.sentiment).text, variant: data.arbitrage.brent.sentiment === "bullish_storage" ? "accent" : "dark" }}
              >
                <ArbBlock report={data.arbitrage.brent} />
              </Card>
              <Card
                title="Contango Arbitrage — WTI"
                badge={{ text: sentimentBadge(data.arbitrage.wti.sentiment).text, variant: data.arbitrage.wti.sentiment === "bullish_storage" ? "accent" : "dark" }}
              >
                <ArbBlock report={data.arbitrage.wti} />
              </Card>
            </div>

            {/* Row 2 — Top stats (BDTI, curve, group compliance, chokepoint alerts) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-3.5">
              <StatBox
                label="BDTI"
                value={data.bdti ? fmt(data.bdti.value) : "…"}
                sub={data.bdti ? data.bdti.source : "no data"}
              />
              <StatBox
                label="VLCC TCE est."
                value={data.bdti ? "$" + fmt(Math.round(data.bdti.value * 18 - 8000)) : "…"}
                sub="$/day heuristic"
              />
              <StatBox
                label="Brent Structure"
                value={data.structure.brent ? data.structure.brent.shape.toUpperCase() : "…"}
                sub={data.structure.brent ? `6M Δ ${usd(data.structure.brent.spread6m)}` : "no curve"}
                highlight={data.structure.brent?.shape === "contango"}
              />
              <StatBox
                label="OPEC+ Compliance"
                value={"groupCompliancePct" in data.opec ? `${data.opec.groupCompliancePct}%` : "…"}
                sub={"groupCompliancePct" in data.opec ? `${fmt(data.opec.totalEstimatedKbd)} kb/d` : "computing"}
                highlight={"groupCompliancePct" in data.opec && data.opec.groupCompliancePct > 105}
              />
            </div>

            {/* Row 3 — Chokepoint flow (full width) */}
            <div className="mb-3.5">
              <Card
                title="Oil Chokepoint Flow"
                badge={
                  "globalAlerts" in data.chokepoints && data.chokepoints.globalAlerts.length > 0
                    ? { text: `${data.chokepoints.globalAlerts.length} ALERTS`, variant: "accent" }
                    : { text: "Live", variant: "dark" }
                }
              >
                {"error" in data.chokepoints ? (
                  <div className="text-text3 text-xs">{data.chokepoints.error}</div>
                ) : (
                  <ChokepointsBlock cp={data.chokepoints} />
                )}
              </Card>
            </div>

            {/* Row 4 — Floating storage (full width) */}
            <div className="mb-3.5">
              <Card
                title="Floating Storage Detector"
                badge={
                  "totals" in data.storage
                    ? { text: `${data.storage.totals.candidatesAll} ships`, variant: data.storage.totals.candidatesAll > 0 ? "accent" : "dark" }
                    : undefined
                }
              >
                {"error" in data.storage ? (
                  <div className="text-text3 text-xs">{data.storage.error}</div>
                ) : (
                  <FloatingStorageBlock storage={data.storage} />
                )}
              </Card>
            </div>

            {/* Row 5 — OPEC+ compliance (full width) */}
            <div className="mb-3.5">
              <Card
                title="OPEC+ Compliance Scoring"
                badge={
                  "groupCompliancePct" in data.opec
                    ? { text: `${data.opec.groupCompliancePct}% of quota`, variant: data.opec.groupCompliancePct > 105 ? "accent" : "dark" }
                    : undefined
                }
              >
                {"error" in data.opec ? (
                  <div className="text-text3 text-xs">{data.opec.error}</div>
                ) : (
                  <OpecBlock opec={data.opec} />
                )}
              </Card>
            </div>

            <div className="text-[10px] text-text3">
              Last computed: {new Date(data.generatedAt).toLocaleString("en-GB")} · Data: AISStream · Yahoo Futures · Calibrated BWET proxy
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

/* ─── Stat box (same look as Dashboard Row 3 cards) ─── */
function StatBox({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-bg3 border border-border rounded-[var(--radius)] p-[14px_16px]">
      <div className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em] mb-1">{label}</div>
      <div className={`text-[20px] font-bold tracking-[-0.03em] leading-none ${highlight ? "text-accent" : ""}`}>
        {value}
      </div>
      <div className="text-[9px] text-text3 mt-1">{sub}</div>
    </div>
  );
}

/* ─── Contango arbitrage block ─── */
function ArbBlock({ report }: { report: ArbReport }) {
  if (report.spotPrice == null) {
    return <div className="text-text3 text-xs">{report.recommendation}</div>;
  }
  return (
    <div>
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <div className="text-[11px] text-text3">
          Spot <span className="text-text font-semibold">{usd(report.spotPrice)}</span>
          <span className="mx-2">·</span>
          BDTI <span className="text-text font-semibold">{report.bdti ?? "—"}</span>
          <span className="mx-2">·</span>
          TCE <span className="text-text font-semibold">{report.vlccTCEPerDay ? usd(report.vlccTCEPerDay) + "/d" : "—"}</span>
        </div>
      </div>
      <div className="text-[12px] text-text2 mb-3 leading-[1.4]">{report.recommendation}</div>
      {report.tenors.length > 0 && (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em]">
                <th className="py-1.5 pr-3 text-left">Tenor</th>
                <th className="py-1.5 pr-3 text-right">Fwd</th>
                <th className="py-1.5 pr-3 text-right">Contango</th>
                <th className="py-1.5 pr-3 text-right">Freight</th>
                <th className="py-1.5 pr-3 text-right">Fin+Ins</th>
                <th className="py-1.5 pr-3 text-right">P/L $/bbl</th>
              </tr>
            </thead>
            <tbody>
              {report.tenors.map((t) => (
                <tr key={t.tenor} className="border-t border-border">
                  <td className="py-1.5 pr-3 font-semibold">{t.tenor}M</td>
                  <td className="py-1.5 pr-3 text-right" style={{ fontFamily: "var(--font-jetbrains)" }}>{usd(t.forwardPrice)}</td>
                  <td className="py-1.5 pr-3 text-right" style={{ fontFamily: "var(--font-jetbrains)" }}>{usd(t.contangoPerBbl)}</td>
                  <td className="py-1.5 pr-3 text-right" style={{ fontFamily: "var(--font-jetbrains)" }}>{usd(t.freightPerBbl)}</td>
                  <td className="py-1.5 pr-3 text-right" style={{ fontFamily: "var(--font-jetbrains)" }}>{usd(t.financingPerBbl + t.insurancePerBbl)}</td>
                  <td
                    className={`py-1.5 pr-3 text-right font-bold ${t.profitPerBbl > 0 ? "text-text" : "text-text3"}`}
                    style={{ fontFamily: "var(--font-jetbrains)" }}
                  >
                    {usd(t.profitPerBbl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Floating storage block ─── */
function FloatingStorageBlock({ storage }: { storage: StorageReport }) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-3.5 mb-4">
        <MiniStat label="Candidates" value={fmt(storage.totals.candidatesAll)} />
        <MiniStat label="VLCC class" value={fmt(storage.totals.vlcc)} />
        <MiniStat
          label="Estimated barrels"
          value={`${(storage.estimatedBarrels / 1_000_000).toFixed(1)}M`}
        />
      </div>
      {storage.candidates.length === 0 ? (
        <div className="text-text3 text-xs">
          No tanker matches the floating-storage signature in the last 7 days.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6 max-h-[360px] overflow-y-auto">
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 bg-bg3">
              <tr className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em]">
                <th className="py-1.5 pr-3 text-left">Vessel</th>
                <th className="py-1.5 pr-3 text-left">Class</th>
                <th className="py-1.5 pr-3 text-right">Idle days</th>
                <th className="py-1.5 pr-3 text-right">Avg speed</th>
                <th className="py-1.5 pr-3 text-left">Position</th>
              </tr>
            </thead>
            <tbody>
              {storage.candidates.slice(0, 50).map((c) => (
                <tr key={c.mmsi} className="border-t border-border">
                  <td className="py-1.5 pr-3 font-medium">{c.name ?? `MMSI ${c.mmsi}`}</td>
                  <td className="py-1.5 pr-3">
                    <span className={`text-[9px] font-bold px-1.5 py-[1px] rounded-full ${c.isVLCC ? "bg-black text-white" : "bg-black/6 text-text2"}`}>
                      {c.isVLCC ? "VLCC" : "OTHER"}
                    </span>
                  </td>
                  <td className="py-1.5 pr-3 text-right" style={{ fontFamily: "var(--font-jetbrains)" }}>{c.idleDays}</td>
                  <td className="py-1.5 pr-3 text-right" style={{ fontFamily: "var(--font-jetbrains)" }}>{c.avgSpeed}</td>
                  <td className="py-1.5 pr-3 text-text3" style={{ fontFamily: "var(--font-jetbrains)" }}>
                    {c.lat.toFixed(2)}, {c.lng.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── OPEC+ compliance block ─── */
function OpecBlock({ opec }: { opec: OpecReport }) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-3.5 mb-4">
        <MiniStat label="Total quota" value={`${(opec.totalQuotaKbd / 1000).toFixed(1)} mb/d`} />
        <MiniStat label="Estimated loadings" value={`${(opec.totalEstimatedKbd / 1000).toFixed(1)} mb/d`} />
        <MiniStat label="Group compliance" value={`${opec.groupCompliancePct}%`} highlight={opec.groupCompliancePct > 105} />
      </div>
      {opec.alerts.length > 0 && (
        <div className="bg-accent-soft border border-accent/20 rounded-[var(--radius-xs)] p-3 mb-3">
          {opec.alerts.map((a, i) => (
            <div key={i} className="text-[11px] text-accent leading-[1.4]">• {a}</div>
          ))}
        </div>
      )}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em]">
              <th className="py-1.5 pr-3 text-left">Country</th>
              <th className="py-1.5 pr-3 text-right">Quota kb/d</th>
              <th className="py-1.5 pr-3 text-right">Estimated</th>
              <th className="py-1.5 pr-3 text-right">Δ</th>
              <th className="py-1.5 pr-3 text-right">% quota</th>
              <th className="py-1.5 pr-3 text-right">Loadings 30d</th>
            </tr>
          </thead>
          <tbody>
            {opec.countries.map((c) => (
              <tr key={c.country} className="border-t border-border">
                <td className="py-1.5 pr-3 font-medium">{c.country}</td>
                <td className="py-1.5 pr-3 text-right" style={{ fontFamily: "var(--font-jetbrains)" }}>{fmt(c.quotaKbd)}</td>
                <td className="py-1.5 pr-3 text-right" style={{ fontFamily: "var(--font-jetbrains)" }}>{fmt(c.estimatedKbd)}</td>
                <td
                  className={`py-1.5 pr-3 text-right font-bold ${c.over ? "text-accent" : "text-text2"}`}
                  style={{ fontFamily: "var(--font-jetbrains)" }}
                >
                  {c.delta > 0 ? "+" : ""}{c.delta}
                </td>
                <td className="py-1.5 pr-3 text-right" style={{ fontFamily: "var(--font-jetbrains)" }}>{c.compliancePct}%</td>
                <td className="py-1.5 pr-3 text-right" style={{ fontFamily: "var(--font-jetbrains)" }}>{c.loadings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Chokepoint flow block ─── */
function ChokepointsBlock({ cp }: { cp: ChokepointFlow }) {
  return (
    <div>
      {cp.globalAlerts.length > 0 && (
        <div className="bg-accent-soft border border-accent/20 rounded-[var(--radius-xs)] p-3 mb-3">
          {cp.globalAlerts.map((a, i) => (
            <div key={i} className="text-[11px] text-accent leading-[1.4]">⚠ {a}</div>
          ))}
        </div>
      )}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em]">
              <th className="py-1.5 pr-3 text-left">Chokepoint</th>
              <th className="py-1.5 pr-3 text-left">% global oil</th>
              <th className="py-1.5 pr-3 text-right">Now (tankers)</th>
              <th className="py-1.5 pr-3 text-right">24h transits</th>
              <th className="py-1.5 pr-3 text-right">7d avg</th>
              <th className="py-1.5 pr-3 text-right">Δ %</th>
              <th className="py-1.5 pr-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {cp.chokepoints.map((c) => {
              const isAnomaly = c.status === "depressed" || c.status === "elevated";
              return (
                <tr key={c.id} className="border-t border-border">
                  <td className="py-1.5 pr-3 font-medium">{c.name}</td>
                  <td className="py-1.5 pr-3 text-text3">{c.share}</td>
                  <td className="py-1.5 pr-3 text-right" style={{ fontFamily: "var(--font-jetbrains)" }}>{c.current.tankers}</td>
                  <td className="py-1.5 pr-3 text-right" style={{ fontFamily: "var(--font-jetbrains)" }}>{c.transit24h}</td>
                  <td className="py-1.5 pr-3 text-right" style={{ fontFamily: "var(--font-jetbrains)" }}>{c.avg7d || "—"}</td>
                  <td
                    className={`py-1.5 pr-3 text-right font-bold ${isAnomaly ? "text-accent" : "text-text2"}`}
                    style={{ fontFamily: "var(--font-jetbrains)" }}
                  >
                    {c.avg7d > 0 ? `${c.changePct > 0 ? "+" : ""}${c.changePct}%` : "—"}
                  </td>
                  <td className="py-1.5 pr-3">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-[1px] rounded-full ${
                        c.status === "depressed"
                          ? "bg-accent text-white"
                          : c.status === "elevated"
                            ? "bg-black text-white"
                            : c.status === "normal"
                              ? "bg-black/6 text-text2"
                              : "bg-black/3 text-text3"
                      }`}
                    >
                      {c.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-[10px] text-text3">
        A sustained −20% in Hormuz or Bab-el-Mandeb typically leads crude prices by 24–72h.
      </div>
    </div>
  );
}

/* ─── Mini stat (inside a card) ─── */
function MiniStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em] mb-1">{label}</div>
      <div className={`text-[18px] font-bold tracking-[-0.02em] ${highlight ? "text-accent" : "text-text"}`}>
        {value}
      </div>
    </div>
  );
}
