import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLatestCurve } from "@/lib/forward-curve";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  instrument: z.string().min(1).max(20),
  direction: z.enum(["LONG", "SHORT"]),
  entryPrice: z.number(),
  size: z.number().positive(),
  sizeUnit: z.enum(["bbl", "contracts"]).default("bbl"),
  stopLoss: z.number().optional().nullable(),
  target: z.number().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  signalsUsed: z.array(z.string()).optional().nullable(),
});

const closeSchema = z.object({
  exitPrice: z.number(),
  exitReason: z.enum(["TARGET", "STOP", "MANUAL", "EXPIRED"]).default("MANUAL"),
});

async function getSpotPrice(instrument: string): Promise<number | null> {
  const key = instrument.toUpperCase().trim();
  const map: Record<string, string> = {
    BRENT: "BRENT", BZ: "BRENT", "BZ=F": "BRENT",
    WTI: "WTI", CL: "WTI", "CL=F": "WTI",
    DUBAI: "DUBAI",
  };
  const curveKey = map[key] ?? key;
  const rows = await getLatestCurve(curveKey);
  return rows[0]?.price ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const entries = await db.tradeJournalEntry.findMany({
    where: { userId },
    orderBy: { openedAt: "desc" },
    take: 200,
  });

  // Attach live P/L for open positions
  const hydrated = await Promise.all(
    entries.map(async (e) => {
      let livePrice: number | null = null;
      let livePnlBbl: number | null = null;
      let livePnlTotal: number | null = null;
      if (e.status === "OPEN") {
        livePrice = await getSpotPrice(e.instrument);
        if (livePrice != null) {
          const delta = e.direction === "LONG" ? livePrice - e.entryPrice : e.entryPrice - livePrice;
          livePnlBbl = Math.round(delta * 100) / 100;
          livePnlTotal = Math.round(delta * e.size * 100) / 100;
        }
      }
      return {
        ...e,
        openedAt: e.openedAt.toISOString(),
        closedAt: e.closedAt?.toISOString() ?? null,
        livePrice,
        livePnlBbl,
        livePnlTotal,
      };
    })
  );

  // Summary
  const open = hydrated.filter((e) => e.status === "OPEN");
  const closed = hydrated.filter((e) => e.status === "CLOSED");
  const totalRealized = closed.reduce((s, e) => s + (e.pnlTotal ?? 0), 0);
  const unrealized = open.reduce((s, e) => s + (e.livePnlTotal ?? 0), 0);
  const wins = closed.filter((e) => (e.pnlTotal ?? 0) > 0).length;
  const winRate = closed.length > 0 ? Math.round((wins / closed.length) * 100) : null;

  return NextResponse.json({
    success: true,
    data: {
      entries: hydrated,
      summary: {
        openPositions: open.length,
        closedTrades: closed.length,
        realizedPnl: Math.round(totalRealized * 100) / 100,
        unrealizedPnl: Math.round(unrealized * 100) / 100,
        winRate,
      },
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);
    const created = await db.tradeJournalEntry.create({
      data: {
        userId,
        instrument: parsed.instrument.toUpperCase(),
        direction: parsed.direction,
        entryPrice: parsed.entryPrice,
        size: parsed.size,
        sizeUnit: parsed.sizeUnit,
        stopLoss: parsed.stopLoss ?? null,
        target: parsed.target ?? null,
        notes: parsed.notes ?? null,
        signalsUsed: (parsed.signalsUsed ?? []) as object,
      },
    });
    return NextResponse.json({ success: true, data: { id: created.id } });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "invalid" },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "missing id" }, { status: 400 });
  try {
    const body = await req.json();
    const parsed = closeSchema.parse(body);
    const entry = await db.tradeJournalEntry.findFirst({ where: { id, userId } });
    if (!entry) return NextResponse.json({ success: false, error: "not found" }, { status: 404 });

    const delta =
      entry.direction === "LONG" ? parsed.exitPrice - entry.entryPrice : entry.entryPrice - parsed.exitPrice;
    const pnlBbl = Math.round(delta * 100) / 100;
    const pnlTotal = Math.round(delta * entry.size * 100) / 100;

    await db.tradeJournalEntry.update({
      where: { id },
      data: {
        status: "CLOSED",
        exitPrice: parsed.exitPrice,
        exitReason: parsed.exitReason,
        pnlBbl,
        pnlTotal,
        closedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "invalid" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "missing id" }, { status: 400 });
  await db.tradeJournalEntry.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
