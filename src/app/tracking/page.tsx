"use client";

import dynamic from "next/dynamic";
import { AppShell } from "@/components/app-shell";

// Leaflet must be loaded client-side only (no SSR)
const TrackingMap = dynamic(() => import("@/components/tracking-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100vh-var(--nav-h))] flex items-center justify-center bg-bg2">
      <div className="text-text3 text-sm flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-border2 border-t-accent rounded-full animate-spin" />
        Loading map...
      </div>
    </div>
  ),
});

export default function TrackingPage() {
  return <AppShell><TrackingMap /></AppShell>;
}
