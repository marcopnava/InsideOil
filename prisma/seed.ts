import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ─── Admin User ──────────────────────────────────────────
  const adminEmail = "admin@insideoil.it";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || "Admin2025!";
  const adminHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash, role: "ADMIN" },
    create: {
      email: adminEmail,
      name: "Admin",
      passwordHash: adminHash,
      role: "ADMIN",
      subscriptionTier: "professional",
    },
  });
  console.log(`  Admin user: ${adminEmail}`);

  // ─── Ports ────────────────────────────────────────────────
  const ports = await Promise.all(
    [
      { name: "Shanghai", code: "CNSHA", country: "China", lat: 31.2, lng: 121.5, timezone: "Asia/Shanghai" },
      { name: "Rotterdam", code: "NLRTM", country: "Netherlands", lat: 51.9, lng: 4.5, timezone: "Europe/Amsterdam" },
      { name: "Singapore", code: "SGSIN", country: "Singapore", lat: 1.3, lng: 103.9, timezone: "Asia/Singapore" },
      { name: "Busan", code: "KRPUS", country: "South Korea", lat: 35.1, lng: 129.1, timezone: "Asia/Seoul" },
      { name: "Los Angeles", code: "USLAX", country: "United States", lat: 33.7, lng: -118.3, timezone: "America/Los_Angeles" },
      { name: "Hamburg", code: "DEHAM", country: "Germany", lat: 53.5, lng: 10.0, timezone: "Europe/Berlin" },
      { name: "Dubai (Jebel Ali)", code: "AEJEA", country: "UAE", lat: 25.0, lng: 55.1, timezone: "Asia/Dubai" },
      { name: "Genoa", code: "ITGOA", country: "Italy", lat: 44.4, lng: 8.9, timezone: "Europe/Rome" },
      { name: "New York", code: "USNYC", country: "United States", lat: 40.7, lng: -74.0, timezone: "America/New_York" },
      { name: "Tokyo", code: "JPTYO", country: "Japan", lat: 35.5, lng: 139.8, timezone: "Asia/Tokyo" },
      { name: "Piraeus", code: "GRPIR", country: "Greece", lat: 37.9, lng: 23.6, timezone: "Europe/Athens" },
      { name: "Felixstowe", code: "GBFXT", country: "United Kingdom", lat: 51.9, lng: 1.3, timezone: "Europe/London" },
      { name: "Santos", code: "BRSSZ", country: "Brazil", lat: -23.9, lng: -46.3, timezone: "America/Sao_Paulo" },
      { name: "Mumbai", code: "INBOM", country: "India", lat: 19.1, lng: 72.9, timezone: "Asia/Kolkata" },
      { name: "Colombo", code: "LKCMB", country: "Sri Lanka", lat: 6.9, lng: 79.9, timezone: "Asia/Colombo" },
      { name: "Durban", code: "ZADUR", country: "South Africa", lat: -29.9, lng: 31.0, timezone: "Africa/Johannesburg" },
      { name: "Algeciras", code: "ESALG", country: "Spain", lat: 36.1, lng: -5.4, timezone: "Europe/Madrid" },
      { name: "Bremerhaven", code: "DEBRV", country: "Germany", lat: 53.5, lng: 8.6, timezone: "Europe/Berlin" },
      { name: "Savannah", code: "USSAV", country: "United States", lat: 32.1, lng: -81.1, timezone: "America/New_York" },
      { name: "Haifa", code: "ILHFA", country: "Israel", lat: 32.8, lng: 35.0, timezone: "Asia/Jerusalem" },
      { name: "Yantian", code: "CNYTN", country: "China", lat: 22.6, lng: 114.3, timezone: "Asia/Shanghai" },
      { name: "Ningbo", code: "CNNGB", country: "China", lat: 29.9, lng: 121.6, timezone: "Asia/Shanghai" },
      { name: "Qingdao", code: "CNQIN", country: "China", lat: 36.0, lng: 120.3, timezone: "Asia/Shanghai" },
      { name: "Kaohsiung", code: "TWKHH", country: "Taiwan", lat: 22.6, lng: 120.3, timezone: "Asia/Taipei" },
      { name: "Long Beach", code: "USLGB", country: "United States", lat: 33.8, lng: -118.2, timezone: "America/Los_Angeles" },
    ].map((p) =>
      prisma.port.upsert({
        where: { code: p.code },
        update: p,
        create: p,
      })
    )
  );

  const portByCode = (code: string) => ports.find((p) => p.code === code)!;

  // ─── Shipping Routes ──────────────────────────────────────
  const routeDefs = [
    {
      name: "Asia-Europe via Suez",
      origin: "CNSHA", dest: "NLRTM",
      waypoints: [[121.5,31.2],[104.0,1.3],[73.0,10.0],[43.0,12.5],[35.0,30.0],[10.0,36.0],[4.5,51.9]],
      distanceNm: 10560, avgTransitDays: 32,
    },
    {
      name: "Trans-Pacific Eastbound",
      origin: "KRPUS", dest: "USLAX",
      waypoints: [[129.1,35.1],[155.0,35.0],[-170.0,38.0],[-140.0,35.0],[-118.3,33.7]],
      distanceNm: 5950, avgTransitDays: 14,
    },
    {
      name: "Asia-Med via Suez",
      origin: "SGSIN", dest: "DEHAM",
      waypoints: [[103.9,1.3],[73.0,8.0],[55.0,12.5],[43.5,12.0],[35.0,30.0],[15.0,38.0],[10.0,53.5]],
      distanceNm: 9500, avgTransitDays: 28,
    },
    {
      name: "China-UK via Suez",
      origin: "CNYTN", dest: "GBFXT",
      waypoints: [[114.3,22.6],[104.0,1.3],[80.0,6.0],[50.0,12.5],[43.5,12.8],[35.0,31.0],[1.3,51.9]],
      distanceNm: 10200, avgTransitDays: 30,
    },
    {
      name: "China-Med via Suez",
      origin: "CNNGB", dest: "ESALG",
      waypoints: [[121.6,29.9],[104.0,1.3],[73.0,8.0],[50.0,12.5],[43.5,12.8],[35.0,31.0],[-5.4,36.1]],
      distanceNm: 9200, avgTransitDays: 27,
    },
    {
      name: "Trans-Pacific to Long Beach",
      origin: "JPTYO", dest: "USLGB",
      waypoints: [[139.8,35.5],[160.0,37.0],[-175.0,40.0],[-145.0,36.0],[-118.2,33.8]],
      distanceNm: 5530, avgTransitDays: 13,
    },
    {
      name: "China-Greece via Suez",
      origin: "CNQIN", dest: "GRPIR",
      waypoints: [[120.3,36.0],[104.0,1.3],[80.0,6.0],[55.0,12.5],[43.5,12.8],[35.0,31.0],[23.6,37.9]],
      distanceNm: 9400, avgTransitDays: 28,
    },
    {
      name: "Asia-South America",
      origin: "TWKHH", dest: "BRSSZ",
      waypoints: [[120.3,22.6],[104.0,1.3],[55.0,-10.0],[20.0,-20.0],[-30.0,-18.0],[-46.3,-23.9]],
      distanceNm: 12400, avgTransitDays: 35,
    },
    {
      name: "Middle East-US East Coast",
      origin: "AEJEA", dest: "USNYC",
      waypoints: [[55.1,25.0],[43.5,12.8],[35.0,31.0],[0.0,36.0],[-10.0,36.0],[-50.0,38.0],[-74.0,40.7]],
      distanceNm: 8800, avgTransitDays: 25,
    },
    {
      name: "Sri Lanka-South Africa",
      origin: "LKCMB", dest: "ZADUR",
      waypoints: [[79.9,6.9],[65.0,0.0],[50.0,-10.0],[40.0,-20.0],[31.0,-29.9]],
      distanceNm: 4200, avgTransitDays: 14,
    },
    {
      name: "US-North Europe",
      origin: "USSAV", dest: "DEBRV",
      waypoints: [[-81.1,32.1],[-60.0,38.0],[-30.0,42.0],[-10.0,48.0],[8.6,53.5]],
      distanceNm: 4400, avgTransitDays: 12,
    },
    {
      name: "East Med Short-haul",
      origin: "ILHFA", dest: "ITGOA",
      waypoints: [[35.0,32.8],[28.0,35.5],[15.0,37.0],[8.9,44.4]],
      distanceNm: 1900, avgTransitDays: 6,
    },
  ];

  const routes = [];
  for (const r of routeDefs) {
    const route = await prisma.shippingRoute.create({
      data: {
        name: r.name,
        originPortId: portByCode(r.origin).id,
        destPortId: portByCode(r.dest).id,
        waypoints: r.waypoints,
        distanceNm: r.distanceNm,
        avgTransitDays: r.avgTransitDays,
      },
    });
    routes.push(route);
  }

  // ─── Vessels ──────────────────────────────────────────────
  const vesselDefs = [
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

  for (const v of vesselDefs) {
    const route = routes[v.routeIdx];
    const waypoints = route.waypoints as number[][];

    // Calculate position from progress
    const totalSegs = waypoints.length - 1;
    const segFloat = v.progress * totalSegs;
    const segIdx = Math.min(Math.floor(segFloat), totalSegs - 1);
    const segProgress = segFloat - segIdx;
    const lng = waypoints[segIdx][0] + (waypoints[segIdx + 1][0] - waypoints[segIdx][0]) * segProgress;
    const lat = waypoints[segIdx][1] + (waypoints[segIdx + 1][1] - waypoints[segIdx][1]) * segProgress;
    const heading = (Math.atan2(waypoints[segIdx + 1][0] - waypoints[segIdx][0], waypoints[segIdx + 1][1] - waypoints[segIdx][1]) * 180) / Math.PI;

    const departureAt = new Date(Date.now() - v.progress * (route.avgTransitDays || 20) * 86400000);
    const etaAt = new Date(departureAt.getTime() + (route.avgTransitDays || 20) * 86400000);

    await prisma.vessel.create({
      data: {
        name: v.name,
        imo: v.imo,
        flag: v.flag,
        vesselType: "CONTAINER",
        capacityTeu: v.capacityTeu,
        cargo: v.cargo,
        status: v.delayed ? "DELAYED" : v.progress > 0.95 ? "ARRIVING" : "IN_TRANSIT",
        speed: v.speed,
        heading: ((heading % 360) + 360) % 360,
        lat,
        lng,
        progress: v.progress,
        departureAt,
        etaAt,
        isDelayed: v.delayed || false,
        delayReason: v.delayReason || null,
        routeId: route.id,
        originPortId: route.originPortId,
        destPortId: route.destPortId,
      },
    });
  }

  // ─── Alerts ───────────────────────────────────────────────
  await prisma.alert.createMany({
    data: [
      { type: "DELAY", severity: "CRITICAL", title: "Vessel Delay — Ever Given", description: "Yantian → Felixstowe, +36h weather delay in Indian Ocean", entityType: "vessel" },
      { type: "CONGESTION", severity: "WARNING", title: "High traffic density", description: "Strait of Malacca — 47 vessels in transit zone", entityType: "port" },
      { type: "RATE_SPIKE", severity: "INFO", title: "Freight rate spike +15%", description: "SCFI Asia-Med route rising, expected peak in 3 days" },
      { type: "DELAY", severity: "WARNING", title: "Port congestion — Santos", description: "Yang Ming Wellness delayed, berth allocation pending", entityType: "vessel" },
      { type: "CAPACITY", severity: "INFO", title: "Warehouse at 88% capacity", description: "Rotterdam Europoort hub approaching saturation" },
    ],
  });

  console.log("Seed complete!");
  console.log(`  ${ports.length} ports`);
  console.log(`  ${routes.length} routes`);
  console.log(`  ${vesselDefs.length} vessels`);
  console.log(`  5 alerts`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
