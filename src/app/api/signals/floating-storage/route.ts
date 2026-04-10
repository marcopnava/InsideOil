import { NextResponse } from "next/server";
import { detectFloatingStorage } from "@/lib/floating-storage";
import { computeContangoArb } from "@/lib/contango-arb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [storage, arb] = await Promise.all([
      detectFloatingStorage(),
      computeContangoArb("BRENT"),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        storage,
        arbitrage: arb,
        composite: {
          conditionsMet:
            arb.sentiment === "bullish_storage" && storage.totals.candidatesAll > 0,
          interpretation:
            arb.sentiment === "bullish_storage" && storage.totals.candidatesAll === 0
              ? "Curve says contango profitable, but no fleet has begun storing yet → early signal."
              : arb.sentiment === "bullish_storage" && storage.totals.candidatesAll > 5
                ? "Floating storage trade ALREADY active across fleet — confirmed bearish for spot."
                : storage.totals.candidatesAll > 10
                  ? "Storage building without curve signal — possible distress / sanctions trade."
                  : "No floating-storage anomaly.",
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
