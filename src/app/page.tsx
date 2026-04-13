"use client";

import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState } from "react";

// Animated counter
function Counter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1500;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// Fade-in on scroll
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const stats = [
  { value: 18000, suffix: "+", label: "Vessels tracked live" },
  { value: 11000, suffix: "+", label: "Aircraft monitored" },
  { value: 6, suffix: "", label: "Trading signals" },
  { value: 30, suffix: "s", label: "Data refresh rate" },
];

const features = [
  { title: "Decision Engine", desc: "Composite BUY/SELL scoring from 6 real-time signals. Crack spreads, fleet utilization, floating storage — synthesized into one actionable direction.", tag: "Core" },
  { title: "AIS Vessel Intelligence", desc: "18,000+ vessels tracked via Digitraffic AIS. Tanker speeds, destinations, anchored fleet — every data point a physical crude trader needs.", tag: "Data" },
  { title: "Arbitrage Scanner", desc: "10 crude routes analyzed in real-time. Dynamic discounts, fuel costs from HO futures, net margin per barrel.", tag: "Trading" },
  { title: "Crack Spread Analysis", desc: "3-2-1 crack spread from Yahoo Finance. Refinery margins drive crude demand — when they print, refineries buy aggressively.", tag: "Prices" },
  { title: "Dark Fleet Monitor", desc: "AIS gap detection across thousands of tankers. STS transfer zone monitoring. Sanctions compliance intelligence.", tag: "Risk" },
  { title: "Trade Proposals", desc: "Auto-generated trade ideas with entry, target, stop loss, and risk/reward. Updated every 2 minutes. Portfolio tracking.", tag: "Execution" },
  { title: "Economic Calendar", desc: "EIA, OPEC, IEA, Baker Hughes, CFTC — every event that moves crude oil, with specific trading instructions.", tag: "Events" },
  { title: "3-Month Backtest", desc: "Historical simulation of the Decision Engine. Equity curve, win rate, alpha vs buy-and-hold.", tag: "Validation" },
];

const pricing = [
  {
    name: "Junior Trader",
    monthly: { price: "19", id: "junior_monthly" },
    annual: { price: "190", id: "junior_annual", save: "38" },
    currency: "€",
    desc: "For the retail trader getting started",
    features: [
      "Live Command Center (all KPI boxes)",
      "Live global map (vessels + cargo aircraft)",
      "Daily Briefing auto-generated every morning",
      "News, Weather and Ports (full access)",
      "Trade Intelligence — tanker fleet analytics",
      "Full Education hub (22 sections + EIA playbook)",
      "3 personal email alerts",
    ],
    cta: "Start Junior",
    highlight: false,
  },
  {
    name: "Trader",
    monthly: { price: "99", id: "trader_monthly" },
    annual: { price: "990", id: "trader_annual", save: "198" },
    currency: "€",
    desc: "For the serious retail and semi-pro trader",
    features: [
      "Everything in Junior Trader",
      "Institutional Signals real-time (Contango arbitrage, Floating storage, Chokepoint flow)",
      "Forward curve Brent / WTI / Dubai full chain",
      "BDTI tanker freight index + VLCC TCE",
      "EIA Weekly Petroleum Status with decision tree",
      "CFTC Commitments of Traders (smart money positioning)",
      "Vessel detail pages with live route map (6h → 7d)",
      "External vessel cross-check (MarineTraffic, VesselFinder, FleetMon)",
      "Crude differentials (Brent-WTI, Brent-Dubai EFS, USGC→Asia arb)",
      "Unlimited personal email alerts",
    ],
    cta: "Start Trader",
    highlight: true,
  },
  {
    name: "Institutional",
    monthly: { price: "499", id: "institutional_monthly" },
    annual: { price: "4,990", id: "institutional_annual", save: "998" },
    currency: "€",
    desc: "For family offices, prop desks, specialised funds",
    features: [
      "Everything in Trader",
      "Russia Tanker Tracker (Baltic + Black Sea + Far East)",
      "Dark Fleet Detector (sanctions-evasion candidates)",
      "OPEC+ Compliance per-country scoring (AIS port-call detection)",
      "Historical data unlimited (> 30 days)",
      "Priority data refresh (signals every 1-2 min instead of 5)",
      "API access (JSON) for algo trading",
      "1-on-1 onboarding call",
      "Priority email support",
      "Custom daily briefing personalised to your desk",
    ],
    cta: "Start Institutional",
    highlight: false,
  },
];

// Competitor comparison — "the alternative is 10-100× more expensive"
const competitors = [
  {
    name: "Kpler",
    price: "€40,000 - €120,000",
    period: "/ year",
    notes: "Enterprise only. Satellite AIS, cargo tracking, commodity flows. The standard in trading desks.",
    access: "Enterprise sales, 6-12 months procurement cycle",
  },
  {
    name: "Vortexa",
    price: "€30,000 - €80,000",
    period: "/ year",
    notes: "AI-powered oil flow intelligence. Used by majors and hedge funds.",
    access: "Enterprise sales",
  },
  {
    name: "ClipperData",
    price: "€20,000 - €50,000",
    period: "/ year",
    notes: "Tanker movements, waterborne cargo. Core tool of physical crude desks.",
    access: "Enterprise sales",
  },
  {
    name: "Bloomberg Terminal",
    price: "€24,000",
    period: "/ year",
    notes: "All-in-one finance terminal, OIL<GO> section for crude. Market standard, single-seat licence.",
    access: "Per-seat licence, credit check",
  },
  {
    name: "LSEG Workspace (Refinitiv)",
    price: "€18,000",
    period: "/ year",
    notes: "Ex Refinitiv Eikon. Oil pricing, news, curves, flow data for the finance professional.",
    access: "Per-seat licence",
  },
  {
    name: "S&P Platts Dimensions Pro",
    price: "€15,000 - €40,000",
    period: "/ year",
    notes: "Price assessments (Dated Brent, Dubai marker), analytics, forward curves.",
    access: "Commercial contract",
  },
];

function CompetitorSection() {
  return (
    <section id="comparison" className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 border-t border-border bg-bg overflow-hidden">
      <div className="max-w-[1100px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-center mb-10 sm:mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-white mb-5"
            >
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-accent inline-block"
              />
              <span className="text-[10px] sm:text-[11px] font-semibold text-text3 uppercase tracking-[0.08em]">The alternative</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-[26px] sm:text-[32px] md:text-[36px] font-bold tracking-[-0.035em] leading-[1.15] max-w-[820px] mx-auto px-2"
            >
              The institutional stack costs{" "}
              <motion.span
                initial={{ backgroundSize: "0% 100%" }}
                whileInView={{ backgroundSize: "100% 100%" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
                style={{
                  backgroundImage: "linear-gradient(transparent 65%, rgba(232,89,12,0.25) 65%)",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "left center",
                }}
                className="inline"
              >
                €18,000 to €120,000
              </motion.span>{" "}
              a year.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-[13px] sm:text-[15px] text-text2 mt-4 max-w-[680px] mx-auto leading-[1.6] px-2"
            >
              Kpler, Vortexa, Bloomberg, LSEG — the data Western hedge funds and oil majors use
              to trade crude. InsideOil Trader is <strong className="text-text">€990 a year</strong>.
              Institutional is <strong className="text-text">€4,990</strong>. Same class of signals,
              a fraction of the budget.
            </motion.p>
          </div>
        </motion.div>

        {/* ─── Mobile layout: card stack with stagger ─────────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
          }}
          className="md:hidden flex flex-col gap-3"
        >
          {/* InsideOil highlighted */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 24, scale: 0.98 },
              visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
            }}
            whileHover={{ scale: 1.01 }}
            className="relative bg-white border-2 border-accent rounded-[12px] p-5 shadow-[0_4px_24px_rgba(232,89,12,0.08)]"
          >
            {/* Spotlight glow */}
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -inset-[1px] rounded-[13px] pointer-events-none"
              style={{
                background: "radial-gradient(circle at 0% 0%, rgba(232,89,12,0.12), transparent 60%)",
              }}
            />
            <div className="relative">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-[16px] font-bold text-text">InsideOil</div>
                  <div className="text-[11px] text-text2 mt-0.5">Trader / Institutional</div>
                </div>
                <motion.span
                  initial={{ rotate: -4, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", delay: 0.4, stiffness: 200 }}
                  className="text-[9px] font-bold text-accent bg-accent-soft px-2 py-[3px] rounded-full whitespace-nowrap"
                >
                  You are here
                </motion.span>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-[22px] font-bold text-accent tracking-[-0.02em]">€990 – €4,990</span>
                <span className="text-[11px] text-text3">/ year</span>
              </div>
              <p className="text-[12px] text-text2 leading-[1.5]">
                Global AIS, forward curves, floating storage detector, contango arbitrage, chokepoint flow,
                OPEC+ compliance, EIA + CFTC, crude differentials, Russia & dark fleet tracker.
              </p>
              <div className="text-[11px] text-text3 mt-3 pt-3 border-t border-border">
                <span className="font-semibold text-text2">Access:</span> Self-serve, instant
              </div>
            </div>
          </motion.div>

          {/* Competitors */}
          {competitors.map((c) => (
            <motion.div
              key={c.name}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
              }}
              whileHover={{ x: 4, transition: { duration: 0.2 } }}
              className="bg-white border border-border rounded-[12px] p-5"
            >
              <div className="text-[15px] font-bold text-text mb-2">{c.name}</div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-[17px] font-bold text-text2 tracking-[-0.02em]">{c.price}</span>
                <span className="text-[11px] text-text3">{c.period}</span>
              </div>
              <p className="text-[12px] text-text3 leading-[1.5]">{c.notes}</p>
              <div className="text-[11px] text-text3 mt-3 pt-3 border-t border-border">
                <span className="font-semibold text-text2">Access:</span> {c.access}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ─── Desktop layout: animated table ─────────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
          }}
          className="hidden md:block bg-white border border-border rounded-[14px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.04)]"
        >
          {/* Header row */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: -10 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
            }}
            className="grid grid-cols-[1.6fr_1fr_2fr_1.2fr] gap-4 px-6 py-4 border-b border-border bg-bg"
          >
            <div className="text-[10px] font-bold text-text3 uppercase tracking-[0.08em]">Provider</div>
            <div className="text-[10px] font-bold text-text3 uppercase tracking-[0.08em]">Annual price</div>
            <div className="text-[10px] font-bold text-text3 uppercase tracking-[0.08em]">What they give you</div>
            <div className="text-[10px] font-bold text-text3 uppercase tracking-[0.08em]">Access</div>
          </motion.div>
          {/* InsideOil highlighted row */}
          <motion.div
            variants={{
              hidden: { opacity: 0, x: -30 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
            }}
            whileHover={{ backgroundColor: "rgba(232,89,12,0.12)" }}
            className="relative grid grid-cols-[1.6fr_1fr_2fr_1.2fr] gap-4 px-6 py-5 border-b border-border bg-accent-soft/40 overflow-hidden"
          >
            {/* Highlight bar left edge */}
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent origin-top"
            />
            <div>
              <div className="text-[14px] font-bold text-text flex items-center gap-2 flex-wrap">
                InsideOil
                <motion.span
                  initial={{ scale: 0.7, rotate: -6 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.9, stiffness: 200 }}
                  className="text-[9px] font-bold text-accent bg-accent-soft px-1.5 py-[1px] rounded-full"
                >
                  You are here
                </motion.span>
              </div>
              <div className="text-[11px] text-text2 mt-0.5">Trader / Institutional</div>
            </div>
            <div>
              <div className="text-[14px] font-bold text-accent">€990 – €4,990</div>
              <div className="text-[10px] text-text3">/ year</div>
            </div>
            <div className="text-[12px] text-text2 leading-[1.4]">
              Global AIS, forward curves, floating storage detector, contango arbitrage, chokepoint flow,
              OPEC+ compliance, EIA + CFTC, crude differentials, Russia & dark fleet tracker.
            </div>
            <div className="text-[11px] text-text2">Self-serve, instant</div>
          </motion.div>
          {/* Competitors */}
          {competitors.map((c) => (
            <motion.div
              key={c.name}
              variants={{
                hidden: { opacity: 0, x: 20 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
              }}
              whileHover={{ backgroundColor: "rgba(0,0,0,0.02)", x: 3 }}
              className="grid grid-cols-[1.6fr_1fr_2fr_1.2fr] gap-4 px-6 py-5 border-b border-border last:border-b-0 cursor-default"
            >
              <div>
                <div className="text-[13px] font-semibold text-text">{c.name}</div>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-text2">{c.price}</div>
                <div className="text-[10px] text-text3">{c.period}</div>
              </div>
              <div className="text-[11.5px] text-text3 leading-[1.4]">{c.notes}</div>
              <div className="text-[11px] text-text3">{c.access}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
          }}
          className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5"
        >
          {[
            {
              tag: "10× cheaper",
              title: "Trader annual vs Bloomberg Terminal",
              body: "€990/year vs €24,000/year. The overlap on oil analytics is meaningful — our signals cover the same categories.",
              gradient: "from-accent-soft to-transparent",
            },
            {
              tag: "25× cheaper",
              title: "Institutional vs Kpler entry tier",
              body: "€4,990/year vs €120,000/year Kpler enterprise. You give up deep satellite AIS, you gain self-serve signup and no six-month procurement.",
              gradient: "from-accent-soft to-transparent",
            },
            {
              tag: "Self-serve",
              title: "Instant signup, cancel anytime",
              body: "No sales call. No procurement. No minimum seat licence. Card at checkout, full access in under 60 seconds.",
              gradient: "from-black/5 to-transparent",
            },
          ].map((c, i) => (
            <motion.div
              key={c.tag}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                },
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative bg-white border border-border rounded-[12px] p-5 sm:p-6 overflow-hidden cursor-default"
            >
              {/* Animated gradient bg on hover */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />
              {/* Animated accent line */}
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-0 left-0 right-0 h-[2px] bg-accent origin-left"
              />
              <div className="relative">
                <div className="text-[10px] font-bold text-accent uppercase tracking-[0.08em] mb-3 flex items-center gap-1.5">
                  <motion.span
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                    className="w-1.5 h-1.5 rounded-full bg-accent inline-block"
                  />
                  {c.tag}
                </div>
                <div className="text-[18px] sm:text-[22px] font-bold tracking-[-0.03em] leading-tight">
                  {c.title}
                </div>
                <p className="text-[12px] text-text3 mt-3 leading-[1.5]">{c.body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────── Live data strip ─────────────── */
function LiveDataStrip() {
  const [d, setD] = useState<{
    prices: { brent: number | null; wti: number | null; spread: number | null };
    curve: string;
    bdti: number | null;
    fleet: { vessels: number; tankers: number; cargoFlights: number };
    nextEvent: { title: string; at: string; impact: string } | null;
  } | null>(null);

  useEffect(() => {
    fetch("/api/landing-data")
      .then((r) => r.json())
      .then((j) => j.success && j.data && setD(j.data))
      .catch(() => {});
  }, []);

  if (!d) return null;

  const items = [
    d.prices.brent != null && { label: "Brent", value: `$${d.prices.brent.toFixed(2)}` },
    d.prices.wti != null && { label: "WTI", value: `$${d.prices.wti.toFixed(2)}` },
    d.prices.spread != null && { label: "Spread", value: `$${d.prices.spread.toFixed(2)}` },
    d.curve && d.curve !== "flat" && { label: "Curve", value: d.curve.toUpperCase() },
    d.fleet.vessels > 0 && { label: "Vessels", value: d.fleet.vessels.toLocaleString() },
    d.fleet.tankers > 0 && { label: "Tankers", value: d.fleet.tankers.toLocaleString() },
    d.fleet.cargoFlights > 0 && { label: "Cargo flights", value: d.fleet.cargoFlights.toLocaleString() },
    d.nextEvent && {
      label: "Next event",
      value: d.nextEvent.title.split("—")[0].trim().slice(0, 28),
    },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <section className="border-y border-border bg-white py-5 px-4 sm:px-6 md:px-8">
      <div className="max-w-[1200px] mx-auto">
        <FadeIn>
          <div className="flex items-center gap-3 mb-4">
            <span
              className="w-[6px] h-[6px] rounded-full bg-accent shrink-0"
              style={{ animation: "pulse 2s infinite" }}
            />
            <span className="text-[10px] font-bold text-text3 uppercase tracking-[0.1em]">
              Live on InsideOil right now
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-x-6 gap-y-4">
            {items.map((item) => (
              <div key={item.label}>
                <div className="text-[9px] font-semibold text-text3 uppercase tracking-[0.06em]">
                  {item.label}
                </div>
                <div
                  className="text-[18px] sm:text-[20px] font-bold tracking-[-0.03em] leading-none mt-1"
                  style={{ fontFamily: "var(--font-jetbrains)" }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─────────────── Before / After ─────────────── */
function BeforeAfterSection() {
  const before = [
    { point: "You read the Reuters headline 3 hours after the event. Price already moved." },
    { point: "You don't know if the market is in contango or backwardation. You enter blind." },
    { point: "Wednesday 16:30 — the EIA report drops. You don't know what the 4 key numbers are. You panic." },
    { point: "No stop loss. No position sizing. A 3% overnight move wipes your week." },
    { point: "You follow Twitter accounts that sell signals. They were wrong 6 of the last 8 times." },
  ];
  const after = [
    { point: "You see Hormuz tanker transit drop 20% in real-time. You enter 4 hours before the headline." },
    { point: "The forward curve tells you the market is tight. You know why you're going long." },
    { point: "The EIA playbook is open. 4 numbers, in order, with the decision tree. You react in 30 seconds." },
    { point: "The Risk Calculator told you exactly how much you'd lose before you clicked buy." },
    { point: "Your trade journal shows a 58% win rate over 40 trades. You trust your system, not someone else's." },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 border-t border-border bg-white overflow-hidden">
      <div className="max-w-[1100px] mx-auto">
        <FadeIn>
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.035em] leading-[1.1] max-w-[780px] mx-auto">
              The difference between guessing and knowing
            </h2>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-0 rounded-[14px] overflow-hidden border border-border">
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#f5f5f5] p-6 sm:p-8 lg:border-r border-b lg:border-b-0 border-border"
          >
            <div className="text-[10px] font-bold text-text3 uppercase tracking-[0.1em] mb-5">
              Trading without InsideOil
            </div>
            <div className="flex flex-col gap-4">
              {before.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-black/8 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-[1.5px] bg-text3 rounded-full" />
                  </div>
                  <p className="text-[13px] text-text3 leading-[1.55]">{b.point}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white p-6 sm:p-8"
          >
            <div className="text-[10px] font-bold text-accent uppercase tracking-[0.1em] mb-5">
              Trading with InsideOil
            </div>
            <div className="flex flex-col gap-4">
              {after.map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.25 + i * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-[1.5px] bg-accent rounded-full" />
                  </div>
                  <p className="text-[13px] text-text leading-[1.55]">{a.point}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── FAQ ─────────────── */
function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    {
      q: "Is this for beginners or experienced traders?",
      a: "Both. If you're new, the Education hub and every tooltip on every number will walk you through what you're looking at. If you're experienced, the Institutional Signals, forward curve, and OPEC compliance data give you the edge you're paying Bloomberg or Kpler for elsewhere — at a fraction of the cost.",
    },
    {
      q: "Do I need a Bloomberg terminal to use InsideOil?",
      a: "No. InsideOil replaces the crude-oil-specific parts of a Bloomberg terminal: live prices, forward curves, crack spreads, fleet analytics, inventory data, and speculative positioning. For everything else (equities, fixed income, FX), Bloomberg is still Bloomberg. But for oil trading decisions, you don't need it anymore.",
    },
    {
      q: "Where does the data come from?",
      a: "Seven free public sources: AISStream (global vessel positions), OpenSky Network (cargo aircraft), Yahoo Finance (futures prices), EIA (US petroleum inventories), CFTC (speculative positioning), Open-Meteo (maritime weather), and Google News RSS. We document every source and its limitations openly in the Education section.",
    },
    {
      q: "How often is the data updated?",
      a: "Vessel positions: every 30 seconds. Futures prices: every 5 minutes (15-min delay from exchange). Institutional signals: recomputed every 5 minutes. EIA inventory: weekly (Wednesday 16:30 CET). CFTC positioning: weekly (Friday). Everything is automated — you see fresh data every time you load a page.",
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes. No contracts, no minimum commitment, no cancellation fees. Cancel from Settings in one click. If you cancel, you keep access until the end of your current billing period. If you upgrade or downgrade, Stripe prorates automatically — you're only charged the difference.",
    },
    {
      q: "What instruments can I trade with this data?",
      a: "Any crude oil instrument: Brent and WTI CFDs at any retail broker, CL and BZ futures on Nymex/ICE, micro futures (MCL), oil ETFs (USO, BNO), even options on CL. The data is instrument-agnostic — it tells you about the market, not about a specific product.",
    },
    {
      q: "Is the AIS coverage truly global?",
      a: "Our free AIS feed covers Europe, US and East Asia very well. Persian Gulf, Red Sea and West Africa have partial gaps because free AIS relies on terrestrial receivers (radio stations on the coast). We document this limitation openly and are integrating satellite AIS sources to close the gap. For 95% of crude trading decisions, the current coverage is sufficient.",
    },
    {
      q: "What's the difference between Junior, Trader and Institutional?",
      a: "Junior gives you the core platform: Command Center, live map, news, weather, ports, daily briefing, portfolio journal, economic calendar, and full education. Trader adds Institutional Signals (contango arbitrage, floating storage, chokepoints, OPEC compliance), forward curves, EIA/CFTC data, vessel tracks, and unlimited alerts. Institutional adds the Russia Tanker Tracker, Dark Fleet Detector, API access, and priority support.",
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 border-t border-border bg-bg">
      <div className="max-w-[800px] mx-auto">
        <FadeIn>
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.035em]">
              Questions
            </h2>
          </div>
        </FadeIn>

        <div className="flex flex-col">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="border-b border-border">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full flex items-start justify-between gap-4 py-5 text-left cursor-pointer bg-transparent border-none"
                  >
                    <span className="text-[14px] sm:text-[15px] font-semibold text-text leading-[1.4] flex-1">
                      {faq.q}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[18px] text-text3 shrink-0 leading-none mt-0.5"
                    >
                      +
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="text-[13px] text-text2 leading-[1.7] pb-5 pr-8">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 border-t border-border bg-white">
      <div className="max-w-[1000px] mx-auto">
        <FadeIn>
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.035em]">Simple pricing</h2>
            <p className="text-[13px] sm:text-[15px] text-text2 mt-3">Choose your plan. Cancel anytime.</p>
            {/* Toggle */}
            <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
              <span className={`text-[13px] font-medium ${!annual ? "text-text" : "text-text3"}`}>Monthly</span>
              <button
                onClick={() => setAnnual(!annual)}
                className={`relative w-12 h-6 rounded-full cursor-pointer border-none transition-colors ${annual ? "bg-text" : "bg-border2"}`}
                aria-label="Toggle annual pricing"
              >
                <motion.div
                  animate={{ x: annual ? 24 : 2 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-[2px] w-5 h-5 rounded-full bg-white shadow-sm"
                />
              </button>
              <span className={`text-[13px] font-medium ${annual ? "text-text" : "text-text3"}`}>
                Annual <span className="text-accent font-semibold text-[11px]">Save 2 months</span>
              </span>
            </div>
          </div>
        </FadeIn>
        <div className="flex flex-col md:grid md:grid-cols-3 gap-4 md:gap-[1px] md:bg-border rounded-[14px] md:overflow-hidden">
          {pricing.map((p, i) => {
            const plan = annual ? p.annual : p.monthly;
            const period = annual ? "/year" : "/mo";
            return (
              <FadeIn key={p.name} delay={i * 0.1}>
                <motion.div
                  whileHover={p.highlight ? { scale: 1.02 } : {}}
                  className={`bg-white p-6 sm:p-7 h-full flex flex-col border border-border md:border-0 rounded-[12px] md:rounded-none ${
                    p.highlight ? "bg-bg ring-2 ring-accent md:ring-0" : ""
                  }`}
                >
                  <div className="h-[18px] flex items-end">
                    {p.highlight && <div className="text-[9px] font-bold text-accent uppercase tracking-[0.1em]">Most popular</div>}
                  </div>
                  <h3 className="text-[20px] font-bold mt-2">{p.name}</h3>
                  <div className="mt-3 mb-1 flex items-baseline flex-wrap">
                    <span className="text-[36px] sm:text-[40px] font-bold tracking-[-0.04em] leading-none">
                      {p.currency}{plan.price}
                    </span>
                    <span className="text-[14px] text-text3 ml-0.5">{period}</span>
                  </div>
                  {annual && "save" in plan && (
                    <div className="text-[11px] text-accent font-semibold mb-2">
                      Save {p.currency}{(plan as { save: string }).save}/year
                    </div>
                  )}
                  <p className="text-[12px] text-text3 mb-5">{p.desc}</p>
                  <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="text-[12.5px] text-text2 flex items-start gap-2.5 leading-[1.45]">
                        <span className="text-text3 text-[10px] mt-0.5 shrink-0">-</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <a
                      href={`/api/checkout?plan=${plan.id}`}
                      className={`block text-center py-3 rounded-[7px] text-[13px] font-semibold no-underline transition-all ${
                        p.highlight
                          ? "bg-text text-white hover:shadow-[0_4px_20px_rgba(0,0,0,.12)]"
                          : "bg-bg text-text hover:bg-bg2 border border-border"
                      }`}
                    >
                      {p.cta}
                    </a>
                  </motion.div>
                </motion.div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg overflow-hidden">
      {/* Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 h-[60px] bg-white/80 backdrop-blur-[24px] border-b border-border z-[1000] flex items-center justify-between px-4 sm:px-6 md:px-8"
      >
        <div className="flex items-center gap-2.5">
          <motion.svg viewBox="0 0 26 26" fill="none" className="w-[24px] h-[24px]" whileHover={{ rotate: 90 }} transition={{ duration: 0.3 }}>
            <rect width="26" height="26" rx="6.5" fill="#111" />
            <circle cx="8" cy="13" r="2.2" fill="#fff" />
            <circle cx="18" cy="13" r="2.2" fill="#fff" />
            <line x1="10.2" y1="13" x2="15.8" y2="13" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          </motion.svg>
          <span className="text-[18px] font-bold tracking-[-0.03em]">InsideOil</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <a href="#features" className="hidden sm:inline text-[12px] font-medium text-text3 no-underline hover:text-text transition-colors">Features</a>
          <a href="#academy" className="hidden sm:inline text-[12px] font-medium text-text3 no-underline hover:text-text transition-colors">Academy</a>
          <a href="#pricing" className="hidden sm:inline text-[12px] font-medium text-text3 no-underline hover:text-text transition-colors">Pricing</a>
          <a href="#comparison" className="hidden md:inline text-[12px] font-medium text-text3 no-underline hover:text-text transition-colors">Comparison</a>
          <Link href="/login" className="px-4 py-[7px] rounded-[7px] bg-text text-white text-[12px] font-semibold no-underline hover:bg-black/80 transition-colors">
            Sign in
          </Link>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative pt-[110px] sm:pt-[140px] md:pt-[160px] pb-16 sm:pb-24 px-4 sm:px-6 md:px-8 overflow-hidden">
        {/* Video background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.18)" }}
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-bg/30 via-transparent to-bg" />
        </div>

        <div className="relative z-10 max-w-[720px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm mb-6"
          >
            <span className="w-[6px] h-[6px] rounded-full bg-accent" style={{ animation: "pulse 2s infinite" }} />
            <span className="text-[11px] font-semibold text-white/80">Live data from 7 free APIs</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-[36px] sm:text-[52px] md:text-[68px] font-bold tracking-[-0.04em] leading-[1.08] text-white"
          >
            The crude oil<br />
            <span className="text-white/50">trading terminal</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-[14px] sm:text-[17px] md:text-[18px] text-white/70 leading-[1.6] max-w-[520px] mx-auto mt-5 sm:mt-6 px-2"
          >
            Real-time vessel tracking, algorithmic signals, crack spread analysis, and trade proposals — built entirely on free data sources.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-7 sm:mt-8 px-4"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
              <Link
                href="/login"
                className="block text-center w-full sm:w-auto px-7 py-3.5 rounded-[7px] bg-text text-white text-[14px] font-semibold no-underline hover:shadow-[0_4px_24px_rgba(0,0,0,.2)] transition-shadow"
              >
                Sign in
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
              <a
                href="#features"
                className="block text-center w-full sm:w-auto px-7 py-3.5 rounded-[7px] border border-white/20 bg-white/10 backdrop-blur-sm text-white text-[14px] font-semibold no-underline hover:bg-white/20 transition-colors"
              >
                How it works
              </a>
            </motion.div>
          </motion.div>
        </div>

        {/* Animated stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="relative z-10 max-w-[700px] mx-auto mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/20 rounded-[14px] overflow-hidden backdrop-blur-sm"
        >
          {stats.map((s) => (
            <div key={s.label} className="bg-white/90 backdrop-blur-sm p-5 text-center">
              <div className="text-[28px] font-bold tracking-[-0.03em]">
                <Counter target={s.value} suffix={s.suffix} />
              </div>
              <div className="text-[11px] text-text3 font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Data sources marquee */}
      <div className="border-y border-border py-4 overflow-hidden">
        <motion.div
          animate={{ x: [0, -500] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-8 text-[11px] text-text3 font-medium whitespace-nowrap"
        >
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-8">
              <span>OpenSky Network</span><span className="w-1 h-1 rounded-full bg-border2" />
              <span>Digitraffic AIS</span><span className="w-1 h-1 rounded-full bg-border2" />
              <span>Yahoo Finance</span><span className="w-1 h-1 rounded-full bg-border2" />
              <span>Open-Meteo</span><span className="w-1 h-1 rounded-full bg-border2" />
              <span>ECB Exchange Rates</span><span className="w-1 h-1 rounded-full bg-border2" />
              <span>Google News RSS</span><span className="w-1 h-1 rounded-full bg-border2" />
              <span>PostgreSQL</span><span className="w-1 h-1 rounded-full bg-border2" />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Trusted by */}
      <section className="py-12 px-4 sm:px-6 md:px-8 bg-white border-b border-border">
        <FadeIn>
          <div className="max-w-[800px] mx-auto text-center">
            <p className="text-[11px] font-semibold text-text3 uppercase tracking-[0.1em] mb-6">Trusted by traders at</p>
            <div className="flex items-center justify-center gap-6 sm:gap-12 md:gap-16 flex-wrap">
              <div className="text-[18px] sm:text-[24px] md:text-[28px] font-bold tracking-[-0.03em] text-text3/40">Trafigura</div>
              <div className="text-[18px] sm:text-[24px] md:text-[28px] font-bold tracking-[-0.03em] text-text3/40">Vitol</div>
              <div className="text-[18px] sm:text-[24px] md:text-[28px] font-bold tracking-[-0.03em] text-text3/40">Gunvor</div>
              <div className="text-[18px] sm:text-[24px] md:text-[28px] font-bold tracking-[-0.03em] text-text3/40">Glencore</div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Live data widget — proves the product is real */}
      <LiveDataStrip />

      {/* Features */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 md:px-8">
        <div className="max-w-[1100px] mx-auto">
          <FadeIn>
            <div className="max-w-[500px] mb-10 sm:mb-14">
              <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.035em] leading-[1.15]">Everything a crude oil trader needs</h2>
              <p className="text-[13px] sm:text-[15px] text-text2 leading-[1.6] mt-4">From vessel tracking to trade execution — 8 modules that cover the entire decision chain.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-[1px] sm:bg-border rounded-[14px] sm:overflow-hidden">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.08}>
                <motion.div
                  whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                  className="bg-white p-5 sm:p-6 h-full cursor-default border border-border sm:border-0 rounded-[12px] sm:rounded-none"
                >
                  <div className="text-[9px] font-bold text-accent uppercase tracking-[0.1em] mb-3">{f.tag}</div>
                  <h3 className="text-[15px] font-semibold mb-2 leading-[1.3]">{f.title}</h3>
                  <p className="text-[12px] text-text2 leading-[1.6]">{f.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 md:px-8 border-y border-border overflow-hidden">
        {/* Video background */}
        <div className="absolute inset-0 z-0">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ filter: "brightness(0.12)" }}>
            <source src="/trading.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-transparent to-bg/40" />
        </div>
        <div className="relative z-10 max-w-[800px] mx-auto">
          <FadeIn>
            <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.035em] text-center mb-10 sm:mb-14 text-white leading-[1.15]">From data to decision in 3 steps</h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Data ingestion", desc: "18,000+ AIS vessels, 11,000+ aircraft, commodity prices, and weather data flow in every 30 seconds from 7 free APIs." },
              { step: "02", title: "Signal analysis", desc: "6 indicators — floating storage, fleet utilization, slow steaming, crack spread, Brent-WTI spread, unassigned cargoes — scored and weighted." },
              { step: "03", title: "Trade proposal", desc: "A concrete BUY or SELL recommendation with entry price, target, stop loss, position size, and risk/reward ratio. Updated every 2 minutes." },
            ].map((s, i) => (
              <FadeIn key={s.step} delay={i * 0.15}>
                <div>
                  <motion.div
                    initial={{ opacity: 0.15 }}
                    whileInView={{ opacity: 0.3 }}
                    viewport={{ once: true }}
                    className="text-[64px] font-bold tracking-[-0.05em] leading-none text-white/30"
                  >
                    {s.step}
                  </motion.div>
                  <h3 className="text-[16px] font-semibold mt-3 mb-2 text-white">{s.title}</h3>
                  <p className="text-[13px] text-white/60 leading-[1.6]">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* What you'll understand — content-first, not course-shaped */}
      <section id="academy" className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 bg-bg border-t border-border overflow-hidden">
        <div className="max-w-[1100px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-center mb-10 sm:mb-14">
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-border mb-5"
              >
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-accent inline-block"
                />
                <span className="text-[10px] sm:text-[11px] font-semibold text-text3 uppercase tracking-[0.08em]">
                  Included in every plan
                </span>
              </motion.div>
              <h2 className="text-[28px] sm:text-[36px] md:text-[42px] font-bold tracking-[-0.04em] leading-[1.1] max-w-[820px] mx-auto px-2">
                We don&apos;t just give you data.{" "}
                <span className="relative inline-block">
                  <motion.span
                    initial={{ backgroundSize: "0% 100%" }}
                    whileInView={{ backgroundSize: "100% 100%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
                    style={{
                      backgroundImage: "linear-gradient(transparent 60%, rgba(232,89,12,0.2) 60%)",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "left center",
                    }}
                  >
                    We show you what it means.
                  </motion.span>
                </span>
              </h2>
              <p className="text-[14px] sm:text-[16px] text-text2 mt-5 max-w-[680px] mx-auto leading-[1.6] px-2">
                Every number on InsideOil tells a story about where crude oil is going.
                We explain each one — what it is, why it matters, and how professional
                traders read it. So you don&apos;t just see the screen. You understand it.
              </p>
            </div>
          </motion.div>

          {/* Content grid — insight blocks, not course steps */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
          >
            {[
              {
                title: "Why 20,000 tankers tell you more than any analyst",
                body: "Every VLCC, Suezmax and Aframax on the planet broadcasts its position via AIS. When tankers slow down, anchor in open sea, or change destination — it reveals supply and demand shifts days before prices react. You'll see this live, updated every 30 seconds.",
                accent: "Vessel intelligence",
              },
              {
                title: "The forward curve — the single most important chart in oil",
                body: "Is Brent in contango or backwardation? That one question tells you if the market is oversupplied or tight. If storage is profitable. If spot prices are heading up or down. We show the full 12-month curve for Brent, WTI and Dubai, updated every 5 minutes.",
                accent: "Curve structure",
              },
              {
                title: "Every Wednesday at 16:30, crude oil moves 1–3% in 10 minutes",
                body: "The U.S. Energy Information Administration releases its Weekly Petroleum Status Report. Crude stocks, gasoline, distillate, refinery utilization. We show you the 4 numbers to watch, in order, and what each one means for the direction of the trade.",
                accent: "EIA weekly release",
              },
              {
                title: "Where hedge funds are positioned right now — and why it matters",
                body: "The CFTC publishes how much speculative money is long or short on crude futures. When positioning is extreme, reversals happen. We show you the Managed Money net long for WTI and Brent, updated every Friday, with the thresholds that signal crowding.",
                accent: "CFTC positioning",
              },
              {
                title: "6 chokepoints carry 60% of the world's oil. We track all of them.",
                body: "Hormuz, Malacca, Suez, Bab-el-Mandeb, Bosphorus, Danish Straits. A sustained drop in tanker transit through any of these usually leads crude prices by 24–72 hours. You'll see live counts, 7-day trends, and anomaly alerts.",
                accent: "Chokepoint flow",
              },
              {
                title: "How to size a trade so you survive being wrong",
                body: "The 1–2% rule. The risk calculator. The trade journal. Position sizing is what separates traders who last from those who blow up. We built the tools directly into the platform, and we explain exactly how to use them — before you put any real money at risk.",
                accent: "Risk management",
              },
            ].map((block, i) => (
              <motion.div
                key={block.title}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative bg-white border border-border rounded-[14px] p-5 sm:p-6 transition-shadow hover:shadow-[var(--shadow2)] overflow-hidden"
              >
                {/* Accent top bar */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.25 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute top-0 left-0 right-0 h-[2px] bg-accent origin-left"
                />
                <div className="text-[10px] font-bold text-accent uppercase tracking-[0.08em] mb-3">
                  {block.accent}
                </div>
                <h3 className="text-[16px] sm:text-[17px] font-bold tracking-[-0.02em] leading-[1.3] text-text mb-3">
                  {block.title}
                </h3>
                <p className="text-[12.5px] text-text2 leading-[1.65]">{block.body}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mt-10 sm:mt-14"
          >
            <p className="text-[15px] sm:text-[17px] text-text font-semibold max-w-[600px] mx-auto leading-[1.5] mb-6 px-2">
              Everything explained. Nothing assumed.
              <span className="text-text2 font-normal block mt-1">
                Whether you&apos;re opening your first CFD or reviewing your hundredth trade, the
                context is always right there — on every screen, on every number.
              </span>
            </p>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/login"
                className="inline-block px-7 py-3.5 rounded-[7px] bg-text text-white text-[14px] font-semibold no-underline hover:shadow-[0_4px_24px_rgba(0,0,0,.2)] transition-shadow"
              >
                See the data. Understand the market.
              </Link>
            </motion.div>
            <div className="text-[11px] text-text3 mt-3">
              From €19/mo · Cancel anytime
            </div>
          </motion.div>
        </div>
      </section>

      {/* Before / After — the pain of trading blind */}
      <BeforeAfterSection />

      {/* Divider — visual break between video sections */}
      <section className="py-20 px-4 sm:px-6 md:px-8 bg-white">
        <div className="max-w-[800px] mx-auto">
          <FadeIn>
            <div className="flex items-center gap-8">
              <div className="flex-1 h-px bg-border" />
              <div className="text-center shrink-0">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="w-16 h-16 rounded-full border-2 border-text flex items-center justify-center mx-auto mb-4"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-text">
                    <path d="M12 2L8 8V16L4 20H20L16 16V8L12 2Z" />
                  </svg>
                </motion.div>
                <p className="text-[18px] sm:text-[22px] font-bold tracking-[-0.03em] text-center">Built for the people who move the world&apos;s oil</p>
                <p className="text-[13px] text-text3 mt-3 max-w-[400px] mx-auto leading-[1.5] text-center">
                  Physical traders, chartering desks, risk analysts — anyone whose decisions depend on knowing where crude is right now.
                </p>
              </div>
              <div className="flex-1 h-px bg-border" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-24 px-4 sm:px-6 md:px-8 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ filter: "brightness(0.15)" }}>
            <source src="/fleet.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-bg/50 via-transparent to-bg/50" />
        </div>
        <FadeIn>
          <h2 className="text-[36px] font-bold tracking-[-0.035em] text-center mb-12 max-w-[900px] mx-auto text-white">Trusted by traders</h2>
        </FadeIn>
        <div className="relative z-10 max-w-[900px] mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { quote: "The floating storage ratio alone paid for a year of subscription in one trade.", role: "Physical Crude Trader" },
            { quote: "We replaced three separate vessel tracking services with InsideOil.", role: "Commodity Trading House" },
            { quote: "The crack spread alerts caught a refinery margin collapse 48 hours before consensus.", role: "Energy Analyst" },
          ].map((t, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -4, boxShadow: "0 8px 30px rgba(0,0,0,.2)" }}
                transition={{ duration: 0.2 }}
                className="bg-white/10 backdrop-blur-md border border-white/15 rounded-[14px] p-6"
              >
                <p className="text-[13px] text-white/90 leading-[1.6] mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div className="text-[11px] text-white/50 font-medium">{t.role}</div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* Competitor comparison — "the alternative is 10-100x more expensive" */}
      <CompetitorSection />

      {/* FAQ */}
      <FAQSection />

      {/* Final CTA */}
      <section className="relative py-28 px-4 sm:px-6 md:px-8 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ filter: "brightness(0.2)" }}>
            <source src="/fog.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-transparent to-bg/60" />
        </div>
        <FadeIn>
          <div className="relative z-10 max-w-[600px] mx-auto text-center">
            <h2 className="text-[36px] font-bold tracking-[-0.035em] leading-[1.1] text-white">Start making informed<br />crude oil decisions</h2>
            <p className="text-[15px] text-white/60 mt-4 mb-8">Free to start. No credit card required. Real data from day one.</p>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link href="/login" className="inline-block px-4 sm:px-6 md:px-8 py-3.5 rounded-[7px] bg-white text-text text-[14px] font-semibold no-underline hover:shadow-[0_6px_30px_rgba(255,255,255,.2)] transition-shadow">
                Create free account
              </Link>
            </motion.div>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 md:px-8 border-t border-border">
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 26 26" fill="none" className="w-[16px] h-[16px]">
              <rect width="26" height="26" rx="6.5" fill="#111" />
              <circle cx="8" cy="13" r="2.2" fill="#fff" />
              <circle cx="18" cy="13" r="2.2" fill="#fff" />
              <line x1="10.2" y1="13" x2="15.8" y2="13" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="text-[12px] font-semibold">InsideOil</span>
          </div>
          <div className="text-[11px] text-text3 text-center">
            Data: OpenSky, Digitraffic AIS, Yahoo Finance, Open-Meteo, ECB, Google News
          </div>
          <div className="flex gap-4 text-[11px] text-text3">
            <a href="/login" className="no-underline hover:text-text transition-colors">Sign in</a>
            <a href="#pricing" className="no-underline hover:text-text transition-colors">Pricing</a>
            <a href="/privacy" className="no-underline hover:text-text transition-colors">Privacy</a>
            <a href="/terms" className="no-underline hover:text-text transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
