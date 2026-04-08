"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface AircraftMapData {
  cargo: (string | number)[][];
  other: number[][];
  counts: { total: number; cargo: number };
}
interface AISMapData {
  vessels: (string | number)[][];
  counts: { total: number; moving: number };
}
interface VesselData {
  vessels: Array<{
    id: string; name: string; imo: string; flag: string; cargo: string | null;
    status: string; speed: number | null; heading: number | null;
    lat: number | null; lng: number | null; progress: number | null;
    isDelayed: boolean; capacityTeu: number | null; etaAt: string | null;
    route: { waypoints: number[][]; originPort: { name: string; lat: number; lng: number }; destPort: { name: string; lat: number; lng: number } } | null;
    originPort: { name: string } | null; destPort: { name: string } | null;
  }>;
  stats: { total: number; delayed: number };
}

type Filter = "all" | "cargo-air" | "all-air" | "ships" | "ais-live" | "delayed";
const fmt = (n: number) => n.toLocaleString("en-US");

function shipSvgIcon(heading: number, color: string, size: number): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="transform:rotate(${heading}deg);filter:drop-shadow(0 1px 2px rgba(0,0,0,.2))"><path d="M12 2L8 8V16L4 20H20L16 16V8L12 2Z" fill="${color}" stroke="#fff" stroke-width="1"/></svg>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
}

function portIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<svg width="18" height="18" viewBox="0 0 24 24" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.2))"><circle cx="12" cy="12" r="10" fill="#fff" stroke="#111" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="#111"/><line x1="12" y1="2" x2="12" y2="6" stroke="#111" stroke-width="2"/><line x1="12" y1="18" x2="12" y2="22" stroke="#111" stroke-width="2"/><line x1="2" y1="12" x2="6" y2="12" stroke="#111" stroke-width="2"/><line x1="18" y1="12" x2="22" y2="12" stroke="#111" stroke-width="2"/></svg>`,
    iconSize: [18, 18], iconAnchor: [9, 9],
  });
}

export default function TrackingMap() {
  const mapRef = useRef<L.Map | null>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const cargoLayerRef = useRef<L.LayerGroup | null>(null);
  const otherAirLayerRef = useRef<L.LayerGroup | null>(null);
  const shipLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const aisLayerRef = useRef<L.LayerGroup | null>(null);

  const [filter, setFilter] = useState<Filter>("all");
  const [stats, setStats] = useState({ aircraft: 0, cargoAir: 0, ais: 0, aisMoving: 0, dbVessels: 0, delayed: 0 });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [fetchCount, setFetchCount] = useState(0);
  const [mapReady, setMapReady] = useState(false);

  // Init map + layers
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;

    const map = L.map(mapEl.current, {
      center: [25, 20], zoom: 3, minZoom: 2, maxZoom: 18,
      zoomControl: false, attributionControl: false,
      preferCanvas: false, // SVG = reliable clicks
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd", maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.attribution({ position: "bottomleft", prefix: "OpenSky | Digitraffic AIS | CartoDB" }).addTo(map);

    // Create layers AFTER map exists
    const cargo = L.layerGroup().addTo(map);
    const otherAir = L.layerGroup().addTo(map);
    const ship = L.layerGroup().addTo(map);
    const route = L.layerGroup().addTo(map);
    const ais = L.layerGroup().addTo(map);

    cargoLayerRef.current = cargo;
    otherAirLayerRef.current = otherAir;
    shipLayerRef.current = ship;
    routeLayerRef.current = route;
    aisLayerRef.current = ais;
    mapRef.current = map;
    setMapReady(true);

    return () => { map.remove(); mapRef.current = null; setMapReady(false); };
  }, []);

  // Fetch aircraft
  const fetchAircraft = useCallback(async () => {
    if (!cargoLayerRef.current || !otherAirLayerRef.current) return;
    try {
      const res = await fetch("/api/aircraft?mode=map");
      const json = await res.json();
      if (!json.success) return;
      const data: AircraftMapData = json.data;
      const cargoLayer = cargoLayerRef.current;
      const otherLayer = otherAirLayerRef.current;
      cargoLayer.clearLayers();
      otherLayer.clearLayers();

      for (const a of data.cargo) {
        const [lat, lng, heading, callsign, icao, country, alt, speed] = a;
        const m = L.circleMarker([lat as number, lng as number], {
          radius: 6, color: "#e8590c", fillColor: "#e8590c", fillOpacity: 0.85, weight: 2,
        });
        m.bindPopup(`<div style="padding:14px 16px;min-width:220px;font-family:system-ui,sans-serif">
          <div style="font-family:monospace;font-size:10px;color:#888">${icao} · Cargo Flight</div>
          <div style="font-size:14px;font-weight:700;margin-top:2px">${callsign || "Unknown"}</div>
          <div style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;margin-top:4px;background:rgba(232,89,12,.08);color:#e8590c">Cargo</div>
          <div style="font-size:11px;margin-top:6px;padding-top:6px;border-top:1px solid #eee;color:#555">
            Country: ${country}<br>Altitude: ${alt ? Number(alt).toLocaleString() + " ft" : "N/A"}<br>Speed: ${speed ? speed + " kn" : "N/A"}<br>Heading: ${heading ? Math.round(heading as number) + "\u00b0" : "N/A"}
          </div></div>`, { maxWidth: 240 });
        cargoLayer.addLayer(m);
      }

      // Skip rendering "other aircraft" dots — they're non-interactive and slow down the map
      // The count is still shown in stats

      setStats(s => ({ ...s, aircraft: data.counts.total, cargoAir: data.counts.cargo }));
      setLastUpdate(new Date());
      setFetchCount(c => c + 1);
    } catch { /* */ }
  }, []);

  // Fetch AIS
  const fetchAIS = useCallback(async () => {
    if (!aisLayerRef.current) return;
    try {
      const res = await fetch("/api/ais?mode=map");
      const json = await res.json();
      if (!json.success) return;
      const data: AISMapData = json.data;
      const layer = aisLayerRef.current;
      layer.clearLayers();

      for (const v of data.vessels) {
        const [lat, lng, , speed, shipType, mmsi, name, destination] = v;
        const st = shipType as number;
        let color = "#bbb"; let typeName = "Other"; let radius = 5;
        if (st >= 70 && st <= 79) { color = "#111"; typeName = "Cargo"; radius = 7; }
        if (st >= 80 && st <= 89) { color = "#555"; typeName = "Tanker"; radius = 6; }
        if (st >= 60 && st <= 69) { color = "#888"; typeName = "Passenger"; radius = 6; }

        const m = L.circleMarker([lat as number, lng as number], {
          radius, color, fillColor: color, fillOpacity: 0.7, weight: st >= 60 && st <= 89 ? 1.5 : 0,
        });
        const vesselName = String(name || "") || typeName;
        const dest = String(destination || "") || "N/A";
        m.bindPopup(`<div style="padding:12px 14px;min-width:210px;font-family:system-ui,sans-serif">
          <div style="font-family:monospace;font-size:10px;color:#888">MMSI ${mmsi} · AIS</div>
          <div style="font-size:14px;font-weight:700;margin-top:2px">${vesselName}</div>
          <div style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;margin-top:4px;background:rgba(0,0,0,.05);color:${color}">${typeName}</div>
          <div style="font-size:11px;margin-top:6px;padding-top:6px;border-top:1px solid #eee;color:#555">
            Speed: ${(speed as number).toFixed(1)} kn<br>Destination: ${dest}<br>Position: ${(lat as number).toFixed(4)}, ${(lng as number).toFixed(4)}
          </div>
          <div style="font-size:9px;color:#aaa;margin-top:6px">Digitraffic AIS</div></div>`, { maxWidth: 240 });
        layer.addLayer(m);
      }

      setStats(s => ({ ...s, ais: data.counts.total, aisMoving: data.counts.moving }));
      setLastUpdate(new Date());
    } catch { /* */ }
  }, []);

  // Fetch DB vessels
  const fetchVessels = useCallback(async () => {
    if (!shipLayerRef.current || !routeLayerRef.current) return;
    try {
      const res = await fetch("/api/vessels");
      const json = await res.json();
      if (!json.success) return;
      const data: VesselData = json.data;
      const sLayer = shipLayerRef.current;
      const rLayer = routeLayerRef.current;
      sLayer.clearLayers(); rLayer.clearLayers();

      for (const v of data.vessels) {
        if (v.lat == null || v.lng == null) continue;
        if (v.route) {
          const wps: [number, number][] = [[v.route.originPort.lat, v.route.originPort.lng], ...(v.route.waypoints as number[][]).map(w => [w[1], w[0]] as [number, number]), [v.route.destPort.lat, v.route.destPort.lng]];
          rLayer.addLayer(L.polyline(wps, { color: v.isDelayed ? "#e8590c" : "#111", weight: 1.5, opacity: v.isDelayed ? 0.35 : 0.15, dashArray: "6,4" }));
          [v.route.originPort, v.route.destPort].forEach(port => {
            const pm = L.marker([port.lat, port.lng], { icon: portIcon() });
            pm.bindPopup(`<div style="padding:12px 14px;font-family:system-ui,sans-serif"><div style="font-size:14px;font-weight:700">${port.name}</div><div style="font-size:10px;color:#888;margin-top:2px">Port</div></div>`);
            rLayer.addLayer(pm);
          });
        }
        if (v.isDelayed) {
          sLayer.addLayer(L.circleMarker([v.lat, v.lng], { radius: 16, color: "#e8590c", fillColor: "#e8590c", fillOpacity: 0.1, weight: 1, opacity: 0.3 }));
        }
        const color = v.isDelayed ? "#e8590c" : "#111";
        const m = L.marker([v.lat, v.lng], { icon: shipSvgIcon(v.heading ?? 0, color, 22) });
        const eta = v.etaAt ? new Date(v.etaAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "N/A";
        m.bindPopup(`<div style="padding:14px 16px;min-width:250px;font-family:system-ui,sans-serif">
          <div style="font-family:monospace;font-size:10px;color:#888">${v.imo} · ${v.flag}</div>
          <div style="font-size:15px;font-weight:700;margin-top:2px">${v.name}</div>
          <div style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;margin-top:4px;background:${v.isDelayed ? "rgba(232,89,12,.08)" : "rgba(0,0,0,.05)"};color:${color}">${v.status.replace("_", " ")}</div>
          <div style="font-size:11px;margin-top:8px;padding-top:8px;border-top:1px solid #eee;color:#555">
            Route: ${v.originPort?.name ?? "?"} → ${v.destPort?.name ?? "?"}<br>
            Cargo: ${v.cargo ?? "N/A"} · ${v.capacityTeu ? fmt(v.capacityTeu) + " TEU" : ""}<br>
            Speed: ${v.speed ?? "?"} kn · ETA: ${eta}<br>
            Progress: ${v.progress != null ? Math.round(v.progress * 100) + "%" : "N/A"}
          </div></div>`, { maxWidth: 280 });
        sLayer.addLayer(m);
      }
      setStats(s => ({ ...s, dbVessels: data.stats.total, delayed: data.stats.delayed }));
    } catch { /* */ }
  }, []);

  // Start fetching when map is ready
  useEffect(() => {
    if (!mapReady) return;
    fetchAircraft(); fetchAIS(); fetchVessels();
    const t1 = setInterval(fetchAircraft, 15_000);
    const t2 = setInterval(fetchAIS, 30_000);
    const t3 = setInterval(fetchVessels, 60_000);
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); };
  }, [mapReady, fetchAircraft, fetchAIS, fetchVessels]);

  // Filter
  const applyFilter = useCallback((f: Filter) => {
    const map = mapRef.current; if (!map) return;
    const cl = cargoLayerRef.current, ol = otherAirLayerRef.current, sl = shipLayerRef.current, rl = routeLayerRef.current, al = aisLayerRef.current;
    if (!cl || !ol || !sl || !rl || !al) return;
    const show = (l: L.LayerGroup, v: boolean) => v ? map.addLayer(l) : map.removeLayer(l);
    switch (f) {
      case "all": show(cl,true);show(ol,true);show(sl,true);show(rl,true);show(al,true);break;
      case "cargo-air": show(cl,true);show(ol,false);show(sl,false);show(rl,false);show(al,false);break;
      case "all-air": show(cl,true);show(ol,true);show(sl,false);show(rl,false);show(al,false);break;
      case "ships": show(cl,false);show(ol,false);show(sl,true);show(rl,true);show(al,true);break;
      case "ais-live": show(cl,false);show(ol,false);show(sl,false);show(rl,false);show(al,true);map.flyTo([60.5,24.5],6,{duration:1.2});break;
      case "delayed": show(cl,false);show(ol,false);show(sl,true);show(rl,true);show(al,false);break;
    }
  }, []);
  useEffect(() => { applyFilter(filter); }, [filter, applyFilter]);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" }, { key: "cargo-air", label: "Cargo Flights" },
    { key: "all-air", label: "All Aircraft" }, { key: "ships", label: "Vessels" },
    { key: "ais-live", label: "AIS Live" }, { key: "delayed", label: "Delayed" },
  ];
  const elapsed = lastUpdate ? Math.round((Date.now() - lastUpdate.getTime()) / 1000) : null;

  return (
    <div className="relative h-[calc(100vh-var(--nav-h))]">
      <div ref={mapEl} className="w-full h-full z-[1]" />

      <div className="absolute top-4 left-4 z-[900]">
        <div className="bg-white/92 backdrop-blur-[16px] rounded-[var(--radius-sm)] p-[14px_16px] border border-border shadow-[var(--shadow)]">
          <h3 className="text-[11px] font-bold mb-2">InsideOil — Live</h3>
          <div className="flex flex-col gap-1">
            {[
              { color: "#e8590c", label: `Cargo Aircraft (${fmt(stats.cargoAir)})` },
              { color: "#bbb", label: `All Aircraft (${fmt(stats.aircraft)})` },
              { color: "#111", label: "AIS Cargo" },
              { color: "#555", label: "AIS Tanker" },
              { color: "#888", label: "AIS Passenger" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-[6px] text-[10px] text-text2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                {item.label}
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-border text-[9px] text-text3">Click any dot for details</div>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-[900] flex gap-2 max-md:flex-col">
        {[
          { label: "Aircraft", value: fmt(stats.aircraft), sub: "OpenSky" },
          { label: "AIS Vessels", value: fmt(stats.ais), sub: `${fmt(stats.aisMoving)} moving` },
          { label: "Delayed", value: String(stats.delayed), accent: true },
        ].map((s) => (
          <div key={s.label} className="bg-white/92 backdrop-blur-[16px] rounded-[var(--radius-sm)] p-[10px_14px] border border-border shadow-[var(--shadow)] min-w-[100px] text-center">
            <div className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em]">{s.label}</div>
            <div className={`text-[20px] font-bold mt-px tracking-[-0.02em] ${"accent" in s && s.accent ? "text-accent" : "text-text"}`}>{s.value}</div>
            {"sub" in s && s.sub && <div className="text-[8px] text-text3">{s.sub}</div>}
          </div>
        ))}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[900] flex gap-[5px] bg-white/92 backdrop-blur-[16px] rounded-[24px] p-[5px_7px] border border-border shadow-[var(--shadow2)]">
        {filters.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3.5 py-[5px] rounded-[18px] text-[11px] font-semibold border-none cursor-pointer transition-all whitespace-nowrap ${filter === f.key ? "bg-text text-white" : "bg-transparent text-text3 hover:text-text hover:bg-black/4"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="absolute bottom-6 right-4 z-[900] bg-white/92 backdrop-blur-[16px] rounded-[var(--radius-sm)] px-3 py-2 border border-border shadow-[var(--shadow)] text-[10px]">
        <div className="flex items-center gap-[5px] font-semibold text-text">
          <span className="w-[6px] h-[6px] rounded-full bg-[#16a34a] shrink-0" style={{ animation: "pulse 2s infinite" }} />
          Real-time active
        </div>
        <div className="text-text3 mt-1" style={{ fontFamily: "var(--font-jetbrains)", fontSize: 9 }}>
          {elapsed !== null && <span>Updated {elapsed}s ago · #{fetchCount}</span>}
          <br />{fmt(stats.aircraft)} aircraft + {fmt(stats.ais)} AIS
        </div>
      </div>
    </div>
  );
}
