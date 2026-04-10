import { NextResponse } from "next/server";
import { getLatestCurve } from "@/lib/forward-curve";
import { getLatestBDTI, bdtiToVlccTCE } from "@/lib/bdti";
import { getLatestEia } from "@/lib/eia";
import { getLatestCot } from "@/lib/cftc";

export const dynamic = "force-dynamic";

/**
 * Crude differentials: live spreads between major benchmarks plus the
 * implied physical arbitrage after freight cost.
 *
 *   Brent − WTI       — Atlantic basin spread
 *   Brent − Dubai     — EFS, Atlantic vs Mid-East
 *   WTI Midland       — light sweet US shale (proxied via WTI)
 *   USGC → Asia ARB   — WTI + freight vs Brent (or Dubai)
 *
 * Plus the EIA inventory and CFTC positioning context that retail traders
 * actually move on.
 */

const VLCC_BBL = 2_000_000;
const FINANCING_RATE = Number(process.env.FINANCING_RATE ?? 0.05);

export async function GET() {
  try {
    const [brentCurve, wtiCurve, dubaiCurve, bdti, eiaCrude, eiaSpr, eiaGasoline, eiaDist, eiaUtil, cotWti, cotBrent] =
      await Promise.all([
        getLatestCurve("BRENT"),
        getLatestCurve("WTI"),
        getLatestCurve("DUBAI"),
        getLatestBDTI(),
        getLatestEia("EIA_CRUDE_STOCK"),
        getLatestEia("EIA_SPR_STOCK"),
        getLatestEia("EIA_GASOLINE_STOCK"),
        getLatestEia("EIA_DISTILLATE_STOCK"),
        getLatestEia("EIA_REFINERY_UTIL"),
        getLatestCot("COT_WTI_NETLONG"),
        getLatestCot("COT_BRENT_NETLONG"),
      ]);

    const brent = brentCurve[0]?.price ?? null;
    const wti = wtiCurve[0]?.price ?? null;
    const dubai = dubaiCurve[0]?.price ?? null;

    const brentWti = brent != null && wti != null ? round(brent - wti) : null;
    const brentDubai = brent != null && dubai != null ? round(brent - dubai) : null;

    // USGC → Asia arbitrage proxy: WTI + freight vs Dubai
    // Freight: rough VLCC USGC→Singapore TCE × 30 days / cargo bbl
    let usgcAsiaArb: number | null = null;
    if (wti != null && dubai != null && bdti?.value != null) {
      const tce = bdtiToVlccTCE(bdti.value);
      const freightUsgcToAsia = (tce * 45) / VLCC_BBL; // ~45 day voyage
      const financing = wti * FINANCING_RATE * (45 / 365);
      const landed = wti + freightUsgcToAsia + financing;
      usgcAsiaArb = round(dubai - landed);
    }

    return NextResponse.json({
      success: true,
      data: {
        spreads: { brentWti, brentDubai, usgcAsiaArb },
        prices: { brent, wti, dubai },
        freight: bdti && {
          bdti: bdti.value,
          vlccTcePerDay: bdtiToVlccTCE(bdti.value),
          source: bdti.source,
        },
        eia: {
          crudeStockMbbl: eiaCrude?.value ?? null,
          gasolineStockMbbl: eiaGasoline?.value ?? null,
          distillateStockMbbl: eiaDist?.value ?? null,
          sprStockMbbl: eiaSpr?.value ?? null,
          refineryUtilPct: eiaUtil?.value ?? null,
          period: eiaCrude?.period ?? null,
        },
        cot: {
          wtiNetLong: cotWti?.value ?? null,
          brentNetLong: cotBrent?.value ?? null,
          date: cotWti?.date ?? null,
        },
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
