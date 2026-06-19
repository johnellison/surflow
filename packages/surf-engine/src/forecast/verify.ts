import { z } from 'zod';
import { fetchJson } from './http';
import { getCached, setCached } from './cache';
import { fetchMarine } from './open-meteo-marine';
import { EAST_BALI_SWELL_POINT } from '../knowledge/region';
import type { ModelAgreement, AgreementLevel } from '../types/model-agreement';

// ---------------------------------------------------------------------------
// Compact marine schema for the secondary model.
// ecmwf_wam025 provides total wave height/period (not swell-component).
// We compare against the primary swell component; both track the dominant
// wave energy arriving at this offshore point so the comparison is valid.
// ---------------------------------------------------------------------------
const CompactMarineResponse = z.object({
  hourly: z.object({
    time: z.array(z.string()),
    wave_height: z.array(z.number().nullable()),
    wave_period: z.array(z.number().nullable()),
  }),
});
type CompactMarineResponse = z.infer<typeof CompactMarineResponse>;

const SECONDARY_MODEL = 'ecmwf_wam025' as const;
const VERIFY_CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 h — matches primary
const SECONDARY_TIMEOUT_MS = 5_000;

async function fetchSecondary(
  dateRange: { from: string; to: string },
): Promise<CompactMarineResponse | null> {
  const params = new URLSearchParams({
    latitude: EAST_BALI_SWELL_POINT.lat.toFixed(4),
    longitude: EAST_BALI_SWELL_POINT.lon.toFixed(4),
    hourly: 'wave_height,wave_period',
    timezone: 'Asia/Makassar',
    models: SECONDARY_MODEL,
    start_date: dateRange.from,
    end_date: dateRange.to,
  });
  const url = `https://marine-api.open-meteo.com/v1/marine?${params.toString()}`;
  const cacheKey = `verify_${SECONDARY_MODEL}_${url}`;

  const cached = await getCached<unknown>(cacheKey, VERIFY_CACHE_TTL_MS);
  if (cached) return CompactMarineResponse.parse(cached);

  // retries=0: if the cross-check fetch fails, don't stall surf plan
  const raw = await fetchJson<unknown>(url, { timeoutMs: SECONDARY_TIMEOUT_MS, retries: 0 });
  const parsed = CompactMarineResponse.parse(raw);
  await setCached(cacheKey, raw);
  return parsed;
}

// ---------------------------------------------------------------------------
// Pure classification — no I/O, fully unit-testable.
// ---------------------------------------------------------------------------

/** `abs(secondary - primary) / primary * 100`, with zero/null denominator rules. */
function computeHeightDiffPct(primary: number | null, secondary: number | null): number | null {
  if (primary === null || secondary === null) return null;
  if (primary === 0 && secondary === 0) return 0;
  if (primary === 0) return null; // percentage undefined when denominator is zero
  return (Math.abs(secondary - primary) / primary) * 100;
}

/**
 * Classify model agreement from pre-computed daily medians.
 * Evaluated in precedence order: unavailable → diverge → caution → agree.
 * Bands are non-overlapping.
 */
export function classifyAgreement(
  primaryHeight: number | null,
  secondaryHeight: number | null,
  primaryPeriod: number | null,
  secondaryPeriod: number | null,
): ModelAgreement {
  const hDiff = computeHeightDiffPct(primaryHeight, secondaryHeight);
  const pDiff =
    primaryPeriod !== null && secondaryPeriod !== null
      ? Math.abs(secondaryPeriod - primaryPeriod)
      : null;

  if (hDiff === null || pDiff === null) {
    return {
      level: 'unavailable',
      heightDiffPct: null,
      periodDiffS: null,
      primaryHeight,
      secondaryHeight,
      secondaryModel: SECONDARY_MODEL,
    };
  }

  let level: AgreementLevel;
  if (hDiff > 40 || pDiff > 3.0) level = 'diverge';
  else if (hDiff > 20 || pDiff > 1.5) level = 'caution';
  else level = 'agree';

  return {
    level,
    heightDiffPct: hDiff,
    periodDiffS: pDiff,
    primaryHeight,
    secondaryHeight,
    secondaryModel: SECONDARY_MODEL,
  };
}

// ---------------------------------------------------------------------------
// Daily median of hourly values during daylight (06:00–18:00 local).
// ---------------------------------------------------------------------------
function dailyMedian(times: string[], values: (number | null)[], date: string): number | null {
  const nums: number[] = [];
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    if (!t.startsWith(date)) continue;
    const hour = Number(t.slice(11, 13));
    if (hour < 6 || hour > 18) continue;
    const v = values[i];
    if (v !== null) nums.push(v);
  }
  return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Main export.
// ---------------------------------------------------------------------------

/**
 * Cross-check Open-Meteo best_match (used by the planner) against ECMWF WAM025
 * for the same date range at EAST_BALI_SWELL_POINT. Returns a per-date map of
 * agreement levels. Dates >7 days from todayStr are marked 'horizon'; secondary
 * fetch failures degrade gracefully to 'unavailable' without throwing.
 *
 * @param todayStr  Caller-supplied YYYY-MM-DD (no Date.now() calls here).
 */
export async function verifyForecast(
  dateRange: { from: string; to: string },
  todayStr: string,
): Promise<Map<string, ModelAgreement>> {
  const result = new Map<string, ModelAgreement>();
  const horizonCutoff = addDays(todayStr, 7);

  // Enumerate dates in range
  const dates: string[] = [];
  let cur = dateRange.from;
  while (cur <= dateRange.to) {
    dates.push(cur);
    cur = addDays(cur, 1);
  }

  // Horizon dates need no fetch — mark and exclude from the network round-trip
  const nonHorizonDates = dates.filter((d) => {
    if (d > horizonCutoff) {
      result.set(d, {
        level: 'horizon',
        heightDiffPct: null,
        periodDiffS: null,
        primaryHeight: null,
        secondaryHeight: null,
        secondaryModel: SECONDARY_MODEL,
      });
      return false;
    }
    return true;
  });

  if (nonHorizonDates.length === 0) return result;

  // Fetch primary + secondary in parallel; secondary failure is non-fatal
  const [primary, secondary] = await Promise.all([
    fetchMarine({
      lat: EAST_BALI_SWELL_POINT.lat,
      lon: EAST_BALI_SWELL_POINT.lon,
      startDate: dateRange.from,
      endDate: dateRange.to,
    }).catch(() => null),
    fetchSecondary(dateRange).catch(() => null),
  ]);

  for (const date of nonHorizonDates) {
    if (!primary) {
      result.set(date, {
        level: 'unavailable',
        heightDiffPct: null,
        periodDiffS: null,
        primaryHeight: null,
        secondaryHeight: null,
        secondaryModel: SECONDARY_MODEL,
      });
      continue;
    }

    const ph = dailyMedian(primary.hourly.time, primary.hourly.swell_wave_height, date);
    const pp = dailyMedian(primary.hourly.time, primary.hourly.swell_wave_period, date);

    if (!secondary) {
      result.set(date, {
        level: 'unavailable',
        heightDiffPct: null,
        periodDiffS: null,
        primaryHeight: ph,
        secondaryHeight: null,
        secondaryModel: SECONDARY_MODEL,
      });
      continue;
    }

    const sh = dailyMedian(secondary.hourly.time, secondary.hourly.wave_height, date);
    const sp = dailyMedian(secondary.hourly.time, secondary.hourly.wave_period, date);
    result.set(date, classifyAgreement(ph, sh, pp, sp));
  }

  return result;
}
