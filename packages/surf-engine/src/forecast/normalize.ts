import type { NormalizedForecastHour } from './types';
import { fetchMarine } from './open-meteo-marine';
import { fetchWeather } from './open-meteo-weather';
import { buildTideSeries } from './tide';

const KMH_TO_KNOTS = 1 / 1.852;

export interface ForecastQuery {
  lat: number;
  lon: number;
  /** Deep-water swell sample point (defaults to the spot). See knowledge/region.ts. */
  swellLat?: number;
  swellLon?: number;
  forecastDays?: number;
  startDate?: string;
  endDate?: string;
  timezone?: string;
}

/**
 * Fetch swell (offshore, deep water) + wind + tide (local) and merge into a
 * single hourly, fully-normalized series (metres, seconds, degrees-FROM, knots,
 * °C). Swell is sampled at `swellLat/swellLon` because Open-Meteo's swell height
 * AT a shoreline cell is shoaled/damped — see knowledge/region.ts.
 */
export async function getForecast(q: ForecastQuery): Promise<NormalizedForecastHour[]> {
  const localQ = {
    lat: q.lat,
    lon: q.lon,
    forecastDays: q.forecastDays,
    startDate: q.startDate,
    endDate: q.endDate,
    timezone: q.timezone,
  };
  const swellQ = { ...localQ, lat: q.swellLat ?? q.lat, lon: q.swellLon ?? q.lon };

  const [swellMarine, localMarine, weather] = await Promise.all([
    fetchMarine(swellQ), // offshore swell
    fetchMarine(localQ), // local sea level + SST
    fetchWeather(localQ), // local wind
  ]);

  const sw = swellMarine.hourly;
  const loc = localMarine.hourly;
  const w = weather.hourly;

  const tide = await buildTideSeries({
    lat: q.lat,
    lon: q.lon,
    times: loc.time,
    seaLevelMsl: loc.sea_level_height_msl.map((v) => v ?? 0),
    startDate: q.startDate,
    endDate: q.endDate,
  });

  // Index offshore swell + local wind by time so grid offsets don't desync the merge.
  const swByTime = new Map<string, number>();
  sw.time.forEach((t, i) => swByTime.set(t, i));
  const windByTime = new Map<string, number>();
  w.time.forEach((t, i) => windByTime.set(t, i));

  return loc.time.map((time, i) => {
    const si = swByTime.get(time);
    const wi = windByTime.get(time);
    const peak = si !== undefined ? sw.swell_wave_peak_period?.[si] : undefined;
    const period =
      num(peak) ?? (si !== undefined ? num(sw.swell_wave_period[si]) : null) ?? 0;
    return {
      time,
      swellHeightM: si !== undefined ? num(sw.swell_wave_height[si]) ?? 0 : 0,
      swellPeriodS: period,
      swellDirDeg: si !== undefined ? num(sw.swell_wave_direction[si]) ?? 0 : 0,
      ...resolveWind(wi, w),
      tideMeters: tide.points[i]?.meters ?? 0,
      tideState: tide.points[i]?.state ?? 'rising',
      tideSource: tide.source,
      tideUncertaintyM: tide.uncertaintyM,
      waterTempC: num(loc.sea_surface_temperature[i]) ?? 0,
    };
  });
}

type WeatherHourly = { wind_speed_10m: (number | null)[]; wind_gusts_10m: (number | null)[]; wind_direction_10m: (number | null)[] };

// Raw model wind is used directly. The previous Jun–Sep seasonal override
// (forcing <8 kn up to 15 kn ESE) masked real glassy dawns — removed.
function resolveWind(
  wi: number | undefined,
  w: WeatherHourly,
): { windKnots: number; windGustKnots: number; windDirDeg: number; windSource: 'model' } {
  const rawKn = round1((wi !== undefined ? num(w.wind_speed_10m[wi]) ?? 0 : 0) * KMH_TO_KNOTS);
  const rawGustKn = round1((wi !== undefined ? num(w.wind_gusts_10m[wi]) ?? 0 : 0) * KMH_TO_KNOTS);
  const rawDirDeg = wi !== undefined ? num(w.wind_direction_10m[wi]) ?? 0 : 0;
  return { windKnots: rawKn, windGustKnots: rawGustKn, windDirDeg: rawDirDeg, windSource: 'model' };
}

function num(v: number | null | undefined): number | null {
  return v === null || v === undefined || Number.isNaN(v) ? null : v;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
