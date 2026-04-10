import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).max(60).optional(),
  image: z.string().url().optional().nullable(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      subscriptionTier: true,
      subscriptionEnd: true,
      createdAt: true,
    },
  });
  if (!user) {
    return NextResponse.json({ success: false, error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: user });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  try {
    const body = await req.json();
    const parsed = schema.parse(body);
    const updated = await db.user.update({
      where: { id: userId },
      data: {
        ...(parsed.name !== undefined ? { name: parsed.name } : {}),
        ...(parsed.image !== undefined ? { image: parsed.image } : {}),
      },
      select: { id: true, name: true, image: true },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "invalid" },
      { status: 400 }
    );
  }
}
