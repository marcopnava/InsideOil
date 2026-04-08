"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface SearchResult {
  type: "aircraft" | "vessel" | "ais";
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
  isCargo?: boolean;
  isDelayed?: boolean;
}

interface SearchData {
  aircraft: SearchResult[];
  vessels: SearchResult[];
  ais: SearchResult[];
  total: number;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchData | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success) setResults(json.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.length >= 2) {
      timerRef.current = setTimeout(() => search(query), 300);
    } else {
      setResults(null);
    }
    return () => clearTimeout(timerRef.current);
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const typeIcon = (t: string) => {
    if (t === "aircraft") return "✈";
    if (t === "vessel") return "🚢";
    return "📡";
  };

  const typeLabel = (t: string) => {
    if (t === "aircraft") return "OpenSky";
    if (t === "vessel") return "Vessel";
    return "AIS";
  };

  const allResults = [
    ...(results?.aircraft ?? []),
    ...(results?.vessels ?? []),
    ...(results?.ais ?? []),
  ];

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 bg-black/4 rounded-[var(--radius-xs)] px-3 py-[5px] w-[220px] focus-within:w-[280px] transition-all focus-within:bg-black/6">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-text3 shrink-0"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search callsign, MMSI, vessel..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="bg-transparent border-none outline-none text-[12px] text-text w-full placeholder:text-text3"
        />
        {loading && (
          <div className="w-3 h-3 border-[1.5px] border-border2 border-t-accent rounded-full animate-spin shrink-0" />
        )}
      </div>

      {open && allResults.length > 0 && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 w-[320px] bg-white border border-border rounded-[var(--radius-sm)] shadow-[var(--shadow2)] max-h-[360px] overflow-y-auto z-[9999]">
          <div className="px-3 py-2 text-[9px] font-semibold text-text3 uppercase tracking-[0.06em] border-b border-border">
            {results?.total ?? 0} results
          </div>
          {allResults.map((r, i) => (
            <a
              key={`${r.type}-${r.id}-${i}`}
              href={`/tracking?lat=${r.lat}&lng=${r.lng}&zoom=10`}
              className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-bg2 transition-colors cursor-pointer no-underline border-b border-border last:border-b-0"
              onClick={() => setOpen(false)}
            >
              <span className="text-base mt-px">{typeIcon(r.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-text truncate">
                  {r.title}
                </div>
                <div className="text-[10.5px] text-text3 truncate">
                  {r.subtitle}
                </div>
              </div>
              <span className="text-[8px] font-semibold text-text3 bg-black/5 rounded px-1.5 py-0.5 mt-0.5 shrink-0">
                {typeLabel(r.type)}
              </span>
            </a>
          ))}
        </div>
      )}

      {open && query.length >= 2 && !loading && allResults.length === 0 && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-[280px] bg-white border border-border rounded-[var(--radius-sm)] shadow-[var(--shadow2)] px-4 py-6 text-center z-[9999]">
          <div className="text-text3 text-xs">No results for &ldquo;{query}&rdquo;</div>
        </div>
      )}
    </div>
  );
}
