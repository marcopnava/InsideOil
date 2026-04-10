import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import {
  hasTierAccess,
  requiredTierForPath,
  requiredTierForApi,
  type Tier,
} from "./lib/tiers";

// ─── In-memory rate limiter (per-IP, resets every window) ───
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_API = 60; // 60 requests per minute for API
const RATE_LIMIT_AUTH = 10; // 10 attempts per minute for auth (reserved)

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
// silence unused const warning for RATE_LIMIT_AUTH until used
void RATE_LIMIT_AUTH;

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateMap) {
    if (now > entry.reset) rateMap.delete(key);
  }
}, 300_000);

const adminPaths = ["/admin"];

/** Paths always accessible to any authenticated user (no tier needed). */
const openAuthPaths = ["/education", "/settings", "/upgrade"];

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

    // Cron endpoints authenticate via ?secret=; skip JWT gating here.
    const required = requiredTierForApi(pathname);
    const isCron = pathname.startsWith("/api/cron/");
    if (required && !isCron) {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (!token) {
        return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
      }
      const userTier = (token.subscriptionTier as Tier | undefined) ?? "free";
      if (!hasTierAccess(userTier, required)) {
        return NextResponse.json(
          {
            success: false,
            error: "upgrade_required",
            requiredTier: required,
            currentTier: userTier,
          },
          { status: 403 }
        );
      }
    }

    // Add security headers and pass through
    const response = NextResponse.next();
    response.headers.set("X-Content-Type-Options", "nosniff");
    return response;
  }

  // ─── Page routes ───
  const required = requiredTierForPath(pathname);
  const isAdmin = adminPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isOpenAuth = openAuthPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const needsAuth = required !== null || isAdmin || isOpenAuth;

  if (needsAuth) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url)
      );
    }

    // Admin routes — require admin role
    if (isAdmin) {
      if (token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    } else if (required) {
      const userTier = (token.subscriptionTier as Tier | undefined) ?? "free";
      if (!hasTierAccess(userTier, required)) {
        // redirect to /upgrade with context about what was blocked
        const url = req.nextUrl.clone();
        url.pathname = "/upgrade";
        url.searchParams.set("required", required);
        url.searchParams.set("from", pathname);
        return NextResponse.redirect(url);
      }
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
    // App pages
    "/dashboard/:path*",
    "/briefing/:path*",
    "/tracking/:path*",
    "/trade/:path*",
    "/signals/:path*",
    "/differentials/:path*",
    "/russia/:path*",
    "/vessels/:path*",
    "/portfolio/:path*",
    "/calendar/:path*",
    "/watchlist/:path*",
    "/ports/:path*",
    "/weather/:path*",
    "/news/:path*",
    "/shipments/:path*",
    "/forecast/:path*",
    "/analytics/:path*",
    "/tools/:path*",
    "/alerts/:path*",
    "/education/:path*",
    "/settings/:path*",
    "/upgrade/:path*",
    "/admin/:path*",
    // APIs
    "/api/:path*",
  ],
};
