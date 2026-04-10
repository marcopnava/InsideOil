/**
 * Major crude oil loading & discharge terminals + key chokepoints.
 * Used for: floating-storage exclusion zones, OPEC+ compliance loading detection,
 * and chokepoint flow analytics.
 *
 * Coordinates approximate to terminal centroid. Radius in nautical miles defines
 * the "port circle": vessels inside the circle are considered AT-port, outside
 * are at sea.
 */

export interface OilTerminal {
  id: string;
  name: string;
  country: string;
  region: "GULF" | "RUSSIA_CIS" | "WAFRICA" | "AMERICAS" | "EUROPE" | "ASIA";
  lat: number;
  lng: number;
  radiusNm: number;
  /** True if used for OPEC+ loading-detection scoring. */
  opecLoading?: boolean;
}

export const OIL_TERMINALS: OilTerminal[] = [
  // ─── Middle East / OPEC core ──────────────────────────
  { id: "RAS_TANURA", name: "Ras Tanura", country: "Saudi Arabia", region: "GULF", lat: 26.65, lng: 50.16, radiusNm: 25, opecLoading: true },
  { id: "JUAYMAH",   name: "Ju'aymah",    country: "Saudi Arabia", region: "GULF", lat: 26.94, lng: 50.05, radiusNm: 20, opecLoading: true },
  { id: "YANBU",     name: "Yanbu",       country: "Saudi Arabia", region: "GULF", lat: 24.09, lng: 38.06, radiusNm: 20, opecLoading: true },
  { id: "BASRA",     name: "Basra Oil Terminal", country: "Iraq", region: "GULF", lat: 29.68, lng: 48.81, radiusNm: 25, opecLoading: true },
  { id: "KHARG",     name: "Kharg Island", country: "Iran", region: "GULF", lat: 29.23, lng: 50.31, radiusNm: 25, opecLoading: true },
  { id: "FUJAIRAH",  name: "Fujairah",    country: "UAE",  region: "GULF", lat: 25.18, lng: 56.36, radiusNm: 30 },
  { id: "JEBEL_DHANNA", name: "Jebel Dhanna", country: "UAE", region: "GULF", lat: 24.18, lng: 52.61, radiusNm: 20, opecLoading: true },
  { id: "MINA_AL_AHMADI", name: "Mina Al Ahmadi", country: "Kuwait", region: "GULF", lat: 29.07, lng: 48.16, radiusNm: 20, opecLoading: true },
  { id: "RAS_LAFFAN", name: "Ras Laffan", country: "Qatar", region: "GULF", lat: 25.92, lng: 51.59, radiusNm: 20 },

  // ─── Russia / CIS / Black Sea ────────────────────────
  { id: "UST_LUGA",   name: "Ust-Luga",     country: "Russia", region: "RUSSIA_CIS", lat: 59.66, lng: 28.42, radiusNm: 15, opecLoading: true },
  { id: "PRIMORSK",   name: "Primorsk",     country: "Russia", region: "RUSSIA_CIS", lat: 60.36, lng: 28.61, radiusNm: 15, opecLoading: true },
  { id: "NOVOROSSIYSK", name: "Novorossiysk", country: "Russia", region: "RUSSIA_CIS", lat: 44.72, lng: 37.79, radiusNm: 20, opecLoading: true },
  { id: "KOZMINO",    name: "Kozmino",      country: "Russia", region: "RUSSIA_CIS", lat: 42.71, lng: 133.07, radiusNm: 15, opecLoading: true },
  { id: "CEYHAN",     name: "Ceyhan",       country: "Turkey", region: "RUSSIA_CIS", lat: 36.86, lng: 35.93, radiusNm: 20 },

  // ─── West Africa ──────────────────────────────────────
  { id: "BONNY",     name: "Bonny",     country: "Nigeria", region: "WAFRICA", lat: 4.45, lng: 7.17, radiusNm: 25, opecLoading: true },
  { id: "FORCADOS",  name: "Forcados",  country: "Nigeria", region: "WAFRICA", lat: 5.35, lng: 5.35, radiusNm: 20, opecLoading: true },
  { id: "ESCRAVOS",  name: "Escravos",  country: "Nigeria", region: "WAFRICA", lat: 5.62, lng: 5.20, radiusNm: 20, opecLoading: true },
  { id: "DJENO",     name: "Djeno",     country: "Congo",   region: "WAFRICA", lat: -4.92, lng: 11.78, radiusNm: 15, opecLoading: true },
  { id: "SOYO",      name: "Soyo / Cabinda", country: "Angola", region: "WAFRICA", lat: -6.13, lng: 12.37, radiusNm: 25, opecLoading: true },

  // ─── Americas ─────────────────────────────────────────
  { id: "LOOP",      name: "LOOP", country: "USA", region: "AMERICAS", lat: 28.88, lng: -90.03, radiusNm: 15 },
  { id: "HOUSTON",   name: "Houston Ship Channel", country: "USA", region: "AMERICAS", lat: 29.74, lng: -94.99, radiusNm: 20 },
  { id: "CORPUS",    name: "Corpus Christi", country: "USA", region: "AMERICAS", lat: 27.81, lng: -97.40, radiusNm: 20 },
  { id: "JOSE",      name: "José Terminal", country: "Venezuela", region: "AMERICAS", lat: 10.10, lng: -64.83, radiusNm: 20, opecLoading: true },

  // ─── Europe ───────────────────────────────────────────
  { id: "ROTTERDAM", name: "Rotterdam (Europoort)", country: "Netherlands", region: "EUROPE", lat: 51.95, lng: 4.05, radiusNm: 15 },
  { id: "TRIESTE",   name: "Trieste",   country: "Italy", region: "EUROPE", lat: 45.65, lng: 13.75, radiusNm: 10 },
  { id: "AUGUSTA",   name: "Augusta",   country: "Italy", region: "EUROPE", lat: 37.20, lng: 15.22, radiusNm: 10 },
  { id: "MILFORD",   name: "Milford Haven", country: "UK", region: "EUROPE", lat: 51.70, lng: -5.05, radiusNm: 10 },

  // ─── Asia ─────────────────────────────────────────────
  { id: "NINGBO",    name: "Ningbo-Zhoushan", country: "China", region: "ASIA", lat: 29.97, lng: 122.20, radiusNm: 25 },
  { id: "QINGDAO",   name: "Qingdao", country: "China", region: "ASIA", lat: 36.07, lng: 120.32, radiusNm: 20 },
  { id: "DALIAN",    name: "Dalian",  country: "China", region: "ASIA", lat: 38.92, lng: 121.65, radiusNm: 15 },
  { id: "SINGAPORE", name: "Singapore", country: "Singapore", region: "ASIA", lat: 1.27, lng: 103.83, radiusNm: 25 },
  { id: "CHIBA",     name: "Chiba", country: "Japan", region: "ASIA", lat: 35.55, lng: 140.10, radiusNm: 15 },
];

const NM_PER_DEG_LAT = 60;

/** Haversine distance in nautical miles. */
export function distanceNm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065; // earth radius in nm
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Returns the terminal whose circle contains the point, or null. */
export function terminalContaining(lat: number, lng: number): OilTerminal | null {
  for (const t of OIL_TERMINALS) {
    // cheap pre-filter
    if (Math.abs(t.lat - lat) > 1.5 || Math.abs(t.lng - lng) > 2) continue;
    if (distanceNm(lat, lng, t.lat, t.lng) <= t.radiusNm) return t;
  }
  return null;
}

/** True if a position is more than `bufferNm` outside ANY terminal. */
export function isOpenSea(lat: number, lng: number, bufferNm = 0): boolean {
  for (const t of OIL_TERMINALS) {
    if (Math.abs(t.lat - lat) > 2 || Math.abs(t.lng - lng) > 3) continue;
    if (distanceNm(lat, lng, t.lat, t.lng) <= t.radiusNm + bufferNm) return false;
  }
  return true;
}
