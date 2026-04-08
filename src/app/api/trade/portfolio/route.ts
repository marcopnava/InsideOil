import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getCurrentPrice(): Promise<number | null> {
  try {
    const res = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=1d", {
      signal: AbortSignal.timeout(6_000), headers: { "User-Agent": "KLN-LogHub/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null;
  } catch { return null; }
}

export async function GET() {
  try {
    const price = await getCurrentPrice();

    // Update outcomes for open positions
    if (price) {
      const openTrades = await db.tradeProposal.findMany({ where: { status: "OPEN" } });
      for (const t of openTrades) {
        const pnlPct = Math.round(((price - t.entry) / t.entry) * (t.direction === "SHORT" ? -1 : 1) * 10000) / 100;
        let status = "OPEN";

        if (t.direction === "LONG" && price >= t.target) status = "TARGET_HIT";
        else if (t.direction === "SHORT" && price <= t.target) status = "TARGET_HIT";
        else if (t.direction === "LONG" && price <= t.stopLoss) status = "STOPPED";
        else if (t.direction === "SHORT" && price >= t.stopLoss) status = "STOPPED";
        else if (new Date(t.validUntil) < new Date()) status = "EXPIRED";

        await db.tradeProposal.update({
          where: { id: t.id },
          data: { currentPrice: price, pnlPct, status, ...(status !== "OPEN" ? { closedAt: new Date() } : {}) },
        });
      }
    }

    const entries = await db.tradeProposal.findMany({ orderBy: { timestamp: "desc" }, take: 50 });

    const wins = entries.filter((e) => e.status === "TARGET_HIT").length;
    const losses = entries.filter((e) => e.status === "STOPPED").length;
    const closed = wins + losses;

    return NextResponse.json({
      success: true,
      data: {
        entries,
        stats: {
          total: entries.length,
          open: entries.filter((e) => e.status === "OPEN").length,
          wins, losses,
          expired: entries.filter((e) => e.status === "EXPIRED").length,
          winRate: closed > 0 ? Math.round((wins / closed) * 100) : 0,
        },
      },
    });
  } catch {
    // DB not available — return empty
    return NextResponse.json({ success: true, data: { entries: [], stats: { total: 0, open: 0, wins: 0, losses: 0, expired: 0, winRate: 0 } } });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Only save if direction changed OR price moved >3% from last entry
    const lastEntry = await db.tradeProposal.findFirst({
      orderBy: { timestamp: "desc" },
    });

    if (lastEntry) {
      const sameDirection = lastEntry.action === body.action && lastEntry.direction === body.direction;
      const priceChange = Math.abs(lastEntry.entry - body.entry) / lastEntry.entry;
      const timeSince = Date.now() - new Date(lastEntry.timestamp).getTime();

      // Skip if same direction, price hasn't moved >3%, and less than 4 hours since last
      if (sameDirection && priceChange < 0.03 && timeSince < 4 * 3600_000) {
        return NextResponse.json({ success: true, data: { saved: false, reason: "No significant change in signal" } });
      }
    }

    // Mark previous OPEN as SUPERSEDED
    const price = body.entry;
    const openTrades = await db.tradeProposal.findMany({ where: { status: "OPEN" } });
    for (const t of openTrades) {
      const pnlPct = Math.round(((price - t.entry) / t.entry) * (t.direction === "SHORT" ? -1 : 1) * 10000) / 100;
      await db.tradeProposal.update({
        where: { id: t.id },
        data: { status: "SUPERSEDED", closedAt: new Date(), currentPrice: price, pnlPct },
      });
    }

    // Calculate validUntil
    let validDays = 7;
    if (body.timeframe?.includes("1-2 week")) validDays = 14;
    else if (body.timeframe?.includes("3-5 day")) validDays = 5;
    else if (body.timeframe?.includes("Wait")) validDays = 1;

    const entry = await db.tradeProposal.create({
      data: {
        action: body.action, direction: body.direction, conviction: body.conviction,
        instrument: body.instrument, entry: body.entry, target: body.target,
        stopLoss: body.stopLoss, riskReward: body.riskReward, timeframe: body.timeframe,
        positionSize: body.positionSize, rationale: body.rationale, score: body.score,
        context: body.context, currentPrice: body.entry, pnlPct: 0,
        status: body.action === "WAIT" ? "EXPIRED" : "OPEN",
        validUntil: new Date(Date.now() + validDays * 86400000),
        ...(body.action === "WAIT" ? { closedAt: new Date() } : {}),
      },
    });

    return NextResponse.json({ success: true, data: { saved: true, id: entry.id } });
  } catch {
    return NextResponse.json({ success: true, data: { saved: false, reason: "DB not available" } });
  }
}
