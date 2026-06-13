import { z } from 'zod';
import { SurfLevel } from '@surflow/core';

export const BoardSpec = z.object({
  type: z.enum(['shortboard', 'hybrid', 'midlength', 'longboard', 'gun']),
  lengthCm: z.number().describe('Board length in cm (6’2” ≈ 188cm)'),
  volumeL: z.number().describe('Volume in litres'),
});
export type BoardSpec = z.infer<typeof BoardSpec>;

export const SurferProfile = z.object({
  name: z.string().optional(),
  level: SurfLevel,
  board: BoardSpec,
  /** Hard ceiling on swell height the surfer wants to take on (m). */
  maxComfortableHeightM: z.number().optional(),
  homeBaseLatLon: z.tuple([z.number(), z.number()]).optional(),
});
export type SurferProfile = z.infer<typeof SurferProfile>;

export const LEVEL_RANK: Record<string, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
  professional: 3,
};

/**
 * The user: advanced-intermediate, 6'2" ~35L hybrid. Modelled as `advanced`
 * (he surfs Keramas reef solo on a shortboard) with a comfort ceiling so the
 * engine still flags genuinely oversized days.
 */
export const DEFAULT_SURFER: SurferProfile = {
  name: 'Yahya',
  level: 'advanced',
  board: { type: 'hybrid', lengthCm: 188, volumeL: 35 },
  maxComfortableHeightM: 2.2,
};
