import type { SurfRules } from '../types/surf-rules';
import type { SurferProfile } from '../types/surfer-profile';
import type { FactorScore } from '../types/scored-window';
import { DEFAULT_WEIGHTS, type ScoringWeights, type FactorKey } from '../types/weights';
import type { NormalizedForecastHour } from '../forecast/types';
import { angularDistance, clamp01, ramp } from './geo';
import { effectiveTideCeiling } from '../tide-ceiling';

interface Sub {
  score: number;
  reason: string;
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
function compass(deg: number): string {
  return COMPASS[Math.round(((deg % 360) / 45)) % 8];
}

function swellDirSub(rules: SurfRules, h: NormalizedForecastHour): Sub {
  const { centerBearing, halfWidthDeg } = rules.swell;
  const d = angularDistance(h.swellDirDeg, centerBearing);
  const score = d <= halfWidthDeg ? 1 : clamp01(1 - (d - halfWidthDeg) / halfWidthDeg);
  const verdict = d <= halfWidthDeg ? 'dead in the window' : d <= 2 * halfWidthDeg ? 'a bit off-angle' : 'wrong direction';
  return {
    score,
    reason: `Swell from ${Math.round(h.swellDirDeg)}° (${compass(h.swellDirDeg)}) vs the ${centerBearing}° ±${halfWidthDeg}° window — ${verdict}.`,
  };
}

function sizeSub(rules: SurfRules, h: NormalizedForecastHour, surfer: SurferProfile): Sub {
  const [lo, hi] = rules.swell.idealHeight;
  let score: number;
  let note: string;
  if (h.swellHeightM < lo) {
    score = ramp(h.swellHeightM, lo * 0.5, lo);
    note = score < 0.4 ? 'too small to work' : 'a touch small';
  } else if (h.swellHeightM > hi) {
    score = 1 - ramp(h.swellHeightM, hi, hi * 1.8);
    note = score < 0.4 ? 'overpowered' : 'on the bigger side';
  } else {
    score = 1;
    note = 'right in the size range';
  }
  if (surfer.maxComfortableHeightM && h.swellHeightM > surfer.maxComfortableHeightM) {
    score *= clamp01(1 - (h.swellHeightM - surfer.maxComfortableHeightM) / surfer.maxComfortableHeightM);
    note += ', above your comfort ceiling';
  }
  return {
    score: clamp01(score),
    reason: `Swell ${h.swellHeightM.toFixed(1)}m vs ideal ${lo}–${hi}m — ${note}.`,
  };
}

function periodSub(rules: SurfRules, h: NormalizedForecastHour): Sub {
  const [lo, hi] = rules.swell.idealPeriod;
  let score: number;
  let note: string;
  if (h.swellPeriodS < lo) {
    // short period (windswell) penalized harder
    score = ramp(h.swellPeriodS, lo - 3, lo) * 0.9;
    note = 'short — more windswell than clean groundswell';
  } else if (h.swellPeriodS > hi) {
    score = 1 - 0.4 * ramp(h.swellPeriodS, hi, hi + 6);
    note = 'long-period groundswell';
  } else {
    score = 1;
    note = 'clean groundswell period';
  }
  return {
    score: clamp01(score),
    reason: `Period ${h.swellPeriodS.toFixed(0)}s vs ideal ${lo}–${hi}s — ${note}.`,
  };
}

function windSub(rules: SurfRules, h: NormalizedForecastHour): Sub {
  if (h.windKnots <= 5) {
    return { score: 0.95, reason: `Wind only ${h.windKnots.toFixed(0)}kn — glassy.` };
  }
  const { offshoreBearing, toleranceDeg, maxKnots } = rules.wind;
  const align = angularDistance(h.windDirDeg, offshoreBearing);
  const offshoreFactor = align <= toleranceDeg ? 1 : clamp01(1 - (align - toleranceDeg) / (180 - toleranceDeg));
  const strength = h.windKnots <= maxKnots ? 1 : clamp01(1 - (h.windKnots - maxKnots) / 12);
  const score = clamp01(offshoreFactor * (0.35 + 0.65 * strength));
  const dir = offshoreFactor > 0.7 ? 'offshore' : offshoreFactor > 0.4 ? 'cross-shore' : 'onshore';
  return {
    score,
    reason: `Wind ${h.windKnots.toFixed(0)}kn from ${compass(h.windDirDeg)} — ${dir}${h.windKnots > maxKnots ? ', and strong' : ''}.`,
  };
}

function tideBandSub(rules: SurfRules, h: NormalizedForecastHour): Sub {
  const [lo, hi] = rules.tide.optimalBand;
  const min = rules.tide.minMeters;
  let score: number;
  let note: string;
  if (h.tideMeters < lo) {
    score = 0.3 + 0.7 * ramp(h.tideMeters, min, lo);
    note = 'under the sweet spot';
  } else if (h.tideMeters > hi) {
    // Ramp toward the (swell-dependent) safety ceiling if defined, else a gentle drop-off.
    const ceiling = effectiveTideCeiling(rules, h.swellHeightM, {
      windKnots: h.windKnots,
      windDirDeg: h.windDirDeg,
    });
    const top = ceiling ?? hi + 1;
    score = 1 - ramp(h.tideMeters, hi, top);
    note = ceiling ? 'getting high — watch the exit window' : 'over the sweet spot';
  } else {
    score = 1;
    note = 'in the sweet spot';
  }
  // Bigger swell wants more water (Julien: avoid too-fast barrels).
  const overhead = h.swellHeightM > rules.swell.idealHeight[1];
  if (rules.tide.moreWaterWhenBig && overhead && h.tideMeters < (lo + hi) / 2) {
    score *= 0.85;
    note += '; big swell wants more water';
  }
  return {
    score: clamp01(score),
    reason: `Tide ${h.tideMeters.toFixed(2)}m vs sweet spot ${lo}–${hi}m — ${note}.`,
  };
}

function tideDirSub(rules: SurfRules, h: NormalizedForecastHour): Sub {
  const pref = rules.tide.directionPref;
  if (pref === 'any') return { score: 0.7, reason: `Tide ${h.tideState}; this spot works on either direction.` };
  if (h.tideState === pref) {
    const why = pref === 'rising' ? ' (rising boosts size — Julien)' : ' (dropping cleans it up)';
    return { score: 1, reason: `Tide ${h.tideState} — matches the ${pref} preference${why}.` };
  }
  if (h.tideState === 'high' || h.tideState === 'low') {
    return { score: 0.6, reason: `Tide at ${h.tideState} slack — neutral for a ${pref} spot.` };
  }
  return { score: 0.35, reason: `Tide ${h.tideState} but this spot prefers ${pref}.` };
}

const SUBS: Record<FactorKey, (r: SurfRules, h: NormalizedForecastHour, s: SurferProfile) => Sub> = {
  swellDir: (r, h) => swellDirSub(r, h),
  size: (r, h, s) => sizeSub(r, h, s),
  period: (r, h) => periodSub(r, h),
  wind: (r, h) => windSub(r, h),
  tideBand: (r, h) => tideBandSub(r, h),
  tideDir: (r, h) => tideDirSub(r, h),
};

export interface ScoreResult {
  score: number; // 0..100
  factors: FactorScore[];
}

/** Weighted 0–100 quality score with a per-factor WHY. Assumes the window is safe. */
export function qualityScore(
  rules: SurfRules,
  hour: NormalizedForecastHour,
  surfer: SurferProfile,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): ScoreResult {
  const factors: FactorScore[] = (Object.keys(SUBS) as FactorKey[]).map((factor) => {
    const { score, reason } = SUBS[factor](rules, hour, surfer);
    const weight = weights[factor];
    const impact = score >= 0.66 ? 'helped' : score <= 0.4 ? 'hurt' : 'neutral';
    return { factor, score, weight, reason, impact };
  });
  const wsum = factors.reduce((s, f) => s + f.weight, 0);
  const score = (100 * factors.reduce((s, f) => s + f.weight * f.score, 0)) / wsum;
  return { score: Math.round(score), factors };
}
