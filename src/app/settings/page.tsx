"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/card";
import { PageHelp } from "@/components/page-help";

const SETTINGS_HELP = {
  title: "Settings — what can I do here?",
  intro: "Manage your profile, security, personal alerts and subscription in one place.",
  sections: [
    {
      title: "Profile",
      body: [
        "Change your display name and profile picture.",
        "Upload a PNG/JPG/WebP up to 2 MB. The image is stored on Vercel Blob.",
      ],
    },
    {
      title: "Security",
      body: [
        "Change your password. Requires the current password for verification.",
        "Minimum 8 characters for the new password.",
      ],
    },
    {
      title: "Personal Alerts",
      body: [
        "Create thresholds on any market metric (Brent price, BDTI, Hormuz traffic, etc.) and receive an email when triggered.",
        "Alerts are evaluated every 5 minutes via cron.",
      ],
    },
    {
      title: "Subscription",
      body: "Your current tier, renewal date, and billing portal link.",
    },
  ],
};

interface Profile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  subscriptionTier: string;
  subscriptionEnd: string | null;
  createdAt: string;
}

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

type Tab = "profile" | "security" | "alerts" | "subscription";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <AppShell>
      <PageHelp {...SETTINGS_HELP} />
      <div className="animate-fade-in max-w-[1000px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
        <div className="mb-5 sm:mb-6">
          <h1 className="text-[26px] sm:text-[30px] font-bold tracking-[-0.035em]">Settings</h1>
          <p className="text-[12px] sm:text-sm text-text3 mt-1">
            Manage your profile, security, alerts and subscription.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-5 sm:mb-6 -mx-4 sm:-mx-6 md:-mx-7 px-4 sm:px-6 md:px-7">
          <nav className="scroll-x flex gap-1">
            {(
              [
                { id: "profile", label: "Profile" },
                { id: "security", label: "Security" },
                { id: "alerts", label: "Personal Alerts" },
                { id: "subscription", label: "Subscription" },
              ] as { id: Tab; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`shrink-0 px-4 py-3 text-[12px] font-semibold transition-colors border-b-2 -mb-px ${
                  tab === t.id
                    ? "text-text border-text"
                    : "text-text3 border-transparent hover:text-text"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {tab === "profile" && <ProfileTab />}
        {tab === "security" && <SecurityTab />}
        {tab === "alerts" && <AlertsTab />}
        {tab === "subscription" && <SubscriptionTab />}
      </div>
    </AppShell>
  );
}

/* ─────────────── Profile tab ─────────────── */
function ProfileTab() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const r = await fetch("/api/settings/profile");
    const j = await r.json();
    if (j.success) {
      setProfile(j.data);
      setName(j.data.name ?? "");
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const r = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const j = await r.json();
    setSaving(false);
    if (j.success) {
      setMessage({ type: "success", text: "Name updated" });
      load();
    } else {
      setMessage({ type: "error", text: j.error });
    }
  }

  async function uploadAvatar(file: File) {
    setUploading(true);
    setMessage(null);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/settings/avatar", { method: "POST", body: fd });
    const j = await r.json();
    setUploading(false);
    if (j.success) {
      setMessage({ type: "success", text: "Avatar updated" });
      load();
    } else {
      setMessage({ type: "error", text: j.error });
    }
  }

  return (
    <div className="flex flex-col gap-3.5">
      <Card title="Profile picture">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-full bg-bg2 border border-border overflow-hidden flex items-center justify-center shrink-0">
            {profile?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.image} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[24px] font-bold text-text3">
                {(profile?.name ?? profile?.email ?? "?")[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadAvatar(f);
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-text text-white text-[12px] font-semibold rounded-[var(--radius-xs)] hover:opacity-90 disabled:opacity-50 self-start"
            >
              {uploading ? "Uploading…" : "Upload new picture"}
            </button>
            <div className="text-[10px] text-text3">JPG, PNG, WebP or GIF. Max 2 MB.</div>
          </div>
        </div>
      </Card>

      <Card title="Account details">
        <form onSubmit={saveName} className="flex flex-col gap-4 max-w-[420px]">
          <div>
            <label className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em]">Email</label>
            <div className="mt-1 px-3 py-2 bg-bg2 border border-border rounded-[var(--radius-xs)] text-[13px] text-text2">
              {profile?.email ?? "—"}
            </div>
            <div className="text-[10px] text-text3 mt-1">Email cannot be changed from this page.</div>
          </div>
          <div>
            <label className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em]">Display name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-bg2 border border-border rounded-[var(--radius-xs)] text-[13px] focus:outline-none focus:border-text"
              placeholder="Your name"
              maxLength={60}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-text text-white text-[12px] font-semibold rounded-[var(--radius-xs)] hover:opacity-90 disabled:opacity-50 self-start"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {message && (
            <div
              className={`text-[12px] ${
                message.type === "success" ? "text-text2" : "text-accent"
              }`}
            >
              {message.text}
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}

/* ─────────────── Security tab ─────────────── */
function SecurityTab() {
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [nw2, setNw2] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (nw !== nw2) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }
    if (nw.length < 8) {
      setMessage({ type: "error", text: "New password must be at least 8 characters" });
      return;
    }
    setSaving(true);
    const r = await fetch("/api/settings/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: cur, newPassword: nw }),
    });
    const j = await r.json();
    setSaving(false);
    if (j.success) {
      setMessage({ type: "success", text: "Password updated successfully" });
      setCur("");
      setNw("");
      setNw2("");
    } else {
      setMessage({ type: "error", text: j.error });
    }
  }

  return (
    <Card title="Change password">
      <form onSubmit={submit} className="flex flex-col gap-4 max-w-[420px]">
        <Field label="Current password" type="password" value={cur} onChange={setCur} />
        <Field label="New password" type="password" value={nw} onChange={setNw} />
        <Field label="Confirm new password" type="password" value={nw2} onChange={setNw2} />
        <div className="text-[11px] text-text3 -mt-1">Minimum 8 characters.</div>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-text text-white text-[12px] font-semibold rounded-[var(--radius-xs)] hover:opacity-90 disabled:opacity-50 self-start"
        >
          {saving ? "Updating…" : "Update password"}
        </button>
        {message && (
          <div className={`text-[12px] ${message.type === "success" ? "text-text2" : "text-accent"}`}>
            {message.text}
          </div>
        )}
      </form>
    </Card>
  );
}

/* ─────────────── Alerts tab (moved from /alerts page) ─────────────── */
function AlertsTab() {
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
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this alert?")) return;
    await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="flex flex-col gap-3.5">
      <Card title="Create a new alert">
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
          <div className="scroll-x -mx-6 px-6">
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
                    <td className="py-2 pr-3 font-medium whitespace-nowrap">{a.name}</td>
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
                    <td className="py-2 pr-3 text-text3 whitespace-nowrap">
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
  );
}

/* ─────────────── Subscription tab ─────────────── */
function SubscriptionTab() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetch("/api/settings/profile")
      .then((r) => r.json())
      .then((j) => j.success && setProfile(j.data));
  }, []);

  const tierLabels: Record<string, { label: string; price: string; color: string }> = {
    free: { label: "Free", price: "€0", color: "bg-black/6 text-text2" },
    junior: { label: "Junior Trader", price: "€19 / month", color: "bg-black/6 text-text2" },
    trader: { label: "Trader", price: "€99 / month", color: "bg-accent-soft text-accent" },
    institutional: { label: "Institutional", price: "€499 / month", color: "bg-text text-white" },
  };
  const current = profile ? tierLabels[profile.subscriptionTier] ?? tierLabels.free : null;

  return (
    <Card title="Your subscription">
      {!profile ? (
        <div className="text-text3 text-xs">Loading…</div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <div className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em] mb-1">Current plan</div>
              <div className="flex items-center gap-3">
                <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${current?.color ?? ""}`}>
                  {current?.label ?? profile.subscriptionTier}
                </span>
                <span className="text-[13px] text-text2">{current?.price ?? ""}</span>
              </div>
            </div>
          </div>
          {profile.subscriptionEnd && (
            <div>
              <div className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em] mb-1">Valid until</div>
              <div className="text-[14px] font-semibold">
                {new Date(profile.subscriptionEnd).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          )}
          <div>
            <div className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em] mb-1">Member since</div>
            <div className="text-[13px] text-text2">
              {new Date(profile.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>
          <div className="pt-4 border-t border-border flex items-center gap-3 flex-wrap">
            <a
              href="/upgrade"
              className="inline-block px-5 py-2 bg-text text-white text-[12px] font-semibold rounded-[var(--radius-xs)] hover:opacity-90 no-underline"
            >
              View all plans
            </a>
            {profile.subscriptionTier !== "free" && (
              <a
                href="/api/portal"
                className="inline-block px-5 py-2 bg-bg2 border border-border text-text text-[12px] font-semibold rounded-[var(--radius-xs)] hover:bg-bg3 no-underline"
              >
                Manage billing (upgrade / cancel with proration)
              </a>
            )}
          </div>
          {profile.subscriptionTier !== "free" && (
            <p className="text-[10px] text-text3 leading-[1.5]">
              The Stripe Billing Portal lets you switch plan, update card, or cancel. When you
              upgrade, unused time on the current plan is <strong>automatically credited</strong>
              toward the new one.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

/* ─────────────── shared input ─────────────── */
function Field({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 bg-bg2 border border-border rounded-[var(--radius-xs)] text-[13px] focus:outline-none focus:border-text"
      />
    </div>
  );
}
