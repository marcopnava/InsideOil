/**
 * Fallback data when PostgreSQL is not available.
 * Based on real shipping routes with simulated positions.
 */

const ROUTES = [
  {
    name: "Asia-Europe via Suez",
    origin: { name: "Shanghai", lat: 31.2, lng: 121.5 },
    dest: { name: "Rotterdam", lat: 51.9, lng: 4.5 },
    waypoints: [[121.5,31.2],[104.0,1.3],[73.0,10.0],[43.0,12.5],[35.0,30.0],[10.0,36.0],[4.5,51.9]],
  },
  {
    name: "Trans-Pacific Eastbound",
    origin: { name: "Busan", lat: 35.1, lng: 129.1 },
    dest: { name: "Los Angeles", lat: 33.7, lng: -118.3 },
    waypoints: [[129.1,35.1],[155.0,35.0],[-170.0,38.0],[-140.0,35.0],[-118.3,33.7]],
  },
  {
    name: "Asia-Med via Suez",
    origin: { name: "Singapore", lat: 1.3, lng: 103.9 },
    dest: { name: "Hamburg", lat: 53.5, lng: 10.0 },
    waypoints: [[103.9,1.3],[73.0,8.0],[55.0,12.5],[43.5,12.0],[35.0,30.0],[15.0,38.0],[10.0,53.5]],
  },
  {
    name: "China-UK via Suez",
    origin: { name: "Yantian", lat: 22.6, lng: 114.3 },
    dest: { name: "Felixstowe", lat: 51.9, lng: 1.3 },
    waypoints: [[114.3,22.6],[104.0,1.3],[80.0,6.0],[50.0,12.5],[43.5,12.8],[35.0,31.0],[1.3,51.9]],
  },
  {
    name: "China-Med via Suez",
    origin: { name: "Ningbo", lat: 29.9, lng: 121.6 },
    dest: { name: "Algeciras", lat: 36.1, lng: -5.4 },
    waypoints: [[121.6,29.9],[104.0,1.3],[73.0,8.0],[50.0,12.5],[43.5,12.8],[35.0,31.0],[-5.4,36.1]],
  },
  {
    name: "Trans-Pacific to Long Beach",
    origin: { name: "Tokyo", lat: 35.5, lng: 139.8 },
    dest: { name: "Long Beach", lat: 33.8, lng: -118.2 },
    waypoints: [[139.8,35.5],[160.0,37.0],[-175.0,40.0],[-145.0,36.0],[-118.2,33.8]],
  },
  {
    name: "China-Greece via Suez",
    origin: { name: "Qingdao", lat: 36.0, lng: 120.3 },
    dest: { name: "Piraeus", lat: 37.9, lng: 23.6 },
    waypoints: [[120.3,36.0],[104.0,1.3],[80.0,6.0],[55.0,12.5],[43.5,12.8],[35.0,31.0],[23.6,37.9]],
  },
  {
    name: "Asia-South America",
    origin: { name: "Kaohsiung", lat: 22.6, lng: 120.3 },
    dest: { name: "Santos", lat: -23.9, lng: -46.3 },
    waypoints: [[120.3,22.6],[104.0,1.3],[55.0,-10.0],[20.0,-20.0],[-30.0,-18.0],[-46.3,-23.9]],
  },
  {
    name: "Middle East-US East Coast",
    origin: { name: "Jebel Ali", lat: 25.0, lng: 55.1 },
    dest: { name: "New York", lat: 40.7, lng: -74.0 },
    waypoints: [[55.1,25.0],[43.5,12.8],[35.0,31.0],[0.0,36.0],[-10.0,36.0],[-50.0,38.0],[-74.0,40.7]],
  },
  {
    name: "Sri Lanka-South Africa",
    origin: { name: "Colombo", lat: 6.9, lng: 79.9 },
    dest: { name: "Durban", lat: -29.9, lng: 31.0 },
    waypoints: [[79.9,6.9],[65.0,0.0],[50.0,-10.0],[40.0,-20.0],[31.0,-29.9]],
  },
  {
    name: "US-North Europe",
    origin: { name: "Savannah", lat: 32.1, lng: -81.1 },
    dest: { name: "Bremerhaven", lat: 53.5, lng: 8.6 },
    waypoints: [[-81.1,32.1],[-60.0,38.0],[-30.0,42.0],[-10.0,48.0],[8.6,53.5]],
  },
  {
    name: "East Med Short-haul",
    origin: { name: "Haifa", lat: 32.8, lng: 35.0 },
    dest: { name: "Genoa", lat: 44.4, lng: 8.9 },
    waypoints: [[35.0,32.8],[28.0,35.5],[15.0,37.0],[8.9,44.4]],
  },
];

const VESSEL_DEFS = [
  { name: "Emma Maersk", imo: "IMO9321483", flag: "Denmark", capacityTeu: 15550, cargo: "Electronics", routeIdx: 0, speed: 14, progress: 0.35 },
  { name: "MSC Gulsun", imo: "IMO9839430", flag: "Panama", capacityTeu: 23756, cargo: "Consumer Goods", routeIdx: 1, speed: 16, progress: 0.55 },
  { name: "CMA CGM Marco Polo", imo: "IMO9454436", flag: "France", capacityTeu: 16020, cargo: "Mixed Cargo", routeIdx: 2, speed: 15, progress: 0.42 },
  { name: "Ever Given", imo: "IMO9811000", flag: "Panama", capacityTeu: 20124, cargo: "Furniture & Textiles", routeIdx: 3, speed: 13, progress: 0.28, delayed: true, delayReason: "Weather delay in Indian Ocean" },
  { name: "HMM Algeciras", imo: "IMO9863297", flag: "South Korea", capacityTeu: 23964, cargo: "Automotive Parts", routeIdx: 4, speed: 15, progress: 0.6 },
  { name: "ONE Apus", imo: "IMO9806079", flag: "Japan", capacityTeu: 14052, cargo: "Industrial Equipment", routeIdx: 5, speed: 17, progress: 0.72 },
  { name: "Cosco Shipping Universe", imo: "IMO9795610", flag: "China", capacityTeu: 21237, cargo: "Raw Materials", routeIdx: 6, speed: 14, progress: 0.48 },
  { name: "Yang Ming Wellness", imo: "IMO9684689", flag: "Taiwan", capacityTeu: 14220, cargo: "Electronics", routeIdx: 7, speed: 14, progress: 0.33, delayed: true, delayReason: "Port congestion at Santos" },
  { name: "MSC Anna", imo: "IMO9839442", flag: "Switzerland", capacityTeu: 19462, cargo: "Oil & Gas Equipment", routeIdx: 8, speed: 16, progress: 0.51 },
  { name: "Evergreen Triton", imo: "IMO9927600", flag: "Singapore", capacityTeu: 12118, cargo: "Textiles & Garments", routeIdx: 9, speed: 13, progress: 0.65 },
  { name: "Hapag-Lloyd Berlin", imo: "IMO9870624", flag: "Germany", capacityTeu: 15300, cargo: "Agricultural Products", routeIdx: 10, speed: 18, progress: 0.82 },
  { name: "ZIM Tarragona", imo: "IMO9867350", flag: "Israel", capacityTeu: 10070, cargo: "Chemicals", routeIdx: 11, speed: 12, progress: 0.45 },
];

function interpolatePosition(waypoints: number[][], progress: number) {
  const totalSegs = waypoints.length - 1;
  const segFloat = progress * totalSegs;
  const segIdx = Math.min(Math.floor(segFloat), totalSegs - 1);
  const segProgress = segFloat - segIdx;
  const lng = waypoints[segIdx][0] + (waypoints[segIdx + 1][0] - waypoints[segIdx][0]) * segProgress;
  const lat = waypoints[segIdx][1] + (waypoints[segIdx + 1][1] - waypoints[segIdx][1]) * segProgress;
  const heading = (Math.atan2(
    waypoints[segIdx + 1][0] - waypoints[segIdx][0],
    waypoints[segIdx + 1][1] - waypoints[segIdx][1]
  ) * 180) / Math.PI;
  return { lat, lng, heading: ((heading % 360) + 360) % 360 };
}

// Slowly animate progress based on real time
function getAnimatedProgress(base: number): number {
  const drift = ((Date.now() / 3_600_000) % 1) * 0.05; // ~5% per hour
  return Math.min(0.98, base + drift);
}

export function getFallbackVessels() {
  return VESSEL_DEFS.map((v, i) => {
    const route = ROUTES[v.routeIdx];
    const progress = getAnimatedProgress(v.progress);
    const pos = interpolatePosition(route.waypoints, progress);
    const departureAt = new Date(Date.now() - progress * 25 * 86400000);
    const etaAt = new Date(departureAt.getTime() + 25 * 86400000);

    return {
      id: `fallback-${i}`,
      name: v.name,
      imo: v.imo,
      flag: v.flag,
      vesselType: "CONTAINER" as const,
      capacityTeu: v.capacityTeu,
      cargo: v.cargo,
      status: ("delayed" in v && v.delayed) ? "DELAYED" : progress > 0.95 ? "ARRIVING" : "IN_TRANSIT",
      speed: v.speed,
      heading: pos.heading,
      lat: pos.lat,
      lng: pos.lng,
      progress,
      departureAt: departureAt.toISOString(),
      etaAt: etaAt.toISOString(),
      isDelayed: ("delayed" in v && v.delayed) || false,
      delayReason: ("delayReason" in v ? v.delayReason : null) as string | null,
      mmsi: null,
      routeId: null,
      originPortId: null,
      destPortId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      route: {
        id: `route-${v.routeIdx}`,
        name: route.name,
        originPortId: "",
        destPortId: "",
        waypoints: route.waypoints,
        distanceNm: null,
        avgTransitDays: null,
        originPort: { id: "", name: route.origin.name, code: "", country: "", lat: route.origin.lat, lng: route.origin.lng, timezone: null, isActive: true },
        destPort: { id: "", name: route.dest.name, code: "", country: "", lat: route.dest.lat, lng: route.dest.lng, timezone: null, isActive: true },
      },
      originPort: { id: "", name: route.origin.name, code: "", country: "", lat: route.origin.lat, lng: route.origin.lng, timezone: null, isActive: true },
      destPort: { id: "", name: route.dest.name, code: "", country: "", lat: route.dest.lat, lng: route.dest.lng, timezone: null, isActive: true },
    };
  });
}

export const FALLBACK_VESSELS = getFallbackVessels();

export const FALLBACK_ALERTS = [
  { id: "fa-1", type: "DELAY", severity: "CRITICAL", title: "Vessel Delay — Ever Given", description: "Yantian → Felixstowe, +36h weather delay in Indian Ocean", isRead: false, isResolved: false, entityType: "vessel", entityId: null, userId: null, createdAt: new Date().toISOString(), resolvedAt: null },
  { id: "fa-2", type: "CONGESTION", severity: "WARNING", title: "High traffic density — Malacca Strait", description: "47 AIS vessels detected in transit zone", isRead: false, isResolved: false, entityType: "port", entityId: null, userId: null, createdAt: new Date().toISOString(), resolvedAt: null },
  { id: "fa-3", type: "RATE_SPIKE", severity: "INFO", title: "Freight rate spike +15%", description: "SCFI Asia-Med route rising, expected peak in 3 days", isRead: false, isResolved: false, entityType: null, entityId: null, userId: null, createdAt: new Date().toISOString(), resolvedAt: null },
  { id: "fa-4", type: "DELAY", severity: "WARNING", title: "Port congestion — Santos", description: "Yang Ming Wellness delayed, berth allocation pending", isRead: false, isResolved: false, entityType: "vessel", entityId: null, userId: null, createdAt: new Date().toISOString(), resolvedAt: null },
  { id: "fa-5", type: "WEATHER", severity: "WARNING", title: "Storm warning — North Atlantic", description: "Wind gusts up to 55kn expected on US-Europe routes, next 48h", isRead: false, isResolved: false, entityType: null, entityId: null, userId: null, createdAt: new Date().toISOString(), resolvedAt: null },
];
