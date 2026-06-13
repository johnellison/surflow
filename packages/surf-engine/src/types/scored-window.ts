import type { FactorKey } from './weights';
import type { NormalizedForecastHour } from '../forecast/types';

export interface FactorScore {
  factor: FactorKey;
  score: number; // 0..1
  weight: number;
  reason: string;
  impact: 'helped' | 'hurt' | 'neutral';
}

export interface SafetyVerdict {
  safe: boolean;
  /** Reasons the window is unsafe (empty when safe). */
  reasons: string[];
  /** Non-blocking cautions (skill, crowd, ear, low-tide hazard…). */
  warnings: string[];
}

export interface ScoredWindow {
  spotSlug: string;
  displayName: string;
  section?: string;
  time: string; // ISO hour
  safety: SafetyVerdict;
  score: number; // 0..100 (0 when unsafe)
  factors: FactorScore[];
  /** One-line WHY: top helper + top hurter, with a Julien citation when relevant. */
  summary: string;
  forecast: NormalizedForecastHour;
}
