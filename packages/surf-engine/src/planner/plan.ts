import type { SurfRules } from '../types/surf-rules';
import { DEFAULT_SURFER, type SurferProfile } from '../types/surfer-profile';
import { DEFAULT_WEIGHTS, type ScoringWeights } from '../types/weights';
import type { ScoredWindow } from '../types/scored-window';
import type { ModelAgreement } from '../types/model-agreement';
import type { DayPlan, PlannedSpotDay, SessionPlan } from '../types/session-plan';
import { loadKnowledgeBase } from '../knowledge/index';
import { EAST_BALI_SWELL_POINT } from '../knowledge/region';
import { getForecast } from '../forecast/normalize';
import { verifyForecast } from '../forecast/verify';
import { scoreWindow } from '../scoring/window';
import { computeDaylight } from './daylight';

export interface PlanOptions {
  /** Spot slugs to consider; defaults to all East-Bali KB spots. */
  spots?: string[];
  dateRange: { from: string; to: string }; // YYYY-MM-DD local
  surfer?: SurferProfile;
  weights?: Partial<ScoringWeights>;
  /** Stamp for generatedAt (Date is avoided so this is callable from workflows). */
  now?: string;
}

const localDate = (iso: string) => iso.slice(0, 10);
const localHour = (iso: string) => Number(iso.slice(11, 13));
const localToday = () =>
  new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Makassar' }))
    .toISOString()
    .slice(0, 10);

/**
 * The single public seam every adapter (Claude skill, CLI, future WhatsApp
 * wrapper) calls. Fetches the forecast per spot, scores every daylight hour,
 * and returns a ranked day-by-day plan plus the best window overall.
 */
export async function planSessions(opts: PlanOptions): Promise<SessionPlan> {
  const surfer = opts.surfer ?? DEFAULT_SURFER;
  const weights = { ...DEFAULT_WEIGHTS, ...(opts.weights ?? {}) };
  const kb = loadKnowledgeBase();
  const spots = opts.spots ? kb.filter((s) => opts.spots!.includes(s.spotSlug)) : kb;
  const { from, to } = opts.dateRange;

  const todayStr = opts.now?.slice(0, 10) ?? localToday();

  // Score every (spot, daylight hour) in range + cross-model verification in parallel.
  const [perSpot, agreementMap] = await Promise.all([
    Promise.all(
      spots.map(async (rules) => ({
        rules,
        windows: await scoreSpot(rules, from, to, surfer, weights),
      })),
    ),
    verifyForecast({ from, to }, todayStr).catch(() => new Map<string, ModelAgreement>()),
  ]);

  // Bucket windows by date.
  const dates = enumerateDates(from, to);
  const byDay: DayPlan[] = dates.map((date) => {
    const ranked: PlannedSpotDay[] = perSpot
      .map(({ rules, windows }) => {
        const dayWindows = windows
          .filter((w) => localDate(w.time) === date)
          .sort((a, b) => b.score - a.score);
        const best = dayWindows.find((w) => w.safety.safe) ?? null;
        return {
          spotSlug: rules.spotSlug,
          displayName: rules.displayName,
          section: rules.section,
          best,
          windows: dayWindows,
        };
      })
      .sort((a, b) => (b.best?.score ?? -1) - (a.best?.score ?? -1));
    return { date, ranked, modelAgreement: agreementMap.get(date) ?? null };
  });

  // Best safe window across the whole range.
  let topPick: SessionPlan['topPick'] = null;
  for (const day of byDay) {
    for (const spot of day.ranked) {
      if (spot.best && (!topPick || spot.best.score > topPick.window.score)) {
        topPick = { date: day.date, window: spot.best };
      }
    }
  }

  return {
    surfer,
    range: { from, to },
    byDay,
    topPick,
    generatedAt: opts.now ?? new Date().toISOString(),
  };
}

/**
 * Score every hour of one day for one spot (no daylight filter) — powers the
 * tide-curve view. Returns time-ascending ScoredWindows for the given date.
 */
export async function scoreSpotDay(
  slug: string,
  date: string,
  surfer: SurferProfile = DEFAULT_SURFER,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): Promise<ScoredWindow[]> {
  const rules = loadKnowledgeBase().find((s) => s.spotSlug === slug);
  if (!rules) throw new Error(`Unknown spot: ${slug}`);
  const swell = rules.swellSample ?? EAST_BALI_SWELL_POINT;
  const hours = await getForecast({
    lat: rules.latitude,
    lon: rules.longitude,
    swellLat: swell.lat,
    swellLon: swell.lon,
    startDate: date,
    endDate: date,
  });
  return hours
    .filter((h) => localDate(h.time) === date)
    .map((h) => scoreWindow(rules, h, surfer, { ...DEFAULT_WEIGHTS, ...weights }));
}

async function scoreSpot(
  rules: SurfRules,
  from: string,
  to: string,
  surfer: SurferProfile,
  weights: ScoringWeights,
): Promise<ScoredWindow[]> {
  const swell = rules.swellSample ?? EAST_BALI_SWELL_POINT;
  const hours = await getForecast({
    lat: rules.latitude,
    lon: rules.longitude,
    swellLat: swell.lat,
    swellLon: swell.lon,
    startDate: from,
    endDate: to,
  });
  const out: ScoredWindow[] = [];
  for (const h of hours) {
    const date = localDate(h.time);
    if (date < from || date > to) continue;
    const { sunriseH, sunsetH } = computeDaylight(rules.latitude, rules.longitude, date);
    const hr = localHour(h.time);
    // Dawn patrol (~45min before sunrise) through sunset — no surfing in the dark.
    if (hr < Math.floor(sunriseH - 0.75) || hr > Math.floor(sunsetH)) continue;
    out.push(scoreWindow(rules, h, surfer, weights));
  }
  return out;
}

function enumerateDates(from: string, to: string): string[] {
  const out: string[] = [];
  const d = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (d.getTime() <= end.getTime()) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}
