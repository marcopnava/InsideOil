import { NextResponse } from "next/server";
import { getLatestSignals, computeAndStoreSignals } from "@/lib/signals";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let snap = await getLatestSignals();
    // If older than 15min or missing, recompute on-demand (UI safety net).
    const stale = !snap || Date.now() - snap.generatedAt.getTime() > 15 * 60_000;
    if (stale) {
      await computeAndStoreSignals();
      snap = await getLatestSignals();
    }
    if (!snap) {
      return NextResponse.json({ success: false, error: "no_signals" }, { status: 503 });
    }
    return NextResponse.json({
      success: true,
      data: { generatedAt: snap.generatedAt.toISOString(), ...(snap.payload as object) },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
