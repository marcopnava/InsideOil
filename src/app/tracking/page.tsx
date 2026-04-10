"use client";

import dynamic from "next/dynamic";
import { AppShell } from "@/components/app-shell";
import { PageHelp } from "@/components/page-help";

const TRACKING_HELP = {
  title: "Live Map — what am I looking at?",
  intro:
    "Real-time global map of vessels and aircraft. Vessel positions come from AISStream (terrestrial AIS), aircraft from OpenSky Network.",
  sections: [
    {
      title: "Map markers",
      body: [
        "Green dots = cargo aircraft (FedEx, UPS, Cargolux, etc.) currently in flight.",
        "Blue/grey dots = passenger and other aircraft.",
        "Tanker icons = oil tankers (AIS shipType 80-89), color-coded by speed.",
        "Cargo ship icons = container/bulk carriers.",
      ],
    },
    {
      title: "How to use",
      body: [
        "Zoom into a region (Mediterranean, US Gulf, Singapore) to see individual ships.",
        "Click any marker to see its callsign / MMSI / destination.",
        "The map auto-refreshes every 15-30 seconds.",
      ],
    },
    {
      title: "Coverage limits",
      body: [
        "AIS: best in EU / US / East Asia. Persian Gulf, Red Sea, West Africa, Indian Ocean are sparse on the free data plan.",
        "Aircraft: global, but altitude < 1000ft are filtered out (landings/takeoffs noise).",
      ],
    },
  ],
};

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
  return (
    <AppShell>
      <PageHelp {...TRACKING_HELP} />
      <TrackingMap />
    </AppShell>
  );
}
