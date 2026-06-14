import type { SurfRules } from './types/surf-rules';
import { angularDistance, clamp01 } from './scoring/geo';

export interface CeilingWind {
  windKnots: number;
  windDirDeg: number;
}

/**
 * The safe tide ceiling for a spot at a given swell (and optionally wind).
 * Returns undefined when the spot has no ceiling rule.
 *
 * Per Julien there is "no rule of thumb" — the danger is multifactorial: swell
 * size/direction/period (power on the way in), wind (offshore makes the
 * shorebreak more barreling/dangerous), and ever-shifting sand platforms. We
 * model the two tractable factors (swell size, offshore wind) as a heuristic and
 * treat the rest as irreducible uncertainty — always reality-check on site.
 */
export function effectiveTideCeiling(
  rules: SurfRules,
  swellHeightM: number,
  wind?: CeilingWind,
): number | undefined {
  const mt = rules.tide.maxTide;
  if (!mt) return undefined;
  let ceiling = mt.ceiling - mt.swellSensitivity * Math.max(0, swellHeightM - mt.refSwellM);
  if (mt.offshoreWindSensitivity && wind) {
    // Offshore-alignment: 1 when wind is dead offshore, 0 at ≥90° off.
    const offshore = clamp01(1 - angularDistance(wind.windDirDeg, rules.wind.offshoreBearing) / 90);
    ceiling -= mt.offshoreWindSensitivity * wind.windKnots * offshore;
  }
  return mt.floorCeiling !== undefined ? Math.max(mt.floorCeiling, ceiling) : ceiling;
}
