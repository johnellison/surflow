/**
 * Seasonal wind bias correction tests.
 * Tests the resolveWind logic in normalize.ts by mocking the three I/O
 * dependencies (fetchMarine, fetchWeather, buildTideSeries) and calling
 * getForecast with a single-hour date range.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock calls are hoisted before imports — declare them first
vi.mock('../src/forecast/open-meteo-weather');
vi.mock('../src/forecast/open-meteo-marine');
vi.mock('../src/forecast/tide');

import { getForecast } from '../src/forecast/normalize';
import * as weatherMod from '../src/forecast/open-meteo-weather';
import * as marineMod from '../src/forecast/open-meteo-marine';
import * as tideMod from '../src/forecast/tide';

const KMH_TO_KNOTS = 1 / 1.852;

// Both marine and weather mocks must use the SAME time so normalize.ts's
// time-indexed merge correctly finds the wind entry for each hour.
function makeResponses(time: string, windKph: number, windDir = 270, windGustKph?: number) {
  const marine = {
    hourly: {
      time: [time],
      swell_wave_height: [1.2],
      swell_wave_period: [10],
      swell_wave_direction: [200],
      swell_wave_peak_period: [10],
      wave_height: [1.0],
      sea_level_height_msl: [0.5],
      sea_surface_temperature: [28],
    },
  };
  const weather = {
    hourly: {
      time: [time],
      wind_speed_10m: [windKph],
      wind_direction_10m: [windDir],
      wind_gusts_10m: [windGustKph ?? windKph * 1.3],
    },
  };
  const tide = {
    points: [{ meters: 1.8, state: 'rising' as const }],
    source: 'open-meteo' as const,
    uncertaintyM: 0.25,
  };
  return { marine, weather, tide };
}

async function fetchHour(time: string, windKph: number, windDir = 270, windGustKph?: number) {
  const { marine, weather, tide } = makeResponses(time, windKph, windDir, windGustKph);
  vi.mocked(marineMod.fetchMarine).mockResolvedValue(marine as never);
  vi.mocked(weatherMod.fetchWeather).mockResolvedValue(weather as never);
  vi.mocked(tideMod.buildTideSeries).mockResolvedValue(tide as never);
  const date = time.slice(0, 10);
  const hours = await getForecast({ lat: -8.4, lon: 115.2, startDate: date, endDate: date });
  return hours[0];
}

describe('Seasonal wind bias correction (Jun–Sep, <8 kn → seasonal-default)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('Jun: 3 km/h (~1.6 kn) → seasonal-default, windKnots=15, windDirDeg=112', async () => {
    const h = await fetchHour('2026-06-15T08:00', 3, 90);
    expect(h.windSource).toBe('seasonal-default');
    expect(h.windKnots).toBe(15);
    expect(h.windDirDeg).toBe(112);
  });

  it('Sep: 7 km/h (~3.8 kn, well under threshold) → seasonal-default', async () => {
    const h = await fetchHour('2026-09-10T08:00', 7, 90);
    expect(h.windSource).toBe('seasonal-default');
    expect(h.windKnots).toBe(15);
  });

  it('Sep: 16 km/h (~8.6 kn, above threshold) → model (not corrected)', async () => {
    // 16 km/h ≈ 8.64 kn — clearly above the 8 kn threshold
    const h = await fetchHour('2026-09-10T08:00', 16, 90);
    expect(h.windSource).toBe('model');
    expect(h.windKnots).toBeGreaterThan(8);
  });

  it('Oct (outside season): 3 km/h → model (no correction applied)', async () => {
    const h = await fetchHour('2026-10-05T08:00', 3, 270);
    expect(h.windSource).toBe('model');
    expect(h.windKnots).toBeCloseTo(3 * KMH_TO_KNOTS, 1);
  });

  it('Jun: 20 km/h (~10.8 kn, above threshold) → model (no correction)', async () => {
    const h = await fetchHour('2026-06-15T08:00', 20, 300);
    expect(h.windSource).toBe('model');
    expect(h.windKnots).toBeCloseTo(20 * KMH_TO_KNOTS, 1);
    expect(h.windDirDeg).toBe(300);
  });

  it('seasonal-default: raw gust above 18 kn is preserved (not clamped down)', async () => {
    // 60 km/h gust ≈ 32.4 kn — max(32.4, 18) should keep 32.4
    const h = await fetchHour('2026-07-01T08:00', 3, 90, 60);
    expect(h.windSource).toBe('seasonal-default');
    expect(h.windGustKnots).toBeCloseTo(60 * KMH_TO_KNOTS, 1);
  });

  it('seasonal-default: raw gust below 18 kn is raised to 18', async () => {
    // 5 km/h gust ≈ 2.7 kn — max(2.7, 18) = 18
    const h = await fetchHour('2026-07-01T08:00', 3, 90, 5);
    expect(h.windSource).toBe('seasonal-default');
    expect(h.windGustKnots).toBe(18);
  });
});
