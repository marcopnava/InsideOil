import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  try {
    const body = await req.json();
    const { currentPassword, newPassword } = schema.parse(body);

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash) {
      return NextResponse.json(
        { success: false, error: "Password not set for this account (social login?)" },
        { status: 400 }
      );
    }
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 400 }
      );
    }
    const newHash = await bcrypt.hash(newPassword, 12);
    await db.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "invalid",
      },
      { status: 400 }
    );
  }
}
