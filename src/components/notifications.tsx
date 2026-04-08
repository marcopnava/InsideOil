"use client";

import { useState, useRef, useEffect } from "react";
import { useApi } from "@/hooks/use-api";

interface Notification {
  id: string;
  type: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  timestamp: string;
  source: string;
}

const sevIcon: Record<string, string> = {
  critical: "!",
  warning: "!",
  info: "i",
};
const sevBg: Record<string, string> = {
  critical: "bg-accent text-white",
  warning: "bg-amber-500 text-white",
  info: "bg-text3 text-white",
};
const sevBorder: Record<string, string> = {
  critical: "border-l-accent",
  warning: "border-l-amber-500",
  info: "border-l-border2",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: notifications } = useApi<Notification[]>("/api/notifications", 15_000);

  const critCount = notifications?.filter((n) => n.severity === "critical" || n.severity === "warning").length ?? 0;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 rounded-[var(--radius-xs)] flex items-center justify-center hover:bg-black/5 transition-colors cursor-pointer border-none bg-transparent"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text3">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {critCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-[14px] h-[14px] rounded-full bg-accent text-white text-[8px] font-bold flex items-center justify-center">
            {critCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-[calc(100%+8px)] right-0 w-[340px] bg-white border border-border rounded-[var(--radius-sm)] shadow-[var(--shadow2)] max-h-[420px] overflow-y-auto z-[9999]">
          <div className="px-4 py-3 border-b border-border flex justify-between items-center">
            <span className="text-[12px] font-semibold">Notifications</span>
            <span className="text-[10px] text-text3">{notifications?.length ?? 0} active</span>
          </div>
          {notifications?.map((n) => (
            <div
              key={n.id}
              className={`px-4 py-3 border-b border-border last:border-b-0 border-l-[3px] ${sevBorder[n.severity]} hover:bg-bg2 transition-colors`}
            >
              <div className="flex items-start gap-2.5">
                <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-px ${sevBg[n.severity]}`}>
                  {sevIcon[n.severity]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-text">{n.title}</div>
                  <div className="text-[10.5px] text-text2 mt-px">{n.description}</div>
                  <div className="text-[9px] text-text3 mt-1">{n.source}</div>
                </div>
              </div>
            </div>
          ))}
          {(!notifications || notifications.length === 0) && (
            <div className="px-4 py-8 text-center text-text3 text-xs">No notifications</div>
          )}
        </div>
      )}
    </div>
  );
}
