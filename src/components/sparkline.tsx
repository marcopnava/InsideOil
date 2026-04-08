"use client";

import { useRef, useEffect } from "react";

interface SparklineProps {
  data: number[];
  labels?: string[];
  height?: number;
  color?: string;
  fillColor?: string;
  showAxis?: boolean;
  showDots?: boolean;
  zeroLine?: boolean;
  title?: string;
  valuePrefix?: string;
}

export function Sparkline({
  data,
  labels,
  height = 160,
  color = "#111",
  fillColor,
  showAxis = true,
  showDots = false,
  zeroLine = false,
  title,
  valuePrefix = "$",
}: SparklineProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || data.length < 2) return;
    const w = ref.current.clientWidth;
    const h = height;
    const pad = { top: 20, right: 12, bottom: showAxis ? 24 : 8, left: showAxis ? 44 : 8 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    const max = Math.max(...data) * 1.05;
    const min = Math.min(...data) * 0.95;
    const range = max - min || 1;

    const pts = data.map((v, i) => ({
      x: pad.left + (i / (data.length - 1)) * cw,
      y: pad.top + ch - ((v - min) / range) * ch,
    }));

    let svg = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:100%">`;

    // Grid lines
    if (showAxis) {
      for (let i = 0; i < 4; i++) {
        const y = pad.top + (i * ch) / 3;
        const val = max - (i * range) / 3;
        svg += `<line x1="${pad.left}" y1="${y}" x2="${w - pad.right}" y2="${y}" stroke="rgba(0,0,0,.04)" stroke-dasharray="3,3"/>`;
        svg += `<text x="${pad.left - 6}" y="${y + 3}" text-anchor="end" style="font-size:9px;fill:#888;font-family:monospace">${valuePrefix}${val.toFixed(val > 100 ? 0 : 2)}</text>`;
      }
    }

    // Zero line
    if (zeroLine && min < 0 && max > 0) {
      const zeroY = pad.top + ch - ((0 - min) / range) * ch;
      svg += `<line x1="${pad.left}" y1="${zeroY}" x2="${w - pad.right}" y2="${zeroY}" stroke="rgba(0,0,0,.15)" stroke-dasharray="4,2"/>`;
      svg += `<text x="${pad.left - 6}" y="${zeroY + 3}" text-anchor="end" style="font-size:9px;fill:#888;font-family:monospace">0</text>`;
    }

    // Date labels
    if (showAxis && labels && labels.length > 0) {
      const step = Math.max(1, Math.floor(labels.length / 5));
      for (let i = 0; i < labels.length; i += step) {
        const x = pad.left + (i / (labels.length - 1)) * cw;
        const d = labels[i];
        const short = d.slice(5); // MM-DD
        svg += `<text x="${x}" y="${h - 4}" text-anchor="middle" style="font-size:8px;fill:#aaa;font-family:monospace">${short}</text>`;
      }
    }

    // Fill
    if (fillColor) {
      const fillPath = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
      svg += `<path d="${fillPath} L${pts[pts.length - 1].x},${pad.top + ch} L${pts[0].x},${pad.top + ch} Z" fill="${fillColor}" opacity=".08"/>`;
    }

    // Line
    const linePath = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
    svg += `<path d="${linePath}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;

    // Dots on last point
    if (showDots || true) {
      const last = pts[pts.length - 1];
      svg += `<circle cx="${last.x}" cy="${last.y}" r="3.5" fill="${color}"/>`;
      svg += `<circle cx="${last.x}" cy="${last.y}" r="2" fill="#fff"/>`;
      // Value label on last point
      svg += `<text x="${last.x - 4}" y="${last.y - 8}" text-anchor="end" style="font-size:10px;fill:${color};font-weight:700;font-family:monospace">${valuePrefix}${data[data.length - 1].toFixed(2)}</text>`;
    }

    // Title
    if (title) {
      svg += `<text x="${pad.left}" y="13" style="font-size:10px;fill:#555;font-weight:600">${title}</text>`;
    }

    svg += `</svg>`;
    ref.current.innerHTML = svg;
  }, [data, labels, height, color, fillColor, showAxis, showDots, zeroLine, title, valuePrefix]);

  if (data.length < 2) return <div className="text-text3 text-xs text-center py-8">No data</div>;

  return <div ref={ref} style={{ height }} />;
}
