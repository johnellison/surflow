import type { SurferProfile } from './surfer-profile';
import type { ScoredWindow } from './scored-window';

export interface PlannedSpotDay {
  spotSlug: string;
  displayName: string;
  section?: string;
  /** Best safe window for this spot on this day (null if nothing safe). */
  best: ScoredWindow | null;
  /** All daylight windows, ranked best-first. */
  windows: ScoredWindow[];
}

export interface DayPlan {
  date: string; // YYYY-MM-DD (local)
  /** Spots ranked by their best window that day, best-first. */
  ranked: PlannedSpotDay[];
}

export interface SessionPlan {
  surfer: SurferProfile;
  range: { from: string; to: string };
  byDay: DayPlan[];
  /** Single best safe window across the whole range. */
  topPick: { date: string; window: ScoredWindow } | null;
  generatedAt: string;
}
