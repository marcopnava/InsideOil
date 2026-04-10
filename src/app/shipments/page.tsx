"use client";

import { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Card } from "@/components/card";
import { DetailPanel, DetailRow } from "@/components/detail-panel";
import { AppShell } from "@/components/app-shell";

interface Vessel {
  id: string; name: string; imo: string; flag: string; cargo: string | null;
  status: string; speed: number | null; isDelayed: boolean; capacityTeu: number | null;
  departureAt: string | null; etaAt: string | null; progress: number | null;
  heading: number | null; lat: number | null; lng: number | null;
  delayReason: string | null;
  originPort: { name: string } | null; destPort: { name: string } | null;
}
interface VesselData { vessels: Vessel[]; stats: { total: number; delayed: number } }
interface AircraftData {
  cargo: Array<{ icao24: string; callsign: string | null; country: string; altitude: number | null; speed: number | null }>;
  stats: { total: number; cargo: number };
}

const statusCls: Record<string, string> = {
  IN_TRANSIT: "bg-black/5 text-text", ARRIVING: "bg-black/8 text-text",
  DELAYED: "bg-accent-soft2 text-accent", AT_PORT: "bg-black/4 text-text3",
};
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "---";

export default function ShipmentsPage() {
  const { data: sea } = useApi<VesselData>("/api/vessels", 30_000);
  const { data: air } = useApi<AircraftData>("/api/aircraft", 30_000);
  const [selected, setSelected] = useState<Vessel | null>(null);
  const [selectedAir, setSelectedAir] = useState<AircraftData["cargo"][0] | null>(null);

  return (
    <AppShell>
    <div className="animate-fade-in max-w-[1400px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
      <div className="mb-7">
        <h1 className="text-[30px] font-bold tracking-[-0.035em]">Shipments</h1>
        <p className="text-sm text-text3 mt-1">Full registry — click any row for details</p>
      </div>

      <Card title="Vessels" badge={{ text: String(sea?.vessels.length ?? 0) }}>
        <div className="scroll-x">
          <table className="w-full border-collapse">
            <thead><tr>
              {["IMO", "Vessel", "Route", "Status", "Cargo", "Departure", "ETA", "Capacity"].map(h => (
                <th key={h} className="text-[10px] font-semibold uppercase tracking-[0.07em] text-text3 text-left px-3.5 py-[9px] border-b border-border2">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {sea?.vessels.map(v => (
                <tr key={v.id} className="transition-colors hover:bg-bg2 cursor-pointer" onClick={() => { setSelected(v); setSelectedAir(null); }}>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border text-text2" style={{ fontFamily: "var(--font-jetbrains)" }}>{v.imo}</td>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border font-medium">{v.name}</td>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border">{v.originPort?.name ?? "?"} → {v.destPort?.name ?? "?"}</td>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border">
                    <span className={`inline-flex px-[9px] py-[3px] rounded-[20px] text-[10.5px] font-semibold ${statusCls[v.status] ?? ""}`}>{v.status.replace("_", " ")}</span>
                  </td>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border">{v.cargo || "---"}</td>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border text-text2" style={{ fontFamily: "var(--font-jetbrains)" }}>{fmtDate(v.departureAt)}</td>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border text-text2" style={{ fontFamily: "var(--font-jetbrains)" }}>{fmtDate(v.etaAt)}</td>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border text-text2" style={{ fontFamily: "var(--font-jetbrains)" }}>{v.capacityTeu ? v.capacityTeu.toLocaleString() + " TEU" : "---"}</td>
                </tr>
              ))}
              {!sea && <tr><td colSpan={8} className="text-center text-text3 text-xs py-8">Loading...</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Cargo Aircraft in Flight" badge={{ text: String(air?.stats.cargo ?? 0), variant: "dark" as const }} className="mt-3.5">
        <div className="scroll-x">
          <table className="w-full border-collapse">
            <thead><tr>
              {["Callsign", "ICAO", "Country", "Altitude", "Speed"].map(h => (
                <th key={h} className="text-[10px] font-semibold uppercase tracking-[0.07em] text-text3 text-left px-3.5 py-[9px] border-b border-border2">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {air?.cargo.slice(0, 20).map((a, i) => (
                <tr key={i} className="transition-colors hover:bg-bg2 cursor-pointer" onClick={() => { setSelectedAir(a); setSelected(null); }}>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border font-medium" style={{ fontFamily: "var(--font-jetbrains)" }}>{a.callsign || "---"}</td>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border text-text2" style={{ fontFamily: "var(--font-jetbrains)" }}>{a.icao24}</td>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border">{a.country}</td>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border text-text2" style={{ fontFamily: "var(--font-jetbrains)" }}>{a.altitude ? a.altitude.toLocaleString() + " ft" : "N/A"}</td>
                  <td className="text-[12.5px] px-3.5 py-[13px] border-b border-border text-text2" style={{ fontFamily: "var(--font-jetbrains)" }}>{a.speed ? a.speed + " kn" : "N/A"}</td>
                </tr>
              ))}
              {!air && <tr><td colSpan={5} className="text-center text-text3 text-xs py-8">Loading...</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Vessel Detail Panel */}
      <DetailPanel open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <>
            <div style={{ fontFamily: "var(--font-jetbrains)" }} className="text-[11px] text-text3">{selected.imo}</div>
            <h2 className="text-[20px] font-bold mt-1 tracking-[-0.02em]">{selected.name}</h2>
            <span className={`inline-flex px-[9px] py-[3px] rounded-[20px] text-[10.5px] font-semibold mt-2 ${statusCls[selected.status] ?? "bg-black/5 text-text"}`}>
              {selected.status.replace("_", " ")}
            </span>
            <div className="mt-5">
              <DetailRow label="Route" value={`${selected.originPort?.name ?? "?"} → ${selected.destPort?.name ?? "?"}`} />
              <DetailRow label="Flag" value={selected.flag} />
              <DetailRow label="Cargo" value={selected.cargo} />
              <DetailRow label="Capacity" value={selected.capacityTeu ? selected.capacityTeu.toLocaleString() + " TEU" : null} mono />
              <DetailRow label="Speed" value={selected.speed ? selected.speed + " kn" : null} mono />
              <DetailRow label="Heading" value={selected.heading ? Math.round(selected.heading) + "\u00b0" : null} mono />
              <DetailRow label="Position" value={selected.lat && selected.lng ? `${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}` : null} mono />
              <DetailRow label="Progress" value={selected.progress != null ? Math.round(selected.progress * 100) + "%" : null} mono />
              <DetailRow label="Departure" value={fmtDate(selected.departureAt)} mono />
              <DetailRow label="ETA" value={fmtDate(selected.etaAt)} mono />
              {selected.isDelayed && <DetailRow label="Delay Reason" value={selected.delayReason} accent />}
            </div>
          </>
        )}
      </DetailPanel>

      {/* Aircraft Detail Panel */}
      <DetailPanel open={!!selectedAir} onClose={() => setSelectedAir(null)}>
        {selectedAir && (
          <>
            <div style={{ fontFamily: "var(--font-jetbrains)" }} className="text-[11px] text-text3">{selectedAir.icao24} · Cargo</div>
            <h2 className="text-[20px] font-bold mt-1 tracking-[-0.02em]">{selectedAir.callsign || "Unknown"}</h2>
            <span className="inline-flex px-[9px] py-[3px] rounded-[20px] text-[10.5px] font-semibold mt-2 bg-accent-soft text-accent">
              Cargo Flight
            </span>
            <div className="mt-5">
              <DetailRow label="Callsign" value={selectedAir.callsign} mono />
              <DetailRow label="ICAO24" value={selectedAir.icao24} mono />
              <DetailRow label="Country" value={selectedAir.country} />
              <DetailRow label="Altitude" value={selectedAir.altitude ? selectedAir.altitude.toLocaleString() + " ft" : null} mono />
              <DetailRow label="Speed" value={selectedAir.speed ? selectedAir.speed + " kn" : null} mono />
            </div>
            <div className="mt-4 text-[9px] text-text3">Source: OpenSky Network API</div>
          </>
        )}
      </DetailPanel>
    </div>
    </AppShell>
  );
}
