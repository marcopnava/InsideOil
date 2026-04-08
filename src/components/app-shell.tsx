"use client";

import { Nav } from "./nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="pt-[var(--nav-h)] flex-1">{children}</main>
    </>
  );
}
