import { z } from 'zod';
import { fetchJson } from './http';
import { getCached, setCached } from './cache';

const numArr = z.array(z.number().nullable());

export const WeatherResponse = z.object({
  hourly: z.object({
    time: z.array(z.string()),
    wind_speed_10m: numArr, // km/h
    wind_direction_10m: numArr, // deg FROM
    wind_gusts_10m: numArr, // km/h
  }),
});
export type WeatherResponse = z.infer<typeof WeatherResponse>;

const WEATHER_VARS = ['wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m'].join(',');

export interface WeatherQuery {
  lat: number;
  lon: number;
  forecastDays?: number;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  cacheTtlMs?: number;
}

/** Fetch + validate Open-Meteo wind. Free, no API key. */
export async function fetchWeather(q: WeatherQuery): Promise<WeatherResponse> {
  const tz = q.timezone ?? 'Asia/Makassar';
  const params = new URLSearchParams({
    latitude: q.lat.toFixed(4),
    longitude: q.lon.toFixed(4),
    hourly: WEATHER_VARS,
    timezone: tz,
  });
  if (q.startDate && q.endDate) {
    params.set('start_date', q.startDate);
    params.set('end_date', q.endDate);
  } else {
    params.set('forecast_days', String(q.forecastDays ?? 7));
  }
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const cacheKey = `weather_${url}`;
  const ttl = q.cacheTtlMs ?? 3 * 60 * 60 * 1000;

  const cached = await getCached<unknown>(cacheKey, ttl);
  if (cached) return WeatherResponse.parse(cached);

  const raw = await fetchJson<unknown>(url);
  const parsed = WeatherResponse.parse(raw);
  await setCached(cacheKey, raw);
  return parsed;
}
