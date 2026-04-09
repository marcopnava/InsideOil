import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { registrationToken: token } });

  if (!user) {
    return NextResponse.json({ success: false, error: "Invalid registration link" }, { status: 404 });
  }

  if (user.passwordHash) {
    return NextResponse.json({ success: false, error: "Account already registered. Please sign in." }, { status: 400 });
  }

  if (user.tokenExpiresAt && user.tokenExpiresAt < new Date()) {
    return NextResponse.json({ success: false, error: "Registration link has expired. Contact info@insideoil.it for a new one." }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: { email: user.email } });
}
