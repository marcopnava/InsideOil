"use client";

import { KPICard } from "@/components/kpi-card";
import { Card } from "@/components/card";
import { AppShell } from "@/components/app-shell";

// Placeholder metrics — will be populated with real data when Stripe + analytics are connected
const usage = {
  totalUsers: 0,
  activeToday: 0,
  activeThisWeek: 0,
  activeThisMonth: 0,
  avgSessionMinutes: 0,
  pageViews: 0,
  topPages: [
    { page: "/dashboard", views: 0 },
    { page: "/trade", views: 0 },
    { page: "/trade/decision", views: 0 },
    { page: "/tracking", views: 0 },
    { page: "/trade/proposal", views: 0 },
  ],
};

const revenue = {
  mrr: 0,
  arr: 0,
  totalSubscribers: 0,
  proSubscribers: 0,
  institutionalSubscribers: 0,
  churnRate: 0,
  ltv: 0,
  recentTransactions: [] as Array<{ date: string; email: string; plan: string; amount: number; status: string }>,
};

const fmt = (n: number) => n.toLocaleString("en-US");

export default function MetricsPage() {
  return (
    <AppShell>
      <div className="animate-fade-in max-w-[1400px] mx-auto p-7 px-8 pb-14">
        <div className="mb-7">
          <h1 className="text-[30px] font-bold tracking-[-0.035em]">Platform Metrics</h1>
          <p className="text-sm text-text3 mt-1">Usage analytics and revenue — connects to Stripe + analytics when live</p>
        </div>

        {/* Revenue KPIs */}
        <div className="text-[10px] font-semibold text-text3 uppercase tracking-[0.07em] mb-2">Revenue</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-[22px]">
          <KPICard label="MRR" value={revenue.mrr > 0 ? "$" + fmt(revenue.mrr) : "—"} sub="monthly recurring" />
          <KPICard label="ARR" value={revenue.arr > 0 ? "$" + fmt(revenue.arr) : "—"} sub="annual projection" />
          <KPICard label="Subscribers" value={revenue.totalSubscribers || "—"} sub={`${revenue.proSubscribers} Pro / ${revenue.institutionalSubscribers} Inst.`} />
          <KPICard label="Churn" value={revenue.churnRate > 0 ? revenue.churnRate + "%" : "—"} sub="monthly" />
          <KPICard label="LTV" value={revenue.ltv > 0 ? "$" + fmt(revenue.ltv) : "—"} sub="lifetime value" />
          <KPICard label="ARPU" value={revenue.totalSubscribers > 0 ? "$" + Math.round(revenue.mrr / revenue.totalSubscribers) : "—"} sub="avg per user" />
        </div>

        {/* Usage KPIs */}
        <div className="text-[10px] font-semibold text-text3 uppercase tracking-[0.07em] mb-2">Usage</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-[22px]">
          <KPICard label="Total Users" value={usage.totalUsers || "—"} sub="registered" />
          <KPICard label="Active Today" value={usage.activeToday || "—"} sub="DAU" />
          <KPICard label="Active This Week" value={usage.activeThisWeek || "—"} sub="WAU" />
          <KPICard label="Active This Month" value={usage.activeThisMonth || "—"} sub="MAU" />
          <KPICard label="Avg Session" value={usage.avgSessionMinutes > 0 ? usage.avgSessionMinutes + " min" : "—"} sub="per visit" />
          <KPICard label="Page Views" value={usage.pageViews > 0 ? fmt(usage.pageViews) : "—"} sub="this month" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-[22px]">
          {/* Top Pages */}
          <Card title="Top Pages" badge={{ text: "Analytics" }}>
            <div className="flex flex-col gap-1">
              {usage.topPages.map((p) => (
                <div key={p.page} className="flex justify-between py-2 border-b border-border last:border-b-0">
                  <span className="text-[12px] font-medium" style={{ fontFamily: "var(--font-jetbrains)" }}>{p.page}</span>
                  <span className="text-[11px] text-text3" style={{ fontFamily: "var(--font-jetbrains)" }}>{p.views || "—"}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-bg rounded-[var(--radius-sm)] border border-border text-[11px] text-text3 leading-[1.4]">
              Connect Google Analytics or Plausible to populate this data. Add the tracking script to the root layout.
            </div>
          </Card>

          {/* Recent Transactions */}
          <Card title="Recent Transactions" badge={{ text: "Stripe" }}>
            {revenue.recentTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead><tr>
                    {["Date", "Email", "Plan", "Amount", "Status"].map((h) => (
                      <th key={h} className="text-[10px] font-semibold uppercase text-text3 text-left px-3 py-[9px] border-b border-border2">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {revenue.recentTransactions.map((t, i) => (
                      <tr key={i} className="hover:bg-bg2">
                        <td className="text-[11px] px-3 py-[10px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)" }}>{t.date}</td>
                        <td className="text-[11px] px-3 py-[10px] border-b border-border">{t.email}</td>
                        <td className="text-[11px] px-3 py-[10px] border-b border-border font-semibold">{t.plan}</td>
                        <td className="text-[11px] px-3 py-[10px] border-b border-border" style={{ fontFamily: "var(--font-jetbrains)" }}>${t.amount}</td>
                        <td className="text-[11px] px-3 py-[10px] border-b border-border">{t.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-[12px] text-text3 mb-2">No transactions yet</div>
                <div className="p-3 bg-bg rounded-[var(--radius-sm)] border border-border text-[11px] text-text3 leading-[1.4]">
                  Connect Stripe to track subscriptions. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to .env, then implement the webhook at /api/stripe/webhook.
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Setup Guide */}
        <Card title="Setup Checklist">
          <div className="flex flex-col gap-2">
            {[
              { task: "Connect Stripe for payments", status: "pending", note: "Add STRIPE_SECRET_KEY to .env" },
              { task: "Add analytics tracking", status: "pending", note: "Google Analytics or Plausible script in layout" },
              { task: "Configure webhook for subscription events", status: "pending", note: "/api/stripe/webhook" },
              { task: "Set up email notifications (Resend)", status: "pending", note: "Welcome email, payment confirmation" },
              { task: "Enable rate limiting", status: "pending", note: "Middleware rate limiter for API routes" },
              { task: "Set production NEXTAUTH_SECRET", status: "pending", note: "Generate with: openssl rand -base64 32" },
            ].map((item) => (
              <div key={item.task} className="flex items-center justify-between py-2.5 border-b border-border last:border-b-0">
                <div>
                  <div className="text-[12px] font-medium">{item.task}</div>
                  <div className="text-[10px] text-text3 mt-0.5">{item.note}</div>
                </div>
                <span className={`text-[9px] font-semibold px-2 py-[2px] rounded-full ${item.status === "done" ? "bg-black/6 text-text" : "bg-black/4 text-text3"}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
