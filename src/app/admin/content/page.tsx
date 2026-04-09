"use client";

import { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Card } from "@/components/card";
import { AppShell } from "@/components/app-shell";

interface Hook {
  id: string; platform: string; type: string; title: string;
  content: string; hashtags: string[]; dataPoint: string; visualSuggestion: string;
  screenPath: string; // which client page to screenshot
  format: string; // reel, carousel, story
}
interface SocialData {
  hooks: Hook[];
  marketContext: { wti: number | null; wtiChange: number | null; crack: number | null; tankers: number; anchored: number; aircraft: number };
}

const fmt = (n: number) => n.toLocaleString("en-US");

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

// Post preview component that mimics Instagram/TikTok post format
function PostPreview({ hook, platform }: { hook: Hook; platform: string }) {
  return (
    <div className="bg-white border border-border rounded-[var(--radius)] overflow-hidden">
      {/* Platform header */}
      <div className="px-3 py-2 flex items-center gap-2 border-b border-border">
        <div className="w-7 h-7 rounded-full bg-text flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">IO</span>
        </div>
        <div>
          <div className="text-[11px] font-semibold">insideoil</div>
          <div className="text-[9px] text-text3">{hook.dataPoint}</div>
        </div>
        <span className="ml-auto text-[9px] font-semibold text-text3 bg-black/5 px-2 py-[1px] rounded-full">
          {platform === "tiktok" ? "TikTok" : "Instagram"} · {hook.format}
        </span>
      </div>

      {/* Visual area — shows which page to record */}
      <div className="bg-bg2 px-4 py-8 text-center border-b border-border">
        <div className="text-[10px] font-semibold text-text3 uppercase tracking-[0.07em] mb-2">Screen Record</div>
        <div className="inline-block px-4 py-2 bg-white rounded-[var(--radius-sm)] border border-border text-[12px] font-semibold">
          {hook.screenPath}
        </div>
        <div className="text-[10px] text-text3 mt-2 max-w-[260px] mx-auto leading-[1.4]">{hook.visualSuggestion}</div>
      </div>

      {/* Caption */}
      <div className="px-3 py-3">
        <div className="text-[11.5px] text-text leading-[1.5] whitespace-pre-line" style={{ maxHeight: 120, overflow: "hidden" }}>
          {hook.content.slice(0, 200)}...
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {hook.hashtags.slice(0, 4).map((h) => (
            <span key={h} className="text-[10px] text-accent font-medium">{h}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ContentPage() {
  const { data } = useApi<SocialData>("/api/admin/social-hooks", 300_000);
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "tiktok" | "instagram">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    copyToClipboard(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const ctx = data?.marketContext;
  const filtered = data?.hooks.filter((h) => filter === "all" || h.platform === filter) ?? [];

  return (
    <AppShell>
      <div className="animate-fade-in max-w-[1400px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
        <div className="mb-7">
          <h1 className="text-[30px] font-bold tracking-[-0.035em]">Content Generator</h1>
          <p className="text-sm text-text3 mt-1">Auto-generated social content from live platform data — preview, copy, and post</p>
        </div>

        {/* Market context */}
        {ctx && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
            {[
              { label: "WTI", value: ctx.wti ? "$" + ctx.wti.toFixed(2) : "..." },
              { label: "Change", value: ctx.wtiChange != null ? (ctx.wtiChange >= 0 ? "+" : "") + ctx.wtiChange.toFixed(2) + "%" : "..." },
              { label: "Crack", value: ctx.crack ? "$" + ctx.crack.toFixed(0) : "..." },
              { label: "Tankers", value: fmt(ctx.tankers) },
              { label: "Anchored", value: fmt(ctx.anchored) },
              { label: "Aircraft", value: fmt(ctx.aircraft) },
            ].map((s) => (
              <div key={s.label} className="bg-bg3 border border-border rounded-[var(--radius)] p-3 text-center">
                <div className="text-[9px] font-semibold text-text3 uppercase">{s.label}</div>
                <div className="text-[16px] font-bold mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-[5px] mb-5">
          {(["all", "tiktok", "instagram"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3.5 py-[5px] rounded-[18px] text-[11px] font-semibold border-none cursor-pointer transition-all ${filter === f ? "bg-text text-white" : "bg-black/5 text-text3 hover:bg-black/8"}`}>
              {f === "all" ? "All" : f === "tiktok" ? "TikTok" : "Instagram"}
            </button>
          ))}
          <span className="text-[11px] text-text3 ml-2 self-center">{filtered.length} posts ready</span>
        </div>

        {/* Posts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((hook) => (
            <div key={hook.id} className="flex flex-col gap-3">
              {/* Preview */}
              <PostPreview hook={hook} platform={hook.platform} />

              {/* Actions */}
              <div className="bg-bg3 border border-border rounded-[var(--radius)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[13px] font-semibold">{hook.title}</div>
                    <div className="flex gap-1.5 mt-1">
                      <span className="text-[9px] font-semibold text-text3 bg-black/5 px-2 py-[2px] rounded-full">{hook.platform}</span>
                      <span className="text-[9px] font-semibold text-accent bg-accent-soft px-2 py-[2px] rounded-full">{hook.format}</span>
                    </div>
                  </div>
                </div>

                {/* Expandable full content */}
                {expanded === hook.id ? (
                  <div className="p-3 bg-bg rounded-[var(--radius-sm)] border border-border mb-3 text-[12px] text-text2 leading-[1.6] whitespace-pre-line">
                    {hook.content}
                    <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-border">
                      {hook.hashtags.map((h) => <span key={h} className="text-[10px] text-accent font-medium">{h}</span>)}
                    </div>
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <button onClick={() => setExpanded(expanded === hook.id ? null : hook.id)}
                    className="px-3 py-1.5 rounded-[var(--radius-xs)] bg-black/5 text-text2 text-[11px] font-semibold cursor-pointer border-none hover:bg-black/8 transition-colors">
                    {expanded === hook.id ? "Collapse" : "Full Caption"}
                  </button>
                  <button onClick={() => handleCopy(hook.id, hook.content + "\n\n" + hook.hashtags.join(" "))}
                    className="px-3 py-1.5 rounded-[var(--radius-xs)] bg-text text-white text-[11px] font-semibold cursor-pointer border-none hover:bg-black/80 transition-colors">
                    {copied === hook.id ? "Copied!" : "Copy All"}
                  </button>
                  <button onClick={() => handleCopy(hook.id + "-hash", hook.hashtags.join(" "))}
                    className="px-3 py-1.5 rounded-[var(--radius-xs)] bg-black/5 text-text2 text-[11px] font-semibold cursor-pointer border-none hover:bg-black/8 transition-colors">
                    Copy Hashtags
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!data && <div className="text-text3 text-xs text-center py-8 col-span-2">Generating content from live data...</div>}
        </div>
      </div>
    </AppShell>
  );
}
