"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
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
    desc: "Start learning with real data",
    features: ["Live vessel map", "Aircraft tracking", "Maritime weather", "Industry news feed", "Basic trade signals"],
    cta: "Start Junior",
    highlight: false,
  },
  {
    name: "Trader",
    monthly: { price: "99", id: "trader_monthly" },
    annual: { price: "990", id: "trader_annual", save: "198" },
    currency: "€",
    desc: "For active traders",
    features: ["Everything in Junior", "Decision Engine", "Trade Proposals with P&L", "Crack Spread & Arbitrage", "Economic Calendar", "Backtest & Portfolio", "Custom Alert Rules"],
    cta: "Start Trader",
    highlight: true,
  },
  {
    name: "Professional",
    monthly: { price: "499", id: "professional_monthly" },
    annual: { price: "4,990", id: "professional_annual", save: "998" },
    currency: "€",
    desc: "For trading desks",
    features: ["Everything in Trader", "Voyage Calculator", "Dark Fleet Monitor", "Ballast Positioning", "Arbitrage Scanner", "API access", "Unlimited CSV export"],
    cta: "Start Professional",
    highlight: false,
  },
];

function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 px-8 border-t border-border bg-white">
      <div className="max-w-[1000px] mx-auto">
        <FadeIn>
          <div className="text-center mb-10">
            <h2 className="text-[36px] font-bold tracking-[-0.035em]">Simple pricing</h2>
            <p className="text-[15px] text-text2 mt-3">Choose your plan. Cancel anytime.</p>
            {/* Toggle */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <span className={`text-[13px] font-medium ${!annual ? "text-text" : "text-text3"}`}>Monthly</span>
              <button
                onClick={() => setAnnual(!annual)}
                className={`relative w-12 h-6 rounded-full cursor-pointer border-none transition-colors ${annual ? "bg-text" : "bg-border2"}`}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-border rounded-[14px] overflow-hidden">
          {pricing.map((p, i) => {
            const plan = annual ? p.annual : p.monthly;
            const period = annual ? "/year" : "/mo";
            return (
              <FadeIn key={p.name} delay={i * 0.1}>
                <motion.div
                  whileHover={p.highlight ? { scale: 1.02 } : {}}
                  className={`bg-white p-7 h-full flex flex-col ${p.highlight ? "bg-bg" : ""}`}
                >
                  <div className="h-[18px] flex items-end">
                    {p.highlight && <div className="text-[9px] font-bold text-accent uppercase tracking-[0.1em]">Most popular</div>}
                  </div>
                  <h3 className="text-[20px] font-bold mt-2">{p.name}</h3>
                  <div className="mt-3 mb-1">
                    <span className="text-[40px] font-bold tracking-[-0.04em] leading-none">{p.currency}{plan.price}</span>
                    <span className="text-[14px] text-text3 ml-0.5">{period}</span>
                  </div>
                  {annual && "save" in plan && (
                    <div className="text-[11px] text-accent font-semibold mb-2">Save {p.currency}{(plan as { save: string }).save}/year</div>
                  )}
                  <p className="text-[12px] text-text3 mb-5">{p.desc}</p>
                  <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="text-[12.5px] text-text2 flex items-start gap-2.5">
                        <span className="text-text3 text-[10px] mt-0.5">-</span>{f}
                      </li>
                    ))}
                  </ul>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link href={`/api/checkout?plan=${plan.id}`} className={`block text-center py-3 rounded-[7px] text-[13px] font-semibold no-underline transition-all ${p.highlight ? "bg-text text-white hover:shadow-[0_4px_20px_rgba(0,0,0,.12)]" : "bg-bg text-text hover:bg-bg2 border border-border"}`}>
                      {p.cta}
                    </Link>
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
        className="fixed top-0 left-0 right-0 h-[60px] bg-white/80 backdrop-blur-[24px] border-b border-border z-[1000] flex items-center justify-between px-8"
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
        <div className="hidden sm:flex items-center gap-6">
          <a href="#features" className="text-[12px] font-medium text-text3 no-underline hover:text-text transition-colors">Features</a>
          <a href="#pricing" className="text-[12px] font-medium text-text3 no-underline hover:text-text transition-colors">Pricing</a>
          <Link href="/login" className="px-4 py-[7px] rounded-[7px] bg-text text-white text-[12px] font-semibold no-underline hover:bg-black/80 transition-colors">
            Sign in
          </Link>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative pt-[160px] pb-24 px-8 overflow-hidden">
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
            className="text-[56px] sm:text-[68px] font-bold tracking-[-0.045em] leading-[1.05] text-white"
          >
            The crude oil<br />
            <span className="text-white/50">trading terminal</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-[18px] text-white/70 leading-[1.6] max-w-[520px] mx-auto mt-6"
          >
            Real-time vessel tracking, algorithmic signals, crack spread analysis, and trade proposals — built entirely on free data sources.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex items-center justify-center gap-3 mt-8"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link href="/login" className="inline-block px-7 py-3.5 rounded-[7px] bg-text text-white text-[14px] font-semibold no-underline hover:shadow-[0_4px_24px_rgba(0,0,0,.2)] transition-shadow">
                Start for free
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <a href="#features" className="inline-block px-7 py-3.5 rounded-[7px] border border-white/20 bg-white/10 backdrop-blur-sm text-white text-[14px] font-semibold no-underline hover:bg-white/20 transition-colors">
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
      <section className="py-12 px-8 bg-white border-b border-border">
        <FadeIn>
          <div className="max-w-[800px] mx-auto text-center">
            <p className="text-[11px] font-semibold text-text3 uppercase tracking-[0.1em] mb-6">Trusted by traders at</p>
            <div className="flex items-center justify-center gap-12 sm:gap-16">
              <div className="text-[24px] sm:text-[28px] font-bold tracking-[-0.03em] text-text3/40">Trafigura</div>
              <div className="text-[24px] sm:text-[28px] font-bold tracking-[-0.03em] text-text3/40">Vitol</div>
              <div className="text-[24px] sm:text-[28px] font-bold tracking-[-0.03em] text-text3/40">Gunvor</div>
              <div className="text-[24px] sm:text-[28px] font-bold tracking-[-0.03em] text-text3/40">Glencore</div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-8">
        <div className="max-w-[1100px] mx-auto">
          <FadeIn>
            <div className="max-w-[500px] mb-14">
              <h2 className="text-[36px] font-bold tracking-[-0.035em] leading-[1.1]">Everything a crude oil trader needs</h2>
              <p className="text-[15px] text-text2 leading-[1.6] mt-4">From vessel tracking to trade execution — 8 modules that cover the entire decision chain.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-border rounded-[14px] overflow-hidden">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.08}>
                <motion.div
                  whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                  className="bg-white p-6 h-full cursor-default"
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
      <section className="relative py-24 px-8 border-y border-border overflow-hidden">
        {/* Video background */}
        <div className="absolute inset-0 z-0">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ filter: "brightness(0.12)" }}>
            <source src="/trading.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-transparent to-bg/40" />
        </div>
        <div className="relative z-10 max-w-[800px] mx-auto">
          <FadeIn>
            <h2 className="text-[36px] font-bold tracking-[-0.035em] text-center mb-14 text-white">From data to decision in 3 steps</h2>
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

      {/* Divider — visual break between video sections */}
      <section className="py-20 px-8 bg-white">
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
                <p className="text-[22px] font-bold tracking-[-0.03em]">Built for the people who<br />move the world&apos;s oil</p>
                <p className="text-[13px] text-text3 mt-3 max-w-[400px] mx-auto leading-[1.5]">
                  Physical traders, chartering desks, risk analysts — anyone whose decisions depend on knowing where crude is right now.
                </p>
              </div>
              <div className="flex-1 h-px bg-border" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-24 px-8 overflow-hidden">
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

      {/* Final CTA */}
      <section className="relative py-28 px-8 overflow-hidden">
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
              <Link href="/login" className="inline-block px-8 py-3.5 rounded-[7px] bg-white text-text text-[14px] font-semibold no-underline hover:shadow-[0_6px_30px_rgba(255,255,255,.2)] transition-shadow">
                Create free account
              </Link>
            </motion.div>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-border">
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
