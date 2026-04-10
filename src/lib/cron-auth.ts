import { NextRequest } from "next/server";

/**
 * Validates incoming cron requests. Accepts EITHER:
 *   1. `Authorization: Bearer ${CRON_SECRET}` header — used by Vercel cron
 *   2. `?secret=${CRON_SECRET}` query param — used by external pingers like
 *      UptimeRobot free tier (no custom headers).
 *
 * In dev (no CRON_SECRET set) → allow all.
 */
export function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const qs = req.nextUrl.searchParams.get("secret");
  if (qs && qs === secret) return true;
  return false;
}
