import { NextResponse } from "next/server";
import { getRouteWeather } from "@/lib/weather";

export const dynamic = "force-dynamic";

// Key maritime waypoints for weather monitoring
const MARITIME_POINTS = [
  { lat: 1.3, lng: 103.9, label: "Strait of Malacca" },
  { lat: 30.5, lng: 32.3, label: "Suez Canal" },
  { lat: 36.0, lng: -5.5, label: "Strait of Gibraltar" },
  { lat: 51.0, lng: 1.5, label: "English Channel" },
  { lat: 9.0, lng: -79.5, label: "Panama Canal" },
  { lat: 35.3, lng: 139.7, label: "Tokyo Bay" },
  { lat: 37.8, lng: -122.5, label: "San Francisco Bay" },
  { lat: 22.3, lng: 114.2, label: "South China Sea" },
  { lat: -34.0, lng: 18.5, label: "Cape of Good Hope" },
  { lat: 60.2, lng: 25.0, label: "Gulf of Finland" },
  { lat: 25.0, lng: 55.0, label: "Persian Gulf" },
  { lat: 40.5, lng: -74.0, label: "New York Harbor" },
];

export async function GET() {
  try {
    const weather = await getRouteWeather(MARITIME_POINTS);

    return NextResponse.json({
      success: true,
      data: {
        points: weather,
        summary: {
          totalPoints: weather.length,
          maxWaveHeight: Math.max(...weather.map((w) => w.waveHeight ?? 0)),
          maxWindSpeed: Math.max(...weather.map((w) => w.windSpeed ?? 0)),
          avgTemp:
            weather.length > 0
              ? Math.round(
                  (weather.reduce((s, w) => s + (w.temperature ?? 0), 0) /
                    weather.length) *
                    10
                ) / 10
              : null,
          warnings: weather.filter(
            (w) => (w.waveHeight ?? 0) > 2.5 || (w.windSpeed ?? 0) > 40
          ),
        },
        source: "Open-Meteo Marine + Forecast API (free, no key)",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
