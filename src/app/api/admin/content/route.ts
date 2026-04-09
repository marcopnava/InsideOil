import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { put } from "@vercel/blob";

// GET — list all content
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contents = await db.content.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true, email: true } } },
  });

  return NextResponse.json({ success: true, data: contents });
}

// POST — create new content with file upload
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const caption = formData.get("caption") as string;
    const hashtags = (formData.get("hashtags") as string || "").split(",").map(h => h.trim()).filter(Boolean);
    const platforms = (formData.get("platforms") as string || "").split(",").filter(Boolean);
    const scheduledAt = formData.get("scheduledAt") as string | null;

    if (!file || !title || !caption) {
      return NextResponse.json({ success: false, error: "File, title, and caption are required" }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(`content/${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    // Get user
    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const mediaType = file.type.startsWith("video/") ? "video" : "image";

    const content = await db.content.create({
      data: {
        title,
        caption,
        hashtags,
        mediaUrl: blob.url,
        mediaType,
        platform: platforms,
        status: scheduledAt ? "SCHEDULED" : "DRAFT",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdBy: user.id,
      },
    });

    return NextResponse.json({ success: true, data: content }, { status: 201 });
  } catch (e) {
    console.error("[Content] Upload error:", e);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}

// DELETE — delete content
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await db.content.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
