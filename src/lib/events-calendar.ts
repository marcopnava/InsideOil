/**
 * Economic events calendar for crude oil traders.
 *
 * Produces a list of upcoming market-moving events (next 7 days + a few
 * monthly/quarterly ones). Events are derived from recurring rules — no
 * external API needed. All times in UTC; UI converts to the user's local.
 *
 * When an event is scheduled monthly/quarterly we use a static table of
 * known dates for the current year; update when OPEC+ publishes its calendar.
 */

export type EventCategory =
  | "inventory"
  | "positioning"
  | "rig-count"
  | "cartel"
  | "central-bank"
  | "benchmark"
  | "api-release";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  impact: "high" | "medium" | "low";
  at: Date; // absolute UTC
  source: string;
  tradingTip?: string;
}

const DAY = 86400_000;
const HOUR = 3600_000;

function nextWeekday(day: number, hourUTC: number, minuteUTC = 0, from = new Date()): Date {
  // day: 0=Sun..6=Sat. Returns the next occurrence at or after `from`.
  const out = new Date(from);
  out.setUTCHours(hourUTC, minuteUTC, 0, 0);
  const diff = (day - out.getUTCDay() + 7) % 7;
  if (diff === 0 && out.getTime() <= from.getTime()) out.setUTCDate(out.getUTCDate() + 7);
  else out.setUTCDate(out.getUTCDate() + diff);
  return out;
}

function nextMocWindow(from = new Date()): Date {
  // Platts MOC Dated Brent window ends at 16:30 London time = 15:30 UTC
  // (standard time) or 14:30 UTC (BST). Use 15:30 UTC as simple approx.
  const out = new Date(from);
  out.setUTCHours(15, 30, 0, 0);
  if (out.getTime() <= from.getTime()) out.setUTCDate(out.getUTCDate() + 1);
  // Skip weekends
  while (out.getUTCDay() === 0 || out.getUTCDay() === 6) {
    out.setUTCDate(out.getUTCDate() + 1);
  }
  return out;
}

// Static known OPEC+ / FOMC / OPEC monthly report dates for 2026.
// Update when OPEC publishes its 2027 calendar.
const STATIC_EVENTS: Array<{
  title: string;
  description: string;
  category: EventCategory;
  impact: "high" | "medium" | "low";
  at: string; // ISO UTC
  source: string;
  tradingTip?: string;
}> = [
  {
    title: "OPEC Monthly Oil Market Report",
    description: "OPEC publishes its monthly supply/demand balance and production compliance data.",
    category: "cartel",
    impact: "medium",
    at: "2026-04-14T10:00:00Z",
    source: "opec.org",
    tradingTip: "Watch for demand forecast revisions. A meaningful downward revision is bearish.",
  },
  {
    title: "IEA Monthly Oil Market Report",
    description: "International Energy Agency oil market update: global supply, demand, inventories, refining.",
    category: "cartel",
    impact: "medium",
    at: "2026-04-15T08:00:00Z",
    source: "iea.org",
    tradingTip: "IEA often diverges from OPEC on demand. A bearish IEA + bearish OPEC = confirmed soft demand narrative.",
  },
  {
    title: "EIA Short-Term Energy Outlook (STEO)",
    description: "US government forecast for US and global oil supply/demand.",
    category: "inventory",
    impact: "medium",
    at: "2026-04-09T16:00:00Z",
    source: "eia.gov",
  },
  {
    title: "OPEC+ JMMC Meeting",
    description: "Joint Ministerial Monitoring Committee reviews production compliance and can recommend adjustments.",
    category: "cartel",
    impact: "high",
    at: "2026-06-04T12:00:00Z",
    source: "opec.org",
    tradingTip: "JMMC headlines can move Brent 3-8% within minutes. Reduce leverage going into the meeting.",
  },
  {
    title: "FOMC Rate Decision",
    description: "US Federal Reserve rate decision. Affects USD strength, which inversely correlates with crude oil.",
    category: "central-bank",
    impact: "high",
    at: "2026-04-29T18:00:00Z",
    source: "federalreserve.gov",
    tradingTip: "Hawkish Fed = stronger USD = bearish for oil. Flat positions during release window.",
  },
];

export function getUpcomingEvents(horizonDays = 14): CalendarEvent[] {
  const now = new Date();
  const horizon = new Date(now.getTime() + horizonDays * DAY);
  const events: CalendarEvent[] = [];

  // ─── Weekly recurring ──────────────────────────────────
  // API crude stocks — Tuesday 20:30 UTC
  let d = nextWeekday(2, 20, 30, now);
  while (d.getTime() < horizon.getTime()) {
    events.push({
      id: `api-${d.toISOString()}`,
      title: "API Weekly Crude Stocks",
      description:
        "American Petroleum Institute private release — first peek at next day's EIA data. Moves crude prices in overnight US session.",
      category: "api-release",
      impact: "medium",
      at: d,
      source: "api.org",
      tradingTip: "Big API build often (but not always) precedes a big EIA build the next day.",
    });
    d = new Date(d.getTime() + 7 * DAY);
  }

  // EIA Weekly Petroleum Status — Wednesday 14:30 UTC (10:30 ET → 15:30 CET)
  d = nextWeekday(3, 14, 30, now);
  while (d.getTime() < horizon.getTime()) {
    events.push({
      id: `eia-${d.toISOString()}`,
      title: "EIA Weekly Petroleum Status Report",
      description:
        "The single most market-moving weekly release for crude. Crude stocks, gasoline, distillate, refinery utilization.",
      category: "inventory",
      impact: "high",
      at: d,
      source: "eia.gov",
      tradingTip:
        "Follow the 4-number playbook: crude stocks, gasoline, distillate, refinery util. See Education → The Wednesday EIA playbook.",
    });
    d = new Date(d.getTime() + 7 * DAY);
  }

  // Baker Hughes US rig count — Friday 17:00 UTC (13:00 ET)
  d = nextWeekday(5, 17, 0, now);
  while (d.getTime() < horizon.getTime()) {
    events.push({
      id: `bh-${d.toISOString()}`,
      title: "Baker Hughes US Rig Count",
      description: "Weekly count of active US oil & gas drilling rigs. Proxy for future US production growth.",
      category: "rig-count",
      impact: "low",
      at: d,
      source: "bakerhughes.com",
    });
    d = new Date(d.getTime() + 7 * DAY);
  }

  // CFTC Commitments of Traders — Friday 19:30 UTC (15:30 ET)
  d = nextWeekday(5, 19, 30, now);
  while (d.getTime() < horizon.getTime()) {
    events.push({
      id: `cftc-${d.toISOString()}`,
      title: "CFTC Commitments of Traders",
      description: "Weekly speculative positioning for WTI and Brent futures. Managed Money net long shift.",
      category: "positioning",
      impact: "medium",
      at: d,
      source: "cftc.gov",
      tradingTip: "Extreme net long (>300k contracts) = crowded, risk of unwind. Extreme short = bearish exhaustion.",
    });
    d = new Date(d.getTime() + 7 * DAY);
  }

  // ─── Daily recurring: Platts MOC window ──────────────────────
  d = nextMocWindow(now);
  while (d.getTime() < horizon.getTime()) {
    events.push({
      id: `moc-${d.toISOString()}`,
      title: "Platts MOC Window — Dated Brent",
      description:
        "30-minute window (16:00-16:30 London) where Platts assesses Dated Brent via a structured bid/offer process. Sets the daily benchmark.",
      category: "benchmark",
      impact: "medium",
      at: d,
      source: "spglobal.com/platts",
      tradingTip: "Brent CFDs see elevated volatility 17:00-17:30 CET. Either trade the volatility or stay flat.",
    });
    d = new Date(d.getTime() + DAY);
    // Skip weekends
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d = new Date(d.getTime() + DAY);
  }

  // ─── Static events ─────────────────────────────────────
  for (const e of STATIC_EVENTS) {
    const at = new Date(e.at);
    if (at.getTime() > now.getTime() - HOUR && at.getTime() < horizon.getTime() + 30 * DAY) {
      events.push({ id: e.title + "-" + e.at, ...e, at });
    }
  }

  events.sort((a, b) => a.at.getTime() - b.at.getTime());
  return events;
}

/** Next occurrence of the MOC window (or null if it's in progress / just ended). */
export function getMocStatus(now = new Date()): {
  phase: "before" | "during" | "after";
  startsAt: Date;
  endsAt: Date;
  msUntilStart: number;
  msUntilEnd: number;
} {
  const end = nextMocWindow(now);
  const start = new Date(end.getTime() - 30 * 60_000);
  if (now < start) {
    return {
      phase: "before",
      startsAt: start,
      endsAt: end,
      msUntilStart: start.getTime() - now.getTime(),
      msUntilEnd: end.getTime() - now.getTime(),
    };
  }
  if (now >= start && now < end) {
    return {
      phase: "during",
      startsAt: start,
      endsAt: end,
      msUntilStart: 0,
      msUntilEnd: end.getTime() - now.getTime(),
    };
  }
  // "after" — return next day's window
  const nextEnd = nextMocWindow(new Date(end.getTime() + 60_000));
  const nextStart = new Date(nextEnd.getTime() - 30 * 60_000);
  return {
    phase: "after",
    startsAt: nextStart,
    endsAt: nextEnd,
    msUntilStart: nextStart.getTime() - now.getTime(),
    msUntilEnd: nextEnd.getTime() - now.getTime(),
  };
}
