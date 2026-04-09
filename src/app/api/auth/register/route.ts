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
  token: z.string().min(1, "Registration token is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const { name, email, password, token } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Validate token
    const user = await db.user.findUnique({ where: { registrationToken: token } });

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid registration token" }, { status: 400 });
    }

    if (user.email !== normalizedEmail) {
      return NextResponse.json({ success: false, error: "Email does not match the registration token" }, { status: 400 });
    }

    if (user.passwordHash) {
      return NextResponse.json({ success: false, error: "Account already registered. Please sign in." }, { status: 400 });
    }

    if (user.tokenExpiresAt && user.tokenExpiresAt < new Date()) {
      return NextResponse.json({ success: false, error: "Registration link has expired. Contact info@insideoil.it" }, { status: 400 });
    }

    // Set password and clear token
    const passwordHash = await bcrypt.hash(password, 12);

    await db.user.update({
      where: { id: user.id },
      data: {
        name,
        passwordHash,
        registrationToken: null,
        tokenExpiresAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      data: { id: user.id, email: user.email, name },
    }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
