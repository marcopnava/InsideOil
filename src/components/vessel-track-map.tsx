"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  positions: Array<{ lat: number; lng: number; t: string; speed: number | null }>;
  current: { lat: number; lng: number; name: string };
}

export default function VesselTrackMap({ positions, current }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      preferCanvas: true,
    }).setView([current.lat, current.lng], 5);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      maxZoom: 18,
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [current.lat, current.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // clear any previous layers except base tiles
    map.eachLayer((layer) => {
      if (layer instanceof L.Polyline || layer instanceof L.CircleMarker || layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    if (positions.length >= 2) {
      const latlngs: [number, number][] = positions.map((p) => [p.lat, p.lng]);
      const line = L.polyline(latlngs, {
        color: "#e8590c",
        weight: 3,
        opacity: 0.9,
      }).addTo(map);
      // small dot at every sample
      positions.forEach((p, i) => {
        if (i % 3 !== 0 && i !== positions.length - 1) return;
        L.circleMarker([p.lat, p.lng], {
          radius: 2.5,
          color: "#e8590c",
          fillColor: "#e8590c",
          fillOpacity: 0.8,
          weight: 0,
        }).addTo(map);
      });
      map.fitBounds(line.getBounds(), { padding: [40, 40], maxZoom: 9 });
    }

    // current position marker
    L.circleMarker([current.lat, current.lng], {
      radius: 8,
      color: "#000",
      fillColor: "#000",
      fillOpacity: 1,
      weight: 2,
    })
      .bindTooltip(current.name, { permanent: false, direction: "top" })
      .addTo(map);
  }, [positions, current]);

  return <div ref={containerRef} className="h-[440px] rounded-[var(--radius-xs)] overflow-hidden" />;
}
