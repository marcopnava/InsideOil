import { NextResponse } from "next/server";
import { computeChokepointFlow } from "@/lib/chokepoints";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await computeChokepointFlow();
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
