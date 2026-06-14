import type { SurfRules } from './types/surf-rules';

/**
 * The safe tide ceiling for a spot at a given swell height. Returns undefined
 * when the spot has no ceiling rule. The ceiling drops as swell grows (heavier
 * shorebreak makes the rock exit dangerous at a lower tide).
 */
export function effectiveTideCeiling(rules: SurfRules, swellHeightM: number): number | undefined {
  const mt = rules.tide.maxTide;
  if (!mt) return undefined;
  const drop = mt.swellSensitivity * Math.max(0, swellHeightM - mt.refSwellM);
  const ceiling = mt.ceiling - drop;
  return mt.floorCeiling !== undefined ? Math.max(mt.floorCeiling, ceiling) : ceiling;
}
