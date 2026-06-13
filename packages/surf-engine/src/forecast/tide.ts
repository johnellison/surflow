import { z } from 'zod';
import type { TideState } from '@surflow/core';
import { fetchJson } from './http';
import { getCached, setCached } from './cache';
import type { TideSourceName } from './types';
import {
  calibrateSource,
  tideUncertaintyFor,
  type AffineFit,
} from '../knowledge/calibration';

export interface TidePoint {
  time: string; // ISO local
  meters: number; // calibrated to Julien's local table datum
  state: TideState;
}

export interface TideSeries {
  source: TideSourceName;
  /** ± metres uncertainty on each reading (drives the safety buffer). */
  uncertaintyM: number;
  points: TidePoint[];
}

/** Apply the fitted affine map  julienM = a*x + b. */
function applyAffine(x: number, fit: AffineFit): number {
  return fit.a * x + fit.b;
}

/**
 * Derive rising/falling/high/low from a calibrated height series. high/low when
 * within `flatEps` of a local extremum, else the slope sign.
 */
export function deriveTideStates(heights: number[], flatEps = 0.04): TideState[] {
  return heights.map((h, i) => {
    const prev = heights[i - 1] ?? h;
    const next = heights[i + 1] ?? h;
    const slope = next - prev;
    const isMax = h >= prev && h >= next;
    const isMin = h <= prev && h <= next;
    if (isMax && Math.abs(slope) < flatEps) return 'high';
    if (isMin && Math.abs(slope) < flatEps) return 'low';
    return slope >= 0 ? 'rising' : 'falling';
  });
}

/**
 * Build a calibrated tide series for the given hourly time grid.
 *
 * Primary source is WorldTides (real harmonic predictions) when WORLDTIDES_API_KEY
 * is set — it matches the local table datum closely. Otherwise we fall back to
 * Open-Meteo's modelled sea level mapped through the fitted affine calibration,
 * which is DEGRADED here (~0.25m residual); callers add a safety buffer using
 * `uncertaintyM`.
 */
export async function buildTideSeries(args: {
  lat: number;
  lon: number;
  times: string[]; // ISO local, hourly
  seaLevelMsl: number[]; // Open-Meteo sea_level_height_msl aligned to `times`
  startDate?: string;
  endDate?: string;
}): Promise<TideSeries> {
  const key = process.env.WORLDTIDES_API_KEY ?? process.env.WORLDTIDE_API_KEY;
  if (key) {
    try {
      return await worldTidesSeries({ ...args, key });
    } catch {
      // fall through to Open-Meteo
    }
  }
  return openMeteoSeries(args);
}

function openMeteoSeries(args: { times: string[]; seaLevelMsl: number[] }): TideSeries {
  const fit = calibrateSource('open-meteo');
  if (!fit) throw new Error('open-meteo calibration unavailable');
  const meters = args.seaLevelMsl.map((x) => round2(applyAffine(x ?? 0, fit)));
  const states = deriveTideStates(meters);
  return {
    source: 'open-meteo',
    uncertaintyM: tideUncertaintyFor('open-meteo'),
    points: args.times.map((time, i) => ({ time, meters: meters[i], state: states[i] })),
  };
}

// ---- WorldTides ------------------------------------------------------------

const WorldTidesResponse = z.object({
  status: z.number().optional(),
  heights: z
    .array(z.object({ dt: z.number(), date: z.string(), height: z.number() }))
    .optional(),
});

async function worldTidesSeries(args: {
  lat: number;
  lon: number;
  times: string[];
  key: string;
  startDate?: string;
  endDate?: string;
}): Promise<TideSeries> {
  // Open-Meteo `times` are local (Asia/Makassar, UTC+8) with no offset suffix;
  // WorldTides works in Unix epoch / UTC. Align everything by epoch seconds.
  const LOCAL_OFFSET = '+08:00';
  const epochOf = (t: string) => Math.floor(Date.parse(`${t}${LOCAL_OFFSET}`) / 1000);
  const startEpoch = epochOf(args.times[0]);
  const length = (args.times.length + 1) * 3600;

  const params = new URLSearchParams({
    lat: args.lat.toFixed(4),
    lon: args.lon.toFixed(4),
    start: String(startEpoch),
    length: String(length),
    step: '3600',
    datum: 'LAT', // lowest astronomical tide — closest to local surf-table "metres of tide"
    key: args.key,
  });
  // `heights` is a bare flag, not a key=value pair.
  const url = `https://www.worldtides.info/api/v3?heights&${params.toString()}`;
  const cacheKey = `worldtides_${args.lat.toFixed(2)}_${args.lon.toFixed(2)}_${startEpoch}_${args.times.length}`;
  const ttl = 12 * 60 * 60 * 1000;

  let raw = await getCached<unknown>(cacheKey, ttl);
  if (!raw) {
    raw = await fetchJson<unknown>(url);
    await setCached(cacheKey, raw);
  }
  const parsed = WorldTidesResponse.parse(raw);
  const heights = parsed.heights ?? [];

  // WorldTides 'LAT' datum aligns with the local table; apply a calibration only
  // if we have fitted worldtides samples, otherwise use heights natively.
  const fit = calibrateSource('worldtides');
  const byDt = new Map<number, number>();
  for (const h of heights) {
    const v = fit ? applyAffine(h.height, fit) : h.height;
    byDt.set(h.dt, round2(v));
  }
  const meters = args.times.map((t) => {
    const e = epochOf(t);
    return byDt.get(e) ?? byDt.get(e - 1800) ?? byDt.get(e + 1800) ?? 0;
  });
  const states = deriveTideStates(meters);
  return {
    source: 'worldtides',
    uncertaintyM: tideUncertaintyFor('worldtides'),
    points: args.times.map((time, i) => ({ time, meters: meters[i], state: states[i] })),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
