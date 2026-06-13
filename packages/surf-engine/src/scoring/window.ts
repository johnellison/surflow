import type { SurfRules } from '../types/surf-rules';
import type { SurferProfile } from '../types/surfer-profile';
import type { ScoredWindow } from '../types/scored-window';
import { DEFAULT_WEIGHTS, type ScoringWeights } from '../types/weights';
import type { NormalizedForecastHour } from '../forecast/types';
import { assessSafety } from './safety';
import { qualityScore } from './score';
import { summarize } from './explain';

/**
 * Score one spot at one forecast hour: hard safety gate first, then 0–100 quality
 * (forced to 0 when unsafe so it never ranks), plus a human-readable WHY.
 */
export function scoreWindow(
  rules: SurfRules,
  hour: NormalizedForecastHour,
  surfer: SurferProfile,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): ScoredWindow {
  const safety = assessSafety(rules, hour, surfer);
  const { score, factors } = qualityScore(rules, hour, surfer, weights);
  return {
    spotSlug: rules.spotSlug,
    displayName: rules.displayName,
    section: rules.section,
    time: hour.time,
    safety,
    score: safety.safe ? score : 0,
    factors,
    summary: summarize(rules, safety, factors),
    forecast: hour,
  };
}
