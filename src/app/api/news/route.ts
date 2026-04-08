import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  category: string;
}

// Cache
let cache: NewsItem[] = [];
let lastFetch = 0;
const TTL = 600_000; // 10min

// Parse RSS XML simply (no library needed)
function parseRSSItems(xml: string): { title: string; link: string; pubDate: string; source: string }[] {
  const items: { title: string; link: string; pubDate: string; source: string }[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const title = content.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || "";
    const link = content.match(/<link>(.*?)<\/link>/)?.[1] || "";
    const pubDate = content.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
    const source = content.match(/<source.*?>(.*?)<\/source>/)?.[1] || "Google News";
    if (title && link) items.push({ title: decodeEntities(title), link, pubDate, source: decodeEntities(source) });
  }
  return items;
}

function decodeEntities(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

// Shipping/logistics news search queries
const QUERIES = [
  { q: "shipping+logistics+freight", category: "Shipping & Freight" },
  { q: "container+shipping+port", category: "Container Shipping" },
  { q: "maritime+trade+cargo", category: "Maritime Trade" },
  { q: "supply+chain+disruption", category: "Supply Chain" },
  { q: "aviation+cargo+air+freight", category: "Air Cargo" },
];

export async function GET() {
  try {
    if (cache.length > 0 && Date.now() - lastFetch < TTL) {
      return NextResponse.json({ success: true, data: cache });
    }

    const allNews: NewsItem[] = [];

    // Fetch Google News RSS for each query
    const results = await Promise.allSettled(
      QUERIES.map(async ({ q, category }) => {
        const res = await fetch(
          `https://news.google.com/rss/search?q=${q}&hl=en&gl=US&ceid=US:en`,
          { signal: AbortSignal.timeout(8_000), headers: { "User-Agent": "KLN-LogHub/1.0" } }
        );
        if (!res.ok) return [];
        const xml = await res.text();
        return parseRSSItems(xml).slice(0, 5).map((item) => ({ ...item, category }));
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") allNews.push(...r.value);
    }

    // Deduplicate by title similarity and sort by date
    const seen = new Set<string>();
    const unique = allNews.filter((n) => {
      const key = n.title.slice(0, 50).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    unique.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    cache = unique.slice(0, 25);
    lastFetch = Date.now();

    return NextResponse.json({ success: true, data: cache });
  } catch (e) {
    if (cache.length > 0) return NextResponse.json({ success: true, data: cache });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
