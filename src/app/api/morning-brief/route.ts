import { NextResponse } from "next/server";
import { generateMorningBrief } from "@/lib/morning-brief";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const brief = await generateMorningBrief();
    return NextResponse.json({ success: true, data: brief });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
