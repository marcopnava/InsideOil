"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/card";
import { PageHelp } from "@/components/page-help";

const CALENDAR_HELP = {
  title: "Economic Calendar — what am I looking at?",
  intro:
    "The list of upcoming market-moving events for crude oil: EIA, API, Baker Hughes, CFTC, OPEC+, IEA, FOMC, Platts MOC window. Ordered by time. Countdowns refresh live. Hover any event to see details.",
  sections: [
    {
      title: "Impact levels",
      body: [
        "HIGH — reliably moves prices 1-3% at the release. Plan your day around these.",
        "MEDIUM — moves prices 0.3-1%. Worth watching, not worth interrupting a meeting.",
        "LOW — informational, rarely market-moving.",
      ],
    },
    {
      title: "Platts MOC window",
      body: [
        "Every business day 17:00-17:30 CET (16:00-16:30 London). Platts runs a structured bid/offer process that sets the Dated Brent benchmark for the day.",
        "For retail Brent CFD traders this is a 30-minute window of elevated volatility. Either trade it with tight risk or stay flat.",
        "We show a live countdown to the next window.",
      ],
    },
    {
      title: "How to use",
      body: [
        "Check the calendar at start of day. Reduce leverage going into HIGH impact events.",
        "Hover (desktop) or tap (mobile) any event row to see what it means, typical price move, and the specific numbers to watch.",
        "Set personal alerts (Settings → Alerts) for prices around release windows.",
      ],
    },
  ],
};

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  impact: "high" | "medium" | "low";
  at: string;
  source: string;
  tradingTip?: string;
  whatItMeans?: string;
  typicalMove?: string;
  watchList?: string[];
  educationLink?: string;
}

interface MocStatus {
  phase: "before" | "during" | "after";
  startsAt: string;
  endsAt: string;
  msUntilStart: number;
  msUntilEnd: number;
}

const impactBadge: Record<string, string> = {
  high: "bg-accent text-white",
  medium: "bg-black text-white",
  low: "bg-black/6 text-text2",
};

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "now";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtLocal(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  });
}

function fmtDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "Europe/Rome",
  });
}

function groupByDay(events: CalendarEvent[]): Array<{ day: string; label: string; items: CalendarEvent[] }> {
  const groups: Record<string, { day: string; label: string; items: CalendarEvent[] }> = {};
  for (const e of events) {
    const day = new Date(e.at).toLocaleDateString("en-CA", { timeZone: "Europe/Rome" }); // YYYY-MM-DD
    if (!groups[day]) {
      groups[day] = { day, label: fmtDay(e.at), items: [] };
    }
    groups[day].items.push(e);
  }
  return Object.values(groups).sort((a, b) => a.day.localeCompare(b.day));
}

function StatKpi({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-bg3 border border-border rounded-[var(--radius)] p-[14px_16px]">
      <div className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em] mb-1">
        {label}
      </div>
      <div
        className={`text-[20px] font-bold tracking-[-0.03em] leading-none ${
          highlight ? "text-accent" : ""
        }`}
        style={{ fontFamily: "var(--font-jetbrains)" }}
      >
        {value}
      </div>
      <div className="text-[9px] text-text3 mt-1">{sub}</div>
    </div>
  );
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [moc, setMoc] = useState<MocStatus | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [, forceTick] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const r = await fetch("/api/calendar?days=14");
      const j = await r.json();
      if (j.success) {
        setEvents(j.data.events);
        setMoc(j.data.moc);
      }
      setLoading(false);
    }
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();
  const mocMsUntilStart = moc ? new Date(moc.startsAt).getTime() - now : 0;
  const mocMsUntilEnd = moc ? new Date(moc.endsAt).getTime() - now : 0;
  const groups = groupByDay(events);

  return (
    <AppShell>
      <PageHelp {...CALENDAR_HELP} />
      <div className="animate-fade-in max-w-[1400px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
        <div className="mb-5 sm:mb-6">
          <h1 className="text-[26px] sm:text-[30px] font-bold tracking-[-0.035em]">Economic Calendar</h1>
          <p className="text-[12px] sm:text-sm text-text3 mt-1">
            Upcoming market-moving events for crude oil — next 14 days
          </p>
        </div>

        {/* Top KPI row — match /signals layout pattern */}
        {moc && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-3.5">
            <StatKpi
              label="MOC next session"
              value={mocMsUntilStart > 0 ? fmtCountdown(mocMsUntilStart) : fmtCountdown(mocMsUntilEnd)}
              sub={mocMsUntilStart <= 0 && mocMsUntilEnd > 0 ? "ACTIVE NOW" : "17:00 CET"}
              highlight={mocMsUntilStart <= 0 && mocMsUntilEnd > 0}
            />
            <StatKpi
              label="Events next 24h"
              value={String(events.filter((e) => new Date(e.at).getTime() - now < 86400_000 && new Date(e.at).getTime() > now).length)}
              sub="scheduled"
            />
            <StatKpi
              label="High impact"
              value={String(events.filter((e) => e.impact === "high").length)}
              sub="next 14 days"
            />
            <StatKpi
              label="Events total"
              value={String(events.length)}
              sub="on calendar"
            />
          </div>
        )}

        {/* MOC window explainer card */}
        {moc && (
          <Card
            title="Platts MOC window — Dated Brent"
            badge={
              mocMsUntilStart <= 0 && mocMsUntilEnd > 0
                ? { text: "ACTIVE NOW", variant: "accent" }
                : { text: "Next session", variant: "dark" }
            }
            className="mb-3.5"
          >
            <div className="text-[12px] text-text2 leading-[1.55]">
              <strong className="text-text">What it is:</strong> 30-minute Platts assessment window
              (17:00-17:30 CET) where physical crude traders submit bids and offers. Sets the daily
              Dated Brent benchmark.
            </div>
            <div className="text-[12px] text-text2 leading-[1.55] mt-2">
              <strong className="text-text">What to do:</strong>{" "}
              {mocMsUntilStart <= 0 && mocMsUntilEnd > 0 ? (
                <span className="text-accent font-semibold">
                  We&apos;re inside the window now. Brent CFDs have elevated volatility — trade with tight risk or stay flat.
                </span>
              ) : (
                <>
                  Next window {fmtLocal(moc.startsAt)} → {fmtLocal(moc.endsAt)} CET. Plan your risk or
                  exit by then.
                </>
              )}
            </div>
          </Card>
        )}

        {loading ? (
          <Card title="Upcoming events">
            <div className="text-text3 text-xs">Loading events…</div>
          </Card>
        ) : (
          <Card title={`Upcoming events (${events.length})`}>
            <div className="flex flex-col gap-5">
              {groups.map((g) => (
                <div key={g.day}>
                  <div className="text-[9px] font-bold text-text3 uppercase tracking-[0.08em] mb-2 sticky top-0">
                    {g.label}
                  </div>
                  <div className="flex flex-col">
                    {g.items.map((e) => {
                      const ms = new Date(e.at).getTime() - now;
                      const isPast = ms < 0;
                      const isOpen = expanded === e.id;
                      return (
                        <motion.div
                          key={e.id}
                          onMouseEnter={() => setExpanded(e.id)}
                          onMouseLeave={() => setExpanded(null)}
                          onClick={() => setExpanded((prev) => (prev === e.id ? null : e.id))}
                          className={`border-t border-border py-3 cursor-pointer group ${
                            isOpen ? "bg-bg2/60" : "hover:bg-bg2/40"
                          } transition-colors`}
                        >
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-[0.08em] px-1.5 py-[2px] rounded-full ${impactBadge[e.impact]}`}
                                >
                                  {e.impact}
                                </span>
                                <span className="text-[9px] text-text3 uppercase tracking-[0.06em]">
                                  {e.category}
                                </span>
                              </div>
                              <div className="text-[13px] font-semibold text-text mt-1 leading-tight">{e.title}</div>
                              <div className="text-[11px] text-text3 mt-0.5 leading-[1.45]">{e.description}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div
                                className={`text-[13px] font-bold tracking-[-0.02em] whitespace-nowrap ${
                                  isPast ? "text-text3" : ms < 24 * 3600_000 ? "text-accent" : "text-text"
                                }`}
                                style={{ fontFamily: "var(--font-jetbrains)" }}
                              >
                                {isPast ? "past" : `in ${fmtCountdown(ms)}`}
                              </div>
                              <div className="text-[10px] text-text3 mt-0.5">
                                {new Date(e.at).toLocaleTimeString("en-GB", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  timeZone: "Europe/Rome",
                                })}{" "}
                                CET
                              </div>
                            </div>
                          </div>

                          <AnimatePresence initial={false}>
                            {isOpen && (e.whatItMeans || e.tradingTip || e.watchList) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden"
                              >
                                <div className="mt-3 pt-3 border-t border-border grid grid-cols-1 lg:grid-cols-2 gap-x-5 gap-y-3">
                                  {e.whatItMeans && (
                                    <div className="lg:col-span-2">
                                      <div className="text-[9px] font-bold text-text3 uppercase tracking-[0.07em] mb-1">
                                        What it means
                                      </div>
                                      <p className="text-[11.5px] text-text2 leading-[1.55]">{e.whatItMeans}</p>
                                    </div>
                                  )}
                                  {e.typicalMove && (
                                    <div>
                                      <div className="text-[9px] font-bold text-text3 uppercase tracking-[0.07em] mb-1">
                                        Typical price move
                                      </div>
                                      <p className="text-[11.5px] text-text2 leading-[1.5]">{e.typicalMove}</p>
                                    </div>
                                  )}
                                  {e.source && (
                                    <div>
                                      <div className="text-[9px] font-bold text-text3 uppercase tracking-[0.07em] mb-1">
                                        Source
                                      </div>
                                      <p className="text-[11.5px] text-text2">{e.source}</p>
                                    </div>
                                  )}
                                  {e.watchList && e.watchList.length > 0 && (
                                    <div className="lg:col-span-2">
                                      <div className="text-[9px] font-bold text-text3 uppercase tracking-[0.07em] mb-1">
                                        What to watch
                                      </div>
                                      <ul className="flex flex-col gap-1">
                                        {e.watchList.map((w, i) => (
                                          <li
                                            key={i}
                                            className="text-[11.5px] text-text2 leading-[1.5] pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-text3"
                                          >
                                            {w}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {e.tradingTip && (
                                    <div className="lg:col-span-2 bg-bg3 border-l-2 border-accent pl-3 py-1.5 rounded-r">
                                      <div className="text-[9px] font-bold text-accent uppercase tracking-[0.07em] mb-0.5">
                                        Trading tip
                                      </div>
                                      <p className="text-[11.5px] text-text2 leading-[1.55]">{e.tradingTip}</p>
                                    </div>
                                  )}
                                  {e.educationLink && (
                                    <div className="lg:col-span-2">
                                      <a
                                        href={`/education#${e.educationLink}`}
                                        className="text-[11px] text-accent font-semibold no-underline hover:underline"
                                      >
                                        Read the full playbook in Education →
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
