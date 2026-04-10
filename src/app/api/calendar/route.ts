import { NextRequest, NextResponse } from "next/server";
import { getUpcomingEvents, getMocStatus } from "@/lib/events-calendar";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const horizon = Number(req.nextUrl.searchParams.get("days") ?? "14");
  const events = getUpcomingEvents(horizon);
  const moc = getMocStatus();
  return NextResponse.json({
    success: true,
    data: {
      events: events.map((e) => ({ ...e, at: e.at.toISOString() })),
      moc: {
        phase: moc.phase,
        startsAt: moc.startsAt.toISOString(),
        endsAt: moc.endsAt.toISOString(),
        msUntilStart: moc.msUntilStart,
        msUntilEnd: moc.msUntilEnd,
      },
    },
  });
}
