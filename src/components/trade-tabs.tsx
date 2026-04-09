"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const tabs = [
  { href: "/trade", label: "Signals" },
  { href: "/trade/desk", label: "Operations" },
  { href: "/trade/decision", label: "Decision" },
  { href: "/trade/proposal", label: "Proposal" },
];

export function TradeTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-[2px] mt-4 overflow-x-auto pb-1 -mx-1 px-1">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`px-3 sm:px-4 py-[7px] rounded-[var(--radius-xs)] text-[11px] sm:text-[12px] font-semibold no-underline transition-all whitespace-nowrap shrink-0 ${
            pathname === t.href
              ? "bg-text text-white"
              : "bg-black/5 text-text2 hover:bg-black/8 hover:text-text"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
