import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Economic calendar events relevant to oil trading
// Sources: EIA schedule (public), OPEC schedule (public), Fed schedule (public)
// These dates are known in advance and publicly available

interface CalendarEvent {
  date: string;
  time: string;
  event: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  category: string;
  description: string;
  tradingNote: string;
}

function getUpcomingEvents(): CalendarEvent[] {
  const now = new Date();
  const events: CalendarEvent[] = [];

  // EIA Weekly Petroleum Status Report — every Wednesday at 10:30 ET
  // Find next Wednesday
  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    if (d.getDay() === 3) { // Wednesday
      events.push({
        date: d.toISOString().split("T")[0],
        time: "10:30 ET",
        event: "EIA Weekly Petroleum Status Report",
        impact: "HIGH",
        category: "Inventories",
        description: "US crude oil inventories, production, imports, refinery utilization. The single most market-moving weekly data release for crude oil.",
        tradingNote: "Build >2M barrels = bearish. Draw >2M barrels = bullish. Watch gasoline + distillate stocks too. Trade volatility spikes around release.",
      });
      if (events.filter((e) => e.event.includes("EIA Weekly")).length >= 2) break;
    }
  }

  // API Weekly Statistical Bulletin — every Tuesday at 16:30 ET
  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    if (d.getDay() === 2) {
      events.push({
        date: d.toISOString().split("T")[0],
        time: "16:30 ET",
        event: "API Weekly Crude Stock Report",
        impact: "MEDIUM",
        category: "Inventories",
        description: "American Petroleum Institute estimates of US crude stocks. Released day before EIA — serves as preview.",
        tradingNote: "Sets expectations for EIA report next day. If API shows large build but EIA shows draw = bullish surprise.",
      });
      if (events.filter((e) => e.event.includes("API")).length >= 2) break;
    }
  }

  // EIA Short-Term Energy Outlook — monthly, around 12th
  for (let i = 0; i < 35; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    if (d.getDate() >= 10 && d.getDate() <= 14 && d.getDay() >= 1 && d.getDay() <= 5) {
      events.push({
        date: d.toISOString().split("T")[0],
        time: "12:00 ET",
        event: "EIA Short-Term Energy Outlook (STEO)",
        impact: "MEDIUM",
        category: "Forecasts",
        description: "EIA's monthly forecast for crude prices, production, demand. Sets the narrative for the month ahead.",
        tradingNote: "Upward revision in demand forecast = bullish. Downward revision in price forecast = bearish. Watch US production estimates closely.",
      });
      break;
    }
  }

  // OPEC Monthly Oil Market Report — around 12-14th of each month
  for (let i = 0; i < 35; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    if (d.getDate() >= 12 && d.getDate() <= 15 && d.getDay() >= 1 && d.getDay() <= 5) {
      events.push({
        date: d.toISOString().split("T")[0],
        time: "07:00 ET",
        event: "OPEC Monthly Oil Market Report",
        impact: "HIGH",
        category: "OPEC",
        description: "OPEC's demand/supply forecasts and production data. Signals future output decisions.",
        tradingNote: "Demand upgrade = bullish. If OPEC cuts production forecast while raising demand = very bullish. Watch secondary sources data for actual compliance.",
      });
      break;
    }
  }

  // IEA Oil Market Report — around 15-17th
  for (let i = 0; i < 35; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    if (d.getDate() >= 15 && d.getDate() <= 18 && d.getDay() >= 1 && d.getDay() <= 5) {
      events.push({
        date: d.toISOString().split("T")[0],
        time: "04:00 ET",
        event: "IEA Oil Market Report",
        impact: "HIGH",
        category: "Forecasts",
        description: "International Energy Agency's monthly assessment of global oil supply, demand, and stocks. The most respected independent forecast.",
        tradingNote: "IEA and OPEC often disagree on demand. If both upgrade demand = strong bullish signal. IEA demand downgrade while OPEC holds = bearish divergence.",
      });
      break;
    }
  }

  // Baker Hughes Rig Count — every Friday at 13:00 ET
  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    if (d.getDay() === 5) {
      events.push({
        date: d.toISOString().split("T")[0],
        time: "13:00 ET",
        event: "Baker Hughes US Rig Count",
        impact: "LOW",
        category: "Production",
        description: "Weekly count of active oil & gas rigs in the US. Leading indicator for future US production.",
        tradingNote: "Rising rig count = more future supply = mildly bearish. Declining = tightening supply. Impact is delayed (6-12 months to production).",
      });
      if (events.filter((e) => e.event.includes("Baker")).length >= 2) break;
    }
  }

  // CFTC Commitment of Traders — every Friday at 15:30 ET
  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    if (d.getDay() === 5) {
      events.push({
        date: d.toISOString().split("T")[0],
        time: "15:30 ET",
        event: "CFTC Commitment of Traders (COT)",
        impact: "MEDIUM",
        category: "Positioning",
        description: "Shows net long/short positions of speculators and commercials in crude oil futures. Reveals market positioning.",
        tradingNote: "Extreme net long by speculators = crowded trade = correction risk. Commercials (producers) adding shorts = expect lower prices. Contrarian indicator at extremes.",
      });
      if (events.filter((e) => e.event.includes("CFTC")).length >= 2) break;
    }
  }

  // Sort by date
  events.sort((a, b) => a.date.localeCompare(b.date));

  return events;
}

export async function GET() {
  const events = getUpcomingEvents();

  const today = new Date().toISOString().split("T")[0];
  const todayEvents = events.filter((e) => e.date === today);
  const thisWeek = events.filter((e) => {
    const d = new Date(e.date);
    const diff = (d.getTime() - new Date(today).getTime()) / 86400000;
    return diff >= 0 && diff < 7;
  });

  return NextResponse.json({
    success: true,
    data: {
      events,
      todayEvents,
      thisWeekCount: thisWeek.length,
      highImpactThisWeek: thisWeek.filter((e) => e.impact === "HIGH").length,
      source: "EIA, OPEC, IEA, Baker Hughes, CFTC — public schedules",
    },
  });
}
