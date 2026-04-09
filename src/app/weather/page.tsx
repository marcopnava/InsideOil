"use client";

import { useEffect, useRef, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { KPICard } from "@/components/kpi-card";
import { Card } from "@/components/card";
import { DetailPanel, DetailRow } from "@/components/detail-panel";
import { AppShell } from "@/components/app-shell";

interface WeatherPoint {
  lat: number;
  lng: number;
  label: string;
  waveHeight: number | null;
  wavePeriod: number | null;
  waveDirection: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  temperature: number | null;
}

interface WeatherData {
  points: WeatherPoint[];
  summary: {
    totalPoints: number;
    maxWaveHeight: number;
    maxWindSpeed: number;
    avgTemp: number | null;
    warnings: WeatherPoint[];
  };
}

function windDir(deg: number | null) {
  if (deg == null) return "";
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function sevColor(wave: number | null, wind: number | null): string {
  if ((wave ?? 0) > 3 || (wind ?? 0) > 50) return "text-accent";
  if ((wave ?? 0) > 2 || (wind ?? 0) > 35) return "text-amber-600";
  return "text-text";
}

export default function WeatherPage() {
  const { data: weather } = useApi<WeatherData>("/api/weather", 300_000);
  const [selected, setSelected] = useState<WeatherPoint | null>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [L, setL] = useState<typeof import("leaflet") | null>(null);

  // Dynamic import leaflet (client only)
  useEffect(() => {
    import("leaflet").then((mod) => {
      import("leaflet/dist/leaflet.css");
      setL(mod.default);
    });
  }, []);

  // Init map
  useEffect(() => {
    if (!L || !mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, {
      center: [30, 20],
      zoom: 2,
      minZoom: 2,
      maxZoom: 10,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [L]);

  // Add weather markers
  useEffect(() => {
    if (!L || !mapRef.current || !weather) return;
    const map = mapRef.current;

    weather.points.forEach((p) => {
      const wave = p.waveHeight ?? 0;
      const wind = p.windSpeed ?? 0;
      const isSevere = wave > 3 || wind > 50;
      const isModerate = wave > 2 || wind > 35;
      const color = isSevere ? "#e8590c" : isModerate ? "#d97706" : "#16a34a";
      const radius = isSevere ? 18 : isModerate ? 14 : 10;

      // Outer ring
      L.circleMarker([p.lat, p.lng], {
        radius: radius + 6,
        color,
        fillColor: color,
        fillOpacity: 0.08,
        weight: 1,
        opacity: 0.3,
      }).addTo(map);

      // Inner dot
      const marker = L.circleMarker([p.lat, p.lng], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.7,
        weight: 2,
      });

      marker.bindPopup(`
        <div style="padding:14px 16px;min-width:220px;font-family:system-ui,sans-serif">
          <div style="font-size:14px;font-weight:700">${p.label}</div>
          <div style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;margin-top:4px;background:${color}15;color:${color}">
            ${isSevere ? "Severe" : isModerate ? "Moderate" : "Calm"}
          </div>
          <div style="font-size:11.5px;margin-top:8px;padding-top:8px;border-top:1px solid #eee;display:grid;grid-template-columns:1fr 1fr;gap:6px">
            <div><span style="color:#888;font-size:10px">Waves</span><br><strong>${p.waveHeight?.toFixed(1) ?? "N/A"} m</strong></div>
            <div><span style="color:#888;font-size:10px">Period</span><br><strong>${p.wavePeriod?.toFixed(1) ?? "N/A"} s</strong></div>
            <div><span style="color:#888;font-size:10px">Wind</span><br><strong>${wind ? Math.round(wind) + " km/h" : "N/A"}</strong></div>
            <div><span style="color:#888;font-size:10px">Direction</span><br><strong>${p.windDirection != null ? Math.round(p.windDirection) + "° " + windDir(p.windDirection) : "N/A"}</strong></div>
            <div><span style="color:#888;font-size:10px">Temp</span><br><strong>${p.temperature?.toFixed(1) ?? "N/A"} °C</strong></div>
          </div>
          <div style="font-size:9px;color:#aaa;margin-top:8px;text-align:center">Open-Meteo Marine API</div>
        </div>
      `, { maxWidth: 260 });

      // Label
      const label = L.divIcon({
        className: "",
        html: `<div style="font-size:9px;font-weight:600;color:${color};white-space:nowrap;text-align:center;margin-top:${radius + 8}px;text-shadow:0 0 3px #fff,0 0 3px #fff">${p.label}</div>`,
        iconSize: [120, 30],
        iconAnchor: [60, -radius],
      });
      L.marker([p.lat, p.lng], { icon: label }).addTo(map);

      marker.addTo(map);
    });
  }, [L, weather]);

  return (
    <AppShell>
    <div className="animate-fade-in max-w-[1400px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
      <div className="mb-7">
        <h1 className="text-[30px] font-bold tracking-[-0.035em]">Maritime Weather</h1>
        <p className="text-sm text-text3 mt-1">
          Real-time weather at key maritime waypoints — Open-Meteo API (free, no key)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-[22px]">
        <KPICard label="Monitoring Points" value={weather?.summary.totalPoints ?? "..."} sub="key maritime waypoints" />
        <KPICard label="Max Wave Height" value={weather?.summary.maxWaveHeight != null ? weather.summary.maxWaveHeight.toFixed(1) + " m" : "..."} sub="across all points" trend={(weather?.summary.maxWaveHeight ?? 0) > 2.5 ? "up" : undefined} />
        <KPICard label="Max Wind Speed" value={weather?.summary.maxWindSpeed != null ? Math.round(weather.summary.maxWindSpeed) + " km/h" : "..."} sub="across all points" trend={(weather?.summary.maxWindSpeed ?? 0) > 40 ? "up" : undefined} />
        <KPICard label="Avg Temperature" value={weather?.summary.avgTemp != null ? weather.summary.avgTemp + " °C" : "..."} sub="sea surface average" />
      </div>

      {/* Map */}
      <Card title="Weather Map" badge={{ text: "Live" }} className="mb-[22px]">
        <div ref={mapEl} className="h-[420px] rounded-lg overflow-hidden" />
      </Card>

      {/* Table */}
      <Card title="All Maritime Waypoints" badge={{ text: "Live", variant: "dark" as const }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Location", "Waves", "Period", "Wind", "Dir", "Temp", "Status"].map((h) => (
                  <th key={h} className="text-[10px] font-semibold uppercase tracking-[0.07em] text-text3 text-left px-3.5 py-[9px] border-b border-border2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weather?.points.map((p) => {
                const isSevere = (p.waveHeight ?? 0) > 3 || (p.windSpeed ?? 0) > 50;
                const isMod = (p.waveHeight ?? 0) > 2 || (p.windSpeed ?? 0) > 35;
                return (
                  <tr key={p.label} className="transition-colors hover:bg-bg2 cursor-pointer" onClick={() => setSelected(p)}>
                    <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border font-medium">{p.label}</td>
                    <td className={`text-[12.5px] px-3.5 py-[13px] border-b border-border font-semibold ${sevColor(p.waveHeight, null)}`}>{p.waveHeight?.toFixed(1) ?? "N/A"} m</td>
                    <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border text-text2" style={{ fontFamily: "var(--font-jetbrains)" }}>{p.wavePeriod?.toFixed(1) ?? "N/A"} s</td>
                    <td className={`text-[12.5px] px-3.5 py-[13px] border-b border-border font-semibold ${sevColor(null, p.windSpeed)}`}>{p.windSpeed != null ? Math.round(p.windSpeed) + " km/h" : "N/A"}</td>
                    <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border text-text2" style={{ fontFamily: "var(--font-jetbrains)" }}>{p.windDirection != null ? `${Math.round(p.windDirection)}° ${windDir(p.windDirection)}` : "N/A"}</td>
                    <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)" }}>{p.temperature?.toFixed(1) ?? "N/A"} °C</td>
                    <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border">
                      <span className={`inline-flex px-[9px] py-[3px] rounded-[20px] text-[10.5px] font-semibold ${isSevere ? "bg-accent-soft2 text-accent" : isMod ? "bg-amber-100 text-amber-700" : "bg-black/5 text-text2"}`}>
                        {isSevere ? "Severe" : isMod ? "Moderate" : "Calm"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!weather && <tr><td colSpan={7} className="text-center text-text3 text-xs py-8">Fetching weather from 12 waypoints...</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Weather Detail Panel */}
      <DetailPanel open={!!selected} onClose={() => setSelected(null)}>
        {selected && (() => {
          const isSevere = (selected.waveHeight ?? 0) > 3 || (selected.windSpeed ?? 0) > 50;
          const isMod = (selected.waveHeight ?? 0) > 2 || (selected.windSpeed ?? 0) > 35;
          const statusLabel = isSevere ? "Severe" : isMod ? "Moderate" : "Calm";
          const statusCls = isSevere ? "bg-accent-soft2 text-accent" : isMod ? "bg-black/8 text-text" : "bg-black/4 text-text3";
          return (
            <>
              <div className="text-[11px] text-text3">Maritime Waypoint</div>
              <h2 className="text-[20px] font-bold mt-1 tracking-[-0.02em]">{selected.label}</h2>
              <span className={`inline-flex px-[9px] py-[3px] rounded-[20px] text-[10.5px] font-semibold mt-2 ${statusCls}`}>
                {statusLabel}
              </span>
              <div className="mt-5">
                <DetailRow label="Wave Height" value={selected.waveHeight?.toFixed(1) + " m"} mono accent={isSevere} />
                <DetailRow label="Wave Period" value={selected.wavePeriod?.toFixed(1) + " s"} mono />
                <DetailRow label="Wave Direction" value={selected.waveDirection != null ? Math.round(selected.waveDirection) + "\u00b0" : null} mono />
                <DetailRow label="Wind Speed" value={selected.windSpeed != null ? Math.round(selected.windSpeed) + " km/h" : null} mono accent={(selected.windSpeed ?? 0) > 40} />
                <DetailRow label="Wind Direction" value={selected.windDirection != null ? `${Math.round(selected.windDirection)}\u00b0 ${windDir(selected.windDirection)}` : null} mono />
                <DetailRow label="Temperature" value={selected.temperature?.toFixed(1) + " \u00b0C"} mono />
                <DetailRow label="Position" value={`${selected.lat.toFixed(3)}, ${selected.lng.toFixed(3)}`} mono />
              </div>
              <div className="mt-4 text-[9px] text-text3">Source: Open-Meteo Marine + Forecast API</div>
            </>
          );
        })()}
      </DetailPanel>
    </div>
    </AppShell>
  );
}
