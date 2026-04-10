"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";

/**
 * Education hub — explains every piece of data and feature in InsideOil,
 * written for retail traders who use CFDs or oil futures.
 *
 * IMPORTANT: when adding any new feature/data source to the platform, add
 * a new section here as well. This file is the single source of truth for
 * "what does this thing mean" for the customer.
 */

const SECTIONS: Array<{ id: string; title: string; content: React.ReactNode }> = [
  {
    id: "intro",
    title: "Welcome — what is InsideOil",
    content: (
      <>
        <p>
          InsideOil is an institutional-grade oil intelligence platform built for retail traders.
          It collects the same data feeds that hedge funds, refiners and physical traders use
          (live AIS vessel positions, futures curves, freight indices, refinery margins, OPEC+
          loadings) and turns them into <strong>actionable signals</strong> you can use to trade
          crude oil CFDs (Brent / WTI), futures (CL, BZ on Nymex/ICE), or related instruments.
        </p>
        <p>
          Most retail traders react to news with a 2-12 hour lag. With InsideOil you see the
          underlying flows as they happen. A drop in Hormuz transit, a spike in floating storage,
          a surprise EIA inventory build — you see it before it&apos;s a Bloomberg headline.
        </p>
        <p className="text-text2 italic">
          This page is your reference manual. Every metric and feature on the platform is
          explained here. If you ever wonder &quot;what does this number mean&quot; or &quot;how do I trade
          this&quot;, scroll to the right section.
        </p>
      </>
    ),
  },
  {
    id: "markets-101",
    title: "1. Crude oil markets 101",
    content: (
      <>
        <h3>The two big benchmarks</h3>
        <ul>
          <li>
            <strong>Brent crude</strong> (BZ on ICE) — light sweet crude from the North Sea.
            The reference for ~70% of global oil. Loaded at Sullom Voe / Forties terminal.
          </li>
          <li>
            <strong>WTI crude</strong> (CL on Nymex) — light sweet crude from west Texas /
            Cushing Oklahoma. The US benchmark. Delivered at Cushing pipeline hub.
          </li>
          <li>
            <strong>Dubai/Oman</strong> — the Mid-East benchmark used for Asian sales.
            Heavier and sourer than Brent. We synthesise it from Brent − EFS spread.
          </li>
        </ul>

        <h3>Forward curve: contango vs backwardation</h3>
        <p>
          Crude trades not just at one price but as a curve of futures prices stretching out
          12-60 months. The shape of the curve tells you what the market thinks:
        </p>
        <ul>
          <li>
            <strong>Contango</strong> — futures higher than spot. Means market is OVERSUPPLIED.
            Storage trade is profitable: buy now, store, sell forward. Bearish for spot prices.
          </li>
          <li>
            <strong>Backwardation</strong> — futures LOWER than spot. Means market is TIGHT.
            Buyers will pay premium for prompt delivery. Bullish for spot prices.
          </li>
          <li>
            <strong>Flat</strong> — neither. Balanced market.
          </li>
        </ul>

        <h3>Refining margin (crack spread)</h3>
        <p>
          Refineries buy crude and sell gasoline + diesel. Their margin is called the &quot;crack
          spread&quot;. The most common is the <strong>3-2-1 crack</strong>: for every 3 barrels of
          crude refined, you get ~2 barrels of gasoline and ~1 of distillate (heating oil/diesel).
        </p>
        <p className="font-mono text-[11px] bg-bg2 p-2 rounded">
          Crack 3-2-1 = (2 × Gasoline_$/bbl + Heating Oil_$/bbl − 3 × Crude_$/bbl) / 3
        </p>
        <p>
          Above $25/bbl = healthy demand for crude (refineries buying aggressively). Below $15/bbl
          = refineries cutting runs (bearish for crude).
        </p>

        <h3>OPEC+ — the cartel</h3>
        <p>
          OPEC+ is the alliance of OPEC (Saudi, Iraq, Iran, Kuwait, UAE, Venezuela, Nigeria,
          Angola, Algeria, Libya, Equatorial Guinea, Congo, Gabon) plus Russia and other
          non-OPEC producers. They publish monthly production quotas. Real production vs the
          quota is the most important supply signal.
        </p>
      </>
    ),
  },
  {
    id: "data-sources",
    title: "2. Data sources we use",
    content: (
      <>
        <p>Everything in InsideOil comes from <strong>free public data</strong>. No paid APIs.</p>
        <ul>
          <li>
            <strong>AISStream.io</strong> — global AIS (vessel positions). WebSocket feed,
            free. ~21,000 vessels live at any time. Coverage strongest in EU/US/East Asia.
            Persian Gulf, Red Sea and West Africa are partially dark.
          </li>
          <li>
            <strong>OpenSky Network</strong> — global ADS-B (aircraft positions). Used to track
            cargo airlines (FedEx, UPS, Cargolux, etc.) as a proxy for global air freight activity.
          </li>
          <li>
            <strong>Yahoo Finance</strong> — futures and ETF prices. WTI (CL=F), Brent (BZ=F),
            RBOB Gasoline (RB=F), Heating Oil (HO=F), Natural Gas (NG=F). 15-min delayed.
          </li>
          <li>
            <strong>EIA</strong> (US Energy Information Administration) — weekly inventory data
            (crude stocks, gasoline, distillate, SPR), refinery utilization. Released every
            Wednesday at 16:30 CET — the single most price-moving event of the week for retail.
          </li>
          <li>
            <strong>CFTC</strong> (US Commodity Futures Trading Commission) — Commitments of
            Traders report. Weekly speculative positioning of Managed Money on WTI and Brent.
            Released every Friday for the prior Tuesday.
          </li>
          <li>
            <strong>Open-Meteo</strong> — weather (wind, waves, temperature) at strategic
            maritime waypoints. Free, no key.
          </li>
          <li>
            <strong>Google News RSS</strong> — filtered news feed for oil/crude/tanker keywords.
          </li>
          <li>
            <strong>Baltic Exchange (synthetic)</strong> — official BDTI (Baltic Dirty Tanker
            Index) is paywalled. We proxy it via the BWET ETF and a calibration formula.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "command-center",
    title: "3. Command Center (/dashboard)",
    content: (
      <>
        <p>
          The home page. Everything at a glance. Auto-refreshes every 15-300 seconds depending
          on the data. Use it as your morning &quot;market open&quot; check.
        </p>
        <h3>Decision Engine (top-left card)</h3>
        <p>
          A composite recommendation (STRONG BUY → STRONG SELL) computed by weighting all the
          inputs: futures prices, spreads, fleet behavior, weather, news. <strong>How to use:</strong>
          if STRONG BUY with HIGH confidence → consider opening a long position. Always click
          &quot;View full analysis&quot; before trading to see WHY.
        </p>
        <h3>Commodity Prices row</h3>
        <p>
          WTI, Brent, Gasoline, Heating Oil, Natural Gas + Brent-WTI spread. Each tile shows
          price and % change vs previous close. <strong>Trade idea:</strong> if Brent-WTI widens
          above $5, US barrels become attractive for European buyers — consider long CL futures.
        </p>
        <h3>WTI 3-month chart + Crack Spread chart</h3>
        <p>
          Sparkline of WTI front month + Crack Spread. <strong>Trade idea:</strong> if crack
          spread crashes below $15 it&apos;s a sign refineries are about to cut runs. Bearish for
          crude. Reduce longs / consider short.
        </p>
        <h3>Fleet stats row (8 KPI boxes)</h3>
        <ul>
          <li><strong>Aircraft / Cargo Flights</strong>: live OpenSky data. Cargo Flights is a leading indicator of global trade volume.</li>
          <li><strong>AIS Vessels / Tankers</strong>: total ships in our feed.</li>
          <li><strong>Moving / Anchored</strong>: activity status. High moving ratio = strong demand.</li>
          <li><strong>Storage Ratio</strong>: anchored tankers ÷ total. Above 40% = oversupply (bearish).</li>
          <li><strong>Crack Spread</strong>: live 3-2-1 in $/bbl.</li>
        </ul>
        <p>
          Hover the small <strong>i</strong> next to each label to see the full explanation
          inline. Click the floating <strong>?</strong> bottom-right for a complete page guide.
        </p>
      </>
    ),
  },
  {
    id: "trade",
    title: "4. Trade Intelligence (/trade)",
    content: (
      <>
        <p>
          Tanker fleet analytics, chokepoints, route flows, trading signals — all from real AIS data.
        </p>
        <h3>Tanker Overview</h3>
        <p>
          Total tankers, moving vs anchored, slow steaming count, average speed. <strong>Trade
          idea:</strong> avg speed below 10 knots usually means oversupply (carriers absorbing
          capacity by slow steaming). Avg above 12 = urgency, bullish.
        </p>
        <h3>Trading Signals</h3>
        <p>
          Each row is BULL / NEUT / BEAR. Built from real fleet behavior:
        </p>
        <ul>
          <li><strong>Floating Storage Ratio</strong> (anchored ÷ total): &gt;40% bearish, &lt;25% bullish.</li>
          <li><strong>Slow Steaming Ratio</strong> (% of moving fleet doing &lt;8kn): &gt;30% bearish.</li>
          <li><strong>Fleet Utilization</strong> (moving ÷ total): &gt;70% bullish.</li>
        </ul>
        <h3>Chokepoints (Baltic-focused on this page)</h3>
        <p>
          Vessel counts in 6 strategic chokepoints. The /signals page has the global version
          with delta vs 7-day average — much more useful for trading.
        </p>
        <h3>Top Tanker Destinations</h3>
        <p>
          Where tankers are heading (from AIS &quot;destination&quot; field). A surge of vessels heading
          to a country signals demand build-up there 1-3 weeks ahead.
        </p>
      </>
    ),
  },
  {
    id: "signals",
    title: "5. Institutional Signals (/signals)",
    content: (
      <>
        <p>
          The flagship page. Four signals that hedge funds pay 80k€/year for (Kpler / Vortexa
          / ClipperData). All free here.
        </p>

        <h3>5.1 Contango Arbitrage (Brent / WTI)</h3>
        <p>
          When the forward curve is in contango, you can theoretically buy crude now, store it
          on a chartered VLCC, and sell forward via futures. Profitable when:
        </p>
        <p className="font-mono text-[11px] bg-bg2 p-2 rounded">
          contango_per_bbl &gt; freight_cost + financing + insurance
        </p>
        <p>
          The table shows P/L per barrel for every forward tenor (1M-12M). Profitable rows are
          highlighted. <strong>How to trade as retail:</strong> you can&apos;t actually charter a VLCC,
          but the arb tells you about market regime. BULLISH STORAGE = oversupply piling up = bearish
          spot = consider short CL/BZ. NO ARB = balanced or tight market.
        </p>

        <h3>5.2 Floating Storage Detector</h3>
        <p>
          Identifies VLCC tankers idle &gt;5 days in open sea (the classic floating storage
          signature). <strong>Trade idea:</strong> growing count of stored VLCCs = confirmed
          bearish trend. Sudden drop = barrels coming back to market, can be bullish if combined
          with rising crack spreads.
        </p>

        <h3>5.3 Oil Chokepoint Flow</h3>
        <p>
          Live tanker count + 24h transits + 7-day moving average for 6 critical chokepoints
          (Hormuz 21% of global oil, Malacca 16%, Suez 9%, Bab-el-Mandeb 8%, Bosphorus 3%,
          Danish Straits 3%). <strong>Trade idea:</strong> a sustained −20% drop in Hormuz or
          Bab-el-Mandeb transit usually leads crude prices by 24-72 hours. Setup: long BZ
          futures or CFD Brent on the alert, hold 2-5 days, target +3-5%.
        </p>

        <h3>5.4 OPEC+ Compliance Scoring</h3>
        <p>
          Counts tankers leaving OPEC+ loading terminals via AIS, estimates volumes, compares
          to quotas. <strong>Trade idea:</strong> Saudi loading +5% above quota = bearish 1-2
          weeks. Russian Baltic exports dropping = bullish Brent. Note: Persian Gulf coverage
          is weak in the free feed, so Saudi/Iraq numbers underestimate. Russian Baltic is well
          covered.
        </p>

        <h3>5.5 BDTI / VLCC TCE</h3>
        <p>
          Tanker freight benchmark. Sky-high BDTI means tanker capacity is scarce.
          <strong> Trade idea:</strong> rising BDTI + rising crude = healthy bullish trend.
          Rising BDTI + falling crude = freight squeeze, can fade rallies.
        </p>

        <h3>5.6 Forward Curve Structure</h3>
        <p>
          CONTANGO / BACKWARDATION / FLAT for Brent and WTI with the 6M spread. Use as the
          regime indicator before any swing trade.
        </p>
      </>
    ),
  },
  {
    id: "russia",
    title: "6. Russia Tanker Tracker (/russia)",
    content: (
      <>
        <p>
          Live activity at Russian crude export terminals (Primorsk, Ust-Luga, Novorossiysk,
          Kozmino) plus a dark fleet detector. Russia exports ~5 million b/d. Since 2022
          sanctions, much of it moves on &quot;dark fleet&quot; tankers operating outside G7 insurance.
        </p>
        <h3>Why retail should care</h3>
        <p>
          Sanctions news on Russia is the single biggest geopolitical driver of Brent prices in
          2024-2026. When EU adds names to the sanctions list, spreads move within hours.
        </p>
        <h3>Dark Fleet Detector</h3>
        <p>
          Flags tankers near Russian terminals with one of:
        </p>
        <ul>
          <li>No IMO number (suspicious — modern tankers always have IMO)</li>
          <li>No destination field (intentionally hidden)</li>
        </ul>
        <p>
          These are sanctions evasion signatures. Spike in flagged vessels = sanctioned crude
          loading active. <strong>Trade idea:</strong> spike + sanctions news = long Brent
          (supply tightens), 1-7 day swing.
        </p>
      </>
    ),
  },
  {
    id: "differentials",
    title: "7. Differentials & Macro (/differentials)",
    content: (
      <>
        <p>The macro page. Cross-region spreads, EIA inventories, CFTC positioning.</p>

        <h3>Brent − WTI spread</h3>
        <p>
          Atlantic basin spread. Above $5/bbl = Brent rich, US barrels flow east → bullish WTI.
          Below $2 = no arbitrage incentive. Spreads occasionally invert (rare).
        </p>

        <h3>Brent − Dubai EFS</h3>
        <p>
          Brent vs Mid-East benchmark. Wide EFS = Atlantic crude trading at premium → cheap to
          ship Mid-East crude west. Tight EFS = Asian buyers prefer Mid-East. <strong>Trade
          idea:</strong> EFS widening rapidly = potential long Dubai (or short Brent) swing.
        </p>

        <h3>USGC → Asia arbitrage</h3>
        <p>
          Computes whether shipping WTI from US Gulf Coast to Asia is profitable vs buying
          Dubai locally. Positive = arb open, US barrels go east. <strong>Trade idea:</strong>
          arb opening = bullish WTI demand → long CL.
        </p>

        <h3>EIA Weekly Petroleum Status (Wednesday 16:30 CET)</h3>
        <p>
          The most important weekly data release for retail oil traders. Watch the &quot;crude stocks
          change&quot; line:
        </p>
        <ul>
          <li>Build &gt; +2 Mbbl above expectation = bearish surprise → short CL</li>
          <li>Draw &gt; −2 Mbbl below expectation = bullish surprise → long CL</li>
          <li>Refinery utilization &gt;92% = strong demand for crude</li>
          <li>SPR refilling = bullish structural</li>
        </ul>

        <h3>CFTC Commitments of Traders (Friday)</h3>
        <p>
          Managed Money net long contracts on WTI and Brent. Updated weekly for the prior
          Tuesday.
        </p>
        <ul>
          <li>Net long &gt; 300k contracts = crowded, risk of long unwind</li>
          <li>Net long &lt; 50k = bearish exhaustion, contrarian bullish setup</li>
          <li>Sudden 30% move WoW = positioning shift, often confirms a trend change</li>
        </ul>
      </>
    ),
  },
  {
    id: "vessels",
    title: "8. Vessel Detail (/vessels/[mmsi])",
    content: (
      <>
        <p>
          Click any vessel name in the platform to see its detail page: identity, current
          position, and recent route on a map.
        </p>
        <h3>What you see</h3>
        <ul>
          <li>MMSI / IMO / call sign / ship type</li>
          <li>Current speed, course, draught, navigation status</li>
          <li>Destination + ETA from AIS broadcast</li>
          <li>Map with the recent track (6h / 24h / 72h / 7d windows)</li>
          <li>External provider links (MarineTraffic, VesselFinder, FleetMon, MyShipTracking)</li>
        </ul>
        <h3>Why useful</h3>
        <p>
          When a flagged vessel appears in our Floating Storage or Dark Fleet detector, click
          on it. You see immediately if it&apos;s really stationary, what its destination claims to
          be, and you can cross-check on MarineTraffic with one click.
        </p>
      </>
    ),
  },
  {
    id: "alerts",
    title: "9. Personal Alerts (/alerts)",
    content: (
      <>
        <p>
          Set custom thresholds on any metric and get an email when triggered. The cron loop
          checks every 5 minutes.
        </p>
        <h3>Example alerts to set</h3>
        <ul>
          <li>
            <strong>Brent breaks $90</strong>: BRENT_PRICE &gt; 90. Tell you the moment Brent
            crosses a key technical level.
          </li>
          <li>
            <strong>BDTI freight spike</strong>: BDTI changes by % &gt; 15. Alert on sudden
            freight squeezes.
          </li>
          <li>
            <strong>Hormuz disruption</strong>: HORMUZ_TANKERS changes by % &gt; 20. Catch
            geopolitical events early.
          </li>
          <li>
            <strong>Brent-WTI arbitrage opens</strong>: BRENT_WTI_SPREAD &gt; 5. Trans-Atlantic
            trade opportunity.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "tracking",
    title: "10. Live Map (/tracking)",
    content: (
      <>
        <p>
          Real-time global map of vessels and aircraft. Visual exploration, not analytics.
          Use it to:
        </p>
        <ul>
          <li>Zoom into a region you care about (US Gulf, Singapore, Mediterranean)</li>
          <li>Confirm a signal visually (e.g. when floating storage flags a vessel, find it on the map)</li>
          <li>Spot clusters of activity that haven&apos;t shown up in any specific signal yet</li>
        </ul>
      </>
    ),
  },
  {
    id: "ports-weather-news",
    title: "11. Ports / Weather / News",
    content: (
      <>
        <h3>Ports (/ports)</h3>
        <p>
          Live vessel count at major ports with congestion classification (high / medium / low).
          High congestion at oil terminals tightens local supply 1-2 weeks downstream.
        </p>
        <h3>Weather (/weather)</h3>
        <p>
          Live wind, waves and temperature at strategic maritime waypoints. <strong>Trade
          idea:</strong> hurricane Cat-3+ in Gulf of Mexico → US production halt → long CL,
          1-3 day spike. North Sea storm → Brent loadings delayed → bullish prompt physical.
        </p>
        <h3>News (/news)</h3>
        <p>
          Filtered Google News RSS for oil/crude/tanker/OPEC keywords. Use as a sentiment scan.
          A sudden cluster of stories on Houthis / Suez / OPEC always precedes a price move by
          hours-days.
        </p>
      </>
    ),
  },
  {
    id: "playbook-cfd",
    title: "12. Practical playbook for CFD / futures traders",
    content: (
      <>
        <h3>Day trading / scalp (hours)</h3>
        <ul>
          <li>Watch /news for headline shocks → momentum trades 1-4 hours</li>
          <li>Watch /weather for Gulf hurricanes → instant catalysts</li>
          <li>Watch /signals chokepoint card for sudden Hormuz/Bab-el-Mandeb anomalies</li>
        </ul>
        <h3>Swing trading (1-7 days)</h3>
        <ul>
          <li>Wednesday 16:30 CET — EIA inventory release. Surprise vs expectation → short-term swing.</li>
          <li>Use /signals contango status as regime confirm</li>
          <li>Use /russia for sanctions news catalysts</li>
          <li>Use /signals OPEC compliance for supply shocks</li>
        </ul>
        <h3>Position trading (weeks-months)</h3>
        <ul>
          <li>Use /differentials Brent-WTI / EFS as cross-region signals</li>
          <li>Use CFTC positioning for crowded-trade warnings</li>
          <li>Use SPR levels for structural bullish/bearish bias</li>
          <li>Use /signals curve structure for major regime shifts</li>
        </ul>
        <h3>Risk management — non negotiable</h3>
        <ul>
          <li>Never risk more than 1-2% of capital on a single trade</li>
          <li>Always use stop loss (Brent/WTI can move $5-10 in hours on news)</li>
          <li>For CFDs, pay attention to overnight financing — long oil with high interest rates is expensive</li>
          <li>Avoid trading during EIA release (16:30 CET Wed) without a defined plan</li>
          <li>InsideOil signals are inputs, not financial advice — combine with your own analysis</li>
        </ul>
      </>
    ),
  },
  {
    id: "instruments",
    title: "13. Instruments retail traders use",
    content: (
      <>
        <h3>Crude oil futures</h3>
        <ul>
          <li><strong>CL</strong> (WTI Crude) on Nymex. 1 contract = 1,000 barrels. Tick = $10.</li>
          <li><strong>BZ</strong> (Brent Crude) on ICE. 1 contract = 1,000 barrels.</li>
          <li><strong>QM</strong> (E-mini WTI Crude) on Nymex. 500 barrels — half size for retail.</li>
          <li><strong>MCL</strong> (Micro WTI Crude) on Nymex. 100 barrels — accessible for small accounts.</li>
        </ul>
        <h3>Crude oil CFDs (most retail brokers)</h3>
        <p>
          CFDs on WTI and Brent are offered by most retail brokers. Pros: low capital, fractional
          contracts. Cons: spread (0.03-0.10), overnight financing, not regulated as strictly.
        </p>
        <h3>Oil ETFs (for non-leveraged exposure)</h3>
        <ul>
          <li><strong>USO</strong> — United States Oil Fund (WTI futures based)</li>
          <li><strong>BNO</strong> — United States Brent Oil Fund</li>
          <li><strong>XOP</strong> — S&amp;P Oil & Gas Exploration ETF (equities)</li>
          <li><strong>OIH</strong> — Oil Services ETF</li>
        </ul>
        <h3>Options on oil</h3>
        <p>
          For directional plays with defined risk: monthly CL options on Nymex. For event trades
          (e.g. EIA release), buying weekly straddles a few days before is a known retail strategy.
          High premium decay — only for experienced.
        </p>
      </>
    ),
  },
];

export default function EducationPage() {
  const [active, setActive] = useState("intro");

  // Highlight the section currently in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-30% 0px -65% 0px" }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <AppShell>
      <div className="animate-fade-in max-w-[1400px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
        <div className="mb-8">
          <div className="text-[11px] font-semibold text-text3 uppercase tracking-[0.07em]">Knowledge Base</div>
          <h1 className="text-[30px] font-bold tracking-[-0.035em] mt-1">Education</h1>
          <p className="text-sm text-text3 mt-1">
            Every metric, every page, every data feed — explained in plain language for traders.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          {/* Sidebar nav */}
          <aside className="lg:sticky lg:top-[calc(var(--nav-h)+24px)] lg:self-start lg:max-h-[calc(100vh-var(--nav-h)-48px)] lg:overflow-y-auto">
            <nav className="flex flex-col gap-1 text-[12px]">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`px-3 py-1.5 rounded-[var(--radius-xs)] transition-colors no-underline leading-[1.3] ${
                    active === s.id
                      ? "bg-text text-white font-semibold"
                      : "text-text2 hover:bg-black/5 hover:text-text"
                  }`}
                >
                  {s.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <article className="prose-style max-w-none">
            {SECTIONS.map((s) => (
              <section
                key={s.id}
                id={s.id}
                className="mb-10 scroll-mt-[calc(var(--nav-h)+16px)]"
              >
                <h2 className="text-[22px] font-bold tracking-[-0.025em] text-text mb-4 pb-2 border-b border-border">
                  {s.title}
                </h2>
                <div className="education-body text-[13.5px] leading-[1.7] text-text2 [&_h3]:text-[14px] [&_h3]:font-bold [&_h3]:text-text [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:my-3 [&_ul]:pl-5 [&_li]:mb-1 [&_li]:list-disc [&_strong]:text-text [&_strong]:font-semibold [&_a]:text-accent">
                  {s.content}
                </div>
              </section>
            ))}
          </article>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-[11px] text-text3">
          This education page is the single source of truth for &quot;how do I use this&quot;. When new
          features are added to InsideOil, this page is updated first.
        </div>
      </div>
    </AppShell>
  );
}
