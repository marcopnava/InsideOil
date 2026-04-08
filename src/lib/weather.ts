/**
 * Open-Meteo Marine Weather API — 100% free, no API key
 * Fixed: added retry logic and proper error handling
 */

const MARINE_BASE = "https://marine-api.open-meteo.com/v1/marine";
const FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";

export interface MarineWeather {
  lat: number;
  lng: number;
  waveHeight: number | null;
  wavePeriod: number | null;
  waveDirection: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  temperature: number | null;
  time: string;
}

const cache = new Map<string, { data: MarineWeather; fetchedAt: number }>();
const CACHE_TTL = 900_000;

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(1)},${lng.toFixed(1)}`;
}

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (res.ok) return res;
    } catch {
      if (i === retries) throw new Error(`Failed after ${retries + 1} attempts`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Unreachable");
}

export async function getMarineWeather(lat: number, lng: number): Promise<MarineWeather | null> {
  const key = cacheKey(lat, lng);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached.data;

  try {
    const [marineRes, weatherRes] = await Promise.allSettled([
      fetchWithRetry(`${MARINE_BASE}?latitude=${lat}&longitude=${lng}&current=wave_height,wave_period,wave_direction&timezone=auto`),
      fetchWithRetry(`${FORECAST_BASE}?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,wind_direction_10m&timezone=auto`),
    ]);

    const marine = marineRes.status === "fulfilled" ? await marineRes.value.json() : null;
    const weather = weatherRes.status === "fulfilled" ? await weatherRes.value.json() : null;

    const result: MarineWeather = {
      lat, lng,
      waveHeight: marine?.current?.wave_height ?? null,
      wavePeriod: marine?.current?.wave_period ?? null,
      waveDirection: marine?.current?.wave_direction ?? null,
      windSpeed: weather?.current?.wind_speed_10m ?? null,
      windDirection: weather?.current?.wind_direction_10m ?? null,
      temperature: weather?.current?.temperature_2m ?? null,
      time: weather?.current?.time ?? new Date().toISOString(),
    };

    cache.set(key, { data: result, fetchedAt: Date.now() });
    return result;
  } catch {
    return cached?.data ?? null;
  }
}

export async function getRouteWeather(
  points: { lat: number; lng: number; label: string }[]
): Promise<(MarineWeather & { label: string })[]> {
  // Fetch sequentially with small delays to avoid rate limiting
  const results: (MarineWeather & { label: string })[] = [];
  for (const p of points) {
    const w = await getMarineWeather(p.lat, p.lng);
    if (w) results.push({ ...w, label: p.label });
    await new Promise((r) => setTimeout(r, 100));
  }
  return results;
}
