import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        success: false,
        error: "Image upload not configured. Set BLOB_READ_WRITE_TOKEN in Vercel env or paste an external image URL instead.",
      },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "missing file" }, { status: 400 });
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ success: false, error: "unsupported format" }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ success: false, error: "file too large (max 2 MB)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const blob = await put(`avatars/${userId}-${Date.now()}.${ext}`, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });

    await db.user.update({
      where: { id: userId },
      data: { image: blob.url },
    });

    return NextResponse.json({ success: true, data: { url: blob.url } });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "upload failed" },
      { status: 500 }
    );
  }
}
