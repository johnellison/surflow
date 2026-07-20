/**
 * Bukit Peninsula swell shadowing for East Bali spots.
 *
 * The Bukit Peninsula extends south from mainland Bali, physically blocking
 * SSW swells (195–225°) from reaching east-coast spots (Keramas, Klotok,
 * Cucukan, Kubur, Lembang). The swell must refract and wrap around the
 * peninsula to arrive — losing 50–70% of its height and degrading in period
 * and organization.
 *
 * Empirically validated Jul 7–9, 2026: Surfline forecast 4–6ft @ 16s from
 * 215° → actual conditions 1ft messy windsea at all east-coast spots.
 *
 * See: references/east-bali-forecast-shadowing.md
 */
import { angularDistance } from '../scoring/geo';

/** Center of the Bukit shadow zone (SSW — directly behind the peninsula). */
const SHADOW_CENTER_DEG = 210;

/** Swells within ±this many degrees of the shadow center are affected. */
const SHADOW_HALF_WIDTH_DEG = 20; // 190–230°

/**
 * Height retention at dead center of the shadow (210°).
 * A 2.3m deep-water swell at 210° arrives as ~0.8m → retention ≈ 0.35.
 */
const SHADOW_MIN_HEIGHT_RETENTION = 0.35;

/**
 * Period retention at dead center. Refraction disperses energy and shortens
 * the effective period — a 16s swell wraps in at ~12s → retention ≈ 0.75.
 */
const SHADOW_MIN_PERIOD_RETENTION = 0.75;

export interface ShadowResult {
  /** 0 = no shadow, 1 = dead center of the shadow zone. */
  severity: number;
  /** Multiplier applied to swell height (1.0 = unchanged, 0.35 = heavily shadowed). */
  heightFactor: number;
  /** Multiplier applied to swell period. */
  periodFactor: number;
}

/**
 * Compute the Bukit shadow severity for a given swell direction.
 * Returns severity 0 (outside shadow) to 1 (dead center at 210°).
 */
export function bukitShadowSeverity(swellDirDeg: number): number {
  const d = angularDistance(swellDirDeg, SHADOW_CENTER_DEG);
  if (d >= SHADOW_HALF_WIDTH_DEG) return 0;
  // Linear taper: 1.0 at center, 0.0 at the edge
  return 1 - d / SHADOW_HALF_WIDTH_DEG;
}

/**
 * Apply the Bukit shadowing correction to a swell reading.
 * Returns the effective height/period multipliers, or null if no shadowing.
 */
export function bukitShadow(swellDirDeg: number): ShadowResult | null {
  const severity = bukitShadowSeverity(swellDirDeg);
  if (severity === 0) return null;
  return {
    severity,
    heightFactor: 1 - severity * (1 - SHADOW_MIN_HEIGHT_RETENTION),
    periodFactor: 1 - severity * (1 - SHADOW_MIN_PERIOD_RETENTION),
  };
}

/**
 * Shadow info attached to a NormalizedForecastHour when shadowing is active.
 * Kept for display — so the format layer can say
 * "Forecast 2.3m → shadowed by Bukit → effective 0.8m".
 */
export interface SwellShadowed {
  /** Raw deep-water swell height before shadowing (metres). */
  originalHeightM: number;
  /** Raw deep-water swell period before shadowing (seconds). */
  originalPeriodS: number;
  /** Swell direction that triggered the shadow (degrees FROM). */
  swellDirDeg: number;
  /** 0–1 severity. */
  severity: number;
  /** Height multiplier applied. */
  heightFactor: number;
  /** Period multiplier applied. */
  periodFactor: number;
}
