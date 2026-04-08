"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/card";
import { AppShell } from "@/components/app-shell";

function generateData(len: number, base: number, amp: number, noise: number) {
  return Array.from({ length: len }, (_, i) =>
    base + Math.sin(i * 0.4) * amp + Math.random() * noise
  );
}

function makeLine(
  el: HTMLDivElement,
  data: number[],
  color: string,
  h: number,
  fc = false,
  fcStart = 0
) {
  const w = el.clientWidth || 600;
  const max = Math.max(...data) * 1.12;
  const min = Math.min(...data) * 0.88;
  const pts = data.map((v, i) => ({
    x: 38 + (i * (w - 56)) / (data.length - 1),
    y: h - 28 - ((v - min) / (max - min)) * (h - 48),
  }));

  let svg = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:100%">`;
  for (let i = 0; i < 5; i++) {
    const y = 18 + (i * (h - 46)) / 4;
    const v = Math.round(max - ((max - min) * i) / 4);
    svg += `<line x1="38" y1="${y}" x2="${w - 18}" y2="${y}" stroke="rgba(0,0,0,.04)" stroke-dasharray="4,4"/>`;
    svg += `<text x="32" y="${y + 3.5}" text-anchor="end" style="font-size:9px;fill:#888;font-family:monospace">${v}</text>`;
  }

  if (fc && fcStart > 0) {
    const rp = pts.slice(0, fcStart + 1);
    const rl = rp.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
    svg += `<path d="${rl} L${rp[rp.length - 1].x},${h - 28} L${rp[0].x},${h - 28} Z" fill="${color}" opacity=".05"/>`;
    svg += `<path d="${rl}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    rp.forEach((p) => { svg += `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${color}"/>`; });
    const fp = pts.slice(fcStart);
    const fl = fp.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
    svg += `<path d="${fl}" fill="none" stroke="#e8590c" stroke-width="2" stroke-dasharray="6,3" opacity=".7"/>`;
    fp.forEach((p) => {
      svg += `<rect x="${p.x - 3}" y="${p.y - 10}" width="6" height="20" rx="3" fill="#e8590c" opacity=".06"/>`;
      svg += `<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="#fff" stroke="#e8590c" stroke-width="1.5"/>`;
    });
  } else {
    const line = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
    svg += `<path d="${line} L${pts[pts.length - 1].x},${h - 28} L${pts[0].x},${h - 28} Z" fill="${color}" opacity=".04"/>`;
    svg += `<path d="${line}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    pts.forEach((p) => { svg += `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${color}"/>`; });
  }

  svg += `</svg>`;
  el.innerHTML = svg;
}

const volData = generateData(30, 42, 12, 8);
const scfiData = generateData(24, 1800, 400, 200);

const routes = [
  { r: "Shanghai \u2192 Rotterdam", p: 32 },
  { r: "Mumbai \u2192 Genoa", p: 21 },
  { r: "Santos \u2192 Hamburg", p: 18 },
  { r: "LA \u2192 Tokyo", p: 12 },
  { r: "Singapore \u2192 Dubai", p: 8 },
];

export default function ForecastPage() {
  const [days, setDays] = useState(7);
  const fcRef = useRef<HTMLDivElement>(null);
  const scfiRef = useRef<HTMLDivElement>(null);

  const drawCharts = useCallback(() => {
    if (fcRef.current) {
      const fc = [...volData];
      const start = fc.length;
      for (let i = 0; i < days; i++)
        fc.push(fc[fc.length - 1] + Math.sin(i * 0.5) * 5 + Math.random() * 6 - 2);
      makeLine(fcRef.current, fc, "#111", 280, true, start);
    }
    if (scfiRef.current) {
      makeLine(scfiRef.current, scfiData, "#111", 220);
    }
  }, [days]);

  useEffect(() => {
    drawCharts();
    const handleResize = () => drawCharts();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawCharts]);

  return (
    <AppShell>
    <div className="animate-fade-in max-w-[1400px] mx-auto p-7 px-8 pb-14">
      <div className="mb-7">
        <h1 className="text-[30px] font-bold tracking-[-0.035em]">
          AI Forecast
        </h1>
        <p className="text-sm text-text3 mt-1">
          Predictive models based on Prophet + XGBoost — simulated data
        </p>
      </div>

      <Card title="Shipment Volume Forecast" className="mb-[22px]">
        <div className="flex gap-[6px] mb-[18px]">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3.5 py-[6px] rounded-[20px] text-[11.5px] font-semibold border cursor-pointer transition-all ${
                days === d
                  ? "bg-accent text-white border-accent"
                  : "bg-bg3 text-text3 border-border2 hover:border-accent hover:text-accent"
              }`}
            >
              {d} days
            </button>
          ))}
        </div>
        <div ref={fcRef} className="h-[280px]" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          {[
            { label: "Expected Peak", val: "+23%", sub: "in 5 days (weekend surge)", orange: true },
            { label: "Congestion Risk", val: "Medium", sub: "Port of Genoa, 72h window", orange: true },
            { label: "Model Accuracy", val: "91.4%", sub: "MAPE over last 30 days", orange: false },
          ].map((ins) => (
            <div
              key={ins.label}
              className="p-4 rounded-[var(--radius-sm)] border border-border bg-bg"
            >
              <div className="text-[10px] font-semibold text-text3 uppercase tracking-[0.05em]">
                {ins.label}
              </div>
              <div
                className={`text-[22px] font-bold mt-[5px] tracking-[-0.02em] ${ins.orange ? "text-accent" : "text-text"}`}
              >
                {ins.val}
              </div>
              <div className="text-[11px] text-text3 mt-[2px]">{ins.sub}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <Card title="Container Freight Rate (SCFI)">
          <div ref={scfiRef} className="h-[220px]" />
        </Card>

        <Card title="Delay Probability by Route">
          <div className="flex flex-col gap-3.5 pt-1">
            {routes.map((r) => {
              const isHigh = r.p > 20;
              return (
                <div key={r.r}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{r.r}</span>
                    <span
                      className="font-bold"
                      style={{ color: isHigh ? "var(--accent)" : "var(--text3)" }}
                    >
                      {r.p}%
                    </span>
                  </div>
                  <div className="hbar">
                    <div
                      className="hbar-fill"
                      style={{
                        width: `${Math.min(r.p * 2.5, 100)}%`,
                        background: isHigh ? "var(--accent)" : "var(--text3)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
    </AppShell>
  );
}
