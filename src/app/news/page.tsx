"use client";

import { useApi } from "@/hooks/use-api";
import { Card } from "@/components/card";
import { AppShell } from "@/components/app-shell";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  category: string;
}

const catColors: Record<string, string> = {
  "Shipping & Freight": "bg-black/6 text-text",
  "Container Shipping": "bg-black/8 text-text",
  "Maritime Trade": "bg-black/5 text-text2",
  "Supply Chain": "bg-accent-soft text-accent",
  "Air Cargo": "bg-black/4 text-text3",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NewsPage() {
  const { data: news } = useApi<NewsItem[]>("/api/news", 600_000);

  // Group by category
  const categories = new Map<string, NewsItem[]>();
  news?.forEach((n) => {
    const list = categories.get(n.category) || [];
    list.push(n);
    categories.set(n.category, list);
  });

  return (
    <AppShell>
    <div className="animate-fade-in max-w-[1400px] mx-auto p-7 px-8 pb-14">
      <div className="mb-7">
        <h1 className="text-[30px] font-bold tracking-[-0.035em]">Industry News</h1>
        <p className="text-sm text-text3 mt-1">
          Real-time shipping, logistics, and freight news — Google News RSS (free)
        </p>
      </div>

      {/* Latest feed */}
      <Card title="Latest Headlines" badge={{ text: "Live" }} className="mb-[22px]">
        <div className="flex flex-col">
          {news?.slice(0, 15).map((n, i) => (
            <a
              key={i}
              href={n.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 px-1 py-3 border-b border-border last:border-b-0 hover:bg-bg2 transition-colors no-underline rounded-sm -mx-1 group"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-text leading-[1.4] group-hover:text-accent transition-colors">
                  {n.title}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[9px] font-semibold px-[7px] py-[2px] rounded-full ${catColors[n.category] ?? "bg-black/4 text-text3"}`}>
                    {n.category}
                  </span>
                  <span className="text-[10px] text-text3">{n.source}</span>
                  <span className="text-[10px] text-text3">{timeAgo(n.pubDate)}</span>
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text3 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </a>
          ))}
          {!news && (
            <div className="text-text3 text-xs text-center py-8">Fetching news from 5 categories...</div>
          )}
        </div>
      </Card>

      {/* By category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {Array.from(categories.entries()).map(([cat, items]) => (
          <Card key={cat} title={cat} badge={{ text: String(items.length), variant: "dark" as const }}>
            <div className="flex flex-col">
              {items.slice(0, 5).map((n, i) => (
                <a
                  key={i}
                  href={n.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 border-b border-border last:border-b-0 no-underline group"
                >
                  <div className="text-[12px] font-medium text-text leading-[1.4] group-hover:text-accent transition-colors">
                    {n.title}
                  </div>
                  <div className="text-[9px] text-text3 mt-1">
                    {n.source} · {timeAgo(n.pubDate)}
                  </div>
                </a>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4 text-[10px] text-text3 text-center">
        Source: Google News RSS — real-time, free, no API key — refreshes every 10 minutes
      </div>
    </div>
    </AppShell>
  );
}
