import { NextResponse } from "next/server";
import { getCachedDigitrafficVessels } from "@/lib/digitraffic";

export const dynamic = "force-dynamic";

async function getPrice(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`, {
      signal: AbortSignal.timeout(6_000), headers: { "User-Agent": "KLN-LogHub/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    const closes = result.indicators?.quote?.[0]?.close?.filter((v: number | null) => v != null) ?? [];
    return result.meta?.regularMarketPrice ?? (closes.length > 0 ? closes[closes.length - 1] : null);
  } catch { return null; }
}

async function getPrevClose(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`, {
      signal: AbortSignal.timeout(6_000), headers: { "User-Agent": "KLN-LogHub/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.chart?.result?.[0]?.meta?.previousClose ?? null;
  } catch { return null; }
}

let cache: { data: unknown; ts: number } | null = null;
const TTL = 120_000; // 2min

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < TTL) {
      return NextResponse.json({ success: true, data: cache.data });
    }

    // Fetch all data
    const [wti, brent, gasoline, heatingOil, wtiPrev] = await Promise.all([
      getPrice("CL=F"), getPrice("BZ=F"), getPrice("RB=F"), getPrice("HO=F"), getPrevClose("CL=F"),
    ]);

    const all = getCachedDigitrafficVessels();
    const tankers = all.filter((v) => v.shipType >= 80 && v.shipType <= 89);
    const moving = tankers.filter((v) => v.speed > 0.5);
    const anchored = tankers.filter((v) => v.speed <= 0.5);

    // Calculate all metrics
    const gasBbl = gasoline ? gasoline * 42 : null;
    const hoBbl = heatingOil ? heatingOil * 42 : null;
    const crack = gasBbl && hoBbl && wti ? (2 * gasBbl + hoBbl - 3 * wti) / 3 : null;
    const storageRatio = tankers.length > 0 ? anchored.length / tankers.length : 0;
    const utilizationRatio = tankers.length > 0 ? moving.length / tankers.length : 0;
    const slowSteaming = moving.filter((v) => v.speed > 0.5 && v.speed < 8).length;
    const slowRatio = moving.length > 0 ? slowSteaming / moving.length : 0;
    const brentWti = brent && wti ? brent - wti : null;

    // Composite score (-2 to +2)
    let score = 0;
    let factors = 0;

    if (storageRatio < 0.15) { score += 2; factors++; } else if (storageRatio < 0.25) { score += 1; factors++; } else if (storageRatio > 0.4) { score -= 2; factors++; } else { factors++; }
    if (utilizationRatio > 0.8) { score += 2; factors++; } else if (utilizationRatio > 0.65) { score += 1; factors++; } else if (utilizationRatio < 0.5) { score -= 1; factors++; } else { factors++; }
    if (slowRatio < 0.15) { score += 1; factors++; } else if (slowRatio > 0.3) { score -= 1; factors++; } else { factors++; }
    if (crack != null) { if (crack > 30) { score += 2; factors++; } else if (crack > 20) { score += 1; factors++; } else if (crack < 12) { score -= 1; factors++; } else { factors++; } }

    const normalized = factors > 0 ? score / factors : 0;

    // Determine direction
    const direction = normalized >= 0.8 ? "LONG" : normalized >= 0.3 ? "LONG" : normalized >= -0.3 ? "FLAT" : "SHORT";
    const conviction = Math.abs(normalized) >= 1.2 ? "HIGH" : Math.abs(normalized) >= 0.5 ? "MODERATE" : "LOW";

    // Calculate specific trade
    if (!wti || !brent) {
      const result = { proposal: null, reason: "Waiting for price data..." };
      cache = { data: result, ts: Date.now() };
      return NextResponse.json({ success: true, data: result });
    }

    const momentum = wtiPrev ? ((wti - wtiPrev) / wtiPrev) * 100 : 0;

    // Build proposal
    let instrument: string;
    let action: string;
    let entry: number;
    let target: number;
    let stopLoss: number;
    let rationale: string;
    let riskReward: string;
    let positionSize: string;
    let timeframe: string;

    if (direction === "LONG") {
      instrument = "CL=F (WTI Crude Oil Futures)";
      action = "BUY";
      entry = Math.round(wti * 100) / 100;
      // Target: +3-5% based on conviction
      const targetPct = conviction === "HIGH" ? 0.05 : conviction === "MODERATE" ? 0.035 : 0.02;
      target = Math.round(wti * (1 + targetPct) * 100) / 100;
      // Stop: -2% for high conviction, -1.5% for moderate
      const stopPct = conviction === "HIGH" ? 0.02 : 0.015;
      stopLoss = Math.round(wti * (1 - stopPct) * 100) / 100;
      riskReward = `1:${(targetPct / stopPct).toFixed(1)}`;

      rationale = `Bullish signal composite (${normalized.toFixed(2)}). `;
      if (crack && crack > 25) rationale += `Strong crack spread ($${crack.toFixed(0)}) = refineries buying aggressively. `;
      if (storageRatio < 0.2) rationale += `Low floating storage (${Math.round(storageRatio * 100)}%) = tight physical market. `;
      if (utilizationRatio > 0.7) rationale += `High fleet utilization (${Math.round(utilizationRatio * 100)}%) = strong demand. `;
      if (momentum > 1) rationale += `Positive price momentum (+${momentum.toFixed(1)}%). `;

      positionSize = conviction === "HIGH" ? "Full position (2-3% of portfolio)" : conviction === "MODERATE" ? "Half position (1-1.5% of portfolio)" : "Quarter position (0.5% of portfolio)";
      timeframe = conviction === "HIGH" ? "1-2 weeks" : "3-5 days";

    } else if (direction === "SHORT") {
      instrument = "CL=F (WTI Crude Oil Futures)";
      action = "SELL";
      entry = Math.round(wti * 100) / 100;
      const targetPct = conviction === "HIGH" ? 0.05 : 0.03;
      target = Math.round(wti * (1 - targetPct) * 100) / 100;
      const stopPct = conviction === "HIGH" ? 0.02 : 0.015;
      stopLoss = Math.round(wti * (1 + stopPct) * 100) / 100;
      riskReward = `1:${(targetPct / stopPct).toFixed(1)}`;

      rationale = `Bearish signal composite (${normalized.toFixed(2)}). `;
      if (storageRatio > 0.35) rationale += `High floating storage (${Math.round(storageRatio * 100)}%) = oversupply. `;
      if (slowRatio > 0.3) rationale += `Widespread slow steaming (${Math.round(slowRatio * 100)}%) = excess capacity. `;
      if (crack && crack < 15) rationale += `Weak crack spread ($${crack.toFixed(0)}) = refineries cutting runs. `;

      positionSize = conviction === "HIGH" ? "Full position (2-3% of portfolio)" : "Half position (1-1.5% of portfolio)";
      timeframe = conviction === "HIGH" ? "1-2 weeks" : "3-5 days";

    } else {
      instrument = "None — FLAT";
      action = "WAIT";
      entry = wti;
      target = wti;
      stopLoss = wti;
      riskReward = "N/A";
      rationale = `Mixed signals (score: ${normalized.toFixed(2)}). No clear directional bias. Wait for clearer setup. Consider trading spreads (Brent-WTI at $${brentWti?.toFixed(2)}) instead of outright direction.`;
      positionSize = "No new positions";
      timeframe = "Wait for signal change";
    }

    // Alternative trades
    const alternatives = [];
    if (crack && crack > 25 && direction !== "FLAT") {
      alternatives.push({
        instrument: "XLE (Energy Select Sector ETF)",
        action: direction === "LONG" ? "BUY" : "SELL",
        rationale: `Crack spread at $${crack.toFixed(0)} benefits energy companies. Lower risk than crude futures.`,
      });
    }
    if (brentWti != null && Math.abs(brentWti) > 2) {
      alternatives.push({
        instrument: "Brent-WTI Spread",
        action: brentWti > 3 ? "Sell spread (expect narrowing)" : "Buy spread (expect widening)",
        rationale: `Spread at $${brentWti.toFixed(2)} — ${Math.abs(brentWti) > 4 ? "extreme" : "wide"} level. Mean-reversion trade.`,
      });
    }
    if (anchored.length > 200) {
      alternatives.push({
        instrument: "STNG or TNK (Tanker stocks)",
        action: "BUY",
        rationale: `${anchored.length} tankers anchored = high floating storage demand. Bullish for tanker day-rates.`,
      });
    }

    const result = {
      proposal: {
        direction,
        conviction,
        instrument,
        action,
        entry,
        target,
        stopLoss,
        riskReward,
        rationale,
        positionSize,
        timeframe,
        alternatives,
      },
      context: {
        wti, brent, crack: crack ? Math.round(crack * 100) / 100 : null,
        brentWti: brentWti ? Math.round(brentWti * 100) / 100 : null,
        storageRatio: Math.round(storageRatio * 100),
        utilizationRatio: Math.round(utilizationRatio * 100),
        tankers: tankers.length,
        momentum: Math.round(momentum * 100) / 100,
        score: Math.round(normalized * 100) / 100,
      },
      updatedAt: new Date().toISOString(),
      disclaimer: "Algorithmic proposal based on AIS data + commodity prices. Not financial advice. Past performance does not guarantee future results.",
    };

    cache = { data: result, ts: Date.now() };
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    if (cache) return NextResponse.json({ success: true, data: cache.data });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
