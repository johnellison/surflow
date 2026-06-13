import { z } from 'zod';
import { fetchJson } from './http';
import { getCached, setCached } from './cache';

const numArr = z.array(z.number().nullable());

export const MarineResponse = z.object({
  hourly: z.object({
    time: z.array(z.string()),
    swell_wave_height: numArr,
    swell_wave_period: numArr,
    swell_wave_direction: numArr,
    swell_wave_peak_period: numArr.optional(),
    wave_height: numArr,
    sea_level_height_msl: numArr,
    sea_surface_temperature: numArr,
  }),
});
export type MarineResponse = z.infer<typeof MarineResponse>;

const MARINE_VARS = [
  'swell_wave_height',
  'swell_wave_period',
  'swell_wave_direction',
  'swell_wave_peak_period',
  'wave_height',
  'sea_level_height_msl',
  'sea_surface_temperature',
].join(',');

export interface MarineQuery {
  lat: number;
  lon: number;
  forecastDays?: number;
  startDate?: string; // YYYY-MM-DD (overrides forecastDays)
  endDate?: string;
  timezone?: string;
  cacheTtlMs?: number;
}

/** Fetch + validate Open-Meteo Marine. Free, no API key. ~8km grid, hourly. */
export async function fetchMarine(q: MarineQuery): Promise<MarineResponse> {
  const tz = q.timezone ?? 'Asia/Makassar';
  const params = new URLSearchParams({
    latitude: q.lat.toFixed(4),
    longitude: q.lon.toFixed(4),
    hourly: MARINE_VARS,
    timezone: tz,
  });
  if (q.startDate && q.endDate) {
    params.set('start_date', q.startDate);
    params.set('end_date', q.endDate);
  } else {
    params.set('forecast_days', String(q.forecastDays ?? 7));
  }
  const url = `https://marine-api.open-meteo.com/v1/marine?${params.toString()}`;
  const cacheKey = `marine_${url}`;
  const ttl = q.cacheTtlMs ?? 3 * 60 * 60 * 1000; // 3h

  const cached = await getCached<unknown>(cacheKey, ttl);
  if (cached) return MarineResponse.parse(cached);

  const raw = await fetchJson<unknown>(url);
  const parsed = MarineResponse.parse(raw);
  await setCached(cacheKey, raw);
  return parsed;
}
