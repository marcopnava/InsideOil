"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/card";
import { PageHelp } from "@/components/page-help";

const ALERTS_HELP = {
  title: "Personal Alerts — what am I looking at?",
  intro:
    "Set your own thresholds on any of the metrics InsideOil tracks. When triggered, you receive an email. The system checks every 5 minutes via the cron loop.",
  sections: [
    {
      title: "How to create an alert",
      body: [
        "1. Pick a metric from the dropdown (price, spread, BDTI, chokepoint count, etc.)",
        "2. Pick a comparator (>, <, or % change since last check)",
        "3. Set the threshold value",
        "4. Give it a name and click Create.",
        "Example: name='Brent spike', metric=BRENT_PRICE, comparator=gt, threshold=90 → email when Brent crosses $90.",
        "Example: name='Hormuz drop', metric=HORMUZ_TANKERS, comparator=change_pct, threshold=20 → email when Hormuz tanker count moves ±20% between checks.",
      ],
    },
    {
      title: "How emails are sent",
      body: [
        "Email delivery uses Resend. Make sure your account email (the one you registered with) is correct.",
        "Each alert triggers at most every 5 minutes (the cron loop interval).",
        "After triggering, the same alert can re-trigger if the condition stays true on the next check.",
      ],
    },
    {
      title: "Disabling / deleting",
      body: [
        "Click 🗑 to delete an alert.",
        "Click ⏸ to disable temporarily (not yet exposed in this MVP — disable by deleting and recreating).",
      ],
    },
  ],
};

interface Alert {
  id: string;
  name: string;
  metric: string;
  comparator: string;
  threshold: number;
  enabled: boolean;
  lastTriggered: string | null;
  lastValue: number | null;
  triggerCount: number;
  createdAt: string;
}

const METRICS = [
  { id: "BRENT_PRICE", label: "Brent spot price ($/bbl)" },
  { id: "WTI_PRICE", label: "WTI spot price ($/bbl)" },
  { id: "BRENT_WTI_SPREAD", label: "Brent − WTI spread ($/bbl)" },
  { id: "BDTI", label: "BDTI tanker freight index" },
  { id: "HORMUZ_TANKERS", label: "Hormuz live tanker count" },
  { id: "MALACCA_TANKERS", label: "Malacca live tanker count" },
];

const COMPARATORS = [
  { id: "gt", label: "is greater than" },
  { id: "lt", label: "is less than" },
  { id: "change_pct", label: "changes by % since last check" },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [metric, setMetric] = useState("BRENT_PRICE");
  const [comparator, setComparator] = useState<"gt" | "lt" | "change_pct">("gt");
  const [threshold, setThreshold] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/alerts");
    const j = await r.json();
    if (j.success) setAlerts(j.data);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !threshold) return;
    setSubmitting(true);
    const r = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, metric, comparator, threshold: Number(threshold) }),
    });
    const j = await r.json();
    setSubmitting(false);
    if (j.success) {
      setName("");
      setThreshold("");
      load();
    } else {
      alert(j.error || "Failed to create");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this alert?")) return;
    await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <AppShell>
      <PageHelp {...ALERTS_HELP} />
      <div className="animate-fade-in max-w-[1100px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
        <div className="mb-6">
          <h1 className="text-[30px] font-bold tracking-[-0.035em]">Personal Alerts</h1>
          <p className="text-sm text-text3 mt-1">
            Get an email the moment any market condition you care about flips.
          </p>
        </div>

        <Card title="Create an alert" className="mb-3.5">
          <form onSubmit={create} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="lg:col-span-2">
              <label className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em]">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Brent spike"
                className="w-full mt-1 px-3 py-2 bg-bg2 border border-border rounded-[var(--radius-xs)] text-[13px] focus:outline-none focus:border-text"
              />
            </div>
            <div>
              <label className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em]">Metric</label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-bg2 border border-border rounded-[var(--radius-xs)] text-[13px] focus:outline-none focus:border-text"
              >
                {METRICS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em]">When</label>
              <select
                value={comparator}
                onChange={(e) => setComparator(e.target.value as "gt" | "lt" | "change_pct")}
                className="w-full mt-1 px-3 py-2 bg-bg2 border border-border rounded-[var(--radius-xs)] text-[13px] focus:outline-none focus:border-text"
              >
                {COMPARATORS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em]">Threshold</label>
              <input
                type="number"
                step="any"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="e.g. 90"
                className="w-full mt-1 px-3 py-2 bg-bg2 border border-border rounded-[var(--radius-xs)] text-[13px] focus:outline-none focus:border-text"
              />
            </div>
            <div className="lg:col-span-5">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-text text-white text-[12px] font-semibold rounded-[var(--radius-xs)] hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Creating…" : "Create alert"}
              </button>
            </div>
          </form>
        </Card>

        <Card title={`Your alerts (${alerts.length})`}>
          {loading ? (
            <div className="text-text3 text-xs">Loading…</div>
          ) : alerts.length === 0 ? (
            <div className="text-text3 text-xs">No alerts yet. Create one above.</div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em]">
                    <th className="py-1.5 pr-3 text-left">Name</th>
                    <th className="py-1.5 pr-3 text-left">Rule</th>
                    <th className="py-1.5 pr-3 text-right">Last value</th>
                    <th className="py-1.5 pr-3 text-right">Triggered</th>
                    <th className="py-1.5 pr-3 text-left">Last fired</th>
                    <th className="py-1.5 pr-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a) => (
                    <tr key={a.id} className="border-t border-border">
                      <td className="py-2 pr-3 font-medium">{a.name}</td>
                      <td className="py-2 pr-3 text-text2">
                        {METRICS.find((m) => m.id === a.metric)?.label ?? a.metric}
                        <br />
                        <span className="text-[10px] text-text3">
                          {COMPARATORS.find((c) => c.id === a.comparator)?.label} {a.threshold}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right" style={{ fontFamily: "var(--font-jetbrains)" }}>
                        {a.lastValue != null ? a.lastValue.toLocaleString() : "—"}
                      </td>
                      <td className="py-2 pr-3 text-right">{a.triggerCount}</td>
                      <td className="py-2 pr-3 text-text3">
                        {a.lastTriggered ? new Date(a.lastTriggered).toLocaleString("en-GB") : "—"}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <button
                          type="button"
                          onClick={() => remove(a.id)}
                          aria-label="Delete"
                          className="text-text3 hover:text-accent text-[14px]"
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
