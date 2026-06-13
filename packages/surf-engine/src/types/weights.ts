export type FactorKey = 'swellDir' | 'size' | 'period' | 'wind' | 'tideBand' | 'tideDir';

export interface ScoringWeights {
  swellDir: number;
  size: number;
  period: number;
  wind: number;
  tideBand: number;
  tideDir: number;
}

/**
 * Wind weighted highest — Julien repeatedly schedules around the morning wind
 * window ("softer and better direction of the wind in the morning"). Size next.
 * Tide *direction* (rising vs falling) lowest: a nudge, not a gate.
 */
export const DEFAULT_WEIGHTS: ScoringWeights = {
  wind: 1.3,
  size: 1.2,
  swellDir: 1.0,
  tideBand: 1.0,
  period: 0.9,
  tideDir: 0.6,
};
