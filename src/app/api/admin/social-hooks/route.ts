import { NextResponse } from "next/server";
import { getCachedDigitrafficVessels } from "@/lib/digitraffic";
import { getCachedAircraft } from "@/lib/opensky";

export const dynamic = "force-dynamic";

async function getPrice(symbol: string): Promise<{ price: number; prevClose: number } | null> {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`, {
      signal: AbortSignal.timeout(6_000), headers: { "User-Agent": "InsideOil/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    return meta ? { price: meta.regularMarketPrice, prevClose: meta.previousClose ?? meta.chartPreviousClose } : null;
  } catch { return null; }
}

interface Hook {
  id: string;
  platform: "tiktok" | "instagram" | "twitter";
  type: "hook" | "caption" | "thread";
  title: string;
  content: string;
  hashtags: string[];
  dataPoint: string;
  visualSuggestion: string;
  screenPath: string;
  format: string;
}

export async function GET() {
  try {
    const [wtiData, brentData, gasData, hoData] = await Promise.all([
      getPrice("CL=F"), getPrice("BZ=F"), getPrice("RB=F"), getPrice("HO=F"),
    ]);

    const wti = wtiData;
    const brent = brentData;

    const vessels = getCachedDigitrafficVessels();
    const aircraft = getCachedAircraft();
    const tankers = vessels.filter((v) => v.shipType >= 80 && v.shipType <= 89);
    const anchored = tankers.filter((v) => v.speed <= 0.5);

    // Crack spread
    const gas = gasData;
    const ho = hoData;
    const crack = gas && ho && wti
      ? Math.round(((2 * gas.price * 42 + ho.price * 42 - 3 * wti.price) / 3) * 100) / 100
      : null;

    const wtiChange = wti ? Math.round(((wti.price - wti.prevClose) / wti.prevClose) * 10000) / 100 : null;

    const hooks: Hook[] = [];
    const now = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });

    // 1. Price hook
    if (wti) {
      hooks.push({
        id: "price-daily",
        platform: "tiktok",
        type: "hook",
        title: "Daily Price Update",
        content: `WTI crude is at $${wti.price.toFixed(2)} ${wtiChange! >= 0 ? "up" : "down"} ${Math.abs(wtiChange!).toFixed(2)}% today.\n\n${crack && crack > 30 ? `Crack spread at $${crack.toFixed(0)} — refineries are PRINTING money right now. They're buying crude aggressively.` : crack && crack < 15 ? `Crack spread collapsed to $${crack.toFixed(0)}. Refineries cutting runs. Less crude demand ahead.` : `Crack spread at $${crack?.toFixed(0) ?? "N/A"} — refineries running at normal margins.`}\n\nWhat does this mean for your portfolio? Link in bio.`,
        hashtags: ["#crudeoil", "#wti", "#oiltrading", "#commodities", "#trading", "#insideoil"],
        dataPoint: `WTI $${wti.price.toFixed(2)} (${wtiChange! >= 0 ? "+" : ""}${wtiChange!.toFixed(2)}%)`,
        visualSuggestion: "Screen record the Command Center showing WTI price + crack spread. Add text overlay with the price.",
        screenPath: "/dashboard",
        format: "reel",
      });
    }

    // 2. Fleet intelligence hook
    if (tankers.length > 0) {
      hooks.push({
        id: "fleet-intel",
        platform: "tiktok",
        type: "hook",
        title: "Tanker Fleet Intel",
        content: `Right now, ${tankers.length.toLocaleString()} tankers are being tracked in the Baltic Sea.\n\n${anchored.length} are ANCHORED — that's ${Math.round(anchored.length / tankers.length * 100)}% of the fleet sitting still.\n\n${anchored.length / tankers.length > 0.3 ? "High floating storage = oversupply signal. Traders are storing crude at sea waiting for higher prices. This is a CONTANGO market." : "Low floating storage = tight market. Crude is being consumed, not stored. Bullish for prices."}\n\nWe track this 24/7 with real AIS data.`,
        hashtags: ["#oiltanker", "#shipping", "#crudeoil", "#ais", "#maritime", "#insideoil"],
        dataPoint: `${tankers.length} tankers, ${anchored.length} anchored (${Math.round(anchored.length / tankers.length * 100)}%)`,
        visualSuggestion: "Screen record the Live Map with AIS Live filter. Zoom into Baltic Sea showing thousands of vessel dots. Then show the Trade Signals page.",
        screenPath: "/tracking",
        format: "reel",
      });
    }

    // 3. Crack spread hook
    if (crack != null) {
      hooks.push({
        id: "crack-spread",
        platform: "instagram",
        type: "caption",
        title: "Crack Spread Explainer",
        content: `The 3-2-1 crack spread is at $${crack.toFixed(2)} today.\n\nWhat is it? Buy 3 barrels of crude, refine them into 2 barrels of gasoline + 1 barrel of diesel. The crack spread is your PROFIT.\n\n${crack > 30 ? `At $${crack.toFixed(0)}, refineries are making a fortune. They're buying as much crude as they can. This is BULLISH for crude prices.` : crack > 20 ? `$${crack.toFixed(0)} is a healthy margin. Refineries running normally. Crude demand is steady.` : `$${crack.toFixed(0)} means thin margins. Some refineries will cut production. Less crude demand = BEARISH.`}\n\nInsideOil tracks this in real-time. Link in bio.`,
        hashtags: ["#crackspread", "#refinery", "#oiltrading", "#crudeoil", "#commodities", "#insideoil"],
        dataPoint: `Crack spread $${crack.toFixed(2)}`,
        visualSuggestion: "Screenshot of the Crack Spread chart (3-month) from the Signals page. Add arrow pointing to current level with text.",
        screenPath: "/trade",
        format: "carousel",
      });
    }

    // 4. Dark fleet hook
    hooks.push({
      id: "dark-fleet",
      platform: "tiktok",
      type: "hook",
      title: "Dark Fleet Mystery",
      content: `Some tankers are turning off their AIS transponders while at sea.\n\nWhy? When a tanker goes "dark," it could be:\n- Evading sanctions (Russian/Iranian crude)\n- Doing ship-to-ship transfers\n- Trying to hide cargo origin\n\nOur Dark Fleet Monitor tracks AIS gaps in real-time across ${tankers.length.toLocaleString()} tankers.\n\nRight now we're monitoring 3 known STS transfer zones in the Mediterranean and Baltic.\n\nThis is the intelligence that oil traders pay millions for.`,
      hashtags: ["#darkfleet", "#sanctions", "#oiltanker", "#geopolitics", "#trading", "#insideoil"],
      dataPoint: `${tankers.length} tankers monitored`,
      visualSuggestion: "Screen record the Dark Fleet Monitor page. Show STS zones. Use dramatic music. Text overlay: 'Why are tankers going DARK?'",
      screenPath: "/trade/desk",
      format: "reel",
    });

    // 5. Aircraft hook
    if (aircraft.length > 0) {
      const cargo = aircraft.filter((a) => a.isCargo);
      hooks.push({
        id: "aircraft",
        platform: "instagram",
        type: "caption",
        title: "Global Air Cargo",
        content: `${aircraft.length.toLocaleString()} aircraft in the sky right now.\n\n${cargo.length} are cargo flights — carrying everything from iPhones to medical supplies.\n\nWe identify cargo flights by their callsign prefix: FDX (FedEx), UPS, CLX (Cargolux), and 40+ others.\n\nAll tracked in real-time via ADS-B transponders.\n\n${now} — InsideOil Command Center`,
        hashtags: ["#aviation", "#cargo", "#logistics", "#airfreight", "#tracking", "#insideoil"],
        dataPoint: `${aircraft.length.toLocaleString()} aircraft, ${cargo.length} cargo`,
        visualSuggestion: "Screenshot of the Live Map with Cargo Flights filter showing orange dots worldwide.",
        screenPath: "/tracking",
        format: "carousel",
      });
    }

    // 6. Decision engine hook
    hooks.push({
      id: "decision",
      platform: "tiktok",
      type: "hook",
      title: "AI Says BUY or SELL?",
      content: `Our Decision Engine just updated.\n\nIt analyzes 6 real-time signals:\n1. Floating storage ratio\n2. Fleet utilization\n3. Slow steaming\n4. Crack spread\n5. Brent-WTI spread\n6. Unassigned cargoes\n\nEach signal gets a score. The composite tells you: BUY, SELL, or WAIT.\n\n${wti ? `Right now with WTI at $${wti.price.toFixed(2)} and crack at $${crack?.toFixed(0) ?? "N/A"}...` : ""}\n\nWhat does it say? Check InsideOil. Link in bio.`,
      hashtags: ["#algotrading", "#tradingsignals", "#crudeoil", "#ai", "#fintech", "#insideoil"],
      dataPoint: `6 signals analyzed`,
      visualSuggestion: "Screen record: open Decision Engine, show the BUY/SELL badge appearing, then scroll through signals. Build suspense before revealing the decision.",
      screenPath: "/trade/decision",
      format: "reel",
    });

    return NextResponse.json({
      success: true,
      data: {
        hooks,
        generatedAt: new Date().toISOString(),
        marketContext: {
          wti: wti?.price ?? null,
          wtiChange,
          crack,
          tankers: tankers.length,
          anchored: anchored.length,
          aircraft: aircraft.length,
        },
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
