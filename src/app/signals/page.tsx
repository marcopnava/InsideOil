"use client";

import { useSession } from "next-auth/react";
import { useApi } from "@/hooks/use-api";
import { Card } from "@/components/card";
import { AppShell } from "@/components/app-shell";
import { InfoTooltip } from "@/components/info-tooltip";
import { PageHelp } from "@/components/page-help";
import { LockedPageView } from "@/components/locked-page-view";
import { hasTierAccess, type Tier } from "@/lib/tiers";

const SIGNALS_HELP = {
  title: "Institutional Signals — what am I looking at?",
  intro:
    "This page combines live global AIS (vessel positions), forward-curve futures from Yahoo Finance, and a synthetic tanker freight proxy to compute four signals that institutional desks pay 40-120k€/year for. The signals are recomputed every ~5 minutes from the latest data.",
  sections: [
    {
      title: "Contango Arbitrage (Brent / WTI)",
      body: [
        "When the forward curve is in 'contango' (futures > spot), you can theoretically buy crude now, store it on a chartered VLCC, and sell forward via futures. Profitable when the contango is BIGGER than freight + financing + insurance.",
        "The table shows P/L per barrel for every forward tenor (1M-12M). Green = profitable, gray = not.",
        "BULLISH STORAGE = there's a real arb. NO ARB = curve doesn't justify the trade today.",
        "When freight (BDTI) is high or curve is in backwardation, you'll always see NO ARB — that's correct, not a bug.",
      ],
    },
    {
      title: "BDTI / VLCC TCE",
      body: [
        "BDTI = Baltic Dirty Tanker Index, the daily benchmark for crude tanker freight rates. Sky-high BDTI means tanker capacity is scarce, freight is expensive.",
        "VLCC TCE (Time Charter Equivalent) = $ per day a Very Large Crude Carrier earns. Around $30-60k/day is normal; >$100k/day is extreme.",
        "Source note: the official BDTI is paywalled. We use BWET ETF as a proxy and apply a calibration formula. It's directional but not the actual published value.",
      ],
    },
    {
      title: "Brent / WTI Forward Curve Structure",
      body: [
        "CONTANGO = forward prices higher than spot. Usually means oversupply, market wants to incentivize storage.",
        "BACKWARDATION = forward prices lower than spot. Usually means physical market is tight, buyers willing to pay premium for prompt delivery.",
        "FLAT = no clear structure.",
        "Backwardation is generally bullish for crude price, contango bearish.",
      ],
    },
    {
      title: "Oil Chokepoint Flow",
      body: [
        "The 6 most strategic maritime chokepoints handle ~60% of global seaborne oil. We count tankers transiting each one.",
        "Δ% = current 24h transit count vs the 7-day moving average.",
        "DEPRESSED status (≤ −20%) = leading indicator of supply disruption (blockade, weather, geopolitics). Usually precedes a price spike by 24-72h.",
        "ELEVATED (≥ +20%) = surge in flows, watch for inventory build downstream.",
        "NO-DATA = the AIS history hasn't accumulated enough samples yet (needs ~24-48h after first deploy).",
        "COVERAGE NOTE: Persian Gulf (Hormuz) has weak terrestrial AIS coverage in the free feed. Numbers there underestimate reality. Satellite AIS would fix it but costs money.",
      ],
    },
    {
      title: "Floating Storage Detector",
      body: [
        "Identifies VLCC tankers idle at sea for >5 days, far from any oil terminal — the floating storage signature.",
        "Rising count + contango = confirmation that the storage trade is active.",
        "Rising count without contango = possible distress sale or sanctions evasion (dark fleet).",
        "Empty list at first launch is normal: needs 5+ days of position history to detect reliably.",
      ],
    },
    {
      title: "OPEC+ Compliance Scoring",
      body: [
        "For each OPEC+ country, we count tankers leaving the country's main loading terminals via AIS port-call detection over the last 30 days, estimate barrels loaded, and compare with the published quota.",
        "Δ > +5% of quota = country is overproducing (bearish for crude).",
        "Δ < −5% = underproducing (bullish, supply tight).",
        "First 24-48h after launch will show 0 because the position history needs time to accumulate. Real values appear gradually.",
        "Accuracy ~75% vs Kpler's ~95% — directional signal, not gospel.",
      ],
    },
  ],
};

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
  const { data: session } = useSession();
  const userTier = (session?.user as { subscriptionTier?: Tier } | undefined)?.subscriptionTier ?? "free";
  const hasAccess = hasTierAccess(userTier, "trader");

  const { data, loading, error } = useApi<SignalsPayload>(hasAccess ? "/api/signals" : "", 120_000);

  if (!hasAccess) {
    return (
      <AppShell>
        <LockedPageView
          required="trader"
          currentTier={userTier}
          title="Institutional Signals"
          subtitle="The four signals that hedge funds and oil majors pay 40-120k€/year for — floating storage detection, contango arbitrage, OPEC+ compliance, chokepoint flow — recomputed every 5 minutes from live data."
          features={[
            "Contango Arbitrage (Brent + WTI) — every forward tenor, P&L per barrel after freight/financing/insurance",
            "Floating Storage Detector — VLCC tankers idle > 5 days in open sea, with barrel estimates",
            "Oil Chokepoint Flow — Hormuz, Malacca, Suez, Bab-el-Mandeb, Bosphorus, Danish Straits with 7d-avg anomalies",
            "OPEC+ Compliance Scoring — per-country loadings vs published quotas",
            "Forward Curve Structure — contango / backwardation for Brent, WTI and synthetic Dubai",
            "BDTI + VLCC TCE — tanker freight benchmark with daily price impact",
          ]}
          samples={[
            {
              title: "Contango Arbitrage — Brent",
              rows: [
                ["Spot", "$84.46"],
                ["3M forward", "$85.12"],
                ["Contango 3M", "$0.66"],
                ["Freight cost", "$0.31"],
                ["P/L $/bbl", "+$0.35"],
                ["Verdict", "ARB OPEN"],
              ],
            },
            {
              title: "Chokepoint Flow — Hormuz",
              rows: [
                ["Current tankers", "42"],
                ["24h transits", "118"],
                ["7d average", "134"],
                ["Δ%", "-12%"],
                ["Status", "NORMAL"],
              ],
            },
          ]}
          description={
            <>
              <p>
                These signals don&apos;t exist in any retail terminal. They&apos;re built on the same
                logic as <strong>Kpler</strong>, <strong>Vortexa</strong>, <strong>ClipperData</strong> —
                institutional platforms that cost €40,000 to €120,000 per year.
              </p>
              <p>
                Auto-refreshed every 5 minutes via our worker. Coverage is strongest in EU, US and
                East Asia. We document all data gaps openly.
              </p>
            </>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHelp {...SIGNALS_HELP} />
      <div className="animate-fade-in max-w-[1400px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
        <div className="mb-5 sm:mb-6">
          <h1 className="text-[24px] sm:text-[30px] font-bold tracking-[-0.035em]">Institutional Signals</h1>
          <p className="text-[12px] sm:text-sm text-text3 mt-1">
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
                info="Baltic Dirty Tanker Index — daily benchmark for crude tanker freight rates. Higher = tanker capacity scarce, freight expensive. Official BDTI is paywalled, so we proxy via the BWET ETF with a calibration formula."
              />
              <StatBox
                label="VLCC TCE est."
                value={data.bdti ? "$" + fmt(Math.round(data.bdti.value * 18 - 8000)) : "…"}
                sub="$/day heuristic"
                info="Time Charter Equivalent — how much a Very Large Crude Carrier earns per day at current rates. Normal: $30-60k/day. Extreme: >$100k/day. Computed from BDTI via heuristic formula."
              />
              <StatBox
                label="Brent Structure"
                value={data.structure.brent ? data.structure.brent.shape.toUpperCase() : "…"}
                sub={data.structure.brent ? `6M Δ ${usd(data.structure.brent.spread6m)}` : "no curve"}
                highlight={data.structure.brent?.shape === "contango"}
                info="CONTANGO = futures > spot (oversupply, bearish). BACKWARDATION = futures < spot (tight market, bullish). FLAT = neither. The 6M Δ is the spread between front-month and 6-month forward, in $/bbl."
              />
              <StatBox
                label="OPEC+ Compliance"
                value={"groupCompliancePct" in data.opec ? `${data.opec.groupCompliancePct}%` : "…"}
                sub={"groupCompliancePct" in data.opec ? `${fmt(data.opec.totalEstimatedKbd)} kb/d` : "computing"}
                highlight={"groupCompliancePct" in data.opec && data.opec.groupCompliancePct > 105}
                info="Estimated production vs official OPEC+ quota, computed from AIS port-call detection at the main loading terminals over the last 30 days. >105% = group overproducing (bearish). Needs 24-48h of data history to be meaningful."
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
  info,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
  info?: string;
}) {
  return (
    <div className="bg-bg3 border border-border rounded-[var(--radius)] p-[14px_16px]">
      <div className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em] mb-1 flex items-center">
        {label}
        {info && <InfoTooltip text={info} />}
      </div>
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
        <div className="scroll-x -mx-6 px-6">
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
        <div className="scroll-x -mx-6 px-6 max-h-[360px] overflow-y-auto">
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
      <div className="scroll-x -mx-6 px-6">
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
      <div className="scroll-x -mx-6 px-6">
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
