"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { SearchBar } from "./search-bar";
import { NotificationBell } from "./notifications";

const clientLinks = [
  { href: "/dashboard", label: "Command Center" },
  { href: "/briefing", label: "Briefing" },
  { href: "/tracking", label: "Live Map" },
  { href: "/trade", label: "Trade" },
  { href: "/ports", label: "Ports" },
  { href: "/weather", label: "Weather" },
  { href: "/news", label: "News" },
];

const adminLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/data-status", label: "Data Status" },
  { href: "/admin/metrics", label: "Metrics & Revenue" },
  { href: "/admin/content", label: "Content Generator" },
];

export function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";
  const links = isAdmin ? adminLinks : clientLinks;
  const [time, setTime] = useState("");

  useEffect(() => {
    function tick() {
      const d = new Date();
      setTime(
        d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
        " — " +
        d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 h-[var(--nav-h)] bg-white/78 backdrop-blur-[24px] backdrop-saturate-[180%] border-b border-border z-[1000] flex items-center px-8 gap-3">
      <Link
        href={isAdmin ? "/admin" : "/dashboard"}
        className="font-bold text-[17px] tracking-[-0.03em] flex items-center gap-2 text-text no-underline shrink-0"
      >
        <svg viewBox="0 0 26 26" fill="none" className="w-[24px] h-[24px]">
          <rect width="26" height="26" rx="6.5" fill="currentColor" />
          <circle cx="8" cy="13" r="2.2" fill="#fff" />
          <circle cx="18" cy="13" r="2.2" fill="#fff" />
          <line x1="10.2" y1="13" x2="15.8" y2="13" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span className="hidden lg:inline">InsideOil</span>
        {isAdmin && <span className="text-[9px] font-bold text-accent bg-accent-soft px-1.5 py-[1px] rounded-full">ADMIN</span>}
      </Link>

      <div className="hidden md:flex gap-[2px] shrink-0">
        {links.map((l) => {
          const active = pathname === l.href || (l.href !== "/admin" && pathname.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-2.5 py-[6px] rounded-[var(--radius-xs)] text-[11.5px] font-medium transition-all no-underline whitespace-nowrap ${
                active ? "text-accent bg-accent-soft" : "text-text3 hover:text-text hover:bg-black/4"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        {!isAdmin && (
          <div className="hidden sm:block">
            <SearchBar />
          </div>
        )}
        {!isAdmin && <NotificationBell />}
        <div className="flex items-center gap-[6px] text-[11px] text-text3 font-medium shrink-0">
          <span className="w-[6px] h-[6px] rounded-full bg-accent" style={{ animation: "pulse 2s infinite" }} />
          Live
        </div>
        <div className="text-[11px] text-text3 shrink-0 hidden lg:block" style={{ fontFamily: "var(--font-jetbrains)" }}>
          {time}
        </div>
        <span className="text-[10px] text-text3 hidden sm:inline">{session?.user?.email}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-[11px] text-text3 hover:text-accent cursor-pointer bg-transparent border-none shrink-0 font-medium"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
