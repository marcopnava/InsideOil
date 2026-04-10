/**
 * Long-lived AIS worker.
 *
 * Run with:
 *   npx tsx workers/ais-worker.ts
 *
 * Requires AISSTREAM_API_KEY in env (free at https://aisstream.io).
 *
 * Deploy: this is a Node process — run on Railway / Fly.io / a Linux VM,
 * NOT on Vercel (Vercel serverless cannot hold WebSocket connections).
 */

import "dotenv/config";
import http from "node:http";
import { startAisStreamWorker } from "../src/lib/aisstream";
import { fetchAircraft } from "../src/lib/opensky";

// ─── Tiny health server ───────────────────────────────────────
// Required to deploy this worker as a Render "Web Service" (free tier).
// Render free spins down after 15 min of HTTP inactivity, so UptimeRobot
// can ping /health every 5 min to keep the WebSocket alive.
// Locally / on Railway you can ignore the port.
const PORT = Number(process.env.PORT ?? 8080);
let lastAisMessageAt = Date.now();
let totalMessages = 0;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    const ageSec = Math.round((Date.now() - lastAisMessageAt) / 1000);
    const healthy = ageSec < 300; // last AIS msg < 5 min ago
    res.writeHead(healthy ? 200 : 503, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: healthy ? "ok" : "stale",
        lastMessageAgoSec: ageSec,
        totalMessages,
      })
    );
    return;
  }
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("InsideOil AIS worker. /health for status.");
});
server.listen(PORT, () => console.log(`[ais-worker] health server on :${PORT}`));

const apiKey = process.env.AISSTREAM_API_KEY;
if (!apiKey) {
  console.error(
    "AISSTREAM_API_KEY not set. Sign up free at https://aisstream.io/ and add it to .env"
  );
  process.exit(1);
}

const worker = startAisStreamWorker({
  apiKey,
  // Default: global. To narrow for testing, pass:
  // bbox: [{ sw: [10, -10], ne: [60, 40] }], // North Sea + Med
  flushIntervalMs: 30_000,
  onMessage: () => {
    lastAisMessageAt = Date.now();
    totalMessages++;
  },
});

// ─── OpenSky cargo aircraft polling ─────────────────────────
// Vercel cannot reach opensky-network.org (TCP timeout from their egress IPs).
// We poll from this Mac process instead — same architecture as AIS — and
// write the cargo snapshots to Postgres. The Vercel /api/aircraft route
// reads from there.
const OPENSKY_POLL_MS = 5 * 60_000;
async function pollOpenSky() {
  try {
    const aircraft = await fetchAircraft({ force: true });
    const cargo = aircraft.filter((a) => a.isCargo).length;
    console.log(`[opensky] poll: ${aircraft.length} states, ${cargo} cargo`);
  } catch (e) {
    console.error("[opensky] poll failed:", e);
  }
}
pollOpenSky();
const openSkyTimer = setInterval(pollOpenSky, OPENSKY_POLL_MS);

const shutdown = async () => {
  console.log("\n[ais-worker] shutting down…");
  clearInterval(openSkyTimer);
  await worker.stop();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("[ais-worker] running. Ctrl+C to stop.");
