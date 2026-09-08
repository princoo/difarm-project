import type { NextApiRequest, NextApiResponse } from "next";

type WeatherResponse = {
  locationName: string;
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    description: string;
    high: number;
    low: number;
    sunset: string;
    skyCover: number;
    precip1h: number;
  };
  hourly: {
    time: string;
    temp: number;
    windSpeed: number;
    precipProb: number;
    description: string;
  }[];
};

const WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Snow",
  80: "Rain showers",
  95: "Thunderstorm",
};

function describe(code: number) {
  return WEATHER_CODES[code] ?? "Scattered clouds";
}

async function geocode(query: string) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`;
  const res = await fetch(url);
  const data = await res.json();
  const hit = data?.results?.[0];
  if (!hit) return { lat: -1.9441, lon: 30.0619, name: query || "Kigali" };
  return { lat: hit.latitude, lon: hit.longitude, name: hit.name };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const latQ = req.query.lat ? Number(req.query.lat) : null;
    const lonQ = req.query.lon ? Number(req.query.lon) : null;
    const locationQ = typeof req.query.location === "string" ? req.query.location : "Kigali";

    let lat = latQ;
    let lon = lonQ;
    let locationName = locationQ;

    if (lat == null || lon == null || Number.isNaN(lat) || Number.isNaN(lon)) {
      const geo = await geocode(locationQ);
      lat = geo.lat;
      lon = geo.lon;
      locationName = geo.name;
    }

    const forecastUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,cloud_cover,precipitation` +
      `&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,sunset,weather_code` +
      `&timezone=auto&forecast_days=2`;

    const forecastRes = await fetch(forecastUrl);
    const forecast = await forecastRes.json();

    const current = forecast?.current;
    const hourly = forecast?.hourly;
    const daily = forecast?.daily;
    const now = new Date();
    const hourIdx = hourly?.time?.findIndex((t: string) => new Date(t).getHours() === now.getHours()) ?? 0;

    const payload: WeatherResponse = {
      locationName: locationName.toUpperCase(),
      current: {
        temp: Math.round(current?.temperature_2m ?? 0),
        feelsLike: Math.round(current?.apparent_temperature ?? current?.temperature_2m ?? 0),
        humidity: Math.round(current?.relative_humidity_2m ?? 0),
        windSpeed: Math.round(current?.wind_speed_10m ?? 0),
        description: describe(current?.weather_code ?? 2),
        high: Math.round(daily?.temperature_2m_max?.[0] ?? current?.temperature_2m ?? 0),
        low: Math.round(daily?.temperature_2m_min?.[0] ?? current?.temperature_2m ?? 0),
        sunset: daily?.sunset?.[0]
          ? new Date(daily.sunset[0]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "—",
        skyCover: Math.round(current?.cloud_cover ?? 0),
        precip1h: Math.round((current?.precipitation ?? 0) * 10) / 10,
      },
      hourly: (hourly?.time ?? [])
        .slice(hourIdx, hourIdx + 6)
        .map((time: string, i: number) => ({
          time: new Date(time).toLocaleTimeString([], { hour: "numeric" }),
          temp: Math.round(hourly.temperature_2m[hourIdx + i] ?? 0),
          windSpeed: Math.round(hourly.wind_speed_10m[hourIdx + i] ?? 0),
          precipProb: Math.round(hourly.precipitation_probability[hourIdx + i] ?? 0),
          description: describe(hourly.weather_code[hourIdx + i] ?? 0),
        })),
    };

    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate");
    return res.status(200).json(payload);
  } catch {
    return res.status(500).json({ message: "Could not load weather" });
  }
}
