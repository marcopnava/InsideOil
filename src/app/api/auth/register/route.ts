import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ success: false, error: "An account with this email already exists" }, { status: 409 });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role: "VIEWER",
        subscriptionTier: "free",
      },
    });

    return NextResponse.json({
      success: true,
      data: { id: user.id, email: user.email, name: user.name },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
