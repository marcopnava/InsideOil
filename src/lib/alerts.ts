/**
 * Personal alert engine.
 *
 * Each alert evaluates a metric against a threshold. When triggered, the user
 * receives an email via Resend. Cron loops every 5 min via UptimeRobot ping
 * to /api/cron/alerts.
 *
 * Supported metrics:
 *   BRENT_PRICE         spot Brent in $/bbl
 *   WTI_PRICE           spot WTI in $/bbl
 *   BRENT_WTI_SPREAD    Brent − WTI in $/bbl
 *   BDTI                Baltic Dirty Tanker Index
 *   CRACK_321           3-2-1 crack spread vs WTI
 *   HORMUZ_TANKERS      live tanker count in Hormuz bbox
 *   STORAGE_RATIO       anchored tankers / total tankers
 *
 * Comparators: gt (greater than), lt (less than), change_pct (% change vs previous run)
 */

import { db } from "@/lib/db";
import { Resend } from "resend";
import { getLatestCurve } from "@/lib/forward-curve";
import { getLatestBDTI } from "@/lib/bdti";
import { computeChokepointFlow } from "@/lib/chokepoints";

export const SUPPORTED_METRICS = [
  { id: "BRENT_PRICE",      label: "Brent spot price",         unit: "$/bbl" },
  { id: "WTI_PRICE",        label: "WTI spot price",           unit: "$/bbl" },
  { id: "BRENT_WTI_SPREAD", label: "Brent − WTI spread",       unit: "$/bbl" },
  { id: "BDTI",             label: "Baltic Dirty Tanker Index", unit: "index" },
  { id: "HORMUZ_TANKERS",   label: "Hormuz live tanker count",  unit: "ships" },
  { id: "MALACCA_TANKERS",  label: "Malacca live tanker count", unit: "ships" },
];

export const COMPARATORS = [
  { id: "gt", label: "is greater than" },
  { id: "lt", label: "is less than" },
  { id: "change_pct", label: "changes by % (since last check)" },
];

async function getMetricValue(metric: string): Promise<number | null> {
  switch (metric) {
    case "BRENT_PRICE": {
      const c = await getLatestCurve("BRENT");
      return c[0]?.price ?? null;
    }
    case "WTI_PRICE": {
      const c = await getLatestCurve("WTI");
      return c[0]?.price ?? null;
    }
    case "BRENT_WTI_SPREAD": {
      const [b, w] = await Promise.all([getLatestCurve("BRENT"), getLatestCurve("WTI")]);
      if (b[0] && w[0]) return Math.round((b[0].price - w[0].price) * 100) / 100;
      return null;
    }
    case "BDTI": {
      const v = await getLatestBDTI();
      return v?.value ?? null;
    }
    case "HORMUZ_TANKERS":
    case "MALACCA_TANKERS": {
      const cp = await computeChokepointFlow();
      const id = metric === "HORMUZ_TANKERS" ? "HORMUZ" : "MALACCA";
      const r = cp.chokepoints.find((c) => c.id === id);
      return r?.current.tankers ?? null;
    }
    default:
      return null;
  }
}

function shouldTrigger(
  comparator: string,
  threshold: number,
  current: number,
  previous: number | null
): boolean {
  if (comparator === "gt") return current > threshold;
  if (comparator === "lt") return current < threshold;
  if (comparator === "change_pct") {
    if (previous == null) return false;
    const pct = ((current - previous) / previous) * 100;
    return Math.abs(pct) >= threshold;
  }
  return false;
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM ?? "InsideOil Alerts <alerts@insideoil.it>";

async function sendAlertEmail(toEmail: string, subject: string, body: string) {
  if (!resend) {
    console.warn("[alerts] RESEND_API_KEY not set — skipping email");
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: toEmail,
      subject,
      html: `<div style="font-family:system-ui,sans-serif;color:#111;line-height:1.5;max-width:560px">
        <div style="border-left:3px solid #e8590c;padding:12px 16px;background:#fafafa;border-radius:4px">
          <h2 style="margin:0 0 8px 0;font-size:16px">${subject}</h2>
          <p style="margin:0;font-size:13px;color:#444">${body}</p>
        </div>
        <p style="margin-top:16px;font-size:11px;color:#888">
          This alert was triggered by your personal rule on InsideOil.
          Manage your alerts at <a href="https://www.insideoil.it/alerts" style="color:#e8590c">insideoil.it/alerts</a>.
        </p>
      </div>`,
    });
  } catch (e) {
    console.error("[alerts] email error:", e);
  }
}

export async function evaluateAllAlerts(): Promise<{ checked: number; triggered: number }> {
  const alerts = await db.userAlert.findMany({
    where: { enabled: true },
  });

  let triggered = 0;
  for (const a of alerts) {
    const value = await getMetricValue(a.metric);
    if (value == null) continue;
    const fire = shouldTrigger(a.comparator, a.threshold, value, a.lastValue);

    if (fire) {
      const user = await db.user.findUnique({ where: { id: a.userId }, select: { email: true } });
      if (user?.email) {
        const metricLabel = SUPPORTED_METRICS.find((m) => m.id === a.metric)?.label ?? a.metric;
        const compLabel = COMPARATORS.find((c) => c.id === a.comparator)?.label ?? a.comparator;
        await sendAlertEmail(
          user.email,
          `🛢 ${a.name}`,
          `${metricLabel} ${compLabel} ${a.threshold}. Current value: <strong>${value}</strong>.`
        );
      }
      await db.userAlert.update({
        where: { id: a.id },
        data: {
          lastTriggered: new Date(),
          lastValue: value,
          triggerCount: { increment: 1 },
        },
      });
      triggered++;
    } else {
      // Always update lastValue so change_pct comparator works
      await db.userAlert.update({
        where: { id: a.id },
        data: { lastValue: value },
      });
    }
  }

  return { checked: alerts.length, triggered };
}
