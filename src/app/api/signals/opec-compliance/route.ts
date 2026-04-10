import { NextResponse } from "next/server";
import { computeOpecCompliance } from "@/lib/opec-compliance";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = await computeOpecCompliance();
    return NextResponse.json({ success: true, data: report });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
