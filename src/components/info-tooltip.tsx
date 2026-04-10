"use client";

import { useState } from "react";

interface InfoTooltipProps {
  text: string;
  size?: "xs" | "sm";
  className?: string;
}

/**
 * Small "i" icon next to a value. Hover (or focus) reveals an explanation.
 *
 * Usage:
 *   <span>BDTI <InfoTooltip text="Baltic Dirty Tanker Index — proxy of crude tanker freight rates..." /></span>
 */
export function InfoTooltip({ text, size = "xs", className = "" }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const dim = size === "xs" ? "w-3 h-3 text-[8px]" : "w-3.5 h-3.5 text-[9px]";

  return (
    <span
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="More info"
        className={`${dim} rounded-full bg-black/8 text-text2 font-bold inline-flex items-center justify-center cursor-help hover:bg-black/15 hover:text-text transition-colors ml-1 align-middle`}
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-[260px] p-3 bg-text text-white text-[11px] leading-[1.5] rounded-[var(--radius-xs)] shadow-[var(--shadow)] pointer-events-none"
          style={{ fontWeight: 400 }}
        >
          {text}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent"
            style={{ borderTopColor: "var(--color-text, #111)" }}
          />
        </span>
      )}
    </span>
  );
}
