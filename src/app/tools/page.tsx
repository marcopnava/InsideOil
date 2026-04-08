const tools = [
  { abbr: "OS", name: "OpenSky Network API", desc: "Free real-time aircraft tracking via ADS-B transponders. Returns position, altitude, speed, heading for every aircraft worldwide. Used in this platform.", tag: "free" },
  { abbr: "LF", name: "Leaflet + OpenStreetMap", desc: "Fully open-source interactive mapping. CartoDB Positron tiles for clean basemap. Zero cost, unlimited usage.", tag: "free" },
  { abbr: "PG", name: "PostgreSQL + Prisma", desc: "Production-grade relational database with type-safe ORM. Handles vessel tracking, snapshots, alerts, and all platform data.", tag: "free" },
  { abbr: "NX", name: "Next.js 16 (App Router)", desc: "Full-stack React framework. Server components, API routes, SSE, and edge functions — all from one codebase.", tag: "free" },
  { abbr: "PH", name: "Prophet (Meta)", desc: "Open-source time-series forecasting. Handles seasonality, trends, and holidays automatically. Ideal for shipment volume predictions.", tag: "free" },
  { abbr: "XG", name: "XGBoost / LightGBM", desc: "Gradient boosting for predictions with exogenous variables (weather, fuel prices, macro indices).", tag: "free" },
  { abbr: "MT", name: "MarineTraffic API", desc: "Real-time vessel tracking via AIS. Free tier limited; paid plans from ~$9/mo for full global AIS coverage.", tag: "paid" },
  { abbr: "AB", name: "ADS-B Exchange", desc: "Unfiltered aircraft data feed. Community-funded alternative to OpenSky with no military filtering.", tag: "free" },
  { abbr: "OR", name: "Google OR-Tools", desc: "Open-source solver for route optimization (Vehicle Routing Problem), warehouse allocation, and scheduling.", tag: "free" },
  { abbr: "KF", name: "Apache Kafka", desc: "Open-source message broker for real-time data ingestion from sensors, GPS, and carrier APIs.", tag: "free" },
  { abbr: "SU", name: "Apache Superset", desc: "Open-source BI dashboard for KPI visualization, trends, and reports. Free alternative to Tableau.", tag: "free" },
  { abbr: "DK", name: "Docker + Railway", desc: "Containerization + hosting. Railway offers generous free tiers for deploying full-stack applications.", tag: "free" },
  { abbr: "DT", name: "Digitraffic AIS", desc: "Free real-time AIS vessel data from Finnish Transport Agency. 18,000+ vessels in Baltic Sea. No API key.", tag: "free" },
  { abbr: "OM", name: "Open-Meteo", desc: "Free weather and marine API. Wave height, wind speed, temperature at any coordinate. No API key required.", tag: "free" },
];

import { AppShell } from "@/components/app-shell";

export default function ToolsPage() {
  return (
    <AppShell>
    <div className="animate-fade-in max-w-[1400px] mx-auto p-7 px-8 pb-14">
      <div className="mb-7">
        <h1 className="text-[30px] font-bold tracking-[-0.035em]">
          Tech Stack & Free APIs
        </h1>
        <p className="text-sm text-text3 mt-1">
          Every tool powering this platform — nearly all open-source and free
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {tools.map((t) => (
          <div
            key={t.name}
            className="bg-bg3 border border-border rounded-[var(--radius)] p-6 transition-all hover:shadow-[var(--shadow2)] hover:-translate-y-px"
          >
            <div className="w-11 h-11 rounded-[11px] flex items-center justify-center text-[13px] font-bold mb-3.5 bg-bg2 text-text3 tracking-tight">
              {t.abbr}
            </div>
            <h3 className="text-[15px] font-semibold mb-[5px]">{t.name}</h3>
            <p className="text-[12.5px] text-text2 leading-[1.5]">{t.desc}</p>
            <span
              className={`inline-block text-[9.5px] font-semibold px-2 py-[3px] rounded-xl mt-2.5 uppercase tracking-[0.05em] ${
                t.tag === "free"
                  ? "bg-black/5 text-text2"
                  : "bg-accent-soft text-accent"
              }`}
            >
              {t.tag === "free" ? "Free" : "Freemium"}
            </span>
          </div>
        ))}
      </div>
    </div>
    </AppShell>
  );
}
