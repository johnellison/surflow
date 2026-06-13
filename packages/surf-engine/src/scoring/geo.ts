/** Smallest absolute angle between two compass bearings (0..180). */
export function angularDistance(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360) + 360) % 360;
  return d > 180 ? 360 - d : d;
}

/** Clamp to [0, 1]. */
export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** Linear ramp: 0 at `from`, 1 at `to` (handles either direction). */
export function ramp(x: number, from: number, to: number): number {
  if (from === to) return x >= to ? 1 : 0;
  return clamp01((x - from) / (to - from));
}
