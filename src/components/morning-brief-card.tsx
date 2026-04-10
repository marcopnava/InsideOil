"use client";

import { useEffect, useState } from "react";
import { Card } from "./card";

interface BriefSection {
  title: string;
  bullets: string[];
  sentiment?: "bullish" | "bearish" | "neutral";
}

interface MorningBrief {
  generatedAt: string;
  overallTone: "bullish" | "bearish" | "neutral" | "mixed";
  oneLineSummary: string;
  sections: BriefSection[];
}

const toneClass: Record<string, string> = {
  bullish: "bg-black text-white",
  bearish: "bg-accent text-white",
  neutral: "bg-black/6 text-text2",
  mixed: "bg-accent-soft text-accent",
};

export function MorningBriefCard() {
  const [brief, setBrief] = useState<MorningBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/morning-brief")
      .then((r) => r.json())
      .then((j) => {
        if (!active) return;
        if (j.success) setBrief(j.data);
        else setError(j.error);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card
      title="Morning Brief"
      badge={
        brief
          ? { text: brief.overallTone, variant: brief.overallTone === "bullish" || brief.overallTone === "bearish" ? "accent" : "dark" }
          : { text: "live", variant: "dark" }
      }
    >
      {loading && <div className="text-text3 text-xs">Generating brief…</div>}
      {error && <div className="text-accent text-xs">{error}</div>}
      {brief && (
        <div>
          <div className="mb-4">
            <span className={`text-[9px] font-bold uppercase tracking-[0.08em] px-2 py-[3px] rounded-full ${toneClass[brief.overallTone]}`}>
              {brief.overallTone}
            </span>
            <p className="text-[14px] text-text mt-3 leading-[1.5] font-medium">{brief.oneLineSummary}</p>
          </div>
          <div className="flex flex-col gap-4">
            {brief.sections.map((s) => (
              <section key={s.title}>
                <div className="text-[10px] font-bold text-text3 uppercase tracking-[0.07em] mb-2">{s.title}</div>
                <ul className="flex flex-col gap-1.5">
                  {s.bullets.map((b, i) => (
                    <li
                      key={i}
                      className="text-[12px] text-text2 leading-[1.5] pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-text3"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border text-[10px] text-text3">
            Generated {new Date(brief.generatedAt).toLocaleString("en-GB")} · Auto-built from live data
          </div>
        </div>
      )}
    </Card>
  );
}
