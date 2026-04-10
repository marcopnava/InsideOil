import { NextRequest } from "next/server";

/**
 * Validates incoming Vercel cron requests.
 * Vercel sends header: `Authorization: Bearer ${CRON_SECRET}` automatically
 * when CRON_SECRET is set in project env vars.
 *
 * In dev (no CRON_SECRET set) → allow all so we can call manually.
 */
export function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
