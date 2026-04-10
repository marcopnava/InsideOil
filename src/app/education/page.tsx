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
  {
    id: "eia-playbook",
    title: "14. The Wednesday EIA playbook (minute-by-minute)",
    content: (
      <>
        <p>
          Every Wednesday at 16:30 CET (10:30 ET), the U.S. Energy Information Administration
          releases the <strong>Weekly Petroleum Status Report</strong>. This single release
          moves the crude oil price 1-2% within the first 10 minutes, more on big surprises.
          It&apos;s the most consistently market-moving event for retail crude traders. Here&apos;s how
          to trade it properly.
        </p>

        <h3>Before the release (16:00-16:29 CET)</h3>
        <ul>
          <li>Open <strong>/differentials</strong>. The EIA card shows last week&apos;s numbers.</li>
          <li>Check the market consensus for this week (it&apos;s published on Reuters, Bloomberg,
            financial news sites — tipically: crude stock change expected, gasoline, distillate).
            You need the CONSENSUS before the release — without it you cannot interpret the surprise.</li>
          <li>Check the <strong>API report</strong> from Tuesday evening. API is the private
            industry body that publishes crude stocks ~20h before EIA. Its numbers are a sneak
            peek — if API showed a big build, EIA usually confirms (but not always).</li>
          <li>Know your position size in advance. EIA releases can gap 5-15 ticks on CL in
            the first second. If you&apos;re using stops, widen them or stand aside.</li>
        </ul>

        <h3>The release moment (16:30 CET)</h3>
        <ul>
          <li>Refresh /differentials and look at 4 numbers, in this order:</li>
          <li>
            <strong>1. Crude stocks change</strong> (headline). Compare to consensus.
            Build &gt; consensus + 2M = bearish surprise → crude drops.
            Draw &gt; consensus − 2M = bullish surprise → crude rises.
            If within ±1M of consensus, no surprise — ignore the headline, look at details.
          </li>
          <li>
            <strong>2. Gasoline stocks</strong>. In summer driving season (May-Sep) this matters
            as much as crude. Gasoline draw = bullish for crude (implied demand).
            Gasoline build = bearish.
          </li>
          <li>
            <strong>3. Distillate stocks</strong>. In winter (Dec-Feb) this is the key for
            heating demand. Distillate draw = bullish, build = bearish.
          </li>
          <li>
            <strong>4. Refinery utilization %</strong>. Above 92% = refineries running hard,
            strong crude demand. Falling rapidly week-over-week = refineries cutting runs,
            bearish for crude.
          </li>
        </ul>

        <h3>Decision tree (first 10 minutes)</h3>
        <p>Use this simple matrix:</p>
        <ul>
          <li>
            <strong>Headline bullish + product draws + util &gt;92%</strong> = strong bull.
            Setup: long CL/BZ, target 1-2% in 30 min, stop 0.5%.
          </li>
          <li>
            <strong>Headline bullish but product builds</strong> = mixed. Wait for market
            reaction, don&apos;t fade.
          </li>
          <li>
            <strong>Headline bearish + product builds + util dropping</strong> = strong bear.
            Setup: short CL/BZ, target 1-2% in 30 min, stop 0.5%.
          </li>
          <li>
            <strong>All figures in-line with consensus</strong> = non-event. Market may fade
            the pre-release positioning. Flat or mean-revert trade.
          </li>
        </ul>

        <h3>Common trap: the 10-minute reversal</h3>
        <p>
          The market often overreacts in the first 2 minutes, then partially reverses as
          algos re-price with more detail (imports, exports, PADD regional breakdown). A
          disciplined play is to wait 3-5 minutes for the initial spike, then enter the
          opposite direction ONLY if the reversal is confirmed by volume and the detail
          data contradicts the headline.
        </p>

        <h3>What NOT to do</h3>
        <ul>
          <li>Don&apos;t hold a big leveraged position through 16:30 without a plan.</li>
          <li>Don&apos;t chase the first 30-second move — that&apos;s the algo move, retail always gets filled at bad prices.</li>
          <li>Don&apos;t ignore refinery utilization — it&apos;s the most underused signal.</li>
          <li>Don&apos;t trade if there&apos;s conflicting news (OPEC, Middle East, etc.) that same day.</li>
        </ul>
      </>
    ),
  },
  {
    id: "calendar",
    title: "15. Market-moving events calendar",
    content: (
      <>
        <p>
          The events that reliably move crude oil prices, and when to prepare. All times in
          Italian timezone (CET/CEST — switch on last Sunday of March and October).
        </p>

        <h3>Weekly</h3>
        <ul>
          <li>
            <strong>Tuesday ~22:30 CET</strong> — American Petroleum Institute (API) crude
            stocks. Private industry report, first peek at Wednesday&apos;s EIA. Moves prices
            in the overnight US session.
          </li>
          <li>
            <strong>Wednesday 16:30 CET</strong> — EIA Weekly Petroleum Status Report.
            <strong> THE weekly event.</strong> See section 14 for the full playbook.
          </li>
          <li>
            <strong>Friday 19:00 CET</strong> — Baker Hughes US rig count. Not always
            market-moving but watched for structural shifts in US production.
          </li>
          <li>
            <strong>Friday 21:30 CET</strong> — CFTC Commitments of Traders for the prior
            Tuesday. Released after market close. Shows speculative positioning shifts.
            Moves prices on the Sunday open if positioning is extreme.
          </li>
        </ul>

        <h3>Monthly</h3>
        <ul>
          <li>
            <strong>Early month (variable)</strong> — IEA Oil Market Report. International
            Energy Agency&apos;s global supply/demand update. Market-moving if it changes the
            balance estimate.
          </li>
          <li>
            <strong>Mid-month</strong> — OPEC Monthly Oil Market Report. OPEC&apos;s own view
            of the market. Focus on the demand forecast changes.
          </li>
          <li>
            <strong>Mid-month</strong> — EIA Short-Term Energy Outlook (STEO). US
            government forecast.
          </li>
        </ul>

        <h3>Quarterly / Event-driven</h3>
        <ul>
          <li>
            <strong>OPEC+ Ministerial meetings</strong> — typically 4 times a year, but JMMC
            (Joint Ministerial Monitoring Committee) meets every 2 months. These can deliver
            production cut or increase announcements that move Brent 3-8% in hours. Dates
            are published weeks in advance on the OPEC website.
          </li>
          <li>
            <strong>US Federal Reserve FOMC meetings</strong> — 8 per year. Rate decisions
            affect USD which inversely correlates with oil. Oil CFD traders should not be
            in a big position going into FOMC unannounced.
          </li>
          <li>
            <strong>Earnings season for oil majors</strong> — XOM, CVX, Shell, BP, TotalEnergies.
            Their capex guidance moves the upstream supply narrative.
          </li>
        </ul>

        <h3>Tactical: what to do the day before an event</h3>
        <ul>
          <li>Reduce leverage by half.</li>
          <li>Widen stops to avoid being taken out by volatility spikes.</li>
          <li>Flat positions by end of day if you cannot monitor the release.</li>
          <li>Set personal alerts in /alerts for BRENT_PRICE threshold breaks to catch
            moves if you&apos;re not watching.</li>
        </ul>
      </>
    ),
  },
  {
    id: "seasonality",
    title: "16. Seasonal patterns",
    content: (
      <>
        <p>
          Crude oil prices follow recurring seasonal patterns driven by physical consumption
          cycles. These are not forecasts — they&apos;re statistical tendencies that create the
          <em> backdrop</em> against which catalysts play out.
        </p>

        <h3>By month — typical bias</h3>
        <ul>
          <li>
            <strong>January</strong> — Refiners coming out of winter peak, crude demand
            easing. Typically flat to slightly bearish.
          </li>
          <li>
            <strong>February</strong> — Refinery maintenance season starts (turnarounds).
            Crude intake drops temporarily. Neutral.
          </li>
          <li>
            <strong>March</strong> — Maintenance continuing. Chinese demand returning post
            Chinese New Year. Mixed.
          </li>
          <li>
            <strong>April-May</strong> — Refineries restarting, building product inventories
            ahead of summer driving season. <strong>Classic bullish period</strong> for crude.
          </li>
          <li>
            <strong>June-August</strong> — Summer driving season US + Northern Hemisphere
            peak demand. Gasoline cracks widen. Often bullish for crude if inventories are
            tight, bearish if inventories are full.
          </li>
          <li>
            <strong>September</strong> — End of driving season, gasoline demand drops.
            Weakness often appears.
          </li>
          <li>
            <strong>October</strong> — Transition month. Refineries switching to heating
            oil production. Hurricane season still active (Gulf of Mexico risk).
          </li>
          <li>
            <strong>November-December</strong> — Heating demand ramp-up. Distillate crack
            widens. Often bullish if the winter starts cold.
          </li>
        </ul>

        <h3>Recurring themes</h3>
        <ul>
          <li>
            <strong>Hurricane season</strong> (June-November, peak Aug-Sep). Any tropical
            system entering the Gulf of Mexico can halt ~15% of US crude production. Watch
            /weather for tracks. Historically cat-3+ in western GOM = +3-8% on WTI in 48h.
          </li>
          <li>
            <strong>Chinese Lunar New Year</strong> (late Jan / early Feb). Chinese industry
            slows for ~2 weeks. Demand dips. Asian benchmarks underperform.
          </li>
          <li>
            <strong>Ramadan</strong> (variable, lunar calendar). Iranian and Mid-East
            loadings slow for ~1 month. Minor tightening in Asia.
          </li>
          <li>
            <strong>US Memorial Day to Labor Day</strong> (late May to early Sep) = the
            &quot;driving season&quot; window US traders obsess over. Gasoline inventories are the
            key number.
          </li>
        </ul>

        <h3>How to use seasonality in trading</h3>
        <p>
          Seasonal bias is a <strong>context</strong>, not a signal. You don&apos;t &quot;go long because
          it&apos;s May&quot;. You note that May is seasonally bullish, then trade the actual setup
          with a slightly higher conviction than you would in October.
        </p>
      </>
    ),
  },
  {
    id: "mistakes",
    title: "17. Common retail mistakes (how to avoid them)",
    content: (
      <>
        <p>
          Patterns we&apos;ve seen wreck retail oil traders over and over. Avoiding even 3 of
          these puts you ahead of 80% of participants.
        </p>

        <h3>1. Over-leveraging</h3>
        <p>
          Crude can move $3-5 in hours on news. With 10:1 leverage on a CFD, a $3 move on a
          $80 price is a ~3.75% move on the position but a ~37.5% move on your margin.
          Use 2-3:1 maximum for swing trades, never more than 5:1.
        </p>

        <h3>2. Trading through EIA / OPEC without a plan</h3>
        <p>
          Retail traders open positions 5 minutes before the release, &quot;just to participate&quot;.
          They get filled on terrible prices, stopped out on wicks, and watch helplessly.
          Either have a full plan (see section 14) or stand aside.
        </p>

        <h3>3. Averaging down</h3>
        <p>
          You go long at $85. It drops to $82. You double up to average $83.50. It drops to
          $79. You double again. This is how a 1% risk trade becomes a 10% account loss.
          <strong> Never average losers.</strong> If the trade is wrong, accept the loss.
        </p>

        <h3>4. News chasing</h3>
        <p>
          A headline hits: &quot;Houthis attack tanker in Red Sea&quot;. You see crude jump +1.5% in
          30 seconds. You think &quot;I need to get in&quot;. You enter at the top. The move is over,
          algos have already priced it. You get stopped out on the mean reversion.
        </p>
        <p>
          <strong>Rule:</strong> news you see as a retail trader is already in the price.
          The edge is in anticipating news via our flow data, not reacting to it.
        </p>

        <h3>5. No stop loss</h3>
        <p>
          &quot;I&apos;ll exit if it gets bad&quot;. In reality, when it gets bad you freeze, hope, and
          lose. Set a hard stop on every entry. Accept that you&apos;ll be stopped out sometimes
          — it&apos;s the cost of survival.
        </p>

        <h3>6. Weekend gap risk</h3>
        <p>
          Crude markets close Friday 22:00 CET and reopen Sunday 23:00 CET. Any geopolitical
          event over the weekend creates a gap. If you hold a leveraged long and war breaks
          out on Sunday, oil can gap +$5. If you hold a leveraged short in the same scenario,
          your stop may not fill at the stop price. Reduce weekend exposure or close entirely
          on Friday afternoon.
        </p>

        <h3>7. Ignoring the curve structure</h3>
        <p>
          Going long crude in deep contango (like Q2 2020) is fighting the tape: the forward
          curve is telling you the physical market has no demand. Going short in steep
          backwardation (like mid-2022) is the same mistake in reverse. Check /signals &quot;Brent
          Structure&quot; before any swing trade.
        </p>

        <h3>8. Trading correlated markets as if independent</h3>
        <p>
          Long WTI + short DXY + long XOP = all the same bet. If oil crashes, all three
          lose. Diversification is real, but inside crude you&apos;re not diversified.
        </p>
      </>
    ),
  },
  {
    id: "correlations",
    title: "18. Key correlations to watch",
    content: (
      <>
        <p>
          Crude oil does not trade in isolation. These are the markets you should have on a
          side screen when you&apos;re in a position.
        </p>

        <h3>Oil vs USD (DXY)</h3>
        <p>
          Historically <strong>inverse</strong>. When the dollar strengthens, oil priced in
          USD becomes more expensive for non-US buyers, demand softens. Typical correlation
          −0.5 to −0.7. Breaks down when oil is moved by supply shocks (correlation can
          temporarily turn positive).
        </p>

        <h3>Oil vs S&amp;P 500</h3>
        <p>
          Positive <strong>when risk-on</strong>: equities up = economic optimism = oil up.
          Inverse during stagflation fears. The relationship flips regimes — check whether
          they&apos;re moving together or apart in the last 5 sessions before assuming.
        </p>

        <h3>Oil vs energy stocks (XLE, XOP, XOM, CVX)</h3>
        <p>
          Very tightly correlated with crude but with leverage amplification: a 2% oil move
          often becomes a 3-4% move in E&amp;P names. Divergences (oil up, E&amp;P flat) often
          precede a correction in oil.
        </p>

        <h3>Oil vs natural gas (NG)</h3>
        <p>
          Weakly correlated. Gas has its own drivers (US weather, LNG exports, Asian demand).
          Sometimes they move together on macro, often they decouple. Don&apos;t assume.
        </p>

        <h3>Brent vs WTI</h3>
        <p>
          Normal spread: Brent trades at $2-5 premium to WTI (Brent is slightly heavier,
          plus Atlantic basin supply/demand). Spread widens when US supply is abundant or
          Atlantic tight. Spread inverts rarely — usually a sign of US tightness.
        </p>

        <h3>Brent vs Dubai (EFS)</h3>
        <p>
          Brent normally $1-3 over Dubai. Tight when Asia is tight (Mid-East buyers compete
          for Brent), wide when Atlantic is tight.
        </p>

        <h3>Oil vs gold</h3>
        <p>
          Both inflation hedges. Positive correlation in inflation regimes, uncorrelated
          most of the time. Gold is not predictive of oil.
        </p>

        <h3>Oil vs US 10Y yield</h3>
        <p>
          Both track inflation expectations. Positive correlation during reflation phases,
          negative during recession fears (bonds up = yields down, oil down on demand fear).
        </p>
      </>
    ),
  },
  {
    id: "case-studies",
    title: "19. Historical case studies",
    content: (
      <>
        <p>
          Three recent events that moved crude hard, with what a data-driven trader would
          have seen before the move.
        </p>

        <h3>April 2020 — WTI goes negative</h3>
        <p>
          On 20 April 2020, WTI front-month settled at <strong>−$37.63/bbl</strong> — the
          first negative settle ever. Cause: Covid demand destruction + producers unable to
          halt wells + Cushing storage physically full + front-month contract expiring with
          holders forced to take delivery they had nowhere to put.
        </p>
        <p>
          <strong>What signals would have warned early:</strong>
        </p>
        <ul>
          <li>Floating storage detector would have shown 150+ VLCCs idle by early April (vs ~30 normal).</li>
          <li>Contango arbitrage on WTI was profitable at $20/bbl spread — extreme.</li>
          <li>Storage ratio &gt;60%.</li>
          <li>Crack spread crashed to near-zero (refineries not buying).</li>
          <li>EIA showed record builds week after week.</li>
        </ul>
        <p>
          <strong>Lesson:</strong> when all our signals turn maximally bearish simultaneously,
          the market can reach extremes you wouldn&apos;t believe possible. Respect that.
        </p>

        <h3>February 2022 — Russia invades Ukraine</h3>
        <p>
          On 24 February 2022, Russia invaded Ukraine. Brent jumped from $97 to $139 within
          2 weeks. Many retail traders bought the spike and got crushed as the price
          retraced to $95 by August.
        </p>
        <p>
          <strong>What signals would have warned early:</strong>
        </p>
        <ul>
          <li>Russian Baltic exports ramped up in Jan-Feb 2022 (sanctions front-running).</li>
          <li>Managed Money CFTC long positioning at multi-year highs (crowded trade).</li>
          <li>Brent forward curve moved into steep backwardation as buyers bid up prompt.</li>
          <li>News headlines about Russian troop build-up started in late Jan.</li>
        </ul>
        <p>
          <strong>Lesson:</strong> early positioning based on flow data caught the rise.
          Chasing the spike on day 1 was the losing trade. Always check CFTC — if everyone
          is already long, you&apos;re late.
        </p>

        <h3>October 2023 — Israel-Hamas war</h3>
        <p>
          On 7 October 2023, Hamas attacked Israel. Brent gapped from $84 to $89 on Monday
          open. Many expected a sustained rally. Within 2 weeks Brent was back below $85.
        </p>
        <p>
          <strong>What signals would have warned &quot;this is a fade&quot;:</strong>
        </p>
        <ul>
          <li>Hormuz transit count stayed normal (the chokepoint was not threatened).</li>
          <li>Israeli crude production is zero (not a producer), so no direct supply hit.</li>
          <li>OPEC+ had spare capacity (Saudi could add 2M b/d if needed).</li>
          <li>The war didn&apos;t physically affect any crude flow in its first weeks.</li>
        </ul>
        <p>
          <strong>Lesson:</strong> a geopolitical headline isn&apos;t automatically a sustained
          rally. Ask &quot;does this actually reduce barrels on the water?&quot;. If no, fade.
        </p>
      </>
    ),
  },
  {
    id: "position-sizing",
    title: "20. Position sizing & risk management",
    content: (
      <>
        <p>
          The math that separates survivors from dead accounts. Not optional.
        </p>

        <h3>The 1-2% rule</h3>
        <p>
          Never risk more than 1-2% of your account on a single trade. Risk = the amount you
          lose if your stop is hit.
        </p>
        <p className="font-mono text-[11px] bg-bg2 p-2 rounded">
          Max position size = (Account × 0.02) / (Entry − Stop)
        </p>
        <p>
          Example: €10,000 account. You want to go long Brent at $85 with a stop at $83.
          Max risk = €200. Distance = $2 = 2% of price. Position size = €200 / ($2/bbl ×
          contract size).
        </p>
        <p>
          For CL micro futures (100 barrels), $2 move = $200 loss. You can buy exactly 1
          contract.
        </p>
        <p>
          For Brent CFD with €1 per $0.01 tick on a 10 barrel contract, $2 move = €200.
          Exactly 1 lot.
        </p>

        <h3>Volatility-adjusted sizing</h3>
        <p>
          Crude has different regimes. In low-vol periods (ATR $1/day) you can size up. In
          high-vol (ATR $3/day) you size down. A good rule: set your stop at 1.5× ATR to
          avoid being taken out by noise, then size position so the 1.5×ATR loss equals 1-2%
          of the account.
        </p>

        <h3>The 6% monthly drawdown rule</h3>
        <p>
          If your account is down 6% in any calendar month, <strong>stop trading for the
          rest of the month</strong>. Don&apos;t try to &quot;win it back&quot;. That&apos;s how 6% becomes 20%.
          Review what went wrong, journal it, restart next month.
        </p>

        <h3>Correlation-aware sizing</h3>
        <p>
          If you&apos;re long WTI AND long Brent AND long XLE, that&apos;s not 3 trades — it&apos;s 1
          trade at 3× size. Treat it as one position for risk purposes. Don&apos;t kid yourself.
        </p>

        <h3>Trade journal — non negotiable</h3>
        <p>
          Keep a spreadsheet. For every trade: entry date, instrument, direction, size,
          entry price, stop, target, exit date, exit price, P/L, which InsideOil signals
          triggered the entry, what you learned. Review monthly. Without a journal, you
          will repeat the same mistakes forever.
        </p>
      </>
    ),
  },
  {
    id: "platform-limits",
    title: "21. Platform limitations (honest)",
    content: (
      <>
        <p>
          We believe in honesty more than marketing. Here&apos;s exactly what InsideOil does NOT
          do, so you can calibrate your expectations.
        </p>

        <h3>AIS coverage is not truly global</h3>
        <p>
          We use AISStream.io free tier, which aggregates data from terrestrial AIS receivers
          (volunteer-run radio stations on the coast). Coverage is strongest in Europe, US,
          East Asia. Persian Gulf, Red Sea, West Africa and Indian Ocean are partially dark
          — in particular the Strait of Hormuz shows underestimated counts, and some OPEC
          terminals (Kharg, Ras Tanura) have low visibility.
        </p>
        <p>
          Full global satellite AIS (Spire, exactEarth) costs thousands of euros per month.
          We are considering Global Fishing Watch API (free for research) as a second source.
        </p>

        <h3>BDTI is synthetic</h3>
        <p>
          The official Baltic Dirty Tanker Index is paywalled by the Baltic Exchange. We
          proxy it via the BWET ETF and a calibration formula. Our BDTI value tracks the real
          one directionally but is not the official print. VLCC TCE is a further heuristic
          on top of that. Treat these as regime indicators, not as authoritative numbers.
        </p>

        <h3>Price data is delayed</h3>
        <p>
          Futures prices come from Yahoo Finance free API. They are delayed ~15 minutes.
          For scalping inside 15 minutes you need a dedicated real-time feed from your
          broker.
        </p>

        <h3>We do not provide</h3>
        <ul>
          <li>Order book depth / Level 2 / DOM</li>
          <li>Sub-minute price data</li>
          <li>ML price forecasts (we show flow data; you interpret it)</li>
          <li>Options chain data or implied volatility</li>
          <li>Backtesting engine</li>
          <li>Brokerage execution — InsideOil is an intelligence tool, not a broker</li>
        </ul>

        <h3>Signal accuracy</h3>
        <p>
          Our floating-storage detector is ~85% accurate vs commercial providers (Kpler claim ~95%).
          OPEC compliance scoring is ~75% accurate vs Kpler&apos;s ~95% — mostly due to AIS
          coverage gaps. Chokepoint flow is accurate for the 5 well-covered straits (Danish,
          Malacca, Bosphorus, Suez); Hormuz and Bab-el-Mandeb are undercounted. All signals
          are directional, not gospel.
        </p>

        <h3>This is not financial advice</h3>
        <p>
          Everything on InsideOil — signals, decisions, recommendations — is <strong>information</strong>,
          not advice. You are responsible for your own trading decisions. Past performance
          does not predict future results. Trading crude oil CFDs and futures involves
          significant risk of loss.
        </p>
      </>
    ),
  },
  {
    id: "faq",
    title: "22. Frequently asked questions",
    content: (
      <>
        <h3>General</h3>
        <p>
          <strong>Q: What broker should I use?</strong>
          <br />
          A: We don&apos;t recommend specific brokers. Look for: regulation (FCA, CySEC, ESMA for
          EU), tight spreads on CL/BZ (&lt;$0.03), reasonable overnight financing, micro
          contracts available for small accounts, responsive customer service.
        </p>
        <p>
          <strong>Q: CFD or futures?</strong>
          <br />
          A: CFDs are easier for small accounts and most retail brokers offer them. Futures
          (CL, BZ, MCL micro) offer better pricing, no overnight financing, and regulated
          exchanges — but require a futures broker account. If your account is below €10k,
          CFDs are more accessible.
        </p>
        <p>
          <strong>Q: Why are your Persian Gulf numbers different from MarineTraffic?</strong>
          <br />
          A: MarineTraffic has paid satellite AIS feeds and a denser receiver network. Our
          free AISStream feed under-covers the Persian Gulf. This is the main known
          limitation — see section 21 for the full explanation.
        </p>
        <p>
          <strong>Q: Are your prices real-time?</strong>
          <br />
          A: Futures prices from Yahoo are 15-min delayed. AIS vessel positions are live
          (within seconds). EIA / CFTC data is at the official release time.
        </p>
        <p>
          <strong>Q: Can I use this for algo trading?</strong>
          <br />
          A: Our APIs are designed for UI, not for high-frequency algo feeds. You could
          poll our /api/signals endpoint from a script but we don&apos;t officially support it
          and rate-limit aggressively.
        </p>

        <h3>Signals</h3>
        <p>
          <strong>Q: Why does Floating Storage show 0 ships?</strong>
          <br />
          A: The detector needs at least 5 days of continuous position history to flag a
          vessel as idle. After fresh deploys or long worker downtime, expect 0 candidates
          for the first few days.
        </p>
        <p>
          <strong>Q: What does &quot;NO ARB&quot; mean on contango arbitrage?</strong>
          <br />
          A: It means that, given current forward curve + freight + financing + insurance,
          storing crude on a VLCC and selling forward is NOT profitable. This is the normal
          state when the market is tight or balanced. Only in deep oversupply (like
          2020) does the arb open up.
        </p>
        <p>
          <strong>Q: How often are signals updated?</strong>
          <br />
          A: Every 5 minutes, via UptimeRobot pinging our cron endpoint.
        </p>

        <h3>Alerts</h3>
        <p>
          <strong>Q: How often do alerts check?</strong>
          <br />
          A: Every 5 minutes. You&apos;ll receive an email within 5-6 minutes of the threshold
          being crossed.
        </p>
        <p>
          <strong>Q: Can I get SMS / Telegram / push notifications?</strong>
          <br />
          A: Not yet. Email only in the current version. Telegram bot integration is on the
          roadmap.
        </p>
        <p>
          <strong>Q: Will the same alert re-fire if the condition stays true?</strong>
          <br />
          A: The alert updates its last value every check. For &quot;gt&quot; / &quot;lt&quot; comparators it
          will re-fire every check as long as the condition holds. For &quot;change_pct&quot; it
          only fires on a fresh move &gt;= threshold.
        </p>

        <h3>Technical</h3>
        <p>
          <strong>Q: Why is the worker on my Mac and not in the cloud?</strong>
          <br />
          A: Because free cloud providers that support long-running WebSocket workers now
          require a credit card (Render, Railway, Fly). We chose to keep the Mac option to
          avoid any payment. If your Mac is offline, data collection pauses.
        </p>
        <p>
          <strong>Q: How much data do we store?</strong>
          <br />
          A: AIS positions are kept for 30 days, aircraft snapshots for 7 days, price
          curves indefinitely (small). Total Postgres usage is well within Neon&apos;s free
          tier.
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
        <div className="mb-6 sm:mb-8">
          <div className="text-[10px] sm:text-[11px] font-semibold text-text3 uppercase tracking-[0.07em]">Knowledge Base</div>
          <h1 className="text-[26px] sm:text-[30px] font-bold tracking-[-0.035em] mt-1">Education</h1>
          <p className="text-[12px] sm:text-sm text-text3 mt-1">
            Every metric, every page, every data feed — explained in plain language for traders.
          </p>
        </div>

        {/* Mobile: top horizontal scroller with section chips */}
        <div className="lg:hidden -mx-4 sm:-mx-6 px-4 sm:px-6 mb-5 sticky top-[var(--nav-h)] z-30 bg-bg/95 backdrop-blur-sm py-2 border-b border-border">
          <nav className="scroll-x flex gap-1.5 pb-1">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors no-underline whitespace-nowrap ${
                  active === s.id
                    ? "bg-text text-white"
                    : "bg-white border border-border text-text2"
                }`}
              >
                {s.title.split(" — ")[0].split(".")[0].trim() || s.title}
              </a>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          {/* Sidebar nav (desktop only) */}
          <aside className="hidden lg:block lg:sticky lg:top-[calc(var(--nav-h)+24px)] lg:self-start lg:max-h-[calc(100vh-var(--nav-h)-48px)] lg:overflow-y-auto">
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
                className="mb-10 scroll-mt-[calc(var(--nav-h)+60px)] lg:scroll-mt-[calc(var(--nav-h)+16px)]"
              >
                <h2 className="text-[20px] sm:text-[22px] font-bold tracking-[-0.025em] text-text mb-4 pb-2 border-b border-border">
                  {s.title}
                </h2>
                <div className="education-body text-[13px] sm:text-[13.5px] leading-[1.7] text-text2 [&_h3]:text-[14px] [&_h3]:font-bold [&_h3]:text-text [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:my-3 [&_ul]:pl-5 [&_li]:mb-1 [&_li]:list-disc [&_strong]:text-text [&_strong]:font-semibold [&_a]:text-accent [&_pre]:overflow-x-auto">
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
