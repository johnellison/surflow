import { z } from 'zod';
import { BreakType, SurfLevel, TideState } from '@surflow/core';

/**
 * Where a rule came from. Every coaching rule carries provenance so the engine
 * can cite *why* it believes something — this is what powers the learning goal
 * ("Julien said: wait until 1.5m of tide").
 */
export const Provenance = z.object({
  source: z.enum(['julien-whatsapp', 'web', 'observed', 'inferred']),
  quote: z.string().optional(),
  ref: z.string().optional(), // WhatsApp msg id or URL
  confidence: z.enum(['high', 'medium', 'low']),
  capturedAt: z.string(), // ISO date
});
export type Provenance = z.infer<typeof Provenance>;

/** Tide is the safety-critical input. minMeters is a hard gate (reef exposure). */
/**
 * Swell-dependent safe tide ceiling. Above the (swell-adjusted) ceiling the exit
 * is forced over the rocks under heavy shorebreak. The ceiling drops as swell
 * grows because the shorebreak gets heavier — reverse-engineered from Julien's
 * scheduled Klotok exits (2.30m exit fine at 2.2m swell) vs his refusal (~2.0m
 * "dangerous" at 2.5m swell).
 */
export const MaxTide = z.object({
  ceiling: z.number().describe('Safe ceiling (m) at or below refSwellM swell'),
  refSwellM: z.number().default(2.2),
  /** Ceiling drops this many metres per metre of swell above refSwellM. */
  swellSensitivity: z.number().default(0),
  floorCeiling: z.number().optional().describe('Ceiling never drops below this'),
  provenance: Provenance,
});
export type MaxTide = z.infer<typeof MaxTide>;

export const TideRule = z.object({
  minMeters: z.number().describe('Below this tide height the spot is unsafe (reef too exposed)'),
  /** Swell-dependent upper safety gate (rock exit under heavy shorebreak). */
  maxTide: MaxTide.optional(),
  optimalBand: z.tuple([z.number(), z.number()]).describe('[low, high] meters — sweet spot'),
  directionPref: z.enum(['rising', 'falling', 'any']),
  /** On big swell, prefer the high end of the band (more water = less hollow). */
  moreWaterWhenBig: z.boolean().default(true),
  provenance: Provenance,
});
export type TideRule = z.infer<typeof TideRule>;

/** Swell that actually lights the spot up, expressed as a directional window. */
export const SwellWindow = z.object({
  centerBearing: z.number().min(0).max(360).describe('Swell-FROM direction the spot likes'),
  halfWidthDeg: z.number().describe('Window = center ± this'),
  idealHeight: z.tuple([z.number(), z.number()]).describe('[low, high] deep-water swell metres'),
  idealPeriod: z.tuple([z.number(), z.number()]).describe('[low, high] seconds'),
  /** Reef size floor: below this swell only breaks far inside on dry/shallow reef (unsafe/unmakeable). */
  minHeightM: z.number().optional(),
  provenance: Provenance,
});
export type SwellWindow = z.infer<typeof SwellWindow>;

/** Offshore wind direction and how much wind the spot tolerates. */
export const WindRule = z.object({
  offshoreBearing: z.number().min(0).max(360).describe('Wind-FROM direction that is offshore here'),
  toleranceDeg: z.number().default(50),
  maxKnots: z.number().default(15),
  provenance: Provenance,
});
export type WindRule = z.infer<typeof WindRule>;

export const Hazard = z.object({
  kind: z.enum(['reef', 'rocks', 'rip', 'crowd', 'shallow-lowtide', 'big-swell-dangerous', 'urchins']),
  note: z.string(),
  provenance: Provenance,
});
export type Hazard = z.infer<typeof Hazard>;

export const SurfRules = z.object({
  spotSlug: z.string(),
  displayName: z.string(),
  section: z.string().optional(),
  region: z.literal('east-bali'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  /** Compass bearing the coastline faces out to sea (degrees). */
  facingBearing: z.number().min(0).max(360),
  breakType: BreakType,
  bottomType: z.enum(['reef', 'sand', 'reef-sand', 'deep-reef']),
  minSkill: SurfLevel,
  /** Optional per-spot deep-water swell sample point; defaults to the regional point. */
  swellSample: z.object({ lat: z.number(), lon: z.number() }).optional(),
  tide: TideRule,
  swell: SwellWindow,
  wind: WindRule,
  hazards: z.array(Hazard),
  /** Free-form notes shown in detailed output. */
  notes: z.array(z.string()).default([]),
  version: z.number().int(),
  updatedAt: z.string(),
});
export type SurfRules = z.infer<typeof SurfRules>;

export { TideState };
