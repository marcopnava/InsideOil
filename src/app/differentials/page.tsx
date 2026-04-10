"use client";

import { useApi } from "@/hooks/use-api";
import { Card } from "@/components/card";
import { AppShell } from "@/components/app-shell";
import { PageHelp } from "@/components/page-help";

const DIFF_HELP = {
  title: "Crude Differentials & Macro — what am I looking at?",
  intro:
    "Cross-region crude spreads, freight economics, EIA weekly inventories and CFTC speculative positioning — the bread and butter of crude oil trading.",
  sections: [
    {
      title: "Brent − WTI spread",
      body: [
        "Atlantic basin spread. Above $5/bbl = Brent rich, US barrels flow to Europe → bullish WTI.",
        "Below $2/bbl = parity, no arbitrage incentive.",
        "Inverted (WTI > Brent) = US tightness, very rare.",
      ],
    },
    {
      title: "Brent − Dubai EFS",
      body: [
        "Brent vs Mid-East benchmark. Wide EFS = Atlantic crude trading at premium → cheap to move Mid-East crude west.",
        "Tight EFS = no arb, Asian buyers prefer Mid-East.",
      ],
    },
    {
      title: "USGC → Asia arbitrage",
      body: [
        "Computes whether shipping WTI from US Gulf Coast to Asia is profitable vs buying Dubai locally.",
        "Formula: Dubai − (WTI + freight + financing). Positive = arb open, ship US barrels east.",
        "Freight estimated from BDTI × VLCC TCE heuristic over a 45-day voyage.",
      ],
    },
    {
      title: "EIA Weekly Petroleum Status",
      body: [
        "Crude stock = total US commercial crude inventory. Watched every Wednesday at 16:30 CET. A surprise build (>2 Mbbl above expectations) is bearish; surprise draw is bullish.",
        "SPR stock = Strategic Petroleum Reserve. Refilling = bullish, drawing = bearish.",
        "Gasoline / Distillate stocks = product side of the balance.",
        "Refinery utilization % = how hard refineries are running. >92% = strong demand for crude.",
      ],
    },
    {
      title: "CFTC Commitments of Traders (COT)",
      body: [
        "Managed Money net long = speculative positioning. Updated every Friday for the prior Tuesday.",
        "Extreme net long (>300k contracts) = crowded, risk of long unwind.",
        "Extreme net short (<50k) = bearish exhaustion, contrarian bullish setup.",
      ],
    },
  ],
};

interface DiffData {
  spreads: { brentWti: number | null; brentDubai: number | null; usgcAsiaArb: number | null };
  prices: { brent: number | null; wti: number | null; dubai: number | null };
  freight: { bdti: number; vlccTcePerDay: number; source: string } | null;
  eia: {
    crudeStockMbbl: number | null;
    gasolineStockMbbl: number | null;
    distillateStockMbbl: number | null;
    sprStockMbbl: number | null;
    refineryUtilPct: number | null;
    period: string | null;
  };
  cot: {
    wtiNetLong: number | null;
    brentNetLong: number | null;
    date: string | null;
  };
}

const fmt = (n: number | null) => (n != null ? n.toLocaleString("en-US") : "—");
const usd = (n: number | null) => (n != null ? `$${n.toFixed(2)}` : "—");

export default function DifferentialsPage() {
  const { data, loading } = useApi<DiffData>("/api/differentials", 120_000);

  return (
    <AppShell>
      <PageHelp {...DIFF_HELP} />
      <div className="animate-fade-in max-w-[1400px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
        <div className="mb-6">
          <h1 className="text-[30px] font-bold tracking-[-0.035em]">Differentials & Macro</h1>
          <p className="text-sm text-text3 mt-1">
            Cross-benchmark spreads · Freight arbitrage · EIA inventories · CFTC positioning
          </p>
        </div>

        {loading && <div className="text-text3 text-xs">Loading…</div>}

        {data && (
          <>
            {/* Spreads row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-3.5">
              <KpiBig label="Brent − WTI" value={usd(data.spreads.brentWti)} sub={`Brent ${usd(data.prices.brent)} · WTI ${usd(data.prices.wti)}`} />
              <KpiBig label="Brent − Dubai (EFS)" value={usd(data.spreads.brentDubai)} sub={`Dubai ${usd(data.prices.dubai)} (synthetic from Brent − EFS)`} />
              <KpiBig
                label="USGC → Asia Arb"
                value={usd(data.spreads.usgcAsiaArb)}
                sub={data.spreads.usgcAsiaArb != null && data.spreads.usgcAsiaArb > 0 ? "Arb open ↗" : "Closed"}
                highlight={data.spreads.usgcAsiaArb != null && data.spreads.usgcAsiaArb > 0}
              />
            </div>

            {/* EIA inventories */}
            <Card
              title="EIA Weekly Petroleum Status"
              badge={data.eia.period ? { text: data.eia.period, variant: "dark" } : undefined}
              className="mb-3.5"
            >
              {data.eia.crudeStockMbbl == null ? (
                <div className="text-text3 text-xs">
                  No EIA data yet. The /api/cron/eia endpoint must run with EIA_API_KEY set.
                  Get a free key at <a href="https://www.eia.gov/opendata/register.php" target="_blank" rel="noopener noreferrer" className="text-accent underline">eia.gov/opendata/register.php</a>.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                  <Mini label="Crude stocks" value={`${fmt(data.eia.crudeStockMbbl)} kb`} />
                  <Mini label="Gasoline stocks" value={`${fmt(data.eia.gasolineStockMbbl)} kb`} />
                  <Mini label="Distillate stocks" value={`${fmt(data.eia.distillateStockMbbl)} kb`} />
                  <Mini label="SPR stocks" value={`${fmt(data.eia.sprStockMbbl)} kb`} />
                  <Mini label="Refinery util %" value={data.eia.refineryUtilPct != null ? `${data.eia.refineryUtilPct.toFixed(1)}%` : "—"} />
                </div>
              )}
            </Card>

            {/* CFTC */}
            <Card
              title="CFTC Commitments of Traders — Managed Money"
              badge={data.cot.date ? { text: data.cot.date, variant: "dark" } : undefined}
              className="mb-3.5"
            >
              {data.cot.wtiNetLong == null ? (
                <div className="text-text3 text-xs">
                  No CFTC data yet. Trigger /api/cron/cftc once to populate.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5">
                  <Mini label="WTI Net Long" value={fmt(data.cot.wtiNetLong)} sub="contracts (1k bbl each)" />
                  <Mini label="Brent Net Long" value={fmt(data.cot.brentNetLong)} sub="contracts (1k bbl each)" />
                </div>
              )}
            </Card>

            {/* Freight context */}
            {data.freight && (
              <Card title="Freight context — VLCC market" className="mb-3.5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  <Mini label="BDTI" value={fmt(data.freight.bdti)} sub={data.freight.source} />
                  <Mini label="VLCC TCE est." value={`$${fmt(data.freight.vlccTcePerDay)}/d`} sub="heuristic" />
                  <Mini label="Implied freight" value={`$${(data.freight.vlccTcePerDay * 45 / 2_000_000).toFixed(2)}/bbl`} sub="USGC→Asia 45-day voyage" />
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function KpiBig({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className="bg-bg3 border border-border rounded-[var(--radius)] p-5">
      <div className="text-[10px] font-semibold text-text3 uppercase tracking-[0.07em] mb-2">{label}</div>
      <div className={`text-[28px] font-bold tracking-[-0.03em] leading-none ${highlight ? "text-accent" : ""}`}>{value}</div>
      <div className="text-[10px] text-text3 mt-2">{sub}</div>
    </div>
  );
}

function Mini({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em] mb-1">{label}</div>
      <div className="text-[18px] font-bold tracking-[-0.02em]">{value}</div>
      {sub && <div className="text-[9px] text-text3 mt-1">{sub}</div>}
    </div>
  );
}
