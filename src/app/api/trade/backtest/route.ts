import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Fetch 3 months of daily WTI + products for backtesting
async function fetchHistory(symbol: string): Promise<{ dates: string[]; prices: number[] } | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=3mo`,
      { signal: AbortSignal.timeout(10_000), headers: { "User-Agent": "KLN-LogHub/1.0" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];

    const dates: string[] = [];
    const prices: number[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] != null) {
        dates.push(new Date(timestamps[i] * 1000).toISOString().split("T")[0]);
        prices.push(Math.round(closes[i] * 100) / 100);
      }
    }
    return { dates, prices };
  } catch { return null; }
}

interface TradeResult {
  entryDate: string;
  exitDate: string;
  direction: "LONG" | "SHORT";
  entry: number;
  exit: number;
  pnlPct: number;
  signal: string;
  holdDays: number;
}

export async function GET() {
  try {
    const [wtiHist, gasHist, hoHist] = await Promise.all([
      fetchHistory("CL=F"),
      fetchHistory("RB=F"),
      fetchHistory("HO=F"),
    ]);

    if (!wtiHist || wtiHist.prices.length < 20) {
      return NextResponse.json({ success: false, error: "Insufficient price data" }, { status: 500 });
    }

    // Simulate the decision engine on each historical day
    const trades: TradeResult[] = [];
    const equity: { date: string; value: number }[] = [];
    let capital = 100000; // Start with $100k
    let position: { direction: "LONG" | "SHORT"; entry: number; entryDate: string; entryIdx: number; signal: string } | null = null;

    for (let i = 10; i < wtiHist.prices.length; i++) {
      const date = wtiHist.dates[i];
      const price = wtiHist.prices[i];
      const prevPrice = wtiHist.prices[i - 1];
      const price5ago = wtiHist.prices[Math.max(0, i - 5)];

      // Calculate signals from historical data
      const momentum5d = (price - price5ago) / price5ago;

      // Crack spread (if data available)
      let crack: number | null = null;
      if (gasHist && hoHist) {
        const gi = gasHist.dates.indexOf(date);
        const hi = hoHist.dates.indexOf(date);
        if (gi >= 0 && hi >= 0) {
          crack = (2 * gasHist.prices[gi] * 42 + hoHist.prices[hi] * 42 - 3 * price) / 3;
        }
      }

      // Simple signal: crack > 25 + upward momentum = LONG, crack < 12 + downward = SHORT
      let signal = "NEUTRAL";
      let score = 0;

      if (crack != null) {
        if (crack > 30) score += 2;
        else if (crack > 20) score += 1;
        else if (crack < 12) score -= 1;
      }

      if (momentum5d > 0.02) score += 1;
      else if (momentum5d < -0.02) score -= 1;

      // Price trend (above/below 10-day moving average)
      const ma10 = wtiHist.prices.slice(Math.max(0, i - 10), i).reduce((a, b) => a + b, 0) / Math.min(10, i);
      if (price > ma10) score += 1;
      else if (price < ma10 * 0.98) score -= 1;

      if (score >= 2) signal = "LONG";
      else if (score <= -1) signal = "SHORT";

      // Position management
      if (position) {
        const holdDays = i - position.entryIdx;
        const pnl = position.direction === "LONG"
          ? (price - position.entry) / position.entry
          : (position.entry - price) / position.entry;

        // Exit conditions: target (+4%), stop (-2%), or max hold (10 days)
        if (pnl >= 0.04 || pnl <= -0.02 || holdDays >= 10 ||
            (signal !== "NEUTRAL" && signal !== position.direction)) {
          trades.push({
            entryDate: position.entryDate,
            exitDate: date,
            direction: position.direction,
            entry: position.entry,
            exit: price,
            pnlPct: Math.round(pnl * 10000) / 100,
            signal: position.signal,
            holdDays,
          });
          capital *= (1 + pnl * 0.5); // Use 50% of capital per trade
          position = null;
        }
      }

      // Enter new position
      if (!position && signal !== "NEUTRAL") {
        position = {
          direction: signal as "LONG" | "SHORT",
          entry: price,
          entryDate: date,
          entryIdx: i,
          signal: `Score ${score}${crack ? `, Crack $${crack.toFixed(0)}` : ""}, Mom ${(momentum5d * 100).toFixed(1)}%`,
        };
      }

      equity.push({ date, value: Math.round(capital) });
    }

    // Close any remaining position at last price
    if (position) {
      const lastPrice = wtiHist.prices[wtiHist.prices.length - 1];
      const pnl = position.direction === "LONG"
        ? (lastPrice - position.entry) / position.entry
        : (position.entry - lastPrice) / position.entry;
      trades.push({
        entryDate: position.entryDate,
        exitDate: wtiHist.dates[wtiHist.dates.length - 1],
        direction: position.direction,
        entry: position.entry,
        exit: lastPrice,
        pnlPct: Math.round(pnl * 10000) / 100,
        signal: position.signal,
        holdDays: wtiHist.prices.length - 1 - position.entryIdx,
      });
      capital *= (1 + pnl * 0.5);
    }

    // Stats
    const wins = trades.filter((t) => t.pnlPct > 0);
    const losses = trades.filter((t) => t.pnlPct <= 0);
    const totalReturn = Math.round(((capital - 100000) / 100000) * 10000) / 100;
    const avgWin = wins.length > 0 ? Math.round(wins.reduce((s, t) => s + t.pnlPct, 0) / wins.length * 100) / 100 : 0;
    const avgLoss = losses.length > 0 ? Math.round(losses.reduce((s, t) => s + t.pnlPct, 0) / losses.length * 100) / 100 : 0;
    const maxDrawdown = (() => {
      let peak = 100000;
      let maxDD = 0;
      for (const e of equity) {
        if (e.value > peak) peak = e.value;
        const dd = (peak - e.value) / peak;
        if (dd > maxDD) maxDD = dd;
      }
      return Math.round(maxDD * 10000) / 100;
    })();

    // Buy & hold comparison
    const buyHoldReturn = Math.round(((wtiHist.prices[wtiHist.prices.length - 1] - wtiHist.prices[10]) / wtiHist.prices[10]) * 10000) / 100;

    return NextResponse.json({
      success: true,
      data: {
        trades,
        equity,
        stats: {
          totalTrades: trades.length,
          wins: wins.length,
          losses: losses.length,
          winRate: trades.length > 0 ? Math.round((wins.length / trades.length) * 100) : 0,
          totalReturn,
          avgWin,
          avgLoss,
          maxDrawdown,
          finalCapital: Math.round(capital),
          buyHoldReturn,
          alpha: Math.round((totalReturn - buyHoldReturn) * 100) / 100,
          avgHoldDays: trades.length > 0 ? Math.round(trades.reduce((s, t) => s + t.holdDays, 0) / trades.length * 10) / 10 : 0,
        },
        period: { start: wtiHist.dates[10], end: wtiHist.dates[wtiHist.dates.length - 1], days: wtiHist.dates.length - 10 },
        source: "Backtested on Yahoo Finance 3-month daily WTI/Gasoline/HeatingOil data",
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
