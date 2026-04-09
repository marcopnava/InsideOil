import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// ─── In-memory rate limiter (per-IP, resets every window) ───
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_API = 60;      // 60 requests per minute for API
const RATE_LIMIT_AUTH = 10;     // 10 attempts per minute for auth

function isRateLimited(key: string, limit: number): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.reset) {
    rateMap.set(key, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > limit;
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateMap) {
    if (now > entry.reset) rateMap.delete(key);
  }
}, 300_000);

const protectedPaths = [
  "/dashboard", "/briefing", "/tracking", "/trade", "/watchlist",
  "/ports", "/weather", "/news", "/shipments", "/forecast", "/analytics", "/tools",
];

const adminPaths = ["/admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ─── NEVER touch NextAuth routes ───
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // ─── Rate limiting for other API routes ───
  if (pathname.startsWith("/api/")) {
    if (isRateLimited(`${ip}:api`, RATE_LIMIT_API)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    // Admin API routes
    if (pathname.startsWith("/api/admin/")) {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (token?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Add security headers and pass through
    const response = NextResponse.next();
    response.headers.set("X-Content-Type-Options", "nosniff");
    return response;
  }

  // ─── Page routes ───
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Protected routes — require login
  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isProtected && !token) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url));
  }

  // Admin routes — require admin role
  const isAdmin = adminPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isAdmin) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: [
    "/dashboard", "/dashboard/:path*",
    "/briefing", "/briefing/:path*",
    "/tracking", "/tracking/:path*",
    "/trade", "/trade/:path*",
    "/watchlist", "/watchlist/:path*",
    "/ports", "/ports/:path*",
    "/weather", "/weather/:path*",
    "/news", "/news/:path*",
    "/shipments", "/shipments/:path*",
    "/forecast", "/forecast/:path*",
    "/analytics", "/analytics/:path*",
    "/tools", "/tools/:path*",
    "/admin", "/admin/:path*",
    "/api/:path*",
  ],
};
