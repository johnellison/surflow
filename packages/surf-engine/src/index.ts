/**
 * @surflow/surf-engine — pure, adapter-agnostic surf session planning for East
 * Bali. Knows nothing about Claude, WhatsApp, HTTP servers, or databases. The
 * /surf-plan skill, the CLI, and any future openclaw wrapper are thin adapters
 * over this public surface.
 */

// Public API
export { planSessions, scoreSpotDay, type PlanOptions } from './planner/plan';
export { scoreWindow } from './scoring/window';
export { loadKnowledgeBase, getSpot, SPOT_SLUGS } from './knowledge/index';
export { EAST_BALI_SWELL_POINT } from './knowledge/region';
export { getForecast, type ForecastQuery } from './forecast/normalize';
export { formatPlan, formatWindow, formatTideDay, formatCompare } from './format';

// Calibration (for the `surf calibrate` command / tests)
export {
  CALIBRATION_PAIRS,
  calibrateSource,
  bestTideSource,
  fitAffine,
  tideUncertaintyFor,
  type AffineFit,
  type CalibrationPair,
} from './knowledge/calibration';

// Types
export * from './types/index';
export type { NormalizedForecastHour, TideSourceName } from './forecast/types';
export { DEFAULT_SURFER } from './types/surfer-profile';
export { DEFAULT_WEIGHTS } from './types/weights';
