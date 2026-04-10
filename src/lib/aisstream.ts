/**
 * AISStream.io WebSocket client.
 *
 * Free global AIS feed. Sign up at https://aisstream.io/ for an API key.
 * Set AISSTREAM_API_KEY in env. Run via `workers/ais-worker.ts`.
 *
 * Vercel serverless cannot hold a WebSocket open — this MUST run as a
 * long-lived process (Railway, Fly, local, etc.).
 */

import WebSocket from "ws";
import { db } from "@/lib/db";
import { aisShipTypeName, NAV_STATUS_NAME } from "@/lib/ais-types";

const WS_URL = "wss://stream.aisstream.io/v0/stream";

interface BoundingBox {
  // [[lat_min, lng_min], [lat_max, lng_max]]
  sw: [number, number];
  ne: [number, number];
}

// Default: global coverage. Can be narrowed for testing.
const GLOBAL_BBOX: BoundingBox[] = [
  { sw: [-90, -180], ne: [90, 180] },
];

// Buffer of latest position per MMSI; flushed periodically to Postgres.
interface BufferedVessel {
  mmsi: number;
  imo?: number | null;
  name?: string | null;
  callSign?: string | null;
  shipType?: number | null;
  destination?: string | null;
  eta?: string | null;
  draught?: number | null;
  lat: number;
  lng: number;
  speed?: number | null;
  course?: number | null;
  heading?: number | null;
  navStatus?: number | null;
  lastSeen: Date;
}

const buffer: Map<number, BufferedVessel> = new Map();
let snapshotCounter = 0;
const SNAPSHOT_EVERY_N_FLUSHES = 10; // ~every 5 minutes if flush=30s

function applyMessage(msg: Record<string, unknown>) {
  const type = msg.MessageType as string | undefined;
  const meta = msg.MetaData as Record<string, unknown> | undefined;
  const payload = msg.Message as Record<string, unknown> | undefined;
  if (!meta || !payload) return;
  const mmsi = Number(meta.MMSI);
  if (!Number.isFinite(mmsi)) return;

  const lat = Number(meta.latitude ?? meta.Latitude);
  const lng = Number(meta.longitude ?? meta.Longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const existing = buffer.get(mmsi) ?? {
    mmsi,
    lat,
    lng,
    lastSeen: new Date(),
  };
  existing.lat = lat;
  existing.lng = lng;
  existing.lastSeen = new Date();

  // PositionReport carries dynamic data (speed, course, heading, navStatus)
  if (type === "PositionReport") {
    const pr = payload.PositionReport as Record<string, unknown> | undefined;
    if (pr) {
      existing.speed = num(pr.Sog);
      existing.course = num(pr.Cog);
      existing.heading = num(pr.TrueHeading);
      existing.navStatus = num(pr.NavigationalStatus);
    }
  }

  // ShipStaticData carries identity (name, IMO, type, destination, draught)
  if (type === "ShipStaticData") {
    const sd = payload.ShipStaticData as Record<string, unknown> | undefined;
    if (sd) {
      existing.imo = num(sd.ImoNumber);
      existing.name = str(sd.Name);
      existing.callSign = str(sd.CallSign);
      existing.shipType = num(sd.Type);
      existing.destination = str(sd.Destination);
      existing.eta = sd.Eta ? JSON.stringify(sd.Eta) : null;
      existing.draught = num(sd.MaximumStaticDraught);
    }
  }

  // Some implementations also expose static via "ShipStaticData" key on root
  buffer.set(mmsi, existing);
}

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/\u0000/g, "").replace(/@+$/g, "").trim();
  return s.length > 0 ? s : null;
}

async function flushBuffer() {
  if (buffer.size === 0) return;
  const items = Array.from(buffer.values());
  buffer.clear();
  snapshotCounter += 1;
  const writeSnapshot = snapshotCounter % SNAPSHOT_EVERY_N_FLUSHES === 0;

  // Upsert one-by-one (Prisma has no upsertMany). For 1k–10k vessels every 30s,
  // this is fine on a basic Postgres. Can be replaced with raw SQL later.
  let ok = 0;
  let err = 0;
  for (const v of items) {
    try {
      await db.aisVessel.upsert({
        where: { mmsi: v.mmsi },
        create: {
          mmsi: v.mmsi,
          imo: v.imo ?? null,
          name: v.name ?? null,
          callSign: v.callSign ?? null,
          shipType: v.shipType ?? null,
          shipTypeName: aisShipTypeName(v.shipType),
          destination: v.destination ?? null,
          eta: v.eta ?? null,
          draught: v.draught ?? null,
          lat: v.lat,
          lng: v.lng,
          speed: v.speed ?? null,
          course: v.course ?? null,
          heading: v.heading ?? null,
          navStatus: v.navStatus ?? null,
          navStatusName: v.navStatus != null ? NAV_STATUS_NAME[v.navStatus] ?? null : null,
          lastSeen: v.lastSeen,
        },
        update: {
          lat: v.lat,
          lng: v.lng,
          speed: v.speed ?? undefined,
          course: v.course ?? undefined,
          heading: v.heading ?? undefined,
          navStatus: v.navStatus ?? undefined,
          navStatusName:
            v.navStatus != null ? NAV_STATUS_NAME[v.navStatus] ?? null : undefined,
          ...(v.imo ? { imo: v.imo } : {}),
          ...(v.name ? { name: v.name } : {}),
          ...(v.shipType != null
            ? { shipType: v.shipType, shipTypeName: aisShipTypeName(v.shipType) }
            : {}),
          ...(v.destination ? { destination: v.destination } : {}),
          ...(v.draught != null ? { draught: v.draught } : {}),
          lastSeen: v.lastSeen,
        },
      });
      if (writeSnapshot) {
        await db.aisPosition.create({
          data: {
            mmsi: v.mmsi,
            lat: v.lat,
            lng: v.lng,
            speed: v.speed ?? null,
            course: v.course ?? null,
            heading: v.heading ?? null,
            navStatus: v.navStatus ?? null,
            timestamp: v.lastSeen,
          },
        });
      }
      ok++;
    } catch (e) {
      err++;
      if (err < 3) console.warn("[AISStream] upsert failed:", e);
    }
  }
  console.log(
    `[AISStream] flushed ${ok}/${items.length} vessels${writeSnapshot ? " (+snapshot)" : ""}${err ? ` err=${err}` : ""}`
  );

  // Log flush
  db.fetchLog
    .create({
      data: { source: "aisstream", vesselCount: ok, error: err > 0 ? `${err} upsert errors` : null },
    })
    .catch(() => {});
}

export interface StartOptions {
  apiKey: string;
  bbox?: BoundingBox[];
  flushIntervalMs?: number;
  /** Restrict to tanker + cargo + passenger ship types only (saves DB writes). */
  shipTypeFilter?: "all" | "oil-focused";
  /** Called every time a valid AIS message is received (health-server hook). */
  onMessage?: () => void;
}

export function startAisStreamWorker(opts: StartOptions) {
  const flushMs = opts.flushIntervalMs ?? 30_000;
  const bbox = opts.bbox ?? GLOBAL_BBOX;

  let ws: WebSocket | null = null;
  let reconnectDelay = 1_000;
  let stopped = false;

  function connect() {
    if (stopped) return;
    console.log("[AISStream] connecting…");
    ws = new WebSocket(WS_URL);

    ws.on("open", () => {
      reconnectDelay = 1_000;
      const sub = {
        APIKey: opts.apiKey,
        BoundingBoxes: bbox.map((b) => [b.sw, b.ne]),
        FilterMessageTypes: ["PositionReport", "ShipStaticData"],
      };
      ws!.send(JSON.stringify(sub));
      console.log("[AISStream] subscribed");
    });

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.error) {
          console.error("[AISStream] server error:", msg.error);
          return;
        }
        applyMessage(msg);
        if (typeof opts.onMessage === "function") opts.onMessage();
      } catch {
        // ignore malformed
      }
    });

    ws.on("close", (code) => {
      console.warn(`[AISStream] closed (${code}), reconnecting in ${reconnectDelay}ms`);
      if (stopped) return;
      setTimeout(connect, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
    });

    ws.on("error", (err) => {
      console.error("[AISStream] socket error:", err.message);
      try { ws?.close(); } catch {}
    });
  }

  connect();

  const flushTimer = setInterval(() => {
    flushBuffer().catch((e) => console.error("[AISStream] flush failed:", e));
  }, flushMs);

  return {
    stop: async () => {
      stopped = true;
      clearInterval(flushTimer);
      try { ws?.close(); } catch {}
      await flushBuffer();
    },
  };
}
