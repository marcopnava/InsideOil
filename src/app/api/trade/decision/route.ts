import { NextResponse } from "next/server";
import { getCachedDigitrafficVessels } from "@/lib/digitraffic";

export const dynamic = "force-dynamic";

async function getPrice(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, {
      signal: AbortSignal.timeout(6_000), headers: { "User-Agent": "KLN-LogHub/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null;
  } catch { return null; }
}

interface Signal {
  name: string;
  value: string;
  score: number; // -2 to +2
  weight: number; // importance 1-3
  reasoning: string;
}

let cache: { data: unknown; ts: number } | null = null;
const TTL = 120_000; // 2min

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < TTL) {
      return NextResponse.json({ success: true, data: cache.data });
    }

    // Fetch all data in parallel
    const [wti, brent, gasoline, heatingOil] = await Promise.all([
      getPrice("CL=F"), getPrice("BZ=F"), getPrice("RB=F"), getPrice("HO=F"),
    ]);

    const all = getCachedDigitrafficVessels();
    const tankers = all.filter((v) => v.shipType >= 80 && v.shipType <= 89);
    const moving = tankers.filter((v) => v.speed > 0.5);
    const anchored = tankers.filter((v) => v.speed <= 0.5);
    const slowSteaming = moving.filter((v) => v.speed > 0.5 && v.speed < 8);
    const forOrders = tankers.filter((v) => (v.destination ?? "").toUpperCase().includes("ORDER"));

    // Calculate crack spread
    const gasBbl = gasoline ? gasoline * 42 : null;
    const hoBbl = heatingOil ? heatingOil * 42 : null;
    const crack321 = gasBbl && hoBbl && wti ? (2 * gasBbl + hoBbl - 3 * wti) / 3 : null;
    const brentWti = brent && wti ? brent - wti : null;

    // Fleet ratios
    const storageRatio = tankers.length > 0 ? anchored.length / tankers.length : 0;
    const utilizationRatio = tankers.length > 0 ? moving.length / tankers.length : 0;
    const slowRatio = moving.length > 0 ? slowSteaming.length / moving.length : 0;
    const forOrdersPct = tankers.length > 0 ? forOrders.length / tankers.length : 0;

    // Build signals
    const signals: Signal[] = [];

    // 1. Floating Storage
    signals.push({
      name: "Floating Storage",
      value: `${Math.round(storageRatio * 100)}% anchored (${anchored.length} tankers)`,
      score: storageRatio < 0.15 ? 2 : storageRatio < 0.25 ? 1 : storageRatio < 0.4 ? 0 : storageRatio < 0.5 ? -1 : -2,
      weight: 3,
      reasoning: storageRatio < 0.2
        ? "Very low floating storage — tight physical market. Crude supply is being consumed, not stored. Bullish."
        : storageRatio > 0.4
          ? "High floating storage — oversupply. Traders storing crude at sea waiting for higher prices. Contango likely. Bearish."
          : "Moderate storage levels — market in balance.",
    });

    // 2. Fleet Utilization
    signals.push({
      name: "Fleet Utilization",
      value: `${Math.round(utilizationRatio * 100)}% moving (${moving.length}/${tankers.length})`,
      score: utilizationRatio > 0.8 ? 2 : utilizationRatio > 0.65 ? 1 : utilizationRatio > 0.5 ? 0 : -1,
      weight: 2,
      reasoning: utilizationRatio > 0.75
        ? "High utilization — strong demand for tanker tonnage. Lots of crude moving. Bullish for crude demand and freight rates."
        : "Lower utilization — excess tanker capacity. Less crude being transported. Watch for demand weakness.",
    });

    // 3. Slow Steaming
    signals.push({
      name: "Slow Steaming",
      value: `${Math.round(slowRatio * 100)}% of fleet below 8kn`,
      score: slowRatio < 0.15 ? 1 : slowRatio < 0.3 ? 0 : slowRatio < 0.5 ? -1 : -2,
      weight: 2,
      reasoning: slowRatio > 0.3
        ? "Significant slow steaming — carriers absorbing excess capacity by sailing slower. Oversupply signal. Bearish."
        : "Normal sailing speeds — no significant capacity management. Neutral to bullish.",
    });

    // 4. Crack Spread
    if (crack321 != null) {
      signals.push({
        name: "Refinery Margins (3-2-1)",
        value: `$${crack321.toFixed(2)}/barrel`,
        score: crack321 > 30 ? 2 : crack321 > 20 ? 1 : crack321 > 12 ? 0 : -1,
        weight: 3,
        reasoning: crack321 > 25
          ? `Crack spread at $${crack321.toFixed(0)} — very strong refinery margins. Refineries are buying crude aggressively to capture these margins. Strongly bullish for crude demand.`
          : crack321 > 15
            ? "Moderate refinery margins. Steady crude processing. Neutral."
            : "Weak refinery margins. Refineries may cut runs, reducing crude demand. Bearish.",
      });
    }

    // 5. Brent-WTI Spread
    if (brentWti != null) {
      signals.push({
        name: "Brent-WTI Spread",
        value: `$${brentWti.toFixed(2)}`,
        score: brentWti > 3 ? 1 : brentWti > 0 ? 0 : -1,
        weight: 1,
        reasoning: brentWti > 3
          ? "Wide Brent premium — international crude in higher demand than US crude. Suggests strong non-US demand."
          : brentWti < 0
            ? "Inverted spread (WTI > Brent) — unusual. US crude relatively expensive. Possible US supply disruption or export demand."
            : "Normal spread range. No unusual signal.",
      });
    }

    // 6. Unassigned Cargoes
    signals.push({
      name: "Unassigned Cargoes",
      value: `${forOrders.length} tankers (${Math.round(forOrdersPct * 100)}% of fleet)`,
      score: forOrdersPct > 0.1 ? -1 : forOrdersPct > 0.05 ? 0 : 1,
      weight: 1,
      reasoning: forOrdersPct > 0.08
        ? "Many tankers heading 'For Orders' — traders uncertain about destination. Market indecision, possible volatility ahead."
        : "Few unassigned cargoes — clear trade flows. Market has direction.",
    });

    // Calculate composite score
    const totalWeight = signals.reduce((s, sig) => s + sig.weight, 0);
    const weightedScore = signals.reduce((s, sig) => s + sig.score * sig.weight, 0);
    const normalizedScore = Math.round((weightedScore / totalWeight) * 100) / 100; // -2 to +2

    // Decision
    let decision: string;
    let action: string;
    let confidence: string;
    let instruments: string[];

    if (normalizedScore >= 1.2) {
      decision = "STRONG BUY";
      action = "Multiple bullish signals confirm strong crude demand. Consider going long crude oil.";
      confidence = "High";
      instruments = ["Long CL=F (WTI futures)", "Long BZ=F (Brent futures)", "Buy USO or BNO (oil ETFs)", "Buy XLE (energy sector ETF)"];
    } else if (normalizedScore >= 0.5) {
      decision = "BUY";
      action = "Majority of signals lean bullish. Favorable environment for long crude positions with tight stops.";
      confidence = "Moderate";
      instruments = ["Long CL=F or BZ=F with stop-loss", "Buy USO/BNO in moderate size", "Consider XLE for broader energy exposure"];
    } else if (normalizedScore >= -0.3) {
      decision = "HOLD / NEUTRAL";
      action = "Mixed signals. No clear directional bias. Wait for clearer setup or trade spreads instead of outright direction.";
      confidence = "Low";
      instruments = ["Trade Brent-WTI spread", "Calendar spreads on crude futures", "Reduce position size"];
    } else if (normalizedScore >= -1.0) {
      decision = "SELL / REDUCE";
      action = "Bearish signals emerging. Consider reducing long exposure or initiating short positions.";
      confidence = "Moderate";
      instruments = ["Short CL=F or BZ=F with stop-loss", "Buy SCO (inverse oil ETF)", "Sell XLE", "Buy tanker stocks (STNG) if freight rates rising"];
    } else {
      decision = "STRONG SELL";
      action = "Multiple bearish signals. Oversupply, weak refinery margins, high floating storage. Go short or exit longs.";
      confidence = "High";
      instruments = ["Short CL=F/BZ=F", "Buy SCO aggressively", "Exit all long crude positions"];
    }

    const result = {
      decision,
      action,
      confidence,
      instruments,
      score: {
        raw: weightedScore,
        normalized: normalizedScore,
        max: totalWeight * 2,
        min: totalWeight * -2,
      },
      signals,
      prices: {
        wti, brent, crack321: crack321 ? Math.round(crack321 * 100) / 100 : null,
        brentWti: brentWti ? Math.round(brentWti * 100) / 100 : null,
      },
      fleet: {
        totalTankers: tankers.length,
        moving: moving.length,
        anchored: anchored.length,
        storageRatio: Math.round(storageRatio * 100),
        utilizationRatio: Math.round(utilizationRatio * 100),
      },
      timestamp: new Date().toISOString(),
      disclaimer: "This is algorithmic analysis based on AIS vessel data and commodity prices. Not financial advice. All trading involves risk.",
    };

    cache = { data: result, ts: Date.now() };
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    if (cache) return NextResponse.json({ success: true, data: cache.data });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
