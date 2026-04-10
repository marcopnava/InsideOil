"use client";

import { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { KPICard } from "@/components/kpi-card";
import { Card } from "@/components/card";
import { DetailPanel, DetailRow } from "@/components/detail-panel";
import { TradeTabs } from "@/components/trade-tabs";
import { AppShell } from "@/components/app-shell";

interface CalendarEvent {
  date: string; time: string; event: string; impact: "HIGH" | "MEDIUM" | "LOW";
  category: string; description: string; tradingNote: string;
}
interface CalendarData {
  events: CalendarEvent[];
  todayEvents: CalendarEvent[];
  thisWeekCount: number;
  highImpactThisWeek: number;
}

const impactCls: Record<string, string> = {
  HIGH: "bg-accent-soft2 text-accent",
  MEDIUM: "bg-black/8 text-text",
  LOW: "bg-black/4 text-text3",
};

function daysUntil(date: string): string {
  const diff = Math.ceil((new Date(date).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `in ${diff} days`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export default function CalendarPage() {
  const { data } = useApi<CalendarData>("/api/trade/calendar", 3600_000);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);

  const today = new Date().toISOString().split("T")[0];

  return (
    <AppShell>
    <div className="animate-fade-in max-w-[1400px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
      <div className="mb-7">
        <h1 className="text-[30px] font-bold tracking-[-0.035em]">Economic Calendar</h1>
        <p className="text-sm text-text3 mt-1">Upcoming events that move crude oil — know before you trade</p>
        <TradeTabs />
      </div>

      {data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-[22px]">
            <KPICard label="Events This Week" value={data.thisWeekCount} sub={`${data.highImpactThisWeek} high impact`} trend={data.highImpactThisWeek > 1 ? "up" : undefined} />
            <KPICard label="Today" value={data.todayEvents.length > 0 ? data.todayEvents[0].event.split(" ").slice(0, 3).join(" ") : "No events"} sub={data.todayEvents.length > 0 ? data.todayEvents[0].time : "Clear calendar"} />
            <KPICard label="Next High Impact" value={data.events.find((e) => e.impact === "HIGH" && e.date >= today)?.event.split(" ").slice(0, 3).join(" ") ?? "—"} sub={daysUntil(data.events.find((e) => e.impact === "HIGH" && e.date >= today)?.date ?? today)} />
          </div>

          {/* Today's events */}
          {data.todayEvents.length > 0 && (
            <Card title="Today" badge={{ text: `${data.todayEvents.length} events` }} className="mb-[22px]">
              {data.todayEvents.map((e, i) => (
                <div key={i} className="p-4 rounded-[var(--radius-sm)] border border-accent bg-accent-soft mb-2 last:mb-0 cursor-pointer hover:bg-accent-soft2 transition-colors" onClick={() => setSelected(e)}>
                  <div className="flex items-center justify-between">
                    <div className="text-[14px] font-semibold">{e.event}</div>
                    <span className={`text-[9px] font-bold px-2 py-[2px] rounded-full ${impactCls[e.impact]}`}>{e.impact}</span>
                  </div>
                  <div className="text-[11px] text-text2 mt-1">{e.time} · {e.category}</div>
                </div>
              ))}
            </Card>
          )}

          {/* Full calendar */}
          <Card title="Upcoming Events" badge={{ text: `${data.events.length} events` }}>
            <div className="scroll-x">
              <table className="w-full border-collapse">
                <thead><tr>
                  {["Date", "Time", "Event", "Impact", "Category"].map((h) => (
                    <th key={h} className="text-[10px] font-semibold uppercase tracking-[0.07em] text-text3 text-left px-3 py-[9px] border-b border-border2">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {data.events.map((e, i) => {
                    const isToday = e.date === today;
                    const isPast = e.date < today;
                    return (
                      <tr key={i} className={`transition-colors cursor-pointer ${isToday ? "bg-accent-soft" : isPast ? "opacity-50" : "hover:bg-bg2"}`} onClick={() => setSelected(e)}>
                        <td className="text-[11px] px-3 py-[12px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)" }}>
                          {formatDate(e.date)}
                          <span className="text-text3 ml-1.5">{daysUntil(e.date)}</span>
                        </td>
                        <td className="text-[11px] px-3 py-[12px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)" }}>{e.time}</td>
                        <td className="text-[12px] px-3 py-[12px] border-b border-border font-medium">{e.event}</td>
                        <td className="text-[11px] px-3 py-[12px] border-b border-border">
                          <span className={`inline-flex px-[8px] py-[2px] rounded-full text-[9px] font-semibold ${impactCls[e.impact]}`}>{e.impact}</span>
                        </td>
                        <td className="text-[11px] px-3 py-[12px] border-b border-border text-text3">{e.category}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <DetailPanel open={!!selected} onClose={() => setSelected(null)}>
            {selected && (
              <>
                <div className="text-[11px] text-text3">{formatDate(selected.date)} · {selected.time}</div>
                <h2 className="text-[20px] font-bold mt-1 tracking-[-0.02em]">{selected.event}</h2>
                <div className="flex gap-2 mt-2">
                  <span className={`inline-flex px-[9px] py-[3px] rounded-full text-[10px] font-semibold ${impactCls[selected.impact]}`}>{selected.impact}</span>
                  <span className="text-[10px] text-text3 bg-black/4 px-[9px] py-[3px] rounded-full">{selected.category}</span>
                </div>
                <div className="mt-5">
                  <DetailRow label="Date" value={formatDate(selected.date)} />
                  <DetailRow label="Time" value={selected.time} mono />
                  <DetailRow label="Countdown" value={daysUntil(selected.date)} />
                </div>
                <div className="mt-4 p-3 bg-bg rounded-[var(--radius-sm)] border border-border">
                  <div className="text-[10px] font-semibold text-text3 uppercase mb-1">What It Is</div>
                  <div className="text-[12px] text-text2 leading-[1.5]">{selected.description}</div>
                </div>
                <div className="mt-3 p-3 bg-accent-soft rounded-[var(--radius-sm)] border border-accent">
                  <div className="text-[10px] font-semibold text-accent uppercase mb-1">How to Trade It</div>
                  <div className="text-[12px] text-text2 leading-[1.5]">{selected.tradingNote}</div>
                </div>
              </>
            )}
          </DetailPanel>
        </>
      ) : (
        <div className="bg-bg3 border border-border rounded-[var(--radius)] p-16 text-center">
          <div className="text-text3 text-sm">Loading economic calendar...</div>
        </div>
      )}
    </div>
    </AppShell>
  );
}
