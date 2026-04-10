"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { SearchBar } from "./search-bar";
import { NotificationBell } from "./notifications";

interface NavLink {
  href: string;
  label: string;
}
interface NavGroup {
  label: string;
  children: NavLink[];
}
type NavItem = NavLink | NavGroup;

function isGroup(i: NavItem): i is NavGroup {
  return (i as NavGroup).children !== undefined;
}

const clientLinks: NavItem[] = [
  { href: "/dashboard", label: "Command Center" },
  { href: "/briefing", label: "Briefing" },
  { href: "/tracking", label: "Live Map" },
  { href: "/trade", label: "Trade" },
  { href: "/signals", label: "Signals" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/calendar", label: "Calendar" },
  { href: "/ports", label: "Ports" },
  { href: "/news", label: "News" },
  {
    label: "More",
    children: [
      { href: "/weather", label: "Weather" },
      { href: "/differentials", label: "Differentials & Macro" },
      { href: "/russia", label: "Russia Tracker" },
    ],
  },
  { href: "/education", label: "Education" },
  { href: "/settings", label: "Settings" },
];

const adminLinks: NavItem[] = [
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) setOpenDropdown(null);
    }
    if (openDropdown) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openDropdown]);

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
    <>
      <nav className="fixed top-0 left-0 right-0 h-[var(--nav-h)] bg-white/78 backdrop-blur-[24px] backdrop-saturate-[180%] border-b border-border z-[1000] flex items-center px-4 sm:px-6 md:px-8 gap-3">
        {/* Hamburger button — mobile only */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex flex-col gap-[4px] p-1.5 -ml-1 cursor-pointer bg-transparent border-none shrink-0"
          aria-label="Menu"
        >
          <span className={`block w-[18px] h-[1.5px] bg-text transition-all ${mobileOpen ? "rotate-45 translate-y-[5.5px]" : ""}`} />
          <span className={`block w-[18px] h-[1.5px] bg-text transition-all ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block w-[18px] h-[1.5px] bg-text transition-all ${mobileOpen ? "-rotate-45 -translate-y-[5.5px]" : ""}`} />
        </button>

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

        {/* Desktop nav links */}
        <div className="hidden md:flex gap-[2px] shrink-0 relative" ref={dropdownRef}>
          {links.map((l) => {
            if (isGroup(l)) {
              const hasActive = l.children.some(
                (c) => pathname === c.href || pathname.startsWith(c.href)
              );
              const open = openDropdown === l.label;
              return (
                <div key={l.label} className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(open ? null : l.label)}
                    className={`px-2.5 py-[6px] rounded-[var(--radius-xs)] text-[11.5px] font-medium transition-all whitespace-nowrap cursor-pointer inline-flex items-center gap-1 ${
                      hasActive || open
                        ? "text-accent bg-accent-soft"
                        : "text-text3 hover:text-text hover:bg-black/4"
                    }`}
                  >
                    {l.label}
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 8 8"
                      className={`transition-transform ${open ? "rotate-180" : ""}`}
                    >
                      <path d="M1 2 L4 6 L7 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {open && (
                    <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-bg3 border border-border rounded-[var(--radius)] shadow-[var(--shadow)] p-1 flex flex-col">
                      {l.children.map((c) => {
                        const childActive = pathname === c.href || pathname.startsWith(c.href);
                        return (
                          <Link
                            key={c.href}
                            href={c.href}
                            onClick={() => setOpenDropdown(null)}
                            className={`px-3 py-2 rounded-[var(--radius-xs)] text-[12px] font-medium no-underline transition-colors ${
                              childActive
                                ? "text-accent bg-accent-soft"
                                : "text-text2 hover:text-text hover:bg-black/5"
                            }`}
                          >
                            {c.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

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

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[999] md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="absolute top-[var(--nav-h)] left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-border shadow-lg p-4 flex flex-col gap-1 max-h-[calc(100vh-var(--nav-h))] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {links.map((l) => {
              if (isGroup(l)) {
                return (
                  <div key={l.label}>
                    <div className="px-4 py-2 text-[10px] font-bold text-text3 uppercase tracking-[0.07em]">
                      {l.label}
                    </div>
                    {l.children.map((c) => {
                      const active = pathname === c.href || pathname.startsWith(c.href);
                      return (
                        <Link
                          key={c.href}
                          href={c.href}
                          className={`pl-6 pr-4 py-3 rounded-[var(--radius-xs)] text-[14px] font-medium no-underline transition-all block ${
                            active ? "text-accent bg-accent-soft" : "text-text2 hover:bg-black/4"
                          }`}
                        >
                          {c.label}
                        </Link>
                      );
                    })}
                  </div>
                );
              }
              const active = pathname === l.href || (l.href !== "/admin" && pathname.startsWith(l.href));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-4 py-3 rounded-[var(--radius-xs)] text-[14px] font-medium no-underline transition-all ${
                    active ? "text-accent bg-accent-soft" : "text-text2 hover:bg-black/4"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <div className="border-t border-border mt-2 pt-3 px-4">
              <span className="text-[11px] text-text3">{session?.user?.email}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
