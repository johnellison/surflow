/**
 * Julien's wave-check rule of thumb (14/06): to be sure you've seen at least one
 * full set–lull pattern before paddling out, watch for `swell_ft × 3` minutes.
 * Bigger swell → longer patterns, so the check grows with size; near your safety
 * limit it's a safety necessity, not just awareness. Be on the spot 20–30 min
 * before paddle-out to actually do it.
 */
export function waveCheckMinutes(swellHeightM: number): number {
  const ft = swellHeightM / 0.3048;
  return Math.max(5, Math.round(ft * 3));
}
