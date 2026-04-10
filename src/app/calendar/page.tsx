"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/card";
import { PageHelp } from "@/components/page-help";

const CALENDAR_HELP = {
  title: "Economic Calendar — what am I looking at?",
  intro:
    "The list of upcoming market-moving events for crude oil: EIA, API, Baker Hughes, CFTC, OPEC+, IEA, FOMC, Platts MOC window. Ordered by time. Countdowns refresh live.",
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
}

interface MocStatus {
  phase: "before" | "during" | "after";
  startsAt: string;
  endsAt: string;
  msUntilStart: number;
  msUntilEnd: number;
}

const impactColor: Record<string, string> = {
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

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [moc, setMoc] = useState<MocStatus | null>(null);
  const [tick, setTick] = useState(0);
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
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();
  const mocMsUntilStart = moc ? new Date(moc.startsAt).getTime() - now : 0;
  const mocMsUntilEnd = moc ? new Date(moc.endsAt).getTime() - now : 0;

  return (
    <AppShell>
      <PageHelp {...CALENDAR_HELP} />
      <div className="animate-fade-in max-w-[1100px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
        <div className="mb-5 sm:mb-6">
          <h1 className="text-[26px] sm:text-[30px] font-bold tracking-[-0.035em]">Economic Calendar</h1>
          <p className="text-[12px] sm:text-sm text-text3 mt-1">
            Upcoming market-moving events for crude oil — next 14 days.
          </p>
        </div>

        {/* MOC window live indicator */}
        {moc && (
          <Card title="Platts MOC window — Dated Brent" className="mb-3.5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-[11px] text-text3 mb-1">
                  {mocMsUntilStart > 0
                    ? "Next MOC window starts in"
                    : mocMsUntilEnd > 0
                      ? "MOC window ACTIVE — ends in"
                      : "Window closed"}
                </div>
                <div
                  className={`text-[26px] sm:text-[30px] font-bold tracking-[-0.03em] leading-none ${
                    mocMsUntilStart <= 0 && mocMsUntilEnd > 0 ? "text-accent" : ""
                  }`}
                  style={{ fontFamily: "var(--font-jetbrains)" }}
                >
                  {mocMsUntilStart > 0 ? fmtCountdown(mocMsUntilStart) : fmtCountdown(mocMsUntilEnd)}
                </div>
                <div className="text-[11px] text-text3 mt-1">
                  {fmtLocal(moc.startsAt)} → {fmtLocal(moc.endsAt)} CET
                </div>
              </div>
              <div className="text-[11px] text-text2 max-w-[360px] leading-[1.5]">
                {mocMsUntilStart <= 0 && mocMsUntilEnd > 0 ? (
                  <strong className="text-accent">
                    Brent CFDs in the elevated-volatility window. If you don&apos;t have a plan, stay flat.
                  </strong>
                ) : (
                  "30-minute Platts assessment window that sets the daily Dated Brent benchmark."
                )}
              </div>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="text-text3 text-xs">Loading events…</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {events.map((e) => {
              const ms = new Date(e.at).getTime() - now;
              const happening = ms <= 0 && ms > -3600_000;
              return (
                <div
                  key={e.id}
                  className={`bg-bg3 border rounded-[var(--radius)] p-4 sm:p-5 ${
                    happening ? "border-accent ring-1 ring-accent/20" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[240px]">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[9px] font-bold uppercase tracking-[0.08em] px-2 py-[2px] rounded-full ${impactColor[e.impact]}`}>
                          {e.impact}
                        </span>
                        <span className="text-[10px] text-text3 uppercase tracking-[0.06em]">{e.category}</span>
                      </div>
                      <div className="text-[14px] font-semibold text-text leading-tight">{e.title}</div>
                      <div className="text-[11.5px] text-text2 mt-1 leading-[1.5]">{e.description}</div>
                      {e.tradingTip && (
                        <div className="mt-2 text-[11px] text-text2 bg-bg2 border-l-2 border-accent pl-3 py-1.5">
                          <span className="font-semibold text-text">Tip: </span>
                          {e.tradingTip}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className={`text-[16px] font-bold tracking-[-0.02em] ${ms <= 0 ? "text-text3" : ms < 24 * 3600_000 ? "text-accent" : "text-text"}`}
                        style={{ fontFamily: "var(--font-jetbrains)" }}
                      >
                        {ms <= 0 ? "past" : `in ${fmtCountdown(ms)}`}
                      </div>
                      <div className="text-[10px] text-text3 mt-0.5">{fmtLocal(e.at)} CET</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Invisible input just to pick up the tick and force re-render */}
        <div className="hidden">{tick}</div>
      </div>
    </AppShell>
  );
}
