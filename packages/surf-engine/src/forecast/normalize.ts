import type { NormalizedForecastHour } from './types';
import { fetchMarine } from './open-meteo-marine';
import { fetchWeather } from './open-meteo-weather';
import { buildTideSeries } from './tide';

const KMH_TO_KNOTS = 1 / 1.852;

export interface ForecastQuery {
  lat: number;
  lon: number;
  forecastDays?: number;
  startDate?: string;
  endDate?: string;
  timezone?: string;
}

/**
 * Fetch marine + weather + tide for one location and merge into a single
 * hourly, fully-normalized series (metres, seconds, degrees-FROM, knots, °C).
 * The ~6 East-Bali spots share one Open-Meteo cell, so the planner calls this
 * once and slices it per spot.
 */
export async function getForecast(q: ForecastQuery): Promise<NormalizedForecastHour[]> {
  const [marine, weather] = await Promise.all([
    fetchMarine(q),
    fetchWeather(q),
  ]);

  const m = marine.hourly;
  const tide = await buildTideSeries({
    lat: q.lat,
    lon: q.lon,
    times: m.time,
    seaLevelMsl: m.sea_level_height_msl.map((v) => v ?? 0),
    startDate: q.startDate,
    endDate: q.endDate,
  });

  // Index weather by time so a small grid offset doesn't desync the merge.
  const w = weather.hourly;
  const windByTime = new Map<string, number>();
  w.time.forEach((t, i) => windByTime.set(t, i));

  return m.time.map((time, i) => {
    const wi = windByTime.get(time);
    const peak = m.swell_wave_peak_period?.[i];
    const period = num(peak) ?? num(m.swell_wave_period[i]) ?? 0;
    return {
      time,
      swellHeightM: num(m.swell_wave_height[i]) ?? 0,
      swellPeriodS: period,
      swellDirDeg: num(m.swell_wave_direction[i]) ?? 0,
      windKnots: round1((wi !== undefined ? num(w.wind_speed_10m[wi]) ?? 0 : 0) * KMH_TO_KNOTS),
      windGustKnots: round1((wi !== undefined ? num(w.wind_gusts_10m[wi]) ?? 0 : 0) * KMH_TO_KNOTS),
      windDirDeg: wi !== undefined ? num(w.wind_direction_10m[wi]) ?? 0 : 0,
      tideMeters: tide.points[i]?.meters ?? 0,
      tideState: tide.points[i]?.state ?? 'rising',
      tideSource: tide.source,
      tideUncertaintyM: tide.uncertaintyM,
      waterTempC: num(m.sea_surface_temperature[i]) ?? 0,
    };
  });
}

function num(v: number | null | undefined): number | null {
  return v === null || v === undefined || Number.isNaN(v) ? null : v;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
