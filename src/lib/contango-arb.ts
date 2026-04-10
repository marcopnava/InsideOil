/**
 * Floating-storage contango arbitrage calculator.
 *
 * Trade: lock in the contango by storing crude on a chartered VLCC and selling
 * forward via futures. Profitable when:
 *
 *   forward_price(n) − spot > freight_cost(n) + financing(n) + insurance(n)
 *
 * Where:
 *   freight_cost(n) ≈ (TCE_$/day × 30 × n) / cargo_bbl
 *     - TCE for VLCC TD3C derived from BDTI via bdti.ts heuristic
 *     - cargo_bbl ≈ 2,000,000 for VLCC
 *   financing(n) ≈ spot × LIBOR_proxy × (n/12)
 *     - LIBOR proxy: SOFR ~5% (env override FINANCING_RATE)
 *   insurance(n) ≈ spot × 0.0015 × (n/12)
 *
 * Output: profit per barrel for each forward tenor in the curve, plus a single
 * "best tenor" recommendation.
 */

import { getLatestCurve, type CurvePoint } from "@/lib/forward-curve";
import { getLatestBDTI, bdtiToVlccTCE } from "@/lib/bdti";

const VLCC_CARGO_BBL = 2_000_000;
const INSURANCE_RATE_PER_YEAR = 0.0015; // 15 bps p.a. on cargo value
const DEFAULT_FINANCING_RATE_PER_YEAR = 0.05;

export interface ArbTenorResult {
  tenor: number; // months ahead
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

export interface ArbReport {
  generatedAt: string;
  instrument: string;
  spotPrice: number | null;
  vlccTCEPerDay: number | null;
  bdti: number | null;
  financingRate: number;
  tenors: ArbTenorResult[];
  best: ArbTenorResult | null;
  recommendation: string;
  sentiment: "bullish_storage" | "neutral" | "no_arb";
}

export async function computeContangoArb(instrument = "BRENT"): Promise<ArbReport> {
  const curve: CurvePoint[] = await getLatestCurve(instrument);
  if (curve.length === 0) {
    return emptyReport(instrument, "No curve data — run /api/cron/prices");
  }
  const spotPrice = curve[0].price;

  const bdtiRow = await getLatestBDTI();
  const bdti = bdtiRow?.value ?? null;
  const tcePerDay = bdti != null ? bdtiToVlccTCE(bdti) : null;

  if (tcePerDay == null) {
    return emptyReport(instrument, "No BDTI freight data — run /api/cron/bdti");
  }

  const financingRate = Number(process.env.FINANCING_RATE ?? DEFAULT_FINANCING_RATE_PER_YEAR);

  const tenors: ArbTenorResult[] = curve.slice(1).map((c, i) => {
    const tenorMonths = i + 1;
    const freightPerBbl = (tcePerDay * 30 * tenorMonths) / VLCC_CARGO_BBL;
    const financingPerBbl = spotPrice * financingRate * (tenorMonths / 12);
    const insurancePerBbl = spotPrice * INSURANCE_RATE_PER_YEAR * (tenorMonths / 12);
    const contangoPerBbl = c.price - spotPrice;
    const profitPerBbl = contangoPerBbl - freightPerBbl - financingPerBbl - insurancePerBbl;
    return {
      tenor: tenorMonths,
      contractMonth: c.contractMonth,
      forwardPrice: round2(c.price),
      spotPrice: round2(spotPrice),
      contangoPerBbl: round2(contangoPerBbl),
      freightPerBbl: round2(freightPerBbl),
      financingPerBbl: round2(financingPerBbl),
      insurancePerBbl: round2(insurancePerBbl),
      profitPerBbl: round2(profitPerBbl),
      profitable: profitPerBbl > 0.25, // require >25c/bbl edge
    };
  });

  const best = tenors.reduce<ArbTenorResult | null>(
    (acc, t) => (acc == null || t.profitPerBbl > acc.profitPerBbl ? t : acc),
    null
  );

  let sentiment: ArbReport["sentiment"] = "no_arb";
  let recommendation = "Curve does not justify floating-storage trade.";
  if (best && best.profitable) {
    sentiment = "bullish_storage";
    const gain = Math.round(best.profitPerBbl * VLCC_CARGO_BBL);
    recommendation = `${best.tenor}M tenor profitable: $${best.profitPerBbl}/bbl edge (≈$${gain.toLocaleString()} per VLCC). Lock physical, sell ${best.contractMonth}.`;
  } else if (best && best.profitPerBbl > -0.5) {
    sentiment = "neutral";
    recommendation = "Marginal contango — watch for deepening.";
  }

  return {
    generatedAt: new Date().toISOString(),
    instrument,
    spotPrice: round2(spotPrice),
    vlccTCEPerDay: tcePerDay,
    bdti,
    financingRate,
    tenors,
    best,
    recommendation,
    sentiment,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function emptyReport(instrument: string, reason: string): ArbReport {
  return {
    generatedAt: new Date().toISOString(),
    instrument,
    spotPrice: null,
    vlccTCEPerDay: null,
    bdti: null,
    financingRate: DEFAULT_FINANCING_RATE_PER_YEAR,
    tenors: [],
    best: null,
    recommendation: reason,
    sentiment: "no_arb",
  };
}
